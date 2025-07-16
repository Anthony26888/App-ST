// src/composables/useAiQuery.js
import { ref } from 'vue';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const socket = io(SOCKET_URL) // chỉnh lại nếu deploy

export function useAiQuery() {
  const question = ref('');
  const chatHistory = ref([]); // [{role: 'user'|'assistant', content: string, table?: object[]}]
  const loading = ref(false);

  socket.on('token', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'result') {
        // Trả về bảng dữ liệu
        chatHistory.value.push({ role: 'assistant', content: 'Dưới đây là bảng dữ liệu bạn yêu cầu:', table: data.data });
      } else if (data.type === 'answer') {
        chatHistory.value.push({ role: 'assistant', content: data.data });
      } else if (data.type === 'error') {
        console.error('Lỗi:', data.message);
        alert('❌ ' + data.message);
      }
    } catch (e) {
      console.log('Không parse được:', msg);
    }
  });

  function ask(session_id = 'default') {
    if (question.value.trim() === '') return;
    chatHistory.value.push({ role: 'user', content: question.value });
    loading.value = true;
    socket.emit('ask', {
      question: question.value,
      session_id,
    });
    question.value = '';
  }

  socket.on('done', () => {
    loading.value = false;
  });

  return {
    question,
    chatHistory,
    loading,
    ask,
  };
}

