<template>
  <v-card
    class="rounded-xl h-100"
    elevation="0"
    color="surface"
    border
  >
    <v-card-text class="d-flex flex-column justify-space-between h-100">
      <div>
        <div class="d-flex align-center mb-2">
          <v-avatar :color="color" variant="tonal" size="40" class="me-3">
            <v-icon :icon="icon" size="24"></v-icon>
          </v-avatar>
          <div class="text-subtitle-1 font-weight-medium text-medium-emphasis">
            {{ title }}
          </div>
        </div>
        <div class="d-flex align-end justify-space-between mt-2">
          <div :class="['text-h3 font-weight-bold', `text-${color}`]">
            {{ value }}
          </div>
          <slot name="value-append"></slot>
        </div>
      </div>
      
      <div v-if="subtitle" class="text-caption text-medium-emphasis mt-2">
        {{ subtitle }}
      </div>
      
      <slot name="bottom"></slot>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "primary",
  },
  subtitle: {
    type: String,
    default: "",
  },
});
</script>

<style scoped>
.v-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.05) !important;
}
</style>
