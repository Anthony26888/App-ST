// // queryEngine.js
// const path = require("path");
// const sqlite3 = require("sqlite3");
// const { ChatOllama } = require("@langchain/community/chat_models/ollama");
// const { SqlDatabase } = require("langchain/sql_db");
// const { SqliteToolkit } = require("langchain/agents/toolkits/sql");
// const { createSqlAgent } = require("langchain/agents");

// // Load optional keyword-to-query map
// const queryMap = require("./queryMap"); // { "đơn hàng hôm nay": "SELECT ..." }

// // ===== Khởi tạo LLM và Database =====
// const dbPath = path.join(__dirname, "./database.db"); // <-- sửa tên file
// const model = new ChatOllama({
//   model: "gemma:2b", // hoặc "llama3", "mistral", tùy Ollama bạn cài
//   temperature: 0.2,
//   baseUrl: "http://localhost:11434",
// });

// // ===== Tạo hàm truy vấn qua LangChain Agent =====
// let executor;

// async function initAgent() {
//   const db = await SqlDatabase.fromDataSourceParams({
//     appDataSource: {
//       type: "sqlite",
//       database: dbPath,
//     },
//   });

//   const toolkit = new SqliteToolkit(db, model);
//   executor = await createSqlAgent({ llm: model, toolkit });
//   console.log("[✅] LangChain agent đã sẵn sàng.");
// }

// async function queryWithLangChain(question) {
//   if (!executor) {
//     await initAgent();
//   }

//   try {
//     const result = await executor.invoke({ input: question });
//     console.log("[LangChain Result]", result.output);
//     return result.output || "Không tìm thấy dữ liệu.";
//   } catch (err) {
//     console.error("[❌ Lỗi truy vấn LangChain]:", err);
//     return "Đã xảy ra lỗi khi xử lý truy vấn.";
//   }
// }

// // ===== Xử lý truy vấn bằng từ khóa định sẵn =====
// function queryWithMap(keyword, dbClient) {
//   const sql = queryMap[keyword];
//   if (!sql) return Promise.resolve("Câu hỏi chưa được hỗ trợ.");

//   return new Promise((resolve, reject) => {
//     dbClient.all(sql, [], (err, rows) => {
//       if (err) {
//         console.error("[❌ SQL Error]", err);
//         return reject("Lỗi SQL.");
//       }
//       if (!rows || rows.length === 0) return resolve("Không có dữ liệu.");
//       resolve(JSON.stringify(rows, null, 2));
//     });
//   });
// }

// // ===== Hàm chính để xử lý từ frontend =====
// async function queryEngine(question) {
//   const keyword = question.trim().toLowerCase();

//   // Nếu nằm trong queryMap
//   if (queryMap[keyword]) {
//     const dbClient = new sqlite3.Database(dbPath);
//     return queryWithMap(keyword, dbClient);
//   }

//   // Nếu không có trong keyword → dùng LangChain
//   return await queryWithLangChain(question);
// }

// module.exports = {
//   queryEngine,
// };
