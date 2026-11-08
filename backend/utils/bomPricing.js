const db = require("../database.js");

// ============================================================
// BOM pricing resolver
// - Không map trực tiếp BOM -> giá.
// - Map: MPN Override / PartMaster / Alias -> Package Rule -> Keyword -> Review
// ============================================================

const PASSIVE_SIZES = new Set([
  "01005", "0201", "0402", "0603", "0805", "1206", "1210", "1411",
  "1812", "2010", "2512", "2917", "1506", "1505", "1515", "1020", "0804",
]);

// SOT/TO/DO/DIP/SIP không suy ra số chân bằng cách lấy số cuối package.
const PACKAGE_PIN_MAP = {
  "SOT-23": 3,
  "SOT-23-3": 3,
  "SOT-23-5": 5,
  "SOT-23-6": 6,
  "SOT-323": 3,
  "SOT-363": 6,
  "SOT-89": 3,
  "SOT-223": 4,
  "SOT-223-4": 4,
  "SOT-364": 3,
  "SOT-364-1": 3,
  "TO-263": 3,
  "TO-220": 3,
  "TO-252": 3,
  "DO-214": 2,
  "DO-214AC": 2,
  "DO-214AA": 2,
  "DO-214AB": 2,
  "SOD-523": 2,
  "SOD-323": 2,
  "SOD-123": 2,
  "SOD-123FL": 2,
  "DPAK": 3,
  "D2PAK": 3,
  "DDPAK": 3,
  "PPAK": 3,
  "RAD": 2,
  "RADIAL": 2,
  "SO6-5": 5,
  "0804": 8,
};

const THERMAL_PAD_PACKAGE_RE =
  /^(PPAK|DPAK|D2PAK|DDPAK|PWRDI|PWRDFN|DFN|QFN|VQFN|WQFN|TQFN|TO-252|TO-263)/;

const PICK_GROUPS = new Set(["MODULE", "CABLE", "MECH", "DISPLAY", "SENSOR", "BATTERY"]);

const PAD_PROCESSES = {
  SMT: "Pad SMT",
  HAND: "Pad hàn tay / THT",
  PICK: "Gắp tay / thủ công",
};

const CRITICAL_WARNINGS = new Set([
  "NO_PRICE",
  "MISSING_PIN",
  "INVALID_QTY",
  "AMBIGUOUS_PACKAGE",
  "MASTER_GROUP_NOT_IN_BOOK",
  "QTY_MISMATCH",
  "PARTIAL_DNP",
  "MISSING_PAD",
  "NO_PAD_RATE",
]);

const all = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || []))),
  );

const get = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null))),
  );

function normalizeMpn(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizePackage(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function isDnp(note, description) {
  return /\b(DNP|DNI|DO\s*NOT\s*PLACE|NOT\s*PLACED|NL|N\/A)\b/i.test(
    `${note || ""} ${description || ""}`,
  );
}

// Note kiểu "DNP C87, C92, C108" chỉ DNP một phần designator của dòng.
function dnpDesignatorsFromNote(note) {
  const text = String(note || "");
  const marker = text.match(/\bDNP\b/i);
  if (!marker) return [];
  const tail = text.slice(marker.index + marker[0].length);
  const tokens = tail.match(/\b[A-Z]{1,3}\d{1,4}[A-Z]?\b/gi) || [];
  return [...new Set(tokens.map((token) => token.toUpperCase()))];
}

// ------------------------------------------------------------
// Package detection từ Description (BOM thực tế thường không có
// cột Package). Trả về package đã chuẩn hoá + danh sách candidate.
// ------------------------------------------------------------
function extractPackage(description) {
  const text = String(description || "").toUpperCase();
  // Dùng rawText (phân biệt hoa thường) cho các mã rời như TO/SOT/DO.
  // Tránh false-positive "to 85°C" -> TO-85.
  const rawText = String(description || "");
  const found = [];
  const add = (pkg) => {
    const value = String(pkg || "").toUpperCase().replace(/\s+/g, "");
    if (value && !found.includes(value)) found.push(value);
  };

  // DIP8/PDIP8/SIP3 thường chỉ có 1 chữ số chân (DIP-8, SIP-3).
  const thtRe = /\b(PDIP|DIP|SIP)\s*-?\s*(\d{1,4})\b/g;
  let match;
  while ((match = thtRe.exec(rawText))) {
    const [, family, number] = match;
    add(`${family}-${number}`);
  }

  // 1) SOT23-5, SOT364-1, SOT-323, TO263, DO214, SOD523, DIP8, SIP3...
  const discreteRe = /\b(TSOT|SOT|TO|DO|SOD|DIP|SIP)\s*-?\s*(\d{2,4})(?:\s*-\s*(\d+))?/g;
  while ((match = discreteRe.exec(rawText))) {
    const [, family, number, suffix] = match;
    add(`${family}-${number}${suffix ? `-${suffix}` : ""}`);
  }

  // 2) 24QFN, 64LQFP, 16TSSOP, 8HSOP, 8SOIC, 24VQFN...
  const prefixedIcRe =
    /\b(\d{1,3})\s*(LQFP|TQFP|QFP|QFN|DFN|SOIC|TSOP|TSSOP|MSOP|SSOP|HSOP|ESOP|BGA|LGA|WLCSP|SOP|VQFN|WQFN|TQFN|WSON|VSON|USON|SON|TDFN|UDFN|VSSOP)\b/g;
  while ((match = prefixedIcRe.exec(text))) {
    const [, number, family] = match;
    add(`${family}-${number}`);
  }

  // 3) SOIC-8, QFN-32, LQFP-48, TSSOP-20...
  const trailingIcRe =
    /\b(LQFP|TQFP|QFP|QFN|DFN|SOIC|TSOP|TSSOP|MSOP|SSOP|HSOP|ESOP|BGA|LGA|WLCSP|SOP|VQFN|WQFN|TQFN|WSON|VSON|USON|SON|TDFN|UDFN|VSSOP)\s*-?\s*(\d{1,3})\b/g;
  while ((match = trailingIcRe.exec(text))) {
    const [, family, number] = match;
    add(`${family}-${number}`);
  }

  // 3b) Package công suất: PPAK1212-8, DPAK, D2PAK...
  const powerPkgRe =
    /\b(PPAK|DPAK|D2PAK|DDPAK|PWRDI|PWRDFN)\s*-?\s*(\d{2,4})(?:\s*-\s*(\d+))?/g;
  while ((match = powerPkgRe.exec(text))) {
    const [, family, number, suffix] = match;
    add(`${family}${number}${suffix ? `-${suffix}` : ""}`);
  }
  const barePowerPkgRe = /\b(D2PAK|DDPAK|DPAK)\b/g;
  while ((match = barePowerPkgRe.exec(text))) {
    add(match[1]);
  }

  // 3c) Package đặc biệt: SO6-5, RAD, RADIAL.
  const specialPkgRe = /\b(SO\d+-\d+|RADIAL|RAD)\b/g;
  while ((match = specialPkgRe.exec(text))) {
    add(match[1]);
  }

  // 4) Kích thước linh kiện passive: 0402, 0603, 2917, 1506...
  const sizeRe = new RegExp(`\\b(${[...PASSIVE_SIZES].join("|")})\\b`, "g");
  while ((match = sizeRe.exec(text))) {
    add(match[1]);
  }

  // 5) SMA/SMB/SMC/MELF
  const diodeRe = /\b(SMA|SMB|SMC|MELF)\b/g;
  while ((match = diodeRe.exec(rawText))) {
    add(match[1]);
  }

  return {
    package: found[0] || null,
    candidates: found,
    ambiguous: found.length > 1,
  };
}

function extractPinCount(pkg, description) {
  const normalized = normalizePackage(pkg);
  if (normalized) {
    if (PACKAGE_PIN_MAP[normalized] != null) return PACKAGE_PIN_MAP[normalized];
    if (PASSIVE_SIZES.has(normalized)) return 2;
    if (/^(SMA|SMB|SMC|MELF|SOD-)/.test(normalized)) return 2;
    if (/^DO-/.test(normalized)) return 2;
    if (/^TO-/.test(normalized)) return 3;
    if (/^DIP-|^SIP-/.test(normalized)) {
      const m = normalized.match(/-(\d{1,3})$/);
      if (m) return parseInt(m[1], 10);
    }
    const trailing = normalized.match(/-(\d{1,3})$/);
    if (trailing) {
      const n = parseInt(trailing[1], 10);
      if (n > 0 && n <= 2000) return n;
    }
  }

  const text = String(description || "").toUpperCase();
  const m = text.match(/(\d{1,3})\s*(?:P|POS|POSITION|PIN|PINS|CHAN|CHÂN|WAY)\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n > 0 && n <= 1000) return n;
  }
  return null;
}

function detectMountType(description, pkg) {
  const text = String(description || "").toUpperCase();
  const packageName = normalizePackage(pkg);
  if (
    /\b(CONN|CONNECTOR|HEADER|RCPT|JACK|SOCKET|TERMINAL|USB|FFC|FPC|PLUG)\b/.test(text) ||
    /^(DIP|SIP|TO|DO|SOD)/.test(packageName)
  ) {
    return "Hàn tay";
  }
  if (/\b(MODULE|SENSOR|SHIELD|CABLE|SWITCH|POTENTIOMETER)\b/.test(text)) {
    return "Gắp tay";
  }
  return "SMT";
}

function normalizeProcessCode(value) {
  const code = String(value || "").trim().toUpperCase();
  if (!code) return "";
  if (["SMT", "PAD SMT"].includes(code)) return "SMT";
  if (["HAND", "THT", "HÀN TAY", "HAN TAY", "HÀN THT"].includes(code)) return "HAND";
  if (["PICK", "GẮP TAY", "GAP TAY", "MANUAL", "THỦ CÔNG", "THU CONG"].includes(code)) {
    return "PICK";
  }
  return "";
}

function hasThermalPad(pkg) {
  return THERMAL_PAD_PACKAGE_RE.test(normalizePackage(pkg));
}

function detectProcessCode({ mountType, group, explicit, description }) {
  const normalized = normalizeProcessCode(explicit);
  if (normalized) return normalized;
  if (/\b(CBL|CABLE)\b/i.test(String(description || ""))) return "PICK";

  const mount = String(mountType || "").toUpperCase();
  if (mount.includes("GẮP") || mount.includes("PICK")) return "PICK";

  const groupCode = String(group?.group_code || "").toUpperCase();
  if (PICK_GROUPS.has(groupCode)) return "PICK";

  if (mount.includes("HÀN") || mount.includes("HAND") || mount.includes("THT")) {
    return "HAND";
  }
  if (groupCode === "IC_THT") return "HAND";
  return "SMT";
}

function resolvePadInfo({
  pkg,
  description,
  pinCount,
  pinSource,
  explicitPadCount,
  explicitPadSource = "manual",
}) {
  if (explicitPadCount != null && explicitPadCount !== "") {
    const value = Number(explicitPadCount);
    if (Number.isFinite(value) && value > 0) {
      return { padCount: Math.round(value), source: explicitPadSource };
    }
  }

  let count = pinCount != null ? Number(pinCount) : null;
  let source = count != null ? pinSource || "package" : "";

  if (count == null || !Number.isFinite(count)) {
    count = extractPinCount(pkg, description);
    source = count != null ? (pkg ? "package" : "description") : "none";
  }

  if (count == null || !Number.isFinite(count) || count <= 0) {
    if (/\bTACTILE\b/i.test(description) && /\bSWITCH\b/i.test(description)) {
      return { padCount: 4, source: "description" };
    }
    return { padCount: null, source: "none" };
  }

  let padCount = Math.round(count);
  if (hasThermalPad(pkg)) {
    padCount += 1;
    if (!source || source === "description") source = "package";
  }

  return { padCount, source: source || "package" };
}

// ------------------------------------------------------------
// Designator range: R1-R5, C1..C5, R1, R2
// ------------------------------------------------------------
function expandDesignators(input) {
  let str = String(input || "").trim();
  if (!str) return [];

  str = str.replace(
    /([A-Za-z]+)(\d+)\s*(?:-|\.\.)\s*\1?(\d+)/g,
    (full, prefix, start, end) => {
      const s = parseInt(start, 10);
      const e = parseInt(end, 10);
      if (e < s) return full;
      return Array.from({ length: e - s + 1 }, (_, i) => `${prefix}${s + i}`).join(",");
    },
  );

  str = str.replace(/[^A-Za-z0-9,\s]/g, ",");

  return [
    ...new Set(
      str
        .split(/[,;\n]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
}

function keywordMatches(text, keyword) {
  const k = String(keyword || "").trim();
  if (!k) return false;
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Biên từ chỉ tính chữ cái: "LED" không khớp trong "ANGLED",
  // nhưng "USB" vẫn khớp trong "USB2.0".
  const re = new RegExp(`(^|[^A-Z])${escaped}([^A-Z]|$)`, "i");
  return re.test(String(text || ""));
}

function matchPattern(pkg, pattern, matchType) {
  if (!pkg || !pattern) return null;
  const value = normalizePackage(pkg);
  const rawPattern = String(pattern || "").trim();
  if (!rawPattern) return null;
  const p = rawPattern.toUpperCase();

  if (matchType === "regex" || p.startsWith("RE:")) {
    try {
      const re = new RegExp(p.replace(/^RE:/, ""), "i");
      return re.test(value) ? { specificity: 2.5, method: "package_regex" } : null;
    } catch {
      return null;
    }
  }

  if (matchType === "contains") {
    return value.includes(p.replace(/\*/g, ""))
      ? { specificity: 2, method: "package_contains" }
      : null;
  }

  if (p.includes("*")) {
    const escaped = p
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`, "i").test(value)
      ? { specificity: 2, method: "package_wildcard" }
      : null;
  }

  return value === p ? { specificity: 3, method: "package_exact" } : null;
}

function pickGroup(groups, pkg, description, pinCount) {
  const text = String(description || "").toUpperCase();
  const candidates = [];

  for (const group of groups) {
    let best = null;

    for (const item of group.patterns || []) {
      const m = matchPattern(pkg, item.pattern, item.match_type);
      if (
        m &&
        (!best ||
          m.specificity > best.specificity ||
          (m.specificity === best.specificity &&
            String(item.pattern).length > best.patternLen))
      ) {
        best = {
          specificity: m.specificity,
          method: m.method,
          patternLen: String(item.pattern).length,
        };
      }
    }

    if (group.keywords && text) {
      for (const keyword of String(group.keywords).split(",")) {
        const k = keyword.trim().toUpperCase();
        if (!k || !keywordMatches(text, k)) continue;
        const cand = { specificity: 1, method: "keyword", patternLen: k.length };
        if (
          !best ||
          cand.specificity > best.specificity ||
          (cand.specificity === best.specificity && cand.patternLen > best.patternLen)
        ) {
          best = cand;
        }
      }
    }

    if (!best) continue;

    if (pinCount != null) {
      if (group.pin_min != null && group.pin_min !== "" && pinCount < Number(group.pin_min)) {
        continue;
      }
      if (group.pin_max != null && group.pin_max !== "" && pinCount > Number(group.pin_max)) {
        continue;
      }
    }

    candidates.push({ group, ...best });
  }

  if (!candidates.length) return { group: null, method: "none", ambiguous: false };

  candidates.sort(
    (a, b) =>
      Number(b.group.priority || 0) - Number(a.group.priority || 0) ||
      b.specificity - a.specificity ||
      b.patternLen - a.patternLen,
  );

  const top = candidates[0];
  const tied = candidates.filter(
    (c) =>
      Number(c.group.priority || 0) === Number(top.group.priority || 0) &&
      c.specificity === top.specificity &&
      c.patternLen === top.patternLen,
  );

  return {
    group: top.group,
    method: top.method,
    ambiguous: tied.length > 1,
    candidates,
  };
}

function confidenceForMethod(method) {
  switch (method) {
    case "package_exact":
      return 0.9;
    case "package_wildcard":
    case "package_contains":
      return 0.8;
    case "package_regex":
      return 0.75;
    case "keyword":
      return 0.55;
    default:
      return 0.5;
  }
}

async function resolveBomLines({ priceBookId, boardQty = 1, lines = [] }) {
  let bookId = Number(priceBookId) || null;
  if (!bookId) {
    const defaultBook = await get(
      `SELECT id FROM PriceBooks ORDER BY is_default DESC, id ASC LIMIT 1`,
    );
    bookId = defaultBook ? defaultBook.id : null;
  }
  if (!bookId) {
    return {
      items: [],
      summary: {
        total_lines: 0,
        total_designators: 0,
        group_count: 0,
        needs_review: 0,
        dnp: 0,
        unmapped: 0,
        subtotal: 0,
      },
    };
  }

  const book = await get(`SELECT * FROM PriceBooks WHERE id = ?`, [bookId]);
  const isPadMode = String(book?.pricing_mode || "") === "per_pad";
  const padRateRows = isPadMode
    ? await all(
        `SELECT * FROM PriceBookPadRates
         WHERE price_book_id = ? AND active = 1`,
        [bookId],
      )
    : [];
  const padRateMap = new Map(
    padRateRows.map((row) => [String(row.process_code || "").toUpperCase(), row]),
  );

  const groupRows = await all(
    `SELECT g.*, p.pattern, p.match_type
     FROM PriceGroups g
     LEFT JOIN PriceGroupPatterns p ON p.group_id = g.id
     WHERE g.price_book_id = ? AND g.active = 1
     ORDER BY g.priority DESC, g.id ASC`,
    [bookId],
  );

  const groupMap = new Map();
  for (const row of groupRows) {
    let group = groupMap.get(row.id);
    if (!group) {
      group = { ...row, patterns: [] };
      groupMap.set(row.id, group);
    }
    if (row.pattern) {
      group.patterns.push({ pattern: row.pattern, match_type: row.match_type });
    }
  }
  const groups = [...groupMap.values()];

  const [overrides, masterRows, aliasRows] = await Promise.all([
    all(`SELECT * FROM PriceBookMpnOverrides WHERE price_book_id = ?`, [bookId]),
    all(`SELECT * FROM PartMaster`),
    all(`SELECT * FROM PartAliases`),
  ]);

  const overrideMap = new Map();
  for (const item of overrides) overrideMap.set(normalizeMpn(item.mpn), item);

  const masterMap = new Map();
  for (const item of masterRows) masterMap.set(normalizeMpn(item.mpn), item);

  const aliasMap = new Map();
  for (const item of aliasRows) aliasMap.set(normalizeMpn(item.raw_mpn), item);

  const quadBoard = Math.max(1, Number(boardQty) || 1);
  const items = [];
  let totalDesignators = 0;
  let needsReview = 0;
  let dnpCount = 0;
  let unmapped = 0;
  let subtotal = 0;
  const usedGroups = new Set();

  lines.forEach((line, index) => {
    const rawMpn = String(line.mpn || "").trim();
    const mpnCandidates = [line.mpn, line.mpn2, line.mpn3]
      .map((value) => normalizeMpn(value))
      .filter(Boolean);
    const primaryMpn = mpnCandidates[0] || "";
    const description = String(line.description || "").trim();
    const note = String(line.note || "").trim();
    const warnings = [];

    const explicitPackage = normalizePackage(line.package);
    const detected = explicitPackage
      ? { package: explicitPackage, candidates: [explicitPackage], ambiguous: false }
      : extractPackage(description);

    let pkg = detected.package;
    if (detected.ambiguous) warnings.push("AMBIGUOUS_PACKAGE");

    let pinCount = line.pin_count != null && line.pin_count !== ""
      ? Number(line.pin_count)
      : extractPinCount(pkg, description);
    let pinSource = line.pin_count != null && line.pin_count !== ""
      ? "manual"
      : pinCount != null
        ? pkg
          ? "package"
          : "description"
        : "none";

    const designators = expandDesignators(line.designator);
    const designatorSet = new Set(designators);
    const dnpFromNote = dnpDesignatorsFromNote(note).filter((d) =>
      designatorSet.has(d),
    );
    const partialDnp =
      dnpFromNote.length > 0 && dnpFromNote.length < designators.length;
    const dnp = partialDnp ? false : isDnp(note, description);
    if (partialDnp) warnings.push("PARTIAL_DNP");
    const activeDesignators = partialDnp
      ? designators.filter((d) => !dnpFromNote.includes(d))
      : designators;

    const quantityInput = Number(line.quantity);
    const rawQty = activeDesignators.length > 0
      ? activeDesignators.length
      : Number.isFinite(quantityInput) && quantityInput > 0
        ? quantityInput
        : 0;
    const qty = dnp ? 0 : rawQty;

    totalDesignators += qty;

    if (!dnp) {
      if (designators.length > 0 && Number.isFinite(quantityInput) && quantityInput > 0) {
        if (Number(quantityInput) !== designators.length) warnings.push("QTY_MISMATCH");
      }
      if (qty <= 0) warnings.push("INVALID_QTY");
    }

    let group = null;
    let method = "none";
    let confidence = 0;
    let mountType = line.mount_type || "";

    let resolvedMpn = primaryMpn;
    let master = null;
    let alias = null;
    let aliasMaster = null;
    let resolvedMaster = null;
    for (const candidate of mpnCandidates) {
      const candidateMaster = masterMap.get(candidate) || null;
      const candidateAlias =
        !candidateMaster ? aliasMap.get(candidate) || null : null;
      const canonicalMpn = candidateAlias
        ? normalizeMpn(candidateAlias.canonical_mpn)
        : "";
      const candidateAliasMaster = canonicalMpn
        ? masterMap.get(canonicalMpn) || null
        : null;
      const candidateResolved = candidateMaster || candidateAliasMaster;
      if (candidateResolved) {
        resolvedMpn = candidate;
        master = candidateMaster;
        alias = candidateAlias;
        aliasMaster = candidateAliasMaster;
        resolvedMaster = candidateResolved;
        break;
      }
    }

    if (resolvedMaster) {
      if (resolvedMaster.package && !pkg) pkg = normalizePackage(resolvedMaster.package);
      if (resolvedMaster.pin_count != null && pinCount == null) {
        pinCount = Number(resolvedMaster.pin_count);
        pinSource = "master";
      }
      if (resolvedMaster.mount_type) mountType = resolvedMaster.mount_type;

      if (resolvedMaster.price_group) {
        group = groups.find((g) => g.group_code === resolvedMaster.price_group) || null;
        if (group) {
          method = master ? "master" : "alias";
          confidence = master ? 1 : 0.95;
        } else {
          warnings.push("MASTER_GROUP_NOT_IN_BOOK");
        }
      }
    }

    if (!group) {
      const picked = pickGroup(groups, pkg, description, pinCount);
      if (picked.group) {
        group = picked.group;
        method = picked.method;
        confidence = confidenceForMethod(method);
        // Keyword + đã biết package: đủ tin cậy để tự áp giá.
        if (method === "keyword" && pkg) confidence = 0.8;
        if (picked.ambiguous) {
          warnings.push("AMBIGUOUS_PACKAGE");
          confidence = Math.min(confidence, 0.5);
        }
      }
    }

    let override = null;
    let overrideMpn = "";
    for (const candidate of mpnCandidates) {
      const found = overrideMap.get(candidate);
      if (found) {
        override = found;
        overrideMpn = candidate;
        break;
      }
    }
    if (!resolvedMaster && overrideMpn) resolvedMpn = overrideMpn;

    if (!group && override) {
      group = {
        id: null,
        group_code: "MPN_OVERRIDE",
        group_name: "Giá riêng MPN",
        mount_type: override.mount_type || detectMountType(description, pkg),
        unit: "con",
        pin_mode: "manual",
        pin_count: override.pin_count != null ? Number(override.pin_count) : pinCount,
        unit_price: Number(override.unit_price) || 0,
      };
      method = "mpn_override";
      confidence = 0.95;
    }

    if (group) usedGroups.add(group.group_code);

    let unitPrice = group
      ? override && override.unit_price != null
        ? Number(override.unit_price)
        : Number(group.unit_price) || 0
      : 0;

    if (override && group) {
      method = "mpn_override";
      confidence = Math.max(confidence, 0.95);
      unitPrice = Number(override.unit_price) || unitPrice;
    }

    if (group && group.pin_count != null && pinCount == null) {
      pinCount = Number(group.pin_count);
      pinSource = "group";
    }

    let unit = group && group.unit ? group.unit : "con";
    mountType =
      mountType ||
      (group && group.mount_type) ||
      detectMountType(description, pkg);

    let padCount = null;
    let padCountSource = "";
    let processCode = "";
    let lineTotal = 0;

    if (isPadMode) {
      const hasLinePad = line.pad_count != null && line.pad_count !== "";
      const padInfo = resolvePadInfo({
        pkg,
        description,
        pinCount,
        pinSource,
        explicitPadCount: hasLinePad
          ? line.pad_count
          : resolvedMaster?.pad_count,
        explicitPadSource: hasLinePad ? "manual" : "master",
      });
      padCount = padInfo.padCount;
      padCountSource = padInfo.source;
      processCode = detectProcessCode({
        mountType,
        group,
        description,
        explicit: line.process_code || line.process,
      });

      if (padCount == null) warnings.push("MISSING_PAD");
      if (processCode === "PICK") warnings.push("PICK_MANUAL");

      if (override && override.unit_price != null) {
        method = "mpn_override";
        confidence = Math.max(confidence, 0.95);
        unit = "con";
        unitPrice = Number(override.unit_price) || 0;
        lineTotal = qty * quadBoard * unitPrice;
      } else if (processCode === "PICK") {
        unit = "pad";
        unitPrice = 0;
        lineTotal = 0;
        method = "pick_manual";
        confidence = Math.min(confidence || 0.5, 0.5);
      } else {
        const rate = padRateMap.get(processCode);
        unit = "pad";
        unitPrice = rate != null ? Number(rate.rate) || 0 : 0;
        if (unitPrice <= 0) warnings.push("NO_PAD_RATE");
        if (padCount != null && qty > 0 && unitPrice > 0) {
          lineTotal = qty * Number(padCount) * quadBoard * unitPrice;
        }
        if (!group) warnings.push("NO_GROUP");
      }
      lineTotal = Math.round(lineTotal);

      if (dnp) {
        lineTotal = 0;
        method = "dnp";
        confidence = 1;
      }
    } else {
      unitPrice = group
        ? override && override.unit_price != null
          ? Number(override.unit_price)
          : Number(group.unit_price) || 0
        : 0;

      if (override && group) {
        method = "mpn_override";
        confidence = Math.max(confidence, 0.95);
        unitPrice = Number(override.unit_price) || unitPrice;
      }

      if ((unit === "chan" || unit === "moi") && pinCount == null) {
        warnings.push("MISSING_PIN");
      }

      if (dnp) {
        lineTotal = 0;
        method = "dnp";
        confidence = 1;
      } else if (group && qty > 0) {
        if (unit === "con") {
          lineTotal = qty * quadBoard * unitPrice;
        } else if (unit === "chan" || unit === "moi") {
          if (pinCount != null) {
            lineTotal = qty * Number(pinCount) * quadBoard * unitPrice;
          }
        } else if (unit === "board") {
          lineTotal = quadBoard * unitPrice;
        } else if (unit === "fixed") {
          lineTotal = unitPrice;
        }
        lineTotal = Math.round(lineTotal);
      }

      if (!group && !dnp) warnings.push("NO_PRICE");
    }

    const critical = warnings.some((w) => CRITICAL_WARNINGS.has(w));
    const unpriced = isPadMode
      ? !padCount || (processCode !== "PICK" && !override && unitPrice <= 0)
      : !group;
    const review =
      !dnp &&
      (critical ||
        confidence < 0.8 ||
        unpriced ||
        (isPadMode && processCode === "PICK"));

    if (unpriced && !dnp) unmapped++;
    if (review) needsReview++;
    if (dnp) dnpCount++;
    subtotal += lineTotal;

    items.push({
      line_no: index + 1,
      raw_mpn: rawMpn,
      mpn: resolvedMpn,
      description,
      designator:
        activeDesignators.join(", ") || String(line.designator || ""),
      quantity_per_board: qty,
      package: pkg || "",
      mount_type: mountType,
      pin_count: pinCount != null ? Number(pinCount) : null,
      pad_count: padCount != null ? Number(padCount) : null,
      pad_count_source: padCountSource,
      process_code: processCode,
      group_code: group ? group.group_code : "",
      group_name: group ? group.group_name : "",
      unit,
      unit_price: unitPrice,
      line_total: lineTotal,
      match_method: method,
      confidence,
      needs_review: review ? 1 : 0,
      dnp: dnp ? 1 : 0,
      is_manual: 0,
      note,
      warnings,
    });
  });

  return {
    items,
    summary: {
      total_lines: items.length,
      total_designators: totalDesignators,
      group_count: usedGroups.size,
      needs_review: needsReview,
      dnp: dnpCount,
      unmapped,
      subtotal: Math.round(subtotal),
    },
  };
}

module.exports = {
  normalizeMpn,
  normalizePackage,
  isDnp,
  extractPackage,
  extractPinCount,
  expandDesignators,
  resolveBomLines,
  CRITICAL_WARNINGS,
};
