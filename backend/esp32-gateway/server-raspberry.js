/**
 * server.js — ESP32 Gateway chuẩn cho mạng khác nhau
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
const TARGET_SERVER = process.env.TARGET_SERVER || "https://erpst.io.vn"; // ERPST public

const ESP32_IP_LINE1 = process.env.ESP32_LINE1 || "http://192.168.1.205";
const ESP32_IP_LINE2 = process.env.ESP32_LINE2 || "http://192.168.1.206";

const PENDING_RETRY_INTERVAL_MS = parseInt(process.env.PENDING_RETRY_INTERVAL_MS || "60000", 10);
const POLL_INTERVAL_MS = 5000;

// ========== SQLITE DB ==========
const dbPath = path.join(__dirname, "gateway_log.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
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

// ========== Helper ==========
const lastConfig = {}; // ✅ Lưu config cuối cùng theo từng line

const saveLog = (method, route, payload, response_code, response_body) => {
  db.run(
    `INSERT INTO api_logs (method, route, payload, response_code, response_body)
     VALUES (?, ?, ?, ?, ?)`,
    [method, route, payload, response_code, response_body],
    err => err && console.error("❌ Log error:", err.message)
  );
};

const savePendingConfig = (project_id, plan_id, delay, line, last_error) => {
  db.run(
    `INSERT INTO pending_configs (project_id, plan_id, delay, line, attempts, last_error)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [project_id, plan_id, delay, line, 0, last_error],
    err => err && console.error("❌ Save pending error:", err.message)
  );
};

async function sendConfigToEsp(project_id, plan_id, delay, line) {
  const url = (line === 2 ? ESP32_IP_LINE2 : ESP32_IP_LINE1) + `/set-project-delay`;

  try {
    const resp = await axios.post(url, { project_id, plan_id, delay }, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000
    });
    return { ok: true, status: resp.status, data: resp.data };
  } catch (err) {
    return {
      ok: false,
      status: err.response?.status || 500,
      error: err.response?.data || err.message
    };
  }
}

// ========== API ghi config từ ERPST ==========
app.post("/api/send-config", async (req, res) => {
  const { project_id, plan_id, delay = 0, line = 1 } = req.body || {};
  if (!project_id || !plan_id) return res.status(400).json({ error: "project_id và plan_id là bắt buộc" });

  // ✅ Khi ERPST gọi trực tiếp vẫn xử lý ngay và không spam (nhờ lastConfig)
  const cfgPrev = lastConfig[line];
  if (cfgPrev &&
      cfgPrev.project_id === project_id &&
      cfgPrev.plan_id === plan_id &&
      cfgPrev.delay === delay) {
    return res.json({ status: "ignored_same_config" });
  }

  lastConfig[line] = { project_id, plan_id, delay };
  const result = await sendConfigToEsp(project_id, plan_id, delay, line);

  const payloadLog = JSON.stringify({ project_id, plan_id, delay, line });
  if (result.ok) {
    saveLog("POST", "/api/send-config", payloadLog, result.status, JSON.stringify(result.data));
    return res.json({ status: "ok", detail: result.data });
  } else {
    saveLog("POST", "/api/send-config", payloadLog, result.status, result.error);
    savePendingConfig(project_id, plan_id, delay, line, result.error);
    return res.status(502).json({ error: "ESP32 unreachable", detail: result.error });
  }
});

// ========== Forward các API khác ==========
app.use("/api", async (req, res) => {
  const targetURL = `${TARGET_SERVER}${req.originalUrl}`;
  try {
    const response = await axios({
      method: req.method,
      url: targetURL,
      data: req.body,
      timeout: 10000
    });
    saveLog(req.method, req.originalUrl, JSON.stringify(req.body || {}), response.status, JSON.stringify(response.data));
    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const body = err.response?.data || { error: err.message };
    saveLog(req.method, req.originalUrl, JSON.stringify(req.body || {}), status, JSON.stringify(body));
    res.status(status).json(body);
  }
});

// ========== Retry pending ==========
async function processPendingOnce() {
  db.all("SELECT * FROM pending_configs ORDER BY id ASC LIMIT 20", async (err, rows) => {
    if (err) return console.error("❌ Pending read error:", err.message);
    for (const row of rows) {
      const { id, project_id, plan_id, delay, line, attempts } = row;
      const result = await sendConfigToEsp(project_id, plan_id, delay, line);

      const payload = JSON.stringify({ project_id, plan_id, delay, line });

      if (result.ok) {
        db.run("DELETE FROM pending_configs WHERE id=?", [id]);
        saveLog("POST", `/pending-retry/${id}`, payload, result.status, JSON.stringify(result.data));
      } else {
        db.run("UPDATE pending_configs SET attempts=?, last_error=?, created_at=CURRENT_TIMESTAMP WHERE id=?", [
          attempts + 1, result.error, id
        ]);
        saveLog("POST", `/pending-retry/${id}`, payload, result.status, result.error);
      }
    }
  });
}
setInterval(processPendingOnce, PENDING_RETRY_INTERVAL_MS);

// ========== Poll ERPST ==========
async function pollConfigFromERP() {
  try {
    for (let line = 1; line <= 2; line++) {
      const resp = await axios.get(`${TARGET_SERVER}/api/get-config?line=${line}`, { timeout: 10000 });
      const cfg = resp.data;
      if (!cfg || !cfg.project_id || !cfg.plan_id) continue;

      // ✅ So sánh và chỉ gửi ESP32 nếu config thực sự thay đổi
      const prev = lastConfig[line];
      if (prev &&
          prev.project_id === cfg.project_id &&
          prev.plan_id === cfg.plan_id &&
          prev.delay === cfg.delay) continue;

      lastConfig[line] = cfg;
      const result = await sendConfigToEsp(cfg.project_id, cfg.plan_id, cfg.delay, line);

      if (result.ok) {
        await axios.post(`${TARGET_SERVER}/api/config-confirm`, {
          id: cfg.id
        }, { timeout: 10000 });
      } else {
        savePendingConfig(cfg.project_id, cfg.plan_id, cfg.delay, line, result.error);
      }
    }
  } catch (err) {
    console.error("❌ Poll ERP error:", err.message);
  }
}
setInterval(pollConfigFromERP, POLL_INTERVAL_MS);
pollConfigFromERP().catch(() => {});

// ========== START ==========
app.listen(PORT, () => {
  console.log(`🚀 ESP32 Gateway Ready on port ${PORT}`);
  console.log(`➡ Forward /api/* → ${TARGET_SERVER}`);
  console.log(`🔌 ESP32 Line1: ${ESP32_IP_LINE1}`);
  console.log(`🔌 ESP32 Line2: ${ESP32_IP_LINE2}`);
});
