const http = require("http");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("ai-analyze-report", ({ report, socketId }) => {
      const prompt = `
Bạn là trợ lý ERP.
Chỉ phân tích dữ liệu sau, trả lời ngắn gọn:

${JSON.stringify(report, null, 2)}
`;

      const postData = JSON.stringify({
        model: "gemma:2b",
        stream: true,
        temperature: 0.3,
        messages: [
          { role: "system", content: "Bạn là trợ lý ERP." },
          { role: "user", content: prompt },
        ],
      });

      const options = {
        hostname: "localhost",
        port: 11434,
        path: "/api/chat",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const reqAI = http.request(options, (resAI) => {
        resAI.on("data", (chunk) => {
          try {
            const lines = chunk.toString().split("\n").filter(Boolean);
            for (const line of lines) {
              const json = JSON.parse(line);
              const content = json?.message?.content;
              if (content) io.to(socketId).emit("ai-stream", content);
            }
          } catch (err) {
            console.error("Parse chunk error:", err);
          }
        });

        resAI.on("end", () => {
          io.to(socketId).emit("ai-done");
        });
      });

      reqAI.on("error", (err) => {
        console.error("Ollama error:", err);
        io.to(socketId).emit("ai-error", "AI service error");
      });

      reqAI.write(postData);
      reqAI.end();
    });
  });
};
