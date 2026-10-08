<template lang="">
  <v-btn
    color="primary"
    class="text-caption"
    :disabled="disabled"
    @click="emitSave()"
    >{{ label }}</v-btn
  >
</template>
<script>
export default {
  props: {
    label: { type: String, default: "Nhập dữ liệu" },
    disabled: { type: Boolean, default: false },
  },
  methods: {
    emitSave() {
      this.$emit("save"); // Phát sự kiện lên page
    },
  },
};
</script>
