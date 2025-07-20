import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useCheckBOM() {
  const checkBOM = ref([]);
  const checkBOMError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // 👇 Linh hoạt theo IP hoặc domain
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],        // ✅ Rất quan trọng!
  //   withCredentials: true,            // ✅ Nếu backend yêu cầu
  //   path: "/socket.io",               // ✅ Nếu backend (hoặc nginx) cần path cụ thể
  // });
  const fetchData = (id) => {
    socket.emit("getCheckBOM", id);
  }
    
  onMounted(() => {
    socket.on("checkBOMData", (data) => {
      checkBOM.value = data;
    });
    socket.on("checkBOMError", (message) => {
      checkBOMError.value = message;
    });
    socket.on("updateCheckBOM", (id) => {
      socket.emit("getCheckBOM", id);

    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { checkBOM, checkBOMError, fetchData };
}
