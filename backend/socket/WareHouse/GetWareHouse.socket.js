const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getWareHouse", async () => {
    try {
      const query = `SELECT DISTINCT 
                        id,
                        Description,
                        PartNumber_1,
                        PartNumber_2,
                        Input,
                        Output,
                        CASE 
                          WHEN Input >= Output THEN IFNULL(Input, 0) - IFNULL(Output, 0)
                          ELSE 0
                        END AS Inventory,
                        Customer,
                        Location,
                        Note,
                        Note_Output
                      FROM WareHouse ORDER BY id ASC`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("WareHouseError", err);
        socket.emit("WareHouseData", rows);
      });
    } catch (error) {
      socket.emit("WareHouseError", error);
    }
  });

  socket.on("getWareHouse2", async () => {
    try {
      const query = `SELECT DISTINCT * FROM WareHouse2 ORDER BY id ASC`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("WareHouse2Error", err);
        socket.emit("WareHouse2Data", rows);
      });
    } catch (error) {
      socket.emit("WareHouse2Error", error);
    }
  });
};
