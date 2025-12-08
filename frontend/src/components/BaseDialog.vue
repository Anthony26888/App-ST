<template>
  <v-dialog
    v-model="dialog"
    :max-width="maxWidth"
    :width="width"
    :fullscreen="fullscreen"
    :persistent="persistent"
    scrollable
  >
    <v-card class="rounded-lg">
      <!-- HEADER -->
      <v-card-title class="d-flex align-center bg-gradient">
        <v-icon v-if="icon" :icon="icon" class="me-2 text-white" />
        <span class="text-h6 text-white">{{ title }}</span>

        <v-spacer />

        <v-btn icon="mdi-close" variant="text" color="white" @click="close" />
      </v-card-title>

      <!-- BODY -->
      <v-card-text>
        <slot />
      </v-card-text>

      <!-- ACTION -->
      <v-card-actions v-if="$slots.actions">
        <slot name="actions" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: Boolean,
  title: String,
  icon: String,

  /* ✅ WIDTH CONTROL */
  width: {
    type: [String, Number],
    default: undefined,
  },
  maxWidth: {
    type: [String, Number],
    default: 800,
  },
  fullscreen: Boolean,
  persistent: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

const dialog = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

function close() {
  emit("update:modelValue", false);
}
</script>
<style scoped>
.bg-gradient {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)),
    rgb(var(--v-theme-secondary))
  );
  color: white;
}




</style>
