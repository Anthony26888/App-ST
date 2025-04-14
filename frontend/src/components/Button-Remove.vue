<template lang="">
  <v-btn
    icon="mdi-delete"
    size="xl"
    color="red"
    variant="text"
    @click="emitRemove()"
  ></v-btn>
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
