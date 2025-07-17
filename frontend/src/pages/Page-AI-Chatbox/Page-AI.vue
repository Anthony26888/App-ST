<template>
  <v-container>
    <v-text-field v-model="question" label="Nhập từ khóa hoặc câu hỏi" />
    <v-btn @click="ask(question)" :loading="isLoading">Hỏi</v-btn>

    <v-list>
      <v-list-item
        v-for="(item, index) in messages"
        :key="index"
      >
        <pre>{{ item | pretty }}</pre>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { useChat } from "@/composables/AI-Chat/useChat";

const question = ref("");
const { ask, messages, isLoading } = useChat();

function pretty(value) {
  return typeof value === "object" ? JSON.stringify(value, null, 2) : value;
}
</script>
