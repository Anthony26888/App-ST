import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useRawBomQC(id) {
  const rawBomQC = ref([]);
  const rawBomQCError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL); // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getRawBomQC", id);
    socket.on("RawBomQCData", (data) => {
      rawBomQC.value = data;
    });
    socket.on("RawBomQCError", (message) => {
      rawBomQCError.value = message;
    });
    socket.on("RawBomQCUpdate", () => {
      socket.emit("getRawBomQC", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { rawBomQC, rawBomQCError };
}
