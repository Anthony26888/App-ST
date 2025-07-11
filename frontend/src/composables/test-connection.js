import { ref, onMounted } from "vue";
import { io } from "socket.io-client";

export function useTestConnection() {
  const apiStatus = ref("Testing...");
  const socketStatus = ref("Testing...");
  const envVars = ref({});

  onMounted(async () => {
    // Log environment variables
    envVars.value = {
      VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD
    };
    
    console.log("Environment variables:", envVars.value);

    // Test API connection
    try {
      const response = await fetch('http://localhost:3000/test');
      const data = await response.json();
      apiStatus.value = `✅ API Connected: ${data.message}`;
    } catch (error) {
      apiStatus.value = `❌ API Error: ${error.message}`;
    }

    // Test Socket connection
    try {
      const socket = io('http://localhost:3000');
      
      socket.on('connect', () => {
        socketStatus.value = `✅ Socket Connected: ${socket.id}`;
      });
      
      socket.on('connect_error', (error) => {
        socketStatus.value = `❌ Socket Error: ${error.message}`;
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (socketStatus.value === "Testing...") {
          socketStatus.value = "❌ Socket Timeout";
        }
      }, 5000);
      
    } catch (error) {
      socketStatus.value = `❌ Socket Error: ${error.message}`;
    }
  });

  return { apiStatus, socketStatus, envVars };
} 