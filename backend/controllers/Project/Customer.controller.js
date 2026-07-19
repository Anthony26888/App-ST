const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng
const path = require("path");
const fs = require("fs");

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
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
  },

  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
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
  },

  // ============================
  // Delete Item
  // ============================
  deleteItem(req, res) {
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
  },

  // ============================
  // Upload File
  // ============================
  async upload(req, res) {
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
  },
});
