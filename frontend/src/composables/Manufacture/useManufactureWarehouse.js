import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufactureWarehouse(id) {
  const manufactureWarehouse = ref([]);  // Initialize as empty array
  const manufactureWarehouseError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureWarehouse", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureWarehouseData", (data) => {
      // Ensure data is an array before assigning
      manufactureWarehouse.value = data;
    });

    socket.on("ManufactureAOIError", (message) => {
      console.error("ManufactureAOI Error:", message);
      manufactureWarehouseError.value = message;
    });

    socket.on("UpdateManufactureWarehouse", () => {
      fetchData();
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      fetchData(); // Fetch data on reconnect
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  });

  onUnmounted(() => {
    if (socket) {
      socket.off("ManufactureWarehouseData");
      socket.off("ManufactureWarehouseError");
      socket.off("UpdateManufactureWarehouse");
      socket.disconnect();
    }
  });

  return { manufactureWarehouse, manufactureWarehouseError };
}
