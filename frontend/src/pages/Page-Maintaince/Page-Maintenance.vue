<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách bảo trì</v-card-title
    >
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <v-btn
            prepend-icon="mdi mdi-plus"
            variant="tonal"
            color="primary"
            class="text-caption ms-2"
            @click="DialogAdd = true"
            >Thêm</v-btn
          >
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ machine.length }} thiết bị)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-card-text class="overflow-auto">
          <v-data-table
            :headers="Headers"
            :items="machine"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
            class="elevation-1"
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
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(machine.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
            <template v-slot:item.SoNgayConLai="{ value }">
              <div>
                <v-chip
                  v-if="value > 15"
                  color="green"
                  text="Chưa đến hạn"
                  size="small"
                ></v-chip>
                <v-chip
                  v-else
                  color="red"
                  text="Cần bảo trì"
                  size="small"
                ></v-chip>
              </div>
            </template>
            <template v-slot:item.MaThietBi="{ value }">
              <div class="d-flex ">
                <ButtonEye @detail="PushItem(value)" />
                <ButtonEdit @edit="GetItem(value)" />
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="500" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
        Cập nhật bảo trì
      </v-card-title>

      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="6">
            <InputField 
              label="Tên thiết bị" 
              v-model="TenThietBi_Edit"
            />
          </v-col>
          <v-col cols="12" md="6">
            <InputField 
              label="Loại thiết bị" 
              v-model="LoaiThietBi_Edit"
            />
          </v-col>
          <v-col cols="12" md="6">
            <InputField 
              label="Nhà sản xuất" 
              v-model="NhaSanXuat_Edit"
            />
          </v-col>
          <v-col cols="12" md="6">
            <InputField 
              label="Ngày mua" 
              v-model="NgayMua_Edit" 
              type="date"
            />
          </v-col>
          <v-col cols="12">
            <InputField 
              label="Vị trí" 
              v-model="ViTri_Edit"
            />
          </v-col>
          <v-col cols="12">
            <InputTextarea
              label="Mô tả" 
              v-model="MoTa_Edit"
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
        Thêm thiết bị mới
      </v-card-title>

      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="6">
            <InputField 
              label="Tên thiết bị" 
              v-model="TenThietBi_Add"
            />
          </v-col>
          <v-col cols="12" md="6">
            <InputField 
              label="Loại thiết bị" 
              v-model="LoaiThietBi_Add"
            />
          </v-col>
          <v-col cols="12" md="6">
            <InputField 
              label="Nhà sản xuất" 
              v-model="NhaSanXuat_Add"
            />
          </v-col>
          <v-col cols="12" md="6">
            <InputField 
              label="Ngày mua" 
              v-model="NgayMua_Add" 
              type="date"
            />
          </v-col>
          <v-col cols="12">
            <InputField 
              label="Vị trí" 
              v-model="ViTri_Add"
            />
          </v-col>
          <v-col cols="12">
            <Input-Textarea
              label="Mô tả" 
              v-model="MoTa_Add"
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
  <v-dialog v-model="DialogRemove" width="500">
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
        Xóa bảo trì
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-1">
          Bạn có chắc chắn muốn xóa bản ghi bảo trì này?
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
import { useRouter } from "vue-router";

// Composables
import { useMachine } from "@/composables/useMachine";

// Components
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Router
const router = useRouter();

// Initialize composables
const { machine } = useMachine();

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const Dialog = ref(false);          // Main dialog
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
// File upload state
const File = ref(null);

// Current item being processed
const GetID = ref("");

// Edit form states
const TenThietBi_Edit = ref("");    // Device name for editing
const LoaiThietBi_Edit = ref("");   // Device type for editing
const NhaSanXuat_Edit = ref("");    // Manufacturer for editing
const NgayMua_Edit = ref("");       // Purchase date for editing
const ViTri_Edit = ref("");         // Location for editing
const MoTa_Edit = ref("");          // Description for editing

// Add form states
const TenThietBi_Add = ref("");     // Device name for adding new
const LoaiThietBi_Add = ref("");    // Device type for adding new
const NhaSanXuat_Add = ref("");     // Manufacturer for adding new
const NgayMua_Add = ref("");        // Purchase date for adding new
const ViTri_Add = ref("");          // Location for adding new
const MoTa_Add = ref("");           // Description for adding new

// ===== TABLE CONFIGURATION =====
// Search and pagination states
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);

// Table headers configuration
const Headers = [
  { title: "Tên thiết bị", key: "TenThietBi" },
  { title: "Loại thiết bị", key: "LoaiThietBi" },
  { title: "Nhà sản xuất", key: "NhaSanXuat" },
  { title: "Ngày mua", key: "NgayMua" },
  { title: "Vị trí", key: "ViTri" },
  { title: "Mô tả", key: "MoTa" },
  { title: "Bảo trì định kỳ", key: "SoNgayConLai" },
  { title: "Thao tác", key: "MaThietBi", sortable: false },
];

// ===== CRUD OPERATIONS =====
/**
 * Navigates to device details page and stores device information
 * @param {string} value - The ID of the device to view
 */
function PushItem(value) {
  const found = machine.value.find((v) => v.MaThietBi === value);
  console.log(found);
  router.push(`/Bao-tri/Chi-tiet/${found.TenThietBi}`);
  localStorage.setItem("MaintenanceID", value);
}

/**
 * Prepares an item for editing by setting up the edit dialog
 * @param {string} value - The ID of the item to edit
 */
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = machine.value.find((v) => v.MaThietBi === value);
  TenThietBi_Edit.value = found.TenThietBi;
  LoaiThietBi_Edit.value = found.LoaiThietBi;
  NhaSanXuat_Edit.value = found.NhaSanXuat;
  NgayMua_Edit.value = found.NgayMua;
  ViTri_Edit.value = found.ViTri;
  MoTa_Edit.value = found.MoTa;
}

/**
 * Saves edited device data
 * Makes an API call to update device information
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    TenThietBi: TenThietBi_Edit.value,
    LoaiThietBi: LoaiThietBi_Edit.value,
    NhaSanXuat: NhaSanXuat_Edit.value,
    NgayMua: NgayMua_Edit.value,
    ViTri: ViTri_Edit.value,
    MoTa: MoTa_Edit.value,
  });

  try {
    const response = await axios.put(
      `${Url}/Machine/Edit/${GetID.value}`,
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
 * Saves new device data
 * Makes an API call to create a new device
 */
const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    TenThietBi: TenThietBi_Add.value,
    LoaiThietBi: LoaiThietBi_Add.value,
    NhaSanXuat: NhaSanXuat_Add.value,
    NgayMua: NgayMua_Add.value,
    ViTri: ViTri_Add.value,
    MoTa: MoTa_Add.value,
  });

  try {
    const response = await axios.post(`${Url}/Machine/Add`, formData);
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
 * Removes a device from the system
 * Makes an API call to delete the device
 */
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(`${Url}/Machine/Delete/${GetID.value}`);
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
 * Imports device data from a file
 * Makes an API call to upload and process the file
 */
const ImportFile = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", File.value);

  try {
    const response = await axios.post(`${Url}/Maintenance/upload`, formData);
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
  TenThietBi_Add.value = "";
  LoaiThietBi_Add.value = "";
  NhaSanXuat_Add.value = "";
  NgayMua_Add.value = "";
  ViTri_Add.value = "";
  MoTa_Add.value = "";
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
    Loading
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      File: null,
    };
  },
};
</script>
