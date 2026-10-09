/**
 * Nguồn phân quyền menu DUY NHẤT cho Navigation (desktop) + Toolbar (mobile).
 * Logic giữ nguyên 100% behavior cũ, chỉ gom về 1 file để không lệch nhau.
 */

const Url = import.meta.env.VITE_API_URL;

// ===== Danh mục menu desktop (nhóm theo section) =====
export const NAV_MENU_ITEMS = [
  {
    group: "Kiểm tra dữ liệu",
    icon: "mdi-chart-box-outline",
    title: "Dữ liệu mua hàng",
    value: "Check",
    to: "/Kiem-tra-so-lieu",
  },
  {
    group: "Kho",
    icon: "mdi-shopping-outline",
    title: "Tình trạng đơn hàng",
    value: "Orders",
    to: "/Don-hang",
  },
  {
    group: "Kiểm tra dữ liệu",
    icon: "mdi-package-variant-closed",
    title: "Dữ liệu SMT",
    value: "CheckPnP",
    to: "/Danh-sach-pnp",
  },
  {
    group: "Kho",
    icon: "mdi-warehouse",
    title: "Tồn Kho",
    value: "WareHouse",
    to: "/Ton-kho",
  },
  // {
  //   group: "Kho",
  //   icon: "mdi-warehouse",
  //   title: "Tồn Kho Misa",
  //   value: "WareHouse2",
  //   to: "/Ton-kho-2",
  // },
  {
    group: "Sản xuất",
    icon: "mdi-briefcase-outline",
    title: "Dự án",
    value: "Project",
    to: "/Du-an",
  },
  {
    group: "Sản xuất",
    icon: "mdi-factory",
    title: "Sản xuất",
    value: "Manufacture",
    to: "/San-xuat",
  },
  {
    group: "Sản xuất",
    icon: "mdi-file-chart-outline",
    title: "Báo cáo",
    value: "Summary",
    to: "/Bao-cao-san-xuat",
  },
  {
    group: "Bảo trì",
    icon: "mdi-wrench-outline",
    title: "Bảo trì",
    value: "Maintenance",
    to: "/Bao-tri",
  },
  {
    group: "Công việc",
    icon: "mdi-clipboard-list-outline",
    title: "Danh sách công việc",
    value: "ListWork",
    to: "/Danh-sach-viec",
  },
  {
    group: "Hệ thống",
    icon: "mdi-cog-outline",
    title: "Cài đặt",
    value: "Setting",
    to: "/Cai-dat",
  },
  {
    group: "Hệ thống",
    icon: "mdi-key-change",
    title: "Quản lý License",
    value: "License",
    to: "/Cai-dat/Quan-ly-license",
    adminOnly: true,
  },
];

// ===== Section desktop hiển thị theo Level (true = hiện) =====
// Giữ nguyên mapping cũ của Navigation.vue
const NAV_SECTIONS_BY_LEVEL = {
  "Kinh doanh": [1, 2],
  "Thủ kho": [2, 3],
  "Kế hoạch": [2, 3, 5, 6],
  "Quản lý tổng": [1, 2, 3, 4, 5],
  "Quản lý kinh doanh": [3],
  "Quản lý bảo trì": [1, 4, 5],
  "Quản lý sản xuất": [3],
  Admin: [1, 2, 3, 4, 5, 6],
  "Nhân viên": [3],
  "Quản lý QC": [1],
  __default: [1, 2, 3, 4, 6],
};

export const NAV_SECTION_ORDER = [
  "Kiểm tra dữ liệu",
  "Kho",
  "Sản xuất",
  "Bảo trì",
  "Công việc",
  "Hệ thống",
];

export function getNavVisibleSections(levelUser) {
  const nums = NAV_SECTIONS_BY_LEVEL[levelUser] ?? NAV_SECTIONS_BY_LEVEL.__default;
  const map = {
    1: "Kiểm tra dữ liệu",
    2: "Kho",
    3: "Sản xuất",
    4: "Bảo trì",
    5: "Công việc",
    6: "Hệ thống",
  };
  return new Set(nums.map((n) => map[n]));
}

// ===== Lấy Level user (dùng chung) =====
export async function fetchUserLevel() {
  const username = localStorage.getItem("Username");
  const res = await fetch(`${Url}/All-Users/${username}`);
  const detail = await res.json();
  return detail[0].Level;
}
