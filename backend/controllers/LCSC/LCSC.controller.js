const axios = require("axios");
const { sm2 } = require("sm-crypto");

const HOMEPAGE_URL = "https://www.lcsc.com/";
const SEARCH_URL = "https://wmsc.lcsc.com/ftps/wm/search/v3/global";
const PUBLIC_KEY_REGEX = /encryptPublicHexKey:"([0-9a-fA-F]+)"/;

let cachedPublicKey = null;
let cachedPublicKeyAt = 0;
const PUBLIC_KEY_TTL = 60 * 60 * 1000;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function getPublicKey() {
  if (cachedPublicKey && Date.now() - cachedPublicKeyAt < PUBLIC_KEY_TTL) {
    return cachedPublicKey;
  }
  const response = await axios.get(HOMEPAGE_URL, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 15000,
  });
  const match = response.data.match(PUBLIC_KEY_REGEX);
  if (!match) {
    throw new Error("Không lấy được public key LCSC.");
  }
  cachedPublicKey = match[1];
  cachedPublicKeyAt = Date.now();
  return cachedPublicKey;
}

async function searchLcsc(mpn) {
  const publicKey = await getPublicKey();
  const keyword = Buffer.from(mpn, "utf-8").toString("base64");
  const encryptedHex = sm2.doEncrypt(keyword, publicKey, 1);

  const response = await axios.post(
    SEARCH_URL,
    { keyword: `{secret}04${encryptedHex}` },
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        Referer: "https://www.lcsc.com/",
      },
      timeout: 20000,
    },
  );

  const result = response.data?.result;
  const exactMatch = Array.isArray(result?.exactMatchResult)
    ? result.exactMatchResult
    : [];

  // Ưu tiên sản phẩm khớp chính xác MPN (không phân biệt hoa thường)
  const lowerMpn = String(mpn).toLowerCase();
  let product = exactMatch.find(
    (p) => String(p.productModel || "").toLowerCase() === lowerMpn,
  );

  if (!product && exactMatch.length > 0) {
    product = exactMatch[0];
  }

  return product || null;
}

module.exports = () => ({
  // Tra cứu datasheet CP sản phẩm LCSC theo MPN (fallback khi DigiKey không có)
  async search(req, res) {
    try {
      const { mpn } = req.params;
      if (!mpn || !String(mpn).trim()) {
        return res.status(400).json({ error: "Thiếu MPN" });
      }

      const product = await searchLcsc(String(mpn).trim());
      if (!product) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm trên LCSC" });
      }

      res.json({
        productCode: product.productCode || "",
        productModel: product.productModel || "",
        manufacturer: product.brandNameEn || product.brandName || "",
        pdfUrl: product.pdfUrl || "",
        imageUrl: product.productImageUrl || product.productImage || "",
      });
    } catch (error) {
      console.error("Lỗi tìm kiếm LCSC:", error.message);
      res.status(500).json({ error: error.message || "Lỗi kết nối LCSC" });
    }
  },
});