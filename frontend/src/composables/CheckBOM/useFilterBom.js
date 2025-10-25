import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useFilterBom() {
  const filterBom = ref([]);
  const filterBomError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL); // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getFilterBom");
    socket.on("FilterBomData", (data) => {
      filterBom.value = data;
    });
    socket.on("FilterBomError", (message) => {
      filterBomError.value = message;
    });
    socket.on("UpdateFilterBom", () => {
      socket.emit("getFilterBom");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { filterBom, filterBomError };
}
