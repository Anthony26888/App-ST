const db = require("../../database.js");
const { getCaller } = require("../../middleware/auth.js");
const oauth = require("../../services/digikeyOAuth.service.js");
const myLists = require("../../services/digikeyMyLists.service.js");
const productInfo = require("../../services/digikeyProductInfo.service.js");
const quota = require("../../services/digikeyQuota.service.js");
const {
  buildBomLines,
  buildAutoRows,
  buildManualRows,
  summarizeRows,
  computeBomHash,
  parseJson,
  toNumber,
  normalizeMpn,
} = require("../../utils/digikeyComponentPricing.js");
const { buildComponentPriceWorkbook } = require("../../utils/componentPriceExcel.js");

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

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function errorMessage(error) {
  return (
    error?.response?.data?.ErrorMessage ||
    error?.response?.data?.error_description ||
    error?.response?.data?.error ||
    error?.message ||
    "Lỗi không xác định"
  );
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
    console.error("Ghi audit linh kiện lỗi:", error.message);
  }
}

async function getQuote(quoteId) {
  return get(
    `SELECT id, quote_no, project_name, customer_name, board_qty, status
     FROM Quotations WHERE id = ?`,
    [quoteId],
  );
}

async function getQuoteItems(quoteId) {
  return all(
    `SELECT * FROM QuotationItems
     WHERE quotation_id = ?
     ORDER BY line_no ASC, id ASC`,
    [quoteId],
  );
}

async function getImportRow(quoteId) {
  return get(
    `SELECT * FROM QuotationComponentImports WHERE quotation_id = ?`,
    [quoteId],
  );
}

function parsePriceRow(row) {
  return {
    ...row,
    matched_line_nos: parseJson(row.matched_line_nos, []),
    warnings: parseJson(row.warnings, []),
  };
}

async function getPriceRows(quoteId) {
  const rows = await all(
    `SELECT * FROM QuotationComponentPrices
     WHERE quotation_id = ?
     ORDER BY
       CASE WHEN line_no IS NULL THEN 1 ELSE 0 END,
       line_no ASC,
       id ASC`,
    [quoteId],
  );
  return rows.map(parsePriceRow);
}

async function replacePriceRows(quoteId, rows) {
  await run(`DELETE FROM QuotationComponentPrices WHERE quotation_id = ?`, [
    quoteId,
  ]);
  const timestamp = nowIso();
  for (const row of rows || []) {
    await run(
      `INSERT INTO QuotationComponentPrices
       (quotation_id, line_no, source_index, mpn, requested_mpn, original_mpn,
        manufacturer, description, digikey_pn, digikey_unique_id,
        quantity_requested, quantity_purchased, moq, pack_type, selected_pack_type,
        unit_price_usd, extended_price_usd, availability, quantity_available,
        stock_status, lead_time, lead_weeks, part_status, rohs_status,
        country_of_origin, us_tariff, unit_of_measure, customer_reference,
        reference_designator, product_notes, match_status, matched_line_nos,
        warnings, imported_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quoteId,
        row.line_no != null ? Number(row.line_no) : null,
        row.source_index != null ? Number(row.source_index) : null,
        row.mpn || "",
        row.requested_mpn || "",
        row.original_mpn || "",
        row.manufacturer || "",
        row.description || "",
        row.digikey_pn || "",
        row.digikey_unique_id || "",
        toNumber(row.quantity_requested),
        toNumber(row.quantity_purchased),
        toNumber(row.moq),
        row.pack_type || "",
        row.selected_pack_type || "",
        toNumber(row.unit_price_usd),
        toNumber(row.extended_price_usd),
        row.availability != null ? Number(row.availability) : null,
        row.quantity_available != null ? Number(row.quantity_available) : null,
        row.stock_status || "",
        row.lead_time || "",
        row.lead_weeks || "",
        row.part_status || "",
        row.rohs_status || "",
        row.country_of_origin || "",
        row.us_tariff || "",
        row.unit_of_measure || "",
        row.customer_reference || "",
        row.reference_designator || "",
        row.product_notes || "",
        row.match_status || "",
        JSON.stringify(Array.isArray(row.matched_line_nos) ? row.matched_line_nos : []),
        JSON.stringify(Array.isArray(row.warnings) ? row.warnings : []),
        timestamp,
      ],
    );
  }
}

async function setImportRunning(quoteId, bomHash) {
  const timestamp = nowIso();
  await run(
    `INSERT INTO QuotationComponentImports
      (quotation_id, source, status, started_at, finished_at, error_message,
       bom_hash, my_lists_calls, product_info_calls, retry_count)
     VALUES (?, 'auto', 'running', ?, NULL, NULL, ?, 0, 0, 0)
     ON CONFLICT(quotation_id) DO UPDATE SET
       source = 'auto',
       source_file = '',
       status = 'running',
       started_at = excluded.started_at,
       finished_at = NULL,
       error_message = NULL,
       bom_hash = excluded.bom_hash,
       my_lists_calls = 0,
       product_info_calls = 0,
       retry_count = 0`,
    [quoteId, timestamp, bomHash],
  );
}

async function setImportError(quoteId, message) {
  await run(
    `UPDATE QuotationComponentImports
     SET status = 'error', error_message = ?, finished_at = ?
     WHERE quotation_id = ?`,
    [String(message || "Lỗi lấy giá DigiKey").slice(0, 2000), nowIso(), quoteId],
  );
}

async function saveAutoResult(quoteId, fetched, rows, summary) {
  const timestamp = nowIso();
  const totalUsd = round2(summary.total_usd);
  await run("BEGIN");
  try {
    await replacePriceRows(quoteId, rows);
    await run(
      `INSERT INTO QuotationComponentImports
        (quotation_id, source, source_file, digikey_list_id, digikey_list_name,
         digikey_list_created_at, status, error_message, total_usd, line_count,
         priced_count, matched_count, missing_count, bom_hash, my_lists_calls,
         product_info_calls, retry_count, quota_remaining, started_at, finished_at,
         imported_at)
       VALUES (?, 'auto', '', ?, ?, ?, 'success', NULL, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
       ON CONFLICT(quotation_id) DO UPDATE SET
         source = 'auto',
         source_file = '',
         digikey_list_id = excluded.digikey_list_id,
         digikey_list_name = excluded.digikey_list_name,
         digikey_list_created_at = excluded.digikey_list_created_at,
         status = 'success',
         error_message = NULL,
         total_usd = excluded.total_usd,
         line_count = excluded.line_count,
         priced_count = excluded.priced_count,
         matched_count = excluded.matched_count,
         missing_count = excluded.missing_count,
         bom_hash = excluded.bom_hash,
         my_lists_calls = excluded.my_lists_calls,
         product_info_calls = excluded.product_info_calls,
         retry_count = excluded.retry_count,
         quota_remaining = excluded.quota_remaining,
         finished_at = excluded.finished_at,
         imported_at = excluded.imported_at`,
      [
        quoteId,
        fetched.listId,
        fetched.listName,
        timestamp,
        totalUsd,
        summary.line_count,
        summary.priced_count,
        summary.matched_count,
        summary.missing_count,
        summary.bom_hash || "",
        fetched.calls,
        fetched.productInfoCalls || 0,
        JSON.stringify(quota.getState("mylists")),
        timestamp,
        timestamp,
        timestamp,
      ],
    );
    await run("COMMIT");
  } catch (error) {
    await run("ROLLBACK");
    throw error;
  }
}

async function saveManualResult(quote, sourceFile, rows, summary, exchangeRate) {
  const timestamp = nowIso();
  await run("BEGIN");
  try {
    await replacePriceRows(quote.id, rows);
    await run(
      `INSERT INTO QuotationComponentImports
        (quotation_id, source, source_file, status, error_message, exchange_rate,
         total_usd, line_count, priced_count, matched_count, missing_count,
         my_lists_calls, product_info_calls, retry_count, started_at, finished_at,
         imported_at)
       VALUES (?, 'manual', ?, 'success', NULL, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?)
       ON CONFLICT(quotation_id) DO UPDATE SET
         source = 'manual',
         source_file = excluded.source_file,
         status = 'success',
         error_message = NULL,
         exchange_rate = excluded.exchange_rate,
         total_usd = excluded.total_usd,
         line_count = excluded.line_count,
         priced_count = excluded.priced_count,
         matched_count = excluded.matched_count,
         missing_count = excluded.missing_count,
         my_lists_calls = 0,
         product_info_calls = 0,
         retry_count = 0,
         finished_at = excluded.finished_at,
         imported_at = excluded.imported_at`,
      [
        quote.id,
        sourceFile || "",
        Math.max(0, toNumber(exchangeRate)),
        round2(summary.total_usd),
        summary.line_count,
        summary.priced_count,
        summary.matched_count,
        summary.missing_count,
        timestamp,
        timestamp,
        timestamp,
      ],
    );
    await run("COMMIT");
  } catch (error) {
    await run("ROLLBACK");
    throw error;
  }
}

async function applyProductInfoFallback(rows) {
  if (String(process.env.DIGIKEY_PRODUCTINFO_FALLBACK || "1") === "0") {
    return 0;
  }
  const maxCalls = Math.max(
    0,
    Math.min(
      100,
      Number(process.env.DIGIKEY_PRODUCTINFO_MAX_PER_FETCH || 25),
    ),
  );
  if (!maxCalls) return 0;

  const seen = new Set();
  let calls = 0;
  for (const row of rows) {
    if (calls >= maxCalls) break;
    const needsPrice = !(toNumber(row.extended_price_usd) > 0);
    const needsPartNumber = !row.digikey_pn;
    if (!needsPrice && !needsPartNumber) continue;

    const mpn = row.requested_mpn || row.mpn || row.original_mpn;
    const key = normalizeMpn(mpn);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    try {
      calls += 1;
      const info = await productInfo.resolveProduct(mpn, row.quantity_requested);
      if (!info) {
        row.warnings.push("ProductInformation không có giá");
        continue;
      }
      const lineNo = row.line_no;
      const matchedLineNos = row.matched_line_nos || [];
      const referenceDesignator = row.reference_designator;
      Object.assign(row, info, {
        line_no: lineNo,
        matched_line_nos: matchedLineNos,
        reference_designator:
          referenceDesignator || info.reference_designator || "",
      });
      row.warnings.push("Giá lấy từ ProductInformation");
      if (lineNo || matchedLineNos.length) {
        row.match_status = "MATCHED";
      }
    } catch (error) {
      row.warnings.push(
        `ProductInformation: ${errorMessage(error)}`,
      );
      const status = error.response?.status || error.status;
      if (status === 401 || status === 429) break;
    }
  }
  return calls;
}

async function runAutoFetch({ username, quote, items, bom, bomHash, oldListId, io }) {
  let fetched = null;
  try {
    fetched = await myLists.fetchListPricing(username, quote, bom);
    const stillExists = await get(`SELECT id FROM Quotations WHERE id = ?`, [
      quote.id,
    ]);
    if (!stillExists) {
      if (fetched.listId) {
        try {
          await myLists.deleteList(username, fetched.listId);
        } catch {
          /* ignore */
        }
      }
      return;
    }

    const rows = buildAutoRows(fetched.apiParts, bom);
    fetched.productInfoCalls = await applyProductInfoFallback(rows);
    const summary = summarizeRows(rows);
    summary.bom_hash = bomHash;
    await saveAutoResult(quote.id, fetched, rows, summary);

    if (oldListId && oldListId !== fetched.listId) {
      try {
        await myLists.deleteList(username, oldListId);
      } catch (error) {
        console.warn(
          "[DigiKey MyLists] Không xoá được list cũ:",
          error.message,
        );
      }
    }

    await writeAudit(
      "QuotationComponentPrice",
      quote.id,
      "fetch_digikey",
      null,
      {
        list_id: fetched.listId,
        total_usd: summary.total_usd,
        line_count: summary.line_count,
      },
      username,
    );
    if (io) {
      io.emit("QuotationComponentPricesUpdate", {
        quotation_id: quote.id,
        status: "success",
      });
    }
  } catch (error) {
    console.error("[DigiKey MyLists] Fetch lỗi:", error);
    if (fetched?.listId) {
      try {
        await myLists.deleteList(username, fetched.listId);
      } catch {
        /* ignore */
      }
    }
    await setImportError(quote.id, errorMessage(error));
    await writeAudit(
      "QuotationComponentPrice",
      quote.id,
      "fetch_digikey_error",
      null,
      { error: errorMessage(error) },
      username,
    );
    if (io) {
      io.emit("QuotationComponentPricesUpdate", {
        quotation_id: quote.id,
        status: "error",
      });
    }
  }
}

module.exports = (io) => ({
  async get(req, res) {
    try {
      const quoteId = Number(req.params.id);
      const username = getCaller(req).username;
      const quote = await getQuote(quoteId);
      if (!quote) return res.status(404).json({ error: "Không tìm thấy báo giá" });
      const importRow = await getImportRow(quoteId);
      const prices = await getPriceRows(quoteId);
      const digikeyStatus = username
        ? await oauth.getStatus(username)
        : { configured: false, connected: false };
      res.json({
        quote,
        import: importRow,
        prices,
        digikey_status: digikeyStatus,
        quota: quota.getSummary(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async fetchDigiKey(req, res) {
    try {
      const quoteId = Number(req.params.id);
      const username = getCaller(req).username;
      const quote = await getQuote(quoteId);
      if (!quote) return res.status(404).json({ error: "Không tìm thấy báo giá" });

      const status = await oauth.getStatus(username);
      if (!status.connected) {
        return res.status(409).json({
          code: "DIGIKEY_NOT_CONNECTED",
          error: "Chưa kết nối DigiKey. Vào Cài đặt để kết nối.",
        });
      }

      const items = await getQuoteItems(quoteId);
      const bom = buildBomLines(items, quote.board_qty);
      if (!bom.lines.length) {
        return res.status(400).json({
          error: "BOM không có linh kiện có MPN để lấy giá DigiKey.",
        });
      }

      const existing = await getImportRow(quoteId);
      if (existing?.status === "running" && existing.started_at) {
        const started = Date.parse(existing.started_at);
        if (Number.isFinite(started) && Date.now() - started < 15 * 60 * 1000) {
          return res.status(409).json({
            code: "DIGIKEY_FETCH_RUNNING",
            error: "Đang lấy giá DigiKey cho báo giá này.",
          });
        }
      }

      const bomHash = computeBomHash(bom);
      const force = Boolean(req.body?.force);
      const ttlHours = Math.max(
        1,
        Number(process.env.DIGIKEY_COMPONENT_AUTO_REFRESH_HOURS || 24),
      );
      if (!force && existing?.status === "success" && existing.bom_hash === bomHash) {
        const importedAt = Date.parse(existing.imported_at || "");
        if (
          Number.isFinite(importedAt) &&
          Date.now() - importedAt < ttlHours * 3600000
        ) {
          return res.json({
            status: "success",
            skipped: true,
            import: existing,
            message: "BOM chưa thay đổi, dùng giá đã lấy gần nhất.",
          });
        }
      }

      const oldListId = existing?.digikey_list_id || "";
      await setImportRunning(quoteId, bomHash);
      if (io) {
        io.emit("QuotationComponentPricesUpdate", {
          quotation_id: quoteId,
          status: "running",
        });
      }

      setImmediate(() => {
        runAutoFetch({
          username,
          quote,
          items,
          bom,
          bomHash,
          oldListId,
          io,
        }).catch((error) => {
          console.error("[DigiKey MyLists] Background error:", error);
        });
      });

      res.status(202).json({ status: "running" });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  },

  async importManual(req, res) {
    try {
      const quoteId = Number(req.params.id);
      const username = getCaller(req).username;
      const quote = await getQuote(quoteId);
      if (!quote) return res.status(404).json({ error: "Không tìm thấy báo giá" });
      if (!req.file?.buffer) {
        return res.status(400).json({ error: "Chưa chọn file myLists.xlsx" });
      }

      const items = await getQuoteItems(quoteId);
      const parsed = buildManualRows(req.file.buffer, items, quote.board_qty);
      const summary = summarizeRows(parsed.rows);
      const existing = await getImportRow(quoteId);
      const exchangeRate =
        req.body?.exchange_rate != null
          ? toNumber(req.body.exchange_rate)
          : toNumber(existing?.exchange_rate);

      await saveManualResult(
        quote,
        req.file.originalname,
        parsed.rows,
        summary,
        exchangeRate,
      );
      await writeAudit(
        "QuotationComponentPrice",
        quoteId,
        "import_manual",
        null,
        {
          file: req.file.originalname,
          total_usd: summary.total_usd,
          line_count: summary.line_count,
        },
        username,
      );
      if (io) {
        io.emit("QuotationComponentPricesUpdate", {
          quotation_id: quoteId,
          status: "success",
        });
      }

      const importRow = await getImportRow(quoteId);
      const prices = await getPriceRows(quoteId);
      res.json({ import: importRow, prices });
    } catch (error) {
      res.status(400).json({ error: errorMessage(error) });
    }
  },

  async updateExchangeRate(req, res) {
    try {
      const quoteId = Number(req.params.id);
      const rate = Math.max(0, toNumber(req.body?.exchange_rate));
      const existing = await getImportRow(quoteId);
      if (!existing) {
        return res.status(404).json({ error: "Chưa có dữ liệu giá linh kiện" });
      }
      await run(
        `UPDATE QuotationComponentImports SET exchange_rate = ? WHERE quotation_id = ?`,
        [rate, quoteId],
      );
      res.json({ exchange_rate: rate });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async remove(req, res) {
    try {
      const quoteId = Number(req.params.id);
      const username = getCaller(req).username;
      const existing = await getImportRow(quoteId);
      if (!existing) return res.json({ message: "Không có dữ liệu để xoá" });
      await run("BEGIN");
      try {
        await run(
          `DELETE FROM QuotationComponentPrices WHERE quotation_id = ?`,
          [quoteId],
        );
        await run(
          `DELETE FROM QuotationComponentImports WHERE quotation_id = ?`,
          [quoteId],
        );
        await run("COMMIT");
      } catch (error) {
        await run("ROLLBACK");
        throw error;
      }
      await writeAudit(
        "QuotationComponentPrice",
        quoteId,
        "delete",
        existing,
        null,
        username,
      );
      if (existing.digikey_list_id) {
        try {
          await myLists.deleteList(username, existing.digikey_list_id);
        } catch (error) {
          console.warn(
            "[DigiKey MyLists] Không xoá được list khi xoá dữ liệu:",
            error.message,
          );
        }
      }
      if (io) {
        io.emit("QuotationComponentPricesUpdate", {
          quotation_id: quoteId,
          status: "deleted",
        });
      }
      res.json({ message: "Đã xoá dữ liệu giá linh kiện" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async export(req, res) {
    try {
      const quoteId = Number(req.params.id);
      const quote = await getQuote(quoteId);
      if (!quote) return res.status(404).json({ error: "Không tìm thấy báo giá" });
      const importRow = await getImportRow(quoteId);
      const prices = await getPriceRows(quoteId);
      if (!prices.length) {
        return res.status(400).json({ error: "Chưa có dữ liệu giá linh kiện" });
      }
      const buffer = await buildComponentPriceWorkbook(
        quote,
        importRow,
        prices,
      );
      const filename = `GiaLinhKien_${String(quote.quote_no || quote.id).replace(
        /[^\w-]/g,
        "_",
      )}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
});
