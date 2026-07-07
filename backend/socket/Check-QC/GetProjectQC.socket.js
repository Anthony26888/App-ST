const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getFilterBomQC", async (id) => {
    try {
      const query = `SELECT 
					            *,				
                      created_at AS Created_at
                      FROM FilterBomQC
                      ORDER BY id DESC`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("FilterBomQCError", err);
        socket.emit("FilterBomQCData", rows);
      });
    } catch (error) {
      socket.emit("FilterBomQCError", error);
    }
  });
};
