<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Cai-dat" />
      <p class="text-h4 font-weight-light ms-3">Đăng ký thành viên</p>
    </v-card-title>
    <v-container>
      <v-card-text>
        <InputField label="Tên đăng nhập" v-model="Username" />
        <InputField label="Tên người dùng" v-model="FullName" />
        <InputField label="Mật khẩu" type="password" v-model="Password" />
        <InputField label="Email" v-model="Email" />
        <v-select
          label="Phân quyền"
          :items="['Admin', 'Kế hoạch', 'Thủ kho', 'Kinh doanh', 'Quản lý']"
          variant="solo-filled"
          v-model="Level"
        ></v-select>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-btn
          @click="
            Register();
          "
          block
          variant="tonal"
          color="primary"
        >
          Đăng ký
        </v-btn>
      </v-card-actions>
    </v-container>
  </v-card>
  <SnackbarSuccess v-model="DialogSuccess" />
</template>
<script setup>
import axios from "axios";
import ButtonBack from "@/components/Button-Back.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import InputField from "@/components/Input-Field.vue";
</script>
<script>

export default {
  components:{
    ButtonBack,
    SnackbarSuccess,
    InputField
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      Username: "",
      FullName: "",
      Password: "",
      Email: "",
      Level: "",
      Date: "",
      DialogSuccess: false,
    };
  },
  created() {
    this.DateNow();
  },
  methods: {
    DateNow() {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const year = String(now.getFullYear()).slice(-2);
      this.Date = `${day}/${month}/${year}`;
    },
    async Register() {
      const Item = {
        Username: this.Username,
        FullName: this.FullName,
        Password: this.Password,
        Email: this.Email,
        Level: this.Level,
        Date: this.Date,
      };
      this.Reset()
      axios
        .post(`${this.Url}/Users/register`, Item)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    Reset(){
      this.DialogSuccess = true,
      this.Username = "",
      this.Password = "",
      this.Email = ""
      this.Level = "",
      this.FullName = ""
    }
  },
};
</script>
<style lang=""></style>
