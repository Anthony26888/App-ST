const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getMachine", async () => {
    try {
      const query = `SELECT 
                        a.MachineCode,
                        a.MaThietBi, 
                        a.TenThietBi, 
                        a.LoaiThietBi, 
                        a.NhaSanXuat, 
                        strftime('%Y-%m-%d', a.NgayMua, 'unixepoch', 'localtime') AS NgayMuaUnixpoch,
                        strftime('%d-%m-%Y', a.NgayMua, 'unixepoch', 'localtime') AS NgayMuaConvert,
                        a.ViTri, 
                        a.MoTa, 
                        a.Image,
                        a.Condition,
                        MIN(b.LoaiBaoTri) as LoaiBaoTri,
                        MIN(b.ChuKyBaoTri) as ChuKyBaoTri,
                        MIN(b.DonViChuKy) as DonViChuKy,
                        b.GhiChu,
                        strftime('%Y-%m-%d', MIN(b.NgayBatDau), 'unixepoch', 'localtime') AS NgayBaoTriUnixepoch,
                        strftime('%d-%m-%Y', MIN(b.NgayBatDau), 'unixepoch', 'localtime') AS NgayBaoTriConvert,
                        strftime('%Y-%m-%d', MIN(b.NgayBaoTriTiepTheo), 'unixepoch', 'localtime') AS NgayBaoTriTiepTheoUnixepoch,
                        strftime('%d-%m-%Y', MIN(b.NgayBaoTriTiepTheo), 'unixepoch', 'localtime') AS NgayBaoTriTiepTheoConvert,
                        CASE
                          WHEN CAST((MIN(b.NgayBaoTriTiepTheo) - strftime('%s', 'now', 'localtime')) / 86400 AS INTEGER) > 15 THEN 'Chưa tới hạn'
                          ELSE 'Cần bảo trì'
                        END AS Status,
                        COALESCE(
                            GROUP_CONCAT(DISTINCT
                                json_object(
                                    'MaLich', b.MaLich,
                                    'LoaiBaoTri', b.LoaiBaoTri,
                                    'ChuKyBaoTri', b.ChuKyBaoTri,
                                    'DonViChuKy', b.DonViChuKy,
                                    'NgayBaoTriTiepTheo', strftime('%d-%m-%Y', b.NgayBaoTriTiepTheo, 'unixepoch', 'localtime'),
                                    'GhiChu', b.GhiChu,
                                    'Status', CASE
                                        WHEN CAST((b.NgayBaoTriTiepTheo - strftime('%s', 'now', 'localtime')) / 86400 AS INTEGER) > 15 THEN 'Chưa tới hạn'
                                        ELSE 'Cần bảo trì'
                                    END
                                )
                            ), '[]'
                        ) as Schedules
                      FROM Machine a 
                      LEFT JOIN MaintenanceSchedule b 
                      ON a.MaThietBi = b.MaThietBi
                      LEFT JOIN Maintenance m ON a.MaThietBi = m.MaThietBi
                      GROUP BY a.MaThietBi 
                      ORDER BY a.ViTri ASC`;
      db.all(query, [], (err, rows) => {
        if (err) {
          console.error("MachineError", err);
          return socket.emit("MachineError", err);
        }
        // SQLite GROUP_CONCAT returns a comma-separated string of JSON objects, which is NOT valid JSON array [{},{}]
        // We need to fix it here or in frontend.
        // However, simpler is to do it in frontend as we did before.
        // BUT wait, DISTINCT json_object might NOT work if json_object returns varying strings?
        // Actually, json_object returns string. DISTINCT works on strings.

        socket.emit("MachineData", rows);
      });
    } catch (error) {
      socket.emit("MachineError", error);
    }
  });
};
