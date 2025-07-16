import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useSparePartUsage(id) {
  const sparePartUsage = ref([]);
  const sparePartUsageError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });
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
