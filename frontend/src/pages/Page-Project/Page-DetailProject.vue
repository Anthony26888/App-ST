<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Du-an" />
      <p class="text-h4 font-weight-light ms-3">Chi tiết PO</p>
    </v-card-title>
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <v-icon icon="mdi mdi-account-badge-outline"></v-icon> &nbsp;
          {{ NamePO }}

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
            ( {{ detailProject.length }} PO)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-data-table
          :search="search"
          :items="detailProject"
          :headers="Headers"
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
                :length="Math.ceil(detailProject.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>

          <template #item.Status="{ value }">
            <div class="text-start">
              <v-chip
                :color="
                  value === 'Hoàn thành'
                    ? 'success'
                    : value === 'Đang sản xuất'
                    ? 'warning'
                    : 'error'
                "
                variant="tonal"
                class="text-caption"
              >
                {{ value }}
              </v-chip>
            </div>
          </template>
          <template #item.id="{ item }">
            <div class="d-flex">
              <ButtonEye @detail="PushItem(item)" />
              <ButtonEdit
                @edit="GetItem(item)"
                v-if="LevelUser == 'Admin' || LevelUser == 'Quản lý kinh doanh'"
              />
            </div>
          </template>
          <template #item.Note="{ item }">
            <div style="white-space: pre-line">{{ item.Note }}</div>
          </template>
          <template v-slot:item.Date_Created="{ item }">
            {{ item.Date_Created.split("-").reverse().join("/") }}
          </template>
          <template v-slot:item.Date_Delivery="{ item }">
            {{ item.Date_Delivery.split("-").reverse().join("/") }}
          </template>
        </v-data-table>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Chi tiết đơn hàng" v-model="PONumber_Edit" />
        <InputDate
          type="date"
          label="Ngày tạo đơn"
          v-model="Date_Created_Edit"
        />
        <InputDate
          type="date"
          label="Ngày giao đơn"
          v-model="Date_Delivery_Edit"
        />
        <InputTextarea label="Ghi chú" v-model="Note_Edit" />
      </v-card-text>
      <v-card-actions>
        <ButtonDelete @delete="DialogRemove = true" />
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="DialogAdd" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Chi tiết đơn hàng" v-model="PONumber_Add" />
        <InputDate
          type="date"
          label="Ngày tạo đơn"
          v-model="Date_Created_Add"
        />
        <InputDate
          type="date"
          label="Ngày giao đơn"
          v-model="Date_Delivery_Add"
        />
        <InputTextarea label="Ghi chú" v-model="Note_Add" />
      </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
        Xoá dữ liệu
      </v-card-title>
      <v-card-text> Bạn có chắc chắn muốn xoá đơn hàng này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
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
import { useRoute, useRouter } from "vue-router";
import { ref, computed } from "vue";

// Components
import InputSearch from "@/components/Input-Search.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import InputField from "@/components/Input-Field.vue";

import ButtonAdd from "@/components/Button-Add.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// Composables
import { useDetailProject } from "@/composables/Project/useDetailProject";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Router and Route
const router = useRouter();
const route = useRoute();
const id = route.params.id;

// Initialize composables
const { detailProject, detailProjectError } = useDetailProject(id);

// ===== DIALOG STATES =====
// Control visibility of various dialogs
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
// Current item being processed
const GetID = ref("");

// Edit form states
const PONumber_Edit = ref(""); // PO number for editing
const Date_Created_Edit = ref(""); // Creation date for editing
const Date_Delivery_Edit = ref(""); // Delivery date for editing
const Note_Edit = ref(""); // Note for editing

// Add form states
const PONumber_Add = ref(""); // PO number for adding new
const Date_Created_Add = ref(""); // Creation date for adding new
const Date_Delivery_Add = ref(""); // Delivery date for adding new
const Note_Add = ref(""); // Note for adding new

// Khởi tạo các biến ref cho form thêm mới
const Name_Manufacture_Add = ref("");
const Date_Manufacture_Add = ref("");
const Note_Manufacture_Add = ref("");
const Total_Manufacture_Add = ref(0);
const Level_Manufacture_Add = ref("");

// ===== TABLE STATES =====
const Headers = ref([
  { key: "PO", title: "Đơn hàng" },
  { key: "Status", title: "Trạng thái" },
  { key: "Total_Product", title: "Số lượng đơn hàng" },
  { key: "Date_Created", title: "Ngày tạo" },
  { key: "Date_Delivery", title: "Ngày giao", width: "150px" },
  { key: "Note", title: "Ghi chú", width: "150px" },
  {
    key: "id",
    sortable: false,
    title: "Thao tác",
  },
]);
const NamePO = ref(localStorage.getItem("Customers"));
const search = ref("");
const itemsPerPage = ref(12);
const page = ref(1);

// ====== User ==========
const LevelUser = localStorage.getItem("LevelUser");

// ===== FILTER STATES =====
const itemsFilter = [
  { title: "Tất cả", value: "" },
  { title: "Đang sản xuất", value: "Đang sản xuất" },
  { title: "Hoàn thành", value: "Hoàn thành" },
];

// ===== CRUD OPERATIONS =====
/**
 * Navigates to order details page and stores PO information
 * @param {Object} item - The order item containing PO and ID
 */
function PushItem(item) {
  localStorage.setItem("PO", item.PO);
  router.push(`/Du-an/Don-hang/${item.id}`);
}

/**
 * Prepares an item for editing by setting up the edit dialog
 * @param {Object} item - The item to edit containing PO, dates and ID
 */
function GetItem(item) {
  DialogEdit.value = true;
  GetID.value = item.id;
  PONumber_Edit.value = item.PO;
  Date_Created_Edit.value = item.Date_Created;
  Date_Delivery_Edit.value = item.Date_Delivery;
  Note_Edit.value = item.Note;
}

/**
 * Saves edited order data
 * Makes an API call to update order information
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    PONumber: PONumber_Edit.value,
    DateCreated: Date_Created_Edit.value,
    DateDelivery: Date_Delivery_Edit.value,
    Note: Note_Edit.value,
    CustomerID: id,
  });

  try {
    const response = await axios.put(
      `${Url}/Project/Customer/Edit-Orders/${GetID.value}`,
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
 * Saves new order data
 * Makes an API call to create a new order
 */
const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    PONumber: PONumber_Add.value,
    DateCreated: Date_Created_Add.value,
    DateDelivery: Date_Delivery_Add.value,
    Note: Note_Add.value,
    CustomerID: id,
  });

  try {
    const response = await axios.post(
      `${Url}/Project/Customer/Add-Orders`,
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
 * Removes an order from the system
 * Makes an API call to delete the order
 */
const RemoveItem = async (id) => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Project/Customer/Delete-Orders/${GetID.value}`
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

// Hàm lưu thông tin thêm mới
const SaveAddManufacture = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Name: Name_Manufacture_Add.value,
    Status: false,
    Date: Date_Manufacture_Add,
    Total: Total_Manufacture_Add.value,
    Note: Note_Manufacture_Add.value,
    Creater: UserInfo.value,
    DelaySMT: DelaySMT_Add.value,
    Level: Level_Add.value,
  });
  try {
    const response = await axios.post(`${Url}/PlanManufacture/Add`, formData);
    console.log(response.data);
    MessageDialog.value = response.data.message;
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = error.response.data.message;
    Error();
  }
};

// ===== FILE OPERATIONS =====
/**
 * Downloads order data as an Excel file
 * Makes an API call to get the file and triggers download
 */
const DDownloadOrder = async () => {
  const id = route.params;
  const found = detailProject.value.find((v) => v.id === id);

  try {
    const response = await fetch(`${Url}/Download-Order/${found.PO}`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${found.PO}.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    MessageDialog.value = "Tải file thành công";
  } catch (error) {
    console.error("Error downloading file:", error);
    MessageErrorDialog.value = "Tải file thất bại";
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
  PONumber_Add.value = "";
  Date_Created_Add.value = "";
  Date_Delivery_Add.value = "";
  Note_Add.value = "";
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
    ButtonCancel,
    ButtonDownload,
    ButtonSave,
    InputSearch,
    SnackbarSuccess,
    ButtonBack,
    ButtonEdit,
    ButtonAgree,
    ButtonEye,
    SnackbarFailed,
    Loading,
    InputField,
    InputTextarea,
    ButtonAdd,
    ButtonDelete,
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
    };
  },
  methods: {},
};
</script>
<style lang=""></style>
