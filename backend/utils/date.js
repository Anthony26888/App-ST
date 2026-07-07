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

module.exports = {
  formatDateLocal,
};
