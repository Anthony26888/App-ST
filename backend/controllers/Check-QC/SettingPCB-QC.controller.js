const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const { project_id } = req.body;

    db.run(
      `INSERT INTO SettingPCBQC (
        project_id,
        width,
        height
     )
     VALUES (?, 0, 0)`,
      [project_id],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            error: "Database error",
            details: err.message,
          });
        }

        io.emit("SettingPCBQCUpdate");
        io.emit("CombineBomQCUpdate");

        res.json({ message: "SettingPCB created" });
      },
    );
  },

  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
    const { id } = req.params;
    const { width, height } = req.body;
    db.run(
      `UPDATE SettingPCBQC
     SET width = ?,
         height = ?
     WHERE project_id = ?`,
      [Number(width), Number(height), id],
      function (err) {
        if (err) {
          console.error("SQLite Error:", err);

          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }
        io.emit("SettingPCBQCUpdate");
        io.emit("CombineBomQCUpdate");

        res.json({
          success: true,
          changes: this.changes,
        });
      },
    );
  },

  applyAlign(req, res) {
    const { id } = req.params;
    const { fiducialBL, fiducialTR, fiducialTL, fiducialBR } = req.body;
    db.run(
      `UPDATE SettingPCBQC
   SET fiducialBL = ?,
       fiducialTR = ?,
       fiducialTL = ?,
       fiducialBR = ?
   WHERE project_id = ?`,
      [
        JSON.stringify(fiducialBL),
        JSON.stringify(fiducialTR),
        JSON.stringify(fiducialTL),
        JSON.stringify(fiducialBR),
        Number(id),
      ],
      function (err) {
        if (err) {
          console.error("DB ERROR:", err);
          return res.status(500).json(err);
        }
        res.json({
          success: true,
          changes: this.changes,
        });
      },
    );
  },
  deleteItem(req, res) {
    const { id } = req.params;
    db.run(
      `UPDATE SettingPCBQC 
      SET 
      width = 0, 
      height = 0,
      fileTop = '',
      fileBottom = '',
      fiducialBL = '',
      fiducialBR = '',
      fiducialTL = '',
      fiducialTR = ''
      WHERE project_id = ?`,
      [id],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Database error", details: err.message });
        }
        io.emit("SettingPCBQCUpdate");
        res.json({ message: "Summary received" });
      },
    );
  },
});
