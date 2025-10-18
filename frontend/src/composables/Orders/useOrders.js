import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useOrders() {
  const orders = ref([]);
  const ordersError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  onMounted(() => {
    socket.emit("getOrders");
    socket.on("ordersData", (data) => {
      orders.value = data;
    });
    socket.on("ordersError", (message) => {
      ordersError.value = message;
    });
    socket.on("updateOrders", () => {
      socket.emit("getOrders");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { orders, ordersError };
}
