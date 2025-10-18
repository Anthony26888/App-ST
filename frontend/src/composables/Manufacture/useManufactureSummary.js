import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufactureSummary(id) {
  const manufactureSummary = ref([]);  // Initialize as empty array
  const manufactureSummaryError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy

  onMounted(() => {
    socket.emit("getManufactureSummary", id);
    socket.on("ManufactureSummaryData", (data) => {
      // Ensure data is an array before assigning
      manufactureSummary.value = data;
    });

    socket.on("ManufactureSummaryError", (message) => {
      manufactureSummaryError.value = message;
    });

    socket.on("UpdateManufactureSummary", () => {
      socket.emit("getManufactureSummary", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { manufactureSummary, manufactureSummaryError };
}
