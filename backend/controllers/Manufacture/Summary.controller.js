const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const {
      Type,
      PlanID,
      PONumber,
      Category,
      Line_SMT,
      Quantity_Plan,
      CycleTime_Plan,
      Time_Plan,
      Note,
      Timestamp,
      Surface,
    } = req.body;
    // Convert date local
    const formattedDate = formatDateLocal(Timestamp);

    db.run(
      `INSERT INTO Summary (Type, PlanID, PONumber, Category, Line_SMT, Quantity_Plan, CycleTime_Plan, Time_Plan, Note, Created_At, Surface)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Type,
        PlanID,
        PONumber,
        Category,
        Line_SMT,
        Quantity_Plan,
        CycleTime_Plan,
        Time_Plan,
        Note,
        formattedDate,
        Surface,
      ],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Database error", details: err.message });
        }
        io.emit("UpdateHistoryFiltered", { PlanID, Type });
        io.emit("UpdateManufactureSummary", { PlanID, Type });
        io.emit("UpdateManufactureRW", { PlanID, Type });
        io.emit("UpdateManufactureCounting");
        io.emit("updateManufactureDetails");
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
  // Edit Item
  // ============================
  editItem(req, res) {
    const {
      Type,
      PlanID,
      PONumber,
      Category,
      Line_SMT,
      Quantity_Plan,
      CycleTime_Plan,
      Time_Plan,
      Note,
      Timestamp,
      Surface,
    } = req.body;
    const { id } = req.params;
    // Convert date local
    const formattedDate = formatDateLocal(Timestamp);

    db.run(
      `UPDATE Summary
      SET Type=?, PONumber=?, Category=?, Line_SMT=?, Quantity_Plan=?, CycleTime_Plan=?, Time_Plan=?, Note=?, Created_At=?, Surface=?
      WHERE id=?`,
      [
        Type,
        PONumber,
        Category,
        Line_SMT,
        Quantity_Plan,
        CycleTime_Plan,
        Time_Plan,
        Note,
        formattedDate,
        Surface,
        id,
      ],
      (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        io.emit("UpdateManufactureCounting");
        io.emit("updateManufactureDetails");
        io.emit("UpdateHistory");
        io.emit("updateHistoryPart");
        io.emit("UpdateSummary");
        io.emit("ActivedUpdate");
        io.emit("updateDetailProjectPO");
        io.emit("UpdateHistoryFiltered", { PlanID, Type });
        io.emit("UpdateManufactureSummary", { PlanID, Type });
        io.emit("UpdateManufactureRW", { PlanID, Type });

        res.json({ message: "Summary received" });
      },
    );
  },

  // ============================
  // Delete Item
  // ============================
  deleteItem(req, res) {
    const { id } = req.params;
    const { Type, PlanID } = req.query;

    // Insert data into SQLite database
    const query = `
    DELETE FROM Summary WHERE id = ?
  `;
    db.run(query, [id], function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("UpdateManufactureCounting");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      io.emit("updateDetailProjectPO");
      io.emit("UpdateManufactureSummary", { PlanID, Type });
      io.emit("UpdateHistoryFiltered", { PlanID, Type });
      io.emit("UpdateManufactureRW", { PlanID, Type });
      res.json({ message: "Đã xoá dữ liệu bảo trì định kỳ thành công" });
    });
  },
});
