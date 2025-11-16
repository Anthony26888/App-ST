<template lang="">
  <v-btn
    icon="mdi-pencil"
    size="xs"
    color="primary"
    variant="text"
    @click="emitEdit()"
    v-tooltip:top="'Chỉnh sửa'"
  ></v-btn>
</template>
<script>
export default {
  methods: {
    emitEdit() {
      this.$emit("edit"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
