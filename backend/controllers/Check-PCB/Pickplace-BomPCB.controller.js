const db = require("../../database.js");

module.exports = (io) => ({
  // ============================
  // Edit Item
  // ============================
  editItemPickplace(req, res) {
    const { id } = req.params;
    const { x, y, rotation, type, layer } = req.body;
    db.run(
      `UPDATE Pickplace 
    SET 
      x = ?, 
      y = ?, 
      rotation = ?,
      type = ?,
      layer = ?
    WHERE id = ?`,
      [x, y, rotation, type, layer, id],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Database error", details: err.message });
        }
        io.emit("CombineBomUpdate");
        io.emit("PnPFileUpdate");
        io.emit("SettingSVGUpdate");
        res.json({ message: "Summary received" });
      },
    );
  },

  editItemOffset(req, res) {
    const { id } = req.params;
    const { offsetX, offsetY } = req.body;

    const ox = Number(offsetX) || 0;
    const oy = Number(offsetY) || 0;

    const query = `
    UPDATE Pickplace
    SET x = x + ?, y = y + ?
    WHERE project_id = ?
  `;

    db.run(query, [ox, oy, id], function (err) {
      if (err) {
        return res.status(500).json({ error: "Update failed" });
      }

      res.json({
        success: true,
        updatedRows: this.changes,
      });
      io.emit("CombineBomUpdate");
      io.emit("PnPFileUpdate");
      io.emit("SettingSVGUpdate");
    });
  },

  // ============================
  // Edit Item Bom highlight
  // ============================
  editItemBomHighlight(req, res) {
    const { id } = req.params;
    const { type } = req.body;
    console.log(req.body);

    db.run(
      `UPDATE BomHighlight 
         SET type = ?
         WHERE id = ?`,
      [type, id],
      (err) => {
        if (err) {
          console.error(err);

          return res.status(500).json({
            error: err.message,
          });
        }

        io.emit("CombineBomUpdate");
        io.emit("PnPFileUpdate");
        io.emit("SettingSVGUpdate");
        io.emit("RawBomHighlightUpdate");
        io.emit("MPNMountTypeUpdate");

        res.json({
          message: "Update success",
        });
      },
    );
  },

  // ============================
  // Edit Item Mpn Type
  // ============================
  addItemMpnType(req, res) {
    const { mpn, mount_type, description, project_id, created_by } = req.body;

    const newImages =
      req.files?.map((file) => `uploads/bomhighlight/${file.filename}`) || [];

    db.get(
      "SELECT image FROM MPNMountType WHERE mpn = ?",
      [mpn],
      (err, row) => {
        if (err) {
          return res.status(500).json(err);
        }

        let oldImages = [];

        try {
          oldImages = JSON.parse(row?.image || "[]");
        } catch (e) {
          oldImages = [];
        }

        // 🔥 merge ảnh cũ + mới
        const mergedImages = [...oldImages, ...newImages];

        db.run(
          `
          INSERT INTO MPNMountType (
            mpn,
            mount_type,
            description,
            image,
            project_id,
            created_by
          )
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(mpn)
          DO UPDATE SET
            mount_type = excluded.mount_type,
            description = excluded.description,
            image = excluded.image,
            project_id = excluded.project_id,
            created_by = excluded.created_by
          `,
          [
            mpn,
            mount_type,
            description,
            JSON.stringify(mergedImages), // 🔥 lưu JSON array
            project_id,
            created_by,
          ],
          (err2) => {
            if (err2) return res.status(500).json(err2);

            io.emit("MPNMountTypeUpdate");
            io.emit("RawBomHighlightUpdate");
            io.emit("CombineBomUpdate");
            io.emit("PnPFileUpdate");
            io.emit("SettingSVGUpdate");
            res.json({ message: "Saved multi images" });
          },
        );
      },
    );
  },

  deleteItemPickplace(req, res) {
    const { id } = req.params;
    db.run(`DELETE FROM Pickplace WHERE project_id = ?`, [id], (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("CombineBomUpdate");
      io.emit("PnPFileUpdate");
      io.emit("SettingSVGUpdate");
      res.json({ message: "Summary received" });
    });
  },

  deleteItemBomHighlight(req, res) {
    const { id } = req.params;
    db.run(`DELETE FROM BomHighlight WHERE project_id = ?`, [id], (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("CombineBomUpdate");
      io.emit("RawBomHighlightUpdate");
      res.json({ message: "Summary received" });
    });
  },

  deleteMpnTypeImage(req, res) {
    const mpn = req.params.mpn + (req.params[0] || "");
    const { image } = req.body;

    db.get(
      `SELECT image FROM MPNMountType WHERE mpn = ?`,
      [mpn],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Kiểm tra nếu không tìm thấy MPN trong database
        if (!row) {
          return res.status(404).json({ error: "MPN không tồn tại" });
        }

        let images = [];

        try {
          images = JSON.parse(row.image || "[]");
        } catch (e) {
          images = [];
        }

        // 🔥 remove 1 image
        images = images.filter((img) => img !== image);

        db.run(
          `UPDATE MPNMountType SET image = ? WHERE mpn = ?`,
          [JSON.stringify(images), mpn],
          (err2) => {
            if (err2) {
              return res.status(500).json({ error: err2.message });
            }

            io.emit("MPNMountTypeUpdate");
            io.emit("RawBomHighlightUpdate");
            io.emit("CombineBomUpdate");
            io.emit("PnPFileUpdate");
            io.emit("SettingSVGUpdate");

            res.json({
              message: "Deleted single image",
              image: image,
            });
          },
        );
      },
    );
  },

  deleteMpnType(req, res) {
    const { mpn } = req.params;
    db.run(`DELETE FROM MPNMountType WHERE mpn = ?`, [mpn], (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      io.emit("MPNMountTypeUpdate");
      io.emit("RawBomHighlightUpdate");
      io.emit("CombineBomUpdate");
      io.emit("PnPFileUpdate");
      io.emit("SettingSVGUpdate");
      res.json({ message: "Summary received" });
    });
  },

  deleteGerberData(req, res) {
    const { id } = req.params;
    db.run(`DELETE FROM GerberData WHERE id = ?`, [id], (err) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }

      io.emit("GerberFileUpdate");
      res.json({ message: "Summary received" });
    });
  },
});
