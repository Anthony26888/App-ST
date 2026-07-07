const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getWareHouseFind", async (id) => {
    try {
      const query = `SELECT DISTINCT 
                        Customer,
                        CASE
                          WHEN (Input - Output) > 0 THEN IFNULL((Input - Output), 0)
                          ELSE 0 
                        END AS SL_Ton_Kho
                      FROM WareHouse WHERE PartNumber_1 = ? ORDER BY id ASC`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("WareHouseFindError", err);
        socket.emit("WareHouseFindData", rows);
      });
    } catch (error) {
      socket.emit("WareHouseFindError", error);
    }
  });

  socket.on("getWareHouse2Find", async (id) => {
    try {
      const query = `SELECT DISTINCT 
                        Customer,
                        CASE
                          WHEN (Input - Output) > 0 THEN IFNULL((Input - Output), 0)
                          ELSE 0 
                        END AS SL_Ton_Kho_Misa
                      FROM WareHouse2 WHERE PartNumber_1 = ? ORDER BY id ASC`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("WareHouse2FindError", err);
        socket.emit("WareHouse2FindData", rows);
      });
    } catch (error) {
      socket.emit("WareHouse2FindError", error);
    }
  });
};
