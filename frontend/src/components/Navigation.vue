<template lang="">
  <v-navigation-drawer 
    theme="light" 
    permanent 
    color="#1E293B"
    class="custom-nav"
    elevation="2"
  >
    <template v-slot:prepend>
      <v-list-item
        lines="two"
        class="user-info-section"
        prepend-avatar="https://sieuthuat.vn/wp-content/uploads/2019/06/logo-ST-_-original-02-1.png"
      >
        <template v-slot:title>
          <p class="text-h6 font-weight-medium ms-3 text-white">{{ UserInfo }}</p>
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
        class="menu-item mb-2"
        :class="{ 'menu-item-disabled': item.disabled }"
      >
        <template v-slot:prepend>
          <v-icon :color="item.disabled ? 'grey' : 'white'" class="me-3">{{ item.icon }}</v-icon>
        </template>
        <template v-slot:title>
          <span :class="item.disabled ? 'text-grey' : 'text-white'">{{ item.title }}</span>
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
          color="error"
        >
          <v-icon start>mdi-logout</v-icon>
          Đăng xuất
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>

<script setup>
import { jwtDecode } from "jwt-decode";
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Loading from "@/components/Loading.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const UserInfo = ref(null);
const LevelUser = ref("");
const StatusOption_1 = ref(false);
const StatusOption_2 = ref(false);
const StatusOption_3 = ref(false);
const StatusOption_4 = ref(false);
const StatusOption_5 = ref(false);
const StatusOption_6 = ref(false);
const Date_Expired = ref("");
const DialogLoading = ref(false);
const DialogFailed = ref(false);

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
  router.push("/");
};
const FetchUser = async () => {
  if (UserInfo.value) {
    try {
      const res = await fetch(`${Url}/All-Users/${UserInfo.value}`);
      const Detail_User = await res.json();
      LevelUser.value = Detail_User[0].Level;
      if (LevelUser.value == "Kinh doanh") {
        StatusOption_1.value = true;
        StatusOption_4.value = true;
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Thủ kho") {
        StatusOption_1.value = true;
        StatusOption_5.value = true;
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Kế hoạch") {
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_5.value = true;
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Quản lý") {
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Admin") {
        StatusOption_1.value = false;
        StatusOption_2.value = false;
        StatusOption_3.value = false;
        StatusOption_4.value = false;
        StatusOption_5.value = false;
        StatusOption_6.value = false;
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
    icon: 'mdi-cart-arrow-down',
    title: 'Kiểm tra số liệu',
    value: 'Check',
    to: '/Kiem-tra-so-lieu',
    disabled: StatusOption_1.value
  },
  {
    icon: 'mdi-warehouse',
    title: 'Tồn Kho',
    value: 'WareHouse',
    to: '/Ton-kho',
    disabled: StatusOption_2.value
  },
  {
    icon: 'mdi-warehouse',
    title: 'Tồn Kho Misa',
    value: 'WareHouse2',
    to: '/Ton-kho-2',
    disabled: StatusOption_3.value
  },
  {
    icon: 'mdi-order-bool-descending-variant',
    title: 'Tình trạng đơn hàng',
    value: 'Orders',
    to: '/Don-hang',
    disabled: StatusOption_4.value
  },
  {
    icon: 'mdi-notebook-multiple',
    title: 'Dự án',
    value: 'Project',
    to: '/Du-an',
    disabled: StatusOption_5.value
  },
  {
    icon: 'mdi-cog',
    title: 'Cài đặt',
    value: 'Setting',
    to: '/Cai-dat',
    disabled: StatusOption_6.value
  }
]);
</script>

<script>
export default {
  components: {
    Loading,
    SnackbarFailed,
  },
  data() {},
  methods: {},
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
    padding: 8px 16px;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
}
</style>
