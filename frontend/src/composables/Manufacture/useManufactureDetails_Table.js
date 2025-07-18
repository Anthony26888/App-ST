import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useManufactureDetailsTable(id) {
  const manufactureDetailsTable = ref([]);
  const manufactureDetailsTableError = ref([]);
  const connectionStatus = ref("Đang kết nối...");
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });

  onMounted(() => {
    socket.emit("getManufactureDetailsTable", id);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      connectionStatus.value = "Đã kết nối thành công";
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      connectionStatus.value = "Mất kết nối";
    });

    socket.on("ManufactureDetailsTableData", (data) => {
      console.log("Received manufacture details table:", data);
      manufactureDetailsTable.value = data;
    });

    socket.on("ManufactureDetailsTableError", (message) => {
      manufactureDetailsTableError.value = message;
      connectionStatus.value = "Lỗi kết nối: " + message;
    });

    socket.on("updateManufactureDetailsTable", () => {
      socket.emit("getManufactureDetailsTable", id);
    });
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { manufactureDetailsTable, manufactureDetailsTableError, connectionStatus };
}
