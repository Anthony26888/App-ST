<template lang="">
  <v-btn
    icon="mdi-delete"
    color="red"
    variant="text"
    @click="emitRemove()"
    class="text-caption"
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
