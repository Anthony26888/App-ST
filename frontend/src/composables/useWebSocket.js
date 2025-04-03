import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useSocket() {
  const users = ref([]);
  const warehouse = ref([]);
  const orders = ref([]);

  let socket;

  onMounted(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
    socket = io(SOCKET_URL);

    socket.on("updateData", (data) => {
      console.log("Received updateData:", data);
      users.value = data.users;
      warehouse.value = data.warehouse;
      orders.value = data.orders;
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { users, warehouse, orders };
}
