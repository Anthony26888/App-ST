<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
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
              >Xoá toàn bộ dữ liệu Bom</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="primary"
            value="option-4"
            @click="DialogRemoveWareHouse = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-store-remove"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu kho</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="primary"
            value="option-5"
            @click="DialogRemoveWareHouse2 = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-store-remove"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu kho 2</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="primary"
            value="option-6"
            @click="DialogRemoveProject = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-store-remove"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu dự án</v-list-item-title
            >
          </v-list-item>
        </v-list>
      </v-container>
    </v-card-text>
  </v-card>

  <v-dialog v-model="DialogRemoveWareHouse" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu kho ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveWareHouse = false" />
        <ButtonDelete @delete="RemoveWareHouse()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveWareHouse2" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu kho 2?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveWareHouse2 = false" />
        <ButtonDelete @delete="RemoveWareHouse2()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveCheckBOM" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu Bom ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveCheckBOM = false" />
        <ButtonDelete @delete="RemoveCheckBOM()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveProject" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu dự án ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveProject = false" />
        <ButtonDelete @delete="RemoveProject()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarFailed v-model="DialogFailed" />
</template>
<script setup>
import axios from "axios";
import { ref, watch } from "vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
const Url = import.meta.env.VITE_API_URL;
const DialogRemoveWareHouse = ref(false);
const DialogRemoveWareHouse2 = ref(false);
const DialogRemoveCheckBOM = ref(false);
const DialogRemoveProject = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const RemoveWareHouse = async () => {
  axios
    .delete(`${Url}/WareHouse/delete-all`)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const RemoveWareHouse2 = async () => {
  axios
    .delete(`${Url}/WareHouse2/delete-all`)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const RemoveCheckBOM = async () => {
  axios
    .delete(`${Url}/CheckBOM/delete-all`)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};

const RemoveProject = async () => {
  axios
    .delete(`${Url}/Project/delete-all`)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
function Reset() {
  DialogSuccess.value = true;
  DialogRemoveWareHouse.value = false;
  DialogRemoveWareHouse2.value = false;
  DialogRemoveCheckBOM.value = false;
  DialogRemoveProject.value = false;
}
function Error() {
  DialogFailed.value = true;
}
</script>
<script>
export default {
  components: {
    ButtonDelete,
    ButtonCancel,
    SnackbarSuccess,
    SnackbarFailed,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang=""></style>
