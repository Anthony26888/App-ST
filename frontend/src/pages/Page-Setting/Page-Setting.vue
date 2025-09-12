<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light">Cài đặt</v-card-title>
    <v-card-text>
      <v-container>
        <v-list density="compact">
          <v-list-subheader>Thành viên sử dụng phần mềm</v-list-subheader>

          <v-list-item
            color="error"
            value="option-1"
            to="/Cai-dat/Danh-sach-thanh-vien"
          >
            <template v-slot:prepend>
              <v-icon icon="mdi-account-group"></v-icon>
            </template>

            <v-list-item-title>Danh sách thành viên</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-subheader>Chỉnh sửa dữ liệu hệ thống</v-list-subheader>
          <v-list-item
            color="error"
            value="option-3"
            @click="DialogRemoveCheckBOM = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-delete-forever"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu Bom</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="error"
            value="option-4"
            @click="DialogRemoveWareHouse = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-store-remove"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu kho</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="error"
            value="option-5"
            @click="DialogRemoveWareHouse2 = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-store-remove"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu kho Misa</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="error"
            value="option-6"
            @click="DialogRemoveProject = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-notebook-multiple"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu dự án</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="error"
            value="option-7"
            @click="DialogRemoveManufacture = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-factory"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu sản xuất</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="error"
            value="option-8"
            @click="DialogRemoveSummary = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-finance"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu báo cáo</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="error"
            value="option-9"
            @click="DialogRemoveMaintenance = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-hammer-screwdriver"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu bảo trì</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="error"
            value="option-10"
            @click="DialogRemovePnP = true"
          >
            <template v-slot:prepend>
              <v-icon color="red" icon="mdi-list-status"></v-icon>
            </template>

            <v-list-item-title class="text-red"
              >Xoá toàn bộ dữ liệu Pick & Place</v-list-item-title
            >
          </v-list-item>
          <v-list-item
            color="success"
            value="option-11"
            @click="DialogDownloadData = true"
          >
            <template v-slot:prepend>
              <v-icon color="success" icon="mdi-file-download"></v-icon>
            </template>

            <v-list-item-title class="text-success"
              >Tải toàn bộ dữ liệu (database.db)</v-list-item-title
            >
          </v-list-item>
        </v-list>
      </v-container>
    </v-card-text>
  </v-card>

  <v-dialog v-model="DialogRemoveWareHouse" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu kho ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveWareHouse = false" />
        <ButtonDelete @delete="RemoveWareHouse()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveWareHouse2" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu kho 2?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveWareHouse2 = false" />
        <ButtonDelete @delete="RemoveWareHouse2()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveCheckBOM" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu Bom ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveCheckBOM = false" />
        <ButtonDelete @delete="RemoveCheckBOM()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveProject" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu dự án ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveProject = false" />
        <ButtonDelete @delete="RemoveProject()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveManufacture" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu sản xuất ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveManufacture = false" />
        <ButtonDelete @delete="RemoveManufacture()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveSummary" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu báo cáo ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveSummary = false" />
        <ButtonDelete @delete="RemoveSummary()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveMaintenance" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu bảo trì?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemoveMaintenance= false" />
        <ButtonDelete @delete="RemoveMaintenance()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemovePnP" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá toàn bộ dữ liệu Pick & Place?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemovePnP= false" />
        <ButtonDelete @delete="RemovePnP()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogDownloadData" width="400">
    <v-card max-width="400" prepend-icon="mdi-file-download" title="Tải dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn tải toàn bộ dữ liệu thống?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogDownloadData= false" />
        <ButtonDownload @download-file="downloadDatabase()" />
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
import { ref, watch } from "vue";

// Components
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogRemoveWareHouse = ref(false);    // Remove warehouse confirmation dialog
const DialogRemoveWareHouse2 = ref(false);   // Remove warehouse2 confirmation dialog
const DialogRemoveCheckBOM = ref(false);     // Remove BOM check confirmation dialog
const DialogRemoveProject = ref(false); 
const DialogRemoveManufacture = ref(false);
const DialogRemoveSummary = ref(false);
const DialogRemoveMaintenance = ref(false);
const DialogRemovePnP = ref(false);
const DialogDownloadData = ref(false);

// Remove project confirmation dialog
const DialogSuccess = ref(false);            // Success notification
const DialogFailed = ref(false);             // Error notification
const DialogLoading = ref(false);            // Loading state

// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");
// ===== CRUD OPERATIONS =====
/**
 * Removes all warehouse data
 * Makes an API call to delete all warehouse records
 */
const RemoveWareHouse = async () => {
  try {
    const response = await axios.delete(`${Url}/WareHouse/delete-all`);
    console.log(response);
    MessageDialog.value = "Đã xoá dữ liệu thành công"
    Reset();
  } catch (error) {
    console.error("Error deleting warehouse data:", error);
    MessageErrorDialog.value ="Xảy ra lỗi khi xoá"
    Error();
  }
};

/**
 * Removes all warehouse2 data
 * Makes an API call to delete all warehouse2 records
 */
const RemoveWareHouse2 = async () => {
  try {
    const response = await axios.delete(`${Url}/WareHouse2/delete-all`);
    console.log(response);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.error("Error deleting warehouse2 data:", error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

/**
 * Removes all BOM check data
 * Makes an API call to delete all BOM check records
 */
const RemoveCheckBOM = async () => {
  try {
    const response = await axios.delete(`${Url}/CheckBOM/delete-all`);
    console.log(response);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.error("Error deleting BOM check data:", error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

/**
 * Removes all project data
 * Makes an API call to delete all project records
 */
const RemoveProject = async () => {
  try {
    const response = await axios.delete(`${Url}/Project/delete-all`);
    console.log(response);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.error("Error deleting project data:", error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

// Remove all item in Manufacture table
const RemoveManufacture = async () => {
  try {
    const response = await axios.delete(`${Url}/Manufacture/delete-all`);
    console.log(response);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.error("Error deleting project data:", error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

// Remove all item in Summary table
const RemoveSummary = async () => {
  try {
    const response = await axios.delete(`${Url}/Summary/delete-all`);
    console.log(response);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.error("Error deleting project data:", error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

// Remove all item in Maintenance table
const RemoveMaintenance = async () => {
  try {
    const response = await axios.delete(`${Url}/Maintenance/delete-all`);
    console.log(response);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.error("Error deleting project data:", error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

// Remove all item in FilterBom table
const RemovePnP = async () => {
  try {
    const response = await axios.delete(`${Url}/FilterBom/delete-all`);
    console.log(response);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.error("Error deleting project data:", error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};


// Download file database 
const downloadDatabase = async () => {
  try {
    DialogLoading.value = true;
    const response = await axios.get(`${Url}/download-db`, {
      responseType: "blob", // rất quan trọng để nhận file binary
    });

    // Tạo blob URL từ response
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    // Tạo link download ẩn
    const link = document.createElement("a");
    link.href = url;
    link.download = "database.db";
    document.body.appendChild(link);
    link.click();

    // Dọn dẹp
    link.remove();
    window.URL.revokeObjectURL(url);
    DialogSuccess.value = true;
    MessageDialog.value = "Tải fie database thành công"
    DialogDownloadData.value = false;
  } catch (err) {
    console.error("❌ Lỗi tải database:", err);
    DialogFailed.value = true;
    MessageErrorDialog.value = "Lỗi không tải được database"
    DialogDownloadData.value = false;
  } finally {
    DialogLoading.value = false;
    DialogDownloadData.value = false;
  }
};

// ===== UTILITY FUNCTIONS =====
/**
 * Resets all dialog states
 * Called after successful operations
 */
function Reset() {
  DialogSuccess.value = true;
  DialogRemoveWareHouse.value = false;
  DialogRemoveWareHouse2.value = false;
  DialogRemoveCheckBOM.value = false;
  DialogRemoveProject.value = false;
  DialogRemoveManufacture.value = false;
  DialogRemoveSummary.value = false;
  DialogRemovePnP.value = false;
  DialogDownloadData.value = false;
}

/**
 * Handles error states
 * Shows error notification
 */
function Error() {
  DialogFailed.value = true;
}
</script>
<script>
export default {
  components: {
    ButtonDelete,
    ButtonCancel,
    SnackbarSuccess,
    SnackbarFailed,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang=""></style>
