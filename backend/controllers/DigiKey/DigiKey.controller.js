const axios = require("axios");

let cachedToken = null;
let cachedTokenType = "Bearer";
let cachedTokenExpireAt = 0;

const TOKEN_URL = "https://api.digikey.com/v1/oauth2/token";
const SEARCH_URL = (mpn) =>
  `https://api.digikey.com/products/v4/search/${encodeURIComponent(
    mpn,
  )}/productdetails`;

const getCredentials = () => ({
  clientId: process.env.DIGIKEY_CLIENT_ID,
  clientSecret: process.env.DIGIKEY_CLIENT_SECRET,
});

async function getDigikeyToken() {
  const { clientId, clientSecret } = getCredentials();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Thiếu DIGIKEY_CLIENT_ID hoặc DIGIKEY_CLIENT_SECRET trong env backend.",
    );
  }

  if (cachedToken && Date.now() < cachedTokenExpireAt) {
    return { token: cachedToken, tokenType: cachedTokenType };
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);

  try {
    const response = await axios.post(TOKEN_URL, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    cachedToken = response.data.access_token;
    cachedTokenType = response.data.token_type || "Bearer";
    const expiresIn = response.data.expires_in || 600;
    cachedTokenExpireAt = Date.now() + (expiresIn - 60) * 1000;

    return { token: cachedToken, tokenType: cachedTokenType };
  } catch (error) {
    const errorMsg =
      error.response?.data?.ErrorMessage ||
      error.response?.data?.error_description ||
      error.response?.data?.error ||
      error.message;
    console.error(
      "Lỗi lấy token DigiKey:",
      error.response ? error.response.data : error,
    );
    throw new Error(
      `Không thể kết nối đến DigiKey API (${errorMsg}). Vui lòng kiểm tra lại Client ID / Secret.`,
    );
  }
}

module.exports = () => ({
  // Lấy (và cache) access token OAuth2 của DigiKey
  async token(req, res) {
    try {
      const { token, tokenType } = await getDigikeyToken();
      res.json({ access_token: token, token_type: tokenType });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Tra cứu chi tiết sản phẩm DigiKey theo MPN
  async search(req, res) {
    try {
      const { mpn } = req.params;
      if (!mpn || !String(mpn).trim()) {
        return res.status(400).json({ error: "Thiếu MPN" });
      }
      const { clientId } = getCredentials();
      const { token, tokenType } = await getDigikeyToken();
      const response = await axios.get(SEARCH_URL(mpn), {
        headers: {
          Authorization: `${tokenType} ${token}`,
          "X-DIGIKEY-Client-Id": clientId,
          "Content-Type": "application/json",
        },
      });
      res.json(response.data);
    } catch (error) {
      if (error.response) {
        return res
          .status(error.response.status || 500)
          .json({ error: "Không tìm thấy sản phẩm trên DigiKey" });
      }
      res.status(500).json({ error: error.message });
    }
  },
});