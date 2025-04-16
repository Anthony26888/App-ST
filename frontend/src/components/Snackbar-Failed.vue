<template lang="">
  <v-snackbar
    v-model="visible"
    :timeout="timeout"
    color="red"
  >
    <v-icon>mdi-close-circle</v-icon>
    Cập nhật dữ liệu lỗi. Cần kiểm tra lại dữ liệu hoặc tải lại trang.
  </v-snackbar>
</template>
<script setup>
const props = defineProps({
  modelValue: Boolean,
  message: String,
  color: {
    type: String,
    default: "info",
  },
  timeout: {
    type: Number,
    default: 5000,
  },
});
const emit = defineEmits(["update:modelValue"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
<style lang=""></style>
