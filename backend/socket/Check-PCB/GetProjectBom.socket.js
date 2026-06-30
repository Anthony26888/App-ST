const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getFilterBom", async (id) => {
    try {
      const query = `SELECT 
					            *,				
                      strftime('%d-%m-%Y', created_at, 'unixepoch', 'localtime') AS Created_at_unixepoch,
                      strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') AS Created_at
                      FROM FilterBom
                      ORDER BY id DESC`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("FilterBomError", err);
        socket.emit("FilterBomData", rows);
      });
    } catch (error) {
      socket.emit("FiterBomError", error);
    }
  });
};
