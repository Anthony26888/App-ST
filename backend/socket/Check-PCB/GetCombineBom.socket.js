const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getCombineBom", async (id) => {
    try {
      const query = `WITH pm_match AS (
                        SELECT 
                            b.project_id,
                            b.designator, 
                            pm.package,
                            pm.width,
                            pm.length,
                            pm.id,
                            LENGTH(pm.package) AS match_len,
                            ROW_NUMBER() OVER (
                                PARTITION BY b.project_id, b.designator
                                ORDER BY LENGTH(pm.package) DESC
                            ) AS rn
                        FROM Bom b
                        JOIN Components pm 
                            ON UPPER(b.description) LIKE '%' || UPPER(pm.package) || '%'
                    )

                    SELECT 
                        p.id,
                        p.project_id,
                        o.id AS id_components_overrides,
                        pm.id AS id_component,
                        p.designator,
                        ROUND(p.x, 2) AS x,
                        ROUND(p.y, 2) AS y,
                        p.rotation, 
                        p.layer,
                        p.type,
                        b.mpn,
                        b.description AS description_bom,
                        b.note,
                        COALESCE(o.width, pm.width)  AS width,
                        COALESCE(o.length, pm.length) AS length,
                        pm.package AS package,

                        -- SOURCE
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
        if (err) return socket.emit("CombineBomError", err);
        socket.emit("CombineBomData", rows);
      });
    } catch (error) {
      socket.emit("CombineBomError", error);
    }
  });
};
