const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getSparePartUsage", async (id) => {
    try {
      const query = `SELECT DISTINCT * FROM SparePartUsage WHERE MaBaoTri = ?`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("SparePartUsageError", err);
        socket.emit("SparePartUsageData", rows);
      });
    } catch (error) {
      socket.emit("SparePartUsageError", error);
    }
  });
};
