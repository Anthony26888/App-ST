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
                              COALESCE((
                                  SELECT SUM(mc.Quantity)
                                  FROM PlanManufacture p
                                  JOIN ManufactureCounting mc ON mc.PlanID = p.id
                                  WHERE p.ProjectID = a.id
                                    AND LOWER(TRIM(mc.Type)) = 'thành phẩm'
                              ), 0) * 100.0 /
                              NULLIF(a.QuantityProduct, 0),
                              2
                          ) AS Percent_Manufacture,

                          COALESCE((
                              SELECT SUM(mc.Quantity)
                              FROM PlanManufacture p
                              JOIN ManufactureCounting mc ON mc.PlanID = p.id
                              WHERE p.ProjectID = a.id
                                AND LOWER(TRIM(mc.Type)) = 'thành phẩm'
                          ), 0) AS Quantity_Manufacture,

                          a.Note AS Note,

                          CASE
                              WHEN a.QuantityProduct = a.QuantityDelivered THEN 'Hoàn thành'
                              ELSE 'Đang sản xuất'
                          END AS Status,

                          COALESCE(
                              (
                                  SELECT GROUP_CONCAT(payload, ',')
                                  FROM (
                                      SELECT json_object(
                                          'id', d.id,
                                          'DeliveryDate', strftime('%Y-%m-%d', d.DeliveryDate, 'unixepoch', 'localtime'),
                                          'DeliveryDateConvert', strftime('%Y-%m-%d', d.DeliveryDate, 'unixepoch', 'localtime'),
                                          'DeliveryQuantity', d.DeliveryQuantity,
                                          'DeliveryCheck', d.DeliveryStatus,
                                          'ActualDeliveryDate', CASE
                                              WHEN d.ActualDeliveryDate IS NULL THEN NULL
                                              ELSE strftime('%Y-%m-%d', d.ActualDeliveryDate, 'unixepoch', 'localtime')
                                          END,

                                          'DeliveryStatus', CASE
                                              WHEN d.DeliveryDate IS NULL THEN 'Chưa có lịch'
                                              WHEN datetime(d.DeliveryDate, 'unixepoch', 'localtime') < datetime('now', 'localtime') THEN 'Trễ hạn'
                                              ELSE 'Chưa đến hạn'
                                          END,

                                          'DaysRemaining', CAST(
                                              ROUND(
                                                  (julianday(d.DeliveryDate, 'unixepoch') - julianday('now'))
                                              ) AS INTEGER
                                          ),

                                          'DelayDays', CASE
                                              WHEN d.ActualDeliveryDate IS NULL OR d.DeliveryDate IS NULL THEN NULL
                                              ELSE CAST(
                                                  ROUND(
                                                      (julianday(d.ActualDeliveryDate, 'unixepoch') - julianday(d.DeliveryDate, 'unixepoch'))
                                                  ) AS INTEGER
                                              )
                                          END
                                      ) AS payload
                                      FROM ScheduleDelivery d
                                      WHERE d.ItemId = a.id
                                      ORDER BY d.DeliveryDate ASC, d.id ASC
                                  )
                              ),
                              ''
                          ) AS DeliverySchedules

                      FROM ProductDetails a
                      WHERE a.CustomerID = ?
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
