<template>
  <div>
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light">
        <ButtonBack v-if="LevelUser === 'Nhân viên'" :to="`/Danh-sach-cong-viec`" @click="removeGoBackListWork" />
        <ButtonBack v-else :to="`/San-xuat/Chi-tiet/${back}`" />
        Theo dõi sản xuất RW</v-card-title
      >
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
        <v-breadcrumbs
          :items="[`${NameManufacture}`, `${Name_Order}`, `${Name_Category}`]"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>
      </v-card-title>

      <v-card-text>
        <!-- Production Statistics Cards -->
        <v-row class="mb-4">
          <v-col cols="12" sm="6">
            <v-card class="rounded-xl" color="warning" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu vào</div>
                <div class="text-h4 font-weight-bold">
                  {{ manufactureRW.length || 0 }}
                </div>
                <div class="text-caption">Tổng số lượng hàng lỗi</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6">
            <v-card class="rounded-xl" color="info" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu ra</div>
                <div class="text-h4 font-weight-bold">{{ totalFixed }}</div>
                <div class="text-caption">Tổng số lượng đã sửa</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Table -->
        <v-card class="mt-4 rounded-lg" variant="text">
          <v-card-title class="d-flex align-center">
            <span class="text-h6">Bảng chi tiết sản xuất</span>
            <v-spacer></v-spacer>
            <InputSearch v-model="search" />
          </v-card-title>
          <v-data-table
            :headers="Headers"
            :items="manufactureRW"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
            class="elevation-1 mt-4"
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
            height="calc(100vh - 300px)"
          >
            <template #[`item.Status`]="{ item }">
              <v-chip
                :color="
                  item.Status === 'fail'
                    ? 'warning'
                    : 'infor'
                "
                size="small"
                variant="tonal"
              >
                {{
                  item.Status === "fail"
                    ? "Fail"
                    : "Fixed"
                }}
              </v-chip>
            </template>
            <template #[`item.RWID`]="{ item }">
              <v-chip color ="success" variant="tonal" v-if="item.RWID">
                <v-icon>mdi-check</v-icon>
              </v-chip>
              <v-chip v-else variant="tonal" color="error">
                <v-icon>mdi-alert</v-icon>
              </v-chip>
            </template>
            <template #[`item.Note`]="{ item }">
              <p class="text-error" style="white-space: pre-line">{{ item.Note }}</p>
            </template>
            <template #[`item.Note_RW`]="{ item }">
              <p class="text-primary" style="white-space: pre-line">{{ item.Note_RW }}</p>
            </template>
            <template #[`item.id`]="{ item }">
              <v-btn
                prepend-icon="mdi-tools"
                variant="tonal"
                color="success"
                @click="GetItem(item)"
                class="text-caption"
                >Sửa lỗi</v-btn
              >
            </template>
            <template #[`item.TimestampRW`]="{ item }">
              <p class="text-primary" v-if="item.TimestampRW !== null">
                {{ item.TimestampRW }}
              </p>
              <p v-else>-</p>
            </template>
            <template #[`bottom`]>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="
                    Math.ceil((manufactureRW?.length || 0) / itemsPerPage)
                  "
                ></v-pagination>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>
    </v-card>
    <v-dialog
      :model-value="DialogFix"
      @update:model-value="DialogFix = $event"
      width="600"
    >
      <v-card
        max-width="600"
        prepend-icon="mdi-wrench-clock"
        title="Sản phẩm đã sửa chữa hoàn tất ?"
      >
        <v-card-text> 
          <InputTextarea label="Ghi chú sửa" v-model="Note_RW_Edit"></InputTextarea>
        </v-card-text>
        <template #actions>
          <ButtonCancel @cancel="DialogFix = false" />
          <ButtonSave @save="FixedError()" />
        </template>
      </v-card>
    </v-dialog>
    <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
    <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />"
    <Loading v-model="DialogLoading" />
  </div>
</template>

<script setup>
// ===== Imports =====
// Vue core imports
import { ref, watch, reactive } from "vue";
import { useRoute } from "vue-router";

// External libraries
import axios from "axios";

// Composables
import { useHistory } from "@/composables/Manufacture/useHistory";
import { useManufactureRW } from "@/composables/Manufacture/useManufactureRW";

// Components
import Loading from "@/components/Loading.vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonBack from "@/components/Button-Back.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputTextarea from "@/components/Input-Textarea.vue"
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonSave from "@/components/Button-Save.vue";

// ===== Constants & Configuration =====
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const id = route.params.id;
const back = localStorage.getItem("ManufactureID");
const GetID = ref("");

// Initialize composables for data fetching
const { history, historyError } = useHistory(back);
const { manufactureRW, manufactureRWError } = useManufactureRW(back);

// Table configuration
const Headers = [
  { title: "Vị trí", key: "Type" },
  { title: "Mã sản phẩm", key: "PartNumber" },
  // { title: "Trạng thái", key: "Status" },
  // { title: "Thời gian", key: "Timestamp" },
  { title: "Loại lỗi", key: "GroupFail" },
  { title: "RW đã sửa", key: "RWID" },
  { title: "Ghi chú lỗi", key: "Note" }, 
  { title: "Ghi chú sửa", key: "Note_RW" },
  { title: "Thời gian RW", key: "TimestampRW" },
  { title: "Thao tác", key: "id" },
];

// ===== Composables & Data Management =====

// ===== Reactive State =====
// Dialog
const DialogLoading = ref(false);
const DialogFix = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);

// Message
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// Info Manufacture
const Type = ref("");
const Category = ref("");
const PartNumber = ref("");
const Timestamp = ref("");
const Status = ref("");
const ConditionType = ref("");

// Table
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(15);

// Input/Output State
const Input = ref("");
const isSubmitting = ref(false);
const totalFixed = ref(0);
const totalErrors = ref(0);
const totalInput = ref(0);
const isError = ref(false);

// Production Info
const NameManufacture = ref("");
const Name_Order = ref("");
const Name_Category = ref("");
const Note_RW_Edit = ref("");

// ===== User Information =====
const LevelUser = localStorage.getItem("LevelUser");

// ===== Watchers =====
// Watch for manufactureHand changes and log updates
watch(
  manufactureRW,
  (newValue) => {
    if (newValue && Array.isArray(newValue)) {
      totalErrors.value = newValue.filter(
        (item) => item.Status === "error"
      ).length;
      totalFixed.value = newValue.filter(
        (item) => item.RWID === "Done"
      ).length;
    };

  },
  { deep: true }
);

// Watch for changes in manufacture details to calculate total input
watch(
  () => history,
  (newData) => {
    if (!newData?.value) {
      DialogFailed.value = true;
      MessageErrorDialog.value = "No history data available"
      return;
    }

    if (!Array.isArray(newData.value)) {
      DialogFailed.value = true;
      MessageErrorDialog.value = "History data is not an array"
      return;
    }

    // Convert id to number for comparison since it's coming from route params
    const numericId = Number(id);
    const foundHistory = newData.value.find(
      (item) => Number(item.id) === numericId
    );

    if (foundHistory) {
      Name_Order.value = foundHistory.Name_Order ?? "";
      NameManufacture.value = foundHistory.PONumber ?? "";
      Name_Category.value = foundHistory.Category ?? "";
      totalInput.value = foundHistory.Quantity_Plan ?? 0;
    } else {

      // Set default values if no match found
      Name_Order.value = "";
      NameManufacture.value = "";
      Name_Category.value = "";
    }
  },
  { immediate: true, deep: true }
);

// Watch for changes in manufactureAOI to calculate total output

// ===== Methods =====
/**
 * Submits a barcode to the AOI manufacturing system
 * Handles form submission, API call, and error handling
 */

const GetItem = (item) => {
  DialogFix.value = true;
  GetID.value = item.id;
  PartNumber.value = item.PartNumber;
  Type.value = item.Type;
  Category.value = item.Category;
  Timestamp.value = item.Timestamp;
  Status.value = item.Status;
  Note_RW_Edit.value = item.Note_RW;
};

const FixedError = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Note_RW: Note_RW_Edit.value
  });
  try {
    const response = await axios.put(
      `${Url}/ManufactureCounting/Edit-status-rw/${GetID.value}`, formData 
    );
    MessageDialog.value = "Sữa lỗi thành công";
    // Refresh data after successful update
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Lỗi hệ thống";
    Error();
  }
};

const submitBarcode = async () => {
  if (isSubmitting.value || !Input.value.trim()) {
    return;
  }

  isSubmitting.value = true;
  DialogLoading.value = true;

  const formData = reactive({
    HistoryID: id,
    PartNumber: Input.value.trim(),
    Timestamp: new Date()
      .toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok",
      })
      .replace(/,/g, ""),
    Status: isError.value ? "error" : "ok",
  });

  try {
    const response = await axios.post(`${Url}/Manufacture/RW`, formData);
    Input.value = "";
    isError.value = false;
  } catch (error) {
    console.error("Error submitting barcode:", error);
  } finally {
    DialogLoading.value = false;
    isSubmitting.value = false;
  }
};

const Reset = () => {
  DialogFix.value = false;
  DialogSuccess.value = true;
  DialogLoading.value = false;
};

const Error = () => {
  DialogFailed.value = true;
  DialogLoading.value = false;
};
</script>

<script>
export default {};
</script>
