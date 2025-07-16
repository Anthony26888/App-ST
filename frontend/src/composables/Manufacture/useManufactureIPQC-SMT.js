import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useManufactureIPQCSMT(id) {
  const manufactureIPQCSMT = ref([]);  // Initialize as empty array
  const manufactureIPQCSMTError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureIPQCSMT", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureIPQCSMTData", (data) => {
      // Ensure data is an array before assigning
      manufactureIPQCSMT.value = data;
    });

    socket.on("ManufactureIPQCSMTError", (message) => {
      manufactureIPQCSMTError.value = message;
    });

    socket.on("UpdateManufactureIPQCSMT", () => {
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
      socket.off("ManufactureIPQCSMTData");
      socket.off("ManufactureIPQCSMTError");
      socket.off("UpdateManufactureIPQCSMT");
      socket.disconnect();
    }
  });

  return { manufactureIPQCSMT, manufactureIPQCSMTError };
}
