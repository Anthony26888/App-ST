<template lang="">
  <v-btn class="bg-green text-caption" @click="emitAgree()">Xác nhận</v-btn>
</template>
<script>
export default {
  methods: {
    emitAgree() {
      this.$emit("agree"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
