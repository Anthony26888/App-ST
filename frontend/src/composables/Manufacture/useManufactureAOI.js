import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufactureAOI(id) {
  const manufactureAOI = ref([]);  // Initialize as empty array
  const manufactureAOIError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureAOI", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureAOIData", (data) => {
      console.log("Received Manufacture AOI:", data);
      // Ensure data is an array before assigning
      manufactureAOI.value = data;
    });

    socket.on("ManufactureAOIError", (message) => {
      console.error("ManufactureAOI Error:", message);
      manufactureAOIError.value = message;
    });

    socket.on("UpdateManufactureAOI", () => {
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
      socket.off("ManufactureAOIData");
      socket.off("ManufactureAOIError");
      socket.off("UpdateManufactureAOI");
      socket.disconnect();
    }
  });

  return { manufactureAOI, manufactureAOIError };
}
