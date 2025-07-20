import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useDetailBom() {
  const detailBom = ref([]);
  const detailBomError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   withCredentials: true
  // });
  onMounted(() => {
    socket.emit("getDetailBom");
    socket.on("detailBomData", (data) => {
      console.log("Received Bom:", data);
      detailBom.value = data;
    });
    socket.on("detailBomError", (message) => {
      detailBomError.value = message;
    });
    socket.on("updateDetailBom", () => {
      socket.emit("getDetailBom");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { detailBom, detailBomError };
}
