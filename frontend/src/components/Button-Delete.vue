<template lang="">
  <v-btn @click="emitDelete()" color="error" class="text-caption">Xoá</v-btn>
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
