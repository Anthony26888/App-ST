import { computed, ref } from "vue";
import * as XLSX from "xlsx";

const EMPTY_MAPPING = {
  designator: "",
  mpn: "",
  mpn2: "",
  mpn3: "",
  description: "",
  quantity: "",
  package: "",
  pad_count: "",
  process: "",
  note: "",
  manufacturer: "",
};

function headerMatches(title, regex) {
  return regex.test(String(title || "").trim());
}

function findHeader(headers, regex, used) {
  const found = headers.find(
    (header) => !used.has(header.value) && headerMatches(header.title, regex),
  );
  return found ? found.value : "";
}

export function useBomImport() {
  const fileName = ref("");
  const rawRows = ref([]);
  const previewRows = ref([]);
  const headerRow = ref(0);
  const mapping = ref({ ...EMPTY_MAPPING });
  const error = ref("");

  const rowOptions = computed(() => {
    const max = Math.max(0, Math.min(15, rawRows.value.length - 1));
    return Array.from({ length: max + 1 }, (_, index) => ({
      title: `Dòng ${index + 1}`,
      value: index,
    }));
  });

  const columnOptions = computed(() => {
    const row = rawRows.value[headerRow.value] || [];
    return row.map((value, index) => ({
      title: value ? String(value) : `Cột ${index + 1}`,
      value: index,
    }));
  });

  const mappedPreview = computed(() => {
    const lines = buildLines();
    return lines.slice(0, 12);
  });

  function autoMap() {
    const options = columnOptions.value;
    const used = new Set();
    const next = { ...EMPTY_MAPPING };

    const assign = (field, regex) => {
      const value = findHeader(options, regex, used);
      if (value !== "") {
        next[field] = value;
        used.add(value);
      }
    };

    assign("designator", /designator|reference|ref\b|vị trí|vi tri/i);
    assign("mpn2", /mpn\W*2|part\s*(number|no)\W*2/i);
    assign("mpn3", /mpn\W*3|part\s*(number|no)\W*3/i);
    assign("mpn", /mpn|part\s*(number|no|#)|partnumber|comment/i);
    assign("description", /description|desc|mô tả|mo ta/i);
    assign("quantity", /qty|quantity|số lượng|so luong/i);
    assign("package", /package|footprint|case\b|vỏ|vo\b/i);
    assign("pad_count", /pad\s*(count|qty|số|so)|số\s*pad|so\s*pad/i);
    assign("process", /process|quy\s*trình|quy\s*trinh|mount\s*process/i);
    assign("note", /note|remark|ghi chú|ghi chu/i);
    assign("manufacturer", /^manufacturer$|^mfr$|^brand$|hãng|hang\b/i);

    if (next.mpn === "" && next.description === "") {
      // fallback: nếu chỉ có 5 cột chuẩn của Altium/KiCad
      if (options[0]) next.designator = 0;
      if (options[1]) next.mpn = 1;
      if (options[2]) next.description = 2;
      if (options[4]) next.quantity = 4;
    }

    mapping.value = next;
  }

  async function loadFile(file) {
    error.value = "";
    if (!file) {
      fileName.value = "";
      rawRows.value = [];
      previewRows.value = [];
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: true,
        raw: false,
      });
      rawRows.value = rows;
      headerRow.value = 0;
      previewRows.value = rows.slice(0, 12);
      fileName.value = file.name;
      autoMap();
    } catch (err) {
      console.error("Đọc BOM lỗi:", err);
      error.value = "Không đọc được file BOM. Vui lòng kiểm tra lại file Excel.";
    }
  }

  function changeHeaderRow(value) {
    headerRow.value = value;
    autoMap();
  }

  function cell(row, index) {
    if (index === "" || index == null) return "";
    const value = row[index];
    if (value == null) return "";
    return String(value).trim();
  }

  function buildLines() {
    const start = Number(headerRow.value) + 1;
    const lines = [];
    for (let i = start; i < rawRows.value.length; i++) {
      const row = rawRows.value[i] || [];
      const line = {
        designator: cell(row, mapping.value.designator),
        mpn: cell(row, mapping.value.mpn),
        mpn2: cell(row, mapping.value.mpn2),
        mpn3: cell(row, mapping.value.mpn3),
        description: cell(row, mapping.value.description),
        quantity: cell(row, mapping.value.quantity),
        package: cell(row, mapping.value.package),
        pad_count: cell(row, mapping.value.pad_count),
        process_code: cell(row, mapping.value.process),
        note: cell(row, mapping.value.note),
        manufacturer: cell(row, mapping.value.manufacturer),
      };
      if (!line.designator && !line.mpn && !line.description) continue;
      lines.push(line);
    }
    return lines;
  }

  function reset() {
    fileName.value = "";
    rawRows.value = [];
    previewRows.value = [];
    headerRow.value = 0;
    mapping.value = { ...EMPTY_MAPPING };
    error.value = "";
  }

  return {
    fileName,
    rawRows,
    previewRows,
    headerRow,
    mapping,
    error,
    rowOptions,
    columnOptions,
    mappedPreview,
    loadFile,
    changeHeaderRow,
    buildLines,
    autoMap,
    reset,
  };
}
