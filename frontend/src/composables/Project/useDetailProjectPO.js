import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useDetailProjectPO(id) {
  const detailProjectPO = ref([]);
  const detailProjectPOError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getDetailProjectPO", id);
    socket.on("DetailProjectPOData", (data) => {
      detailProjectPO.value = data;
    });
    socket.on("DetailProjectPOError", (message) => {
      detailProjectPOError.value = message;
    });
    socket.on("updateDetailProjectPO", () => {
      socket.emit("getDetailProjectPO", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { detailProjectPO, detailProjectPOError };
}
