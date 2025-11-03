<template>
  <v-navigation-drawer
    theme="light"
    color="#1E293B"
    class="custom-nav"
    elevation="2" 
    v-model="drawer"
  >
    <template v-slot:prepend>
      <v-list-item
        class="ms-2"
        lines="two"
        prepend-avatar="@/assets/avatar-ST.jpg"
      >
        <template v-slot:title>
          <p class="text-h6 font-weight-medium ms-3 text-white">
            {{ UserInfo }}
          </p>
        </template>
        <template v-slot:subtitle>
          <p class="ms-3 text-grey-lighten-1">{{ LevelUser }}</p>
        </template>
      </v-list-item>
    </template>
    <v-divider class="border-opacity-25"></v-divider>
    <v-list nav class="mt-4">
      <v-list-item
        v-for="(item, i) in menuItems"
        :key="i"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.value"
        :to="item.to"
        :disabled="item.disabled"
        :class="{ 'menu-item-disabled': item.disabled }"
        @click="handleClick(item.title)"
      >
        <template v-slot:prepend>
          <v-icon :color="item.disabled ? 'grey' : 'white'" class="me-3">{{
            item.icon
          }}</v-icon>
        </template>
        <template v-slot:title>
          <span :class="item.disabled ? 'text-grey' : 'text-white'">{{
            item.title
          }}</span>
        </template>
      </v-list-item>
    </v-list>
    <template v-slot:append>
      <div class="pa-4">
        <v-btn
          block
          @click="LogOut()"
          class="logout-btn text-caption"
          variant="tonal"
          elevation="2"
          prepend-icon="mdi-logout"
          :class="{ 'rail-mode': rail }"
        >
          <span v-if="!rail">Đăng xuất</span>
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />

  <!-- ✅ App Bar -->
  <v-app-bar :elevation="2" color="primary">
    <template v-slot:prepend>
      <!-- Ấn để toggle drawer -->
      <v-app-bar-nav-icon @click="drawer = !drawer" />
    </template>

    <!-- Dynamic Title -->
    <v-app-bar-title>
        {{ TitleNavigation }}
    </v-app-bar-title>
  </v-app-bar>
</template>

<script setup>

const props = defineProps({
  title: {
    type: String,
    default: "Application Bar",
  },
});

import { jwtDecode } from "jwt-decode";
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Loading from "@/components/Loading.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";


//
const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
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

//
const drawer = ref(false);
const rail = ref(false);
const TitleNavigation = ref(localStorage.getItem("titleNavigation"));


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

const menuItems = computed(() => [
  {
    icon: "mdi-cart-arrow-down",
    title: "Kiểm tra số liệu",
    value: "Check",
    to: "/Kiem-tra-so-lieu",
    disabled: StatusOption_1.value,
  },
  {
    icon: "mdi-file-cog",
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
    icon: "mdi-warehouse",
    title: "Tồn Kho Misa",
    value: "WareHouse2",
    to: "/Ton-kho-2",
    disabled: StatusOption_3.value,
  },
  {
    icon: "mdi-order-bool-descending-variant",
    title: "Tình trạng đơn hàng",
    value: "Orders",
    to: "/Don-hang",
    disabled: StatusOption_4.value,
  },
  {
    icon: "mdi-notebook-multiple",
    title: "Dự án",
    value: "Project",
    to: "/Du-an",
    disabled: StatusOption_5.value,
  },
  {
    icon: "mdi-calendar-check",
    title: "Sản xuất",
    value: "Manufacture",
    to: "/San-xuat",
    disabled: StatusOption_7.value,
  },
  {
    icon: "mdi-file-chart-check",
    title: "Báo cáo",
    value: "Summary",
    to: "/Bao-cao-san-xuat",
    disabled: StatusOption_8.value,
  },
  {
    icon: "mdi-account-hard-hat",
    title: "Danh sách công việc",
    value: "ListWork",
    to: "/Danh-sach-cong-viec",
    disabled: StatusOption_11.value,
  },
  {
    icon: "mdi-wrench",
    title: "Bảo trì",
    value: "Maintenance",
    to: "/Bao-tri",
    disabled: StatusOption_6.value,
  },
  // {
  //   icon: "mdi-robot-confused-outline",
  //   title: "Trợ lí ứng dụng",
  //   value: "AI",
  //   to: "/AI-Chatbox",
  //   disabled: StatusOption_10.value,
  // },
  {
    icon: "mdi-cog",
    title: "Cài đặt",
    value: "Setting",
    to: "/Cai-dat",
    disabled: StatusOption_9.value,
  },
]);

const handleClick = (title) => {
  // ✅ Lưu vào localStorage
  localStorage.setItem("titleNavigation", title);

  // ✅ Đồng thời cập nhật reactive ref để UI update ngay
  TitleNavigation.value = title;
};
</script>
<style lang="scss">
.custom-nav {
  .user-info-section {
    background: rgba(255, 255, 255, 0.05);
    margin: 8px;
    border-radius: 12px;
    padding: 8px;
  }

  .menu-item {
    margin: 4px 8px;
    border-radius: 12px;
    transition: all 0.3s ease;
    padding: 8px 16px;

    &:not(.menu-item-disabled):hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateX(4px);
    }

    &.menu-item-disabled {
      opacity: 0.5;
    }

    .v-list-item__content {
      padding: 8px 0;
    }
  }

  .logout-btn {
    transition: all 0.3s ease;
    border-radius: 12px;
    padding: 12px 24px;
    font-weight: 500;
    letter-spacing: 0.5px;
    background: linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.1),
      rgba(168, 85, 247, 0.1)
    ) !important;
    border: 1px solid rgba(99, 102, 241, 0.2) !important;
    backdrop-filter: blur(8px);
    color: #fff !important;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
      background: linear-gradient(
        135deg,
        rgba(99, 102, 241, 0.2),
        rgba(168, 85, 247, 0.2)
      ) !important;
      border-color: rgba(99, 102, 241, 0.3) !important;
    }

    .v-icon {
      transition: transform 0.3s ease;
      color: #fff !important;
    }

    &:hover .v-icon {
      transform: translateX(-2px);
    }
  }

  .v-divider {
    margin: 8px 0;
    opacity: 0.1;
  }

  .v-data-table {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .v-table {
      border-radius: 12px;
      overflow: hidden;
    }

    .v-table__wrapper {
      border-radius: 12px;
      overflow: hidden;
    }

    .v-table__wrapper > table {
      border-radius: 12px;
      overflow: hidden;
    }

    .v-table__wrapper > table > thead > tr > th {
      border-radius: 12px 12px 0 0;
      background: rgba(255, 255, 255, 0.05);
      color: white;
      font-weight: 500;
      padding: 12px 16px;
    }

    .v-table__wrapper > table > tbody > tr > td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .v-table__wrapper > table > tbody > tr:last-child > td {
      border-bottom: none;
    }

    .v-table__wrapper > table > tbody > tr:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .v-table__wrapper > table > tbody > tr:last-child > td:first-child {
      border-bottom-left-radius: 12px;
    }

    .v-table__wrapper > table > tbody > tr:last-child > td:last-child {
      border-bottom-right-radius: 12px;
    }
  }

  .v-list {
    .v-list-item {
      margin: 4px 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &:not(.menu-item-disabled) {
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(8px);
          
          .v-icon {
            transform: scale(1.1);
            color: #4CAF50 !important;
          }

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 3px;
            background: #4CAF50;
            animation: slideIn 0.3s ease;
          }
        }

        &:active {
          transform: translateX(4px);
        }
      }

      &.menu-item-disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .v-icon {
        transition: all 0.3s ease;
      }
    }
  }

  @keyframes slideIn {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .v-navigation-drawer {
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;

    .v-list {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .v-list-item {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .v-btn {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &.v-navigation-drawer--rail {
      width: 56px !important;
      
      .v-list-item {
        min-height: 48px;
        padding: 0;
        justify-content: center;
        
        .v-icon {
          margin: 0 !important;
          font-size: 24px;
        }
      }

      .v-list-item__prepend {
        margin: 0 !important;
      }

      .pa-4 {
        padding: 8px !important;
      }

      .logout-btn {
        &.rail-mode {
          width: 48px !important;
          height: 48px !important;
          min-width: 48px !important;
          padding: 0 !important;
          margin: 0 auto !important;
          border-radius: 8px !important;

          .v-btn__content {
            padding: 0 !important;
            justify-content: center !important;
          }

          .v-icon {
            margin: 0 !important;
          }
        }
      }
    }
  }
}

</style>
