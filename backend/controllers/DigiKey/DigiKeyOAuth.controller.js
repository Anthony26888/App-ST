const { getCaller } = require("../../middleware/auth.js");
const oauth = require("../../services/digikeyOAuth.service.js");
const quota = require("../../services/digikeyQuota.service.js");

function redirectBase() {
  return String(process.env.APP_FRONTEND_URL || "https://erpst.io.vn").replace(
    /\/+$/,
    "",
  );
}

function redirectSettings(params) {
  const query = new URLSearchParams(params).toString();
  return `${redirectBase()}/Cai-dat/${query ? `?${query}` : ""}`;
}

module.exports = () => ({
  async start(req, res) {
    try {
      const username = getCaller(req).username;
      if (!username) {
        return res.status(401).json({ error: "Chưa đăng nhập" });
      }
      if (!oauth.isConfigured()) {
        return res.status(400).json({
          error:
            "Thiếu cấu hình DigiKey. Cần DIGIKEY_CLIENT_ID, DIGIKEY_CLIENT_SECRET và DIGIKEY_REDIRECT_URI.",
        });
      }
      const url = oauth.buildAuthorizeUrl(username);
      res.json({ url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async callback(req, res) {
    const { code, state, error, error_description: errorDescription } = req.query;
    try {
      if (error) {
        return res.redirect(
          redirectSettings({
            digikey: "error",
            message: String(errorDescription || error),
          }),
        );
      }
      if (!code) {
        return res.redirect(
          redirectSettings({
            digikey: "error",
            message: "DigiKey không trả authorization code.",
          }),
        );
      }
      const payload = oauth.consumeState(state);
      const username = String(payload.username || "").trim();
      if (!username) {
        throw new Error("State OAuth thiếu username.");
      }
      const config = oauth.getConfig();
      const tokenData = await oauth.exchangeCode(code, config.redirectUri);
      await oauth.saveTokens(username, tokenData);
      return res.redirect(redirectSettings({ digikey: "connected" }));
    } catch (err) {
      console.error("[DigiKey OAuth] Callback lỗi:", err.message);
      return res.redirect(
        redirectSettings({
          digikey: "error",
          message: err.message || "Kết nối DigiKey thất bại.",
        }),
      );
    }
  },

  async status(req, res) {
    try {
      const username = getCaller(req).username;
      if (!username) {
        return res.status(401).json({ error: "Chưa đăng nhập" });
      }
      const status = await oauth.getStatus(username);
      res.json({
        ...status,
        quota: quota.getSummary(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async disconnect(req, res) {
    try {
      const username = getCaller(req).username;
      if (!username) {
        return res.status(401).json({ error: "Chưa đăng nhập" });
      }
      await oauth.disconnect(username);
      res.json({ message: "Đã ngắt kết nối DigiKey", connected: false });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
});
