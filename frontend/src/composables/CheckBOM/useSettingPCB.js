import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useSettingPCB(id) {
  const detailSetting = ref([]);
  const detailSettingError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getSettingPCB", id);
    socket.on("SettingPCBData", (data) => {
      detailSetting.value = data;
    });
    socket.on("SettingPCBError", (message) => {
      detailSettingError.value = message;
    });
    socket.on("SettingPCBUpdate", () => {
      socket.emit("getSettingPCB", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { detailSetting, detailSettingError };
}
