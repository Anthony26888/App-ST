const db = require("../database.js");
const getPivotQuery = async (id) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT Bom FROM CheckBOM WHERE PO= ?`,
      [id],
      (err, Boms) => {
        if (err) return reject(err);

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

        // Full SQL query
        const query = `
          SELECT 
            a.Description, 
            a.Manufacturer_1,
            a.PartNumber_1,
            a.Manufacturer_2,
            a.PartNumber_2,
            a.Manufacturer_3,
            a.PartNumber_3,  
            ${columns},
            ROUND((${sumColumns}), 2) AS SL_Tổng,
            CASE
              WHEN (b.Input - b.Output) > 0 THEN IFNULL((b.Input - b.Output), 0)
              ELSE 0 
            END AS SL_Tồn_Kho,
            b.Customer AS Mã_Kho,
            CASE
              WHEN (c.Input - c.Output) > 0 THEN IFNULL((c.Input - c.Output), 0)
              ELSE 0 
            END AS SL_Tồn_Kho_Misa,
            c.Customer AS Mã_Kho_Misa,
            IFNULL(a.Du_Toan_Hao_Phi, 0) AS Dự_Toán_Hao_Phí,
            IFNULL(a.Hao_Phi_Thuc_Te, 0) AS Hao_Phi_Thuc_Te,
            a.So_Luong,
            a.SL_Board,
            a.Bom,
            a.PO,
            a.id AS Sửa
          FROM CheckBOM a
          LEFT JOIN WareHouse b ON a.PartNumber_1 = b.PartNumber_1
          LEFT JOIN WareHouse2 c ON a.PartNumber_1 = c.PartNumber_1
          WHERE a.PO = ?
          GROUP BY a.PartNumber_1;
        `;
        resolve(query);
      },
    );
  });
};
module.exports = getPivotQuery;
