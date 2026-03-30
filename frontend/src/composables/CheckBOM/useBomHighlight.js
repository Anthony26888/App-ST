import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useBomHighlight(id) {
  const bomHighlight = ref([]);
  const bomHighlightError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getBomHighlight", id);
    socket.on("BomHighlightData", (data) => {
      bomHighlight.value = data;
    });
    socket.on("BomHighlightError", (message) => {
      bomHighlightError.value = message;
    });
    socket.on("BomHighlightUpdate", () => {
      socket.emit("getBomHighlight", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { bomHighlight, bomHighlightError };
}
