const db = require("../../database.js");
module.exports = (socket) => {
  socket.on("getRawBomQC", async (id) => {
    try {
      const query = `SELECT
                          b.id,
                          b.description,
                          b.mpn,
                          b.designator,
                          b.quantity,

                          GROUP_CONCAT(p.designator) AS pnp_designators,
                          GROUP_CONCAT(p.x) AS xs,
                          GROUP_CONCAT(p.y) AS ys,
                          GROUP_CONCAT(p.rotation) AS rotations,
                          GROUP_CONCAT(p.layer) AS layers

                      FROM BomQC b
                      LEFT JOIN PickplaceQC p
                          ON ',' || REPLACE(b.designator,' ','') || ','
                            LIKE '%,' || p.designator || ',%'

                      WHERE b.project_id = ?

                      GROUP BY
                          b.id,
                          b.description,
                          b.mpn,
                          b.designator,
                          b.quantity;`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("RawBomQCError", err);
        socket.emit("RawBomQCData", rows);
      });
    } catch (error) {
      socket.emit("RawBomQCError", error);
    }
  });
};
