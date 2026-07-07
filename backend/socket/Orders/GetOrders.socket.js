const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getOrders", async () => {
    try {
      const query = `SELECT DISTINCT * FROM Orders ORDER BY id DESC`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("ordersError", err);
        socket.emit("ordersData", rows);
      });
    } catch (error) {
      socket.emit("ordersError", error);
    }
  });
};
