import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
const socket = io(`${import.meta.env.VITE_SOCKET_URL}`);
export function useDeviceStatusSocket(deviceId = 'esp32-001') {
  const status = ref('Offline');

  const handleStatus = (payload) => {
    if (payload.device_id === deviceId) {
      status.value = 'Online';
    }
  };

  // Nếu sau 60s không có heartbeat, đặt lại là offline
  let timeoutId;

  const resetOfflineTimer = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      status.value = 'Offline';
    }, 60000);
  };

  onMounted(() => {
    socket.on('device-status', (payload) => {
      handleStatus(payload);
      resetOfflineTimer();
    });
  });

  onUnmounted(() => {
    socket.off('device-status', handleStatus);
    clearTimeout(timeoutId);
  });

  return { status };
}
