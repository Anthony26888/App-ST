import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useManufactureDetails(id) {
  const manufactureDetails = ref([]);
  const manufactureDetailsError = ref([]);
  const connectionStatus = ref("Đang kết nối...");
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });

  onMounted(() => {
    socket.emit("getManufactureDetails", id);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      connectionStatus.value = "Đã kết nối thành công";
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      connectionStatus.value = "Mất kết nối";
    });

    socket.on("ManufactureDetailsData", (data) => {
      if (Array.isArray(data)) {
        console.log("First item:", data[0]);
      }
      manufactureDetails.value = data;
    });

    socket.on("ManufactureDetailsError", (message) => {
      manufactureDetailsError.value = message;
      connectionStatus.value = "Lỗi kết nối: " + message;
    });

    socket.on("updateManufactureDetails", () => {
      socket.emit("getManufactureDetails", id);
    });
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { manufactureDetails, manufactureDetailsError, connectionStatus };
}
