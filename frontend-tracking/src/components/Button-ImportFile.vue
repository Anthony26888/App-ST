<template lang="">
  <v-btn
    prepend-icon="mdi mdi-plus"
    variant="tonal"
    class="text-caption"
    @click="emitImport"
    >Import File</v-btn
  >
</template>
<script>
export default {
  methods: {
    emitImport() {
      this.$emit("import-file"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
