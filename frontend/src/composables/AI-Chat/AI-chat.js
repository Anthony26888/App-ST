// frontend/composables/useChat.js
import { ref, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000') // chỉnh lại nếu deploy

export function useChat() {
  const messages = ref([])
  const loading = ref(false)
  let loadingTimeout = null;

  const sendMessage = (msg) => {
    messages.value.push({ from: 'user', text: msg })
    loading.value = true
    socket.emit('user_message', msg)
    // Bắt đầu timeout 1 phút
    if (loadingTimeout) clearTimeout(loadingTimeout);
    loadingTimeout = setTimeout(() => {
      if (loading.value) {
        loading.value = false;
        messages.value.push({ from: 'ai', text: '[Lỗi] Không nhận được phản hồi từ AI sau 60 giây. Vui lòng thử lại.' });
      }
    }, 60000);
  }

  const clearMessages = () => {
    messages.value = [];
  }

  socket.on('ai_message', (chunk) => {
    const last = messages.value[messages.value.length - 1]
    if (last?.from === 'ai') {
      last.text += chunk
    } else {
      messages.value.push({ from: 'ai', text: chunk })
    }
  })

  socket.on('ai_done', () => {
    loading.value = false;
    if (loadingTimeout) clearTimeout(loadingTimeout);
  })
  socket.on('ai_error', (err) => {
    loading.value = false
    if (loadingTimeout) clearTimeout(loadingTimeout);
    messages.value.push({ from: 'ai', text: '[Error] ' + err })
  })

  onUnmounted(() => {
    socket.disconnect()
  })

  return { messages, sendMessage, loading, clearMessages }
}
