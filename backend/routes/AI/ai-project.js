const express = require("express");
const axios = require("axios");

module.exports = function deliveryChatRouter(db) {
  const router = express.Router();

  // ======================
  // UTILS
  // ======================
  function normalizeText(text = "") {
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function chatToDateStr(value) {
    const m = value.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?$/);
    if (!m) return null;

    const year = m[3] || new Date().getFullYear();
    return `${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }

  function extractDates(q) {
    return q.match(/\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{4})?/g) || [];
  }

  function extractRange(q) {
    const matches = extractDates(q);
    if (matches.length < 2) return null;

    return {
      from: chatToDateStr(matches[0]),
      to: chatToDateStr(matches[1]),
    };
  }

  function extractSingleDate(q) {
    const matches = extractDates(q);
    if (!matches.length) return null;
    return chatToDateStr(matches[0]);
  }

  // ======================
  // DATE HELPER
  // ======================
  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function getWeekRange() {
    const now = new Date();
    const day = now.getDay() || 7;

    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      from: monday.toISOString().slice(0, 10),
      to: sunday.toISOString().slice(0, 10),
    };
  }

  function getMonthRange() {
    const now = new Date();

    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      from: first.toISOString().slice(0, 10),
      to: last.toISOString().slice(0, 10),
    };
  }

  // ======================
  // DB
  // ======================
  async function getData() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.CustomerName,
               pd.ProductDetail,
               pd.QuantityAmount,
               sd.DeliveryDate,
               sd.DeliveryQuantity
        FROM Customers c
        LEFT JOIN ProductDetails pd ON pd.CustomerID = c.id
        LEFT JOIN ScheduleDelivery sd ON sd.ItemId = pd.id
      `;

      db.all(sql, [], (err, rows) => {
        if (err) return reject(err);

        resolve(
          rows.map((r) => ({
            CustomerName: r.CustomerName,
            ProductDetail: r.ProductDetail,
            DeliveryDate: r.DeliveryDate
              ? new Date(r.DeliveryDate).toISOString().slice(0, 10)
              : null,
            DeliveryQuantity: r.DeliveryQuantity || 0,
            QuantityAmount: r.QuantityAmount || 0,
          }))
        );
      });
    });
  }

  // ======================
  // FILTER
  // ======================
  const getByCustomer = (data, c) =>
    data.filter((x) => x.CustomerName === c);

  const getByDate = (data, date) =>
    data.filter((x) => x.DeliveryDate === date);

  const getByRange = (data, from, to) =>
    data.filter(
      (x) =>
        x.DeliveryDate &&
        x.DeliveryDate >= from &&
        x.DeliveryDate <= to
    );

  const getPending = (data) =>
    data.filter((x) => x.QuantityAmount > 0);

  // ======================
  // FORMAT
  // ======================
  function formatList(data, title) {
    if (!data.length) return "Không có dữ liệu.";

    let text = `${title}:\n\n`;

    data.forEach((x, i) => {
      text += `${i + 1}. Khách ${x.CustomerName}\n`;
      text += `- Ngày: ${x.DeliveryDate}\n`;
      text += `- Sản phẩm: ${x.ProductDetail}\n`;
      text += `- Giao: ${x.DeliveryQuantity}\n`;
      text += `- Còn: ${x.QuantityAmount}\n\n`;
    });

    return text;
  }

  function formatTotal(data, customer) {
    const total = data.reduce((s, x) => s + x.QuantityAmount, 0);
    return `Tổng đơn chưa giao của ${customer}: ${total}`;
  }

  // ======================
  // CUSTOMER DETECT
  // ======================
  function extractCustomer(q, data) {
    q = normalizeText(q);
    const customers = [...new Set(data.map((x) => x.CustomerName))];

    for (const c of customers) {
      if (q.includes(normalizeText(c))) return c;
    }

    return null;
  }

  // ======================
  // INTENT
  // ======================
  function detectIntent(q, data) {
    q = normalizeText(q);

    const customer = extractCustomer(q, data);

    // TODAY
    if (q.includes("hom nay")) {
      if (customer) return { type: "customer_today", customer };
      return { type: "today" };
    }

    // WEEK
    if (q.includes("tuan")) {
      if (customer) return { type: "customer_week", customer };
      return { type: "week" };
    }

    // MONTH
    if (q.includes("thang")) {
      if (customer) return { type: "customer_month", customer };
      return { type: "month" };
    }

    const range = extractRange(q);
    const date = extractSingleDate(q);

    if (customer && range) {
      return { type: "customer_range", customer, ...range };
    }

    if (customer && q.includes("chua giao")) {
      return { type: "customer_pending", customer };
    }

    if (customer && q.includes("tong")) {
      return { type: "customer_total", customer };
    }

    if (customer) return { type: "customer", customer };

    if (range) return { type: "range", ...range };
    if (date) return { type: "date", value: date };

    return "overview";
  }

  // ======================
  // AI (fallback)
  // ======================
  async function askAI(question, data) {
    const prompt = `
Bạn là trợ lý AI.
Trả lời bằng tiếng Việt.
Không bịa.

Dữ liệu:
${JSON.stringify(data)}

Câu hỏi:
${question}
`;

    const res = await axios.post("https://accidents-berry-navy-pages.trycloudflare.com/api/generate", {
      model: "qwen2.5:3b",
      prompt,
      stream: false,
    });

    return res.data.response;
  }

  // ======================
  // API
  // ======================
  router.post("/chat-delivery", async (req, res) => {
    try {
      const { question } = req.body;

      const raw = await getData();
      const intent = detectIntent(question, raw);

      console.log("INTENT:", intent);

      // ===== TODAY
      if (intent.type === "today") {
        const today = getToday();
        const data = getByDate(raw, today);
        return res.json({
          success: true,
          answer: formatList(data, `Lịch giao hôm nay (${today})`),
          data,
        });
      }

      // ===== CUSTOMER TODAY
      if (intent.type === "customer_today") {
        const today = getToday();
        let data = getByCustomer(raw, intent.customer);
        data = getByDate(data, today);
        return res.json({
          success: true,
          answer: formatList(
            data,
            `Hôm nay của ${intent.customer} (${today})`
          ),
          data,
        });
      }

      // ===== WEEK
      if (intent.type === "week") {
        const { from, to } = getWeekRange();
        const data = getByRange(raw, from, to);
        return res.json({
          success: true,
          answer: formatList(
            data,
            `Tuần này (${from} → ${to})`
          ),
          data,
        });
      }

      // ===== CUSTOMER WEEK
      if (intent.type === "customer_week") {
        const { from, to } = getWeekRange();
        let data = getByCustomer(raw, intent.customer);
        data = getByRange(data, from, to);
        return res.json({
          success: true,
          answer: formatList(
            data,
            `Tuần này của ${intent.customer} (${from} → ${to})`
          ),
          data,
        });
      }

      // ===== MONTH
      if (intent.type === "month") {
        const { from, to } = getMonthRange();
        const data = getByRange(raw, from, to);
        return res.json({
          success: true,
          answer: formatList(
            data,
            `Tháng này (${from} → ${to})`
          ),
          data,
        });
      }

      // ===== CUSTOMER MONTH
      if (intent.type === "customer_month") {
        const { from, to } = getMonthRange();
        let data = getByCustomer(raw, intent.customer);
        data = getByRange(data, from, to);
        return res.json({
          success: true,
          answer: formatList(
            data,
            `Tháng này của ${intent.customer} (${from} → ${to})`
          ),
          data,
        });
      }

      // ===== CUSTOMER + RANGE
      if (intent.type === "customer_range") {
        let data = getByCustomer(raw, intent.customer);
        data = getByRange(data, intent.from, intent.to);
        return res.json({
          success: true,
          answer: formatList(
            data,
            `${intent.customer} từ ${intent.from} → ${intent.to}`
          ),
          data,
        });
      }

      // ===== CUSTOMER + PENDING
      if (intent.type === "customer_pending") {
        let data = getByCustomer(raw, intent.customer);
        data = getPending(data);
        return res.json({
          success: true,
          answer: formatList(
            data,
            `Chưa giao của ${intent.customer}`
          ),
          data,
        });
      }

      // ===== CUSTOMER + TOTAL
      if (intent.type === "customer_total") {
        let data = getByCustomer(raw, intent.customer);
        return res.json({
          success: true,
          answer: formatTotal(data, intent.customer),
          data,
        });
      }

      // ===== CUSTOMER
      if (intent.type === "customer") {
        const data = getByCustomer(raw, intent.customer);
        return res.json({
          success: true,
          answer: formatList(data, `Tổng quan ${intent.customer}`),
          data,
        });
      }

      // ===== RANGE
      if (intent.type === "range") {
        const data = getByRange(raw, intent.from, intent.to);
        return res.json({
          success: true,
          answer: formatList(
            data,
            `Từ ${intent.from} → ${intent.to}`
          ),
          data,
        });
      }

      // ===== DATE
      if (intent.type === "date") {
        const data = getByDate(raw, intent.value);
        return res.json({
          success: true,
          answer: formatList(
            data,
            `Ngày ${intent.value}`
          ),
          data,
        });
      }

      // ===== AI fallback
      const answer = await askAI(question, raw);

      res.json({ success: true, answer });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};