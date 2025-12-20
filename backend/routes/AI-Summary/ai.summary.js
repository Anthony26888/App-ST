const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// Ollama API configuration
const OLLAMA_API_URL = "http://localhost:11434/api/chat";
const SYSTEM_PROMPT = `Bạn là trợ lý phân tích ERP Siêu Thuật.

QUAN TRỌNG: 
- Trả lời bằng văn bản tự nhiên, KHÔNG trả lời dưới dạng JSON
- Hoàn toàn nói tiếng Việt
- Trả lời ngắn gọn, dễ hiểu

Yêu cầu:
1. So sánh trend giữa hôm nay và hôm qua (PO, sản phẩm, completed, defects)
2. Highlight KPI quan trọng và cảnh báo (ví dụ sản phẩm lỗi, tỷ lệ hoàn thành giảm)
3. Tóm tắt ngắn gọn, bullet points, dễ đọc cho dashboard
4. Chỉ phân tích dữ liệu có trong report, không suy đoán thêm
5. KHÔNG bao giờ trả lời dưới dạng JSON hoặc code`;

// Store io instance
let io;

// Store analysis context for chat sessions
const analysisContexts = new Map(); // socketId -> { summaryData, conversationHistory }

// Function to set io instance
const setIO = (socketIO) => {
  io = socketIO;
};

// POST /api/ai/analyze-summary
router.post("/analyze-summary", async (req, res) => {
  const { summaryData, socketId } = req.body;

  if (!summaryData || !socketId) {
    return res.status(400).json({ error: "Missing summaryData or socketId" });
  }

  if (!io) {
    return res.status(500).json({ error: "Socket.IO not initialized" });
  }

  try {
    // Create concise, focused prompt for faster analysis
    let userMessage = `📊 BÁO CÁO SẢN XUẤT NGÀY ${summaryData.date}

▪️ Tổng số PO: ${summaryData.stats?.totalPO || 0}
▪️ Tổng hạng mục: ${summaryData.stats?.totalCategory || 0}
▪️ Hoàn thành: ${summaryData.stats?.completed || 0}/${summaryData.stats?.totalCategory || 0}
▪️ Đang thực hiện: ${summaryData.stats?.inProgress || 0}
▪️ Tỷ lệ Pass: ${summaryData.stats?.passRate || 0}%
▪️ Sản phẩm Pass: ${summaryData.stats?.totalPass || 0}
▪️ Sản phẩm Fail: ${summaryData.stats?.totalFail || 0}`;

    // Add comparison if available
    if (summaryData.comparison) {
      const trend = summaryData.comparison;
      const poChange = (summaryData.stats?.totalPO || 0) - trend.yesterdayPO;
      const categoryChange = (summaryData.stats?.totalCategory || 0) - trend.yesterdayCategory;
      
      userMessage += `\n\n📈 SO SÁNH VỚI NGÀY HÔM QUA:
▪️ Số PO: ${trend.yesterdayPO} → ${summaryData.stats?.totalPO || 0} (${poChange >= 0 ? '+' : ''}${poChange}, ${trend.poTrend >= 0 ? '+' : ''}${trend.poTrend}%)
▪️ Hạng mục: ${trend.yesterdayCategory} → ${summaryData.stats?.totalCategory || 0} (${categoryChange >= 0 ? '+' : ''}${categoryChange}, ${trend.categoryTrend >= 0 ? '+' : ''}${trend.categoryTrend}%)`;
    }

    // Add process breakdown if available
    if (summaryData.processes && Object.keys(summaryData.processes).length > 0) {
      userMessage += `\n\n🔧 CHI TIẾT CÁC CÔNG ĐOẠN:`;
      Object.entries(summaryData.processes).forEach(([processName, data]) => {
        const total = data.total || 0;
        const completed = data.completed || 0;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const pass = data.totalOK || 0;
        const fail = data.totalError || 0;
        const passRate = (pass + fail) > 0 ? Math.round((pass / (pass + fail)) * 100) : 0;
        
        userMessage += `\n▪️ ${processName}: ${completed}/${total} hạng mục (${rate}%) | Pass: ${pass}, Fail: ${fail} (${passRate}%)`;
      });
    }

    // Add top errors if any
    if (summaryData.topErrors && summaryData.topErrors.length > 0) {
      userMessage += `\n\n❌ TOP LỖI NHIỀU NHẤT:\n${summaryData.topErrors.map(e => `▪️ ${e}`).join('\n')}`;
    }

    userMessage += `\n\n💡 Hãy đưa ra nhận xét ngắn gọn (3-5 câu) về:
1. Hiệu suất sản xuất hôm nay
2. Xu hướng so với hôm qua (tăng/giảm, tốt/xấu)
3. Vấn đề cần chú ý (nếu có)`;

    // Call Ollama API
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 200  // Limit response length for speed
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    // Stream response to client via Socket.IO
    const reader = response.body;
    reader.on("data", (chunk) => {
      const lines = chunk.toString().split("\n").filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message && json.message.content) {
            io.to(socketId).emit("ai-stream", json.message.content);
          }
          
          if (json.done) {
            io.to(socketId).emit("ai-done");
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }
    });

    reader.on("error", (error) => {
      console.error("Stream error:", error);
      io.to(socketId).emit("ai-error", "Lỗi khi nhận dữ liệu từ AI");
    });

    reader.on("end", () => {
      io.to(socketId).emit("ai-done");
      
      // Store context for chat
      analysisContexts.set(socketId, {
        summaryData,
        conversationHistory: [],
        timestamp: Date.now()
      });
    });

    res.json({ message: "Analysis started" });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    io.to(socketId).emit("ai-error", error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/compare-summary
router.post("/compare-summary", async (req, res) => {
  const { todayData, yesterdayData, socketId } = req.body;

  if (!todayData || !yesterdayData || !socketId) {
    return res.status(400).json({ error: "Missing todayData, yesterdayData or socketId" });
  }

  if (!io) {
    return res.status(500).json({ error: "Socket.IO not initialized" });
  }

  try {
    // Format comparison data for AI analysis
    const comparisonPrompt = `So sánh dữ liệu sản xuất giữa 2 ngày:

📅 NGÀY HÔM QUA (${yesterdayData.date}):
${JSON.stringify(yesterdayData, null, 2)}

📅 NGÀY HÔM NAY (${todayData.date}):
${JSON.stringify(todayData, null, 2)}

Hãy phân tích:
1. Sự khác biệt về số lượng PO, hạng mục, tỷ lệ hoàn thành
2. Xu hướng tăng/giảm (tốt hay xấu)
3. Các vấn đề về lỗi sản xuất
4. Đề xuất cải thiện cụ thể`;

    // Call Ollama API
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: comparisonPrompt }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    // Stream response to client via Socket.IO
    const reader = response.body;
    reader.on("data", (chunk) => {
      const lines = chunk.toString().split("\n").filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message && json.message.content) {
            io.to(socketId).emit("ai-stream", json.message.content);
          }
          
          if (json.done) {
            io.to(socketId).emit("ai-done");
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }
    });

    reader.on("error", (error) => {
      console.error("Stream error:", error);
      io.to(socketId).emit("ai-error", "Lỗi khi nhận dữ liệu từ AI");
    });

    reader.on("end", () => {
      io.to(socketId).emit("ai-done");
    });

    res.json({ message: "Comparison started" });
  } catch (error) {
    console.error("AI Comparison Error:", error);
    io.to(socketId).emit("ai-error", error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/chat - Handle follow-up questions
router.post("/chat", async (req, res) => {
  const { question, socketId } = req.body;

  if (!question || !socketId) {
    return res.status(400).json({ error: "Missing question or socketId" });
  }

  if (!io) {
    return res.status(500).json({ error: "Socket.IO not initialized" });
  }

  // Get stored context
  const context = analysisContexts.get(socketId);
  if (!context) {
    return res.status(400).json({ error: "No analysis context found. Please run analysis first." });
  }

  try {
    // Build conversation history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      // Add original analysis context
      { 
        role: "system", 
        content: `Dữ liệu báo cáo đã phân tích (chỉ để tham khảo):\n${JSON.stringify(context.summaryData, null, 2)}\n\nHãy trả lời câu hỏi bằng VĂN BẢN TỰ NHIÊN, KHÔNG dùng JSON. Trả lời ngắn gọn, dễ hiểu bằng tiếng Việt.` 
      },
      // Add conversation history
      ...context.conversationHistory,
      // Add current question
      { role: "user", content: question }
    ];

    // Call Ollama API
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest",
        messages: messages,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 300
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    let fullResponse = "";

    // Stream response to client via Socket.IO
    const reader = response.body;
    reader.on("data", (chunk) => {
      const lines = chunk.toString().split("\n").filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message && json.message.content) {
            fullResponse += json.message.content;
            io.to(socketId).emit("ai-chat-stream", json.message.content);
          }
          
          if (json.done) {
            io.to(socketId).emit("ai-chat-done");
            
            // Update conversation history
            context.conversationHistory.push(
              { role: "user", content: question },
              { role: "assistant", content: fullResponse }
            );
            
            // Keep only last 10 messages to avoid context getting too long
            if (context.conversationHistory.length > 20) {
              context.conversationHistory = context.conversationHistory.slice(-20);
            }
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }
    });

    reader.on("error", (error) => {
      console.error("Stream error:", error);
      io.to(socketId).emit("ai-chat-error", "Lỗi khi nhận dữ liệu từ AI");
    });

    reader.on("end", () => {
      io.to(socketId).emit("ai-chat-done");
    });

    res.json({ message: "Chat started" });
  } catch (error) {
    console.error("AI Chat Error:", error);
    io.to(socketId).emit("ai-chat-error", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, setIO };
