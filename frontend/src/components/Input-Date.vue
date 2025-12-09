<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition"
  >
    <!-- INPUT -->
    <template #activator="{ props }">
      <v-text-field
        v-bind="props"
        :model-value="displayDate"
        :label="label"
        :variant="variant"
        :density="density"
        :disabled="disabled"
        readonly
        clearable
        prepend-inner-icon="mdi-calendar"
        @click:clear="clearDate"
      />
    </template>

    <!-- DATE PICKER -->
    <v-date-picker
      :model-value="internalValue"
      @update:model-value="onSelect"
      :min="min"
      :max="max"
      show-adjacent-months
      color="primary"
    />
  </v-menu>
</template>

<script setup>
import { ref, computed } from "vue";

const menu = ref(false);

const props = defineProps({
  modelValue: [String, Date, Number, null],
  label: { type: String, default: "Select date" },
  min: String,
  max: String,
  variant: { type: String, default: "outlined" },
  density: { type: String, default: "default" },
  disabled: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

/* ================== CORE ================== */
/* ✅ Ép mọi kiểu về YYYY-MM-DD (LOCAL TIME) */
function normalizeToYMD(val) {
  if (!val) return null;

  // ✅ đã là string YYYY-MM-DD
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }

  // ✅ Date hoặc timestamp
  const d = new Date(val);
  if (isNaN(d)) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`; // ✅ LOCAL → KHÔNG LỆCH NGÀY
}

/* v-date-picker dùng */
const internalValue = computed({
  get() {
    return normalizeToYMD(props.modelValue);
  },
  set(val) {
    emit("update:modelValue", val);
  },
});

/* ✅ HIỂN THỊ DD/MM/YYYY */
const displayDate = computed(() => {
  const ymd = internalValue.value;
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
});

/* ================= EVENTS ================= */
function onSelect(val) {
  internalValue.value = val; // luôn là YYYY-MM-DD
  menu.value = false;
}

function clearDate() {
  internalValue.value = null;
}
</script>

<style scoped>

</style>
