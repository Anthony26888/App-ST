const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getProjectFind", async () => {
    try {
      const query = `
            SELECT 
              a.id,
              c.POID,
              c.id AS ProductID,
              c.ProductDetail,
              a.CustomerName,
                  c.POID,
              strftime('%Y-%m-%d', s.DeliveryDate, 'unixepoch', 'localtime') AS DeliveryDateUnixpoch,
              strftime('%d-%m-%Y', s.DeliveryDate, 'unixepoch', 'localtime') AS DeliveryDate,
              s.DeliveryQuantity,
              s.DeliveryStatus,
              c.ProductDetail,
              c.CustomerID,
              CASE
                WHEN c.QuantityAmount  =  0  THEN 'Hoàn thành'
                WHEN c.QuantityAmount > 0 THEN 'Đang sản xuất'
                ELSE 'Chưa có đơn hàng'
              END AS Status
            FROM Customers a
            LEFT JOIN ProductDetails c ON a.id = c.CustomerID
            LEFT JOIN ScheduleDelivery s ON c.id = s.ItemId`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("ProjectError", err);
        socket.emit("ProjectFindData", rows);
      });
    } catch (error) {
      socket.emit("ProjectFindError", error);
    }
  });
};
