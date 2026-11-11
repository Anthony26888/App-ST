const {
  normalizeMpn,
  toNumber,
  parseJson,
} = require("./digikeyComponentPricing");

const DNP_PATTERN =
  /\b(DNP|DNI|DO\s*NOT\s*PLACE|DO\s*NOT\s*POPULATE|NOT\s*PLACED|NO\s*LOAD)\b/i;

function round2(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function roundQty(value) {
  return Math.round(toNumber(value) * 1000) / 1000;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function uniqueTexts(values) {
  const seen = new Set();
  const result = [];
  for (const value of values || []) {
    const text = cleanText(value);
    if (!text) continue;
    const key = text.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function warningsOf(value) {
  if (Array.isArray(value)) return uniqueTexts(value);
  if (typeof value === "string") {
    const parsed = parseJson(value, null);
    if (Array.isArray(parsed)) return uniqueTexts(parsed);
    return value ? [value] : [];
  }
  return [];
}

function isDnpLine(line) {
  if (line?.dnp === true || Number(line?.dnp) === 1) return true;
  if (/^(dnp|dni|yes|true|1)$/i.test(cleanText(line?.dnp))) return true;
  return DNP_PATTERN.test(
    `${cleanText(line?.note)} ${cleanText(line?.status)} ${cleanText(line?.description)}`,
  );
}

function lineMpn(line) {
  return (
    cleanText(line?.mpn) ||
    cleanText(line?.mpn2) ||
    cleanText(line?.mpn3) ||
    cleanText(line?.raw_mpn) ||
    cleanText(line?.requested_mpn)
  );
}

function sourceName(name, index) {
  return cleanText(name) || `BOM ${index + 1}`;
}

function createRow(mpn, line) {
  return {
    line_no: 0,
    mpn,
    normalized_mpn: normalizeMpn(mpn),
    manufacturer: cleanText(line?.manufacturer),
    description: cleanText(line?.description),
    image_url: "",
    quantity: 0,
    purchase_qty: 0,
    unit_price: 0,
    digikey_pn: "",
    digikey_unit_price_usd: 0,
    digikey_extended_price_usd: 0,
    moq: 0,
    pack_type: "",
    stock_status: "",
    availability: null,
    status: "BOM",
    price_source: "none",
    sources: [],
    warnings: [],
    reference_designator: "",
    note: cleanText(line?.note),
  };
}

function addSource(row, value) {
  const text = cleanText(value);
  if (!text) return;
  if (!row.sources.some((item) => item.toUpperCase() === text.toUpperCase())) {
    row.sources.push(text);
  }
}

function finalizeRows(rows) {
  return rows
    .filter((row) => row.normalized_mpn)
    .map((row, index) => {
      row.line_no = index + 1;
      row.quantity = roundQty(row.quantity);
      row.purchase_qty = roundQty(
        Math.max(row.quantity, row.moq > 0 ? row.moq : row.quantity),
      );
      row.digikey_extended_price_usd = round2(
        row.digikey_unit_price_usd * row.purchase_qty,
      );
      row.sources = uniqueTexts(row.sources);
      row.warnings = uniqueTexts(row.warnings);
      row.reference_designator = uniqueTexts(
        String(row.reference_designator || "")
          .split(/[,;]+/)
          .map((item) => item.trim()),
      ).join(", ");
      return row;
    });
}

function buildBomRows(files = []) {
  const grouped = new Map();

  files.forEach((file, fileIndex) => {
    const boardQty = Math.max(1, toNumber(file?.board_qty, 1));
    const bomName = sourceName(file?.name, fileIndex);

    for (const line of file?.lines || []) {
      if (isDnpLine(line)) continue;
      const mpn = lineMpn(line);
      const key = normalizeMpn(mpn);
      if (!key) continue;

      if (!grouped.has(key)) grouped.set(key, createRow(mpn, line));
      const row = grouped.get(key);
      const quantity = toNumber(line?.quantity) * boardQty;

      row.quantity += quantity;
      if (!row.manufacturer) row.manufacturer = cleanText(line?.manufacturer);
      if (!row.description) row.description = cleanText(line?.description);
      if (!row.note) row.note = cleanText(line?.note);
      if (!row.mpn) row.mpn = mpn;
      if (line?.designator) {
        row.reference_designator = uniqueTexts([
          row.reference_designator,
          line.designator,
        ]).join(", ");
      }
      addSource(row, bomName);
      row.warnings.push(...warningsOf(line?.warnings));
    }
  });

  return finalizeRows(Array.from(grouped.values()));
}

function priceKey(row) {
  return normalizeMpn(
    row?.mpn || row?.requested_mpn || row?.original_mpn || row?.digikey_pn,
  );
}

function buildPriceLookup(prices = []) {
  const lookup = new Map();
  for (const price of prices) {
    const key = priceKey(price);
    if (!key) continue;
    const current = lookup.get(key);
    const priceValue = toNumber(price?.unit_price_usd);
    const currentValue = toNumber(current?.unit_price_usd);
    if (!current || (priceValue > 0 && (!currentValue || priceValue < currentValue))) {
      lookup.set(key, price);
    }
  }
  return lookup;
}

function buildQuoteRows(bundles = []) {
  const grouped = new Map();

  for (const bundle of bundles) {
    const quote = bundle?.quote || {};
    const boardQty = Math.max(1, toNumber(quote?.board_qty, 1));
    const quoteNo = cleanText(quote?.quote_no) || `BG-${quote?.id || ""}`;
    const priceLookup = buildPriceLookup(bundle?.prices || []);

    for (const item of bundle?.items || []) {
      if (isDnpLine(item)) continue;
      const mpn = lineMpn(item);
      const key = normalizeMpn(mpn);
      if (!key) continue;

      if (!grouped.has(key)) {
        grouped.set(key, {
          ...createRow(mpn, item),
          status: "QUOTE_ONLY",
          price_source: "quote",
        });
      }

      const row = grouped.get(key);
      const quantity = toNumber(item?.quantity_per_board) * boardQty;
      const unitPrice = toNumber(item?.unit_price);
      row.quantity += quantity;
      row.unit_price_sum =
        toNumber(row.unit_price_sum) + unitPrice * quantity;
      row.unit_price_qty = toNumber(row.unit_price_qty) + quantity;
      if (!row.manufacturer) row.manufacturer = cleanText(item?.manufacturer);
      if (!row.description) row.description = cleanText(item?.description);
      if (!row.note) row.note = cleanText(item?.note);
      addSource(row, quoteNo);

      const price = priceLookup.get(key);
      if (price) {
        const priceUnit = toNumber(price?.unit_price_usd);
        if (!row.image_url) row.image_url = cleanText(price?.image_url);
        if (!row.digikey_pn) row.digikey_pn = cleanText(price?.digikey_pn);
        if (!row.manufacturer) {
          row.manufacturer = cleanText(price?.manufacturer);
        }
        if (!row.description) {
          row.description = cleanText(price?.description);
        }
        if (!row.stock_status) {
          row.stock_status = cleanText(price?.stock_status);
        }
        if (row.availability == null && price?.availability != null) {
          row.availability = price.availability;
        }
        if (!row.pack_type) row.pack_type = cleanText(price?.pack_type);
        if (priceUnit > 0) {
          if (!row.digikey_unit_price_usd || priceUnit < row.digikey_unit_price_usd) {
            row.digikey_unit_price_usd = priceUnit;
            row.moq = toNumber(price?.moq);
            row.digikey_pn = cleanText(price?.digikey_pn) || row.digikey_pn;
            row.pack_type =
              cleanText(price?.pack_type) || cleanText(row.pack_type);
            row.stock_status =
              cleanText(price?.stock_status) || cleanText(row.stock_status);
            row.availability = price?.availability ?? row.availability;
            row.status =
              cleanText(price?.match_status) ||
              (row.moq > row.quantity ? "MOQ_APPLIED" : "MATCHED");
            row.price_source = "mylists";
          }
        } else if (row.status === "QUOTE_ONLY") {
          row.status = cleanText(price?.match_status) || "NO_PRICE";
          row.price_source = cleanText(price?.price_source) || "quote";
        }
        row.warnings.push(...warningsOf(price?.warnings));
      }
    }
  }

  const rows = Array.from(grouped.values()).map((row) => {
    const average = row.unit_price_qty
      ? row.unit_price_sum / row.unit_price_qty
      : 0;
    row.unit_price = round2(average);
    if (row.status === "QUOTE_ONLY" && !row.digikey_unit_price_usd) {
      row.price_source = "quote";
    }
    delete row.unit_price_sum;
    delete row.unit_price_qty;
    return row;
  });

  return finalizeRows(rows);
}

function summarizePurchaseRows(rows = []) {
  const pricedCount = rows.filter(
    (row) => toNumber(row?.digikey_unit_price_usd) > 0,
  ).length;
  return {
    line_count: rows.length,
    total_qty: roundQty(rows.reduce((sum, row) => sum + toNumber(row?.quantity), 0)),
    purchase_qty: roundQty(
      rows.reduce((sum, row) => sum + toNumber(row?.purchase_qty), 0),
    ),
    priced_count: pricedCount,
    unpriced_count: rows.length - pricedCount,
    total_usd: round2(
      rows.reduce(
        (sum, row) => sum + toNumber(row?.digikey_extended_price_usd),
        0,
      ),
    ),
  };
}

module.exports = {
  buildBomRows,
  buildQuoteRows,
  summarizePurchaseRows,
  isDnpLine,
  warningsOf,
};
