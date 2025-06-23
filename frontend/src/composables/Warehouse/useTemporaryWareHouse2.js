import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useTemporaryWareHouse2() {
  const temporaryWarehouse2 = ref([]);
  const temporaryWarehouse2Error = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);
  onMounted(() => {
    socket.emit("getTemporaryWareHouse2");
    socket.on("TemporaryWareHouse2Data", (data) => {
      console.log("Received temporary warehouse 2:", data);
      temporaryWarehouse2.value = data;
    });
    socket.on("TemporaryWareHouse2Error", (message) => {
      temporaryWarehouseError.value = message;
    });
    socket.on("TemporaryWareHouse2Update", () => {
      socket.emit("getTemporaryWareHouse2");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { temporaryWarehouse2, temporaryWarehouse2Error };
}
