const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getInforUser", async (id) => {
    try {
      // FIXED: Fixed typo 'SSELECT' -> 'SELECT'
      const query = `SELECT * FROM Users WHERE Username = ?`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("InforUserError", err);
        socket.emit("InforUserData", rows);
      });
    } catch (error) {
      socket.emit("InforUserError", error);
    }
  });
};
