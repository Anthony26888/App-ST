const ExcelJS = require("exceljs");

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

  ws.mergeCells("A1:S1");
  const title = ws.getCell("A1");
  title.value = `GIÁ LINH KIỆN DIGIKEY - ${quote.quote_no || ""}`;
  title.font = { bold: true, size: 16, color: { argb: "FF0F766E" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 30;

  ws.mergeCells("A2:S2");
  ws.getCell("A2").value = `Khách hàng: ${quote.customer_name || ""}  |  Dự án: ${
    quote.project_name || ""
  }  |  Số board: ${quote.board_qty || 1}  |  Ngày: ${formatDate(
    importRow?.imported_at,
  )}`;
  ws.getCell("A2").alignment = { horizontal: "center" };
  ws.getCell("A2").font = { italic: true, color: { argb: "FF666666" } };

  ws.mergeCells("A3:S3");
  const source = importRow?.source === "auto" ? "Tự động MyLists API" : "Nhập file MyLists";
  ws.getCell("A3").value = `Nguồn: ${source}  |  MyList: ${
    importRow?.digikey_list_name || "—"
  }  |  Tỷ giá: ${Number(importRow?.exchange_rate) || 0} VND/USD`;
  ws.getCell("A3").alignment = { horizontal: "center" };
  ws.getCell("A3").font = { color: { argb: "FF666666" } };

  ws.mergeCells("A4:S4");
  const totalUsd = money(importRow?.total_usd);
  const exchangeRate = Number(importRow?.exchange_rate) || 0;
  ws.getCell("A4").value = `Tổng USD: $${totalUsd.toFixed(
    2,
  )}  |  Tổng VND: ${Math.round(totalUsd * exchangeRate).toLocaleString(
    "vi-VN",
  )} đ  |  Số dòng: ${importRow?.line_count || prices.length}  |  Có giá: ${
    importRow?.priced_count || 0
  }  |  Thiếu: ${importRow?.missing_count || 0}`;
  ws.getCell("A4").alignment = { horizontal: "center" };
  ws.getCell("A4").font = { bold: true, color: { argb: "FF0F766E" } };

  const header = ws.addRow([
    "STT",
    "Dòng",
    "Designator",
    "MPN",
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
      const center = [1, 2, 8, 9, 10, 15, 16].includes(col);
      const right = [12, 13].includes(col);
      styleCell(cell, center ? "center" : right ? "right" : "left");
    });
    line.getCell(12).numFmt = "$#,##0.0000";
    line.getCell(13).numFmt = "$#,##0.00";
  });

  if (!(prices || []).length) {
    ws.mergeCells(`A7:S7`);
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
