import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useInforUser(id) {
  const InforUser = ref([]);
  const InforUserError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getInforUser", id);
    socket.on("InforUserData", (data) => {
      InforUser.value = data;
    });
    socket.on("InforUserError", (message) => {
      InforUserError.value = message;
    });
    socket.on("updateInforUser", () => {
      socket.emit("getInforUser", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { InforUser, InforUserError };
}
