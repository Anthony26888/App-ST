import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufactureRW(id) {
  const manufactureRW = ref([]);  // Initialize as empty array
  const manufactureRWError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);

  const fetchData = () => {
    if (id) {
      console.log("Fetching RW data for ID:", id);
      socket.emit("getManufactureRW", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureRWData", (data) => {
      console.log("Received RW data:", data);
      // Ensure data is an array before assigning
      if (Array.isArray(data)) {
        manufactureRW.value = data;
        console.log("Updated manufactureRW with:", manufactureRW.value);
      } else {
        console.error("Received non-array data:", data);
      }
    });

    socket.on("ManufactureRWError", (message) => {
      console.error("ManufactureRW Error:", message);
      manufactureRWError.value = message;
    });

    socket.on("UpdateManufactureRW", () => {
      console.log("UpdateManufactureRW event received");
      fetchData();
      socket.emit("ManufactureRWData", id);
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
      socket.off("ManufactureRWData");
      socket.off("ManufactureRWError");
      socket.off("UpdateManufactureRW");
      socket.disconnect();
    }
  });

  return { manufactureRW, manufactureRWError };
}
