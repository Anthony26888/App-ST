const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getWareHouse2Log", async () => {
    try {
      const query = `SELECT DISTINCT 
                        id,
                        PartNumber,
                        Customer,
                        Location,
                        ActionType,
                        Quantity,
                        Updated_by,
                        Created_at
                      FROM WareHouse2Log
                      ORDER BY id DESC`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("WareHouse2LogError", err);
        socket.emit("WareHouse2LogData", rows);
      });
    } catch (error) {
      socket.emit("WareHouse2LogError", error);
    }
  });
  socket.on("getWareHouseLog", async () => {
    try {
      const query = `SELECT DISTINCT 
                        id,
                        PartNumber,
                        Customer,
                        Location,
                        ActionType,
                        Quantity,
                        Updated_by,
                        Created_at
                      FROM WareHouseLog
                      ORDER BY id DESC`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("WareHouseLogError", err);
        socket.emit("WareHouseLogData", rows);
      });
    } catch (error) {
      socket.emit("WareHouseLogError", error);
    }
  });
};
