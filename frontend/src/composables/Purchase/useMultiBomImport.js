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
  note: "",
  manufacturer: "",
};

let nextId = 1;

function headerMatches(title, regex) {
  return regex.test(String(title || "").trim());
}

function findHeader(options, regex, used) {
  const found = options.find(
    (option) => !used.has(option.value) && headerMatches(option.title, regex),
  );
  return found ? found.value : "";
}

function cell(row, index) {
  if (index === "" || index == null) return "";
  const value = row?.[index];
  return value == null ? "" : String(value).trim();
}

export function useMultiBomImport() {
  const files = ref([]);
  const error = ref("");

  const hasFiles = computed(() => files.value.length > 0);
  const totalLines = computed(() =>
    files.value.reduce((sum, file) => sum + buildLines(file).length, 0),
  );

  function columnOptionsFor(file) {
    const row = file?.rawRows?.[file?.headerRow] || [];
    return row.map((value, index) => ({
      title: value ? String(value) : `Cột ${index + 1}`,
      value: index,
    }));
  }

  function rowOptionsFor(file) {
    const max = Math.max(0, Math.min(20, (file?.rawRows?.length || 0) - 1));
    return Array.from({ length: max + 1 }, (_, index) => ({
      title: `Dòng ${index + 1}`,
      value: index,
    }));
  }

  function autoMapFor(file) {
    const options = columnOptionsFor(file);
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
    assign("note", /note|remark|ghi chú|ghi chu/i);
    assign("manufacturer", /^manufacturer$|^mfr$|^brand$|hãng|hang\b/i);

    if (next.mpn === "" && next.description === "") {
      if (options[0]) next.designator = 0;
      if (options[1]) next.mpn = 1;
      if (options[2]) next.description = 2;
      if (options[4]) next.quantity = 4;
    }

    file.mapping = next;
  }

  async function parseFile(file) {
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
    const entry = {
      id: nextId++,
      name: file.name,
      size: file.size,
      board_qty: 1,
      rawRows: rows,
      headerRow: 0,
      mapping: { ...EMPTY_MAPPING },
      error: "",
    };
    autoMapFor(entry);
    return entry;
  }

  async function addFiles(list) {
    error.value = "";
    const selected = Array.from(list || []);
    for (const file of selected) {
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        error.value = `File ${file.name} không phải Excel/CSV.`;
        continue;
      }
      try {
        const entry = await parseFile(file);
        files.value.push(entry);
      } catch (err) {
        console.error("Đọc BOM lỗi:", err);
        error.value = `Không đọc được file ${file.name}.`;
      }
    }
  }

  function removeFile(id) {
    files.value = files.value.filter((file) => file.id !== id);
  }

  function changeHeaderRow(file, value) {
    file.headerRow = value;
    autoMapFor(file);
  }

  function buildLines(file) {
    const lines = [];
    const start = Number(file?.headerRow || 0) + 1;
    for (let index = start; index < (file?.rawRows?.length || 0); index += 1) {
      const row = file.rawRows[index] || [];
      const line = {
        designator: cell(row, file.mapping.designator),
        mpn: cell(row, file.mapping.mpn),
        mpn2: cell(row, file.mapping.mpn2),
        mpn3: cell(row, file.mapping.mpn3),
        description: cell(row, file.mapping.description),
        quantity: cell(row, file.mapping.quantity),
        package: cell(row, file.mapping.package),
        note: cell(row, file.mapping.note),
        manufacturer: cell(row, file.mapping.manufacturer),
      };
      if (!line.designator && !line.mpn && !line.description) continue;
      lines.push(line);
    }
    return lines;
  }

  function previewLines(file) {
    return buildLines(file).slice(0, 8);
  }

  function validate() {
    if (!files.value.length) return "Chưa chọn file BOM.";
    for (const file of files.value) {
      if (!file.mapping.mpn) {
        return `File ${file.name} chưa chọn cột MPN.`;
      }
      if (!file.mapping.quantity) {
        return `File ${file.name} chưa chọn cột số lượng.`;
      }
      if (!buildLines(file).length) {
        return `File ${file.name} không có dòng linh kiện hợp lệ.`;
      }
    }
    return "";
  }

  function payload() {
    return files.value.map((file) => ({
      name: file.name,
      board_qty: Number(file.board_qty) || 1,
      lines: buildLines(file),
    }));
  }

  function reset() {
    files.value = [];
    error.value = "";
  }

  return {
    files,
    error,
    hasFiles,
    totalLines,
    columnOptionsFor,
    rowOptionsFor,
    addFiles,
    removeFile,
    changeHeaderRow,
    buildLines,
    previewLines,
    validate,
    payload,
    reset,
  };
}
