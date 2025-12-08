<template lang="">
  <v-btn class="bg-gradient text-caption" @click="emitSave()"
    >Nhập dữ liệu</v-btn
  >
</template>
<script>
export default {
  methods: {
    emitSave() {
      this.$emit("save"); // Phát sự kiện lên page
    },
  },
};
</script>
<style scoped>
.bg-gradient {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)),
    rgb(var(--v-theme-secondary))
  );
  color: white;
}
</style>
