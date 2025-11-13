import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { io } from "socket.io-client";

export function useSummaryFail(selectedDate) {
  const summaryFail = ref([]);
  const summaryFailError = ref(null);
  const socket = io(import.meta.env.VITE_SOCKET_URL);

  const endOfDay = computed(() =>
    Math.floor(
      new Date(`${selectedDate.value}T23:59:59+07:00`).getTime() / 1000
    )
  );

  const fetchData = () => {
    if (selectedDate.value) {
      socket.emit("getSummaryFail", selectedDate.value);
    }
  };

  watch(selectedDate, () => {
    fetchData();
  });

  onMounted(() => {
    fetchData();

    socket.on("SummaryFailData", (data) => {
      summaryFail.value = data || [];
    });

    socket.on("SummaryFailError", (err) => {
      summaryFailError.value = err;
    });

    socket.on("UpdateSummaryFail", fetchData);

    socket.on("connect", () => fetchData());
  });

  onUnmounted(() => {
    socket.off("SummaryFailData");
    socket.off("SummaryFailError");
    socket.off("UpdateSummaryFail");
    socket.disconnect();
  });

  return { summaryFail, summaryFailError };
}
