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
          vn.IsRead
        FROM vw_NotificationDelivery vn
        LEFT JOIN ScheduleDelivery sd ON vn.id = sd.id
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
        io.emit("notification-marked-read", { id: notificationId });
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
          io.emit("all-notifications-marked-read");
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
          io.emit("all-notifications-marked-read");
        });
      });
    } catch (error) {
      console.error("❌ Error:", error.message);
      socket.emit("notification-read-error", { error: error.message });
    }
  });
};
