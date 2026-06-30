const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getGerberFile", async (id) => {
    try {
      const query = `SELECT DISTINCT  *
                        FROM GerberData
                        WHERE project_id = ?`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("GerberFileError", err);
        socket.emit("GerberFileData", rows);
      });
    } catch (error) {
      socket.emit("GerberFileError", error);
    }
  });
};
