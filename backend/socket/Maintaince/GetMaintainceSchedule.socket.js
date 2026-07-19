const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getMaintenanceSchedule", async (id) => {
    try {
      const query = `SELECT DISTINCT
                        MaLich,
                        MaThietBi,
                        LoaiBaoTri,
                        ChuKyBaoTri,
                        DonViChuKy,
                        CASE WHEN typeof(NgayBatDau) IN ('integer', 'real') THEN strftime('%Y-%m-%d', NgayBatDau, 'unixepoch', 'localtime') ELSE strftime('%Y-%m-%d', NgayBatDau) END AS NgayBatDau,
                        CASE WHEN typeof(NgayBaoTriTiepTheo) IN ('integer', 'real') THEN strftime('%Y-%m-%d', NgayBaoTriTiepTheo, 'unixepoch', 'localtime') ELSE strftime('%Y-%m-%d', NgayBaoTriTiepTheo) END AS NgayBaoTriTiepTheo,
                        GhiChu,
                        CASE WHEN typeof(NgayBatDau) IN ('integer', 'real') THEN strftime('%Y-%m-%d', NgayBatDau, 'unixepoch', 'localtime') ELSE strftime('%Y-%m-%d', NgayBatDau) END AS NgayBatDauUnixepoch,
                        CASE WHEN typeof(NgayBaoTriTiepTheo) IN ('integer', 'real') THEN strftime('%Y-%m-%d', NgayBaoTriTiepTheo, 'unixepoch', 'localtime') ELSE strftime('%Y-%m-%d', NgayBaoTriTiepTheo) END AS NgayBaoTriTiepTheoUnixepoch,
                        CASE
                          WHEN typeof(NgayBaoTriTiepTheo) IN ('integer', 'real') THEN julianday(NgayBaoTriTiepTheo, 'unixepoch', 'localtime')
                          ELSE julianday(strftime('%Y-%m-%d', NgayBaoTriTiepTheo))
                        END -
                        CASE
                          WHEN typeof(NgayBatDau) IN ('integer', 'real') THEN julianday(NgayBatDau, 'unixepoch', 'localtime')
                          ELSE julianday(strftime('%Y-%m-%d', NgayBatDau))
                        END AS SoNgayConLai
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
