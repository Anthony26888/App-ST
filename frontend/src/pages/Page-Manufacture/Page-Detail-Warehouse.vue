<template>
  <div>
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light">
        <ButtonBack v-if="LevelUser === 'Nhân viên'" :to="`/Danh-sach-cong-viec`" @click="removeGoBackListWork" />
        <ButtonBack v-else :to="`/San-xuat/Chi-tiet/${back}`" />
        Theo dõi sản xuất nhập kho</v-card-title
      >
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
        <v-breadcrumbs :items="[`${NameManufacture}`, `${Name_Order}`, `${Name_Category}`]">
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>
      </v-card-title>

      <v-card-text>

        <!-- Production Statistics Cards -->
        <v-row class="mb-4">
          <v-col cols="12" sm="6">
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
          <v-col cols="12" sm="6">
            <v-card class="rounded-lg" color="success" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu ra</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalOutput }}
                </div>
                <div class="text-caption">
                  Tổng số lượng đầu ra
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Input Section -->
        <v-card class="mb-4 rounded-lg" elevation="2">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="12">
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
            :items="manufactureWarehouse"
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
                  :length="Math.ceil((manufactureWarehouse?.length || 0) / itemsPerPage)"
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
import { ref, watch, reactive, computed } from "vue";
import { useRoute } from "vue-router";

// External libraries
import axios from "axios";

// Composables
import { useHistory } from "@/composables/Manufacture/useHistory";
import { useManufactureWarehouse } from "@/composables/Manufacture/useManufactureWarehouse";

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

// Table configuration
const Headers = [
  { title: 'STT', key: 'id', sortable: true },
  { title: 'Mã sản phẩm', key: 'PartNumber', sortable: true },
  { title: 'Trạng thái', key: 'Status', sortable: true },
  { title: 'Thời gian', key: 'Timestamp', sortable: true },
]

// ===== Composables & Data Management =====
// Initialize composables for data fetching
const { history, historyError } = useHistory(back);
const { manufactureWarehouse, manufactureWarehouseError } = useManufactureWarehouse(id);

// ===== Reactive State =====
// UI State
const DialogLoading = ref(false);
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);

// Input/Output State
const Input = ref("");
const isError = ref(false);
const submitting = ref(false);
const totalInput = ref(0);
const totalOutput = ref(0);
const totalErrors = ref(0);
const totalFixed = ref(0);


// Production Info
const NameManufacture = ref("");
const Name_Order = ref("");
const Name_Category = ref("");
const PlanID = ref("");

// ===== User Information =====
const LevelUser = localStorage.getItem("LevelUser");
// ===== Watchers =====
// Watch for manufactureWarehouse changes and log updates
watch(
  manufactureWarehouse,
  (newValue) => {
    console.log("manufactureWarehouse updated:", newValue);
    totalErrors.value = newValue.filter(
      (item) => item.Status === "error"
    ).length;
    totalFixed.value = newValue.filter((item) => item.Status === "fixed").length;
    totalOutput.value = newValue.filter((item) => item.Status === "ok").length;
  },
  { deep: true }
);

// Watch for manufactureWarehouse errors
watch(manufactureWarehouseError, (error) => {
  if (error) {
    console.error("ManufactureWarehouse Error:", error);
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
      totalInput.value = foundHistory.Quantity_Plan ?? 0;
      PlanID.value = foundHistory.PlanID ?? "";
    } else {
      console.log("No matching history found for ID:", id);
      // Set default values if no match found
      Name_Order.value = "";
      NameManufacture.value = "";
      Name_Category.value = "";
      PlanID.value = "";
    }
  },
  { immediate: true, deep: true }
);

// ===== Methods =====
/**
 * Submits a barcode to the Warehouse manufacturing system
 * Handles form submission, API call, and error handling
 */
 const submitBarcode = async () => {
  if (!Input.value || submitting.value) return;
  submitting.value = true;

  DialogLoading.value = true;
  const formData = reactive({
    PartNumber: Input.value,
    Status: isError.value ? 'error' : 'ok',
    Timestamp: new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }),
    HistoryID: id,
    PlanID: PlanID.value
  });
  try {
    const response = await axios.post(`${Url}/Manufacture/Warehouse`, formData);
    console.log(response.data);
    DialogLoading.value = false;
    Input.value = '';
    isError.value = false;
  } catch (error) {
    console.log(error);
  }
    finally {
    DialogLoading.value = false;
    submitting.value = false;
  }
};
</script>
