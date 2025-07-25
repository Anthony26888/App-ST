import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useWareHouse2() {
  const warehouse2 = ref([]);
  const warehouse2Error = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });
  onMounted(() => {
    socket.emit("getWareHouse2");
    socket.on("WareHouse2Data", (data) => {
      console.log("Received warehouse2:", data);
      warehouse2.value = data;
    });
    socket.on("WareHouse2Error", (message) => {
      warehouse2Error.value = message;
    });
    socket.on("WareHouse2Update", () => {
      socket.emit("getWareHouse2");
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { warehouse2, warehouse2Error };
}
