<template lang="">
  <v-snackbar
    v-model="visible"
    :timeout="timeout"
    color="orange-darken-2"
  >
    <v-icon>mdi-alert-decagram</v-icon>
    Không tìm thấy dữ liệu từ Digikey.
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
    default: 3000,
  },
});
const emit = defineEmits(["update:modelValue"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
<style lang=""></style>
