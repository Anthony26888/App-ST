import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export function useManufactureBoxBuild(id) {
  const manufactureBoxBuild = ref([]);  // Initialize as empty array
  const manufactureBoxBuildError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL);

  const fetchData = () => {
    if (id) {
      socket.emit("getManufactureBoxBuild", id);
    }
  };

  onMounted(() => {
    fetchData();

    socket.on("ManufactureBoxBuildData", (data) => {
      // Ensure data is an array before assigning
      manufactureBoxBuild.value = data;
    });

    socket.on("ManufactureBoxBuildError", (message) => {
      manufactureBoxBuildError.value = message;
    });

    socket.on("UpdateManufactureBoxBuild", () => {
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
      socket.off("ManufactureBoxBuildData");
      socket.off("ManufactureBoxBuildError");
      socket.off("UpdateManufactureBoxBuild");
      socket.disconnect();
    }
  });

  return { manufactureBoxBuild, manufactureBoxBuildError };
}
