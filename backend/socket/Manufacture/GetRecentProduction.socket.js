const db = require("../../database.js");

// Nhập liệu SX trong 2 ngày gần nhất (phục vụ card "SX 24h qua" ở Overview).
// Server lọc + join sẵn tên đơn/công đoạn/SL/ngày, client chỉ hiển thị.
module.exports = (socket) => {
  const fetchRecent = () => {
    try {
      const query = `
        SELECT
          a.id,
          a.Quantity AS ProducedQuantity,
          a.Type AS Stage,
          a.Timestamp AS WorkDate,
          COALESCE(c.Name_Order, c.Name, '') AS OrderName,
          b.Category
        FROM ManufactureCounting a
        LEFT JOIN Summary b ON a.HistoryID = b.id
        LEFT JOIN PlanManufacture c ON b.PlanID = c.id
        WHERE date(a.Timestamp) >= date('now', 'localtime', '-1 day')
        ORDER BY a.Timestamp DESC, a.id DESC
      `;
      db.all(query, [], (err, rows) => {
        if (err) {
          socket.emit("RecentProductionError", { error: err.message });
          return;
        }
        socket.emit("RecentProductionData", rows || []);
      });
    } catch (error) {
      socket.emit("RecentProductionError", { error: error.message });
    }
  };

  socket.on("getRecentProduction", fetchRecent);
};
