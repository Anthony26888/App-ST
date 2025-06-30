<template lang="">
  <v-btn
    icon="mdi mdi-history"
    size="xs"
    color="primary"
    variant="text"
    @click="emitHistory()"
  ></v-btn>
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
