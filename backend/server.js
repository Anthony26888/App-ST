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
const pdfParse = require("pdf-parse");
const fs = require("fs");
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const { createParser } = require("eventsource-parser");
const https = require("https");
const http = require("http");
const parse = require("csv-parse").parse; // đảm bảo lấy đúng hàm parse
const parseGerber = require("gerber-parser");
const gerberToSvg = require("gerber-to-svg");
const SvgPath = require("svgpath");

// const {queryWithLangChain } = require("./Ollama-AI/queryEngine.js");
// const queryMap = require("./Ollama-AI/queryMap")
const fetch = require("node-fetch");

// const https = require("https"); // XÓA: không dùng SSL nữa

// Add processing flags at the top of the file
const processingRequests = new Set();

const ESP32_IP = "http://192.168.1.82"; // IP ESP32 (phải đổi đúng IP của bạn)

const sessions = {}; // lưu theo socket.id
// Khởi tạo Express và Socket.IO
const PORT = 3000;
// const HTTPS_PORT = 3443; // XÓA: không dùng HTTPS

const allowedOrigins = new Set([
  // Local dev
  "http://localhost:8080",
  "https://localhost:8080",
  "http://localhost:3000",
  "https://localhost:3000",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:3000",
  "http://localhost",

  // LAN
  "http://192.168.100.210:3000",
  "http://192.168.1.10:3000",
  "http://192.168.2.248:3000",
  "http://192.168.100.76:3000",
  "http://192.168.100.200:3000",
  "http://192.168.100.76",
  "http://192.168.100.20",
  "http://192.168.100.200",
  "http://192.168.1.200",
  "http://192.168.2.200",

  // Production domain – **đầy đủ biến thể**
  "http://erp.sieuthuat.com",
  "https://erp.sieuthuat.com",
  "http://erp.sieuthuat.com:3000",
  "https://erp.sieuthuat.com:3000",
  "http://erpapp.hopto.org",
  "https://erpapp.hopto.org",
  "http://erpapp.hopto.org:3000",
  "https://erpapp.hopto.org:3000",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Cho phép postman hoặc curl
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      } else {
        console.log("❌ Blocked origin:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(bodyParser.json());
app.use("/", routes);
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
// BẮT BUỘC CÓ để xử lý preflight OPTIONS
app.options("*", cors());

// Tạo HTTP server
const server = require("http").createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // hoặc http://192.168.100.76
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
});

// const sslOptions = {
//   key: fs.readFileSync('D:/code/cert/erpapp.hopto.org/erpapp.hopto.org-key.pem'),
//   cert: fs.readFileSync('D:/code/cert/erpapp.hopto.org/erpapp.hopto.org-crt.pem'),
//   ca: fs.readFileSync('D:/code/cert/erpapp.hopto.org/erpapp.hopto.org-chain.pem') // Optional nhưng nên có
// };

// // Route test
// app.get('/', (req, res) => {
//   res.send('✅ HTTPS chạy thành công!');
// });

// // Khởi chạy HTTPS server
// https.createServer(sslOptions, app).listen(443, () => {
//   console.log('HTTPS server chạy tại: https://erp.sieuthuat.com');
// });
// http.createServer((req, res) => {
//   res.writeHead(301, { Location: 'https://' + req.headers.host + req.url });
//   res.end();
// }).listen(80);

// GIỮ LẠI CHỈ HTTP
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  if (!sessions[socket.id]) sessions[socket.id] = [];
  // ... existing socket event handlers ...
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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExt = [
      ".gbr",
      ".gtl",
      ".gbl",
      ".gts",
      ".gbs",
      ".drl",
      ".ger",
      ".xlsx",
      ".csv",
      ".gtp",
      ".gbp",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file xlsx, gerber, csv"));
    }
  },
});

const userProjects = new Map();
// Khi client kết nối
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  if (!sessions[socket.id]) sessions[socket.id] = [];
  socket.on("getInforUser", async (id) => {
    try {
      const query = `SSELECT * FROM Users WHERE Username = ?`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("InforUserError", err);
        socket.emit("InforUserData", rows);
      });
    } catch (error) {
      socket.emit("InforUserError", error);
    }
  }),
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
        const query = `SELECT DISTINCT 
                        id,
                        Description,
                        PartNumber_1,
                        PartNumber_2,
                        Input,
                        Output,
                        CASE 
                          WHEN Input >= Output THEN IFNULL(Input, 0) - IFNULL(Output, 0)
                          ELSE 0
                        END AS Inventory,
                        Customer,
                        Location,
                        Note,
                        Note_Output
                      FROM WareHouse ORDER BY id ASC`;
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
        const query = `SELECT DISTINCT 
                        Customer,
                        CASE
                          WHEN (Input - Output) > 0 THEN IFNULL((Input - Output), 0)
                          ELSE 0 
                        END AS SL_Ton_Kho
                      FROM WareHouse WHERE PartNumber_1 = ? ORDER BY id ASC`;
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
        const query = `SELECT DISTINCT 
                        Customer,
                        CASE
                          WHEN (Input - Output) > 0 THEN IFNULL((Input - Output), 0)
                          ELSE 0 
                        END AS SL_Ton_Kho_Misa
                      FROM WareHouse2 WHERE PartNumber_1 = ? ORDER BY id ASC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("WareHouse2FindError", err);
          socket.emit("WareHouse2FindData", rows);
        });
      } catch (error) {
        socket.emit("WareHouse2FindError", error);
      }
    }),
    socket.on("getTemporaryWareHouse", async () => {
      try {
        const query = `SELECT 
                        a.id,
                        a.PartNumber_1,
                        a.Description,
                        a.Location AS Location_1,
                        b.Location AS Location_2,
                        CASE
                          WHEN (b.Input - b.Output) > 0 THEN (b.Input - b.Output)
                          ELSE 0
                        END AS Inventory,
                        CASE
                          WHEN b.PartNumber_1 IS NULL OR b.Description IS NULL OR b.Location IS NULL THEN 'Chưa xác minh'
                          ELSE 'Đã xác minh'
                        END AS Status,
                        a.Input,
                        CASE
                          WHEN (b.Input - (b.Output + a.Input)) > 0 THEN (b.Input - (b.Output + a.Input))
                          ELSE 0
                        END AS Quantity_Amount,
                        a.Note
                      FROM Temporary_WareHouse a
                      LEFT JOIN (
                        SELECT 
                          PartNumber_1,
                          Description,
                          Location,
                          Inventory,
                          Input,
                          Output,
                          Note
                        FROM WareHouse 
                      ) AS b 
                      ON a.PartNumber_1 = b.PartNumber_1 
                        AND a.Description = b.Description 
                        AND a.Location = b.Location;`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("TemporaryWareHouseError", err);
          socket.emit("TemporaryWareHouseData", rows);
        });
      } catch (error) {
        socket.emit("TemporaryWareHouseError", error);
      }
    }),
    socket.on("getTemporaryWareHouse2", async () => {
      try {
        const query = `SELECT 
                        a.id,
                        a.PartNumber_1,
                        a.Description,
                        a.Location AS Location_1,
                        b.Location AS Location_2,
                        (b.Input - b.Output) AS Inventory,
                        CASE
                          WHEN b.PartNumber_1 IS NULL OR b.Description IS NULL OR b.Location IS NULL THEN 'Chưa xác minh'
                          ELSE 'Đã xác minh'
                        END AS Status,
                        a.Input,
                        (b.Input - (b.Output + a.Input)) AS Quantity_Amount,
                        a.Note
                      FROM Temporary_WareHouse_2 a
                      LEFT JOIN (
                        SELECT 
                          PartNumber_1,
                          Description,
                          Location,
                          Inventory,
                          Input,
                          Output,
                          Note
                        FROM WareHouse2 
                      ) AS b 
                      ON a.PartNumber_1 = b.PartNumber_1 
                        AND a.Description = b.Description 
                        AND a.Location = b.Location;`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("TemporaryWareHouse2Error", err);
          socket.emit("TemporaryWareHouse2Data", rows);
        });
      } catch (error) {
        socket.emit("TemporaryWareHouse2Error", error);
      }
    }),
    socket.on("getWareHouseLog", async () => {
      try {
        const query = `SELECT DISTINCT 
                        id,
                        PartNumber,
                        Customer,
                        Location,
                        ActionType,
                        Quantity,
                        Updated_by,
                        Created_at
                      FROM WareHouseLog
                      ORDER BY id DESC`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("WareHouseLogError", err);
          socket.emit("WareHouseLogData", rows);
        });
      } catch (error) {
        socket.emit("WareHouseLogError", error);
      }
    }),
    socket.on("getWareHouse2Log", async () => {
      try {
        const query = `SELECT DISTINCT 
                        id,
                        PartNumber,
                        Customer,
                        Location,
                        ActionType,
                        Quantity,
                        Updated_by,
                        Created_at
                      FROM WareHouse2Log
                      ORDER BY id DESC`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("WareHouse2LogError", err);
          socket.emit("WareHouse2LogData", rows);
        });
      } catch (error) {
        socket.emit("WareHouse2LogError", error);
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
              ORDER BY Status DESC, CustomerName ASC
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
          SELECT 
            a.id,
            c.POID,
            c.id AS ProductID,
            c.ProductDetail,
            a.CustomerName,
            b.PONumber,
            b.DateCreated AS Date_Created_PO,
            b.DateDelivery AS Date_Delivery_PO,
            c.ProductDetail,
            CASE
              WHEN c.QuantityAmount  =  0  THEN 'Hoàn thành'
              WHEN c.QuantityAmount > 0 THEN 'Đang sản xuất'
              ELSE 'Chưa có đơn hàng'
            END AS Status
          FROM Customers a
          LEFT JOIN PurchaseOrders b ON a.id = b.CustomerID
          LEFT JOIN ProductDetails c ON b.id = c.POID`;
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
          ORDER BY Date_Created DESC
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
                        IFNULL(o.QuantityDelivered, 0) AS Quantity_Delivered, 
                        IFNULL(o.QuantityProduct - o.QuantityDelivered, 0) AS Quantity_Amount,
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
                      ORDER BY Status DESC, Product_Detail ASC`;
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
        const query = `SELECT 
                        a.MaThietBi, 
                        a.TenThietBi, 
                        a.LoaiThietBi, 
                        a.NhaSanXuat, 
                        a.NgayMua, 
                        a.ViTri, 
                        a.MoTa, 
                        CASE
                          WHEN CAST((julianday(b.NgayBaoTriTiepTheo) - julianday('now')) AS INTEGER) > 15 THEN 'Chưa tới hạn'
                          ELSE 'Cần bảo trì'
                        END AS Status
                      FROM Machine a 
                      LEFT JOIN MaintenanceSchedule b 
                      ON a.MaThietBi = b.MaThietBi
                      GROUP BY TenThietBi 
                      ORDER BY Status DESC`;
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
        const query = `SELECT DISTINCT * FROM Maintenance WHERE MaThietBi = ? ORDER BY NgayBaoTri DESC`;
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
                      WHERE MaThietBi = ?
                      ORDER BY NgayBaoTriTiepTheo ASC`;
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
                        z.Creater,
                        z.DelaySMT,
                        z.Quantity,
                        z.Quantity_AOI,
                        z.Quantity_IPQCSMT,
                        z.Quantity_IPQC,
                        z.Quantity_Assembly,
                        z.Quantity_BoxBuild,
                        z.Quantity_ConformalCoating,
                        z.Quantity_OQC,
                        z.Quantity_Test1,
                        z.Quantity_Test2
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
                          h.Quantity_AOI,
                          h.Quantity_IPQCSMT,
                          h.Quantity_IPQC,
                          h.Quantity_Assembly,
                          h.Quantity_BoxBuild,
                          h.Quantity_ConformalCoating,
                          h.Quantity_OQC,
                          h.Quantity_Test1,
                          h.Quantity_Test2,
                          SUM(IFNULL(b.SMT_1, 0)) * h.Quantity AS SMT_1,
                          SUM(IFNULL(p.SMT_2, 0)) * h.Quantity AS SMT_2,
                          SUM(IFNULL(z.SMT_3, 0)) * h.Quantity AS SMT_3,
                          SUM(IFNULL(c.AOI, 0)) * h.Quantity_AOI AS AOI,
                          SUM(IFNULL(e.IPQC, 0)) * h.Quantity_IPQC AS IPQC,
                          SUM(IFNULL(f.Assembly, 0)) * h.Quantity_Assembly AS Assembly,
                          SUM(IFNULL(g.OQC, 0)) * h.Quantity_OQC AS OQC,
                          SUM(IFNULL(k.IPQCSMT, 0)) * h.Quantity_IPQCSMT AS IPQCSMT,
                          SUM(IFNULL(m.Test1, 0)) * h.Quantity_Test1 AS Test1,
                          SUM(IFNULL(n.Test2, 0)) * h.Quantity_Test2 AS Test2,
                          SUM(IFNULL(j.BoxBuild, 0)) * h.Quantity_BoxBuild AS BoxBuild,
                          SUM(IFNULL(l.ConformalCoating, 0)) * h.Quantity_ConformalCoating AS ConformalCoating,
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
                          SELECT HistoryID, COUNT(*) AS SMT_1 
                          FROM ManufactureSMT 
                          WHERE Source = 'source_1'
                          GROUP BY HistoryID
                      ) b ON a.id = b.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS SMT_2 
                          FROM ManufactureSMT 
                          WHERE Source = 'source_2'
                          GROUP BY HistoryID
                      ) p ON a.id = p.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS SMT_3 
                          FROM ManufactureSMT 
                          WHERE Source = 'source_3'
                          GROUP BY HistoryID
                      ) z ON a.id = z.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS AOI 
                          FROM ManufactureAOI 
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) c ON a.id = c.HistoryID
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
                          SELECT HistoryID, COUNT(*) AS ConformalCoating 
                          FROM ManufactureConformalCoating
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                      ) l ON a.id = l.HistoryID
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
                      ) c2 ON a.id = c2.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS IPQCFixed
                          FROM ManufactureIPQC 
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) e2 ON a.id = e2.HistoryID
                      LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS OQCFixed
                          FROM ManufactureOQC 
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) g2 ON a.id = g2.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS IPQCSMTFixed 
                          FROM ManufactureIPQCSMT
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) k2 ON a.id = k2.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Test1Fixed
                          FROM ManufactureTest1 
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) m2 ON a.id = m2.HistoryID
                       LEFT JOIN (
                          SELECT HistoryID, COUNT(*) AS Test2Fixed
                          FROM ManufactureTest2
						              WHERE Status = 'fixed'
                          GROUP BY HistoryID
                      ) n2 ON a.id = n2.HistoryID
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
        const query = `SELECT a.id, b.Type, a.PartNumber, a.Status, b.Category, a.Timestamp, a.HistoryID, a.TimestampRW FROM (
                          SELECT id, PartNumber, Status, HistoryID, Timestamp, TimestampRW FROM ManufactureAOI WHERE Status IN ('error', 'fixed')
                          UNION ALL
                          SELECT id, PartNumber, Status, HistoryID, Timestamp, TimestampRW FROM ManufactureIPQCSMT WHERE Status IN ('error', 'fixed')
                          UNION ALL
                            SELECT id, PartNumber, Status, HistoryID, Timestamp, TimestampRW FROM ManufactureIPQC WHERE Status IN ('error', 'fixed')
                          UNION ALL
                            SELECT id, PartNumber, Status, HistoryID, Timestamp, TimestampRW FROM ManufactureTest1 WHERE Status IN ('error', 'fixed')
                          UNION ALL
                            SELECT id, PartNumber, Status, HistoryID, Timestamp, TimestampRW FROM ManufactureTest2 WHERE Status IN ('error', 'fixed')
                          UNION ALL
                            SELECT id, PartNumber, Status, HistoryID, Timestamp, TimestampRW FROM ManufactureOQC WHERE Status IN ('error', 'fixed')
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
        const query = `SELECT 
                        id,
                        PartNumber,
                        CASE
                          WHEN Source = 'source_3' THEN 'Máy printer'
                          WHEN Source = 'source_2' THEN 'Máy gắp linh kiện'
                          ELSE 'Máy Reflow'
                        END AS Source,
                        Status,
                        Timestamp,
                        HistoryID
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
    socket.on("getManufactureCC", async (id) => {
      try {
        const query = `SELECT *
                      FROM ManufactureConformalCoating
                      WHERE HistoryID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureCCError", err);
          socket.emit("ManufactureCCData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureCCError", error);
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
                        a.PlanID,
						 a.Action,
                        z.Name_Order,
                        z.DelaySMT,
						            z.Quantity,
                        z.Quantity_AOI,
                        z.Quantity_IPQCSMT,
                        z.Quantity_IPQC,
                        z.Quantity_Assembly,
                        z.Quantity_BoxBuild,
                        z.Quantity_ConformalCoating,
                        z.Quantity_OQC,
                        z.Quantity_Test1,
                        z.Quantity_Test2,
						
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
                          WHEN a.Type = 'IPQC (SMT)' THEN IFNULL(k.IPQCSMT, 0) * z.Quantity_IPQCSMT
                          WHEN a.Type = 'Test 1' THEN IFNULL(m.Test1, 0) * z.Quantity_Test1
                          WHEN a.Type = 'Test 2' THEN IFNULL(n.Test2, 0) * z.Quantity_Test2
                          WHEN a.Type = 'Box Build' THEN IFNULL(j.BoxBuild, 0) * z.Quantity_BoxBuild
                          WHEN a.Type = 'Tẩm phủ' THEN IFNULL(l.ConformalCoating, 0) * z.Quantity_ConformalCoating
                          WHEN a.Type = 'Nhập kho' THEN IFNULL(o.Warehouse, 0)
                          ELSE 0
                        END AS Quantity_Real,
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
                            DelaySMT, 
                            Quantity_AOI, 
                            Quantity_IPQC, 
                            Quantity_IPQCSMT, 
                            Quantity_Assembly,
                            Quantity_BoxBuild,
                            Quantity_ConformalCoating,
                            Quantity_OQC,
                            Quantity_Test1,
                            Quantity_Test2 
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
                          SELECT HistoryID, COUNT(*) AS ConformalCoating
                          FROM ManufactureConformalCoating
						              WHERE Status = 'ok'
                          GROUP BY HistoryID
                        ) l ON a.id = l.HistoryID
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
    socket.on("getHistoryPart", async (id) => {
      try {
        const query = `
                      SELECT * 
                      FROM (
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'SMT - Printer' AS Source FROM ManufactureSMT WHERE Source = 'source_3'
                        UNION ALL
                        SELECT id,PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'SMT - Gắp linh kiện' AS Source FROM ManufactureSMT WHERE Source = 'source_2'
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'SMT - Lò Reflow' AS Source FROM ManufactureSMT WHERE Source = 'source_1'
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'AOI' AS Source FROM ManufactureAOI
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'Tẩm phủ' FROM ManufactureConformalCoating
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'Test1' FROM ManufactureTest1
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'Test2' FROM ManufactureTest2
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'BoxBuild' FROM ManufactureBoxBuild
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'IPQC' FROM ManufactureIPQC
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'IPQCSMT' FROM ManufactureIPQCSMT
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'OQC' FROM ManufactureOQC
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'Assembly' FROM ManufactureAssembly
                        UNION ALL
                        SELECT id, PartNumber, Status, Timestamp, RWID, TimestampRW, PlanID, Note, 'Nhập kho' FROM ManufactureWarehouse
                      ) 
                      WHERE PlanID = ?
                      ORDER BY Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("HistoryPartError", err);
          socket.emit("HistoryPartData", rows);
        });
      } catch (error) {
        socket.emit("HistoryPartError", error);
      }
    }),
    socket.on("getActived", async (id) => {
      try {
        const query = `WITH AllData AS (
                          SELECT Timestamp, RWID, TimestampRW, 'SMT - Printer' AS Source, 'Cảm biến Printer' AS Device FROM ManufactureSMT WHERE Source = 'source_3'
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'SMT - Gắp linh kiện' AS Source, 'Cảm biến Gắp linh kiện' AS Device FROM ManufactureSMT WHERE Source = 'source_2'
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'SMT - Lò Reflow' AS Source, 'Cảm biến Reflow' AS Device FROM ManufactureSMT WHERE Source = 'source_1'
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'AOI' AS Source, 'Súng barcode AOI' AS Device FROM ManufactureAOI
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'Tẩm phủ' AS Source, 'Súng barcode Tẩm phủ' AS Device FROM ManufactureConformalCoating
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'Test1' AS Source, 'Súng barcode Test1' AS Device FROM ManufactureTest1
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'Test2' AS Source, 'Súng barcode Test2' AS Device FROM ManufactureTest2
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'BoxBuild' AS Source, 'Súng barcode BoxBuild' AS Device FROM ManufactureBoxBuild
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'IPQC' AS Source, 'Súng barcode IPQC' AS Device FROM ManufactureIPQC
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'IPQCSMT' AS Source, 'Súng barcode IPQCSMT' AS Device FROM ManufactureIPQCSMT
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'OQC' AS Source, 'Súng barcode OQC' AS Device FROM ManufactureOQC
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'Assembly' AS Source, 'Súng barcode Assembly' AS Device FROM ManufactureAssembly
                          UNION ALL
                          SELECT Timestamp, RWID, TimestampRW, 'Nhập kho' AS Source, 'Súng barcode Nhập kho' AS Device FROM ManufactureWarehouse
                      ),
                      Sources(SourceName, SortOrder, DeviceName) AS (
                          VALUES 
                              ('SMT - Printer', 1, 'Cảm biến Printer'),
                              ('SMT - Gắp linh kiện', 2, 'Cảm biến Gắp linh kiện'),
                              ('SMT - Lò Reflow', 3, 'Cảm biến Reflow'),
                              ('AOI', 4, 'Súng barcode AOI'),
                              ('Tẩm phủ', 5, 'Súng barcode Tẩm phủ'),
                              ('Test1', 6, 'Súng barcode Test1'),
                              ('Test2', 7, 'Súng barcode Test2'),
                              ('BoxBuild', 8, 'Súng barcode BoxBuild'),
                              ('IPQC', 9, 'Súng barcode IPQC'),
                              ('IPQCSMT', 10, 'Súng barcode IPQCSMT'),
                              ('OQC', 11, 'Súng barcode OQC'),
                              ('Assembly', 12, 'Súng barcode Assembly'),
                              ('Nhập kho', 13, 'Súng barcode Nhập kho')
                      ),
                      LatestPerSource AS (
                          SELECT Source, MAX(Timestamp) AS LatestTimestamp
                          FROM AllData
                          GROUP BY Source
                      )
                      SELECT 
                          S.SourceName AS Source,
                          S.DeviceName AS Device,
                          L.LatestTimestamp
                      FROM Sources S
                      LEFT JOIN LatestPerSource L ON S.SourceName = L.Source
                      ORDER BY S.SortOrder;`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ActivedError", err);
          socket.emit("ActivedData", rows);
        });
      } catch (error) {
        socket.emit("ActivedError", error);
      }
    }),
    socket.on("getFilterBom", async (id) => {
      try {
        const query = `SELECT *
                      FROM FilterBom
                      ORDER BY id DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("FilterBomError", err);
          socket.emit("FilterBomData", rows);
        });
      } catch (error) {
        socket.emit("FiterBomError", error);
      }
    }),
    socket.on("getCombineBom", async (id) => {
      try {
        const query = `WITH pm_match AS (
                        SELECT 
                          b.project_id,
                          b.designator, 
                          pm.package,
                          pm.width,
                          pm.length,
						              pm.id,
                          LENGTH(pm.package) AS match_len,
                          ROW_NUMBER() OVER (
                              PARTITION BY b.project_id, b.designator
                              ORDER BY LENGTH(pm.package) DESC
                          ) AS rn
                      FROM Bom b
                      JOIN Components pm 
                          ON b.description LIKE '%' || pm.package || '%'
                  )
                  SELECT 
                      p.id,
                      p.project_id,
					            o.id AS id_components_overrides,
					            pm.id AS id_component,
                      p.designator,
                      ROUND(p.x, 2) AS x,
                      ROUND(p.y, 2) AS y,
                      p.rotation, 
                      p.layer,
                      b.mpn,
                      p.type,
                      b.description AS description_bom,
                      COALESCE(o.width, pm.width)  AS width,
                      COALESCE(o.length, pm.length) AS length,
                      pm.package AS package,
                      CASE
                          WHEN o.mpn IS NOT NULL THEN 'override'
                          WHEN pm.package IS NOT NULL THEN 'package_map'
                          ELSE 'missing'
                      END AS source
                  FROM Pickplace p
                  LEFT JOIN Bom b
                      ON p.designator = b.designator 
                    AND p.project_id = b.project_id
                  LEFT JOIN pm_match pm
                      ON b.designator = pm.designator 
                    AND b.project_id = pm.project_id 
                    AND pm.rn = 1
                  LEFT JOIN Component_overrides o
                      ON b.mpn = o.mpn
                  WHERE p.project_id = ?`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("CombineBomError", err);
          socket.emit("CombineBomData", rows);
        });
      } catch (error) {
        socket.emit("CombineBomError", error);
      }
    }),

    socket.on("getGerberFile", async (id) => {
      try {
        const query = `SELECT DISTINCT  *
                      FROM GerberData
                      WHERE project_id = ?`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("GerberFileError", err);
          socket.emit("GerberFileData", rows);
        });
      } catch (error) {
        socket.emit("GerberFileError", error);
      }
    }),
    socket.on("getPnPFile", async (id) => {
      try {
        const query = `WITH pm_match AS (
                          SELECT 
                              b.project_id,
                              b.designator, 
                              pm.package,
                              pm.width,
                              pm.length,
                              LENGTH(pm.package) AS match_len,
                              ROW_NUMBER() OVER (
                                  PARTITION BY b.project_id, b.designator
                                  ORDER BY LENGTH(pm.package) DESC
                              ) AS rn
                          FROM Bom b
                          JOIN Components pm 
                              ON b.description LIKE '%' || pm.package || '%'
                      )
                      SELECT 
                          p.id,
                          p.project_id,
                          p.designator,
                          ROUND(p.x, 2) AS x,
                          ROUND(p.y, 2) AS y,
                          p.rotation, 
                          p.layer,
                          p.type,
                          b.description AS description_bom,
                          b.mpn,
                          COALESCE(o.width, pm.width)  AS width,
                          COALESCE(o.length, pm.length) AS length,   -- sửa theo field của bạn
                          COALESCE(o.package, pm.package) AS package,

                          CASE
                              WHEN o.mpn IS NOT NULL THEN 'override'
                              WHEN pm.package IS NOT NULL THEN 'package_map'
                              ELSE 'missing'
                          END AS source

                      FROM Pickplace p
                      LEFT JOIN Bom b
                          ON p.designator = b.designator 
                        AND p.project_id = b.project_id
                      LEFT JOIN pm_match pm
                          ON b.designator = pm.designator 
                        AND b.project_id = pm.project_id 
                        AND pm.rn = 1
                      LEFT JOIN Component_overrides o
                          ON b.mpn = o.mpn
                      WHERE p.project_id = ?`; 
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("PnPFileError", err);
          socket.emit("PnPFileData", rows);
        });
      } catch (error) {
        socket.emit("PnPFileError", error);
      }
    }),

    socket.on("getSettingSVG", async (id) => {
      try {
        const query = `SELECT DISTINCT  *
                      FROM FilterBom
                      WHERE id = ?`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("SettingSVGError", err);
          socket.emit("SettingSVGData", rows);

        });
      } catch (error) {
        socket.emit("SettingSVGError", error);
      }
    }),
    // socket.on("ask", async (message) => {
    //   try {
    //     const result = await queryWithLangChain(message);
    //     socket.emit("answer", result);
    //   } catch (err) {
    //     socket.emit("answer", { error: err.message });
    //   }
    // });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected");
    });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// // 🧠 Hàm tách tên bảng từ prompt
// function extractTableName(prompt) {
//   const match =
//     prompt.match(/\bbảng\s+([A-Za-z0-9_]+)/i) ||
//     prompt.match(/\bfrom\s+([A-Za-z0-9_]+)/i);
//   return match?.[1] || null;
// }
const getPivotQuery = async (id) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT Bom FROM CheckBOM WHERE PO= ?`,
      [id],
      (err, Boms) => {
        if (err) return reject(err);

        // Create dynamic column aggregation
        const columns = Boms.map(
          (bom) =>
            `MAX(CASE WHEN a.Bom = '${bom.Bom}' THEN (a.So_Luong * a.SL_Board) ELSE NULL END) AS [${bom.Bom}]`
        ).join(", ");

        // Tạo biểu thức tổng từ các cột động
        const sumColumns = Boms.map(
          (bom) =>
            `MAX(CASE WHEN a.Bom = '${bom.Bom}' THEN (a.So_Luong * a.SL_Board) ELSE 0 END)`
        ).join(" + ");

        // Full SQL query
        const query = `
          SELECT 
            a.Description, 
            a.Manufacturer_1,
            a.PartNumber_1,
            a.Manufacturer_2,
            a.PartNumber_2,
            a.Manufacturer_3,
            a.PartNumber_3,  
            ${columns},
            ROUND((${sumColumns}), 2) AS SL_Tổng,
            CASE
              WHEN (b.Input - b.Output) > 0 THEN IFNULL((b.Input - b.Output), 0)
              ELSE 0 
            END AS SL_Tồn_Kho,
            b.Customer AS Mã_Kho,
            CASE
              WHEN (c.Input - c.Output) > 0 THEN IFNULL((c.Input - c.Output), 0)
              ELSE 0 
            END AS SL_Tồn_Kho_Misa,
            c.Customer AS Mã_Kho_Misa,
            IFNULL(a.Du_Toan_Hao_Phi, 0) AS Dự_Toán_Hao_Phí,
            IFNULL(a.Hao_Phi_Thuc_Te, 0) AS Hao_Phi_Thuc_Te,
            a.So_Luong,
            a.SL_Board,
            a.Bom,
            a.PO,
            a.id AS Sửa
          FROM CheckBOM a
          LEFT JOIN WareHouse b ON a.PartNumber_1 = b.PartNumber_1
          LEFT JOIN WareHouse2 c ON a.PartNumber_1 = c.PartNumber_1
          WHERE a.PO = ?
          GROUP BY a.PartNumber_1;
        `;
        resolve(query);
      }
    );
  });
};

const getDetailPO = async (id) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT Bom FROM CheckBOM WHERE PO= ?`,
      [id],
      (err, Boms) => {
        if (err) return reject(err);

        // Create dynamic column aggregation

        // Full SQL query
        const query = `
          SELECT DISTINCT
            a.Description, 
            a.Manufacturer_1,
            a.PartNumber_1,
            a.Manufacturer_2,
            a.PartNumber_2,
            a.Manufacturer_3,
            a.PartNumber_3,  
            CASE
                WHEN (b.Input - b.Output) > 0 THEN IFNULL((b.Input - b.Output), 0)
                ELSE 0 
            END AS SL_Tồn_Kho,
            b.Customer AS Mã_Kho,
            CASE
                WHEN (c.Input - c.Output) > 0 THEN IFNULL((c.Input - c.Output), 0)
                ELSE 0 
            END AS SL_Tồn_Kho_Misa,
            c.Customer AS Mã_Kho_Misa,
            IFNULL(a.Du_Toan_Hao_Phi, 0) AS Dự_Toán_Hao_Phí,
            IFNULL(a.Hao_Phi_Thuc_Te, 0) AS Hao_Phí_Thực_Tế,
            a.So_Luong,
            a.SL_Board,
            a.Bom,
            a.PO,
            a.id AS Sửa
        FROM CheckBOM a
        LEFT JOIN (
            SELECT PartNumber_1, Customer, Input, Output
            FROM WareHouse
            GROUP BY PartNumber_1
        ) b ON a.PartNumber_1 = b.PartNumber_1
        LEFT JOIN (
            SELECT PartNumber_1, Customer, Input, Output
            FROM WareHouse2
            GROUP BY PartNumber_1
        ) c ON a.PartNumber_1 = c.PartNumber_1
        WHERE a.PO = ?

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
        // Create dynamic column aggregation
        const columns = Boms.map(
          (bom) =>
            `MAX(CASE WHEN a.Bom = '${bom.Bom}' THEN (a.So_Luong * a.SL_Board) ELSE NULL END) AS [${bom.Bom}]`
        ).join(", ");

        // Tạo biểu thức tổng từ các cột động
        const sumColumns = Boms.map(
          (bom) =>
            `MAX(CASE WHEN a.Bom = '${bom.Bom}' THEN (a.So_Luong * a.SL_Board) ELSE 0 END)`
        ).join(" + ");

        const Buy = `
          CASE 
            WHEN (SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0)) > (IFNULL(i.Input, 0) - IFNULL(i.Output, 0))
            THEN SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0) - (IFNULL(i.Input, 0) - IFNULL(i.Output, 0))
            ELSE 0 
          END AS Số_Lượng_Cần_Mua
        `;
        const BuyMisa = `
          CASE 
            WHEN (SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0)) > (IFNULL(w2.Input, 0) - IFNULL(w2.Output, 0))
            THEN SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0) - (IFNULL(w2.Input, 0) - IFNULL(w2.Output, 0))
            ELSE 0 
          END AS Số_Lượng_Cần_Mua_Misa
        `;
        // Full SQL query
        const query = `
          SELECT 
            a.Description, 
            a.Manufacturer_1,
            a.PartNumber_1,
            ${columns},
            ROUND((${sumColumns}), 2) AS SL_Tổng,
            CASE
              WHEN (b.Input - b.Output) > 0 THEN (b.Input - b.Output)
              ELSE 0
            END AS SL_Tồn_Kho,
            a.Ma_Kho AS Mã_Kho,
            CASE
              WHEN (c.Input - c.Output) > 0 THEN (c.Input - c.Output)
              ELSE 0
            END AS SL_Tồn_Kho_Misa,
            a.Ma_Kho_Misa AS Mã_Kho_Misa,
            a.id AS Sửa
          FROM DetailOrders a
          LEFT JOIN (
            SELECT PartNumber_1, Customer, Input, Output
            FROM WareHouse
          ) b ON a.PartNumber_1 = b.PartNumber_1 AND a.Ma_Kho = b.Customer
          LEFT JOIN (
              SELECT PartNumber_1, Customer, Input, Output
              FROM WareHouse2
          ) c ON a.PartNumber_1 = c.PartNumber_1 AND a.Ma_Kho_Misa = c.Customer
          WHERE a.PO = ?
          GROUP BY a.PartNumber_1;
        `;
        resolve(query);
      }
    );
  });
};

// 📥 API to Download PO as XLSX
app.get("/api/Download-PO/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = await getPivotQuery(id);
    db.all(query, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Convert data to worksheet
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, `${id}`);

      // Save the file temporarily
      const filePath = path.join(__dirname, `${id}.xlsx`);
      xlsx.writeFile(wb, filePath);

      // Send the file to the client
      res.download(filePath, `${id}.xlsx`, (err) => {
        if (err) console.error("Error sending file:", err);
        fs.unlinkSync(filePath); // Delete after sending
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/insert-compare-inventory/:id", async (req, res) => {
  const id = req.params.id;
  console.log("Processing insert-compare-inventory for PO:", id);

  // Check if this PO is already being processed
  if (processingRequests.has(id)) {
    console.log(`Request for PO ${id} is already being processed, skipping...`);
    return res.status(409).json({
      error: "Yêu cầu này đang được xử lý. Vui lòng đợi.",
    });
  }

  // Add to processing set
  processingRequests.add(id);

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

    // Delete existing records for this order to prevent duplicates
    await new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM DetailOrders WHERE Order_Id = ?",
        [orderId],
        function (err) {
          if (err) {
            return reject(err);
          }
          console.log(`Deleted ${this.changes} old rows for order ${orderId}`);
          resolve();
        }
      );
    });

    // Get the compare inventory data
    const query = await getDetailPO(id);
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
            row.Dự_Toán_Hao_Phí,
            row.Hao_Phi_Thuc_Te,
            row.Mã_Kho,
            row.Mã_Kho_Misa,
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
  } finally {
    // Remove from processing set
    processingRequests.delete(id);
  }
});

// Router register user
app.post("/api/Users/register", (req, res) => {
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
app.delete("/api/Users/delete-user/:id", async (req, res) => {
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
app.put("/api/Users/Edit-User/:id", async (req, res) => {
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
app.post("/api/WareHouse/Upload", upload.single("file"), async (req, res) => {
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
app.put("/api/WareHouse/update-item/:id", async (req, res) => {
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
      io.emit("TemporaryWareHouseUpdate");
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});

// Router delete item in WareHouse table
app.delete("/api/WareHouse/delete-item/:id", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM WareHouse WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("WareHouseUpdate");
    io.emit("TemporaryWareHouseUpdate");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

//Router post new item in WareHouse table
app.post("/api/WareHouse/upload-new-item", (req, res) => {
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
app.post("/api/WareHouse2/Upload", upload.single("file"), async (req, res) => {
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

// Router update item WareHouse2 table
app.put("/api/WareHouse2/update-item/:id", async (req, res) => {
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
// Router delete item in WareHouse2 table
app.delete("/api/WareHouse2/delete-item/:id", async (req, res) => {
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
app.post("/api/WareHouse2/upload-new-item", (req, res) => {
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

// Router update WareHouse accept
app.put("/api/WareHouse/update-Inventory-CheckBom/:id", async (req, res) => {
  const { id } = req.params;
  const poNumber = id;

  const query = `
    UPDATE WareHouse
    SET Output = 
      CASE 
        WHEN Input > (
          SELECT SUM(cb.So_Luong * cb.SL_Board + IFNULL(cb.Hao_Phi_Thuc_Te, 0))
          FROM DetailOrders cb
          WHERE cb.PartNumber_1 = WareHouse.PartNumber_1 AND cb.PO = ?
        )
        THEN Output + (
          SELECT SUM(cb.So_Luong * cb.SL_Board + IFNULL(cb.Hao_Phi_Thuc_Te, 0))
          FROM DetailOrders cb
          WHERE cb.PartNumber_1 = WareHouse.PartNumber_1 AND cb.PO = ?
        )
        WHEN Input < (
          SELECT SUM(cb.So_Luong * cb.SL_Board + IFNULL(cb.Hao_Phi_Thuc_Te, 0))
          FROM DetailOrders cb
          WHERE cb.PartNumber_1 = WareHouse.PartNumber_1 AND cb.PO = ?
        )
        THEN Input
        ELSE 0
      END
    WHERE PartNumber_1 IN (
      SELECT PartNumber_1 FROM DetailOrders WHERE PO = ?
    )
  `;

  db.all(query, [poNumber, poNumber, poNumber, poNumber], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }
    io.emit("updateCompare");
    io.emit("WareHouseUpdate");
    res.json({ message: "Inventory updated successfully." });
  });
});

app.put("/api/WareHouse2/update-Inventory-CheckBom/:id", async (req, res) => {
  const { id } = req.params;
  const poNumber = id;
  // Insert data into SQLite database
  const query = `
    UPDATE WareHouse2
    SET Output = 
      CASE 
        WHEN Input > (SELECT SUM(cb.So_Luong * cb.SL_Board + cb.Hao_Phi_Thuc_Te)
                          FROM DetailOrders cb
                          WHERE cb.PartNumber_1 = WareHouse2.PartNumber_1 AND cb.PO = ?)
        THEN Output + (SELECT SUM(cb.So_Luong * cb.SL_Board + cb.Hao_Phi_Thuc_Te)
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
    io.emit("WareHouse2Update");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router upload file xlsx to WareHouse table
app.put("/api/Temporary_WareHouse/Update-File", async (req, res) => {
  try {
    // Lấy tất cả dữ liệu từ Temporary_WareHouse
    db.all(
      "SELECT PartNumber_1, Input, Note, Description, Location FROM Temporary_WareHouse",
      [],
      async (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (!rows || rows.length === 0) {
          return res.json({
            message: "Không có dữ liệu trong Temporary_WareHouse",
          });
        }
        // Cập nhật từng dòng vào WareHouse
        for (const row of rows) {
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE WareHouse SET Output = Output + ?, Note_Output = ? WHERE PartNumber_1 = ? AND Description = ? AND Location = ?`,
              [
                row.Input || 0,
                row.Note || "",
                row.PartNumber_1,
                row.Description || "",
                row.Location || "",
              ],
              function (err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }
        io.emit("WareHouseUpdate");
        res.json({
          message:
            "Đã cập nhật dữ liệu từ Temporary_WareHouse vào WareHouse thành công",
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Router delete item in Temporary WareHouse table
app.delete("/api/Temporary-WareHouse/delete-item/:id", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM Temporary_WareHouse WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("TemporaryWareHouseUpdate");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router delete all in Temporary WareHouse table when already update WareHouse table
app.delete("/api/Temporary-WareHouse/delete-all", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM Temporary_WareHouse`;
  db.run(query, [], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("TemporaryWareHouseUpdate");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router upload item in Temporary WareHouse table from xlsx
app.post(
  "/api/Temporary_WareHouse/Upload",
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");
    // Read Excel file
    const filePath = path.join(__dirname, req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet data to JSON
    const data = xlsx.utils.sheet_to_json(sheet);

    // Insert data into SQLite database
    const stmt = db.prepare(
      `INSERT INTO Temporary_WareHouse (Description, PartNumber_1, Input, Location, Note) VALUES (?, ?, ?, ?, ?)`
    );
    data.forEach((row) => {
      stmt.run(
        row.Description,
        row.PartNumber_1,
        row.Input,
        row.Location,
        row.Note
      );
    });

    stmt.finalize();
    io.emit("TemporaryWareHouseUpdate");
    res.send("File processed successfully.");
  }
);

// Router upload item in Temporary WareHouse 2 table from xlsx
app.post(
  "/api/Temporary_WareHouse_2/Upload",
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");
    // Read Excel file
    const filePath = path.join(__dirname, req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet data to JSON
    const data = xlsx.utils.sheet_to_json(sheet);

    // Insert data into SQLite database
    const stmt = db.prepare(
      `INSERT INTO Temporary_WareHouse_2 (Description, PartNumber_1, Input, Location, Note) VALUES (?, ?, ?, ?, ?)`
    );
    data.forEach((row) => {
      stmt.run(
        row.Description,
        row.PartNumber_1,
        row.Input,
        row.Location,
        row.Note
      );
    });

    stmt.finalize();
    io.emit("WareHouse2Update");
    res.send("File processed successfully.");
  }
);

// Router upload file xlsx to WareHouse table
app.put("/api/Temporary_WareHouse_2/Update-File", async (req, res) => {
  try {
    // Lấy tất cả dữ liệu từ Temporary_WareHouse
    db.all(
      "SELECT PartNumber_1, Input, Note, Description, Location FROM Temporary_WareHouse_2",
      [],
      async (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (!rows || rows.length === 0) {
          return res.json({
            message: "Không có dữ liệu trong Temporary_WareHouse",
          });
        }
        // Cập nhật từng dòng vào WareHouse
        for (const row of rows) {
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE WareHouse2 SET Output = Output + ?, Note_Output = ? WHERE PartNumber_1 = ? AND Description = ? AND Location = ?`,
              [
                row.Input || 0,
                row.Note || "",
                row.PartNumber_1,
                row.Description || "",
                row.Location || "",
              ],
              function (err) {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }
        io.emit("WareHouse2Update");
        res.json({
          message:
            "Đã cập nhật dữ liệu từ Temporary_WareHouse vào WareHouse thành công",
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Router delete item in Temporary WareHouse table
app.delete("/api/Temporary-WareHouse_2/delete-item/:id", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM Temporary_WareHouse_2 WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("TemporaryWareHouse2Update");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router delete all in Temporary WareHouse table when already update WareHouse table
app.delete("/api/Temporary-WareHouse_2/delete-all", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM Temporary_WareHouse_2`;
  db.run(query, [], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("TemporaryWareHouseUpdate2");
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Route to post item into warehouse log
app.post("/api/WareHouse/Log/add-new-item", async (req, res) => {
  const {
    ActionType,
    PartNumber,
    Quantity,
    Updated_by,
    Created_at,
    Customer,
    Location,
  } = req.body;
  // Insert data into SQLite database
  const query =
    "INSERT INTO WareHouseLog (ActionType, PartNumber, Quantity, Updated_by, Created_at, Customer, Location) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.run(
    query,
    [
      ActionType,
      PartNumber,
      Quantity,
      Updated_by,
      Created_at,
      Customer,
      Location,
    ],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      io.emit("WareHouseLogUpdate");
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});

//Router to post all item into WareHouseLog table
app.post(
  "/api/WarHouseLog/Upload-File-Export",
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");
    // Read Excel file
    const filePath = path.join(__dirname, req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet data to JSON
    const data = xlsx.utils.sheet_to_json(sheet);

    // Get timestamp from req.body
    const { Created_at, Updated_by } = req.body;

    // Insert data into SQLite database
    const stmt = db.prepare(
      `INSERT INTO WareHouseLog (ActionType, PartNumber, Quantity, Location, Created_at, Updated_by) VALUES ('Xuất', ?, ?, ?, ?, ?)`
    );
    data.forEach((row) => {
      stmt.run(
        row.PartNumber_1,
        row.Input,
        row.Location,
        Created_at,
        Updated_by
      );
    });

    stmt.finalize();
    io.emit("WareHouseLogUpdate");
    res.send("File processed successfully.");
  }
);

//Router to post all item into WareHouseLog table
app.post(
  "/api/WarHouseLog/Upload-File-Import",
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded.");
    // Read Excel file
    const filePath = path.join(__dirname, req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet data to JSON
    const data = xlsx.utils.sheet_to_json(sheet);

    // Get timestamp from req.body
    const { Created_at, Updated_by } = req.body;

    // Insert data into SQLite database
    const stmt = db.prepare(
      `INSERT INTO WareHouseLog (ActionType, PartNumber, Quantity, Location, Customer, Created_at, Updated_by) VALUES ('Nhập', ?, ?, ?, ?, ?, ?)`
    );
    data.forEach((row) => {
      stmt.run(
        row.PartNumber_1,
        row.Input,
        row.Location,
        row.Customer,
        Created_at,
        Updated_by
      );
    });

    stmt.finalize();
    io.emit("WareHouseLogUpdate");
    res.send("File processed successfully.");
  }
);

// Router insert item in WareHouseLog table from Orders table
app.post("/api/insert-log/:po", async (req, res) => {
  const poNumber = req.params.po;
  const { Updated_by, Created_at } = req.body;

  const selectQuery = `SELECT * FROM DetailOrders WHERE PO = ?`;
  const insertQuery = `
    INSERT INTO WareHouseLog (
      ActionType, PartNumber, Quantity, Location, Updated_by, Created_At
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.all(selectQuery, [poNumber], (err, rows) => {
    if (err) {
      console.error("Error selecting DetailOrders:", err.message);
      return res.status(500).json({ error: "Failed to select DetailOrders" });
    }

    if (rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No DetailOrders found for this PO" });
    }

    let pending = rows.length;

    rows.forEach((row) => {
      const quantity = (row.So_Luong || 0) * (row.SL_Board || 0);
      db.run(
        insertQuery,
        [
          "Xuất",
          row.PartNumber_1,
          quantity,
          row.Ma_Kho,
          Updated_by,
          Created_at,
        ],
        (err) => {
          if (err) {
            console.error("Insert error:", err.message);
          }

          if (--pending === 0) {
            res.json({ message: "Inserted into WareHouseLog successfully" });
          }
        }
      );
    });
  });
});

// Route to post item into warehouse2 log
app.post("/api/WareHouse2/Log/add-new-item", async (req, res) => {
  const {
    ActionType,
    PartNumber,
    Quantity,
    Updated_by,
    Created_at,
    Customer,
    Location,
  } = req.body;
  // Insert data into SQLite database
  const query =
    "INSERT INTO WareHouse2Log (ActionType, PartNumber, Quantity, Updated_by, Created_at, Customer, Location) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.run(
    query,
    [
      ActionType,
      PartNumber,
      Quantity,
      Updated_by,
      Created_at,
      Customer,
      Location,
    ],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      io.emit("WareHouseLogUpdate");
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});

// Router delete item in Orders
app.delete("/api/Orders/delete-item/:id", async (req, res) => {
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
app.delete("/api/CheckBom/Delete-Item/:id", async (req, res) => {
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
app.post("/api/ListPO/upload-new-PO", async (req, res) => {
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
app.put("/api/CheckBom/Update-Hao-Phi", async (req, res) => {
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
app.put("/api/DetailOrders/Update", async (req, res) => {
  const { Input_Hao_Phi_Thuc_Te, Ma_Kho, Ma_Kho_Misa, PartNumber_1, PO } =
    req.body;
  // Insert data into SQLite database
  const query = `UPDATE DetailOrders SET Hao_Phi_Thuc_Te = ?, Ma_Kho = ?, Ma_Kho_Misa = ? WHERE PartNumber_1 = ? AND PO = ?`;
  db.run(
    query,
    [Input_Hao_Phi_Thuc_Te, Ma_Kho, Ma_Kho_Misa, PartNumber_1, PO],
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
app.put("/api/CheckBom/Edit-Item/:id", async (req, res) => {
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
app.put("/api/Orders/WareHouse-Accept/:id", async (req, res) => {
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

// Router upload file xlsx to Project table
app.post("/api/Project/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const customerStmt = db.prepare(`
    INSERT OR IGNORE INTO Customers (CustomerName, Years) VALUES (?, ?)
`);

  const poStmt = db.prepare(`
    INSERT OR IGNORE INTO PurchaseOrders (PONumber, CustomerID, DateCreated, DateDelivery)
    VALUES (?, ?, ?, ?)
`);

  const productStmt = db.prepare(`
    INSERT INTO ProductDetails (POID, ProductDetail, QuantityProduct, QuantityDelivered, QuantityAmount, CustomerID)
    VALUES (?, ?, ?, ?, ?, ?)
`);

  try {
    for (const row of jsonData) {
      const customerName = row["Customers"];
      const poNumber = row["PO"];
      const dateCreated = row["Date_Created"];
      const dateDelivery = row["Date_Delivery"];
      const productDetail = row["Product_Detail"];
      const quantityProduct = row["Quantity_Product"];
      const quantityDelivered = row["Quantity_Delivered"];
      const quantityAmount = row["Quantity_Amount"];
      const yearCreated = row["Years"];
      let customerId = null;
      await new Promise((resolve, reject) => {
        customerStmt.run(customerName, yearCreated, function (err) {
          if (err) reject(err);
          db.get(
            "SELECT id FROM Customers WHERE CustomerName = ?",
            [customerName],
            (err, row) => {
              if (err) reject(err);
              customerId = row ? row.id : null;
              resolve();
            }
          );
        });
      });

      if (!customerId) {
        console.error(`Không tìm thấy CustomerID cho ${customerName}`);
        continue;
      }

      let poId = null;
      await new Promise((resolve, reject) => {
        poStmt.run(
          poNumber,
          customerId,
          dateCreated,
          dateDelivery,
          function (err) {
            if (err) reject(err);
            db.get(
              "SELECT id FROM PurchaseOrders WHERE PONumber = ?",
              [poNumber],
              (err, row) => {
                if (err) reject(err);
                poId = row ? row.id : null;
                resolve();
              }
            );
          }
        );
      });

      if (!poId) {
        console.error(`Không tìm thấy POID cho ${poNumber}`);
        continue;
      }

      await new Promise((resolve, reject) => {
        productStmt.run(
          poId,
          productDetail,
          quantityProduct,
          quantityDelivered,
          quantityAmount,
          customerId,
          function (err) {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }

    customerStmt.finalize();
    poStmt.finalize();
    productStmt.finalize();
    io.emit("ProjectUpdate");
    res.send("Dữ liệu đã được nhập thành công!");
  } catch (error) {
    console.error("Lỗi trong quá trình nhập liệu:", error);
    if (customerStmt) customerStmt.finalize();
    if (poStmt) poStmt.finalize();
    if (productStmt) productStmt.finalize();
    res.status(500).send("Lỗi khi nhập dữ liệu.");
  }
});

// Router update item in ProductDetails table
app.put("/api/Project/Customer/Edit-Item/:id", async (req, res) => {
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
app.post("/api/Project/Customer/Add-Item", async (req, res) => {
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
app.delete("/api/Project/Customer/Delete-Item/:id", async (req, res) => {
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
app.put("/api/Project/Customer/Edit-Orders/:id", async (req, res) => {
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
app.post("/api/Project/Customer/Add-Orders", async (req, res) => {
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
app.delete("/api/Project/Customer/Delete-Orders/:id", async (req, res) => {
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
app.put("/api/Project/Customer/Edit-Customer/:id", async (req, res) => {
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
app.post("/api/Project/Customer/Add-Customer", async (req, res) => {
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
app.delete("/api/Project/Customer/Delete-Customer/:id", async (req, res) => {
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
app.post("/api/Machine/Add", async (req, res) => {
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
app.put("/api/Machine/Edit/:id", async (req, res) => {
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
app.delete("/api/Machine/Delete/:id", async (req, res) => {
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
app.post("/api/Maintenance/Add", async (req, res) => {
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
app.put("/api/Maintenance/Edit/:id", async (req, res) => {
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
app.delete("/api/Maintenance/Delete/:id", async (req, res) => {
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
app.post("/api/MaintenanceSchedule/Add", async (req, res) => {
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
app.put("/api/MaintenanceSchedule/Edit/:id", async (req, res) => {
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
app.delete("/api/MaintenanceSchedule/Delete/:id", async (req, res) => {
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
app.post("/api/SparePartUsage/Add", async (req, res) => {
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
app.put("/api/SparePartUsage/Edit/:id", async (req, res) => {
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
app.delete("/api/SparePartUsage/Delete/:id", async (req, res) => {
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
app.post("/api/PlanManufacture/Add", async (req, res) => {
  const {
    Name,
    Name_Order,
    Date,
    Creater,
    Note,
    Total,
    DelaySMT = 50, // default value if undefined
    Level,
    Quantity,
    ProjectID,
  } = req.body;

  const LevelCleaned = Array.isArray(Level) ? Level.join("-") : String(Level); // fallback nếu không phải mảng

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
      Name_Order,
      Quantity_IPQCSMT,
      Quantity_IPQC,
      Quantity_AOI,
      Quantity_Test1,
      Quantity_Test2,
      Quantity_BoxBuild,
      Quantity_ConformalCoating,
      Quantity_OQC,
      Quantity_Assembly)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, 1, 1, 1, 1, 1)
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
        console.error("DB Error:", err.message);
        return res.status(500).json({
          error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu",
          detail: err.message,
        });
      }

      io.emit("ManufactureUpdate");
      res.json({ message: "Đã thêm dữ liệu dự án sản xuất thành công" });
    }
  );
});

// Router update item in PlanManufacture table
app.put("/api/PlanManufacture/Edit/:id", async (req, res) => {
  const { id } = req.params;
  const {
    Name,
    Date,
    Creater,
    Note,
    Total,
    DelaySMT,
    Level,
    Quantity,
    Quantity_IPQCSMT,
    Quantity_IPQC,
    Quantity_AOI,
    Quantity_BoxBuild,
    Quantity_Assembly,
    Quantity_ConformalCoating,
    Quantity_Test1,
    Quantity_Test2,
    Quantity_OQC,
  } = req.body;
  const LevelString = JSON.stringify(Level);
  const LevelCleaned = LevelString.replace(/[\[\]"]/g, "").replace(/,/g, "-");
  // Insert data into SQLite database
  const query = `
      UPDATE PlanManufacture 
      SET Name = ?, 
          Date = ?, 
          Creater = ?, 
          Note = ?, 
          Total = ?, 
          DelaySMT = ?, 
          Level = ?, 
          Quantity = ?,
          Quantity_IPQCSMT = ?,
          Quantity_IPQC = ?,
          Quantity_AOI = ?, 
          Quantity_BoxBuild = ?,
          Quantity_Assembly = ?,
          Quantity_ConformalCoating = ?,
          Quantity_Test1 = ?,
          Quantity_Test2 = ?,
          Quantity_OQC = ?
      WHERE id = ?
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
      Quantity_IPQCSMT,
      Quantity_IPQC,
      Quantity_AOI,
      Quantity_BoxBuild,
      Quantity_Assembly,
      Quantity_ConformalCoating,
      Quantity_Test1,
      Quantity_Test2,
      Quantity_OQC,
      id,
    ],
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
app.put("/api/PlanManufacture/Edit-Line/:id", async (req, res) => {
  const { id } = req.params;
  const {
    DelaySMT,
    Quantity,
    Quantity_IPQCSMT,
    Quantity_IPQC,
    Quantity_AOI,
    Quantity_BoxBuild,
    Quantity_Assembly,
    Quantity_ConformalCoating,
    Quantity_Test1,
    Quantity_Test2,
    Quantity_OQC,
  } = req.body;
  // Insert data into SQLite database
  const query = `
      UPDATE PlanManufacture 
      SET DelaySMT = ?, 
          Quantity = ?, 
          Quantity_IPQCSMT = ?,
          Quantity_IPQC = ?,
          Quantity_AOI = ?, 
          Quantity_BoxBuild = ?,
          Quantity_Assembly = ?,
          Quantity_ConformalCoating = ?,
          Quantity_Test1 = ?,
          Quantity_Test2 = ?,
          Quantity_OQC = ?
      WHERE id = ?
    `;
  db.run(
    query,
    [
      DelaySMT,
      Quantity,
      Quantity_IPQCSMT,
      Quantity_IPQC,
      Quantity_AOI,
      Quantity_BoxBuild,
      Quantity_Assembly,
      Quantity_ConformalCoating,
      Quantity_Test1,
      Quantity_Test2,
      Quantity_OQC,
      id,
    ],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("ManufactureUpdate");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("UpdateSummary");
      res.json({ message: "Đã cập nhật dữ liệu dự án sản xuất thành công" });
    }
  );
});

// Router delete item in PlanManufacture table
app.delete("/api/PlanManufacture/Delete/:id", async (req, res) => {
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

app.post("/api/esp-config", async (req, res) => {
  const { project_id, delay, plan_id } = req.body;
  try {
    const response = await axios.post(
      `${ESP32_IP}/set-project-delay`,
      {
        project_id,
        delay,
        plan_id,
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
  const { project_id, input_value, source, plan_id } = req.body;
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
  if (
    typeof project_id === "undefined" ||
    typeof input_value === "undefined" ||
    typeof source === "undefined" ||
    typeof plan_id === "undefined"
  ) {
    return res
      .status(400)
      .json({ error: "Missing project_id or input_value or source" });
  }

  const stmt = db.prepare(
    "INSERT INTO ManufactureSMT (HistoryID, PartNumber, Timestamp, Status, Source, PlanID) VALUES (?, ?, ?, 'ok', ?, ?)"
  );
  stmt.run(project_id, input_value, Timestamp, source, plan_id, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    io.emit("UpdateManufactureSMT");
    io.emit("updateManufactureDetails");
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    io.emit("ActivedUpdate");
    res.json({ success: true, id: this.lastID });
  });
  stmt.finalize();
});

app.post("/api/heartbeat", (req, res) => {
  const { device_id } = req.body;
  const now = Date.now();

  // ✅ Kiểm tra device_id
  if (!device_id) {
    return res.status(400).json({ error: "Missing device_id" });
  }

  console.log(
    `📡 Heartbeat from ${device_id} at ${new Date(now).toISOString()}`
  );

  db.run(
    `INSERT INTO heartbeats (device_id, last_seen)
     VALUES (?, ?)
     ON CONFLICT(device_id) DO UPDATE SET last_seen = ?`,
    [device_id, now, now],
    (err) => {
      if (err) {
        console.error("❌ DB Error:", err.message); // 👈 In lỗi chi tiết
        return res.status(500).json({ error: "Database error" });
      }

      io.emit("device-status", {
        device_id,
        status: "online",
        last_seen: now,
      });

      res.json({ message: "✅ Heartbeat received" });
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
app.post("/api/Manufacture/AOI", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status, Note, PlanID } = req.body;

  db.run(
    `INSERT INTO ManufactureAOI (PartNumber, HistoryID, Timestamp, Status, Note, PlanID)
     VALUES (?, ?, ? ,?, ?, ?)`,
    [PartNumber, HistoryID, Timestamp, Status, Note, PlanID],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureAOI");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      res.json({ message: "ManufactureAOI received" });
    }
  );
});

// Post value in table ManufactureIPQC
app.post("/api/Manufacture/IPQC", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status, Note, PlanID } = req.body;

  db.run(
    `INSERT INTO ManufactureIPQC (HistoryID, PartNumber, Timestamp, Status, Note, PlanID)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status, Note, PlanID],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureIPQC");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      res.json({ message: "ManufactureIPQC received" });
    }
  );
});

// Post value in table ManufactureAssembly
app.post("/api/Manufacture/Assembly", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status, PlanID } = req.body;

  db.run(
    `INSERT INTO ManufactureAssembly (HistoryID, PartNumber, Timestamp, Status, PlanID)
     VALUES (?, ?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status, PlanID],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureAssembly");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      res.json({ message: "ManufactureTest received" });
    }
  );
});

// Post value in table ManufactureOQC
app.post("/api/Manufacture/OQC", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status, Note, PlanID } = req.body;

  db.run(
    `INSERT INTO ManufactureOQC (HistoryID, PartNumber, Timestamp, Status, Note, PlanID)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status, Note, PlanID],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureOQC");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      res.json({ message: "ManufactureOQC received" });
    }
  );
});

// Post value in table ManufactureIPQCSMT
app.post("/api/Manufacture/IPQC-SMT", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status, Note, PlanID } = req.body;

  db.run(
    `INSERT INTO ManufactureIPQCSMT (HistoryID, PartNumber, Timestamp, Status, Note, PlanID)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status, Note, PlanID],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureIPQCSMT");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      res.json({ message: "ManufactureIPQCSMT received" });
    }
  );
});
// Post value in table ManufactureBoxBuild
app.post("/api/Manufacture/BoxBuild", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status, PlanID } = req.body;

  db.run(
    `INSERT INTO ManufactureBoxBuild (HistoryID, PartNumber, Timestamp, Status, PlanID)
     VALUES (?, ?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status, PlanID],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureBoxBuild");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      res.json({ message: "ManufactureBoxBuild received" });
    }
  );
});
// Post value in table ManufactureBoxBuild
app.post("/api/Manufacture/Conformal-Coating", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status, PlanID } = req.body;

  db.run(
    `INSERT INTO ManufactureConformalCoating (HistoryID, PartNumber, Timestamp, Status, PlanID)
     VALUES (?, ?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status, PlanID],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureCC");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      res.json({ message: "ManufactureConformalCoating received" });
    }
  );
});
// Post value in table ManufactureTest1
app.post("/api/Manufacture/Test1", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status, Note, PlanID } = req.body;

  db.run(
    `INSERT INTO ManufactureTest1 (HistoryID, PartNumber, Timestamp, Status, Note, PlanID)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status, Note, PlanID],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureTest1");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      res.json({ message: "ManufactureOQC received" });
    }
  );
});
// Post value in table ManufactureTest2
app.post("/api/Manufacture/Test2", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status, Note, PlanID } = req.body;

  db.run(
    `INSERT INTO ManufactureTest2 (HistoryID, PartNumber, Timestamp, Status, Note, PlanID)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status, Note, PlanID],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureTest2");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      res.json({ message: "ManufactureOQC received" });
    }
  );
});
// Post value in table ManufactureWarehouse
app.post("/api/Manufacture/Warehouse", (req, res) => {
  const { PartNumber, HistoryID, Timestamp, Status, PlanID } = req.body;

  db.run(
    `INSERT INTO ManufactureWarehouse (HistoryID, PartNumber, Timestamp, Status, PlanID)
     VALUES (?, ?, ?, ?, ?)`,
    [HistoryID, PartNumber, Timestamp, Status, PlanID],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureWarehouse");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      res.json({ message: "ManufactureOQC received" });
    }
  );
});

// Router update item in IPQC SMT table for Status
app.put("/api/Manufacture/IPQC-SMT/Edit-status/:id", async (req, res) => {
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
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    io.emit("UpdateManufactureRW");
    io.emit("ActivedUpdate");
    res.json({ message: "ManufactureIPQCSMT received" });
  });
});

// Router update item in IPQC table for Status
app.put("/api/Manufacture/IPQC/Edit-status/:id", async (req, res) => {
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
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    io.emit("UpdateManufactureRW");
    io.emit("ActivedUpdate");
    res.json({ message: "ManufactureIPQC received" });
  });
});

// Router update item in Test 1 table for Status
app.put("/api/Manufacture/Test1/Edit-status/:id", async (req, res) => {
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
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    io.emit("UpdateManufactureRW");
    io.emit("ActivedUpdate");
    res.json({ message: "ManufactureTest1 received" });
  });
});

// Router update item in Test 2 table for Status
app.put("/api/Manufacture/Test2/Edit-status/:id", async (req, res) => {
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
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    io.emit("UpdateManufactureRW");
    io.emit("ActivedUpdate");
    res.json({ message: "ManufactureTest2 received" });
  });
});

// Router update item in OQC table for Status
app.put("/api/Manufacture/OQC/Edit-status/:id", async (req, res) => {
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
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    io.emit("UpdateManufactureRW");
    io.emit("ActivedUpdate");
    res.json({ message: "ManufactureOQC received" });
  });
});

// Router update item in AOI table for Status
app.put("/api/Manufacture/AOI/Edit-status/:id", async (req, res) => {
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
    io.emit("UpdateManufactureRW");
    io.emit("updateManufactureDetails");
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    io.emit("ActivedUpdate");
    res.json({ message: "ManufactureAOI received" });
  });
});

// Update value in table AOI Status
app.put("/api/Manufacture/AOI-Fixed/Edit-status/:id", (req, res) => {
  const { Status, RWID, TimestampRW } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureAOI
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [Status, RWID, TimestampRW, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureAOI");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("UpdateManufactureRW");
      io.emit("ActivedUpdate");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table IPQC Status
app.put("/api/Manufacture/IPQC-Fixed/Edit-status/:id", (req, res) => {
  const { Status, RWID, TimestampRW } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureIPQC
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [Status, RWID, TimestampRW, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureIPQC");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("UpdateManufactureRW");
      io.emit("ActivedUpdate");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table IPQC-SMT Status
app.put("/api/Manufacture/IPQC-SMT-Fixed/Edit-status/:id", (req, res) => {
  const { Status, RWID, TimestampRW } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureIPQCSMT
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [Status, RWID, TimestampRW, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureIPQCSMT");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("UpdateManufactureRW");
      io.emit("ActivedUpdate");
      res.json({ message: "IPQCSMT received" });
    }
  );
});

// Update value in table Test1 Status
app.put("/api/Manufacture/Test1-Fixed/Edit-status/:id", (req, res) => {
  const { Status, RWID, TimestampRW } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureTest1
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [Status, RWID, TimestampRW, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureTest1");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("UpdateManufactureRW");
      io.emit("ActivedUpdate");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table Test2 Status
app.put("/api/Manufacture/Test2-Fixed/Edit-status/:id", (req, res) => {
  const { Status, RWID, TimestampRW } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureTest2
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [Status, RWID, TimestampRW, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureTest2");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("UpdateManufactureRW");
      io.emit("ActivedUpdate");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table OQC Status
app.put("/api/Manufacture/OQC-Fixed/Edit-status/:id", (req, res) => {
  const { Status, RWID, TimestampRW } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE ManufactureOQC
      SET Status=?, RWID=?, TimestampRW=?
      WHERE id=?`,
    [Status, RWID, TimestampRW, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureOQC");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("UpdateManufactureRW");
      io.emit("ActivedUpdate");
      res.json({ message: "Summary received" });
    }
  );
});

app.delete("/api/Manufacture/Delete-item-history/:id", (req, res) => {
  const { id } = req.params;
  const { table } = req.query;
  const query = `
    DELETE FROM ${table}
    WHERE id = ?
  `;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateManufactureSMT");
    io.emit("UpdateManufactureAOI");
    io.emit("UpdateManufactureIPQCSMT");
    io.emit("UpdateManufactureIPQC");
    io.emit("UpdateManufactureAssembly");
    io.emit("UpdateManufactureBoxBuild");
    io.emit("UpdateManufactureOQC");
    io.emit("UpdateManufactureWareHouse");
    io.emit("UpdateManufactureTest1");
    io.emit("UpdateManufactureTest2");
    io.emit("UpdateManufactureCC");
    io.emit("updateManufactureDetails");
    io.emit("updateHistoryPart");
    io.emit("ActivedUpdate");
    res.json({ message: "Đã xoá dữ liệu sản xuất thành công" });
  });
});

// Post value in table Summary
app.post("/api/Summary/Add-item", (req, res) => {
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

// Update value active stopped in table Summary
app.put("/api/Summary/Edit-item-action-stopped", (req, res) => {
  db.run(
    `UPDATE Summary
      SET Action='stopped'
    `,
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateSummary");
      io.emit("UpdateHistory");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value active in table Summary
app.put("/api/Summary/Edit-item-action/:id", (req, res) => {
  const { Action } = req.body;
  const { id } = req.params;
  db.run(
    `UPDATE Summary
      SET Action=?
      WHERE id=?`,
    [Action, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateSummary");
      io.emit("UpdateHistory");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table Summary
app.put("/api/Summary/Edit-item/:id", (req, res) => {
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
app.delete("/api/Summary/Delete-item/:id", async (req, res) => {
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

// Router delete item in Summary table
app.put("/api/Summary/Edit-item-action-stopped", async (req, res) => {
  const query = `
    UPDATE Summary SET Action = "stopped"
  `;
  db.run(query, [], function (err) {
    if (err) {
      return res.status(500).json({ error: "Lỗi khi cập nhật dữ liệu Action" });
    }
    io.emit("UpdateManufactureSMT");
    io.emit("updateManufactureDetails");
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    res.json({ message: "Đã cập nhật dữ liệu Action thành công" });
  });
});

// Router delete item in PlanManufacture table
app.put("/api/Summary/Edit-item-action/:id", async (req, res) => {
  const { id } = req.params;
  const { Action } = req.body;
  // Insert data into SQLite database
  const query = `
    UPDATE PlanManufacture 
      SET Action = ?
    WHERE id = ?
  `;
  db.run(query, [Action, id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Lỗi khi cập nhật dữ liệu Action" });
    }
    io.emit("UpdateManufactureSMT");
    io.emit("updateManufactureDetails");
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    res.json({ message: "Đã cập nhật dữ liệu Action thành công" });
  });
});

// Bom , Pick&Place table

// Post value in table Summary
app.post("/api/FilterBom/Add-item", (req, res) => {
  const { project_name, created_at, note } = req.body;
  db.run(
    `INSERT INTO FilterBom (
        project_name, 
        created_at, 
        note, 
        flipX_top, 
        flipY_top, 
        swapXY_top, 
        cx_top, 
        cy_top, 
        rotation_top, 
        rotationSVG_top, 
        manualOffsetX_top, 
        manualOffsetY_top,
        labelAngle_top,
        componentBodyAngle_top,
        flipX_bottom, 
        flipY_bottom, 
        swapXY_bottom, 
        cx_bottom, 
        cy_bottom, 
        rotation_bottom, 
        rotationSVG_bottom, 
        manualOffsetX_bottom, 
        manualOffsetY_bottom,
        labelAngle_bottom,
        componentBodyAngle_bottom,
        panel_frame_X,
        panel_frame_Y
        )
     VALUES (?, ?, ?, 'false', 'false', 'false', 0, 0, 0, 0, 0, 0, 0, 0, 'false', 'false', 'false', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
    [project_name, created_at, note],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("UpdateFilterBom");
      res.json({ message: "Filter Bom received" });
    }
  );
});

// Put value in table Summary
app.put("/api/FilterBom/Edit-item/:id", (req, res) => {
  const { id } = req.params;
  const { project_name, created_at, note } = req.body;
  db.run(
    `UPDATE FilterBom 
    SET 
      project_name = ?, 
      created_at = ?, 
      note = ?
    WHERE id = ?`,
    [project_name, created_at, note, id],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("UpdateFilterBom");
      res.json({ message: "Summary received" });
    }
  );
});

// Router delete item in Summary table
app.delete("/api/FilterBom/Delete-item/:id", async (req, res) => {
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    DELETE FROM FilterBom WHERE id = ?
  `;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateFilterBom");
    res.json({ message: "Đã xoá dữ liệu Bom thành công" });
  });
});

// Router post item in Bom table
app.post(
  "/api/upload-bom/:project_id",
  upload.single("FileBom"),
  (req, res) => {
    const projectId = req.params.project_id;
    const filePath = path.join(__dirname, req.file.path);

    try {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet);

      const stmt = db.prepare(`
      INSERT INTO Bom (description, mpn, designator, quantity, project_id)
      VALUES (?, ?, ?, ?, ?)
    `);

      // Dùng Set để lưu ref đã insert, tránh trùng
      const insertedRefs = new Set();

      rows.forEach((row) => {
        const refs = String(row["Reference(s)"] || row["Designator"] || "")
          .split(",")
          .map((r) => r.trim())
          .filter((r) => r.length > 0);

        refs.forEach((ref) => {
          // Nếu chưa tồn tại thì mới insert
          if (!insertedRefs.has(ref)) {
            stmt.run(
              row.Description || "",
              row.MPN || row.Comment || "",
              ref,
              1, // mỗi reference 1
              projectId
            );
            insertedRefs.add(ref);
          }
        });
      });

      stmt.finalize();
      fs.unlinkSync(filePath);
      io.emit("CombineBomUpdate");
      res.json({
        message: "BOM uploaded & formatted successfully, duplicates removed",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Lỗi xử lý file BOM" });
    }
  }
);

const XLSX = require("xlsx");

// Router post item in Pick & Place table
app.post(
  "/api/upload-pickplace/:id",
  upload.single("FilePnP"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const ppFile = req.file;
      if (!ppFile) {
        return res.status(400).json({ error: "Thiếu file Pick&Place" });
      }

      // Parse XLSX
      function parseXLSX(filePath) {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // lấy sheet đầu tiên
        const sheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(sheet, {
          defval: "",    // nếu ô trống thì để rỗng
          raw: false,    // ép kiểu string cho nhất quán
          blankrows: false
        });
      }

      const ppData = parseXLSX(ppFile.path);

      // Hàm đổi PosX, PosY từ mils -> mm
      function parsePos(str) {
        const num = parseFloat((str || "0").toString().replace(/,/g, "."));
        if (isNaN(num)) return 0;
        return +(num * 0.0254).toFixed(2); // mils -> mm
      }

      // Chuẩn hóa header & lọc trùng Ref
      const uniqueRows = [];
      const seenRefs = new Set();

      for (const row of ppData) {
        const designator = (row.Ref || row.Designator)?.trim();
        if (!designator || seenRefs.has(designator)) continue;
        seenRefs.add(designator);

        uniqueRows.push({
          designator,
          posX: row.PosX,
          posY: row.PosY,
          rotation: parseFloat(row.Rotation || "0"),
          layer: row.Side || row.Layer || "",
          project_id: id,
        });
      }

      // Lưu vào DB
      const stmt = db.prepare(`
        INSERT INTO Pickplace (designator, layer, x, y, rotation, project_id, type)
        VALUES (?, ?, ?, ?, ?, ?, 'SMT')
      `);

      for (const r of uniqueRows) {
        stmt.run(
          r.designator,
          r.layer,
          r.posX,
          r.posY,
          r.rotation,
          r.project_id
        );
      }
      stmt.finalize();

      // Xóa file tạm
      fs.unlinkSync(ppFile.path);
      io.emit("CombineBomUpdate");

      res.json({
        message: "Pick&Place đã upload & lưu thành công (Excel, mils → mm)",
        inserted: uniqueRows.length,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Lỗi xử lý file Pick&Place (Excel)" });
    }
  }
);



// Detect layer by file extension
function detectLayer(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".gtp") return "Top";
  if (ext === ".gbp") return "Bottom";
  return "Unknown";
}

// Detect unit in Gerber
function detectUnit(fileContent) {
  if (fileContent.includes("%MOIN")) return "inch";
  if (fileContent.includes("%MOMM")) return "mm";
  return "unknown";
}

// Detect format (FS)
function detectFormat(fileContent) {
  // Ví dụ: %FSLAX44Y44*%  -> X: 4.4, Y: 4.4
  const m = fileContent.match(/%FS([LT])A?X(\d)(\d)Y(\d)(\d)\*%/);
  if (!m) return null;

  return {
    suppression: m[1] === "L" ? "leading" : "trailing", // L = leading zero omitted, T = trailing
    x_int: parseInt(m[2], 10),
    x_dec: parseInt(m[3], 10),
    y_int: parseInt(m[4], 10),
    y_dec: parseInt(m[5], 10),
  };
}

// Upload Gerber
app.post("/api/upload-gerber/:id", upload.single("FileGerber"), (req, res) => {
  const projectId = req.params.id;
  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const layer = detectLayer(fileName);

  try {
    // Đọc nội dung file text để detect unit + format
    const fileContent = fs.readFileSync(filePath, "utf8");
    const unit = detectUnit(fileContent);
    const format = detectFormat(fileContent);

    // Convert sang SVG
    const fileStream = fs.createReadStream(filePath);
    const converter = gerberToSvg(fileStream);

    let svgData = "";
    converter.on("data", (d) => (svgData += d.toString()));
    converter.on("end", () => {
      db.run(
        `INSERT INTO GerberData (layer, svg, filename, project_id, unit, format) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          layer,
          svgData,
          fileName,
          projectId,
          unit,
          format ? JSON.stringify(format) : null,
        ],
        function (err) {
          if (err) {
            console.error("DB insert error:", err.message);
            return res.status(500).json({ error: err.message });
          }

          io.emit("gerber_uploaded", {
            id: this.lastID,
            layer,
            unit,
            format,
            svg: svgData,
          });
          io.emit("CombineBomUpdate");
          io.emit("PnPFileUpdate");
          res.json({ id: this.lastID, layer, unit, format });
        }
      );

      fs.unlinkSync(filePath); // Xóa file upload sau khi xử lý
    });

    converter.on("error", (err) => {
      console.error("Gerber convert error:", err.message);
      res.status(500).json({ error: "Failed to convert Gerber to SVG" });
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  } catch (e) {
    console.error("Upload error:", e.message);
    res.status(500).json({ error: e.message });
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

// Put value in table Pick Place table
app.put("/api/Pickplace/Edit-item/:id", (req, res) => {
  const { id } = req.params;
  const { x, y, rotation, type, layer } = req.body;
  db.run(
    `UPDATE Pickplace 
    SET 
      x = ?, 
      y = ?, 
      rotation = ?,
      type = ?,
      layer = ?
    WHERE id = ?`,
    [x, y, rotation, type, layer, id],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("CombineBomUpdate");
      io.emit("PnPFileUpdate");
      io.emit("SettingSVGUpdate");
      res.json({ message: "Summary received" });
    }
  );
});

// Put item in PickPlace table
app.put("/api/PickPlace/Update-item", (req, res) => {
  const updates = req.body; // Mảng [{id, project_id, x, y}, ...]

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  }

  // Chuẩn bị statement
  const stmt = db.prepare(`
    UPDATE Pickplace
    SET x = ?, y = ?
    WHERE id = ? AND project_id = ?
  `);

  db.serialize(() => {
    updates.forEach(item => {
      stmt.run(item.x, item.y, item.id, item.project_id);
    });

    stmt.finalize(err => {
      if (err) {
        console.error("Update error:", err);
        return res.status(500).json({ error: "Lỗi khi update" });
      }
      res.json({ message: "Update Pickplace thành công", count: updates.length });
    });
  });
});

// Put value in table SettingSVG table
app.put("/api/SettingSVG/Edit-item-top/:id", (req, res) => {
  const { id } = req.params;
  const { cx, cy, rotation, rotationSVG, manualOffsetX, manualOffsetY, flipX, flipY, swapXY, labelAngle, componentBodyAngle, panelFrameX, panelFrameY } = req.body;
  db.run(
    `UPDATE FilterBom
    SET 
      flipX_top = ?,
      flipY_top = ?,
      swapXY_top = ?,
      cx_top = ?, 
      cy_top = ?, 
      rotation_top = ?,
      rotationSVG_top = ?,
      manualOffsetX_top = ?,
      manualOffsetY_top = ?,
      labelAngle_top = ?,
      componentBodyAngle_top = ?,
      panel_frame_X = ?,
      panel_frame_Y = ?
    WHERE id = ?`,
    [flipX, flipY, swapXY, cx, cy, rotation, rotationSVG, manualOffsetX, manualOffsetY, labelAngle, componentBodyAngle, panelFrameX, panelFrameY, id],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("CombineBomUpdate");
      io.emit("PnPFileUpdate");
      io.emit("SettingSVGUpdate");
      res.json({ message: "Summary received" });
    }
  );
});

app.put("/api/SettingSVG/Edit-item-bottom/:id", (req, res) => {
  const { id } = req.params;
  const { cx, cy, rotation, rotationSVG, manualOffsetX, manualOffsetY, flipX, flipY, swapXY, labelAngle, componentBodyAngle, panelFrameX, panelFrameY } = req.body;
  db.run(
    `UPDATE FilterBom
    SET 
      flipX_bottom = ?,
      flipY_bottom = ?,
      swapXY_bottom = ?,
      cx_bottom = ?, 
      cy_bottom = ?, 
      rotation_bottom = ?,
      rotationSVG_bottom = ?,
      manualOffsetX_bottom = ?,
      manualOffsetY_bottom = ?,
      labelAngle_bottom = ?,
      componentBodyAngle_bottom = ?,
      panel_frame_X = ?,
      panel_frame_Y = ?
    WHERE id = ?`,
    [flipX, flipY, swapXY, cx, cy, rotation, rotationSVG, manualOffsetX, manualOffsetY, labelAngle, componentBodyAngle, panelFrameX, panelFrameY, id],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("CombineBomUpdate");
      io.emit("PnPFileUpdate");
      io.emit("SettingSVGUpdate");
      res.json({ message: "Summary received" });
    }
  );
});

// Post item in Component overrides
app.post("/api/Component-overrides/Add-item", (req, res) => {
  const { mpn, package, length, width } = req.body;
  db.run(
    `INSERT INTO Component_overrides (
        mpn, 
        package, 
        length, 
        width
        )
     VALUES (?, ?, ?, ?)`,
    [mpn, package, length, width],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("UpdateFilterBom");
      io.emit("CombineBomUpdate");
      io.emit("PnPFileUpdate");
      res.json({ message: "Filter Bom received" });
    }
  );
});

// Put item in Component overrides
app.put("/api/Component-overrides/Edit-item/:id", (req, res) => {
  const { id } = req.params;
  const { package, length, width } = req.body;
  db.run(
    `UPDATE Component_overrides
     SET
        package = ?, 
        length = ?, 
        width = ?
     WHERE id = ?`,
    [package, length, width, id],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("UpdateFilterBom");
      io.emit("CombineBomUpdate");
      io.emit("PnPFileUpdate");
      res.json({ message: "Filter Bom received" });
    }
  );
});

// Put item in Component overrides
app.put("/api/Component/Edit-item/:id", (req, res) => {
  const { id } = req.params;
  const { package, length, width } = req.body;
  db.run(
    `UPDATE Components
     SET
        package = ?, 
        length = ?, 
        width = ?
     WHERE id = ?`,
    [package, length, width, id],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("UpdateFilterBom");
      io.emit("CombineBomUpdate");
      io.emit("PnPFileUpdate");
      res.json({ message: "Filter Bom received" });
    }
  );
});




// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Catch-all route cho frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Khởi động servers
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 HTTP Server running on port ${PORT}`);
});

// Thêm endpoint xóa session AI chat
app.post("/ai/clear-session", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && sessions[sessionId]) {
    delete sessions[sessionId];
    return res.json({ success: true });
  }
  res.json({ success: false, message: "Session not found" });
});
