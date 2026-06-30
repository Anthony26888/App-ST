const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getSummary", async (endDay) => {
    try {
      const query = `SELECT *,
                          a.Quantity AS Quantity_Counting,
                          ROUND((CAST(a.Quantity AS REAL) * 100.0 / b.Quantity_Plan), 0) AS Percent
                        FROM ManufactureCounting a
                        LEFT JOIN Summary b ON a.HistoryID = b.id
						LEFT JOIN PlanManufacture c ON b.PlanID = c.id
                        WHERE a.Timestamp = ?`;
      db.all(query, [endDay], (err, rows) => {
        if (err) return socket.emit("SummaryError", err);
        socket.emit("SummaryData", rows);
      });
    } catch (error) {
      socket.emit("SummaryError", error);
    }
  });
};
