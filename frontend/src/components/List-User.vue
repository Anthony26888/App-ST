<template lang="">
  <v-text-field
    v-model="search"
    label="Tìm kiếm"
    prepend-inner-icon="mdi-magnify"
    variant="outlined"
    hide-details
    single-line
  ></v-text-field>
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
        <v-pagination v-model="page" :length="Math.ceil(users.length / this.itemsPerPage)"></v-pagination>
      </div>
    </template>
  </v-data-table>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá thành viên này ? </v-card-text>
      <template v-slot:actions>
        <v-btn @click="DialogRemove = false" variant="tonal">Huỷ</v-btn>
        <v-btn
          class="bg-red"
          @click="
            RemoveUser(ID_User);
            DialogRemove = false;
          "
          >Xoá</v-btn
        >
      </template>
    </v-card>
  </v-dialog>
</template>
<script setup>
import axios from "axios";
import { useSocket } from "@/composables/useWebSocket";

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
        { key: "Level", title: "Phân quyền" },
        { key: "Date", title: "Ngày tạo" },
        { key: "id", title: "Sửa" },
      ],
      Users: [],
      ID_User: null,
      DialogRemove: false,
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {
    async RemoveUser(value) {
      axios
        .delete(`${import.meta.env.VITE_API_URL}/Users/delete-user/${value}`)
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
