<template lang="">
  <v-empty-state width="100%">
    <v-card class="mx-auto my-auto" color="grey-lighten-4" width="400">
      <v-toolbar color="primary" flat>
        <v-btn icon="mdi-account"></v-btn>

        <v-toolbar-title class="font-weight-light"
          >Đăng ký thành viên</v-toolbar-title
        >
      </v-toolbar>

      <v-card-text>
        <v-text-field
          variant="solo-filled"
          label="Tên đăng nhập"
          clearable
          v-model="Username"
        ></v-text-field>

        <v-text-field
          variant="solo-filled"
          label="Tên người dùng"
          clearable
          v-model="FullName"
        ></v-text-field>

        <v-text-field
          variant="solo-filled"
          label="Mật khẩu"
          type="password"
          clearable
          v-model="Password"
        ></v-text-field>

        <v-select
          label="Phân quyền"
          :items="['Admin', 'Kế hoạch', 'Thủ kho']"
          variant="solo-filled"
          v-model="Level"
        ></v-select>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-btn @click="Register(); DialogSuccess = true" block variant="tonal" color="primary">
          Đăng ký
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-empty-state>
  <v-dialog v-model="DialogSuccess">
    <v-card width="500" height="400" class="mx-auto">
      <v-empty-state icon="$success">
        <template v-slot:media>
          <v-icon color="success"></v-icon>
        </template>

        <template v-slot:headline>
          <div class="text-h4">Thành Công</div>
        </template>

        <template v-slot:text>
          <div class="text-medium-emphasis text-caption">
            Dữ liệu đã được nhập vào hệ thống
          </div>
        </template>
        <template v-slot:actions>
          <v-btn
            class="text-none"
            color="primary"
            elevation="1"
            rounded="lg"
            size="small"
            text="Tiếp tục"
            width="96"
            @click="
              Username= '';
              FullName= '';
              Password= '';
              Level= '';
              DialogSuccess = false;
            "
          ></v-btn>
        </template>
      </v-empty-state>
    </v-card>
  </v-dialog>
</template>
<script setup>
import axios from "axios";
</script>
<script>
export default {
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      Username: "",
      FullName: "",
      Password: "",
      Level: "",
      Date: "",
      DialogSuccess:false
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
        Level: this.Level,
        Date: this.Date,
      };
      axios
        .post(`${this.Url}/Users/register`, Item)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
};
</script>
<style lang=""></style>
