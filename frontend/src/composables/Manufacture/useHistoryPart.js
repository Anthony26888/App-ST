import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useHistoryPart(id) {
  const historyPart = ref([]);
  const historyPartError = ref([]);
  const connectionStatus = ref("Đang kết nối...");
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploys
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });

  onMounted(() => {
    socket.emit("getHistoryPart", id);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      connectionStatus.value = "Đã kết nối thành công";
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      connectionStatus.value = "Mất kết nối";
    });

    socket.on("HistoryPartData", (data) => {
      if (Array.isArray(data)) {
        console.log("First item:", data[0]);
      }
      historyPart.value = data;
    });

    socket.on("HistoryPartError", (message) => {
      historyPartError.value = message;
      connectionStatus.value = "Lỗi kết nối: " + message;
    });

    socket.on("updateHistoryPart", () => {
      socket.emit("getHistoryPart", id);
    });
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { historyPart, historyPartError, connectionStatus };
}
