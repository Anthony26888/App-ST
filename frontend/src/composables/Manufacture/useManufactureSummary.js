import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { io } from "socket.io-client";

export function useManufactureSummary(id, typeFilter = ref(null)) {
  const manufactureSummary = ref([]);
  const manufactureSummaryError = ref(null);

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
  const socket = io(SOCKET_URL, { autoConnect: false });

  const fetchData = () => {
    if (!id) return;
    socket.emit("getManufactureSummary", id);
  };

  // ✅ Computed filtered data
  const filteredManufactureSummary = computed(() => {
    if (!typeFilter.value) return manufactureSummary.value;
    return manufactureSummary.value.filter(
      (item) => item.Type === typeFilter.value
    );
  });

  onMounted(() => {
    socket.connect();

    socket.on("connect", () => fetchData());

    socket.on("ManufactureSummaryData", (data) => {
      manufactureSummary.value = Array.isArray(data) ? data : [];
    });

    socket.on("ManufactureSummaryError", (message) => {
      manufactureSummaryError.value = message;
    });

    socket.on("UpdateManufactureSummary", () => fetchData());

    socket.on("disconnect", () => {
      console.warn("Socket disconnected");
    });
  });

  // ✅ Fetch lại khi Type thay đổi
  watch(typeFilter, () => {
    console.log("Filter Type changed → updating filtered summary");
  });

  onUnmounted(() => {
    socket.off("ManufactureSummaryData");
    socket.off("ManufactureSummaryError");
    socket.off("UpdateManufactureSummary");
    socket.disconnect();
  });

  return {
    manufactureSummary: filteredManufactureSummary,
    manufactureSummaryError,
    refresh: fetchData
  };
}
