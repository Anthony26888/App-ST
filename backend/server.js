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
const { router: aiSummaryRouter, setIO: setAISummaryIO } = require("./routes/AI-Summary/ai.summary");
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
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { nanoid } = require("nanoid");

// const {queryWithLangChain } = require("./Ollama-AI/queryEngine.js");
// const queryMap = require("./Ollama-AI/queryMap")
const fetch = require("node-fetch");

// const https = require("https"); // XÓA: không dùng SSL nữa

// Add processing flags at the top of the file
const processingRequests = new Set();
const GATEWAY_URL = "http://192.168.1.201:8080";
const ESP32_IP_LINE1 = "http://192.168.1.205"; // IP ESP32 (phải đổi đúng IP của bạn)
const ESP32_IP_LINE2 = "http://192.168.1.206";
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
  "http://192.168.100.200",
  "http://192.168.1.200",
  "http://192.168.2.200",
  "http://192.168.1.201",
  "http://192.168.2.201",
  "http://192.168.2.74",

  // Production domain – **đầy đủ biến thể**
  "http://erp.sieuthuat.com",
  "https://erp.sieuthuat.com",
  "http://erpst.io.vn",
  "https://erpst.io.vn",
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
app.use("/api/ai", aiSummaryRouter);
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
// BẮT BUỘC CÓ để xử lý preflight OPTIONS
app.options("*", cors());

// Tạo HTTP server
const server = require("http").createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Initialize Socket.IO for AI routes
setAISummaryIO(io);

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

const storageMachine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/machine"); // tạo sẵn folder này
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

// chỉ cho phép png/jpg
const fileFilterMachine = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Chỉ cho phép PNG, JPG, WEBP, HEIC"));
};

const uploadMachine = multer({
  storage: storageMachine,
  fileFilter: fileFilterMachine,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
    }),
    socket.on("get-notifications", async () => {
      try {
        const query = `
        SELECT 
          vn.id,
          vn.ItemId,
          vn.Title,
          vn.Message,
          vn.Quantity,
          vn.Icon,
          vn.Color,
          vn.Status,
          vn.DaysRemaining,
          sd.DeliveryDate,
          sd.DeliveryQuantity,
          sd.DeliveryStatus,
          vn.IsRead
        FROM vw_NotificationDelivery vn
        LEFT JOIN ScheduleDelivery sd ON vn.id = sd.id
        WHERE vn.Title IS NOT NULL     
        ORDER BY vn.DaysRemaining ASC
      `;

        db.all(query, (err, rows) => {
          if (err) {
            socket.emit("notifications-error", { error: err.message });
            return;
          }
          socket.emit("notifications-update", rows || []);
        });
      } catch (error) {
        socket.emit("notifications-error", { error: error.message });
      }
    });

  // Client request statistics
  socket.on("get-statistics", async () => {
    try {
      const query = `
        SELECT 
          COUNT(*) AS Total,
          SUM(CASE WHEN CAST((DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 0 THEN 1 ELSE 0 END) AS Today,
          SUM(CASE WHEN CAST((DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 1 THEN 1 ELSE 0 END) AS Tomorrow,
          SUM(CASE WHEN CAST((DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) IN (2, 3) THEN 1 ELSE 0 END) AS SoonAfter
        FROM ScheduleDelivery
        WHERE DeliveryStatus = 'Chưa giao'
          AND CAST((DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) BETWEEN 0 AND 3
      `;

      db.all(query, (err, rows) => {
        if (err) {
          socket.emit("statistics-error", { error: err.message });
          return;
        }
        socket.emit("statistics-update", rows[0] || {});
      });
    } catch (error) {
      socket.emit("statistics-error", { error: error.message });
    }
  });

  // Mark notification as read
  socket.on("mark-notification-read", async (notificationId) => {
    try {
      const query = `
        INSERT OR IGNORE INTO NotificationReadStatus (notification_id)
        VALUES (?)
      `;

      db.run(query, [notificationId], (err) => {
        if (err) {
          console.error("❌ Error marking notification as read:", err.message);
          socket.emit("notification-read-error", { error: err.message });
          return;
        }

        console.log(`✅ Notification #${notificationId} marked as read`);

        // Broadcast to all clients to refresh notifications
        io.emit("notification-marked-read", { id: notificationId });
      });
    } catch (error) {
      console.error("❌ Error:", error.message);
      socket.emit("notification-read-error", { error: error.message });
    }
  });

  // Mark all notifications as read
  socket.on("mark-all-notifications-read", async () => {
    try {
      // Get all unread notification IDs
      const getUnreadQuery = `
        SELECT id FROM vw_NotificationDelivery WHERE IsRead = 0
      `;

      db.all(getUnreadQuery, [], (err, rows) => {
        if (err) {
          socket.emit("notification-read-error", { error: err.message });
          return;
        }

        if (rows.length === 0) {
          io.emit("all-notifications-marked-read");
          return;
        }

        // Insert all notification IDs into NotificationReadStatus
        const placeholders = rows.map(() => "(?)").join(",");
        const insertQuery = `
          INSERT OR IGNORE INTO NotificationReadStatus (notification_id)
          VALUES ${placeholders}
        `;
        const ids = rows.map((row) => row.id);

        db.run(insertQuery, ids, (err) => {
          if (err) {
            console.error(
              "❌ Error marking all notifications as read:",
              err.message
            );
            socket.emit("notification-read-error", { error: err.message });
            return;
          }

          console.log(`✅ Marked ${rows.length} notifications as read`);

          // Broadcast to all clients to refresh notifications
          io.emit("all-notifications-marked-read");
        });
      });
    } catch (error) {
      console.error("❌ Error:", error.message);
      socket.emit("notification-read-error", { error: error.message });
    }
  });

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
                          COALESCE(COUNT(DISTINCT CASE WHEN LOWER(TRIM(c.Type)) = 'thành phẩm' THEN c.id END), 0) AS Quantity_Manufacture,
                          a.Note AS Note,
                          CASE
                              WHEN a.QuantityProduct = a.QuantityDelivered THEN 'Hoàn thành'
                              ELSE 'Đang sản xuất'
                          END AS Status,
                          COALESCE(
                              GROUP_CONCAT(
                                  json_object(
                                      'id', d.id,
                                      'DeliveryDate', strftime('%Y-%m-%d', d.DeliveryDate, 'unixepoch', 'localtime'),
                                      'DeliveryDateConvert', strftime('%d-%m-%Y', d.DeliveryDate, 'unixepoch', 'localtime'),
                                      'DeliveryQuantity', d.DeliveryQuantity,
                                      'DeliveryCheck', d.DeliveryStatus,
                                      'DeliveryStatus', CASE
                                          WHEN d.DeliveryDate IS NULL THEN 'Chưa có lịch'
                                          WHEN datetime(d.DeliveryDate, 'unixepoch', 'localtime') < datetime('now', 'localtime') THEN 'Trễ hạn'
                                          WHEN datetime(d.DeliveryDate, 'unixepoch', 'localtime') >= datetime('now', 'localtime') THEN 'Chưa đến hạn'
                                          ELSE 'Không xác định'
                                      END,
                                      'DaysRemaining', CAST(
                                          ROUND(
                                              (CAST(d.DeliveryDate AS REAL) - CAST(strftime('%s', 'now') AS REAL)) / 86400.0
                                          )
                                          AS INTEGER
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
                        strftime('%Y-%m-%d', a.NgayMua, 'unixepoch', 'localtime') AS NgayMuaUnixpoch,
                        strftime('%d-%m-%Y', a.NgayMua, 'unixepoch', 'localtime') AS NgayMuaConvert,
                        a.ViTri, 
                        a.MoTa, 
                        a.Image,
                        a.Condition,
                        MIN(b.LoaiBaoTri) as LoaiBaoTri,
                        MIN(b.ChuKyBaoTri) as ChuKyBaoTri,
                        MIN(b.DonViChuKy) as DonViChuKy,
                        b.GhiChu,
                        strftime('%Y-%m-%d', MIN(b.NgayBatDau), 'unixepoch', 'localtime') AS NgayBaoTriUnixepoch,
                        strftime('%d-%m-%Y', MIN(b.NgayBatDau), 'unixepoch', 'localtime') AS NgayBaoTriConvert,
                        strftime('%Y-%m-%d', MIN(b.NgayBaoTriTiepTheo), 'unixepoch', 'localtime') AS NgayBaoTriTiepTheoUnixepoch,
                        strftime('%d-%m-%Y', MIN(b.NgayBaoTriTiepTheo), 'unixepoch', 'localtime') AS NgayBaoTriTiepTheoConvert,
                        CASE
                          WHEN CAST((MIN(b.NgayBaoTriTiepTheo) - strftime('%s', 'now', 'localtime')) / 86400 AS INTEGER) > 15 THEN 'Chưa tới hạn'
                          ELSE 'Cần bảo trì'
                        END AS Status,
                        COALESCE(
                            GROUP_CONCAT(DISTINCT
                                json_object(
                                    'MaLich', b.MaLich,
                                    'LoaiBaoTri', b.LoaiBaoTri,
                                    'ChuKyBaoTri', b.ChuKyBaoTri,
                                    'DonViChuKy', b.DonViChuKy,
                                    'NgayBaoTriTiepTheo', strftime('%d-%m-%Y', b.NgayBaoTriTiepTheo, 'unixepoch', 'localtime'),
                                    'GhiChu', b.GhiChu,
                                    'Status', CASE
                                        WHEN CAST((b.NgayBaoTriTiepTheo - strftime('%s', 'now', 'localtime')) / 86400 AS INTEGER) > 15 THEN 'Chưa tới hạn'
                                        ELSE 'Cần bảo trì'
                                    END
                                )
                            ), '[]'
                        ) as Schedules
                      FROM Machine a 
                      LEFT JOIN MaintenanceSchedule b 
                      ON a.MaThietBi = b.MaThietBi
                      LEFT JOIN Maintenance m ON a.MaThietBi = m.MaThietBi
                      GROUP BY a.MaThietBi 
                      ORDER BY a.ViTri ASC`;
        db.all(query, [], (err, rows) => {
          if (err) {
             console.error("MachineError", err);
             return socket.emit("MachineError", err);
          }
          // SQLite GROUP_CONCAT returns a comma-separated string of JSON objects, which is NOT valid JSON array [{},{}]
          // We need to fix it here or in frontend. 
          // However, simpler is to do it in frontend as we did before.
          // BUT wait, DISTINCT json_object might NOT work if json_object returns varying strings?
          // Actually, json_object returns string. DISTINCT works on strings.
          
          socket.emit("MachineData", rows);
        });
      } catch (error) {
        socket.emit("MachineError", error);
      }
    }),
    socket.on("getMaintenance", async (id) => {
      try {
        const query = `SELECT 
                          m.*,
                          strftime('%d-%m-%Y', m.NgayBaoTri, 'unixepoch', 'localtime') AS NgayBaoTriConvert,
                          strftime('%Y-%m-%d', m.NgayBaoTri, 'unixepoch', 'localtime') AS NgayBaoTriUnixepoch,
                          strftime('%d-%m-%Y', m.NgayHoanThanh, 'unixepoch', 'localtime') AS NgayHoanThanhConvert,
                          strftime('%Y-%m-%d', m.NgayHoanThanh, 'unixepoch', 'localtime') AS NgayHoanThanhUnixepoch,
                          COALESCE(
                              '[' || GROUP_CONCAT(
                                  json_object(
                                      'id', s.MaSuDung,
                                      'TenPhuTung', s.TenPhuTung,
                                      'SoLuongSuDung', s.SoLuongSuDung,
                                      'DonVi', s.DonVi,
                                      'GhiChu', s.GhiChu
                                  )
                              ) || ']',
                              '[]'
                          ) AS Accessories
                      FROM Maintenance m
                      LEFT JOIN SparePartUsage s ON m.MaBaoTri = s.MaBaoTri
                      WHERE m.MaThietBi = ? 
                      GROUP BY m.MaBaoTri
                      ORDER BY m.NgayBaoTri DESC`;
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
        const query = `SELECT DISTINCT *,  
                     CAST(
                        (NgayBaoTriTiepTheo - strftime('%s', 'now', 'localtime')) / 86400
                        AS INTEGER
                      ) AS SoNgayConLai,
                      strftime('%d-%m-%Y', NgayBatDau, 'unixepoch', 'localtime') AS NgayBatDauConvert,
                      strftime('%Y-%m-%d', NgayBatDau, 'unixepoch', 'localtime') AS NgayBatDauUnixepoch,
                      strftime('%d-%m-%Y', NgayBaoTriTiepTheo, 'unixepoch', 'localtime') AS NgayBaoTriTiepTheoConvert,
                      strftime('%Y-%m-%d', NgayBaoTriTiepTheo, 'unixepoch', 'localtime') AS NgayBaoTriTiepTheoUnixepoch
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
        const query = `SELECT 
                        z.id,
                        z.Name,
                        z.Name_Order,
                        z.Total,

                        -- Tổng thành phẩm
                        COALESCE(SUM(CASE 
                            WHEN LOWER(TRIM(b.Type)) = 'thành phẩm' THEN 1 
                            ELSE 0 
                        END), 0) AS Total_Output,

                        -- Trạng thái
                        CASE
                            WHEN z.Total = COALESCE(SUM(CASE 
                                WHEN LOWER(TRIM(b.Type)) = 'thành phẩm' THEN 1 
                                ELSE 0 
                            END), 0)
                            THEN 'Hoàn thành'
                            ELSE 'Đang sản xuất'
                        END AS Status_Output,

                        z.Level,
                        strftime('%d-%m-%Y', z.Date, 'unixepoch', 'localtime') AS Date,
                        strftime('%Y-%m-%d', z.Date, 'unixepoch', 'localtime') AS Date_unixepoch,

                        -- Progress phải viết lại công thức
                        (
                            COALESCE(SUM(CASE 
                                WHEN LOWER(TRIM(b.Type)) = 'thành phẩm' THEN 1 
                                ELSE 0 
                            END), 0) * 100.0
                            / z.Total
                        ) AS Progress,

                        z.Note,
                        z.Creater,
                        z.DelaySMT,
                        z.Quantity

                    FROM PlanManufacture z
                    LEFT JOIN ManufactureCounting b ON z.id = b.PlanID

                    GROUP BY 
                        z.id,
                        z.Name,
                        z.Name_Order,
                        z.Total,
                        z.Level,
                        z.Date,
                        z.Note,
                        z.Creater,
                        z.DelaySMT,
                        z.Quantity

                    ORDER BY z.Date DESC;`;
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
        const query = `
                    SELECT 
                      a.id,
                      a.Name,
                      a.Name_Order,
                      a.Total,
                      a.DelaySMT,
                      a.Quantity,
                      a.Level,
                      a.Date,
                      
                      COALESCE(smt.SMT_1, 0) AS SMT_1,
                      COALESCE(smt.SMT_2, 0) AS SMT_2,
                      COALESCE(smt.SMT_3, 0) AS SMT_3,
                      COALESCE(smt.SMT_4, 0) AS SMT_4,
                      
                      COALESCE(cnt.Quantity_Pass, 0) AS Quantity_Pass,
                      COALESCE(cnt.Quantity_Output_Fail, 0) AS Quantity_Output_Fail,
                      COALESCE(cnt.Quantity_Error, 0) AS Quantity_Error,
                      COALESCE(cnt.Quantity_Fixed, 0) AS Quantity_Fixed

                    FROM PlanManufacture a

                    -- Subquery SMT được tối ưu (GROUP BY để đếm một lần)
                    LEFT JOIN (
                      SELECT 
                        PlanID,
                        SUM(CASE WHEN Source = 'source_1' THEN 1 ELSE 0 END) AS SMT_1,
                        SUM(CASE WHEN Source = 'source_2' THEN 1 ELSE 0 END) AS SMT_2,
                        SUM(CASE WHEN Source = 'source_3' THEN 1 ELSE 0 END) AS SMT_3,
                        SUM(CASE WHEN Source = 'source_4' THEN 1 ELSE 0 END) AS SMT_4
                      FROM ManufactureSMT
                      GROUP BY PlanID
                    ) smt ON smt.PlanID = a.id

                    -- Subquery Counting được tối ưu (GROUP BY để đếm một lần)
                    LEFT JOIN (
                      SELECT 
                        PlanID,
                        SUM(CASE WHEN Type = 'Thành phẩm' AND Status = 'pass' THEN 1 ELSE 0 END) AS Quantity_Pass,
                        SUM(CASE WHEN Type = 'Thành phẩm' AND Status = 'fail' THEN 1 ELSE 0 END) AS Quantity_Output_Fail,
                        SUM(CASE WHEN Status = 'fail' THEN 1 ELSE 0 END) AS Quantity_Error,
                        SUM(CASE WHEN Status_Fixed = 'fixed' THEN 1 ELSE 0 END) AS Quantity_Fixed
                      FROM ManufactureCounting
                      GROUP BY PlanID
                    ) cnt ON cnt.PlanID = a.id

                    WHERE a.id = ?
                  `;

        db.get(query, [id], (err, row) => {
          if (err) return socket.emit("ManufactureDetailsError", err);
          socket.emit("ManufactureDetailsData", row);
        });
      } catch (error) {
        socket.emit("ManufactureDetailsError", error);
      }
    });

  socket.on("getConfigs", async () => {
    try {
      const query = `SELECT * FROM configs ORDER BY id DESC`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("ConfigsError", err);
        socket.emit("ConfigsData", rows);
      });
    } catch (error) {
      socket.emit("ManufactureDetailsError", error);
    }
  }),
    // ========== SET PROJECT ==========
    socket.on("setProject", (id) => {
      console.log(`Client ${socket.id} chọn project_id = ${id}`);
      userProjects.set(socket.id, id);
    });

  socket.on("getManufactureCounting", async (id) => {
    try {
      const query = `SELECT 
                            id,
                            PartNumber,
                            Status,
                            Status_Fixed,
                            RWID,
                            GroupFail,
                            strftime('%d-%m-%Y %H:%M:%S', TimestampRW, 'unixepoch', 'localtime') AS TimestampRW,
                            Note,
                            strftime('%d-%m-%Y %H:%M:%S', Timestamp, 'unixepoch', 'localtime') AS Timestamp
                          FROM ManufactureCounting
                          WHERE HistoryID = ?
                          ORDER BY Timestamp DESC`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("ManufactureCountingError", err);
        socket.emit("ManufactureCountingData", rows);
      });
    } catch (error) {
      socket.emit("ManufactureCountingError", error);
    }
  }),
    socket.on("getManufactureRW", async (id) => {
      try {
        const query = `SELECT 
                          id,
                          PartNumber,
                          Type,
                          Status,
                          Status_Fixed,
                          RWID,
                          GroupFail,
                          strftime('%d-%m-%Y %H:%M:%S', TimestampRW, 'unixepoch', 'localtime') AS TimestampRW,
                          Note,
                          Note_RW,
                          strftime('%d-%m-%Y %H:%M:%S', Timestamp, 'unixepoch', 'localtime') AS Timestamp
                        FROM ManufactureCounting
                        WHERE PlanID = ? AND Status = 'fail'
                        ORDER BY RWID ASC, Timestamp DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureRWError", err);
          socket.emit("ManufactureRWData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureRWError", error);
      }
    }),
    socket.on("getManufactureSMT", async (id) => {
      try {
        const query = `SELECT 
                        id,
                        PartNumber,
                        CASE
                          WHEN Source = 'source_1' THEN 'Máy printer'
                          WHEN Source = 'source_2' THEN 'Máy gắp linh kiện Juki'
                          WHEN Source = 'source_3' THEN 'Máy gắp linh kiện Topaz'
                          ELSE 'Máy gắp linh kiện Yamaha'
                        END AS Source,
                        CASE
                          WHEN Source = 'source_2' THEN 'Line 1'
                          WHEN Source = 'source_1' THEN 'Line 1'
                          ELSE 'Line 2'
                        END AS Line,
                        Status,
                        strftime('%d-%m-%Y %H:%M:%S', Timestamp, 'unixepoch', 'localtime') AS Timestamp,
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
    socket.on("getSummary", async (endDay) => {
      try {
        const query = `WITH DateFilter AS (
                        SELECT 
                          strftime('%Y-%m-%d', ?, '+0 days') AS target_date
                      ),

                      CountingData AS (
                        -- Pre-aggregate tất cả Counting data
                        SELECT 
                          HistoryID,
                          SUM(CASE WHEN Status = 'pass' THEN 1 ELSE 0 END) AS pass_count,
                          SUM(CASE WHEN Status = 'fail' THEN 1 ELSE 0 END) AS fail_count,
                          SUM(CASE WHEN TimestampRW IS NOT NULL AND TimestampRW <> '' THEN 1 ELSE 0 END) AS rw_count,
                          COUNT(*) AS total_count
                        FROM ManufactureCounting
                        GROUP BY HistoryID
                      ),

                      SMTData AS (
                        -- Pre-aggregate SMT data
                        SELECT 
                          HistoryID,
                          SUM(CASE WHEN Source = 'source_2' THEN 1 ELSE 0 END) AS source_2_count,
                          SUM(CASE WHEN Source = 'source_4' THEN 1 ELSE 0 END) AS source_4_count
                        FROM ManufactureSMT
                        GROUP BY HistoryID
                      )

                      SELECT 
                        a.id,
                        a.Type,
                        a.Category,
                        a.Quantity_Plan,
                        a.PlanID,
                        c.Name_Order,
                        a.PONumber,
                        a.Time_Plan,
                        a.CycleTime_Plan,
                        COALESCE(b.fail_count, 0) AS GroupFail,
                        
                        -- Quantity_Real (tính dựa trên Line_SMT)
                        CASE 
                          WHEN a.Line_SMT = 'Line 1' THEN c.Quantity * COALESCE(d.source_2_count, 0)
                          WHEN a.Line_SMT = 'Line 2' THEN c.Quantity * COALESCE(d.source_4_count, 0)
                          ELSE COALESCE(b.pass_count, 0)
                        END AS Quantity_Real,

                        COALESCE(b.fail_count, 0) AS Quantity_Error,
                        COALESCE(b.rw_count, 0) AS Quantity_RW,
                        COUNT(DISTINCT b.HistoryID) AS Total_Summary_ID,

                        COALESCE(b.pass_count, 0) + COALESCE(b.fail_count, 0) AS Total_Quantity,

                        -- Percent_Error
                        COALESCE(
                          ROUND(
                            (COALESCE(b.fail_count, 0) * 100.0) 
                            / NULLIF(COALESCE(b.pass_count, 0) + COALESCE(b.fail_count, 0), 0), 
                            1
                          ), 
                          0.0
                        ) AS Percent_Error,

                        -- Percent (dựa trên Line_SMT)
                        CASE
                          WHEN a.Line_SMT = 'Line 1' THEN 
                            ROUND(
                              (c.Quantity * COALESCE(d.source_2_count, 0) * 100.0) 
                              / NULLIF(a.Quantity_Plan, 0.0), 
                              1
                            )
                          WHEN a.Line_SMT = 'Line 2' THEN  
                            ROUND(
                              (c.Quantity * COALESCE(d.source_4_count, 0) * 100.0) 
                              / NULLIF(a.Quantity_Plan, 0.0), 
                              1
                            )
                          ELSE 
                            ROUND(
                              (COALESCE(b.pass_count, 0) * 100.0) 
                              / NULLIF(a.Quantity_Plan, 0.0), 
                              1
                            )
                        END AS Percent,

                        strftime('%d-%m-%Y', a.Created_At, 'unixepoch', 'localtime') AS Created_At

                      FROM Summary a
                      LEFT JOIN CountingData b ON b.HistoryID = a.id
                      LEFT JOIN PlanManufacture c ON a.PlanID = c.id
                      LEFT JOIN SMTData d ON d.HistoryID = a.id

                      WHERE strftime('%Y-%m-%d', a.Created_At, 'unixepoch', '+7 hours') = (
                        SELECT target_date FROM DateFilter
                      )

                      GROUP BY a.id, a.Line_SMT

                      ORDER BY a.Created_At DESC;


                      -- ============================================
                      -- TỐI ƯU: THÊM CÁC INDEX SAU
                      -- ============================================

                      -- Index cho Summary
                      CREATE INDEX IF NOT EXISTS idx_summary_created_at ON Summary(Created_At);
                      CREATE INDEX IF NOT EXISTS idx_summary_planid ON Summary(PlanID);
                      CREATE INDEX IF NOT EXISTS idx_summary_line_smt ON Summary(Line_SMT);

                      -- Index cho ManufactureCounting
                      CREATE INDEX IF NOT EXISTS idx_counting_historyid ON ManufactureCounting(HistoryID);
                      CREATE INDEX IF NOT EXISTS idx_counting_status ON ManufactureCounting(Status);
                      CREATE INDEX IF NOT EXISTS idx_counting_timestamprw ON ManufactureCounting(TimestampRW);

                      -- Index cho ManufactureSMT
                      CREATE INDEX IF NOT EXISTS idx_smt_historyid ON ManufactureSMT(HistoryID);
                      CREATE INDEX IF NOT EXISTS idx_smt_source ON ManufactureSMT(Source);

                      -- Index cho PlanManufacture
                      CREATE INDEX IF NOT EXISTS idx_plan_id ON PlanManufacture(id);`;
        db.all(query, [endDay], (err, rows) => {
          if (err) return socket.emit("SummaryError", err);
          socket.emit("SummaryData", rows);
        });
      } catch (error) {
        socket.emit("SummaryError", error);
      }
    }),
    socket.on("getManufactureSummary", async (id) => {
      try {
        const query = `
                    SELECT 
                    a.Type,
                    a.Surface AS Surface,

                    -- PASS cho từng loại
                    CASE 
                        -- SMT: công thức đặc biệt
                        WHEN a.Type = 'SMT' THEN (
                            CASE 
                                WHEN a.Surface = '1 Mặt' THEN (
                                    -- SMT 1 mặt -> Quantity * tổng số record SMT 1 mặt
                                    COALESCE((
                                        SELECT d.Quantity
                                        FROM PlanManufacture d
                                        WHERE d.id = a.PlanID
                                    ), 0) *
                                    COALESCE((
                                        SELECT COUNT(*)
                                        FROM ManufactureSMT s 
                                        WHERE s.HistoryID IN (
                                            SELECT id FROM Summary 
                                            WHERE PlanID = a.PlanID AND Surface = '1 Mặt'
                                        )
                                        AND s.Source IN ('source_2', 'source_4')
                                    ), 0)
                                )

                                ELSE (
                                    -- SMT 2 mặt: min(TOP, BOTTOM)
                                    COALESCE((
                                        SELECT d.Quantity
                                        FROM PlanManufacture d
                                        WHERE d.id = a.PlanID
                                    ), 0) *
                                    (
                                        SELECT MIN(cnt)
                                        FROM (
                                            SELECT COUNT(*) AS cnt
                                            FROM ManufactureSMT s
                                            WHERE s.HistoryID IN (
                                                SELECT id FROM Summary 
                                                WHERE PlanID = a.PlanID AND Type='SMT' AND Surface='TOP'
                                            ) AND s.Source IN ('source_2','source_4')

                                            UNION ALL

                                            SELECT COUNT(*)
                                            FROM ManufactureSMT s
                                            WHERE s.HistoryID IN (
                                                SELECT id FROM Summary 
                                                WHERE PlanID = a.PlanID AND Type='SMT' AND Surface='BOTTOM'
                                            ) AND s.Source IN ('source_2','source_4')
                                        )
                                    )
                                )
                            END
                        )

                        -- AOI: công thức đặc biệt
                        WHEN a.Type = 'AOI' THEN (
                            CASE 
                                WHEN a.Surface = '1 Mặt' THEN (
                                    -- AOI 1 mặt
                                    COALESCE((
                                        SELECT SUM(CASE WHEN m.Status = 'pass' THEN 1 ELSE 0 END)
                                        FROM ManufactureCounting m
                                        WHERE m.HistoryID IN (
                                            SELECT id FROM Summary 
                                            WHERE PlanID = a.PlanID AND Type = 'AOI' AND Surface = '1 Mặt'
                                        )
                                    ), 0)
                                )

                                ELSE (
                                    -- AOI 2 mặt: min(TOP_PASS, BOTTOM_PASS)
                                    (
                                        SELECT MIN(pass_cnt)
                                        FROM (
                                            SELECT COALESCE(SUM(CASE WHEN m.Status='pass' THEN 1 ELSE 0 END),0) AS pass_cnt
                                            FROM ManufactureCounting m
                                            WHERE m.HistoryID IN (
                                                SELECT id FROM Summary WHERE PlanID = a.PlanID AND Type='AOI' AND Surface='TOP'
                                            )

                                            UNION ALL

                                            SELECT COALESCE(SUM(CASE WHEN m.Status='pass' THEN 1 ELSE 0 END),0)
                                            FROM ManufactureCounting m
                                            WHERE m.HistoryID IN (
                                                SELECT id FROM Summary WHERE PlanID = a.PlanID AND Type='AOI' AND Surface='BOTTOM'
                                            )
                                        )
                                    )
                                )
                            END
                        )

                        ELSE (
                            -- Các loại khác -> PASS
                            COALESCE((
                                SELECT SUM(CASE WHEN m.Status = 'pass' THEN 1 ELSE 0 END)
                                FROM ManufactureCounting m
                                WHERE m.HistoryID IN (
                                    SELECT id FROM Summary 
                                    WHERE PlanID = a.PlanID AND Type = a.Type AND Surface = a.Surface
                                )
                            ), 0)
                        )
                    END AS Quantity_Pass,

                    -- FAIL
                    COALESCE((
                        SELECT SUM(CASE WHEN m.Status = 'fail' THEN 1 ELSE 0 END)
                        FROM ManufactureCounting m 
                        WHERE m.HistoryID IN (
                            SELECT id FROM Summary 
                            WHERE PlanID = a.PlanID AND Type = a.Type AND Surface = a.Surface
                        )
                    ), 0) AS Quantity_Fail,

                    -- RW
                    COALESCE((
                        SELECT SUM(CASE WHEN m.TimestampRW IS NOT NULL AND m.TimestampRW <> '' THEN 1 ELSE 0 END)
                        FROM ManufactureCounting m 
                        WHERE m.HistoryID IN (
                            SELECT id FROM Summary 
                            WHERE PlanID = a.PlanID AND Type = a.Type AND Surface = a.Surface
                        )
                    ), 0) AS Quantity_RW,

                    -- Tổng số SummaryID
                    COUNT(DISTINCT a.id) AS Total_Summary_ID,

                    -- SMT TOP
                    CASE 
                        WHEN a.Type != 'SMT' THEN 0
                        WHEN a.Surface != 'TOP' THEN 0
                        ELSE 
                            COALESCE((
                                SELECT d.Quantity FROM PlanManufacture d WHERE d.id = a.PlanID
                            ), 0) *
                            COALESCE((
                                SELECT COUNT(*) FROM ManufactureSMT s
                                WHERE s.HistoryID IN (
                                    SELECT id FROM Summary WHERE PlanID=a.PlanID AND Type='SMT' AND Surface='TOP'
                                ) AND s.Source IN ('source_2','source_4')
                            ), 0)
                    END AS SMT_Top_Quantity,

                    -- SMT BOTTOM
                    CASE 
                        WHEN a.Type != 'SMT' THEN 0
                        WHEN a.Surface != 'BOTTOM' THEN 0
                        ELSE 
                            COALESCE((
                                SELECT d.Quantity FROM PlanManufacture d WHERE d.id = a.PlanID
                            ), 0) *
                            COALESCE((
                                SELECT COUNT(*) FROM ManufactureSMT s
                                WHERE s.HistoryID IN (
                                    SELECT id FROM Summary WHERE PlanID=a.PlanID AND Type='SMT' AND Surface='BOTTOM'
                                ) AND s.Source IN ('source_2','source_4')
                            ), 0)
                    END AS SMT_Bottom_Quantity,

                    -- AOI TOP
                    CASE 
                        WHEN a.Type!='AOI' THEN 0
                        WHEN a.Surface!='TOP' THEN 0
                        ELSE 
                            COALESCE((
                                SELECT SUM(CASE WHEN m.Status='pass' THEN 1 ELSE 0 END)
                                FROM ManufactureCounting m
                                WHERE m.HistoryID IN (
                                    SELECT id FROM Summary WHERE PlanID=a.PlanID AND Type='AOI' AND Surface='TOP'
                                )
                            ),0)
                    END AS AOI_Top_Quantity,
					
					 -- AOI TOP FAIL
					CASE 
                        WHEN a.Type!='AOI' THEN 0
                        WHEN a.Surface!='TOP' THEN 0
                        ELSE 
                            COALESCE((
                                SELECT SUM(CASE WHEN m.Status='fail' THEN 1 ELSE 0 END)
                                FROM ManufactureCounting m
                                WHERE m.HistoryID IN (
                                    SELECT id FROM Summary WHERE PlanID=a.PlanID AND Type='AOI' AND Surface='TOP'
                                )
                            ),0)
                    END AS AOI_Top_Quantity_Fail,

                    -- AOI BOTTOM
                    CASE 
                        WHEN a.Type!='AOI' THEN 0
                        WHEN a.Surface!='BOTTOM' THEN 0
                        ELSE 
                            COALESCE((
                                SELECT SUM(CASE WHEN m.Status='pass' THEN 1 ELSE 0 END)
                                FROM ManufactureCounting m
                                WHERE m.HistoryID IN (
                                    SELECT id FROM Summary WHERE PlanID=a.PlanID AND Type='AOI' AND Surface='BOTTOM'
                                )
                            ),0)
                    END AS AOI_Bottom_Quantity,
					
					-- AOI BOTTOM FAIL
                    CASE 
                        WHEN a.Type!='AOI' THEN 0
                        WHEN a.Surface!='BOTTOM' THEN 0
                        ELSE 
                            COALESCE((
                                SELECT SUM(CASE WHEN m.Status='fail' THEN 1 ELSE 0 END)
                                FROM ManufactureCounting m
                                WHERE m.HistoryID IN (
                                    SELECT id FROM Summary WHERE PlanID=a.PlanID AND Type='AOI' AND Surface='BOTTOM'
                                )
                            ),0)
                    END AS AOI_Bottom_Quantity_Fail

                FROM Summary a
                WHERE a.PlanID = ?
                GROUP BY 
                    a.Type,
                    CASE WHEN a.Surface = '1 Mặt' THEN '1 Mặt' ELSE a.Surface END
                ORDER BY a.Type, a.Surface;


                CREATE INDEX idx_summary_planid ON Summary(PlanID);
                CREATE INDEX idx_summary_planid_type_surface ON Summary(PlanID, Type, Surface);
                CREATE INDEX idx_summary_id ON Summary(id);

                -- Index cho ManufactureSMT
                CREATE INDEX idx_smt_historyid ON ManufactureSMT(HistoryID);
                CREATE INDEX idx_smt_source ON ManufactureSMT(Source);

                -- Index cho ManufactureCounting
                CREATE INDEX idx_counting_historyid ON ManufactureCounting(HistoryID);
                CREATE INDEX idx_counting_status ON ManufactureCounting(Status);

                -- Index cho PlanManufacture
                CREATE INDEX idx_plan_id ON PlanManufacture(id);`;

        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureSummaryError", err);
          socket.emit("ManufactureSummaryData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureSummaryError", error);
      }
    });

  socket.on("getCompareSummary", async (endDay) => {
    try {
      const query = `
                    WITH TodayData AS (
                      SELECT
                        COUNT(DISTINCT a.PONumber) AS Today_Total_PONumber,
                        COUNT(DISTINCT a.Category) AS Today_Total_Category
                      FROM Summary a
                      WHERE strftime('%Y-%m-%d', a.Created_At, 'unixepoch', '+7 hours') =
                            strftime('%Y-%m-%d', ?, 'unixepoch', '+7 hours')
                    ),
                    
                    YesterdayData AS (
                      SELECT
                        COUNT(DISTINCT a.PONumber) AS Yesterday_Total_PONumber,
                        COUNT(DISTINCT a.Category) AS Yesterday_Total_Category
                      FROM Summary a
                      WHERE strftime('%Y-%m-%d', a.Created_At, 'unixepoch', '+7 hours') =
                            strftime('%Y-%m-%d', ?, 'unixepoch', '+7 hours', '-1 day')
                    )
              
                    SELECT
                      T.Today_Total_PONumber,
                      Y.Yesterday_Total_PONumber,
                      ROUND(
                        (T.Today_Total_PONumber - Y.Yesterday_Total_PONumber) * 100.0
                        / NULLIF(Y.Yesterday_Total_PONumber, 0),
                      1) AS PONumber_Trend_Percent,
              
                      T.Today_Total_Category,
                      Y.Yesterday_Total_Category,
                      ROUND(
                        (T.Today_Total_Category - Y.Yesterday_Total_Category) * 100.0
                        / NULLIF(Y.Yesterday_Total_Category, 0),
                      1) AS Category_Trend_Percent
                    FROM TodayData T CROSS JOIN YesterdayData Y;
                  `;

      db.all(query, [endDay, endDay], (err, rows) => {
        if (err) return socket.emit("CompareSummaryError", err.message);
        socket.emit("CompareSummaryData", rows);
      });
    } catch (error) {
      socket.emit("CompareSummaryError", error.message);
    }
  });

  socket.on("getSummaryFail", async (id) => {
    try {
      const query = `SELECT 
                          id,
                          PartNumber,
                          Type,
                          Status,
                          Status_Fixed,
                          RWID,
                          GroupFail,
                          strftime('%d-%m-%Y %H:%M:%S', TimestampRW, 'unixepoch', 'localtime') AS TimestampRW,
                          Note,
                          Note_RW,
                          strftime('%d-%m-%Y %H:%M:%S', Timestamp, 'unixepoch', 'localtime') AS Timestamp
                        FROM ManufactureCounting
                        WHERE 
                          strftime('%Y-%m-%d', Timestamp, 'unixepoch', '+7 hours') = ?
                          AND Status = 'fail'
                        ORDER BY Timestamp DESC;`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("SummaryFail", err);
        socket.emit("SummaryFailData", rows);
      });
    } catch (error) {
      socket.emit("SummaryFailError", error);
    }
  }),
    socket.on("getManufactureFail", async (id) => {
      try {
        const query = `SELECT 
                          id,
                          PartNumber,
                          Type,
                          Status,
                          Status_Fixed,
                          RWID,
                          GroupFail,
                          strftime('%d-%m-%Y %H:%M:%S', TimestampRW, 'unixepoch', 'localtime') AS TimestampRW,
                          Note,
                          Note_RW,
                          strftime('%d-%m-%Y %H:%M:%S', Timestamp, 'unixepoch', 'localtime') AS Timestamp
                        FROM ManufactureCounting
                        WHERE 
                          PlanID = ?
                          AND Status = 'fail'
                        ORDER BY Timestamp DESC;`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureFail", err);
          socket.emit("ManufactureFailData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureFailError", error);
      }
    }),
    socket.on("getHistory", async (id) => {
      try {
        const query = `WITH CountingData AS (
                        SELECT 
                          HistoryID,
                          SUM(CASE WHEN Status = 'pass' THEN 1 ELSE 0 END) AS pass_count,
                          SUM(CASE WHEN Status = 'fail' THEN 1 ELSE 0 END) AS fail_count,
                          SUM(CASE WHEN RWID = 'Done' THEN 1 ELSE 0 END) AS fixed_done_count,
                          SUM(CASE WHEN TimestampRW IS NOT NULL AND TimestampRW <> '' THEN 1 ELSE 0 END) AS rw_count
                        FROM ManufactureCounting
                        GROUP BY HistoryID
                      ),

                      SMTData AS (
                        -- Pre-aggregate SMT data theo HistoryID
                        SELECT 
                          HistoryID,
                          SUM(CASE WHEN Source = 'source_2' THEN 1 ELSE 0 END) AS source_2_count,
                          SUM(CASE WHEN Source = 'source_4' THEN 1 ELSE 0 END) AS source_4_count
                        FROM ManufactureSMT
                        GROUP BY HistoryID
                      )

                      SELECT 
                        a.id,
                        a.Type,
                        a.Category,
                        a.Quantity_Plan,
                        a.PlanID,
                        c.Name_Order,
                        c.DelaySMT,
                        a.PONumber,
                        a.Line_SMT,
                        a.Time_Plan,
                        a.CycleTime_Plan,
                        a.Action,
                        c.Quantity,
                        a.Surface,
                        a.Note,

                        -- Quantity_Real (tính dựa trên Line_SMT)
                        CASE 
                          WHEN a.Line_SMT = 'Line 1' THEN c.Quantity * COALESCE(d.source_2_count, 0)
                          WHEN a.Line_SMT = 'Line 2' THEN c.Quantity * COALESCE(d.source_4_count, 0)
                          ELSE COALESCE(b.pass_count, 0)
                        END AS Quantity_Real,

                        -- Quantity_Error
                        COALESCE(b.fail_count, 0) AS Quantity_Error,

                        -- Quantity_Fixed_Done
                        COALESCE(b.fixed_done_count, 0) AS Quantity_Fixed_Done,

                        -- Percent (dựa trên Line_SMT)
                        CASE
                          WHEN a.Line_SMT = 'Line 1' THEN 
                            ROUND(
                              (c.Quantity * COALESCE(d.source_2_count, 0) * 100.0) / NULLIF(a.Quantity_Plan, 0.0), 
                              1
                            )
                          WHEN a.Line_SMT = 'Line 2' THEN  
                            ROUND(
                              (c.Quantity * COALESCE(d.source_4_count, 0) * 100.0) / NULLIF(a.Quantity_Plan, 0.0), 
                              1
                            )
                          ELSE 
                            ROUND(
                              (COALESCE(b.pass_count, 0) + COALESCE(b.fail_count, 0)) * 100.0 / NULLIF(a.Quantity_Plan, 0.0), 
                              1
                            )
                        END AS Percent,

                        -- TimestampRW
                        COALESCE(b.rw_count, 0) AS TimestampRW,

                        strftime('%d-%m-%Y', a.Created_At, 'unixepoch', 'localtime') AS Created_At,
                        strftime('%Y-%m-%d', a.Created_At, 'unixepoch', 'localtime') AS Created_At_unixepoch

                      FROM Summary a
                      LEFT JOIN CountingData b ON b.HistoryID = a.id
                      LEFT JOIN PlanManufacture c ON a.PlanID = c.id
                      LEFT JOIN SMTData d ON d.HistoryID = a.id

                      WHERE a.PlanID = ?

                      GROUP BY 
                        a.id,
                        a.Type,
                        a.Category,
                        a.Quantity_Plan,
                        a.PlanID,
                        a.PONumber,
                        a.Line_SMT,
                        a.Time_Plan,
                        a.CycleTime_Plan,
                        a.Created_At

                      ORDER BY a.Created_At DESC;


                      -- ============================================
                      -- TỐI ƯU: THÊM CÁC INDEX SAU
                      -- ============================================

                      -- Index cho Summary
                      CREATE INDEX IF NOT EXISTS idx_summary_planid ON Summary(PlanID);
                      CREATE INDEX IF NOT EXISTS idx_summary_id ON Summary(id);
                      CREATE INDEX IF NOT EXISTS idx_summary_line_smt ON Summary(Line_SMT);

                      -- Index cho ManufactureCounting
                      CREATE INDEX IF NOT EXISTS idx_counting_historyid ON ManufactureCounting(HistoryID);
                      CREATE INDEX IF NOT EXISTS idx_counting_status ON ManufactureCounting(Status);
                      CREATE INDEX IF NOT EXISTS idx_counting_rwid ON ManufactureCounting(RWID);
                      CREATE INDEX IF NOT EXISTS idx_counting_timestamprw ON ManufactureCounting(TimestampRW);

                      -- Index cho ManufactureSMT
                      CREATE INDEX IF NOT EXISTS idx_smt_historyid ON ManufactureSMT(HistoryID);
                      CREATE INDEX IF NOT EXISTS idx_smt_source ON ManufactureSMT(Source);

                      -- Index cho PlanManufacture
                      CREATE INDEX IF NOT EXISTS idx_plan_id ON PlanManufacture(id);
                      `;
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
                      SELECT 
                          a.id,
                          a.PlanID,
                          CASE 
                            WHEN a.PartNumber = 1 THEN b.Category
                            ELSE a.PartNumber
                          END AS PartNumber,
                          a.HistoryID,						  
                          CASE 
                              WHEN a.Source = 'source_1' THEN 'Máy printer G5'
                              WHEN a.Source = 'source_2' THEN 'Máy gắp linh kiện Juki'
                              WHEN a.Source = 'source_3' THEN 'Máy gắp linh kiện Topaz'
                              ELSE 'Máy gắp linh kiện Yamaha'
                          END AS Source,
                          CASE 
                              WHEN a.Status = 'ok' THEN 'pass'
                              ELSE 'fail'
                          END AS Status,
                          strftime('%d-%m-%Y %H:%M:%S', a.Timestamp, 'unixepoch', 'localtime') AS Timestamp,
                          a.Note AS Note,
                          a.RWID,
                          a.TimestampRW
                      FROM ManufactureSMT a
                      LEFT JOIN Summary b ON a.HistoryID = b.id
                      WHERE a.PlanID = ?

                      UNION ALL

                      SELECT 
                          c.id,
                          c.PlanID,
                          c.PartNumber,
						              c.HistoryID,
                          c.Type AS Source,
                          c.Status,
                          strftime('%d-%m-%Y %H:%M:%S', c.Timestamp, 'unixepoch', 'localtime') AS Timestamp,
                          c.Note AS Note,
                          c.RWID,
                          strftime('%d-%m-%Y %H:%M:%S', c.TimestampRW, 'unixepoch', 'localtime') AS TimestampRW
                      FROM ManufactureCounting c
                      WHERE c.PlanID = ?
                  )
                  ORDER BY Timestamp DESC;`;
        db.all(query, [id, id], (err, rows) => {
          if (err) return socket.emit("HistoryPartError", err);
          socket.emit("HistoryPartData", rows);
        });
      } catch (error) {
        socket.emit("HistoryPartError", error);
      }
    }),
    socket.on("getFilterBom", async (id) => {
      try {
        const query = `SELECT 
					            *,				
                      strftime('%d-%m-%Y', created_at, 'unixepoch', 'localtime') AS Created_at_unixepoch,
                      strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS Created_at
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
    socket.on("getOrderTracking", async (id) => {
      try {
        const query = `SELECT 
                          a.ProductDetail AS customer,
                          a.QuantityProduct AS totalAmount,
                          a.QuantityDelivered AS totalDelivered,
                          b.DateCreated AS createdDate,
                          b.DateDelivery AS deliveryDate,
                          b.PONumber AS orderId,
                          CASE
                            WHEN a.QuantityDelivered IS NULL OR a.QuantityDelivered = '' THEN 'Đang xử lý'
                            WHEN a.QuantityDelivered = a.QuantityProduct THEN 'Hoàn thành'
                            WHEN b.DateDelivery IS NOT NULL 
                              AND b.DateDelivery <> '' 
                              AND DATETIME('now') > b.DateDelivery 
                              AND a.QuantityDelivered < a.QuantityProduct THEN 'Trễ hạn'
                            WHEN b.DateDelivery IS NULL 
                              OR b.DateDelivery = '' 
                              OR (DATETIME('now') <= b.DateDelivery AND a.QuantityDelivered < a.QuantityProduct) THEN 'Đang sản xuất'
                          END AS status,
                          IFNULL((a.QuantityDelivered * 100) / a.QuantityProduct , 0) AS progress
                        FROM ProductDetails a
                        LEFT JOIN PurchaseOrders b ON a.POID = b.id
                        WHERE a.CustomerID = ?`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("OrderTrackingError", err);
          socket.emit("OrderTrackingData", rows);
        });
      } catch (error) {
        socket.emit("OrderTrackingError", error);
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
    POID,
  } = req.body;
  const { id } = req.params;

  // Validate input
  if (!id) {
    return res.status(400).json({ error: "ID không hợp lệ" });
  }

  const query = `
    UPDATE ProductDetails 
    SET ProductDetail = ?, QuantityProduct = ?, QuantityDelivered = ?, QuantityAmount = ?, Note = ?, POID = ? 
    WHERE id = ?
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
      id,
    ],
    function (err) {
      if (err) {
        console.error("Error:", err.message);
        return res.status(500).json({
          error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu",
        });
      }
      io.emit("updateDetailProjectPO");
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
      res.json({ message: "Item inserted successfully", id: this.lastID });
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
    io.emit("updateDetailProjectPO", id);
    // Broadcast the new message to all clients
    res.json({ message: "Đã cập nhật dữ liệu thành công" });
  });
});

// 2. THÊM LỊCH GIAO HÀNG MỚI
app.post("/api/Project/Customer/Add-Schedule-Delivery", async (req, res) => {
  const { ItemId, DeliveryDate, DeliveryQuantity } = req.body;

  // Validate input
  if (!ItemId || !DeliveryDate || !DeliveryQuantity) {
    return res.status(400).json({
      message: "Vui lòng điền đầy đủ thông tin",
    });
  }

  const query = `
    INSERT INTO ScheduleDelivery (ItemId, DeliveryDate, DeliveryQuantity, DeliveryStatus)
    VALUES (?, ?, ?, ?)
  `;

  db.run(
    query,
    [ItemId, DeliveryDate, DeliveryQuantity, "Chưa giao"],
    function (err) {
      if (err) {
        console.error("Error:", err.message);
        return res.status(500).json({
          message: "Lỗi thêm lịch giao hàng",
        });
      }
      io.emit("updateDetailProjectPO");
      res.json({
        message: "Lịch giao hàng thêm thành công",
        id: this.lastID,
      });
    }
  );
});

// 3. CẬP NHẬT LỊCH GIAO HÀNG CÓ SẴN
app.put(
  "/api/Project/Customer/Edit-Schedule-Delivery/:id",
  async (req, res) => {
    const { DeliveryDate, DeliveryQuantity } = req.body;
    const { id } = req.params;

    // Validate input
    if (!id || !DeliveryDate || !DeliveryQuantity) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    const query = `
    UPDATE ScheduleDelivery
    SET DeliveryDate = ?, DeliveryQuantity = ?
    WHERE id = ?
  `;

    db.run(query, [DeliveryDate, DeliveryQuantity, id], function (err) {
      if (err) {
        console.error("Error:", err.message);
        return res.status(500).json({
          message: "Lỗi cập nhật lịch giao hàng",
        });
      }
      io.emit("updateDetailProjectPO");
      res.json({
        message: "Cập nhật lịch giao hàng thành công",
      });
    });
  }
);

// 4. XÓA LỊCH GIAO HÀNG (THÊM CHO ĐẦY ĐỦ)
app.delete(
  "/api/Project/Customer/Delete-Schedule-Delivery/:id",
  async (req, res) => {
    const { id } = req.params;

    // Validate input
    if (!id) {
      return res.status(400).json({
        message: "ID không hợp lệ",
      });
    }

    const query = `
    DELETE FROM ScheduleDelivery
    WHERE id = ?
  `;

    db.run(query, [id], function (err) {
      if (err) {
        console.error("Error:", err.message);
        return res.status(500).json({
          message: "Lỗi xóa lịch giao hàng",
        });
      }
      io.emit("updateDetailProjectPO");
      res.json({
        message: "Xóa lịch giao hàng thành công",
      });
    });
  }
);

app.put("/api/Project/Customer/Confirm-Item/:id", async (req, res) => {
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    UPDATE ScheduleDelivery
    SET DeliveryStatus = 'Đã giao'
    WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      console.error("Error:", err.message);
      return res.status(500).json({
        message: "Lỗi xác nhận giao hàng",
      });
    }
    io.emit("updateDetailProjectPO");
    res.json({
      message: "Xác nhận giao hàng thành công",
    });
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
  const { CustomerName, Note } = req.body;
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    UPDATE Customers
    SET CustomerName = ?, Note = ?
    WHERE id = ?`;
  db.run(query, [CustomerName, Note, id], function (err) {
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
  const { CustomerName, Note } = req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO Customers (CustomerName, Note)
    VALUES (?, ?)
  `;
  db.run(query, [CustomerName, Note], function (err) {
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
app.post(
  "/api/Machine/Add",
  uploadMachine.single("image"),
  (req, res) => {
    const {
      TenThietBi,
      LoaiThietBi,
      NhaSanXuat,
      NgayMua,
      ViTri,
      MoTa,
    } = req.body;

    const imagePath = req.file
      ? `/uploads/machine/${req.file.filename}`
      : null;

    const query = `
      INSERT INTO Machine 
      (TenThietBi, LoaiThietBi, NhaSanXuat, NgayMua, ViTri, MoTa, Image, Condition)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Tốt')
    `;

    db.run(
      query,
      [
        TenThietBi,
        LoaiThietBi,
        NhaSanXuat,
        NgayMua,
        ViTri,
        MoTa,
        imagePath,
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Lỗi DB" });
        }
        io.emit("MachineUpdate");
        res.json({ message: "Thêm thiết bị thành công" });
      }
    );
  }
);

// Router update item in Machine table
app.put(
  "/api/Machine/Edit/:id",
  uploadMachine.single("image"),
  async (req, res) => {
    const { id } = req.params;

    const {
      TenThietBi,
      LoaiThietBi,
      NhaSanXuat,
      NgayMua,
      ViTri,
      MoTa,
      TinhTrang,
    } = req.body;

    try {
      // ===== lấy ảnh cũ =====
      db.get(
        "SELECT Image FROM Machine WHERE MaThietBi = ?",
        [id],
        (err, row) => {
          if (err) return res.status(500).json({ error: "Lỗi DB" });

          let imagePath = row?.Image || null;

          // ===== nếu upload ảnh mới =====
          if (req.file) {
            imagePath = `/uploads/machine/${req.file.filename}`;

            // 🔥 xoá ảnh cũ (nếu có)
            if (row?.Image) {
              const oldPath = path.join(
                __dirname,
                row.Image.replace("/uploads/", "uploads/")
              );

              fs.existsSync(oldPath) && fs.unlinkSync(oldPath);
            }
          }

          // ===== update DB =====
          const query = `
            UPDATE Machine 
            SET 
              TenThietBi = ?,
              LoaiThietBi = ?,
              NhaSanXuat = ?,
              NgayMua = ?,
              ViTri = ?,
              MoTa = ?,
              Image = ?,
              Condition = ?
            WHERE MaThietBi = ?
          `;

          db.run(
            query,
            [
              TenThietBi,
              LoaiThietBi,
              NhaSanXuat,
              NgayMua,
              ViTri,
              MoTa,
              imagePath,
              TinhTrang,
              id,
            ],
            function (err) {
              if (err) {
                return res
                  .status(500)
                  .json({ error: "Lỗi khi cập nhật dữ liệu" });
              }

              io.emit("MachineUpdate");
              res.json({ message: "Cập nhật thiết bị thành công" });
            }
          );
        }
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);


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
    let Timestamps = null;
    if (NgayBaoTri) {
      const dateObj = new Date(NgayBaoTri);
      if (!isNaN(dateObj.getTime())) {
        Timestamps = Math.floor(dateObj.getTime() / 1000);
      } else {
        return res
          .status(400)
          .json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
      }
    } else {
      Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
    }
    let Timestamps2 = null;
    if (NgayHoanThanh) {
      const dateObj = new Date(NgayHoanThanh);
      if (!isNaN(dateObj.getTime())) {
        Timestamps2 = Math.floor(dateObj.getTime() / 1000);
      } else {
        return res
          .status(400)
          .json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
      }
    } else {
      Timestamps2 = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
    }
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
        Timestamps,
        LoaiBaoTri,
        MoTaLoi,
        BienPhapKhacPhuc,
        NguoiTao,
        NguoiThucHien,
        ChiPhi,
        Timestamps2,
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
        io.emit("SparePartUsageUpdate");
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
  let Timestamps = null;
  if (NgayBaoTri) {
    const dateObj = new Date(NgayBaoTri); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
  let Timestamps2 = null;
  if (NgayHoanThanh) {
    const dateObj = new Date(NgayHoanThanh); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps2 = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps2 = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }

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
      Timestamps,
      LoaiBaoTri,
      MoTaLoi,
      BienPhapKhacPhuc,
      NguoiTao,
      NguoiThucHien,
      ChiPhi,
      Timestamps2,
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
      io.emit("SparePartUsageUpdate");
      res.json({ message: "Đã cập nhật dữ liệu thành công" });
    }
  );
});

// Router delete item in Maintenance table
app.delete("/api/Maintenance/Delete/:id", async (req, res) => {
  const { id } = req.params;
  
  const deletePartsQuery = `DELETE FROM SparePartUsage WHERE MaBaoTri = ?`;
  const deleteMaintenanceQuery = `DELETE FROM Maintenance WHERE MaBaoTri = ?`;

  db.run(deletePartsQuery, [id], (err) => {
    if (err) {
      console.error("Error deleting spare parts:", err);
      return res.status(500).json({ error: "Lỗi khi xoá dữ liệu phụ tùng" });
    }
    
    db.run(deleteMaintenanceQuery, [id], function (err) {
      if (err) {
        console.error("Error deleting maintenance record:", err);
        return res.status(500).json({ error: "Lỗi khi xoá dữ liệu bảo trì" });
      }
      io.emit("MaintenanceUpdate");
      res.json({ message: "Đã xoá dữ liệu thành công" });
    });
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
  let Timestamps = null;
  if (NgayBatDau) {
    const dateObj = new Date(NgayBatDau); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
  let Timestamps2 = null;
  if (NgayBaoTriTiepTheo) {
    const dateObj = new Date(NgayBaoTriTiepTheo); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps2 = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps2 = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
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
      Timestamps,
      Timestamps2,
      GhiChu,
    ],
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu" });
      }
      io.emit("MaintenanceScheduleUpdate");
      io.emit("MachineUpdate");
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
  let Timestamps = null;
  if (NgayBatDau) {
    const dateObj = new Date(NgayBatDau); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
  let Timestamps2 = null;
  if (NgayBaoTriTiepTheo) {
    const dateObj = new Date(NgayBaoTriTiepTheo); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps2 = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps2 = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
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
      Timestamps,
      Timestamps2,
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
      io.emit("MachineUpdate");
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
    io.emit("MachineUpdate");
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
      io.emit("MaintenanceUpdate");
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
      io.emit("MaintenanceUpdate");
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
    io.emit("MaintenanceUpdate");
    res.json({ message: "Đã xoá dữ liệu sử dụng phụ tùng thành công" });
  });
});

// Router add new item in PlanManufacture table
app.post("/api/PlanManufacture/Add", async (req, res) => {
  const {
    Name,
    Name_Order,
    Creater,
    Note,
    Total,
    DelaySMT = 10000, // default value if undefined
    Level,
    Quantity,
    ProjectID,
    Timestamp,
  } = req.body;
  const LevelCleaned = Array.isArray(Level) ? Level.join("-") : String(Level); // fallback nếu không phải mảng

  // 🔥 Convert YYYY-MM-DD → Unix timestamp (seconds)
  let Timestamps = null;
  if (Timestamp) {
    const dateObj = new Date(Timestamp); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }

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
      Name_Order
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      Name,
      Timestamps,
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
    Name_Order,
    Timestamp,
    Creater,
    Note,
    Total,
    DelaySMT,
    Level,
    Quantity,
  } = req.body;
  const LevelString = JSON.stringify(Level);
  const LevelCleaned = LevelString.replace(/[\[\]"]/g, "").replace(/,/g, "-");

  let Timestamps = null;
  if (Timestamp) {
    const dateObj = new Date(Timestamp); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
  // Insert data into SQLite database
  const query = `
      UPDATE PlanManufacture 
      SET Name = ?, 
          Name_Order = ?, 
          Date = ?, 
          Creater = ?, 
          Note = ?, 
          Total = ?, 
          DelaySMT = ?, 
          Level = ?, 
          Quantity = ?
      WHERE id = ?
    `;
  db.run(
    query,
    [
      Name,
      Name_Order,
      Timestamps,
      Creater,
      Note,
      Total,
      DelaySMT,
      LevelCleaned,
      Quantity,
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
  const { DelaySMT, Quantity, PlanID, Type } = req.body;
  // Insert data into SQLite database
  const query = `
      UPDATE PlanManufacture 
      SET DelaySMT = ?, 
          Quantity = ? 
      WHERE id = ?
    `;
  db.run(query, [DelaySMT, Quantity, id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("updateManufactureDetails", id);
    io.emit("UpdateHistory");
    io.emit("UpdateSummary");
    io.emit("UpdateManufactureSummary", { PlanID, Type });
    io.emit("UpdateHistoryFiltered", { PlanID, Type });
    res.json({ message: "Đã cập nhật dữ liệu dự án sản xuất thành công" });
  });
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

// app.post("/api/esp-config", async (req, res) => {
//   const { project_id, delay, plan_id } = req.body;
//   try {
//     const response = await axios.post(
//       `${ESP32_IP_LINE1}/set-project-delay`,
//       {
//         project_id,
//         delay,
//         plan_id,
//       },
//       {
//         headers: { "Content-Type": "application/json" },
//       }
//     );

//     res.json({
//       status: "project_id sent to esp32",
//       esp32Response: response.data,
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: "Failed to send project_id to esp32",
//       detail: error.message,
//     });
//   }
// });

// app.post("/api/esp-config-line2", async (req, res) => {
//   const { project_id, delay, plan_id } = req.body;
//   try {
//     const response = await axios.post(
//       `${ESP32_IP_LINE2}/set-project-delay`,
//       {
//         project_id,
//         delay,
//         plan_id,
//       },
//       {
//         headers: { "Content-Type": "application/json" },
//       }
//     );

//     res.json({
//       status: "project_id sent to esp32",
//       esp32Response: response.data,
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: "Failed to send project_id to esp32",
//       detail: error.message,
//     });
//   }
// });

// app.post("/api/send-config-to-device", async (req, res) => {
//   const { project_id, plan_id, delay = 0, line = 1 } = req.body || {};

//   // if (!project_id || !plan_id) {
//   //   return res.status(400).json({ error: "project_id và plan_id là bắt buộc" });
//   // }

//   try {
//     const response = await axios.post(
//       `${GATEWAY_URL}/api/send-config`,
//       { project_id, plan_id, delay, line },
//       { headers: { "Content-Type": "application/json" } }
//     );

//     console.log("✅ Config sent to Gateway:", response.data);

//     res.json({
//       status: "Sent to Gateway",
//       gatewayResponse: response.data,
//     });
//   } catch (error) {
//     console.error("❌ Failed to send to Gateway:", error.message);

//     res.status(502).json({
//       error: "Gateway unreachable",
//       detail: error.response?.data || error.message,
//     });
//   }
// });

// ========== ADD CONFIG ==========
app.post("/api/add-config", (req, res) => {
  const { project_id, plan_id, delay = 0, line = 1 } = req.body || {};

  db.run(
    `INSERT INTO configs (project_id, plan_id, delay, line)
     VALUES (?, ?, ?, ?)`,
    [project_id, plan_id, delay, line],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: "ok", id: this.lastID });
    }
  );
});

// ========== GATEWAY POLLING ==========
app.get("/api/get-config", (req, res) => {
  const line = parseInt(req.query.line || "1", 10);

  db.get(
    `SELECT * FROM configs
     WHERE line = ?
     ORDER BY id DESC LIMIT 1`,
    [line],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.json({}); // Không có config mới
      res.json(row);
    }
  );
});

// ========== CONFIRM SENT ==========
app.post("/api/config-confirm", (req, res) => {
  const { project_id, plan_id, line } = req.body || {};
  if (!project_id || !plan_id || !line)
    return res
      .status(400)
      .json({ error: "project_id, plan_id và line là bắt buộc" });

  db.run(
    `UPDATE configs SET status='sent', sent_at=CURRENT_TIMESTAMP
     WHERE project_id=? AND plan_id=? AND line=? AND status='pending'`,
    [project_id, plan_id, line],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: "ok", updated: this.changes });
    }
  );
});

app.post("/api/sensor", (req, res) => {
  const { project_id, input_value, source, plan_id } = req.body;
  const Timestamp = Math.floor(Date.now() / 1000);
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

app.post("/api/ManufactureCounting", (req, res) => {
  let {
    PartNumber,
    HistoryID,
    Status,
    GroupFail,
    Note,
    PlanID,
    Type,
    Quantity,
  } = req.body;

  Quantity = Number(Quantity) || 1;
  const Timestamp = Math.floor(Date.now() / 1000);

  db.serialize(() => {
    // BẮT BUỘC: transaction
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare(
      `INSERT INTO ManufactureCounting 
        (PartNumber, HistoryID, Timestamp, Status, GroupFail, Note, PlanID, Type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < Quantity; i++) {
      const finalPartNumber =
        !PartNumber || String(PartNumber).trim() === ""
          ? nanoid(10)
          : PartNumber;

      stmt.run([
        finalPartNumber,
        HistoryID,
        Timestamp,
        Status,
        GroupFail,
        Note,
        PlanID,
        Type,
      ]);
    }

    stmt.finalize();

    // COMMIT là lúc transaction hoàn tất
    db.run("COMMIT", (err) => {
      if (err) {
        console.error("COMMIT ERROR:", err);
        return res.status(500).json({ error: "Database commit error" });
      }

      // Emit realtime 1 lần duy nhất
      io.emit("UpdateManufactureCounting");
      io.emit("UpdateManufactureFail");
      io.emit("UpdateHistoryFiltered", { PlanID, Type });
      io.emit("UpdateManufactureSummary", { PlanID, Type });
      io.emit("UpdateManufactureRW", { PlanID, Type });
      io.emit("UpdateSummaryFail");
      io.emit("updateManufactureDetails", PlanID);
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      io.emit("updateDetailProjectPO");

      return res.json({
        message: `Đã nhập ${Quantity} sản phẩm`,
        Quantity,
      });
    });
  });
});

// Update value status fixed in ManufactureCounting table
app.put("/api/ManufactureCounting/Edit-status-fixed/:id", (req, res) => {
  const { id } = req.params;
  const { PlanID, Type } = req.body;
  db.run(
    `UPDATE ManufactureCounting
      SET Status='pass', Status_Fixed = 'fixed'
      WHERE id=?`,
    [id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureCounting");
      io.emit("UpdateHistoryFiltered", { PlanID, Type });
      io.emit("UpdateManufactureSummary", { PlanID, Type });
      io.emit("UpdateManufactureRW", { PlanID, Type });
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      io.emit("updateDetailProjectPO");
      res.json({ message: "Summary received" });
    }
  );
});

app.delete("/api/ManufactureCounting/Delete-item-history/:id", (req, res) => {
  const { id } = req.params;
  const { PlanID, Type } = req.query;
  const query = `
    DELETE FROM ManufactureCounting
    WHERE id = ?
  `;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateManufactureCounting");
    io.emit("UpdateHistoryFiltered", { PlanID, Type });
    io.emit("UpdateManufactureSummary", { PlanID, Type });
    io.emit("updateManufactureDetails");
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    io.emit("ActivedUpdate");
    io.emit("updateDetailProjectPO");
    res.json({ message: "Đã xoá dữ liệu sản xuất thành công" });
  });
});

// Update value status fixed in ManufactureCounting table
app.put("/api/ManufactureCounting/Edit-status-rw/:id", (req, res) => {
  const { id } = req.params;
  const { Note_RW } = req.body;
  const Timestamp = Math.floor(Date.now() / 1000);
  db.run(
    `UPDATE ManufactureCounting
      SET RWID = 'Done', 
      TimestampRW = ?,
      Note_RW = ?
    WHERE id=?`,
    [Timestamp, Note_RW, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureCounting");
      io.emit("UpdateManufactureRW");
      io.emit("updateManufactureDetails");
      io.emit("UpdateSummary");
      io.emit("UpdateHistory");
      res.json({ message: "Summary received" });
    }
  );
});

// Delete item history in ManufactureSMT
app.delete("/api/ManufactureSMT/Delete-item-history/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    DELETE FROM ManufactureSMT
    WHERE id = ?
  `;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("UpdateManufactureSMT");
    io.emit("updateManufactureDetails");
    io.emit("updateHistoryPart");
    io.emit("ActivedUpdate");
    res.json({ message: "Đã xoá dữ liệu sản xuất thành công" });
  });
});

app.post("/api/ManufactureSMT", (req, res) => {
  let { HistoryID, PlanID, Quantity, Source, Type } = req.body;
  Quantity = Number(Quantity) || 1;

  const Timestamp = Math.floor(Date.now() / 1000);

  let sourcesToInsert = [Source];
  if (Source === "source_2") sourcesToInsert.push("source_1");
  if (Source === "source_4") sourcesToInsert.push("source_3");

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare(
      `INSERT INTO ManufactureSMT
         (PartNumber, HistoryID, Timestamp, Status, PlanID, Source)
       VALUES (?, ?, ?, 'ok', ?, ?)`
    );

    for (const src of sourcesToInsert) {
      for (let i = 0; i < Quantity; i++) {
        stmt.run([1, HistoryID, Timestamp, PlanID, src]);
      }
    }

    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) return res.status(500).json({ error: "Database commit error" });

      // Gửi event realtime 1 lần duy nhất
      io.emit("UpdateManufactureSMT", HistoryID);
      io.emit("UpdateHistoryFiltered", { PlanID, Type });
      io.emit("UpdateManufactureSummary");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("updateDetailProjectPO");

      res.json({
        message: "OK",
        totalInserted: Quantity * sourcesToInsert.length,
      });
    });
  });
});

// Update value active stopped in table Summary line 1
app.put("/api/Summary/Edit-item-action-stopped-line1", (req, res) => {
  db.run(
    `UPDATE Summary
      SET Action='stopped'
    WHERE Line_SMT = 'Line 1'
    `,
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateSummary");
      io.emit("UpdateHistory");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value active stopped in table Summary line 2
app.put("/api/Summary/Edit-item-action-stopped-line2", (req, res) => {
  db.run(
    `UPDATE Summary
      SET Action='stopped'
    WHERE Line_SMT = 'Line 2'
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

// Post value in table Summary
app.post("/api/Summary/Add-item", (req, res) => {
  const {
    Type,
    PlanID,
    PONumber,
    Category,
    Line_SMT,
    Quantity_Plan,
    CycleTime_Plan,
    Time_Plan,
    Note,
    Timestamp,
    Surface,
  } = req.body;
  let Timestamps = null;
  if (Timestamp) {
    const dateObj = new Date(Timestamp); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
  db.run(
    `INSERT INTO Summary (Type, PlanID, PONumber, Category, Line_SMT, Quantity_Plan, CycleTime_Plan, Time_Plan, Note, Created_At, Surface)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      Type,
      PlanID,
      PONumber,
      Category,
      Line_SMT,
      Quantity_Plan,
      CycleTime_Plan,
      Time_Plan,
      Note,
      Timestamps,
      Surface,
    ],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("UpdateHistoryFiltered", { PlanID, Type });
      io.emit("UpdateManufactureSummary", { PlanID, Type });
      io.emit("UpdateManufactureRW", { PlanID, Type });
      io.emit("UpdateManufactureCounting");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      io.emit("updateDetailProjectPO");
      res.json({ message: "Summary received" });
    }
  );
});

// Update value in table Summary
app.put("/api/Summary/Edit-item/:id", (req, res) => {
  const {
    Type,
    PlanID,
    PONumber,
    Category,
    Line_SMT,
    Quantity_Plan,
    CycleTime_Plan,
    Time_Plan,
    Note,
    Timestamp,
    Surface,
  } = req.body;
  let Timestamps = null;
  if (Timestamp) {
    const dateObj = new Date(Timestamp); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
  const { id } = req.params;
  db.run(
    `UPDATE Summary
      SET Type=?, PONumber=?, Category=?, Line_SMT=?, Quantity_Plan=?, CycleTime_Plan=?, Time_Plan=?, Note=?, Created_At=?, Surface=?
      WHERE id=?`,
    [
      Type,
      PONumber,
      Category,
      Line_SMT,
      Quantity_Plan,
      CycleTime_Plan,
      Time_Plan,
      Note,
      Timestamps,
      Surface,
      id,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      io.emit("UpdateManufactureCounting");
      io.emit("updateManufactureDetails");
      io.emit("UpdateHistory");
      io.emit("updateHistoryPart");
      io.emit("UpdateSummary");
      io.emit("ActivedUpdate");
      io.emit("updateDetailProjectPO");
      io.emit("UpdateHistoryFiltered", { PlanID, Type });
      io.emit("UpdateManufactureSummary", { PlanID, Type });
      io.emit("UpdateManufactureRW", { PlanID, Type });

      res.json({ message: "Summary received" });
    }
  );
});

// Router delete item in Summary table
app.delete("/api/Summary/Delete-item/:id", async (req, res) => {
  const { id } = req.params;
  const { Type, PlanID } = req.query;

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
    io.emit("UpdateManufactureCounting");
    io.emit("updateManufactureDetails");
    io.emit("UpdateHistory");
    io.emit("updateHistoryPart");
    io.emit("UpdateSummary");
    io.emit("ActivedUpdate");
    io.emit("updateDetailProjectPO");
    io.emit("UpdateManufactureSummary", { PlanID, Type });
    io.emit("UpdateHistoryFiltered", { PlanID, Type });
    io.emit("UpdateManufactureRW", { PlanID, Type });
    res.json({ message: "Đã xoá dữ liệu bảo trì định kỳ thành công" });
  });
});

// Bom , Pick&Place table

// Post value in table Summary
app.post("/api/FilterBom/Add-item", (req, res) => {
  const { project_name, created_at, note } = req.body;
  let Timestamps = null;
  if (created_at) {
    const dateObj = new Date(created_at); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
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
    [project_name, Timestamps, note],
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
  let Timestamps = null;
  if (created_at) {
    const dateObj = new Date(created_at); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
  db.run(
    `UPDATE FilterBom 
    SET 
      project_name = ?, 
      created_at = ?, 
      note = ?
    WHERE id = ?`,
    [project_name, Timestamps, note, id],
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
      io.emit("CombineBomUpdate");
      fs.unlinkSync(filePath);

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

      // --- 1️⃣ Đọc file Excel
      const workbook = xlsx.readFile(ppFile.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const ppData = xlsx.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
        blankrows: false,
      });

      // --- 2️⃣ Chuyển đổi và lọc dữ liệu
      const uniqueRows = [];
      const seenRefs = new Set();
      for (const row of ppData) {
        const designator = (row.Ref || row.Designator)?.trim();
        if (!designator || seenRefs.has(designator)) continue;
        seenRefs.add(designator);

        uniqueRows.push({
          designator,
          layer: row.Side || row.Layer || "",
          posX: parseFloat(row.PosX || 0),
          posY: parseFloat(row.PosY || 0),
          rotation: parseFloat(row.Rotation || 0),
          project_id: id,
        });
      }

      // --- 3️⃣ Chèn dữ liệu vào SQLite và CHỜ hoàn tất
      await new Promise((resolve, reject) => {
        db.serialize(() => {
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

          stmt.finalize((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });

      // --- 4️⃣ Xóa file tạm
      fs.unlinkSync(ppFile.path);

      // --- 5️⃣ Emit chỉ sau khi DB insert hoàn tất
      io.emit("CombineBomUpdate", { project_id: id });

      // --- 6️⃣ Gửi phản hồi
      res.json({
        message: "Pick&Place đã upload & lưu thành công (Excel, mils → mm)",
        inserted: uniqueRows.length,
      });
    } catch (error) {
      console.error("Lỗi xử lý Pick&Place:", error);
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
          io.emit("CombineBomUpdate", { project_id: projectId });
          io.emit("GerberFileUpdate", { project_id: projectId });
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
    updates.forEach((item) => {
      stmt.run(item.x, item.y, item.id, item.project_id);
    });

    stmt.finalize((err) => {
      if (err) {
        console.error("Update error:", err);
        return res.status(500).json({ error: "Lỗi khi update" });
      }
      res.json({
        message: "Update Pickplace thành công",
        count: updates.length,
      });
    });
  });
});

// Put value in table SettingSVG table
app.put("/api/SettingSVG/Edit-item-top/:id", (req, res) => {
  const { id } = req.params;
  const {
    cx,
    cy,
    rotation,
    rotationSVG,
    manualOffsetX,
    manualOffsetY,
    flipX,
    flipY,
    swapXY,
    labelAngle,
    componentBodyAngle,
    panelFrameX,
    panelFrameY,
  } = req.body;
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
    [
      flipX,
      flipY,
      swapXY,
      cx,
      cy,
      rotation,
      rotationSVG,
      manualOffsetX,
      manualOffsetY,
      labelAngle,
      componentBodyAngle,
      panelFrameX,
      panelFrameY,
      id,
    ],
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
  const {
    cx,
    cy,
    rotation,
    rotationSVG,
    manualOffsetX,
    manualOffsetY,
    flipX,
    flipY,
    swapXY,
    labelAngle,
    componentBodyAngle,
    panelFrameX,
    panelFrameY,
  } = req.body;
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
    [
      flipX,
      flipY,
      swapXY,
      cx,
      cy,
      rotation,
      rotationSVG,
      manualOffsetX,
      manualOffsetY,
      labelAngle,
      componentBodyAngle,
      panelFrameX,
      panelFrameY,
      id,
    ],
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

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);
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
