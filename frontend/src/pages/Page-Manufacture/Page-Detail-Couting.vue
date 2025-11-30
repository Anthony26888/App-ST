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
        <span class="ml-2" v-if="lgAndUp">Theo dõi sản xuất</span>
      </v-card-title>

      <v-card-title class="d-flex align-center pe-2" v-if="lgAndUp">
        <v-icon icon="mdi mdi-tools" color="primary"></v-icon> &nbsp;
        <v-breadcrumbs
          :items="[`${NameManufacture}`, `${Name_Order}`, `${Type_Manufacture}`, `${Name_Category}`]"
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
            <CardStatistic
              title="Đầu vào"
              :value="totalInput"
              icon="mdi-import"
              color="primary"
              subtitle="Tổng số lượng đầu vào"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <CardStatistic
              title="Đầu ra"
              :value="totalOutput"
              icon="mdi-check-circle"
              color="success"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-success mb-1">
                  {{ PercentOutput }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="PercentOutput"
                  height="8"
                  color="success"
                  rounded
                  class="mt-4"
                  bg-color="success"
                  bg-opacity="0.2"
                ></v-progress-linear>
              </template>
            </CardStatistic>
          </v-col>
          <v-col cols="12" sm="3">
            <CardStatistic
              title="Lỗi"
              :value="totalErrors"
              icon="mdi-alert-circle"
              color="warning"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-warning mb-1">
                  {{ PercentError }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="PercentError"
                  height="8"
                  color="warning"
                  rounded
                  class="mt-4"
                  bg-color="warning"
                  bg-opacity="0.2"
                ></v-progress-linear>
              </template>
            </CardStatistic>
          </v-col>
          <v-col cols="12" sm="3">
            <CardStatistic
              title="Đã sửa"
              :value="totalFixed"
              icon="mdi-wrench"
              color="info"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-info mb-1">
                  {{ PercentFixed }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="PercentFixed"
                  height="8"
                  color="info"
                  rounded
                  class="mt-4"
                  bg-color="info"
                  bg-opacity="0.2"
                ></v-progress-linear>
              </template>
            </CardStatistic>
          </v-col>
        </v-row>

        <!-- Input Section -->
        <v-card class="mb-4 rounded-xl border" variant="elevated" elevation="0" v-if="lgAndUp">
          <v-card-text>
            <v-row dense>
              <v-col cols="12" md="5">
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
              <v-col cols="12" md="5">
                <InputSelect
                  label="Phân loại lỗi"
                  :items="[
                    'Lỗi hàn',
                    'Lỗi linh kiện',
                    'Lỗi ngoại quan',
                    'Lỗi chức năng',
                    'Lỗi lắp ráp cơ khí',
                    'Lỗi quy trình / Vận hành',
                    'Lỗi không xác định',
                  ]"
                  multiple
                  chips
                  v-model="Group_Fail"
                  hide-details
                  variant="outlined"
                  density="comfortable"
                  placeholder="Chọn 1 hoặc nhiều loại lỗi"
                />
              </v-col>
              <v-col cols="2">
                <InputField
                  label="Số lượng sản phẩm"
                  type="number"
                  v-model="Quantity_Add"
                  hide-details
                  variant="outlined"
                  density="comfortable"
                  placeholder="VD: 5"
                />
              </v-col>
              

              <v-col cols="12" class="mt-4">
                <InputTextarea
                  label="Ghi chú lỗi chi tiết"
                  v-model="ErrorLog"
                  rows="2"
                  hint="Mô tả chi tiết lỗi (ví dụ: Vết xước 2cm ở mặt trước)."
                  variant="outlined"
                ></InputTextarea>
              </v-col>
            </v-row>
            <ButtonSave @keydown.enter="submitBarcode" @click="submitBarcode"  autoforcus/>
          </v-card-text>
        </v-card>

        <!-- Table -->
        <v-card class="mt-4 rounded-xl border" variant="elevated" elevation="0">
          <v-card-title class="d-flex align-center">
            <span class="text-h6" v-if="lgAndUp">Bảng chi tiết sản xuất</span>
            <!-- Filter Select -->
            <v-select
              v-if="lgAndUp"
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
            <v-spacer v-if="lgAndUp"></v-spacer>
            <InputSearch v-if="lgAndUp" v-model="searchText" placeholder="Tìm kiếm..." />
          </v-card-title>
          <v-data-table
            v-if="lgAndUp"
            :headers="Headers"
            :items="filteredManufactureCounting"
            :search="combinedSearch"
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            class="elevation-1 mt-4 rounded-xl"
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
            height="53vh"
          >
            <template v-slot:item.stt="{ index }">
              {{ (page - 1) * itemsPerPage + index + 1 }}
            </template>
            <template #[`item.Status`]="{ item }">
              <v-chip
                :color="
                  item.Status === 'fail'
                    ? 'warning'
                    : item.Status === 'fixed'
                    ? 'info'
                    : 'success'
                "
                size="small"
                variant="tonal"
              >
                {{
                  item.Status === "fail"
                    ? "Fail"
                    : item.Status === "fixed"
                    ? "Fixed"
                    : "Pass"
                }}
              </v-chip>
              <v-chip
                color="info"
                class="ms-2"
                v-if="item.Status_Fixed === 'fixed'"
                size="small"
                variant="tonal"
                >Fixed</v-chip
              >
              
            </template>
            <template #item.RWID="{ item }">
              <v-chip
                color="success"
                class="ms-2"
                v-if="item.RWID === 'Done'"
                size="small"
                variant="tonal"
                >
                <v-icon>mdi-check</v-icon>
              </v-chip>
            </template>
            <template #item.TimestampRW="{ item }">
              <div class="text-primary">{{ item.TimestampRW }}</div>
            </template>
            <template #item.Note="{ item }">
              <div style="white-space: pre-line" class="text-error">
                {{ item.Note }}
              </div>
            </template>
            <template #item.id="{ item }">
              <v-btn
                v-if="item.Status === 'fail'"
                size="small"
                color="success"
                variant="tonal"
                class="ml-2 text-caption"
                @click="GetItem(item)"
                prepend-icon = "mdi-check"
              >
                Kiểm tra
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="error"
                icon="mdi-trash-can"
                @click="GetItemHistory(item)"
              ></v-btn>
            </template>
            <template #[`bottom`]>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="
                    Math.ceil(
                      (filteredManufactureCounting?.length || 0) / itemsPerPage
                    )
                  "
                ></v-pagination>
              </div>
            </template>
          </v-data-table>

          <v-data-table
            v-else
            :headers="Headers"
            :items="filteredManufactureCounting"
            :search="combinedSearch"
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            class="elevation-1 mt-4 rounded-xl"
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
            height="53vh"
          >
            <template v-slot:item.stt="{ index }">
              {{ (page - 1) * itemsPerPage + index + 1 }}
            </template>
            <template #[`item.Status`]="{ item }">
              <v-chip
                :color="
                  item.Status === 'fail'
                    ? 'warning'
                    : item.Status === 'fixed'
                    ? 'info'
                    : 'success'
                "
                size="small"
                variant="tonal"
              >
                {{
                  item.Status === "fail"
                    ? "Fail"
                    : item.Status === "fixed"
                    ? "Fixed"
                    : "Pass"
                }}
              </v-chip>
              <v-chip
                color="info"
                class="ms-2"
                v-if="item.Status_Fixed === 'fixed'"
                size="small"
                variant="tonal"
                >Fixed</v-chip
              >
              
            </template>
            <template #item.RWID="{ item }">
              <v-chip
                color="success"
                class="ms-2"
                v-if="item.RWID === 'Done'"
                size="small"
                variant="tonal"
                >
                <v-icon>mdi-check</v-icon>
              </v-chip>
            </template>
            <template #item.TimestampRW="{ item }">
              <div class="text-primary">{{ item.TimestampRW }}</div>
            </template>
            <template #item.Note="{ item }">
              <div style="white-space: pre-line" class="text-error">
                {{ item.Note }}
              </div>
            </template>
            <template #item.id="{ item }">
              <v-btn
                v-if="item.Status === 'fail'"
                size="small"
                color="success"
                variant="tonal"
                class="ml-2 text-caption"
                @click="GetItem(item)"
                prepend-icon = "mdi-check"
              >
                Kiểm tra
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="error"
                icon="mdi-trash-can"
                @click="GetItemHistory(item)"
              ></v-btn>
            </template>
            <template #[`bottom`]>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="
                    Math.ceil(
                      (filteredManufactureCounting?.length || 0) / itemsPerPage
                    )
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
        title="Xác nhận đã sửa sản phẩm"
      >
        <v-card-text> Sản phẩm đã được sửa lỗi hoàn tất ? </v-card-text>
        <template #actions>
          <ButtonCancel @cancel="DialogFixed = false" />
          <ButtonAgree @agree="markAsFixed()" />
        </template>
      </v-card>
    </v-dialog>

    <!-- Dialog xác nhận xóa dữ liệu lịch sử sản xuất -->
    <v-dialog v-model="DialogRemoveHistory" width="400">
      <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
        <v-card-text> Bạn có chắc chắn muốn xoá dữ liệu ? </v-card-text>
        <template v-slot:actions>
          <ButtonCancel @cancel="DialogRemoveHistory = false" />
          <ButtonDelete @delete="RemoveItemHistory()" />
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
import { useDisplay } from "vuetify";
// External libraries
import axios from "axios";

// Composables
import { useHistory } from "@/composables/Manufacture/useHistory";
import { useManufactureCounting } from "@/composables/Manufacture/useManufactureCounting";

// Components
import Loading from "@/components/Loading.vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import InputField from "@/components/Input-Field.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import CardStatistic from "@/components/Card-Statistic.vue";

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
  { title: "Loại lỗi", key: "GroupFail", sortable: true },
  { title: "Ghi chú lỗi", key: "Note", sortable: true },
  { title: "Thời gian", key: "Timestamp", sortable: true },
  { title: "RW đã sửa", key: "RWID", sortable: true },
  { title: "Thời gian RW", key: "TimestampRW", sortable: true },
  { title: "Thao tác", key: "id" },
];

// ===== Composables & Data Management =====
// Initialize composables for data fetching
const { history, historyError } = useHistory(back);
const { manufactureCounting, manufactureCountingError } =
  useManufactureCounting(id);
const { mdAndDown, lgAndUp } = useDisplay();
// ===== Reactive State =====

// Dialog
const DialogLoading = ref(false);
const DialogFixed = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogRemoveHistory = ref(false);
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
const Quantity_Add = ref(0);

const PercentOutput = computed(() =>
  Number.parseFloat((totalOutput.value * 100) / totalInput.value).toFixed(1)
);

const PercentError = computed(() =>
  Number.parseFloat((totalErrors.value * 100) / totalInput.value).toFixed(1)
);

const PercentFixed = computed(() =>
  Number.parseFloat((totalFixed.value * 100) / totalInput.value).toFixed(1)
);

// Production Info
const NameManufacture = ref("");
const Name_Order = ref("");
const Name_Category = ref("");
const PlanID = ref("");
const Type_Manufacture = ref("");
const Quantity_Counting = ref(1);

// ===== User Information =====
const LevelUser = localStorage.getItem("LevelUser");

// Add new reactive state
const isError = ref(false);
const Group_Fail = ref(null);

// ===== Watchers =====

// Watch for changes in manufacture details to calculate total input
watch(
  () => history,
  (newData) => {
    if (!newData?.value) {
      DialogFailed.value = true;
      MessageErrorDialog.value =
        "Lỗi không có dữ liệu - Vui lòng tải lại dữ liệu";
      return;
    }

    if (!Array.isArray(newData.value)) {
      DialogFailed.value = true;
      MessageErrorDialog.value =
        "Lỗi không có dữ liệu - Vui lòng tải lại dữ liệu";
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
      PlanID.value = foundHistory.PlanID ?? "";
      totalInput.value = foundHistory.Quantity_Plan ?? 0;
      Type_Manufacture.value = foundHistory.Type ?? "";
    } else {
      // Set default values if no match found
      Name_Order.value = "";
      NameManufacture.value = "";
      Name_Category.value = "";
      PlanID.value = "";
      Type_Manufacture.value = ""
    }
  },
  { immediate: true, deep: true }
);

// Watch for changes in manufactureAOI to calculate total output
watch(
  () => manufactureCounting,
  (newData) => {
    if (!newData?.value) {
      DialogFailed.value = true;
      MessageErrorDialog.value = "No manufactureAOI data available"
      return;
    }

    if (!Array.isArray(newData.value)) {
      DialogFailed.value = true;
      MessageErrorDialog.value = "Data is not an array"
      return;
    }

    // Calculate totals using the array data
    totalErrors.value = newData.value.filter(
      (item) => item?.Status === "fail"
    ).length;
    totalFixed.value = newData.value.filter(
      (item) => item?.Status_Fixed === "fixed"
    ).length;
    totalOutput.value = newData.value.filter(
      (item) => item?.Status === "pass"
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
  // 1. Kiểm tra điều kiện đầu vào cơ bản
  // if (isSubmitting.value || !Input.value.trim()) {
  //   return;
  // }

  isSubmitting.value = true;
  DialogLoading.value = true;

  const isFail = Group_Fail.value && Group_Fail.value.length > 0;

  // 2. Cấu trúc lại formData để bao gồm tất cả dữ liệu
  const formData = reactive({
    HistoryID: id,
    PartNumber: Input.value.trim(),
    Status: isFail ? "fail" : "pass",
    GroupFail: isFail ? Group_Fail.value.join(", ") : null,
    Note: isFail ? ErrorLog.value : null, 
    PlanID: PlanID.value,
    Type: Type_Manufacture.value,
    Quantity: Quantity_Add.value || 1, 
  });

  try {
    const response = await axios.post(`${Url}/ManufactureCounting`, formData);
    DialogLoading.value = false;
    
    // Reset các giá trị sau khi thành công
    Input.value = "";
    ErrorLog.value = "";
    Group_Fail.value = []; // Cần reset mảng phân loại lỗi
    Quantity_Add.value = 1
    DialogSuccess.value = true;
    MessageDialog.value = "Sản phẩm đã được nhập thành công";
  } catch (error) {
    DialogLoading.value = false;
    Input.value = "";
    ErrorLog.value = "";
    Quantity_Add.value = 1
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

const GetItemHistory = (item) => {
  DialogRemoveHistory.value = true;
  GetID.value = item.id;
};

const markAsFixed = async () => {
  DialogFixed.value = true;
  const formData = reactive({
    PlanID: PlanID.value,
    Type: Type_Manufacture.value,
  });
  try {
    const response = await axios.put(
      `${Url}/ManufactureCounting/Edit-status-fixed/${GetID.value}`, formData
    );
    // Refresh the data after successful update
    DialogFixed.value = false;
    DialogLoading.value = true;
    DialogSuccess.value = true;
    MessageDialog.value = "Sản phẩm đã được sửa lỗi hoàn tất";
  } catch (error) {
    DialogFixed.value = false;
    DialogLoading.value = true;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Sản phẩm đã được sửa lỗi hoàn tất";
  } finally {
    DialogLoading.value = false;
  }
};

// Hàm xóa item lịch sử sản xuất
const RemoveItemHistory = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/ManufactureCounting/Delete-item-history/${GetID.value}?PlanID=${PlanID.value}&Type=${Type_Manufacture.value}`
    );
    DialogSuccess.value = true;
    DialogLoading.value = false;
    DialogRemoveHistory.value = false;
    MessageDialog.value = "Xoá dữ liệu thành công";
  } catch (error) {
    DialogFailed.value = true;
    DialogLoading.value = false;
    DialogRemoveHistory.value = false;
    MessageErrorDialog.value = error;
    Error();
  }
};

const isGoBackListWork = computed(() => {
  return localStorage.getItem("Go-Back-List-Work") === "true";
});

const removeGoBackListWork = () => {
  localStorage.removeItem("Go-Back-List-Work");
};

// ===== Filter Methods =====
const filteredManufactureCounting = computed(() => {
  if (!manufactureCounting.value || !Array.isArray(manufactureCounting.value)) {
    return [];
  }

  let filtered = manufactureCounting.value;

  // Apply Status_Fixed filter
  if (selectedFilter.value === "status_fixed") {
    filtered = filtered.filter((item) => item.Status_Fixed === "fixed");
  } else if (selectedFilter.value && selectedFilter.value !== "") {
    // Apply other status filters
    filtered = filtered.filter((item) => item.Status === selectedFilter.value);
  }

  // Apply search text filter
  if (searchText.value && searchText.value.trim() !== "") {
    const searchLower = searchText.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.PartNumber?.toLowerCase().includes(searchLower) ||
        item.Note?.toLowerCase().includes(searchLower) ||
        item.Timestamp?.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
});

const combinedSearch = computed(() => {
  // For Status_Fixed filtering, we use custom filtering instead of v-data-table search
  if (selectedFilter.value === "status_fixed") {
    return "";
  }

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
    label: "Fail",
    value: "fail",
    icon: "mdi-alert-circle",
  },
  {
    label: "Pass",
    value: "pass",
    icon: "mdi-check-circle",
  },
  {
    label: "Fixed",
    value: "status_fixed",
    icon: "mdi-hammer-screwdriver",
  },
]);

const getFilterColor = (filterValue) => {
  switch (filterValue) {
    case "fail":
      return "warning";
    case "pass":
      return "success";
    case "status_fixed":
      return "info";
    default:
      return "primary";
  }
};

const getFilterIcon = (filterValue) => {
  switch (filterValue) {
    case "fail":
      return "mdi-alert-circle";
    case "fixed":
      return "mdi-wrench";
    case "pass":
      return "mdi-check-circle";
    case "status_fixed":
      return "mdi-hammer-screwdriver";
    default:
      return "mdi-view-list";
  }
};

const getFilterLabel = (filterValue) => {
  switch (filterValue) {
    case "fail":
      return "Fail";
    case "fixed":
      return "Fixed";
    case "pass":
      return "Pass";
    case "status_fixed":
      return "Đã sửa";
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
