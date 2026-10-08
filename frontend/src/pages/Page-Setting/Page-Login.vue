<template lang="">
  <v-container fluid class="login-root pa-0">
    <!-- Nút theme nổi -->
    <div class="login-theme-btn">
      <ThemeToggle />
    </div>

    <v-row no-gutters class="login-row">
      <!-- Left: Brand panel (desktop) -->
      <v-col cols="12" lg="6" class="d-none d-lg-flex">
        <div class="login-brand">
          <div class="login-glow login-glow-a"></div>
          <div class="login-glow login-glow-b"></div>

          <!-- Brand header -->
          <div class="login-brand-top">
            <v-avatar size="44" rounded="lg" class="login-logo">
              <v-img src="@/assets/avatar-ST.jpg" alt="SUPER TEC ERP"></v-img>
            </v-avatar>
            <span class="login-brand-name">SUPER TEC ERP</span>
            <v-spacer></v-spacer>
            <v-chip size="small" variant="outlined" color="white" class="text-caption">
              v2.0 ERP
            </v-chip>
          </div>

          <!-- Hero -->
          <div class="login-hero">
            <v-chip size="small" class="mb-4 login-hero-badge">
              <v-icon start size="14">mdi-sparkles</v-icon>
              Cổng quản trị sản xuất thời gian thực
            </v-chip>
            <h1 class="login-hero-title">
              Theo dõi đơn hàng &amp; sản xuất thời gian thực.
            </h1>
            <p class="login-hero-sub">
              Quản lý PO, lịch giao hàng, tiến độ sản xuất và tồn kho —
              minh bạch, đồng bộ trong một nền tảng duy nhất.
            </p>

            <!-- Features glass -->
            <div class="login-features">
              <div
                v-for="f in features"
                :key="f.title"
                class="login-feature"
              >
                <v-avatar size="36" rounded="lg" class="login-feature-icon">
                  <v-icon size="20" color="white">{{ f.icon }}</v-icon>
                </v-avatar>
                <div class="text-left">
                  <p class="font-weight-600 text-white text-body-2 mb-0">
                    {{ f.title }}
                  </p>
                  <p class="text-caption text-white login-dim mb-0">
                    {{ f.desc }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="login-brand-foot">
            <span>© {{ currentYear }} SUPER TEC ERP. All rights reserved.</span>
          </div>
        </div>
      </v-col>

      <!-- Right: Form -->
      <v-col cols="12" lg="6" class="d-flex align-center justify-center pa-4 pa-md-8">
        <v-card
          class="login-card rounded-xl"
          :elevation="mdAndDown ? 0 : 6"
          rounded="2xl"
          width="100%"
          max-width="450"
        >
          <!-- Brand mini (mobile) -->
          <div class="d-flex d-lg-none align-center justify-center pt-8">
            <v-avatar size="56" rounded="xl">
              <v-img src="@/assets/avatar-ST.jpg" alt="SUPER TEC ERP"></v-img>
            </v-avatar>
          </div>

          <v-card-text class="pa-8 pb-4 text-center text-lg-left">
            <h2 class="text-h4 font-weight-700 mb-1">Đăng Nhập</h2>
            <p class="text-subtitle-2 text-medium-emphasis">
              Truy cập hệ thống quản lý của bạn
            </p>
          </v-card-text>

          <v-divider class="mx-8"></v-divider>

          <v-card-text class="pa-8">
            <v-form @submit.prevent="login" class="mt-4">
              <div class="mb-4">
                <label class="text-subtitle-2 font-weight-600 d-block mb-2">
                  Tên đăng nhập
                </label>
                <InputField
                  v-model="Username"
                  placeholder="Nhập tên đăng nhập"
                  prepend-inner-icon="mdi-account-circle-outline"
                  variant="outlined"
                  density="comfortable"
                  class="custom-input"
                  @keyup.enter="login"
                />
              </div>

              <div class="mb-4">
                <label class="text-subtitle-2 font-weight-600 d-block mb-2">
                  Mật khẩu
                </label>
                <InputField
                  v-model="Password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Nhập mật khẩu"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="
                    showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
                  "
                  @click:append-inner="showPassword = !showPassword"
                  variant="outlined"
                  density="comfortable"
                  class="custom-input"
                  @keyup.enter="login"
                />
              </div>

              <div class="d-flex align-center justify-space-between mb-6">
                <v-checkbox
                  v-model="rememberMe"
                  label="Ghi nhớ đăng nhập"
                  density="compact"
                  hide-details
                  color="primary"
                ></v-checkbox>
                <span class="text-caption text-medium-emphasis">
                  Quên mật khẩu? Liên hệ quản trị viên
                </span>
              </div>

              <v-alert
                v-if="TextError"
                type="error"
                variant="tonal"
                class="mb-6"
                density="comfortable"
                rounded="lg"
                closable
                @click:close="TextError = ''"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-alert-circle-outline</v-icon>
                </template>
                {{ TextError }}
              </v-alert>

              <v-btn
                block
                size="large"
                type="submit"
                :loading="DialogLoading"
                class="text-none font-weight-600 mb-3 btn-login"
                rounded="xl"
                elevation="0"
                @click="login"
              >
                <template v-slot:prepend v-if="!DialogLoading">
                  <v-icon>mdi-login</v-icon>
                </template>
                {{ DialogLoading ? "Đang xử lý..." : "Đăng Nhập" }}
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-text
            class="pa-8 pt-0 text-center text-caption text-medium-emphasis"
          >
            © {{ currentYear }} SUPER TEC ERP. All rights reserved.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="DialogKicked" max-width="400" persistent>
    <v-card>
      <v-card-text class="text-center pa-8">
        <v-icon size="56" color="warning" class="mb-3"
          >mdi-account-lock-outline</v-icon
        >
        <div class="text-h6 mb-1">Phiên đăng nhập đã kết thúc</div>
        <div class="text-body-2 text-medium-emphasis">
          Tài khoản của bạn đã đăng nhập ở máy khác. Vui lòng đăng nhập lại để
          tiếp tục sử dụng.
        </div>
      </v-card-text>
      <v-card-actions class="justify-center pb-6">
        <v-btn color="primary" rounded="xl" @click="DialogKicked = false"
          >Đăng nhập lại</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
  <Loading v-model="DialogLoading" />
</template>

<script setup>
import axios from "axios";
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import InputField from "@/components/Input-Field.vue";
import Loading from "@/components/Loading.vue";
import ThemeToggle from "@/components/Theme-Toggle.vue";
import { useDisplay } from "vuetify";

const { mdAndDown } = useDisplay();

const router = useRouter();
const Url = import.meta.env.VITE_API_URL;
const Username = ref("");
const Password = ref("");
const DialogLoading = ref(false);
const TextError = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);
const DialogKicked = ref(false);

const currentYear = computed(() => new Date().getFullYear());

const features = [
  { icon: "mdi-speedometer", title: "Hiệu năng cao", desc: "Xử lý dữ liệu nhanh chóng" },
  { icon: "mdi-security", title: "Bảo mật", desc: "Mã hóa dữ liệu đầu cuối" },
  { icon: "mdi-chart-line", title: "Phân tích dữ liệu", desc: "Báo cáo chi tiết realtime" },
  { icon: "mdi-sync", title: "Đồng bộ dữ liệu", desc: "Cập nhật thời gian thực" },
];

onMounted(() => {
  if (localStorage.getItem("sessionKicked") === "1") {
    localStorage.removeItem("sessionKicked");
    DialogKicked.value = true;
  }
  const remembered = localStorage.getItem("rememberedUser");
  if (remembered) {
    Username.value = remembered;
    rememberMe.value = true;
  }
});

const login = async () => {
  if (!Username.value || !Password.value) {
    TextError.value = "Vui lòng nhập tên đăng nhập và mật khẩu";
    return;
  }

  DialogLoading.value = true;
  const formData = {
    Username: Username.value,
    Password: Password.value,
  };

  try {
    const res = await axios.post(`${Url}/Users/login`, formData);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("SessionId", res.data.sessionId);
    localStorage.setItem("User", Username.value);
    if (rememberMe.value) {
      localStorage.setItem("rememberedUser", Username.value);
    } else {
      localStorage.removeItem("rememberedUser");
    }
    FetchUser();
  } catch (err) {
    TextError.value =
      err.response?.data?.error || "Đăng nhập thất bại. Vui lòng thử lại.";
    DialogLoading.value = false;
  }
};

const FetchUser = async () => {
  try {
    const res = await fetch(`${Url}/All-Users/${Username.value}`);
    const Detail_User = await res.json();
    const LevelUser = Detail_User[0].Level;

    const routes = {
      Admin: { path: "/Kiem-tra-so-lieu", title: "Kiểm tra số liệu" },
      "Kế hoạch": { path: "/Kiem-tra-so-lieu", title: "Kiểm tra số liệu" },
      "Quản lý": { path: "/Du-an", title: "Du-an" },
      "Kinh doanh": { path: "/Du-an", title: "Du-an" },
      "Thủ kho": { path: "/Ton-kho", title: "Tồn kho" },
      "Quản lý kinh doanh": { path: "/Du-an", title: "Du-an" },
      "Nhân viên": {
        path: "/Danh-sach-cong-viec",
        title: "Danh sách công việc",
      },
      "Quản lý sản xuất": { path: "/San-xuat", title: "Sản xuất" },
      "Quản lý bảo trì": { path: "/Danh-sach-pnp", title: "Danh sách PnP" },
      "Quản lý QC": { path: "/Danh-sach-pnp-qc", title: "Kiểm tra PnP QC" },
    };

    const route = routes[LevelUser] || { path: "/", title: "Kiểm tra số liệu" };
    router.push(route.path);
    localStorage.setItem("titleNavigation", route.title);
    DialogLoading.value = false;
  } catch (error) {
    console.error("Error fetching user data:", error);
    DialogLoading.value = false;
  }
};
</script>

<style scoped>
.login-root {
  min-height: 100dvh;
  position: relative;
}

.login-row {
  min-height: 100dvh;
}

.login-theme-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 50;
}

/* ===== Brand panel (điểm nhấn cam-brand) ===== */
.login-brand {
  position: relative;
  width: 100%;
  min-height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2.5rem 3rem;
  color: #fff;
  background: linear-gradient(135deg, #0f172a 0%, #431407 55%, #9a3412 100%);
}

.login-glow {
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  pointer-events: none;
}

.login-glow-a {
  width: 24rem;
  height: 24rem;
  top: -6rem;
  left: -6rem;
  background: rgba(210, 105, 30, 0.35);
}

.login-glow-b {
  width: 20rem;
  height: 20rem;
  bottom: -4rem;
  right: -4rem;
  background: rgba(255, 149, 0, 0.22);
}

.login-brand-top {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.login-brand-name {
  font-weight: 800;
  font-size: 1.4rem;
  letter-spacing: 0.5px;
  background: linear-gradient(90deg, #fff 20%, #fed7aa 60%, #ff9500 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent !important;
  -webkit-text-fill-color: transparent;
}

.login-hero {
  position: relative;
  z-index: 2;
  max-width: 34rem;
  animation: login-rise 0.7s ease-out;
}

.login-hero-badge {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fed7aa;
}

.login-hero-title {
  font-size: clamp(1.7rem, 2.5vw, 2.4rem);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.3px;
  color: #fff;
  margin-bottom: 1rem;
}

.login-hero-sub {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.login-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.login-feature {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  animation: login-rise 0.7s ease-out backwards;
}

.login-feature:nth-child(2) {
  animation-delay: 0.1s;
}

.login-feature:nth-child(3) {
  animation-delay: 0.2s;
}

.login-feature:nth-child(4) {
  animation-delay: 0.3s;
}

.login-feature-icon {
  background: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

.login-dim {
  opacity: 0.7;
}

.login-brand-foot {
  position: relative;
  z-index: 2;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 1rem;
}

/* ===== Form card ===== */
.login-card {
  animation: login-rise 0.7s ease-out;
}

.btn-login {
  background: linear-gradient(135deg, #a52a2a 0%, #d2691e 100%);
  color: white;
}

.btn-login:hover {
  background: linear-gradient(135deg, #8b2222 0%, #cd6600 100%);
}

@keyframes login-rise {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.custom-input .v-field) {
  border-radius: 12px;
}

:deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0.3px;
}
</style>
