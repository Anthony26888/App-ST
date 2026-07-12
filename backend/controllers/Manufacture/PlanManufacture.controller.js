const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const {
      Name,
      Name_Order,
      Creater,
      Note,
      Total,
      DelaySMT = 10000,
      Level,
      Quantity,
      ProjectID,
      Timestamp,
    } = req.body;

    const LevelCleaned = Array.isArray(Level) ? Level.join("-") : String(Level);

    // Convert date local
    const formattedDate = formatDateLocal(Timestamp);

    const query = `
    INSERT INTO PlanManufacture (
      Name,
      Date,
      Creater,
      Note,
      Total,
      DelaySMT,
      Level,
      Quantity,
      ProjectID,
      Name_Order
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    db.run(
      query,
      [
        Name,
        formattedDate,
        Creater,
        Note,
        Total,
        DelaySMT,
        LevelCleaned,
        Quantity,
        ProjectID,
        Name_Order,
      ],
      function (err) {
        if (err) {
          console.error("DB Error:", err.message);

          return res.status(500).json({
            error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu",
            detail: err.message,
          });
        }

        io.emit("ManufactureUpdate");

        res.json({
          message: "Đã thêm dữ liệu dự án sản xuất thành công",
        });
      },
    );
  },

  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
    const { id } = req.params;

    const {
      Name,
      Name_Order,
      Timestamp,
      Creater,
      Note,
      Total,
      DelaySMT,
      Level,
      Quantity,
    } = req.body;

    const LevelCleaned = Array.isArray(Level) ? Level.join("-") : String(Level);

    // Convert date local
    const formattedDate = formatDateLocal(Timestamp);

    const query = `
    UPDATE PlanManufacture
    SET Name = ?,
        Name_Order = ?,
        Date = ?,
        Creater = ?,
        Note = ?,
        Total = ?,
        DelaySMT = ?,
        Level = ?,
        Quantity = ?
    WHERE id = ?
  `;

    db.run(
      query,
      [
        Name,
        Name_Order,
        formattedDate,
        Creater,
        Note,
        Total,
        DelaySMT,
        LevelCleaned,
        Quantity,
        id,
      ],
      function (err) {
        if (err) {
          console.error("DB Error:", err.message);

          return res.status(500).json({
            error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu",
            detail: err.message,
          });
        }

        io.emit("ManufactureUpdate");

        res.json({
          message: "Đã cập nhật dữ liệu dự án sản xuất thành công",
        });
      },
    );
  },

  // ============================
  // Edit Item Line
  // ============================
  editItemLine(req, res) {
    const { id } = req.params;
    const { DelaySMT, Quantity, PlanID, Type } = req.body;
    // Insert data into SQLite database
    const query = `
      UPDATE PlanManufacture 
      SET DelaySMT = ?, 
          Quantity = ? 
      WHERE id = ?
    `;
    db.run(query, [DelaySMT, Quantity, id], function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("updateManufactureDetails", id);
      io.emit("UpdateHistory");
      io.emit("UpdateSummary");
      io.emit("UpdateManufactureSummary", { PlanID, Type });
      io.emit("UpdateHistoryFiltered", { PlanID, Type });
      res.json({ message: "Đã cập nhật dữ liệu dự án sản xuất thành công" });
    });
  },

  // ============================
  // Delete Item
  // ============================
  deleteItem(req, res) {
    const { id } = req.params;
    // Insert data into SQLite database
    const query = `
        DELETE FROM PlanManufacture WHERE id = ?
    `;
    db.run(query, [id], function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("ManufactureUpdate");
      res.json({ message: "Đã xoá dữ liệu dự án sản xuất thành công" });
    });
  },
});
