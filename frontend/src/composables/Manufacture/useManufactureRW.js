import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufactureHand(id) {
  const manufactureHand = ref([]);  // Initialize as empty array
  const manufactureHandError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureHand", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureHandData", (data) => {
      // Ensure data is an array before assigning
      manufactureHand.value = data;
    });

    socket.on("ManufactureHandError", (message) => {
      console.error("ManufactureAOI Error:", message);
      manufactureHandError.value = message;
    });

    socket.on("UpdateManufactureHand", () => {
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
      socket.off("ManufactureHandData");
      socket.off("ManufactureHandError");
      socket.off("UpdateManufactureHand");
      socket.disconnect();
    }
  });

  return { manufactureHand, manufactureHandError };
}
