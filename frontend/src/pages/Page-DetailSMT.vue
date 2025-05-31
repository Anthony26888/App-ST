<template>
  <div>
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light">
        <ButtonBack :to="`/San-xuat/Chi-tiet/${id}`" />
        Theo dõi sản xuất SMT</v-card-title
      >
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
        {{ NameManufacture }}
        <v-spacer></v-spacer>
        <v-chip
          :prepend-icon="
            status === 'Online'
              ? 'mdi-contactless-payment-circle'
              : 'mdi-web-off'
          "
          :color="status === 'Online' ? 'green' : 'red'"
          class="ma-2"
          dark
          size="large"
        >
          {{ status }}
        </v-chip>
        <v-btn
          class="text-caption ms-2"
          @click="connectArduino"
          :color="isBegin ? 'error' : 'success'"
          :loading="isConnecting"
        >
          <v-icon :icon="isBegin ? 'mdi-stop' : 'mdi-play'"></v-icon>
          &nbsp;
          {{ isBegin ? "Dừng" : "Bắt đầu" }}
        </v-btn>
        <p>{{}}</p>
        <v-btn @click="resetData" class="ms-2 text-caption" color="primary"
          >Reset dữ liệu</v-btn
        >
      </v-card-title>

      <v-card-text>
        <!-- Production Statistics Cards -->

        <v-row class="mb-4">
          <v-col cols="12" sm="6">
            <v-card class="mx-auto" elevation="2">
              <v-card-text>
                <div class="text-h6 mb-2">Đầu vào</div>
                <div class="text-h4 font-weight-bold text-error">
                  {{ totalInput }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng đầu vào
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6">
            <v-card class="mx-auto" elevation="2">
              <v-card-text>
                <div class="text-h6 mb-2">Đầu ra</div>
                <div class="text-h4 font-weight-bold text-success">
                  {{ manufactureSMT.length }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng đầu ra
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Table -->
        <v-card class="mt-4" variant="text">
          <v-card-title class="d-flex align-center">
            <span>Bảng chi tiết sản xuất</span>
            <v-spacer></v-spacer>
            <InputSearch v-model="search" />
          </v-card-title>
          <v-data-table
            :headers="Headers"
            :items="manufactureSMT"
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
            height="calc(100vh - 200px)"
          >
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
import { useManufactureDetails } from "@/composables/useManufactureDetails";
import { useManufactureSMT } from "@/composables/useManufactureSMT";
import { useDeviceStatusSocket } from "@/composables/useStatusSensor";
// Components
import Loading from "@/components/Loading.vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonBack from "@/components/Button-Back.vue";

// ===== Constants & Configuration =====
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const id = route.params.id;

// Table configuration
const Headers = [
  { title: "STT", key: "id" },
  { title: "Mã sản phẩm", key: "Input" },
  { title: "Thời gian", key: "Timestamp" },
];

// ===== Composables & Data Management =====
// Initialize composables for data fetching
const manufactureDetails = useManufactureDetails(id);
const { manufactureSMT, manufactureSMTError } = useManufactureSMT(id)
console.log(manufactureSMT)
const { status } = useDeviceStatusSocket("esp32-001");
// ===== Reactive State =====
// UI State
const DialogLoading = ref(false);
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);

// Input/Output State
const totalInput = ref(0);
const totalOutput = ref(0);

// Production Info
const NameManufacture = localStorage.getItem("ProductName");


const isBegin = ref(false);
const isConnecting = ref(false);
const connectionStatusMessage = ref("");
const connectionStatusColor = ref("");
const showStatusSnackbar = ref(false);

onMounted(() => {
  if (localStorage.getItem("isRunning") === id) {
    isBegin.value = true;
  } else {
    isBegin.value = false;
    localStorage.removeItem("isRunning");
  }
});

// Watch for changes in manufacture details to calculate total input
watch(
  () => manufactureDetails.manufactureDetails,
  (newData) => {
    if (newData?.value && Array.isArray(newData.value)) {
      totalInput.value = newData.value.reduce((sum, item) => sum + (item.Total || 0), 0);
    }
  },
  { immediate: true, deep: true },
);

const connectArduino = () => {
  const formData = reactive({
    project_id: isBegin.value ? "" : route.params.id,
  });
  isConnecting.value = true;
  axios
    .post(`${Url}/api/project-id`, formData)
    .then(function (response) {
      console.log(response.data);
      isBegin.value = !isBegin.value;
      connectionStatusMessage.value = response.data.message;
      connectionStatusColor.value = isBegin.value ? "success" : "error";
      showStatusSnackbar.value = true;
    })
    .catch(function (error) {
      console.log(error);
      connectionStatusMessage.value = "Có lỗi xảy ra";
      connectionStatusColor.value = "error";
      showStatusSnackbar.value = true;
    })
    .finally(() => {
      isConnecting.value = false;
    });
};


// Reset data
const resetData = () => {
  axios
    .delete(`${Url}/reset-data/${id}`)
    .then(function (response) {
      console.log(response.data);
      totalInput.value = 0;
      totalOutput.value = 0;
    })
    .catch(function (error) {
      console.log(error);
    });
  console.log("resetData");
};
</script>
