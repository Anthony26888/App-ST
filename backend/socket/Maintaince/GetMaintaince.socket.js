const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getMaintenance", async (id) => {
    try {
      const query = `SELECT 
                            m.*,
                            strftime('%d-%m-%Y', m.NgayBaoTri, 'unixepoch', 'localtime') AS NgayBaoTriConvert,
                            strftime('%Y-%m-%d', m.NgayBaoTri, 'unixepoch', 'localtime') AS NgayBaoTriUnixepoch,
                            strftime('%d-%m-%Y', m.NgayHoanThanh, 'unixepoch', 'localtime') AS NgayHoanThanhConvert,
                            strftime('%Y-%m-%d', m.NgayHoanThanh, 'unixepoch', 'localtime') AS NgayHoanThanhUnixepoch,
                            COALESCE(
                                '[' || GROUP_CONCAT(
                                    CASE WHEN s.MaSuDung IS NOT NULL THEN
                                      json_object(
                                          'id', s.MaSuDung,
                                          'TenPhuTung', s.TenPhuTung,
                                          'SoLuongSuDung', s.SoLuongSuDung,
                                          'DonVi', s.DonVi,
                                          'GhiChu', s.GhiChu
                                      )
                                    END
                                ) || ']',
                                '[]'
                            ) AS Accessories
                        FROM Maintenance m
                        LEFT JOIN SparePartUsage s ON m.MaBaoTri = s.MaBaoTri
                        WHERE m.MaThietBi = ? 
                        GROUP BY m.MaBaoTri
                        ORDER BY m.NgayBaoTri DESC`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("MaintenanceError", err);
        socket.emit("MaintenanceData", rows);
      });
    } catch (error) {
      socket.emit("MaintenanceError", error);
    }
  });
};
