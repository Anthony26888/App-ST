import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useDetailProjectPO(id) {
  const detailProjectPO = ref([]);
  const detailProjectPOError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });
  onMounted(() => {
    socket.emit("getDetailProjectPO", id);
    socket.on("DetailProjectPOData", (data) => {
      console.log("Received detail project PO:", data);
      detailProjectPO.value = data;
    });
    socket.on("DetailProjectPOError", (message) => {
      detailProjectPOError.value = message;
    });
    socket.on("updateDetailProjectPO", () => {
      socket.emit("getDetailProjectPO", id);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { detailProjectPO, detailProjectPOError };
}
