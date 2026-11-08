const states = new Map();
let queue = Promise.resolve();
let lastRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseHeaderNumber(headers, names, fallback = null) {
  for (const name of names) {
    const value = headers?.[name] ?? headers?.[name.toLowerCase()];
    if (value == null || value === "") continue;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function parseRetryAfter(value) {
  if (value == null || value === "") return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(String(value));
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return null;
}

function updateFromHeaders(product, headers = {}) {
  const key = String(product || "default");
  const current = states.get(key) || {};
  states.set(key, {
    ...current,
    dailyLimit: parseHeaderNumber(
      headers,
      ["x-ratelimit-limit", "X-RateLimit-Limit"],
      current.dailyLimit,
    ),
    dailyRemaining: parseHeaderNumber(
      headers,
      ["x-ratelimit-remaining", "X-RateLimit-Remaining"],
      current.dailyRemaining,
    ),
    dailyResetSeconds: parseHeaderNumber(
      headers,
      ["x-ratelimit-reset", "X-RateLimit-Reset"],
      current.dailyResetSeconds,
    ),
    burstLimit: parseHeaderNumber(
      headers,
      ["x-burstlimit-limit", "X-BurstLimit-Limit"],
      current.burstLimit,
    ),
    burstRemaining: parseHeaderNumber(
      headers,
      ["x-burstlimit-remaining", "X-BurstLimit-Remaining"],
      current.burstRemaining,
    ),
    burstResetSeconds: parseHeaderNumber(
      headers,
      ["x-burstlimit-reset", "X-BurstLimit-Reset"],
      current.burstResetSeconds,
    ),
    retryAfterMs: parseHeaderNumber(
      headers,
      ["retry-after", "Retry-After"],
      current.retryAfterMs,
    ),
    updatedAt: new Date().toISOString(),
  });
}

function minIntervalMs(product) {
  const state = states.get(String(product || "default")) || {};
  const burst = Number(state.burstLimit);
  if (Number.isFinite(burst) && burst > 0) {
    return Math.ceil((60000 / burst) * 1.15);
  }
  const minuteLimit = Number(process.env.DIGIKEY_MIN_REQUEST_INTERVAL_MS || 1000);
  return Math.max(250, minuteLimit);
}

function requestWithRetry(product, fn, options = {}) {
  const key = String(product || "default");
  const maxRetries = Number.isFinite(Number(options.maxRetries))
    ? Number(options.maxRetries)
    : Number(process.env.DIGIKEY_MAX_RETRIES || 3);

  const run = queue.then(async () => {
    let attempt = 0;
    while (true) {
      const wait = Math.max(0, lastRequestAt + minIntervalMs(key) - Date.now());
      if (wait > 0) await sleep(wait);
      lastRequestAt = Date.now();

      try {
        const response = await fn();
        updateFromHeaders(key, response?.headers || {});
        return response;
      } catch (error) {
        const response = error.response;
        updateFromHeaders(key, response?.headers || {});
        const status = response?.status;
        const retryable =
          status === 429 || (status >= 500 && status <= 599) || !response;
        if (!retryable || attempt >= maxRetries) throw error;

        const retryAfter = parseRetryAfter(
          response?.headers?.["retry-after"] ??
            response?.headers?.["Retry-After"],
        );
        const backoff = Math.min(
          60000,
          retryAfter ?? Math.min(30000, 1000 * 2 ** attempt),
        );
        await sleep(backoff + Math.floor(Math.random() * 250));
        attempt += 1;
      }
    }
  });

  queue = run.catch(() => {});
  return run;
}

function getState(product) {
  return { ...(states.get(String(product || "default")) || {}) };
}

function getSummary() {
  const result = {};
  for (const [key, value] of states.entries()) result[key] = { ...value };
  return result;
}

function remaining(product) {
  const state = states.get(String(product || "default")) || {};
  return state.dailyRemaining == null ? null : Number(state.dailyRemaining);
}

module.exports = {
  requestWithRetry,
  updateFromHeaders,
  getState,
  getSummary,
  remaining,
};
