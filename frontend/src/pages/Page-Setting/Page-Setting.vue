<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light">Cài đặt</v-card-title>
    <v-card-text>
      <v-container>
        <v-list density="compact">
          <v-list-subheader>Thành viên sử dụng phần mềm</v-list-subheader>

          <v-list-item
            color="primary"
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
            color="primary"
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
            color="primary"
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
            color="primary"
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
            color="primary"
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
const DialogRemoveProject = ref(false);      // Remove project confirmation dialog
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
