const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

module.exports = (io) => ({
  // ============================
  // Upload file xlsx Bom PCB
  // ============================
  async uploadBomPCB(req, res) {
    const { project_id } = req.params;

    try {
      const bomFile = req.file;

      if (!bomFile) {
        return res.status(400).json({
          error: "Thiếu file BOM",
        });
      }

      // --- 1️⃣ Đọc file Excel
      const workbook = xlsx.readFile(bomFile.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
        blankrows: false,
      });

      // --- 2️⃣ Lưu dữ liệu vào SQLite
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          const stmtBom = db.prepare(`
          INSERT INTO Bom
          (description, mpn, designator, quantity, project_id, note)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

          const stmtHighlight = db.prepare(`
          INSERT INTO BomHighlight
          (description, mpn, mpn2, mpn3, type, designator, quantity, project_id, note)
          VALUES (?, ?, ?, ?, 'SMT', ?, ?, ?, ?)
        `);

          const insertedRefs = new Set();

          rows.forEach((row) => {
            const refs = String(row["Reference(s)"] || row.Designator || "")
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean);

            refs.forEach((ref) => {
              if (insertedRefs.has(ref)) return;

              const mpnValue = String(row.MPN || row.Comment || "")
                .replace(/\s+/g, "")
                .replace(/,/g, ".");

              stmtBom.run(
                row.Description || "",
                mpnValue,
                ref,
                1,
                project_id,
                row.note || row.Note || row.notes || row.Notes || "",
              );

              insertedRefs.add(ref);
            });

            stmtHighlight.run(
              row.Description || "",
              row.MPN || "",
              row.MPN2 || "",
              row.MPN3 || "",
              row["Reference(s)"] || row.Designator || "",
              Number(row.Quantity || row.QTY || row.Qty || row.qty || 1),
              project_id,
              row.Note || row.note || row.Notes || row.notes || "",
            );
          });

          stmtBom.finalize((err) => {
            if (err) return reject(err);

            stmtHighlight.finalize((err2) => {
              if (err2) return reject(err2);

              resolve();
            });
          });
        });
      });

      // --- 3️⃣ Xóa file upload
      if (fs.existsSync(bomFile.path)) {
        fs.unlinkSync(bomFile.path);
      }

      // --- 4️⃣ Emit sau khi DB ghi xong
      io.emit("CombineBomUpdate", { project_id });
      io.emit("BomHighlightUpdate", { project_id });
      io.emit("RawBomHighlightUpdate", { project_id });
      io.emit("BomRawHighlightUpdate", { project_id });

      // --- 5️⃣ Response
      res.json({
        message: "Upload BOM + Highlight thành công",
        totalRows: rows.length,
      });
    } catch (error) {
      // Xóa file nếu có lỗi
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Lỗi upload BOM:", error);

      res.status(500).json({
        error: "Lỗi xử lý file BOM",
        details: error.message,
      });
    }
  },

  // ============================
  // Upload Pickplace PCB
  // ============================
  async uploadPickplacePCB(req, res) {
    const { id } = req.params;

    try {
      const ppFile = req.file;
      if (!ppFile) {
        return res.status(400).json({ error: "Thiếu file Pick&Place" });
      }

      // --- 1️⃣ Đọc file Excel
      const workbook = xlsx.readFile(ppFile.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const ppData = xlsx.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
        blankrows: false,
      });

      // --- 2️⃣ Chuyển đổi và lọc dữ liệu
      const uniqueRows = [];
      const seenRefs = new Set();
      for (const row of ppData) {
        const designator = (row.Ref || row.Designator)?.trim();
        if (!designator || seenRefs.has(designator)) continue;
        seenRefs.add(designator);

        uniqueRows.push({
          designator,
          layer: row.Side || row.Layer || "" || row.side || row.layer,
          posX: parseFloat(row.PosX || 0 || row.posx || row.X || row.x),
          posY: parseFloat(row.PosY || 0 || row.posy || row.Y || row.y),
          rotation: parseFloat(
            row.Rotation || 0 || row.rotation || row.R || row.r,
          ),
          project_id: id,
          note: row.note || "",
        });
      }

      // --- 3️⃣ Chèn dữ liệu vào SQLite và CHỜ hoàn tất
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          const stmt = db.prepare(`
          INSERT INTO Pickplace (designator, layer, x, y, rotation, project_id, type, note)
          VALUES (?, ?, ?, ?, ?, ?, 'SMT', ?)
        `);

          for (const r of uniqueRows) {
            stmt.run(
              r.designator,
              r.layer,
              r.posX,
              r.posY,
              r.rotation,
              r.project_id,
              r.note,
            );
          }

          stmt.finalize((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });

      // --- 4️⃣ Xóa file tạm
      fs.unlinkSync(ppFile.path);

      // --- 5️⃣ Emit chỉ sau khi DB insert hoàn tất
      io.emit("CombineBomUpdate", { project_id: id });
      io.emit("BomHighlightUpdate", { project_id: id });
      io.emit("RawBomHighlightUpdate", { project_id: id });
      io.emit("MPNMountTypeUpdate", { project_id: id });

      // --- 6️⃣ Gửi phản hồi
      res.json({
        message: "Pick&Place đã upload & lưu thành công (Excel, mils → mm)",
        inserted: uniqueRows.length,
      });
    } catch (error) {
      console.error("Lỗi xử lý Pick&Place:", error);
      res.status(500).json({ error: "Lỗi xử lý file Pick&Place (Excel)" });
    }
  },

  // ============================
  // Upload Bom Highlight
  // ============================
  async uploadBomHighlight(req, res) {
    const { id } = req.params;
    const { created_by } = req.body;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Không tìm thấy file upload",
        });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return res.status(400).json({
          success: false,
          error: "Không tìm thấy sheet đầu tiên",
        });
      }

      // 👇 LOG SAU KHI KIỂM TRA SHEET

      if (!worksheet) {
        return res.status(400).json({
          success: false,
          error: "Không tìm thấy sheet đầu tiên",
        });
      }

      // =========================
      // CREATE IMAGE DIR
      // =========================
      const uploadDir = path.join(process.cwd(), "uploads", "bomhighlight");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // =========================
      // MAP IMAGES
      // =========================
      const imageMap = {};

      worksheet.getImages().forEach((img) => {
        try {
          const rowNumber = img.range.tl.nativeRow + 1;

          const media = workbook.model.media.find(
            (m) => m.index === img.imageId,
          );

          if (!media) return;

          const fileName = `${crypto.randomUUID()}.${media.extension}`;
          const filePath = path.join(uploadDir, fileName);

          fs.writeFileSync(filePath, media.buffer);

          if (!imageMap[rowNumber]) imageMap[rowNumber] = [];

          imageMap[rowNumber].push(`uploads/bomhighlight/${fileName}`);
        } catch (err) {
          console.error("Lỗi lưu hình:", err);
        }
      });

      // =========================
      // HEADER MAPPING (FIX ALL CASES)
      // =========================
      const normalize = (str) => str?.toString().trim().toLowerCase();

      const aliasMap = {
        mpn: ["mpn", "part number", "part_no", "partno"],
        description: ["description", "desc", "item description"],
        qty: ["qty", "quantity", "quanity"],
      };

      const header = {};

      worksheet.getRow(1).eachCell((cell, colNumber) => {
        const key = normalize(cell.value);
        if (!key) return;

        Object.keys(aliasMap).forEach((field) => {
          if (aliasMap[field].includes(key)) {
            header[field] = colNumber;
          }
        });
      });

      console.log("HEADER MAP:", header);

      // =========================
      // SAFE GET VALUE
      // =========================
      const getVal = (cell) => {
        if (!cell) return null;
        if (cell.value == null) return null;

        if (typeof cell.value === "object" && cell.value.text) {
          return cell.value.text.toString().trim();
        }

        return cell.value.toString().trim();
      };

      // =========================
      // READ ROWS
      // =========================
      const insertRows = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const mpn = getVal(row.getCell(header.mpn));
        const description = getVal(row.getCell(header.description));
        const qty = getVal(row.getCell(header.qty));

        if (!mpn) return;

        let mount_type = null;

        const fillColor = row.getCell(1).fill?.fgColor?.argb || "";

        if (fillColor === "FFFFC7CE") {
          mount_type = "Hàn tay";
        } else if (fillColor === "FFC6EFCE") {
          mount_type = "Gắp tay";
        }

        const imagePaths = imageMap[rowNumber] || [];

        if (!mount_type && imagePaths.length > 0) {
          mount_type = "SMT";
        }

        if (!mount_type && imagePaths.length === 0) return;

        insertRows.push({
          mpn,
          description,
          qty,
          image: JSON.stringify(imagePaths),
          mount_type,
        });
      });

      // =========================
      // DB UPSERT
      // =========================
      const stmt = db.prepare(`
        INSERT INTO MPNMountType
        (
          mpn,
          mount_type,
          description,
          image,
          project_id,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(mpn)
        DO UPDATE SET
          mount_type = excluded.mount_type,
          description = excluded.description,
          image = excluded.image,
          project_id = excluded.project_id,
          created_by = excluded.created_by
      `);

      insertRows.forEach((item) => {
        stmt.run(
          item.mpn,
          item.mount_type,
          item.description,
          item.image,
          id,
          created_by,
        );
      });

      stmt.finalize();

      // =========================
      // CLEAN TEMP FILE
      // =========================
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // =========================
      // SOCKET UPDATE
      // =========================
      io.emit("MPNMountTypeUpdate");
      io.emit("CombineBomUpdate");
      io.emit("BomHighlightUpdate");
      io.emit("RawBomHighlightUpdate");
      io.emit("BomRawHighlightUpdate");

      // =========================
      // RESPONSE
      // =========================
      res.json({
        success: true,
        imported: insertRows.length,
        header_map: header,
      });
    } catch (err) {
      console.error(err);

      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  },
});
