import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { io } from "socket.io-client";

export function useSummary(selectedDate) {
  const summary = ref([]);
  const summaryError = ref(null);
  const socket = io(import.meta.env.VITE_SOCKET_URL);

  const endOfDay = computed(() =>
    Math.floor(
      new Date(`${selectedDate.value}T23:59:59+07:00`).getTime() / 1000
    )
  );

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
      summary.value = data || [];
    });

    socket.on("SummaryError", (err) => {
      summaryError.value = err;
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

  return { summary, summaryError };
}
