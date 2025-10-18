import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufactureCounting(id) {
  const manufactureCounting = ref([]);  // Initialize as empty array
  const manufactureCountingError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy

  onMounted(() => {
    socket.emit("getManufactureCounting", id);
    socket.on("ManufactureCountingData", (data) => {
      // Ensure data is an array before assigning
      manufactureCounting.value = data;
    });

    socket.on("ManufactureCountingError", (message) => {
      manufactureCountingError.value = message;
    });

    socket.on("UpdateManufactureCounting", () => {
      socket.emit("getManufactureCounting", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { manufactureCounting, manufactureCountingError };
}
