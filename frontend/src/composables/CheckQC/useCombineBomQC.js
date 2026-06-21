import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useCombineBomQC(id) {
  const combineBomQC = ref([]);
  const combineBomQCError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL); // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getCombineBomQC", id);
    socket.on("CombineBomQCData", (data) => {
      combineBomQC.value = data;
    });
    socket.on("CombineBomQCError", (message) => {
      combineBomQCError.value = message;
    });
    socket.on("CombineBomQCUpdate", () => {
      socket.emit("getCombineBomQC", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { combineBomQC, combineBomQCError };
}
