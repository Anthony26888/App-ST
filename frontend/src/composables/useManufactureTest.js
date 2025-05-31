import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufactureTest(id) {
  const manufactureTest = ref([]);  // Initialize as empty array
  const manufactureTestError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureTest", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureTestData", (data) => {
      // Ensure data is an array before assigning

      manufactureTest.value = data;
    });

    socket.on("ManufactureTestError", (message) => {
      console.error("ManufactureTest Error:", message);
      manufactureTestError.value = message;
    });

    socket.on("UpdateManufactureTest", () => {
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
      socket.off("ManufactureTestData");
      socket.off("ManufactureTestError");
      socket.off("UpdateManufactureTest");
      socket.disconnect();
    }
  });

  return { manufactureTest, manufactureTestError };
}
