import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { io } from "socket.io-client";

export function useCompareSummary(selectedDate) {
  const compareSummary = ref([]);
  const compareSummaryError = ref(null);
  const socket = io(import.meta.env.VITE_SOCKET_URL);

  const endOfDay = computed(() =>
    Math.floor(
      new Date(`${selectedDate.value}T23:59:59+07:00`).getTime() / 1000
    )
  );

  const fetchData = () => {
    if (selectedDate.value) {
      socket.emit("getCompareSummary", endOfDay.value);
    }
  };

  watch(selectedDate, () => {
    fetchData();
  });

  onMounted(() => {
    fetchData();

    socket.on("CompareSummaryData", (data) => {
      compareSummary.value = data || [];
    });

    socket.on("CompareSummaryError", (err) => {
      compareSummaryError.value = err;
    });

    socket.on("UpdateCompareSummary", fetchData);

    socket.on("connect", () => fetchData());
  });

  onUnmounted(() => {
    socket.off("CompareSummaryData");
    socket.off("CompareSummaryError");
    socket.off("UpdateCompareSummary");
    socket.disconnect();
  });

  return { compareSummary, compareSummaryError };
}
