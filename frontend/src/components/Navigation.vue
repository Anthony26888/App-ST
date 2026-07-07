<template lang="">
  <v-navigation-drawer expand-on-hover permanent rail color="#ffffff">
    <!-- User Profile Section -->
    <v-list class="profile-section">
      <v-list-item
        prepend-avatar="@/assets/avatar-ST.jpg"
        :subtitle="LevelUser"
        :title="UserInfo"
        class="profile-item"
      >
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <!-- Navigation Menu -->
    <v-list nav class="mt-1">
      <v-list-subheader v-if="StatusOption_1 == true"
        >Kiểm tra dữ liệu</v-list-subheader
      >

      <v-list-item
        v-if="StatusOption_1 == true"
        v-for="(item, i) in menuCheck"
        :key="i"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.value"
        :to="item.to"
      >
        <template v-slot:prepend>
          <v-icon class="me-3">{{ item.icon }}</v-icon>
        </template>
        <template v-slot:title>
          <span>{{ item.title }}</span>
        </template>
      </v-list-item>
      <v-list-subheader v-if="StatusOption_2 == true">Kho</v-list-subheader>
      <v-list-item
        v-if="StatusOption_2 == true"
        v-for="(item, i) in menuWareHouse"
        :key="i"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.value"
        :to="item.to"
      >
        <template v-slot:prepend>
          <v-icon class="me-3">{{ item.icon }}</v-icon>
        </template>
        <template v-slot:title>
          <span>{{ item.title }}</span>
        </template>
      </v-list-item>
      <v-list-subheader v-if="StatusOption_3 == true"
        >Sản xuất</v-list-subheader
      >

      <v-list-item
        v-if="StatusOption_3 == true"
        v-for="(item, i) in menuManufacture"
        :key="i"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.value"
        :to="item.to"
      >
        <template v-slot:prepend>
          <v-icon class="me-3">{{ item.icon }}</v-icon>
        </template>
        <template v-slot:title>
          <span>{{ item.title }}</span>
        </template>
      </v-list-item>
      <v-list-subheader v-if="StatusOption_4 == true">Bảo trì</v-list-subheader>

      <v-list-item
        v-if="StatusOption_4 == true"
        v-for="(item, i) in menuMaintenance"
        :key="i"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.value"
        :to="item.to"
      >
        <template v-slot:prepend>
          <v-icon class="me-3">{{ item.icon }}</v-icon>
        </template>
        <template v-slot:title>
          <span>{{ item.title }}</span>
        </template>
      </v-list-item>
      <v-list-subheader v-if="StatusOption_5 == true"
        >Công việc</v-list-subheader
      >

      <v-list-item
        v-if="StatusOption_5 == true"
        v-for="(item, i) in menuListWork"
        :key="i"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.value"
        :to="item.to"
      >
        <template v-slot:prepend>
          <v-icon class="me-3">{{ item.icon }}</v-icon>
        </template>
        <template v-slot:title>
          <span>{{ item.title }}</span>
        </template>
      </v-list-item>
      <v-list-subheader v-if="StatusOption_6 == true"
        >Hệ thống</v-list-subheader
      >

      <v-list-item
        v-if="StatusOption_6 == true"
        v-for="(item, i) in menuSetting"
        :key="i"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.value"
        :to="item.to"
      >
        <template v-slot:prepend>
          <v-icon class="me-3">{{ item.icon }}</v-icon>
        </template>
        <template v-slot:title>
          <span>{{ item.title }}</span>
        </template>
      </v-list-item>
    </v-list>

    <!-- Logout Button -->
    <template v-slot:append>
      <v-list class="logout-section">
        <v-list-item
          prepend-icon="mdi-logout"
          title="Đăng xuất"
          value="Đăng xuất"
          @click="LogOut()"
          class="logout-item"
        ></v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>

<script setup>
import { jwtDecode } from "jwt-decode";
import { ref, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import Loading from "@/components/Loading.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import { onMounted } from "vue";

const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const route = useRoute();
const UserInfo = ref(null);
const LevelUser = ref("");

// Status
const StatusOption_1 = ref(false);
const StatusOption_2 = ref(false);
const StatusOption_3 = ref(false);
const StatusOption_4 = ref(false);
const StatusOption_5 = ref(false);
const StatusOption_6 = ref(false);
const Date_Expired = ref("");

// Dialog
const DialogLoading = ref(false);
const DialogFailed = ref(false);

const drawer = ref(true);
const rail = ref(false);

onMounted(() => {
  const token = localStorage.getItem("token");

  if (token) {
    const decoded = jwtDecode(token);
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();

    // KIỂM TRA: Nếu thời gian hiện tại lớn hơn thời gian hết hạn
    if (currentTime >= expirationTime) {
      console.log("Token đã hết hạn sử dụng!");
      localStorage.removeItem("token");
      localStorage.removeItem("Username");
      DialogFailed.value = true;
      router.push("/");
      return; // Dừng code tại đây, không chạy tiếp các hàm dưới
    }

    // Nếu còn hạn thì xử lý tiếp như bình thường
    UserInfo.value = decoded.Username;
    localStorage.setItem("Username", UserInfo.value);
    Date_Expired.value = new Date(expirationTime);
    FetchUser();
  } else {
    console.log("Không tìm thấy token!");
    DialogFailed.value = true;
    router.push("/");
  }
});

const LogOut = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("CustomersID");
  localStorage.removeItem("PO");
  localStorage.removeItem("Customers");
  localStorage.removeItem("LevelUser");
  router.push("/");
};

const FetchUser = async () => {
  if (UserInfo.value) {
    try {
      const res = await fetch(`${Url}/All-Users/${UserInfo.value}`);
      const Detail_User = await res.json();
      LevelUser.value = Detail_User[0].Level;
      localStorage.setItem("LevelUser", LevelUser.value);

      if (LevelUser.value == "Kinh doanh") {
        StatusOption_1.value = true;
        StatusOption_2.value = true;
      } else if (LevelUser.value == "Thủ kho") {
        StatusOption_2.value = true;
        StatusOption_3.value = true;
      } else if (LevelUser.value == "Kế hoạch") {
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_5.value = true;
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Quản lý tổng") {
        StatusOption_1.value = true;
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_4.value = true;
        StatusOption_5.value = true;
      } else if (LevelUser.value == "Quản lý kinh doanh") {
        StatusOption_1.value = true;
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Quản lý bảo trì") {
        StatusOption_1.value = true;
        StatusOption_4.value = true;
        StatusOption_5.value = true;
      } else if (LevelUser.value == "Quản lý sản xuất") {
        StatusOption_1.value = true;
        StatusOption_3.value = true;
        StatusOption_5.value = true;
      } else if (LevelUser.value == "Admin") {
        StatusOption_1.value = true;
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_4.value = true;
        StatusOption_5.value = true;
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Nhân viên") {
        StatusOption_3.value = true;
      } else if (LevelUser.value == "Quản lý QC") {
        StatusOption_1.value = true;
      } else {
        StatusOption_1.value = true;
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_4.value = true;
        StatusOption_6.value = true;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      DialogFailed.value = true;
      router.push("/");
    }
  } else {
    DialogFailed.value = true;
    router.push("/");
  }
};

const isActiveRoute = (to) => {
  return route.path === to;
};

const menuItems = computed(() => [
  {
    group: "Kiểm tra dữ liệu",
    icon: "mdi-chart-box-outline",
    title: "Kiểm tra số liệu",
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
    title: "Pick & Place",
    value: "CheckPnP",
    to: "/Danh-sach-pnp",
  },
  {
    group: "Kiểm tra dữ liệu",
    icon: "mdi-check-decagram-outline",
    title: "Pick & Place QC",
    value: "CheckPnPQC",
    to: "/Danh-sach-pnp-qc",
  },
  {
    group: "Kho",
    icon: "mdi-warehouse",
    title: "Tồn Kho",
    value: "WareHouse",
    to: "/Ton-kho",
  },
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
]);

const menuCheck = computed(() =>
  menuItems.value.filter((item) => item.group === "Kiểm tra dữ liệu"),
);
const menuWareHouse = computed(() =>
  menuItems.value.filter((item) => item.group === "Kho"),
);
const menuManufacture = computed(() =>
  menuItems.value.filter((item) => item.group === "Sản xuất"),
);
const menuMaintenance = computed(() =>
  menuItems.value.filter((item) => item.group === "Bảo trì"),
);
const menuListWork = computed(() =>
  menuItems.value.filter((item) => item.group === "Công việc"),
);
const menuSetting = computed(() =>
  menuItems.value.filter((item) => item.group === "Hệ thống"),
);
</script>

<script>
export default {
  components: {
    Loading,
    SnackbarFailed,
  },
};
</script>

<style lang="scss" scoped>
:deep(.v-navigation-drawer) {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  border-right: 1px solid rgba(0, 0, 0, 0.08);

  /* Khi drawer thu nhỏ (rail mode) và không hover */
  &.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) {
    .v-list-subheader {
      opacity: 0;
      visibility: hidden;
      height: 0;
      min-height: 0;
      margin: 0;
      padding: 0;
    }

    .profile-item {
      padding-left: 8px !important;
      padding-right: 8px !important;
      margin-left: 4px;
      margin-right: 4px;
      justify-content: center;

      :deep(.v-avatar) {
        margin-inline-end: 0 !important;
      }
    }
  }

  .v-list-subheader {
    transition: opacity 0.2s ease, height 0.2s ease;
    color: #1867c0;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-left: 20px;
    min-height: 28px !important;
    line-height: 28px;
    margin-bottom: -4px;
  }

  .v-list {
    background: transparent;
    padding-top: 4px;
    padding-bottom: 4px;

    .v-list-item {
      color: rgba(0, 0, 0, 0.7);
      margin: 4px 12px;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 4px;
        background: linear-gradient(180deg, #1867c0 0%, #5cbbf6 100%);
        transform: scaleY(0);
        transform-origin: center;
        transition: transform 0.3s ease;
        border-radius: 4px;
      }

      &:hover {
        background: rgba(24, 103, 192, 0.08);
        color: #1867c0;

        &::before {
          transform: scaleY(1);
        }

        .v-icon {
          color: #1867c0 !important;
          transform: scale(1.1);
        }
      }

      &.v-list-item--active {
        background: linear-gradient(135deg, #1867c0 0%, #5cbbf6 100%);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(24, 103, 192, 0.2);

        .v-icon {
          color: #ffffff !important;
        }

        &::before {
          transform: scaleY(0);
        }

        :deep(.v-list-item-title) {
          color: #ffffff;
          font-weight: 700;
        }
      }

      .v-icon {
        transition: all 0.3s ease;
        color: rgba(0, 0, 0, 0.5) !important;
      }
    }
  }

  .profile-section {
    padding: 12px 8px;

    .profile-item {
      background: linear-gradient(135deg, #1867c0 0%, #5cbbf6 100%);
      margin: 0 4px;
      padding: 8px 12px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(24, 103, 192, 0.2);
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, #1355a3 0%, #4aa1d6 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(24, 103, 192, 0.3);
      }

      &::before {
        display: none;
      }

      :deep(.v-avatar) {
        border: 2px solid rgba(255, 255, 255, 0.8);
      }

      :deep(.v-list-item-title) {
        font-weight: 600;
        color: #ffffff;
        font-size: 0.95rem;
      }

      :deep(.v-list-item-subtitle) {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.8rem;
        font-weight: 500;
      }
    }
  }

  .logout-section {
    padding-bottom: 12px;

    .logout-item {
      color: #d32f2f !important;

      .v-icon {
        color: #d32f2f !important;
      }

      &::before {
        background: linear-gradient(180deg, #d32f2f 0%, #ef5350 100%);
      }

      &:hover {
        background: rgba(211, 47, 47, 0.08);
        color: #b71c1c !important;

        .v-icon {
          color: #b71c1c !important;
        }
      }
    }
  }

  .v-divider {
    border-color: rgba(0, 0, 0, 0.08);
    margin: 0 16px;
  }
}

@media (max-width: 960px) {
  :deep(.v-navigation-drawer) {
    :deep(.v-list-item) {
      margin: 4px 4px !important;
    }
  }
}
</style>
