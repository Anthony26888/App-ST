import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useManufactureTest1(id) {
  const manufactureTest1 = ref([]);  // Initialize as empty array
  const manufactureTest1Error = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureTest1", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureTest1Data", (data) => {
      // Ensure data is an array before assigning
      manufactureTest1.value = data;
    });

    socket.on("ManufactureTest1Error", (message) => {
      manufactureTest1Error.value = message;
    });

    socket.on("UpdateManufactureTest1", () => {
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
      socket.off("ManufactureTest1Data");
      socket.off("ManufactureTest1Error");
      socket.off("UpdateManufactureTest1");
      socket.disconnect();
    }
  });

  return { manufactureTest1, manufactureTest1Error };
}
