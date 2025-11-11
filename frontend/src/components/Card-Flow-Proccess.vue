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
      <v-card-title class="text-subtitle-1 font-weight-bold pa-1">{{
        title
      }}</v-card-title>
    </v-badge>
    <v-card-title v-else class="text-subtitle-1 font-weight-bold pa-1">{{
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
  min-width: 150px;
  max-width: 180px;
  cursor: pointer;
  border-radius: 8px !important;
}

.flow-arrow {
  font-size: 2rem;
  font-weight: 300;
  color: #3f51b5; 
}

/* Đổ bóng cảnh báo cho Bottleneck (viền đỏ) */
.bottleneck-shadow {
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.6) !important;
  border: 2px solid #ef5350 !important; /* Viền đỏ */
}

/* 🎯 CSS MỚI: Viền cho trạng thái đã chọn (viền xanh) */
.selected-border {
  border: 2px solid #2196F3 !important; 
  box-shadow: 0 0 10px rgba(33, 150, 243, 0.6) !important;
}
</style>