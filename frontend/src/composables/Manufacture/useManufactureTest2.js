import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useManufactureTest2(id) {
  const manufactureTest2 = ref([]);  // Initialize as empty array
  const manufactureTest2Error = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureTest2", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureTest2Data", (data) => {
      // Ensure data is an array before assigning
      manufactureTest2.value = data;
    });

    socket.on("ManufactureTest2Error", (message) => {
      manufactureTest2Error.value = message;
    });

    socket.on("UpdateManufactureTest2", () => {
      fetchData();
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      fetchData(); // Fetch data on reconnect
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  });

  onUnmounted(() => {
    if (socket) {
      socket.off("ManufactureTest2Data");
      socket.off("ManufactureTest2Error");
      socket.off("UpdateManufactureTest2");
      socket.disconnect();
    }
  });

  return { manufactureTest2, manufactureTest2Error };
}
