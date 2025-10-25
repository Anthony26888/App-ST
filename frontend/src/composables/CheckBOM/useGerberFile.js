import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useGerberFile(id) {
  const detailGerber = ref([]);
  const detailGerberError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getGerberFile", id);
    socket.on("GerberFileData", (data) => {
      detailGerber.value = data;
    });
    socket.on("GerberFileError", (message) => {
      detailGerberError.value = message;
    });
    socket.on("GerberFileUpdate", () => {
      socket.emit("getGerberFile", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { detailGerber, detailGerberError };
}
