<!-- src/components/AIButton.vue -->
<template>
  <div>
    <!-- Nút nổi góc phải dưới -->
    <v-btn icon class="ai-float-btn" color="primary" @click="show = true">
      <v-icon>mdi-robot</v-icon>
    </v-btn>

    <!-- Hộp thoại AI -->
     <v-dialog v-model="show" width="1200px"> 
        <AIBox  :tableName="tableName" />
     </v-dialog>
    
  </div>
</template>

<script setup>
import { ref } from "vue";
import AIBox from "./AI-Box.vue";

const props = defineProps({
  tableName: {
    type: String,
    default: "DefaultTable",
  },
});

const show = ref(false);
</script>

<style scoped>
.ai-float-btn {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 99999;
  background-color: #1976d2;
  color: white;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
</style>
