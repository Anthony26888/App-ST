import { ref, onMounted, onUnmounted, watch, isRef } from "vue";
import { io } from "socket.io-client";

export function useHistoryPart(id) {
  const historyPart = ref([]);
  const historyPartError = ref([]);
  const connectionStatus = ref("Đang kết nối...");

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
  const socket = io(SOCKET_URL);

  const getCurrentId = () => {
    return isRef(id) ? id.value : id;
  };

  const loadData = (planID) => {
    if (!planID) return;
    socket.emit("getHistoryPart", planID);
  };

  onMounted(() => {
    socket.on("connect", () => {
      connectionStatus.value = "Đã kết nối thành công";
      loadData(getCurrentId());
    });

    socket.on("disconnect", () => {
      connectionStatus.value = "Mất kết nối";
    });

    socket.on("HistoryPartData", (data) => {
      historyPart.value = Array.isArray(data) ? data : [];
    });

    socket.on("HistoryPartError", (message) => {
      historyPartError.value = message;
      connectionStatus.value = "Lỗi kết nối: " + message;
    });

    socket.on("updateHistoryPart", () => {
      loadData(getCurrentId());
    });

    // Trường hợp connect xong mới load
    loadData(getCurrentId());
  });

  // Chỉ watch nếu id là ref
  if (isRef(id)) {
    watch(
      id,
      (newId) => {
        loadData(newId);
      },
      { immediate: true },
    );
  }

  onUnmounted(() => {
    socket.disconnect();
  });

  return {
    historyPart,
    historyPartError,
    connectionStatus,
  };
}