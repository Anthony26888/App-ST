const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng
const path = require("path");
const fs = require("fs");

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const {
      Product_Detail,
      Quantity_Product,
      Quantity_Delivered,
      Quantity_Amount,
      Note,
      POID,
      CustomerID,
    } = req.body;
    // Insert data into SQLite database
    const query = `
    INSERT INTO ProductDetails (ProductDetail, QuantityProduct, QuantityDelivered, QuantityAmount, Note, POID, CustomerID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
    db.run(
      query,
      [
        Product_Detail,
        Quantity_Product,
        Quantity_Delivered,
        Quantity_Amount,
        Note,
        POID,
        CustomerID,
      ],
      function (err) {
        if (err) {
          return console.error(err.message);
        }
        io.emit("updateDetailProjectPO");
        // Broadcast the new message to all clients
        res.json({ message: "Item inserted successfully", id: this.lastID });
      },
    );
  },

  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
    const {
      Product_Detail,
      Quantity_Product,
      Quantity_Delivered,
      Quantity_Amount,
      Note,
      POID,
    } = req.body;
    const { id } = req.params;

    // Validate input
    if (!id) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const query = `
    UPDATE ProductDetails
    SET ProductDetail = ?, QuantityProduct = ?, QuantityDelivered = ?, QuantityAmount = ?, Note = ?, POID = ?
    WHERE id = ?
  `;

    db.run(
      query,
      [
        Product_Detail,
        Quantity_Product,
        Quantity_Delivered,
        Quantity_Amount,
        Note,
        POID,
        id,
      ],
      function (err) {
        if (err) {
          console.error("Error:", err.message);
          return res.status(500).json({
            error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu",
          });
        }
        io.emit("updateDetailProjectPO");
        res.json({ message: "Đã cập nhật dữ liệu thành công" });
      },
    );
  },

  // ============================
  // Delete Item
  // ============================
  deleteItem(req, res) {
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
      io.emit("updateDetailProjectPO", id);
      // Broadcast the new message to all clients
      res.json({ message: "Đã cập nhật dữ liệu thành công" });
    });
  },

  // ============================
  // Add Item Schedule Delivery
  // ============================
  addItemScheduleDelivery(req, res) {
    const { ItemId, DeliveryDate, DeliveryQuantity } = req.body;

    // Validate input
    if (!ItemId || !DeliveryDate || !DeliveryQuantity) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    const query = `
    INSERT INTO ScheduleDelivery (ItemId, DeliveryDate, DeliveryQuantity, DeliveryStatus)
    VALUES (?, ?, ?, ?)
  `;

    db.run(
      query,
      [ItemId, formatDateLocal(DeliveryDate), DeliveryQuantity, "Chưa giao"],
      function (err) {
        if (err) {
          console.error("Error:", err.message);
          return res.status(500).json({
            message: "Lỗi thêm lịch giao hàng",
          });
        }
        io.emit("updateDetailProjectPO");
        res.json({
          message: "Lịch giao hàng thêm thành công",
          id: this.lastID,
        });
      },
    );
  },

  // ============================
  // Edit Item Schedule Delivery
  // ============================
  editItemScheduleDelivery(req, res) {
    const { DeliveryDate, DeliveryQuantity } = req.body;
    const { id } = req.params;

    // Validate input
    if (!id || !DeliveryDate || !DeliveryQuantity) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    const query = `
    UPDATE ScheduleDelivery
    SET DeliveryDate = ?, DeliveryQuantity = ?
    WHERE id = ?
  `;

    db.run(
      query,
      [formatDateLocal(DeliveryDate), DeliveryQuantity, id],
      function (err) {
        if (err) {
          console.error("Error:", err.message);
          return res.status(500).json({
            message: "Lỗi cập nhật lịch giao hàng",
          });
        }
        io.emit("updateDetailProjectPO");
        res.json({
          message: "Cập nhật lịch giao hàng thành công",
        });
      },
    );
  },

  // ============================
  // Delete Item Schedule Delivery
  // ============================
  deleteItemScheduleDelivery(req, res) {
    const { id } = req.params;

    // Validate input
    if (!id) {
      return res.status(400).json({
        message: "ID không hợp lệ",
      });
    }

    const query = `
    DELETE FROM ScheduleDelivery
    WHERE id = ?
  `;

    db.run(query, [id], function (err) {
      if (err) {
        console.error("Error:", err.message);
        return res.status(500).json({
          message: "Lỗi xóa lịch giao hàng",
        });
      }
      io.emit("updateDetailProjectPO");
      res.json({
        message: "Xóa lịch giao hàng thành công",
      });
    });
  },

  // ============================
  // Confirm Item Schedule Delivery
  // ============================

  confirmItem(req, res) {
    const { id } = req.params;
    // Insert data into SQLite database
    const query = `
    UPDATE ScheduleDelivery
    SET DeliveryStatus = 'Đã giao'
    WHERE id = ?`;
    db.run(query, [id], function (err) {
      if (err) {
        console.error("Error:", err.message);
        return res.status(500).json({
          message: "Lỗi xác nhận giao hàng",
        });
      }
      io.emit("updateDetailProjectPO");
      res.json({
        message: "Xác nhận giao hàng thành công",
      });
    });
  },
});
