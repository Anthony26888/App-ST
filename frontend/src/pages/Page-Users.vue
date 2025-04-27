<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Cai-dat" />
      <p class="text-h4 font-weight-light ms-3">Danh sách người sử dụng</p>
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <p class="text-subtitle-1">Có {{ users.length }} đơn hàng</p>
      <ButtonAdd @add="DialogAdd = true" />
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
              :length="Math.ceil(users.length / itemsPerPage)"
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
  <v-dialog v-model="DialogAdd" width="400">
    <v-card max-width="400" prepend-icon="mdi-plus" title="Thêm thành viên mới">
      <v-card-text>
        <InputField label="Tên đăng nhập" v-model="Username_Add" />
        <InputField label="Tên người dùng" v-model="FullName_Add" />
        <InputField label="Email" v-model="Email_Add" />
        <InputField label="Password" type="password" v-model="Password_Add" />
        <v-select
          label="Phân quyền"
          :items="['Admin', 'Kế hoạch', 'Thủ kho', 'Kinh doanh', 'Quản lý']"
          variant="solo-filled"
          v-model="Level_Add"
        ></v-select>
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { ref, watch } from "vue";
import { useSocket } from "@/composables/useWebSocket";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import { useUsers } from "@/composables/useUsers";
const { users } = useUsers();
const Url = import.meta.env.VITE_API_URL;
const DialogRemove = ref(false);
const DialogSuccess = ref(false);
const DialogEdit = ref(false);
const DialogAdd = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const GetID = ref("");
const Username_Edit = ref("");
const FullName_Edit = ref("");
const Email_Edit = ref("");
const Level_Edit = ref("");
const Username_Add = ref("");
const FullName_Add = ref("");
const Email_Add = ref("");
const Password_Add = ref("");
const Level_Add = ref("");
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = users.value.find((v) => v.id === value);
  Username_Edit.value = found.Username;
  FullName_Edit.value = found.FullName;
  Email_Edit.value = found.Email_Edit;
  Level_Edit.value = found.Level;
}
const SaveEdit = async () => {
  DialogLoading.value = true;
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
};

const SaveAdd = async () => {
  DialogLoading.value = true;
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = String(now.getFullYear()).slice(-2);
  const DateNow = `${day}/${month}/${year}`;
  const formData = reactive({
    Username: Username_Add.value, // Giá trị ban đầu
    FullName: FullName_Add.value,
    Email: Email_Add.value,
    Password: Password_Add.value,
    Level: Level_Add.value,
    Date: DateNow,
  });
  axios
    .post(`${Url}/Users/register`, formData)
    .then(function (response) {
      console.log(response.data.message);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const RemoveUser = async () => {
  DialogLoading.value = true;
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
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  DialogLoading.value = false;
  GetID.value = "";
  Username_Add.value = "";
  FullName_Add.value = "";
  Email_Add.value = "";
  Password_Add.value = "";
  Level_Add.value = "";
}
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
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
    ButtonAdd,
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
          width: "150px",
          noWrap: true
        },
        { key: "FullName", title: "Tên người dùng", width: "200px", noWrap: true },
        { key: "Email", title: "Email", width: "200px", noWrap: true },
        { key: "Level", title: "Phân quyền", width: "150px", noWrap: true },
        { key: "Date", title: "Ngày tạo", width: "150px", noWrap: true },
        { key: "id", title: "Sửa", width: "100px", noWrap: true },
      ],
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {},
};
</script>
<style>
.v-data-table-header th {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
</style>
