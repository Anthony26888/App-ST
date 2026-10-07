const db = require("../../database.js");
const { toUnixSeconds } = require("../../utils/date.js");
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
      [ItemId, toUnixSeconds(DeliveryDate), DeliveryQuantity, "Chưa giao"],
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
    const { DeliveryDate, DeliveryQuantity, ActualDate } = req.body;
    const { id } = req.params;

    // Validate input
    if (!id || !DeliveryDate || !DeliveryQuantity) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    // ActualDate là optional (dùng để sửa ngày giao thực tế của lịch đã giao).
    // Có key => update cột; null/rỗng => xóa ngày thực giao.
    const hasActual = Object.prototype.hasOwnProperty.call(req.body, "ActualDate");
    let actualUnix;
    if (hasActual) {
      actualUnix = ActualDate ? toUnixSeconds(ActualDate) : null;
      if (ActualDate && actualUnix == null) {
        return res.status(400).json({
          message: "Ngày giao thực tế không hợp lệ",
        });
      }
    }

    const query = hasActual
      ? `
    UPDATE ScheduleDelivery
    SET DeliveryDate = ?, DeliveryQuantity = ?, ActualDeliveryDate = ?
    WHERE id = ?
  `
      : `
    UPDATE ScheduleDelivery
    SET DeliveryDate = ?, DeliveryQuantity = ?
    WHERE id = ?
  `;

    const params = hasActual
      ? [toUnixSeconds(DeliveryDate), DeliveryQuantity, actualUnix, id]
      : [toUnixSeconds(DeliveryDate), DeliveryQuantity, id];

    db.run(query, params, function (err) {
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
    });
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
    const { ActualDate } = req.body || {};
    // Ngày giao thực tế: client gửi YYYY-MM-DD, rỗng => lấy hiện tại
    const actualUnix = ActualDate
      ? toUnixSeconds(ActualDate)
      : Math.floor(Date.now() / 1000);
    if (actualUnix == null) {
      return res.status(400).json({
        message: "Ngày giao thực tế không hợp lệ",
      });
    }
    // 1. Lấy thông tin lịch giao
    db.get(
      `SELECT ItemId, DeliveryQuantity, DeliveryStatus FROM ScheduleDelivery WHERE id = ?`,
      [id],
      (err, schedule) => {
        if (err) {
          console.error("Error:", err.message);
          return res.status(500).json({
            message: "Lỗi xác nhận giao hàng",
          });
        }
        if (!schedule) {
          return res.status(404).json({
            message: "Không tìm thấy lịch giao hàng",
          });
        }
        // Chống cộng trùng khi bấm 2 lần / 2 máy cùng bấm
        if (schedule.DeliveryStatus === "Đã giao") {
          return res.status(400).json({
            message: "Lịch giao này đã được xác nhận, không cộng lại",
          });
        }
        const scheduleQty = Number(schedule.DeliveryQuantity) || 0;
        // 2. Lấy SL đơn hàng để kiểm tra vượt
        db.get(
          `SELECT QuantityProduct, IFNULL(QuantityDelivered, 0) AS QuantityDelivered
           FROM ProductDetails WHERE id = ?`,
          [schedule.ItemId],
          (err2, product) => {
            if (err2) {
              console.error("Error:", err2.message);
              return res.status(500).json({
                message: "Lỗi xác nhận giao hàng",
              });
            }
            if (!product) {
              return res.status(404).json({
                message: "Không tìm thấy đơn hàng",
              });
            }
            const delivered = Number(product.QuantityDelivered) || 0;
            const ordered = Number(product.QuantityProduct) || 0;
            const newDelivered = delivered + scheduleQty;
            // Chặn vượt SL đơn hàng
            if (newDelivered > ordered) {
              return res.status(400).json({
                message: `Vượt SL đơn hàng: đã giao ${delivered} + lịch ${scheduleQty} > đơn ${ordered}`,
              });
            }
            // 3. Đánh dấu đã giao + lưu ngày thực giao (điều kiện Chưa giao để chống race)
            db.run(
              `UPDATE ScheduleDelivery
               SET DeliveryStatus = 'Đã giao', ActualDeliveryDate = ?
               WHERE id = ? AND DeliveryStatus = 'Chưa giao'`,
              [actualUnix, id],
              function (err3) {
                if (err3) {
                  console.error("Error:", err3.message);
                  return res.status(500).json({
                    message: "Lỗi xác nhận giao hàng",
                  });
                }
                if (this.changes === 0) {
                  return res.status(400).json({
                    message: "Lịch giao này đã được xác nhận, không cộng lại",
                  });
                }
                // 4. Cộng SL vào đơn hàng
                db.run(
                  `UPDATE ProductDetails
                   SET QuantityDelivered = ?,
                       QuantityAmount = QuantityProduct - ?
                   WHERE id = ?`,
                  [newDelivered, newDelivered, schedule.ItemId],
                  function (err4) {
                    if (err4) {
                      console.error("Error:", err4.message);
                      return res.status(500).json({
                        message: "Lỗi xác nhận giao hàng",
                      });
                    }
                    io.emit("updateDetailProjectPO");
                    res.json({
                      message: `Xác nhận giao ${scheduleQty} pcs thành công`,
                    });
                  },
                );
              },
            );
          },
        );
      },
    );
  },

  unconfirmItem(req, res) {
    const { id } = req.params;
    // 1. Lấy thông tin lịch giao
    db.get(
      `SELECT ItemId, DeliveryQuantity, DeliveryStatus FROM ScheduleDelivery WHERE id = ?`,
      [id],
      (err, schedule) => {
        if (err) {
          console.error("Error:", err.message);
          return res.status(500).json({
            message: "Lỗi hủy xác nhận giao hàng",
          });
        }
        if (!schedule) {
          return res.status(404).json({
            message: "Không tìm thấy lịch giao hàng",
          });
        }
        if (schedule.DeliveryStatus !== "Đã giao") {
          return res.status(400).json({
            message: "Lịch giao này chưa được giao, không cần hủy",
          });
        }
        const scheduleQty = Number(schedule.DeliveryQuantity) || 0;
        db.get(
          `SELECT QuantityProduct, IFNULL(QuantityDelivered, 0) AS QuantityDelivered
           FROM ProductDetails WHERE id = ?`,
          [schedule.ItemId],
          (err2, product) => {
            if (err2) {
              console.error("Error:", err2.message);
              return res.status(500).json({
                message: "Lỗi hủy xác nhận giao hàng",
              });
            }
            if (!product) {
              return res.status(404).json({
                message: "Không tìm thấy đơn hàng",
              });
            }
            const delivered = Number(product.QuantityDelivered) || 0;
            // Trừ ngược, chặn âm nếu SL đã bị sửa tay
            const newDelivered = Math.max(0, delivered - scheduleQty);
            db.run(
              `UPDATE ScheduleDelivery
               SET DeliveryStatus = 'Chưa giao', ActualDeliveryDate = NULL
               WHERE id = ? AND DeliveryStatus = 'Đã giao'`,
              [id],
              function (err3) {
                if (err3) {
                  console.error("Error:", err3.message);
                  return res.status(500).json({
                    message: "Lỗi hủy xác nhận giao hàng",
                  });
                }
                if (this.changes === 0) {
                  return res.status(400).json({
                    message: "Lịch giao này chưa được giao, không cần hủy",
                  });
                }
                db.run(
                  `UPDATE ProductDetails
                   SET QuantityDelivered = ?,
                       QuantityAmount = QuantityProduct - ?
                   WHERE id = ?`,
                  [newDelivered, newDelivered, schedule.ItemId],
                  function (err4) {
                    if (err4) {
                      console.error("Error:", err4.message);
                      return res.status(500).json({
                        message: "Lỗi hủy xác nhận giao hàng",
                      });
                    }
                    io.emit("updateDetailProjectPO");
                    res.json({
                      message: `Hủy xác nhận giao ${scheduleQty} pcs thành công`,
                    });
                  },
                );
              },
            );
          },
        );
      },
    );
  },
});
