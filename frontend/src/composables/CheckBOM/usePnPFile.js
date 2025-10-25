import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function usePnPFile(id) {
  const detailPnP = ref([]);
  const detailPnPError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getPnPFile", id);
    socket.on("PnPFileData", (data) => {
      detailPnP.value = data;
    });
    socket.on("PnPFileError", (message) => {
      detailPnPError.value = message;
    });
    socket.on("PnPFileUpdate", () => {
      socket.emit("getPnPFile", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { detailPnP, detailPnPError };
}
