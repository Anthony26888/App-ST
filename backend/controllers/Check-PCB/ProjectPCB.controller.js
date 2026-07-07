const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const { project_name, created_by, created_at, note } = req.body;

    const timestamps = formatDateLocal(created_at);

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

        io.emit("UpdateFilterBom");

        res.json({
          message: "Filter Bom received",
          id: insertedId, // 👈 trả về id
        });
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
