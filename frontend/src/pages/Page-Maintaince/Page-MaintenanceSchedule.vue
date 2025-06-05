<template lang="">
  <div>
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="d-flex">
        <ButtonBack :to="`/Bao-tri/Chi-tiet/${route.params.id}`" />
        <p class="text-h4 font-weight-light ms-3">Lịch bảo trì định kì</p>
      </v-card-title>
      <v-card-text>
        <v-card variant="text">
          <v-card-title class="d-flex align-center pe-2">
            <v-icon icon="mdi mdi-calendar-clock"></v-icon> &nbsp; {{ route.params.id }}

            <ButtonAdd @add="DialogAdd = true" />
            <p class="ms-2 font-weight-thin text-subtitle-1">
              ( {{ maintenanceSchedule.length }} lịch bảo trì)
            </p>
            <v-spacer></v-spacer>
            <InputSearch v-model="search" />
          </v-card-title>

          <v-data-table
            :search="search"
            :items="maintenanceSchedule"
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
            <template v-slot:item.SoNgayConLai="{ value }">
              <div>
                <v-chip
                  v-if="value > 15"
                  color="green"
                  :text="`${value} ngày`"
                  size="small"
                ></v-chip>
                <v-chip
                  v-else
                  color="red"
                  :text="`${value} ngày`"
                  size="small"
                ></v-chip>
              </div>
            </template>
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(maintenanceSchedule.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
            <template v-slot:item.TrangThai="{ item }">
              <div class="text-start">
                <v-chip
                  v-if="item.TrangThai === 'Chưa thực hiện'"
                  color="orange"
                  text="Chưa thực hiện"
                  size="small"
                ></v-chip>
                <v-chip
                  v-else-if="item.TrangThai === 'Đang thực hiện'"
                  color="blue"
                  text="Đang thực hiện"
                  size="small"
                ></v-chip>
                <v-chip
                  v-else-if="item.TrangThai === 'Đã hoàn thành'"
                  color="green"
                  text="Đã hoàn thành"
                  size="small"
                ></v-chip>
              </div>
            </template>
            <template v-slot:item.MaLich="{ item }">
              <ButtonEdit @edit="GetItem(item)" />
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>
    </v-card>

    <v-dialog v-model="DialogEdit" width="500" scrollable>
      <v-card class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
          Cập nhật lịch bảo trì
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12">
              <InputField
                label="Loại bảo trì"
                v-model="LoaiBaoTri_Edit"
                hint="Ví dụ: Bảo trì định kỳ, Bảo trì phòng ngừa"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Chu kỳ bảo trì"
                v-model="ChuKyBaoTri_Edit"
                type="number"
                hint="Số lượng chu kỳ"
              />
            </v-col>
            <v-col cols="6">
              <InputSelect
                label="Đơn vị chu kỳ"
                v-model="DonViChuKy_Edit"
                hint="Ví dụ: Tháng, Quý, Năm"
                :items="itemsDonViChuKy"
                item-text="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Ngày bắt đầu"
                v-model="NgayBatDau_Edit"
                type="date"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Ngày bảo trì tiếp theo"
                v-model="NgayBaoTriTiepTheo_Edit"
                type="date"
                readonly
                :hint="calculateNextDateEdit"
              />
            </v-col>
            <v-col cols="12">
              <InputTextarea
                label="Ghi chú"
                v-model="GhiChu_Edit"
                hint="Ghi chú về lịch bảo trì"
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
          Thêm lịch bảo trì
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12">
              <InputField
                label="Loại bảo trì"
                v-model="LoaiBaoTri_Add"
                hint="Ví dụ: Bảo trì định kỳ, Bảo trì phòng ngừa"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Chu kỳ bảo trì"
                v-model="ChuKyBaoTri_Add"
                type="number"
                hint="Số lượng chu kỳ"
              />
            </v-col>
            <v-col cols="6">
              <InputSelect
                label="Đơn vị chu kỳ"
                v-model="DonViChuKy_Add"
                hint="Ví dụ: Tháng, Năm"
                :items="itemsDonViChuKy"
                item-text="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Ngày bắt đầu"
                v-model="NgayBatDau_Add"
                type="date"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Ngày bảo trì tiếp theo"
                v-model="NgayBaoTriTiepTheo_Add"
                type="date"
                readonly
                :hint="calculateNextDate"
              />
            </v-col>
            <v-col cols="12">
              <InputTextarea
                label="Ghi chú"
                v-model="GhiChu_Add"
                hint="Ghi chú về lịch bảo trì"
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
          Xóa lịch bảo trì
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="text-body-1">
            Bạn có chắc chắn muốn xóa lịch bảo trì này?
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <ButtonCancel @cancel="DialogRemove = false" />
          <ButtonDelete @delete="DeleteItem()" class="ms-2" />
        </v-card-actions>
      </v-card>
    </v-dialog>
    <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
    <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
    <Loading v-model="DialogLoading" />
  </div>
</template>

<script setup>
// ===== IMPORTS =====
// Core dependencies
import { ref, computed } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";

// Components
import InputSearch from "@/components/Input-Search.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
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
import { useMaintenanceSchedule } from "@/composables/useMaintenanceSchedule";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Route and Router
const route = useRoute();
const router = useRouter();

// Device ID from localStorage
const id = localStorage.getItem("MaintenanceID");

// Initialize composables
const { maintenanceSchedule } = useMaintenanceSchedule(id);

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogLoading = ref(false);   // Loading state
const DialogAdd = ref(false);       // Add new item dialog
const DialogEdit = ref(false);      // Edit dialog
const DialogRemove = ref(false);    // Remove confirmation dialog
const DialogSuccess = ref(false);   // Success notification
const DialogFailed = ref(false);    // Error notification

// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== FORM STATES =====
// Current item being processed
const GetID = ref("");

// Add form states
const LoaiBaoTri_Add = ref("");           // Maintenance type for adding
const ChuKyBaoTri_Add = ref("");          // Maintenance cycle for adding
const DonViChuKy_Add = ref("");           // Cycle unit for adding
const NgayBatDau_Add = ref("");           // Start date for adding
const NgayBaoTriTiepTheo_Add = ref("");   // Next maintenance date for adding
const GhiChu_Add = ref("");               // Notes for adding

// Edit form states
const LoaiBaoTri_Edit = ref("");          // Maintenance type for editing
const ChuKyBaoTri_Edit = ref("");         // Maintenance cycle for editing
const DonViChuKy_Edit = ref("");          // Cycle unit for editing
const NgayBatDau_Edit = ref("");          // Start date for editing
const NgayBaoTriTiepTheo_Edit = ref("");  // Next maintenance date for editing
const GhiChu_Edit = ref("");              // Notes for editing

// ===== TABLE CONFIGURATION =====
// Search and pagination states
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);

// Table headers configuration
const Headers = [
  { title: "Loại bảo trì", key: "LoaiBaoTri", sortable: true },
  { title: "Chu kỳ bảo trì", key: "ChuKyBaoTri", sortable: true },
  { title: "Đơn vị chu kỳ", key: "DonViChuKy", sortable: true },
  { title: "Ngày bắt đầu", key: "NgayBatDau", sortable: true },
  { title: "Ngày bảo trì tiếp theo", key: "NgayBaoTriTiepTheo", sortable: true },
  { title: "Hạn bảo trì", key: "SoNgayConLai", sortable: true },
  { title: "Ghi chú", key: "GhiChu", sortable: true },
  { title: "Thao tác", key: "MaLich", sortable: false },
];

// ===== SELECT OPTIONS =====
// Options for cycle unit selection
const itemsDonViChuKy = ["Tháng", "Quý", "Năm"];

// ===== COMPUTED PROPERTIES =====
/**
 * Calculates the next maintenance date based on start date, cycle and unit
 * Updates the next maintenance date field automatically
 * @returns {string} Message indicating the next maintenance date
 */
const calculateNextDate = computed(() => {
  if (!NgayBatDau_Add.value || !ChuKyBaoTri_Add.value || !DonViChuKy_Add.value) {
    return "Vui lòng nhập đầy đủ thông tin ngày bắt đầu, chu kỳ và đơn vị";
  }

  const startDate = new Date(NgayBatDau_Add.value);
  let nextDate = new Date(startDate);
  const cycleValue = parseInt(ChuKyBaoTri_Add.value) || 0;

  switch (DonViChuKy_Add.value) {
    case "Tháng":
      nextDate.setMonth(startDate.getMonth() + cycleValue);
      break;
    case "Quý":
      nextDate.setMonth(startDate.getMonth() + cycleValue * 3);
      break;
    case "Năm":
      nextDate.setFullYear(startDate.getFullYear() + cycleValue);
      break;
  }

  NgayBaoTriTiepTheo_Add.value = nextDate.toISOString().split("T")[0];
  return `Ngày bảo trì tiếp theo: ${nextDate.toLocaleDateString("vi-VN")}`;
});

/**
 * Calculates the next maintenance date for edit form
 * Updates the next maintenance date field automatically
 * @returns {string} Message indicating the next maintenance date
 */
const calculateNextDateEdit = computed(() => {
  if (!NgayBatDau_Edit.value || !ChuKyBaoTri_Edit.value || !DonViChuKy_Edit.value) {
    return "Vui lòng nhập đầy đủ thông tin ngày bắt đầu, chu kỳ và đơn vị";
  }

  const startDate = new Date(NgayBatDau_Edit.value);
  let nextDate = new Date(startDate);
  const cycleValue = parseInt(ChuKyBaoTri_Edit.value) || 0;

  switch (DonViChuKy_Edit.value) {
    case "Tháng":
      nextDate.setMonth(startDate.getMonth() + cycleValue);
      break;
    case "Quý":
      nextDate.setMonth(startDate.getMonth() + cycleValue * 3);
      break;
    case "Năm":
      nextDate.setFullYear(startDate.getFullYear() + cycleValue);
      break;
  }

  NgayBaoTriTiepTheo_Edit.value = nextDate.toISOString().split("T")[0];
  return `Ngày bảo trì tiếp theo: ${nextDate.toLocaleDateString("vi-VN")}`;
});

// ===== CRUD OPERATIONS =====
/**
 * Prepares an item for editing by setting up the edit dialog
 * @param {Object} item - The maintenance schedule item to edit
 */
const GetItem = (item) => {
  LoaiBaoTri_Edit.value = item.LoaiBaoTri;
  ChuKyBaoTri_Edit.value = item.ChuKyBaoTri;
  DonViChuKy_Edit.value = item.DonViChuKy;
  NgayBatDau_Edit.value = item.NgayBatDau;
  NgayBaoTriTiepTheo_Edit.value = item.NgayBaoTriTiepTheo;
  GhiChu_Edit.value = item.GhiChu;
  GetID.value = item.MaLich;
  DialogEdit.value = true;
};

/**
 * Saves new maintenance schedule data
 * Makes an API call to create a new maintenance schedule
 */
const SaveAdd = async () => {
  DialogLoading.value = true;

  const formData = {
    MaThietBi: localStorage.getItem("MaintenanceID"),
    LoaiBaoTri: LoaiBaoTri_Add.value,
    ChuKyBaoTri: ChuKyBaoTri_Add.value,
    DonViChuKy: DonViChuKy_Add.value,
    NgayBatDau: NgayBatDau_Add.value,
    NgayBaoTriTiepTheo: NgayBaoTriTiepTheo_Add.value,
    GhiChu: GhiChu_Add.value,
  };

  try {
    const response = await axios.post(`${Url}/MaintenanceSchedule/Add`, formData);
    console.log(response.data);
    MessageDialog.value = "Thêm lịch bảo trì thành công";
    Reset();
  } catch (error) {
    console.error("Error adding maintenance schedule:", error);
    MessageErrorDialog.value = "Thêm lịch bảo trì thất bại";
    Error();
  } finally {
    DialogLoading.value = false;
    DialogAdd.value = false;
  }
};

/**
 * Saves edited maintenance schedule data
 * Makes an API call to update maintenance schedule information
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = {
    MaThietBi: localStorage.getItem("MaintenanceID"),
    LoaiBaoTri: LoaiBaoTri_Edit.value,
    ChuKyBaoTri: ChuKyBaoTri_Edit.value,
    DonViChuKy: DonViChuKy_Edit.value,
    NgayBatDau: NgayBatDau_Edit.value,
    NgayBaoTriTiepTheo: NgayBaoTriTiepTheo_Edit.value,
    GhiChu: GhiChu_Edit.value,
  };

  try {
    const response = await axios.put(
      `${Url}/MaintenanceSchedule/Edit/${GetID.value}`,
      formData
    );
    console.log(response.data);
    MessageDialog.value = "Cập nhật lịch bảo trì thành công";
    Reset();
  } catch (error) {
    console.error("Error updating maintenance schedule:", error);
    MessageErrorDialog.value = "Cập nhật lịch bảo trì thất bại";
    Error();
  }
};

/**
 * Removes a maintenance schedule from the system
 * Makes an API call to delete the maintenance schedule
 */
const DeleteItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(`${Url}/MaintenanceSchedule/Delete/${GetID.value}`);
    console.log(response.data.message);
    MessageDialog.value = "Xoá lịch bảo trì thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Xoá lịch bảo trì thất bại";
    Error();
  }
};

// ===== UTILITY FUNCTIONS =====
/**
 * Resets all dialog states and form data
 * Called after successful operations
 */
const Reset = () => {
  LoaiBaoTri_Add.value = "";
  ChuKyBaoTri_Add.value = "";
  DonViChuKy_Add.value = "";
  NgayBatDau_Add.value = "";
  NgayBaoTriTiepTheo_Add.value = "";
  GhiChu_Add.value = "";
  DialogSuccess.value = true;
  DialogFailed.value = false;
  DialogLoading.value = false;
  DialogAdd.value = false;
  DialogEdit.value = false;
  DialogRemove.value = false;
};

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
const Error = () => {
  DialogFailed.value = true;
  DialogLoading.value = false;
  DialogAdd.value = false;
  DialogEdit.value = false;
  DialogRemove.value = false;
  LoaiBaoTri_Add.value = "";
  ChuKyBaoTri_Add.value = "";
  DonViChuKy_Add.value = "";
  NgayBatDau_Add.value = "";
  NgayBaoTriTiepTheo_Add.value = "";
  GhiChu_Add.value = "";
};
</script>
<script>
export default {
  components: {
    InputSearch,
    InputTextarea,
    InputField,
    ButtonAdd,
    ButtonDelete,
    ButtonDownload,
    ButtonSave,
    ButtonCancel,
    ButtonBack,
    ButtonEdit,
    ButtonAgree,
    ButtonEye,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    InputSelect,
  },
};
</script>
