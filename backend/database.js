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
      PO TEXT,
      Creater Text,
      TimeStamp TEXT
    )`);


  db.run(`CREATE TABLE IF NOT EXISTS DetailOrders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Description TEXT,
      Manufacturer_1 TEXT,
      PartNumber_1 TEXT,
      Manufacturer_2 TEXT,
      PartNumber_2 TEXT,
      Manufacturer_3 TEXT,
      PartNumber_3 TEXT,
      So_Luong INTEGER,
      SL_Board TEXT,
      Du_Toan_Hao_Phi INTEGER,
      Hao_Phi_Thuc_Te INTEGER,
      SL_Tồn_Kho,
      SL_Tồn_Kho_Misa,
      Ma_Kho TEXT,
      Ma_Kho_Misa TEXT,
      Bom TEXT,
      PO TEXT,
      Order_Id INTEGER,
      FOREIGN KEY (Order_Id) REFERENCES Orders(id) ON DELETE CASCADE   
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
  db.run(`CREATE TABLE IF NOT EXISTS Temporary_WareHouse (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Description TEXT,
      PartNumber_1 TEXT,
      Input INTEGER,
      Location TEXT,
      Note TEXT
    )`);
  db.run(`CREATE TABLE IF NOT EXISTS Temporary_WareHouse_2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Description TEXT,
      PartNumber_1 TEXT,
      Input INTEGER,
      Location TEXT,
      Note TEXT
    )`);
  db.run(`CREATE TABLE IF NOT EXISTS WareHouseLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ActionType TEXT,
      PartNumber TEXT,
      Quantity INTEGER,
      Updated_by TEXT,
      Created_at TEXT,
      Customer TEXT,
      Location TEXT,
      Note TEXT
    )`);
  db.run(`CREATE TABLE IF NOT EXISTS WareHouse2Log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ActionType TEXT,
      PartNumber TEXT,
      Quantity TEXT,
      Updated_by TEXT,
      Created_at TEXT,
      Customer TEXT,
      Location TEXT,
      Note TEXT
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
  db.run(`CREATE TABLE IF NOT EXISTS Customers (
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
          Note TEXT,
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
          Note,
          FOREIGN KEY (POID) REFERENCES PurchaseOrders(id) ON DELETE CASCADE
          FOREIGN KEY (CustomerID) REFERENCES Customers(id) ON DELETE CASCADE
      )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS Machine (
      MaThietBi INTEGER PRIMARY KEY AUTOINCREMENT,
      TenThietBi TEXT NOT NULL,
      LoaiThietBi TEXT,
      NhaSanXuat TEXT,
      NgayMua DATE,
      ViTri TEXT,
      MoTa TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS Maintenance (
      MaBaoTri INTEGER PRIMARY KEY AUTOINCREMENT,
      MaThietBi INTEGER NOT NULL,
      NgayBaoTri DATE NOT NULL,
      LoaiBaoTri TEXT NOT NULL, -- Ví dụ: Bảo trì định kỳ, Sửa chữa, Thay thế
      MoTaLoi TEXT,
      BienPhapKhacPhuc TEXT,
      PhuongAn TEXT,
      PhuTung TEXT,
      NguoiTao TEXT,
      NguoiThucHien TEXT,
      ChiPhi REAL,
      NgayHoanThanh DATE,
      TrangThai TEXT, -- Ví dụ: Đã hoàn thành, Đang thực hiện, Chờ phê duyệt
      FOREIGN KEY (MaThietBi) REFERENCES Machine(MaThietBi)
  )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS MaintenanceSchedule (
      MaLich INTEGER PRIMARY KEY AUTOINCREMENT,
      MaThietBi INTEGER NOT NULL,
      LoaiBaoTri TEXT NOT NULL,
      ChuKyBaoTri INTEGER NOT NULL, -- Ví dụ: 3 (tháng), 6 (tháng), 12 (tháng)
      DonViChuKy TEXT NOT NULL, -- Ví dụ: Tháng, Năm
      NgayBatDau DATE NOT NULL,
      NgayBaoTriTiepTheo DATE,
      GhiChu TEXT,
      FOREIGN KEY (MaThietBi) REFERENCES Machine(MaThietBi)
  )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS SparePartUsage (
      MaSuDung INTEGER PRIMARY KEY AUTOINCREMENT,
      MaBaoTri INTEGER NOT NULL,
      MaThietBi INTEGER NOT NULL,
      TenPhuTung TEXT NOT NULL,
      SoLuongSuDung INTEGER NOT NULL,
      DonVi TEXT NOT NULL,
      GhiChu TEXT,
      FOREIGN KEY (MaBaoTri) REFERENCES Maintenance(MaBaoTri),
      FOREIGN KEY (MaThietBi) REFERENCES Machine(MaThietBi)
  )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS PlanManufacture (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ProjectID INTEGER,
      Name TEXT,
      Name_Order TEXT,
      Total INTEGER,
      DelaySMT INTEGER,
      Quantity INTEGER,
      Quantity_AOI INTEGER,
      Quantity_IPQCSMT INTEGER,
      Quantity_IPQC INTEGER,
      Quantity_Assembly INTEGER,
      Quantity_BoxBuild INTEGER,
      Quantity_ConformalCoating INTEGER,
      Quantity_OQC INTEGER,
      Quantity_Test1 INTEGER,
      Quantity_Test2 INTEGER,
      Level INTEGER,
      Date TEXT,
      Note TEXT,
      Creater TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureSMT (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber INTEGER NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      Status TEXT,
      PlanID INTEGER,
      Note TEXT,
      Source TEXT,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureAOI (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      Note TEXT,
      PlanID INTEGER,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureIPQC (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      Note TEXR,
      PlanID INTEGER,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureAssembly (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      PlanID INTEGER,
      Note TEXT,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureOQC (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      Note TEXT,
      PlanID INTEGER,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureIPQCSMT (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      Note TEXT,
      PlanID INTEGER,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureTest1 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      Note TEXT,
      PlanID INTEGER,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureTest2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      PlanID INTEGER,
      Note TEXT,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureBoxBuild (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      PlanID INTEGER,
      Note TEXT,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureConformalCoating (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      PlanID INTEGER,
      Note TEXT,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureWarehouse (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      PlanID INTEGER,
      Note TEXT,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      PlanID INTEGER NOT NULL,
      Type TEXT NOT NULL,
      PONumber TEXT NOT NULL,
      Category TEXT,
      Quantity_Plan INTEGER,
      CycleTime_Plan INTEGER,
      Time_Plan INTEGER,
      Note TEXT,
      Created_At TEXT, 
      FOREIGN KEY (PlanID) REFERENCES PlanManufacture(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS heartbeats (
      device_id TEXT PRIMARY KEY,
      last_seen INTEGER
    )
  `);

});
module.exports = db;
