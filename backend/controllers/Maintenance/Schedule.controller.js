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
    let Timestamps = formatDateLocal(NgayBatDau);
    let Timestamps2 = formatDateLocal(NgayBaoTriTiepTheo);
    console.log(Timestamps);
    console.log(Timestamps2);

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
    let Timestamps = null;
    if (NgayBatDau) {
      const dateObj = new Date(NgayBatDau); // ví dụ "2025-11-15"
      if (!isNaN(dateObj.getTime())) {
        Timestamps = Math.floor(dateObj.getTime() / 1000);
      } else {
        return res
          .status(400)
          .json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
      }
    } else {
      Timestamps = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
    }
    let Timestamps2 = null;
    if (NgayBaoTriTiepTheo) {
      const dateObj = new Date(NgayBaoTriTiepTheo); // ví dụ "2025-11-15"
      if (!isNaN(dateObj.getTime())) {
        Timestamps2 = Math.floor(dateObj.getTime() / 1000);
      } else {
        return res
          .status(400)
          .json({ error: "Sai định dạng ngày (YYYY-MM-DD)" });
      }
    } else {
      Timestamps2 = Math.floor(Date.now() / 1000); // nếu không truyền thì lấy time hiện tại
    }
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
        Timestamps,
        Timestamps2,
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
