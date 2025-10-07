<template lang="">
  <v-file-input
    clearable
    label="Nhập file Excel"
    variant="solo-filled"
    accept=".xlsx, .csv"
    show-size
    class="file-input-wrap"
    :model-value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
  ></v-file-input>
</template>
<script setup>
defineProps(["modelValue"]);
defineEmits(["update:modelValue"]);
</script>
<style scoped>
.file-input-wrap .v-input__control {
  white-space: normal !important; /* Cho phép xuống dòng */
}

.file-input-wrap .v-file-input__text {
  white-space: normal !important;
  word-break: break-word;
  overflow-wrap: break-word;
  max-height: 100px; /* tuỳ chọn */
  overflow-y: auto; /* nếu nhiều file */
}
</style>
