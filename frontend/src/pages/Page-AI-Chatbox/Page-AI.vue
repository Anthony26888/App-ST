<template>
  <div class="chat-outer">
    <v-card class="chat-container" variant="text" >
      <div class="chat-history" ref="chatHistoryRef">
        <div v-for="(msg, idx) in chatHistory" :key="idx" :class="['chat-bubble', msg.role]">
          <div class="bubble-content">
            <span v-if="msg.role === 'user'">
              <strong>Bạn:</strong> {{ msg.content }}
            </span>
            <span v-else>
              <strong>AI:</strong> {{ msg.content }}
            </span>
          </div>
          <v-card v-if="msg.table" class="table-card" flat>
            <v-card-title class="table-title">Bảng dữ liệu</v-card-title>
            <div class="table-scroll">
              <v-data-table
                :items="msg.table"
                :headers="Object.keys(msg.table[0] || {}).map(k => ({ text: k, value: k }))"
                class="chat-table"
                dense
                hide-default-footer
              />
            </div>
          </v-card>
        </div>
        <div v-if="loading" class="chat-bubble assistant">
          <div class="bubble-content">
            <strong>AI:</strong>
            <span class="typing">
              Đang trả lời<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
          </div>
        </div>
      </div>
      <v-card-actions class="chat-input-row">
        <v-text-field
          v-model="question"
          label="Nhập câu hỏi hoặc từ khoá"
          @keyup.enter="ask('user123')"
          :loading="loading"
          class="chat-input"
          hide-details
          clearable
        />
        <v-btn icon color="primary" @click="ask('user123')" :loading="loading">
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { useAiQuery } from '@/composables/AI-Chat/useChatStream';
import { ref, nextTick, watch } from 'vue';

const { question, chatHistory, loading, ask } = useAiQuery();
const chatHistoryRef = ref(null);

watch(chatHistory, async () => {
  await nextTick();
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
  }
});
</script>

<style scoped>
.chat-outer {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background: #f3f6fb;
  padding: 40px 0;
}
.chat-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  height: 95vh;
  min-height: 480px;
  border-radius: 20px;
  box-shadow: 0 4px 24px #0002;
  border: 1px solid #e0e4ea;
  padding: 0 0 12px 0;
  background: #fff;
  margin: 0 auto;
}
.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 32px 24px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  align-items: stretch;
  scroll-behavior: smooth;
}
.chat-bubble {
  max-width: 80%;
  padding: 14px 18px;
  border-radius: 18px 18px 4px 18px;
  word-break: break-word;
  box-shadow: 0 2px 8px #0001;
  margin-bottom: 2px;
  font-size: 16px;
  line-height: 1.6;
  transition: background 0.2s;
  position: relative;
}
.chat-bubble.user {
  align-self: flex-end;
  background: linear-gradient(90deg, #e3f2fd 60%, #bbdefb 100%);
  color: #1976d2;
  border-radius: 18px 4px 18px 18px;
  box-shadow: 0 2px 12px #1976d220;
}
.chat-bubble.assistant {
  align-self: flex-start;
  background: #f7fafd;
  color: #333;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 2px 12px #1976d210;
}
.bubble-content {
  margin-bottom: 4px;
}
.table-card {
  margin-top: 10px;
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
  padding: 0 0 8px 0;
}
.table-title {
  font-size: 15px;
  font-weight: 600;
  color: #1976d2;
  padding-bottom: 0;
  padding-top: 8px;
}
.table-scroll {
  overflow-x: auto;
  padding: 0 8px 8px 8px;
}
.chat-table {
  margin-top: 0;
  border-radius: 8px;
  overflow: hidden;
  font-size: 15px;
  background: #f5f6fa;
  min-width: 400px;
}
.chat-input-row {
  display: flex;
  gap: 10px;
  padding: 12px 24px 0 24px;
  border-top: 1px solid #e0e4ea;
  background: #fff;
  border-radius: 0 0 20px 20px;
}
.chat-input {
  flex: 1;
  font-size: 16px;
}
.typing {
  font-style: italic;
  color: #888;
}
.typing .dot {
  animation: blink 1.4s infinite both;
}
.typing .dot:nth-child(2) { animation-delay: 0.2s; }
.typing .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink {
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}
@media (max-width: 900px) {
  .chat-container {
    max-width: 98vw;
    height: 85vh;
    min-height: 320px;
  }
  .chat-history {
    padding: 18px 6px 10px 6px;
  }
  .chat-input-row {
    padding: 8px 8px 0 8px;
  }
  .chat-table {
    min-width: 220px;
    font-size: 14px;
  }
}
</style>
