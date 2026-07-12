const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    let {
      PartNumber,
      HistoryID,
      Status,
      Note,
      PlanID,
      Type,
      Quantity,
      Surface,
      Timestamp,
    } = req.body;

    Quantity = Number(Quantity) || 1;

    const Timestamps = formatDateLocal(Timestamp);

    db.run(
      `INSERT INTO ManufactureCounting
    (
      PartNumber,
      HistoryID,
      Timestamp,
      Status,
      Note,
      PlanID,
      Type,
      Quantity,
      Surface
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        PartNumber,
        HistoryID,
        Timestamps,
        Status,
        Note,
        PlanID,
        Type,
        Quantity,
        Surface,
      ],
      (err) => {
        if (err) {
          console.error("Database error:", err);

          return res.status(500).json({
            error: "Database error",
            details: err.message,
          });
        }

        io.emit("UpdateManufactureCounting");
        io.emit("UpdateManufactureFail");
        io.emit("UpdateHistoryFiltered", { PlanID, Type });
        io.emit("UpdateManufactureSummary", { PlanID, Type });
        io.emit("UpdateManufactureRW", { PlanID, Type });
        io.emit("UpdateSummaryFail");
        io.emit("updateManufactureDetails", PlanID);
        io.emit("UpdateHistory");
        io.emit("updateHistoryPart");
        io.emit("UpdateSummary");
        io.emit("ActivedUpdate");
        io.emit("updateDetailProjectPO");

        res.json({ message: "Summary received" });
      },
    );
  },

  // ============================
  // Delete Item History
  // ============================
  deleteItemHistory(req, res) {
    const { id } = req.params;
    const { PlanID, Type } = req.query;
    const query = `
    DELETE FROM ManufactureCounting
    WHERE id = ?
  `;
    db.run(query, [id], function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("UpdateManufactureCounting");
      io.emit("UpdateHistoryFiltered", { PlanID, Type });
      io.emit("UpdateManufactureSummary", { PlanID, Type });
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      io.emit("updateDetailProjectPO");
      res.json({ message: "Đã xoá dữ liệu sản xuất thành công" });
    });
  },
});
