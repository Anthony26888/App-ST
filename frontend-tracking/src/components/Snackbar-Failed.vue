<template lang="">
  <v-snackbar
    v-model="visible"
    :timeout="timeout"
    color="red"
  >
    <v-icon>mdi-close-circle</v-icon>
    {{ message }}
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
