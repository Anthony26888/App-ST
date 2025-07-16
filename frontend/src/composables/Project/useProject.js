import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useProject() {
  const project = ref([]);
  const projectError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });
  onMounted(() => {
    socket.emit("getProject");
    socket.on("ProjectData", (data) => {
      console.log("Received project:", data);
      project.value = data;
    });
    socket.on("ProjectError", (message) => {
      projectError.value = message;
    });
    socket.on("ProjectUpdate", () => {
      socket.emit("getProject");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { project, projectError };
}
