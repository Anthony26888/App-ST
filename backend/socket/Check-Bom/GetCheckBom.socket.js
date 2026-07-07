const db = require("../../database.js");
const getPivotQuery = require("../../utils/checkBom.js");

module.exports = (socket) => {
  socket.on("getCheckBOM", async (id) => {
    try {
      const query = await getPivotQuery(id);
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("checkBOMError", err);
        socket.emit("checkBOMData", rows);
      });
    } catch (error) {
      socket.emit("checkBOMError", error);
    }
  });
};
