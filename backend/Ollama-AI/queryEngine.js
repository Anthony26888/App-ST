const sqlite3 = require('sqlite3');
const fetch = require('node-fetch');
const { queryMap } = require('./queryMap');

const db = new sqlite3.Database('./database.db');

db.run(`
  CREATE TABLE IF NOT EXISTS ChatHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    role TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

function saveMessage(session_id, role, content) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO ChatHistory (session_id, role, content) VALUES (?, ?, ?)`,
      [session_id, role, content],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function getChatHistory(session_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT role, content FROM ChatHistory WHERE session_id = ? ORDER BY id`,
      [session_id],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

function matchKeyword(prompt) {
  return Object.entries(queryMap).find(([k]) =>
    prompt.toLowerCase().includes(k.toLowerCase())
  )?.[1] || null;
}

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const rows = [];
    db.each(sql, (err, row) => {
      if (err) return reject(new Error(err.message));
      rows.push(row);
    }, (err) => {
      if (err) return reject(new Error(err.message));
      resolve(rows);
    });
  });
}

function summarizeResult(results) {
  if (!results?.length) return 'Không có kết quả.';
  const keys = Object.keys(results[0]);
  return results.slice(0, 5).map((r, i) =>
    `${i + 1}. ` + keys.map(k => `${k}: ${r[k]}`).join(', ')
  ).join('\n');
}

async function callOllamaSQL(prompt, session_id) {
  const history = await getChatHistory(session_id);
  // Lọc bỏ các message assistant có nội dung là bảng hoặc summary dạng bảng
  const filteredHistory = history.filter(h => {
    if (h.role !== 'assistant') return true;
    // Loại bỏ nếu là bảng markdown hoặc có nhiều dấu |
    if (/^\s*\|/.test(h.content) || (h.content.match(/\|/g) || []).length > 5) return false;
    // Loại bỏ nếu là summary dạng bảng
    if (/^Dữ liệu kết quả gồm/.test(h.content)) return false;
    return true;
  });
  const messages = filteredHistory.map(h => ({ role: h.role, content: h.content }));
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gemma:2b', messages, stream: false })
  });

  const json = await res.json();
  const raw = json.message?.content?.trim() || '';
  const cleaned = raw.replace(/\*\*SQL:\*\*/gi, '').replace(/```sql/gi, '').replace(/```/g, '').trim();

  await saveMessage(session_id, 'assistant', cleaned);
  return cleaned;
}

async function* handleQuery(prompt, session_id) {
  try {
    await saveMessage(session_id, 'user', prompt);

    const matched = matchKeyword(prompt);
    if (matched) {
      const results = await runQuery(matched.sql);
      // Tạo prompt cho Ollama dựa trên kết quả SQL
      const summary = summarizeResult(results);
      const promptOllama = `Dựa vào dữ liệu sau, hãy tóm tắt và trả lời cho người dùng bằng tiếng Việt thân thiện, dễ hiểu, không liệt kê bảng, chỉ nêu ý chính và nhận xét nếu có.\nDữ liệu ví dụ:\n${summary}\n\nYêu cầu: ${matched.description || prompt}`;
      // Lấy lịch sử chat
      const history = await getChatHistory(session_id);
      const messages = history.map(h => ({ role: h.role, content: h.content }));
      messages.push({ role: 'user', content: promptOllama });
      // Gọi Ollama
      const res = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemma:2b', messages, stream: false })
      });
      const json = await res.json();
      const answer = json.message?.content?.trim() || '';
      await saveMessage(session_id, 'assistant', answer);
      yield JSON.stringify({ type: 'answer', data: answer });
      return;
    }

    const aiSQL = await callOllamaSQL(prompt, session_id);

    if (!aiSQL.toLowerCase().startsWith('select')) {
      // Nếu Ollama trả về câu trả lời tự nhiên, trả về type: 'answer' thay vì 'error'
      yield JSON.stringify({ type: 'answer', data: aiSQL });
      return;
    }

    const results = await runQuery(aiSQL);
    const summary = `Dữ liệu kết quả gồm ${results.length} dòng. Ví dụ:\n` + summarizeResult(results);
    await saveMessage(session_id, 'assistant', summary);
    yield JSON.stringify({ type: 'result', data: results });
  } catch (err) {
    yield JSON.stringify({ type: 'error', message: err.message || err });
  }
}

module.exports = { handleQuery };