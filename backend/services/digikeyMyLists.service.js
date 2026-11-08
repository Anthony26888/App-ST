const axios = require("axios");
const oauth = require("./digikeyOAuth.service.js");
const quota = require("./digikeyQuota.service.js");

const MYLISTS_BASE =
  process.env.DIGIKEY_MYLISTS_BASE || "https://api.digikey.com/mylists/v1";

function chunk(values, size) {
  const list = Array.isArray(values) ? values : [];
  const batchSize = Math.max(1, Number(size) || 100);
  const result = [];
  for (let index = 0; index < list.length; index += batchSize) {
    result.push(list.slice(index, index + batchSize));
  }
  return result;
}

function clientId() {
  return String(process.env.DIGIKEY_CLIENT_ID || "").trim();
}

function accountId() {
  return String(process.env.DIGIKEY_ACCOUNT_ID || "").trim();
}

function sendAccountId() {
  return String(process.env.DIGIKEY_MYLISTS_SEND_ACCOUNT_ID || "0") === "1";
}

function headers(token, includeAccount = sendAccountId()) {
  const result = {
    Authorization: `Bearer ${token}`,
    "X-DIGIKEY-Client-Id": clientId(),
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (includeAccount && accountId()) {
    result["X-DIGIKEY-Account-Id"] = accountId();
  }
  return result;
}

async function request(username, method, path, options = {}) {
  const run = async (token) => {
    try {
      const response = await quota.requestWithRetry(
        "mylists",
        () =>
          axios.request({
            method,
            baseURL: MYLISTS_BASE,
            url: path,
            params: options.params,
            data: options.data,
            headers: headers(token, options.includeAccount),
            timeout: Number(process.env.DIGIKEY_HTTP_TIMEOUT_MS || 45000),
          }),
        { maxRetries: Number(process.env.DIGIKEY_MAX_RETRIES || 3) },
      );
      return response;
    } catch (error) {
      console.error("[MyLists] API ERROR:", {
        method,
        path,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      throw error;
    }
  };

  let tokenData = await oauth.getValidAccessToken(username);
  try {
    return await run(tokenData.access_token);
  } catch (error) {
    if (error.response?.status !== 401) throw error;
    tokenData = await oauth.refreshAccessToken(username, true);
    return run(tokenData.access_token);
  }
}

async function createList(username, listName, tags = []) {
  const body = {
    ListName: String(listName || "").trim().slice(0, 120),
    Source: "b2b",
    Tags: Array.isArray(tags) ? tags.slice(0, 20) : [],
    ListSettings: {
      Visibility: "Private",
      PackagePreference: "CutTapeOrTR",
      AutoCorrectQuantities: true,
      AttritionEnabled: false,
      AutoPopulateCref: true,
      ColumnPreferences: [],
    },
  };

  console.log("[MyLists] CreateList REQUEST:", JSON.stringify(body, null, 2));

  const response = await request(username, "post", "/lists", { data: body });

  console.log("[MyLists] CreateList RESPONSE:", JSON.stringify(response.data, null, 2));

  const listId = String(response.data || "").trim();
  if (!listId) throw new Error("DigiKey không trả List ID khi tạo MyList.");
  return listId;
}

async function addParts(username, listId, parts, startIndex = 0) {
  console.log("[MyLists] AddParts REQUEST:", {
    listId,
    startIndex,
    partsCount: parts.length,
    firstPart: parts[0],
  });

  const response = await request(
    username,
    "post",
    `/lists/${encodeURIComponent(listId)}/parts`,
    {
      params: { index: Math.max(0, Number(startIndex) || 0) },
      data: parts,
    },
  );

  console.log("[MyLists] AddParts RESPONSE:", JSON.stringify(response.data, null, 2));

  return Array.isArray(response.data) ? response.data : [];
}

async function getParts(username, listId, startIndex = 0, limit = 100) {
  const response = await request(
    username,
    "get",
    `/lists/${encodeURIComponent(listId)}/parts`,
    {
      params: {
        countryIso: process.env.DIGIKEY_COUNTRY_ISO || "US",
        currencyIso: process.env.DIGIKEY_CURRENCY_ISO || "USD",
        languageIso: process.env.DIGIKEY_LANGUAGE_ISO || "en",
        startIndex: Math.max(0, Number(startIndex) || 0),
        limit: Math.max(1, Math.min(100, Number(limit) || 100)),
        assemblies: 1,
        includeAttrition: false,
      },
    },
  );
  return response.data || {};
}

async function deleteList(username, listId) {
  if (!listId) return false;
  try {
    await request(
      username,
      "delete",
      `/lists/${encodeURIComponent(listId)}`,
      { includeAccount: true },
    );
    return true;
  } catch (error) {
    if (error.response?.status === 404) return false;
    throw error;
  }
}

function buildRequestedParts(bomLines, quoteNo, boardQty) {
  return (bomLines || []).map((line) => {
    const quantity = Math.max(1, Math.ceil(Number(line.quantity) || 0));
    return {
      RequestedPartNumber: line.mpn || line.raw_mpn || "",
      OriginalPartNumber: line.raw_mpn || line.mpn || "",
      ManufacturerName: "",
      CustomerReference: String(quoteNo || "").slice(0, 80),
      ReferenceDesignator: String(line.reference_designator || "").slice(
        0,
        1000,
      ),
      Quantities: [{ Quantity: quantity }],
    };
  });
}

function listNameForQuote(quote) {
  const quoteNo = String(quote?.quote_no || quote?.id || "BG").replace(
    /[^\w-]/g,
    "_",
  );
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join("");
  return `ERP-ST ${quoteNo} ${stamp}`;
}

async function fetchListPricing(username, quote, bom) {
  const requestedParts = buildRequestedParts(bom.lines, quote.quote_no, bom.board_qty);
  if (!requestedParts.length) {
    throw new Error("BOM không có linh kiện hợp lệ để lấy giá DigiKey.");
  }

  const listName = listNameForQuote(quote);
  let listId = "";
  let calls = 0;
  try {
    listId = await createList(username, listName, [
      "ERP-ST",
      String(quote.quote_no || quote.id || ""),
    ]);
    calls += 1;

    const batchSize = Math.max(
      1,
      Math.min(200, Number(process.env.DIGIKEY_MYLISTS_BATCH_SIZE || 100)),
    );
    let index = 0;
    for (const batch of chunk(requestedParts, batchSize)) {
      const ids = await addParts(username, listId, batch, index);
      calls += 1;
      index += batch.length;
      if (ids.length && ids.length < batch.length) {
        console.warn(
          `[DigiKey MyLists] AddParts trả ${ids.length}/${batch.length} ID.`,
        );
      }
    }

    const pageSize = Math.max(
      1,
      Math.min(100, Number(process.env.DIGIKEY_MYLISTS_PAGE_SIZE || 100)),
    );
    const apiParts = [];
    let startIndex = 0;
    let totalParts = null;
    for (let page = 0; page < 100; page += 1) {
      const data = await getParts(username, listId, startIndex, pageSize);
      calls += 1;
      const pageParts = Array.isArray(data.PartsList) ? data.PartsList : [];
      apiParts.push(...pageParts);
      const total = Number(data.TotalParts);
      if (Number.isFinite(total)) totalParts = total;
      if (!pageParts.length) break;
      startIndex += pageParts.length;
      if (
        (Number.isFinite(totalParts) && startIndex >= totalParts) ||
        pageParts.length < pageSize
      ) {
        break;
      }
    }

    return {
      listId,
      listName,
      apiParts,
      calls,
      total_parts: Number.isFinite(totalParts) ? totalParts : apiParts.length,
    };
  } catch (error) {
    if (listId) {
      try {
        await deleteList(username, listId);
      } catch (cleanupError) {
        console.error(
          "[DigiKey MyLists] Không xoá được list lỗi:",
          cleanupError.message,
        );
      }
    }
    throw error;
  }
}

module.exports = {
  createList,
  addParts,
  getParts,
  deleteList,
  fetchListPricing,
  listNameForQuote,
};
