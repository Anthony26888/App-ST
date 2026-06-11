import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { io } from "socket.io-client";

export function useSummaryYesterday(selectedDate) {
  const summaryYesterday = ref([]);
  const summaryYesterdayError = ref(null);
  const socket = io(import.meta.env.VITE_SOCKET_URL);

  const fetchData = () => {
    if (selectedDate.value) {
      socket.emit("getSummary", selectedDate.value);
    }
  };

  watch(selectedDate, () => {
    fetchData();
  });

  onMounted(() => {
    fetchData();

    socket.on("SummaryData", (data) => {
      summaryYesterday.value = data || [];
    });

    socket.on("SummaryError", (err) => {
      summaryYesterdayError.value = err;
    });

    socket.on("UpdateSummary", fetchData);

    socket.on("connect", () => fetchData());
  });

  onUnmounted(() => {
    socket.off("SummaryData");
    socket.off("SummaryError");
    socket.off("UpdateSummary");
    socket.disconnect();
  });

  return { summaryYesterday, summaryYesterdayError };
}
