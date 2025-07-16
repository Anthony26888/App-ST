// utils/getSocketUrl.js
export function getSocketUrl() {
  const isLAN =
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.");

  return isLAN
    ? import.meta.env.VITE_SOCKET_URL
    : import.meta.env.VITE_SOCKET_DOMAIN;
}
