const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getProject", async () => {
    try {
      const query = `
              SELECT 
                  c.id,
                  c.CustomerName AS Customer,
                  c.id as CustomerID,
                  COUNT(DISTINCT pd.id) as Quantity_Orders,
                  COUNT(DISTINCT pd.POID) as Quantity_PO,
                  SUM(CASE WHEN pd.QuantityAmount = 0 THEN 1 ELSE 0 END) as Quantity_Completed,
                  ROUND(
                      SUM(CASE WHEN pd.QuantityAmount = 0 THEN 1 ELSE 0 END) * 100.0 / 
                      NULLIF(COUNT(DISTINCT pd.id), 0), 
                      2
                  ) as Percent_Completed,
                  CASE 
                      WHEN COUNT(DISTINCT pd.POID) = 0 THEN 'Chưa có PO'
                      WHEN SUM(CASE WHEN pd.QuantityAmount > 0 THEN 1 ELSE 0 END) > 0 THEN 'Đang sản xuất'
                      WHEN SUM(CASE WHEN pd.QuantityAmount = 0 THEN 1 ELSE 0 END) > 0 
                          AND SUM(CASE WHEN pd.QuantityAmount > 0 THEN 1 ELSE 0 END) = 0 THEN 'Hoàn thành'
                      ELSE 'Chưa có PO'
                  END AS Status,
                  c.Note
              FROM Customers c
              LEFT JOIN ProductDetails pd ON c.id = pd.CustomerID
              GROUP BY c.id, c.CustomerName
              ORDER BY c.CustomerName ASC;`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("ProjectError", err);
        socket.emit("ProjectData", rows);
      });
    } catch (error) {
      socket.emit("ProjectError", error);
    }
  });
};
