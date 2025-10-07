<template lang="">
  <v-btn @click="emitDelete()"  class="text-caption bg-red">Xoá</v-btn>
</template>
<script>
export default {
  methods: {
    emitDelete() {
      this.$emit("delete"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
