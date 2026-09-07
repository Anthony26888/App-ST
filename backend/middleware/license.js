const fs = require("fs");
const crypto = require("crypto");
const db = require("../database.js");

function todayLocal() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const UPLOAD_LIMIT = { Starter: 6, Plus: 30, Pro: 150, Enterprise: Infinity };

function atUseLimit(user) {
  if (!user) return false;
  if (user.LicenseUse === null || user.LicenseUse === undefined) return false;
  return (user.LicenseUse || 0) <= 0;
}

function atUploadLimit(user) {
  if (!user) return false;
  const lim = UPLOAD_LIMIT[user.License] ?? 6;
  return Number.isFinite(lim) && (user.UploadCount || 0) >= lim;
}

function getUserLicense(username) {
  return new Promise((resolve, reject) => {
    if (!username) return resolve(null);
    db.get(
      "SELECT License, LicenseUse, ProjectCount, UploadCount FROM Users WHERE Username = ?",
      [username],
      (err, row) => (err ? reject(err) : resolve(row || null)),
    );
  });
}

function resolveRequestUsername(req) {
  const header = req.headers && req.headers["x-username"];
  if (header && String(header).trim()) return String(header).trim();
  if (req.body && req.body.created_by) return req.body.created_by;
  return null;
}

function incrementUploadCount(username) {
  if (!username) return Promise.resolve();
  return new Promise((resolve) => {
    db.run(
      "UPDATE Users SET UploadCount = COALESCE(UploadCount, 0) + 1 WHERE Username = ?",
      [username],
      () => resolve(),
    );
  });
}

function createSession(username) {
  return new Promise((resolve, reject) => {
    if (!username) return resolve(null);
    const token = crypto.randomBytes(32).toString("hex");
    db.run(
      "INSERT OR REPLACE INTO Sessions (Username, Token, CreatedAt) VALUES (?, ?, datetime('now', 'localtime'))",
      [username, token],
      (err) => (err ? reject(err) : resolve(token)),
    );
  });
}

function deleteSession(username) {
  if (!username) return Promise.resolve();
  return new Promise((resolve) => {
    db.run("DELETE FROM Sessions WHERE Username = ?", [username], () =>
      resolve(),
    );
  });
}

function requireSession() {
  return async (req, res, next) => {
    try {
      const username =
        req.headers && String(req.headers["x-username"] || "").trim();
      if (!username) return next();
      const token = req.headers && req.headers["x-session-token"];
      if (!token) {
        return res.status(401).json({
          code: "SESSION_REPLACED",
          error: "Tài khoản đã đăng nhập ở máy khác.",
        });
      }
      const row = await new Promise((resolve, reject) =>
        db.get(
          "SELECT Token FROM Sessions WHERE Username = ?",
          [username],
          (err, r) => (err ? reject(err) : resolve(r || null)),
        ),
      );
      if (!row || row.Token !== token) {
        return res.status(401).json({
          code: "SESSION_REPLACED",
          error: "Tài khoản đã đăng nhập ở máy khác.",
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

function cleanupUploads(req) {
  try {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (Array.isArray(req.files)) {
      req.files.forEach((f) => {
        if (f && f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }
  } catch (e) {
    console.error("Cleanup upload on license guard:", e.message);
  }
}

function requireActiveLicense() {
  return async (req, res, next) => {
    try {
      // 1. Single-session check (1 tài khoản = 1 máy) - theo header X-Username
      const sessionUser =
        req.headers && String(req.headers["x-username"] || "").trim();
      if (sessionUser) {
        const token = req.headers && req.headers["x-session-token"];
        if (!token) {
          cleanupUploads(req);
          return res.status(401).json({
            code: "SESSION_REPLACED",
            error: "Tài khoản đã đăng nhập ở máy khác.",
          });
        }
        const row = await new Promise((resolve, reject) =>
          db.get(
            "SELECT Token FROM Sessions WHERE Username = ?",
            [sessionUser],
            (err, r) => (err ? reject(err) : resolve(r || null)),
          ),
        );
        if (!row || row.Token !== token) {
          cleanupUploads(req);
          return res.status(401).json({
            code: "SESSION_REPLACED",
            error: "Tài khoản đã đăng nhập ở máy khác.",
          });
        }
      }

      // 2. License quota check
      const username = resolveRequestUsername(req);
      const user = username ? await getUserLicense(username) : null;
      if (atUseLimit(user)) {
        cleanupUploads(req);
        return res.status(403).json({
          error:
            "Bạn đã hết lượt tạo dự án của gói hiện tại. Vui lòng nâng cấp để tiếp tục.",
        });
      }
      if (atUploadLimit(user)) {
        cleanupUploads(req);
        return res.status(403).json({
          error:
            "Bạn đã đạt giới hạn lượt nhập liệu của gói hiện tại. Vui lòng nâng cấp để tiếp tục.",
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  requireActiveLicense,
  requireSession,
  createSession,
  deleteSession,
  todayLocal,
  getUserLicense,
  resolveRequestUsername,
  atUseLimit,
  atUploadLimit,
  incrementUploadCount,
  UPLOAD_LIMIT,
};