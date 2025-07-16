import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useManufactureAssembly(id) {
  const manufactureAssembly = ref([]);  // Initialize as empty array
  const manufactureAssemblyError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureAssembly", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureAssemblyData", (data) => {
      // Ensure data is an array before assigning

      manufactureAssembly.value = data;
    });

    socket.on("ManufactureAssemblyError", (message) => {
      console.error("ManufactureAssembly Error:", message);
      manufactureAssemblyError.value = message;
    });

    socket.on("UpdateManufactureAssembly", () => {
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
      socket.off("ManufactureAssemblyData");
      socket.off("ManufactureAssemblyError");
      socket.off("UpdateManufactureAssembly");
      socket.disconnect();
    }
  });

  return { manufactureAssembly, manufactureAssemblyError };
}
