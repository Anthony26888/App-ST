const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getManufactureCounting", async (id) => {
    try {
      const query = `SELECT 
                              id,
                              PartNumber,
                              Status,
                              Quantity,
                              TimestampRW,
                              Note,
                              Timestamp
                            FROM ManufactureCounting
                            WHERE HistoryID = ?
                            ORDER BY Timestamp DESC`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("ManufactureCountingError", err);
        socket.emit("ManufactureCountingData", rows);
      });
    } catch (error) {
      socket.emit("ManufactureCountingError", error);
    }
  });
};
