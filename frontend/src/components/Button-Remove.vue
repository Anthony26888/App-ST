<template lang="">
  <v-btn
    prepend-icon="mdi-delete"
    color="red"
    variant="tonal"
    @click="emitRemove()"
    class="text-caption"
  > Xoá</v-btn>
</template>
<script>
export default {
  methods: {
    emitRemove() {
      this.$emit("remove"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
