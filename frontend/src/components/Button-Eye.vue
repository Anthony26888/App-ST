<template lang="">
  <v-btn
    icon="mdi-eye-outline"
    color="orange"
    variant="text"
    size="xs"
    @click="emitDetail()"
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
