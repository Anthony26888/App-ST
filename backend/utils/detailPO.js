const db = require("../database.js");
const getDetailPO = async (id) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT DISTINCT Bom FROM CheckBOM WHERE PO= ?`,
      [id],
      (err, Boms) => {
        if (err) return reject(err);

        // Create dynamic column aggregation

        // Full SQL query
        const query = `
          SELECT DISTINCT
            a.Description, 
            a.Manufacturer_1,
            a.PartNumber_1,
            a.Manufacturer_2,
            a.PartNumber_2,
            a.Manufacturer_3,
            a.PartNumber_3,  
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
            IFNULL(a.Hao_Phi_Thuc_Te, 0) AS Hao_Phí_Thực_Tế,
            a.So_Luong,
            a.SL_Board,
            a.Bom,
            a.PO,
            a.id AS Sửa
        FROM CheckBOM a
        LEFT JOIN (
            SELECT PartNumber_1, Customer, Input, Output
            FROM WareHouse
            GROUP BY PartNumber_1
        ) b ON a.PartNumber_1 = b.PartNumber_1
        LEFT JOIN (
            SELECT PartNumber_1, Customer, Input, Output
            FROM WareHouse2
            GROUP BY PartNumber_1
        ) c ON a.PartNumber_1 = c.PartNumber_1
        WHERE a.PO = ?

        `;
        resolve(query);
      },
    );
  });
};
