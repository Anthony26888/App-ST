import { ref, onMounted, onUnmounted, watch } from "vue";
import { io } from "socket.io-client";
import { getSocketUrl } from "@/utils/getSocketUrl";

export function useSummary(date) {
  const summary = ref([]);  // Initialize as empty array
  const summaryError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Lấy URL từ .env
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy
  // const socket = io(getSocketUrl(), {
  //   transports: ["websocket"],      // ✅ ưu tiên websocket
  //   withCredentials: true,          // ✅ gửi cookie nếu có auth
  //   path: "/socket.io",             // ✅ khớp với backend nếu thay đổi path
  // });

  const fetchData = () => {
    try {
      if (date.value) {
        console.log("Fetching summary for date:", date.value);
        socket.emit("getSummary", date.value);
      } else {
        socket.emit("getSummary"); // Fetch all summary data if no date provided
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      summaryError.value = error.message;
    }
  };

  // Watch for changes in the date value
  watch(date, (newDate) => {
    console.log("Date changed, fetching new data for:", newDate);
    fetchData();
  });

  onMounted(() => {
    fetchData();

    socket.on("SummaryData", (data) => {
      console.log("Received summary data:", data); // Add logging
      if (Array.isArray(data)) {
        summary.value = data;
      } else {
        console.error("Received non-array data:", data);
        summaryError.value = "Invalid data format received";
      }
    });

    socket.on("SummaryError", (message) => {
      console.error("Summary Error:", message);
      summaryError.value = message;
    });

    socket.on("UpdateSummary", () => {
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
      socket.off("SummaryData");
      socket.off("SummaryError");
      socket.off("UpdateSummary");
      socket.disconnect();
    }
  });

  return { summary, summaryError };
}
