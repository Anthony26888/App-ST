const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getManufactureDetails", async (id) => {
    try {
      const query = `
                    SELECT 
                      a.id,
                      a.Name,
                      a.Name_Order,
                      a.Total,
                      a.DelaySMT,
                      a.Quantity,
                      a.Level,
                      a.Date,
                      COALESCE(cnt.Quantity_Pass, 0) AS Quantity_Pass

                    FROM PlanManufacture a
                    LEFT JOIN (
                      SELECT 
                        PlanID,
                        SUM(CASE WHEN Type = 'Thành phẩm' AND Status = 'pass' THEN 1 ELSE 0 END) AS Quantity_Pass
                      FROM ManufactureCounting
                      GROUP BY PlanID
                    ) cnt ON cnt.PlanID = a.id

                    WHERE a.id = ?
                  `;
      db.get(query, [id], (err, row) => {
        if (err) return socket.emit("ManufactureDetailsError", err);
        socket.emit("ManufactureDetailsData", row);
      });
    } catch (error) {
      socket.emit("ManufactureDetailsError", error);
    }
  });
};
