/**
 * Bảng màu chip trạng thái dùng chung cho cụm Project
 * (Page-Project + Page-DetailProjectPO) - 1 nguồn duy nhất,
 * tránh lệch màu giữa các trang.
 */

const STATUS_COLORS = {
  "Hoàn thành": "success",
  "Đang sản xuất": "warning",
  "Trễ hạn": "error",
  "Chưa đến hạn": "info",
  "Đã giao": "success",
  "Chưa giao": "primary",
  "Chưa có lịch": "grey",
  // Trạng thái lịch sử sản xuất (Page-DetailManufacture) - giữ màu hiện tại
  Pass: "success",
  Fail: "warning",
  Fixed: "info",
};

/**
 * Map 1 trạng thái đơn/lịch sang { text, color } cho v-chip.
 * @param {string} status - VD: 'Hoàn thành', 'Trễ hạn', 'Đã giao'
 * @param {string} fallbackColor - màu khi status lạ
 */
export const statusChip = (status, fallbackColor = "primary") => ({
  text: status || "—",
  color: STATUS_COLORS[status] || fallbackColor,
});

/**
 * Chip Sớm/Trễ theo số ngày lệch (thực giao - hẹn).
 * @param {number|null} days - số ngày lệch, null khi chưa giao
 */
export const delayChip = (days) => {
  if (days == null) return { text: "", color: "" };
  if (days <= 0) {
    return days === 0
      ? { text: "Đúng hạn", color: "success" }
      : { text: `Sớm ${-days} ngày`, color: "success" };
  }
  return {
    text: `Trễ ${days} ngày`,
    color: days <= 3 ? "orange" : "error",
  };
};

/**
 * Trạng thái gộp duy nhất cho 1 lịch giao:
 * Đã giao > Trễ hạn > Chưa đến hạn > Chưa có lịch.
 */
export const scheduleState = (schedule) => {
  if (schedule?.DeliveryCheck === "Đã giao") {
    return statusChip("Đã giao");
  }
  if (schedule?.DeliveryStatus === "Trễ hạn") {
    return statusChip("Trễ hạn");
  }
  if (schedule?.DeliveryStatus === "Chưa đến hạn") {
    return statusChip("Chưa đến hạn");
  }
  return statusChip("Chưa có lịch", "grey");
};
