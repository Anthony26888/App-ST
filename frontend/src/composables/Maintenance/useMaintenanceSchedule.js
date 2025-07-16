import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useMaintenanceSchedule(id) {
  const maintenanceSchedule = ref([]);
  const maintenanceScheduleError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });
  onMounted(() => {
    socket.emit("getMaintenanceSchedule", id);
    socket.on("MaintenanceScheduleData", (data) => {
      console.log("Received maintenance:", data);
      maintenanceSchedule.value = data;
    });
    socket.on("MaintenanceScheduleError", (message) => {
      maintenanceScheduleError.value = message;
    });
    socket.on("MaintenanceScheduleUpdate", () => {
      socket.emit("getMaintenanceSchedule", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { maintenanceSchedule, maintenanceScheduleError };
}
