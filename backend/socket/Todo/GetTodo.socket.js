const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getToDo", () => {
    try {
      const query = `SELECT *,
                        strftime('%d-%m-%Y', createdAt, 'unixepoch', 'localtime') AS createdAt,
                        strftime('%Y-%m-%d', createdAt, 'unixepoch', 'localtime') AS updatedAt
                      FROM ToDos
                      ORDER BY id DESC`;
      // FIXED: Added an empty params array [] to match your code's pattern for db.all
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("todoError", err);
        socket.emit("todoData", rows);
      });
    } catch (error) {
      socket.emit("todoError", error);
    }
  });
};
