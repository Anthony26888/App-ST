function formatDateLocal(dateInput) {
  const date = new Date(dateInput);

  const vnDate = new Date(
    date.toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
  );

  const year = vnDate.getFullYear();
  const month = String(vnDate.getMonth() + 1).padStart(2, "0");
  const day = String(vnDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toUnixSeconds(value) {
  if (!value) return value;
  if (typeof value === "number") return value;
  if (/^\d{10}$/.test(String(value).trim())) return Number(value);
  const time = Math.floor(new Date(value).getTime() / 1000);
  return Number.isNaN(time) ? null : time;
}

module.exports = {
  formatDateLocal,
  toUnixSeconds,
};
