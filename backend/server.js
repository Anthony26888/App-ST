require("dotenv").config();
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./database.js");
const routes = require("./routes");
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
        const query = `SELECT DISTINCT c.id, c.CustomerName AS Customers, COUNT(p.PONumber) AS Quantity_PO, Years FROM Customers c LEFT JOIN PurchaseOrders p ON c.id = p.CustomerID GROUP BY c.CustomerName ORDER BY c.Years DESC`;
        db.all(query, [], (err, rows) => {
          if (err) return socket.emit("ProjectError", err);
          socket.emit("ProjectData", rows);
        });
      } catch (error) {
        socket.emit("ProjectError", error);
      }
    }),
    socket.on("getDetailProject", async (id) => {
      try {
        const query = `
          SELECT DISTINCT 
            p.id, 
            p.PONumber AS PO, 
            CASE
              WHEN SUM(o.QuantityProduct) =  SUM(o.QuantityDelivered) THEN 'true'
              ELSE 'false'
            END AS Status,
            SUM(o.QuantityProduct) AS Total_Product, 
            SUM(o.QuantityDelivered) AS Total_Delivered, 
            SUM(o.QuantityAmount) AS Total_Amount, 
            p.DateCreated AS Date_Created, 
            p.DateDelivery AS Date_Delivery 
          FROM PurchaseOrders p 
          LEFT JOIN ProductDetails o ON p.id = o.POID 
          WHERE p.CustomerID = ? 
          GROUP BY p.PONumber 
          ORDER BY p.PONumber ASC
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
        const query = `SELECT o.id,  o.ProductDetail AS Product_Detail, o.QuantityProduct AS Quantity_Product, o.QuantityDelivered AS Quantity_Delivered, o.QuantityAmount AS Quantity_Amount FROM ProductDetails o LEFT JOIN PurchaseOrders p ON o.POID = p.id WHERE o.POID = ? ORDER BY o.ProductDetail ASC`;
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
        const query = `SELECT DISTINCT *, id AS Status FROM PlanManufacture ORDER BY id DESC`;
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
                        b.Total,  
                        SUM(a.Input) AS Input, 
                        SUM(a.Output) AS Output, 
                        a.Input AS Input_Detail,
                        a.Output AS Output_Detail,
                        a.Date,
                        a.Time
                        FROM ManufactureDetails a 
                        LEFT JOIN PlanManufacture b ON a.PlanID = b.id
                        WHERE a.PlanID = ?
                        GROUP BY a.Date`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureDetailsError", err);
          socket.emit("ManufactureDetailsData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureDetailsError", error);
      }
    }),
    socket.on("getManufactureDetailsTable", async (id) => {
      try {
        const query = `SELECT * FROM ManufactureDetails WHERE PlanID = ? ORDER BY id DESC`;
        db.all(query, [id], (err, rows) => {
          if (err) return socket.emit("ManufactureDetailsTableError", err);
          socket.emit("ManufactureDetailsTableData", rows);
        });
      } catch (error) {
        socket.emit("ManufactureDetailsTableError", error);
      }
    }),
    socket.on("setProject", (id) => {
      console.log(`Client ${socket.id} chọn project_id = ${id}`);
      userProjects.set(socket.id, id);
    });
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
    console.log(`Insert completed. Success: ${successCount}, Errors: ${errorCount}`);
    
    res.json({ 
      message: "Dữ liệu đã được chèn thành công!", 
      total: rows.length,
      success: successCount,
      errors: errorCount
    });
    io.emit("updateDetailOrders");

  } catch (err) {
    console.error("Lỗi truy vấn:", err.message);
    res.status(500).json({ error: "Không thể tạo truy vấn.", details: err.message });
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
  const { Input_Hao_Phi_Thuc_Te, Ma_Kho, Ma_Kho_Misa, PartNumber_1, PO } = req.body;
  // Insert data into SQLite database
  const query = `UPDATE DetailOrders SET Hao_Phi_Thuc_Te = ?, Ma_Kho = ?, Ma_Kho_Misa = ? WHERE PartNumber_1 = ?`;
  db.run(query, [Input_Hao_Phi_Thuc_Te, Ma_Kho, Ma_Kho_Misa, PartNumber_1], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateCompare", PO);
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
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
  } = req.body;
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    UPDATE ProductDetails 
    SET ProductDetail = ?, QuantityProduct = ?, QuantityDelivered = ?, QuantityAmount = ? 
    WHERE id = ?`;
  db.run(
    query,
    [Product_Detail, Quantity_Product, Quantity_Delivered, Quantity_Amount, id],
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
    POID,
  } = req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO ProductDetails (ProductDetail, QuantityProduct, QuantityDelivered, QuantityAmount, POID)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(
    query,
    [
      Product_Detail,
      Quantity_Product,
      Quantity_Delivered,
      Quantity_Amount,
      POID,
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
  const { PONumber, DateCreated, DateDelivery, CustomerID } = req.body;
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    UPDATE PurchaseOrders
    SET PONumber = ?, DateCreated = ?, DateDelivery = ?, CustomerID = ?
    WHERE id = ?`;
  db.run(
    query,
    [PONumber, DateCreated, DateDelivery, CustomerID, id],
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
  const { PONumber, DateCreated, DateDelivery, CustomerID } = req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO PurchaseOrders (PONumber, DateCreated, DateDelivery, CustomerID)
    VALUES (?, ?, ?, ?)
  `;
  db.run(
    query,
    [PONumber, DateCreated, DateDelivery, CustomerID],
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
  const { CustomerName } = req.body;
  const { id } = req.params;
  // Insert data into SQLite database
  const query = `
    UPDATE Customers
    SET CustomerName = ?, Years = ?
    WHERE id = ?`;
  db.run(query, [CustomerName, id], function (err) {
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
  const { Name, Status, Date, Creater, Note, Total } = req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO PlanManufacture (Name, Status, Date, Creater, Note, Total)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(query, [Name, Status, Date, Creater, Note, Total], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu" });
    }
    io.emit("ManufactureUpdate");
    res.json({ message: "Đã thêm dữ liệu dự án sản xuất thành công" });
  });
});

// Router update item in PlanManufacture table
app.put("/PlanManufacture/Edit/:id", async (req, res) => {
  const { id } = req.params;
  const { Name, Date, Creater, Note, Total } = req.body;
  // Insert data into SQLite database
  const query = `
      UPDATE PlanManufacture 
      SET Name = ?, Date = ?, Creater = ?, Note = ?, Total = ?
      WHERE id = ?
    `;
  db.run(query, [Name, Date, Creater, Note, Total, id], function (err) {
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

let currentProjectId = ""; // gán từ frontend

// API từ frontend để đặt projectId hiện tại
app.post("/set-project-id", (req, res) => {
  const { ProjectID } = req.body;
  if (!ProjectID) {
    currentProjectId = "";
    console.log("Project ID cleared");
    return res.send({ success: true, message: "Đã dừng theo dõi" });
  }
  currentProjectId = ProjectID;
  console.log("Project ID set to:", currentProjectId);
  res.send({ success: true, message: "Đã bắt đầu theo dõi" });
});

// API nhận dữ liệu từ Arduino
app.post("/api/sensor", (req, res) => {
  const { input_value } = req.body;
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  const formattedTime = today.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  if (typeof input_value !== "number") {
    return res.status(400).send("Invalid input/output values");
  }
  // Bỏ qua nếu cả hai đều bằng 0
  if (input_value === 0) {
    return res.status(200).json({ message: "Ignored 0-0 input" });
  }

  if (!currentProjectId) {
    return res.status(400).send("Project ID not set");
  }

  const query = `
    INSERT INTO ManufactureDetails (PlanID, Input, Output, Date, Time) 
    VALUES (?, ?, '0', ?, ?)
  `;

  db.run(
    query,
    [currentProjectId, input_value, formattedDate, formattedTime],
    function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Database error");
      }
      io.emit("updateManufactureDetails");
      io.emit("updateManufactureDetailsTable");
      res.send({ success: true, id: this.lastID });
    }
  );
});
app.delete("/reset-data/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    DELETE FROM ManufactureDetails WHERE PlanID = ?
  `;
  db.run(query, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
    }
    io.emit("updateManufactureDetails");
    io.emit("updateManufactureDetailsTable");
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
      io.emit('device-status', {
        device_id,
        status: 'online',
        last_seen: now
      });

      res.json({ message: "Heartbeat received" });
    }
  );
});

app.get('/api/devices', (req, res) => {
  const now = Date.now();
  const timeout = 60000; // 1 phút

  db.all(`SELECT device_id, last_seen FROM heartbeats`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const devices = rows.map(row => ({
      device_id: row.device_id,
      status: now - row.last_seen < timeout ? 'online' : 'offline',
      last_seen: new Date(row.last_seen).toLocaleString()
    }));

    res.json(devices);
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
