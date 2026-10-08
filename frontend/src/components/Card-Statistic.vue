<template>
  <v-card
    class="rounded-xl h-100 card-statistic"
    elevation="0"
    color="surface"
    border
  >
    <v-card-text class="d-flex flex-column pa-4">
      <div>
        <!-- Label + icon box (kiểu NexusPortal) -->
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-caption font-weight-medium text-medium-emphasis">
            {{ title }}
          </div>
          <v-avatar :color="color" variant="tonal" size="36" rounded="lg">
            <v-icon :icon="icon" size="20" />
          </v-avatar>
        </div>

        <!-- Value + Right Info -->
        <div class="d-flex align-center justify-space-between ga-2 flex-wrap">
          <!-- Main Value -->
          <div class="app-stat-value font-weight-bold" style="line-height: 1">
            {{ value }}
          </div>

          <!-- Right Content -->
          <slot name="value-append">
            <div
              v-if="
                totalLabel1 !== undefined ||
                totalLabel2 !== undefined ||
                totalLabel3 !== undefined
              "
              class="d-flex align-center flex-wrap ga-3"
            >
              <div
                v-if="totalLabel1 !== undefined"
                class="d-flex align-center ga-1"
              >
                <v-icon size="10" color="primary" icon="mdi-circle" />

                <span class="text-caption text-medium-emphasis">
                  {{ label1 }}
                </span>

                <span class="text-body-2 font-weight-bold">
                  {{ totalLabel1 }}
                </span>
              </div>

              <div
                v-if="totalLabel2 !== undefined"
                class="d-flex align-center ga-1"
              >
                <v-icon size="10" color="pink" icon="mdi-circle" />

                <span class="text-caption text-medium-emphasis">
                  {{ label2 }}
                </span>

                <span class="text-body-2 font-weight-bold">
                  {{ totalLabel2 }}
                </span>
              </div>

              <div
                v-if="totalLabel3 !== undefined"
                class="d-flex align-center ga-1"
              >
                <v-icon size="10" color="green" icon="mdi-circle" />

                <span class="text-caption text-medium-emphasis">
                  {{ label3 }}
                </span>

                <span class="text-body-2 font-weight-bold">
                  {{ totalLabel3 }}
                </span>
              </div>
            </div>
          </slot>
        </div>
      </div>

      <!-- Subtitle -->
      <div v-if="subtitle" class="text-caption text-medium-emphasis mt-1">
        {{ subtitle }}
      </div>

      <!-- Bottom Slot -->
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

  label1: {
    type: String,
    default: "",
  },

  label2: {
    type: String,
    default: "",
  },

  label3: {
    type: String,
    default: "",
  },

  totalLabel1: {
    type: Number,
    default: undefined,
  },

  totalLabel2: {
    type: Number,
    default: undefined,
  },

  totalLabel3: {
    type: Number,
    default: undefined,
  },
});
</script>

<style scoped>
/* Value co giãn theo viewport: 13" gọn, 16" thoáng */
.app-stat-value {
  font-size: clamp(1.4rem, 1.1rem + 1vw, 2rem) !important;
}

.card-statistic {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-statistic:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  flex: 1;
}

.chip-item {
  justify-content: center;
  min-width: 90px;
}
</style>
