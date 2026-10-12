const db = require("../database.js");
const jwt = require("jsonwebtoken");

// Cùng secret với nơi ký token (routes.js) để verify chữ ký + hạn dùng.
// Token bịa/sửa/mở khóa sai secret đều rớt tại đây.
const SECRET_KEY = process.env.JWT_SECRET || "default_secret_key";

function verifyToken(token) {
  try {
    jwt.verify(token, SECRET_KEY);
    return true;
  } catch {
    return false;
  }
}

const get = (sql, params) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null))),
  );

// Đọc caller từ header (axios interceptor frontend luôn gửi kèm)
function getCaller(req) {
  const username = String((req.headers && req.headers["x-username"]) || "").trim();
  const token = req.headers && req.headers["x-session-token"];
  return { username, token };
}

async function checkSession(username, token) {
  if (!username || !token) return false;
  // Lưu ý: X-Session-Token là opaque token (crypto 64-hex, single-session),
  // KHÔNG phải JWT nên không verify JWT ở đây. JWT login chỉ dùng phía client.
  const row = await get(`SELECT Token FROM Sessions WHERE Username = ?`, [username]);
  return !!(row && row.Token === token);
}

async function checkAdmin(username) {
  if (!username) return false;
  const user = await get(`SELECT Level FROM Users WHERE Username = ?`, [username]);
  return !!(user && user.Level === "Admin");
}

const unauthorized = (res) =>
  res.status(401).json({
    code: "SESSION_REPLACED",
    error: "Tài khoản đã đăng nhập ở máy khác.",
  });

const forbidden = (res) => res.status(403).json({ error: "Không có quyền thực hiện" });

// Bắt buộc đăng nhập (session hợp lệ), thiếu là 401 (không bypass)
function requireAuthStrict(req, res, next) {
  const { username, token } = getCaller(req);
  checkSession(username, token)
    .then((ok) => (ok ? next() : unauthorized(res)))
    .catch(() => unauthorized(res));
}

// Bắt buộc Admin đã xác thực session
function requireAdmin(req, res, next) {
  const { username, token } = getCaller(req);
  checkSession(username, token)
    .then(async (ok) => {
      if (!ok) return unauthorized(res);
      if (!(await checkAdmin(username))) return forbidden(res);
      req.authUser = username;
      next();
    })
    .catch(() => unauthorized(res));
}

module.exports = {
  getCaller,
  checkSession,
  checkAdmin,
  requireAuthStrict,
  requireAdmin,
};
