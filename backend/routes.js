require("dotenv").config();
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const pdfParse = require("pdf-parse");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const db = require("./database.js");
const app = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || "default_secret_key";

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

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");
  const { PO, BOM, SL_Board, Creater, TimeStamp } = req.body;
  console.log(req.file)
  // Read Excel file
  const filePath = path.join(__dirname, req.file.path);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // Convert sheet data to JSON
  const data = xlsx.utils.sheet_to_json(sheet);

  // Insert data into SQLite database
  const stmt = db.prepare(
    `INSERT INTO CheckBOM (Description, Manufacturer_1, PartNumber_1, Manufacturer_2, PartNumber_2, Manufacturer_3, PartNumber_3, So_Luong, Bom, SL_Board, PO, Du_Toan_Hao_Phi, Hao_Phi_Thuc_Te, Creater, TimeStamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '0', '0', ?, ?)`
  );
  data.forEach((row) => {
    stmt.run(
      row.Description,
      row.Manufacturer_1,
      row.PartNumber_1,
      row.Manufacturer_2,
      row.PartNumber_2,
      row.Manufacturer_3,
      row.PartNumber_3,
      row.So_Luong,
      BOM,
      SL_Board,
      PO,
      Creater,
      TimeStamp
    );
  });

  stmt.finalize();

  res.send("File processed successfully.");
});


app.post("/Temporary_WareHouse/Upload", upload.single("file"), (req, res) => {
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

  res.send("File processed successfully.");
});

app.post("/Temporary_WareHouse_2/Upload", upload.single("file"), (req, res) => {
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

  res.send("File processed successfully.");
});





// Router upload file xlsx to Project table
app.post("/Project/upload", upload.single("file"), async (req, res) => {
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
      const yearCreated = row["Years"]
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

    res.send("Dữ liệu đã được nhập thành công!");
  } catch (error) {
    console.error("Lỗi trong quá trình nhập liệu:", error);
    if (customerStmt) customerStmt.finalize();
    if (poStmt) poStmt.finalize();
    if (productStmt) productStmt.finalize();
    res.status(500).send("Lỗi khi nhập dữ liệu.");
  }
});



// Upload file và đặt câu hỏi




// Route to fetch all check boms
app.get("/CheckBom/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = await getPivotQuery(id);
    db.all(query, [id], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Không tìm thấy dữ liệu" });
  }
});

// Route to fetch all check boms
app.get("/CheckBom/Bom", async (req, res) => {
  try {
    db.all(
      `SELECT DISTINCT 
      PO AS Tên_dự_án, 
      Bom AS Tên_Bom,  
      COUNT(Bom) AS Số_Lượng_LK, 
      SL_Board AS Số_Lượng_Board 
      FROM CheckBOM 
      GROUP BY PO, Bom`,
      [id],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json(rows);
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Không tìm thấy dữ liệu" });
  }
});

// Route to fetch Detail Bom
app.get("/CheckBom/Detail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    db.all(
      `
      SELECT DISTINCT  PO, Bom, SL_Board 
      FROM CheckBOM 
      WHERE id = ? 
      GROUP BY PO, Bom`,
      [id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// Router delete all Inventory
app.delete("/WareHouse/delete-all", async (req, res) => {
  // Delete data into SQLite database
  const query = `DELETE FROM WareHouse`;
  db.run(query, [], function (err) {
    if (err) {
      return console.error(err.message);
    }
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router delete all Inventory
app.delete("/WareHouse2/delete-all", async (req, res) => {
  // Delete data into SQLite database
  const query = `DELETE FROM WareHouse2`;
  db.run(query, [], function (err) {
    if (err) {
      return console.error(err.message);
    }
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router delete all item in CheckBOM table
app.delete("/CheckBOM/delete-all", async (req, res) => {
  // Delete data into SQLite database
  const query = `DELETE FROM CheckBOM`;
  db.run(query, [], function (err) {
    if (err) {
      return console.error(err.message);
    }
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// 📥 API to Download PO as XLSX
app.get("/Download-PO/:id", async (req, res) => {
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
// 📥 API to Download WareHouse as XLSX
app.get("/Ware-House/download", async (req, res) => {
  try {
    const query = "SELECT * FROM WareHouse";
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Convert data to worksheet
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, `Kho`);

      // Save the file temporarily
      const filePath = path.join(__dirname, `Kho.xlsx`);
      xlsx.writeFile(wb, filePath);

      // Send the file to the client
      res.download(filePath, `Kho.xlsx`, (err) => {
        if (err) console.error("Error sending file:", err);
        fs.unlinkSync(filePath); // Delete after sending
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📥 API to Download WareHouse2 as XLSX
app.get("/Ware-House2/download", async (req, res) => {
  try {
    const query = "SELECT * FROM WareHouse2";
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Convert data to worksheet
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, `Kho_2`);

      // Save the file temporarily
      const filePath = path.join(__dirname, `Kho_2.xlsx`);
      xlsx.writeFile(wb, filePath);

      // Send the file to the client
      res.download(filePath, `Kho_2.xlsx`, (err) => {
        if (err) console.error("Error sending file:", err);
        fs.unlinkSync(filePath); // Delete after sending
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📥 API to Download -Order as XLSX
app.get("/Download-Order/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = await getCompareInventory(id);
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

// 📥 API to Download Project as XLSX
app.get("/Project/download", async (req, res) => {
  try {
    const query = `
      SELECT 
        a.CustomerName AS Tên_khách_hàng,
        b.PONumber,
        b.DateCreated AS Ngày_tạo_PO,
        b.DateDelivery AS Ngày_chuyển_PO,
        c.ProductDetail AS Tên_đơn_hàng,
        c.QuantityProduct AS SL_Tổng,
        c.QuantityDelivered AS SL_Chuyển,
        c.QuantityAmount AS SL_Nợ,
        CASE
          WHEN c.QuantityAmount = 0 THEN 'Hoàn thành'
          WHEN c.QuantityAmount > 0 THEN 'Đang sản xuất'
          ELSE 'Chưa có đơn hàng'
        END AS Trạng_thái
      FROM Customers a
      LEFT JOIN PurchaseOrders b ON a.id = b.CustomerID
      LEFT JOIN ProductDetails c ON b.id = c.POID
      ORDER BY a.CustomerName, b.PONumber`;

    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const wb = xlsx.utils.book_new();
      const sheetData = [];

      // ➕ Tiêu đề
      sheetData.push(["DANH SÁCH DỰ ÁN THEO KHÁCH HÀNG"]);
      sheetData.push([]);

      let currentCustomer = "";
      let currentPO = "";

      rows.forEach((row) => {
        const customer = row["Tên_khách_hàng"];
        const po = row.PONumber;

        if (customer !== currentCustomer) {
          currentCustomer = customer;
          currentPO = "";

          sheetData.push([`Tên khách hàng: ${customer}`]);
        }

        if (po !== currentPO) {
          currentPO = po;
          sheetData.push([
            `  PONumber: ${row.PONumber}`,
            `Ngày tạo: ${row["Ngày_tạo_PO"]}`,
            `Ngày chuyển: ${row["Ngày_chuyển_PO"]}`
          ]);
        }

        sheetData.push([
          `    - ${row["Tên_đơn_hàng"]}`,
          `SL Tổng: ${row["SL_Tổng"]}`,
          `SL Chuyển: ${row["SL_Chuyển"]}`,
          `SL Nợ: ${row["SL_Nợ"]}`,
          `Trạng thái: ${row["Trạng_thái"]}`
        ]);
      });

      const ws = xlsx.utils.aoa_to_sheet(sheetData);
      xlsx.utils.book_append_sheet(wb, ws, "Dự_án");

      const filePath = path.join(__dirname, "Du_an_theo_customer.xlsx");
      xlsx.writeFile(wb, filePath);

      res.download(filePath, "Du_an_theo_customer.xlsx", (err) => {
        if (err) console.error("Lỗi gửi file:", err);
        fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 📥 API to Download Project detail as XLSX
app.get("/Project-Detail/download/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        a.CustomerName AS Tên_khách_hàng,
        b.PONumber AS Số_PO,
        b.DateCreated AS Ngày_tạo_PO,
        b.DateDelivery AS Ngày_chuyển_PO,
        c.ProductDetail AS Tên_đơn_hàng,
        c.QuantityProduct AS SL_Tổng,
        c.QuantityDelivered AS SL_Chuyển,
        c.QuantityAmount AS SL_Nợ,
        CASE
          WHEN c.QuantityAmount = 0 THEN 'Hoàn thành'
          WHEN c.QuantityAmount > 0 THEN 'Đang sản xuất'
          ELSE 'Chưa có đơn hàng'
        END AS Trạng_thái
      FROM Customers a
      LEFT JOIN PurchaseOrders b ON a.id = b.CustomerID
      LEFT JOIN ProductDetails c ON b.id = c.POID
      WHERE a.id = ?
      ORDER BY b.PONumber`;

    db.all(query, [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const sheetData = [];

      if (rows.length === 0) {
        sheetData.push(["Không có dữ liệu cho khách hàng này."]);
      } else {
        const customerName = rows[0]["Tên_khách_hàng"];
        sheetData.push(["", "", `CHI TIẾT DỰ ÁN CỦA KHÁCH HÀNG: ${customerName.toUpperCase()}`]);
        sheetData.push([]);

        let currentPO = "";

        rows.forEach((row, index) => {
          const po = row["Số_PO"];

          if (po !== currentPO) {
            currentPO = po;
            sheetData.push([
              `Số PO: ${row["Số_PO"]}`,
              `Ngày tạo: ${row["Ngày_tạo_PO"]}`,
              `Ngày chuyển: ${row["Ngày_chuyển_PO"]}`
            ]);
          }

          sheetData.push([
            `  - ${row["Tên_đơn_hàng"]}`,
            `SL Tổng: ${row["SL_Tổng"]}`,
            `SL Chuyển: ${row["SL_Chuyển"]}`,
            `SL Nợ: ${row["SL_Nợ"]}`,
            `Trạng thái: ${row["Trạng_thái"]}`
          ]);
        });
      }

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet(sheetData);
      xlsx.utils.book_append_sheet(wb, ws, "Chi_tiết_dự_án");

      const filePath = path.join(__dirname, "Chi_tiet_du_an.xlsx");
      xlsx.writeFile(wb, filePath);

      res.download(filePath, "Chi_tiet_du_an.xlsx", (err) => {
        if (err) console.error("Lỗi gửi file:", err);
        fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Router login user
app.post("/Users/login", (req, res) => {
  const { Username, Password } = req.body;

  db.get(`SELECT * FROM Users WHERE Username = ?`, [Username], (err, user) => {
    if (err || !user)
      return res.status(400).json({ error: "Tài khoản không tồn tại" });

    bcrypt.compare(Password, user.Password, (err, result) => {
      if (result) {
        const token = jwt.sign(
          { id: user.id, Username: user.Username },
          SECRET_KEY,
          { expiresIn: "1h" }
        );
        res.json({ message: "Đăng nhập thành công", token });
      } else {
        res.status(401).json({ error: "Sai mật khẩu" });
      }
    });
  });
});

// Router to fetch all users
app.get("/All-Users", async (req, res) => {
  try {
    db.all(`SELECT * FROM Users ORDER BY Username DESC`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Router to get detail user
app.get("/All-Users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    db.all(`SELECT * FROM Users WHERE Username = ?`, [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to fetch Project
app.get("/Project", async (req, res) => {
  try {
    const query = `
      SELECT * 
      FROM Project 
      ORDER BY Customers ASC
    `;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📥 API to Download PO as XLSX
app.get("/Project/Customer/Orders/Download/:id", async (req, res) => {
  const { id } = req.params;
  const NameExcel = req.query.filename;
  try {
    // Loại bỏ hoặc thay thế các ký tự không hợp lệ trong NameExcel
    const invalidChars = /[:\\/?*[\]]/g;
    const safeNameExcel = NameExcel.replace(invalidChars, "_");
    const query = `SELECT * FROM ProductDetails WHERE POID = ?`
    db.all(query, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Convert data to worksheet
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, `${safeNameExcel}`);

      // Save the file temporarily
      const filePath = path.join(__dirname, `${safeNameExcel}.xlsx`);
      xlsx.writeFile(wb, filePath);

      // Send the file to the client
      res.download(filePath, `${safeNameExcel}.xlsx`, (err) => {
        if (err) console.error("Error sending file:", err);
        fs.unlinkSync(filePath); // Delete after sending
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Router delete all item in Customers table
app.delete("/Project/delete-all", async (req, res) => {
  // Delete data into SQLite database
  const query = `DELETE FROM Customers`;
  db.run(query, [], function (err) {
    if (err) {
      return console.error(err.message);
    }
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// // Router upload file xlsx to WareHouse table
// app.post("/WareHouse/Upload", upload.single("file"), async (req, res) => {
//   if (!req.file) return res.status(400).send("No file uploaded.");

//   // Read Excel file
//   const filePath = path.join(__dirname, req.file.path);
//   const workbook = xlsx.readFile(filePath);
//   const sheetName = workbook.SheetNames[0];
//   const sheet = workbook.Sheets[sheetName];

//   // Convert sheet data to JSON
//   const data = xlsx.utils.sheet_to_json(sheet);

//   try {
//     // Process each row sequentially
//     for (const row of data) {
//       // Check if PartNumber_1 exists first
//       const existingRow = await new Promise((resolve, reject) => {
//         db.get(
//           "SELECT * FROM WareHouse WHERE PartNumber_1 = ?",
//           [row.PartNumber_1],
//           (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           }
//         );
//       });

//       if (existingRow) {
//         // Update existing row
//         await new Promise((resolve, reject) => {
//           const updateStmt = db.prepare(
//             "UPDATE WareHouse SET Input = Input + ?, Inventory = Inventory + ? WHERE PartNumber_1 = ?"
//           );
//           updateStmt.run(
//             row.Input || 0,
//             row.Inventory || 0,
//             row.PartNumber_1,
//             (err) => {
//               updateStmt.finalize();
//               if (err) reject(err);
//               else resolve();
//             }
//           );
//         });
//       } else {
//         // Insert new row
//         await new Promise((resolve, reject) => {
//           const insertStmt = db.prepare(
//             "INSERT INTO WareHouse (Description, PartNumber_1, PartNumber_2, Input, Output, Inventory, Customer, Location, Note, Note_Output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
//           );
//           insertStmt.run(
//             row.Description || '',
//             row.PartNumber_1,
//             row.PartNumber_2 || '',
//             row.Input || 0,
//             row.Output || 0,
//             row.Inventory || 0,
//             row.Customer || '',
//             row.Location || '',
//             row.Note || '',
//             row.Note_Output || '',
//             (err) => {
//               insertStmt.finalize();
//               if (err) reject(err);
//               else resolve();
//             }
//           );
//         });
//       }
//     }

//     res.send("File processed successfully.");
//   } catch (error) {
//     console.error("Error processing file:", error);
//     res.status(500).send("Error processing file: " + error.message);
//   }
// });

// 📥 API to Download AOI data as XLSX
app.get("/Download-AOI/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = "SELECT * FROM AOIDetails WHERE ManufactureID = ?";
    db.all(query, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Convert data to worksheet
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, `AOI_Details`);

      // Save the file temporarily
      const filePath = path.join(__dirname, `AOI_${id}.xlsx`);
      xlsx.writeFile(wb, filePath);

      // Send the file to the client
      res.download(filePath, `AOI_${id}.xlsx`, (err) => {
        if (err) console.error("Error sending file:", err);
        fs.unlinkSync(filePath); // Delete after sending
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
