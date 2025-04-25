<template lang="">
  <v-textarea
    variant="solo-filled"
    clearable
    :model-value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :rules="[required]"
  >
  </v-textarea>
</template>
<script setup>
defineProps(["modelValue"]);
defineEmits(["update:modelValue"]);
</script>
<style lang=""></style>
