const crypto = require("crypto");
const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js");

const run = (sql, params) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    }),
  );

const get = (sql, params) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))),
  );

const all = (sql, params) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))),
  );

const generateLicenseKey = () => {
  const raw = crypto.randomBytes(8).toString("hex").toUpperCase();
  return raw.match(/.{4}/g).join("-");
};

const nowLocal = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd} ${hh}:${mi}`;
};

// ===== Kiểm tra quyền Admin (theo quy ước phân quyền hiện tại của app) =====
const isAdmin = async (username) => {
  const user = await get(`SELECT Level FROM Users WHERE Username = ?`, [
    username,
  ]);
  return !!(user && user.Level === "Admin");
};

module.exports = (io) => ({
  // ============================
  // Client xác nhận đã chuyển khoản -> tạo mã yêu cầu (chỉ dùng 1 lần)
  // ============================
  async request(req, res) {
    try {
      const { username, plan } = req.body;
      if (!username || !plan)
        return res.status(400).json({ error: "Thiếu thông tin đầu vào" });
      const validPlans = ["Standard", "Business", "Trial"];
      if (!validPlans.includes(plan))
        return res.status(400).json({ error: "Gói không hợp lệ" });

      // Kiểm tra phiên đăng nhập (1 tài khoản = 1 máy)
      const headerUser = String(
        (req.headers && req.headers["x-username"]) || "",
      ).trim();
      const token = req.headers && req.headers["x-session-token"];
      if (headerUser !== String(username).trim() || !token) {
        return res.status(401).json({
          code: "SESSION_REPLACED",
          error: "Tài khoản đã đăng nhập ở máy khác.",
        });
      }
      const session = await get(
        `SELECT Token FROM Sessions WHERE Username = ?`,
        [username],
      );
      if (!session || session.Token !== token) {
        return res.status(401).json({
          code: "SESSION_REPLACED",
          error: "Tài khoản đã đăng nhập ở máy khác.",
        });
      }

      let code;
      let dup = true;
      while (dup) {
        code =
          "REQ-" +
          crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase()
            .match(/.{4}/g)
            .join("-");
        const found = await get(
          `SELECT Code FROM LicenseRequests WHERE Code = ?`,
          [code],
        );
        dup = !!found;
      }

      let requestUses = 1;
      if (plan === "Plus" || plan === "Cơ bản") requestUses = 10;
      else if (plan === "Pro") requestUses = 50;
      else if (plan === "Chuyên nghiệp") requestUses = 30;
      else if (plan === "Enterprise" || plan === "Doanh nghiệp")
        requestUses = 100;

      const confirmAt = nowLocal();
      const today = formatDateLocal(new Date());
      await run(
        `INSERT INTO LicenseRequests (Code, Username, Plan, ConfirmAt, Uses, Status, Date)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        [code, username, plan, confirmAt, requestUses, today],
      );
      res.json({ code, username, plan, uses: requestUses, confirmAt });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ============================
  // Admin sinh license key từ mã xác nhận của khách
  // ============================
  async generateByCode(req, res) {
    try {
      const { username, code } = req.body;
      if (!username || !code)
        return res.status(400).json({ error: "Thiếu thông tin đầu vào" });
      if (!(await isAdmin(username)))
        return res.status(403).json({ error: "Không có quyền thực hiện" });

      const codeInput = String(code).trim().toUpperCase();
      const reqRow = await get(`SELECT * FROM LicenseRequests WHERE Code = ?`, [
        codeInput,
      ]);
      if (!reqRow)
        return res.status(404).json({ error: "Mã xác nhận không tồn tại" });
      if (reqRow.Status !== "active")
        return res.status(400).json({ error: "Mã xác nhận đã được sử dụng" });

      let key;
      let dupKey = true;
      while (dupKey) {
        key = generateLicenseKey();
        const found = await get(
          `SELECT id FROM LicenseKeys WHERE LicenseKey = ?`,
          [key],
        );
        dupKey = !!found;
      }

      const today = formatDateLocal(new Date());
      await run(
        `INSERT INTO LicenseKeys (LicenseKey, LicensePlan, Status, Uses, Note, SourceCode, CreatedBy, Date)
         VALUES (?, ?, 'unused', ?, ?, ?, ?, ?)`,
        [
          key,
          reqRow.Plan,
          reqRow.Uses,
          `Mã xác nhận: ${codeInput} - ${reqRow.Username}`,
          codeInput,
          username,
          today,
        ],
      );
      await run(`UPDATE LicenseRequests SET Status = 'used' WHERE Code = ?`, [
        codeInput,
      ]);

      io.emit("UpdateLicense");
      res.json({
        message: "Sinh mã thành công",
        keys: [key],
        request: {
          username: reqRow.Username,
          plan: reqRow.Plan,
          uses: reqRow.Uses,
          confirmAt: reqRow.ConfirmAt,
          date: reqRow.Date,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ============================
  // Người dùng kích hoạt key (cộng dồn lượt dùng)
  // ============================
  async activate(req, res) {
    try {
      const { username, licenseKey } = req.body;
      if (!username || !licenseKey)
        return res.status(400).json({ error: "Thiếu thông tin đầu vào" });

      const licenseKeyInput = String(licenseKey).trim().toUpperCase();
      const keyRow = await get(
        `SELECT * FROM LicenseKeys WHERE LicenseKey = ?`,
        [licenseKeyInput],
      );
      if (!keyRow)
        return res.status(404).json({ error: "Mã license không tồn tại" });
      if (keyRow.Status !== "unused")
        return res.status(400).json({ error: "Mã license đã được sử dụng" });

      const user = await get(
        `SELECT LicenseKey FROM Users WHERE Username = ?`,
        [username],
      );
      if (!user)
        return res.status(404).json({ error: "Tài khoản không tồn tại" });

      // Cộng dồn lượt dùng theo key
      const uses = keyRow.Uses || 1;
      await run(
        `UPDATE Users SET License = ?, LicenseKey = ?, LicenseUse = COALESCE(LicenseUse, 0) + ? WHERE Username = ?`,
        [keyRow.LicensePlan, licenseKeyInput, uses, username],
      );
      await run(
        `UPDATE LicenseKeys SET Status = 'used', UsedBy = ? WHERE LicenseKey = ?`,
        [username, licenseKeyInput],
      );

      io.emit("UpdateLicense");
      res.json({
        message: "Kích hoạt thành công",
        license: keyRow.LicensePlan,
        uses: uses,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ============================
  // Admin xem danh sách key
  // ============================
  async list(req, res) {
    try {
      const { username } = req.query;
      if (!username || !(await isAdmin(username)))
        return res.status(403).json({ error: "Không có quyền thực hiện" });

      const rows = await all(
        `SELECT k.LicenseKey, k.LicensePlan, k.Status, k.UsedBy, k.Uses,
                CASE WHEN k.Status = 'used' AND u.LicenseUse IS NOT NULL THEN u.LicenseUse
                     WHEN k.Status = 'used' THEN 0
                     ELSE k.Uses
                END AS RemainingUses,
                k.SourceCode, k.Note, k.CreatedBy, k.Date
         FROM LicenseKeys k
         LEFT JOIN Users u ON k.UsedBy = u.Username
         ORDER BY k.id DESC`,
        [],
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ============================
  // Lấy thông tin license hiện tại của user
  // ============================
  async getInfo(req, res) {
    try {
      const { username } = req.params;
      const headerUser = (req.headers && req.headers["x-username"]) || username;
      const token = req.headers && req.headers["x-session-token"];
      const session = token
        ? await get(`SELECT Token FROM Sessions WHERE Username = ?`, [
            headerUser,
          ])
        : null;
      if (!session || session.Token !== token) {
        return res.status(401).json({
          code: "SESSION_REPLACED",
          error: "Tài khoản đã đăng nhập ở máy khác.",
        });
      }
      const user = await get(
        `SELECT License, LicenseKey, LicenseUse, ProjectCount, UploadCount FROM Users WHERE Username = ?`,
        [username],
      );
      if (!user)
        return res.status(404).json({ error: "Tài khoản không tồn tại" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
});
