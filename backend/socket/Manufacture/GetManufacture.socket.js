const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getManufacture", async () => {
    try {
      const query = `SELECT 
                        z.id,
                        z.Name,
                        z.Name_Order,
                        z.Total,

                        -- Tổng thành phẩm
                        COALESCE(SUM(CASE 
                            WHEN LOWER(TRIM(b.Type)) = 'thành phẩm' THEN b.Quantity
                            ELSE 0 
                        END), 0) AS Total_Output,

                        -- Trạng thái
                        CASE
                            WHEN z.Total = COALESCE(SUM(CASE 
                                WHEN LOWER(TRIM(b.Type)) = 'thành phẩm' THEN 1 
                                ELSE 0 
                            END), 0)
                            THEN 'Hoàn thành'
                            ELSE 'Đang sản xuất'
                        END AS Status_Output,

                        z.Level,
                        z.Date AS Date,

                        -- Progress phải viết lại công thức
                        (
                            COALESCE(SUM(CASE 
                                WHEN LOWER(TRIM(b.Type)) = 'thành phẩm' THEN b.Quantity
                                ELSE 0 
                            END), 0) * 100.0
                            / z.Total
                        ) AS Progress,

                        z.Note,
                        z.Creater,
                        z.DelaySMT,
                        z.Quantity

                    FROM PlanManufacture z
                    LEFT JOIN ManufactureCounting b ON z.id = b.PlanID

                    GROUP BY 
                        z.id,
                        z.Name,
                        z.Name_Order,
                        z.Total,
                        z.Level,
                        z.Date,
                        z.Note,
                        z.Creater,
                        z.DelaySMT,
                        z.Quantity

                    ORDER BY z.Date DESC;`;
      db.all(query, [], (err, rows) => {
        if (err) return socket.emit("ManufactureError", err);
        socket.emit("ManufactureData", rows);
      });
    } catch (error) {
      socket.emit("ManufactureError", error);
    }
  });
};
