import { ref, onMounted, onUnmounted, watch } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useWareHouseFind(id) {
  const WareHouseFind = ref([]);
  const WareHouseFindError = ref([]);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });

  const fetchData = (partNumber) => {
    if (partNumber) {
      socket.emit("getWareHouseFind", partNumber);
    }
  };

  onMounted(() => {
    socket.on("WareHouseFindData", (data) => {
      console.log("Received WareHouseFind:", data);
      WareHouseFind.value = data;
    });
    socket.on("WareHouseFindError", (message) => {
      WareHouseFindError.value = message;
    });
    socket.on("updateWareHouseFind", () => {
      fetchData(id.value);
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));

    // Initial fetch if id exists
    if (id.value) {
      fetchData(id.value);
    }
  });

  // Watch for changes in id
  watch(id, (newId) => {
    if (newId) {
      fetchData(newId);
    }
  });

  onUnmounted(() => {
    if (socket) socket.disconnect();
  });

  return { WareHouseFind, WareHouseFindError };
}
