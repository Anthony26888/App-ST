const axios = require("axios");
const ExcelJS = require("exceljs");
const sharp = require("sharp");

const BORDER = {
  top: { style: "thin", color: { argb: "FFB0B0B0" } },
  left: { style: "thin", color: { argb: "FFB0B0B0" } },
  bottom: { style: "thin", color: { argb: "FFB0B0B0" } },
  right: { style: "thin", color: { argb: "FFB0B0B0" } },
};

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = BORDER;
  });
  row.height = 28;
}

function styleCell(cell, align = "left") {
  cell.border = BORDER;
  cell.alignment = { vertical: "middle", horizontal: align, wrapText: true };
}

function formatDate(value) {
  if (!value) return "";
  const raw = String(value);
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : raw;
}

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function warningsText(value) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value || "");
}

const IMAGE_HOSTS = [
  "https://mm.digikey.com/",
  "https://media.digikey.com/",
  "https://assets.lcsc.com/",
];

function isAllowedImageUrl(url) {
  const raw = String(url || "").trim();
  if (!/^https?:\/\//i.test(raw)) return false;
  return IMAGE_HOSTS.some((prefix) => raw.startsWith(prefix));
}

async function fetchImageThumbnail(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 10000,
    maxContentLength: 8 * 1024 * 1024,
    maxBodyLength: 8 * 1024 * 1024,
    headers: { Accept: "image/*" },
  });
  return sharp(Buffer.from(response.data))
    .resize(64, 64, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .jpeg({ quality: 82 })
    .toBuffer();
}

async function attachImages(wb, ws, prices) {
  const maxImages = Math.max(
    0,
    Number(process.env.COMPONENT_EXCEL_MAX_IMAGES || 200),
  );
  const concurrency = Math.max(
    1,
    Math.min(6, Number(process.env.COMPONENT_EXCEL_IMAGE_CONCURRENCY || 4)),
  );
  const items = (prices || [])
    .map((row, index) => ({
      row,
      line: ws.getRow(5 + index + 1),
      url: String(row.image_url || row.thumbnail_url || "").trim(),
    }))
    .filter((item) => item.url);

  for (const item of items) {
    const cell = item.line.getCell(5);
    cell.alignment = { vertical: "middle", horizontal: "center" };
  }
  if (!items.length) return;

  const imageIds = new Map();
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length && cursor < maxImages) {
      const item = items[cursor];
      cursor += 1;
      const cell = item.line.getCell(5);
      if (!isAllowedImageUrl(item.url)) {
        cell.value = { text: "Xem ảnh", hyperlink: item.url };
        cell.font = { color: { argb: "FF0563C1" }, underline: true };
        continue;
      }
      try {
        let imageId = imageIds.get(item.url);
        if (imageId == null) {
          const thumbnail = await fetchImageThumbnail(item.url);
          imageId = wb.addImage({ buffer: thumbnail, extension: "jpeg" });
          imageIds.set(item.url, imageId);
        }
        ws.addImage(imageId, {
          tl: { col: 4.15, row: item.line.number - 1 + 0.08 },
          ext: { width: 42, height: 42 },
          editAs: "oneCell",
        });
        item.line.height = 48;
      } catch {
        cell.value = { text: "Xem ảnh", hyperlink: item.url };
        cell.font = { color: { argb: "FF0563C1" }, underline: true };
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );

  while (cursor < items.length) {
    const item = items[cursor];
    cursor += 1;
    item.line.getCell(5).value = { text: "Xem ảnh", hyperlink: item.url };
    item.line.getCell(5).font = {
      color: { argb: "FF0563C1" },
      underline: true,
    };
  }
}

async function buildComponentPriceWorkbook(quote, importRow, prices) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ERP ST";
  wb.created = new Date();

  const ws = wb.addWorksheet("Gia linh kien", {
    views: [{ state: "frozen", ySplit: 5 }],
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  ws.columns = [
    { key: "stt", width: 6 },
    { key: "line", width: 7 },
    { key: "designator", width: 22 },
    { key: "mpn", width: 28 },
    { key: "image", width: 10 },
    { key: "digikey", width: 22 },
    { key: "manufacturer", width: 22 },
    { key: "description", width: 44 },
    { key: "qty_req", width: 11 },
    { key: "qty_buy", width: 11 },
    { key: "moq", width: 9 },
    { key: "pack", width: 14 },
    { key: "unit_usd", width: 13 },
    { key: "total_usd", width: 15 },
    { key: "stock", width: 16 },
    { key: "available", width: 13 },
    { key: "lead", width: 12 },
    { key: "part_status", width: 16 },
    { key: "match", width: 18 },
    { key: "warnings", width: 40 },
  ];

  ws.mergeCells("A1:T1");
  const title = ws.getCell("A1");
  title.value = `GIÁ LINH KIỆN DIGIKEY - ${quote.quote_no || ""}`;
  title.font = { bold: true, size: 16, color: { argb: "FF0F766E" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 30;

  ws.mergeCells("A2:T2");
  ws.getCell("A2").value = `Khách hàng: ${quote.customer_name || ""}  |  Dự án: ${
    quote.project_name || ""
  }  |  Số board: ${quote.board_qty || 1}  |  Ngày: ${formatDate(
    importRow?.imported_at,
  )}`;
  ws.getCell("A2").alignment = { horizontal: "center" };
  ws.getCell("A2").font = { italic: true, color: { argb: "FF666666" } };

  ws.mergeCells("A3:T3");
  const source = importRow?.source === "auto" ? "Tự động MyLists API" : "Nhập file MyLists";
  ws.getCell("A3").value = `Nguồn: ${source}  |  MyList: ${
    importRow?.digikey_list_name || "—"
  }  |  Tỷ giá: ${Number(importRow?.exchange_rate) || 0} VND/USD`;
  ws.getCell("A3").alignment = { horizontal: "center" };
  ws.getCell("A3").font = { color: { argb: "FF666666" } };

  ws.mergeCells("A4:T4");
  const totalUsd = money(importRow?.total_usd);
  const referenceTotal = money(importRow?.reference_total_usd);
  const exchangeRate = Number(importRow?.exchange_rate) || 0;
  const pricedCount = (prices || []).filter(
    (row) => Number(row.extended_price_usd) > 0,
  ).length;
  const noPriceCount = Math.max(0, (prices || []).length - pricedCount);
  const nonStockTotal = money(
    (prices || [])
      .filter(
        (row) =>
          /non[- ]?stock/i.test(String(row.stock_status || "")) &&
          Number(row.extended_price_usd) > 0,
      )
      .reduce((sum, row) => sum + Number(row.extended_price_usd), 0),
  );
  const referenceText = referenceTotal
    ? `  |  Tham khảo ProductInformation: $${referenceTotal.toFixed(
        2,
      )} (không tính tổng)`
    : "";
  const nonStockText = nonStockTotal
    ? `  |  Non-Stock (không tính): $${nonStockTotal.toFixed(2)}`
    : "";
  ws.getCell("A4").value = `Tổng MyLists USD: $${totalUsd.toFixed(
    2,
  )}  |  Tổng VND: ${Math.round(totalUsd * exchangeRate).toLocaleString(
    "vi-VN",
  )} đ  |  Số dòng: ${(prices || []).length}  |  Có giá: ${pricedCount}  |  Không giá: ${noPriceCount}${referenceText}${nonStockText}`;
  ws.getCell("A4").alignment = { horizontal: "center" };
  ws.getCell("A4").font = { bold: true, color: { argb: "FF0F766E" } };

  const header = ws.addRow([
    "STT",
    "Dòng",
    "Designator",
    "MPN",
    "Ảnh",
    "DigiKey PN",
    "Manufacturer",
    "Description",
    "SL yêu cầu",
    "SL mua",
    "MOQ",
    "Pack",
    "Đơn giá USD",
    "Thành tiền USD",
    "Stock",
    "Tồn kho",
    "Lead",
    "Part status",
    "Match",
    "Cảnh báo",
  ]);
  header.number = 5;
  styleHeader(header);

  (prices || []).forEach((row, index) => {
    const line = ws.addRow([
      index + 1,
      row.line_no ?? "",
      row.reference_designator || "",
      row.mpn || row.requested_mpn || row.original_mpn || "",
      "",
      row.digikey_pn || "",
      row.manufacturer || "",
      row.description || "",
      Number(row.quantity_requested) || 0,
      Number(row.quantity_purchased) || 0,
      Number(row.moq) || 0,
      row.pack_type || row.selected_pack_type || "",
      money(row.unit_price_usd),
      money(row.extended_price_usd),
      row.stock_status || "",
      row.availability ?? row.quantity_available ?? "",
      row.lead_time || row.lead_weeks || "",
      row.part_status || "",
      row.match_status || "",
      warningsText(row.warnings),
    ]);
    line.eachCell((cell, col) => {
      const center = [1, 2, 5, 9, 10, 11, 16, 17].includes(col);
      const right = [13, 14].includes(col);
      styleCell(cell, center ? "center" : right ? "right" : "left");
    });
    line.getCell(13).numFmt = "$#,##0.0000";
    line.getCell(14).numFmt = "$#,##0.00";
  });

  await attachImages(wb, ws, prices || []);

  if (!(prices || []).length) {
    ws.mergeCells(`A7:T7`);
    const row = ws.getRow(7);
    row.getCell(1).value = "Chưa có dữ liệu giá linh kiện.";
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(1).font = { italic: true };
  }

  const warningSheet = wb.addWorksheet("Canh bao", {
    views: [{ state: "frozen", ySplit: 3 }],
  });
  warningSheet.columns = [
    { key: "stt", width: 6 },
    { key: "mpn", width: 28 },
    { key: "status", width: 20 },
    { key: "warnings", width: 70 },
  ];
  warningSheet.mergeCells("A1:D1");
  warningSheet.getCell("A1").value = "CẢNH BÁO GIÁ LINH KIỆN";
  warningSheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFB45309" } };
  warningSheet.getCell("A1").alignment = { horizontal: "center" };
  const warningHeader = warningSheet.addRow(["STT", "MPN", "Trạng thái", "Cảnh báo"]);
  styleHeader(warningHeader);
  const warningRows = (prices || []).filter(
    (row) =>
      (Array.isArray(row.warnings) && row.warnings.length) ||
      ["NO_MATCH", "MISSING_IN_LIST", "UNMATCHED", "NO_MPN", "NO_PRICE"].includes(
        String(row.match_status || ""),
      ),
  );
  warningRows.forEach((row, index) => {
    const line = warningSheet.addRow([
      index + 1,
      row.mpn || row.requested_mpn || row.original_mpn || "",
      row.match_status || "",
      warningsText(row.warnings),
    ]);
    line.eachCell((cell, col) => styleCell(cell, col === 1 ? "center" : "left"));
  });
  if (!warningRows.length) {
    warningSheet.mergeCells("A4:D4");
    warningSheet.getCell("A4").value = "Không có cảnh báo.";
    warningSheet.getCell("A4").alignment = { horizontal: "center" };
    warningSheet.getCell("A4").font = { italic: true };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = { buildComponentPriceWorkbook };
