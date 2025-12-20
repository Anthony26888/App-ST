// const express = require("express");
// const router = express.Router();

// router.post("/analyze-report", (req, res) => {
//   const { report, socketId } = req.body;
//   const io = req.app.get("io");

//   if (!report || !socketId) {
//     return res.status(400).json({ error: "Missing report or socketId" });
//   }

//   if (!io) {
//     return res.status(500).json({ error: "Socket.IO not initialized" });
//   }

//   // Kiểm tra socket tồn tại
//   const targetSocket = io.sockets.sockets.get(socketId);
//   if (!targetSocket) {
//     return res.status(400).json({ error: "Socket ID not found" });
//   }

//   // Emit thông báo bắt đầu AI
//   targetSocket.emit("ai-start", { message: "AI đang phân tích..." });

//   // Gửi dữ liệu cho socket xử lý AI
//   io.emit("ai-analyze-report", { report, socketId });

//   res.json({ message: "Report received" });
// });

// module.exports = router;
