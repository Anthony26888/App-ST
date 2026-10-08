<template lang="">
  <v-btn
    icon="mdi-eye-outline"
    color="primary"
    variant="text"
    size="xs"
    @click="emitDetail()"
    v-tooltip:top="'Xem chi tiết'"
  ></v-btn>
</template>
<script>
export default {
  methods: {
    emitDetail() {
      this.$emit("detail"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
