import { ref, computed, onMounted, onUnmounted } from "vue";
import io from "socket.io-client";

export function useNotification() {
  // ============ STATE ============
  const notifications = ref([]);
  const statistics = ref({
    Total: 0,
    Today: 0,
    Tomorrow: 0,
    SoonAfter: 0,
  });
  const loading = ref(false);
  const socket = ref(null);
  const connected = ref(false);
  const error = ref(null);
  const retryCount = ref(0);
  const maxRetries = 10;

  // ============ COMPUTED ============
  const unreadCount = computed(() => {
    return notifications.value.filter((n) => n.IsRead === 0).length;
  });

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => {
      const priorityOrder = {
        error: 0,
        warning: 1,
        orange: 2,
      };
      const priorityA = priorityOrder[a.Color] || 99;
      const priorityB = priorityOrder[b.Color] || 99;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Secondary sort: DaysRemaining ASC (most urgent first)
      return (a.DaysRemaining || 99) - (b.DaysRemaining || 99);
    });
  });

  // ============ SOCKET INITIALIZATION ============
  const initSocket = () => {
    try {
      // Detect environment
      const isDev = import.meta.env.DEV;
      const SERVER_URL = isDev 
        ? "http://localhost:3000" 
        : window.location.origin;

      socket.value = io(SERVER_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxRetries,
        transports: ["websocket", "polling"], // ✅ Fallback support
        withCredentials: true,
        secure: !isDev,
      });

      // ===== CONNECTION EVENT =====
      socket.value.on("connect", () => {
        connected.value = true;
        error.value = null;
        retryCount.value = 0;
        
        // Fetch data on connect
        fetchNotifications();
        fetchStatistics();
      });

      // ===== DISCONNECT EVENT =====
      socket.value.on("disconnect", (reason) => {
        connected.value = false;
        
        if (reason === "io server disconnect") {
          error.value = "Server disconnected. Reconnecting...";
        }
      });

      // ===== CONNECTION ERROR =====
      socket.value.on("connect_error", (err) => {
        error.value = `Connection failed: ${err.message}`;
        retryCount.value++;
      });

      // ===== NOTIFICATIONS EVENTS =====
      socket.value.on("notifications-update", (data) => {
        notifications.value = Array.isArray(data) ? data : [];
      });

      socket.value.on("notifications-error", (data) => {
        error.value = `Notifications error: ${data.error}`;
      });

      // ===== STATISTICS EVENTS =====
      socket.value.on("statistics-update", (data) => {
        statistics.value = data || {
          Total: 0,
          Today: 0,
          Tomorrow: 0,
          SoonAfter: 0,
        };
      });

      socket.value.on("statistics-error", (data) => {
      });

      // ===== ACTION CONFIRMATION EVENTS =====
      socket.value.on("delivery-completed", (data) => {
        fetchNotifications();
        fetchStatistics();
      });

      socket.value.on("notification-marked-read", (data) => {
        fetchNotifications();
      });

      socket.value.on("all-notifications-marked-read", (data) => {
        fetchNotifications();
      });

      // ===== ERROR HANDLING =====
      socket.value.on("error", (error) => {
        error.value = `Socket error: ${error}`;
      });

    } catch (err) {
      error.value = err.message;
    }
  };

  // ============ METHODS ============
  const fetchNotifications = () => {
    if (!socket.value?.connected) {
      return;
    }
    
    loading.value = true;
    socket.value.emit("get-notifications");
    
    // Timeout để đảm bảo loading được tắt
    setTimeout(() => {
      loading.value = false;
    }, 500);
  };

  const fetchStatistics = () => {
    if (!socket.value?.connected) {
      return;
    }
    socket.value.emit("get-statistics");
  };

  const markDelivery = (id) => {
    if (!socket.value?.connected) {
      error.value = "Not connected to server";
      return;
    }
    
    try {
      socket.value.emit("mark-delivery", id);
    } catch (err) {
      error.value = err.message;
    }
  };

  const markAsRead = (id) => {
    if (!socket.value?.connected) {
      error.value = "Not connected to server";
      return;
    }

    try {
      // Update UI immediately for better UX
      const notification = notifications.value.find((n) => n.id === id);
      if (notification) {
        notification.IsRead = 1;
      }

      socket.value.emit("mark-notification-read", id);
    } catch (err) {
      error.value = err.message;
    }
  };

  const markAllAsRead = () => {
    if (!socket.value?.connected) {
      error.value = "Not connected to server";
      return;
    }

    try {
      // Update UI immediately
      notifications.value.forEach((notification) => {
        notification.IsRead = 1;
      });

      socket.value.emit("mark-all-notifications-read");
    } catch (err) {
      error.value = err.message;
    }
  };

  const refresh = () => {
    if (!socket.value?.connected) {
      return;
    }
    
    fetchNotifications();
    fetchStatistics();
  };

  const clearError = () => {
    error.value = null;
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      connected.value = false;
    }
  };

  // ============ LIFECYCLE HOOKS ============
  let refreshInterval = null;

  onMounted(() => {
    initSocket();

    // Auto refresh mỗi 1 phút
    refreshInterval = setInterval(() => {
      if (connected.value) {
        refresh();
      }
    }, 60 * 1000); // 60 seconds
  });

  onUnmounted(() => {
    
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    if (socket.value) {
      socket.value.off("connect");
      socket.value.off("disconnect");
      socket.value.off("connect_error");
      socket.value.off("notifications-update");
      socket.value.off("notifications-error");
      socket.value.off("statistics-update");
      socket.value.off("statistics-error");
      socket.value.off("delivery-completed");
      socket.value.off("notification-marked-read");
      socket.value.off("all-notifications-marked-read");
      socket.value.disconnect();
    }
  });

  // ============ RETURN ============
  return {
    // State
    notifications,
    statistics,
    loading,
    connected,
    error,
    retryCount,
    
    // Computed
    unreadCount,
    sortedNotifications,
    
    // Methods
    fetchNotifications,
    fetchStatistics,
    markDelivery,
    markAsRead,
    markAllAsRead,
    refresh,
    clearError,
    disconnect,
  };
}