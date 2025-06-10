<template>
  <div>
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light">
        <ButtonBack :to="`/San-xuat/Chi-tiet/${back}`" />
        Theo dõi sản xuất RW</v-card-title
      >
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
        {{ NameManufacture }}
      </v-card-title>

      <v-card-text>

        <!-- Production Statistics Cards -->
        <v-row class="mb-4">
          <v-col cols="12" sm="4">
            <v-card class="rounded-lg" color="primary" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu vào</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalInput }}
                </div>
                <div class="text-caption">
                  Tổng số lượng đầu vào
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card class="rounded-lg" color="info" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu ra</div>
                <div class="text-h4 font-weight-bold">
                  {{ manufactureHand.length }}
                </div>
                <div class="text-caption">
                  Tổng số lượng đầu ra
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card class="rounded-lg" color="warning" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Lỗi</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalErrors }}
                </div>
                <div class="text-caption">
                  Tổng số lượng lỗi
                </div>
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
          </v-card-text>
        </v-card>

        <!-- Table -->
        <v-card class="mt-4 rounded-lg" variant="text">
          <v-card-title class="d-flex align-center">
            <span class="text-h6">Bảng chi tiết sản xuất</span>
            <v-spacer></v-spacer>
            <InputSearch v-model="search" />
          </v-card-title>
          <v-data-table
            :headers="Headers"
            :items="manufactureHand"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model="page"
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
                :color="item.Status === 'error' ? 'warning' : 'success'"
                size="small"
                variant="tonal"
              >
                {{ item.Status === 'error' ? 'Lỗi' : 'OK' }}
              </v-chip>
            </template>
            <template #[`bottom`]>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil((manufactureHand?.length || 0) / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>
    </v-card>
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
import { useManufactureHand } from "@/composables/Manufacture/useManufactureRW";

// Components
import Loading from "@/components/Loading.vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonBack from "@/components/Button-Back.vue";
import InputField from "@/components/Input-Field.vue";

// ===== Constants & Configuration =====
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const id = route.params.id;
const back = localStorage.getItem("ManufactureID");

// Initialize composables for data fetching
const { history, historyError } = useHistory(back);
const { manufactureHand, manufactureHandError } = useManufactureHand(id);

// Table configuration
const Headers = [
  { title: "STT", key: "id" },
  { title: "Mã sản phẩm", key: "PartNumber" },
  { title: "Thời gian", key: "Timestamp" },
  { title: "Trạng thái", key: "Status" },
];

// ===== Composables & Data Management =====


// ===== Reactive State =====
// UI State
const DialogLoading = ref(false);
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);

// Input/Output State
const Input = ref("");
const isSubmitting = ref(false);
const totalInput = ref(0);
const totalOutput = ref(0);
const totalErrors = ref(0);
const isError = ref(false);

// Production Info
const NameManufacture = localStorage.getItem("ProductName");

// ===== Watchers =====
// Watch for manufactureHand changes and log updates
watch(manufactureHand, (newValue) => {
  console.log("manufactureHand updated:", newValue);
  if (newValue?.value && Array.isArray(newValue.value)) {
    totalErrors.value = newValue.value.filter(item => item.Status === 'error').length;
  }
}, { deep: true });

// Watch for manufactureAOI changes and log updates
watch(manufactureHand, (newValue) => {
  console.log("manufactureAOI updated:", newValue);
}, { deep: true });

// Watch for manufactureAOI errors
watch(manufactureHandError, (error) => {
  if (error) {
    console.error("ManufactureAOI Error:", error);
  }
});

// Watch for changes in manufacture details to calculate total input
watch(
  () => history,
  (newData) => {
    console.log("History data:", newData);
    if (newData?.value && Array.isArray(newData.value)) {
      const filteredHistory = newData.value.filter(item => item.Type === 'RW');
      console.log("Filtered AOI history:", filteredHistory);
      totalInput.value = filteredHistory.reduce((sum, item) => sum + (Number(item.Quantity_Plan) || 0), 0);
      console.log("Total input calculated:", totalInput.value);
    }
  },
  { immediate: true, deep: true },
);

// Watch for changes in manufactureAOI to calculate total output
watch(
  () => manufactureHand,
  (newData) => {
    if (newData?.value && Array.isArray(newData.value)) {
      totalOutput.value = newData.value.reduce((sum, item) => sum + (item.TotalOutput || 0), 0);
    }
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
    Timestamp: new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    }).replace(/,/g, ''),
    Status: isError.value ? 'error' : 'ok'
  });

  try {
    const response = await axios.post(`${Url}/Manufacture/RW`, formData);
    console.log(response.data);
    Input.value = "";
    isError.value = false;
  } catch (error) {
    console.error("Error submitting barcode:", error);
  } finally {
    DialogLoading.value = false;
    isSubmitting.value = false;
  }
};
</script>
