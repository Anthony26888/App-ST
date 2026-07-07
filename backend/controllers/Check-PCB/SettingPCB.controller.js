const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const { project_id } = req.body;

    db.run(
      `INSERT INTO SettingPCB (
        project_id,
        manualOffsetX_top,
        manualOffsetY_top,
        manualOffsetX_bottom,
        manualOffsetY_bottom,
        width,
        height,
        edgeX,
        edgeY,
        angle
     )
     VALUES (?, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`,
      [project_id],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            error: "Database error",
            details: err.message,
          });
        }

        io.emit("SettingPCBUpdate");

        res.json({ message: "SettingPCB created" });
      },
    );
  },
  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
    const { id } = req.params;
    const {
      manualOffsetX_top,
      manualOffsetY_top,
      manualOffsetX_bottom,
      manualOffsetY_bottom,
      manualOffsetGerberX,
      manualOffsetGerberY,
      width,
      height,
      edgeX,
      edgeY,
      angle,
    } = req.body;
    db.run(
      `UPDATE SettingPCB
    SET 
      manualOffsetX_top = ?,
      manualOffsetY_top = ?,
      manualOffsetX_bottom = ?,
      manualOffsetY_bottom = ?,
      manualOffsetGerberX = ?,
      manualOffsetGerberY = ?,
      width = ?,
      height = ?,
      edgeX = ?,
      edgeY = ?,
      angle = ?
    WHERE project_id = ?`,
      [
        manualOffsetX_top,
        manualOffsetY_top,
        manualOffsetX_bottom,
        manualOffsetY_bottom,
        manualOffsetGerberX,
        manualOffsetGerberY,
        width,
        height,
        edgeX,
        edgeY,
        angle,
        id,
      ],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Database error", details: err.message });
        }
        io.emit("SettingPCBUpdate");
        res.json({ message: "Đã cập nhật cài đặt PCB" });
      },
    );
  },
});
