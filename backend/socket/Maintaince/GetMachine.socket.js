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

                        CASE
                            WHEN a.NgayMua IS NULL OR a.NgayMua = '' THEN NULL
                            WHEN instr(a.NgayMua, '-') > 0 THEN a.NgayMua
                            ELSE strftime('%Y-%m-%d', CAST(a.NgayMua AS INTEGER), 'unixepoch', 'localtime')
                        END AS NgayMuaConvert,

                        a.ViTri,
                        a.MoTa,
                        a.Image,
                        a.Condition,

                        MIN(b.LoaiBaoTri) AS LoaiBaoTri,
                        MIN(b.ChuKyBaoTri) AS ChuKyBaoTri,
                        MIN(b.DonViChuKy) AS DonViChuKy,
                        MAX(b.GhiChu) AS GhiChu,

                        CASE
                            WHEN MIN(b.NgayBatDau) IS NULL OR MIN(b.NgayBatDau) = '' THEN NULL
                            WHEN instr(MIN(b.NgayBatDau), '-') > 0 THEN MIN(b.NgayBatDau)
                            ELSE strftime('%Y-%m-%d', CAST(MIN(b.NgayBatDau) AS INTEGER), 'unixepoch', 'localtime')
                        END AS NgayBaoTriConvert,

                        CASE
                            WHEN MIN(b.NgayBaoTriTiepTheo) IS NULL OR MIN(b.NgayBaoTriTiepTheo) = '' THEN NULL
                            WHEN instr(MIN(b.NgayBaoTriTiepTheo), '-') > 0 THEN MIN(b.NgayBaoTriTiepTheo)
                            ELSE strftime('%Y-%m-%d', CAST(MIN(b.NgayBaoTriTiepTheo) AS INTEGER), 'unixepoch', 'localtime')
                        END AS NgayBaoTriTiepTheoConvert,

                        CASE
                            WHEN MIN(b.NgayBaoTriTiepTheo) IS NULL THEN NULL

                            WHEN instr(MIN(b.NgayBaoTriTiepTheo), '-') > 0 THEN
                                CASE
                                    WHEN julianday(MIN(b.NgayBaoTriTiepTheo)) - julianday('now','localtime') > 15
                                    THEN 'Chưa tới hạn'
                                    ELSE 'Cần bảo trì'
                                END

                            ELSE
                                CASE
                                    WHEN CAST((CAST(MIN(b.NgayBaoTriTiepTheo) AS INTEGER) - strftime('%s','now','localtime')) / 86400 AS INTEGER) > 15
                                    THEN 'Chưa tới hạn'
                                    ELSE 'Cần bảo trì'
                                END
                        END AS Status,

                        COALESCE(
                            GROUP_CONCAT(
                                DISTINCT json_object(
                                    'MaLich', b.MaLich,
                                    'LoaiBaoTri', b.LoaiBaoTri,
                                    'ChuKyBaoTri', b.ChuKyBaoTri,
                                    'DonViChuKy', b.DonViChuKy,

                                    'NgayBaoTriTiepTheo',
                                    CASE
                                        WHEN b.NgayBaoTriTiepTheo IS NULL OR b.NgayBaoTriTiepTheo = '' THEN NULL
                                        WHEN instr(b.NgayBaoTriTiepTheo, '-') > 0 THEN b.NgayBaoTriTiepTheo
                                        ELSE strftime('%Y-%m-%d', CAST(b.NgayBaoTriTiepTheo AS INTEGER), 'unixepoch', 'localtime')
                                    END,

                                    'GhiChu', b.GhiChu,

                                    'Status',
                                    CASE
                                        WHEN b.NgayBaoTriTiepTheo IS NULL THEN NULL

                                        WHEN instr(b.NgayBaoTriTiepTheo, '-') > 0 THEN
                                            CASE
                                                WHEN julianday(b.NgayBaoTriTiepTheo) - julianday('now','localtime') > 15
                                                THEN 'Chưa tới hạn'
                                                ELSE 'Cần bảo trì'
                                            END

                                        ELSE
                                            CASE
                                                WHEN CAST((CAST(b.NgayBaoTriTiepTheo AS INTEGER) - strftime('%s','now','localtime')) / 86400 AS INTEGER) > 15
                                                THEN 'Chưa tới hạn'
                                                ELSE 'Cần bảo trì'
                                            END
                                    END
                                )
                            ),
                            '[]'
                        ) AS Schedules

                    FROM Machine a
                    LEFT JOIN MaintenanceSchedule b
                        ON a.MaThietBi = b.MaThietBi
                    LEFT JOIN Maintenance m
                        ON a.MaThietBi = m.MaThietBi

                    GROUP BY a.MaThietBi
                    ORDER BY a.MaThietBi DESC;`;
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
