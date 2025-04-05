<template lang="">
  <v-card
    variant="text"
    class="overflow-y-auto"
    height="100vh"
  >
    <v-card-title class="text-h4 font-weight-light">Cài đặt</v-card-title>
    <v-card-text>
      <v-container>
        <v-list density="compact">
          <v-list-subheader>Thành viên sử dụng phần mềm</v-list-subheader>

          <v-list-item
            color="primary"
            value="option-1"
            to="/Cai-dat/Danh-sach-thanh-vien"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-account-group"></v-icon>
            </template>

            <v-list-item-title>Danh sách thành viên</v-list-item-title>
          </v-list-item>
          <v-list-item
            color="primary"
            value="option-2"
            to="/Cai-dat/Dang-ky-thanh-vien"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-account-multiple-plus"></v-icon>
            </template>

            <v-list-item-title>Thêm thành viên mới</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-subheader>Chỉnh sửa dữ liệu hệ thống</v-list-subheader>
          <v-list-item
            color="primary"
            value="option-3"
            @click="DialogRemoveCheckBOM = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-delete-forever"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu dự án</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="primary"
            value="option-5"
            @click="DialogRemoveInventory = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-store-remove"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu kho</v-list-item-title
            >
          </v-list-item>
        </v-list>
      </v-container>
    </v-card-text>
  </v-card>

  <v-dialog v-model="DialogRemoveInventory" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu dự án ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveInventory = false" />
        <ButtonDelete @delete="RemoveInventory()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveCheckBOM" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu kho ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveCheckBOM = false" />
        <ButtonDelete @delete="RemoveCheckBOM()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" />
</template>
<script setup>
import axios from "axios";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
</script>
<script>
export default {
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      DialogRemoveInventory: false,
      DialogRemoveCheckBOM: false,
      DialogSuccess : false
    };
  },
  methods: {
    async RemoveInventory() {
      this.Reset()
      axios
        .delete(`${this.Url}/Inventory/delete-all`)
        .then(function (response) {
          console.log(response);
          this.DialogRemove = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async RemoveCheckBOM() {
      this.Reset()
      axios
        .delete(`${this.Url}/CheckBOM/delete-all`)
        .then(function (response) {
          console.log(response);
          this.DialogRemove = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    Reset(){
      this.DialogRemoveInventory = false,
      this.DialogRemoveCheckBOM = false,
      this.DialogSuccess = true
    }
  },
};
</script>
<style lang=""></style>
