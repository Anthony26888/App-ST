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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

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


// Router delete all Inventory
app.delete("/api/WareHouse/delete-all", async (req, res) => {
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
app.delete("/api/WareHouse2/delete-all", async (req, res) => {
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
app.delete("/api/CheckBOM/delete-all", async (req, res) => {
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


// 📥 API to Download WareHouse as XLSX
app.get("/api/Ware-House/download", async (req, res) => {
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
app.get("/api/Ware-House2/download", async (req, res) => {
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
app.get("/api/Download-Order/:id", async (req, res) => {
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
app.get("/api/Project/download", async (req, res) => {
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
app.get("/api/Project-Detail/download/:id", async (req, res) => {
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


// 📥 API to Download -Order as XLSX
app.get("/api/PickPlace/download/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
                      SELECT 
                          p.designator,
                          b.mpn,
                          p.layer,
                          p.x,
                          p.y,
                          p.rotation 
                      FROM Pickplace p
                      LEFT JOIN Bom b
                          ON p.designator = b.designator
                        AND p.project_id = b.project_id
                      WHERE p.project_id = ?`;

    db.all(query, [id], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Convert data to worksheet
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, `pickp&place`);

      // Save the file temporarily
      const filePath = path.join(__dirname, `pick&place.xlsx`);
      xlsx.writeFile(wb, filePath);

      // Send the file to the client
      res.download(filePath, `pick&place.xlsx`, (err) => {
        if (err) console.error("Error sending file:", err);
        fs.unlinkSync(filePath); // Delete after sending
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Router login user
app.post("/api/Users/login", (req, res) => {
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


// Router to get detail user
app.get("/api/All-Users/:id", async (req, res) => {
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

// 📥 API to Download PO as XLSX
app.get("/api/Project/Customer/Orders/Download/:id", async (req, res) => {
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
app.delete("/api/Project/delete-all", async (req, res) => {
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

// Router delete all item in Manufacture table
app.delete("/api/Manufacture/delete-all", async (req, res) => {
  // Delete data into SQLite database
  const query = `DELETE FROM PlanManufacture`;
  db.run(query, [], function (err) {
    if (err) {
      return console.error(err.message);
    }
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router delete all item in Summary table
app.delete("/api/Summary/delete-all", async (req, res) => {
  // Delete data into SQLite database
  const query = `DELETE FROM Summary`;
  db.run(query, [], function (err) {
    if (err) {
      return console.error(err.message);
    }
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router delete all item in Maintenance table
app.delete("/api/Maintenance/delete-all", async (req, res) => {
  // Delete data into SQLite database
  const query = `DELETE FROM Maintenance`;
  db.run(query, [], function (err) {
    if (err) {
      return console.error(err.message);
    }
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router delete all item in PickPlace table
app.delete("/api/FilterBom/delete-all", async (req, res) => {
  // Delete data into SQLite database
  const query = `DELETE FROM FilterBom`;
  db.run(query, [], function (err) {
    if (err) {
      return console.error(err.message);
    }
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Tạo router download
app.get("/api/download-db", (req, res) => {
  const filePath = path.join(__dirname, "./database.db");

  // Kiểm tra file tồn tại trước khi gửi
  if (!fs.existsSync(filePath)) {
    console.error("❌ database.db không tồn tại:", filePath);
    return res.status(404).send("Không tìm thấy file database.");
  }

  console.log("📤 Gửi file:", filePath);
  res.download(filePath, "database.db", (err) => {
    if (err) {
      console.error("❌ Lỗi khi gửi file:", err);
      if (!res.headersSent) res.status(500).send("Không thể tải file.");
    }
  });
});

// 📥 API to Download AOI data as XLSX
app.get("/api/Download-AOI/:id", async (req, res) => {
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
