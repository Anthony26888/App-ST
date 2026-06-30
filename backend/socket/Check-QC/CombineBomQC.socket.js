const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getCombineBomQC", async (id) => {
    try {
      const query = `SELECT DISTINCT 
                          a.id,
                          a.designator,
                          a.layer,
                          a.mpn,
                          a.x,
                          a.y,
                          a.rotation,
                          a.status,
                          b.description
                        FROM PickplaceQC a
                        LEFT JOIN BOMQC  b ON a.mpn = b.mpn
                        WHERE a.project_id = ?`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("CombineBomQCError", err);
        socket.emit("CombineBomQCData", rows);
      });
    } catch (error) {
      socket.emit("CombineBomQCError", error);
    }
  });
};
