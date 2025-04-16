const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Đã kết nối đến cơ sở dữ liệu SQLite.");
    db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
      if (pragmaErr) {
        console.error("Lỗi khi bật hỗ trợ khóa ngoại:", pragmaErr.message);
      } else {
        console.log("Hỗ trợ khóa ngoại đã được bật.");
        // Tiếp tục tạo bảng và thực hiện các thao tác khác
      }
    });
  }
});

// Create table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS CheckBOM (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Description TEXT,
      Manufacturer_1 TEXT,
      PartNumber_1 TEXT,
      Manufacturer_2 TEXT,
      PartNumber_2 TEXT,
      Manufacturer_3 TEXT,
      PartNumber_3 TEXT,
      So_Luong INTEGER,
      Du_Toan_Hao_Phi INTEGER,
      Hao_Phi_Thuc_Te INTEGER,
      Bom TEXT,
      SL_Board TEXT,
      PO TEXT
    )`);
  db.run(`CREATE TABLE IF NOT EXISTS WareHouse (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Description TEXT,
      PartNumber_1 TEXT,
      PartNumber_2 TEXT,
      Input INTEGER,
      Output INTEGER,
      Inventory INTEGER,
      Customer TEXT,
      Location TEXT,
      Note TEXT,
      Note_Output TEXT
    )`);
  db.run(`CREATE TABLE IF NOT EXISTS WareHouse2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Description TEXT,
      PartNumber_1 TEXT,
      PartNumber_2 TEXT,
      Input INTEGER,
      Output INTEGER,
      Inventory INTEGER,
      Customer TEXT,
      Location TEXT,
      Note TEXT,
      Note_Output TEXT
    )`);
  db.run(`CREATE TABLE IF NOT EXISTS Orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name_PO TEXT,
      Quantity_Type INTEGER,
      Quantity_Items INTEGER,
      Status TEXT,
      Date TEXT,
      Creater Text
    )`);
  db.run(`CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT,
      FullName TEXT,
      Password TEXT,
      Level TEXT,
      Date TEXT,
      Email TEXT
    )`);
  db.run(`
      CREATE TABLE IF NOT EXISTS Customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          CustomerName TEXT UNIQUE,
          Years INTEGER
      )
  `);

  db.run(`
      CREATE TABLE IF NOT EXISTS PurchaseOrders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          PONumber TEXT UNIQUE,
          CustomerID INTEGER,
          DateCreated TEXT,
          DateDelivery TEXT,
          FOREIGN KEY (CustomerID) REFERENCES Customers(id) ON DELETE CASCADE
      )
  `);

  db.run(`
      CREATE TABLE IF NOT EXISTS ProductDetails (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          POID INTEGER,
          ProductDetail TEXT,
          QuantityProduct INTEGER,
          QuantityDelivered INTEGER,
          QuantityAmount INTEGER,
          CustomerID INTEGER,
          FOREIGN KEY (POID) REFERENCES PurchaseOrders(id) ON DELETE CASCADE
          FOREIGN KEY (CustomerID) REFERENCES Customers(id) ON DELETE CASCADE
      )
  `);
});
module.exports = db;
