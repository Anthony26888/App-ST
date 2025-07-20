import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useSparePartUsage(id) {
  const sparePartUsage = ref([]);
  const sparePartUsageError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });
  onMounted(() => {
    socket.emit("getSparePartUsage", id);
    socket.on("SparePartUsageData", (data) => {
      console.log("Received maintenance:", data);
      sparePartUsage.value = data;
    });
    socket.on("SparePartUsageError", (message) => {
      sparePartUsageError.value = message;
    });
    socket.on("SparePartUsageUpdate", () => {
      socket.emit("getSparePartUsage", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { sparePartUsage, sparePartUsageError };
}
