const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng
const path = require("path");
const fs = require("fs");

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const {
      TenThietBi,
      LoaiThietBi,
      NhaSanXuat,
      NgayMua,
      ViTri,
      MoTa,
      MachineCode,
    } = req.body;

    const imagePath = req.file ? `/uploads/machine/${req.file.filename}` : null;

    const query = `
      INSERT INTO Machine 
      (TenThietBi, LoaiThietBi, NhaSanXuat, NgayMua, ViTri, MoTa, Image, Condition, MachineCode)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Tốt', ?)
    `;

    db.run(
      query,
      [
        TenThietBi,
        LoaiThietBi,
        NhaSanXuat,
        formatDateLocal(NgayMua),
        ViTri,
        MoTa,
        imagePath,
        MachineCode,
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Lỗi DB" });
        }
        io.emit("MachineUpdate");
        res.json({ message: "Thêm thiết bị thành công" });
      },
    );
  },

  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
    const { id } = req.params;

    const {
      TenThietBi,
      LoaiThietBi,
      NhaSanXuat,
      NgayMua,
      ViTri,
      MoTa,
      TinhTrang,
      MachineCode,
    } = req.body;

    try {
      // ===== lấy ảnh cũ =====
      db.get(
        "SELECT Image FROM Machine WHERE MaThietBi = ?",
        [id],
        (err, row) => {
          if (err) return res.status(500).json({ error: "Lỗi DB" });

          let imagePath = row?.Image || null;

          // ===== nếu upload ảnh mới =====
          if (req.file) {
            imagePath = `/uploads/machine/${req.file.filename}`;

            // 🔥 xoá ảnh cũ (nếu có)
            if (row?.Image) {
              const oldPath = path.join(
                __dirname,
                row.Image.replace("/uploads/", "uploads/"),
              );

              fs.existsSync(oldPath) && fs.unlinkSync(oldPath);
            }
          }

          // ===== update DB =====
          const query = `
            UPDATE Machine 
            SET 
              TenThietBi = ?,
              LoaiThietBi = ?,
              NhaSanXuat = ?,
              NgayMua = ?,
              ViTri = ?,
              MoTa = ?,
              Image = ?,
              Condition = ?,
              MachineCode = ?
            WHERE MaThietBi = ?
          `;

          db.run(
            query,
            [
              TenThietBi,
              LoaiThietBi,
              NhaSanXuat,
              formatDateLocal(NgayMua),
              ViTri,
              MoTa,
              imagePath,
              TinhTrang,
              MachineCode,
              id,
            ],
            function (err) {
              if (err) {
                return res
                  .status(500)
                  .json({ error: "Lỗi khi cập nhật dữ liệu" });
              }

              io.emit("MachineUpdate");
              res.json({ message: "Cập nhật thiết bị thành công" });
            },
          );
        },
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Upload failed" });
    }
  },

  // ============================
  // Delete Item
  // ============================
  deleteItem(req, res) {
    const { id } = req.params;

    // Start a transaction
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      try {
        // Delete related records first
        db.run("DELETE FROM SparePartUsage WHERE MaThietBi = ?", [id]);
        db.run("DELETE FROM Maintenance WHERE MaThietBi = ?", [id]);
        db.run("DELETE FROM MaintenanceSchedule WHERE MaThietBi = ?", [id]);

        // Finally delete the machine
        db.run("DELETE FROM Machine WHERE MaThietBi = ?", [id], function (err) {
          if (err) {
            db.run("ROLLBACK");
            return res
              .status(500)
              .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
          }

          db.run("COMMIT");
          io.emit("MachineUpdate");
          res.json({ message: "Đã xoá dữ liệu thiết bị thành công" });
        });
      } catch (error) {
        db.run("ROLLBACK");
        return res
          .status(500)
          .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
      }
    });
  },
});
