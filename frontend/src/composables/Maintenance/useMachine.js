import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useMachine() {
  const machine = ref([]);
  const machineError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(getSocketUrl(), {
    withCredentials: true
  });
  onMounted(() => {
    socket.emit("getMachine");
    socket.on("MachineData", (data) => {
      console.log("Received machine:", data);
      machine.value = data;
    });
    socket.on("MachineError", (message) => {
      machineError.value = message;
    });
    socket.on("MachineUpdate", () => {
      socket.emit("getMachine");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { machine, machineError };
}
