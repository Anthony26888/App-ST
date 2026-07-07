const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getSettingPCBQC", async (id) => {
    try {
      const query = `SELECT DISTINCT  *
                      FROM SettingPCBQC
                      WHERE project_id = ?`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("SettingPCBQCError", err);
        socket.emit("SettingPCBQCData", rows);
      });
    } catch (error) {
      socket.emit("SettingPCBQCError", error);
    }
  });
};
