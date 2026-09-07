import { ref, onMounted, onUnmounted, watch, isRef } from "vue";
import { io } from "socket.io-client";

export function useHistoryPlan(id) {
  const historyPlan = ref([]);
  const socket = io(import.meta.env.VITE_SOCKET_URL);

  const getCurrentId = () => (isRef(id) ? id.value : id);

  const loadData = (planID) => {
    if (!planID) return;
    socket.emit("getHistory", planID);
  };

  onMounted(() => {
    socket.on("connect", () => loadData(getCurrentId()));

    socket.on("HistoryData", (data) => {
      historyPlan.value = Array.isArray(data) ? data : [];
    });

    socket.on("UpdateHistoryFiltered", ({ PlanID }) => {
      if (Number(PlanID) === Number(getCurrentId())) loadData(getCurrentId());
    });

    loadData(getCurrentId());
  });

  if (isRef(id)) {
    watch(id, (newId) => loadData(newId), { immediate: true });
  }

  onUnmounted(() => socket.disconnect());

  return { historyPlan };
}
