<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách dự án</v-card-title
    >
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <ButtonImportFile @import-file="Dialog = true" />
          <ButtonAdd @add="DialogAdd = true" />
          <v-menu :location="location">
            <template v-slot:activator="{ props }">
              <v-btn
                color="orange"
                v-bind="props"
                class="ms-2 text-caption"
                prepend-icon="mdi-filter"
                variant="tonal"
              >
                Bộ lọc
              </v-btn>
            </template>

            <v-list>
              <v-list-item
                v-for="(item, index) in itemsFilter"
                :key="index"
                :value="item.value"
                @click="search = item.value"
              >
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ project.length }} dự án)
          </p>

          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>
        <v-card-text class="overflow-auto">
          <v-data-table
            :headers="Headers"
            :items="project"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
            class="elevation-1"
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
            height="calc(100vh - 200px)"
          >
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(project.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
            <template v-slot:item.Status="{ value }">
              <div>
                <v-chip
                  :color="value === 'Hoàn thành' ? 'success' : 'error'"
                  variant="tonal"
                  class="text-caption"
                >
                  {{ value }}
                </v-chip>
              </div>
            </template>
            <template v-slot:item.id="{ value }">
              <div class="d-flex align-center">
                <ButtonEye @detail="PushItem(value)" />
                <ButtonEdit
                  @edit="GetItem(value)"
                  v-if="LevelUser == 'Admin' || LevelUser == 'Kinh doanh admin'"
                />
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Khách hàng" v-model="Customer_Edit" />
        <InputField label="Năm tạo" v-model="Years_Edit" />
      </v-card-text>
      <v-card-actions>
        <ButtonDelete @delete="DialogRemove = true" />
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="DialogAdd" width="400">
    <v-card max-width="400">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Khách hàng" v-model="Customer_Add" />
        <InputField label="Năm tạo" v-model="Years_Add" />
      </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá khách hàng này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="Dialog" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
      <v-card-text>
        <InputFiles label="Thêm File Excel" v-model="File" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="Dialog = false" />
        <ButtonSave @save="ImportFile()" />
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
import { useRouter } from "vue-router";
import { ref, reactive, computed } from "vue";

// Components
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// Composables
import { useProject } from "@/composables/useProject";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Router
const router = useRouter();

// Initialize composables
const { project } = useProject();

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const Dialog = ref(false); // Main dialog
const DialogEdit = ref(false); // Edit dialog
const DialogSuccess = ref(false); // Success notification
const DialogFailed = ref(false); // Error notification
const DialogRemove = ref(false); // Remove confirmation dialog
const DialogAdd = ref(false); // Add new item dialog
const DialogLoading = ref(false); // Loading state

// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== FORM STATES =====
// File upload state
const File = ref(null);

// Customer form states
const Customer_Edit = ref(""); // Customer name for editing
const Customer_Add = ref("");
const Years_Edit = ref("");
const Years_Add = ref("");
const GetID = ref(""); // Current item ID being processed

// ===== Table States =====
const Headers = ref([
  { key: "Customer", title: "Khách hàng", width: "300" },
  { key: "Status", title: "Trạng thái" },
  { key: "Quantity_PO", title: "Số lượng PO" },
  { key: "Years", title: "Năm tạo", sortable: true },
  { key: "id", sortable: false, title: "Thao tác" },
]);

const search = ref("");
const itemsPerPage = ref(15);
const page = ref(1);

// ===== User Information =====
const UserInfo = ref(null);
const LevelUser = localStorage.getItem("LevelUser");

// ===== FILTER STATES =====
const itemsFilter = [
  { title: "Tất cả", value:"" },
  { title: "Chưa xong", value: "Chưa xong" },
  { title: "Hoàn thành", value: "Hoàn thành" },
];
  // ===== CRUD OPERATIONS =====
  /**
   * Navigates to customer details page and stores customer information
   * @param {string} value - The ID of the customer to view
   */
  function PushItem(value) {
    const found = project.value.find((v) => v.id === value);
    router.push(`/Du-an/Khach-hang/${value}`);
    console.log(found);
    localStorage.setItem("Customers", found.Customer);
    localStorage.setItem("CustomersID", value);
  };

/**
 * Prepares an item for editing by setting up the edit dialog
 * @param {string} value - The ID of the item to edit
 */
function GetItem(value) {
  console.log(value);
  DialogEdit.value = true;
  GetID.value = value;
  const found = project.value.find((v) => v.id === value);
  Customer_Edit.value = found.Customers;
  Years_Edit.value = found.Years;
}

/**
 * Saves edited customer data
 * Makes an API call to update customer information
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    CustomerName: Customer_Edit.value,
    Years: Years_Edit.value,
  });

  try {
    const response = await axios.put(
      `${Url}/Project/Customer/Edit-Customer/${GetID.value}`,
      formData
    );
    console.log(response.data.message);
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    Error();
  }
};

/**
 * Saves new customer data
 * Makes an API call to create a new customer
 */
const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    CustomerName: Customer_Add.value,
    Years: Years_Add.value,
  });

  try {
    const response = await axios.post(
      `${Url}/Project/Customer/Add-Customer`,
      formData
    );
    console.log(response.data);
    MessageDialog.value = "Thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    Error();
  }
};

/**
 * Removes a customer from the system
 * Makes an API call to delete the customer
 */
const RemoveItem = async (id) => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Project/Customer/Delete-Customer/${GetID.value}`
    );
    console.log(response.data.message);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

// ===== FILE OPERATIONS =====
/**
 * Imports customer data from a file
 * Makes an API call to upload and process the file
 */
const ImportFile = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", File.value);

  try {
    const response = await axios.post(`${Url}/Project/upload`, formData);
    console.log(response);
    MessageDialog.value = "Tải file thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Tải file thất bại";
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
  Dialog.value = false;
  DialogLoading.value = false;
  Customer_Add.value = "";
  Years_Add.value = "";
  Customer_Edit.value = "";
  Years_Edit.value = "";
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
    InputSearch,
    InputFiles,
    InputField,
    ButtonImportFile,
    ButtonDownload,
    ButtonEye,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    InputSelect,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang=""></style>
