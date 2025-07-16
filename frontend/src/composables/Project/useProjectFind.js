import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useProjectFind() {
  const projectFind = ref([]);
  const projecFindError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });
  onMounted(() => {
    socket.emit("getProjectFind");
    socket.on("ProjectFindData", (data) => {
      console.log("Received projectFind:", data);
      projectFind.value = data;
    });
    socket.on("ProjectFindError", (message) => {
      projectError.value = message;
    });
    socket.on("ProjecFindUpdate", () => {
      socket.emit("getProjectFind");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { projectFind, projecFindError };
}