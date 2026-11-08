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
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } };
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

async function buildQuoteWorkbook(quote, items, costLines) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ERP ST";
  wb.created = new Date();

  const ws = wb.addWorksheet("Bao gia", {
    views: [{ state: "frozen", ySplit: 7 }],
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  ws.columns = [
    { key: "stt", width: 6 },
    { key: "designator", width: 20 },
    { key: "mpn", width: 26 },
    { key: "description", width: 42 },
    { key: "package", width: 14 },
    { key: "qty", width: 10 },
    { key: "pad", width: 9 },
    { key: "process", width: 12 },
    { key: "unit", width: 8 },
    { key: "price", width: 14 },
    { key: "total", width: 16 },
    { key: "note", width: 18 },
  ];

  ws.mergeCells("A1:L1");
  const title = ws.getCell("A1");
  title.value = "BÁO GIÁ GIA CÔNG";
  title.font = { bold: true, size: 18, color: { argb: "FF7C2D12" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 32;

  const infoRows = [
    ["Số báo giá:", quote.quote_no || "", "Ngày tạo:", formatDate(quote.created_at)],
    ["Khách hàng:", quote.customer_name || "", "Hiệu lực:", formatDate(quote.valid_until)],
    ["Dự án:", quote.project_name || "", "Số lượng board:", quote.board_qty || 0],
    ["Điều khoản:", quote.payment_terms || "", "Thời gian giao:", quote.lead_time || ""],
  ];
  infoRows.forEach((values, index) => {
    const row = ws.addRow(values);
    row.height = 20;
    ws.mergeCells(`B${row.number}:C${row.number}`);
    row.getCell(1).font = { bold: true };
    row.getCell(3).font = { bold: true };
    row.getCell(4).alignment = { horizontal: "right" };
    row.eachCell((cell) => {
      cell.alignment = cell.alignment || { vertical: "middle" };
    });
  });

  ws.addRow([]);

  const headerRow = ws.addRow([
    "STT",
    "Designator",
    "MPN",
    "Description",
    "Package",
    "SL/board",
    "Số pad",
    "Quy trình",
    "ĐVT",
    "Đơn giá",
    "Thành tiền",
    "Ghi chú",
  ]);
  styleHeader(headerRow);

  let index = 1;
  (items || []).forEach((item) => {
    const row = ws.addRow([
      index++,
      item.designator || "",
      item.mpn || "",
      item.description || "",
      item.package || "",
      Number(item.quantity_per_board) || 0,
      Number(item.pad_count) || 0,
      item.process_code || "",
      item.unit || "",
      Number(item.unit_price) || 0,
      Number(item.line_total) || 0,
      item.dnp ? "DNP - không tính chi phí" : item.note || "",
    ]);
    row.height = 22;
    row.eachCell((cell, col) => {
      const align = [1, 5, 6, 7, 8, 9].includes(col) ? "center" : col >= 10 ? "right" : "left";
      styleCell(cell, align);
    });
    row.getCell(10).numFmt = "#,##0";
    row.getCell(11).numFmt = "#,##0";
  });

  if ((costLines || []).length) {
    const feeHeader = ws.addRow(["", "PHÍ CẤP BÁO GIÁ", "", "", "", "", "", "", "", "", "", ""]);
    ws.mergeCells(`B${feeHeader.number}:L${feeHeader.number}`);
    feeHeader.getCell(2).font = { bold: true, color: { argb: "FF7C2D12" } };
    feeHeader.getCell(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF7ED" },
    };
    feeHeader.eachCell((cell) => {
      cell.border = BORDER;
    });

    costLines.forEach((fee) => {
      const row = ws.addRow(["", fee.name || "", "", "", "", "", "", "", "", "", Number(fee.amount) || 0, fee.note || ""]);
      row.eachCell((cell, col) => styleCell(cell, col >= 11 ? "right" : "left"));
      row.getCell(11).numFmt = "#,##0";
    });
  }

  const totalRows = [
    ["", "Tạm tính", "", "", "", "", "", "", "", "", Number(quote.subtotal) || 0, ""],
    ["", "Chiết khấu", "", "", "", "", "", "", "", "", Number(quote.discount_value) || 0, ""],
    ["", `VAT (${Number(quote.vat_percent) || 0}%)`, "", "", "", "", "", "", "", "", "", ""],
    ["", "TỔNG CỘNG", "", "", "", "", "", "", "", "", Number(quote.total) || 0, ""],
  ];
  totalRows.forEach((values, i) => {
    const row = ws.addRow(values);
    ws.mergeCells(`B${row.number}:J${row.number}`);
    row.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
    row.getCell(2).font = { bold: true };
    row.getCell(11).numFmt = "#,##0";
    row.getCell(11).alignment = { horizontal: "right", vertical: "middle" };
    row.eachCell((cell) => {
      cell.border = BORDER;
    });
    if (i === totalRows.length - 1) {
      row.getCell(2).font = { bold: true, size: 12, color: { argb: "FF7C2D12" } };
      row.getCell(11).font = { bold: true, size: 12, color: { argb: "FF7C2D12" } };
      row.getCell(11).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF7ED" },
      };
    }
  });

  ws.addRow([]);
  if (quote.note) {
    const noteRow = ws.addRow(["Ghi chú:", quote.note]);
    ws.mergeCells(`B${noteRow.number}:L${noteRow.number}`);
    noteRow.getCell(1).font = { bold: true };
    noteRow.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function buildUnmappedWorkbook(quote, items) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ERP ST";
  const ws = wb.addWorksheet("Linh kien chua mapping", {
    views: [{ state: "frozen", ySplit: 3 }],
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  ws.columns = [
    { key: "stt", width: 6 },
    { key: "designator", width: 20 },
    { key: "mpn", width: 28 },
    { key: "description", width: 44 },
    { key: "package", width: 14 },
    { key: "mount", width: 12 },
    { key: "qty", width: 10 },
    { key: "group", width: 18 },
    { key: "price", width: 14 },
    { key: "source", width: 18 },
    { key: "confidence", width: 12 },
    { key: "warnings", width: 40 },
  ];

  ws.mergeCells("A1:L1");
  const title = ws.getCell("A1");
  title.value = `LINH KIỆN CHƯA MAPPING - ${quote.quote_no || ""}`;
  title.font = { bold: true, size: 16, color: { argb: "FF7C2D12" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 30;
  ws.mergeCells("A2:L2");
  ws.getCell("A2").value = `Khách hàng: ${quote.customer_name || ""}  |  Dự án: ${quote.project_name || ""}  |  Ngày: ${formatDate(quote.created_at)}`;
  ws.getCell("A2").alignment = { horizontal: "center" };
  ws.getCell("A2").font = { italic: true, color: { argb: "FF666666" } };

  const header = ws.addRow([
    "STT", "Designator", "MPN", "Description", "Package", "Mount",
    "SL/board", "Nhóm giá", "Đơn giá", "Nguồn", "Confidence", "Cảnh báo",
  ]);
  styleHeader(header);

  const list = (items || []).filter(
    (item) => Number(item.needs_review) === 1 || !item.group_code,
  );

  list.forEach((item, index) => {
    const warnings = (() => {
      try {
        const parsed = JSON.parse(item.warnings || "[]");
        return Array.isArray(parsed) ? parsed.join(", ") : item.warnings || "";
      } catch {
        return item.warnings || "";
      }
    })();

    const row = ws.addRow([
      index + 1,
      item.designator || "",
      item.mpn || item.raw_mpn || "",
      item.description || "",
      item.package || "",
      item.mount_type || "",
      Number(item.quantity_per_board) || 0,
      item.group_name || item.group_code || "",
      Number(item.unit_price) || 0,
      item.match_method || "",
      Number(item.confidence) || 0,
      warnings,
    ]);
    row.eachCell((cell, col) => {
      styleCell(cell, [1, 6, 7, 11].includes(col) ? "center" : col === 9 ? "right" : "left");
    });
    row.getCell(9).numFmt = "#,##0";
    row.getCell(11).numFmt = "0%";
  });

  if (list.length === 0) {
    ws.mergeCells(`A${header.number + 1}:L${header.number + 1}`);
    const row = ws.getRow(header.number + 1);
    row.getCell(1).value = "Tất cả linh kiện đã được mapping.";
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(1).font = { italic: true };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = {
  buildQuoteWorkbook,
  buildUnmappedWorkbook,
};
