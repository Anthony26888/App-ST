function formatDateLocal(dateInput) {
  if (dateInput == null || String(dateInput).trim() === "") return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const vnDate = new Date(
    date.toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
  );
  if (Number.isNaN(vnDate.getTime())) return null;

  const year = vnDate.getFullYear();
  const month = String(vnDate.getMonth() + 1).padStart(2, "0");
  const day = String(vnDate.getDate()).padStart(2, "0");

  if (String(year).includes("NaN")) return null;
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
