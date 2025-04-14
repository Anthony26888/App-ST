<template lang="">
  <v-empty-state width="100%">
    <v-card class="mx-auto my-auto" color="grey-lighten-4" width="400">
      <v-toolbar color="#18222D" flat>
        <v-btn icon="mdi-account"></v-btn>

        <v-toolbar-title class="font-weight-light">Đăng nhập </v-toolbar-title>
      </v-toolbar>

      <v-card-text>
        <InputField v-model="Username" label="Tên đăng nhập" />
        <InputField v-model="Password" type="password" label="Mật khẩu" />
        <p v-if="error != ''" class="text-red">{{ error }}</p>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-btn @click="login()" block variant="tonal" bg-color="#18222D">
          Đăng nhập
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-empty-state>
</template>
<script setup>
import axios from "axios";
import InputField from "@/components/Input-Field.vue";
// Tạo interceptor kiểm tra lỗi từ server
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token hết hạn hoặc không hợp lệ, tự động đăng xuất...");

      // Xóa token và chuyển hướng về trang login
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);
</script>
<script>
export default {
  components :{
    InputField
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      Username: "",
      Password: "",
      error: "",
      DialogFailed: true,
    };
  },
  methods: {
    async login() {
      try {
        const res = await axios.post(`${this.Url}/Users/login`, {
          Username: this.Username,
          Password: this.Password,
        });

        localStorage.setItem("token", res.data.token);
        this.FetchUser();
      } catch (err) {
        this.error = err.response.data.error;
      }
    },
    async FetchUser() {
      try {
        const res = await fetch(`${this.Url}/All-Users/${this.Username}`);
        const Detail_User = await res.json();
        const LevelUser = Detail_User[0].Level;
        if (LevelUser == "Admin" || LevelUser == "Kế hoạch") {
          this.$router.push(`/Kiem-tra-so-lieu`);
        } else {
          this.$router.push(`/Ton-kho`);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
  },
};
</script>
<style lang=""></style>
