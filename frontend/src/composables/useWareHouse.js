import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useWareHouse() {
  const warehouse = ref([]);
  const warehouseError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);
  onMounted(() => {
    socket.emit("getWareHouse");
    socket.on("WareHouseData", (data) => {
      console.log("Received warehouse:", data);
      warehouse.value = data;
    });
    socket.on("WareHouseError", (message) => {
      warehouseError.value = message;
    });
    socket.on("WareHouseUpdate", () => {
      socket.emit("getWareHouse");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { warehouse, warehouseError };
}
