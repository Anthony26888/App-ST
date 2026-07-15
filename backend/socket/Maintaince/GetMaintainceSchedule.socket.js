const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getMaintenanceSchedule", async (id) => {
    try {
      const query = `SELECT DISTINCT *,
                        julianday(NgayBaoTriTiepTheo, 'localtime') - julianday(NgayBatDau, 'localtime') AS SoNgayConLai
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
