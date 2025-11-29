<template>
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex" v-if="lgAndUp">
      <ButtonBack :to="`/Bao-tri/Chi-tiet/${route.params.id}`" />
      <p class="text-h4 font-weight-light ms-3" v-if="lgAndUp">Chi tiết sử dụng phụ tùng</p>
    </v-card-title>
    <v-card-title class="d-flex" v-else>
      <ButtonBack :to="`/Bao-tri/Chi-tiet/${route.params.id}`" />
      <v-icon icon="mdi mdi-cog"></v-icon> &nbsp;
      {{ route.params.id }}
    </v-card-title>
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2" v-if="lgAndUp">
          <v-icon icon="mdi mdi-cog"></v-icon> &nbsp;
          {{ route.params.id }}

          <ButtonAdd @add="DialogAdd = true" />
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ sparePartUsage.length }} bản ghi)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-card-title class="d-flex align-center pe-2" v-else>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-data-table
          v-if="lgAndUp"
          density="compact"
          :search="search"
          :items="sparePartUsage"
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
                :length="Math.ceil(sparePartUsage.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>
          <template v-slot:item.TrangThai="{ item }">
            <div class="text-start">
              <v-chip
                v-if="item.TrangThai === 'Chờ phê duyệt'"
                color="red"
                text="Chờ phê duyệt"
                size="small"
              ></v-chip>
              <v-chip
                v-else-if="item.TrangThai === 'Đã sử dụng'"
                color="green"
                text="Đã sử dụng"
                size="small"
              ></v-chip>
            </div>
          </template>
          <template v-slot:item.GhiChu="{ item }">
            <div style="white-space: pre-line">{{ item.GhiChu }}</div>
          </template>
          <template v-slot:item.id="{ item }">
            <ButtonEdit @edit="GetItem(item)" />
          </template>
        </v-data-table>

        <v-data-table-virtual
          v-else
          :search="search"
          :items="sparePartUsage"
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
          <template v-slot:item.TrangThai="{ item }">
            <div class="text-start">
              <v-chip
                v-if="item.TrangThai === 'Chờ phê duyệt'"
                color="red"
                text="Chờ phê duyệt"
                size="small"
              ></v-chip>
              <v-chip
                v-else-if="item.TrangThai === 'Đã sử dụng'"
                color="green"
                text="Đã sử dụng"
                size="small"
              ></v-chip>
            </div>
          </template>
          <template v-slot:item.GhiChu="{ item }">
            <div style="white-space: pre-line">{{ item.GhiChu }}</div>
          </template>
          <template v-slot:item.id="{ item }">
            <ButtonEdit @edit="GetItem(item)" />
          </template>
        </v-data-table-virtual>
      </v-card>
    </v-card-text>
  </v-card>

  <v-dialog v-model="DialogEdit" width="500" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu sử dụng phụ tùng
      </v-card-title>

      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12">
            <InputField
              label="Tên phụ tùng"
              v-model="TenPhuTung_Edit"
              hint="Nhập tên phụ tùng"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Số lượng sử dụng"
              v-model="SoLuong_Edit"
              type="number"
              hint="Nhập số lượng sử dụng"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Đơn vị"
              v-model="DonVi_Edit"
              hint="Nhập đơn vị tính"
            />
          </v-col>
          <v-col cols="12">
            <InputTextarea
              label="Ghi chú"
              v-model="GhiChu_Edit"
              hint="Nhập ghi chú"
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

  <v-dialog v-model="DialogAdd" width="500" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu sử dụng phụ tùng
      </v-card-title>

      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12">
            <InputField
              label="Tên phụ tùng"
              v-model="TenPhuTung_Add"
              hint="Nhập tên phụ tùng"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Số lượng sử dụng"
              v-model="SoLuongSuDung_Add"
              type="number"
              hint="Nhập số lượng sử dụng"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Đơn vị"
              v-model="DonVi_Add"
              hint="Nhập đơn vị tính"
            />
          </v-col>
          <v-col cols="12">
            <InputTextarea
              label="Ghi chú"
              v-model="GhiChu_Add"
              hint="Nhập ghi chú"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" class="ms-2" />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="DialogRemove" width="400">
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
        Xóa dữ liệu sử dụng phụ tùng
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-1">
          Bạn có chắc chắn muốn xóa bản ghi sử dụng phụ tùng này?
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" class="ms-2" />
      </v-card-actions>
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
import { ref, computed, reactive } from "vue";
import { useDisplay } from "vuetify";

// Components
import InputSearch from "@/components/Input-Search.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// Composables
import { useSparePartUsage } from "@/composables/Maintenance/useSparePartUsage";
const { mdAndDown, lgAndUp } = useDisplay();
// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Route and Router
const router = useRouter();
const route = useRoute();

// Device and Maintenance IDs from localStorage
const id = localStorage.getItem("DetailMaintenanceID");

// Initialize composables
const { sparePartUsage } = useSparePartUsage(id);

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogEdit = ref(false);      // Edit dialog
const DialogSuccess = ref(false);   // Success notification
const DialogFailed = ref(false);    // Error notification
const DialogRemove = ref(false);    // Remove confirmation dialog
const DialogAdd = ref(false);       // Add new item dialog
const DialogLoading = ref(false);   // Loading state

// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== FORM STATES =====
// Current item being processed
const GetID = ref("");

// Edit form states
const TenPhuTung_Edit = ref("");    // Spare part name for editing
const SoLuong_Edit = ref("");       // Quantity for editing
const DonVi_Edit = ref("");         // Unit for editing
const GhiChu_Edit = ref("");        // Notes for editing

// Add form states
const TenPhuTung_Add = ref("");     // Spare part name for adding
const SoLuongSuDung_Add = ref("");  // Quantity for adding
const DonVi_Add = ref("");          // Unit for adding
const GhiChu_Add = ref("");         // Notes for adding

// ===== TABLE CONFIGURATION =====
// Search and pagination states
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);

// Table headers configuration
const Headers = [
  { title: "Tên phụ tùng", key: "TenPhuTung" },
  { title: "Số lượng sử dụng", key: "SoLuongSuDung" },
  { title: "Đơn vị", key: "DonVi" },
  { title: "Ghi chú", key: "GhiChu" },
  { title: "Thao tác", key: "id", sortable: false },
];

// ===== CRUD OPERATIONS =====
/**
 * Prepares an item for editing by setting up the edit dialog
 * @param {Object} item - The spare part usage item to edit
 */
function GetItem(item) {
  DialogEdit.value = true;
  GetID.value = item.MaSuDung;
  TenPhuTung_Edit.value = item.TenPhuTung;
  SoLuong_Edit.value = item.SoLuongSuDung;
  DonVi_Edit.value = item.DonVi;
  GhiChu_Edit.value = item.GhiChu;
}

/**
 * Saves edited spare part usage data
 * Makes an API call to update spare part usage information
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    MaBaoTri: localStorage.getItem("DetailMaintenanceID"),
    MaThietBi: localStorage.getItem("MaintenanceID"),
    TenPhuTung: TenPhuTung_Edit.value,
    SoLuongSuDung: parseInt(SoLuong_Edit.value) || 0,
    DonVi: DonVi_Edit.value,
    GhiChu: GhiChu_Edit.value
  });

  try {
    const response = await axios.put(`${Url}/SparePartUsage/Edit/${GetID.value}`, formData);
    console.log(response.data.message);
    MessageDialog.value = "Cập nhật phụ tùng thành công";
    Reset();
  } catch (error) {
    console.error("Error updating spare part usage:", error);
    MessageErrorDialog.value = "Cập nhật phụ tùng thất bại";
    Error();
  }
};

/**
 * Saves new spare part usage data
 * Makes an API call to create a new spare part usage record
 */
const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    MaBaoTri: localStorage.getItem("DetailMaintenanceID"),
    MaThietBi: localStorage.getItem("MaintenanceID"),
    TenPhuTung: TenPhuTung_Add.value,
    SoLuongSuDung: parseInt(SoLuongSuDung_Add.value) || 0,
    DonVi: DonVi_Add.value,
    GhiChu: GhiChu_Add.value
  });

  try {
    const response = await axios.post(`${Url}/SparePartUsage/Add`, formData);
    console.log(response.data);
    MessageDialog.value = "Thêm phụ tùng thành công";
    Reset();
  } catch (error) {
    console.error("Error adding spare part usage:", error);
    MessageErrorDialog.value = "Thêm phụ tùng thất bại";
    Error();
  }
};

/**
 * Removes a spare part usage record from the system
 * Makes an API call to delete the spare part usage record
 */
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(`${Url}/SparePartUsage/Delete/${GetID.value}`);
    console.log(response.data.message);
    MessageDialog.value = "Xoá phụ tùng thành công";
    Reset();
  } catch (error) {
    console.error("Error deleting spare part usage:", error);
    MessageErrorDialog.value = "Xoá phụ tùng thất bại";
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
  TenPhuTung_Add.value = "";
  SoLuongSuDung_Add.value = "";
  DonVi_Add.value = "";
  GhiChu_Add.value = "";
}

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
  DialogEdit.value = false;
  DialogAdd.value = false;
  TenPhuTung_Add.value = "";
  SoLuongSuDung_Add.value = "";
  DonVi_Add.value = "";
  GhiChu_Add.value = "";
}
</script>

<script>
export default {
  components: {
    InputSearch,
    InputTextarea,
    InputField,
    ButtonAdd,
    ButtonDelete,
    ButtonSave,
    ButtonCancel,
    ButtonBack,
    ButtonEdit,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    InputSelect,
  },
};
</script>
