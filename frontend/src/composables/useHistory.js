import { ref, onMounted, onUnmounted, watch } from "vue";
import { io } from "socket.io-client";
import axios from "axios";

export function useHistory(id) {
  const history = ref([]);
  const historyError = ref(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
  const API_URL = import.meta.env.VITE_API_URL;
  const socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  // Function to fetch data via REST API as fallback
  const fetchDataViaAPI = async () => {
    try {
      const response = await axios.get(`${API_URL}/Summary/Get-history/${id}`);
      if (response.data) {
        history.value = Array.isArray(response.data) ? response.data : [response.data];
      }
    } catch (error) {
      console.error("Error fetching history via API:", error);
      historyError.value = error.message;
    }
  };

  const fetchData = () => {
    if (!id) {
      console.warn("No id provided for history fetch");
      return;
    }
    
    console.log("Fetching history for id:", id);
    socket.emit("getHistory", id);
  };

  // Watch for changes in the id
  watch(() => id, (newId) => {
    if (newId) {
      console.log("Id changed to:", newId);
      fetchData();
    }
  }, { immediate: true });

  onMounted(() => {
    console.log("useHistory mounted, connecting to socket...");
    
    socket.on("connect", () => {
      console.log("Socket connected successfully:", socket.id);
      fetchData();
    });

    socket.on("HistoryData", (data) => {
      console.log("Received history data:", data);
      if (Array.isArray(data)) {
        history.value = data.map(item => ({
          ...item,
          Created_At: new Date(item.Created_At).toLocaleDateString('vi-VN'),
          Percent: parseFloat(item.Percent).toFixed(2)
        }));
      } else {
        console.warn("Received non-array history data:", data);
        history.value = [];
      }
    });

    socket.on("HistoryError", (error) => {
      console.error("History Error from socket:", error);
      historyError.value = error.message || "Failed to fetch history data";
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      historyError.value = "Socket connection failed";
    });
  });

  onUnmounted(() => {
    console.log("useHistory unmounting, cleaning up socket...");
    if (socket) {
      socket.off("HistoryData");
      socket.off("HistoryError");
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
