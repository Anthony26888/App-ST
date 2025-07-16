import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useManufactureSMT(id) {
  const manufactureSMT = ref([]);  // Initialize as empty array
  const manufactureSMTError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureSMT", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureSMTData", (data) => {
      // Ensure data is an array before assigning
      manufactureSMT.value = data;
    });

    socket.on("ManufactureSMTError", (message) => {
      console.error("ManufactureSMT Error:", message);
      manufactureSMTError.value = message;
    });

    socket.on("UpdateManufactureSMT", () => {
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
      socket.off("ManufactureSMTData");
      socket.off("ManufactureSMTError");
      socket.off("UpdateManufactureSMT");
      socket.disconnect();
    }
  });

  return { manufactureSMT, manufactureSMTError };
}
