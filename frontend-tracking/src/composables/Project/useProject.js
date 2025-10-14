import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useProject(id) {
  const project = ref([]);
  const projectError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy

  onMounted(() => {
    socket.emit("getOrderTracking", id);
    socket.on("OrderTrackingData", (data) => {
      project.value = data;
    });
    socket.on("OrderTrackingError", (message) => {
      projectError.value = message;
    });
    socket.on("OrderTrackingUpdate", () => {
      socket.emit("getOrderTracking", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { project, projectError };
}
