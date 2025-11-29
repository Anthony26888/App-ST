<template lang="">
  <v-container fluid class="login-container pa-0">
    <v-row no-gutters style="min-height: 100vh">
      <!-- Left Section - Brand & Features -->
      <v-col cols="12" md="7" class="d-none d-md-flex">
        <div class="login-image-container">
          <div class="animated-bg"></div>
          
          <div class="login-image-overlay">
            <div class="brand-section mb-12">
              <!-- Logo -->
              <div class="logo-container mb-6">
                <v-img src="@/assets/avatar-ST.jpg" width="120" height="120" class="logo-animate mx-auto"></v-img>
              </div>
              
              <h2 class="text-h3 font-weight-700 text-white mb-3 brand-text">SUPER TEC ERP</h2>
              <p class="text-h6 text-white opacity-90">Giải pháp quản lý doanh nghiệp toàn diện</p>
            </div>

            <!-- Features Grid -->
            <div class="features-grid">
              <div class="feature-item">
                <div class="feature-icon">
                  <v-icon size="28" color="white">mdi-speedometer</v-icon>
                </div>
                <div class="feature-text text-left">
                  <p class="font-weight-600 text-white">Hiệu năng cao</p>
                  <p class="text-caption text-white opacity-75">Xử lý dữ liệu nhanh chóng</p>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">
                  <v-icon size="28" color="white">mdi-security</v-icon>
                </div>
                <div class="feature-text text-left">
                  <p class="font-weight-600 text-white">Bảo mật</p>
                  <p class="text-caption text-white opacity-75">Mã hóa dữ liệu đầu cuối</p>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">
                  <v-icon size="28" color="white">mdi-chart-line</v-icon>
                </div>
                <div class="feature-text text-left">
                  <p class="font-weight-600 text-white">Phân tích dữ liệu</p>
                  <p class="text-caption text-white opacity-75">Báo cáo chi tiết realtime</p>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">
                  <v-icon size="28" color="white">mdi-sync</v-icon>
                </div>
                <div class="feature-text text-left">
                  <p class="font-weight-600 text-white">Đồng bộ dữ liệu</p>
                  <p class="text-caption text-white opacity-75">Cập nhật thời gian thực</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Right Section - Login Form -->
      <v-col cols="12" md="5" class="d-flex align-center justify-center pa-4 pa-md-8">
        <v-card 
          class="login-card rounded-xl" 
          :elevation="mdAndDown ? 0 : 6"
          rounded="2xl" 
          width="100%" 
          max-width="450"
        >
          <!-- Header with Logo -->
          <!-- <div class="card-header pa-8 pb-6">
            <div class="text-center">
              <div class="mini-logo-container mb-4">
                <v-img src="@/assets/avatar-ST.jpg" width="80" height="80" class="logo-animate-mini mx-auto"></v-img>
              </div>
              <h1 class="text-h5 font-weight-700 mb-1 text-white">SUPER TEC ERP</h1>
              <p class="text-subtitle-2 text-white opacity-90">Hệ thống quản lý hiệu quả</p>
            </div>
          </div> -->

          <!-- Main Title -->
          <v-card-text class="pa-8 pb-4">
            <h2 class="text-h4 font-weight-700 mb-1">Đăng Nhập</h2>
            <p class="text-subtitle-2 text-medium-emphasis">Truy cập hệ thống quản lý của bạn</p>
          </v-card-text>

          <v-divider class="mx-8"></v-divider>

          <!-- Form -->
          <v-card-text class="pa-8">
            <v-form @submit.prevent="login" class="mt-4">
              <!-- Username Field -->
              <div class="mb-4">
                <label class="text-subtitle-2 font-weight-600 d-block mb-2">Tên đăng nhập</label>
                <InputField
                  v-model="Username"
                  placeholder="Nhập tên đăng nhập"
                  prepend-inner-icon="mdi-account-circle-outline"
                  variant="outlined"
                  density="comfortable"
                  bg-color="rgba(165,42,42,0.02)"
                  class="custom-input"
                  @keyup.enter="login"
                />
              </div>

              <!-- Password Field -->
              <div class="mb-6">
                <!-- <div class="d-flex justify-space-between align-center mb-2">
                  <label class="text-subtitle-2 font-weight-600">Mật khẩu</label>
                  <a href="#" class="text-caption font-weight-500" style="color: #A52A2A;">Quên mật khẩu?</a>
                </div> -->
                <InputField
                  v-model="Password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Nhập mật khẩu"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  @click:append-inner="showPassword = !showPassword"
                  variant="outlined"
                  density="comfortable"
                  bg-color="rgba(165,42,42,0.02)"
                  class="custom-input"
                  @keyup.enter="login"
                />
              </div>

              <!-- Error Alert -->
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

              <!-- Login Button -->
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
                {{ DialogLoading ? 'Đang xử lý...' : 'Đăng Nhập' }}
              </v-btn>
            </v-form>
          </v-card-text>

          <!-- Footer -->
          <v-card-text class="pa-8 pt-0 text-center text-caption text-medium-emphasis">
            © 2025 SUPER TEC ERP. All rights reserved.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <Loading v-model="DialogLoading" />
</template>

<script setup>
import axios from "axios";
import { ref } from "vue";
import { useRouter } from "vue-router";
import InputField from "@/components/Input-Field.vue";
import Loading from "@/components/Loading.vue";
import { useDisplay } from 'vuetify'

const { mdAndDown } = useDisplay()

const router = useRouter();
const Url = import.meta.env.VITE_API_URL;
const Username = ref("");
const Password = ref("");
const DialogLoading = ref(false);
const TextError = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);

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
    if (rememberMe.value) {
      localStorage.setItem("rememberedUser", Username.value);
    }
    FetchUser();
  } catch (err) {
    TextError.value = err.response?.data?.error || "Đăng nhập thất bại. Vui lòng thử lại.";
    DialogLoading.value = false;
  }
};

const FetchUser = async () => {
  try {
    const res = await fetch(`${Url}/All-Users/${Username.value}`);
    const Detail_User = await res.json();
    const LevelUser = Detail_User[0].Level;
    
    const routes = {
      "Admin": { path: "/Kiem-tra-so-lieu", title: "Kiểm tra số liệu" },
      "Kế hoạch": { path: "/Kiem-tra-so-lieu", title: "Kiểm tra số liệu" },
      "Quản lý": { path: "/Kiem-tra-so-lieu", title: "Kiểm tra số liệu" },
      "Kinh doanh": { path: "/Ton-kho", title: "Tồn kho" },
      "Thủ kho": { path: "/Ton-kho", title: "Tồn kho" },
      "Quản lý kinh doanh": { path: "/Ton-kho", title: "Tồn kho" },
      "Nhân viên": { path: "/Danh-sach-cong-viec", title: "Danh sách công việc" },
      "Quản lý sản xuất": { path: "/San-xuat", title: "Sản xuất" },
      "Quản lý bảo trì": { path: "/Bao-tri", title: "Bảo trì" },
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
.login-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  min-height: 100vh;
}

.login-image-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #A52A2A 0%, #D2691E 50%, #FF9500 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.animated-bg {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: moveBackground 20s linear infinite;
  top: -50%;
  left: -50%;
}

@keyframes moveBackground {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.login-image-overlay {
  position: relative;
  z-index: 2;
  padding: 4rem 2rem;
  text-align: center;
  max-width: 90%;
}

.brand-section {
  animation: slideInDown 0.8s ease-out;
}

.logo-container {
  display: inline-block;
  animation: bounce 2s infinite;
}

.logo-animate {
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
  border-radius: 50%;
}

.brand-text {
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 3rem;
}

.feature-item {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease-out forwards;
  opacity: 0;
}

.feature-item:nth-child(1) { animation-delay: 0.2s; }
.feature-item:nth-child(2) { animation-delay: 0.3s; }
.feature-item:nth-child(3) { animation-delay: 0.4s; }
.feature-item:nth-child(4) { animation-delay: 0.5s; }

.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-5px);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-text {
  text-align: left;
}

.login-card {
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  animation: slideInUp 0.8s ease-out;
}

.card-header {
  background: linear-gradient(135deg, #A52A2A 0%, #D2691E 50%, #FF9500 100%);
  color: white;
  border-radius: 2xl 2xl 0 0;
  position: relative;
  overflow: hidden;
}

.card-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 200%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  animation: shimmer 3s infinite;
}

.mini-logo-container {
  display: inline-block;
  position: relative;
  z-index: 2;
}

.logo-animate-mini {
  animation: pulse-rotate 3s ease-in-out infinite;
}

.btn-login {
  background: linear-gradient(135deg, #A52A2A 0%, #D2691E 100%);
  color: white;
}

.btn-login:hover {
  background: linear-gradient(135deg, #8B2222 0%, #CD6600 100%);
  transform: translateY(-2px);
}

@keyframes shimmer {
  0% { left: -50%; }
  100% { left: 100%; }
}

@keyframes pulse-rotate {
  0%, 100% { transform: scale(1) rotateZ(0deg); }
  50% { transform: scale(1.05) rotateZ(2deg); }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

:deep(.custom-input .v-field) {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1.5px solid rgba(165, 42, 42, 0.15);
}

:deep(.custom-input .v-field:hover) {
  border-color: rgba(165, 42, 42, 0.3);
  background-color: rgba(165, 42, 42, 0.03);
}

:deep(.custom-input .v-field.v-field--focused) {
  border-color: #A52A2A;
  background-color: rgba(165, 42, 42, 0.05);
  box-shadow: 0 0 0 3px rgba(165, 42, 42, 0.1);
}

:deep(.v-btn) {
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
}

:deep(.v-btn:hover) {
  transform: translateY(-2px);
}

:deep(.v-checkbox .v-label) {
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
}

:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.08);
}

@media (max-width: 960px) {
  .login-container {
    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  }

  .login-card {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  }

  .card-header {
    background: linear-gradient(135deg, #A52A2A 0%, #D2691E 50%, #FF9500 100%);
    padding: 2rem;
  }
}
</style>