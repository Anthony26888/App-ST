import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufacture() {
  const manufacture = ref([]);
  const manufactureFound = ref(null); // Changed to null as initial value
  const manufactureError = ref(null); // Changed to null as initial value
  const isConnected = ref(false); // Add connection status
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

  // Validate SOCKET_URL
  if (!SOCKET_URL) {
    console.error("VITE_SOCKET_URL is not defined in environment variables");
    manufactureError.value = "Socket URL is not configured";
    return { manufacture, manufactureFound, manufactureError, isConnected };
  }

  const socket = io(SOCKET_URL, {
    reconnectionAttempts: 5,
    timeout: 10000,
  });
  
  onMounted(() => {
    console.log("Initializing socket connection to:", SOCKET_URL);
    
    socket.on("connect", () => {
      console.log("Socket connected successfully. ID:", socket.id);
      isConnected.value = true;
      manufactureError.value = null;
      // Request data immediately after connection
      socket.emit("getManufacture");
    });
    
    socket.on("ManufactureData", (data) => {
      console.log("Received ManufactureData:", data);
      if (!data) {
        console.warn("Received empty data from server");
        manufactureError.value = "Received empty data from server";
        return;
      }
      
      if (Array.isArray(data)) {
        manufacture.value = data;
        manufactureFound.value = data[0] || null;
        manufactureError.value = null;
        console.log("Manufacture data updated:", manufacture.value);
      } else {
        console.error("Received invalid data format:", data);
        manufactureError.value = "Invalid data format received";
      }
    });
    
    socket.on("ManufactureError", (message) => {
      console.error("Manufacture error received:", message);
      manufactureError.value = message || "Unknown error occurred";
    });
    
    socket.on("ManufactureUpdate", () => {
      console.log("Manufacture update received, requesting new data");
      if (isConnected.value) {
        socket.emit("getManufacture");
      } else {
        console.warn("Socket not connected, cannot request data");
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      isConnected.value = false;
      manufactureError.value = `Connection error: ${error.message}`;
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected. Reason:", reason);
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
