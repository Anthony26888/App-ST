<template lang="">
  <v-btn
    prepend-icon="mdi mdi-history"
    variant="tonal"
    color="info"
    class="text-caption ms-2"
    @click="emitHistory()"
    >Lịch sử</v-btn
  >
</template>
<script>
export default {
  methods: {
    emitHistory() {
      this.$emit("history"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
