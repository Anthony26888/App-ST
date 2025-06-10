import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useUsers() {
  const users = ref([]);
  const usersError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);
  onMounted(() => {
    socket.emit("getUsers");
    socket.on("usersData", (data) => {
      console.log("Received users:", data);
      users.value = data;
    });
    socket.on("usersError", (message) => {
      usersError.value = message;
    });
    socket.on("updateUsers", () => {
      socket.emit("getUsers");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { users, usersError };
}
