<template>
  <BaseDialog
    v-model="dialog"
    width="520"
    :title="editing ? 'Sửa giá riêng MPN' : 'Thêm giá riêng MPN'"
    icon="mdi-cash-edit"
  >
    <v-text-field v-model="form.mpn" label="MPN *" variant="outlined" density="compact" class="mb-2" />
    <v-text-field v-model.number="form.unit_price" type="number" min="0" label="Đơn giá/con *" variant="outlined" density="compact" class="mb-2" />
    <v-select v-model="form.mount_type" :items="['', ...mountTypes]" label="Mount type" variant="outlined" density="compact" class="mb-2" />
    <v-text-field v-model.number="form.pin_count" type="number" label="Số chân" variant="outlined" density="compact" class="mb-2" />
    <v-select v-model="form.scope" :items="scopes" label="Phạm vi" variant="outlined" density="compact" class="mb-2" />
    <v-text-field v-model="form.note" label="Ghi chú" variant="outlined" density="compact" />
    <template #actions>
      <ButtonCancel @cancel="dialog = false" />
      <ButtonSave :disabled="!form.mpn?.trim() || saving" @save="submit" />
    </template>
  </BaseDialog>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import BaseDialog from "@/components/BaseDialog.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";

const props = defineProps({
  modelValue: Boolean,
  initial: { type: Object, default: () => ({}) },
  editing: Boolean,
  saving: Boolean,
});

const emit = defineEmits(["update:modelValue", "submit"]);

const mountTypes = ["SMT", "Hàn tay", "Gắp tay"];
const scopes = ["global", "customer", "quote"];

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const form = reactive({
  mpn: "",
  unit_price: 0,
  mount_type: "",
  pin_count: null,
  scope: "global",
  note: "",
});

function resetForm() {
  Object.assign(
    form,
    {
      mpn: "",
      unit_price: 0,
      mount_type: "",
      pin_count: null,
      scope: "global",
      note: "",
    },
    props.initial || {},
  );
  form.mpn = String(form.mpn || "");
  form.unit_price = Number(form.unit_price) || 0;
  form.mount_type = form.mount_type || "";
  form.pin_count = form.pin_count ?? null;
  form.scope = form.scope || "global";
  form.note = String(form.note || "");
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) resetForm();
  },
);

function submit() {
  if (!form.mpn?.trim()) return;
  emit("submit", {
    mpn: form.mpn.trim().toUpperCase(),
    unit_price: Number(form.unit_price) || 0,
    mount_type: form.mount_type || "",
    pin_count: form.pin_count,
    scope: form.scope,
    note: form.note,
  });
}
</script>
