const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const { project_name, created_by, created_at, note } = req.body;

    const timestamps = formatDateLocal(created_at);

    const sql = `
      INSERT INTO FilterBomQC
      (
        project_name,
        created_by,
        created_at,
        note
      )
      VALUES (?,?,?,?)
    `;

    db.run(sql, [project_name, created_by, timestamps, note], function (err) {
      if (err) {
        console.error(err);

        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      io.emit("UpdateFilterBomQC");

      res.json({
        success: true,
        id: this.lastID,
        message: "Filter BomQC received",
      });
    });
  },

  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
    const { id } = req.params;

    const { project_name, created_at, created_by, note } = req.body;

    const timestamps = formatDateLocal(created_at);

    const sql = `
      UPDATE FilterBomQC
      SET
        project_name=?,
        created_at=?,
        created_by=?,
        note=?
      WHERE id=?
    `;

    db.run(
      sql,
      [project_name, timestamps, created_by, note, id],
      function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message,
          });
        }

        io.emit("UpdateFilterBomQC");

        res.json({
          success: true,
          message: "Update Success",
        });
      },
    );
  },

  // ============================
  // Delete Item
  // ============================
  deleteItem(req, res) {
    const { id } = req.params;

    db.run("DELETE FROM FilterBomQC WHERE id=?", [id], function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      io.emit("UpdateFilterBomQC");

      res.json({
        success: true,
        message: "Delete Success",
      });
    });
  },
});
