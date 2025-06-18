<template lang="">
  <v-textarea
    variant="outlined"
    clearable
    :model-value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :rules="[required]"
    auto-grow
    rows="3"
    :auto-grow="true"
  >
  </v-textarea>
</template>
<script setup>
defineProps(["modelValue"]);
defineEmits(["update:modelValue"]);
</script>
<style lang=""></style>
