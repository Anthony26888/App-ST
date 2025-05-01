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
      <v-data-table 
        :headers="headers" 
        :items="users" 
        :search="search"
        class="elevation-1"
        :items-per-page="10"
        :footer-props="{
          'items-per-page-options': [10, 20, 50, 100],
          'items-per-page-text': 'Số hàng mỗi trang'
        }"
        :header-props="{
          sortByText: 'Sắp xếp theo',
          sortDescText: 'Giảm dần',
          sortAscText: 'Tăng dần'
        }"
        :loading="DialogLoading"
        loading-text="Đang tải dữ liệu..."
        no-data-text="Không có dữ liệu"
        no-results-text="Không tìm thấy kết quả"
        :hover="true"
        :dense="false"
        :fixed-header="true"
        height="calc(100vh - 200px)"
      >
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
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
        Xóa người dùng
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-1">
          Bạn có chắc chắn muốn xóa thành viên này?
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveUser()" class="ms-2" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogEdit" width="500">
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
        Chỉnh sửa người dùng
      </v-card-title>

      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12">
            <InputField label="Tên đăng nhập" v-model="Username_Edit" />
          </v-col>
          <v-col cols="12">
            <InputField label="Tên người dùng" v-model="FullName_Edit" />
          </v-col>
          <v-col cols="12">
            <InputField label="Email" v-model="Email_Edit" />
          </v-col>
          <v-col cols="12">
            <v-select
              label="Phân quyền"
              :items="['Admin', 'Kế hoạch', 'Thủ kho', 'Kinh doanh', 'Quản lý']"
              variant="solo-filled"
              v-model="Level_Edit"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="pa-4">
        <ButtonDelete @delete="DialogRemove = true" />
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" class="ms-2" />
      </v-card-actions>
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
<style scoped>
.v-data-table {
  border-radius: 8px;
  overflow: hidden;
}

.v-data-table-header th {
  background-color: #f5f5f5 !important;
  color: #333 !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  font-size: 0.875rem;
  padding: 12px 16px;
}

.v-data-table__wrapper {
  border: 1px solid #e0e0e0;
}

.v-data-table__wrapper table {
  border-collapse: separate;
  border-spacing: 0;
}

.v-data-table__wrapper tbody tr {
  transition: background-color 0.2s ease;
}

.v-data-table__wrapper tbody tr:hover {
  background-color: #f5f5f5 !important;
}

.v-data-table__wrapper tbody td {
  padding: 12px 16px;
  font-size: 0.875rem;
  color: #333;
}

.v-data-table__wrapper tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.v-data-table__wrapper tbody tr.selected {
  background-color: #e3f2fd !important;
}

.v-data-table__wrapper .v-data-table__empty-wrapper {
  padding: 32px;
  text-align: center;
  color: #666;
}

.v-data-table__wrapper .v-data-table__loading {
  background-color: rgba(255, 255, 255, 0.8);
}

.v-data-table__wrapper .v-data-table__footer {
  border-top: 1px solid #e0e0e0;
  padding: 8px 16px;
  background-color: #f5f5f5;
}

.v-data-table__wrapper .v-data-table__footer .v-data-footer {
  padding: 0;
}

.v-data-table__wrapper .v-data-table__footer .v-data-footer__select {
  margin-right: 16px;
}

.v-data-table__wrapper .v-data-table__footer .v-data-footer__pagination {
  margin-left: 16px;
}
</style>
