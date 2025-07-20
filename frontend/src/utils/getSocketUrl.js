export function getSocketUrl() {
  const isLAN =
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("127.");

  const url = isLAN
    ? import.meta.env.VITE_SOCKET_URL
    : import.meta.env.VITE_SOCKET_DOMAIN;

  console.log("🔌 getSocketUrl:", url);
  return url;
}
