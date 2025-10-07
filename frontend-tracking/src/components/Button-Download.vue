<template lang="">
  <v-btn
    prepend-icon="mdi mdi-download"
    color="success"
    class="ms-2 text-caption"
    variant="tonal"
    @click="emitDownload"
    >Tải file</v-btn
  >
</template>
<script>
export default {
  methods: {
    emitDownload() {
      this.$emit("download-file"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
