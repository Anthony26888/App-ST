const crypto = require("crypto");
const ExcelJS = require("exceljs");
const db = require("../../database.js");
const { getCaller } = require("../../middleware/auth.js");
const oauth = require("../../services/digikeyOAuth.service.js");
const myLists = require("../../services/digikeyMyLists.service.js");
const productInfo = require("../../services/digikeyProductInfo.service.js");
const {
  normalizeMpn,
  toNumber,
  parseJson,
  buildAutoRows,
} = require("../../utils/digikeyComponentPricing.js");
const {
  buildBomRows,
  buildQuoteRows,
  summarizePurchaseRows,
  warningsOf,
} = require("../../utils/purchaseConsolidation.js");

const fetchJobs = new Map();

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
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    }),
  );

function nowIso() {
  return new Date().toISOString();
}

function errorMessage(error) {
  return error?.response?.data?.ErrorMessage || error?.message || "Đã có lỗi xảy ra";
}

function json(value, fallback) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value == null || value === "") return JSON.stringify(fallback);
  if (typeof value === "string") {
    const parsed = parseJson(value, null);
    return JSON.stringify(parsed ?? fallback);
  }
  return JSON.stringify(value);
}

function parseProjectRow(row) {
  if (!row) return null;
  return {
    ...row,
    quote_ids: parseJson(row.quote_ids, []),
    source_files: parseJson(row.source_files, []),
  };
}

function parseItemRow(row) {
  if (!row) return null;
  return {
    ...row,
    sources: parseJson(row.sources, []),
    warnings: parseJson(row.warnings, []),
  };
}

async function getProjectRow(id) {
  return get(
    `SELECT p.*,
       (SELECT COUNT(*) FROM PurchaseProjectItems i WHERE i.project_id = p.id) AS item_count,
       (SELECT COALESCE(SUM(i.quantity), 0) FROM PurchaseProjectItems i WHERE i.project_id = p.id) AS total_qty,
       (SELECT COUNT(*) FROM PurchaseProjectItems i WHERE i.project_id = p.id AND i.digikey_unit_price_usd > 0) AS priced_count,
       (SELECT COALESCE(SUM(i.digikey_extended_price_usd), 0) FROM PurchaseProjectItems i WHERE i.project_id = p.id) AS total_usd
     FROM PurchaseProjects p WHERE p.id = ?`,
    [id],
  );
}

async function getProjectItems(id) {
  const rows = await all(
    `SELECT * FROM PurchaseProjectItems WHERE project_id = ? ORDER BY line_no, id`,
    [id],
  );
  return rows.map(parseItemRow);
}

async function getProject(id) {
  const row = await getProjectRow(id);
  if (!row) return null;
  const items = await getProjectItems(id);
  return {
    ...parseProjectRow(row),
    items,
    summary: summarizePurchaseRows(items),
  };
}

async function replaceItems(projectId, items = []) {
  await run(`DELETE FROM PurchaseProjectItems WHERE project_id = ?`, [projectId]);
  const createdAt = nowIso();
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const mpn = String(item?.mpn || item?.raw_mpn || "").trim();
    await run(
      `INSERT INTO PurchaseProjectItems
       (project_id, line_no, mpn, normalized_mpn, manufacturer, description,
        image_url, quantity, purchase_qty, unit_price, digikey_pn,
        digikey_unit_price_usd, digikey_extended_price_usd, moq, pack_type,
        stock_status, availability, status, price_source, sources, warnings,
        reference_designator, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        index + 1,
        mpn,
        normalizeMpn(item?.normalized_mpn || mpn),
        String(item?.manufacturer || "").trim(),
        String(item?.description || "").trim(),
        String(item?.image_url || "").trim(),
        toNumber(item?.quantity),
        toNumber(item?.purchase_qty, toNumber(item?.quantity)),
        toNumber(item?.unit_price),
        String(item?.digikey_pn || "").trim(),
        toNumber(item?.digikey_unit_price_usd),
        toNumber(item?.digikey_extended_price_usd),
        toNumber(item?.moq),
        String(item?.pack_type || "").trim(),
        String(item?.stock_status || "").trim(),
        item?.availability == null ? null : toNumber(item.availability),
        String(item?.status || "").trim(),
        String(item?.price_source || "").trim(),
        json(item?.sources, []),
        json(warningsOf(item?.warnings), []),
        String(item?.reference_designator || "").trim(),
        String(item?.note || "").trim(),
        createdAt,
      ],
    );
  }
}

async function saveProject(id, body, username, isCreate) {
  const projectName = String(body?.project_name || "").trim();
  if (!projectName) throw new Error("Chưa nhập tên dự án mua hàng");
  const sourceType = body?.source_type === "quote" ? "quote" : "bom";
  const quoteIds = Array.isArray(body?.quote_ids)
    ? body.quote_ids.map((value) => Number(value)).filter(Boolean)
    : [];
  const sourceFiles = Array.isArray(body?.source_files) ? body.source_files : [];
  const items = Array.isArray(body?.items) ? body.items : [];
  const now = nowIso();

  if (isCreate) {
    const result = await run(
      `INSERT INTO PurchaseProjects
       (project_name, customer_name, source_type, status, note, quote_ids,
        source_files, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectName,
        String(body?.customer_name || "").trim(),
        sourceType,
        String(body?.status || "Draft").trim(),
        String(body?.note || "").trim(),
        json(quoteIds, []),
        json(sourceFiles, []),
        username || "",
        now,
        now,
      ],
    );
    await replaceItems(result.lastID, items);
    return result.lastID;
  }

  const old = await getProjectRow(id);
  if (!old) throw new Error("Không tìm thấy dự án mua hàng");
  await run(
    `UPDATE PurchaseProjects
     SET project_name = ?, customer_name = ?, source_type = ?, status = ?,
         note = ?, quote_ids = ?, source_files = ?, updated_at = ?
     WHERE id = ?`,
    [
      projectName,
      String(body?.customer_name ?? old.customer_name ?? "").trim(),
      sourceType,
      String(body?.status || old.status || "Draft").trim(),
      String(body?.note ?? old.note ?? "").trim(),
      json(quoteIds.length ? quoteIds : parseJson(old.quote_ids, []), []),
      json(sourceFiles.length ? sourceFiles : parseJson(old.source_files, []), []),
      now,
      id,
    ],
  );
  if (Array.isArray(body?.items)) await replaceItems(id, body.items);
  return id;
}

async function getQuoteBundles(quoteIds = []) {
  const ids = quoteIds.map((value) => Number(value)).filter(Boolean);
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(",");
  const quotes = await all(
    `SELECT * FROM Quotations WHERE id IN (${placeholders})`,
    ids,
  );
  const bundles = [];
  for (const quote of quotes) {
    const items = await all(
      `SELECT * FROM QuotationItems WHERE quotation_id = ? ORDER BY line_no, id`,
      [quote.id],
    );
    const prices = await all(
      `SELECT * FROM QuotationComponentPrices WHERE quotation_id = ? ORDER BY line_no, id`,
      [quote.id],
    );
    bundles.push({ quote, items, prices });
  }
  return bundles;
}

async function enrichRowsWithProductInfo(rows) {
  const maxCalls = Math.max(
    0,
    Number(process.env.PURCHASE_PRODUCT_INFO_MAX_CALLS || 20),
  );
  let calls = 0;
  for (const row of rows) {
    if (calls >= maxCalls) break;
    if (toNumber(row?.unit_price_usd) > 0 && row?.image_url) continue;
    const mpn = String(row?.mpn || row?.requested_mpn || "").trim();
    if (!mpn) continue;
    try {
      calls += 1;
      const info = await productInfo.resolveProduct(
        mpn,
        toNumber(row?.quantity_requested, 1),
      );
      if (!row.manufacturer) row.manufacturer = info.manufacturer || "";
      if (!row.description) row.description = info.description || "";
      if (!row.image_url) row.image_url = info.image_url || "";
      if (!row.digikey_pn) row.digikey_pn = info.digikey_pn || "";
      if (!row.stock_status) row.stock_status = info.stock_status || "";
      if (row.availability == null) row.availability = info.availability ?? null;
      if (!toNumber(row.unit_price_usd) && toNumber(info.unit_price_usd) > 0) {
        row.unit_price_usd = toNumber(info.unit_price_usd);
        row.price_source = "product_info";
        row.match_status = "REFERENCE_PRICE";
        row.moq = toNumber(info.moq);
        row.pack_type = info.pack_type || row.pack_type;
        row.warnings = warningsOf(row.warnings);
        row.warnings.push("Giá tham khảo từ ProductInformation");
      }
    } catch {
      row.warnings = warningsOf(row.warnings);
      row.warnings.push("Không tra được ProductInformation");
    }
  }
  return rows;
}

async function buildPricedItems(project, items, username) {
  const lines = items
    .filter((item) => normalizeMpn(item?.mpn))
    .map((item, index) => ({
      line_no: index + 1,
      mpn: String(item.mpn || "").trim(),
      raw_mpn: String(item.mpn || "").trim(),
      normalized_mpn: normalizeMpn(item.mpn),
      quantity: toNumber(item.quantity),
      description: String(item.description || "").trim(),
      reference_designator: String(item.reference_designator || "").trim(),
      matched_line_nos: [index + 1],
    }));
  if (!lines.length) throw new Error("Dự án chưa có MPN để lấy giá DigiKey");

  const bom = { lines, noMpn: [], board_qty: 1 };
  const quote = {
    id: project.id,
    quote_no: `PUR-${project.id}`,
    project_name: project.project_name,
  };
  const fetched = await myLists.fetchListPricing(username, quote, bom);
  const rows = await enrichRowsWithProductInfo(
    buildAutoRows(fetched.apiParts, bom),
  );
  const lookup = new Map();
  for (const row of rows) {
    const key = normalizeMpn(
      row?.mpn || row?.requested_mpn || row?.original_mpn || row?.digikey_pn,
    );
    if (!key) continue;
    const current = lookup.get(key);
    if (!current || (!toNumber(current.unit_price_usd) && toNumber(row.unit_price_usd))) {
      lookup.set(key, row);
    }
  }

  const priced = items.map((item) => {
    const price = lookup.get(normalizeMpn(item.mpn));
    if (!price) {
      return {
        ...item,
        purchase_qty: toNumber(item.quantity),
        status: "NO_PRICE",
        warnings: warningsOf(item.warnings),
      };
    }
    const moq = toNumber(price.moq);
    const purchaseQty = Math.max(toNumber(item.quantity), moq);
    const unit = toNumber(price.unit_price_usd);
    return {
      ...item,
      manufacturer: price.manufacturer || item.manufacturer,
      description: price.description || item.description,
      image_url: price.image_url || item.image_url,
      digikey_pn: price.digikey_pn || item.digikey_pn,
      digikey_unit_price_usd: unit,
      digikey_extended_price_usd: Math.round(unit * purchaseQty * 100) / 100,
      moq,
      pack_type: price.pack_type || item.pack_type,
      stock_status: price.stock_status || item.stock_status,
      availability: price.availability ?? item.availability,
      purchase_qty: purchaseQty,
      status: price.match_status || (unit > 0 ? "MATCHED" : "NO_PRICE"),
      price_source: price.price_source || "mylists",
      warnings: Array.from(
        new Set([...warningsOf(item.warnings), ...warningsOf(price.warnings)]),
      ),
    };
  });

  return { items: priced, listId: fetched.listId };
}

function createWorkbook(project) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "App-ST";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Tong hop mua hang");

  sheet.columns = [
    { key: "stt", width: 7 },
    { key: "mpn", width: 30 },
    { key: "manufacturer", width: 24 },
    { key: "description", width: 52 },
    { key: "quantity", width: 12 },
    { key: "purchase_qty", width: 12 },
    { key: "unit_price", width: 16 },
    { key: "digikey_price", width: 16 },
    { key: "digikey_total", width: 18 },
    { key: "status", width: 20 },
    { key: "stock", width: 16 },
    { key: "sources", width: 34 },
  ];

  const title = sheet.addRow(["TỔNG HỢP MUA HÀNG"]);
  title.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  title.height = 32;
  for (let col = 1; col <= 12; col += 1) {
    title.getCell(col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E4E79" },
    };
  }
  sheet.mergeCells("A1:L1");

  const infoRows = [
    ["Dự án", project.project_name || ""],
    ["Khách hàng", project.customer_name || ""],
    ["Nguồn", project.source_type === "quote" ? "Mã báo giá" : "File BOM"],
    [
      "Mã báo giá",
      Array.isArray(project.quote_ids) ? project.quote_ids.join(", ") : "",
    ],
    ["Ngày xuất", new Date().toLocaleString("vi-VN")],
  ];
  infoRows.forEach(([label, value]) => {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    sheet.mergeCells(`B${row.number}:L${row.number}`);
  });

  sheet.addRow([]);
  const header = sheet.addRow([
    "STT",
    "MPN",
    "NSX",
    "Description",
    "QTY",
    "SL mua",
    "Đơn giá",
    "Giá DigiKey",
    "Thành tiền DigiKey",
    "Trạng thái",
    "Tồn kho",
    "Nguồn",
  ]);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  header.height = 28;
  header.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E75B6" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const statusLabel = (status) =>
    ({
      MATCHED: "Có giá DigiKey",
      MOQ_APPLIED: "Áp dụng MOQ",
      QUOTE_ONLY: "Chỉ có giá BG",
      REFERENCE_PRICE: "Giá tham khảo",
      NO_PRICE: "Chưa có giá",
      UNMATCHED: "Không khớp",
      NO_MATCH: "Không khớp",
      MISSING_IN_LIST: "Thiếu trong MyLists",
    })[status] || status || "";

  (project.items || []).forEach((item, index) => {
    const row = sheet.addRow([
      index + 1,
      item.mpn || "",
      item.manufacturer || "",
      item.description || "",
      toNumber(item.quantity),
      toNumber(item.purchase_qty),
      toNumber(item.unit_price),
      toNumber(item.digikey_unit_price_usd),
      toNumber(item.digikey_extended_price_usd),
      statusLabel(item.status),
      item.stock_status || "",
      Array.isArray(item.sources) ? item.sources.join(", ") : "",
    ]);
    row.alignment = { vertical: "middle", wrapText: true };
    row.getCell(5).numFmt = "#,##0";
    row.getCell(6).numFmt = "#,##0";
    row.getCell(7).numFmt = "#,##0";
    row.getCell(8).numFmt = "$#,##0.0000";
    row.getCell(9).numFmt = "$#,##0.00";
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD9E2F3" } },
        left: { style: "thin", color: { argb: "FFD9E2F3" } },
        bottom: { style: "thin", color: { argb: "FFD9E2F3" } },
        right: { style: "thin", color: { argb: "FFD9E2F3" } },
      };
    });
  });

  const summary = summarizePurchaseRows(project.items || []);
  sheet.addRow([]);
  const totalRow = sheet.addRow([
    "",
    "",
    "",
    "TỔNG CỘNG",
    summary.total_qty,
    summary.purchase_qty,
    "",
    "",
    summary.total_usd,
    `${summary.priced_count}/${summary.line_count} có giá`,
    "",
    "",
  ]);
  totalRow.font = { bold: true };
  totalRow.getCell(5).numFmt = "#,##0";
  totalRow.getCell(6).numFmt = "#,##0";
  totalRow.getCell(9).numFmt = "$#,##0.00";

  return workbook;
}

module.exports = () => ({
  async listProjects(req, res) {
    try {
      const rows = await all(
        `SELECT p.*,
           (SELECT COUNT(*) FROM PurchaseProjectItems i WHERE i.project_id = p.id) AS item_count,
           (SELECT COALESCE(SUM(i.quantity), 0) FROM PurchaseProjectItems i WHERE i.project_id = p.id) AS total_qty,
           (SELECT COUNT(*) FROM PurchaseProjectItems i WHERE i.project_id = p.id AND i.digikey_unit_price_usd > 0) AS priced_count,
           (SELECT COALESCE(SUM(i.digikey_extended_price_usd), 0) FROM PurchaseProjectItems i WHERE i.project_id = p.id) AS total_usd
         FROM PurchaseProjects p
         ORDER BY datetime(p.updated_at) DESC, p.id DESC`,
      );
      res.json({ projects: rows.map(parseProjectRow) });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  },

  async getProject(req, res) {
    try {
      const project = await getProject(Number(req.params.id));
      if (!project) {
        return res.status(404).json({ error: "Không tìm thấy dự án mua hàng" });
      }
      res.json({ project });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  },

  async createProject(req, res) {
    try {
      const username = getCaller(req).username;
      const id = await saveProject(null, req.body, username, true);
      const project = await getProject(id);
      res.status(201).json({ project });
    } catch (error) {
      res.status(400).json({ error: errorMessage(error) });
    }
  },

  async updateProject(req, res) {
    try {
      const id = Number(req.params.id);
      const username = getCaller(req).username;
      await saveProject(id, req.body, username, false);
      const project = await getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Không tìm thấy dự án mua hàng" });
      }
      res.json({ project });
    } catch (error) {
      res.status(400).json({ error: errorMessage(error) });
    }
  },

  async deleteProject(req, res) {
    try {
      const id = Number(req.params.id);
      await run(`DELETE FROM PurchaseProjectItems WHERE project_id = ?`, [id]);
      await run(`DELETE FROM PurchaseProjects WHERE id = ?`, [id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  },

  async consolidateBom(req, res) {
    try {
      const files = Array.isArray(req.body?.files) ? req.body.files : [];
      if (!files.length) {
        return res.status(400).json({ error: "Chưa có file BOM để tổng hợp" });
      }
      const rows = buildBomRows(files);
      if (!rows.length) {
        return res.status(400).json({
          error: "Không tìm thấy linh kiện có MPN trong các file BOM",
        });
      }
      res.json({ rows, summary: summarizePurchaseRows(rows) });
    } catch (error) {
      res.status(400).json({ error: errorMessage(error) });
    }
  },

  async consolidateQuotes(req, res) {
    try {
      const quoteIds = Array.isArray(req.body?.quote_ids)
        ? req.body.quote_ids.map((value) => Number(value)).filter(Boolean)
        : [];
      if (!quoteIds.length) {
        return res.status(400).json({ error: "Chưa chọn mã báo giá" });
      }
      const bundles = await getQuoteBundles(quoteIds);
      if (!bundles.length) {
        return res.status(404).json({ error: "Không tìm thấy báo giá đã chọn" });
      }
      const customers = Array.from(
        new Set(
          bundles
            .map((bundle) => String(bundle.quote.customer_name || "").trim())
            .filter(Boolean),
        ),
      );
      if (customers.length > 1) {
        return res.status(400).json({
          error: "Chỉ được gộp các báo giá cùng một khách hàng",
        });
      }
      const rows = buildQuoteRows(bundles);
      if (!rows.length) {
        return res.status(400).json({
          error: "Các báo giá đã chọn không có linh kiện có MPN",
        });
      }
      res.json({
        rows,
        summary: summarizePurchaseRows(rows),
        customer_name: customers[0] || "",
        quote_ids: quoteIds,
      });
    } catch (error) {
      res.status(400).json({ error: errorMessage(error) });
    }
  },

  async fetchDigiKey(req, res) {
    try {
      const id = Number(req.params.id);
      const username = getCaller(req).username;
      const project = await getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Không tìm thấy dự án mua hàng" });
      }
      if (!project.items.some((item) => normalizeMpn(item.mpn))) {
        return res.status(400).json({
          error: "Dự án chưa có MPN để lấy giá DigiKey",
        });
      }
      const status = await oauth.getStatus(username);
      if (!status.connected) {
        return res.status(409).json({
          code: "DIGIKEY_NOT_CONNECTED",
          error: "Chưa kết nối DigiKey. Vào Cài đặt để kết nối.",
        });
      }
      const running = Array.from(fetchJobs.values()).find(
        (job) => job.projectId === id && job.status === "running",
      );
      if (running) {
        return res.status(409).json({
          code: "DIGIKEY_FETCH_RUNNING",
          error: "Đang lấy giá DigiKey cho dự án này.",
          job_id: running.id,
        });
      }

      const io = req.app.get("io");
      const jobId = crypto.randomUUID();
      const job = {
        id: jobId,
        type: "project",
        projectId: id,
        status: "running",
        error: "",
        started_at: nowIso(),
        finished_at: "",
      };
      fetchJobs.set(jobId, job);

      setImmediate(async () => {
        try {
          const result = await buildPricedItems(project, project.items, username);
          await replaceItems(id, result.items);
          await run(
            `UPDATE PurchaseProjects SET status = ?, updated_at = ? WHERE id = ?`,
            ["Priced", nowIso(), id],
          );
          job.status = "success";
          job.summary = summarizePurchaseRows(result.items);
          job.finished_at = nowIso();
          if (result.listId) {
            await myLists.deleteList(username, result.listId).catch(() => {});
          }
          if (io) {
            io.emit("PurchaseProjectUpdated", { project_id: id });
          }
        } catch (error) {
          job.status = "error";
          job.error = errorMessage(error);
          job.finished_at = nowIso();
        } finally {
          setTimeout(() => fetchJobs.delete(jobId), 30 * 60 * 1000);
        }
      });

      res.status(202).json({ job_id: jobId, status: "running" });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  },

  async fetchDigiKeyJob(req, res) {
    const job = fetchJobs.get(String(req.params.jobId || ""));
    if (!job) {
      return res.status(404).json({ error: "Không tìm thấy tiến trình lấy giá" });
    }
    const response = {
      job_id: job.id,
      type: job.type || "project",
      status: job.status,
      error: job.error,
      summary: job.summary || null,
    };
    if (job.type === "project") {
      response.project_id = job.projectId;
    }
    if (job.type === "preview" && job.status === "success") {
      response.items = job.items || [];
    }
    res.json(response);
  },

  async previewFetchDigiKey(req, res) {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      if (!items.some((item) => normalizeMpn(item?.mpn))) {
        return res.status(400).json({
          error: "Chưa có MPN để lấy giá DigiKey",
        });
      }
      const username = getCaller(req).username;
      const status = await oauth.getStatus(username);
      if (!status.connected) {
        return res.status(409).json({
          code: "DIGIKEY_NOT_CONNECTED",
          error: "Chưa kết nối DigiKey. Vào Cài đặt để kết nối.",
        });
      }
      const jobId = crypto.randomUUID();
      const job = {
        id: jobId,
        type: "preview",
        status: "running",
        error: "",
        started_at: nowIso(),
        finished_at: "",
      };
      fetchJobs.set(jobId, job);

      setImmediate(async () => {
        try {
          const fakeProject = {
            id: "preview",
            project_name: String(req.body?.project_name || "Preview").trim(),
          };
          const result = await buildPricedItems(fakeProject, items, username);
          job.status = "success";
          job.items = result.items;
          job.summary = summarizePurchaseRows(result.items);
          job.finished_at = nowIso();
          if (result.listId) {
            await myLists.deleteList(username, result.listId).catch(() => {});
          }
        } catch (error) {
          job.status = "error";
          job.error = errorMessage(error);
          job.finished_at = nowIso();
        } finally {
          setTimeout(() => fetchJobs.delete(jobId), 15 * 60 * 1000);
        }
      });

      res.status(202).json({ job_id: jobId, status: "running" });
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  },

  async exportProject(req, res) {
    try {
      const project = await getProject(Number(req.params.id));
      if (!project) {
        return res.status(404).json({ error: "Không tìm thấy dự án mua hàng" });
      }
      const workbook = createWorkbook(project);
      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = String(project.project_name || "mua-hang")
        .replace(/[\\/:*?"<>|]+/g, "-")
        .slice(0, 80);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(safeName)}.xlsx"`,
      );
      res.send(Buffer.from(buffer));
    } catch (error) {
      res.status(500).json({ error: errorMessage(error) });
    }
  },
});
