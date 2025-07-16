import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useManufactureOQC(id) {
  const manufactureOQC = ref([]);  // Initialize as empty array
  const manufactureOQCError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureOQC", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureOQCData", (data) => {
      // Ensure data is an array before assigning
      manufactureOQC.value = data;
    });

    socket.on("ManufactureOQCError", (message) => {
      manufactureOQCError.value = message;
    });

    socket.on("UpdateManufactureOQC", () => {
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
      socket.off("ManufactureOQCData");
      socket.off("ManufactureOQCError");
      socket.off("UpdateManufactureOQC");
      socket.disconnect();
    }
  });

  return { manufactureOQC, manufactureOQCError };
}
