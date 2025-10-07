<template lang="">
  <v-btn
    icon="mdi-file-search"
    size="xl"
    color="green"
    variant="text"
    @click="emitSearch()"
  ></v-btn>
</template>
<script>
export default {
  methods: {
    emitSearch() {
      this.$emit("search"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
