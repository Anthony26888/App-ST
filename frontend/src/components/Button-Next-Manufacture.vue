<template lang="">
  <v-btn icon="mdi-chevron-right" variant="outlined" size="small"></v-btn>
</template>
<script>
export default {
  methods: {
    NextDetail() {
      this.$emit("nextDetail"); // Phát sự kiện lên page
    },
  },
};
</script>
<style lang=""></style>
