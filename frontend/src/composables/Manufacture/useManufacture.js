import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufacture() {
  const manufacture = ref([]);
  const manufactureFound = ref(null); // Changed to null as initial value
  const manufactureError = ref(null); // Changed to null as initial value
  const isConnected = ref(false); // Add connection status
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  
  onMounted(() => {
    socket.on("connect", () => {
      isConnected.value = true;
      manufactureError.value = null;
      // Request data immediately after connection
      socket.emit("getManufacture");
    });
    
    socket.on("ManufactureData", (data) => {
      if (!data) {
        manufactureError.value = "Received empty data from server";
        return;
      }
      
      if (Array.isArray(data)) {
        manufacture.value = data;
        manufactureFound.value = data[0] || null;
        manufactureError.value = null;
      } else {
        manufactureError.value = "Invalid data format received";
      }
    });
    
    socket.on("ManufactureError", (message) => {
      manufactureError.value = message || "Unknown error occurred";
    });
    
    socket.on("ManufactureUpdate", () => {
      if (isConnected.value) {
        socket.emit("getManufacture");
      } else {
        console.warn("Socket not connected, cannot request data");
      }
    });

    socket.on("connect_error", (error) => {
      isConnected.value = false;
      manufactureError.value = `Connection error: ${error.message}`;
    });
    
    socket.on("disconnect", (reason) => {
      isConnected.value = false;
      manufactureError.value = `Disconnected: ${reason}`;
    });

    // Initial data request
    if (socket.connected) {
      socket.emit("getManufacture");
    }
  });

  onUnmounted(() => {
    console.log("Cleaning up socket connection");
    if (socket) {
      socket.disconnect();
      isConnected.value = false;
    }
  });

  return { manufacture, manufactureFound, manufactureError, isConnected };
}
