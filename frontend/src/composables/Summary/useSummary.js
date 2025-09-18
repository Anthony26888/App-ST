import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { io } from "socket.io-client";

export function useSummary(selectedDate) {
  const summary = ref([]);
  const summaryError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
  const socket = io(SOCKET_URL);

  // ✅ Tính startOfDay và endOfDay từ selectedDate
  const startOfDay = computed(() =>
    Math.floor(new Date(`${selectedDate.value}T00:00:00+07:00`).getTime() / 1000)
  );

  const endOfDay = computed(() =>
    Math.floor(new Date(`${selectedDate.value}T23:59:59+07:00`).getTime() / 1000)
  );

  const fetchData = () => {
    try {
      if (selectedDate.value) {
        console.log("Fetching summary for:", selectedDate.value);
        socket.emit("getSummary", {
          start: startOfDay.value,
          end: endOfDay.value,
        });
      } else {
        // Nếu không có ngày => query toàn bộ (bạn có thể sửa query bên server để bỏ điều kiện WHERE)
        socket.emit("getSummary", { start: 0, end: Math.floor(Date.now() / 1000) });
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      summaryError.value = error.message;
    }
  };

  watch(selectedDate, (newDate) => {
    console.log("Date changed -> refetching:", newDate);
    fetchData();
  });

  onMounted(() => {
    fetchData();

    socket.on("SummaryData", (data) => {
      console.log("Received summary data:", data);
      if (Array.isArray(data)) {
        summary.value = data;
      } else {
        summaryError.value = "Invalid data format received";
      }
    });

    socket.on("SummaryError", (message) => {
      console.error("Summary Error:", message);
      summaryError.value = message;
    });

    socket.on("UpdateSummary", fetchData);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      fetchData();
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  });

  onUnmounted(() => {
    socket.off("SummaryData");
    socket.off("SummaryError");
    socket.off("UpdateSummary");
    socket.disconnect();
  });

  return { summary, summaryError };
}
