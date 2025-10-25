/**
 * ================================================================
 * ESP32 Gateway trên Raspberry Pi
 * Tác dụng: ESP32 → Raspberry Pi (HTTP) → TARGET_SERVER (HTTPS)
 * Forward toàn bộ route /api/* giữ nguyên tên router
 * + Ghi log dữ liệu vào SQLite
 * ================================================================
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

// ======================== CẤU HÌNH ===========================
const PORT = 8080; // Cổng nhận request từ ESP32
const TARGET_SERVER = "https://erpst.io.vn"; // 🟢 Server đích
// =============================================================

// ======================== SQLITE DB ==========================
const dbPath = path.join(__dirname, "gateway_log.db");
const db = new sqlite3.Database(dbPath);

// Tạo bảng log nếu chưa có
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

// ======================== FORWARD API ==========================
app.use("/api", async (req, res) => {
  const targetURL = `${TARGET_SERVER}${req.originalUrl}`;
  console.log(`🔁 Forwarding ${req.method} ${req.originalUrl} → ${targetURL}`);

  try {
    const headers = {
      "Content-Type": req.headers["content-type"] || "application/json",
    };

    const response = await axios({
      method: req.method,
      url: targetURL,
      headers,
      data: req.body,
      timeout: 10000,
    });

    // Ghi log vào SQLite
    saveLog(
      req.method,
      req.originalUrl,
      JSON.stringify(req.body || {}),
      response.status,
      JSON.stringify(response.data || {})
    );

    console.log(`✅ ${req.originalUrl} → ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    let code = 500;
    let body = { error: error.message };

    if (error.response) {
      code = error.response.status;
      body = error.response.data || { error: "Unknown response error" };
    }

    // Ghi log lỗi
    saveLog(req.method, req.originalUrl, JSON.stringify(req.body || {}), code, JSON.stringify(body));

    console.error(`❌ Forward error on ${req.originalUrl}:`, error.message);
    res.status(code).json(body);
  }
});

// ======================== XEM LOG =============================
app.get("/logs", (req, res) => {
  db.all("SELECT * FROM api_logs ORDER BY id DESC LIMIT 50", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ======================== KIỂM TRA SERVER =====================
app.get("/", (req, res) => {
  res.send("✅ ESP32 Gateway đang chạy và forwarding dữ liệu...");
});

// ======================== CHẠY SERVER =========================
app.listen(PORT, () => {
  console.log("🚀 ESP32 Gateway started");
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`➡️ Forwarding all /api/* → ${TARGET_SERVER}`);
});
