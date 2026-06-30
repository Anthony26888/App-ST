const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getBomHighlight", (project_id) => {
    const ppQuery = `
        SELECT designator, LOWER(TRIM(layer)) as layer
        FROM Pickplace
        WHERE project_id = ?
      `;

    db.all(ppQuery, [project_id], (err, ppRows) => {
      if (err) return socket.emit("error", err.message);

      // Map designator -> layer
      const map = new Map();
      ppRows.forEach((r) => {
        const key = String(r.designator || "")
          .trim()
          .toUpperCase();

        map.set(key, r.layer);
      });

      const bomQuery = `
          SELECT * FROM Bom
          WHERE project_id = ?
        `;

      db.all(bomQuery, [project_id], (err, bomRows) => {
        if (err) return socket.emit("error", err.message);

        const result = bomRows.map((row) => {
          const original = String(row.designator || "");

          const parts = original.split(",").map((s) => s.trim());

          const parsed = parts.map((p) => {
            const key = p.toUpperCase();
            const layer = map.get(key);

            let status = "normal";

            if (!layer) {
              status = "missing"; // (optional)
            } else if (layer === "bottom" || layer === "bottomlayer") {
              status = "bottom"; // 🔴
            }

            return {
              text: p, // giữ nguyên text
              status,
            };
          });

          return {
            ...row,
            designatorParsed: parsed,
          };
        });

        socket.emit("BomHighlightData", result);
      });
    });
  });
};
