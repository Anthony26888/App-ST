import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useMaintenance(id) {
  const maintenance = ref([]);
  const maintenanceError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);
  onMounted(() => {
    socket.emit("getMaintenance", id);
    socket.on("MaintenanceData", (data) => {
      console.log("Received maintenance:", data);
      maintenance.value = data;
    });
    socket.on("MaintenanceError", (message) => {
      maintenanceError.value = message;
    });
    socket.on("MaintenanceUpdate", () => {
      socket.emit("getMaintenance", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { maintenance, maintenanceError };
}
