<template>
  <v-card
    class="process-card text-center pa-3"
    :class="{ 
      'bottleneck-shadow': isBottleneck, 
      'selected-border': isSelected 
    }"
    :color="color + '-lighten-5'"
    elevation="2"
    @click="emit('card-click', title)" hover
  >
    <v-badge
      v-if="isBottleneck"
      content="!"
      color="red-darken-3"
      offset-x="10"
      offset-y="10"
    >
      <v-card-title class="text-subtitle-1 font-weight-bold pa-1 process-card-title">{{
        title
      }}</v-card-title>
    </v-badge>
    <v-card-title v-else class="text-subtitle-1 font-weight-bold pa-1 process-card-title">{{
      title
    }}</v-card-title>

    <v-divider class="my-1"></v-divider>

    <div :class="['text-h5', 'font-weight-medium', `text-success`]">
      {{ pass }}
    </div>
    <div class="text-caption text-medium-emphasis text-error">Fail: {{ fail }}</div>
  </v-card>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    title: String,
    pass: String,
    fail: String,
    color: String,
    isBottleneck: {
        type: Boolean,
        default: false,
    },
    // 🎯 PROP MỚI
    isSelected: {
        type: Boolean,
        default: false,
    },
});

// 💡 Sửa lại: chỉ cần emit 'card-click' và 'toggle-bottleneck'
const emit = defineEmits(['card-click', 'toggle-bottleneck']); 

// Hàm openDetails không cần thiết nữa vì ta dùng @click trực tiếp trên template
</script>

<style scoped>
/* CSS cho phần Tối ưu hóa thị giác */
.process-card {
  width: 180px; /* Fixed width as requested */
  max-width: 180px;
  min-width: 150px;
  cursor: pointer;
  border-radius: 16px !important;
  transition: all 0.3s ease;
  border: 1px solid rgba(0,0,0,0.05);
}

.process-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.15) !important;
}

@media (max-width: 960px) {
  .process-card {
    width: calc(50% - 8px) !important; /* 2 cards per row with gap */
    max-width: none;
    min-width: 0;
  }
}

.process-card-title {
  white-space: normal; /* Allow text wrap */
  word-break: break-word; /* Break long words if necessary */
  line-height: 1.3; /* Adjust line height for wrapped text */
  font-size: 0.9rem; /* Slightly smaller font to fit more */
  letter-spacing: 0.01em;
}

.flow-arrow {
  font-size: 1.5rem;
  font-weight: 300;
  color: #94a3b8; 
}

/* Đổ bóng cảnh báo cho Bottleneck (viền đỏ) */
.bottleneck-shadow {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-error)), 0 8px 16px rgba(var(--v-theme-error), 0.2) !important;
  border-color: transparent !important;
}

/* 🎯 CSS MỚI: Viền cho trạng thái đã chọn (viền primary) */
.selected-border {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary)), 0 8px 16px rgba(var(--v-theme-primary), 0.2) !important;
  border-color: transparent !important;
}
</style>