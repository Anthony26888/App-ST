<template>
  <BaseDialog
    v-model="dialog"
    width="800"
    :title="editing ? 'Sửa nhóm giá' : 'Thêm nhóm giá'"
    icon="mdi-tag-outline"
  >
    <v-row dense>
      <v-col v-if="contextText" cols="12">
        <div class="bg-grey-lighten-4 rounded pa-2 text-caption">
          <v-icon size="16" class="me-1">mdi-file-document-outline</v-icon>
          <span class="text-medium-emphasis">Đang thêm từ BOM:</span>
          <strong class="ms-1">{{ contextText }}</strong>
        </div>
      </v-col>

      <v-col cols="12" :md="isPadMode ? 12 : 7">
        <v-text-field
          v-model="form.group_name"
          label="Tên nhóm *"
          variant="outlined"
          density="compact"
          hide-details
          placeholder="VD: Cảm biến nhiệt độ"
        />
      </v-col>
      <v-col v-if="!isPadMode" cols="12" md="5">
        <v-text-field
          v-model.number="form.unit_price"
          type="number"
          min="0"
          label="Đơn giá *"
          variant="outlined"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="12">
        <v-text-field
          v-model="form.keywords"
          label="Từ khoá nhận diện"
          variant="outlined"
          density="compact"
          persistent-hint
          hint="Cách nhau dấu phẩy. VD: CẢM BIẾN, SENSOR, NHIỆT ĐỘ"
          placeholder="CẢM BIẾN,SENSOR,NHIỆT ĐỘ"
        />
      </v-col>

      <v-col v-if="matchInfo" cols="12">
        <v-alert type="info" variant="tonal" density="compact">
          <div class="d-flex align-center flex-wrap ga-2">
            <span>
              Đã khớp nhóm có sẵn:
              <strong>{{ matchInfo.group_code }}</strong>
              <span v-if="matchInfo.group_name"> · {{ matchInfo.group_name }}</span>
            </span>
            <v-spacer />
            <v-btn
              size="x-small"
              variant="tonal"
              color="primary"
              @click="useExisting"
            >
              {{ assignExisting ? "Gán vào nhóm này" : "Sửa nhóm này" }}
            </v-btn>
          </div>
        </v-alert>
      </v-col>

      <v-col cols="12">
        <v-expansion-panels variant="accordion" flat class="mt-1">
          <v-expansion-panel>
            <v-expansion-panel-title class="text-body-2">
              <v-icon size="18" class="me-2">mdi-cog-outline</v-icon>
              Tuỳ chọn nâng cao
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.group_code"
                    label="Mã nhóm"
                    variant="outlined"
                    density="compact"
                    persistent-hint
                    hint="Tự sinh từ tên nếu để trống"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="form.mount_type"
                    :items="mountTypes"
                    label="Kiểu gắn"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col v-if="!isPadMode" cols="12" md="6">
                  <v-select
                    v-model="form.unit"
                    :items="unitItems"
                    label="Cách tính giá"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="form.priority"
                    type="number"
                    label="Ưu tiên khớp"
                    variant="outlined"
                    density="compact"
                    persistent-hint
                    hint="Số lớn hơn được ưu tiên. Mặc định 100."
                  />
                </v-col>

                <template v-if="usesPins">
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="form.pin_mode"
                      :items="pinModeItems"
                      label="Cách xác định số chân"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col v-if="form.pin_mode === 'fixed'" cols="12" md="4">
                    <v-text-field
                      v-model.number="form.pin_count"
                      type="number"
                      label="Số chân cố định"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <template v-else-if="form.pin_mode === 'parse'">
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model.number="form.pin_min"
                        type="number"
                        label="Chân nhỏ nhất"
                        variant="outlined"
                        density="compact"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model.number="form.pin_max"
                        type="number"
                        label="Chân lớn nhất"
                        variant="outlined"
                        density="compact"
                        hide-details
                      />
                    </v-col>
                  </template>
                  <v-col v-else cols="12" md="8">
                    <div class="text-caption text-medium-emphasis mt-3">
                      Số chân sẽ lấy từ dòng BOM hoặc nhập tay khi báo giá.
                    </div>
                  </v-col>
                </template>

                <v-col cols="12">
                  <v-textarea
                    v-model="form.patterns"
                    label="Mã package nhận diện"
                    variant="outlined"
                    density="compact"
                    rows="2"
                    auto-grow
                    persistent-hint
                    hint="Mỗi dòng một mã. Hỗ trợ dấu * và re:... VD: 0402, SOIC-*, QFN-*"
                    placeholder="0402&#10;0603&#10;SOIC-*&#10;QFN-*"
                  />
                </v-col>
                <v-col cols="12">
                  <v-checkbox v-model="form.active" label="Đang dùng" density="compact" hide-details />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
    <template #actions>
      <ButtonCancel @cancel="dialog = false" />
      <ButtonSave
        :disabled="!form.group_name?.trim() || saving"
        @save="submit"
      />
    </template>
  </BaseDialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import axios from "axios";
import BaseDialog from "@/components/BaseDialog.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";

const Url = import.meta.env.VITE_API_URL;

const props = defineProps({
  modelValue: Boolean,
  initial: { type: Object, default: () => ({}) },
  editing: Boolean,
  saving: Boolean,
  priceBookId: { type: [Number, String], default: null },
  pricingMode: { type: String, default: "per_component" },
  existingCodes: { type: Array, default: () => [] },
  assignExisting: Boolean,
});

const emit = defineEmits(["update:modelValue", "submit", "use-existing"]);
const isPadMode = computed(() => props.pricingMode === "per_pad");

const mountTypes = ["SMT", "Hàn tay", "Gắp tay"];
const unitItems = [
  { title: "Theo con", value: "con" },
  { title: "Theo chân", value: "chan" },
  { title: "Theo mối", value: "moi" },
  { title: "Theo board", value: "board" },
  { title: "Giá cố định", value: "fixed" },
];
const pinModes = [
  { title: "Cố định", value: "fixed" },
  { title: "Tự tách từ package/tên", value: "parse" },
  { title: "Theo BOM / nhập tay", value: "manual" },
];

const FAMILY_RULES = [
  { code: "TRANSFORMER", name: "Biến áp", keywords: "TRANSFORMER,MÁY BIẾN ÁP,BIẾN ÁP XUNG,BIẾN ÁP ETHERNET,FLYBACK", re: /TRANSFORMER|MÁY BIẾN ÁP|BIẾN ÁP XUNG|BIẾN ÁP ETHERNET|FLYBACK/i },
  { code: "DISPLAY", name: "Màn hình", keywords: "LCD,OLED,TFT,DISPLAY,7-SEGMENT,MÀN HÌNH", re: /LCD|OLED|TFT|DISPLAY(?!\s*DRIVER)|7-SEGMENT|SEVEN SEGMENT|MÀN HÌNH/i },
  { code: "SENSOR", name: "Cảm biến", keywords: "SENSOR,ACCELEROMETER,GYROSCOPE,PIR,HALL,CẢM BIẾN", re: /SENSOR|ACCELEROMETER|GYROSCOPE|\bPIR\b|\bHALL\b|CẢM BIẾN/i },
  { code: "OPTO", name: "Opto", keywords: "OPTOCOUPLER,PHOTOCOUPLER,PHOTODIODE,PHOTOTRANSISTOR,OPTO,CÁCH LY", re: /OPTO|PHOTOCOUPLER|PHOTODIODE|PHOTOTRANSISTOR|CÁCH LY/i },
  { code: "THERMISTOR", name: "Nhiệt trở", keywords: "NTC,PTC THERMISTOR,THERMISTOR,NHIỆT TRỞ", re: /THERMISTOR|NHIỆT TRỞ|\bNTC\b/i },
  { code: "PROTECTION", name: "Bảo vệ quá áp", keywords: "TVS,MOV,VARISTOR,ESD SUPPRESSOR,ESD PROTECTION,CHỐNG SÉT", re: /\bTVS\b|\bMOV\b|VARISTOR|\bGDT\b|SURGE|ESD SUPPRESSOR|ESD PROTECTION|CHỐNG SÉT|QUÁ ÁP/i },
  { code: "CAP_ARRAY", name: "Tụ dãy", keywords: "CAP ARRAY,CAPACITOR ARRAY,CAP NETWORK,TỤ DÃY", re: /CAP(?:ACITOR)?\s*(?:ARRAY|NETWORK)|TỤ DÃY|MẠNG TỤ/i },
  { code: "EMI", name: "Lọc nhiễu", keywords: "EMI FILTER,LINE FILTER,COMMON MODE,LỌC NHIỄU", re: /\bEMI\b|COMMON MODE|LINE FILTER|LỌC NHIỄU|CUỘN KHÁNG/i },
  { code: "FUSE", name: "Cầu chì", keywords: "FUSE,PTC FUSE,RESETTABLE FUSE,FUSE HOLDER,CẦU CHÌ", re: /FUSE|CẦU CHÌ/i },
  { code: "AUDIO", name: "Âm thanh", keywords: "BUZZER,SPEAKER,MICROPHONE,LOA,CÒI,CHUÔNG", re: /BUZZER|SPEAKER|MICROPHONE|\bMIC\b|\bLOA\b|CÒI|CHUÔNG/i },
  { code: "BATTERY", name: "Pin / ắc quy", keywords: "BATTERY,COIN CELL,CR2032,18650,ẮC QUY", re: /BATTERY(?!\s*(?:CHARGER|MANAGEMENT))|COIN CELL|CR20\d{2}|18650|ẮC QUY|PIN SẠC/i },
  { code: "MOTOR", name: "Động cơ / quạt", keywords: "MOTOR,FAN,SERVO,STEPPER,ĐỘNG CƠ,QUẠT", re: /MOTOR(?!\s*DRIVER)|\bFAN\b|SERVO|STEPPER|BLOWER|ĐỘNG CƠ|QUẠT/i },
  { code: "ANTENNA", name: "Anten", keywords: "ANTENNA,ĂNG TEN", re: /ANTENNA|ANTEN\b|ĂNG TEN/i },
  { code: "LED", name: "LED", keywords: "LED,ĐÈN LED,WS2812,RGB LED", re: /LED(?!\s*DRIVER)|ĐÈN LED|WS2812|SK6812|NEOPIXEL|DIODE PHÁT QUANG/i },
  { code: "FERRITE", name: "Ferrite", keywords: "FERRITE,BEAD", re: /FERRITE|BEAD|CUỘN LỌC/i },
  { code: "RES_ARRAY", name: "Điện trở dãy", keywords: "RES ARRAY,RES NETWORK,ĐIỆN TRỞ DÃY", re: /RES(?:ISTOR)?\s*(?:ARRAY|NETWORK)|ĐIỆN TRỞ DÃY|MẠNG ĐIỆN TRỞ/i },
  { code: "CAP", name: "Tụ điện", keywords: "TỤ ĐIỆN,CAPACITOR", re: /TỤ|CAPACITOR|\bCAP\b/i },
  { code: "RES", name: "Điện trở", keywords: "ĐIỆN TRỞ,RESISTOR", re: /ĐIỆN TRỞ|RESISTOR|\bRES\b|SHUNT/i },
  { code: "INDUCTOR", name: "Cuộn cảm", keywords: "CUỘN CẢM,INDUCTOR", re: /CUỘN CẢM|INDUCTOR|\bCOIL\b|CHOKE/i },
  { code: "DIODE", name: "Đi ốt", keywords: "ĐI ỐT,DIODE", re: /ĐI ỐT|ĐIỐT|DIODE|ZENER|SCHOTTKY|RECTIFIER/i },
  { code: "TRANS", name: "Transistor", keywords: "TRANSISTOR,MOSFET", re: /TRANSISTOR|MOSFET|\bBJT\b|IGBT/i },
  { code: "XTAL", name: "Thạch anh", keywords: "THẠCH ANH,CRYSTAL", re: /THẠCH ANH|CRYSTAL|\bXTAL\b|RESONATOR/i },
  { code: "OSC", name: "Dao động", keywords: "OSCILLATOR,OSC", re: /OSCILLATOR|\bOSC\b/i },
  { code: "SW", name: "Nút bấm", keywords: "NÚT BẤM,SWITCH", re: /NÚT BẤM|NÚT NHẤN|SWITCH|TACTILE|\bSW\b/i },
  { code: "RELAY", name: "Rơ le", keywords: "RƠ LE,RELAY", re: /RƠ LE|RELAY/i },
  { code: "CONN", name: "Đầu cắm", keywords: "ĐẦU CẮM,CONNECTOR", re: /ĐẦU CẮM|CONNECTOR|HEADER|SOCKET|TERMINAL|FFC|FPC|\bUSB\b|JACK|PLUG/i },
  { code: "IC_THT", name: "IC hàn tay", keywords: "DIP,PDIP,SIP", re: /\b(?:P?DIP|SIP)\b/i },
  { code: "IC", name: "IC", keywords: "IC,VI ĐIỀU KHIỂN,DRIVER,CHARGER,AMP", re: /\bIC\b|\bMCU\b|VI ĐIỀU KHIỂN|REGULATOR|TRANSCEIVER|AMPLIFIER|LOGIC|MEMORY|ADC|DAC|CHUYỂN ĐỔI|BRIDGE|CONTROLLER|\bDRIVER\b|\bCHARGER\b|\bAMP\b/i },
  { code: "MECH", name: "Cơ khí", keywords: "CƠ KHÍ,MECH", re: /TẢN NHIỆT|HEATSINK|SCREW|STANDOFF|ỐC|VÍT|MECH/i },
  { code: "MOD", name: "Module", keywords: "MODULE,MOD", re: /MODULE|\bMOD\b/i },
];

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const suggesting = ref(false);
const matchInfo = ref(null);
const matchedPackage = ref("");

const form = reactive({
  mpn: "",
  description: "",
  group_code: "",
  group_name: "",
  mount_type: "SMT",
  unit: "con",
  pin_mode: "fixed",
  pin_count: null,
  pin_min: null,
  pin_max: null,
  unit_price: 0,
  priority: 100,
  patterns: "",
  keywords: "",
  active: true,
});

const pinModeItems = computed(() => {
  if (form.pin_mode === "passive") {
    return [
      ...pinModes,
      { title: "Không xác định (legacy)", value: "passive" },
    ];
  }
  return pinModes;
});

const usesPins = computed(
  () => form.unit === "chan" || form.unit === "moi",
);

const contextText = computed(() =>
  [form.mpn, form.description].filter(Boolean).join(" · "),
);

watch(
  () => form.pin_mode,
  (mode) => {
    if (mode === "fixed") {
      form.pin_min = null;
      form.pin_max = null;
    } else if (mode === "parse") {
      form.pin_count = null;
    } else {
      form.pin_count = null;
      form.pin_min = null;
      form.pin_max = null;
    }
  },
);

function resetForm() {
  Object.assign(
    form,
    {
      mpn: "",
      description: "",
      group_code: "",
      group_name: "",
      mount_type: "SMT",
      unit: "con",
      pin_mode: "fixed",
      pin_count: null,
      pin_min: null,
      pin_max: null,
      unit_price: 0,
      priority: 100,
      patterns: "",
      keywords: "",
      active: true,
    },
    props.initial || {},
  );

  if (Array.isArray(form.patterns)) {
    form.patterns = form.patterns.map((item) => item.pattern || item).join("\n");
  }
  form.patterns = String(form.patterns || "");
  form.mpn = String(form.mpn || "");
  form.description = String(form.description || "");
  matchInfo.value = null;
  matchedPackage.value = "";
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    resetForm();
    if (form.mpn || form.description) suggest(false);
  },
);

function firstPattern() {
  return String(form.patterns || "")
    .split(/[\n,;]+/)
    .map((value) => value.trim())
    .filter(Boolean)[0] || "";
}

function detectFamily(text) {
  const source = String(text || "");
  return FAMILY_RULES.find((rule) => rule.re.test(source)) || null;
}

function guessPackage(text) {
  const value = String(text || "").toUpperCase();
  const size = value.match(/\b(01005|0201|0402|0603|0805|1206|1210|1411|1506|1505|1515|1812|2010|2512|2917)\b/);
  if (size) return size[1];
  const discrete = value.match(/\b(SOT|SOIC|SOP|QFN|DFN|TQFP|LQFP|QFP|BGA|LGA|MSOP|TSSOP|SSOP|HSOP|DIP|SIP|SOD|DO|TO)\s*-?\s*(\d{1,3})(?:\s*-\s*(\d+))?\b/);
  if (discrete) {
    return `${discrete[1]}-${discrete[2]}${discrete[3] ? `-${discrete[3]}` : ""}`;
  }
  return "";
}

function uniqueCode(base) {
  const own = props.editing
    ? String(props.initial?.group_code || "").toUpperCase()
    : "";
  const used = new Set(
    (props.existingCodes || [])
      .map((code) => String(code || "").toUpperCase())
      .filter((code) => code && code !== own),
  );
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

function applyFamilySuggestion(pkg, force) {
  const family = detectFamily(`${form.description} ${form.mpn}`);
  const rawPackage = String(pkg || matchedPackage.value || "").trim();
  const suffix = rawPackage.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (rawPackage && (force || !form.patterns.trim())) {
    form.patterns = rawPackage;
  }
  if (force || !form.group_name) {
    form.group_name = family ? family.name : form.description.trim();
  }
  if (!family) return;

  if (force || !form.group_code) {
    form.group_code = uniqueCode(
      `${family.code}${suffix ? `_${suffix}` : ""}`,
    );
  }
  if (force || !form.keywords) {
    form.keywords = family.keywords;
  }
}

async function suggest(force) {
  if (!form.mpn && !form.description) return;
  suggesting.value = true;
  matchInfo.value = null;
  matchedPackage.value = "";
  let resolvedPackage = "";
  try {
    if (props.priceBookId) {
      const { data } = await axios.post(`${Url}/Quotation/ResolveBom`, {
        price_book_id: props.priceBookId,
        board_qty: 1,
        lines: [
          {
            mpn: form.mpn,
            description: form.description,
            package: firstPattern(),
            quantity: 1,
            designator: "",
            note: "",
          },
        ],
      });
      const item = data?.items?.[0];
      if (item) {
        resolvedPackage = item.package || "";
        if (item.package) {
          matchedPackage.value = item.package;
          if (force || !form.patterns.trim()) form.patterns = item.package;
        }
        if (item.pin_count != null) form.pin_count = Number(item.pin_count);
        if (item.group_code) {
          matchInfo.value = {
            group_code: item.group_code,
            group_name: item.group_name || "",
          };
        }
      }
    }
  } catch (error) {
    console.error("Gợi ý nhóm giá thất bại:", error);
  } finally {
    applyFamilySuggestion(resolvedPackage || guessPackage(form.description), force);
    suggesting.value = false;
  }
}

function useExisting() {
  if (!matchInfo.value) return;
  emit("use-existing", {
    group_code: matchInfo.value.group_code,
    group_name: matchInfo.value.group_name,
    pattern: matchedPackage.value || firstPattern(),
  });
  dialog.value = false;
}

function parsePatterns(value) {
  return String(value || "")
    .split(/[\n,;]+/)
    .map((pattern) => pattern.trim())
    .filter(Boolean)
    .map((pattern) => ({
      pattern,
      match_type: pattern.toLowerCase().startsWith("re:")
        ? "regex"
        : pattern.includes("*")
          ? "wildcard"
          : "exact",
    }));
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function submit() {
  const name = String(form.group_name || "").trim();
  if (!name) return;

  const rawCode =
    String(form.group_code || "").trim().toUpperCase() ||
    slugify(name) ||
    "NHOM";
  const code = uniqueCode(rawCode);

  emit("submit", {
    group_code: code,
    group_name: name,
    mount_type: form.mount_type,
    unit: form.unit,
    pin_mode: form.pin_mode,
    pin_count: form.pin_mode === "fixed" ? form.pin_count : null,
    pin_min: form.pin_mode === "parse" ? form.pin_min : null,
    pin_max: form.pin_mode === "parse" ? form.pin_max : null,
    unit_price: isPadMode.value ? 0 : Number(form.unit_price) || 0,
    priority: Number(form.priority) || 100,
    patterns: parsePatterns(form.patterns),
    keywords: form.keywords,
    active: form.active ? 1 : 0,
  });
}
</script>
