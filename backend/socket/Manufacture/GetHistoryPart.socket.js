const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getHistoryPart", async (id) => {
    try {
      const query = `
                        SELECT 
                            c.id,
                            c.PlanID,
                            c.PartNumber,
                                      c.HistoryID,
                            c.Type AS Source,
                            c.Status,
                            c.Timestamp,
                            c.Note,
                            c.Quantity,
                            c.Surface
                        FROM ManufactureCounting c
                        WHERE c.PlanID = ?`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("HistoryPartError", err);
        socket.emit("HistoryPartData", rows);
      });
    } catch (error) {
      socket.emit("HistoryPartError", error);
    }
  });
};
