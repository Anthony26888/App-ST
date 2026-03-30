<template lang="">
  <v-btn
    prepend-icon="mdi mdi-download"
    color="success"
    class="ms-2 text-caption"
    variant="tonal"
    @click="emitDownload"
    >{{ title || "Tải file" }}</v-btn
  >
</template>
<script>
export default {
  props: {
    title: {
      type: String,
      default: "Tải file",
    },
  },
  methods: {
    emitDownload() {
      this.$emit("download-file"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
