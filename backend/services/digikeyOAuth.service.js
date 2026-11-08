const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const db = require("../database.js");

const AUTH_SECRET = process.env.JWT_SECRET || "default_secret_key";
const AUTHORIZE_URL =
  process.env.DIGIKEY_AUTHORIZE_URL ||
  "https://api.digikey.com/v1/oauth2/authorize";
const TOKEN_URL =
  process.env.DIGIKEY_TOKEN_URL || "https://api.digikey.com/v1/oauth2/token";

const usedStates = new Map();
const refreshLocks = new Map();

const get = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null))),
  );

const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    }),
  );

function nowIso() {
  return new Date().toISOString();
}

function getConfig() {
  return {
    clientId: String(process.env.DIGIKEY_CLIENT_ID || "").trim(),
    clientSecret: String(process.env.DIGIKEY_CLIENT_SECRET || "").trim(),
    redirectUri: String(process.env.DIGIKEY_REDIRECT_URI || "").trim(),
    accountId: String(process.env.DIGIKEY_ACCOUNT_ID || "").trim(),
    frontendUrl: String(
      process.env.APP_FRONTEND_URL || "https://erpst.io.vn",
    ).replace(/\/+$/, ""),
    authorizeUrl: AUTHORIZE_URL,
    tokenUrl: TOKEN_URL,
  };
}

function isConfigured() {
  const config = getConfig();
  return !!(config.clientId && config.clientSecret && config.redirectUri);
}

function encryptionKey() {
  const secret = String(
    process.env.DIGIKEY_TOKEN_ENCRYPTION_KEY || "",
  ).trim();
  if (!secret) {
    throw new Error(
      "Thiếu DIGIKEY_TOKEN_ENCRYPTION_KEY trong backend/.env.secrets.",
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(value) {
  if (value == null || value === "") return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64")).join(".");
}

function decrypt(value) {
  if (!value) return "";
  const parts = String(value).split(".");
  if (parts.length !== 3) return "";
  const [ivRaw, tagRaw, encryptedRaw] = parts;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivRaw, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function cleanupStates() {
  const now = Date.now();
  for (const [jti, expiresAt] of usedStates.entries()) {
    if (expiresAt <= now) usedStates.delete(jti);
  }
}

function buildAuthorizeUrl(username) {
  const config = getConfig();
  if (!isConfigured()) {
    throw new Error(
      "DigiKey chưa cấu hình đủ Client ID, Client Secret và Redirect URI.",
    );
  }
  const jti = crypto.randomUUID();
  const state = jwt.sign(
    { username, jti, purpose: "digikey-oauth" },
    AUTH_SECRET,
    { expiresIn: "10m" },
  );
  cleanupStates();
  usedStates.set(jti, Date.now() + 10 * 60 * 1000);

  const params = new URLSearchParams();
  params.set("response_type", "code");
  params.set("client_id", config.clientId);
  params.set("redirect_uri", config.redirectUri);
  params.set("state", state);
  return `${config.authorizeUrl}?${params.toString()}`;
}

function consumeState(state) {
  if (!state) throw new Error("Thiếu state OAuth.");
  let payload;
  try {
    payload = jwt.verify(String(state), AUTH_SECRET);
  } catch {
    throw new Error("State OAuth không hợp lệ hoặc đã hết hạn.");
  }
  if (!payload || payload.purpose !== "digikey-oauth" || !payload.jti) {
    throw new Error("State OAuth không hợp lệ.");
  }
  cleanupStates();
  if (usedStates.has(payload.jti)) {
    throw new Error("State OAuth đã được sử dụng.");
  }
  usedStates.set(payload.jti, Date.now() + 10 * 60 * 1000);
  return payload;
}

async function postToken(params) {
  const config = getConfig();
  if (!isConfigured()) {
    throw new Error(
      "DigiKey chưa cấu hình đủ Client ID, Client Secret và Redirect URI.",
    );
  }
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") body.set(key, String(value));
  }
  body.set("client_id", config.clientId);
  body.set("client_secret", config.clientSecret);

  try {
    const response = await axios.post(config.tokenUrl, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      timeout: 30000,
    });
    return response.data || {};
  } catch (error) {
    const data = error.response?.data || {};
    const message =
      data.error_description ||
      data.error ||
      data.ErrorMessage ||
      error.message ||
      "Không đổi được token DigiKey.";
    const wrapped = new Error(message);
    wrapped.status = error.response?.status;
    wrapped.code = data.error;
    throw wrapped;
  }
}

async function saveTokens(username, tokenData, previous = null) {
  if (!username) throw new Error("Thiếu username để lưu token DigiKey.");
  const config = getConfig();
  const accessToken = tokenData.access_token;
  if (!accessToken) throw new Error("DigiKey không trả access token.");
  const refreshToken =
    tokenData.refresh_token ||
    (previous ? decrypt(previous.refresh_token_enc) : "");
  const expiresIn = Number(tokenData.expires_in) || 3600;
  const expiresAt = Date.now() + Math.max(60, expiresIn - 30) * 1000;
  const timestamp = nowIso();

  await run(
    `INSERT INTO DigiKeyOAuthTokens
      (username, access_token_enc, refresh_token_enc, token_type, scope,
       expires_at, account_id, needs_reconnect, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
     ON CONFLICT(username) DO UPDATE SET
       access_token_enc = excluded.access_token_enc,
       refresh_token_enc = excluded.refresh_token_enc,
       token_type = excluded.token_type,
       scope = excluded.scope,
       expires_at = excluded.expires_at,
       account_id = excluded.account_id,
       needs_reconnect = 0,
       updated_at = excluded.updated_at`,
    [
      username,
      encrypt(accessToken),
      encrypt(refreshToken),
      tokenData.token_type || "Bearer",
      tokenData.scope || "",
      expiresAt,
      config.accountId || (previous?.account_id || ""),
      timestamp,
      timestamp,
    ],
  );

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    token_type: tokenData.token_type || "Bearer",
    account_id: config.accountId || (previous?.account_id || ""),
  };
}

async function exchangeCode(code, redirectUri) {
  if (!code) throw new Error("Thiếu authorization code.");
  const data = await postToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri || getConfig().redirectUri,
  });
  return data;
}

async function getRow(username) {
  return get(`SELECT * FROM DigiKeyOAuthTokens WHERE username = ?`, [username]);
}

async function withRefreshLock(username, fn) {
  const key = String(username || "");
  const previous = refreshLocks.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current);
  refreshLocks.set(key, queued);
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (refreshLocks.get(key) === queued) refreshLocks.delete(key);
  }
}

async function refreshAccessToken(username, force = false) {
  return withRefreshLock(username, async () => {
    const row = await getRow(username);
    if (!row) {
      const error = new Error(
        "Chưa kết nối DigiKey. Vào Cài đặt để kết nối.",
      );
      error.code = "DIGIKEY_NOT_CONNECTED";
      throw error;
    }
    if (!force && Number(row.expires_at) > Date.now() + 60 * 1000) {
      return {
        access_token: decrypt(row.access_token_enc),
        expires_at: Number(row.expires_at),
        token_type: row.token_type || "Bearer",
        account_id: row.account_id || getConfig().accountId,
      };
    }

    const refreshToken = decrypt(row.refresh_token_enc);
    if (!refreshToken) {
      await run(
        `UPDATE DigiKeyOAuthTokens
         SET needs_reconnect = 1, updated_at = ? WHERE username = ?`,
        [nowIso(), username],
      );
      const error = new Error(
        "DigiKey cần kết nối lại. Vào Cài đặt để kết nối lại tài khoản.",
      );
      error.code = "DIGIKEY_NOT_CONNECTED";
      throw error;
    }

    try {
      const data = await postToken({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      });
      if (!data.refresh_token) data.refresh_token = refreshToken;
      return await saveTokens(username, data, row);
    } catch (error) {
      if (error.code === "invalid_grant" || error.status === 400) {
        await run(
          `UPDATE DigiKeyOAuthTokens
           SET needs_reconnect = 1, updated_at = ? WHERE username = ?`,
          [nowIso(), username],
        );
      }
      const wrapped = new Error(
        error.code === "invalid_grant"
          ? "DigiKey cần kết nối lại. Vào Cài đặt để kết nối lại tài khoản."
          : error.message,
      );
      wrapped.code = error.code || "DIGIKEY_REFRESH_FAILED";
      throw wrapped;
    }
  });
}

async function getValidAccessToken(username) {
  return refreshAccessToken(username, false);
}

async function getStatus(username) {
  const config = getConfig();
  const row = await getRow(username);
  return {
    configured: isConfigured(),
    account_id: config.accountId || row?.account_id || "",
    connected: !!(
      row &&
      row.access_token_enc &&
      row.refresh_token_enc &&
      Number(row.needs_reconnect) !== 1
    ),
    needs_reconnect: Number(row?.needs_reconnect) === 1,
    expires_at: row?.expires_at ? Number(row.expires_at) : null,
    updated_at: row?.updated_at || null,
    has_refresh_token: !!row?.refresh_token_enc,
  };
}

async function disconnect(username) {
  await run(`DELETE FROM DigiKeyOAuthTokens WHERE username = ?`, [username]);
  return { connected: false };
}

module.exports = {
  getConfig,
  isConfigured,
  buildAuthorizeUrl,
  consumeState,
  exchangeCode,
  saveTokens,
  refreshAccessToken,
  getValidAccessToken,
  getStatus,
  disconnect,
};
