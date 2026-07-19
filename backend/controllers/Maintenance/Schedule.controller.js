const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const {
      MaThietBi,
      LoaiBaoTri,
      ChuKyBaoTri,
      DonViChuKy,
      NgayBatDau,
      NgayBaoTriTiepTheo,
      GhiChu,
    } = req.body;

    // Insert data into SQLite database
    const query = `
    INSERT INTO MaintenanceSchedule (MaThietBi, LoaiBaoTri, ChuKyBaoTri, DonViChuKy, NgayBatDau, NgayBaoTriTiepTheo, GhiChu)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
    db.run(
      query,
      [
        MaThietBi,
        LoaiBaoTri,
        ChuKyBaoTri,
        DonViChuKy,
        formatDateLocal(NgayBatDau),
        formatDateLocal(NgayBaoTriTiepTheo),
        GhiChu,
      ],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu" });
        }
        io.emit("MaintenanceScheduleUpdate");
        io.emit("MachineUpdate");
        res.json({ message: "Đã thêm dữ liệu bảo trì định kỳ thành công" });
      },
    );
  },

  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
    const { id } = req.params;
    const {
      MaThietBi,
      LoaiBaoTri,
      ChuKyBaoTri,
      DonViChuKy,
      NgayBatDau,
      NgayBaoTriTiepTheo,
      GhiChu,
    } = req.body;
    // Insert data into SQLite database
    const query = `
    UPDATE MaintenanceSchedule 
    SET MaThietBi = ?, LoaiBaoTri = ?, ChuKyBaoTri = ?, DonViChuKy = ?, NgayBatDau = ?, NgayBaoTriTiepTheo = ?, GhiChu = ?
    WHERE MaLich = ?
  `;
    db.run(
      query,
      [
        MaThietBi,
        LoaiBaoTri,
        ChuKyBaoTri,
        DonViChuKy,
        formatDateLocal(NgayBatDau),
        formatDateLocal(NgayBaoTriTiepTheo),
        GhiChu,
        id,
      ],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
        }
        io.emit("MaintenanceScheduleUpdate");
        io.emit("MachineUpdate");
        res.json({ message: "Đã cập nhật dữ liệu bảo trì định kỳ thành công" });
      },
    );
  },

  // ============================
  // Delete Item
  // ============================
  deleteItem(req, res) {
    const { id } = req.params;
    // Insert data into SQLite database
    const query = `
    DELETE FROM MaintenanceSchedule WHERE MaLich = ?
  `;
    db.run(query, [id], function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("MaintenanceScheduleUpdate");
      io.emit("MachineUpdate");
      res.json({ message: "Đã xoá dữ liệu bảo trì định kỳ thành công" });
    });
  },
});
