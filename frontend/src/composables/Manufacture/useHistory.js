import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { io } from "socket.io-client";

export function useHistory(id, typeFilter = ref(null)) {
  const history = ref([]);
  const historyError = ref(null);

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
  const socket = io(SOCKET_URL, { autoConnect: false });

  const fetchData = () => {
    if (!id) return;
    socket.emit("getHistory", id);
  };

  // ✅ computed để filter
  const filteredHistory = computed(() => {
    if (!typeFilter.value) return history.value;
    return history.value.filter((i) => i.Type === typeFilter.value);
  });

  onMounted(() => {
    socket.connect();

    // ✅ Chỉ fetch khi socket connect OK
    socket.on("connect", () => fetchData());

    socket.on("HistoryData", (data) => {
      history.value = Array.isArray(data) ? data : [];
    });

    socket.on("HistoryError", (message) => {
      historyError.value = message;
    });

    // ✅ Refresh nếu có update đúng PlanID
    socket.on("UpdateHistoryFiltered", ({ PlanID }) => {
      if (Number(PlanID) === Number(id)) fetchData();
    });
  });

  // ✅ tự filter khi type thay đổi
  watch(typeFilter, () => {
    console.log("Filter changed → reapply filtered history");
  });

  onUnmounted(() => {
    socket.off("HistoryData");
    socket.off("HistoryError");
    socket.off("UpdateHistoryFiltered");
    socket.disconnect();
  });

  return {
    history: filteredHistory, // luôn trả ra filtered data
    historyError,
    refresh: fetchData,
  };
}
