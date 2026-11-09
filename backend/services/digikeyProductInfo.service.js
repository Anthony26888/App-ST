const axios = require("axios");
const quota = require("./digikeyQuota.service.js");

const TOKEN_URL =
  process.env.DIGIKEY_TOKEN_URL || "https://api.digikey.com/v1/oauth2/token";
const SEARCH_URL = (mpn) =>
  `https://api.digikey.com/products/v4/search/${encodeURIComponent(
    mpn,
  )}/productdetails`;

let cachedToken = null;
let cachedTokenType = "Bearer";
let cachedTokenExpireAt = 0;

function clientId() {
  return String(process.env.DIGIKEY_CLIENT_ID || "").trim();
}

function clientSecret() {
  return String(process.env.DIGIKEY_CLIENT_SECRET || "").trim();
}

function accountId() {
  return String(process.env.DIGIKEY_ACCOUNT_ID || "").trim();
}

function toNumber(value, fallback = 0) {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const parsed = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMpn(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function text(value) {
  return String(value || "").trim();
}

function textPack(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    return text(value.Name ?? value.Description ?? value.Value ?? value.Id);
  }
  return text(value);
}

async function getToken() {
  const id = clientId();
  const secret = clientSecret();
  if (!id || !secret) {
    throw new Error(
      "Thiếu DIGIKEY_CLIENT_ID hoặc DIGIKEY_CLIENT_SECRET để gọi ProductInformation.",
    );
  }
  if (cachedToken && Date.now() < cachedTokenExpireAt) {
    return { token: cachedToken, tokenType: cachedTokenType };
  }

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");
  body.set("client_id", id);
  body.set("client_secret", secret);

  const response = await axios.post(TOKEN_URL, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    timeout: Number(process.env.DIGIKEY_HTTP_TIMEOUT_MS || 45000),
  });

  cachedToken = response.data?.access_token || "";
  cachedTokenType = response.data?.token_type || "Bearer";
  const expiresIn = Number(response.data?.expires_in) || 600;
  cachedTokenExpireAt = Date.now() + Math.max(60, expiresIn - 60) * 1000;
  if (!cachedToken) {
    throw new Error("DigiKey không trả access token cho ProductInformation.");
  }
  return { token: cachedToken, tokenType: cachedTokenType };
}

function firstVariation(product) {
  const variations = Array.isArray(product?.ProductVariations)
    ? product.ProductVariations
    : [];
  return variations[0] || {};
}

function selectPrice(product) {
  const variation = firstVariation(product);
  const pricing = Array.isArray(variation.StandardPricing)
    ? variation.StandardPricing
    : Array.isArray(product?.StandardPricing)
      ? product.StandardPricing
      : [];
  const breaks = pricing
    .map((item) => ({
      breakQuantity: toNumber(
        item.BreakQuantity ?? item.Quantity ?? item.MinQuantity,
      ),
      unitPrice: toNumber(item.UnitPrice ?? item.Price),
      totalPrice: toNumber(item.TotalPrice),
    }))
    .filter((item) => item.unitPrice > 0)
    .sort((a, b) => a.breakQuantity - b.breakQuantity);
  return { variation, breaks };
}

function normalizeProduct(data, requestedMpn, quantityRequested) {
  const product = data?.Product || data?.product || data || {};
  const { variation, breaks } = selectPrice(product);
  const quantity = Math.max(1, Math.ceil(toNumber(quantityRequested, 1)));
  const moq = toNumber(
    variation.MinimumOrderQuantity ??
      product.MinimumOrderQuantity ??
      product.StandardPackage,
  );
  const quantityPurchased = Math.max(quantity, moq);
  let selectedBreak = breaks[0] || null;
  for (const item of breaks) {
    if (item.breakQuantity <= quantityPurchased) selectedBreak = item;
  }
  const unitPrice = toNumber(
    selectedBreak?.unitPrice ??
      product.UnitPrice ??
      variation.UnitPrice,
  );

  const digikeyPn =
    text(variation.DigiKeyProductNumber) ||
    text(product.DigiKeyProductNumber) ||
    text(data?.DigiKeyPartNumber);
  const extendedPrice = unitPrice * (quantityPurchased || quantity);
  const manufacturer =
    text(product.Manufacturer?.Name) ||
    text(product.ManufacturerName) ||
    text(data?.Manufacturer?.Name);
  const description =
    text(product.Description?.ProductDescription) ||
    text(product.Description?.DetailedDescription) ||
    text(product.Description);
  const imageUrl =
    text(product.PhotoUrl) ||
    text(product.PrimaryPhotoUrl) ||
    text(product.ImageUrl) ||
    text(data?.PhotoUrl) ||
    text(variation.PhotoUrl) ||
    text(variation.ImageUrl);

  return {
    mpn:
      text(product.ManufacturerProductNumber) ||
      text(product.ManufacturerPartNumber) ||
      requestedMpn,
    requested_mpn: requestedMpn,
    original_mpn: requestedMpn,
    manufacturer,
    description,
    digikey_pn: digikeyPn,
    digikey_unique_id: digikeyPn,
    quantity_requested: quantity,
    quantity_purchased: quantityPurchased,
    moq,
    pack_type: textPack(
      variation.PackageType ??
        variation.PackType ??
        product.StandardPackage,
    ),
    selected_pack_type: textPack(variation.PackageType ?? variation.PackType),
    image_url: imageUrl,
    thumbnail_url: imageUrl,
    unit_price_usd: unitPrice,
    extended_price_usd: extendedPrice,
    availability: toNumber(
      variation.QuantityAvailable ?? product.QuantityAvailable,
      null,
    ),
    quantity_available: toNumber(
      variation.QuantityAvailable ?? product.QuantityAvailable,
      null,
    ),
    stock_status:
      text(product.ProductStatus?.Status) || text(product.ProductStatus),
    lead_time: text(variation.ManufacturerLeadWeeks ?? product.ManufacturerLeadWeeks)
      ? `${text(variation.ManufacturerLeadWeeks ?? product.ManufacturerLeadWeeks)} tuần`
      : "",
    lead_weeks: text(
      variation.ManufacturerLeadWeeks ?? product.ManufacturerLeadWeeks,
    ),
    part_status:
      text(product.ProductStatus?.Status) || text(product.ProductStatus),
    rohs_status:
      text(product.RohsStatus?.Status) || text(product.RohsStatus),
    country_of_origin: text(
      product.CountryOfOrigin ?? variation.CountryOfOrigin,
    ),
    us_tariff: text(
      product.TariffCode ?? product.Htsus ?? variation.TariffCode,
    ),
    selected_pack_option_index: 0,
  };
}

async function searchRaw(mpn) {
  const requestedMpn = text(mpn);
  if (!requestedMpn) throw new Error("Thiếu MPN để tra ProductInformation.");
  const { token, tokenType } = await getToken();
  const response = await quota.requestWithRetry(
    "productinfo",
    () =>
      axios.get(SEARCH_URL(requestedMpn), {
        headers: {
          Authorization: `${tokenType} ${token}`,
          "X-DIGIKEY-Client-Id": clientId(),
          ...(accountId() ? { "X-DIGIKEY-Account-Id": accountId() } : {}),
          "X-DIGIKEY-Locale-Site": "US",
          "X-DIGIKEY-Locale-Language": "en",
          "X-DIGIKEY-Locale-Currency": "USD",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: Number(process.env.DIGIKEY_HTTP_TIMEOUT_MS || 45000),
      }),
    { maxRetries: Number(process.env.DIGIKEY_MAX_RETRIES || 3) },
  );
  return response.data || {};
}

async function resolveProduct(mpn, quantity) {
  const data = await searchRaw(mpn);
  return normalizeProduct(data, text(mpn), quantity);
}

module.exports = {
  resolveProduct,
  searchRaw,
  normalizeProduct,
  normalizeMpn,
};
