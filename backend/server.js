require("dotenv").config();
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("./database.js");
const { v4: uuidv4 } = require("uuid"); // tạo UUID
const routes = require("./routes");
const {
  router: aiSummaryRouter,
  setIO: setAISummaryIO,
} = require("./routes/AI-Summary/ai.summary");
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
const { createCanvas } = require("canvas");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { nanoid } = require("nanoid");
const deliveryChatRouter = require("./routes/AI/ai-project.js");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const fetch = require("node-fetch");

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
  "http://192.168.205.12",

  // Production domain – **đầy đủ biến thể**
  "http://erpst.io.vn",
  "https://erpst.io.vn",
  "https://ai.erpst.io.vn",
  "https://api.erpst.io.vn",
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
  }),
);

// BẮT BUỘC CÓ để xử lý preflight OPTIONS
app.options("*", cors());

app.use(bodyParser.json());
app.use("/", routes);
app.use("/api/ai", aiSummaryRouter);
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

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
/* API */
app.use("/api", require("./routes"));

const storageMachine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/machine"); // tạo sẵn folder này
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const storagePnP = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/pickplace"); // folder to save images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const storageGerber = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/gerber"); // folder to save images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const storageImageMPN = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/bomhighlight"); // folder to save images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${file.originalname}`;
    cb(null, uniqueSuffix);
  },
});

const storageImageQC = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/qc"); // folder to save images
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
      ".gko",
      ".cam",
      ".gto",
      ".gbo",
      ".gbs",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file xlsx, gerber"));
    }
  },
});

const uploadPnP = multer({
  storage: storagePnP,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExt = [".xlsx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file xlsx, gerber"));
    }
  },
});

const uploadGerber = multer({
  storage: storagePnP,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    cb(null, true); // chấp nhận mọi file
  },
});

const uploadImageMPN = multer({
  storage: storageImageMPN,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExt = [".png", ".jpg", ".jpeg", ".webp", ".heic"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file png, jpg, jpeg, webp, heic"));
    }
  },
});

const uploadImageQC = multer({
  storage: storageImageQC,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExt = [".png", ".jpg", ".jpeg", ".webp", ".heic", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file png, jpg, jpeg, webp, heic"));
    }
  },
});

// chỉ cho phép png/jpg
const fileFilterMachine = (req, file, cb) => {
  const allowed = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/heic",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Chỉ cho phép PNG, JPG, WEBP, HEIC"));
};
const uploadMachine = multer({
  storage: storageMachine,
  fileFilter: fileFilterMachine,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const userProjects = new Map();

// Import Socket
//=========== Check Bom =================
const getCompareSocket = require("./socket/Check-Bom/GetCompare.socket.js");
const getCheckBomSocket = require("./socket/Check-Bom/GetCheckBom.socket.js");
const getDetailBomSocket = require("./socket/Check-Bom/GetDetailBom.socket.js");

//=========== Orders =================
const getOrdersSocket = require("./socket/Orders/GetOrders.socket.js");

//=========== WareHouse =================
const getWareHouseSocket = require("./socket/WareHouse/GetWareHouse.socket.js");
const getWareHouseFindSocket = require("./socket/WareHouse/GetWareHouseFind.socket.js");
const getTemporaryWareHouseSocket = require("./socket/WareHouse/GetTemporaryWareHouse.socket.js");
const getWareHouseLogSocket = require("./socket/WareHouse/GetWareHouseLog.socket.js");
//=========== Project =================
const getProjectSocket = require("./socket/Project/GetProject.socket.js");
const getNotificationSocket = require("./socket/Project/GetNotification.socket.js");
const getProjectFindSocket = require("./socket/Project/GetProjectFind.socket.js");
const getDetailProjectSocket = require("./socket/Project/GetDetailProject.socket.js");
const getDetailProjectPOSocket = require("./socket/Project/GetDetailProjectPO.socket.js");
//=========== Setting =================
const getInforUserSocket = require("./socket/Setting/GetInfoUser.socket.js");
const getUserSocket = require("./socket/Setting/GetSetting.socket.js");
//=========== Maintaince =================
const getMachineSocket = require("./socket/Maintaince/GetMachine.socket.js");
const getMaintainceSocket = require("./socket/Maintaince/GetMaintaince.socket.js");
const getMaintenanceScheduleSocket = require("./socket/Maintaince/GetMaintainceSchedule.socket.js");
const getSparePartUsageSocket = require("./socket/Maintaince/GetSparePartUsage.socket.js");
//=========== Manufacture =================
const getManufactureSocket = require("./socket/Manufacture/GetManufacture.socket.js");
const getManufactureDetailsSocket = require("./socket/Manufacture/GetManufactureDetails.socket.js");
const getManufactureCountingSocket = require("./socket/Manufacture/GetManufactureCounting.socket.js");
const getHistorySocket = require("./socket/Manufacture/GetHistory.socket.js");
const getHistoryPartSocket = require("./socket/Manufacture/GetHistoryPart.socket.js");
//=========== Summary =================
const getSummarySocket = require("./socket/Summary/GetSummary.socket.js");
//=========== Check PnP =================
const getProjectBomSocket = require("./socket/Check-PCB/GetProjectBom.socket.js");
const getCombineBomSocket = require("./socket/Check-PCB/GetCombineBom.socket.js");
const getRawBomHighlightSocket = require("./socket/Check-PCB/GetRawBomHighlight.socket.js");
const getBomHighlightSocket = require("./socket/Check-PCB/GetBomHighlight.socket.js");
const getGerberFileSocket = require("./socket/Check-PCB/GetGerberFile.socket.js");
const getPnPFileSocket = require("./socket/Check-PCB/GetPnPFile.socket.js");
const getSettingPCB = require("./socket/Check-PCB/settingPCB.socket.js");
//=========== Check QC =================
const getProjectQCSocket = require("./socket/Check-QC/GetProjectQC.socket.js");
const getCombineBomQCSocket = require("./socket/Check-QC/GetCombineBomQC.socket.js");
const getRawBomQCSocket = require("./socket/Check-QC/GetRawBomQC.socket.js");
const getSettingQCSocket = require("./socket/Check-QC/GetSettingQC.socket.js");

//=========== To Do =================
const getTodoSocket = require("./socket/Todo/GetTodo.socket.js");

//=================== Import Route and controoler============================

//=========== Maintaince =================
const SparePartRoutes = require("./routes/Maintenance/SparePart.routes.js");
const ScheduleRoutes = require("./routes/Maintenance/Schedule.routes.js");

app.use("/api/Maintenance/SparePart", SparePartRoutes(io));
app.use("/api/Maintenance/Schedule", ScheduleRoutes(io));

//=========== Summary =================
const ProjectSummaryRoutes = require("./routes/Manufacture/Summary.routes.js");
const ManufactureCountingRoutes = require("./routes/Manufacture/ManufactureCounting.routes.js");
const PlanManufactureRoutes = require("./routes/Manufacture/PlanManufacture.routes.js");

app.use("/api/Manufacture/Summary", ProjectSummaryRoutes(io));
app.use("/api/Manufacture/ManufactureCounting", ManufactureCountingRoutes(io));
app.use("/api/Manufacture/PlanManufacture", PlanManufactureRoutes(io));

//=========== Check PCB =================
const ProjectPCBRoutes = require("./routes/Check-PCB/ProjectPCB.routes.js");
const UploadPCBRoutes = require("./routes/Check-PCB/UploadPCB.routes.js");
const DownloadPCBRoutes = require("./routes/Check-PCB/DownloadPCB.routes.js");
const SettingPCBRoutes = require("./routes/Check-PCB/SettingPCB.routes.js");
const PickplaceBomPCBRoutes = require("./routes/Check-PCB/Pickplace-Bom-GerberPCB.routes.js");

app.use("/api/ProjectPCB", ProjectPCBRoutes(io));
app.use("/api/UploadPCB", UploadPCBRoutes(io));
app.use("/api/DownloadPCB", DownloadPCBRoutes(io));
app.use("/api/SettingPCB", SettingPCBRoutes(io));
app.use("/api/Pickplace-BomPCB", PickplaceBomPCBRoutes(io));

//=========== Check QC =================
const ProjectQCRoutes = require("./routes/Check-QC/ProjectQC.routes.js");
const SettingQCRoutes = require("./routes/Check-QC/SettingPCB-QC.routes.js");
const UploadQCRoutes = require("./routes/Check-QC/UploadQC.routes.js");
const PickplaceQCRoutes = require("./routes/Check-QC/Pickplace-BomQC.routes.js");

app.use("/api/FilterBomQC", ProjectQCRoutes(io));
app.use("/api/SettingPCB-QC", SettingQCRoutes(io));
app.use("/api/UploadQC", UploadQCRoutes(io));
app.use("/api/Pickplace-BomQC", PickplaceQCRoutes(io));

// Khi client kết nối
io.on("connection", (socket) => {
  if (!sessions[socket.id]) sessions[socket.id] = [];

  // ================ Check Bom ===================
  getCompareSocket(socket);
  getCheckBomSocket(socket);
  getDetailBomSocket(socket);

  // ================ Orders ===================
  getOrdersSocket(socket);

  // ================ WareHouse ===================
  getWareHouseSocket(socket);
  getWareHouseFindSocket(socket);
  getTemporaryWareHouseSocket(socket);
  getWareHouseLogSocket(socket);

  // ================ Project ===================
  getProjectSocket(socket);
  getNotificationSocket(socket);
  getProjectFindSocket(socket);
  getDetailProjectSocket(socket);
  getDetailProjectPOSocket(socket);

  // ================ Setting ===================
  getInforUserSocket(socket);
  getUserSocket(socket);

  // ================ Maintaince ===================
  getMachineSocket(socket);
  getMaintainceSocket(socket);
  getSparePartUsageSocket(socket);
  getMaintenanceScheduleSocket(socket);

  // ================ Manufacture ===================
  getManufactureSocket(socket);
  getManufactureDetailsSocket(socket);
  getManufactureCountingSocket(socket);
  getHistorySocket(socket);
  getHistoryPartSocket(socket);

  // ================ Summary =======================
  getSummarySocket(socket);

  // ================ Check PnP ====================
  getProjectBomSocket(socket);
  getCombineBomSocket(socket);
  getRawBomHighlightSocket(socket);
  getBomHighlightSocket(socket);
  getGerberFileSocket(socket);
  getPnPFileSocket(socket);
  getSettingPCB(socket);

  // ================ Check QC =====================
  getProjectQCSocket(socket);
  getCombineBomQCSocket(socket);
  getRawBomQCSocket(socket);
  getSettingQCSocket(socket);

  // ================ To do =====================
  getTodoSocket(socket);

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// const getPivotQuery = async (id) => {
//   return new Promise((resolve, reject) => {
//     db.all(
//       `SELECT DISTINCT Bom FROM CheckBOM WHERE PO= ?`,
//       [id],
//       (err, Boms) => {
//         if (err) return reject(err);

//         // Create dynamic column aggregation
//         const columns = Boms.map(
//           (bom) =>
//             `MAX(CASE WHEN a.Bom = '${bom.Bom}' THEN (a.So_Luong * a.SL_Board) ELSE NULL END) AS [${bom.Bom}]`,
//         ).join(", ");

//         // Tạo biểu thức tổng từ các cột động
//         const sumColumns = Boms.map(
//           (bom) =>
//             `MAX(CASE WHEN a.Bom = '${bom.Bom}' THEN (a.So_Luong * a.SL_Board) ELSE 0 END)`,
//         ).join(" + ");

//         // Full SQL query
//         const query = `
//           SELECT
//             a.Description,
//             a.Manufacturer_1,
//             a.PartNumber_1,
//             a.Manufacturer_2,
//             a.PartNumber_2,
//             a.Manufacturer_3,
//             a.PartNumber_3,
//             ${columns},
//             ROUND((${sumColumns}), 2) AS SL_Tổng,
//             CASE
//               WHEN (b.Input - b.Output) > 0 THEN IFNULL((b.Input - b.Output), 0)
//               ELSE 0
//             END AS SL_Tồn_Kho,
//             b.Customer AS Mã_Kho,
//             CASE
//               WHEN (c.Input - c.Output) > 0 THEN IFNULL((c.Input - c.Output), 0)
//               ELSE 0
//             END AS SL_Tồn_Kho_Misa,
//             c.Customer AS Mã_Kho_Misa,
//             IFNULL(a.Du_Toan_Hao_Phi, 0) AS Dự_Toán_Hao_Phí,
//             IFNULL(a.Hao_Phi_Thuc_Te, 0) AS Hao_Phi_Thuc_Te,
//             a.So_Luong,
//             a.SL_Board,
//             a.Bom,
//             a.PO,
//             a.id AS Sửa
//           FROM CheckBOM a
//           LEFT JOIN WareHouse b ON a.PartNumber_1 = b.PartNumber_1
//           LEFT JOIN WareHouse2 c ON a.PartNumber_1 = c.PartNumber_1
//           WHERE a.PO = ?
//           GROUP BY a.PartNumber_1;
//         `;
//         resolve(query);
//       },
//     );
//   });
// };

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
      },
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
            `MAX(CASE WHEN a.Bom = '${bom.Bom}' THEN (a.So_Luong * a.SL_Board) ELSE NULL END) AS [${bom.Bom}]`,
        ).join(", ");

        // Tạo biểu thức tổng từ các cột động
        const sumColumns = Boms.map(
          (bom) =>
            `MAX(CASE WHEN a.Bom = '${bom.Bom}' THEN (a.So_Luong * a.SL_Board) ELSE 0 END)`,
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
      },
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
        },
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
            },
          );
        });
      } catch (err) {
        console.error(`Error preparing row:`, err.message);
        errorCount++;
      }
    }

    insertStmt.finalize();
    console.log(
      `Insert completed. Success: ${successCount}, Errors: ${errorCount}`,
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
      },
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
          },
        );
      });

      if (existingRow) {
        // Update existing row
        await new Promise((resolve, reject) => {
          const updateStmt = db.prepare(
            "UPDATE WareHouse SET Input = Input + ?, Inventory = Inventory + ? WHERE PartNumber_1 = ? AND Description = ? AND Customer = ? AND Location = ?",
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
            },
          );
        });
      } else {
        // Insert new row
        await new Promise((resolve, reject) => {
          const insertStmt = db.prepare(
            "INSERT INTO WareHouse (Description, PartNumber_1, PartNumber_2, Input, Output, Inventory, Customer, Location, Note, Note_Output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
            },
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
    },
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
    },
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
          },
        );
      });

      if (existingRow) {
        // Update existing row
        await new Promise((resolve, reject) => {
          const updateStmt = db.prepare(
            "UPDATE WareHouse2 SET Input = Input + ?, Inventory = Inventory + ? WHERE PartNumber_1 = ? AND Description = ? AND Customer = ? AND Location = ?",
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
            },
          );
        });
      } else {
        // Insert new row
        await new Promise((resolve, reject) => {
          const insertStmt = db.prepare(
            "INSERT INTO WareHouse2 (Description, PartNumber_1, PartNumber_2, Input, Output, Inventory, Customer, Location, Note, Note_Output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
            },
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
    },
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
    },
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
              },
            );
          });
        }
        io.emit("WareHouseUpdate");
        res.json({
          message:
            "Đã cập nhật dữ liệu từ Temporary_WareHouse vào WareHouse thành công",
        });
      },
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
      `INSERT INTO Temporary_WareHouse (Description, PartNumber_1, Input, Location, Note) VALUES (?, ?, ?, ?, ?)`,
    );
    data.forEach((row) => {
      stmt.run(
        row.Description,
        row.PartNumber_1,
        row.Input,
        row.Location,
        row.Note,
      );
    });

    stmt.finalize();
    io.emit("TemporaryWareHouseUpdate");
    res.send("File processed successfully.");
  },
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
      `INSERT INTO Temporary_WareHouse_2 (Description, PartNumber_1, Input, Location, Note) VALUES (?, ?, ?, ?, ?)`,
    );
    data.forEach((row) => {
      stmt.run(
        row.Description,
        row.PartNumber_1,
        row.Input,
        row.Location,
        row.Note,
      );
    });

    stmt.finalize();
    io.emit("WareHouse2Update");
    res.send("File processed successfully.");
  },
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
              },
            );
          });
        }
        io.emit("WareHouse2Update");
        res.json({
          message:
            "Đã cập nhật dữ liệu từ Temporary_WareHouse vào WareHouse thành công",
        });
      },
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
    },
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
      `INSERT INTO WareHouseLog (ActionType, PartNumber, Quantity, Location, Created_at, Updated_by) VALUES ('Xuất', ?, ?, ?, ?, ?)`,
    );
    data.forEach((row) => {
      stmt.run(
        row.PartNumber_1,
        row.Input,
        row.Location,
        Created_at,
        Updated_by,
      );
    });

    stmt.finalize();
    io.emit("WareHouseLogUpdate");
    res.send("File processed successfully.");
  },
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
      `INSERT INTO WareHouseLog (ActionType, PartNumber, Quantity, Location, Customer, Created_at, Updated_by) VALUES ('Nhập', ?, ?, ?, ?, ?, ?)`,
    );
    data.forEach((row) => {
      stmt.run(
        row.PartNumber_1,
        row.Input,
        row.Location,
        row.Customer,
        Created_at,
        Updated_by,
      );
    });

    stmt.finalize();
    io.emit("WareHouseLogUpdate");
    res.send("File processed successfully.");
  },
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
        },
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
    },
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
    },
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
    },
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
            },
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
              },
            );
          },
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
          },
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
    },
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
    },
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
    },
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
  },
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
  },
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
    },
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
    },
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
app.post("/api/Machine/Add", uploadMachine.single("image"), (req, res) => {
  const {
    TenThietBi,
    LoaiThietBi,
    NhaSanXuat,
    NgayMua,
    ViTri,
    MoTa,
    MachineCode,
  } = req.body;

  const imagePath = req.file ? `/uploads/machine/${req.file.filename}` : null;

  const query = `
      INSERT INTO Machine 
      (TenThietBi, LoaiThietBi, NhaSanXuat, NgayMua, ViTri, MoTa, Image, Condition, MachineCode)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Tốt', ?)
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
      MachineCode,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Lỗi DB" });
      }
      io.emit("MachineUpdate");
      res.json({ message: "Thêm thiết bị thành công" });
    },
  );
});

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
      MachineCode,
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
                row.Image.replace("/uploads/", "uploads/"),
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
              Condition = ?,
              MachineCode = ?
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
              MachineCode,
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
            },
          );
        },
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Upload failed" });
    }
  },
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
      },
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
    },
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
// app.post("/api/MaintenanceSchedule/Add", async (req, res) => {
//   const {
//     MaThietBi,
//     LoaiBaoTri,
//     ChuKyBaoTri,
//     DonViChuKy,
//     NgayBatDau,
//     NgayBaoTriTiepTheo,
//     GhiChu,
//   } = req.body;
//   let Timestamps = null;
//   if (NgayBatDau) {
//     const dateObj = new Date(NgayBatDau); // ví dụ "2025-11-15"
//     if (!isNaN(dateObj.getTime())) {
//       Timestamps = Math.floor(dateObj.getTime() / 1000);
//     } else {
//       return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
//     }
//   } else {
//     Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
//   }
//   let Timestamps2 = null;
//   if (NgayBaoTriTiepTheo) {
//     const dateObj = new Date(NgayBaoTriTiepTheo); // ví dụ "2025-11-15"
//     if (!isNaN(dateObj.getTime())) {
//       Timestamps2 = Math.floor(dateObj.getTime() / 1000);
//     } else {
//       return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
//     }
//   } else {
//     Timestamps2 = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
//   }
//   // Insert data into SQLite database
//   const query = `
//     INSERT INTO MaintenanceSchedule (MaThietBi, LoaiBaoTri, ChuKyBaoTri, DonViChuKy, NgayBatDau, NgayBaoTriTiepTheo, GhiChu)
//     VALUES (?, ?, ?, ?, ?, ?, ?)
//   `;
//   db.run(
//     query,
//     [
//       MaThietBi,
//       LoaiBaoTri,
//       ChuKyBaoTri,
//       DonViChuKy,
//       Timestamps,
//       Timestamps2,
//       GhiChu,
//     ],
//     function (err) {
//       if (err) {
//         return res
//           .status(500)
//           .json({ error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu" });
//       }
//       io.emit("MaintenanceScheduleUpdate");
//       io.emit("MachineUpdate");
//       res.json({ message: "Đã thêm dữ liệu bảo trì định kỳ thành công" });
//     },
//   );
// });

// Router update item in MaintenanceSchedule table
// app.put("/api/MaintenanceSchedule/Edit/:id", async (req, res) => {
//   const { id } = req.params;
//   const {
//     MaThietBi,
//     LoaiBaoTri,
//     ChuKyBaoTri,
//     DonViChuKy,
//     NgayBatDau,
//     NgayBaoTriTiepTheo,
//     GhiChu,
//   } = req.body;
//   let Timestamps = null;
//   if (NgayBatDau) {
//     const dateObj = new Date(NgayBatDau); // ví dụ "2025-11-15"
//     if (!isNaN(dateObj.getTime())) {
//       Timestamps = Math.floor(dateObj.getTime() / 1000);
//     } else {
//       return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
//     }
//   } else {
//     Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
//   }
//   let Timestamps2 = null;
//   if (NgayBaoTriTiepTheo) {
//     const dateObj = new Date(NgayBaoTriTiepTheo); // ví dụ "2025-11-15"
//     if (!isNaN(dateObj.getTime())) {
//       Timestamps2 = Math.floor(dateObj.getTime() / 1000);
//     } else {
//       return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
//     }
//   } else {
//     Timestamps2 = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
//   }
//   // Insert data into SQLite database
//   const query = `
//     UPDATE MaintenanceSchedule
//     SET MaThietBi = ?, LoaiBaoTri = ?, ChuKyBaoTri = ?, DonViChuKy = ?, NgayBatDau = ?, NgayBaoTriTiepTheo = ?, GhiChu = ?
//     WHERE MaLich = ?
//   `;
//   db.run(
//     query,
//     [
//       MaThietBi,
//       LoaiBaoTri,
//       ChuKyBaoTri,
//       DonViChuKy,
//       Timestamps,
//       Timestamps2,
//       GhiChu,
//       id,
//     ],
//     function (err) {
//       if (err) {
//         return res
//           .status(500)
//           .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
//       }
//       io.emit("MaintenanceScheduleUpdate");
//       io.emit("MachineUpdate");
//       res.json({ message: "Đã cập nhật dữ liệu bảo trì định kỳ thành công" });
//     },
//   );
// });

// Router delete item in MaintenanceSchedule table
// app.delete("/api/MaintenanceSchedule/Delete/:id", async (req, res) => {
//   const { id } = req.params;
//   // Insert data into SQLite database
//   const query = `
//     DELETE FROM MaintenanceSchedule WHERE MaLich = ?
//   `;
//   db.run(query, [id], function (err) {
//     if (err) {
//       return res
//         .status(500)
//         .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
//     }
//     io.emit("MaintenanceScheduleUpdate");
//     io.emit("MachineUpdate");
//     res.json({ message: "Đã xoá dữ liệu bảo trì định kỳ thành công" });
//   });
// });

// // Router add new item in SparePartUsage table
// app.post("/api/SparePartUsage/Add", async (req, res) => {
//   const { MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu } =
//     req.body;
//   // Insert data into SQLite database
//   const query = `
//     INSERT INTO SparePartUsage (MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu)
//     VALUES (?, ?, ?, ?, ?, ?)
//   `;
//   db.run(
//     query,
//     [MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu],
//     function (err) {
//       if (err) {
//         return res
//           .status(500)
//           .json({ error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu" });
//       }
//       io.emit("SparePartUsageUpdate");
//       io.emit("MaintenanceUpdate");
//       res.json({ message: "Đã thêm dữ liệu sử dụng phụ tùng thành công" });
//     },
//   );
// });

// // Router update item in SparePartUsage table
// app.put("/api/SparePartUsage/Edit/:id", async (req, res) => {
//   const { id } = req.params;
//   const { MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu } =
//     req.body;
//   // Insert data into SQLite database
//   const query = `
//     UPDATE SparePartUsage
//     SET MaBaoTri = ?, MaThietBi = ?, TenPhuTung = ?, SoLuongSuDung = ?, DonVi = ?, GhiChu = ?
//     WHERE MaSuDung = ?
//   `;
//   db.run(
//     query,
//     [MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu, id],
//     function (err) {
//       if (err) {
//         return res
//           .status(500)
//           .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
//       }
//       io.emit("SparePartUsageUpdate");
//       io.emit("MaintenanceUpdate");
//       res.json({ message: "Đã cập nhật dữ liệu sử dụng phụ tùng thành công" });
//     },
//   );
// });

// // Router delete item in SparePartUsage table
// app.delete("/api/SparePartUsage/Delete/:id", async (req, res) => {
//   const { id } = req.params;
//   // Insert data into SQLite database
//   const query = `
//     DELETE FROM SparePartUsage WHERE MaSuDung = ?
//   `;
//   db.run(query, [id], function (err) {
//     if (err) {
//       return res
//         .status(500)
//         .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
//     }
//     io.emit("SparePartUsageUpdate");
//     io.emit("MaintenanceUpdate");
//     res.json({ message: "Đã xoá dữ liệu sử dụng phụ tùng thành công" });
//   });
// });

// Router add new item in PlanManufacture table
// Format date => YYYY-MM-DD theo local time
function formatDateLocal(dateInput) {
  const date = new Date(dateInput);

  const vnDate = new Date(
    date.toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
  );

  const year = vnDate.getFullYear();
  const month = String(vnDate.getMonth() + 1).padStart(2, "0");
  const day = String(vnDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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
app.post(
  "/api/upload-working-gerber/:id",
  uploadGerber.single("FileGerber"),
  (req, res) => {
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
        // Fix màu: thay currentColor bằng màu layer thực
        const layerColor = LAYER_COLORS[layer] ?? "#cc0000";
        svgData = svgData
          .replace(/\bfill="currentColor"/gi, `fill="${layerColor}"`)
          .replace(/\bstroke="currentColor"/gi, `stroke="${layerColor}"`);

        db.run(
          `INSERT INTO WorkingGerberData (layer, svg, filename, project_id, unit, format)
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
          },
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
  },
);

// ─── Layer color map ──────────────────────────────────────────────────────────
const LAYER_COLORS = {
  copper_top: "#cc0000",
  copper_bottom: "#0000cc",
  soldermask_top: "#00aa4488",
  soldermask_bottom: "#00aa4488",
  silkscreen_top: "#ffffff",
  silkscreen_bottom: "#ffff00",
  board_outline: "#ffaa00",
  drill: "#888888",
};

// ─── Layer stack order (bottom → top) ────────────────────────────────────────
const LAYER_ORDER = [
  "copper_bottom",
  "drill",
  "board_outline",
  "copper_top",
  "soldermask_bottom",
  "soldermask_top",
  "silkscreen_bottom",
  "silkscreen_top",
];

// ─── Auto-detect layer từ extension ──────────────────────────────────────────
const EXT_LAYER_MAP = {
  ".gtl": "copper_top",
  ".gbl": "copper_bottom",
  ".gtp": "soldermask_top",
  ".gbp": "soldermask_bottom",
  ".gto": "silkscreen_top",
  ".gbo": "silkscreen_bottom",
  ".gko": "board_outline",
  ".drl": "drill",
  ".exc": "drill",
  ".xln": "drill",
};

function detectLayer(fileName) {
  const ext = "." + fileName.split(".").pop().toLowerCase();
  return EXT_LAYER_MAP[ext] ?? "copper_top";
}

// ─── Detect unit từ nội dung file ─────────────────────────────────────────────
function detectUnit(content) {
  if (/\%MOMM\%/.test(content)) return "mm";
  if (/\%MOIN\%/.test(content)) return "inch";
  return "unknown";
}

// ─── Detect format từ nội dung file ──────────────────────────────────────────
function detectFormat(content) {
  const match = content.match(/%FSLA?X?(\d)(\d)Y(\d)(\d)\*%/);
  if (!match) return null;
  return {
    x: { integer: parseInt(match[1]), decimal: parseInt(match[2]) },
    y: { integer: parseInt(match[3]), decimal: parseInt(match[4]) },
  };
}

// ─── Convert 1 file Gerber → SVG string ──────────────────────────────────────
function processGerberFile(file, layerOverride = null) {
  return new Promise((resolve, reject) => {
    const filePath = file.path;
    const fileName = file.originalname;

    const cleanup = () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    };

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const layer = layerOverride ?? detectLayer(fileName);
      const unit = detectUnit(fileContent);
      const format = detectFormat(fileContent);

      const fileStream = fs.createReadStream(filePath);
      const converter = gerberToSvg(fileStream);

      let svgData = "";
      converter.on("data", (chunk) => (svgData += chunk.toString()));
      converter.on("end", () => {
        cleanup();
        resolve({ layer, svg: svgData, fileName, unit, format });
      });
      converter.on("error", (err) => {
        cleanup();
        reject(new Error(`Convert failed [${fileName}]: ${err.message}`));
      });
    } catch (e) {
      cleanup();
      reject(e);
    }
  });
}

// ─── Merge nhiều SVG thành 1 SVG duy nhất ────────────────────────────────────
function mergeLayersToSvg(layerResults) {
  // Sort theo thứ tự stack PCB
  const sorted = [...layerResults].sort((a, b) => {
    const ai = LAYER_ORDER.indexOf(a.layer);
    const bi = LAYER_ORDER.indexOf(b.layer);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // 1. Calculate a Unified ViewBox covering ALL layers
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let hasValidViewBox = false;

  for (const { svg } of sorted) {
    const vbMatch = svg.match(/viewBox=["']([^"']+)["']/);
    if (vbMatch) {
      const [vx, vy, vw, vh] = vbMatch[1]
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (!isNaN(vx) && !isNaN(vy) && !isNaN(vw) && !isNaN(vh)) {
        minX = Math.min(minX, vx);
        minY = Math.min(minY, vy);
        maxX = Math.max(maxX, vx + vw);
        maxY = Math.max(maxY, vy + vh);
        hasValidViewBox = true;
      }
    }
  }

  const finalViewBox = hasValidViewBox
    ? `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
    : "0 0 100 100";

  // Lấy width/height từ lớp đầu tiên để giữ tỉ lệ (hoặc null)
  let width = null;
  let height = null;
  const firstWithVb = sorted.find((s) => s.svg.includes("viewBox"));
  if (firstWithVb) {
    const wMatch = firstWithVb.svg.match(/\bwidth=["']([^"']+)["']/);
    const hMatch = firstWithVb.svg.match(/\bheight=["']([^"']+)["']/);
    width = wMatch?.[1] ?? null;
    height = hMatch?.[1] ?? null;
  }

  // Build <g> group cho từng layer
  const groups = sorted.map(({ layer, svg }) => {
    const bodyMatch = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    const body = bodyMatch ? bodyMatch[1] : svg;

    // Tách <defs> ra khỏi body để đặt lên đầu merged SVG
    const defsMatch = body.match(/(<defs[^>]*>[\s\S]*?<\/defs>)/i);
    const defs = defsMatch ? defsMatch[1] : "";
    let content = body.replace(/<defs[^>]*>[\s\S]*?<\/defs>/gi, "").trim();

    const color = LAYER_COLORS[layer] ?? "#888888";

    // Fix màu: gerber-to-svg render fill/stroke="currentColor"
    // currentColor inherit CSS color (đen/trắng) chứ KHÔNG phải fill của <g> cha
    // → thay trực tiếp bằng màu layer để hiển thị đúng màu
    content = content
      .replace(/\bfill="currentColor"/gi, `fill="${color}"`)
      .replace(/\bstroke="currentColor"/gi, `stroke="${color}"`);

    return {
      defs,
      group: `
        <!-- ═══ Layer: ${layer} ═══ -->
        <g id="layer-${layer}"
          data-layer="${layer}"
          fill="${color}"
          stroke="${color}"
          opacity="1">
          ${content}
        </g>`,
    };
  });

  const allDefs = groups
    .map((g) => g.defs)
    .filter(Boolean)
    .join("\n  ");
  const allGroups = groups.map((g) => g.group).join("\n");
  const layerNames = sorted.map((r) => r.layer).join(",");
  const fileNames = sorted.map((r) => r.fileName).join(", ");

  const widthAttr = width ? ` width="${width}"` : "";
  const heightAttr = height ? ` height="${height}"` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="${finalViewBox}"${widthAttr}${heightAttr}
        data-layers="${layerNames}">
      <desc>Merged Gerber: ${fileNames}</desc>
      <defs>
        ${allDefs}
      </defs>
    ${allGroups}
    </svg>`;
}

// ─── POST /api/upload-gerber/:id ──────────────────────────────────────────────
app.post(
  "/api/upload-gerber/:id",
  uploadGerber.array("FileGerber"),
  async (req, res) => {
    const projectId = req.params.id;
    const files = req.files;
    const layerGerber = req.body.layerGerber;
    // ── Validate ──────────────────────────────────────────────────────────────
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Không có file nào được upload" });
    }

    // layers[] từ frontend (tương ứng thứ tự files[])
    const rawLayers = req.body.layers ? JSON.parse(req.body.layers) : [];

    const layerOverrides = Array.isArray(rawLayers) ? rawLayers : [rawLayers];

    try {
      // ── Xử lý song song tất cả file ──────────────────────────────────────
      const layerResults = await Promise.all(
        files.map((file, i) =>
          processGerberFile(file, layerOverrides[i] || null),
        ),
      );

      // ── Merge tất cả SVG thành 1 ─────────────────────────────────────────
      const mergedSvg = mergeLayersToSvg(layerResults);

      // ── Metadata tổng hợp ─────────────────────────────────────────────────
      const mergedUnit =
        layerResults.find((r) => r.unit !== "unknown")?.unit ?? "unknown";
      const mergedFormat = layerResults.map((r) => ({
        layer: r.layer,
        format: r.format,
      }));
      const mergedFileNames = layerResults.map((r) => r.fileName).join(",");

      // ── Insert vào DB ─────────────────────────────────────────────────────
      db.run(
        `INSERT INTO GerberData (layer, svg, filename, project_id, unit, format)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          layerGerber,
          mergedSvg,
          mergedFileNames,
          projectId,
          "mm",
          JSON.stringify(mergedFormat),
        ],
        function (err) {
          if (err) {
            console.error("DB insert error:", err.message);
            return res.status(500).json({ error: err.message });
          }

          // ── Emit socket events ──────────────────────────────────────────
          const responsePayload = {
            id: this.lastID,
            layer: layerGerber,
            unit: mergedUnit,
            format: mergedFormat,
            svg: mergedSvg,
            layers: layerResults.map((r) => ({
              layer: r.layer,
              fileName: r.fileName,
              unit: "inch",
              format: r.format,
            })),
          };

          io.emit("gerber_uploaded", responsePayload);
          io.emit("CombineBomUpdate", { project_id: projectId });
          io.emit("GerberFileUpdate", { project_id: projectId });
          io.emit("PnPFileUpdate");

          return res.status(201).json(responsePayload);
        },
      );
    } catch (e) {
      console.error("Upload error:", e.message);

      // Dọn dẹp các file còn sót nếu Promise.all thất bại giữa chừng
      files.forEach((f) => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });

      return res.status(500).json({ error: e.message });
    }
  },
);

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
    },
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
    },
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
    },
  );
});

// Post item in To Do
app.post("/api/To-Do/Add-item", (req, res) => {
  const { department, title, description, status, creater, createdAt } =
    req.body;
  let Timestamps = null;
  if (createdAt) {
    const dateObj = new Date(createdAt); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
  db.run(
    `INSERT INTO ToDos (
        department,
        title, 
        description, 
        status,
        creater,
        createdAt
        )
     VALUES (?, ?, ?, ?, ?, ?)`,
    [department, title, description, status, creater, Timestamps],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("updateToDo");
      res.json({ message: "To Do received" });
    },
  );
});

// Put item in To Do
app.put("/api/To-Do/Edit-item/:id", (req, res) => {
  const { id } = req.params;
  const { department, title, description, status, creater, createdAt } =
    req.body;
  let Timestamps = null;
  if (createdAt) {
    const dateObj = new Date(createdAt); // ví dụ "2025-11-15"
    if (!isNaN(dateObj.getTime())) {
      Timestamps = Math.floor(dateObj.getTime() / 1000);
    } else {
      return res.status(400).json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
    }
  } else {
    Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
  }
  db.run(
    `UPDATE ToDos
     SET
        department = ?,
        title = ?, 
        description = ?, 
        status = ?,
        creater = ?,
        createdAt = ?
     WHERE id = ?`,
    [department, title, description, status, creater, Timestamps, id],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("updateToDo");
      res.json({ message: "To Do received" });
    },
  );
});

app.put("/api/To-Do/Update-status/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.run(
    `UPDATE ToDos
     SET
        status = ?
     WHERE id = ?`,
    [status, id],
    (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("updateToDo");
      res.json({ message: "To Do received" });
    },
  );
});

app.delete("/api/To-Do/Delete-item/:id", (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM ToDos WHERE id = ?`, [id], (err) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }
    io.emit("updateToDo");
    res.json({ message: "To Do received" });
  });
});

app.use("/api/ai-project", deliveryChatRouter(db));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
