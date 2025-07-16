import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useManufactureCC(id) {
  const manufactureCC = ref([]);  // Initialize as empty array
  const manufactureCCError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureCC", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureCCData", (data) => {
      // Ensure data is an array before assigning
      manufactureCC.value = data;
    });

    socket.on("ManufactureCCError", (message) => {
      manufactureCCError.value = message;
    });

    socket.on("UpdateManufactureCC", () => {
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
      socket.off("ManufactureCCData");
      socket.off("ManufactureCCError");
      socket.off("UpdateManufactureCC");
      socket.disconnect();
    }
  });

  return { manufactureCC, manufactureCCError };
}
