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
      Note TEXT
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
          POID TEXT,
          ProductDetail TEXT,
          QuantityProduct INTEGER,
          QuantityDelivered INTEGER,
          QuantityAmount INTEGER,
          CustomerID INTEGER,
          Note,
          FOREIGN KEY (CustomerID) REFERENCES Customers(id) ON DELETE CASCADE
      )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ScheduleDelivery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ItemId INTEGER NOT NULL,
      DeliveryDate TEXT,
      DeliveryQuantity INTEGER NOT NULL,
      DeliveryStatus TEXT,
      FOREIGN KEY(ItemId) REFERENCES ProductDetails(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS NotificationReadStatus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_id INTEGER NOT NULL,
      read_at INTEGER DEFAULT (strftime('%s', 'now', 'localtime')),
      UNIQUE(notification_id)
    )
  `);
// XÓA VIEW CŨ
  db.run(`DROP VIEW IF EXISTS vw_NotificationDelivery`);

    // TẠO VIEW - CHỈ THÔNG BÁO KHI SẮP ĐẾN HẠN (3-2-1-0 NGÀY)
  db.run(`
      CREATE VIEW vw_NotificationDelivery AS
      SELECT 
        sd.id,
        sd.ItemId,
        CASE 
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) < 0 
            THEN 'ĐÃ QUÁ HẠN GỬI HÀNG'
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 0 
            THEN 'ĐÃ ĐẾN HẠN GỬI HÔM NAY'
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 1 
            THEN 'SẮP ĐẾN HẠN NGÀY MAI'
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 2 
            THEN 'Nhắc nhở: Còn 2 ngày giao hàng'
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 3 
            THEN 'Nhắc nhở: Còn 3 ngày giao hàng'
          ELSE NULL
        END AS Title,
        pd.POID || ' - ' || pd.ProductDetail AS Message,
        sd.DeliveryQuantity AS Quantity,
        CASE 
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) < 0 
            THEN 'mdi-alert-circle'
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 0 
            THEN 'mdi-alert-circle'
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 1 
            THEN 'mdi-clock-alert'
          ELSE 'mdi-calendar-alert'
        END AS Icon,
        CASE 
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) < 0 
            THEN 'error'
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 0 
            THEN 'error'
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 1 
            THEN 'warning'
          ELSE 'orange'
        END AS Color,
        CASE 
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) < 0 
            THEN 'Quá hạn'
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 0 
            THEN 'Đã đến hạn'
          WHEN CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 1 
            THEN 'Ngày mai'
          ELSE 'Sắp tới'
        END AS Status,
        CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) AS DaysRemaining,
        sd.DeliveryDate,
        sd.DeliveryQuantity,
        sd.DeliveryStatus,
        CASE WHEN nrs.notification_id IS NOT NULL THEN 1 ELSE 0 END AS IsRead
      FROM ScheduleDelivery sd
      LEFT JOIN NotificationReadStatus nrs ON sd.id = nrs.notification_id
      LEFT JOIN ProductDetails pd ON sd.ItemId = pd.id
      WHERE sd.DeliveryStatus = 'Chưa giao'
        AND CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) <= 3
      ORDER BY CAST((sd.DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) ASC;
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
      LoaiBaoTri TEXT NOT NULL,
      MoTaLoi TEXT,
      BienPhapKhacPhuc TEXT,
      PhuongAn TEXT,
      PhuTung TEXT,
      NguoiTao TEXT,
      NguoiThucHien TEXT,
      ChiPhi REAL,
      NgayHoanThanh DATE,
      TrangThai TEXT,
      FOREIGN KEY (MaThietBi) REFERENCES Machine(MaThietBi) ON DELETE CASCADE
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
      FOREIGN KEY (MaThietBi) REFERENCES Machine(MaThietBi) ON DELETE CASCADE
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
      FOREIGN KEY (MaBaoTri) REFERENCES Maintenance(MaBaoTri) ON DELETE CASCADE,
      FOREIGN KEY (MaThietBi) REFERENCES Machine(MaThietBi) ON DELETE CASCADE
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
      FOREIGN KEY (PlanID) REFERENCES PlanManufacture(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ManufactureCounting (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      HistoryID INTEGER NOT NULL,
      PartNumber TEXT NOT NULL,
      Status TEXT NOT NULL,
      GroupFail TEXT NOT NULL,
      Status_Fixed TEXT NULL,
      Timestamp TEXT NOT NULL,
      RWID TEXT,
      TimestampRW TEXT,
      Note TEXT,
      Note_RW TEXT,
      PlanID INTEGER,
      Type TEXT,
      FOREIGN KEY (HistoryID) REFERENCES Summary(id) ON DELETE CASCADE
      FOREIGN KEY (PlanID) REFERENCES PlanManufacture(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      PlanID INTEGER NOT NULL,
      Type TEXT NOT NULL,
      PONumber TEXT NOT NULL,
      Category TEXT,
      Line_SMT TEXT,
      Quantity_Plan INTEGER,
      CycleTime_Plan INTEGER,
      Time_Plan INTEGER,
      Note TEXT,
      Created_At TEXT, 
      Surface TEXT,
      FOREIGN KEY (PlanID) REFERENCES PlanManufacture(id) ON DELETE CASCADE
    )
  `);

  // Bảng FilterBom
  db.run(`
    CREATE TABLE IF NOT EXISTS FilterBom (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT,
      created_at TEXT,
      note TEXT,
      flipX_top TEXT,
      flipY_top TEXT,
      swapXY_top TEXT,
      cx_top REAL,
      cy_top REAL,
      rotation_top INTERGER,
      rotationSVG_top INTERGER,
      manualOffsetX_top REAL,
      manualOffsetY_top REAL,
      labelAngle_top INTERGER,
      componentBodyAngle_top INTERGER,
      flipX_bottom TEXT,
      flipY_bottom TEXT,
      swapXY_bottom TEXT,
      cx_bottom REAL,
      cy_bottom REAL,
      rotation_bottom INTERGER,
      rotationSVG_bottom INTERGER,
      manualOffsetX_bottom REAL,
      manualOffsetY_bottom REAL,
      labelAngle_bottom INTERGER,
      componentBodyAngle_bottom INTERGER,
      panel_frame_X INTERGER,
      panel_frame_Y INTERGER
    )
  `);

  // Bảng Bom
  db.run(`
    CREATE TABLE IF NOT EXISTS Bom (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      mpn TEXT,
      designator TEXT,
      quantity INTEGER,
      project_id INTERGER,
      FOREIGN KEY (project_id) REFERENCES FilterBom(id) ON DELETE CASCADE
    )
  `);

  // Bảng Pick & Place
  db.run(`
    CREATE TABLE IF NOT EXISTS Pickplace (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      designator TEXT,
      layer TEXT,
      x REAL,
      y REAL,
      rotation REAL,
      type TEXT,
      project_id INTERGER,
      FOREIGN KEY (project_id) REFERENCES FilterBom(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS GerberData (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      layer TEXT,
      svg TEXT,
      filename TEXT,
      unit TEXT,
      format TEXT,
      project_id INTERGER,
      FOREIGN KEY (project_id) REFERENCES FilterBom(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS Components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,      
      package TEXT,     
      width REAL,         
      length REAL   
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS Component_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mpn TEXT UNIQUE,
      width REAL,
      length REAL,
      package TEXT
    );
  `);


  db.run(`
    CREATE TABLE IF NOT EXISTS heartbeats (
      device_id TEXT PRIMARY KEY,
      last_seen INTEGER
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      delay INTEGER DEFAULT 0,
      line INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sent_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT,
      FullName TEXT,
      Password TEXT,
      Level TEXT,
      Date TEXT,
      Email TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS UsersCustomer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT,
      FullName TEXT,
      Password TEXT,
      Customer TEXT,
      Date TEXT
    )
  `);
});
module.exports = db;
