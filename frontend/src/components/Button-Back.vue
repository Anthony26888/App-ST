<template lang="">
  <v-btn
    prepend-icon="mdi-chevron-left"
    variant="text"
    class="text-caption"
    @click="goBack()"
    >Trở lại</v-btn
  >
</template>
<script>
export default {
  props: {
    // Đường dẫn đích. Bỏ trống => quay lại trang trước (router.back)
    to: { type: String, default: "" },
  },
  methods: {
    goBack() {
      if (this.to) {
        this.$router.push(this.to);
      } else if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.$router.push("/Du-an");
      }
    },
  },
};
</script>
<style lang=""></style>
