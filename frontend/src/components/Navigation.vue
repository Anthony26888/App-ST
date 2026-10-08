<template lang="">
  <v-navigation-drawer
    :permanent="!temporary"
    :temporary="temporary"
    :rail="isMini"
    :model-value="drawerOpen"
    :width="256"
    :rail-width="72"
    class="app-nav"
    @update:model-value="$emit('update:open', $event)"
  >
    <!-- Nút thu gọn nổi nửa ngoài mép (desktop only) -->
    <v-tooltip
      :text="collapsed ? 'Mở rộng' : 'Thu gọn'"
      location="end"
      v-if="!temporary"
    >
      <template #activator="{ props: tipProps }">
        <v-btn
          v-bind="tipProps"
          :icon="collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'"
          size="x-small"
          class="app-nav-collapse"
          @click="toggleCollapse"
        ></v-btn>
      </template>
    </v-tooltip>

    <!-- Brand -->
    <div class="d-flex align-center px-4 app-nav-brand">
      <v-avatar size="36" rounded="lg" class="app-brand-avatar">
        <v-img src="@/assets/avatar-ST.jpg" alt="ERP ST"></v-img>
      </v-avatar>
      <span class="font-weight-bold text-h6 ms-3 app-brand-name">ERP ST</span>
    </div>

    <v-divider></v-divider>

    <!-- Navigation Menu -->
    <v-list nav class="nav-menu mt-1 px-2">
      <template v-for="section in menuSections" :key="section.title">
        <v-list-subheader
          v-if="section.visible && section.items.length && !collapsed"
          class="text-caption"
        >
          {{ section.title }}
        </v-list-subheader>
        <v-tooltip
          v-for="item in section.items"
          :key="item.value"
          :text="item.title"
          location="end"
          :disabled="!collapsed"
        >
          <template #activator="{ props: tipProps }">
            <v-list-item
              v-bind="tipProps"
              :title="item.title"
              :to="item.to"
              :prepend-icon="item.icon"
              active-class="app-nav-active"
              class="app-nav-item"
              rounded="lg"
              @click="temporary && $emit('update:open', false)"
            >
              <template v-slot:append>
                <v-badge
                  v-if="navBadge(item.value) > 0"
                  :content="navBadge(item.value)"
                  color="error"
                  inline
                ></v-badge>
              </template>
            </v-list-item>
          </template>
        </v-tooltip>
      </template>
    </v-list>

    <template v-slot:append>
      <v-divider></v-divider>
      <div class="d-flex align-center justify-center px-1 py-2">
        <v-btn
          prepend-icon="mdi-logout"
          variant="text"
          size="small"
          class="text-none"
          @click="LogOut()"
        >
          <span v-if="!collapsed">Đăng xuất</span>
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
import { onMounted } from "vue";
import {
  NAV_MENU_ITEMS,
  NAV_SECTION_ORDER,
  getNavVisibleSections,
  fetchUserLevel,
} from "@/composables/useMenuPermissions.js";
import { useNotification } from "@/composables/Project/useNotification.js";

// Badge đếm lịch giao chưa đọc trên menu Dự án
const { unreadCount } = useNotification();
const navBadge = (value) => (value === "Project" ? unreadCount.value || 0 : 0);

// temporary=true: mobile drawer (điều khiển từ ngoài qua v-model:open)
const props = defineProps({
  temporary: { type: Boolean, default: false },
  open: { type: Boolean, default: true },
});
const emit = defineEmits(["update:open"]);

// Thu gọn drawer (desktop): nhớ lựa chọn, mobile luôn mở rộng
const collapsed = ref(false);
try {
  collapsed.value = localStorage.getItem("nav-collapsed") === "1";
} catch {
  /* bỏ qua */
}
const isMini = computed(() => !props.temporary && collapsed.value);
const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
  try {
    localStorage.setItem("nav-collapsed", collapsed.value ? "1" : "0");
  } catch {
    /* bỏ qua */
  }
};
const drawerOpen = computed({
  get: () => (props.temporary ? props.open : true),
  set: (v) => emit("update:open", v),
});

const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const UserInfo = ref(null);
const LevelUser = ref("");

const Date_Expired = ref("");

// Dialog
const DialogLoading = ref(false);
const DialogFailed = ref(false);


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

const visibleSections = ref(new Set());

const FetchUser = async () => {
  if (UserInfo.value) {
    try {
      LevelUser.value = await fetchUserLevel();
      localStorage.setItem("LevelUser", LevelUser.value);
      visibleSections.value = getNavVisibleSections(LevelUser.value);

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

const menuItems = computed(() => NAV_MENU_ITEMS);

const itemsOf = (group) =>
  menuItems.value.filter((item) => {
    if (item.group !== group) return false;
    if (item.adminOnly && LevelUser.value !== "Admin") return false;
    return true;
  });

// Gom nhóm menu để render 1 vòng lặp duy nhất
const menuSections = computed(() =>
  NAV_SECTION_ORDER.map((title) => ({
    title,
    visible: visibleSections.value.has(title),
    items: itemsOf(title),
  })),
);
</script>

<style lang="scss" scoped>
/* Sidebar: surface sáng, active pill CAM khi chọn (điểm nhấn thương hiệu).
   Dark-safe qua theme vars. */
.app-nav-brand {
  height: 64px;
}

.app-brand-avatar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

/* Chữ ERP ST gradient cam thương hiệu */
.app-brand-name {
  background: var(--app-brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
}

:deep(.nav-menu .v-list-item) {
  margin: 2px 0;
}

:deep(.app-nav-active) {
  background: rgba(210, 105, 30, 0.12) !important;
  color: #c2570b !important;
  font-weight: 600;
}

:deep(.app-nav-active .v-icon) {
  color: #c2570b !important;
}

:deep(.v-list-subheader) {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-height: 28px !important;
}
</style>

<style>
.app-nav {
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  overflow: visible !important;
}

/* Rail mini: ẩn chữ ERP ST, căn logo giữa.
   Để ở block unscoped vì class rail nằm trên chính root drawer
   (scoped :deep không khớp trường hợp này). */
.v-navigation-drawer--rail .app-brand-name {
  display: none !important;
}

.v-navigation-drawer--rail .app-nav-brand {
  justify-content: center !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* Active cam trên nền tối: sáng lên để đủ contrast */
.v-theme--dark .app-nav .app-nav-active {
  background: rgba(255, 149, 0, 0.16) !important;
  color: #ffb74d !important;
}
.v-theme--dark .app-nav .app-nav-active .v-icon {
  color: #ffb74d !important;
}

/* Nút thu gọn nổi nửa ngoài mép phải, giữa dọc */
.app-nav-collapse {
  position: absolute !important;
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}
</style>
