const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getTemporaryWareHouse", async () => {
    try {
      const query = `SELECT 
                      a.id,
                      a.PartNumber_1,
                      a.Description,
                      a.Location AS Location_1,
                      b.Location AS Location_2,
                      CASE
                        WHEN (b.Input - b.Output) > 0 THEN (b.Input - b.Output)
                        ELSE 0
                      END AS Inventory,
                      CASE
                        WHEN b.PartNumber_1 IS NULL OR b.Description IS NULL OR b.Location IS NULL THEN 'Chưa xác minh'
                        ELSE 'Đã xác minh'
                      END AS Status,
                      a.Input,
                      CASE
                        WHEN (b.Input - (b.Output + a.Input)) > 0 THEN (b.Input - (b.Output + a.Input))
                        ELSE 0
                      END AS Quantity_Amount,
                      a.Note
                    FROM Temporary_WareHouse a
                    LEFT JOIN (
                      SELECT 
                        PartNumber_1,
                        Description,
                        Location,
                        Inventory,
                        Input,
                        Output,
                        Note
                      FROM WareHouse 
                    ) AS b 
                    ON a.PartNumber_1 = b.PartNumber_1 
                      AND a.Description = b.Description 
                      AND a.Location = b.Location;`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("TemporaryWareHouseError", err);
        socket.emit("TemporaryWareHouseData", rows);
      });
    } catch (error) {
      socket.emit("TemporaryWareHouseError", error);
    }
  });

  socket.on("getTemporaryWareHouse2", async () => {
    try {
      const query = `SELECT 
                      a.id,
                      a.PartNumber_1,
                      a.Description,
                      a.Location AS Location_1,
                      b.Location AS Location_2,
                      (b.Input - b.Output) AS Inventory,
                      CASE
                        WHEN b.PartNumber_1 IS NULL OR b.Description IS NULL OR b.Location IS NULL THEN 'Chưa xác minh'
                        ELSE 'Đã xác minh'
                      END AS Status,
                      a.Input,
                      (b.Input - (b.Output + a.Input)) AS Quantity_Amount,
                      a.Note
                    FROM Temporary_WareHouse_2 a
                    LEFT JOIN (
                      SELECT 
                        PartNumber_1,
                        Description,
                        Location,
                        Inventory,
                        Input,
                        Output,
                        Note
                      FROM WareHouse2 
                    ) AS b 
                    ON a.PartNumber_1 = b.PartNumber_1 
                      AND a.Description = b.Description 
                      AND a.Location = b.Location;`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("TemporaryWareHouse2Error", err);
        socket.emit("TemporaryWareHouse2Data", rows);
      });
    } catch (error) {
      socket.emit("TemporaryWareHouse2Error", error);
    }
  });
};
