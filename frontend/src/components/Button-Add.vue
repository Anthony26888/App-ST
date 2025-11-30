<template lang="">
  <v-btn
    prepend-icon="mdi mdi-plus"
    variant="tonal"
    color="primary"
    class="text-caption ms-2 "
    @click="emitAdd()"
    >Thêm</v-btn
  >
</template>
<script>
export default {
  methods: {
    emitAdd() {
      this.$emit("add"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
