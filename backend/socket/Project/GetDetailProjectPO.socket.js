const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getDetailProjectPO", async (id) => {
    try {
      const query = `SELECT 
                          a.id,
                          a.POID,
                          a.ProductDetail AS Product_Detail,
                          a.QuantityProduct AS Quantity_Product, 
                          IFNULL(a.QuantityDelivered, 0) AS Quantity_Delivered, 
                          IFNULL(a.QuantityProduct - a.QuantityDelivered, 0) AS Quantity_Amount,
                          ROUND(
                              IFNULL(a.QuantityDelivered, 0) * 100.0 / 
                              NULLIF(a.QuantityProduct, 0), 
                              2
                          ) AS Percent_Delivered,

                          COALESCE(
                              COUNT(DISTINCT CASE 
                                  WHEN LOWER(TRIM(c.Type)) = 'thành phẩm' THEN c.id 
                              END), 
                          0) AS Quantity_Manufacture,

                          a.Note AS Note,

                          CASE
                              WHEN a.QuantityProduct = a.QuantityDelivered THEN 'Hoàn thành'
                              ELSE 'Đang sản xuất'
                          END AS Status,

                          COALESCE(
                              GROUP_CONCAT(
                                  json_object(
                                      'id', d.id,
                                      'DeliveryDate', strftime('%Y-%m-%d', d.DeliveryDate, 'localtime'),
                                      'DeliveryDateConvert', strftime('%d-%m-%Y', d.DeliveryDate, 'localtime'),
                                      'DeliveryQuantity', d.DeliveryQuantity,
                                      'DeliveryCheck', d.DeliveryStatus,

                                      'DeliveryStatus', CASE
                                          WHEN d.DeliveryDate IS NULL THEN 'Chưa có lịch'
                                          WHEN datetime(d.DeliveryDate, 'localtime') < datetime('now', 'localtime') THEN 'Trễ hạn'
                                          ELSE 'Chưa đến hạn'
                                      END,

                                      'DaysRemaining', CAST(
                                          ROUND(
                                              (julianday(d.DeliveryDate) - julianday('now'))
                                          ) AS INTEGER
                                      )
                                  ), ','
                              ),
                              ''
                          ) AS DeliverySchedules

                      FROM ProductDetails a
                      LEFT JOIN PlanManufacture b ON b.ProjectID = a.id
                      LEFT JOIN ManufactureCounting c ON c.PlanID = b.id
                      LEFT JOIN ScheduleDelivery d ON d.ItemId = a.id

                      WHERE a.CustomerID = ?

                      GROUP BY 
                          a.id, a.POID, a.ProductDetail, 
                          a.QuantityProduct, a.QuantityDelivered, 
                          a.Note

                      ORDER BY Status DESC, Product_Detail ASC;`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("DetailProjectPOError", err);
        socket.emit("DetailProjectPOData", rows);
      });
    } catch (error) {
      socket.emit("DetailProjectPOError", error);
    }
  });
};
