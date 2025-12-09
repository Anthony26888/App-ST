import { ref, onMounted, onUnmounted, watch } from "vue";
import { io } from "socket.io-client";

export function useWareHouse2Find(id) {
  const WareHouse2Find = ref([]);
  const WareHouse2FindError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy

  const fetchData = (partNumber) => {
    if (partNumber) {
      socket.emit("getWareHouse2Find", partNumber);
    }
  };

  onMounted(() => {
    socket.on("WareHouse2FindData", (data) => {
      WareHouse2Find.value = data;
    });
    socket.on("WareHouse2FindError", (message) => {
      WareHouse2FindError.value = message;
    });
    socket.on("updateWareHouse2Find", () => {
      fetchData(id.value);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));

    // Initial fetch if id exists
    if (id.value) {
      fetchData(id.value);
    }
  });

  // Watch for changes in id
  watch(id, (newId) => {
    if (newId) {
      fetchData(newId);
    }
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { WareHouse2Find, WareHouse2FindError };
}
