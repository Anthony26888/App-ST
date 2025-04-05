require("dotenv").config();
const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
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
  const { PO,BOM,SL_Board } = req.body;
  // Read Excel file
  const filePath = path.join(__dirname, req.file.path);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet data to JSON
  const data = xlsx.utils.sheet_to_json(sheet);

  // Insert data into SQLite database
  const stmt = db.prepare(
    `INSERT INTO CheckBOM (Description, Manufacturer_1, PartNumber_1, Manufacturer_2, PartNumber_2, Manufacturer_3, PartNumber_3, So_Luong, Bom, SL_Board, PO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      PO
    );
  });

  stmt.finalize();

  res.send("File processed successfully.");
});

// Router upload file xlsx to WareHouse table
app.post("/upload-inventory", upload.single("file"), (req, res) => {
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
    "INSERT INTO WareHouse (Description, PartNumber_1, PartNumber_2, Input, Output, Inventory, Customer, Location, Note, Note_Output) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  data.forEach((row) => {
    stmt.run(
      row.Description,
      row.PartNumber_1,
      row.PartNumber_2,
      row.Input,
      row.Output,
      row.Inventory,
      row.Customer,
      row.Location,
      row.Note,
      row.Note_Output
    );
  });
  stmt.finalize();

  res.send("File processed successfully.");
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
            `SUM(CASE WHEN Bom = '${Boms.Bom}' THEN (So_Luong * SL_Board) ELSE 0 END) AS [${Boms.Bom}]`
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
            IFNULL(SUM(So_Luong * SL_Board), 0) AS SL_Tổng,
            IFNULL(SUM(SL_Board), 0) AS SL_Board
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
            `SUM(CASE WHEN c.Bom = '${Boms.Bom}' THEN (c.So_Luong * c.SL_Board) ELSE 0 END) AS [${Boms.Bom}]`
        ).join(", ");
        const Buy = `
          CASE 
            WHEN (SUM(c.So_Luong * c.SL_Board) + SUM(IFNULL(c.Du_Toan_Hao_Phi, 0))) > IFNULL(i.Inventory, 0) 
            THEN (SUM(c.So_Luong * c.SL_Board) + SUM(IFNULL(c.Du_Toan_Hao_Phi, 0)) - IFNULL(i.Inventory, 0)) 
            ELSE 0 
          END AS SL_Cần_Mua
        `;
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
            SUM(c.So_Luong * c.SL_Board) AS SL_Tổng,
            IFNULL(c.SL_Board, 0) AS SL_Board,
            IFNULL(c.Du_Toan_Hao_Phi, 0) AS Dự_Toán_Hao_Phí,
            IFNULL(c.Hao_Phi_Thuc_Te, 0) AS Hao_Phí_Thực_Tế,
            IFNULL(i.Inventory, 0) AS SL_Tồn_Kho,
            ${Buy},
            c.id AS id
          FROM CheckBOM c
          LEFT JOIN WareHouse i 
            ON c.PartNumber_1 = i.PartNumber_1 
          WHERE c.PO = ?
          GROUP BY c.PartNumber_1;
        `;
        resolve(query);
      }
    );
  });
};


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

// Route to fetch all inventory
app.get("/Inventory", async (req, res) => {
  try {
    db.all(`SELECT * FROM WareHouse`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Route to fetch detail WareHouse
app.get("/Inventory/:id", async (req, res) => {
  const { id } = req.params;
  try {
    db.all(`SELECT * FROM WareHouse WHERE id = ?`, [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Route to fetch all orders
app.get("/Orders", async (req, res) => {
  try {
    db.all(`SELECT * FROM Orders ORDER BY Date DESC`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to fetch all orders
app.get("/Orders/Detail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    db.all(`SELECT * FROM Orders WHERE id =?`, [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to fetch detail Orders
app.get("/Orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const query = await getCompareInventory(id);
    db.all(query, [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get infomation Orders
app.get("/Orders/Information/:id", async (req, res) => {
  const { id } = req.params;
  try {
    db.all(`SELECT * FROM Orders WHERE Name_PO = ?`, [id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Router update Hao_Phi in CheckBom table
app.put("/CheckBom/Update-Hao-Phi", async (req, res) => {
  const { Input_Hao_Phi, Name_Item } = req.body;
  // Insert data into SQLite database
  const query = `UPDATE CheckBOM SET Du_Toan_Hao_Phi = ? WHERE id = ?`;
  db.run(query, [Input_Hao_Phi, Name_Item], function (err) {
    if (err) {
      return console.error(err.message);
    }
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router update Hao_Phi_Thuc_Te in CheckBom table
app.put("/CheckBom/Update-Hao-Phi-Thuc-Te", async (req, res) => {
  const { Input_Hao_Phi_Thuc_Te, Name_Item } = req.body;
  // Insert data into SQLite database
  const query = `UPDATE CheckBOM SET Hao_Phi_Thuc_Te = ? WHERE PartNumber_1 = ?`;
  db.run(query, [Input_Hao_Phi_Thuc_Te, Name_Item], function (err) {
    if (err) {
      return console.error(err.message);
    }
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
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});

// Router update WareHouse accept
app.put("/Inventory/update-Inventory-CheckBom/:id", async (req, res) => {
  const { id } = req.params.id;
  // Insert data into SQLite database
  const query = `
    UPDATE WareHouse
    SET Inventory = 
      CASE 
        WHEN Inventory > (CheckBOM.So_Luong * CheckBOM.SL_Board) - IFNULL(Hao_Phi_Thuc_Te, 0)
        THEN Inventory - (CheckBOM.So_Luong * CheckBOM.SL_Board) - IFNULL(Hao_Phi_Thuc_Te, 0)
        ELSE 0
      END
    FROM CheckBOM
    WHERE CheckBOM.PartNumber_1 = WareHouse.PartNumber_1 AND CheckBOM.PO = ?
  `;
  db.all(query, [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    // Broadcast the new message to all clients
    res.json({ message: "Item inserted successfully" });
  });
});


// Router delete all Inventory
app.delete("/Inventory/delete-all", async (req, res) => {
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

// Router delete CheckBOM follow Name PO
app.delete("/CheckBOM/Delete-item/:id", async (req, res) => {
  const { id } = req.params;
  // Delete data into SQLite database
  const query = `DELETE FROM CheckBOM WHERE PO = ?`;
  db.run(query, [id], function (err) {
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




// 📥 API to Download Bom as XLSX
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
// 📥 API to Download Inventory as XLSX
app.get("/Download-Inventory", async (req, res) => {
  try {
    const query = "SELECT * FROM WareHouse";
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Convert data to worksheet
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, `Tồn_Kho`);

      // Save the file temporarily
      const filePath = path.join(__dirname, `Tồn_Kho.xlsx`);
      xlsx.writeFile(wb, filePath);

      // Send the file to the client
      res.download(filePath, `Tồn_Kho.xlsx`, (err) => {
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

module.exports = app;
