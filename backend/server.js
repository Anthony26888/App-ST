require("dotenv").config();
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./database.js");
const { v4: uuidv4 } = require("uuid"); // tạo UUID
const routes = require("./routes");
const axios = require("axios");
const app = express();
const { Server } = require("socket.io");
const { send } = require("process");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

// Khởi tạo Express và Socket.IO
const PORT = 3000;
app.use(cors());
app.use(bodyParser.json());
app.use("/", routes);
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Tạo HTTP server
const server = require("http").createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder to save images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

const userProjects = new Map();
// Khi client kết nối
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("getCompare", async (id) => {
    try {
      const query = await getCompareWareHouse(id);
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("compareError", err);
        socket.emit("compareData", rows);
      });
    } catch (error) {
      socket.emit("compareError", error);
    }
  }),
    socket.on("getCheckBOM", async (id) => {
      try {
        const query = await getPivotQuery(id);
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("checkBOMError", err);
          socket.emit("checkBOMData", rows);
        });
      } catch (error) {
        socket.emit("checkBOMError", error);
      }
    }),
    socket.on("getDetailBom", async () => {
      try {
        const query = `SELECT DISTINCT id, PO, Bom, COUNT(Bom) AS SL_LK, SL_Board, Creater, TimeStamp FROM CheckBOM GROUP BY PO, Bom ORDER BY id DESC`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("detailBomError", err);
          socket.emit("detailBomData", rows);
        });
      } catch (error) {
        socket.emit("detailBomError", error);
      }
    }),
    socket.on("getOrders", async () => {
      try {
        const query = `SELECT DISTINCT * FROM Orders ORDER BY id DESC`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("ordersError", err);
          socket.emit("ordersData", rows);
        });
      } catch (error) {
        socket.emit("ordersError", error);
      }
    }),
    socket.on("getWareHouse", async () => {
      try {
        const query = `SELECT DISTINCT * FROM WareHouse ORDER BY id ASC`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("WareHouseError", err);
          socket.emit("WareHouseData", rows);
        });
      } catch (error) {
        socket.emit("WareHouseError", error);
      }
    }),
    socket.on("getWareHouse2", async () => {
      try {
        const query = `SELECT DISTINCT * FROM WareHouse2 ORDER BY id ASC`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("WareHouse2Error", err);
          socket.emit("WareHouse2Data", rows);
        });
      } catch (error) {
        socket.emit("WareHouse2Error", error);
      }
    }),
    socket.on("getWareHouseFind", async (id) => {
      try {
        const query = `SELECT DISTINCT Customer FROM WareHouse WHERE PartNumber_1 = ? ORDER BY id ASC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("WareHouseFindError", err);
          socket.emit("WareHouseFindData", rows);
        });
      } catch (error) {
        socket.emit("WareHouseFindError", error);
      }
    }),
    socket.on("getWareHouse2Find", async (id) => {
      try {
        const query = `SELECT DISTINCT Customer FROM WareHouse2 WHERE PartNumber_1 = ? ORDER BY id ASC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("WareHouse2FindError", err);
          socket.emit("WareHouse2FindData", rows);
        });
      } catch (error) {
        socket.emit("WareHouse2FindError", error);
      }
    }),
    socket.on("getProject", async () => {
      try {
        const query = `
        SELECT DISTINCT
          a.id,
          a.CustomerName AS Customer, 
          CASE
            WHEN IFNULL(b.total_qty, 0) = IFNULL(b.total_delivered, 0) AND IFNULL(b.total_qty, 0) > 0 THEN 'Hoàn thành'
            WHEN IFNULL(c.po_count, 0) = 0 THEN 'Chưa có PO'
            ELSE 'Đang sản xuất'
          END AS Status,
          IFNULL(c.po_count, 0) AS Quantity_PO,
          a.Years
        FROM Customers a
        LEFT JOIN (
          SELECT CustomerID, 
                SUM(QuantityProduct) AS total_qty, 
                SUM(QuantityDelivered) AS total_delivered
          FROM ProductDetails
          GROUP BY CustomerID
        ) b ON a.id = b.CustomerID
        LEFT JOIN (
          SELECT CustomerID, COUNT(PONumber) AS po_count
          FROM PurchaseOrders
          GROUP BY CustomerID
        ) c ON a.id = c.CustomerID
        ORDER BY Status DESC, Years DESC
        `;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("ProjectError", err);
          socket.emit("ProjectData", rows);
        });
      } catch (error) {
        socket.emit("ProjectError", error);
      }
    }),
    socket.on("getProjectFind", async () => {
      try {
        const query = `
          SELECT DISTINCT
            a.id AS CustomerId,
            b.id AS POId,
            c.id AS ProductId,
            b.POID,
            a.CustomerName AS Customer, 
            c.PONumber,
            b.ProductDetail
          FROM Customers a
          LEFT JOIN (
            SELECT id, CustomerID,  POID,  ProductDetail
            FROM ProductDetails
          ) b ON a.id = b.CustomerID
          LEFT JOIN (
            SELECT id, CustomerID, PONumber
            FROM PurchaseOrders
          ) c ON a.id = c.CustomerID`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("ProjectError", err);
          socket.emit("ProjectFindData", rows);
        });
      } catch (error) {
        socket.emit("ProjectFindError", error);
      }
    }),
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
          ORDER BY Status ASC, Date_Created ASC
        `;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("DetailProjectError", err);
          socket.emit("DetailProjectData", rows);
        });
      } catch (error) {
        socket.emit("DetailProjectError", error);
      }
    }),
    socket.on("getDetailProjectPO", async (id) => {
      try {
        const query = `SELECT 
                        o.id, 
                        p.PONumber AS PO, 
                        o.ProductDetail AS Product_Detail,
                        CASE
                          WHEN o.QuantityProduct = o.QuantityDelivered THEN 'Hoàn thành'
                          ELSE 'Đang sản xuất'
                        END AS Status,
                        o.QuantityProduct AS Quantity_Product, 
                        IFNULL(c.Total_Output, 0) AS Quantity_Delivered, 
                        IFNULL(o.QuantityProduct - c.Total_Output, 0) AS Quantity_Amount,
                        o.Note AS Note 
                      FROM ProductDetails o 
                      LEFT JOIN PurchaseOrders p ON o.POID = p.id 
                      LEFT JOIN (
                        SELECT DISTINCT 
                        z.id,
                        z.ProjectID,
                        IFNULL(b.Total_Output, 0) AS Total_Output
                        FROM PlanManufacture z
                        LEFT JOIN (
                        SELECT 
                          a.id,
                          a.Type,
                          a.PlanID,
                            SUM(o.Warehouse) AS Total_Output
                          FROM Summary a
                          LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS Warehouse
                          FROM ManufactureWarehouse
                          WHERE Status = 'ok'
                              GROUP BY HistoryID
                          ) o ON a.id = o.HistoryID
                        ) b ON z.id = b.PlanID
                      ) c ON o.id = c.ProjectID
                      WHERE o.POID = ?
                      ORDER BY Status ASC, Product_Detail ASC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("DetailProjectPOError", err);
          socket.emit("DetailProjectPOData", rows);
        });
      } catch (error) {
        socket.emit("DetailProjectPOError", error);
      }
    }),
    socket.on("getUsers", async () => {
      try {
        const query = `SELECT DISTINCT * FROM Users ORDER BY id DESC`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("usersError", err);
          socket.emit("usersData", rows);
        });
      } catch (error) {
        socket.emit("usersError", error);
      }
    }),
    socket.on("getMachine", async () => {
      try {
        const query = `SELECT a.MaThietBi, a.TenThietBi, a.LoaiThietBi, a.NhaSanXuat, a.NgayMua, a.ViTri, a.MoTa, CAST((julianday(b.NgayBaoTriTiepTheo) - julianday('now')) AS INTEGER) AS SoNgayConLai
                      FROM Machine a 
                      LEFT JOIN MaintenanceSchedule b 
                      ON a.MaThietBi = b.MaThietBi
                      GROUP BY TenThietBi 
                      ORDER BY SoNgayConLai ASC`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("MachineError", err);
          socket.emit("MachineData", rows);
        });
      } catch (error) {
        socket.emit("MachineError", error);
      }
    }),
    socket.on("getMaintenance", async (id) => {
      try {
        const query = `SELECT DISTINCT * FROM Maintenance WHERE MaThietBi = ?`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("MaintenanceError", err);
          socket.emit("MaintenanceData", rows);
        });
      } catch (error) {
        socket.emit("MaintenanceError", error);
      }
    }),
    socket.on("getMaintenanceSchedule", async (id) => {
      try {
        const query = `SELECT DISTINCT *,  CAST((julianday(NgayBaoTriTiepTheo) - julianday('now')) AS INTEGER) AS SoNgayConLai
                      FROM MaintenanceSchedule 
                      WHERE MaThietBi = ?`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("MaintenanceScheduleError", err);
          socket.emit("MaintenanceScheduleData", rows);
        });
      } catch (error) {
        socket.emit("MaintenanceScheduleError", error);
      }
    }),
    socket.on("getSparePartUsage", async (id) => {
      try {
        const query = `SELECT DISTINCT * FROM SparePartUsage WHERE MaBaoTri = ?`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("SparePartUsageError", err);
          socket.emit("SparePartUsageData", rows);
        });
      } catch (error) {
        socket.emit("SparePartUsageError", error);
      }
    }),
    socket.on("getManufacture", async () => {
      try {
        const query = `SELECT DISTINCT 
                        z.id,
                        z.Name,
                        z.Name_Order,
                        z.Total,
                        IFNULL(b.Total_Output, 0) AS Total_Output,
                        CASE
                          WHEN z.Total = b.Total_Output THEN 'Hoàn thành'
                          ELSE 'Đang sản xuất'
                        END AS Status_Output,
                        z.Level,
                        z.Date,
                        z.Note,
                        z.Creater
                      FROM PlanManufacture z
                      LEFT JOIN (
                        SELECT 
                          a.id,
                          a.Type,
                          a.PlanID,
                              SUM(o.Warehouse) AS Total_Output
                          FROM Summary a
                            LEFT JOIN (
                                SELECT HistoryID, COUNT(*) AS Warehouse
                            FROM ManufactureWarehouse
                            WHERE Status = 'ok'
                                  GROUP BY HistoryID
                            ) o ON a.id = o.HistoryID
                      ) b ON z.id = b.PlanID
                      ORDER BY Date DESC`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("ManufactureError", err);
          socket.emit("ManufactureData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureError", error);
      }
    }),
    socket.on("getManufactureDetails", async (id) => {
      try {
        const query = `SELECT 
                          h.Total,
                          h.DelaySMT,
                          h.Quantity,
                          h.Name_Order,
                          SUM(IFNULL(b.SMT, 0)) AS SMT,
                          SUM(IFNULL(c.AOI, 0)) AS AOI,
                          SUM(IFNULL(d.RW, 0)) AS RW,
                          SUM(IFNULL(e.IPQC, 0)) AS IPQC,
                          SUM(IFNULL(f.Assembly, 0)) AS Assembly,
                          SUM(IFNULL(g.OQC, 0)) AS OQC,
                          SUM(IFNULL(k.IPQCSMT, 0)) AS IPQCSMT,
                          SUM(IFNULL(m.Test1, 0)) AS Test1,
                          SUM(IFNULL(n.Test2, 0)) AS Test2,
                          SUM(IFNULL(j.BoxBuild, 0)) AS BoxBuild,
                          SUM(IFNULL(o.Warehouse, 0)) AS Warehouse,
                          SUM(IFNULL(c1.AOIError, 0)) AS AOIError,
                          SUM(IFNULL(e1.IPQCError, 0)) AS IPQCError,
                          SUM(IFNULL(g1.OQCError, 0)) AS OQCError,
                          SUM(IFNULL(k1.IPQCSMTError, 0)) AS IPQCSMTError,
                          SUM(IFNULL(m1.Test1Error, 0)) AS Test1Error,
                          SUM(IFNULL(n1.Test2Error, 0)) AS Test2Error,
                          SUM(IFNULL(c2.AOIFixed, 0)) AS AOIFixed,
                          SUM(IFNULL(e2.IPQCFixed, 0)) AS IPQCFixed,
                          SUM(IFNULL(g2.OQCFixed, 0)) AS OQCFixed,
                          SUM(IFNULL(k2.IPQCSMTFixed, 0)) AS IPQCSMTFixed,
                          SUM(IFNULL(m2.Test1Fixed, 0)) AS Test1Fixed,
                          SUM(IFNULL(n2.Test2Fixed, 0)) AS Test2Fixed,
                          h.Level AS Level,
                          SUM(
                            IFNULL(c1.AOIError, 0) + 
                            IFNULL(e1.IPQCError, 0) + 
                            IFNULL(g1.OQCError, 0) + 
                            IFNULL(k1.IPQCSMTError, 0) +
                            IFNULL(m1.Test1Error, 0) +
                            IFNULL(n1.Test2Error, 0) +
							              IFNULL(c2.AOIFixed, 0) + 
                            IFNULL(e2.IPQCFixed, 0) + 
                            IFNULL(g2.OQCFixed, 0) + 
                            IFNULL(k2.IPQCSMTFixed, 0) +
                            IFNULL(m2.Test1Fixed, 0) +
                            IFNULL(n2.Test2Fixed, 0) 
                          ) AS Quantity_Error,
						              SUM(
                            IFNULL(c2.AOIFixed, 0) + 
                            IFNULL(e2.IPQCFixed, 0) + 
                            IFNULL(g2.OQCFixed, 0) + 
                            IFNULL(k2.IPQCSMTFixed, 0) +
                            IFNULL(m2.Test1Fixed, 0) +
                            IFNULL(n2.Test2Fixed, 0)
                          ) AS Quantity_Fixed
                      FROM PlanManufacture h
                      LEFT JOIN Summary a ON a.PlanID = h.id
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS SMT 
                          FROM ManufactureSMT 
                          GROUP BY HistoryID
                      ) b ON a.id = b.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS AOI 
                          FROM ManufactureAOI 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) c ON a.id = c.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS RW 
                          FROM ManufactureRW 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) d ON a.id = d.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS IPQC 
                          FROM ManufactureIPQC 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) e ON a.id = e.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Assembly 
                          FROM ManufactureAssembly 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) f ON a.id = f.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS OQC 
                          FROM ManufactureOQC 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) g ON a.id = g.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS IPQCSMT 
                          FROM ManufactureIPQCSMT
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) k ON a.id = k.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Test1 
                          FROM ManufactureTest1 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) m ON a.id = m.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Test2 
                          FROM ManufactureTest2
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) n ON a.id = n.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS BoxBuild 
                          FROM ManufactureBoxBuild
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) j ON a.id = j.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Warehouse
                          FROM ManufactureWarehouse
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) o ON a.id = o.HistoryID
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
                          SELECT HistoryID, COUNT(*) AS AOIFixed
                          FROM ManufactureAOI 
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) c2 ON a.id = c1.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS IPQCFixed
                          FROM ManufactureIPQC 
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) e2 ON a.id = e1.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS OQCFixed
                          FROM ManufactureOQC 
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) g2 ON a.id = g1.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS IPQCSMTFixed 
                          FROM ManufactureIPQCSMT
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) k2 ON a.id = k1.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Test1Fixed
                          FROM ManufactureTest1 
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) m2 ON a.id = m1.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Test2Fixed
                          FROM ManufactureTest2
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) n2 ON a.id = n1.HistoryID
                      WHERE h.id = ?
                      GROUP BY h.Total`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureDetailsError", err);
          socket.emit("ManufactureDetailsData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureDetailsError", error);
      }
    }),
    socket.on("setProject", (id) => {
      console.log(`Client ${socket.id} chọn project_id = ${id}`);
      userProjects.set(socket.id, id);
    });
  socket.on("getManufactureAOI", async (id) => {
    try {
      const query = `SELECT *
                      FROM ManufactureAOI
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("ManufactureHandError", err);
        socket.emit("ManufactureAOIData", rows);
      });
    } catch (error) {
      socket.emit("ManufactureAOIError", error);
    }
  }),
    socket.on("getManufactureRW", async (id) => {
      try {
        const query = `SELECT a.id, b.Type, a.PartNumber, a.Status, b.Category, a.Timestamp, a.HistoryID FROM (
                          SELECT id, PartNumber, Status, HistoryID, Timestamp FROM ManufactureAOI WHERE Status IN ('error', 'fixed')
                          UNION ALL
                          SELECT id, PartNumber, Status, HistoryID, Timestamp FROM ManufactureIPQCSMT WHERE Status IN ('error', 'fixed')
                          UNION ALL
                            SELECT id, PartNumber, Status, HistoryID, Timestamp FROM ManufactureIPQC WHERE Status IN ('error', 'fixed')
                          UNION ALL
                            SELECT id, PartNumber, Status, HistoryID, Timestamp FROM ManufactureTest1 WHERE Status IN ('error', 'fixed')
                          UNION ALL
                            SELECT id, PartNumber, Status, HistoryID, Timestamp FROM ManufactureTest2 WHERE Status IN ('error', 'fixed')
                          UNION ALL
                            SELECT id, PartNumber, Status, HistoryID, Timestamp FROM ManufactureOQC WHERE Status IN ('error', 'fixed')
                        ) a LEFT JOIN Summary b ON a.HistoryID = b.id
                        WHERE PlanID = ?
                        ORDER BY a.Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureRWError", err);
          socket.emit("ManufactureRWData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureRWError", error);
      }
    }),
    socket.on("getManufactureIPQC", async (id) => {
      try {
        const query = `SELECT *
                      FROM ManufactureIPQC
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureIPQCError", err);
          socket.emit("ManufactureIPQCData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureIPQCError", error);
      }
    }),
    socket.on("getManufactureIPQCSMT", async (id) => {
      try {
        const query = `SELECT *
                      FROM ManufactureIPQCSMT
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureIPQCSMTError", err);
          socket.emit("ManufactureIPQCSMTData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureIPQCSMTError", error);
      }
    }),
    socket.on("getManufactureAssembly", async (id) => {
      try {
        const query = `SELECT *
                      FROM ManufactureAssembly
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureAssemblyError", err);
          socket.emit("ManufactureAssemblyData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureAssemblyError", error);
      }
    }),
    socket.on("getManufactureOQC", async (id) => {
      try {
        const query = `SELECT *
                      FROM ManufactureOQC
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureOQCError", err);
          socket.emit("ManufactureOQCData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureOQCError", error);
      }
    }),
    socket.on("getManufactureSMT", async (id) => {
      try {
        const query = `SELECT *
                      FROM ManufactureSMT
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureSMTError", err);
          socket.emit("ManufactureSMTData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureSMTError", error);
      }
    }),
    socket.on("getManufactureBoxBuild", async (id) => {
      try {
        const query = `SELECT *
                      FROM ManufactureBoxBuild
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureBoxBuildError", err);
          socket.emit("ManufactureBoxBuildData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureBoxBuildError", error);
      }
    }),
    socket.on("getManufactureTest1", async (id) => {
      try {
        const query = `SELECT *
                      FROM ManufactureTest1
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureTest1Error", err);
          socket.emit("ManufactureTest1Data", rows);
        });
      } catch (error) {
        socket.emit("ManufactureTest1Error", error);
      }
    }),
    socket.on("getManufactureTest2", async (id) => {
      try {
        const query = `SELECT *
                      FROM ManufactureTest2
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureTest2Error", err);
          socket.emit("ManufactureTest2Data", rows);
        });
      } catch (error) {
        socket.emit("ManufactureTest2Error", error);
      }
    }),
    socket.on("getManufactureWarehouse", async (id) => {
      try {
        const query = `SELECT *
                      FROM ManufactureWarehouse
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureWarehouseError", err);
          socket.emit("ManufactureWarehouseData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureWarehouseError", error);
      }
    }),
    socket.on("getSummary", async (id) => {
      try {
        const query = `SELECT 
                        a.id,
                        a.Type,
                        a.PONumber,
                        z.Name_Order,
                        a.Category,
                        a.Quantity_Plan,
                        a.CycleTime_Plan,
                        a.Time_Plan,
                        a.Created_At,
                        CASE
                          WHEN a.Type = 'SMT' THEN IFNULL(b.SMT, 0)
                          WHEN a.Type = 'AOI' THEN IFNULL(c.AOI, 0)
                          WHEN a.Type = 'RW' THEN IFNULL(d.RW, 0)
                          WHEN a.Type = 'Assembly' THEN IFNULL(f.Assembly, 0)
                          WHEN a.Type = 'IPQC (Hàn tay)' THEN IFNULL(e.IPQC, 0)
                          WHEN a.Type = 'OQC' THEN IFNULL(g.OQC, 0)
                          WHEN a.Type = 'IPQC (SMT)' THEN IFNULL(h.IPQCSMT, 0)
                          WHEN a.Type = 'Test 1' THEN IFNULL(j.Test1, 0)
                          WHEN a.Type = 'Test 2' THEN IFNULL(k.Test2, 0)
                          WHEN a.Type = 'Box Build' THEN IFNULL(m.BoxBuild, 0)
                          WHEN a.Type = 'Nhập kho' THEN IFNULL(n.Warehouse, 0)
                          ELSE 0
                        END AS Quantity_Real,
                        CASE 
                          WHEN a.Quantity_Plan > 0 THEN 
                            CASE
                              WHEN a.Type = 'SMT' THEN (IFNULL(b.SMT, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'AOI' THEN (IFNULL(c.AOI, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'RW' THEN (IFNULL(d.RW, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Assembly' THEN (IFNULL(f.Assembly, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'IPQC (Hàn tay)' THEN (IFNULL(e.IPQC, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'OQC' THEN (IFNULL(g.OQC, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'IPQC (SMT)' THEN (IFNULL(h.IPQCSMT, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Test 1' THEN (IFNULL(j.Test1, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Test 2' THEN (IFNULL(k.Test2, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Box Build' THEN (IFNULL(m.BoxBuild, 0) * 100.0) / a.Quantity_Plan
                              WHEN a.Type = 'Nhập kho' THEN (IFNULL(n.Warehouse, 0) * 100.0) / a.Quantity_Plan
                              ELSE 0
                            END
                          ELSE 0
                        END AS Percent
                      FROM Summary a
                      LEFT JOIN (
                        SELECT id, Name_Order FROM PlanManufacture
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
                        SELECT HistoryID, COUNT(id) AS RW 
                        FROM ManufactureRW 
                        WHERE Status = 'ok'
                        GROUP BY HistoryID
                      ) d ON a.id = d.HistoryID
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
                      WHERE a.Created_At = ?
                      ORDER BY a.Created_At DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("SummaryError", err);
          socket.emit("SummaryData", rows);
        });
      } catch (error) {
        socket.emit("SummaryError", error);
      }
    }),
    socket.on("getHistory", async (id) => {
      try {
        const query = `SELECT 
                        a.id,
                        a.Type,
                        a.PONumber,
                        z.Name_Order,
                        z.DelaySMT,
						            z.Quantity,
                        a.Category,
                        a.Quantity_Plan,
                        a.CycleTime_Plan,
                        a.Time_Plan,
                        a.Created_At,
                        CASE
                          WHEN a.Type = 'SMT' THEN IFNULL(b.SMT, 0)
                          WHEN a.Type = 'AOI' THEN IFNULL(c.AOI, 0)
                          WHEN a.Type = 'RW' THEN IFNULL(d.RW, 0)
                          WHEN a.Type = 'Assembly' THEN IFNULL(f.Assembly, 0)
                          WHEN a.Type = 'IPQC (Hàn tay)' THEN IFNULL(e.IPQC, 0)
                          WHEN a.Type = 'OQC' THEN IFNULL(g.OQC, 0)
                          WHEN a.Type = 'IPQC (SMT)' THEN IFNULL(k.IPQCSMT, 0)
                          WHEN a.Type = 'Test 1' THEN IFNULL(m.Test1, 0)
                          WHEN a.Type = 'Test 2' THEN IFNULL(n.Test2, 0)
                          WHEN a.Type = 'Box Build' THEN IFNULL(j.BoxBuild, 0)
                          WHEN a.Type = 'Nhập kho' THEN IFNULL(o.Warehouse, 0)
                          ELSE 0
                        END AS Quantity_Real,
                        CASE
                          WHEN a.Type = 'AOI' THEN IFNULL(c1.AOIError, 0)
                          WHEN a.Type = 'IPQC (Hàn tay)' THEN IFNULL(e1.IPQCError, 0)
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
                          SELECT id, Name_Order, Quantity, DelaySMT 
                          FROM PlanManufacture
                        ) z ON a.PlanID = z.id
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS SMT 
                          FROM ManufactureSMT 
                          GROUP BY HistoryID
                        ) b ON a.id = b.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS AOI 
                          FROM ManufactureAOI 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) c ON a.id = c.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS RW 
                          FROM ManufactureRW 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) d ON a.id = d.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS IPQC 
                          FROM ManufactureIPQC 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) e ON a.id = e.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Assembly 
                          FROM ManufactureAssembly 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) f ON a.id = f.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS OQC 
                          FROM ManufactureOQC 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) g ON a.id = g.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS IPQCSMT 
                          FROM ManufactureIPQCSMT
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) k ON a.id = k.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Test1 
                          FROM ManufactureTest1 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) m ON a.id = m.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Test2 
                          FROM ManufactureTest2
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) n ON a.id = n.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS BoxBuild 
                          FROM ManufactureBoxBuild
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) j ON a.id = j.HistoryID
                        LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Warehouse
                          FROM ManufactureWarehouse
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) o ON a.id = o.HistoryID
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
                        ) c2 ON a.id = c2.RWID
                        LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS IPQCFixed, RWID
                            FROM ManufactureIPQC
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) e2 ON a.id = e2.RWID
                        LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS OQCFixed, RWID
                            FROM ManufactureOQC
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) g2 ON a.id = g2.RWID
                        LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS IPQCSMTFixed, RWID
                            FROM ManufactureIPQCSMT
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) k2 ON a.id = k2.RWID
                        LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS Test1Fixed, RWID
                            FROM ManufactureTest1
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) m2 ON a.id = m2.RWID
                        LEFT JOIN (
                            SELECT HistoryID, COUNT(*) AS Test2Fixed, RWID
                            FROM ManufactureTest2
                            WHERE Status = 'fixed'
                            GROUP BY HistoryID
                        ) n2 ON a.id = n2.RWID
                        WHERE a.PlanID = ?
                        ORDER BY a.Created_At DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("HistoryError", err);
          socket.emit("HistoryData", rows);
        });
      } catch (error) {
        socket.emit("HistoryError", error);
      }
    }),
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
});

const getPivotQuery = async (id) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT Bom FROM CheckBOM WHERE PO= ?`,
      [id],
      (err, Boms) => {
        if (err) return reject(err);

        // Create dynamic column aggregation
        const columns = Boms.map(
          (Boms) =>
            `ROUND(SUM(CASE WHEN Bom = '${Boms.Bom}' THEN (So_Luong * SL_Board) ELSE 0 END), 2) AS [${Boms.Bom}]`
        ).join(", ");

        // Full SQL query
        const query = `
          SELECT 
            Description, 
            Manufacturer_1,
            PartNumber_1,
            Manufacturer_2,
            PartNumber_2,
            Manufacturer_3,
            PartNumber_3,  
            ${columns},
            ROUND(IFNULL(SUM(So_Luong * SL_Board), 0), 2) AS SL_Tổng,
            IFNULL(SUM(SL_Board), 0) AS SL_Board,
            Du_Toan_Hao_Phi AS Dự_Toán_Hao_Phí,
            id AS Sửa
          FROM CheckBOM
          WHERE PO = ?
          GROUP BY PartNumber_1;
        `;
        resolve(query);
      }
    );
  });
};
const getCompareInventory = async (id) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT Bom FROM CheckBOM WHERE PO = ?`,
      [id],
      (err, Boms) => {
        if (err) return reject(err);

        // Create dynamic column aggregation
        const columns = Boms.map(
          (Boms) =>
            `ROUND(SUM(CASE WHEN Bom = '${Boms.Bom}' THEN (So_Luong * SL_Board) ELSE 0 END), 2) AS [${Boms.Bom}]`
        ).join(", ");
        // Full SQL query
        const query = `
          SELECT 
            c.Description, 
            c.Manufacturer_1,
            c.PartNumber_1,
            c.Manufacturer_2,
            c.PartNumber_2,
            c.Manufacturer_3,
            c.PartNumber_3,  
            ${columns},
            c.So_Luong,
            SUM(c.So_Luong * c.SL_Board) AS SL_Tổng,
            IFNULL(c.SL_Board, 0) AS SL_Board,
            IFNULL(c.Du_Toan_Hao_Phi, 0) AS Du_Toan_Hao_Phi,
            IFNULL(c.Hao_Phi_Thuc_Te, 0) AS Hao_Phi_Thuc_Te,
            i.Customer AS Ma_Kho,
            w2.Customer AS Ma_Kho_Misa,
            c.Bom,
            c.PO,
            c.id AS Sửa
          FROM CheckBOM c
          LEFT JOIN WareHouse i 
            ON c.PartNumber_1 = i.PartNumber_1 
          LEFT JOIN WareHouse2 w2
            ON c.PartNumber_1 = w2.PartNumber_1
          WHERE c.PO = ?
          GROUP BY c.PartNumber_1;
        `;
        resolve(query);
      }
    );
  });
};

const getCompareWareHouse = async (id) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT Bom FROM DetailOrders WHERE PO = ?`,
      [id],
      (err, Boms) => {
        if (err) return reject(err);

        // Create dynamic column aggregation
        const columns = Boms.map(
          (Boms) =>
            `ROUND(SUM(CASE WHEN Bom = '${Boms.Bom}' THEN (So_Luong * SL_Board) ELSE 0 END), 2) AS [${Boms.Bom}]`
        ).join(", ");
        const Buy = `
          CASE 
            WHEN (SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0)) > IFNULL(i.Inventory, 0) 
            THEN SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0) - IFNULL(i.Inventory, 0)
            ELSE 0 
          END AS Số_Lượng_Cần_Mua
        `;
        const BuyMisa = `
          CASE 
            WHEN (SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0)) > IFNULL(w2.Inventory, 0) 
            THEN SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0) - IFNULL(w2.Inventory, 0)
            ELSE 0 
          END AS Số_Lượng_Cần_Mua_Misa
        `;
        // Full SQL query
        const query = `
          SELECT 
            c.Description Mô_Tả, 
            c.Manufacturer_1,
            c.PartNumber_1,
            c.Manufacturer_2,
            c.PartNumber_2,
            c.Manufacturer_3,
            c.PartNumber_3,  
            ${columns},
            c.So_Luong AS Số_Lượng,
            SUM(c.So_Luong * c.SL_Board) AS SL_Tổng,
            IFNULL(c.SL_Board, 0) AS SL_Board,
            IFNULL(c.Du_Toan_Hao_Phi, 0) AS Dự_Toán_Hao_Phí,
            IFNULL(c.Hao_Phi_Thuc_Te, 0) AS Hao_Phi_Thực_Tế,
            IFNULL(i.Inventory, 0) AS SL_Tồn_Kho,
            c.Ma_Kho AS Mã_Kho,
            IFNULL(w2.Inventory, 0) AS SL_Tồn_Kho_Misa,
            c.Ma_Kho_Misa AS Mã_Kho_Misa,
            ${Buy},
            ${BuyMisa},
            c.id AS Sửa
          FROM DetailOrders c
          LEFT JOIN WareHouse i 
            ON c.PartNumber_1 = i.PartNumber_1
            AND c.Ma_Kho = i.Customer
          LEFT JOIN WareHouse2 w2
            ON c.PartNumber_1 = w2.PartNumber_1
          WHERE c.PO = ?
          GROUP BY c.PartNumber_1, c.Ma_Kho, c.Ma_Kho_Misa;
        `;
        resolve(query);
      }
    );
  });
};

app.post("/insert-compare-inventory/:id", async (req, res) => {
  const id = req.params.id;
  console.log("Processing insert-compare-inventory for PO:", id);

  try {
    // First get the Order_Id from Orders table
    const orderId = await new Promise((resolve, reject) => {
      const orderQuery = `SELECT id FROM Orders WHERE Name_PO = ?`;
      db.get(orderQuery, [id], (err, orderRow) => {
        if (err) {
          reject(err);
          return;
        }
        if (!orderRow) {
          reject(new Error("Không tìm thấy đơn hàng tương ứng"));
          return;
        }
        resolve(orderRow.id);
      });
    });

    // Get the compare inventory data
    const query = await getCompareInventory(id);
    console.log("Generated query:", query);

    const rows = await new Promise((resolve, reject) => {
      db.all(query, [id], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        if (!rows || rows.length === 0) {
          reject(new Error("Không tìm thấy dữ liệu cho PO này"));
          return;
        }
        resolve(rows);
      });
    });

    console.log("Found", rows.length, "rows to insert");

    const insertStmt = db.prepare(`
      INSERT INTO DetailOrders (
        Description, Manufacturer_1, PartNumber_1, Manufacturer_2, PartNumber_2, 
        Manufacturer_3, PartNumber_3, So_Luong, SL_Board, Du_Toan_Hao_Phi, 
        Hao_Phi_Thuc_Te, Ma_Kho, Ma_Kho_Misa, Bom, PO, Order_Id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        await new Promise((resolve, reject) => {
          insertStmt.run(
            row.Description,
            row.Manufacturer_1,
            row.PartNumber_1,
            row.Manufacturer_2,
            row.PartNumber_2,
            row.Manufacturer_3,
            row.PartNumber_3,
            row.So_Luong,
            row.SL_Board,
            row.Du_Toan_Hao_Phi,
            row.Hao_Phi_Thuc_Te,
            row.Ma_Kho,
            row.Ma_Kho_Misa,
            row.Bom,
            row.PO,
            orderId,
            (err) => {
              if (err) {
                console.error(`Error inserting row:`, err.message);
                errorCount++;
                reject(err);
              } else {
                successCount++;
                resolve();
              }
            }
          );
        });
      } catch (err) {
        console.error(`Error preparing row:`, err.message);
        errorCount++;
      }
    }

    insertStmt.finalize();
    console.log(
      `Insert completed. Success: ${successCount}, Errors: ${errorCount}`
    );

    res.json({
      message: "Dữ liệu đã được chèn thành công!",
      total: rows.length,
      success: successCount,
      errors: errorCount,
    });
    io.emit("updateDetailOrders");
  } catch (err) {
    console.error("Lỗi truy vấn:", err.message);
    res
      .status(500)
      .json({ error: "Không thể tạo truy vấn.", details: err.message });
  }
});

// Router register user
app.post("/Users/register", (req, res) => {
  const { Username, FullName, Password, Email, Level, Date } = req.body;

  bcrypt.hash(Password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: "Lỗi mã hóa mật khẩu" });

    db.run(
      `INSERT INTO Users (Username, FullName, Password, Email, Level, Date) VALUES (?, ?, ?, ?, ?, ?)`,
      [Username, FullName, hash, Email, Level, Date],
      function (err) {
        if (err) {
          return console.error(err.message);
        }
        io.emit("updateUsers");
        // Broadcast the new message to all clients
        res.json({ message: "Item inserted successfully" });
      }
    );
  });
});

// Router delete user in Users table
app.delete("/Users/delete-user/:id", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM Users WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateUsers");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router edit user in Users table
app.put("/Users/Edit-User/:id", async (req, res) => {
  const { Username, FullName, Email, Level } = req.body;
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `
    UPDATE Users 
    SET Username = ?, FullName = ?, Email = ?, Level = ?
    WHERE id = ?
  `;
  db.run(query, [Username, FullName, Email, Level, id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateUsers");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});
// Router upload file xlsx to WareHouse table
app.post("/WareHouse/Upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");

  // Read Excel file
  const filePath = path.join(__dirname, req.file.path);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet data to JSON
  const data = xlsx.utils.sheet_to_json(sheet);

  try {
    // Process each row sequentially
    for (const row of data) {
      // Check if PartNumber_1, Description, Customer, and Location match
      const existingRow = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM WareHouse WHERE PartNumber_1 = ? AND Description = ? AND Customer = ? AND Location = ?",
          [row.PartNumber_1, row.Description, row.Customer, row.Location],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      if (existingRow) {
        // Update existing row
        await new Promise((resolve, reject) => {
          const updateStmt = db.prepare(
            "UPDATE WareHouse SET Input = Input + ?, Inventory = Inventory + ? WHERE PartNumber_1 = ? AND Description = ? AND Customer = ? AND Location = ?"
          );
          updateStmt.run(
            row.Input || 0,
            row.Inventory || 0,
            row.PartNumber_1,
            row.Description,
            row.Customer,
            row.Location,
            (err) => {
              updateStmt.finalize();
              if (err) reject(err);
              else resolve();
            }
          );
        });
      } else {
        // Insert new row
        await new Promise((resolve, reject) => {
          const insertStmt = db.prepare(
            "INSERT INTO WareHouse (Description, PartNumber_1, PartNumber_2, Input, Output, Inventory, Customer, Location, Note, Note_Output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          );
          insertStmt.run(
            row.Description,
            row.PartNumber_1,
            row.PartNumber_2,
            row.Input || 0,
            row.Output || 0,
            row.Inventory || 0,
            row.Customer,
            row.Location,
            row.Note,
            row.Note_Output,
            (err) => {
              insertStmt.finalize();
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    res.send("File processed successfully.");
    io.emit("WareHouseUpdate");
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send("Error processing file: " + error.message);
  }
});

// Router update item WareHouse table
app.put("/WareHouse/update-item/:id", async (req, res) => {
  const {
    PartNumber1_Edit,
    PartNumber2_Edit,
    Description_Edit,
    Input_Edit,
    Output_Edit,
    inventory_Edit,
    Location_Edit,
    Customer_Edit,
    Note_Edit,
    Note_Output_Edit,
  } = req.body;
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
  UPDATE WareHouse 
  SET PartNumber_1 = ?, PartNumber_2 = ?, Description = ?, Input = ?, Output = ?, Inventory = ?, Location = ?, Customer = ?, Note = ?, Note_Output = ? 
  WHERE id = ?`;
  db.run(
    query,
    [
      PartNumber1_Edit,
      PartNumber2_Edit,
      Description_Edit,
      Input_Edit,
      Output_Edit,
      inventory_Edit,
      Location_Edit,
      Customer_Edit,
      Note_Edit,
      Note_Output_Edit,
      id,
    ],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      io.emit("WareHouseUpdate");
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});

// Router update item WareHouse2 table
app.put("/WareHouse2/update-item/:id", async (req, res) => {
  const {
    PartNumber1_Edit,
    PartNumber2_Edit,
    Description_Edit,
    Input_Edit,
    Output_Edit,
    inventory_Edit,
    Location_Edit,
    Customer_Edit,
    Note_Edit,
    Note_Output_Edit,
  } = req.body;
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
  UPDATE WareHouse2 
  SET PartNumber_1 = ?, PartNumber_2 = ?, Description = ?, Input = ?, Output = ?, Inventory = ?, Location = ?, Customer = ?, Note = ?, Note_Output = ? 
  WHERE id = ?`;
  db.run(
    query,
    [
      PartNumber1_Edit,
      PartNumber2_Edit,
      Description_Edit,
      Input_Edit,
      Output_Edit,
      inventory_Edit,
      Location_Edit,
      Customer_Edit,
      Note_Edit,
      Note_Output_Edit,
      id,
    ],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      io.emit("WareHouse2Update");
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});

// Router delete item in WareHouse table
app.delete("/WareHouse/delete-item/:id", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM WareHouse WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("WareHouseUpdate");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

//Router post new item in WareHouse table
app.post("/WareHouse/upload-new-item", (req, res) => {
  const {
    PartNumber_1,
    PartNumber_2,
    Description,
    Input,
    Output,
    Inventory,
    Location,
    Customer,
    Note,
    Note_Output,
  } = req.body;
  // Insert data into SQLite database
  const query =
    "INSERT INTO WareHouse (Description, PartNumber_1, PartNumber_2, Input, Output, Inventory, Customer, Location, Note, Note_Output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.run(
    query,
    [
      Description,
      PartNumber_1,
      PartNumber_2,
      Input,
      Output,
      Inventory,
      Location,
      Customer,
      Note,
      Note_Output,
    ],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      io.emit("WareHouseUpdate");
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});

// Router upload file xlsx to WareHouse2 table
app.post("/WareHouse2/Upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");

  // Read Excel file
  const filePath = path.join(__dirname, req.file.path);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet data to JSON
  const data = xlsx.utils.sheet_to_json(sheet);

  try {
    // Process each row sequentially
    for (const row of data) {
      // Check if PartNumber_1, Description, Customer, and Location match
      const existingRow = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM WareHouse2 WHERE PartNumber_1 = ? AND Description = ? AND Customer = ? AND Location = ?",
          [row.PartNumber_1, row.Description, row.Customer, row.Location],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      if (existingRow) {
        // Update existing row
        await new Promise((resolve, reject) => {
          const updateStmt = db.prepare(
            "UPDATE WareHouse2 SET Input = Input + ?, Inventory = Inventory + ? WHERE PartNumber_1 = ? AND Description = ? AND Customer = ? AND Location = ?"
          );
          updateStmt.run(
            row.Input || 0,
            row.Inventory || 0,
            row.PartNumber_1,
            row.Description,
            row.Customer,
            row.Location,
            (err) => {
              updateStmt.finalize();
              if (err) reject(err);
              else resolve();
            }
          );
        });
      } else {
        // Insert new row
        await new Promise((resolve, reject) => {
          const insertStmt = db.prepare(
            "INSERT INTO WareHouse2 (Description, PartNumber_1, PartNumber_2, Input, Output, Inventory, Customer, Location, Note, Note_Output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          );
          insertStmt.run(
            row.Description,
            row.PartNumber_1,
            row.PartNumber_2,
            row.Input || 0,
            row.Output || 0,
            row.Inventory || 0,
            row.Customer,
            row.Location,
            row.Note,
            row.Note_Output,
            (err) => {
              insertStmt.finalize();
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }
    io.emit("WareHouse2Update");
    res.send("File processed successfully.");
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send("Error processing file: " + error.message);
  }
});
// Router delete item in WareHouse2 table
app.delete("/WareHouse2/delete-item/:id", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM WareHouse2 WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("WareHouse2Update");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

//Router post new item in WareHouse2 table
app.post("/WareHouse2/upload-new-item", (req, res) => {
  const {
    PartNumber_1,
    PartNumber_2,
    Description,
    Input,
    Output,
    Inventory,
    Location,
    Customer,
    Note,
    Note_Output,
  } = req.body;
  // Insert data into SQLite database
  const query =
    "INSERT INTO WareHouse2 (Description, PartNumber_1, PartNumber_2, Input, Output, Inventory, Customer, Location, Note, Note_Output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.run(
    query,
    [
      Description,
      PartNumber_1,
      PartNumber_2,
      Input,
      Output,
      Inventory,
      Location,
      Customer,
      Note,
      Note_Output,
    ],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      io.emit("WareHouse2Update");
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});

// Router delete item in Orders
app.delete("/Orders/delete-item/:id", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM Orders WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateOrders");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router delete item in CheckBom table
app.delete("/CheckBom/Delete-Item/:id", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM CheckBOM WHERE Bom = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateDetailBom");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Route to post item into list PO
app.post("/ListPO/upload-new-PO", async (req, res) => {
  const { Name_PO, Quantity_Type, Quantity_Items, Status, Date, Creater } =
    req.body;
  // Insert data into SQLite database
  const query =
    "INSERT INTO Orders (Name_PO, Quantity_Type, Quantity_Items, Status, Date, Creater) VALUES (?, ?, ?, ?, ?, ?)";
  db.run(
    query,
    [Name_PO, Quantity_Type, Quantity_Items, Status, Date, Creater],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      io.emit("updateOrders");
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});
// Router update Hao_Phi in CheckBom table
app.put("/CheckBom/Update-Hao-Phi", async (req, res) => {
  const { Input_Hao_Phi, Name_Item, PO } = req.body;
  // Insert data into SQLite database
  const query = `UPDATE CheckBOM SET Du_Toan_Hao_Phi = ? WHERE PartNumber_1 = ? AND PO = ?`;
  db.run(query, [Input_Hao_Phi, Name_Item, PO], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateCheckBOM", PO);
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router update Hao_Phi_Thuc_Te in CheckBom table
app.put("/DetailOrders/Update", async (req, res) => {
  const { Input_Hao_Phi_Thuc_Te, Ma_Kho, Ma_Kho_Misa, PartNumber_1, PO } =
    req.body;
  // Insert data into SQLite database
  const query = `UPDATE DetailOrders SET Hao_Phi_Thuc_Te = ?, Ma_Kho = ?, Ma_Kho_Misa = ? WHERE PartNumber_1 = ?`;
  db.run(
    query,
    [Input_Hao_Phi_Thuc_Te, Ma_Kho, Ma_Kho_Misa, PartNumber_1],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      io.emit("updateCompare", PO);
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});

// Router update item in CheckBom table
app.put("/CheckBom/Edit-Item/:id", async (req, res) => {
  const { PO, SL_Board } = req.body;
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `UPDATE CheckBOM SET PO = ?, SL_Board = ? WHERE Bom = ?`;
  db.run(query, [PO, SL_Board, id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateDetailBom");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router update WareHouse accept
app.put("/Orders/WareHouse-Accept/:id", async (req, res) => {
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `UPDATE Orders SET Status = 1 WHERE Name_PO = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateOrders");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router update WareHouse accept
app.put("/WareHouse/update-Inventory-CheckBom/:id", async (req, res) => {
  const { id } = req.params;
  const poNumber = id;
  // Insert data into SQLite database
  const query = `
    UPDATE WareHouse
    SET Inventory = 
      CASE 
        WHEN Inventory > (SELECT SUM(cb.So_Luong * cb.SL_Board + IFNULL(cb.Hao_Phi_Thuc_Te, 0))
                          FROM DetailOrders cb
                          WHERE cb.PartNumber_1 = WareHouse.PartNumber_1 AND cb.PO = ?)
        THEN Inventory - (SELECT SUM(cb.So_Luong * cb.SL_Board + IFNULL(cb.Hao_Phi_Thuc_Te, 0))
                          FROM DetailOrders cb
                          WHERE cb.PartNumber_1 = WareHouse.PartNumber_1 AND cb.PO = ?)
        ELSE 0
      END
    WHERE PartNumber_1 IN (SELECT PartNumber_1 FROM DetailOrders WHERE PO = ?)
  `;
  db.all(query, [poNumber, poNumber, poNumber], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateCompare");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

app.put("/WareHouse2/update-Inventory-CheckBom/:id", async (req, res) => {
  const { id } = req.params;
  const poNumber = id;
  // Insert data into SQLite database
  const query = `
    UPDATE WareHouse2
    SET Inventory = 
      CASE 
        WHEN Inventory > (SELECT SUM(cb.So_Luong * cb.SL_Board + cb.Hao_Phi_Thuc_Te)
                          FROM DetailOrders cb
                          WHERE cb.PartNumber_1 = WareHouse2.PartNumber_1 AND cb.PO = ?)
        THEN Inventory - (SELECT SUM(cb.So_Luong * cb.SL_Board + cb.Hao_Phi_Thuc_Te)
                          FROM DetailOrders cb
                          WHERE cb.PartNumber_1 = WareHouse2.PartNumber_1 AND cb.PO = ?)
        ELSE 0
      END
    WHERE PartNumber_1 IN (SELECT PartNumber_1 FROM DetailOrders WHERE PO = ?)
  `;
  db.all(query, [poNumber, poNumber, poNumber], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateCompare");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router update item in ProductDetails table
app.put("/Project/Customer/Edit-Item/:id", async (req, res) => {
  const {
    Product_Detail,
    Quantity_Product,
    Quantity_Delivered,
    Quantity_Amount,
    Note,
  } = req.body;
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    UPDATE ProductDetails 
    SET ProductDetail = ?, QuantityProduct = ?, QuantityDelivered = ?, QuantityAmount = ?, Note = ? 
    WHERE id = ?`;
  db.run(
    query,
    [
      Product_Detail,
      Quantity_Product,
      Quantity_Delivered,
      Quantity_Amount,
      Note,
      id,
    ],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" }); // Send 500 status and error message
      }
      io.emit("updateDetailProjectPO");
      // Broadcast the new message to all clients
      res.json({ message: "Đã cập nhật dữ liệu thành công" });
    }
  );
});

// Router add new item in ProductDetails table
app.post("/Project/Customer/Add-Item", async (req, res) => {
  const {
    Product_Detail,
    Quantity_Product,
    Quantity_Delivered,
    Quantity_Amount,
    Note,
    POID,
    CustomerID,
  } = req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO ProductDetails (ProductDetail, QuantityProduct, QuantityDelivered, QuantityAmount, Note, POID, CustomerID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(
    query,
    [
      Product_Detail,
      Quantity_Product,
      Quantity_Delivered,
      Quantity_Amount,
      Note,
      POID,
      CustomerID,
    ],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      io.emit("updateDetailProjectPO");
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});

// Router delete item in ProductDetails table
app.delete("/Project/Customer/Delete-Item/:id", async (req, res) => {
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    DELETE FROM ProductDetails WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" }); // Send 500 status and error message
    }
    io.emit("updateDetailProjectPO");
    // Broadcast the new message to all clients
    res.json({ message: "Đã cập nhật dữ liệu thành công" });
  });
});

// Router update orders in PurchaseDetails table
app.put("/Project/Customer/Edit-Orders/:id", async (req, res) => {
  const { PONumber, DateCreated, DateDelivery, Note, CustomerID } = req.body;
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    UPDATE PurchaseOrders
    SET PONumber = ?, DateCreated = ?, DateDelivery = ?, Note = ?, CustomerID = ?
    WHERE id = ?`;
  db.run(
    query,
    [PONumber, DateCreated, DateDelivery, Note, CustomerID, id],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" }); // Send 500 status and error message
      }
      io.emit("updateDetailProject");
      // Broadcast the new message to all clients
      res.json({ message: "Đã cập nhật dữ liệu thành công" });
    }
  );
});

// Router add new orders in PurchaseDetails table
app.post("/Project/Customer/Add-Orders", async (req, res) => {
  const { PONumber, DateCreated, DateDelivery, Note, CustomerID } = req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO PurchaseOrders (PONumber, DateCreated, DateDelivery, Note, CustomerID)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(
    query,
    [PONumber, DateCreated, DateDelivery, Note, CustomerID],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" }); // Send 500 status and error message
      }
      io.emit("updateDetailProject");
      // Broadcast the new message to all clients
      res.json({ message: "Đã cập nhật dữ liệu thành công" });
    }
  );
});

// Router delete orders in PurchaseDetails table
app.delete("/Project/Customer/Delete-Orders/:id", async (req, res) => {
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    DELETE FROM PurchaseOrders WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" }); // Send 500 status and error message
    }
    io.emit("updateDetailProject");
    // Broadcast the new message to all clients
    res.json({ message: "Đã cập nhật dữ liệu thành công" });
  });
});

// Router update customer in Customers table
app.put("/Project/Customer/Edit-Customer/:id", async (req, res) => {
  const { CustomerName, Years } = req.body;
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    UPDATE Customers
    SET CustomerName = ?, Years = ?
    WHERE id = ?`;
  db.run(query, [CustomerName, Years, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" }); // Send 500 status and error message
    }
    io.emit("ProjectUpdate");
    // Broadcast the new message to all clients
    res.json({ message: "Đã cập nhật dữ liệu thành công" });
  });
});

// Router add new orders in PurchaseDetails table
app.post("/Project/Customer/Add-Customer", async (req, res) => {
  const { CustomerName, Years } = req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO Customers (CustomerName, Years)
    VALUES (?, ?)
  `;
  db.run(query, [CustomerName, Years], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" }); // Send 500 status and error message
    }
    io.emit("ProjectUpdate");
    // Broadcast the new message to all clients
    res.json({ message: "Đã cập nhật dữ liệu thành công" });
  });
});

// Router delete orders in PurchaseDetails table
app.delete("/Project/Customer/Delete-Customer/:id", async (req, res) => {
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    DELETE FROM Customers WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" }); // Send 500 status and error message
    }
    io.emit("ProjectUpdate");
    // Broadcast the new message to all clients
    res.json({ message: "Đã cập nhật dữ liệu thành công" });
  });
});

// Router add new item in Maintenance table
app.post("/Machine/Add", async (req, res) => {
  const { TenThietBi, LoaiThietBi, NhaSanXuat, NgayMua, ViTri, MoTa } =
    req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO Machine (TenThietBi, LoaiThietBi, NhaSanXuat, NgayMua, ViTri, MoTa)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(
    query,
    [TenThietBi, LoaiThietBi, NhaSanXuat, NgayMua, ViTri, MoTa],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("MachineUpdate");
      // Broadcast the new message to all clients
      res.json({ message: "Đã cập nhật dữ liệu thành công" });
    }
  );
});

// Router update item in Machine table
app.put("/Machine/Edit/:id", async (req, res) => {
  const { id } = req.params;
  const { TenThietBi, LoaiThietBi, NhaSanXuat, NgayMua, ViTri, MoTa } =
    req.body;
  // Insert data into SQLite database
  const query = `
    UPDATE Machine 
    SET TenThietBi = ?, LoaiThietBi = ?, NhaSanXuat = ?, NgayMua = ?, ViTri = ?, MoTa = ?
    WHERE MaThietBi = ?
  `;
  db.run(
    query,
    [TenThietBi, LoaiThietBi, NhaSanXuat, NgayMua, ViTri, MoTa, id],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("MachineUpdate");
      res.json({ message: "Đã cập nhật dữ liệu thành công" });
    }
  );
});

// Router delete item in Machine table
app.delete("/Machine/Delete/:id", async (req, res) => {
  const { id } = req.params;

  // Start a transaction
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    try {
      // Delete related records first
      db.run("DELETE FROM SparePartUsage WHERE MaThietBi = ?", [id]);
      db.run("DELETE FROM Maintenance WHERE MaThietBi = ?", [id]);
      db.run("DELETE FROM MaintenanceSchedule WHERE MaThietBi = ?", [id]);

      // Finally delete the machine
      db.run("DELETE FROM Machine WHERE MaThietBi = ?", [id], function (err) {
        if (err) {
          db.run("ROLLBACK");
          return res
            .status(500)
            .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
        }

        db.run("COMMIT");
        io.emit("MachineUpdate");
        res.json({ message: "Đã xoá dữ liệu thiết bị thành công" });
      });
    } catch (error) {
      db.run("ROLLBACK");
      return res
        .status(500)
        .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
    }
  });
});

// Router add new item in Maintenance table
app.post("/Maintenance/Add", async (req, res) => {
  try {
    const {
      MaThietBi,
      NgayBaoTri,
      LoaiBaoTri,
      MoTaLoi,
      BienPhapKhacPhuc,
      NguoiTao,
      NguoiThucHien,
      ChiPhi,
      NgayHoanThanh,
      TrangThai,
      PhuongAn,
      PhuTung,
    } = req.body;
    console.log(req.body);
    // Insert data into SQLite database
    const query = `
      INSERT INTO Maintenance (
        MaThietBi, 
        NgayBaoTri,
        LoaiBaoTri, 
        MoTaLoi, 
        BienPhapKhacPhuc, 
        NguoiTao,
        NguoiThucHien, 
        ChiPhi, 
        NgayHoanThanh, 
        TrangThai,
        PhuongAn,
        PhuTung
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [
        MaThietBi,
        NgayBaoTri,
        LoaiBaoTri,
        MoTaLoi,
        BienPhapKhacPhuc,
        NguoiTao,
        NguoiThucHien,
        ChiPhi,
        NgayHoanThanh,
        TrangThai,
        PhuongAn,
        PhuTung,
      ],
      function (err) {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu",
            details: err.message,
          });
        }

        io.emit("MaintenanceUpdate");
        res.json({
          message: "Thêm dữ liệu bảo trì thành công",
          id: this.lastID,
        });
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Lỗi server",
      details: error.message,
    });
  }
});

// Router update item in Maintenance table
app.put("/Maintenance/Edit/:id", async (req, res) => {
  const { id } = req.params;
  const {
    MaThietBi,
    NgayBaoTri,
    LoaiBaoTri,
    MoTaLoi,
    BienPhapKhacPhuc,
    NguoiTao,
    NguoiThucHien,
    ChiPhi,
    NgayHoanThanh,
    TrangThai,
    PhuongAn,
    PhuTung,
  } = req.body;
  // Insert data into SQLite database
  const query = `
    UPDATE Maintenance 
    SET MaThietBi = ?, NgayBaoTri = ?, LoaiBaoTri = ?, MoTaLoi = ?, BienPhapKhacPhuc = ?, NguoiTao = ?, NguoiThucHien = ?, ChiPhi = ?, NgayHoanThanh = ?, TrangThai = ?, PhuongAn = ?, PhuTung = ?
    WHERE MaBaoTri = ?
  `;
  db.run(
    query,
    [
      MaThietBi,
      NgayBaoTri,
      LoaiBaoTri,
      MoTaLoi,
      BienPhapKhacPhuc,
      NguoiTao,
      NguoiThucHien,
      ChiPhi,
      NgayHoanThanh,
      TrangThai,
      PhuongAn,
      PhuTung,
      id,
    ],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("MaintenanceUpdate");
      res.json({ message: "Đã cập nhật dữ liệu thành công" });
    }
  );
});

// Router delete item in Maintenance table
app.delete("/Maintenance/Delete/:id", async (req, res) => {
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    DELETE FROM Maintenance WHERE MaBaoTri = ?
  `;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("MaintenanceUpdate");
    res.json({ message: "Đã xoá dữ liệu thành công" });
  });
});

// Router add new item in MaintenanceSchedule table
app.post("/MaintenanceSchedule/Add", async (req, res) => {
  const {
    MaThietBi,
    LoaiBaoTri,
    ChuKyBaoTri,
    DonViChuKy,
    NgayBatDau,
    NgayBaoTriTiepTheo,
    GhiChu,
  } = req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO MaintenanceSchedule (MaThietBi, LoaiBaoTri, ChuKyBaoTri, DonViChuKy, NgayBatDau, NgayBaoTriTiepTheo, GhiChu)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(
    query,
    [
      MaThietBi,
      LoaiBaoTri,
      ChuKyBaoTri,
      DonViChuKy,
      NgayBatDau,
      NgayBaoTriTiepTheo,
      GhiChu,
    ],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu" });
      }
      io.emit("MaintenanceScheduleUpdate");
      res.json({ message: "Đã thêm dữ liệu bảo trì định kỳ thành công" });
    }
  );
});

// Router update item in MaintenanceSchedule table
app.put("/MaintenanceSchedule/Edit/:id", async (req, res) => {
  const { id } = req.params;
  const {
    MaThietBi,
    LoaiBaoTri,
    ChuKyBaoTri,
    DonViChuKy,
    NgayBatDau,
    NgayBaoTriTiepTheo,
    GhiChu,
  } = req.body;
  // Insert data into SQLite database
  const query = `
    UPDATE MaintenanceSchedule 
    SET MaThietBi = ?, LoaiBaoTri = ?, ChuKyBaoTri = ?, DonViChuKy = ?, NgayBatDau = ?, NgayBaoTriTiepTheo = ?, GhiChu = ?
    WHERE MaLich = ?
  `;
  db.run(
    query,
    [
      MaThietBi,
      LoaiBaoTri,
      ChuKyBaoTri,
      DonViChuKy,
      NgayBatDau,
      NgayBaoTriTiepTheo,
      GhiChu,
      id,
    ],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("MaintenanceScheduleUpdate");
      res.json({ message: "Đã cập nhật dữ liệu bảo trì định kỳ thành công" });
    }
  );
});

// Router delete item in MaintenanceSchedule table
app.delete("/MaintenanceSchedule/Delete/:id", async (req, res) => {
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    DELETE FROM MaintenanceSchedule WHERE MaLich = ?
  `;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("MaintenanceScheduleUpdate");
    res.json({ message: "Đã xoá dữ liệu bảo trì định kỳ thành công" });
  });
});

// Router add new item in SparePartUsage table
app.post("/SparePartUsage/Add", async (req, res) => {
  const { MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu } =
    req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO SparePartUsage (MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(
    query,
    [MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu" });
      }
      io.emit("SparePartUsageUpdate");
      res.json({ message: "Đã thêm dữ liệu sử dụng phụ tùng thành công" });
    }
  );
});

// Router update item in SparePartUsage table
app.put("/SparePartUsage/Edit/:id", async (req, res) => {
  const { id } = req.params;
  const { MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu } =
    req.body;
  // Insert data into SQLite database
  const query = `
    UPDATE SparePartUsage 
    SET MaBaoTri = ?, MaThietBi = ?, TenPhuTung = ?, SoLuongSuDung = ?, DonVi = ?, GhiChu = ?
    WHERE MaSuDung = ?
  `;
  db.run(
    query,
    [MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu, id],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("SparePartUsageUpdate");
      res.json({ message: "Đã cập nhật dữ liệu sử dụng phụ tùng thành công" });
    }
  );
});

// Router delete item in SparePartUsage table
app.delete("/SparePartUsage/Delete/:id", async (req, res) => {
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    DELETE FROM SparePartUsage WHERE MaSuDung = ?
  `;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("SparePartUsageUpdate");
    res.json({ message: "Đã xoá dữ liệu sử dụng phụ tùng thành công" });
  });
});

// Router add new item in PlanManufacture table
app.post("/PlanManufacture/Add", async (req, res) => {
  const {
    Name,
    Name_Order,
    Date,
    Creater,
    Note,
    Total,
    DelaySMT,
    Level,
    Quantity,
    ProjectID,
  } = req.body; // Set default value for DelaySMT
  const LevelString = JSON.stringify(Level);
  const LevelCleaned = LevelString.replace(/[\[\]"]/g, "").replace(/,/g, "-");
  // Insert data into SQLite database
  const query = `
    INSERT INTO PlanManufacture (Name, Date, Creater, Note, Total, DelaySMT, Level, Quantity, ProjectID, Name_Order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(
    query,
    [
      Name,
      Date,
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
        return res
          .status(500)
          .json({ error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu" });
      }
      io.emit("ManufactureUpdate");
      res.json({ message: "Đã thêm dữ liệu dự án sản xuất thành công" });
    }
  );
});

// Router update item in PlanManufacture table
app.put("/PlanManufacture/Edit/:id", async (req, res) => {
  const { id } = req.params;
  const { Name, Date, Creater, Note, Total, DelaySMT, Level, Quantity } =
    req.body;
  const LevelString = JSON.stringify(Level);
  const LevelCleaned = LevelString.replace(/[\[\]"]/g, "").replace(/,/g, "-");
  // Insert data into SQLite database
  const query = `
      UPDATE PlanManufacture 
      SET Name = ?, Date = ?, Creater = ?, Note = ?, Total = ?, DelaySMT = ?, Level = ?, Quantity = ?
      WHERE id = ?
    `;
  db.run(
    query,
    [Name, Date, Creater, Note, Total, DelaySMT, LevelCleaned, Quantity, id],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("ManufactureUpdate");
      res.json({ message: "Đã cập nhật dữ liệu dự án sản xuất thành công" });
    }
  );
});

// Router update item in PlanManufacture table for setting SMT
app.put("/PlanManufacture/Edit-SMT/:id", async (req, res) => {
  const { id } = req.params;
  const { DelaySMT, Quantity } = req.body;
  // Insert data into SQLite database
  const query = `
      UPDATE PlanManufacture 
      SET DelaySMT = ?, Quantity = ?
      WHERE id = ?
    `;
  db.run(query, [DelaySMT, Quantity, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("ManufactureUpdate");
    res.json({ message: "Đã cập nhật dữ liệu dự án sản xuất thành công" });
  });
});

// Router delete item in PlanManufacture table
app.delete("/PlanManufacture/Delete/:id", async (req, res) => {
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
});

const ESP32_IP = "http://192.168.2.241"; // IP ESP32 (phải đổi đúng IP của bạn)

app.post("/api/esp-config", async (req, res) => {
  const { project_id, delay } = req.body;
  try {
    const response = await axios.post(
      `${ESP32_IP}/set-project`,
      {
        project_id,
        delay,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    res.json({
      status: "project_id sent to esp32",
      esp32Response: response.data,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send project_id to esp32",
      detail: error.message,
    });
  }
});

app.post("/api/sensor", (req, res) => {
  const { project_id, input_value } = req.body;
  const Timestamp = new Date()
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok", // GMT+7 timezone
    })
    .replace(/,/g, "");
  if (!project_id || input_value === undefined) {
    return res
      .status(400)
      .json({ error: "Missing project_id or sensor_value" });
  }

  const stmt = db.prepare(
    "INSERT INTO ManufactureSMT (HistoryID, Input, Timestamp) VALUES (?, ?, ?)"
  );
  stmt.run(project_id, input_value, Timestamp, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    io.emit("UpdateManufactureSMT");
    io.emit("updateManufactureDetails");
    io.emit("UpdateHistory");
    io.emit("UpdateSummary");
    res.json({ success: true, id: this.lastID });
  });
  stmt.finalize();
});

app.delete("/reset-data/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    DELETE FROM ManufactureSMT WHERE PlanID = ?
  `;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateManufactureSMT");
    io.emit("updateManufactureDetails");
    res.json({ message: "Đã xoá dữ liệu sản xuất thành công" });
  });
});

app.post("/api/heartbeat", (req, res) => {
  const { device_id } = req.body;
  const now = Date.now();
  console.log(`Heartbeat from ${device_id} at ${new Date(now).toISOString()}`); // Thêm dòng này

  db.run(
    `INSERT INTO heartbeats (device_id, last_seen)
     VALUES (?, ?)
     ON CONFLICT(device_id) DO UPDATE SET last_seen = ?`,
    [device_id, now, now],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("device-status", {
        device_id,
        status: "online",
        last_seen: now,
      });

      res.json({ message: "Heartbeat received" });
    }
  );
});

app.get("/api/devices", (req, res) => {
  const now = Date.now();
  const timeout = 60000; // 1 phút

  db.all(`SELECT device_id, last_seen FROM heartbeats`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const devices = rows.map((row) => ({
      device_id: row.device_id,
      status: now - row.last_seen < timeout ? "online" : "offline",
      last_seen: new Date(row.last_seen).toLocaleString(),
    }));

    res.json(devices);
  });
});

// Post value in table ManufactureAOI
app.post("/Manufacture/AOI", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status } = req.body;

  db.run(
    `INSERT INTO ManufactureAOI (PartNumber, HistoryID, Timestamp, Status)
     VALUES (?, ?, ? ,?)`,
    [PartNumber, HistoryID, Timestamp, Status],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureAOI");
      io.emit("updateManufactureDetails");
      res.json({ message: "ManufactureAOI received" });
    }
  );
});

// Post value in table ManufactureRW
app.post("/Manufacture/RW", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status } = req.body;

  db.run(
    `INSERT INTO ManufactureRW (HistoryID, PartNumber, Timestamp, Status)
     VALUES (?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureRW");
      io.emit("updateManufactureDetails");
      res.json({ message: "ManufactureRW received" });
    }
  );
});


// Post value in table ManufactureIPQC
app.post("/Manufacture/IPQC", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status } = req.body;

  db.run(
    `INSERT INTO ManufactureIPQC (HistoryID, PartNumber, Timestamp, Status)
     VALUES (?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureIPQC");
      io.emit("updateManufactureDetails");
      res.json({ message: "ManufactureIPQC received" });
    }
  );
});

// Post value in table ManufactureAssembly
app.post("/Manufacture/Assembly", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status } = req.body;

  db.run(
    `INSERT INTO ManufactureAssembly (HistoryID, PartNumber, Timestamp, Status)
     VALUES (?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureAssembly");
      io.emit("updateManufactureDetails");
      res.json({ message: "ManufactureTest received" });
    }
  );
});

// Post value in table ManufactureOQC
app.post("/Manufacture/OQC", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status } = req.body;

  db.run(
    `INSERT INTO ManufactureOQC (HistoryID, PartNumber, Timestamp, Status)
     VALUES (?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureOQC");
      io.emit("updateManufactureDetails");
      res.json({ message: "ManufactureOQC received" });
    }
  );
});

// Post value in table ManufactureIPQCSMT
app.post("/Manufacture/IPQC-SMT", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status } = req.body;

  db.run(
    `INSERT INTO ManufactureIPQCSMT (HistoryID, PartNumber, Timestamp, Status)
     VALUES (?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureIPQCSMT");
      io.emit("updateManufactureDetails");
      res.json({ message: "ManufactureIPQCSMT received" });
    }
  );
});
// Post value in table ManufactureBoxBuild
app.post("/Manufacture/BoxBuild", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status } = req.body;

  db.run(
    `INSERT INTO ManufactureBoxBuild (HistoryID, PartNumber, Timestamp, Status)
     VALUES (?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureBoxBuild");
      io.emit("updateManufactureDetails");
      res.json({ message: "ManufactureBoxBuild received" });
    }
  );
});
// Post value in table ManufactureTest1
app.post("/Manufacture/Test1", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status } = req.body;

  db.run(
    `INSERT INTO ManufactureTest1 (HistoryID, PartNumber, Timestamp, Status)
     VALUES (?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureTest1");
      io.emit("updateManufactureDetails");
      res.json({ message: "ManufactureOQC received" });
    }
  );
});
// Post value in table ManufactureTest2
app.post("/Manufacture/Test2", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status } = req.body;

  db.run(
    `INSERT INTO ManufactureTest2 (HistoryID, PartNumber, Timestamp, Status)
     VALUES (?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureTest2");
      io.emit("updateManufactureDetails");
      res.json({ message: "ManufactureOQC received" });
    }
  );
});
// Post value in table ManufactureWarehouse
app.post("/Manufacture/Warehouse", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status } = req.body;

  db.run(
    `INSERT INTO ManufactureWarehouse (HistoryID, PartNumber, Timestamp, Status)
     VALUES (?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureWarehouse");
      io.emit("updateManufactureDetails");
      res.json({ message: "ManufactureOQC received" });
    }
  );
});

// Router update item in IPQC SMT table for Status
app.put("/Manufacture/IPQC-SMT/Edit-status/:id", async (req, res) => {
  const { id } = req.params;
  const { Status } = req.body;
  // Insert data into SQLite database
  const query = `
      UPDATE ManufactureIPQCSMT 
      SET Status = ?
      WHERE id = ?
    `;
  db.run(query, [Status, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateManufactureIPQCSMT");
    io.emit("updateManufactureDetails");
    res.json({ message: "ManufactureIPQCSMT received" });
  });
});

// Router update item in IPQC table for Status
app.put("/Manufacture/IPQC/Edit-status/:id", async (req, res) => {
  const { id } = req.params;
  const { Status } = req.body;
  // Insert data into SQLite database
  const query = `
      UPDATE ManufactureIPQC
      SET Status = ?
      WHERE id = ?
    `;
  db.run(query, [Status, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateManufactureIPQC");
    io.emit("updateManufactureDetails");
    res.json({ message: "ManufactureIPQC received" });
  });
});

// Router update item in Test 1 table for Status
app.put("/Manufacture/Test1/Edit-status/:id", async (req, res) => {
  const { id } = req.params;
  const { Status } = req.body;
  // Insert data into SQLite database
  const query = `
      UPDATE ManufactureTest1
      SET Status = ?
      WHERE id = ?
    `;
  db.run(query, [Status, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateManufactureTest1");
    io.emit("updateManufactureDetails");
    res.json({ message: "ManufactureTest1 received" });
  });
});

// Router update item in Test 2 table for Status
app.put("/Manufacture/Test2/Edit-status/:id", async (req, res) => {
  const { id } = req.params;
  const { Status } = req.body;
  // Insert data into SQLite database
  const query = `
      UPDATE ManufactureTest2
      SET Status = ?
      WHERE id = ?
    `;
  db.run(query, [Status, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateManufactureTest2");
    io.emit("updateManufactureDetails");
    res.json({ message: "ManufactureTest2 received" });
  });
});

// Router update item in OQC table for Status
app.put("/Manufacture/OQC/Edit-status/:id", async (req, res) => {
  const { id } = req.params;
  const { Status } = req.body;
  // Insert data into SQLite database
  const query = `
      UPDATE ManufactureOQC
      SET Status = ?
      WHERE id = ?
    `;
  db.run(query, [Status, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateManufactureOQC");
    io.emit("updateManufactureDetails");
    res.json({ message: "ManufactureOQC received" });
  });
});

// Router update item in AOI table for Status
app.put("/Manufacture/AOI/Edit-status/:id", async (req, res) => {
  const { id } = req.params;
  const { Status } = req.body;
  // Insert data into SQLite database
  const query = `
      UPDATE ManufactureAOI
      SET Status = ?
      WHERE id = ?
    `;
  db.run(query, [Status, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateManufactureAOI");
    io.emit("updateManufactureDetails");
    res.json({ message: "ManufactureAOI received" });
  });
});

// Update value in table AOI Status
app.put("/Manufacture/AOI-Fixed/Edit-status/:id", (req, res) => {
  const {
    Status,
    RWID,
    TimestampRW
  } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureAOI
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [
      Status,
      RWID,
      TimestampRW,
      id,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureAOI");
      io.emit("UpdateHistory");
      io.emit("UpdateManufactureRW");
      io.emit("updateManufactureDetails");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table IPQC Status
app.put("/Manufacture/IPQC-Fixed/Edit-status/:id", (req, res) => {
  const {
    Status,
    RWID,
    TimestampRW
  } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureIPQC
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [
      Status,
      RWID,
      TimestampRW,
      id,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureIPQC");
      io.emit("UpdateManufactureRW");
      io.emit("UpdateHistory");
      io.emit("updateManufactureDetails");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table IPQC-SMT Status
app.put("/Manufacture/IPQC-SMT-Fixed/Edit-status/:id", (req, res) => {
  const {
    Status,
    RWID,
    TimestampRW
  } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureIPQCSMT
      SET RWID=?, TimestampRW=?
      WHERE id=?`,
    [
      Status,
      RWID,
      TimestampRW,
      id,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureIPQCSMT");
      io.emit("UpdateManufactureRW");
      io.emit("UpdateHistory");
      io.emit("updateManufactureDetails");
      res.json({ message: "IPQCSMT received" });
    }
  );
});

// Update value in table Test1 Status
app.put("/Manufacture/Test1-Fixed/Edit-status/:id", (req, res) => {
  const {
    Status,
    RWID,
    TimestampRW
  } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureTest1
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [
      Status,
      RWID,
      TimestampRW,
      id,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureTest1");
      io.emit("UpdateManufactureRW");
      io.emit("UpdateHistory");
      io.emit("updateManufactureDetails");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table Test2 Status
app.put("/Manufacture/Test2-Fixed/Edit-status/:id", (req, res) => {
  const {
    Status,
    RWID,
    TimestampRW
  } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureAOI
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [
      Status,
      RWID,
      TimestampRW,
      id,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureTest2");
      io.emit("UpdateManufactureRW");
      io.emit("UpdateHistory");
      io.emit("updateManufactureDetails");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table OQC Status
app.put("/Manufacture/OQC-Fixed/Edit-status/:id", (req, res) => {
  const {
    Status,
    RWID,
    TimestampRW
  } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureOQC
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [
      Status,
      RWID,
      TimestampRW,
      id,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureOQC");
      io.emit("UpdateManufactureRW");
      io.emit("UpdateHistory");
      io.emit("updateManufactureDetails");
      res.json({ message: "Summary received" });
    }
  );
});

// Post value in table Summary
app.post("/Summary/Add-item", (req, res) => {
  const {
    Type,
    PlanID,
    PONumber,
    Category,
    Quantity_Plan,
    CycleTime_Plan,
    Time_Plan,
    Note,
    Created_At,
  } = req.body;
  db.run(
    `INSERT INTO Summary (Type, PlanID, PONumber, Category, Quantity_Plan, CycleTime_Plan, Time_Plan, Note, Created_At)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Type,
      PlanID,
      PONumber,
      Category,
      Quantity_Plan,
      CycleTime_Plan,
      Time_Plan,
      Note,
      Created_At,
    ],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("UpdateSummary");
      io.emit("UpdateHistory");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table Summary
app.put("/Summary/Edit-item/:id", (req, res) => {
  const {
    Type,
    PONumber,
    Category,
    Quantity_Plan,
    CycleTime_Plan,
    Time_Plan,
    Note,
    Created_At,
  } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE Summary
      SET Type=?, PONumber=?, Category=?, Quantity_Plan=?, CycleTime_Plan=?, Time_Plan=?, Note=?, Created_At=?
      WHERE id=?`,
    [
      Type,
      PONumber,
      Category,
      Quantity_Plan,
      CycleTime_Plan,
      Time_Plan,
      Note,
      Created_At,
      id,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateSummary");
      io.emit("UpdateHistory");
      res.json({ message: "Summary received" });
    }
  );
});

// Router delete item in Summary table
app.delete("/Summary/Delete-item/:id", async (req, res) => {
  const { id } = req.params;
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
    io.emit("UpdateSummary");
    io.emit("UpdateHistory");
    io.emit("updateManufactureDetails");
    res.json({ message: "Đã xoá dữ liệu bảo trì định kỳ thành công" });
  });
});

// Catch-all route cho frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Khởi động server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
