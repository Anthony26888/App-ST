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
        :disabled="Status_Option_1"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi mdi-warehouse"
        title="Tồn Kho"
        value="WareHouse"
        to="/Ton-kho"
        :disabled="Status_Option_2"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi mdi-warehouse"
        title="Tồn Kho 2"
        value="WareHouse2"
        to="/Ton-kho-2"
        :disabled="Status_Option_3"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi mdi-order-bool-descending-variant"
        title="Tình tạng đơn hàng"
        value="Orders"
        to="/Don-hang"
        :disabled="Status_Option_4"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi mdi-notebook-multiple"
        title="Dự án"
        value="Project"
        to="/Du-an"
        :disabled="Status_Option_5"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-cog"
        title="Cài đặt"
        value="Setting"
        to="/Cai-dat"
        :disabled="Status_Option_6"
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
      Status_Option_1:false,
      Status_Option_2:false,
      Status_Option_3:false,
      Status_Option_4:false,
      Status_Option_5:false,
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
      localStorage.removeItem("CustomersID");
      localStorage.removeItem("PO");
      this.$router.push('/')
    },
    async FetchUser() {
      if (this.UserInfo) {
        try {
          const res = await fetch(`${this.Url}/All-Users/${this.UserInfo}`);
          const Detail_User = await res.json();
          this.LevelUser = Detail_User[0].Level;
          if(this.LevelUser == 'Kinh doanh'){
            this.Status_Option_1=true,
            this.Status_Option_4=true,
            this.Status_Option_6=true
          }else if(this.LevelUser == 'Thủ kho'){
            this.Status_Option_1=true,
            this.Status_Option_5=true,
            this.Status_Option_6=true
          }else if(this.LevelUser == 'Kế hoạch'){
            this.Status_Option_2=true,
            this.Status_Option_3=true,
            this.Status_Option_5=true,
            this.Status_Option_6=true
          }else if(this.LevelUser == 'Quản lý'){
            this.Status_Option_5=true,
            this.Status_Option_6=true
          }else if(this.LevelUser == 'Admin'){
            this.Status_Option_1=false,
            this.Status_Option_2=false,
            this.Status_Option_3=false,
            this.Status_Option_4=false,
            this.Status_Option_5=false,
            this.Status_Option_6=false 
          }else{
            this.Status_Option_1=true,
            this.Status_Option_2=true,
            this.Status_Option_3=true,
            this.Status_Option_4=true,
            this.Status_Option_6=true,
            this.Status_Option_5=true
          };
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
