const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getFilterBom", async (id) => {
    try {
      const query = `SELECT *
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
