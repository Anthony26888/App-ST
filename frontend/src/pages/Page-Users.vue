<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title>
      <ButtonBack to="/Cai-dat" />
    </v-card-title>
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách người sử dụng
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <p class="text-subtitle-1">Có {{ users.length }} đơn hàng</p>
      <v-spacer></v-spacer>
      <InputSearch v-model="search" />
    </v-card-title>
    <v-card-text>
      <v-data-table :headers="headers" :items="users" :search="search">
        <template v-slot:item.id="{ value }">
          <v-btn
            icon="mdi-delete"
            size="xl"
            color="red"
            variant="text"
            @click="
              DialogRemove = true;
              ID_User = value;
            "
          ></v-btn>
        </template>
        <template v-slot:bottom>
          <div class="text-center pt-2">
            <v-pagination
              v-model="page"
              :length="Math.ceil(users.length / this.itemsPerPage)"
            ></v-pagination>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
  <SnackbarSuccess v-model="DialogSuccess" />
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá thành viên này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveUser(ID_User)" />
      </template>
    </v-card>
  </v-dialog>
</template>
<script setup>
import axios from "axios";
import { useSocket } from "@/composables/useWebSocket";
import InputSearch from "@/components/Input-Search.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonBack from "@/components/Button-Back.vue";
const { users } = useSocket();
</script>
<script>

export default {
  data() {
    return {
      search: "",
      headers: [
        {
          align: "start",
          key: "Username",
          title: "Tài khoản",
        },
        { key: "FullName", title: "Tên người dùng" },
        { key: "Email", title: "Email" },
        { key: "Level", title: "Phân quyền" },
        { key: "Date", title: "Ngày tạo" },
        { key: "id", title: "Sửa" },
      ],
      Users: [],
      ID_User: null,
      DialogRemove: false,
      DialogSuccess : false,
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {
    async RemoveUser(value) {
      this.Reset()
      axios
        .delete(`${import.meta.env.VITE_API_URL}/Users/delete-user/${value}`)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    Reset(){
      this.DialogRemove = false,
      this.DialogSuccess = true
    }
  },
};
</script>
<style lang=""></style>
