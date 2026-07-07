const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getDetailProject", async (id) => {
    try {
      const query = `
            SELECT DISTINCT 
              p.id, 
              p.PONumber AS PO, 
              CASE
                WHEN SUM(o.QuantityProduct) =  SUM(o.QuantityDelivered) AND SUM(o.QuantityProduct) > 0 THEN 'Hoàn thành'
                WHEN COUNT(o.id) = 0 THEN 'Chưa có đơn hàng'
                ELSE 'Đang sản xuất'
              END AS Status,
              COUNT(o.id) AS Total_Product, 
              p.DateCreated AS Date_Created, 
              p.DateDelivery AS Date_Delivery,
              p.Note AS Note
            FROM PurchaseOrders p 
            LEFT JOIN ProductDetails o ON p.id = o.POID 
            WHERE p.CustomerID = ? 
            GROUP BY p.PONumber 
            ORDER BY Date_Created DESC
          `;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("DetailProjectError", err);
        socket.emit("DetailProjectData", rows);
      });
    } catch (error) {
      socket.emit("DetailProjectError", error);
    }
  });
};
