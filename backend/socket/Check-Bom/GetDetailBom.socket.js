const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getDetailBom", async () => {
    try {
      const query = `SELECT DISTINCT id, PO, Bom, COUNT(Bom) AS SL_LK, SL_Board, Creater, TimeStamp FROM CheckBOM GROUP BY PO, Bom ORDER BY id DESC`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("detailBomError", err);
        socket.emit("detailBomData", rows);
      });
    } catch (error) {
      socket.emit("detailBomError", error);
    }
  });
};
