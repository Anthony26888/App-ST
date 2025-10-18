import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useDetailProject(id) {
  const detailProject = ref([]);
  const detailProjectError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getDetailProject", id);
    socket.on("DetailProjectData", (data) => {
      detailProject.value = data;
    });
    socket.on("DetailProjectError", (message) => {
      detailProjectError.value = message;
    });
    socket.on("updateDetailProject", () => {
      socket.emit("getDetailProject", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { detailProject, detailProjectError };
}
