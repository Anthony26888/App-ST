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
                          F.project_name
                      FROM BomHighlight B
                      LEFT JOIN MPNMountType M
                          ON TRIM(LOWER(B.mpn)) = TRIM(LOWER(M.mpn))
                      LEFT JOIN FilterBom F
                          ON TRIM(M.project_id) = F.id
                      WHERE B.project_id = ?;`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("RawBomHighlightError", err);
        socket.emit("RawBomHighlightData", rows);
      });
    } catch (error) {
      socket.emit("RawBomHighlightError", error);
    }
  });
};
