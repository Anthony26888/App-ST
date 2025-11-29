<template lang="">
  <v-navigation-drawer expand-on-hover permanent rail color="#ffffff">
    <!-- User Profile Section -->
    <v-list class="pa-0">
      <v-list-item
        prepend-avatar="@/assets/avatar-ST.jpg"
        :subtitle="LevelUser"
        :title="UserInfo"
        
      >
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <!-- Navigation Menu -->
    <v-list nav class="mt-4">
      <v-list-item
        v-for="(item, i) in visibleMenuItems"
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
      <v-list>
        <v-list-item
          prepend-icon="mdi-logout"
          title="Đăng xuất"
          value="Đăng xuất"
          @click="LogOut()"
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
const StatusOption_7 = ref(false);
const StatusOption_8 = ref(false);
const StatusOption_9 = ref(false);
const StatusOption_10 = ref(false);
const StatusOption_11 = ref(false);
const StatusOption_12 = ref(false);
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
    UserInfo.value = decoded.Username;
    Date_Expired.value = new Date(decoded.exp * 1000);
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
        StatusOption_4.value = true;
        StatusOption_6.value = true;
        StatusOption_7.value = true;
        StatusOption_8.value = true;
        StatusOption_9.value = true;
      } else if (LevelUser.value == "Thủ kho") {
        StatusOption_6.value = true;
        StatusOption_7.value = true;
        StatusOption_8.value = true;
        StatusOption_9.value = true;
        StatusOption_11.value = true;
        StatusOption_12.value = true;
      } else if (LevelUser.value == "Kế hoạch") {
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_5.value = true;
        StatusOption_6.value = true;
        StatusOption_7.value = true;
        StatusOption_8.value = true;
        StatusOption_12.value = true;
      } else if (LevelUser.value == "Quản lý tổng") {
        StatusOption_9.value = true;
      } else if (LevelUser.value == "Quản lý kinh doanh") {
        StatusOption_1.value = true;
        StatusOption_6.value = true;
        StatusOption_7.value = true;
        StatusOption_8.value = true;
        StatusOption_9.value = true;
        StatusOption_11.value = true;
      } else if (LevelUser.value == "Quản lý bảo trì") {
        StatusOption_1.value = true;
        StatusOption_9.value = true;
        StatusOption_11.value = true;
        StatusOption_7.value = true;
        StatusOption_4.value = true;
      } else if (LevelUser.value == "Quản lý sản xuất") {
        StatusOption_1.value = true;
        StatusOption_9.value = true;
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_4.value = true;
        StatusOption_6.value = true;
        StatusOption_12.value = true;
      } else if (LevelUser.value == "Admin") {
        StatusOption_1.value = false;
        StatusOption_2.value = false;
        StatusOption_3.value = false;
        StatusOption_4.value = false;
        StatusOption_5.value = false;
        StatusOption_6.value = false;
        StatusOption_7.value = false;
        StatusOption_8.value = false;
        StatusOption_9.value = false;
        StatusOption_12.value = false;
      } else if (LevelUser.value == "Nhân viên") {
        StatusOption_1.value = true;
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_4.value = true;
        StatusOption_5.value = true;
        StatusOption_6.value = true;
        StatusOption_7.value = true;
        StatusOption_8.value = true;
        StatusOption_9.value = true;
        StatusOption_12.value = true;
      } else {
        StatusOption_1.value = true;
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_4.value = true;
        StatusOption_6.value = true;
        StatusOption_7.value = true;
        StatusOption_8.value = true;
        StatusOption_9.value = true;
        StatusOption_12.value = true;
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
    icon: "mdi-chart-box-outline",
    title: "Kiểm tra số liệu",
    value: "Check",
    to: "/Kiem-tra-so-lieu",
    disabled: StatusOption_1.value,
  },
  {
    icon: "mdi-package-variant-closed",
    title: "Pick & Place",
    value: "CheckPnP",
    to: "/Danh-sach-pnp",
    disabled: StatusOption_12.value,
  },
  {
    icon: "mdi-warehouse",
    title: "Tồn Kho",
    value: "WareHouse",
    to: "/Ton-kho",
    disabled: StatusOption_2.value,
  },
  {
    icon: "mdi-database-outline",
    title: "Tồn Kho Misa",
    value: "WareHouse2",
    to: "/Ton-kho-2",
    disabled: StatusOption_3.value,
  },
  {
    icon: "mdi-shopping-outline",
    title: "Tình trạng đơn hàng",
    value: "Orders",
    to: "/Don-hang",
    disabled: StatusOption_4.value,
  },
  {
    icon: "mdi-briefcase-outline",
    title: "Dự án",
    value: "Project",
    to: "/Du-an",
    disabled: StatusOption_5.value,
  },
  {
    icon: "mdi-factory",
    title: "Sản xuất",
    value: "Manufacture",
    to: "/San-xuat",
    disabled: StatusOption_7.value,
  },
  {
    icon: "mdi-file-chart-outline",
    title: "Báo cáo",
    value: "Summary",
    to: "/Bao-cao-san-xuat",
    disabled: StatusOption_8.value,
  },
  {
    icon: "mdi-clipboard-list-outline",
    title: "Danh sách công việc",
    value: "ListWork",
    to: "/Danh-sach-cong-viec",
    disabled: StatusOption_11.value,
  },
  {
    icon: "mdi-wrench-outline",
    title: "Bảo trì",
    value: "Maintenance",
    to: "/Bao-tri",
    disabled: StatusOption_6.value,
  },
  {
    icon: "mdi-cog-outline",
    title: "Cài đặt",
    value: "Setting",
    to: "/Cai-dat",
    disabled: StatusOption_9.value,
  },
]);

const visibleMenuItems = computed(() =>
  menuItems.value.filter((item) => !item.disabled)
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

  .v-list {
    background: transparent;

    .v-list-item {
      color: rgba(0, 0, 0, 0.6);
      margin: 4px 8px;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 3px;
        background: linear-gradient(180deg, #A52A2A 0%, #FF9500 100%);
        transform: scaleY(0);
        transform-origin: center;
        transition: transform 0.3s ease;
      }

      &:hover {
        background: rgba(165, 42, 42, 0.08);
        color: #1a1a1a;
        transform: translateX(8px);

        &::before {
          transform: scaleY(1);
        }

        .v-icon {
          color: #FF9500 !important;
          transform: scale(1.2);
        }
      }

      &.v-list-item--active {
        background: linear-gradient(135deg, #A52A2A 0%, #FF9500 100%);
        color: #ffffff;
        border-left: none;

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

    .v-list-item:first-child {
      background: linear-gradient(135deg, #A52A2A 0%, #FF9500 100%);
      margin: 8px;
      padding: 12px 8px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(165, 42, 42, 0.2);

      &:hover::before {
        transform: scaleY(0);
      }

      &:hover {
        background: linear-gradient(135deg, #8B2222 0%, #E68900 100%);
        transform: none;
        box-shadow: 0 6px 16px rgba(165, 42, 42, 0.3);
      }

      .v-icon {
        color: #ffffff !important;
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

  .v-divider {
    border-color: rgba(0, 0, 0, 0.08);
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