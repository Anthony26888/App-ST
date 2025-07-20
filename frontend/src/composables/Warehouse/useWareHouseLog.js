import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useWareHouseLog() {
  const warehouseLog = ref([]);
  const warehouseLogError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });
  onMounted(() => {
    socket.emit("getWareHouseLog");
    socket.on("WareHouseLogData", (data) => {
      console.log("Received warehouse log:", data);
      warehouseLog.value = data;
    });
    socket.on("WareHouseLogError", (message) => {
      warehouseLogError.value = message;
    });
    socket.on("WareHouseLogUpdate", () => {
      socket.emit("getWareHouseLog");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { warehouseLog, warehouseLogError };
}
