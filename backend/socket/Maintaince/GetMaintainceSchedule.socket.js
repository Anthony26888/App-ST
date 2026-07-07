const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getMaintenanceSchedule", async (id) => {
    try {
      const query = `SELECT DISTINCT *,  
                       CAST(
                          (NgayBaoTriTiepTheo - strftime('%s', 'now', 'localtime')) / 86400
                          AS INTEGER
                        ) AS SoNgayConLai,
                        strftime('%d-%m-%Y', NgayBatDau, 'unixepoch', 'localtime') AS NgayBatDauConvert,
                        strftime('%Y-%m-%d', NgayBatDau, 'unixepoch', 'localtime') AS NgayBatDauUnixepoch,
                        strftime('%d-%m-%Y', NgayBaoTriTiepTheo, 'unixepoch', 'localtime') AS NgayBaoTriTiepTheoConvert,
                        strftime('%Y-%m-%d', NgayBaoTriTiepTheo, 'unixepoch', 'localtime') AS NgayBaoTriTiepTheoUnixepoch
                        FROM MaintenanceSchedule 
                        WHERE MaThietBi = ?
                        ORDER BY NgayBaoTriTiepTheo ASC`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("MaintenanceScheduleError", err);
        socket.emit("MaintenanceScheduleData", rows);
      });
    } catch (error) {
      socket.emit("MaintenanceScheduleError", error);
    }
  });
};
