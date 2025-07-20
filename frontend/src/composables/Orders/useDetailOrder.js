import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useDetailOrder(id) {
  const compare = ref([]);
  const compareError = ref([]);
  const headers = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });
  const generateHeaders = (Obj) => {
    if (Obj) {
      headers.value = Object.keys(Obj).map((key) => ({
        title: key.replace(/_/g, " "), // Format header text
        key: key,
        value: key,
      }));
    }
  };
  onMounted(() => {
    
    socket.emit("getCompare", id);
    socket.on("compareData", (data) => {
      console.log("Received compare:", data);
      compare.value = data;
      generateHeaders(data)
    });
    socket.on("compareError", (message) => {
      compareError.value = message;
    });
    socket.on("updateCompare", () =>{
        socket.emit('getCompare', id)
    })

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { compare, compareError };
}
