import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufacture() {
  const manufacture = ref([]);
  const manufactureError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);
  onMounted(() => {
    socket.emit("getManufacture");
    socket.on("ManufactureData", (data) => {
      console.log("Received manufacture:", data);
      manufacture.value = data;
    });
    socket.on("ManufactureError", (message) => {
      manufactureError.value = message;
    });
    socket.on("ManufactureUpdate", () => {
      socket.emit("getManufacture");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { manufacture, manufactureError };
}
