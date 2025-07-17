// // queryMap.js
// module.exports = {
//   "danh sách dự án": `
//     SELECT 
//       a.id,
//       c.POID,
//       c.id AS ProductID,
//       c.ProductDetail,
//       a.CustomerName,
//       b.PONumber,
//       b.DateCreated AS Date_Created_PO,
//       b.DateDelivery AS Date_Delivery_PO,
//       CASE
//         WHEN c.QuantityAmount = 0 THEN 'Hoàn thành'
//         WHEN c.QuantityAmount > 0 THEN 'Đang sản xuất'
//         ELSE 'Chưa có đơn hàng'
//       END AS Status
//     FROM Customers a
//     LEFT JOIN PurchaseOrders b ON a.id = b.CustomerID
//     LEFT JOIN ProductDetails c ON b.id = c.POID
//   `,
// };
