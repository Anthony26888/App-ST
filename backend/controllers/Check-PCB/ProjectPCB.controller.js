const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng
const { atUseLimit } = require("../../middleware/license.js");

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const { project_name, created_by, created_at, note } = req.body;

    const timestamps = formatDateLocal(created_at);

    // Kiểm tra lượt dùng license trước khi thêm (chặn cả phía server)
    db.get(
      `SELECT License, LicenseUse, ProjectCount, UploadCount FROM Users WHERE Username = ?`,
      [created_by],
      (errUser, user) => {
        if (errUser) {
          console.error("Database error:", errUser);
          return res
            .status(500)
            .json({ error: "Database error", details: errUser.message });
        }

        if (user) {
          if (atUseLimit(user)) {
            return res.status(403).json({
              error:
                "Bạn đã hết lượt tạo dự án. Vui lòng nâng cấp để tiếp tục.",
            });
          }
        }

        db.run(
          `INSERT INTO FilterBom (project_name, created_by, created_at, note)
         VALUES (?, ?, ?, ?)`,
          [project_name, created_by, timestamps, note],
          function (err) {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({
                error: "Database error",
                details: err.message,
              });
            }

            const insertedId = this.lastID; // 🔥 QUAN TRỌNG

            // Trừ lượt tạo dự án (không trả lại khi xoá) + tăng số đã dùng
            if (created_by) {
              db.run(
                `UPDATE Users SET ProjectCount = COALESCE(ProjectCount, 0) + 1,
                   LicenseUse = CASE WHEN LicenseUse IS NULL THEN NULL
                                     ELSE COALESCE(LicenseUse, 0) - 1 END
                 WHERE Username = ?`,
                [created_by],
                () => {
                  // Kiểm tra nếu LicenseUse về 0 → reset về Starter
                  db.get(
                    `SELECT LicenseUse FROM Users WHERE Username = ?`,
                    [created_by],
                    (err2, row) => {
                      if (!err2 && row && (row.LicenseUse ?? 1) <= 0) {
                        db.run(
                          `UPDATE Users SET License = 'Starter', LicenseKey = NULL, LicenseUse = NULL WHERE Username = ?`,
                          [created_by],
                          () => {
                            io.emit("UpdateLicense");
                          }
                        );
                      } else {
                        io.emit("UpdateLicense");
                      }
                    }
                  );
                }
              );
            }

            io.emit("UpdateFilterBom");

            res.json({
              message: "Filter Bom received",
              id: insertedId, // 👈 trả về id
            });
          },
        );
      },
    );
  },

  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
    const { id } = req.params;
    const { project_name, created_at, created_by, note } = req.body;
    const Timestamps = formatDateLocal(created_at);
    db.run(
      `UPDATE FilterBom 
    SET 
      project_name = ?, 
      created_at = ?,
      created_by = ?,
      note = ?
    WHERE id = ?`,
      [project_name, Timestamps, created_by, note, id],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Database error", details: err.message });
        }
        io.emit("UpdateFilterBom");
        res.json({ message: "Summary received" });
      },
    );
  },

  // ============================
  // Delete Item
  // ============================
  deleteItem(req, res) {
    const { id } = req.params;
    // Insert data into SQLite database
    const query = `
    DELETE FROM FilterBom WHERE id = ?
  `;
    db.run(query, [id], function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("UpdateFilterBom");
      res.json({ message: "Đã xoá dữ liệu Bom thành công" });
    });
  },
});
