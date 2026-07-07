const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

module.exports = (io) => ({
  // ============================
  // Upload file xlsx Bom and Pickplace
  // ============================
  uploadBomQc(req, res) {
    const projectId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        error: "Chưa chọn file BOM",
      });
    }

    const filePath = req.file.path;

    try {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
        blankrows: false,
      });

      db.serialize(() => {
        const stmtBom = db.prepare(`
        INSERT INTO BomQC
        (
          description,
          mpn,
          designator,
          quantity,
          project_id,
          note
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `);

        rows.forEach((row) => {
          stmtBom.run(
            row.Description || "",
            row.MPN || row.Comment || "",
            row["Reference(s)"] || row.Designator || "",
            Number(row.Quantity || row.QTY || row.qty || 1),
            projectId,
            row.note || row.Note || row.notes || row.Notes || "",
          );
        });

        stmtBom.finalize((err) => {
          // Xóa file upload tạm
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          if (err) {
            console.error("Finalize BOM:", err);
            return res.status(500).json({
              error: "Finalize BOM lỗi",
            });
          }

          io.emit("RawBomQCUpdate");
          io.emit("CombineBomQCUpdate");

          return res.status(200).json({
            message: "Upload BOM thành công",
            inserted: rows.length,
          });
        });
      });
    } catch (err) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.error("Upload BOM:", err);

      return res.status(500).json({
        error: "Lỗi xử lý file BOM",
        details: err.message,
      });
    }
  },

  // ============================
  // Edit Item
  // ============================
  async uploadPickplaceQc(req, res) {
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
          mpn: row.MPN || row.mpn || "",
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
          INSERT INTO PickplaceQC (designator, layer, mpn, x, y, rotation, project_id, status, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Waiting', ?)
        `);

          for (const r of uniqueRows) {
            stmt.run(
              r.designator,
              r.layer,
              r.mpn,
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
      io.emit("CombineBomQCUpdate", { project_id: id });

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
  // Upload file PDF Top and Bottom
  // ============================
  uploadFileTop(req, res) {
    const { id } = req.params;
    // Tên file sau khi upload
    const file = req.file ? `uploads/qc/${req.file.filename}` : null;

    db.run(
      `UPDATE SettingPCBQC
       SET fileTop = ?
       WHERE project_id = ?`,
      [file, id],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: "Database error",
            details: err.message,
          });
        }

        io.emit("SettingPCBQCUpdate");
        io.emit("CombineBomQCUpdate");

        res.json({
          success: true,
          file,
        });
      },
    );
  },
  uploadFileBottom(req, res) {
    const { id } = req.params;
    // Tên file sau khi upload
    const file = req.file ? `uploads/qc/${req.file.filename}` : null;

    db.run(
      `UPDATE SettingPCBQC
       SET fileBottom = ?
       WHERE project_id = ?`,
      [file, id],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: "Database error",
            details: err.message,
          });
        }

        io.emit("SettingPCBQCUpdate");
        io.emit("CombineBomQCUpdate");

        res.json({
          success: true,
          file,
        });
      },
    );
  },

  // ============================
  // Upload file picture Top and Bottom
  // ============================
  uploadImageSampleTop(req, res) {
    const { id } = req.params;
    // Tên file sau khi upload
    const image = req.file ? `uploads/qc/${req.file.filename}` : null;

    db.run(
      `UPDATE SettingPCBQC
       SET imageSampleTop = ?
       WHERE project_id = ?`,
      [image, id],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: "Database error",
            details: err.message,
          });
        }

        io.emit("SettingPCBUpdate");
        io.emit("CombineBomQCUpdate");

        res.json({
          success: true,
          image,
        });
      },
    );
  },
  uploadImageSampleBottom(req, res) {
    const { id } = req.params;
    // Tên file sau khi upload
    const image = req.file ? `uploads/qc/${req.file.filename}` : null;

    db.run(
      `UPDATE SettingPCBQC
       SET imageSampleBottom = ?
       WHERE project_id = ?`,
      [image, id],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: "Database error",
            details: err.message,
          });
        }

        io.emit("SettingPCBUpdate");
        io.emit("CombineBomQCUpdate");

        res.json({
          success: true,
          image,
        });
      },
    );
  },
});
