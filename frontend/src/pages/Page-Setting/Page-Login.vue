<template lang="">
  <v-container fluid class="login-container pa-0">
    <v-row no-gutters style="min-height: 100vh">
      <v-col cols="12" md="6" class="d-none d-md-flex">
        <div class="login-image-container">
          <div class="login-image-overlay">
            <h3 class="text-h3 font-weight-bold mb-4 gradient-text">Chào mừng đến với ERP System</h3>
            <p class="text-h6 ">Quản lý và theo dõi thông tin một cách hiệu quả</p>
          </div>
        </div>
      </v-col>
      <v-col cols="12" md="6" class="d-flex align-center justify-center">
        <v-card class="login-card" elevation="12" rounded="xl" width="100%" max-width="500">
          <!-- Logo/Branding Section -->
          <div class="text-center pa-8">
            <v-avatar size="80" color="primary" class="mb-4">
              <v-img src="https://sieuthuat.vn/wp-content/uploads/2019/06/logo-ST-_-original-02-1.png"></v-img>
            </v-avatar>
            <h1 class="text-h4 font-weight-bold mb-2">Đăng Nhập</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Vui lòng đăng nhập để tiếp tục</p>
          </div>

          <v-card-text class="pa-8">
            <v-form @submit.prevent="login" class="mt-4">
              <InputField
                v-model="Username"
                label="Tên đăng nhập"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                class="mb-4"
                density="comfortable"
                bg-color="surface"
              />
              <InputField
                v-model="Password"
                :type="showPassword ? 'text' : 'password'"
                label="Mật khẩu"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                class="mb-2"
                density="comfortable"
                bg-color="surface"
              />
              

              <v-alert
                v-if="TextError"
                type="error"
                variant="tonal"
                class="mb-4"
                density="comfortable"
                rounded="lg"
              >
                {{ TextError }}
              </v-alert>

              <v-btn
                block
                size="large"
                color="primary"
                type="submit"
                :loading="DialogLoading"
                class="text-none font-weight-medium"
                rounded="lg"
                elevation="2"
              >
                Đăng Nhập
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <Loading v-model="DialogLoading" />
</template>

<script setup>
import axios from "axios";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import InputField from "@/components/Input-Field.vue";
import Loading from "@/components/Loading.vue";

const router = useRouter();
const Url = import.meta.env.VITE_API_URL;
const Username = ref("");
const Password = ref("");
const DialogLoading = ref(false);
const TextError = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);

const login = async () => {
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
    TextError.value = err.response.data.error;
    DialogLoading.value = false;
  }
};

const forgotPassword = () => {
  // Implement forgot password functionality
  console.log("Forgot password clicked");
};

const FetchUser = async () => {
  try {
    const res = await fetch(`${Url}/All-Users/${Username.value}`);
    const Detail_User = await res.json();
    const LevelUser = Detail_User[0].Level;
    if (LevelUser == "Admin" || LevelUser == "Kế hoạch" || LevelUser == "Quản lý") {
      router.push(`/Kiem-tra-so-lieu`);
      DialogLoading.value = false;
    } else if(LevelUser == "Kinh doanh" || LevelUser == "Thủ kho" || LevelUser == "Quản lý kinh doanh") {
      DialogLoading.value = false;
      router.push(`/Ton-kho`);
    } else if (LevelUser == 'Nhân viên'){
      DialogLoading.value = false;
      router.push(`/Danh-sach-cong-viec`);
    } else if (LevelUser == 'Quản lý sản xuất'){
      DialogLoading.value = false;
      router.push(`/San-xuat`);
    } else if (LevelUser == 'Quản lý bảo trì'){
      DialogLoading.value = false;
      router.push(`/Bao-tri`);
    } else{
      router.push(`/`);
      DialogLoading.value = false;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    DialogLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, var(--v-theme-surface) 0%, var(--v-theme-background) 100%);
}

.login-card {
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.login-image-container {
  height: 100vh;
  width: 100%;
  position: relative;
  background: linear-gradient(45deg, var(--v-theme-primary) 0%, var(--v-theme-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-image-overlay {
  padding: 2rem;
  text-align: center;
  max-width: 80%;
}

:deep(.v-field) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

:deep(.v-field:hover) {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

:deep(.v-btn) {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.5px;
}

:deep(.v-checkbox .v-label) {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.gradient-text {
  background: linear-gradient(45deg, #ff4d4d 0%, #ffd700 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.gradient-text-subtitle {
  background: linear-gradient(45deg, #ff6b6b 0%, #ffeb3b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  font-weight: 500;
  letter-spacing: 0.3px;
}
</style>
