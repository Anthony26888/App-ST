import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useTemporaryWareHouse() {
  const temporaryWarehouse = ref([]);
  const temporaryWarehouseError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);
  onMounted(() => {
    socket.emit("getTemporaryWareHouse");
    socket.on("TemporaryWareHouseData", (data) => {
      console.log("Received temporary warehouse:", data);
      temporaryWarehouse.value = data;
    });
    socket.on("TemporaryWareHouseError", (message) => {
      temporaryWarehouseError.value = message;
    });
    socket.on("TemporaryWareHouseUpdate", () => {
      socket.emit("getTemporaryWareHouse");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { temporaryWarehouse, temporaryWarehouseError };
}
