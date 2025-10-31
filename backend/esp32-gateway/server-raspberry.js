/**
 * server.js — ESP32 Gateway hoàn chỉnh cho Raspberry Pi
 *
 * - Forward tất cả /api/* lên TARGET_SERVER (erpst.io.vn)
 * - Nhận lệnh cấu hình từ server chính: POST /api/send-config
 *   => Gửi xuống ESP32 phù hợp (LINE1/LINE2)
 * - Ghi log vào SQLite (gateway_log.db)
 * - Nếu gửi config xuống ESP32 thất bại: lưu vào pending_configs và retry tự động
 *
 * Cài đặt:
 *   npm init -y
 *   npm install express axios cors body-parser sqlite3
 *
 * Chạy:
 *   node server.js
 */

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));

// ========== CẤU HÌNH ==========
const PORT = process.env.PORT || 8080;
const TARGET_SERVER = process.env.TARGET_SERVER || "https://erpst.io.vn";

// ESP32 trong mạng LAN (thay bằng IP thực tế của bạn)
const ESP32_IP_LINE1 = process.env.ESP32_LINE1 || "http://192.168.100.205";
const ESP32_IP_LINE2 = process.env.ESP32_LINE2 || "http://192.168.100.206";

// Retry interval (ms) để gửi lại pending configs
const PENDING_RETRY_INTERVAL_MS = parseInt(process.env.PENDING_RETRY_INTERVAL_MS || "60000", 10);
// ==============================

// ========== SQLITE DB ==========
const dbPath = path.join(__dirname, "gateway_log.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // bảng log
  db.run(`
    CREATE TABLE IF NOT EXISTS api_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT,
      route TEXT,
      payload TEXT,
      response_code INTEGER,
      response_body TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // bảng lưu các config thất bại để retry
  db.run(`
    CREATE TABLE IF NOT EXISTS pending_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT,
      plan_id TEXT,
      delay INTEGER,
      line INTEGER,
      attempts INTEGER DEFAULT 0,
      last_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Hàm ghi log
function saveLog(method, route, payload, response_code, response_body) {
  db.run(
    `INSERT INTO api_logs (method, route, payload, response_code, response_body)
     VALUES (?, ?, ?, ?, ?)`,
    [method, route, payload, response_code, response_body],
    (err) => {
      if (err) console.error("❌ Lỗi ghi log:", err.message);
    }
  );
}

// Hàm lưu pending config khi gửi xuống ESP32 thất bại
function savePendingConfig(project_id, plan_id, delay, line, last_error) {
  db.run(
    `INSERT INTO pending_configs (project_id, plan_id, delay, line, attempts, last_error)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [project_id, plan_id, delay, line, 0, last_error],
    (err) => {
      if (err) console.error("❌ Lỗi lưu pending config:", err.message);
      else console.log("📝 Saved pending config to DB (will retry).");
    }
  );
}

// ---------------- Function gửi tới ESP32 ----------------
async function sendConfigToEsp(project_id, plan_id, delay, line) {
  const targetESP = line === 2 ? ESP32_IP_LINE2 : ESP32_IP_LINE1;
  const url = `${targetESP}/set-project-delay`;

  try {
    const resp = await axios.post(
      url,
      { project_id, delay, plan_id },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );
    return { ok: true, status: resp.status, data: resp.data };
  } catch (err) {
    const msg = err.response ? JSON.stringify(err.response.data) : err.message;
    return { ok: false, error: msg, status: err.response?.status || 500 };
  }
}

// ========== API: nhận lệnh cấu hình từ server chính ==========
/**
 * POST /api/send-config
 * Body: { project_id, plan_id, delay, line }
 * line: 1 hoặc 2 (mặc định 1)
 */
app.post("/api/send-config", async (req, res) => {
  const { project_id, plan_id, delay = 0, line = 1 } = req.body || {};

  if (!project_id || !plan_id) {
    return res.status(400).json({ error: "project_id và plan_id là bắt buộc" });
  }

  console.log(`📩 Received config request: project_id=${project_id}, plan_id=${plan_id}, delay=${delay}, line=${line}`);

  const payloadStr = JSON.stringify({ project_id, plan_id, delay, line });

  // Gửi xuống ESP32
  const result = await sendConfigToEsp(project_id, plan_id, delay, line);

  if (result.ok) {
    // Ghi log thành công
    saveLog("POST", "/api/send-config", payloadStr, result.status, JSON.stringify(result.data));
    console.log(`✅ Sent config to ESP32 LINE ${line}:`, result.data);
    return res.json({ status: "ok", detail: result.data });
  } else {
    // Ghi log lỗi & lưu pending để retry
    saveLog("POST", "/api/send-config", payloadStr, result.status, result.error);
    savePendingConfig(project_id, plan_id, delay, line, result.error);
    console.error(`❌ Failed to send to ESP32 LINE ${line}:`, result.error);
    return res.status(502).json({ error: "Failed to send to ESP32, saved to pending queue", detail: result.error });
  }
});

// ========== FORWARD tất cả /api/* (fallback) lên TARGET_SERVER ==========
/**
 * Lưu ý: /api/send-config đã được khai báo ở trên (sẽ match trước).
 * Bất kỳ route /api/* nào khác sẽ được forward nguyên vẹn lên TARGET_SERVER
 */
app.use("/api", async (req, res) => {
  // Nếu route chính là /api/send-config thì đã bị bắt ở trên — không vào đây.
  // Forward nguyên vẹn request lên TARGET_SERVER
  const targetURL = `${TARGET_SERVER}${req.originalUrl}`;
  console.log(`🔁 Forwarding ${req.method} ${req.originalUrl} → ${targetURL}`);

  try {
    // copy headers (chỉ giữ content-type)
    const headers = { "Content-Type": req.headers["content-type"] || "application/json" };

    const response = await axios({
      method: req.method,
      url: targetURL,
      headers,
      data: req.body,
      timeout: 10000,
    });

    saveLog(req.method, req.originalUrl, JSON.stringify(req.body || {}), response.status, JSON.stringify(response.data || {}));
    return res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const body = error.response?.data || { error: error.message };
    saveLog(req.method, req.originalUrl, JSON.stringify(req.body || {}), status, JSON.stringify(body));
    console.error(`❌ Forward error on ${req.originalUrl}:`, error.message);
    return res.status(status).json(body);
  }
});

// ========== Endpoint xem log + pending ==========
app.get("/logs", (req, res) => {
  db.all("SELECT * FROM api_logs ORDER BY id DESC LIMIT 50", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/pending", (req, res) => {
  db.all("SELECT * FROM pending_configs ORDER BY id ASC LIMIT 200", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/", (req, res) => {
  res.send("✅ ESP32 Gateway đang chạy và forwarding dữ liệu...");
});

// ========== Pending retry worker ==========
async function processPendingOnce() {
  db.all("SELECT * FROM pending_configs ORDER BY id ASC LIMIT 20", async (err, rows) => {
    if (err) {
      console.error("❌ Lỗi đọc pending:", err.message);
      return;
    }
    for (const row of rows) {
      const { id, project_id, plan_id, delay, line, attempts } = row;
      console.log(`🔄 Retrying pending id=${id} (attempts=${attempts}) -> LINE ${line}`);
      const result = await sendConfigToEsp(project_id, plan_id, delay, line);
      if (result.ok) {
        // xóa pending, log success
        db.run("DELETE FROM pending_configs WHERE id = ?", [id], (e) => {
          if (e) console.error("❌ Delete pending failed:", e.message);
          else console.log(`✅ Pending id=${id} sent successfully and removed.`);
        });
        saveLog("POST", `/pending-retry/${id}`, JSON.stringify({ project_id, plan_id, delay, line }), result.status, JSON.stringify(result.data));
      } else {
        // update attempts và last_error
        const newAttempts = attempts + 1;
        db.run("UPDATE pending_configs SET attempts = ?, last_error = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?", [newAttempts, result.error, id], (e) => {
          if (e) console.error("❌ Update pending failed:", e.message);
        });
        saveLog("POST", `/pending-retry/${id}`, JSON.stringify({ project_id, plan_id, delay, line }), result.status || 500, result.error);
        console.error(`❌ Retry id=${id} failed:`, result.error);
      }
    }
  });
}

// Bắt đầu interval xử lý pending
setInterval(processPendingOnce, PENDING_RETRY_INTERVAL_MS);
// Chạy ngay khi start
processPendingOnce().catch(() => {});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log("🚀 ESP32 Gateway started");
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`➡️ Forwarding all /api/* → ${TARGET_SERVER}`);
  console.log(`➡️ ESP32 LINE1: ${ESP32_IP_LINE1}, LINE2: ${ESP32_IP_LINE2}`);
});
