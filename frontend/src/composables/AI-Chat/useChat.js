import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useChat() {
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  const messages = ref([]);
  const isLoading = ref(false);

  const ask = (question) => {
    isLoading.value = true;
    socket.emit("ask", question);
  };

  onMounted(() => {
    socket.on("answer", (response) => {
      messages.value.push(response);
      isLoading.value = false;
    });
  });

  onUnmounted(() => {
    socket.disconnect();
  });

  return { ask, messages, isLoading };
}




