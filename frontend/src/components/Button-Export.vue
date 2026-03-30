<template lang="">
  <v-btn
    prepend-icon="mdi mdi-export"
    variant="tonal"
    color="error"
    class="text-caption ms-2"
    @click="emitHistory()"
    >Xuất kho</v-btn
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
