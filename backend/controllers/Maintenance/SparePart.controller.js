const db = require("../../database.js");
const { formatDateLocal } = require("../../utils/date.js"); // hoặc import từ file bạn đang dùng

module.exports = (io) => ({
  // ============================
  // Add Item
  // ============================
  addItem(req, res) {
    const { MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu } =
      req.body;
    // Insert data into SQLite database
    const query = `
    INSERT INTO SparePartUsage (MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
    db.run(
      query,
      [MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ error: "Lỗi khi thêm dữ liệu vào cơ sở dữ liệu" });
        }
        io.emit("SparePartUsageUpdate");
        io.emit("MaintenanceUpdate");
        res.json({ message: "Đã thêm dữ liệu sử dụng phụ tùng thành công" });
      },
    );
  },

  // ============================
  // Edit Item
  // ============================
  editItem(req, res) {
    const { id } = req.params;
    const { MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu } =
      req.body;
    // Insert data into SQLite database
    const query = `
    UPDATE SparePartUsage 
    SET MaBaoTri = ?, MaThietBi = ?, TenPhuTung = ?, SoLuongSuDung = ?, DonVi = ?, GhiChu = ?
    WHERE MaSuDung = ?
  `;
    db.run(
      query,
      [MaBaoTri, MaThietBi, TenPhuTung, SoLuongSuDung, DonVi, GhiChu, id],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ error: "Lỗi khi cập nhật dữ liệu trong cơ sở dữ liệu" });
        }
        io.emit("SparePartUsageUpdate");
        io.emit("MaintenanceUpdate");
        res.json({
          message: "Đã cập nhật dữ liệu sử dụng phụ tùng thành công",
        });
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
    DELETE FROM SparePartUsage WHERE MaSuDung = ?
  `;
    db.run(query, [id], function (err) {
      if (err) {
        return res
          .status(500)
          .json({ error: "Lỗi khi xoá dữ liệu trong cơ sở dữ liệu" });
      }
      io.emit("SparePartUsageUpdate");
      io.emit("MaintenanceUpdate");
      res.json({ message: "Đã xoá dữ liệu sử dụng phụ tùng thành công" });
    });
  },
});
