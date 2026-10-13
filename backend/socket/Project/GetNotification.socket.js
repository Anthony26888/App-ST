const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("get-notifications", async () => {
    try {
      const query = `
        SELECT 
          vn.id,
          vn.ItemId,
          vn.Title,
          vn.Message,
          vn.Quantity,
          vn.Icon,
          vn.Color,
          vn.Status,
          vn.DaysRemaining,
          sd.DeliveryDate,
          sd.DeliveryQuantity,
          sd.DeliveryStatus,
          COALESCE((
            SELECT SUM(mc.Quantity)
            FROM PlanManufacture p
            JOIN ManufactureCounting mc ON mc.PlanID = p.id
            WHERE p.ProjectID = sd.ItemId
              AND LOWER(TRIM(mc.Type)) = 'thành phẩm'
          ), 0) AS ProducedQuantity,
          COALESCE((
            SELECT QuantityProduct FROM ProductDetails WHERE id = sd.ItemId
          ), 0) AS OrderTotal,
          q.Seq,
          vn.IsRead
        FROM vw_NotificationDelivery vn
        LEFT JOIN ScheduleDelivery sd ON vn.id = sd.id
        LEFT JOIN (
          SELECT
            id,
            ROW_NUMBER() OVER (
              PARTITION BY ItemId
              ORDER BY DeliveryDate IS NULL, DeliveryDate, id
            ) AS Seq
          FROM ScheduleDelivery
        ) q ON q.id = sd.id
        WHERE vn.Title IS NOT NULL     
        ORDER BY vn.DaysRemaining ASC
      `;

      db.all(query, (err, rows) => {
        if (err) {
          socket.emit("notifications-error", { error: err.message });
          return;
        }
        socket.emit("notifications-update", rows || []);
      });
    } catch (error) {
      socket.emit("notifications-error", { error: error.message });
    }
  });
  // Client request statistics
  socket.on("get-statistics", async () => {
    try {
      const query = `
        SELECT 
          COUNT(*) AS Total,
          SUM(CASE WHEN CAST((DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 0 THEN 1 ELSE 0 END) AS Today,
          SUM(CASE WHEN CAST((DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) = 1 THEN 1 ELSE 0 END) AS Tomorrow,
          SUM(CASE WHEN CAST((DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) IN (2, 3) THEN 1 ELSE 0 END) AS SoonAfter
        FROM ScheduleDelivery
        WHERE DeliveryStatus = 'Chưa giao'
          AND CAST((DeliveryDate - (strftime('%s', 'now', 'localtime'))) / 86400 AS INTEGER) BETWEEN 0 AND 3
      `;

      db.all(query, (err, rows) => {
        if (err) {
          socket.emit("statistics-error", { error: err.message });
          return;
        }
        socket.emit("statistics-update", rows[0] || {});
      });
    } catch (error) {
      socket.emit("statistics-error", { error: error.message });
    }
  });

  // Mark notification as read
  socket.on("mark-notification-read", async (notificationId) => {
    try {
      const query = `
        INSERT OR IGNORE INTO NotificationReadStatus (notification_id)
        VALUES (?)
      `;

      db.run(query, [notificationId], (err) => {
        if (err) {
          console.error("❌ Error marking notification as read:", err.message);
          socket.emit("notification-read-error", { error: err.message });
          return;
        }

        console.log(`✅ Notification #${notificationId} marked as read`);

        // Broadcast to all clients to refresh notifications
        // (module này không có io global - dùng broadcast + self)
        socket.emit("notification-marked-read", { id: notificationId });
        socket.broadcast.emit("notification-marked-read", { id: notificationId });
      });
    } catch (error) {
      console.error("❌ Error:", error.message);
      socket.emit("notification-read-error", { error: error.message });
    }
  });
  // Mark all notifications as read
  socket.on("mark-all-notifications-read", async () => {
    try {
      // Get all unread notification IDs
      const getUnreadQuery = `
          SELECT id FROM vw_NotificationDelivery WHERE IsRead = 0
        `;

      db.all(getUnreadQuery, [], (err, rows) => {
        if (err) {
          socket.emit("notification-read-error", { error: err.message });
          return;
        }

        if (rows.length === 0) {
          socket.emit("all-notifications-marked-read");
          socket.broadcast.emit("all-notifications-marked-read");
          return;
        }

        // Insert all notification IDs into NotificationReadStatus
        const placeholders = rows.map(() => "(?)").join(",");
        const insertQuery = `
            INSERT OR IGNORE INTO NotificationReadStatus (notification_id)
            VALUES ${placeholders}
          `;
        const ids = rows.map((row) => row.id);

        db.run(insertQuery, ids, (err) => {
          if (err) {
            console.error(
              "❌ Error marking all notifications as read:",
              err.message,
            );
            socket.emit("notification-read-error", { error: err.message });
            return;
          }

          console.log(`✅ Marked ${rows.length} notifications as read`);

          // Broadcast to all clients to refresh notifications
          socket.emit("all-notifications-marked-read");
          socket.broadcast.emit("all-notifications-marked-read");
        });
      });
    } catch (error) {
      console.error("❌ Error:", error.message);
      socket.emit("notification-read-error", { error: error.message });
    }
  });

  // Lịch đã giao trong 7 ngày qua (section "Đã giao 7 ngày" ở Overview)
  socket.on("get-delivered-recent", async () => {
    try {
      const query = `
        SELECT
          sd.id,
          sd.ItemId,
          pd.POID || ' - ' || pd.ProductDetail AS Message,
          sd.DeliveryQuantity AS Quantity,
          sd.ActualDeliveryDate,
          q.Seq
        FROM ScheduleDelivery sd
        LEFT JOIN ProductDetails pd ON pd.id = sd.ItemId
        LEFT JOIN (
          SELECT
            id,
            ROW_NUMBER() OVER (
              PARTITION BY ItemId
              ORDER BY DeliveryDate IS NULL, DeliveryDate, id
            ) AS Seq
          FROM ScheduleDelivery
        ) q ON q.id = sd.id
        WHERE sd.DeliveryStatus = 'Đã giao'
          AND sd.ActualDeliveryDate IS NOT NULL
          AND date(sd.ActualDeliveryDate, 'unixepoch', 'localtime') >= date('now', 'localtime', '-6 days')
        ORDER BY sd.ActualDeliveryDate DESC
      `;
      db.all(query, [], (err, rows) => {
        if (err) {
          socket.emit("delivered-recent-error", { error: err.message });
          return;
        }
        socket.emit("delivered-recent-update", rows || []);
      });
    } catch (error) {
      socket.emit("delivered-recent-error", { error: error.message });
    }
  });
};
