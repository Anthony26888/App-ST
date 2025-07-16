<template>
    <v-card class="chat-card h-100" elevation="4">
      <!-- Chat Header -->
      <v-card-title class="chat-header pa-4">
        <div class="d-flex align-center" style="width: 100%">
          <v-avatar size="40" class="mr-3" color="primary">
            <v-icon size="24" color="white">mdi-robot</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6 mb-0">Trợ lí ứng dụng</h3>
            <span class="text-caption text-medium-emphasis">
              <v-icon :color="loading ? 'warning' : 'success'">mdi-circle-slice-8</v-icon>
              {{ loading ? "Đang nhập..." : "Sẵn sàng trò chuyện" }}
            </span>
          </div>
          <v-spacer></v-spacer>
          <v-tooltip text="Xóa toàn bộ đoạn chat" location="bottom">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon color="error" @click="clearMessages" :disabled="messages.length === 0" size="small">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </v-card-title>
  
      <v-divider></v-divider>
  
      <!-- Chat Messages -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state">
          <v-icon size="64" color="grey-lighten-1" class="mb-4"
            >mdi-chat-outline</v-icon
          >
          <h4 class="text-h6 text-grey-darken-1 mb-2">Chào mừng bạn!</h4>
          <p class="text-body-2 text-grey">
            Hãy bắt đầu cuộc trò chuyện với Trợ lý ứng dụng
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
                <v-icon v-if="message.from === 'user'" size="16" color="white"
                  >mdi-account</v-icon
                >
                <v-icon v-else size="16" color="primary">mdi-robot</v-icon>
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
              <div class="message-time">
                {{ formatTime(new Date()) }}
              </div>
            </div>
          </div>
        </div>
  
        <!-- Loading indicator -->
        <div v-if="loading" class="message-wrapper">
          <div class="message-bubble ai-message">
            <div class="message-avatar">
              <v-avatar size="32" color="grey-lighten-3">
                <v-icon size="16" color="primary">mdi-robot</v-icon>
              </v-avatar>
            </div>
            <div class="message-content ai-bubble">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Chat Input -->
      <div class="chat-input-container">
        <v-divider></v-divider>
        <div class="chat-input-wrapper pa-4">
          <div v-if="messages.length === 0" class="suggestions-container mt-3">
            <p class="text-caption text-medium-emphasis mb-2">Gợi ý cho bạn:</p>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="suggestion in suggestions"
                :key="suggestion.label"
                @click="selectSuggestion(suggestion)"
                size="small"
                variant="outlined"
                label
                class="suggestion-chip"
              >
                <v-icon start :icon="suggestion.icon"></v-icon>
                {{ suggestion.label }}
              </v-chip>
            </div>
          </div>
          <div class="d-flex align-end">
            <v-text-field
              v-model="input"
              placeholder="Nhập tin nhắn của bạn..."
              variant="outlined"
              density="compact"
              hide-details
              class="flex-grow-1 mr-3"
              @keyup.enter="sendMessage"
              :disabled="loading"
              :loading="loading"
              prepend-inner-icon="mdi-emoticon-outline"
              color="primary"
            ></v-text-field>
            <v-btn
              @click="sendMessage"
              :disabled="!input.trim() || loading"
              :loading="loading"
              color="primary"
              size="large"
              icon
              elevation="2"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </v-card>
  </template>
  
  <script setup>
  import { ref, nextTick, watch } from "vue";
  import { useChat } from "@/composables/AI-Chat/AI-chat";
  import InputFiled from "@/components/Input-Field.vue";
  import InputSelect from "@/components/Input-Select.vue";
  import MarkdownIt from "markdown-it";
  import { io } from "socket.io-client";
  const md = new MarkdownIt();
  
  const input = ref("");
  const messagesContainer = ref(null);
  const { messages, sendMessage: sendChatMessage, loading } = useChat();
  
  const selectedSuggestion = ref(null);
  
  const socket = io("http://localhost:3000"); // hoặc URL backend
  
  const suggestions = ref([
    {
      label: "Liệt kê các dự án",
      icon: "mdi-progress-question",
    },
    {
      label: "Tóm tắt tình hình sản xuất hôm nay",
      icon: "mdi-file-chart-outline",
    },
    {
      label: "Kiểm tra tồn kho linh kiện 'Resistor 10k'",
      icon: "mdi-magnify",
    },
    {
      label: "Kiểm tra lịch bảo trì định thiết bị",
      icon: "mdi-tools",
    },
    {
      label: "Danh sách đơn hàng",
      icon: "mdi-format-list-bulleted-type",
    },
  ]);
  
  function sendMessage() {
    if (!input.value.trim() || loading.value) return;
    let messageToSend = input.value;
    if (
      selectedSuggestion.value &&
      input.value === selectedSuggestion.value.label
    ) {
      messageToSend = selectedSuggestion.value.label;
    }
    sendChatMessage(messageToSend);
    input.value = "";
    selectedSuggestion.value = null;
    scrollToBottom();
  }
  
  function selectSuggestion(suggestion) {
    input.value = suggestion.label;
    selectedSuggestion.value = suggestion;
  }
  
  function scrollToBottom() {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    });
  }
  
  function formatMessage(text) {
    // Render markdown (bao gồm bảng) thành HTML
    return md.render(text);
  }
  
  function formatTime(date) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const clearMessages = async () => {
    messages.value = [];
    try {
      const response = await axios.delete(
        `${Url}/ai/clear-session`
      );
      console.log(response);
      MessageDialog.value = "Xoá dữ liệu thành công";
      Reset();
    } catch (error) {
      console.error(error);
      MessageErrorDialog.value = "Xoá dữ liệu thất bại";
      Error();
    }
  };
  
  // Auto scroll when new messages arrive
  watch(
    messages,
    () => {
      scrollToBottom();
    },
    { deep: true }
  );
  </script>
  
  <style scoped>
  .chat-container {
    height: 100vh;
    background: #f5f6fa;
  }
  
  .chat-card {
    height: 100vh;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    overflow: hidden;
    background: #fff;
  }
  
  .chat-header {
    background: #fff;
    color: #222;
    border-bottom: 1px solid #eee;
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #f5f6fa;
    scroll-behavior: smooth;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
  }
  
  .message-wrapper {
    margin-bottom: 16px;
  }
  
  .message-bubble {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    max-width: 80%;
  }
  
  .user-message {
    margin-left: auto;
    flex-direction: row-reverse;
  }
  
  .ai-message {
    margin-right: auto;
  }
  
  .message-avatar {
    flex-shrink: 0;
  }
  
  .message-content {
    padding: 12px 16px;
    border-radius: 18px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    position: relative;
    max-width: 100%;
  }
  
  .user-bubble {
    background: #e3f2fd;
    color: #1976d2;
  }
  
  .ai-bubble {
    background: #f1f1f1;
    color: #333;
  }
  
  .message-text {
    line-height: 1.5;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
  
  .message-text table {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
  }
  .message-text th,
  .message-text td {
    border: 1px solid #ccc;
    padding: 4px 8px;
    text-align: left;
  }
  .message-text th {
    background: #f5f5f5;
  }
  
  .message-time {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
  }
  
  .message-link {
    color: #1976d2;
    text-decoration: none;
  }
  
  .user-message .message-link {
    color: #1976d2;
    text-decoration: underline;
  }
  
  .chat-input-container {
    background: #fff;
  }
  
  .chat-input-wrapper {
    background: #fff;
  }
  
  /* Typing indicator */
  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 8px 0;
  }
  
  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #1976d2;
    animation: typing 1.4s infinite ease-in-out;
  }
  
  .typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
  }
  
  .typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
  }
  
  @keyframes typing {
    0%,
    80%,
    100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  /* Scrollbar styling */
  .chat-messages::-webkit-scrollbar {
    width: 6px;
  }
  
  .chat-messages::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .chat-messages::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 3px;
  }
  
  .chat-messages::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.15);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .chat-container {
      height: 100vh;
    }
  
    .chat-card {
      height: 100vh;
      border-radius: 0;
    }
  
    .message-bubble {
      max-width: 90%;
    }
  }
  
  .suggestion-chip {
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
    border-color: #ddd;
  }
  
  .suggestion-chip:hover {
    background-color: #e3f2fd;
    border-color: #1976d2;
    color: #1976d2;
  }
  </style>