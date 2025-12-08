<template lang="">
  <!-- Main Card Container -->
  <v-card variant="text" class="overflow-y-auto" height="100vh" v-if="lgAndUp">
    <!-- Page Title -->
    <v-card-title class="text-h4 font-weight-light">
      Kiểm tra số liệu linh kiện
    </v-card-title>

    <!-- Action Bar -->
    <v-card-title class="d-flex">
      <!-- Import and Edit Buttons -->
      <ButtonImportFile @import-file="Dialog = true" />
      <v-btn
        prepend-icon="mdi mdi-pencil"
        variant="tonal"
        class="text-caption ms-2"
        color="primary"
        to="/Chinh-sua-so-lieu"
      >
        Chỉnh sửa
      </v-btn>

      <!-- Search and Process -->
      <v-spacer></v-spacer>
      <InputSearch v-model="NamePO" />
      <v-btn color="primary" class="ms-2 text-caption mt-1" @click="Proccess()">
        Xử lí
      </v-btn>
    </v-card-title>

    <!-- Main Content Area -->
    <v-card-text>
      <v-divider></v-divider>

      <!-- Empty State -->
      <v-empty-state
        v-if="checkBOM == '' || checkBOM == null"
        headline="OPPS !"
        title="Chưa có dữ liệu"
        text="Chon thêm file hoặc nhập tên PO"
        icon="mdi-folder-remove-outline"
      ></v-empty-state>

      <!-- Data Table Card -->
      <v-card variant="elevated" elevation="0" class="rounded-xl border" v-else>
        <!-- Table Header -->
        <v-card-title class="d-flex align-center pe-2">
          <p class="text-h6">{{ namePO }}</p>
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ checkBOM.length }} linh kiện)
          </p>

          <!-- Action Buttons -->
          <ButtonDownload @download-file="DownloadPO()" />
          <v-btn
            prepend-icon="mdi mdi-content-save-plus"
            color="blue-darken-4"
            class="ms-2 text-caption"
            variant="tonal"
            :disabled="OrderAvailable || isProcessingOrder"
            @click="DialogAccept = true"
          >
            Lưu dữ liệu
          </v-btn>

          <!-- Search -->
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <!-- Data Table -->
        <v-data-table
          density="comfortable"
          :headers="Headers"
          :items="checkBOM"
          :search="search"
          :items-per-page="itemsPerPage"
          v-model:page="page"
          class="elevation-0"
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
          height="75vh"
        >
          <!-- Pagination -->
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(checkBOM.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>

          <!-- Edit Action Column -->
          <template v-slot:item.Sửa="{ value }">
            <div>
              <ButtonEdit @edit="GetItem(value)" />
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-card-text>
  </v-card>

  <EmptyMobile v-else />

  <!-- Import File Dialog -->
  <BaseDialog v-model="Dialog" width="400" title="Thêm dữ liệu" icon="mdi-plus">
    <InputField label="Tên dự án" v-model="InputPO" :rules="[required]" />
    <InputField label="Tên Bom" v-model="InputBOM" :rules="[required]" />
    <InputField
      label="Số lượng Board"
      v-model="InputQuantity"
      :rules="[required]"
    />
    <InputFiles v-model="File" :rules="[required]" />
    <template #actions>
      <ButtonCancel @cancel="Dialog = false" />
      <ButtonSave @save="ImportFile()" />
    </template>
  </BaseDialog>

  <!-- Edit Item Dialog -->
  <BaseDialog v-model="DialogEdit" width="400" title="Cập nhật dữ liệu" icon="mdi-update">
    <InputField label="Dự toán hao phí" v-model="CostEstimate" />
    <template #actions>
      <ButtonCancel @cancel="DialogEdit = false" />
      <ButtonSave @save="SaveEdit()" />
    </template>
  </BaseDialog>

  <!-- Accept Order Dialog -->
  <BaseDialog v-model="DialogAccept" width="400" title="Xác nhận đơn hàng" icon="mdi-check">
    <InputSelect
      label="Chọn người nhận"
      v-model="Accept"
      :items="users"
      item-title="FullName"
      item-value="Username"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogAccept = false" />
      <ButtonAgree :disabled="isProcessingOrder" @agree="SaveTable()" />
    </template>
  </BaseDialog>

  <!-- Remove Item Dialog -->
  <BaseDialog v-model="DialogRemove" width="400" title="Xoá dữ liệu" icon="mdi-delete">
    Bạn có chắc chắn muốn xoá dự án này ?
    <template #actions>
      <ButtonCancel @cancel="DialogRemove = false" />
      <ButtonDelete @delete="RemoveItem()" />
    </template>
  </BaseDialog>

  <!-- Notification Components -->
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>

<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRoute, useRouter } from "vue-router";
import { onMounted, ref, computed, watch } from "vue";
import emailjs from "@emailjs/browser";
import { useDisplay } from "vuetify";
// Composables
import { useCheckBOM } from "@/composables/CheckBOM/useCheckBom";
import { useUsers } from "@/composables/Settings/useUsers";

// Components
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import EmptyMobile from "@/components/Empty-Mobile.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import InputSelect from "@/components/Input-Select.vue";
import BaseDialog from "@/components/BaseDialog.vue";
// ===== STATE MANAGEMENT =====
// Initialize composables
const { checkBOM, fetchData } = useCheckBOM();
const { users } = useUsers();

// API Configuration
const Url = import.meta.env.VITE_API_URL;
const { mdAndDown, lgAndUp } = useDisplay();
const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const Dialog = ref(false);           // Import file dialog
const DialogEdit = ref(false);       // Edit item dialog
const DialogRemove = ref(false);     // Remove item confirmation dialog
const DialogAccept = ref(false);     // Accept confirmation dialog
const DialogSuccess = ref(false);    // Success notification
const DialogFailed = ref(false);     // Error notification
const DialogLoading = ref(false);    // Loading state
const isProcessingOrder = ref(false); // Specific loading state for order processing

// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== TABLE CONFIGURATION =====
// Table headers and data
const Headers = ref(null);

// ===== FORM STATES =====
// File upload state
const File = ref(null);

// Input form states
const InputPO = ref("");
const InputBOM = ref("");
const InputQuantity = ref(1);
const CostEstimate = ref(0);
const UserInfo = ref("");
const NamePO = ref("");
const namePO = ref("");
const GetID = ref("");
const Accept = ref("");

// Email configuration
const toName = ref("Huỳnh Ngọc");
const email = ref("haidang34821@gmail.com");

// ===== LIFECYCLE HOOKS =====
/**
 * Initialize user info from JWT token on component mount
 */
onMounted(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    UserInfo.value = decoded.Username;
  } else {
    console.log("Không tìm thấy token!");
  }
});

// ===== WATCHERS =====
/**
 * Watch for changes in checkBOM data to regenerate table headers
 */
watch(
  checkBOM,
  (newBomData) => {
    console.log("checkBOM changed, generating headers with:", newBomData);
    generateHeaders(newBomData);
  },
  { deep: true }
);

// ===== CRUD OPERATIONS =====
/**
 * Fetches and populates item data for editing
 * @param {string} value - The ID of the item to edit
 */
function GetItem(value) {
  DialogEdit.value = true;
  const found = checkBOM.value.find((v) => v.Sửa === value);
  CostEstimate.value = found.Dự_Toán_Hao_Phí;
  GetID.value = found.PartNumber_1;
}

/**
 * Process PO data and fetch BOM information
 */
const Proccess = () => {
  const id = NamePO.value;
  if (!id) {
    Error("Vui lòng nhập tên PO.");
    return;
  }
  namePO.value = NamePO.value;
  fetchData(id);
};

/**
 * Generates table headers based on BOM data structure
 * @param {Array} bomData - The BOM data array
 */
function generateHeaders(bomData) {
  if (bomData && bomData.length > 0) {
    const firstItemKeys = Object.keys(bomData[0]);
    console.log("Generating headers from keys:", firstItemKeys);
    // Remove the last 5 headers
    const filteredKeys = firstItemKeys.slice(0, -11);
    Headers.value = filteredKeys.map((key) => ({
      title: key.replace(/_/g, " "),
      key: key,
      sortable: true,
    }));
  } else {
    console.log("No data to generate headers, clearing headers.");
    Headers.value = [];
  }
}

// ===== FILE OPERATIONS =====
/**
 * Imports BOM data from an Excel file
 */
const ImportFile = async () => {
  DialogLoading.value = true;
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const DateNow = `${day}/${month}/${year}`;
  
  const formData = new FormData();
  formData.append("file", File.value);
  formData.append("PO", InputPO.value);
  formData.append("BOM", InputBOM.value);
  formData.append("SL_Board", InputQuantity.value);
  formData.append("TimeStamp", DateNow);
  formData.append("Creater", UserInfo.value);

  try {
    const response = await axios.post(`${Url}/upload`, formData);
    console.log(response);
    MessageDialog.value = "Đã tạo dự án";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Lỗi tạo dự án";
    Error();
  }
};

/**
 * Downloads PO data as an Excel file
 */
const DownloadPO = async () => {
  try {
    const response = await fetch(`${Url}/Download-PO/${namePO.value}`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${namePO.value}.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
    MessageErrorDialog.value = "Lỗi tải file";
    Error();
  }
};

// ===== ORDER OPERATIONS =====
/**
 * Saves table data and creates new PO
 */
const SaveTable = async () => {
  // Prevent multiple calls
  if (isProcessingOrder.value) {
    return;
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const DateNow = `${day}/${month}/${year}`;
  
  const TotalType = checkBOM.value.length;
  const TotalItems = checkBOM.value.reduce(
    (accumulator, currentItem) => {
      const quantity = Number(currentItem.SL_Tổng) || 0;
      return accumulator + quantity;
    },
    0
  );

  DialogLoading.value = true;
  isProcessingOrder.value = true;
  const formData = {
    Name_PO: NamePO.value,
    Quantity_Type: TotalType,
    Quantity_Items: TotalItems,
    Status: 0,
    Date: DateNow,
    Creater: UserInfo.value,
  };

  try {
    const response = await axios.post(`${Url}/ListPO/upload-new-PO`, formData);
    console.log(response);
    
    // Send email first
    try {
      await sendEmail();
    } catch (emailError) {
      console.log("Email error:", emailError);
      // Continue with order creation even if email fails
    }
    
    // Then save order details
    await SaveAddOrders();
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Lỗi xác nhận đơn hàng";
    Error();
  } finally {
    isProcessingOrder.value = false;
  }
};

/**
 * Saves additional order information
 */
const SaveAddOrders = async () => {
  try {
    const response = await axios.post(`${Url}/insert-compare-inventory/${namePO.value}`);
    console.log(response.data);
    MessageDialog.value = "Đã xác nhận đơn hàng";
  } catch (error) {
    console.log(error);
    if (error.response?.status === 409) {
      MessageDialog.value = "Đơn hàng đã được xử lý trước đó";
    } else {
      MessageErrorDialog.value = "Lỗi xác nhận đơn hàng";
      throw error; // Re-throw to be caught by SaveTable
    }
  }
};

/**
 * Updates cost estimate for an item
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = {
    Input_Hao_Phi: CostEstimate.value,
    Name_Item: GetID.value,
    PO: NamePO.value,
  };

  try {
    const response = await axios.put(`${Url}/CheckBom/Update-Hao-Phi`, formData);
    console.log(response);
    MessageDialog.value = "Chỉnh sửa hao phí thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Lỗi chỉnh sửa hao phí";
    Error();
  }
};

// ===== EMAIL OPERATIONS =====
/**
 * Sends email notification about new PO
 */
const sendEmail = async () => {
  DialogLoading.value = true;
  const found = users.value.find((v) => v.Username === UserInfo.value);
  const foundAccept = users.value.find((v) => v.Username === Accept.value);

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        toName: foundAccept.FullName,
        fromName: found.FullName,
        message: `Đơn hàng ${namePO.value} đã được tạo thành công. Bộ phận Kho kiểm tra và xác nhận thông tin đơn hàng để tiến hành xuất hàng.`,
        email: foundAccept.Email,
        level: found.Level,
      },
      publicKey
    );
    console.log("SUCCESS!", response.status, response.text);
    MessageDialog.value = "Đã gửi email";
    DialogSuccess.value = true;
    DialogLoading.value = false;
    toName.value = "";
    email.value = "";
  } catch (error) {
    console.error("FAILED...", error);
    MessageErrorDialog.value = "Lỗi gửi email";
    DialogFailed.value = true;
    DialogLoading.value = false;
  }
};

// ===== UTILITY FUNCTIONS =====
/**
 * Resets all form states and dialogs
 */
function Reset() {
  DialogSuccess.value = true;
  Dialog.value = false;
  DialogLoading.value = false;
  DialogEdit.value = false;
  DialogAccept.value = false;
  DialogRemove.value = false;
  InputPO.value = "";
  InputBOM.value = "";
  InputQuantity.value = 1;
  File.value = null;

}

/**
 * Handles error states and resets loading
 */
function Error() {
  DialogFailed.value = true;
  Dialog.value = false;
  DialogLoading.value = false;
  DialogEdit.value = false;
  isProcessingOrder.value = false;
  InputPO.value = "";
  InputBOM.value = "";
  InputQuantity.value = 1;
  File.value = null;
}
</script>

<script>
/**
 * Component Configuration
 * Defines component registration and default data
 */
export default {
  // Register child components
  components: {
    ButtonImportFile,
    ButtonDownload,
    ButtonSave,
    ButtonCancel,
    InputSearch,
    InputField,
    InputFiles,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    ButtonAgree,
  },

  // Component data
  data() {
    return {
      // Table configuration
      search: "",          // Search query
      itemsPerPage: 15,    // Number of items per page
      page: 1,            // Current page number
    };
  },

  // Component methods
  methods: {
    // Methods are defined in the setup script
  },
};
</script>

<style lang=""></style>
