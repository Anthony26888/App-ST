import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useRawBomHighlight(id) {
  const rawBomHighlight = ref([]);
  const rawBomHighlightError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getRawBomHighlight", id);
    socket.on("RawBomHighlightData", (data) => {
      rawBomHighlight.value = data;
    });
    socket.on("RawBomHighlightError", (message) => {
      rawBomHighlightError.value = message;
    });
    socket.on("RawBomHighlightUpdate", () => {
      socket.emit("getRawBomHighlight", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { rawBomHighlight, rawBomHighlightError };
}
