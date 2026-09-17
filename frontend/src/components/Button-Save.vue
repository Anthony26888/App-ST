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
    #a52a2a 0%,
    #d2691e 50%,
    #ff9500 100%
  );
  color: white;
}
</style>
