import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

// Nhập liệu SX 2 ngày gần nhất cho card "SX 24h qua" ở Overview.
// Server đã lọc + join sẵn (tên đơn, công đoạn, SL, ngày).
export function useRecentProduction() {
  const recentProduction = ref([]);
  const recentProductionError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
  const socket = io(SOCKET_URL);

  const fetchData = () => {
    socket.emit("getRecentProduction");
  };

  onMounted(() => {
    fetchData();
    socket.on("RecentProductionData", (data) => {
      recentProduction.value = Array.isArray(data) ? data : [];
    });
    socket.on("RecentProductionError", (err) => {
      recentProductionError.value = err?.error || err;
    });
    // Chấm công mới / summary đổi -> tải lại
    socket.on("UpdateManufactureCounting", fetchData);
    socket.on("UpdateSummary", fetchData);
    socket.on("connect", fetchData);
  });

  onUnmounted(() => {
    socket.disconnect();
  });

  return { recentProduction, recentProductionError };
}
