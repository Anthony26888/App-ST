const db = require("../database.js");
const getCompareWareHouse = async (id) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT Bom FROM DetailOrders WHERE PO = ?`,
      [id],
      (err, Boms) => {
        if (err) return reject(err);

        // Create dynamic column aggregation
        // Create dynamic column aggregation
        const columns = Boms.map(
          (bom) =>
            `MAX(CASE WHEN a.Bom = '${bom.Bom}' THEN (a.So_Luong * a.SL_Board) ELSE NULL END) AS [${bom.Bom}]`,
        ).join(", ");

        // Tạo biểu thức tổng từ các cột động
        const sumColumns = Boms.map(
          (bom) =>
            `MAX(CASE WHEN a.Bom = '${bom.Bom}' THEN (a.So_Luong * a.SL_Board) ELSE 0 END)`,
        ).join(" + ");

        const Buy = `
          CASE 
            WHEN (SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0)) > (IFNULL(i.Input, 0) - IFNULL(i.Output, 0))
            THEN SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0) - (IFNULL(i.Input, 0) - IFNULL(i.Output, 0))
            ELSE 0 
          END AS Số_Lượng_Cần_Mua
        `;
        const BuyMisa = `
          CASE 
            WHEN (SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0)) > (IFNULL(w2.Input, 0) - IFNULL(w2.Output, 0))
            THEN SUM(c.So_Luong * c.SL_Board) + IFNULL(c.Hao_Phi_Thuc_Te, 0) - (IFNULL(w2.Input, 0) - IFNULL(w2.Output, 0))
            ELSE 0 
          END AS Số_Lượng_Cần_Mua_Misa
        `;
        // Full SQL query
        const query = `
          SELECT 
            a.Description, 
            a.Manufacturer_1,
            a.PartNumber_1,
            ${columns},
            ROUND((${sumColumns}), 2) AS SL_Tổng,
            CASE
              WHEN (b.Input - b.Output) > 0 THEN (b.Input - b.Output)
              ELSE 0
            END AS SL_Tồn_Kho,
            a.Ma_Kho AS Mã_Kho,
            CASE
              WHEN (c.Input - c.Output) > 0 THEN (c.Input - c.Output)
              ELSE 0
            END AS SL_Tồn_Kho_Misa,
            a.Ma_Kho_Misa AS Mã_Kho_Misa,
            a.id AS Sửa
          FROM DetailOrders a
          LEFT JOIN (
            SELECT PartNumber_1, Customer, Input, Output
            FROM WareHouse
          ) b ON a.PartNumber_1 = b.PartNumber_1 AND a.Ma_Kho = b.Customer
          LEFT JOIN (
              SELECT PartNumber_1, Customer, Input, Output
              FROM WareHouse2
          ) c ON a.PartNumber_1 = c.PartNumber_1 AND a.Ma_Kho_Misa = c.Customer
          WHERE a.PO = ?
          GROUP BY a.PartNumber_1;
        `;
        resolve(query);
      },
    );
  });
};
