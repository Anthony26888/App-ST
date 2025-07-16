import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useManufactureIPQC(id) {
  const manufactureIPQC = ref([]);  // Initialize as empty array
  const manufactureIPQCError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureIPQC", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureIPQCData", (data) => {
      // Ensure data is an array before assigning
      manufactureIPQC.value = data;
    });

    socket.on("ManufactureIPQCError", (message) => {
      console.error("ManufactureIPQC Error:", message);
      manufactureIPQCError.value = message;
    });

    socket.on("UpdateManufactureIPQC", () => {
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
      socket.off("ManufactureIPQCData");
      socket.off("ManufactureIPQCError");
      socket.off("UpdateManufactureIPQC");
      socket.disconnect();
    }
  });

  return { manufactureIPQC, manufactureIPQCError };
}
