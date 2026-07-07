const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getUsers", async () => {
    try {
      const query = `SELECT DISTINCT * FROM Users ORDER BY id DESC`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("usersError", err);
        socket.emit("usersData", rows);
      });
    } catch (error) {
      socket.emit("usersError", error);
    }
  });
};
