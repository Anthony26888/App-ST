const db = require("../../database.js");
const { getCompareWareHouse } = require("../../utils/compareWareHouse.js");

module.exports = (socket) => {
  socket.on("getCompare", async (id) => {
    try {
      const query = await getCompareWareHouse(id);
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("compareError", err);
        socket.emit("compareData", rows);
      });
    } catch (error) {
      socket.emit("compareError", error);
    }
  });
};
