<template>
  <div>
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light d-flex align-center">
        <ButtonBack
          v-if="LevelUser === 'Nhân viên'"
          :to="`/Danh-sach-cong-viec`"
          @click="removeGoBackListWork"
        />
        <ButtonBack v-else :to="`/San-xuat/Chi-tiet/${back}`" />
        <span class="ml-2">Theo dõi sản xuất AOI</span>
      </v-card-title>

      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-tools" color="primary" size="large"></v-icon>
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
          <v-col cols="12" sm="3">
            <v-card class="rounded-lg" color="primary" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu vào</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalInput }}
                </div>
                <div class="text-caption">Tổng số lượng đầu vào</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="3">
            <v-card class="rounded-lg" color="success" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu ra</div>
                <div class="text-h4 font-weight-bold" v-if="Quantity_AOI > 1">
                  {{ totalOutput }} / {{ totalOutput * Quantity_AOI }}
                </div>
                <div class="text-h4 font-weight-bold" v-else>
                  {{ totalOutput }}
                </div>
                <div class="text-caption">Tổng số lượng đầu ra ( {{ Quantity_AOI }} pcs/ panel )</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="3">
            <v-card class="rounded-lg" color="warning" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Lỗi</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalErrors }}
                </div>
                <div class="text-caption">Tổng số lượng lỗi</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="3">
            <v-card class="rounded-lg" color="info" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đã sửa</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalFixed }}
                </div>
                <div class="text-caption">Tổng số lượng đã sửa</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Input Section -->
        <v-card class="mb-4 rounded-lg" elevation="2">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="8">
                <InputField
                  label="Nhập mã sản phẩm"
                  v-model="Input"
                  @keydown.enter="submitBarcode"
                  ref="barcodeInput"
                  autofocus
                  hide-details
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-checkbox
                  v-model="isError"
                  label="Đánh dấu lỗi"
                  color="warning"
                  hide-details
                  class="mt-2"
                ></v-checkbox>
              </v-col>
            </v-row>
            <InputTextarea
              label="Ghi chú lỗi"
              v-model="ErrorLog"
            ></InputTextarea>
          </v-card-text>
        </v-card>

        <!-- Table -->
        <v-card class="mt-4 rounded-lg" variant="text">
          <v-card-title class="d-flex align-center">
            <span class="text-h6">Bảng chi tiết sản xuất</span>
            <!-- Filter Select -->
            <v-select
              v-model="selectedFilter"
              :items="filterOptions"
              item-title="label"
              item-value="value"
              label="Lọc theo trạng thái"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-filter"
              :color="getFilterColor(selectedFilter)"
              @update:model-value="handleFilterChange"
              class="ml-3 mt-5"
              style="min-width: 150px; max-width: 180px"
            >
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-icon
                      :icon="item.raw.icon"
                      :color="getFilterColor(item.raw.value)"
                      size="small"
                    ></v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-select>
            <v-spacer></v-spacer>
            <InputSearch v-model="searchText" placeholder="Tìm kiếm..." />
          </v-card-title>
          <v-data-table
            :headers="Headers"
            :items="manufactureAOI"
            :search="combinedSearch"
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
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
            <template v-slot:item.stt="{ index }">
              {{ (page - 1) * itemsPerPage + index + 1 }}
            </template>
            <template #[`item.Status`]="{ item }">
              <v-chip
                :color="
                  item.Status === 'error'
                    ? 'warning'
                    : item.Status === 'fixed'
                    ? 'info'
                    : 'success'
                "
                size="small"
                variant="tonal"
              >
                {{
                  item.Status === "error"
                    ? "Lỗi"
                    : item.Status === "fixed"
                    ? "Đã sửa"
                    : "OK"
                }}
              </v-chip>
              <v-btn
                v-if="item.Status === 'fixed'"
                size="small"
                color="success"
                variant="tonal"
                class="ml-2 text-caption"
                @click="GetItem(item)"
              >
                <v-icon size="small">mdi-check</v-icon>
                Kiểm tra
              </v-btn>
            </template>
            <template #item.TimestampRW="{ item }">
              <div class="text-primary">{{ item.TimestampRW }}</div>
            </template>
            <template #item.Note="{ item }">
              <div style="white-space: pre-line">{{ item.Note }}</div>
            </template>
            <template #[`bottom`]>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="
                    Math.ceil((manufactureAOI?.length || 0) / itemsPerPage)
                  "
                ></v-pagination>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>
    </v-card>
    <!-- Dialog xác nhận xóa -->
    <v-dialog
      :model-value="DialogFixed"
      @update:model-value="DialogFixed = $event"
      width="500"
    >
      <v-card
        max-width="500"
        prepend-icon="mdi-hammer-screwdriver"
        title="Xác nhận sửa sản phẩm"
      >
        <v-card-text> Sản phẩm đã được sửa lỗi hoàn tất ? </v-card-text>
        <template #actions>
          <ButtonCancel @cancel="DialogFixed = false" />
          <ButtonAgree @agree="markAsFixed()" />
        </template>
      </v-card>
    </v-dialog>
    <SnackbarSuccess
      :model-value="DialogSuccess"
      @update:model-value="DialogSuccess = $event"
      :message="MessageDialog"
    />
    <SnackbarFailed
      :model-value="DialogFailed"
      @update:model-value="DialogFailed = $event"
      :message="MessageErrorDialog"
    />
    <Loading v-model="DialogLoading" />
  </div>
</template>

<script setup>
// ===== Imports =====
// Vue core imports
import { ref, watch, reactive, computed } from "vue";
import { useRoute } from "vue-router";

// External libraries
import axios from "axios";

// Composables
import { useHistory } from "@/composables/Manufacture/useHistory";
import { useManufactureAOI } from "@/composables/Manufacture/useManufactureAOI";

// Components
import Loading from "@/components/Loading.vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonBack from "@/components/Button-Back.vue";
import InputField from "@/components/Input-Field.vue";
import InputTextarea from "@/components/Input-Textarea.vue";

// ===== Constants & Configuration =====
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const id = route.params.id;
const back = localStorage.getItem("ManufactureID");
const GetID = ref("");

// Table configuration
const Headers = [
  { title: "STT", key: "stt" },
  { title: "Mã sản phẩm", key: "PartNumber", sortable: true },
  { title: "Trạng thái", key: "Status", sortable: true },
  { title: "Ghi chú lỗi", key: "Note", sortable: true },
  { title: "Thời gian", key: "Timestamp", sortable: true },
  { title: "Thời gian RW", key: "TimestampRW", sortable: true },
];

// ===== Composables & Data Management =====
// Initialize composables for data fetching
const { history, historyError } = useHistory(back);
const { manufactureAOI, manufactureAOIError } = useManufactureAOI(id);
// ===== Reactive State =====

// Dialog
const DialogLoading = ref(false);
const DialogFixed = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const MessageErrorDialog = ref("");
const MessageDialog = ref("");

// Table
const searchText = ref("");
const selectedFilter = ref("");
const page = ref(1);
const itemsPerPage = ref(15);

// Input/Output State
const Input = ref("");
const ErrorLog = ref("");
const isSubmitting = ref(false);
const totalInput = ref(0);
const totalOutput = ref(0);
const totalErrors = ref(0);
const totalFixed = ref(0);

// Production Info
const NameManufacture = ref("");
const Name_Order = ref("");
const Name_Category = ref("");
const PlanID = ref("");
const Quantity_AOI = ref(1);

// ===== User Information =====
const LevelUser = localStorage.getItem("LevelUser");

// Add new reactive state
const isError = ref(false);

// ===== Watchers =====
// Watch for manufactureAOI changes and log updates
watch(
  manufactureAOI,
  (newValue) => {
    console.log("manufactureAOI updated:", newValue);
  },
  { deep: true }
);

// Watch for manufactureAOI errors
watch(manufactureAOIError, (error) => {
  if (error) {
    console.error("ManufactureAOI Error:", error);
  }
});

// Watch for changes in manufacture details to calculate total input
watch(
  () => history,
  (newData) => {
    if (!newData?.value) {
      console.log("No history data available");
      return;
    }

    if (!Array.isArray(newData.value)) {
      console.log("History data is not an array");
      return;
    }

    // Convert id to number for comparison since it's coming from route params
    const numericId = Number(id);
    const foundHistory = newData.value.find(
      (item) => Number(item.id) === numericId
    );
    console.log("Found history item:", foundHistory);

    if (foundHistory) {
      Name_Order.value = foundHistory.Name_Order ?? "";
      NameManufacture.value = foundHistory.PONumber ?? "";
      Name_Category.value = foundHistory.Category ?? "";
      PlanID.value = foundHistory.PlanID ?? "";
      totalInput.value = foundHistory.Quantity_Plan ?? 0;
      Quantity_AOI.value = foundHistory.Quantity_AOI ?? 1;
    } else {
      console.log("No matching history found for ID:", id);
      // Set default values if no match found
      Name_Order.value = "";
      NameManufacture.value = "";
      Name_Category.value = "";
      PlanID.value = "";
      Quantity_AOI.value = 1;
    }
  },
  { immediate: true, deep: true }
);

// Watch for changes in manufactureAOI to calculate total output
watch(
  () => manufactureAOI,
  (newData) => {
    if (!newData?.value) {
      console.log("No manufactureAOI data available");
      return;
    }

    if (!Array.isArray(newData.value)) {
      console.log("manufactureAOI data is not an array");
      return;
    }

    // Calculate totals using the array data
    totalErrors.value = newData.value.filter(
      (item) => item?.Status === "error"
    ).length;
    totalFixed.value = newData.value.filter(
      (item) => item?.Status === "fixed"
    ).length;
    totalOutput.value = newData.value.filter(
      (item) => item?.Status === "ok"
    ).length;
  },
  { immediate: true, deep: true }
);

// ===== Methods =====
/**
 * Submits a barcode to the AOI manufacturing system
 * Handles form submission, API call, and error handling
 */
const submitBarcode = async () => {
  if (isSubmitting.value || !Input.value.trim()) {
    return;
  }

  isSubmitting.value = true;
  DialogLoading.value = true;

  const formData = reactive({
    HistoryID: id,
    PartNumber: Input.value.trim(),
    Timestamp: new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
    Status: isError.value ? "error" : "ok",
    Note: ErrorLog.value,
    PlanID: PlanID.value,
  });

  try {
    const response = await axios.post(`${Url}/Manufacture/AOI`, formData);
    DialogLoading.value = false;
    Input.value = "";
    ErrorLog.value = "";
    isError.value = false;
    DialogSuccess.value = true;
    MessageDialog.value = "Sản phẩm đã được nhập thành công";
  } catch (error) {
    DialogLoading.value = false;
    Input.value = "";
    ErrorLog.value ="";
    DialogFailed.value = true;
    MessageErrorDialog.value = "Lỗi khi nhập mã sản phẩm";
  } finally {
    DialogLoading.value = false;
    isSubmitting.value = false;
  }
};

const GetItem = (item) => {
  DialogFixed.value = true;
  GetID.value = item.id;
};

const markAsFixed = async () => {
  DialogFixed.value = true;
  try {
    const response = await axios.put(
      `${Url}/Manufacture/AOI/Edit-status/${GetID.value}`,
      {
        Status: "ok",
      }
    );
    console.log("Item marked as fixed:", response.data);
    // Refresh the data after successful update
    DialogFixed.value = false;
    DialogLoading.value = true;
    DialogSuccess.value = true;
    MessageDialog.value = "Sản phẩm đã được sửa lỗi hoàn tất";
  } catch (error) {
    console.error("Error marking item as fixed:", error);
    DialogFixed.value = false;
    DialogLoading.value = true;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Sản phẩm đã được sửa lỗi hoàn tất";
  } finally {
    DialogLoading.value = false;
  }
};

const isGoBackListWork = computed(() => {
  return localStorage.getItem("Go-Back-List-Work") === "true";
});

const removeGoBackListWork = () => {
  localStorage.removeItem("Go-Back-List-Work");
};

// ===== Filter Methods =====
const combinedSearch = computed(() => {
  // If search text is provided, use it for searching
  if (searchText.value) {
    return searchText.value;
  }
  // If filter is selected, use it for filtering
  if (selectedFilter.value) {
    return selectedFilter.value;
  }
  // No filter or search
  return "";
});

const filterOptions = computed(() => [
  {
    label: "Tất cả",
    value: "",
    icon: "mdi-view-list",
  },
  {
    label: "Lỗi",
    value: "error",
    icon: "mdi-alert-circle",
  },
  {
    label: "Đã sửa",
    value: "fixed",
    icon: "mdi-wrench",
  },
  {
    label: "OK",
    value: "ok",
    icon: "mdi-check-circle",
  },
]);

const getFilterColor = (filterValue) => {
  switch (filterValue) {
    case "error":
      return "warning";
    case "fixed":
      return "info";
    case "ok":
      return "success";
    default:
      return "primary";
  }
};

const getFilterIcon = (filterValue) => {
  switch (filterValue) {
    case "error":
      return "mdi-alert-circle";
    case "fixed":
      return "mdi-wrench";
    case "ok":
      return "mdi-check-circle";
    default:
      return "mdi-view-list";
  }
};

const getFilterLabel = (filterValue) => {
  switch (filterValue) {
    case "error":
      return "Lỗi";
    case "fixed":
      return "Đã sửa";
    case "ok":
      return "OK";
    default:
      return "Tất cả";
  }
};

const handleFilterChange = (value) => {
  selectedFilter.value = value;
  // Clear search text when filter changes
  searchText.value = "";
};
</script>
<style scoped>
/* Filter section styling */
.mb-3 {
  margin-bottom: 0.75rem;
}

/* Filter select styling */
.v-select {
  transition: all 0.3s ease;
}

.v-select:hover {
  transform: translateY(-1px);
}

/* Chip styling for active filters */
.v-chip {
  transition: all 0.2s ease;
}

.v-chip:hover {
  transform: scale(1.05);
}

/* Gap utility for flex items */
.gap-2 {
  gap: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .v-card-title {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .v-select {
    margin-bottom: 8px;
    margin-right: 0 !important;
    min-width: 100% !important;
    max-width: none !important;
  }

  .d-flex.flex-wrap {
    flex-direction: column;
    align-items: flex-start;
  }

  .gap-2 {
    gap: 4px;
  }
}
</style>