import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useUsers() {
  const users = ref([]);
  const usersError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],        // ✅ Rất quan trọng!
  //   withCredentials: true,            // ✅ Nếu backend yêu cầu
  //   path: "/socket.io",               // ✅ Nếu backend (hoặc nginx) cần path cụ thể
  // });
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
