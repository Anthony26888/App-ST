const db = require("../../database.js");

module.exports = (io) => ({
  // ============================
  // Edit Item
  // ============================
  editItemStatus(req, res) {
    const { id } = req.params;
    db.run(
      `UPDATE PickplaceQC 
    SET 
      status = 'Done'
    WHERE id = ?`,
      [id],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Database error", details: err.message });
        }
        io.emit("CombineBomQCUpdate");
        res.json({ message: "Summary received" });
      },
    );
  },

  // ============================
  // Delete Item
  // ============================
  cancelItemStatus(req, res) {
    const { id } = req.params;
    db.run(
      `UPDATE PickplaceQC 
    SET 
      status = 'Waiting'
    WHERE id = ?`,
      [id],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Database error", details: err.message });
        }
        io.emit("CombineBomQCUpdate");
        res.json({ message: "Summary received" });
      },
    );
  },
  changeAllStatus(req, res) {
    const { id } = req.params;
    db.run(
      `UPDATE PickplaceQC 
    SET 
      status = 'Waiting'
    WHERE project_id = ?`,
      [id],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Database error", details: err.message });
        }
        io.emit("CombineBomQCUpdate");
        res.json({ message: "Summary received" });
      },
    );
  },
  editOffset(req, res) {
    const { id } = req.params;
    const { offsetX, offsetY, layer } = req.body;

    const ox = Number(offsetX) || 0;
    const oy = Number(offsetY) || 0;

    const query = `
    UPDATE PickplaceQC
    SET x = x + ?, y = y + ?
    WHERE project_id = ? AND layer = ?
  `;

    db.run(query, [ox, oy, id, layer], function (err) {
      if (err) {
        return res.status(500).json({ error: "Update failed" });
      }

      res.json({
        success: true,
        updatedRows: this.changes,
      });
      io.emit("CombineBomQCUpdate");
      io.emit("PnPFileQCUpdate");
    });
  },
  deleteItemPickplace(req, res) {
    const { id } = req.params;
    db.run(`DELETE FROM PickplaceQC WHERE project_id = ?`, [id], (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("CombineBomQCUpdate");
      res.json({ message: "Summary received" });
    });
  },
  deleteItemBom(req, res) {
    const { id } = req.params;
    db.run(`DELETE FROM BomQC WHERE project_id = ?`, [id], (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("CombineBomQCUpdate");
      res.json({ message: "Summary received" });
    });
  },
});
