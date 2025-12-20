// import { ref } from "vue";
// import { io } from "socket.io-client";

// const socket = io("http://localhost:3000");

// export function useSummaryAI() {
//   const aiText = ref("");
//   const loading = ref(false);
  
//   // Chat state
//   const messages = ref([]); // Array of { role: 'user' | 'assistant', content: string }
//   const chatLoading = ref(false);
//   const currentChatResponse = ref("");

//   const analyze = async (summaryData) => {
//     aiText.value = "";
//     loading.value = true;
//     messages.value = []; // Clear chat when starting new analysis

//     const socketId = socket.id;

//     await fetch("http://localhost:3000/api/ai/analyze-summary", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ summaryData, socketId }),
//     });
//   };

//   const compare = async (todayData, yesterdayData) => {
//     aiText.value = "";
//     loading.value = true;

//     const socketId = socket.id;

//     await fetch("http://localhost:3000/api/ai/compare-summary", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ todayData, yesterdayData, socketId })
//     });
//   };

//   const askQuestion = async (question) => {
//     if (!question.trim()) return;
    
//     // Add user message to chat
//     messages.value.push({ role: "user", content: question });
//     currentChatResponse.value = "";
//     chatLoading.value = true;

//     const socketId = socket.id;

//     await fetch("http://localhost:3000/api/ai/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question, socketId }),
//     });
//   };

//   const clearChat = () => {
//     messages.value = [];
//     currentChatResponse.value = "";
//   };

//   // Socket event listeners
//   socket.on("ai-stream", (chunk) => {
//     aiText.value += chunk;
//   });

//   socket.on("ai-done", () => {
//     loading.value = false;
//   });

//   socket.on("ai-error", (error) => {
//     console.error("AI Error:", error);
//     aiText.value = `Lỗi: ${error}`;
//     loading.value = false;
//   });

//   // Chat socket listeners
//   socket.on("ai-chat-stream", (chunk) => {
//     currentChatResponse.value += chunk;
//   });

//   socket.on("ai-chat-done", () => {
//     // Add complete AI response to messages
//     if (currentChatResponse.value) {
//       messages.value.push({ role: "assistant", content: currentChatResponse.value });
//       currentChatResponse.value = "";
//     }
//     chatLoading.value = false;
//   });

//   socket.on("ai-chat-error", (error) => {
//     console.error("AI Chat Error:", error);
//     messages.value.push({ role: "assistant", content: `Lỗi: ${error}` });
//     chatLoading.value = false;
//     currentChatResponse.value = "";
//   });

//   return { 
//     aiText, 
//     loading, 
//     analyze,
//     compare,
//     messages,
//     chatLoading,
//     currentChatResponse,
//     askQuestion,
//     clearChat
//   };
// }
