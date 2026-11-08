<template lang="">
  <v-card variant="text">
    <PageHeader :crumbs="[{ title: 'Hệ thống'}]" />
    <v-card-text>
      <v-container>
        <v-card variant="outlined" class="rounded-xl mb-4">
          <v-card-title class="d-flex align-center flex-wrap ga-2">
            <v-icon color="primary">mdi-api</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Kết nối DigiKey</span>
            <v-chip
              size="small"
              variant="tonal"
              :color="
                digikeyStatus?.connected
                  ? 'success'
                  : digikeyStatus?.needs_reconnect
                    ? 'warning'
                    : 'grey'
              "
            >
              {{
                digikeyStatus?.connected
                  ? 'Đã kết nối'
                  : digikeyStatus?.needs_reconnect
                    ? 'Cần kết nối lại'
                    : 'Chưa kết nối'
              }}
            </v-chip>
            <v-spacer />
            <v-btn
              v-if="digikeyStatus?.connected"
              variant="tonal"
              color="error"
              size="small"
              prepend-icon="mdi-link-off"
              :loading="digikeyLoading"
              @click="disconnectDigikey"
            >
              Ngắt kết nối
            </v-btn>
            <v-btn
              v-else
              variant="tonal"
              color="primary"
              size="small"
              prepend-icon="mdi-link"
              :loading="digikeyLoading"
              :disabled="digikeyStatus && !digikeyStatus.configured"
              @click="connectDigikey"
            >
              Kết nối DigiKey
            </v-btn>
          </v-card-title>
          <v-card-text class="pt-0 text-body-2">
            <v-alert
              v-if="digikeyMessage"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-3"
              closable
              @click:close="digikeyMessage = ''"
            >
              {{ digikeyMessage }}
            </v-alert>
            <v-alert
              v-if="digikeyError"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-3"
              closable
              @click:close="digikeyError = ''"
            >
              {{ digikeyError }}
            </v-alert>
            <div class="d-flex flex-wrap ga-6">
              <div>
                <div class="text-caption text-medium-emphasis">Account ID</div>
                <div class="font-weight-medium">
                  {{ digikeyStatus?.account_id || '—' }}
                </div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">Hạn token</div>
                <div class="font-weight-medium">
                  {{ formatTokenExpiry(digikeyStatus?.expires_at) }}
                </div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">MyLists quota</div>
                <div class="font-weight-medium">
                  {{ formatQuota(digikeyStatus?.quota?.mylists) }}
                </div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">ProductInfo quota</div>
                <div class="font-weight-medium">
                  {{ formatQuota(digikeyStatus?.quota?.productinfo) }}
                </div>
              </div>
            </div>
            <div
              v-if="digikeyStatus && !digikeyStatus.configured"
              class="text-caption text-error mt-2"
            >
              Backend chưa cấu hình đủ Client ID, Client Secret và Redirect URI.
            </div>
            <div class="text-caption text-medium-emphasis mt-2">
              DigiKey dùng OAuth 3-legged. Token được lưu mã hoá ở backend,
              không hiển thị ra trình duyệt.
            </div>
          </v-card-text>
        </v-card>

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

  <BaseDialog
    v-model="DialogRemoveWareHouse"
    width="500"
    title="Xoá dữ liệu"
    icon="mdi-delete"
  >
    <p>Bạn có chắc chắn muốn xoá toàn bộ dữ liệu kho?</p>
    <template v-slot:actions>
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogRemoveWareHouse = false" />
      <ButtonDelete @delete="RemoveWareHouse()" class="ms-2" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogRemoveWareHouse2"
    width="500"
    title="Xoá dữ liệu"
    icon="mdi-delete"
  >
    <p>Bạn có chắc chắn muốn xoá toàn bộ dữ liệu kho 2?</p>
    <template v-slot:actions>
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogRemoveWareHouse2 = false" />
      <ButtonDelete @delete="RemoveWareHouse2()" class="ms-2" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogRemoveCheckBOM"
    width="500"
    title="Xoá dữ liệu"
    icon="mdi-delete"
  >
    <p>Bạn có chắc chắn muốn xoá toàn bộ dữ liệu Bom?</p>
    <template v-slot:actions>
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogRemoveCheckBOM = false" />
      <ButtonDelete @delete="RemoveCheckBOM()" class="ms-2" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogRemoveProject"
    width="500"
    title="Xoá dữ liệu"
    icon="mdi-delete"
  >
    <p>Bạn có chắc chắn muốn xoá toàn bộ dữ liệu dự án?</p>
    <template v-slot:actions>
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogRemoveProject = false" />
      <ButtonDelete @delete="RemoveProject()" class="ms-2" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogRemoveManufacture"
    width="500"
    title="Xoá dữ liệu"
    icon="mdi-delete"
  >
    <p>Bạn có chắc chắn muốn xoá toàn bộ dữ liệu sản xuất?</p>
    <template v-slot:actions>
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogRemoveManufacture = false" />
      <ButtonDelete @delete="RemoveManufacture()" class="ms-2" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogRemoveSummary"
    width="500"
    title="Xoá dữ liệu"
    icon="mdi-delete"
  >
    <p>Bạn có chắc chắn muốn xoá toàn bộ dữ liệu báo cáo?</p>
    <template v-slot:actions>
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogRemoveSummary = false" />
      <ButtonDelete @delete="RemoveSummary()" class="ms-2" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogRemoveMaintenance"
    width="500"
    title="Xoá dữ liệu"
    icon="mdi-delete"
  >
    <p>Bạn có chắc chắn muốn xoá toàn bộ dữ liệu bảo trì?</p>
    <template v-slot:actions>
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogRemoveMaintenance = false" />
      <ButtonDelete @delete="RemoveMaintenance()" class="ms-2" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogRemovePnP"
    width="500"
    title="Xoá dữ liệu"
    icon="mdi-delete"
  >
    <p>Bạn có chắc chắn muốn xoá toàn bộ dữ liệu Pick & Place?</p>
    <template v-slot:actions>
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogRemovePnP = false" />
      <ButtonDelete @delete="RemovePnP()" class="ms-2" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogDownloadData"
    width="500"
    title="Tải dữ liệu"
    icon="mdi-file-download"
  >
    <p>Bạn có chắc chắn muốn tải toàn bộ dữ liệu hệ thống?</p>
    <template v-slot:actions>
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogDownloadData = false" />
      <ButtonDownload @download-file="downloadDatabase()" class="ms-2" />
    </template>
  </BaseDialog>
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

// Components
import ButtonDelete from "@/components/Button-Delete.vue";
import PageHeader from "@/components/Page-Header.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import { useDisplay } from "vuetify";

// ===== DISPLAY =====
const { lgAndUp } = useDisplay();

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const router = useRouter();

// ===== DIGIKEY =====
const digikeyStatus = ref(null);
const digikeyLoading = ref(false);
const digikeyMessage = ref("");
const digikeyError = ref("");

function formatTokenExpiry(value) {
  if (!value) return "—";
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN");
}

function formatQuota(state) {
  if (!state) return "Chưa có dữ liệu";
  if (state.dailyRemaining != null && state.dailyLimit != null) {
    return `${state.dailyRemaining}/${state.dailyLimit}`;
  }
  return "Chưa có dữ liệu";
}

async function loadDigikeyStatus() {
  try {
    const { data } = await axios.get(`${Url}/DigiKey/OAuth/Status`);
    digikeyStatus.value = data;
  } catch (error) {
    digikeyStatus.value = {
      configured: false,
      connected: false,
      account_id: "",
    };
    digikeyError.value =
      error.response?.data?.error || "Không tải được trạng thái DigiKey";
  }
}

async function connectDigikey() {
  digikeyLoading.value = true;
  digikeyError.value = "";
  try {
    const { data } = await axios.get(`${Url}/DigiKey/OAuth/Start`);
    if (!data?.url) throw new Error("DigiKey không trả URL kết nối.");
    window.location.href = data.url;
  } catch (error) {
    digikeyError.value =
      error.response?.data?.error || error.message || "Kết nối thất bại";
    digikeyLoading.value = false;
  }
}

async function disconnectDigikey() {
  digikeyLoading.value = true;
  digikeyError.value = "";
  try {
    await axios.post(`${Url}/DigiKey/OAuth/Disconnect`);
    digikeyMessage.value = "Đã ngắt kết nối DigiKey.";
    await loadDigikeyStatus();
  } catch (error) {
    digikeyError.value =
      error.response?.data?.error || "Ngắt kết nối thất bại";
  } finally {
    digikeyLoading.value = false;
  }
}

function handleDigikeyQuery() {
  const result = String(route.query.digikey || "");
  if (!result) return;
  if (result === "connected") {
    digikeyMessage.value = "Kết nối DigiKey thành công.";
  } else if (result === "error") {
    digikeyError.value = String(
      route.query.message || "Kết nối DigiKey thất bại.",
    );
  }
  const query = { ...route.query };
  delete query.digikey;
  delete query.message;
  router.replace({ path: route.path, query });
}

onMounted(async () => {
  handleDigikeyQuery();
  await loadDigikeyStatus();
});

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
