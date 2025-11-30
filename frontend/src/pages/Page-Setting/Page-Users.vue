<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Cai-dat" />
      <p class="text-h4 font-weight-light ms-3">Danh sách người sử dụng</p>
    </v-card-title>
    <v-card-text>
      <v-card variant="elevated" elevation="0" class="rounded-xl border">
        <v-card-title class="d-flex align-center pe-2">
          <ButtonAdd @add="DialogAdd = true" />
          <p class="text-subtitle-1 font-weight-thin text-subtitle-1 ms-2">Có {{ users.length }} người dùng</p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>
        <v-data-table
          density="comfortable"
          :headers="Headers"
          :items="users"
          :search="search"
          class="elevation-0"
          :items-per-page="10"
          :footer-props="{
            'items-per-page-options': [10, 20, 50, 100],
            'items-per-page-text': 'Số hàng mỗi trang',
          }"
          :header-props="{
            sortByText: 'Sắp xếp theo',
            sortDescText: 'Giảm dần',
            sortAscText: 'Tăng dần',
          }"
          :loading="DialogLoading"
          loading-text="Đang tải dữ liệu..."
          no-data-text="Không có dữ liệu"
          no-results-text="Không tìm thấy kết quả"
          :hover="true"
          :dense="false"
          :fixed-header="true"
          height="79vh"
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
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogRemove" width="400" class="rounded-xl">
    <v-card class="rounded-xl">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
        Xóa người dùng
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-1">Bạn có chắc chắn muốn xóa thành viên này?</div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveUser()" class="ms-2" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogEdit" width="500" class="rounded-xl">
    <v-card class="rounded-xl">
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
            <InputSelect
              label="Phân quyền"
              :items="['Admin', 'Kế hoạch', 'Thủ kho', 'Kinh doanh', 'Quản lý kinh doanh', 'Quản lý tổng', 'Nhân viên', 'Quản lý sản xuất', 'Quản lý bảo trì']"
              variant="solo-filled"
              v-model="Level_Edit"
            />
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
  <v-dialog v-model="DialogAdd" width="400" class="rounded-xl">
    <v-card max-width="400" prepend-icon="mdi-plus" title="Thêm thành viên mới" class="rounded-xl">
      <v-card-text>
        <InputField label="Tên đăng nhập" v-model="Username_Add" />
        <InputField label="Tên người dùng" v-model="FullName_Add" />
        <InputField label="Email" v-model="Email_Add" />
        <InputField label="Password" type="password" v-model="Password_Add" />
        <InputSelect
          label="Phân quyền"
          :items="['Admin', 'Kế hoạch', 'Thủ kho', 'Kinh doanh', 'Quản lý kinh doanh', 'Quản lý tổng', 'Nhân viên', 'Quản lý sản xuất', 'Quản lý bảo trì']"
          variant="solo-filled"
          v-model="Level_Add"
        />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { ref, watch, reactive } from "vue";

// Composables
import { useUsers } from "@/composables/Settings/useUsers";

// Components
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAdd from "@/components/Button-Add.vue";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Initialize composables
const { users } = useUsers();

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogRemove = ref(false);    // Remove confirmation dialog
const DialogSuccess = ref(false);   // Success notification
const DialogEdit = ref(false);      // Edit dialog
const DialogAdd = ref(false);       // Add new item dialog
const DialogFailed = ref(false);    // Error notification
const DialogLoading = ref(false);   // Loading state

// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== FORM STATES =====
// Current item being processed
const GetID = ref("");

// Edit form states
const Username_Edit = ref("");      // Username for editing
const FullName_Edit = ref("");      // Full name for editing
const Email_Edit = ref("");         // Email for editing
const Level_Edit = ref("");         // User level for editing

// Add form states
const Username_Add = ref("");       // Username for adding
const FullName_Add = ref("");       // Full name for adding
const Email_Add = ref("");          // Email for adding
const Password_Add = ref("");       // Password for adding
const Level_Add = ref("");          // User level for adding

// ===== TABLE CONFIGURATION =====
// Search and pagination states
const search = ref("");
const itemsPerPage = ref(15);
const page = ref(1);

// Table headers configuration
const Headers = ref([
  { key: "Username", title: "Tài khoản", width: "150px", noWrap: true },
  { key: "FullName", title: "Tên người dùng", width: "200px", noWrap: true },
  { key: "Email", title: "Email", width: "200px", noWrap: true },
  { key: "Level", title: "Phân quyền", width: "150px", noWrap: true },
  { key: "Date", title: "Ngày tạo", width: "150px", noWrap: true },
  { key: "id", title: "Thao tác", width: "100px", noWrap: true },
]);

// ===== CRUD OPERATIONS =====
/**
 * Prepares a user for editing by setting up the edit dialog
 * @param {string} value - The ID of the user to edit
 */
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = users.value.find((v) => v.id === value);
  Username_Edit.value = found.Username;
  FullName_Edit.value = found.FullName;
  Email_Edit.value = found.Email_Edit;
  Level_Edit.value = found.Level;
}

/**
 * Saves edited user data
 * Makes an API call to update user information
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Username: Username_Edit.value,
    FullName: FullName_Edit.value,
    Email: Email_Edit.value,
    Level: Level_Edit.value,
  });

  try {
    const response = await axios.put(`${Url}/Users/Edit-User/${GetID.value}`, formData);
    console.log(response.data.message);
    MessageDialog.value = "Cập nhật người dùng thành công";
    Reset();
  } catch (error) {
    console.error("Error updating user:", error);
    MessageErrorDialog.value = "Cập nhật người dùng thất bại";
    Error();
  }
};

/**
 * Saves new user data
 * Makes an API call to create a new user
 */
const SaveAdd = async () => {
  DialogLoading.value = true;
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const DateNow = `${day}/${month}/${year}`;

  const formData = reactive({
    Username: Username_Add.value,
    FullName: FullName_Add.value,
    Email: Email_Add.value,
    Password: Password_Add.value,
    Level: Level_Add.value,
    Date: DateNow,
  });

  try {
    const response = await axios.post(`${Url}/Users/register`, formData);
    console.log(response.data.message);
    MessageDialog.value = "Thêm người dùng thành công";
    Reset();
  } catch (error) {
    console.error("Error adding user:", error);
    MessageErrorDialog.value = "Thêm người dùng thất bại";
    Error();
  }
};

/**
 * Removes a user from the system
 * Makes an API call to delete the user
 */
const RemoveUser = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(`${Url}/Users/delete-user/${GetID.value}`);
    console.log(response);
    MessageDialog.value = "Xoá người dùng thành công";
    Reset();
  } catch (error) {
    console.error("Error deleting user:", error);
    MessageErrorDialog.value = "Xoá người dùng thất bại";
    Error();
  }
};

// ===== UTILITY FUNCTIONS =====
/**
 * Resets all dialog states and form data
 * Called after successful operations
 */
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

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
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
    InputSelect,
    Loading,
  },
  data() {
    return {};
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
