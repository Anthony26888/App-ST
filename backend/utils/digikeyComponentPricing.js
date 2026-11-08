const crypto = require("crypto");
const XLSX = require("xlsx");

function normalizeMpn(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function toNumber(value, fallback = 0) {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const raw = String(value)
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseMoney(value) {
  return toNumber(value, 0);
}

function parseInteger(value) {
  const n = toNumber(value, NaN);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function uniqueText(values) {
  const seen = new Set();
  const result = [];
  for (const value of values || []) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = text.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function joinDesignators(values) {
  return uniqueText(
    String(values || "")
      .split(/[,;]+/)
      .map((value) => value.trim())
      .filter(Boolean),
  ).join(", ");
}

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function buildBomLines(items, boardQty) {
  const board = Math.max(1, Math.round(toNumber(boardQty, 1)));
  const grouped = new Map();
  const noMpn = [];

  for (const item of items || []) {
    if (Number(item.dnp) === 1) continue;
    const rawMpn = String(item.mpn || item.raw_mpn || "").trim();
    const mpn = normalizeMpn(rawMpn);
    const qtyPerBoard = toNumber(item.quantity_per_board);
    const quantity = qtyPerBoard * board;
    const base = {
      line_no: Number(item.line_no) || null,
      raw_mpn: rawMpn,
      mpn: rawMpn,
      normalized_mpn: mpn,
      description: item.description || "",
      reference_designator: item.designator || "",
      quantity_per_board: qtyPerBoard,
      quantity,
      warnings: [],
    };

    if (!mpn) {
      noMpn.push(base);
      continue;
    }

    if (!grouped.has(mpn)) {
      grouped.set(mpn, {
        ...base,
        line_nos: base.line_no ? [base.line_no] : [],
        designators: base.reference_designator
          ? [base.reference_designator]
          : [],
      });
      continue;
    }

    const line = grouped.get(mpn);
    line.quantity += quantity;
    if (base.line_no) line.line_nos.push(base.line_no);
    if (base.reference_designator) line.designators.push(base.reference_designator);
    if (!line.description && base.description) line.description = base.description;
  }

  const lines = Array.from(grouped.values()).map((line) => ({
    ...line,
    designators: uniqueText(line.designators),
    reference_designator: joinDesignators(line.designators.join(",")),
    matched_line_nos: uniqueText(line.line_nos.map(String)).map(Number),
  }));

  return { lines, noMpn, board_qty: board };
}

function extractPriceFromListPart(part) {
  const quantities = Array.isArray(part?.Quantities) ? part.Quantities : [];
  let quantityIndex = Number(part?.SelectedQuantityIndex);
  if (
    !Number.isInteger(quantityIndex) ||
    quantityIndex < 0 ||
    quantityIndex >= quantities.length
  ) {
    quantityIndex = 0;
  }
  const quantity = quantities[quantityIndex] || quantities[0] || {};
  const options = Array.isArray(quantity.PackOptions)
    ? quantity.PackOptions
    : [];
  let optionIndex = Number(quantity.SelectedPackOptionIndex);
  if (
    !Number.isInteger(optionIndex) ||
    optionIndex < 0 ||
    optionIndex >= options.length
  ) {
    optionIndex = 0;
  }
  const option = options[optionIndex] || options[0] || {};

  const quantityRequested = toNumber(
    quantity.QuantityRequested ?? part?.MinOrderQty,
  );
  const quantityPurchased = toNumber(
    quantity.CalculatedQuantity ?? option.Quantity,
    quantityRequested,
  );
  const unitPrice = toNumber(
    option.CalculatedUnitPrice ?? option.BreakPrice ?? option.UnitPrice,
  );
  const extendedPrice = toNumber(
    option.ExtendedPrice,
    unitPrice * (quantityPurchased || quantityRequested),
  );
  const moq = toNumber(
    option.MinimumOrderQuantity ?? part?.MinOrderQty,
  );
  const partStatus = String(part?.PartStatus || "").trim();
  const warnings = [];

  let matchStatus = "MATCHED";
  if (!extendedPrice && !unitPrice) {
    matchStatus = "NO_PRICE";
    warnings.push("Không có giá");
  } else if (moq > 0 && quantityRequested > 0 && quantityRequested < moq) {
    matchStatus = "MOQ_APPLIED";
    warnings.push(`Áp dụng MOQ ${moq}`);
  }
  if (/obsolete/i.test(partStatus)) {
    warnings.push("Linh kiện Obsolete");
  }
  if (/non[- ]?stock/i.test(partStatus)) {
    warnings.push("Linh kiện Non-Stock");
  }

  return {
    quantity_requested: quantityRequested,
    quantity_purchased: quantityPurchased,
    moq,
    pack_type: String(quantity.SelectedPackType || option.PackType || "").trim(),
    selected_pack_type: String(quantity.SelectedPackType || "").trim(),
    unit_price_usd: unitPrice,
    extended_price_usd: extendedPrice,
    availability: parseInteger(part?.Availability),
    quantity_available: parseInteger(part?.QuantityAvailable),
    stock_status: partStatus,
    lead_time: part?.VendorLeadWeeks
      ? `${part.VendorLeadWeeks} tuần`
      : "",
    lead_weeks:
      part?.VendorLeadWeeks != null ? String(part.VendorLeadWeeks) : "",
    part_status: partStatus,
    rohs_status: String(part?.RohsStatusMessage || "").trim(),
    country_of_origin: String(part?.CountryOfOrigin || "").trim(),
    us_tariff:
      part?.TariffCode != null
        ? String(part.TariffCode)
        : String(part?.Htsus || "").trim(),
    selected_pack_option_index: optionIndex,
    match_status: matchStatus,
    warnings,
  };
}

function buildLookup(lines) {
  const lookup = new Map();
  for (const line of lines || []) {
    const keys = [line.normalized_mpn, normalizeMpn(line.raw_mpn)];
    for (const key of keys) {
      if (key && !lookup.has(key)) lookup.set(key, line);
    }
  }
  return lookup;
}

function findBomLine(lookup, ...values) {
  for (const value of values) {
    const key = normalizeMpn(value);
    if (key && lookup.has(key)) return lookup.get(key);
  }
  return null;
}

function baseRowFromBomLine(line) {
  return {
    line_no: line.line_no,
    source_index: null,
    mpn: line.mpn,
    requested_mpn: line.mpn,
    original_mpn: line.raw_mpn,
    manufacturer: "",
    description: line.description,
    digikey_pn: "",
    digikey_unique_id: "",
    quantity_requested: line.quantity,
    quantity_purchased: line.quantity,
    moq: 0,
    pack_type: "",
    selected_pack_type: "",
    unit_price_usd: 0,
    extended_price_usd: 0,
    availability: null,
    quantity_available: null,
    stock_status: "",
    lead_time: "",
    lead_weeks: "",
    part_status: "",
    rohs_status: "",
    country_of_origin: "",
    us_tariff: "",
    unit_of_measure: "",
    customer_reference: "",
    reference_designator: line.reference_designator,
    product_notes: "",
    match_status: "NO_MATCH",
    matched_line_nos: line.matched_line_nos || [],
    warnings: [],
  };
}

function buildAutoRows(apiParts, bom, existingMappings = new Map()) {
  const lookup = buildLookup(bom.lines);
  const rows = [];
  const matchedKeys = new Set();

  for (let index = 0; index < (apiParts || []).length; index += 1) {
    const part = apiParts[index];
    const manufacturerMpn = String(part?.ManufacturerPartNumber || "").trim();
    const requestedMpn = String(part?.RequestedPartNumber || "").trim();
    const originalMpn = String(part?.OriginalPartNumber || "").trim();
    const digikeyPn = String(part?.DigiKeyPartNumber || "").trim();
    const line = findBomLine(
      lookup,
      manufacturerMpn,
      requestedMpn,
      originalMpn,
      digikeyPn,
    );
    const price = extractPriceFromListPart(part);
    const row = {
      line_no: line?.line_no || null,
      source_index: index,
      mpn: manufacturerMpn || requestedMpn || originalMpn || digikeyPn,
      requested_mpn: requestedMpn || line?.mpn || "",
      original_mpn: originalMpn || line?.raw_mpn || "",
      manufacturer: String(
        part?.Manufacturer || part?.RequestedManufacturerName || "",
      ).trim(),
      description: String(part?.Description || line?.description || "").trim(),
      digikey_pn: digikeyPn,
      digikey_unique_id: String(part?.UniqueId || "").trim(),
      ...price,
      unit_of_measure: "",
      customer_reference: String(part?.CustomerReference || "").trim(),
      reference_designator:
        String(part?.ReferenceDesignator || "").trim() ||
        line?.reference_designator ||
        "",
      product_notes: String(part?.Notes || "").trim(),
      matched_line_nos: line?.matched_line_nos || [],
      warnings: [...price.warnings],
    };

    if (!line) {
      row.match_status = row.match_status === "NO_PRICE" ? "NO_PRICE" : "UNMATCHED";
      row.warnings.push("Không khớp dòng BOM");
    } else {
      for (const key of [
        line.normalized_mpn,
        normalizeMpn(line.raw_mpn),
        normalizeMpn(part?.RequestedPartNumber),
        normalizeMpn(part?.OriginalPartNumber),
      ]) {
        if (key) matchedKeys.add(key);
      }
      const cached = existingMappings.get(line.normalized_mpn);
      if (cached && !row.digikey_pn) row.digikey_pn = cached.digikey_pn || "";
    }

    rows.push(row);
  }

  for (const line of bom.lines) {
    if (matchedKeys.has(line.normalized_mpn)) continue;
    const row = baseRowFromBomLine(line);
    row.warnings.push("Không có trong MyList DigiKey");
    rows.push(row);
  }

  for (const line of bom.noMpn) {
    const row = baseRowFromBomLine({
      ...line,
      line_no: line.line_no,
      matched_line_nos: line.line_no ? [line.line_no] : [],
    });
    row.match_status = "NO_MPN";
    row.mpn = "";
    row.requested_mpn = "";
    row.original_mpn = "";
    row.warnings.push("Thiếu MPN");
    rows.push(row);
  }

  const duplicates = new Map();
  for (const row of rows) {
    const key = normalizeMpn(row.mpn || row.requested_mpn || row.original_mpn);
    if (!key) continue;
    duplicates.set(key, (duplicates.get(key) || 0) + 1);
  }
  for (const row of rows) {
    const key = normalizeMpn(row.mpn || row.requested_mpn || row.original_mpn);
    if (key && duplicates.get(key) > 1) {
      row.warnings.push("MPN trùng trong kết quả");
    }
  }

  return rows.sort((a, b) => {
    const aLine = Number(a.line_no) || Number.MAX_SAFE_INTEGER;
    const bLine = Number(b.line_no) || Number.MAX_SAFE_INTEGER;
    if (aLine !== bLine) return aLine - bLine;
    return String(a.mpn || "").localeCompare(String(b.mpn || ""));
  });
}

const HEADER_ALIASES = [
  ["DIGIKEYPARTNUMBER", "digikey_pn"],
  ["MANUFACTURERPARTNUMBER", "mpn"],
  ["REQUESTEDPARTNUMBER", "requested_mpn"],
  ["ORIGINALPARTNUMBER", "original_mpn"],
  ["MANUFACTURERNAME", "manufacturer"],
  ["MANUFACTURER", "manufacturer"],
  ["EXTENDEDPRICE", "extended_price_usd"],
  ["UNITPRICE", "unit_price_usd"],
  ["MINIMUMORDERQUANTITY", "moq"],
  ["MOQ", "moq"],
  ["PACKQUANTITY", "quantity_purchased"],
  ["REQUESTEDQUANTITY", "quantity_requested"],
  ["PACKTYPE", "pack_type"],
  ["STOCKSTATUS", "stock_status"],
  ["AVAILABILITY", "availability"],
  ["LEADWEEKS", "lead_weeks"],
  ["PARTSTATUS", "part_status"],
  ["ROHSSTATUS", "rohs_status"],
  ["COUNTRYOFORIGIN", "country_of_origin"],
  ["USTARIFF", "us_tariff"],
  ["TARIFF", "us_tariff"],
  ["UNITOFMEASURE", "unit_of_measure"],
  ["REFERENCEDESIGNATOR", "reference_designator"],
  ["DESCRIPTION", "description"],
  ["PRODUCTNOTES", "product_notes"],
  ["NOTES", "product_notes"],
];

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function canonicalHeader(value) {
  const header = normalizeHeader(value);
  if (!header) return "";
  for (const [alias, key] of HEADER_ALIASES) {
    if (header === alias || header.includes(alias)) return key;
  }
  return "";
}

function findHeaderRow(rows) {
  let best = { index: -1, score: 0, columns: {} };
  const limit = Math.min(rows.length, 30);
  for (let index = 0; index < limit; index += 1) {
    const columns = {};
    let score = 0;
    for (let col = 0; col < (rows[index] || []).length; col += 1) {
      const key = canonicalHeader(rows[index][col]);
      if (!key || columns[key] != null) continue;
      columns[key] = col;
      score += 1;
    }
    if (score > best.score) best = { index, score, columns };
  }
  return best;
}

function rowLooksEmpty(row) {
  return !(row || []).some((cell) => String(cell ?? "").trim() !== "");
}

function validateMpn(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (/^(N\/?A|NA|NONE|NULL|-|—)$/i.test(text)) return false;
  return true;
}

function buildManualRows(buffer, quoteItems, boardQty) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  if (!workbook.SheetNames.length) {
    throw new Error("File Excel không có sheet dữ liệu.");
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });
  const header = findHeaderRow(rows);
  if (header.index < 0 || header.score < 2 || header.columns.mpn == null) {
    throw new Error(
      "Không tìm thấy dòng tiêu đề MyLists. File cần có cột Manufacturer Part Number.",
    );
  }

  const valueAt = (row, key) =>
    header.columns[key] == null ? "" : row[header.columns[key]];

  const parsed = [];
  for (let index = header.index + 1; index < rows.length; index += 1) {
    const row = rows[index] || [];
    if (rowLooksEmpty(row)) continue;
    const mpnRaw = String(valueAt(row, "mpn") || "").trim();
    const requestedRaw = String(valueAt(row, "requested_mpn") || "").trim();
    const originalRaw = String(valueAt(row, "original_mpn") || "").trim();
    const digikeyRaw = String(valueAt(row, "digikey_pn") || "").trim();
    if (
      !mpnRaw &&
      !requestedRaw &&
      !originalRaw &&
      !digikeyRaw &&
      !String(valueAt(row, "description") || "").trim()
    ) {
      continue;
    }

    const unitPrice = parseMoney(valueAt(row, "unit_price_usd"));
    const qtyRequested = toNumber(valueAt(row, "quantity_requested"));
    const qtyPurchased = toNumber(
      valueAt(row, "quantity_purchased"),
      qtyRequested,
    );
    let extendedPrice = parseMoney(valueAt(row, "extended_price_usd"));
    if (!extendedPrice && unitPrice) {
      extendedPrice = unitPrice * (qtyPurchased || qtyRequested);
    }

    const warnings = [];
    let matchStatus = "MATCHED";
    if (!validateMpn(mpnRaw || requestedRaw || originalRaw || digikeyRaw)) {
      matchStatus = "NO_MPN";
      warnings.push("Thiếu MPN");
    } else if (!extendedPrice) {
      matchStatus = "NO_PRICE";
      warnings.push("Không có giá");
    }

    parsed.push({
      line_no: index + 1,
      source_index: index - header.index - 1,
      mpn: mpnRaw || requestedRaw || originalRaw || digikeyRaw,
      requested_mpn: requestedRaw,
      original_mpn: originalRaw,
      manufacturer: String(valueAt(row, "manufacturer") || "").trim(),
      description: String(valueAt(row, "description") || "").trim(),
      digikey_pn: digikeyRaw,
      digikey_unique_id: "",
      quantity_requested: qtyRequested,
      quantity_purchased: qtyPurchased,
      moq: toNumber(valueAt(row, "moq")),
      pack_type: String(valueAt(row, "pack_type") || "").trim(),
      selected_pack_type: String(valueAt(row, "pack_type") || "").trim(),
      unit_price_usd: unitPrice,
      extended_price_usd: extendedPrice,
      availability: parseInteger(valueAt(row, "availability")),
      quantity_available: null,
      stock_status: String(valueAt(row, "stock_status") || "").trim(),
      lead_time: String(valueAt(row, "lead_weeks") || "").trim()
        ? `${String(valueAt(row, "lead_weeks")).trim()} tuần`
        : "",
      lead_weeks: String(valueAt(row, "lead_weeks") || "").trim(),
      part_status: String(valueAt(row, "part_status") || "").trim(),
      rohs_status: String(valueAt(row, "rohs_status") || "").trim(),
      country_of_origin: String(valueAt(row, "country_of_origin") || "").trim(),
      us_tariff: String(valueAt(row, "us_tariff") || "").trim(),
      unit_of_measure: String(valueAt(row, "unit_of_measure") || "").trim(),
      customer_reference: "",
      reference_designator: String(
        valueAt(row, "reference_designator") || "",
      ).trim(),
      product_notes: String(valueAt(row, "product_notes") || "").trim(),
      match_status: matchStatus,
      matched_line_nos: [],
      warnings,
    });
  }

  if (!parsed.length) {
    throw new Error("Không có dòng dữ liệu linh kiện trong file.");
  }

  const duplicateCounts = new Map();
  for (const row of parsed) {
    const key = normalizeMpn(row.mpn || row.requested_mpn || row.original_mpn);
    if (!key) continue;
    duplicateCounts.set(key, (duplicateCounts.get(key) || 0) + 1);
  }
  for (const row of parsed) {
    const key = normalizeMpn(row.mpn || row.requested_mpn || row.original_mpn);
    if (key && duplicateCounts.get(key) > 1) {
      row.warnings.push("MPN trùng trong file");
      if (row.match_status === "MATCHED") row.match_status = "DUPLICATE";
    }
  }

  const bom = buildBomLines(quoteItems, boardQty);
  const lookup = buildLookup(bom.lines);
  const matchedKeys = new Set();

  for (const row of parsed) {
    const line = findBomLine(
      lookup,
      row.mpn,
      row.requested_mpn,
      row.original_mpn,
      row.digikey_pn,
    );
    if (line) {
      row.matched_line_nos = line.matched_line_nos || [];
      if (row.match_status === "MATCHED") {
        row.match_status = "MATCHED";
      }
      for (const key of [
        line.normalized_mpn,
        normalizeMpn(line.raw_mpn),
        normalizeMpn(row.requested_mpn),
        normalizeMpn(row.original_mpn),
      ]) {
        if (key) matchedKeys.add(key);
      }
    } else if (row.match_status === "MATCHED" || row.match_status === "DUPLICATE") {
      row.match_status = "UNMATCHED";
      row.warnings.push("Không khớp dòng BOM");
    }
  }

  for (const line of bom.lines) {
    if (matchedKeys.has(line.normalized_mpn)) continue;
    const row = baseRowFromBomLine(line);
    row.match_status = "MISSING_IN_LIST";
    row.warnings.push("BOM chưa có trong file MyLists");
    parsed.push(row);
  }

  return {
    rows: parsed,
    headerIndex: header.index,
    sheetName: workbook.SheetNames[0],
  };
}

function summarizeRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const totalUsd = list.reduce(
    (sum, row) => sum + (toNumber(row.extended_price_usd) || 0),
    0,
  );
  const pricedCount = list.filter(
    (row) => toNumber(row.extended_price_usd) > 0,
  ).length;
  const matchedCount = list.filter(
    (row) =>
      Array.isArray(row.matched_line_nos) &&
      row.matched_line_nos.length > 0 &&
      toNumber(row.extended_price_usd) > 0,
  ).length;
  const missingCount = list.filter((row) =>
    ["NO_MATCH", "MISSING_IN_LIST", "UNMATCHED", "NO_MPN"].includes(
      String(row.match_status || ""),
    ),
  ).length;
  return {
    total_usd: Math.round(totalUsd * 100) / 100,
    line_count: list.length,
    priced_count: pricedCount,
    matched_count: matchedCount,
    missing_count: missingCount,
  };
}

function computeBomHash(bom) {
  const payload = (bom?.lines || []).map((line) => ({
    line_no: line.line_no,
    mpn: line.normalized_mpn,
    quantity: line.quantity,
  }));
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

module.exports = {
  normalizeMpn,
  toNumber,
  parseMoney,
  parseInteger,
  parseJson,
  buildBomLines,
  buildAutoRows,
  buildManualRows,
  extractPriceFromListPart,
  summarizeRows,
  computeBomHash,
};
