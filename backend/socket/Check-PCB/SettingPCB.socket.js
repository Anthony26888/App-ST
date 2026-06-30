const db = require("../../database.js");

module.exports = (socket) => {
  socket.on("getSettingPCB", async (id) => {
    try {
      const query = `SELECT DISTINCT  *
                      FROM SettingPCB
                      WHERE project_id = ?`;
      db.all(query, [id], (err, rows) => {
        if (err) return socket.emit("SettingPCBError", err);
        socket.emit("SettingPCBData", rows);
      });
    } catch (error) {
      socket.emit("SettingPCBError", error);
    }
  });
};
