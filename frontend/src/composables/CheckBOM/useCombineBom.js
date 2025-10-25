import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useCombineBom(id) {
  const combineBom = ref([]);
  const combineBomError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getCombineBom", id);
    socket.on("CombineBomData", (data) => {
      combineBom.value = data;
    });
    socket.on("CombineBomError", (message) => {
      combineBomError.value = message;
    });
    socket.on("CombineBomUpdate", () => {
      socket.emit("getCombineBom", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { combineBom, combineBomError };
}
