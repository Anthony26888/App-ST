import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useActived() {
  const status = ref([]);
  const statusFound = ref(null); // Changed to null as initial value
  const statusError = ref(null); // Changed to null as initial value
  const isConnected = ref(false); // Add connection status
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy

  // const socket = io(SOCKET_URL, {
  //   reconnectionAttempts: 5,
  //   timeout: 10000,
  // });
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });
  
  onMounted(() => {
    console.log("Initializing socket connection to:", SOCKET_URL);
    
    socket.on("connect", () => {
      console.log("Socket connected successfully. ID:", socket.id);
      isConnected.value = true;
      statusError.value = null;
      // Request data immediately after connection
      socket.emit("getActived");
    });
    
    socket.on("ActivedData", (data) => {
      console.log("Received ManufactureData:", data);
      if (!data) {
        console.warn("Received empty data from server");
        statusError.value = "Received empty data from server";
        return;
      }
      
      if (Array.isArray(data)) {
        status.value = data;
        statusFound.value = data[0] || null;
        statusError.value = null;
        console.log("Actived data updated:", status.value);
      } else {
        console.error("Received invalid data format:", data);
        statusError.value = "Invalid data format received";
      }
    });
    
    socket.on("ActivedError", (message) => {
      console.error("Actived error received:", message);
      statusError.value = message || "Unknown error occurred";
    });
    
    socket.on("ActivedUpdate", () => {
      console.log("Actived update received, requesting new data");
      if (isConnected.value) {
        socket.emit("getActived");
      } else {
        console.warn("Socket not connected, cannot request data");
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      isConnected.value = false;
      statusError.value = `Connection error: ${error.message}`;
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected. Reason:", reason);
      isConnected.value = false;
      statusError.value = `Disconnected: ${reason}`;
    });

    // Initial data request
    if (socket.connected) {
      socket.emit("getActived");
    }
  });

  onUnmounted(() => {
    console.log("Cleaning up socket connection");
    if (socket) {
      socket.disconnect();
      isConnected.value = false;
    }
  });

  return { status, statusFound, statusError, isConnected };
}
