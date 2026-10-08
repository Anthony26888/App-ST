<template>
  <v-app-bar :elevation="2">
    <template v-slot:prepend>
      <!-- Mở drawer điều hướng (chỉ mobile, desktop dùng rail cố định) -->
      <v-app-bar-nav-icon
        class="d-lg-none"
        @click="$emit('update:drawer', !drawer)"
      />
    </template>

    <v-app-bar-title class="app-bar-title">{{ pageTitle }}</v-app-bar-title>

    <template v-slot:append>
      <ThemeToggle />
      <NotificationBell />
      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" class="text-none px-2">
            <v-avatar size="32">
              <v-img src="@/assets/avatar-ST.jpg" alt="avatar"></v-img>
            </v-avatar>
            <div class="d-none d-md-block text-left ms-2">
              <div class="text-caption font-weight-bold">{{ UserInfo }}</div>
              <div class="text-caption text-medium-emphasis" style="font-size: 11px">
                {{ LevelUser }}
              </div>
            </div>
            <v-icon size="16" class="ms-1">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-card min-width="220" rounded="lg">
          <v-card-text class="d-flex align-center ga-3 pb-2">
            <v-avatar size="44">
              <v-img src="@/assets/avatar-ST.jpg" alt="avatar"></v-img>
            </v-avatar>
            <div style="min-width: 0">
              <div class="font-weight-bold text-truncate">{{ UserInfo }}</div>
              <div class="text-caption text-medium-emphasis">{{ LevelUser }}</div>
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-list density="compact" nav>
            <v-list-item
              prepend-icon="mdi-key-change"
              title="Quản lý License"
              to="/Cai-dat/Quan-ly-license"
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-logout"
              title="Đăng xuất"
              @click="LogOut()"
            ></v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </template>
  </v-app-bar>
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import Loading from "@/components/Loading.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ThemeToggle from "@/components/Theme-Toggle.vue";
import NotificationBell from "@/components/NotificationBell.vue";

const props = defineProps({
  // v-model:drawer - điều khiển Navigation temporary trên mobile
  drawer: { type: Boolean, default: false },
  // Ghi đè tiêu đề (mặc định suy từ route hiện tại)
  title: { type: String, default: "" },
});
defineEmits(["update:drawer"]);

const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const route = useRoute();
const DialogLoading = ref(false);
const DialogFailed = ref(false);
const UserInfo = ref("");
const LevelUser = ref("");

onMounted(() => {
  UserInfo.value =
    localStorage.getItem("Username") || localStorage.getItem("User") || "";
  LevelUser.value = localStorage.getItem("LevelUser") || "";
});

const ROUTE_TITLES = [
  ["/Du-an/Don-hang/", "Chi tiết đơn hàng"],
  ["/Du-an", "Tổng quan dự án"],
  ["/Kiem-tra-so-lieu", "Kiểm tra số liệu"],
  ["/Chinh-sua-so-lieu", "Chỉnh sửa số liệu"],
  ["/Danh-sach-pnp-qc", "Danh sách PnP-QC"],
  ["/Danh-sach-pnp", "Danh sách PnP"],
  ["/Kiem-tra-pnp-qc", "Kiểm tra PnP-QC"],
  ["/Kiem-tra-image-qc", "Kiểm tra image QC"],
  ["/Ton-kho-2", "Kho tồn kho Misa"],
  ["/Ton-kho", "Kho tồn kho"],
  ["/Don-hang", "Tình trạng đơn hàng"],
  ["/Cai-dat/Quan-ly-license", "Quản lý License"],
  ["/Cai-dat/Danh-sach-thanh-vien", "Thành viên"],
  ["/Cai-dat/Dang-ky-thanh-vien", "Đăng ký thành viên"],
  ["/Cai-dat", "Cài đặt"],
  ["/Bao-tri/Chi-tiet-su-dung-phu-tung", "Sử dụng phụ tùng"],
  ["/Bao-tri/Lich-bao-tri", "Lịch bảo trì"],
  ["/Bao-tri/Chi-tiet", "Chi tiết bảo trì"],
  ["/Bao-tri", "Bảo trì"],
  ["/San-xuat/Chi-tiet", "Theo dõi sản xuất"],
  ["/San-xuat", "Quản lý sản xuất"],
  ["/Bao-cao-san-xuat", "Báo cáo sản xuất"],
  ["/Danh-sach-cong-viec", "Danh sách công việc"],
  ["/Danh-sach-viec", "Danh sách việc"],
  ["/AI-Chatbox", "Trợ lí ứng dụng"],
];

const pageTitle = computed(() => {
  if (props.title) return props.title;
  const path = route.path || "";
  const found = ROUTE_TITLES.find(([prefix]) => path.startsWith(prefix));
  return found ? found[1] : "ERP Management";
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
</script>
