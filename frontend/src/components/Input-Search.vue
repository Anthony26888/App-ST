<template lang="">
  <v-text-field
    density="comfortable"
    label="Tìm kiếm"
    prepend-inner-icon="mdi-magnify"
    variant="outlined"
    flat
    hide-details
    single-line
    clearable
    max-width="400"
    rounded
    :model-value="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
  ></v-text-field>
</template>
<script setup>
defineProps(['modelValue']);
defineEmits(['update:modelValue']);
</script>
<style lang=""></style>
