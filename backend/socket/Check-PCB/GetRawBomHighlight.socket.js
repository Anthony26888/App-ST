const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getRawBomHighlight", async (id) => {
    try {
      const query = `SELECT 
                          B.id,
                          B.description,
                          B.mpn,
                          CASE 
                            WHEN M.mount_type IS NOT NULL THEN M.mount_type
                            ELSE B.type
                          END AS type,
                          B.designator,
                          B.quantity,
                          M.image AS image,
                          B.project_id,
                          B.note,
                          M.created_by,
                          F.project_name,
                          GROUP_CONCAT(CASE WHEN P.designator IS NULL THEN Bom.designator ELSE NULL END, ', ') AS is_missing
                      FROM BomHighlight B
                      LEFT JOIN Bom ON Bom.project_id = B.project_id 
                          AND (',' || REPLACE(B.designator, ' ', '') || ',') LIKE ('%,' || TRIM(Bom.designator) || ',%')
                      LEFT JOIN MPNMountType M
                          ON TRIM(LOWER(B.mpn)) = TRIM(LOWER(M.mpn))
                      LEFT JOIN FilterBom F
                          ON TRIM(M.project_id) = F.id
                      LEFT JOIN Pickplace P
                          ON TRIM(LOWER(Bom.designator)) = TRIM(LOWER(P.designator)) AND Bom.project_id = P.project_id
                      WHERE B.project_id = ?
                      GROUP BY B.id;`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("RawBomHighlightError", err);
        socket.emit("RawBomHighlightData", rows);
      });
    } catch (error) {
      socket.emit("RawBomHighlightError", error);
    }
  });
};
