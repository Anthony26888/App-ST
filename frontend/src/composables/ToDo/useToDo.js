import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useToDo() {
  const todos = ref([]);
  const todosError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getToDo");
    socket.on("todoData", (data) => {
      todos.value = data;
    });
    socket.on("todoError", (message) => {
      todosError.value = message;
    });
    socket.on("updateToDo", () => {
      socket.emit("getToDo");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { todos, todosError };
}
