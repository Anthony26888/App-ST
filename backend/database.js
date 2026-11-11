const sqlite3 = require("sqlite3").verbose();
// DB_PATH cho phép chạy stack test với file DB riêng (VD: database.test.db)
const DB_PATH = process.env.DB_PATH || "./database.db";
console.log(`[DB] using file: ${DB_PATH}`);
const db = new sqlite3.Database(DB_PATH, (err) => {
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
      License TEXT DEFAULT 'Starter',
      LicenseKey TEXT,
      LicenseExpiry TEXT,
      ProjectCount INTEGER DEFAULT 0,
      Date TEXT,
      Email TEXT
    )`);
  db.run(`CREATE TABLE IF NOT EXISTS Sessions (
      Username TEXT PRIMARY KEY,
      Token TEXT,
      CreatedAt TEXT
    )`);
  // Username duy nhất: chống đăng nhập nhầm + license gán nhầm user
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON Users(Username)`, (err) => {
    // Nếu err => index đã tồn tại hoặc có dữ liệu trùng cũ, bỏ qua (log để xử lý tay)
    if (err) console.error("Username unique index:", err.message);
  });
  // Bootstrap admin bất tử: DB bị xóa/trắng mà thiếu Admin thì tự dựng lại
  // từ biến môi trường (không hardcode mật khẩu trong code/git).
  // Cần trong backend/.env: BOOTSTRAP_ADMIN_USER + BOOTSTRAP_ADMIN_PASSWORD
  try {
    require("dotenv").config();
  } catch {
    /* dotenv optional */
  }
  db.get(`SELECT COUNT(*) AS c FROM Users WHERE Level = 'Admin'`, (err, row) => {
    if (err) return console.error("Bootstrap admin check:", err.message);
    if (row && row.c > 0) return; // đã có Admin, không đụng vào
    const bu = process.env.BOOTSTRAP_ADMIN_USER;
    const bp = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    if (!bu || !bp) {
      return console.log("[Bootstrap] thiếu Admin nhưng chưa cấu hình BOOTSTRAP_ADMIN_USER/PASSWORD - bỏ qua.");
    }
    let bcrypt;
    try {
      bcrypt = require("bcrypt");
    } catch {
      return console.error("[Bootstrap] thiếu module bcrypt.");
    }
    bcrypt.hash(bp, 10, (herr, hash) => {
      if (herr) return console.error("[Bootstrap] hash thất bại:", herr.message);
      db.run(
        `INSERT INTO Users (Username, FullName, Password, Level, Date) VALUES (?, ?, ?, 'Admin', date('now','localtime'))`,
        [bu, bu, hash],
        (ierr) => {
          if (ierr) return console.error("[Bootstrap] tạo admin thất bại:", ierr.message);
          console.log(`[Bootstrap] đã tạo tài khoản Admin '${bu}' (DB thiếu Admin).`);
        },
      );
    });
  });
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
          Note TEXT,
          FOREIGN KEY (CustomerID) REFERENCES Customers(id) ON DELETE CASCADE
          FOREIGN KEY (POID) REFERENCES PurchaseOrders(id) ON DELETE CASCADE
      )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ScheduleDelivery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ItemId INTEGER NOT NULL,
      DeliveryDate TEXT,
      DeliveryQuantity INTEGER NOT NULL,
      DeliveryStatus TEXT,
      ActualDeliveryDate TEXT,
      FOREIGN KEY(ItemId) REFERENCES ProductDetails(id) ON DELETE CASCADE
    )
  `);
  // Patch: thêm cột ngày giao thực tế cho database cũ nếu chưa có
  db.run(`ALTER TABLE ScheduleDelivery ADD COLUMN ActualDeliveryDate TEXT`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });

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
      MoTa TEXT,
      Image TEXT,
      Condition TEXT,
      MachineCode TEXT
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
      Level INTEGER,
      Date TEXT,
      Note TEXT,
      Creater TEXT
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
      Quantity INTEGER,
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
      created_by TEXT,
      note TEXT
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
      note TEXT,
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
      note TEXT,
      FOREIGN KEY (project_id) REFERENCES FilterBom(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS BomHighlight (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      mpn TEXT,
      mpn2 TEXT,
      mpn3 TEXT,
      type TEXT,
      designator TEXT,
      quantity INTEGER,
      image TEXT,
      project_id INTERGER,
      note TEXT,
      FOREIGN KEY (project_id) REFERENCES FilterBom(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS MPNMountType (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mpn TEXT UNIQUE,
      mount_type TEXT,
      description TEXT,
      image TEXT,
      project_id INTERGER,
      created_by TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS SettingPCB (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manualOffsetX_top REAL,
      manualOffsetY_top REAL,
      manualOffsetX_bottom REAL,
      manualOffsetY_bottom REAL,
      manualOffsetGerberX REAL,
      manualOffsetGerberY REAL,
      width REAL,
      height REAL,
      angle INTEGER,
      edgeX REAL,
      edgeY REAL,
      project_id INTEGER NOT NULL,
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

  // Bảng FilterBom QC
  db.run(`
    CREATE TABLE IF NOT EXISTS FilterBomQC (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT,
      created_at TEXT,
      created_by TEXT,
      note TEXT
    )
  `);

  // Bảng Bom QC
  db.run(`
    CREATE TABLE IF NOT EXISTS BomQC (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      mpn TEXT,
      designator TEXT,
      quantity INTEGER,
      project_id INTEGER,
      note TEXT,
      FOREIGN KEY (project_id) REFERENCES FilterBomQC(id) ON DELETE CASCADE
    )
  `);

  // Bảng Pick & Place QC
  db.run(`
    CREATE TABLE IF NOT EXISTS PickplaceQC (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      designator TEXT,
      layer TEXT,
      mpn TEXT,
      x REAL,
      y REAL,
      rotation REAL,
      status TEXT,
      project_id INTERGER,
      note TEXT,
      FOREIGN KEY (project_id) REFERENCES FilterBomQC(id) ON DELETE CASCADE
    )
  `);

  // Bảng Setting PCB QC
  db.run(`
    CREATE TABLE IF NOT EXISTS SettingPCBQC (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      width REAL,
      height REAL,
      fileTop TEXT,
      fileBottom TEXT,
      imageSampleTop TEXT,
      imageSampleBottom TEXT,
      fiducialTL TEXT,
      fiducialTR TEXT,
      fiducialBL TEXT,
      fiducialBR TEXT,
      project_id INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES FilterBomQC(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS heartbeats (
      device_id TEXT PRIMARY KEY,
      last_seen INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ToDos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department TEXT,
      title TEXT,
      description TEXT,
      status TEXT,
      creater TEXT,
      createdAt TEXT
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
      License TEXT DEFAULT 'Starter',
      LicenseKey TEXT,
      LicenseExpiry TEXT,
      ProjectCount INTEGER DEFAULT 0,
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
  db.run(`
    CREATE TABLE IF NOT EXISTS LicenseKeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      LicenseKey TEXT UNIQUE,
      LicensePlan TEXT,
      Status TEXT DEFAULT 'unused',
      UsedBy TEXT,
      ExpiryDate TEXT,
      Months INTEGER DEFAULT 1,
      Note TEXT,
      CreatedBy TEXT,
      Date TEXT
    )
  `);
  // Bảng yêu cầu xác nhận chuyển khoản (mã dùng 1 lần)
  db.run(`
    CREATE TABLE IF NOT EXISTS LicenseRequests (
      Code TEXT PRIMARY KEY,
      Username TEXT NOT NULL,
      Plan TEXT NOT NULL,
      ConfirmAt TEXT NOT NULL,
      Uses INTEGER DEFAULT 1,
      Status TEXT DEFAULT 'active',
      Date TEXT NOT NULL
    )
  `);
  // ============================================================
  // Module Báo giá (Quotation)
  // ============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS PriceBooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      currency TEXT DEFAULT 'VND',
      version INTEGER DEFAULT 1,
      pricing_mode TEXT DEFAULT 'per_component',
      is_default INTEGER DEFAULT 0,
      note TEXT,
      created_by TEXT,
      created_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS PriceGroups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      price_book_id INTEGER NOT NULL,
      group_code TEXT NOT NULL,
      group_name TEXT NOT NULL,
      mount_type TEXT DEFAULT 'SMT',
      unit TEXT DEFAULT 'con',
      pin_mode TEXT DEFAULT 'fixed',
      pin_count INTEGER,
      pin_min INTEGER,
      pin_max INTEGER,
      unit_price REAL DEFAULT 0,
      priority INTEGER DEFAULT 100,
      keywords TEXT,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (price_book_id) REFERENCES PriceBooks(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS PriceGroupPatterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      pattern TEXT NOT NULL,
      match_type TEXT DEFAULT 'exact',
      FOREIGN KEY (group_id) REFERENCES PriceGroups(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS PriceBookMpnOverrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      price_book_id INTEGER NOT NULL,
      mpn TEXT NOT NULL,
      unit_price REAL NOT NULL,
      mount_type TEXT,
      pin_count INTEGER,
      scope TEXT DEFAULT 'global',
      note TEXT,
      FOREIGN KEY (price_book_id) REFERENCES PriceBooks(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS PriceBookPadRates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      price_book_id INTEGER NOT NULL,
      process_code TEXT NOT NULL,
      process_name TEXT,
      rate REAL DEFAULT 0,
      note TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT,
      UNIQUE (price_book_id, process_code),
      FOREIGN KEY (price_book_id) REFERENCES PriceBooks(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS PartMaster (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mpn TEXT NOT NULL UNIQUE,
      package TEXT,
      pin_count INTEGER,
      pad_count INTEGER,
      mount_type TEXT,
      price_group TEXT,
      manufacturer TEXT,
      scope TEXT DEFAULT 'global',
      source TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS PartAliases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_mpn TEXT NOT NULL UNIQUE,
      canonical_mpn TEXT NOT NULL,
      source TEXT,
      created_by TEXT,
      created_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_no TEXT UNIQUE,
      customer_id INTEGER,
      customer_name TEXT,
      project_name TEXT,
      status TEXT DEFAULT 'Nhap',
      price_book_id INTEGER,
      price_book_version INTEGER,
      pricing_mode TEXT DEFAULT 'per_component',
      currency TEXT DEFAULT 'VND',
      board_qty INTEGER DEFAULT 1,
      valid_until TEXT,
      payment_terms TEXT,
      lead_time TEXT,
      subtotal REAL DEFAULT 0,
      discount_value REAL DEFAULT 0,
      vat_percent REAL DEFAULT 0,
      total REAL DEFAULT 0,
      note TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      sent_at TEXT,
      accepted_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS QuotationItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      line_no INTEGER,
      raw_mpn TEXT,
      mpn TEXT,
      description TEXT,
      designator TEXT,
      quantity_per_board REAL DEFAULT 0,
      package TEXT,
      mount_type TEXT,
      pin_count INTEGER,
      pad_count INTEGER,
      pad_count_source TEXT,
      process_code TEXT,
      group_code TEXT,
      group_name TEXT,
      unit TEXT,
      unit_price REAL DEFAULT 0,
      line_total REAL DEFAULT 0,
      match_method TEXT,
      confidence REAL DEFAULT 0,
      needs_review INTEGER DEFAULT 0,
      dnp INTEGER DEFAULT 0,
      is_manual INTEGER DEFAULT 0,
      note TEXT,
      warnings TEXT,
      FOREIGN KEY (quotation_id) REFERENCES Quotations(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS QuotationCostLines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      name TEXT,
      amount REAL DEFAULT 0,
      note TEXT,
      FOREIGN KEY (quotation_id) REFERENCES Quotations(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS QuotationAttachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      file_name TEXT,
      file_path TEXT,
      type TEXT,
      uploaded_at TEXT,
      FOREIGN KEY (quotation_id) REFERENCES Quotations(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS AuditLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT,
      entity_id INTEGER,
      action TEXT,
      before_json TEXT,
      after_json TEXT,
      username TEXT,
      created_at TEXT
    )
  `);

  // ============================================================
  // DigiKey OAuth + giá linh kiện cho báo giá
  // ============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS DigiKeyOAuthTokens (
      username TEXT PRIMARY KEY,
      access_token_enc TEXT,
      refresh_token_enc TEXT,
      token_type TEXT DEFAULT 'Bearer',
      scope TEXT,
      expires_at INTEGER,
      account_id TEXT,
      needs_reconnect INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS DigiKeyPartMappings (
      mpn_normalized TEXT PRIMARY KEY,
      digikey_pn TEXT,
      manufacturer TEXT,
      source TEXT,
      resolved_at TEXT,
      last_used_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS QuotationComponentImports (
      quotation_id INTEGER PRIMARY KEY,
      source TEXT DEFAULT 'manual',
      source_file TEXT,
      digikey_list_id TEXT,
      digikey_list_name TEXT,
      digikey_list_created_at TEXT,
      status TEXT DEFAULT 'success',
      error_message TEXT,
      exchange_rate REAL DEFAULT 0,
      total_usd REAL DEFAULT 0,
      line_count INTEGER DEFAULT 0,
      priced_count INTEGER DEFAULT 0,
      matched_count INTEGER DEFAULT 0,
      missing_count INTEGER DEFAULT 0,
      bom_hash TEXT,
      my_lists_calls INTEGER DEFAULT 0,
      product_info_calls INTEGER DEFAULT 0,
      retry_count INTEGER DEFAULT 0,
      quota_remaining TEXT,
      started_at TEXT,
      finished_at TEXT,
      imported_at TEXT,
      FOREIGN KEY (quotation_id) REFERENCES Quotations(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS QuotationComponentPrices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      line_no INTEGER,
      source_index INTEGER,
      mpn TEXT,
      requested_mpn TEXT,
      original_mpn TEXT,
      manufacturer TEXT,
      description TEXT,
      digikey_pn TEXT,
      digikey_unique_id TEXT,
      quantity_requested REAL DEFAULT 0,
      quantity_purchased REAL DEFAULT 0,
      moq REAL DEFAULT 0,
      pack_type TEXT,
      selected_pack_type TEXT,
      unit_price_usd REAL DEFAULT 0,
      extended_price_usd REAL DEFAULT 0,
      availability INTEGER,
      quantity_available INTEGER,
      stock_status TEXT,
      lead_time TEXT,
      lead_weeks TEXT,
      part_status TEXT,
      rohs_status TEXT,
      country_of_origin TEXT,
      us_tariff TEXT,
      unit_of_measure TEXT,
      customer_reference TEXT,
      reference_designator TEXT,
      product_notes TEXT,
      match_status TEXT,
      matched_line_nos TEXT,
      warnings TEXT,
      price_source TEXT,
      image_url TEXT,
      thumbnail_url TEXT,
      reference_unit_price_usd REAL DEFAULT 0,
      reference_extended_price_usd REAL DEFAULT 0,
      reference_moq REAL DEFAULT 0,
      imported_at TEXT,
      FOREIGN KEY (quotation_id) REFERENCES Quotations(id) ON DELETE CASCADE
    )
  `);

  db.run(
    `CREATE INDEX IF NOT EXISTS idx_component_prices_quote_mpn
       ON QuotationComponentPrices(quotation_id, mpn)`,
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_component_prices_quote_dkpn
       ON QuotationComponentPrices(quotation_id, digikey_pn)`,
  );

  db.run(`
    CREATE TABLE IF NOT EXISTS PurchaseProjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      customer_name TEXT,
      source_type TEXT DEFAULT 'bom',
      status TEXT DEFAULT 'Draft',
      note TEXT,
      quote_ids TEXT,
      source_files TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS PurchaseProjectItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      line_no INTEGER,
      mpn TEXT,
      normalized_mpn TEXT,
      manufacturer TEXT,
      description TEXT,
      image_url TEXT,
      quantity REAL DEFAULT 0,
      purchase_qty REAL DEFAULT 0,
      unit_price REAL DEFAULT 0,
      digikey_pn TEXT,
      digikey_unit_price_usd REAL DEFAULT 0,
      digikey_extended_price_usd REAL DEFAULT 0,
      moq REAL DEFAULT 0,
      pack_type TEXT,
      stock_status TEXT,
      availability INTEGER,
      status TEXT,
      price_source TEXT,
      sources TEXT,
      warnings TEXT,
      reference_designator TEXT,
      note TEXT,
      created_at TEXT,
      FOREIGN KEY (project_id) REFERENCES PurchaseProjects(id) ON DELETE CASCADE
    )
  `);

  db.run(
    `CREATE INDEX IF NOT EXISTS idx_purchase_items_project
       ON PurchaseProjectItems(project_id)`,
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_purchase_items_mpn
       ON PurchaseProjectItems(normalized_mpn)`,
  );

  for (const sql of [
    `ALTER TABLE QuotationComponentPrices ADD COLUMN price_source TEXT`,
    `ALTER TABLE QuotationComponentPrices ADD COLUMN image_url TEXT`,
    `ALTER TABLE QuotationComponentPrices ADD COLUMN thumbnail_url TEXT`,
    `ALTER TABLE QuotationComponentPrices ADD COLUMN reference_unit_price_usd REAL DEFAULT 0`,
    `ALTER TABLE QuotationComponentPrices ADD COLUMN reference_extended_price_usd REAL DEFAULT 0`,
    `ALTER TABLE QuotationComponentPrices ADD COLUMN reference_moq REAL DEFAULT 0`,
  ]) {
    db.run(sql, () => {});
  }

  // Patch: thêm cột License cho database cũ nếu chưa có
  db.run(`ALTER TABLE Users ADD COLUMN License TEXT DEFAULT 'Starter'`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });
  db.run(`ALTER TABLE Users ADD COLUMN LicenseKey TEXT`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });
  db.run(`ALTER TABLE Users ADD COLUMN LicenseExpiry TEXT`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });
  db.run(`ALTER TABLE LicenseKeys ADD COLUMN Note TEXT`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });
  db.run(`ALTER TABLE LicenseKeys ADD COLUMN Months INTEGER DEFAULT 1`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });
  db.run(`ALTER TABLE Users ADD COLUMN ProjectCount INTEGER DEFAULT 0`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });
  db.run(`ALTER TABLE Users ADD COLUMN UploadCount INTEGER DEFAULT 0`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });
  db.run(`ALTER TABLE Users ADD COLUMN LicenseUse INTEGER DEFAULT 2`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });
  db.run(`ALTER TABLE LicenseKeys ADD COLUMN Uses INTEGER DEFAULT 1`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });
  db.run(`ALTER TABLE LicenseKeys ADD COLUMN SourceCode TEXT`, (err) => {
    // Nếu err => cột đã tồn tại, bỏ qua
  });

  // Patch: quotation theo pad cho database cũ
  db.run(
    `ALTER TABLE PriceBooks ADD COLUMN pricing_mode TEXT DEFAULT 'per_component'`,
    () => {},
  );
  db.run(`ALTER TABLE PartMaster ADD COLUMN pad_count INTEGER`, () => {});
  db.run(
    `ALTER TABLE Quotations ADD COLUMN pricing_mode TEXT DEFAULT 'per_component'`,
    () => {},
  );
  db.run(`ALTER TABLE QuotationItems ADD COLUMN pad_count INTEGER`, () => {});
  db.run(`ALTER TABLE QuotationItems ADD COLUMN pad_count_source TEXT`, () => {});
  db.run(`ALTER TABLE QuotationItems ADD COLUMN process_code TEXT`, () => {});

  // Backfill lượt dùng theo gói hiện tại (giữ nguyên quyền lợi cũ)
  db.run(
    `UPDATE Users
     SET LicenseUse = CASE License
       WHEN 'Plus' THEN 10
       WHEN 'Pro' THEN 50
       WHEN 'Enterprise' THEN NULL
       ELSE 2
     END
     WHERE LicenseUse IS NULL OR LicenseUse = 2`,
    (err) => {
      if (err) console.error("Backfill LicenseUse lỗi:", err.message);
    },
  );
  // Backfill một lần: đếm tổng dự án đã tạo theo created_by cho các tài khoản chưa có số liệu
  db.run(
    `UPDATE Users
     SET ProjectCount = (SELECT COUNT(*) FROM FilterBom WHERE FilterBom.created_by = Users.Username)
     WHERE ProjectCount = 0`,
    (err) => {
      if (err) console.error("Backfill ProjectCount lỗi:", err.message);
    },
  );
});

// ============================================================
// Seed bảng giá mẫu mặc định (chỉ chạy khi chưa có PriceBook nào)
// Giá là MINH HOẠ - sale tự sửa lại theo giá thực tế của công ty.
// ============================================================
const EXTRA_PRICE_GROUPS = [
  {
    code: "INDUCTOR",
    name: "Cuộn cảm",
    mount: "SMT",
    unit: "con",
    pin_mode: "fixed",
    pin_count: 2,
    pin_min: null,
    pin_max: null,
    price: 800,
    priority: 102,
    keywords: "CUỘN CẢM,INDUCTOR,INDUCTORS,COIL,COILS",
    patterns: [],
  },
  {
    code: "RELAY",
    name: "Rơ le",
    mount: "Hàn tay",
    unit: "con",
    pin_mode: "manual",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 10000,
    priority: 106,
    keywords: "RƠ LE,RELAY,RELAYS,SSR,SOLID STATE RELAY,REED RELAY,CONTACTOR",
    patterns: [],
  },
  {
    code: "TRANSFORMER",
    name: "Biến áp",
    mount: "Hàn tay",
    unit: "con",
    pin_mode: "manual",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 20000,
    priority: 112,
    keywords:
      "TRANSFORMER,TRANSFORMERS,MÁY BIẾN ÁP,BIẾN ÁP XUNG,BIẾN ÁP ETHERNET,LAN TRANSFORMER,POWER TRANSFORMER,FLYBACK,CURRENT TRANSFORMER",
    patterns: [],
  },
  {
    code: "DISPLAY",
    name: "Màn hình",
    mount: "Gắp tay",
    unit: "con",
    pin_mode: "manual",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 30000,
    priority: 111,
    keywords:
      "LCD,OLED,TFT,DISPLAY,7-SEGMENT,SEVEN SEGMENT,MÀN HÌNH,MÀN HÌNH LCD,MÀN HÌNH OLED",
    patterns: [],
  },
  {
    code: "SENSOR",
    name: "Cảm biến",
    mount: "Gắp tay",
    unit: "con",
    pin_mode: "manual",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 10000,
    priority: 110,
    keywords:
      "SENSOR,SENSORS,ACCELEROMETER,GYROSCOPE,PIR,HALL,PRESSURE SENSOR,HUMIDITY SENSOR,TEMPERATURE SENSOR,ULTRASONIC,CẢM BIẾN,CẢM BIẾN NHIỆT ĐỘ,CẢM BIẾN ÁP SUẤT,CẢM BIẾN GIA TỐC",
    patterns: [],
  },
  {
    code: "OPTO",
    name: "Opto / cách ly",
    mount: "SMT",
    unit: "con",
    pin_mode: "parse",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 3000,
    priority: 110,
    keywords:
      "OPTOCOUPLER,OPTOCOUPLERS,PHOTOCOUPLER,PHOTODIODE,PHOTOTRANSISTOR,OPTO,CÁCH LY,CÁCH LY QUANG",
    patterns: [],
  },
  {
    code: "FUSE",
    name: "Cầu chì",
    mount: "SMT",
    unit: "con",
    pin_mode: "fixed",
    pin_count: 2,
    pin_min: null,
    pin_max: null,
    price: 1000,
    priority: 109,
    keywords:
      "FUSE,FUSES,PTC FUSE,RESETTABLE FUSE,FUSE HOLDER,CẦU CHÌ,CẦU CHÌ TỰ PHỤC HỒI",
    patterns: [],
  },
  {
    code: "AUDIO",
    name: "Âm thanh",
    mount: "Hàn tay",
    unit: "con",
    pin_mode: "manual",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 5000,
    priority: 109,
    keywords: "BUZZER,SPEAKER,MICROPHONE,MIC,LOA,CÒI,CHUÔNG",
    patterns: [],
  },
  {
    code: "BATTERY",
    name: "Pin / ắc quy",
    mount: "Gắp tay",
    unit: "con",
    pin_mode: "manual",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 10000,
    priority: 109,
    keywords:
      "BATTERY,BATTERIES,COIN CELL,CR2032,CR2016,18650,BATTERY HOLDER,ẮC QUY,PIN SẠC,PIN CR2032",
    patterns: [],
  },
  {
    code: "MOTOR",
    name: "Động cơ / quạt",
    mount: "Hàn tay",
    unit: "con",
    pin_mode: "manual",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 15000,
    priority: 109,
    keywords:
      "MOTOR,FAN,SERVO,STEPPER,BLOWER,ĐỘNG CƠ,ĐỘNG CƠ BƯỚC,QUẠT",
    patterns: [],
  },
  {
    code: "PROTECTION",
    name: "Bảo vệ quá áp",
    mount: "SMT",
    unit: "con",
    pin_mode: "parse",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 1500,
    priority: 108,
    keywords:
      "TVS,TVS DIODE,MOV,VARISTOR,ESD SUPPRESSOR,ESD PROTECTION,GDT,SURGE,CHỐNG SÉT,BẢO VỆ QUÁ ÁP",
    patterns: [],
  },
  {
    code: "CAP_ARRAY",
    name: "Tụ dãy",
    mount: "SMT",
    unit: "con",
    pin_mode: "manual",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 1500,
    priority: 108,
    keywords:
      "CAP ARRAY,CAPACITOR ARRAY,CAP NETWORK,CAPACITOR NETWORK,TỤ DÃY,MẠNG TỤ",
    patterns: [],
  },
  {
    code: "THERMISTOR",
    name: "Nhiệt trở",
    mount: "SMT",
    unit: "con",
    pin_mode: "fixed",
    pin_count: 2,
    pin_min: null,
    pin_max: null,
    price: 800,
    priority: 107,
    keywords:
      "NTC,PTC THERMISTOR,THERMISTOR,NHIỆT TRỞ,ĐIỆN TRỞ NHIỆT",
    patterns: [],
  },
  {
    code: "EMI",
    name: "Lọc nhiễu",
    mount: "SMT",
    unit: "con",
    pin_mode: "manual",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 1500,
    priority: 107,
    keywords:
      "EMI,EMI FILTER,LINE FILTER,COMMON MODE,COMMON MODE CHOKE,LỌC NHIỄU,CUỘN KHÁNG",
    patterns: [],
  },
  {
    code: "IC_THT",
    name: "IC hàn tay (DIP/SIP)",
    mount: "Hàn tay",
    unit: "con",
    pin_mode: "parse",
    pin_count: null,
    pin_min: null,
    pin_max: null,
    price: 3000,
    priority: 91,
    keywords: "",
    patterns: ["DIP-*", "PDIP-*", "SIP-*"],
  },
];

// Từ khoá bổ sung cho các bảng giá đã seed trước đây (giữ nguyên từ khoá
// sale tự thêm, chỉ thêm từ khoá mặc định còn thiếu).
const KEYWORD_PATCH_ADD = {
  PASSIVE2: ["TỤ ĐIỆN", "ĐIỆN TRỞ", "SHUNT", "CURRENT SENSE"],
  RES_ARRAY: [
    "MẠNG ĐIỆN TRỞ",
    "RESISTOR NETWORK",
    "RES NETWORK",
    "R NETWORK",
    "RN",
  ],
  SOT: [
    "MOSFET",
    "ĐI ỐT",
    "ĐIỐT",
    "IGBT",
    "TRIAC",
    "SCR",
    "RECTIFIER",
    "ZENER",
    "SCHOTTKY",
    "VARACTOR",
    "BJT",
    "DARLINGTON",
    "JFET",
    "BRIDGE RECTIFIER",
  ],
  IC_GENERIC: [
    "VI ĐIỀU KHIỂN",
    "CHUYỂN ĐỔI",
    "KHUẾCH ĐẠI",
    "ĐO DÒNG",
    "TRUYỀN NHẬN",
    "FPGA",
    "CPLD",
    "DSP",
    "SOC",
    "EEPROM",
    "SRAM",
    "DDR",
    "PWM",
    "GATE DRIVER",
    "MOTOR DRIVER",
    "LED DRIVER",
    "VOLTAGE REFERENCE",
    "COMPARATOR",
    "MUX",
    "RTC",
    "CAN",
    "RS485",
    "ETHERNET",
    "PHY",
    "USB HUB",
    "CODEC",
    "AUDIO AMP",
    "PLL",
    "SUPERVISOR",
    "LDO",
    "BUCK",
    "BOOST",
    "CHARGE PUMP",
    "DAC",
  ],
  LED: [
    "ĐÈN LED",
    "RGB LED",
    "WS2812",
    "SK6812",
    "NEOPIXEL",
    "IR LED",
    "UV LED",
    "ĐÈN BÁO",
  ],
  CRYSTAL: [
    "THẠCH ANH",
    "XTAL",
    "TCXO",
    "VCXO",
    "OCXO",
    "CERAMIC RESONATOR",
  ],
  SWITCH: [
    "NÚT BẤM",
    "NHẤN NHẢ",
    "CÔNG TẮC",
    "DIP SWITCH",
    "ROTARY SWITCH",
    "LIMIT SWITCH",
    "MICRO SWITCH",
    "PUSH BUTTON",
    "TACT SWITCH",
    "SLIDE SWITCH",
    "TOGGLE",
    "ROCKER",
    "ENCODER",
  ],
  CONNECTOR: [
    "ĐẦU CẮM",
    "TERMINAL BLOCK",
    "PIN HEADER",
    "IDC",
    "BOX HEADER",
    "FPC CONNECTOR",
    "FFC CONNECTOR",
    "RJ45",
    "RJ11",
    "D-SUB",
    "USB-C",
    "TYPE-C",
    "MICRO USB",
    "BARREL JACK",
    "DC JACK",
    "AUDIO JACK",
    "BNC",
    "SMA",
    "POGO",
    "SIM",
    "SD",
    "MICROSD",
    "CARD EDGE",
    "JST",
    "MOLEX",
    "WAFER",
    "WIRE TO BOARD",
    "BOARD TO BOARD",
    "SPRING TERMINAL",
    "SCREW TERMINAL",
    "IC SOCKET",
  ],
  CABLE: [
    "WIRE",
    "WIRE HARNESS",
    "HARNESS",
    "RIBBON CABLE",
    "FLAT CABLE",
    "COAX",
    "COAXIAL",
    "JUMPER WIRE",
    "USB CABLE",
    "POWER CABLE",
    "FPC",
  ],
  MODULE: [
    "WIFI",
    "BLUETOOTH",
    "BLE",
    "GPS",
    "GNSS",
    "LORA",
    "ZIGBEE",
    "NB-IOT",
    "GSM",
    "4G",
    "RF MODULE",
    "POWER MODULE",
    "DC-DC MODULE",
    "RELAY MODULE",
    "DEV BOARD",
    "EVAL BOARD",
    "BREAKOUT",
    "CAMERA MODULE",
    "RTC MODULE",
  ],
  MECH: [
    "TẢN NHIỆT",
    "HEATSINK",
    "ENCLOSURE",
    "COVER",
    "BRACKET",
    "SPACER",
    "GASKET",
    "O-RING",
    "RIVET",
    "SPRING",
    "KNOB",
    "THERMAL PAD",
    "INSULATOR",
    "CABLE TIE",
    "HEAT SHRINK",
    "MAGNET",
    "SHIELD",
  ],
  POT: ["TRIMMER", "TRIMPOT", "VARIABLE RESISTOR", "RHEOSTAT"],
  RELAY: ["SSR", "SOLID STATE RELAY", "REED RELAY", "CONTACTOR"],
  TESTPOINT: ["TEST PIN", "TEST PAD", "PROBE"],
  INDUCTOR: ["POWER INDUCTOR", "CHOKE"],
  TRANSFORMER: [
    "MÁY BIẾN ÁP",
    "BIẾN ÁP XUNG",
    "BIẾN ÁP ETHERNET",
    "LAN TRANSFORMER",
    "POWER TRANSFORMER",
  ],
  PROTECTION: ["ESD SUPPRESSOR", "ESD PROTECTION"],
};

const KEYWORD_PATCH_REMOVE = {
  PASSIVE2: ["INDUCTOR", "DIODE"],
  TRANSFORMER: ["BIẾN ÁP"],
  PROTECTION: ["ESD"],
  IC_GENERIC: ["BIẾN ÁP", "OPTO"],
  MODULE: [
    "RELAY",
    "RELAYS",
    "SENSOR",
    "SENSORS",
    "CẢM BIẾN",
    "CHOKE",
    "CHOKES",
    "COMMON MODE",
  ],
};

function splitKeywords(value) {
  return String(value || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function patchBookKeywords(bookId) {
  db.get(
    `SELECT pricing_mode FROM PriceBooks WHERE id = ?`,
    [bookId],
    (bookErr, book) => {
      if (bookErr) return console.error("Patch bảng giá lỗi:", bookErr.message);
      const isPad = String(book?.pricing_mode || "") === "per_pad";

      db.all(
        `SELECT id, group_code, keywords FROM PriceGroups WHERE price_book_id = ?`,
        [bookId],
        (err, rows) => {
          if (err) return console.error("Patch từ khoá lỗi:", err.message);
          const existing = new Map((rows || []).map((row) => [row.group_code, row]));

          (rows || []).forEach((row) => {
            const add = KEYWORD_PATCH_ADD[row.group_code] || [];
            const remove = new Set(
              (KEYWORD_PATCH_REMOVE[row.group_code] || []).map((token) =>
                token.toUpperCase(),
              ),
            );
            if (!add.length && !remove.size) return;

            const seen = new Set();
            const tokens = [];
            splitKeywords(row.keywords).forEach((token) => {
              const key = token.toUpperCase();
              if (remove.has(key) || seen.has(key)) return;
              seen.add(key);
              tokens.push(token);
            });
            add.forEach((token) => {
              const key = token.toUpperCase();
              if (seen.has(key)) return;
              seen.add(key);
              tokens.push(token);
            });

            const next = tokens.join(",");
            if (next !== String(row.keywords || "")) {
              db.run(`UPDATE PriceGroups SET keywords = ? WHERE id = ?`, [next, row.id]);
            }
          });

          const ensurePatterns = (groupId, patterns) => {
            const desired = (patterns || []).map((pattern) =>
              String(pattern || "").toUpperCase().trim(),
            ).filter(Boolean);
            if (!desired.length) return;

            db.all(
              `SELECT pattern FROM PriceGroupPatterns WHERE group_id = ?`,
              [groupId],
              (patternErr, patternRows) => {
                if (patternErr) {
                  return console.error("Patch pattern lỗi:", patternErr.message);
                }
                const seen = new Set(
                  (patternRows || []).map((row) => String(row.pattern || "").toUpperCase()),
                );
                desired.forEach((pattern) => {
                  if (seen.has(pattern)) return;
                  seen.add(pattern);
                  db.run(
                    `INSERT INTO PriceGroupPatterns (group_id, pattern, match_type)
                     VALUES (?, ?, ?)`,
                    [groupId, pattern, pattern.includes("*") ? "wildcard" : "exact"],
                  );
                });
              },
            );
          };

          EXTRA_PRICE_GROUPS.forEach((group) => {
            const current = existing.get(group.code);
            if (current) {
              ensurePatterns(current.id, group.patterns);
              return;
            }
            db.run(
              `INSERT INTO PriceGroups
               (price_book_id, group_code, group_name, mount_type, unit, pin_mode,
                pin_count, pin_min, pin_max, unit_price, priority, keywords, active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
              [
                bookId, group.code, group.name, group.mount, group.unit,
                group.pin_mode, group.pin_count, group.pin_min, group.pin_max,
                isPad ? 0 : group.price, group.priority, group.keywords,
              ],
              function (insertErr) {
                if (insertErr) {
                  return console.error("Patch nhóm giá lỗi:", insertErr.message);
                }
                ensurePatterns(this.lastID, group.patterns);
              },
            );
          });
        },
      );
    },
  );
}

function patchDefaultPriceBook() {
  db.serialize(() => {
    db.run(
      `DELETE FROM PriceGroupPatterns WHERE group_id NOT IN (SELECT id FROM PriceGroups)`,
    );
    db.run(
      `DELETE FROM PriceGroups WHERE price_book_id NOT IN (SELECT id FROM PriceBooks)`,
    );
    db.run(
      `DELETE FROM PriceBookMpnOverrides WHERE price_book_id NOT IN (SELECT id FROM PriceBooks)`,
    );
    db.all(
      `SELECT id FROM PriceBooks WHERE created_by = 'system'`,
      (err, books) => {
        if (err) return console.error("Patch bảng giá lỗi:", err.message);
        (books || []).forEach((book) => patchBookKeywords(book.id));
      },
    );
  });
}

function seedDefaultPriceBook() {
  db.serialize(() => {
    db.get(`SELECT COUNT(*) AS total FROM PriceBooks`, (err, row) => {
      if (err) return console.error("Seed PriceBooks lỗi:", err.message);
      if (row && row.total > 0) return;

      const now = new Date().toISOString();
      db.run(
        `INSERT INTO PriceBooks
         (name, currency, version, pricing_mode, is_default, note, created_by, created_at)
         VALUES (?, 'VND', 2, 'per_pad', 1, ?, 'system', ?)`,
        [
          "Bảng giá chuẩn 2026 – Gia công theo pad",
          "Giá mẫu - cập nhật theo giá thực tế",
          now,
        ],
        function (errBook) {
          if (errBook) return console.error("Seed PriceBook lỗi:", errBook.message);
          const bookId = this.lastID;

          ["SMT", "HAND"].forEach((processCode) => {
            const processName = processCode === "SMT" ? "Pad SMT" : "Pad hàn tay / THT";
            const rate = processCode === "SMT" ? 500 : 1000;
            db.run(
              `INSERT OR IGNORE INTO PriceBookPadRates
               (price_book_id, process_code, process_name, rate, note, active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
              [bookId, processCode, processName, rate, "Giá mẫu", now, now],
            );
          });

          const groups = [
            {
              code: "PASSIVE2",
              name: "Linh kiện 2 chân (R/C/L)",
              mount: "SMT",
              unit: "con",
              pin_mode: "fixed",
              pin_count: 2,
              pin_min: null,
              pin_max: null,
              price: 200,
              priority: 100,
              keywords:
                "RES,RESISTOR,RESISTORS,CAP,CAPACITOR,CAPACITORS,FERRITE,TỤ ĐIỆN,ĐIỆN TRỞ",
              patterns: [
                "0402", "0603", "0805", "1206", "1210", "1812", "2010", "2512",
                "2917", "1506", "1505", "1515",
              ],
            },
            ...EXTRA_PRICE_GROUPS,
            {
              code: "RES_ARRAY",
              name: "Resistor array",
              mount: "SMT",
              unit: "con",
              pin_mode: "manual",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 1200,
              priority: 108,
              keywords: "RES ARRAY,RES ARRAYS,RESISTOR ARRAY,RESISTOR ARRAYS,MẠNG ĐIỆN TRỞ",
              patterns: [],
            },
            {
              code: "SOT",
              name: "Transistor / SOT",
              mount: "SMT",
              unit: "con",
              pin_mode: "parse",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 800,
              priority: 89,
              keywords: "TRANSISTOR,TRANSISTORS,DIODE,DIODES,MOSFET,ĐI ỐT,ĐIỐT",
              patterns: ["SOT-*", "TO-*", "DO-*", "SOD-*", "SMA", "SMB", "SMC", "MELF"],
            },
            {
              code: "IC_SMALL",
              name: "IC nhỏ (1-16 chân)",
              mount: "SMT",
              unit: "con",
              pin_mode: "parse",
              pin_count: null,
              pin_min: 1,
              pin_max: 16,
              price: 1500,
              priority: 90,
              keywords: "",
              patterns: [
                "SOIC-*", "TSSOP-*", "MSOP-*", "SSOP-*", "HSOP-*", "ESOP-*", "SOP-*",
                "QFN-*", "DFN-*", "VQFN-*", "WQFN-*", "TQFN-*",
              ],
            },
            {
              code: "IC_MED",
              name: "IC trung (17-64 chân)",
              mount: "SMT",
              unit: "con",
              pin_mode: "parse",
              pin_count: null,
              pin_min: 17,
              pin_max: 64,
              price: 2500,
              priority: 90,
              keywords: "",
              patterns: [
                "SOIC-*", "TSSOP-*", "MSOP-*", "SSOP-*", "HSOP-*",
                "QFN-*", "DFN-*", "VQFN-*", "WQFN-*", "TQFN-*",
                "QFP-*", "LQFP-*", "TQFP-*",
              ],
            },
            {
              code: "IC_LARGE",
              name: "IC lớn (65+ chân)",
              mount: "SMT",
              unit: "con",
              pin_mode: "parse",
              pin_count: null,
              pin_min: 65,
              pin_max: null,
              price: 4000,
              priority: 90,
              keywords: "",
              patterns: ["QFP-*", "LQFP-*", "TQFP-*", "BGA-*", "LGA-*", "WLCSP-*"],
            },
            {
              code: "IC_GENERIC",
              name: "IC khác (chưa rõ package)",
              mount: "SMT",
              unit: "con",
              pin_mode: "manual",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 2500,
              priority: 86,
              keywords:
                "IC,MCU,TRANSCEIVER,TRANSCEIVERS,ISOLATOR,ADC,BRIDGE,CONTROLLER,CONTROLLERS,REGULATOR,REGULATORS,AMPLIFIER,AMPLIFIERS,OP AMP,LOGIC,GATE,FLASH,MEMORY,I2C,SPI,UART,PORT EXPANSION,VI ĐIỀU KHIỂN,CHUYỂN ĐỔI,KHUẾCH ĐẠI,ĐO DÒNG,TRUYỀN NHẬN,BIẾN ÁP,OPTO",
              patterns: [],
            },
            {
              code: "LED",
              name: "LED",
              mount: "SMT",
              unit: "con",
              pin_mode: "fixed",
              pin_count: 2,
              pin_min: null,
              pin_max: null,
              price: 300,
              priority: 110,
              keywords: "LED,LEDS,ĐÈN LED",
              patterns: [],
            },
            {
              code: "CRYSTAL",
              name: "Crystal / Oscillator",
              mount: "SMT",
              unit: "con",
              pin_mode: "manual",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 1500,
              priority: 105,
              keywords: "CRYSTAL,CRYSTALS,OSCILLATOR,OSCILLATORS,RESONATOR,RESONATORS,THẠCH ANH",
              patterns: [],
            },
            {
              code: "SWITCH",
              name: "Switch / Button",
              mount: "Hàn tay",
              unit: "con",
              pin_mode: "manual",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 2000,
              priority: 105,
              keywords: "SWITCH TACTILE,SWITCH SLIDE,TACTILE,BUTTON,SPDT,SPST,NÚT BẤM,NHẤN NHẢ,CÔNG TẮC",
              patterns: [],
            },
            {
              code: "CABLE",
              name: "Cable / FFC / FPC",
              mount: "Gắp tay",
              unit: "con",
              pin_mode: "manual",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 3000,
              priority: 105,
              keywords: "CABLE,CABLES,FFC,CABLE ASSEMBLY",
              patterns: [],
            },
            {
              code: "POT",
              name: "Potentiometer",
              mount: "Hàn tay",
              unit: "con",
              pin_mode: "manual",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 2500,
              priority: 105,
              keywords: "POTENTIOMETER,POTENTIOMETERS,ROTARY POT",
              patterns: [],
            },
            {
              code: "TESTPOINT",
              name: "Test point / Clip",
              mount: "Hàn tay",
              unit: "con",
              pin_mode: "manual",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 800,
              priority: 105,
              keywords: "TEST POINT,TEST POINTS,TEST CLIP,TEST CLIPS,ALLIGATOR,CROCODILE",
              patterns: [],
            },
            {
              code: "CONNECTOR",
              name: "Connector / Header",
              mount: "Hàn tay",
              unit: "con",
              pin_mode: "manual",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 3000,
              priority: 85,
              keywords: "CONN,CONNECTOR,CONNECTORS,HEADER,HEADERS,RCPT,JACK,SOCKET,SOCKETS,TERMINAL,TERMINALS,USB,PLUG,PLUGS,ĐẦU CẮM",
              patterns: [],
            },
            {
              code: "MODULE",
              name: "Module / Sensor / Shield",
              mount: "Gắp tay",
              unit: "con",
              pin_mode: "manual",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 5000,
              priority: 108,
              keywords: "MODULE,MODULES,SENSOR,SENSORS,SHLD,ADAPTER,ADAPTERS,CHOKE,CHOKES,COMMON MODE,CẢM BIẾN",
              patterns: [],
            },
            {
              code: "MECH",
              name: "Cơ khí",
              mount: "Gắp tay",
              unit: "con",
              pin_mode: "manual",
              pin_count: null,
              pin_min: null,
              pin_max: null,
              price: 1000,
              priority: 90,
              keywords: "SCREW,SCREWS,NUT,NUTS,STANDOFF,STANDOFFS,WASHER,WASHERS,TẢN NHIỆT",
              patterns: [],
            },
          ];

          const insertGroup = (g) => {
            db.run(
              `INSERT INTO PriceGroups
               (price_book_id, group_code, group_name, mount_type, unit, pin_mode,
                pin_count, pin_min, pin_max, unit_price, priority, keywords, active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
              [
                bookId, g.code, g.name, g.mount, g.unit, g.pin_mode,
                g.pin_count, g.pin_min, g.pin_max, 0, g.priority, g.keywords,
              ],
              function (errGroup) {
                if (errGroup) return console.error("Seed PriceGroup lỗi:", errGroup.message);
                const groupId = this.lastID;
                g.patterns.forEach((pattern) => {
                  const matchType = pattern.includes("*") ? "wildcard" : "exact";
                  db.run(
                    `INSERT INTO PriceGroupPatterns (group_id, pattern, match_type)
                     VALUES (?, ?, ?)`,
                    [groupId, pattern.toUpperCase(), matchType],
                  );
                });
              },
            );
          };

          groups.forEach(insertGroup);
        },
      );
    });
  });
}

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    }),
  );

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null))),
  );

async function migratePadStandardBook() {
  try {
    const existingPad = await dbGet(
      `SELECT id FROM PriceBooks WHERE pricing_mode = 'per_pad' ORDER BY is_default DESC, id ASC LIMIT 1`,
    );
    if (existingPad) return;

    const oldBook = await dbGet(
      `SELECT * FROM PriceBooks
       WHERE pricing_mode <> 'per_pad' AND created_by = 'system'
       ORDER BY is_default DESC, id ASC LIMIT 1`,
    );
    if (!oldBook) return;

    const now = new Date().toISOString();
    await dbRun(`UPDATE PriceBooks SET is_default = 0`);
    const created = await dbRun(
      `INSERT INTO PriceBooks
       (name, currency, version, pricing_mode, is_default, note, created_by, created_at)
       VALUES (?, 'VND', 2, 'per_pad', 1, ?, 'system', ?)`,
      [
        "Bảng giá chuẩn 2026 – Gia công theo pad",
        "Giá mẫu - cập nhật theo giá thực tế",
        now,
      ],
    );
    const newBookId = created.lastID;

    await dbRun(
      `INSERT INTO PriceGroups
       (price_book_id, group_code, group_name, mount_type, unit, pin_mode,
        pin_count, pin_min, pin_max, unit_price, priority, keywords, active)
       SELECT ?, group_code, group_name, mount_type, unit, pin_mode,
              pin_count, pin_min, pin_max, 0, priority, keywords, active
       FROM PriceGroups
       WHERE price_book_id = ?`,
      [newBookId, oldBook.id],
    );

    await dbRun(
      `INSERT INTO PriceGroupPatterns (group_id, pattern, match_type)
       SELECT new_group.id, old_pattern.pattern, old_pattern.match_type
       FROM PriceGroupPatterns old_pattern
       JOIN PriceGroups old_group ON old_group.id = old_pattern.group_id
       JOIN PriceGroups new_group
         ON new_group.price_book_id = ? AND new_group.group_code = old_group.group_code
       WHERE old_group.price_book_id = ?`,
      [newBookId, oldBook.id],
    );

    const rates = [
      ["SMT", "Pad SMT", 500],
      ["HAND", "Pad hàn tay / THT", 1000],
    ];
    for (const [code, name, rate] of rates) {
      await dbRun(
        `INSERT OR IGNORE INTO PriceBookPadRates
         (price_book_id, process_code, process_name, rate, note, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        [newBookId, code, name, rate, "Giá mẫu", now, now],
      );
    }

    const quoteCount = await dbGet(
      `SELECT COUNT(*) AS total FROM Quotations WHERE price_book_id = ?`,
      [oldBook.id],
    );
    if (Number(quoteCount?.total || 0) === 0) {
      await dbRun(`DELETE FROM PriceBooks WHERE id = ?`, [oldBook.id]);
      console.log(
        `[DB] Đã chuyển bảng giá chuẩn sang pad và xoá bảng package id=${oldBook.id}.`,
      );
    } else {
      console.warn(
        `[DB] Giữ bảng package id=${oldBook.id} vì còn ${quoteCount.total} báo giá tham chiếu.`,
      );
    }
  } catch (error) {
    console.error("[DB] Migration pad price book lỗi:", error.message);
  }
}

seedDefaultPriceBook();
patchDefaultPriceBook();
migratePadStandardBook();

module.exports = db;