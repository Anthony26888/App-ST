require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./database.js");
const routes = require("./routes");
const app = express();
const { Server } = require("socket.io");
const { send } = require("process");
const PORT = 3000;
app.use(cors());

app.use(bodyParser.json());
app.use("/", routes);
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});
// Tạo HTTP server
const server = require("http").createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Khi client kết nối
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  sendData(); // Gửi dữ liệu ngay khi client kết nối
  socket.on("getCompare", async (id) => {
    try {
      const query = await getCompareInventory(id);
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("compareError", err);
        socket.emit("compareData", rows);
      });
    } catch (error) {
      socket.emit("compareError", error);
    }
  }),
    socket.on("getDetailBom", async () => {
      try {
        const query = `SELECT DISTINCT id, PO, Bom, COUNT(Bom) AS SL_LK, SL_Board, Creater, TimeStamp FROM CheckBOM GROUP BY PO, Bom`;
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
        const query = `SELECT DISTINCT p.id, p.PONumber AS PO, SUM(o.QuantityProduct) AS Total_Product,SUM(o.QuantityDelivered) AS Total_Delivered, SUM(o.QuantityAmount) AS Total_Amount, p.DateCreated AS Date_Created, p.DateDelivery AS Date_Delivery FROM PurchaseOrders p LEFT JOIN ProductDetails o ON p.id = o.POID WHERE p.CustomerID = ? GROUP BY p.PONumber ORDER BY p.PONumber ASC`;
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
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
});

const fetchTableData = (tableName) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName} ORDER BY id DESC`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
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
            WHEN (SUM(c.So_Luong * c.SL_Board) + SUM(IFNULL(c.Hao_Phi_Thuc_Te, 0))) > IFNULL(i.Inventory, 0) 
            THEN SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0) - IFNULL(i.Inventory, 0)
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
            i.Customer AS Mã_Kho,
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

/// Hàm gửi dữ liệu cập nhật đến tất cả client
const sendData = async () => {
  try {
    const users = await fetchTableData("Users");
    const warehouse = await fetchTableData("WareHouse");
    const orders = await fetchTableData("Orders"); // Chỉ sắp xếp bảng orders
    const bom = await fetchTableData("CheckBOM");
    io.emit("updateData", { users, warehouse, orders, bom });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

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
      sendData();
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
});

// Router update Hao_Phi_Thuc_Te in CheckBom table
app.put("/CheckBom/Update-Hao-Phi-Thuc-Te", async (req, res) => {
  const { Input_Hao_Phi_Thuc_Te, PartNumber_1 } = req.body;
  // Insert data into SQLite database
  const query = `UPDATE CheckBOM SET Hao_Phi_Thuc_Te = ? WHERE PartNumber_1 = ?`;
  db.run(query, [Input_Hao_Phi_Thuc_Te, PartNumber_1], function (err) {
    if (err) {
      return console.error(err.message);
    }
    io.emit("updateCompare");
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
    sendData();
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
        WHEN Inventory > (SELECT SUM(cb.So_Luong * cb.SL_Board + cb.Hao_Phi_Thuc_Te)
                          FROM CheckBOM cb
                          WHERE cb.PartNumber_1 = WareHouse.PartNumber_1 AND cb.PO = ?)
        THEN Inventory - (SELECT SUM(cb.So_Luong * cb.SL_Board + cb.Hao_Phi_Thuc_Te)
                          FROM CheckBOM cb
                          WHERE cb.PartNumber_1 = WareHouse.PartNumber_1 AND cb.PO = ?)
        ELSE 0
      END
    WHERE PartNumber_1 IN (SELECT PartNumber_1 FROM CheckBOM WHERE PO = ?)
  `;
  db.all(
    query,
    [poNumber, poNumber, poNumber],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      io.emit("updateCompare");
      // Broadcast the new message to all clients
      res.json({ message: "Item inserted successfully" });
    }
  );
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
    SET CustomerName = ?
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
  const { CustomerName } = req.body;
  // Insert data into SQLite database
  const query = `
    INSERT INTO Customers (CustomerName)
    VALUES (?)
  `;
  db.run(query, [CustomerName], function (err) {
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

// Lắng nghe trên `0.0.0.0`

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
