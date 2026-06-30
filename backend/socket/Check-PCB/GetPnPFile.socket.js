const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getPnPFile", async (id) => {
    try {
      const query = `WITH pm_match AS (
                          SELECT 
                              b.project_id,
                              b.designator, 
                              pm.package,
                              pm.width,
                              pm.length,
                              LENGTH(pm.package) AS match_len,
                              ROW_NUMBER() OVER (
                                  PARTITION BY b.project_id, b.designator
                                  ORDER BY LENGTH(pm.package) DESC
                              ) AS rn
                          FROM Bom b
                          JOIN Components pm 
                              ON b.description LIKE '%' || pm.package || '%'
                      )
                      SELECT 
                          p.id,
                          p.project_id,
                          p.designator,
                          ROUND(p.x, 2) AS x,
                          ROUND(p.y, 2) AS y,
                          p.rotation, 
                          p.layer,
                          p.type,
                          b.description AS description_bom,
                          b.mpn,
                          COALESCE(o.width, pm.width)  AS width,
                          COALESCE(o.length, pm.length) AS length,   -- sửa theo field của bạn
                          COALESCE(o.package, pm.package) AS package,
                          b.note,
                          CASE
                              WHEN o.mpn IS NOT NULL THEN 'override'
                              WHEN pm.package IS NOT NULL THEN 'package_map'
                              ELSE 'missing'
                          END AS source

                      FROM Pickplace p
                      LEFT JOIN Bom b
                          ON p.designator = b.designator 
                        AND p.project_id = b.project_id
                      LEFT JOIN pm_match pm
                          ON b.designator = pm.designator 
                        AND b.project_id = pm.project_id 
                        AND pm.rn = 1
                      LEFT JOIN Component_overrides o
                          ON b.mpn = o.mpn
                      WHERE p.project_id = ?`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("PnPFileError", err);
        socket.emit("PnPFileData", rows);
      });
    } catch (error) {
      socket.emit("PnPFileError", error);
    }
  });
};
