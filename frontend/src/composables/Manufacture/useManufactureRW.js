import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { io } from "socket.io-client";

export function useManufactureRW(id, typeFilter = ref(null)) {
  const manufactureRW = ref([]);
  const manufactureRWError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
  const socket = io(SOCKET_URL);

  const fetchData = () => {
    if (!id) return;
    
    socket.emit("getManufactureRW", id);
  };

  const filteredManufactureRW = computed(() => {
    if (!typeFilter.value) return manufactureRW.value;
    return manufactureRW.value.filter(item => item.Type === typeFilter.value);
  });

  onMounted(() => {
    fetchData();

    socket.on("ManufactureRWData", (data) => {
      manufactureRW.value = Array.isArray(data) ? data : [];
    });

    socket.on("ManufactureRWError", (message) => {
      manufactureRWError.value = message;
    });

    socket.on("UpdateManufactureRW", fetchData);

    socket.on("connect", fetchData);
  });

  // When filter Type changes → fetch again
  watch(typeFilter, fetchData);

  onUnmounted(() => {
    socket.off("ManufactureRWData");
    socket.off("ManufactureRWError");
    socket.off("UpdateManufactureRW");
    socket.disconnect();
  });

  return {
    manufactureRW: filteredManufactureRW,
    manufactureRWError,
    typeFilter
  };
}
