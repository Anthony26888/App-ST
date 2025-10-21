import { ref, onMounted, onUnmounted, watch } from "vue";
import { io } from "socket.io-client";
import axios from "axios";

export function useHistory(id) {
  const history = ref([]);
  const historyError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
  const API_URL = import.meta.env.VITE_API_URL;
  const socket = io(SOCKET_URL) // chỉnh lại nếu deploy

  // Function to fetch data via REST API as fallback
  const fetchDataViaAPI = async () => {
    try {
      const response = await axios.get(`${API_URL}/Summary/Get-history/${id}`);
      if (response.data) {
        history.value = Array.isArray(response.data) ? response.data : [response.data];
      }
    } catch (error) {
      historyError.value = error.message;
    }
  };

  const fetchData = () => {
    if (!id) {
      return;
    }
    socket.emit("getHistory", id);
  };

  // Watch for changes in the id
  watch(() => id, (newId) => {
    if (newId) {
      fetchData();
    }
  }, { immediate: true });

  onMounted(() => {
    
    socket.on("connect", () => {
      fetchData();
    });

    socket.on("HistoryData", (data) => {
      if (Array.isArray(data)) {
        history.value = data;
      } else {
        history.value = [];
      }
    });

    socket.on("HistoryError", (error) => {
      historyError.value = error.message || "Failed to fetch history data";
    });

    socket.on("UpdateHistory", () => {
      console.log("UpdateHistory from socket");
      fetchData();
    });

    socket.on("disconnect", () => {
    });

    socket.on("connect_error", (error) => {
      historyError.value = "Socket connection failed";
    });
  });

  onUnmounted(() => {
    if (socket) {
      socket.off("HistoryData");
      socket.off("HistoryError");
      socket.off("UpdateHistory");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.disconnect();
    }
  });

  return { 
    history, 
    historyError,
    refresh: fetchData
  };
}
