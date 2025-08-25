import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useSettingSVG(id) {
  const detailSetting = ref([]);
  const detailSettingError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });
  onMounted(() => {
    socket.emit("getSettingSVG", id);
    socket.on("SettingSVGData", (data) => {
      console.log("Received Setting SVG:", data);
      detailSetting.value = data;
    });
    socket.on("SettingSVGError", (message) => {
      detailSettingError.value = message;
    });
    socket.on("SettingSVGUpdate", () => {
      socket.emit("getSettingSVG", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { detailSetting, detailSettingError };
}
