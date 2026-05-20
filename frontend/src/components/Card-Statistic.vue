<template>
  <v-card
    class="rounded-xl h-100 card-statistic"
    elevation="0"
    color="surface"
    border
  >
    <v-card-text class="d-flex flex-column justify-space-between h-100">
      <div>
        <!-- Header -->
        <div class="d-flex align-center mb-3">
          <v-avatar :color="color" variant="tonal" size="42" class="me-3">
            <v-icon :icon="icon" size="24" />
          </v-avatar>

          <div class="text-subtitle-1 font-weight-medium text-medium-emphasis">
            {{ title }}
          </div>
        </div>

        <!-- Value + Right Info -->
        <div class="d-flex align-center justify-space-between ga-3 flex-wrap">
          <!-- Main Value -->
          <div
            :class="['text-h3 font-weight-bold', `text-${color}`]"
            style="line-height: 1"
          >
            {{ value }}
          </div>

          <!-- Right Content -->
          <slot name="value-append">
            <div
              v-if="
                totalSMT !== undefined ||
                totalTHT !== undefined ||
                totalPickup !== undefined
              "
              class="d-flex align-center flex-wrap ga-3"
            >
              <div
                v-if="totalSMT !== undefined"
                class="d-flex align-center ga-1"
              >
                <v-icon size="10" color="primary" icon="mdi-circle" />

                <span class="text-caption text-medium-emphasis"> SMT </span>

                <span class="text-body-2 font-weight-bold">
                  {{ totalSMT }}
                </span>
              </div>

              <div
                v-if="totalTHT !== undefined"
                class="d-flex align-center ga-1"
              >
                <v-icon size="10" color="pink" icon="mdi-circle" />

                <span class="text-caption text-medium-emphasis"> Hàn tay </span>

                <span class="text-body-2 font-weight-bold">
                  {{ totalTHT }}
                </span>
              </div>

              <div
                v-if="totalPickup !== undefined"
                class="d-flex align-center ga-1"
              >
                <v-icon size="10" color="green" icon="mdi-circle" />

                <span class="text-caption text-medium-emphasis"> Gắp tay </span>

                <span class="text-body-2 font-weight-bold">
                  {{ totalPickup }}
                </span>
              </div>
            </div>
          </slot>
        </div>
      </div>

      <!-- Subtitle -->
      <div v-if="subtitle" class="text-caption text-medium-emphasis mt-3">
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

  totalSMT: {
    type: Number,
    default: undefined,
  },

  totalTHT: {
    type: Number,
    default: undefined,
  },

  totalPickup: {
    type: Number,
    default: undefined,
  },
});
</script>

<style scoped>
.card-statistic {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-statistic:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06) !important;
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
