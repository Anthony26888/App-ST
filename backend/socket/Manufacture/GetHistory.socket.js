const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getHistory", async (id) => {
    try {
      const query = `WITH CountingData AS (
                          SELECT 
                            HistoryID,
                            CASE
                              WHEN Status = 'pass'
                              THEN SUM(Quantity) ELSE 0 
                            END AS pass_count
                          FROM ManufactureCounting
                          GROUP BY HistoryID
                        )
                        SELECT 
                          a.id,
                          a.Type,
                          a.Category,
                          a.Quantity_Plan,
                          a.PlanID,
                          c.Name_Order,
                          c.DelaySMT,
                          a.PONumber,
                          a.Line_SMT,
                          a.Time_Plan,
                          a.CycleTime_Plan,
                          a.Action,
                          c.Quantity,
                          a.Surface,
                          a.Note,
                                    a.Created_At,
                          COALESCE(b.pass_count, 0) AS Quantity_Real,
                          ROUND(COALESCE(b.pass_count, 0) * 100.0 / NULLIF(a.Quantity_Plan, 0.0), 1) AS Percent
                          
                        FROM Summary a
                        LEFT JOIN CountingData b ON b.HistoryID = a.id
                        LEFT JOIN PlanManufacture c ON a.PlanID = c.id
  
                        WHERE a.PlanID = ?
  
                        GROUP BY 
                          a.id,
                          a.Type,
                          a.Category,
                          a.Quantity_Plan,
                          a.PlanID,
                          a.PONumber,
                          a.Line_SMT,
                          a.Time_Plan,
                          a.CycleTime_Plan,
                          a.Created_At
  
                        ORDER BY a.Created_At DESC
                        `;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("HistoryError", err);
        socket.emit("HistoryData", rows);
      });
    } catch (error) {
      socket.emit("HistoryError", error);
    }
  });
};
