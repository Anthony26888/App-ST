import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufactureFail(id) {
  const manufactureFail = ref([]);
  const manufactureFailError = ref([]);
  const connectionStatus = ref("Đang kết nối...");
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy

  onMounted(() => {
    socket.emit("getManufactureFail", id);

    socket.on("connect", () => {
      connectionStatus.value = "Đã kết nối thành công";
    });

    socket.on("disconnect", () => {
      connectionStatus.value = "Mất kết nối";
    });

    socket.on("ManufactureFailData", (data) => {
      if (Array.isArray(data)) {
      }
      manufactureFail.value = data;
    });

    socket.on("ManufactureFailError", (message) => {
      manufactureFailError.value = message;
      connectionStatus.value = "Lỗi kết nối: " + message;
    });

    socket.on("UpdateManufactureFail", () => {
      socket.emit("getManufactureFail", id);
    });
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { manufactureFail, manufactureFailError, connectionStatus };
}
