import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useSensorCount(id) {
  const count = ref(0);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });

  onMounted(() => {
    // Set project ID if provided
    if (id) {
      console.log("Setting project ID:", id);
      socket.emit("setProject", id);
    }

    // Connection status handlers
    socket.on("connect", () => {
      console.log("Socket.IO connected successfully");
      // Re-send project ID after reconnection
      if (id) {
        socket.emit("setProject", id);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
    });

    // Listen for count updates
    socket.on("updateCount", (data) => {
      console.log("Received count update:", data);
      count.value = data;
    });
  });

  onUnmounted(() => {
    if (socket) {
      console.log("Disconnecting socket...");
      socket.disconnect();
    }
  });

  return { count };
}
