export const queryMap = {
  "Tóm tắt tình hình sản xuất theo ngày": {
    sql: `SELECT 
                        a.id,
                        z.id AS PlanID,
                        a.Type,
                        a.PONumber,
                        z.Name_Order,
                        a.Category,
                        a.Quantity_Plan,
                        a.CycleTime_Plan,
                        a.Time_Plan,
                        a.Created_At,
                        CASE
                          WHEN a.Type = 'SMT' THEN IFNULL(b.SMT, 0) * z.Quantity
                          WHEN a.Type = 'AOI' THEN IFNULL(c.AOI, 0) * z.Quantity_AOI
                          WHEN a.Type = 'Assembly' THEN IFNULL(f.Assembly, 0) * z.Quantity_Assembly
                          WHEN a.Type = 'IPQC' THEN IFNULL(e.IPQC, 0) * z.Quantity_IPQC
                          WHEN a.Type = 'OQC' THEN IFNULL(g.OQC, 0) * z.Quantity_OQC
                          WHEN a.Type = 'IPQC (SMT)' THEN IFNULL(h.IPQCSMT, 0) * z.Quantity_IPQCSMT
                          WHEN a.Type = 'Test 1' THEN IFNULL(j.Test1, 0) * z.Quantity_Test1
                          WHEN a.Type = 'Test 2' THEN IFNULL(k.Test2, 0) * z.Quantity_Test2
                          WHEN a.Type = 'Box Build' THEN IFNULL(m.BoxBuild, 0) * z.Quantity_BoxBuild
                          WHEN a.Type = 'Tẩm phủ' THEN IFNULL(l.ConformalCoating, 0) * z.Quantity_ConformalCoating
                          WHEN a.Type = 'Nhập kho' THEN IFNULL(n.Warehouse, 0)
                          ELSE 0
                        END AS Quantity_Real,
                        CASE 
                          WHEN a.Quantity_Plan > 0 THEN 
                            CASE
                              WHEN a.Type = 'SMT' THEN (IFNULL(b.SMT, 0) * Quantity * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'AOI' THEN (IFNULL(c.AOI, 0) * Quantity_AOI * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Assembly' THEN (IFNULL(f.Assembly, 0) * Quantity_Assembly * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'IPQC' THEN (IFNULL(e.IPQC, 0) * Quantity_IPQC * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'OQC' THEN (IFNULL(g.OQC, 0) * Quantity_OQC * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'IPQC (SMT)' THEN (IFNULL(h.IPQCSMT, 0) * Quantity_IPQCSMT * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Test 1' THEN (IFNULL(j.Test1, 0) * Quantity_Test1 * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Test 2' THEN (IFNULL(k.Test2, 0) * Quantity_Test2 * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Box Build' THEN (IFNULL(m.BoxBuild, 0) * Quantity_BoxBuild * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Nhập kho' THEN (IFNULL(n.Warehouse, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Tẩm phủ' THEN (IFNULL(l.ConformalCoating, 0) * Quantity_ConformalCoating * 100.0) / a.Quantity_Plan
                              ELSE 0
                            END
                          ELSE 0
                        END AS Percent,
                        CASE
                          WHEN a.Type = 'AOI' THEN IFNULL(c1.AOIError, 0)
                          WHEN a.Type = 'IPQC' THEN IFNULL(e1.IPQCError, 0)
                          WHEN a.Type = 'OQC' THEN IFNULL(g1.OQCError, 0)
                          WHEN a.Type = 'IPQC (SMT)' THEN IFNULL(k1.IPQCSMTError, 0)
                          WHEN a.Type = 'Test 1' THEN IFNULL(m1.Test1Error, 0)
                          WHEN a.Type = 'Test 2' THEN IFNULL(n1.Test2Error, 0)
                          ELSE 0
						            END AS Quantity_Error,
                        (
                          IFNULL(c2.AOIFixed, 0) + 
                          IFNULL(e2.IPQCFixed, 0) + 
                          IFNULL(g2.OQCFixed, 0) + 
                          IFNULL(k2.IPQCSMTFixed, 0) + 
                          IFNULL(m2.Test1Fixed, 0) + 
                          IFNULL(n2.Test2Fixed, 0)
                        ) AS Total_Fixed
                      FROM Summary a
                      LEFT JOIN (
                        SELECT 
                          id, 
                          Name_Order, 
                          Quantity, 
                          Quantity_AOI, 
                          Quantity_Assembly,
                          Quantity_BoxBuild,  
                          Quantity_ConformalCoating,
                          Quantity_IPQC,
                          Quantity_IPQCSMT,
                          Quantity_OQC,
                          Quantity_Test1,
                          Quantity_Test2
                        FROM PlanManufacture
                      ) z ON a.PlanID = z.id
                      LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS SMT 
                        FROM ManufactureSMT 
                        GROUP BY HistoryID
                      ) b ON a.id = b.HistoryID
                      LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS AOI 
                        FROM ManufactureAOI 
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) c ON a.id = c.HistoryID
                      LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS IPQC 
                        FROM ManufactureIPQC 
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) e ON a.id = e.HistoryID
                      LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS Assembly 
                        FROM ManufactureAssembly 
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) f ON a.id = f.HistoryID
                      LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS OQC 
                        FROM ManufactureOQC 
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) g ON a.id = g.HistoryID
                       LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS IPQCSMT 
                        FROM ManufactureIPQCSMT 
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) h ON a.id = h.HistoryID
                       LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS Test1
                        FROM ManufactureTest1
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) j ON a.id = j.HistoryID
                       LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS Test2
                        FROM ManufactureTest2
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) k ON a.id = k.HistoryID
                       LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS BoxBuild
                        FROM ManufactureBoxBuild
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) m ON a.id = m.HistoryID
                       LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS Warehouse 
                        FROM ManufactureWarehouse 
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) n ON a.id = n.HistoryID
                       LEFT JOIN (
                        SELECT HistoryID, COUNT(id) AS ConformalCoating
                        FROM ManufactureConformalCoating
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) l ON a.id = l.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS AOIError
                          FROM ManufactureAOI 
						              WHERE Status = 'error'
                          GROUP BY HistoryID
                        ) c1 ON a.id = c1.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS IPQCError 
                          FROM ManufactureIPQC 
						              WHERE Status = 'error'
                          GROUP BY HistoryID
                        ) e1 ON a.id = e1.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS OQCError 
                          FROM ManufactureOQC 
						              WHERE Status = 'error'
                          GROUP BY HistoryID
                        ) g1 ON a.id = g1.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS IPQCSMTError 
                          FROM ManufactureIPQCSMT
						              WHERE Status = 'error'
                          GROUP BY HistoryID
                        ) k1 ON a.id = k1.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Test1Error 
                          FROM ManufactureTest1 
						              WHERE Status = 'error'
                          GROUP BY HistoryID
                        ) m1 ON a.id = m1.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Test2Error 
                          FROM ManufactureTest2
						              WHERE Status = 'error'
                          GROUP BY HistoryID
                        ) n1 ON a.id = n1.HistoryID
                         LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS AOIFixed, RWID
                            FROM ManufactureAOI
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) c2 ON a.id = c2.HistoryID
                        LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS IPQCFixed, RWID
                            FROM ManufactureIPQC
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) e2 ON a.id = e2.HistoryID
                        LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS OQCFixed, RWID
                            FROM ManufactureOQC
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) g2 ON a.id = g2.HistoryID
                        LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS IPQCSMTFixed, RWID
                            FROM ManufactureIPQCSMT
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) k2 ON a.id = k2.HistoryID
                        LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS Test1Fixed, RWID
                            FROM ManufactureTest1
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) m2 ON a.id = m2.HistoryID
                        LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS Test2Fixed, RWID
                            FROM ManufactureTest2
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) n2 ON a.id = n2.HistoryID
                      WHERE a.Created_At = '{date}'
                      ORDER BY a.Created_At DESC`,
    description: "Tình hình sản xuất hôm nay",
  },
  "Các dự án của khách hàng": {
    sql: ` SELECT * FROM (
            SELECT 
              a.id,
              c.POID,
              c.id AS ProductID,
              c.ProductDetail,
              a.CustomerName,
              b.PONumber,
              b.DateCreated AS Date_Created_PO,
              b.DateDelivery AS Date_Delivery_PO,
              c.QuantityProduct,
              c.QuantityDelivered,
              c.QuantityAmount,
              CASE
                WHEN (c.QuantityProduct - c.QuantityDelivered)  =  0  THEN 'Hoàn thành'
                WHEN (c.QuantityProduct - c.QuantityDelivered) > 0 THEN 'Đang sản xuất'
                ELSE 'Chưa có đơn hàng'
              END AS Status
            FROM Customers a
            LEFT JOIN PurchaseOrders b ON a.id = b.CustomerID
            LEFT JOIN ProductDetails c ON b.id = c.POID
          ) `,
    description: "Các dự án của khách hàng",
  },
};
