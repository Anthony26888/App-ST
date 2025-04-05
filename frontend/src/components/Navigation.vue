<template lang="">
  <v-navigation-drawer theme="light" permanent color="#18222D">
    <template v-slot:prepend>
      <v-list-item
        lines="two"
        prepend-avatar="https://sieuthuat.vn/wp-content/uploads/2019/06/logo-ST-_-original-02-1.png"
      >
        <template v-slot:title>
          <p class="text-h6 font-weight-light ms-3">{{ UserInfo }}</p>
        </template>
        <template v-slot:subtitle>
          <p class="ms-3">{{ LevelUser }}</p>
        </template>
      </v-list-item>
    </template>
    <v-divider></v-divider>
    <v-list nav>
      <v-list-item
        prepend-icon="mdi mdi-cart-arrow-down"
        title="Kiểm tra số liệu"
        value="Check"
        to="/Kiem-tra-so-lieu"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi mdi-warehouse"
        title="Tồn Kho"
        value="WareHouse"
        to="/Ton-kho"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi mdi-order-bool-descending-variant"
        title="Tình tạng đơn hàng"
        value="Orders"
        to="/Don-hang"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-cog"
        title="Cài đặt"
        value="Setting"
        to="/Cai-dat"
      ></v-list-item>
    </v-list>
    <template v-slot:append>
      <div class="pa-2">
        <v-btn block @click="LogOut()" class="text-caption"> Đăng xuất </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>
<script setup>
import { jwtDecode } from "jwt-decode";
</script>
<script>
export default {
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      UserInfo: null,
      LevelUser: "",
      Date_Expired: "",
    };
  },
  mounted() {
    this.getUserInfo();
    this.FetchUser();
  },
  methods: {
    getUserInfo() {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        this.UserInfo = decoded.Username;
        this.Date_Expired = new Date(decoded.exp * 1000);
      } else {
        console.log("Không tìm thấy token!");
      }
    },
    LogOut() {
      localStorage.removeItem("token");
      this.$router.push('/')
    },
    async FetchUser() {
      if (this.UserInfo) {
        try {
          const res = await fetch(`${this.Url}/All-Users/${this.UserInfo}`);
          const Detail_User = await res.json();
          this.LevelUser = Detail_User[0].Level;
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        this.Error = "Lỗi hệ thống. Thoát ra và đăng nhập lại";
      }
    },
  },
};
</script>
<style lang=""></style>
