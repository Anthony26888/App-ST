import { ref } from 'vue'
import axios from 'axios'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
export function useDeliveryChat() {
  const loading = ref(false)
  const error = ref('')
  const messages = ref([
    {
      role: 'assistant',
      text: 'Chào bạn, bạn có thể hỏi như: PO nào trễ, khách nào còn hàng chưa giao đủ, tóm tắt khách ABC...',
      createdAt: new Date().toISOString()
    }
  ])

  const api = axios.create({
    baseURL: "http://localhost:3000/api/ai-project",
    timeout: 120000
  })

  async function sendMessage(question) {
    const text = String(question || '').trim()
    if (!text) return

    error.value = ''
    messages.value.push({
      role: 'user',
      text,
      createdAt: new Date().toISOString()
    })

    loading.value = true

    try {
      const { data } = await api.post('/chat-delivery', {
        question: text
      })

      messages.value.push({
        role: 'assistant',
        text: data?.answer || 'Không có phản hồi từ AI',
        createdAt: new Date().toISOString(),
        meta: {
          intent: data?.intent || null,
          matchedCustomer: data?.matchedCustomer || null,
          summary: data?.summary || null
        }
      })
    } catch (err) {
      error.value =
        err?.response?.data?.error ||
        err?.message ||
        'Lỗi gửi câu hỏi'

      messages.value.push({
        role: 'assistant',
        text: `Có lỗi xảy ra: ${error.value}`,
        createdAt: new Date().toISOString()
      })
    } finally {
      loading.value = false
    }
  }

  function clearMessages() {
    messages.value = [
      {
        role: 'assistant',
        text: 'Đã làm mới cuộc trò chuyện. Bạn hỏi tiếp nhé.',
        createdAt: new Date().toISOString()
      }
    ]
  }

  return {
    loading,
    error,
    messages,
    sendMessage,
    clearMessages
  }
}