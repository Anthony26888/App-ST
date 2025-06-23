<template lang="">
  <v-btn 
    class="bg-green text-caption" 
    :disabled="disabled"
    @click="emitAgree()"
  >
    Xác nhận
  </v-btn>
</template>
<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    emitAgree() {
      if (!this.disabled) {
        this.$emit("agree"); // Phát sự kiện lên page
      }
    },
  },
};
</script>
<style lang=""></style>
