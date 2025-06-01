import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufacture() {
  const manufacture = ref([]);
  const manufactureFound = ref([])
  const manufactureError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);
  
  onMounted(() => {
    console.log("Initializing socket connection to:", SOCKET_URL);
    
    socket.emit("getManufacture");
    console.log("Emitted getManufacture event");
    
    socket.on("ManufactureData", (data) => {
      if (Array.isArray(data)) {
        manufacture.value = data;
        manufactureFound.value = data[0]
      }
      
    });
    
    socket.on("ManufactureError", (message) => {
      console.error("Manufacture error received:", message);
      manufactureError.value = message;
    });
    
    socket.on("ManufactureUpdate", () => {
      console.log("Manufacture update received, requesting new data");
      socket.emit("getManufacture");
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully. ID:", socket.id);
      // Request data immediately after connection
      socket.emit("getManufacture");
    });
    
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected. Reason:", reason);
    });
  });

  onUnmounted(() => {
    console.log("Cleaning up socket connection");
    if (socket) socket.disconnect();
  });

  return { manufacture, manufactureFound, manufactureError };
}
