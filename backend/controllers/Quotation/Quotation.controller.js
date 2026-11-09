const db = require("../../database.js");
const { getCaller } = require("../../middleware/auth.js");
const { formatDateLocal } = require("../../utils/date.js");
const { resolveBomLines } = require("../../utils/bomPricing.js");
const {
  buildQuoteWorkbook,
  buildUnmappedWorkbook,
} = require("../../utils/quotationExcel.js");
const myLists = require("../../services/digikeyMyLists.service.js");

const ALLOWED_STATUS = ["Nháp", "Đã gửi", "Chấp nhận", "Từ chối", "Hết hạn"];

const all = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || []))),
  );

const get = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null))),
  );

const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    }),
  );

const nowIso = () => new Date().toISOString();

const round100 = (value) => Math.round((Number(value) || 0) / 100) * 100;

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function computeItemTotal(item, boardQty) {
  if (Number(item.dnp) === 1) return 0;
  const qty = toNumber(item.quantity_per_board);
  const price = toNumber(item.unit_price);
  const pin = toNumber(item.pin_count);
  const board = Math.max(1, toNumber(boardQty, 1));
  switch (item.unit) {
    case "pad": {
      const pad = toNumber(item.pad_count);
      return Math.round(qty * pad * board * price);
    }
    case "chan":
    case "moi":
      return Math.round(qty * pin * board * price);
    case "board":
      return Math.round(board * price);
    case "fixed":
      return Math.round(price);
    case "con":
    default:
      return Math.round(qty * board * price);
  }
}

function computeTotals(items, costLines, boardQty, discountValue, vatPercent) {
  const itemSubtotal = (items || []).reduce(
    (sum, item) => sum + computeItemTotal(item, boardQty),
    0,
  );
  const feeSubtotal = (costLines || []).reduce(
    (sum, fee) => sum + toNumber(fee.amount),
    0,
  );
  const subtotal = itemSubtotal + feeSubtotal;
  const discount = Math.min(Math.max(0, toNumber(discountValue)), subtotal);
  const taxable = Math.max(0, subtotal - discount);
  const vat = Math.max(0, toNumber(vatPercent));
  const total = round100(taxable * (1 + vat / 100));
  return { subtotal, discount, vat, total };
}

async function generateQuoteNo() {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rows = await all(
    `SELECT quote_no FROM Quotations WHERE quote_no LIKE ?`,
    [`BG-${ym}-%`],
  );
  const maxSeq = rows.reduce((max, row) => {
    const seq = Number(String(row.quote_no || "").split("-").pop()) || 0;
    return Math.max(max, seq);
  }, 0);
  return `BG-${ym}-${String(maxSeq + 1).padStart(4, "0")}`;
}

async function writeAudit(entity, entityId, action, before, after, username) {
  try {
    await run(
      `INSERT INTO AuditLogs
       (entity, entity_id, action, before_json, after_json, username, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entity,
        entityId,
        action,
        before ? JSON.stringify(before) : null,
        after ? JSON.stringify(after) : null,
        username || "",
        nowIso(),
      ],
    );
  } catch (error) {
    console.error("Ghi audit log lỗi:", error.message);
  }
}

async function learnParts(items, username) {
  for (const item of items || []) {
    if (Number(item.dnp) === 1) continue;
    if (!item.mpn || !item.group_code) continue;
    const confidence = toNumber(item.confidence);
    const canLearn = Number(item.is_manual) === 1 || confidence >= 0.8;
    if (!canLearn || toNumber(item.unit_price) <= 0) continue;

    try {
      await run(
        `INSERT INTO PartMaster
         (mpn, package, pin_count, pad_count, mount_type, price_group, scope, source,
          created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'global', ?, ?, ?, ?)
         ON CONFLICT(mpn) DO UPDATE SET
           package = COALESCE(NULLIF(excluded.package, ''), PartMaster.package),
           pin_count = COALESCE(excluded.pin_count, PartMaster.pin_count),
           pad_count = COALESCE(excluded.pad_count, PartMaster.pad_count),
           mount_type = COALESCE(NULLIF(excluded.mount_type, ''), PartMaster.mount_type),
           price_group = COALESCE(NULLIF(excluded.price_group, ''), PartMaster.price_group),
           updated_at = excluded.updated_at`,
        [
          String(item.mpn).trim().toUpperCase().replace(/\s+/g, ""),
          item.package || "",
          item.pin_count != null ? Number(item.pin_count) : null,
          item.pad_count != null ? Number(item.pad_count) : null,
          item.mount_type || "",
          item.group_code || "",
          Number(item.is_manual) === 1 ? "manual" : "auto",
          username || "",
          nowIso(),
          nowIso(),
        ],
      );
    } catch (error) {
      console.error("Learn PartMaster lỗi:", error.message);
    }
  }
}

async function getQuoteBundle(id) {
  const quote = await get(
    `SELECT q.*, b.name AS price_book_name
     FROM Quotations q
     LEFT JOIN PriceBooks b ON b.id = q.price_book_id
     WHERE q.id = ?`,
    [id],
  );
  if (!quote) return null;
  const items = await all(
    `SELECT * FROM QuotationItems WHERE quotation_id = ? ORDER BY line_no ASC, id ASC`,
    [id],
  );
  const costLines = await all(
    `SELECT * FROM QuotationCostLines WHERE quotation_id = ? ORDER BY id ASC`,
    [id],
  );
  return {
    quote,
    items: items.map((item) => ({
      ...item,
      warnings: parseJson(item.warnings, []),
    })),
    cost_lines: costLines,
  };
}

async function cloneComponentPrices(oldQuotationId, newQuotationId) {
  const meta = await get(
    `SELECT * FROM QuotationComponentImports WHERE quotation_id = ?`,
    [oldQuotationId],
  );
  const prices = await all(
    `SELECT * FROM QuotationComponentPrices WHERE quotation_id = ?`,
    [oldQuotationId],
  );
  if (!meta && !prices.length) return;

  const timestamp = nowIso();
  if (meta) {
    await run(
      `INSERT INTO QuotationComponentImports
       (quotation_id, source, source_file, digikey_list_id, digikey_list_name,
        digikey_list_created_at, status, error_message, exchange_rate, total_usd,
        line_count, priced_count, matched_count, missing_count, bom_hash,
        my_lists_calls, product_info_calls, retry_count, quota_remaining,
        started_at, finished_at, imported_at)
       VALUES (?, 'cloned', ?, NULL, NULL, NULL, 'success', NULL, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?)`,
      [
        newQuotationId,
        meta.source_file || "",
        Number(meta.exchange_rate) || 0,
        Number(meta.total_usd) || 0,
        Number(meta.line_count) || 0,
        Number(meta.priced_count) || 0,
        Number(meta.matched_count) || 0,
        Number(meta.missing_count) || 0,
        meta.bom_hash || "",
        meta.quota_remaining || "",
        timestamp,
        timestamp,
        timestamp,
      ],
    );
  }

  if (prices.length) {
    await run(
      `INSERT INTO QuotationComponentPrices
       (quotation_id, line_no, source_index, mpn, requested_mpn, original_mpn,
        manufacturer, description, digikey_pn, digikey_unique_id,
        quantity_requested, quantity_purchased, moq, pack_type, selected_pack_type,
        unit_price_usd, extended_price_usd, availability, quantity_available,
        stock_status, lead_time, lead_weeks, part_status, rohs_status,
        country_of_origin, us_tariff, unit_of_measure, customer_reference,
        reference_designator, product_notes, match_status, matched_line_nos,
        warnings, price_source, image_url, thumbnail_url,
        reference_unit_price_usd, reference_extended_price_usd, reference_moq,
        imported_at)
       SELECT ?, line_no, source_index, mpn, requested_mpn, original_mpn,
        manufacturer, description, digikey_pn, digikey_unique_id,
        quantity_requested, quantity_purchased, moq, pack_type, selected_pack_type,
        unit_price_usd, extended_price_usd, availability, quantity_available,
        stock_status, lead_time, lead_weeks, part_status, rohs_status,
        country_of_origin, us_tariff, unit_of_measure, customer_reference,
        reference_designator, product_notes, match_status, matched_line_nos,
        warnings, price_source, image_url, thumbnail_url,
        reference_unit_price_usd, reference_extended_price_usd, reference_moq, ?
       FROM QuotationComponentPrices WHERE quotation_id = ?`,
      [newQuotationId, timestamp, oldQuotationId],
    );
  }
}

async function insertItems(quotationId, items, boardQty) {
  let lineNo = 1;
  for (const item of items || []) {
    await run(
      `INSERT INTO QuotationItems
       (quotation_id, line_no, raw_mpn, mpn, description, designator,
        quantity_per_board, package, mount_type, pin_count, pad_count,
        pad_count_source, process_code, group_code, group_name,
        unit, unit_price, line_total, match_method, confidence, needs_review,
        dnp, is_manual, note, warnings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quotationId,
        lineNo++,
        item.raw_mpn || "",
        item.mpn || "",
        item.description || "",
        item.designator || "",
        toNumber(item.quantity_per_board),
        item.package || "",
        item.mount_type || "",
        item.pin_count != null && item.pin_count !== "" ? Number(item.pin_count) : null,
        item.pad_count != null && item.pad_count !== "" ? Number(item.pad_count) : null,
        item.pad_count_source || "",
        item.process_code || "",
        item.group_code || "",
        item.group_name || "",
        item.unit || "con",
        toNumber(item.unit_price),
        computeItemTotal(item, boardQty),
        item.match_method || "",
        toNumber(item.confidence),
        Number(item.needs_review) === 1 ? 1 : 0,
        Number(item.dnp) === 1 ? 1 : 0,
        Number(item.is_manual) === 1 ? 1 : 0,
        item.note || "",
        JSON.stringify(Array.isArray(item.warnings) ? item.warnings : []),
      ],
    );
  }
}

async function insertCostLines(quotationId, costLines) {
  for (const fee of costLines || []) {
    await run(
      `INSERT INTO QuotationCostLines (quotation_id, name, amount, note)
       VALUES (?, ?, ?, ?)`,
      [quotationId, fee.name || "", toNumber(fee.amount), fee.note || ""],
    );
  }
}

function sanitizeQuotePayload(body = {}) {
  return {
    customer_id: body.customer_id ? Number(body.customer_id) : null,
    customer_name: String(body.customer_name || "").trim(),
    project_name: String(body.project_name || "").trim(),
    price_book_id: body.price_book_id ? Number(body.price_book_id) : null,
    currency: String(body.currency || "VND").trim() || "VND",
    board_qty: Math.max(1, Math.round(toNumber(body.board_qty, 1))),
    valid_until: formatDateLocal(body.valid_until),
    payment_terms: String(body.payment_terms || "").trim(),
    lead_time: String(body.lead_time || "").trim(),
    discount_value: Math.max(0, toNumber(body.discount_value)),
    vat_percent: Math.max(0, toNumber(body.vat_percent)),
    note: String(body.note || "").trim(),
    created_by: String(body.created_by || "").trim(),
    items: Array.isArray(body.items) ? body.items : [],
    cost_lines: Array.isArray(body.cost_lines) ? body.cost_lines : [],
  };
}

module.exports = (io) => ({
  // ==========================================================
  // Customers
  // ==========================================================
  async customers(req, res) {
    try {
      const rows = await all(
        `SELECT id, CustomerName AS name FROM Customers ORDER BY CustomerName COLLATE NOCASE ASC`,
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================================
  // Price books
  // ==========================================================
  async listPriceBooks(req, res) {
    try {
      const rows = await all(
        `SELECT b.*,
          (SELECT COUNT(*) FROM PriceGroups g WHERE g.price_book_id = b.id) AS group_count
         FROM PriceBooks b
         ORDER BY b.is_default DESC, b.id DESC`,
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getPriceBook(req, res) {
    try {
      const { id } = req.params;
      const book = await get(`SELECT * FROM PriceBooks WHERE id = ?`, [id]);
      if (!book) return res.status(404).json({ error: "Không tìm thấy bảng giá" });

      const groupRows = await all(
        `SELECT g.*, p.id AS pattern_id, p.pattern, p.match_type
         FROM PriceGroups g
         LEFT JOIN PriceGroupPatterns p ON p.group_id = g.id
         WHERE g.price_book_id = ?
         ORDER BY g.priority DESC, g.id ASC`,
        [id],
      );

      const groupMap = new Map();
      for (const row of groupRows) {
        let group = groupMap.get(row.id);
        if (!group) {
          group = { ...row, patterns: [] };
          delete group.pattern;
          delete group.pattern_id;
          delete group.match_type;
          groupMap.set(row.id, group);
        }
        if (row.pattern) {
          group.patterns.push({
            id: row.pattern_id,
            pattern: row.pattern,
            match_type: row.match_type,
          });
        }
      }

      const overrides = await all(
        `SELECT * FROM PriceBookMpnOverrides WHERE price_book_id = ? ORDER BY id DESC`,
        [id],
      );

      const padRates = await all(
        `SELECT * FROM PriceBookPadRates WHERE price_book_id = ? ORDER BY process_code ASC`,
        [id],
      );

      res.json({ book, groups: [...groupMap.values()], overrides, pad_rates: padRates });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createPriceBook(req, res) {
    try {
      const { name, currency, note, created_by, is_default, pricing_mode } = req.body || {};
      const safeName = String(name || "").trim();
      if (!safeName) return res.status(400).json({ error: "Thiếu tên bảng giá" });
      const mode = String(pricing_mode || "per_component").trim() === "per_pad"
        ? "per_pad"
        : "per_component";

      if (Number(is_default) === 1) {
        await run(`UPDATE PriceBooks SET is_default = 0`);
      }
      const result = await run(
        `INSERT INTO PriceBooks
         (name, currency, version, pricing_mode, is_default, note, created_by, created_at)
         VALUES (?, ?, 1, ?, ?, ?, ?, ?)`,
        [
          safeName,
          String(currency || "VND").trim() || "VND",
          mode,
          Number(is_default) === 1 ? 1 : 0,
          String(note || "").trim(),
          String(created_by || "").trim(),
          nowIso(),
        ],
      );
      if (mode === "per_pad") {
        const now = nowIso();
        for (const [code, name, rate] of [
          ["SMT", "Pad SMT", 500],
          ["HAND", "Pad hàn tay / THT", 1000],
        ]) {
          await run(
            `INSERT OR IGNORE INTO PriceBookPadRates
             (price_book_id, process_code, process_name, rate, note, active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
            [result.lastID, code, name, rate, "Giá mẫu", now, now],
          );
        }
      }
      await writeAudit("PriceBook", result.lastID, "create", null, req.body, created_by);
      res.json({ id: result.lastID, message: "Đã tạo bảng giá" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updatePriceBook(req, res) {
    try {
      const { id } = req.params;
      const oldBook = await get(`SELECT * FROM PriceBooks WHERE id = ?`, [id]);
      if (!oldBook) return res.status(404).json({ error: "Không tìm thấy bảng giá" });

      const { name, currency, note, is_default, pricing_mode } = req.body || {};
      if (Number(is_default) === 1) {
        await run(`UPDATE PriceBooks SET is_default = 0`);
      }
      const mode = String(pricing_mode ?? oldBook.pricing_mode ?? "per_component") === "per_pad"
        ? "per_pad"
        : "per_component";
      await run(
        `UPDATE PriceBooks
         SET name = ?, currency = ?, pricing_mode = ?, note = ?, is_default = ?
         WHERE id = ?`,
        [
          String(name ?? oldBook.name).trim(),
          String(currency ?? oldBook.currency).trim() || "VND",
          mode,
          String(note ?? oldBook.note ?? "").trim(),
          Number(is_default ?? oldBook.is_default) === 1 ? 1 : 0,
          id,
        ],
      );
      await writeAudit("PriceBook", Number(id), "update", oldBook, req.body, req.body?.created_by);
      res.json({ message: "Đã cập nhật bảng giá" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deletePriceBook(req, res) {
    try {
      const { id } = req.params;
      const oldBook = await get(`SELECT * FROM PriceBooks WHERE id = ?`, [id]);
      if (!oldBook) return res.status(404).json({ error: "Không tìm thấy bảng giá" });

      await run("BEGIN");
      try {
        await run(
          `DELETE FROM PriceGroupPatterns
           WHERE group_id IN (SELECT id FROM PriceGroups WHERE price_book_id = ?)`,
          [id],
        );
        await run(`DELETE FROM PriceGroups WHERE price_book_id = ?`, [id]);
        await run(`DELETE FROM PriceBookMpnOverrides WHERE price_book_id = ?`, [id]);
        await run(`DELETE FROM PriceBookPadRates WHERE price_book_id = ?`, [id]);
        await run(`DELETE FROM PriceBooks WHERE id = ?`, [id]);
        await run("COMMIT");
      } catch (error) {
        await run("ROLLBACK");
        throw error;
      }

      if (Number(oldBook.is_default) === 1) {
        const next = await get(`SELECT id FROM PriceBooks ORDER BY id ASC LIMIT 1`);
        if (next) await run(`UPDATE PriceBooks SET is_default = 1 WHERE id = ?`, [next.id]);
      }

      await writeAudit("PriceBook", Number(id), "delete", oldBook, null, req.body?.created_by);
      res.json({ message: "Đã xoá bảng giá" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async upsertPadRates(req, res) {
    try {
      const { id } = req.params;
      const book = await get(`SELECT * FROM PriceBooks WHERE id = ?`, [id]);
      if (!book) return res.status(404).json({ error: "Không tìm thấy bảng giá" });

      const rates = Array.isArray(req.body?.rates) ? req.body.rates : [];
      const allowed = new Set(["SMT", "HAND"]);
      const now = nowIso();

      await run("BEGIN");
      try {
        for (const item of rates) {
          const processCode = String(item.process_code || "").trim().toUpperCase();
          if (!allowed.has(processCode)) continue;
          await run(
            `INSERT INTO PriceBookPadRates
             (price_book_id, process_code, process_name, rate, note, active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(price_book_id, process_code) DO UPDATE SET
               process_name = excluded.process_name,
               rate = excluded.rate,
               note = excluded.note,
               active = excluded.active,
               updated_at = excluded.updated_at`,
            [
              id,
              processCode,
              String(item.process_name || (processCode === "SMT" ? "Pad SMT" : "Pad hàn tay / THT")).trim(),
              Math.max(0, toNumber(item.rate)),
              String(item.note || "").trim(),
              Number(item.active) === 0 ? 0 : 1,
              now,
              now,
            ],
          );
        }
        await run("COMMIT");
      } catch (error) {
        await run("ROLLBACK");
        throw error;
      }

      await writeAudit("PriceBookPadRate", Number(id), "update", null, req.body, req.body?.created_by);
      res.json({ message: "Đã cập nhật giá pad" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createGroup(req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};
      const book = await get(`SELECT id FROM PriceBooks WHERE id = ?`, [id]);
      if (!book) return res.status(404).json({ error: "Không tìm thấy bảng giá" });

      const code = String(body.group_code || "").trim().toUpperCase();
      const name = String(body.group_name || "").trim();
      if (!code || !name) {
        return res.status(400).json({ error: "Thiếu mã hoặc tên nhóm giá" });
      }

      const duplicate = await get(
        `SELECT id FROM PriceGroups WHERE price_book_id = ? AND group_code = ?`,
        [id, code],
      );
      if (duplicate) {
        return res.status(400).json({ error: "Mã nhóm giá đã tồn tại trong bảng giá" });
      }

      const result = await run(
        `INSERT INTO PriceGroups
         (price_book_id, group_code, group_name, mount_type, unit, pin_mode,
          pin_count, pin_min, pin_max, unit_price, priority, keywords, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          code,
          name,
          String(body.mount_type || "SMT").trim(),
          String(body.unit || "con").trim(),
          String(body.pin_mode || "fixed").trim(),
          body.pin_count !== "" && body.pin_count != null ? Number(body.pin_count) : null,
          body.pin_min !== "" && body.pin_min != null ? Number(body.pin_min) : null,
          body.pin_max !== "" && body.pin_max != null ? Number(body.pin_max) : null,
          toNumber(body.unit_price),
          toNumber(body.priority, 100),
          String(body.keywords || "").trim(),
          Number(body.active) === 0 ? 0 : 1,
        ],
      );

      const patterns = Array.isArray(body.patterns) ? body.patterns : [];
      for (const raw of patterns) {
        const pattern = String(raw?.pattern ?? raw ?? "").trim().toUpperCase();
        if (!pattern) continue;
        const matchType =
          raw?.match_type || (pattern.includes("*") ? "wildcard" : "exact");
        await run(
          `INSERT INTO PriceGroupPatterns (group_id, pattern, match_type) VALUES (?, ?, ?)`,
          [result.lastID, pattern, matchType],
        );
      }

      await writeAudit("PriceGroup", result.lastID, "create", null, body, body.created_by);
      res.json({ id: result.lastID, message: "Đã thêm nhóm giá" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateGroup(req, res) {
    try {
      const { groupId } = req.params;
      const oldGroup = await get(`SELECT * FROM PriceGroups WHERE id = ?`, [groupId]);
      if (!oldGroup) return res.status(404).json({ error: "Không tìm thấy nhóm giá" });

      const body = req.body || {};
      const code = String(body.group_code || oldGroup.group_code).trim().toUpperCase();
      const name = String(body.group_name || oldGroup.group_name).trim();

      const duplicate = await get(
        `SELECT id FROM PriceGroups WHERE price_book_id = ? AND group_code = ? AND id <> ?`,
        [oldGroup.price_book_id, code, groupId],
      );
      if (duplicate) {
        return res.status(400).json({ error: "Mã nhóm giá đã tồn tại trong bảng giá" });
      }

      await run(
        `UPDATE PriceGroups SET
          group_code = ?, group_name = ?, mount_type = ?, unit = ?, pin_mode = ?,
          pin_count = ?, pin_min = ?, pin_max = ?, unit_price = ?, priority = ?,
          keywords = ?, active = ?
         WHERE id = ?`,
        [
          code,
          name,
          String(body.mount_type ?? oldGroup.mount_type).trim(),
          String(body.unit ?? oldGroup.unit).trim(),
          String(body.pin_mode ?? oldGroup.pin_mode).trim(),
          body.pin_count !== "" && body.pin_count != null ? Number(body.pin_count) : null,
          body.pin_min !== "" && body.pin_min != null ? Number(body.pin_min) : null,
          body.pin_max !== "" && body.pin_max != null ? Number(body.pin_max) : null,
          toNumber(body.unit_price ?? oldGroup.unit_price),
          toNumber(body.priority ?? oldGroup.priority, 100),
          String(body.keywords ?? oldGroup.keywords ?? "").trim(),
          Number(body.active ?? oldGroup.active) === 0 ? 0 : 1,
          groupId,
        ],
      );

      if (Array.isArray(body.patterns)) {
        await run(`DELETE FROM PriceGroupPatterns WHERE group_id = ?`, [groupId]);
        for (const raw of body.patterns) {
          const pattern = String(raw?.pattern ?? raw ?? "").trim().toUpperCase();
          if (!pattern) continue;
          const matchType =
            raw?.match_type || (pattern.includes("*") ? "wildcard" : "exact");
          await run(
            `INSERT INTO PriceGroupPatterns (group_id, pattern, match_type) VALUES (?, ?, ?)`,
            [groupId, pattern, matchType],
          );
        }
      }

      await writeAudit("PriceGroup", Number(groupId), "update", oldGroup, body, body.created_by);
      res.json({ message: "Đã cập nhật nhóm giá" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteGroup(req, res) {
    try {
      const { groupId } = req.params;
      const oldGroup = await get(`SELECT * FROM PriceGroups WHERE id = ?`, [groupId]);
      if (!oldGroup) return res.status(404).json({ error: "Không tìm thấy nhóm giá" });
      await run(`DELETE FROM PriceGroups WHERE id = ?`, [groupId]);
      await writeAudit("PriceGroup", Number(groupId), "delete", oldGroup, null, req.body?.created_by);
      res.json({ message: "Đã xoá nhóm giá" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createOverride(req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};
      const book = await get(`SELECT id FROM PriceBooks WHERE id = ?`, [id]);
      if (!book) return res.status(404).json({ error: "Không tìm thấy bảng giá" });

      const mpn = String(body.mpn || "").trim().toUpperCase().replace(/\s+/g, "");
      if (!mpn) return res.status(400).json({ error: "Thiếu MPN" });

      const result = await run(
        `INSERT INTO PriceBookMpnOverrides
         (price_book_id, mpn, unit_price, mount_type, pin_count, scope, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          mpn,
          toNumber(body.unit_price),
          String(body.mount_type || "").trim(),
          body.pin_count !== "" && body.pin_count != null ? Number(body.pin_count) : null,
          String(body.scope || "global").trim() || "global",
          String(body.note || "").trim(),
        ],
      );
      await writeAudit("PriceBookMpnOverride", result.lastID, "create", null, body, body.created_by);
      res.json({ id: result.lastID, message: "Đã thêm giá riêng MPN" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteOverride(req, res) {
    try {
      const { overrideId } = req.params;
      const old = await get(`SELECT * FROM PriceBookMpnOverrides WHERE id = ?`, [overrideId]);
      if (!old) return res.status(404).json({ error: "Không tìm thấy giá riêng MPN" });
      await run(`DELETE FROM PriceBookMpnOverrides WHERE id = ?`, [overrideId]);
      await writeAudit("PriceBookMpnOverride", Number(overrideId), "delete", old, null, req.body?.created_by);
      res.json({ message: "Đã xoá giá riêng MPN" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================================
  // Resolve BOM -> price
  // ==========================================================
  async resolveBom(req, res) {
    try {
      const { price_book_id, board_qty, lines } = req.body || {};
      if (!Array.isArray(lines) || lines.length === 0) {
        return res.status(400).json({ error: "Không có dòng BOM nào để xử lý" });
      }
      const result = await resolveBomLines({
        priceBookId: price_book_id,
        boardQty: board_qty,
        lines,
      });
      res.json(result);
    } catch (error) {
      console.error("Resolve BOM lỗi:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================================
  // Quotations
  // ==========================================================
  async listQuotes(req, res) {
    try {
      const rows = await all(
        `SELECT q.*,
          (SELECT COUNT(*) FROM QuotationItems i WHERE i.quotation_id = q.id) AS item_count
         FROM Quotations q
         ORDER BY q.id DESC`,
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getQuote(req, res) {
    try {
      const bundle = await getQuoteBundle(req.params.id);
      if (!bundle) return res.status(404).json({ error: "Không tìm thấy báo giá" });
      const audit = await all(
        `SELECT * FROM AuditLogs WHERE entity = 'Quotation' AND entity_id = ? ORDER BY id DESC`,
        [req.params.id],
      );
      res.json({ ...bundle, audit });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createQuote(req, res) {
    try {
      const payload = sanitizeQuotePayload(req.body);
      if (!payload.project_name && !payload.customer_name) {
        return res.status(400).json({ error: "Thiếu khách hàng hoặc tên dự án" });
      }
      if (!payload.items.length) {
        return res.status(400).json({ error: "Báo giá chưa có dòng BOM nào" });
      }

      const book = payload.price_book_id
        ? await get(`SELECT * FROM PriceBooks WHERE id = ?`, [payload.price_book_id])
        : await get(`SELECT * FROM PriceBooks ORDER BY is_default DESC, id ASC LIMIT 1`);
      if (!book) return res.status(400).json({ error: "Chưa có bảng giá mẫu" });

      const totals = computeTotals(
        payload.items,
        payload.cost_lines,
        payload.board_qty,
        payload.discount_value,
        payload.vat_percent,
      );
      const timestamp = nowIso();

      await run("BEGIN IMMEDIATE");
      let quotationId;
      let quoteNo;
      try {
        quoteNo = await generateQuoteNo();
        const result = await run(
          `INSERT INTO Quotations
           (quote_no, customer_id, customer_name, project_name, status,
            price_book_id, price_book_version, pricing_mode, currency, board_qty,
            valid_until, payment_terms, lead_time, subtotal, discount_value,
            vat_percent, total, note, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'Nháp', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quoteNo,
            payload.customer_id,
            payload.customer_name,
            payload.project_name,
            book.id,
            book.version || 1,
            book.pricing_mode || "per_component",
            payload.currency,
            payload.board_qty,
            payload.valid_until,
            payload.payment_terms,
            payload.lead_time,
            totals.subtotal,
            totals.discount,
            totals.vat,
            totals.total,
            payload.note,
            payload.created_by,
            timestamp,
            timestamp,
          ],
        );
        quotationId = result.lastID;

        await insertItems(quotationId, payload.items, payload.board_qty);
        await insertCostLines(quotationId, payload.cost_lines);
        await run("COMMIT");
      } catch (error) {
        await run("ROLLBACK");
        throw error;
      }

      await learnParts(payload.items, payload.created_by);
      await writeAudit("Quotation", quotationId, "create", null, {
        ...payload,
        subtotal: totals.subtotal,
        total: totals.total,
      }, payload.created_by);

      if (io) io.emit("QuotationUpdate");
      res.json({ id: quotationId, quote_no: quoteNo, message: "Đã tạo báo giá" });
    } catch (error) {
      console.error("Tạo báo giá lỗi:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateQuote(req, res) {
    try {
      const { id } = req.params;
      const old = await getQuoteBundle(id);
      if (!old) return res.status(404).json({ error: "Không tìm thấy báo giá" });
      if (old.quote.status === "Chấp nhận" || old.quote.status === "Từ chối") {
        return res.status(400).json({ error: "Báo giá đã chốt, không thể sửa" });
      }

      const payload = sanitizeQuotePayload({ ...old.quote, ...req.body });
      if (!payload.items.length) {
        return res.status(400).json({ error: "Báo giá chưa có dòng BOM nào" });
      }

      const book = payload.price_book_id
        ? await get(`SELECT * FROM PriceBooks WHERE id = ?`, [payload.price_book_id])
        : { id: old.quote.price_book_id, version: old.quote.price_book_version };

      const totals = computeTotals(
        payload.items,
        payload.cost_lines,
        payload.board_qty,
        payload.discount_value,
        payload.vat_percent,
      );

      await run("BEGIN");
      try {
        await run(
          `UPDATE Quotations SET
            customer_id = ?, customer_name = ?, project_name = ?,
            price_book_id = ?, price_book_version = ?, pricing_mode = ?,
            currency = ?, board_qty = ?, valid_until = ?, payment_terms = ?,
            lead_time = ?, subtotal = ?, discount_value = ?, vat_percent = ?,
            total = ?, note = ?, updated_at = ?
           WHERE id = ?`,
          [
            payload.customer_id,
            payload.customer_name,
            payload.project_name,
            book.id,
            book.version || 1,
            book.pricing_mode || old.quote.pricing_mode || "per_component",
            payload.currency,
            payload.board_qty,
            payload.valid_until,
            payload.payment_terms,
            payload.lead_time,
            totals.subtotal,
            totals.discount,
            totals.vat,
            totals.total,
            payload.note,
            nowIso(),
            id,
          ],
        );
        await run(`DELETE FROM QuotationItems WHERE quotation_id = ?`, [id]);
        await run(`DELETE FROM QuotationCostLines WHERE quotation_id = ?`, [id]);
        await insertItems(Number(id), payload.items, payload.board_qty);
        await insertCostLines(Number(id), payload.cost_lines);
        await run("COMMIT");
      } catch (error) {
        await run("ROLLBACK");
        throw error;
      }

      await learnParts(payload.items, payload.created_by || old.quote.created_by);
      await writeAudit("Quotation", Number(id), "update", old.quote, {
        ...payload,
        subtotal: totals.subtotal,
        total: totals.total,
      }, payload.created_by || old.quote.created_by);

      if (io) io.emit("QuotationUpdate");
      res.json({ message: "Đã cập nhật báo giá" });
    } catch (error) {
      console.error("Cập nhật báo giá lỗi:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, username } = req.body || {};
      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({ error: "Trạng thái không hợp lệ" });
      }
      const old = await get(`SELECT * FROM Quotations WHERE id = ?`, [id]);
      if (!old) return res.status(404).json({ error: "Không tìm thấy báo giá" });

      const sentAt = status === "Đã gửi" ? nowIso() : old.sent_at;
      const acceptedAt = status === "Chấp nhận" ? nowIso() : old.accepted_at;

      await run(
        `UPDATE Quotations SET status = ?, sent_at = ?, accepted_at = ?, updated_at = ? WHERE id = ?`,
        [status, sentAt, acceptedAt, nowIso(), id],
      );
      await writeAudit("Quotation", Number(id), "status", {
        status: old.status,
      }, { status }, username || req.body?.created_by);
      if (io) io.emit("QuotationUpdate");
      res.json({ message: "Đã cập nhật trạng thái" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteQuote(req, res) {
    try {
      const { id } = req.params;
      const old = await get(`SELECT * FROM Quotations WHERE id = ?`, [id]);
      if (!old) return res.status(404).json({ error: "Không tìm thấy báo giá" });
      const componentImport = await get(
        `SELECT digikey_list_id FROM QuotationComponentImports WHERE quotation_id = ?`,
        [id],
      );
      const username =
        String(req.body?.username || "").trim() || getCaller(req).username;
      await run(`DELETE FROM Quotations WHERE id = ?`, [id]);
      await writeAudit(
        "Quotation",
        Number(id),
        "delete",
        old,
        null,
        username,
      );
      if (componentImport?.digikey_list_id && username) {
        try {
          await myLists.deleteList(username, componentImport.digikey_list_id);
        } catch (error) {
          console.warn(
            "[DigiKey MyLists] Không xoá được list khi xoá báo giá:",
            error.message,
          );
        }
      }
      if (io) io.emit("QuotationUpdate");
      res.json({ message: "Đã xoá báo giá" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async cloneQuote(req, res) {
    try {
      const { id } = req.params;
      const bundle = await getQuoteBundle(id);
      if (!bundle) return res.status(404).json({ error: "Không tìm thấy báo giá" });

      const quoteNo = await generateQuoteNo();
      const timestamp = nowIso();
      const old = bundle.quote;

      await run("BEGIN");
      let newId;
      try {
        const result = await run(
          `INSERT INTO Quotations
           (quote_no, customer_id, customer_name, project_name, status,
            price_book_id, price_book_version, pricing_mode, currency, board_qty,
            valid_until, payment_terms, lead_time, subtotal, discount_value,
            vat_percent, total, note, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'Nháp', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quoteNo,
            old.customer_id,
            old.customer_name,
            old.project_name,
            old.price_book_id,
            old.price_book_version,
            old.pricing_mode || "per_component",
            old.currency,
            old.board_qty,
            old.valid_until,
            old.payment_terms,
            old.lead_time,
            old.subtotal,
            old.discount_value,
            old.vat_percent,
            old.total,
            old.note,
            old.created_by,
            timestamp,
            timestamp,
          ],
        );
        newId = result.lastID;

        await insertItems(
          newId,
          bundle.items.map((item) => ({
            ...item,
            warnings: Array.isArray(item.warnings) ? item.warnings : [],
          })),
          old.board_qty,
        );
        await insertCostLines(newId, bundle.cost_lines);
        await cloneComponentPrices(Number(id), newId);
        await run("COMMIT");
      } catch (error) {
        await run("ROLLBACK");
        throw error;
      }

      await writeAudit("Quotation", newId, "clone", { from: Number(id) }, { quote_no: quoteNo }, old.created_by);
      if (io) io.emit("QuotationUpdate");
      res.json({ id: newId, quote_no: quoteNo, message: "Đã nhân bản báo giá" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getAudit(req, res) {
    try {
      const rows = await all(
        `SELECT * FROM AuditLogs WHERE entity = 'Quotation' AND entity_id = ? ORDER BY id DESC`,
        [req.params.id],
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async exportQuote(req, res) {
    try {
      const bundle = await getQuoteBundle(req.params.id);
      if (!bundle) return res.status(404).json({ error: "Không tìm thấy báo giá" });
      const buffer = await buildQuoteWorkbook(
        bundle.quote,
        bundle.items,
        bundle.cost_lines,
      );
      const filename = `BaoGia_${String(bundle.quote.quote_no || bundle.quote.id).replace(/[^\w-]/g, "_")}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export báo giá lỗi:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async exportUnmapped(req, res) {
    try {
      const bundle = await getQuoteBundle(req.params.id);
      if (!bundle) return res.status(404).json({ error: "Không tìm thấy báo giá" });
      const buffer = await buildUnmappedWorkbook(bundle.quote, bundle.items);
      const filename = `LinhKienChuaMapping_${String(bundle.quote.quote_no || bundle.quote.id).replace(/[^\w-]/g, "_")}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export unmapped lỗi:", error);
      res.status(500).json({ error: error.message });
    }
  },
});
