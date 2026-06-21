import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useFilterBomQC() {
  const filterBomQC = ref([]);
  const filterBomQCError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL); // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getFilterBomQC");
    socket.on("FilterBomQCData", (data) => {
      filterBomQC.value = data;
    });
    socket.on("FilterBomQCError", (message) => {
      filterBomQCError.value = message;
    });
    socket.on("UpdateFilterBomQC", () => {
      socket.emit("getFilterBomQC");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { filterBomQC, filterBomQCError };
}
