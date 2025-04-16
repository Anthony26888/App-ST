<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Cai-dat" />
      <p class="text-h4 font-weight-light ms-3">Danh sách người sử dụng</p>
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <p class="text-subtitle-1">Có {{ users.length }} đơn hàng</p>
      <v-spacer></v-spacer>
      <InputSearch v-model="search" />
    </v-card-title>
    <v-card-text>
      <v-data-table :headers="headers" :items="users" :search="search">
        <template v-slot:item.id="{ value }">
          <ButtonEdit @click="GetItem(value)" />
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
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá thành viên này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveUser()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        <InputField label="Tên đăng nhập" v-model="Username_Edit" />
        <InputField label="Tên người dùng" v-model="FullName_Edit" />
        <InputField label="Email" v-model="Email_Edit" />
        <v-select
          label="Phân quyền"
          :items="['Admin', 'Kế hoạch', 'Thủ kho', 'Kinh doanh', 'Quản lý']"
          variant="solo-filled"
          v-model="Level_Edit"
        ></v-select>
      </v-card-text>
      <template v-slot:actions>
        <ButtonDelete @delete="DialogRemove = true" />
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarFailed v-model="DialogFailed" />
</template>
<script setup>
import axios from "axios";
import { ref, watch } from "vue";
import { useSocket } from "@/composables/useWebSocket";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
const { users } = useSocket();
const Url = import.meta.env.VITE_API_URL;
const DialogRemove = ref(false);
const DialogSuccess = ref(false);
const DialogEdit = ref(false);
const DialogFailed = ref(false);
const GetID = ref("");
const Username_Edit = ref("");
const FullName_Edit = ref("");
const Email_Edit = ref("");
const Level_Edit = ref("");
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = users.value.find((v) => v.id === value);
  Username_Edit.value = found.Username;
  FullName_Edit.value = found.FullName;
  Email_Edit.value = found.Email_Edit;
  Level_Edit.value = found.Level;
}
function SaveEdit() {
  const formData = reactive({
    Username: Username_Edit.value, // Giá trị ban đầu
    FullName: FullName_Edit.value,
    Email: Email_Edit.value,
    Level: Level_Edit.value,
  });
  axios
    .put(`${Url}/Users/Edit-User/${GetID.value}`, formData)
    .then(function (response) {
      console.log(response.data.message);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
}
const RemoveUser = async () => {
  axios
    .delete(`${Url}/Users/delete-user/${GetID.value}`)
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
  (DialogRemove.value = false), (DialogSuccess.value = true);
  DialogEdit.value = false;
}
function Error() {
  DialogFailed.value = true;
}
</script>
<script>
export default {
  components: {
    ButtonBack,
    ButtonCancel,
    ButtonDelete,
    ButtonSave,
    ButtonEdit,
    InputSearch,
    SnackbarSuccess,
    SnackbarFailed,
    InputField,
  },
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
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {},
};
</script>
<style lang=""></style>
