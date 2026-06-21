import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useSettingPCBQC(id) {
  const detailSettingQC = ref([]);
  const detailSettingQCError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL); // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getSettingPCBQC", id);
    socket.on("SettingPCBQCData", (data) => {
      detailSettingQC.value = data;
    });
    socket.on("SettingPCBQCError", (message) => {
      detailSettingQCError.value = message;
    });
    socket.on("SettingPCBQCUpdate", () => {
      socket.emit("getSettingPCBQC", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { detailSettingQC, detailSettingQCError };
}
