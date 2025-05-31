<!-- src/components/DateField.vue -->
<template>
  <v-text-field
    :model-value="modelValue"
    @update:model-value="(val) => $emit('update:modelValue', val)"
    :label="label"
    type="date"
    :min="min"
    :max="max"
    :variant="variant"
    :density="density"
    :disabled="disabled"
    :readonly="readonly"
  />
</template>

<script setup>
defineProps({
  modelValue: String,
  label: { type: String, default: "Select a date" },
  min: String,
  max: String,
  variant: { type: String, default: "outlined" },
  density: { type: String, default: "default" },
  disabled: Boolean,
  readonly: Boolean,
});

defineEmits(["update:modelValue"]);
</script>
