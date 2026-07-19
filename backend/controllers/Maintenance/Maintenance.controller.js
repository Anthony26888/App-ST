const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    try {
      const {
        MaThietBi,
        NgayBaoTri,
        LoaiBaoTri,
        MoTaLoi,
        BienPhapKhacPhuc,
        NguoiTao,
        NguoiThucHien,
        ChiPhi,
        NgayHoanThanh,
        TrangThai,
        PhuongAn,
        PhuTung,
      } = req.body;

      // Insert data into SQLite database
      const query = `
      INSERT INTO Maintenance (
        MaThietBi, 
        NgayBaoTri,
        LoaiBaoTri, 
        MoTaLoi, 
        BienPhapKhacPhuc, 
        NguoiTao,
        NguoiThucHien, 
        ChiPhi, 
        NgayHoanThanh, 
        TrangThai,
        PhuongAn,
        PhuTung
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      db.run(
        query,
        [
          MaThietBi,
          formatDateLocal(NgayBaoTri),
          LoaiBaoTri,
          MoTaLoi,
          BienPhapKhacPhuc,
          NguoiTao,
          NguoiThucHien,
          ChiPhi,
          formatDateLocal(NgayHoanThanh),
          TrangThai,
          PhuongAn,
          PhuTung,
        ],
        function (err) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu",
              details: err.message,
            });
          }

          io.emit("MaintenanceUpdate");
          io.emit("SparePartUsageUpdate");
          res.json({
            message: "Thêm dữ liệu bảo trì thành công",
            id: this.lastID,
          });
        },
      );
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({
        error: "Lỗi server",
        details: error.message,
      });
    }
  },

  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
    const { id } = req.params;
    const {
      MaThietBi,
      NgayBaoTri,
      LoaiBaoTri,
      MoTaLoi,
      BienPhapKhacPhuc,
      NguoiTao,
      NguoiThucHien,
      ChiPhi,
      NgayHoanThanh,
      TrangThai,
      PhuongAn,
      PhuTung,
    } = req.body;
    // Insert data into SQLite database
    const query = `
    UPDATE Maintenance 
    SET MaThietBi = ?, NgayBaoTri = ?, LoaiBaoTri = ?, MoTaLoi = ?, BienPhapKhacPhuc = ?, NguoiTao = ?, NguoiThucHien = ?, ChiPhi = ?, NgayHoanThanh = ?, TrangThai = ?, PhuongAn = ?, PhuTung = ?
    WHERE MaBaoTri = ?
  `;
    db.run(
      query,
      [
        MaThietBi,
        formatDateLocal(NgayBaoTri),
        LoaiBaoTri,
        MoTaLoi,
        BienPhapKhacPhuc,
        NguoiTao,
        NguoiThucHien,
        ChiPhi,
        formatDateLocal(NgayHoanThanh),
        TrangThai,
        PhuongAn,
        PhuTung,
        id,
      ],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
        }
        io.emit("MaintenanceUpdate");
        io.emit("SparePartUsageUpdate");
        res.json({ message: "Đã cập nhật dữ liệu thành công" });
      },
    );
  },

  // ============================
  // Delete Item
  // ============================
  deleteItem(req, res) {
    const { id } = req.params;

    const deletePartsQuery = `DELETE FROM SparePartUsage WHERE MaBaoTri = ?`;
    const deleteMaintenanceQuery = `DELETE FROM Maintenance WHERE MaBaoTri = ?`;

    db.run(deletePartsQuery, [id], (err) => {
      if (err) {
        console.error("Error deleting spare parts:", err);
        return res.status(500).json({ error: "Lỗi khi xoá dữ liệu phụ tùng" });
      }

      db.run(deleteMaintenanceQuery, [id], function (err) {
        if (err) {
          console.error("Error deleting maintenance record:", err);
          return res.status(500).json({ error: "Lỗi khi xoá dữ liệu bảo trì" });
        }
        io.emit("MaintenanceUpdate");
        res.json({ message: "Đã xoá dữ liệu thành công" });
      });
    });
  },
});
