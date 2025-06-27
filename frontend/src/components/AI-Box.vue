// File: AIBox.vue
<template>
  <v-card class="chat-card h-100" elevation="4">
    <!-- Header -->
    <v-card-title class="chat-header pa-4">
      <div class="d-flex align-center">
        <v-avatar size="40" class="mr-3" color="primary">
          <v-icon size="24" color="white">mdi-robot</v-icon>
        </v-avatar>
        <div>
          <h3 class="text-h6 mb-0">Trợ lí ứng dụng</h3>
          <span class="text-caption">{{
            loading ? "Đang nhập..." : "Sẵn sàng"
          }}</span>
        </div>
      </div>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Messages -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <v-icon size="64" color="grey-lighten-1" class="mb-4"
          >mdi-chat-outline</v-icon
        >
        <h4 class="text-h6 text-grey-darken-1 mb-2">Chào mừng bạn!</h4>
        <p class="text-body-2 text-grey">
          Hãy bắt đầu trò chuyện với AI Assistant
        </p>
      </div>

      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message-wrapper"
      >
        <div
          :class="[
            'message-bubble',
            message.from === 'user' ? 'user-message' : 'ai-message',
          ]"
        >
          <div class="message-avatar">
            <v-avatar
              size="32"
              :color="message.from === 'user' ? 'primary' : 'grey-lighten-3'"
            >
              <v-icon
                size="16"
                :color="message.from === 'user' ? 'white' : 'primary'"
              >
                {{ message.from === "user" ? "mdi-account" : "mdi-robot" }}
              </v-icon>
            </v-avatar>
          </div>
          <div
            class="message-content"
            :class="message.from === 'user' ? 'user-bubble' : 'ai-bubble'"
          >
            <div
              class="message-text"
              v-html="formatMessage(message.text)"
            ></div>
            <div class="message-time">{{ formatTime(new Date()) }}</div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="message-wrapper">
        <div class="message-bubble ai-message">
          <div class="message-avatar">
            <v-avatar size="32" color="grey-lighten-3">
              <v-icon size="16" color="primary">mdi-robot</v-icon>
            </v-avatar>
          </div>
          <div class="message-content ai-bubble">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="chat-input-container">
      <v-divider></v-divider>
      <div class="chat-input-wrapper pa-4">
        <div class="d-flex align-end">
          <v-text-field
            v-model="input"
            placeholder="Nhập tin nhắn..."
            @keyup.enter="sendMessage"
            :disabled="loading"
            :loading="loading"
            prepend-inner-icon="mdi-emoticon-outline"
            class="flex-grow-1 mr-3"
            density="compact"
            variant="outlined"
            hide-details
            color="primary"
          />
          <v-btn
            icon
            @click="sendMessage"
            :disabled="!input.trim() || loading"
            :loading="loading"
            color="primary"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from "vue";
import { useChat } from "@/composables/AI-Chat/AI-chat";

const props = defineProps({
  tableNames: { type: Array, default: () => [] },
});

const input = ref("");
const messagesContainer = ref(null);
const { messages, sendMessage: sendChatMessage, loading } = useChat();

onMounted(() => {
  if (props.tableNames.length) {
    input.value = `Hãy phân tích dữ liệu từ các bảng: ${props.tableNames.join(
      ", "
    )}`;
    sendMessage();
  }
});

function sendMessage() {
  if (!input.value.trim() || loading.value) return;
  sendChatMessage(input.value);
  input.value = "";
  scrollToBottom();
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value)
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  });
}

function formatMessage(text) {
  return text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" class="message-link">$1</a>'
  );
}

function formatTime(date) {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

watch(messages, () => scrollToBottom(), { deep: true });
</script>

<style scoped>
/* giữ nguyên toàn bộ style như đã gửi */
</style>
