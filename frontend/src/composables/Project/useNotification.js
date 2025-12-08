import { ref, computed, onMounted, onUnmounted } from "vue";
import io from "socket.io-client";

export function useNotification() {
  // State
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

  // Computed
  const unreadCount = computed(() => {
    return notifications.value.filter((n) => n.IsRead === 0).length;
  });

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => {
      // Sắp xếp theo ưu tiên (error > warning > orange)
      const priorityOrder = {
        error: 0,
        warning: 1,
        orange: 2,
      };
      return (priorityOrder[a.Color] || 99) - (priorityOrder[b.Color] || 99);
    });
  });

  // Methods
  const initSocket = () => {
    socket.value = io("http://localhost:3000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.value.on("connect", () => {
      connected.value = true;
      fetchNotifications();
      fetchStatistics();
    });

    socket.value.on("disconnect", () => {
      connected.value = false;
    });

    socket.value.on("notifications-update", (data) => {
      notifications.value = data;
    });

    socket.value.on("statistics-update", (data) => {
      statistics.value = data;
    });

    socket.value.on("notifications-error", (data) => {
    });

    socket.value.on("statistics-error", (data) => {
    });

    socket.value.on("delivery-completed", (data) => {
      fetchNotifications();
      fetchStatistics();
    });

    socket.value.on("notification-marked-read", (data) => {
      fetchNotifications();
    });

    socket.value.on("all-notifications-marked-read", () => {
      fetchNotifications();
    });
  };

  const fetchNotifications = () => {
    if (!socket.value || !socket.value.connected) {
      console.warn("⚠️ Socket not connected");
      return;
    }
    loading.value = true;
    socket.value.emit("get-notifications");
    setTimeout(() => {
      loading.value = false;
    }, 300);
  };

  const fetchStatistics = () => {
    if (!socket.value || !socket.value.connected) {
      return;
    }
    socket.value.emit("get-statistics");
  };

  const markDelivery = (id) => {
    if (!socket.value || !socket.value.connected) {
      return;
    }
    socket.value.emit("mark-delivery", id);
  };

  const refresh = () => {
    if (!socket.value || !socket.value.connected) {
      return;
    }
    socket.value.emit("refresh-data");
  };

  const markAsRead = (id) => {
    if (!socket.value || !socket.value.connected) {
      return;
    }
    
    // Update local state immediately for better UX
    const notification = notifications.value.find((n) => n.id === id);
    if (notification) {
      notification.IsRead = 1;
    }
    
    socket.value.emit("mark-notification-read", id);
  };

  const markAllAsRead = () => {
    if (!socket.value || !socket.value.connected) {
      return;
    }
    
    // Update local state immediately for better UX
    notifications.value.forEach((notification) => {
      notification.IsRead = 1;
    });
    
    socket.value.emit("mark-all-notifications-read");
  };

  // Lifecycle
  onMounted(() => {
    initSocket();

    // Auto refresh mỗi 1 phút
    const interval = setInterval(() => {
      if (connected.value) {
        refresh();
      }
    }, 60 * 1000);

    onUnmounted(() => {
      clearInterval(interval);
      if (socket.value) {
        socket.value.disconnect();
      }
    });
  });

  return {
    notifications,
    statistics,
    loading,
    connected,
    unreadCount,
    sortedNotifications,
    fetchNotifications,
    fetchStatistics,
    markDelivery,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
