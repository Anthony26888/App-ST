const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

module.exports = (io) => ({
  // ============================
  // Download file all Pickplace PCB
  // ============================
  async downloadPickplaceAll(req, res) {
    const { id } = req.params;
    try {
      const query = `
                      SELECT 
                          p.designator,
                          b.mpn,
                          b.description
                          p.layer,
                          p.x,
                          p.y,
                          p.rotation 
                      FROM Pickplace p
                      LEFT JOIN Bom b
                          ON p.designator = b.designator
                        AND p.project_id = b.project_id
                      WHERE p.project_id = ?`;

      db.all(query, [id], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        // Convert data to worksheet
        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, `pickp&place`);

        // Save the file temporarily
        const filePath = path.join(__dirname, `pick&place.xlsx`);
        xlsx.writeFile(wb, filePath);

        // Send the file to the client
        res.download(filePath, `pick&place.xlsx`, (err) => {
          if (err) console.error("Error sending file:", err);
          fs.unlinkSync(filePath); // Delete after sending
        });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ============================
  // Download Pickplace PCB Top
  // ============================
  async downloadPickplaceTop(req, res) {
    const { id } = req.params;
    try {
      const query = `
                      SELECT 
                          p.designator,
                          b.mpn,
                          p.layer,
                          p.x,
                          p.y,
                          p.rotation,
                          b.note 
                      FROM Pickplace p
                      LEFT JOIN Bom b
                          ON TRIM(LOWER(p.designator)) = TRIM(LOWER(b.designator))
                        AND p.project_id = b.project_id
                      WHERE p.project_id = ?
                        AND LOWER(TRIM(p.layer)) IN ('top', 'toplayer');`;

      db.all(query, [id], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        // Convert data to worksheet
        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, `pickp&place_top`);

        // Save the file temporarily
        const filePath = path.join(__dirname, `pick&place_top.xlsx`);
        xlsx.writeFile(wb, filePath);

        // Send the file to the client
        res.download(filePath, `pick&place_top.xlsx`, (err) => {
          if (err) console.error("Error sending file:", err);
          fs.unlinkSync(filePath); // Delete after sending
        });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ============================
  // Download Pickplace PCB Bottom
  // ============================
  async downloadPickplaceBottom(req, res) {
    const { id } = req.params;
    try {
      const query = `
                      SELECT 
                          p.designator,
                          b.mpn,
                          p.layer,
                          p.x,
                          p.y,
                          p.rotation,
                          b.note 
                      FROM Pickplace p
                      LEFT JOIN Bom b
                          ON TRIM(LOWER(p.designator)) = TRIM(LOWER(b.designator))
                        AND p.project_id = b.project_id
                      WHERE p.project_id = ?
                        AND LOWER(TRIM(p.layer)) IN ('bottom', 'bottomlayer');`;

      db.all(query, [id], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        // Convert data to worksheet
        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, `pickp&place_bottom`);

        // Save the file temporarily
        const filePath = path.join(__dirname, `pick&place_bottom.xlsx`);
        xlsx.writeFile(wb, filePath);

        // Send the file to the client
        res.download(filePath, `pick&place_bottom.xlsx`, (err) => {
          if (err) console.error("Error sending file:", err);
          fs.unlinkSync(filePath); // Delete after sending
        });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ============================
  // Download Bom Highlight PCB
  // ============================
  async downloadBomHighlight(req, res) {
    const { id } = req.params;

    // ===== NORMALIZE =====
    const normalize = (val) =>
      String(val || "")
        .replace(/\s+/g, "")
        .toUpperCase();

    // ===== REMOVE VIETNAMESE TONES =====
    const removeVietnameseTones = (str) => {
      return String(str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .trim()
        .toLowerCase();
    };

    // ===== PICKPLACE QUERY =====
    const ppQuery = `
    SELECT p.designator, LOWER(TRIM(p.layer)) as layer
    FROM Pickplace p
    WHERE p.project_id = ?
      AND LOWER(TRIM(p.layer)) IN ('bottom', 'bottomlayer')
  `;

    db.all(ppQuery, [id], async (err, ppRows) => {
      if (err) {
        return res.status(500).json(err);
      }

      // ===== MAP BOTTOM =====
      const bottomMap = new Map();

      ppRows.forEach((r) => {
        bottomMap.set(normalize(r.designator), true);
      });

      // ===== BOM QUERY =====
      const bomQuery = `
      SELECT 
          B.id,
          B.description,
          B.mpn,
          B.mpn2,
          B.mpn3,
          M.image AS image,
          CASE 
              WHEN M.mount_type IS NOT NULL THEN M.mount_type
              ELSE B.type
          END AS type,
          B.designator,
          B.quantity,
          B.project_id,
          B.note
      FROM BomHighlight B
      LEFT JOIN MPNMountType M
          ON TRIM(LOWER(B.mpn)) = TRIM(LOWER(M.mpn))
      WHERE B.project_id = ?
    `;

      db.all(bomQuery, [id], async (err, bomRows) => {
        if (err) {
          return res.status(500).json(err);
        }

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("BOM");

        // ===== OPTIONAL COLUMNS =====
        const hasMPN2 = bomRows.some(
          (r) => r.mpn2 && String(r.mpn2).trim() !== "",
        );

        const hasMPN3 = bomRows.some(
          (r) => r.mpn3 && String(r.mpn3).trim() !== "",
        );

        // ===== COLUMNS =====
        const columns = [
          {
            header: "STT",
            key: "stt",
            width: 8,
          },
          {
            header: "Designator",
            key: "designator",
            width: 35,
          },
          {
            header: "Description",
            key: "description",
            width: 55, // Tăng nhẹ chiều rộng để chứa được nhiều ảnh ngang hơn
          },
          {
            header: "MPN",
            key: "mpn",
            width: 30,
          },
        ];

        if (hasMPN2) {
          columns.push({
            header: "MPN2",
            key: "mpn2",
            width: 30,
          });
        }

        if (hasMPN3) {
          columns.push({
            header: "MPN3",
            key: "mpn3",
            width: 30,
          });
        }

        columns.push(
          {
            header: "QTY",
            key: "quantity",
            width: 10,
          },
          {
            header: "Note",
            key: "note",
            width: 20,
          },
        );

        ws.columns = columns;

        // ===== TITLE =====
        const title = req.query.title || "BOM HIGHLIGHT";
        ws.insertRow(1, [title]);
        ws.mergeCells(1, 1, 1, columns.length);

        const titleCell = ws.getCell("A1");
        titleCell.font = {
          name: "Times New Roman",
          size: 24,
          bold: true,
        };
        titleCell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };

        ws.getRow(1).height = 35;

        // ===== HEADER =====
        const headerRow = ws.getRow(2);
        headerRow.height = 25;

        for (let i = 1; i <= columns.length; i++) {
          const cell = headerRow.getCell(i);
          cell.font = {
            name: "Times New Roman",
            bold: true,
            size: 12,
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: "FFD9D9D9",
            },
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }

        // ===== DESCRIPTION COLUMN INDEX =====
        const descriptionColIndex =
          columns.findIndex((c) => c.key === "description") + 1;

        // ===== DATA =====
        bomRows.forEach((row, rowIndex) => {
          // ===== DESIGNATOR =====
          const original = String(row.designator || "");
          const parts = original.split(",").map((s) => s.trim());
          const richText = [];

          parts.forEach((p, index) => {
            const key = normalize(p);
            const isBottom = bottomMap.has(key);

            richText.push({
              text: p,
              font: {
                name: "Times New Roman",
                ...(isBottom
                  ? {
                      color: { argb: "FFFF0000" },
                      bold: true,
                    }
                  : {}),
              },
            });

            if (index < parts.length - 1) {
              richText.push({
                text: ", ",
                font: { name: "Times New Roman" },
              });
            }
          });

          // ===== ROW DATA =====
          const rowData = {
            stt: rowIndex + 1,
            designator: { richText },
            description: row.description || "",
            mpn: row.mpn || "",
            quantity: row.quantity || "",
            note: row.note || "",
          };

          if (hasMPN2) {
            rowData.mpn2 = row.mpn2 || "";
          }
          if (hasMPN3) {
            rowData.mpn3 = row.mpn3 || "";
          }

          const newRow = ws.addRow(rowData);
          const excelRow = rowIndex + 3;

          // ===== STYLE =====
          const noteValue = removeVietnameseTones(row.note);
          const typeValue = removeVietnameseTones(row.type);

          for (let i = 1; i <= columns.length; i++) {
            const cell = newRow.getCell(i);

            // BORDER
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };

            // FONT
            if (!cell.font || !cell.font.richText) {
              cell.font = {
                name: "Times New Roman",
                size: 11,
              };
            }

            // ALIGN
            cell.alignment = {
              vertical: "middle",
              horizontal: "left",
              wrapText: true,
            };

            // ===== COLOR RULE =====
            if (noteValue === "dnp") {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFEB9C" },
              };
            } else if (typeValue === "han tay") {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFC7CE" },
              };
            } else if (typeValue === "gap tay") {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFC6EFCE" },
              };
            }
          }

          // ===== INSERT ALL IMAGES IN DESCRIPTION =====
          if (row.image) {
            try {
              let imagePaths = [];

              // 1. Phân tách dữ liệu string dạng mảng JSON
              if (String(row.image).trim().startsWith("[")) {
                const parsed = JSON.parse(row.image);
                if (Array.isArray(parsed)) {
                  imagePaths = parsed;
                }
              } else if (String(row.image).trim() !== "") {
                imagePaths = [row.image]; // Fallback nếu dữ liệu chỉ là 1 đường dẫn đơn
              }

              // Lọc ra các đường dẫn file có tồn tại trên server
              const validImagePaths = imagePaths.filter(
                (img) => img && fs.existsSync(img),
              );

              if (validImagePaths.length > 0) {
                const descCell = ws.getCell(excelRow, descriptionColIndex);

                // Đẩy chữ xuống dưới bằng dòng trống để nhường chỗ cho ảnh phía trên
                descCell.value = "\n\n\n\n" + (row.description || "");
                descCell.alignment = {
                  vertical: "top",
                  horizontal: "left",
                  wrapText: true,
                };

                // Tự động tính toán chiều cao hàng dựa theo số dòng text hoặc kích thước ảnh
                const textLength = String(row.description || "").length;
                const estimatedLines = Math.ceil(textLength / 40);
                let rowHeight = Math.max(estimatedLines * 16, 75); // Tối thiểu 75 để vừa vặn khung ảnh
                ws.getRow(excelRow).height = rowHeight;

                // Duyệt mảng và chèn toàn bộ ảnh nối đuôi nhau hàng ngang
                validImagePaths.forEach((imagePath, imgIndex) => {
                  const ext = path
                    .extname(imagePath)
                    .replace(".", "")
                    .toLowerCase();

                  const imageId = wb.addImage({
                    filename: imagePath,
                    extension: ext || "png",
                  });

                  // Tọa độ X (cột) tăng dần cho mỗi ảnh để tránh đè chồng lên nhau
                  // Mỗi ảnh cách nhau một khoảng offset bằng 0.62 đơn vị cột Excel
                  const colOffset = 0.1 + imgIndex * 0.62;

                  ws.addImage(imageId, {
                    tl: {
                      col: descriptionColIndex - 1 + colOffset,
                      row: excelRow - 1 + 0.1,
                    },
                    ext: {
                      width: 150, // Kích thước cố định của mỗi ảnh (50x50)
                      height: 100,
                    },
                  });
                });
              }
            } catch (e) {
              console.log("Xử lý hình ảnh lỗi tại dòng " + excelRow + ":", e);
            }
          }
        });

        // ===== EXPORT =====
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="BOM_highlight.xlsx"',
        );

        await wb.xlsx.write(res);
        res.end();
      });
    });
  },
});
