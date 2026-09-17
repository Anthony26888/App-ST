<template lang="">
  <v-navigation-drawer
    expand-on-hover
    permanent
    rail
    class="app-nav"
    @mouseenter="navExpanded = true"
    @mouseleave="navExpanded = false"
  >
    <!-- User Profile Section -->
    <v-list class="profile-section bg-transparent">
      <v-list-item
        prepend-avatar="@/assets/avatar-ST.jpg"
        :subtitle="LevelUser"
        :title="UserInfo"
        class="profile-item"
        @click="DialogUserInfo = true"
      >
        <template v-slot:append>
          <v-chip
            :color="licenseColor"
            size="small"
            class="text-white font-weight-bold"
          >
            {{ CurrentLicense }}
          </v-chip>
        </template>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <!-- Navigation Menu -->
    <v-list nav class="nav-menu mt-1">
      <template v-for="section in menuSections" :key="section.title">
        <v-list-subheader
          v-if="section.visible && section.items.length"
          class="text-caption"
        >
          {{ section.title }}
        </v-list-subheader>
        <v-tooltip
          v-for="(item, i) in section.items"
          :key="i"
          :text="item.title"
          location="end"
          :disabled="navExpanded"
        >
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" :title="item.title" :to="item.to">
              <template v-slot:prepend>
                <v-icon class="me-3">{{ item.icon }}</v-icon>
              </template>
              <template v-slot:title>
                <span>{{ item.title }}</span>
              </template>
            </v-list-item>
          </template>
        </v-tooltip>
      </template>
    </v-list>

    <!-- Logout Button -->

    <template v-slot:append>
      <v-divider></v-divider>
      <v-list class="logout-section bg-transparent">
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
  <DialogLicenseComp
    v-model="DialogLicense"
    :username="UserInfo"
    :current-license="CurrentLicense"
    :current-expiry="LicenseExpiry"
    :remaining-uses="LicenseUse"
    :project-count="ProjectCount"
    @activated="GetLicenseInfo"
  />

  <!-- Dialog User Info -->
  <v-dialog v-model="DialogUserInfo" max-width="380" persistent>
    <v-card class="rounded-xl overflow-hidden">
      <!-- Header gradient -->
      <div class="user-info-header pa-6 pb-10">
        <div class="d-flex justify-end">
          <v-btn
            icon="mdi-close"
            variant="text"
            color="white"
            size="small"
            @click="DialogUserInfo = false"
          />
        </div>
      </div>

      <!-- Avatar overlapping -->
      <div class="d-flex justify-center" style="margin-top: -52px">
        <v-avatar size="96" class="user-avatar-ring">
          <v-img src="@/assets/avatar-ST.jpg" />
        </v-avatar>
      </div>

      <v-card-text class="text-center pt-3 pb-2">
        <div class="text-h6 font-weight-bold">{{ UserInfo }}</div>
        <div class="text-caption text-grey-darken-1 mb-3">{{ LevelUser }}</div>

        <!-- License chip -->
        <div class="d-flex justify-center mb-4">
          <v-chip
            :color="licenseColor"
            class="text-white font-weight-bold px-4"
            size="small"
          >
            <v-icon start size="14">mdi-key-variant</v-icon>
            Gói {{ CurrentLicense }}
          </v-chip>
        </div>

        <!-- License usage info -->
        <v-sheet class="pa-4 rounded-xl mb-4" color="grey-lighten-5">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-grey-darken-1">Dự án đã tạo</span>
            <span class="text-body-2 font-weight-bold">{{ ProjectCount }}</span>
          </div>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-grey-darken-1">Lượt còn lại</span>
            <v-chip
              size="x-small"
              :color="
                LicenseUse === null
                  ? 'purple'
                  : LicenseUse <= 0
                  ? 'red'
                  : LicenseUse <= 3
                  ? 'orange'
                  : 'green'
              "
              class="text-white font-weight-bold"
            >
              {{ LicenseUse === null ? "Không giới hạn" : LicenseUse }}
            </v-chip>
          </div>
          <v-progress-linear
            v-if="LicenseUse !== null && CurrentLicense !== 'Enterprise'"
            :model-value="licenseUsedPercent"
            height="6"
            rounded
            :color="
              LicenseUse <= 0 ? 'red' : LicenseUse <= 3 ? 'orange' : 'primary'
            "
            class="mt-1"
          />
        </v-sheet>

        <!-- Upgrade button (show when 0 or almost out) -->
        <v-btn
          v-if="LicenseUse !== null && LicenseUse <= 3"
          block
          :color="LicenseUse <= 0 ? 'red' : 'primary'"
          class="font-weight-bold mb-2 text-caption"
          rounded="lg"
          @click="
            DialogUserInfo = false;
            DialogLicense = true;
          "
        >
          <v-icon start>mdi-arrow-up-circle</v-icon>
          {{ LicenseUse <= 0 ? "Hết lượt — Nâng cấp ngay" : "Nâng cấp gói" }}
        </v-btn>
        <v-btn
          v-else
          block
          variant="tonal"
          color="primary"
          class="font-weight-bold mb-2 text-caption"
          rounded="lg"
          @click="
            DialogUserInfo = false;
            DialogLicense = true;
          "
        >
          <v-icon start>mdi-key-change</v-icon>
          Quản lý License
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { jwtDecode } from "jwt-decode";
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Loading from "@/components/Loading.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import DialogLicenseComp from "@/components/Dialog-License.vue";
import { onMounted } from "vue";

const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const UserInfo = ref(null);
const LevelUser = ref("");

// License status
const CurrentLicense = ref("Starter");
const LicenseExpiry = ref("");
const LicenseUse = ref(0);
const ProjectCount = ref(0);
const DialogLicense = ref(false);
const DialogUserInfo = ref(false);
const licenseColor = computed(
  () =>
    ({
      Starter: "grey",
      Trial: "red-darken-1",
      Standard: "primary",
      Business: "amber",
    }[CurrentLicense.value] || "grey"),
);
const licenseUsedPercent = computed(() => {
  if (LicenseUse.value === null) return 0;
  const total = ProjectCount.value + LicenseUse.value;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((ProjectCount.value / total) * 100));
});

const GetLicenseInfo = async () => {
  if (!UserInfo.value) return;
  try {
    const { data } = await axios.get(`${Url}/License/Info/${UserInfo.value}`);
    CurrentLicense.value = data.License || "Starter";
    LicenseExpiry.value = data.LicenseExpiry || "";
    LicenseUse.value = data.LicenseUse ?? 0;
    ProjectCount.value = data.ProjectCount || 0;
  } catch (error) {
    console.error("Error fetching license:", error);
  }
};

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

// Trạng thái drawer: mở rộng khi hover (dùng để ẩn/hiện tooltip rail)
const navExpanded = ref(false);

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
      localStorage.removeItem("SessionId");
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
    GetLicenseInfo();
  } else {
    console.log("Không tìm thấy token!");
    DialogFailed.value = true;
    router.push("/");
  }
});

const LogOut = () => {
  try {
    axios.post(`${Url}/Users/logout`, {});
  } catch (e) {
    console.error(e);
  }
  localStorage.removeItem("token");
  localStorage.removeItem("SessionId");
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
        StatusOption_3.value = true;
      } else if (LevelUser.value == "Quản lý bảo trì") {
        StatusOption_1.value = true;
        StatusOption_4.value = true;
        StatusOption_5.value = true;
      } else if (LevelUser.value == "Quản lý sản xuất") {
        StatusOption_3.value = true;
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
  {
    group: "Hệ thống",
    icon: "mdi-key-change",
    title: "Quản lý License",
    value: "License",
    to: "/Cai-dat/Quan-ly-license",
    adminOnly: true,
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
  menuItems.value.filter(
    (item) =>
      item.group === "Hệ thống" &&
      (!item.adminOnly || LevelUser.value === "Admin"),
  ),
);

// Gom nhóm menu để render 1 vòng lặp duy nhất
const menuSections = computed(() => [
  {
    title: "Kiểm tra dữ liệu",
    visible: StatusOption_1.value,
    items: menuCheck.value,
  },
  { title: "Kho", visible: StatusOption_2.value, items: menuWareHouse.value },
  {
    title: "Sản xuất",
    visible: StatusOption_3.value,
    items: menuManufacture.value,
  },
  {
    title: "Bảo trì",
    visible: StatusOption_4.value,
    items: menuMaintenance.value,
  },
  {
    title: "Công việc",
    visible: StatusOption_5.value,
    items: menuListWork.value,
  },
  {
    title: "Hệ thống",
    visible: StatusOption_6.value,
    items: menuSetting.value,
  },
]);
</script>

<style lang="scss" scoped>
.v-navigation-drawer {
  /* Theme tokens */
  --nav-primary: #d2691e;
  --nav-secondary: #ff9500;
  --nav-primary-dark: #a52a2a;
  --nav-secondary-dark: #c96f00;
  --nav-text: rgba(255, 255, 255, 0.9);
  --nav-icon: rgba(255, 255, 255, 0.8);
  --nav-hover-bg: rgba(255, 255, 255, 0.12);
  --nav-active-bg: rgba(255, 255, 255, 0.18);
  --nav-shadow: rgba(0, 0, 0, 0.25);
  --nav-danger: #b71c1c;
  --nav-danger-dark: #7f0000;
  --nav-danger-bg: rgba(183, 28, 28, 0.22);

  /* Khi drawer thu nhỏ (rail mode) và không hover */
  &.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) {
    :deep(.v-list-subheader) {
      display: none !important;
      opacity: 0;
      visibility: hidden;
      height: 0;
      min-height: 0;
      margin: 0;
      padding: 0;
    }

    :deep(.profile-section) {
      background: transparent !important;
      display: flex;
      justify-content: center;
      padding: 8px 0;
    }

    :deep(.profile-item) {
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      justify-content: center;
    }

    :deep(.profile-item .v-avatar) {
      --v-avatar-height: 36px;
      width: 36px;
      height: 36px;
      border: 2px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 4px 16px var(--nav-shadow);
      margin-inline-end: 0 !important;
    }

    :deep(.profile-item .v-list-item__prepend) {
      justify-content: center !important;
      margin-inline: 0 !important;
    }

    :deep(.profile-item .v-list-item__content),
    :deep(.profile-item .v-list-item__append) {
      display: none !important;
    }

    :deep(.nav-menu .v-list-item) {
      margin-left: 0 !important;
      margin-right: 0 !important;
      border-radius: 0 !important;
    }

    :deep(.nav-menu .v-list-item .v-icon) {
      margin-inline-end: 0 !important;
    }
  }

  :deep(.v-list-subheader) {
    transition: opacity 0.2s ease, height 0.2s ease;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-left: 20px;
    min-height: 28px !important;
    line-height: 28px;
    margin-bottom: -4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.nav-menu) {
    background: transparent;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  :deep(.nav-menu .v-list-item) {
    color: var(--nav-text);
    margin: 4px 12px;
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  :deep(.nav-menu .v-list-item::before) {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 4px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.4) 100%
    );
    transform: scaleY(0);
    transform-origin: center;
    transition: transform 0.3s ease;
    border-radius: 4px;
  }

  :deep(.nav-menu .v-list-item:hover) {
    background: var(--nav-hover-bg) !important;
    color: #ffffff;
  }

  :deep(.nav-menu .v-list-item:hover::before) {
    transform: scaleY(1);
  }

  :deep(.nav-menu .v-list-item:hover .v-icon) {
    color: #ffffff !important;
    transform: scale(1.1);
  }

  /* Active style Material 3: nền tint nhạt + thanh trái + icon/title primary */
  :deep(.nav-menu .v-list-item--active) {
    background: var(--nav-active-bg) !important;
    color: #ffffff;
    box-shadow: none;
  }

  :deep(.nav-menu .v-list-item--active::before) {
    transform: scaleY(1);
  }

  :deep(.nav-menu .v-list-item--active .v-icon) {
    color: #ffffff !important;
  }

  :deep(.nav-menu .v-list-item--active .v-list-item-title) {
    color: #ffffff;
    font-weight: 700;
  }

  :deep(.nav-menu .v-list-item .v-icon) {
    transition: all 0.3s ease;
    color: var(--nav-icon) !important;
  }

  :deep(.profile-section) {
    padding: 12px 8px;
  }

  :deep(.profile-section .profile-item) {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(6px);
    margin: 0 4px;
    padding: 8px 12px;
    border-radius: 12px;
    box-shadow: 0 4px 12px var(--nav-shadow);
    transition: all 0.3s ease;
    cursor: pointer;
  }

  :deep(.profile-section .profile-item:hover) {
    background: rgba(255, 255, 255, 0.26);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px var(--nav-shadow);
  }

  :deep(.profile-section .profile-item .v-avatar) {
    border: 2px solid rgba(255, 255, 255, 0.8);
  }

  :deep(.profile-section .profile-item .v-list-item-title) {
    font-weight: 600;
    color: #ffffff;
    font-size: 0.95rem;
  }

  :deep(.profile-section .profile-item .v-list-item-subtitle) {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.8rem;
    font-weight: 500;
  }

  :deep(.logout-section) {
    padding-bottom: 12px;
  }

  :deep(.logout-section .logout-item) {
    color: var(--nav-danger) !important;
  }

  :deep(.logout-section .logout-item .v-icon) {
    color: var(--nav-danger) !important;
  }

  :deep(.logout-section .logout-item::before) {
    background: linear-gradient(180deg, var(--nav-danger) 0%, #ef5350 100%);
  }

  :deep(.logout-section .logout-item:hover) {
    background: var(--nav-danger-bg);
    color: var(--nav-danger-dark) !important;
  }

  :deep(.logout-section .logout-item:hover .v-icon) {
    color: var(--nav-danger-dark) !important;
  }

  :deep(.v-divider) {
    border-color: rgba(255, 255, 255, 0.15);
    margin: 0 16px;
  }
}

@media (max-width: 960px) {
  .v-navigation-drawer {
    :deep(.nav-menu .v-list-item) {
      margin: 4px 4px !important;
    }
  }
}
</style>

<style>
.app-nav {
  background: linear-gradient(
    135deg,
    #a52a2a 0%,
    #d2691e 50%,
    #ff9500 100%
  ) !important;
  background-color: transparent !important;
  border-right: 1px solid rgba(255, 255, 255, 0.12) !important;
}

.user-info-header {
  background: linear-gradient(135deg, #a52a2a 0%, #d2691e 50%, #ff9500 100%);
  min-height: 100px;
}
.user-avatar-ring {
  border: 4px solid white;
  box-shadow: 0 4px 16px rgba(210, 105, 30, 0.3);
}
</style>
