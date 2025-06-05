<template>
  <div>
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light">
        <ButtonBack to="/san-xuat" />
        Theo dõi sản xuất</v-card-title
      >
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
        {{ NameManufacture }}
      </v-card-title>

      <v-card-text>
        <v-snackbar
          v-model="showStatusSnackbar"
          :color="connectionStatusColor"
          :timeout="3000"
          location="bottom"
        >
          {{ connectionStatusMessage }}
        </v-snackbar>

        <!-- Production Statistics Cards -->
        <v-card elevation="2" class="mx-auto rounded-xl">
          <v-row class="">
            <v-col cols="12" sm="4">
              <v-card class="mx-auto" variant="text">
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
            <v-divider inset vertical></v-divider>
            <v-col cols="12" sm="4">
              <v-card class="mx-auto" variant="text">
                <v-card-text>
                  <div class="text-h6 mb-2">Đầu ra</div>
                  <div class="text-h4 font-weight-bold text-success">
                    {{ totalOQC }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Tổng số lượng đầu ra
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-divider inset vertical></v-divider>
            <v-col cols="12" sm="4">
              <v-card class="mx-auto" variant="text">
                <v-card-text>
                  <div class="text-h6 mb-2">Tỷ lệ</div>
                  <div class="text-h4 font-weight-bold text-primary">
                    {{ percent }} %
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Phần trăm số lượng đầu ra
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card>

        <v-row class="mb-4 mt-2" cols="auto">
          <v-col cols="12" sm="4" v-if="Level_SMT == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">SMT</div>
              </template>
              <template v-slot:append>
                <!-- <ButtonNextManufacture :to="`/San-xuat/SMT/${id}`" /> -->
                <ButtonNextManufacture @click="DialogHistorySMT = true" />
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-SMT">
                  {{ totalSMT }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng SMT
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4" v-if="Level_AOI == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">AOI</div>
              </template>
              <template v-slot:append>
                <ButtonNextManufacture :to="`/San-xuat/AOI/${id}`" />
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-AOI">
                  {{ totalAOI }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng AOI
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4" v-if="Level_RW == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">RW</div>
              </template>
              <template v-slot:append>
                <ButtonNextManufacture :to="`/San-xuat/Han-tay/${id}`" />
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-Hand">
                  {{ totalRW }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng sản phẩm RW
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4" v-if="Level_IPQC == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">IPQC</div>
              </template>
              <template v-slot:append>
                <ButtonNextManufacture :to="`/San-xuat/IPQC/${id}`" />
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-IPQC">
                  {{ totalIPQC }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng IPQC
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4" v-if="Level_Assembly == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">Assembly</div>
              </template>
              <template v-slot:append>
                <ButtonNextManufacture :to="`/San-xuat/Test/${id}`" />
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-Test">
                  {{ totalAssembly }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng Assembly
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4" v-if="Level_OQC == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">OQC</div>
              </template>
              <template v-slot:append>
                <ButtonNextManufacture :to="`/San-xuat/OQC/${id}`" />
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-OQC">
                  {{ totalOQC }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng OQC
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Production Chart -->
        <v-row>
          <v-col cols="12" md="8">
            <v-card class="mb-4 rounded-xl" elevation="2" height="400px">
              <v-card-title class="d-flex align-center">
                <span>Biểu đồ sản xuất</span>
                <v-spacer></v-spacer>
                <v-select
                  v-model="chartTimeRange"
                  :items="['Ngày']"
                  density="compact"
                  variant="outlined"
                  style="max-width: 150px"
                ></v-select>
              </v-card-title>
              <v-card-text>
                <canvas ref="productionChart" height="300"></canvas>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="mb-4 rounded-xl" elevation="2" height="400px">
              <v-card-title class="d-flex align-center">
                <span>Tỷ lệ sản xuất</span>
              </v-card-title>
              <v-card-text>
                <canvas ref="doughnutChart" height="300"></canvas>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text>
        <!-- Bảng dữ liệu -->
        <v-data-table
          :headers="HeadersHistory"
          :items="history"
          :search="search"
          :group-by="[{ key: 'Type' }]"
          class="mt-5"
          :loading="!history.length"
        >
          <template v-slot:top>
            <v-toolbar flat dense>
              <v-toolbar-title>
                <v-icon
                  color="medium-primay"
                  icon="mdi-book-multiple"
                  size="x-small"
                  start
                ></v-icon>
                Kế hoạch sản xuất
              </v-toolbar-title>

              <v-spacer></v-spacer>

              <ButtonAdd label="Thêm" @click="DialogAdd = true" />
            </v-toolbar>
          </template>

          <template
            v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }"
          >
            <tr>
              <td :colspan="columns.length">
                <v-btn
                  variant="text"
                  :icon="isGroupOpen ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                  @click="toggleGroup(item)"
                  class="me-2"
                ></v-btn>
                <span class="font-weight-bold">{{ item.value }}</span>
              </td>
            </tr>
          </template>
          
          <template v-slot:item.id="{ item }">
            <div class="d-flex gap-2">
              <ButtonEye @click="PushItem(item)" />
              <ButtonEdit @click="GetItem(item)" />
            </div>
          </template>
          

          <template v-slot:no-data>
            <v-alert type="info" text="Không có dữ liệu" class="ma-4"></v-alert>
          </template>

          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>
          <template v-slot:item.Percent="{ item }">
            <v-progress-linear v-model="item.Percent" height="25" color="success">
              <strong>{{ Math.ceil(item.Percent) }}%</strong>
            </v-progress-linear>
          </template>
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(history.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="DialogAdd" width="500" scrollable>
      <v-card max-width="500" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
          Thêm dữ liệu kế hoạch
        </v-card-title>
        <v-card-text>
          <InputSelect
            label="Công đoạn"
            :items="['SMT', 'AOI', 'RW', 'ASSEMBLY', 'IPQC', 'OQC']"
            variant="solo-filled"
            v-model="Type_Add"
          />
          <InputField label="Số PO" v-model="PONumber_Add" />
          <InputField label="Hạng mục" v-model="Category_Add" />

          <v-row>
            <v-col cols="12" sm="4">
              <InputField
                label="Số lượng"
                type="number"
                v-model="Quantity_Plan_Add"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField
                label="Vòng lặp"
                type="number"
                v-model="CycleTime_Add"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField label="Thời gian" type="number" v-model="Time_Add" />
            </v-col>
          </v-row>
          <InputTextarea label="Ghi chú" v-model="Note_Add" />
        </v-card-text>
        <v-card-actions>
          <ButtonCancel @cancel="DialogAdd = false" />
          <ButtonSave @save="SaveAdd()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Edit ---->
    <v-dialog v-model="DialogEdit" width="500" scrollable>
      <v-card max-width="500" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
          Sửa dữ liệu kế hoạch
        </v-card-title>
        <v-card-text>
          <InputSelect
            label="Công đoạn"
            :items="['SMT', 'AOI', 'RW', 'ASSEMBLY', 'IPQC', 'OQC']"
            variant="solo-filled"
            v-model="Type_Edit"
          />
          <InputField label="Số PO" v-model="PONumber_Edit" />
          <InputField label="Hạng mục" v-model="Category_Edit" />

          <v-row>
            <v-col cols="12" sm="4">
              <InputField
                label="Số lượng"
                type="number"
                v-model="Quantity_Plan_Edit"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField
                label="Vòng lặp"
                type="number"
                v-model="CycleTime_Edit"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField label="Thời gian" type="number" v-model="Time_Edit" />
            </v-col>
          </v-row>
          <InputTextarea label="Ghi chú" v-model="Note_Edit" />
        </v-card-text>
        <v-card-actions>
          <ButtonCancel @cancel="DialogEdit = false" />
          <ButtonSave @save="SaveEdit()" />
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Dialog xác nhận xóa -->
    <v-dialog v-model="DialogRemove" max-width="500px">
      <v-card>
        <v-card-title>Xác nhận xóa</v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa dự án này?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="RemoveItem">Xác nhận</v-btn>
          <v-btn color="error" @click="DialogRemove = false">Hủy</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
    <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
    <Loading v-model="DialogLoading" />
  </div>
</template>

<script setup>
import { ref, watch, reactive, computed, nextTick, onMounted } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import Chart from "chart.js/auto";
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonNextManufacture from "@/components/Button-Next-Manufacture.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// ... existing imports ...
import { useManufactureDetails } from "@/composables/useManufactureDetails";
import { useManufacture } from "@/composables/useManufacture";
import { useHistory } from "@/composables/useHistory";

// ... existing refs and constants ...
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const router = useRouter();
const id = route.params.id;

const { manufactureDetails, connectionStatus } = useManufactureDetails(id);
const { manufacture, manufactureFound, manufactureError, isConnected } =
  useManufacture();
const { history, historyError, refresh } = useHistory(id);

// Dialog
const DialogSuccess = ref(false);
const DialogLoading = ref(false);
const DialogFailed = ref(false);
const DialogAdd = ref(false);
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");
// Production statistics
const NameManufacture = localStorage.getItem("ProductName");
const GetID = ref(null);

// Production statistics
const totalInput = ref(0);
const totalSMT = ref(0);
const totalAOI = ref(0);
const totalRW = ref(0);
const totalIPQC = ref(0);
const totalAssembly = ref(0);
const totalOQC = ref(0);

// Level
const Level_SMT = ref(false);
const Level_AOI = ref(0);
const Level_RW = ref(0);
const Level_IPQC = ref(0);
const Level_Assembly = ref(0);
const Level_OQC = ref(0);

// Data
const DataManufacture = ref(null);
// ===== FORM ADD =====
const Type_Add = ref("");
const PONumber_Add = ref(localStorage.getItem("ProductName"));
const Category_Add = ref("");
const Quantity_Plan_Add = ref("");
const CycleTime_Add = ref("");
const Time_Add = ref("");
const Note_Add = ref("");

// ===== FORM EDIT =====
const Type_Edit = ref("");
const PONumber_Edit = ref("");
const Category_Edit = ref("");
const Quantity_Plan_Edit = ref("");
const CycleTime_Edit = ref("");
const Time_Edit = ref("");
const Note_Edit = ref("");

// Table
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);
const HeadersHistory = [
  { title: "Ngày", key: "Created_At", sortable: true },
  { title: "Công đoạn", key: "Type", sortable: true },
  { title: "Tên dự án", key: "PONumber", sortable: true },
  { title: "Tên danh mục", key: "Category", sortable: true },
  { title: "Đầu vào", key: "Quantity_Plan", sortable: true },
  { title: "Đầu ra", key: "Quantity_Real", sortable: true },
  { title: "Tỷ lệ (%)", key: "Percent", sortable: true },
  { title: "Thao tác", key: "id", sortable: false },
];

// Watch for manufactureFound changes to update levels
watch(
  manufactureFound,
  (newValue) => {
    if (newValue && newValue.Level) {
      DataManufacture.value = newValue.Level;
      // Initialize levels based on DataManufacture
      Level_SMT.value = DataManufacture.value?.includes("SMT") || false;
      Level_AOI.value = DataManufacture.value?.includes("AOI") || false;
      Level_RW.value = DataManufacture.value?.includes("RW") || false;
      Level_IPQC.value = DataManufacture.value?.includes("IPQC") || false;
      Level_Assembly.value = DataManufacture.value?.includes("Assembly") || false;
      Level_OQC.value = DataManufacture.value?.includes("OQC") || false;
    } else {
      console.warn("No manufacture data found or Level is undefined");
    }
  },
  { immediate: true }
);

// Watch for manufacture errors
watch(manufactureError, (error) => {
  if (error) {
    console.error("Manufacture error:", error);
    DialogFailed.value = true;
  }
});

// Computed percent Input and Output
const percent = computed(() => {
  if (totalInput.value === 0 || totalOQC.value === 0) {
    return 0;
  }
  return Math.round((totalOQC.value / totalInput.value) * 100);
});

// Add new ref for doughnut chart
const doughnutChart = ref(null);
let doughnutChartInstance = null;

// Data for chart
const Data = {
  labels: manufactureDetails.value?.map((item) => `${item.Date}`) || [],
  SMT: manufactureDetails.value?.map((item) => item.SMT) || [],
  AOI: manufactureDetails.value?.map((item) => item.AOI) || [],
  RW: manufactureDetails.value?.map((item) => item.RW) || [],
  IPQC: manufactureDetails.value?.map((item) => item.IPQC) || [],
  Assembly: manufactureDetails.value?.map((item) => item.Assembly) || [],
  OQC: manufactureDetails.value?.map((item) => item.OQC) || [],
};

// Status last seen
const now = Date.now();
const timeout = 60000;

// Add to script section
const chartTimeRange = ref("Ngày");
const productionChart = ref(null);
let chart = null;

// Initialize chart
onMounted(() => {
  nextTick(() => {
    initializeChart();
    initializeDoughnutChart();
    fetchProductionData();
  });
});

// ====== COMPUTED ======
const formattedSelectedDate = computed(() => {
  const date = new Date();
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
});

// ====== CRUD ========
const PushItem = (item) => {
  localStorage.setItem("ManufactureID", id);
  if (item.Type === "SMT") {
    router.push(`/san-xuat/SMT/${item.id}`);
  } else if (item.Type === "AOI") {
    router.push(`/san-xuat/AOI/${item.id}`);
  } else if (item.Type === "RW") {
    router.push(`/san-xuat/RW/${item.id}`);
  } else if (item.Type === "Assembly") {
    router.push(`/san-xuat/Assembly/${item.id}`);
  } else if (item.Type === "IPQC") {
    router.push(`/san-xuat/IPQC/${itemid}`);
  } else if (item.Type === "OQC") {
    router.push(`/san-xuat/OQC/${item.id}`);
  }
};

const GetItem = (item) => {
  DialogEdit.value = true;
  Type_Edit.value = item.Type;
  PONumber_Edit.value = item.PONumber;
  Category_Edit.value = item.Category;
  Quantity_Plan_Edit.value = item.Quantity_Plan;
  CycleTime_Edit.value = item.CycleTime_Plan;
  Time_Edit.value = item.Time_Plan;
  Note_Edit.value = item.Note;
  GetID.value = item.id;
};

const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Type: Type_Edit.value,
    PlanID: route.params.id,
    PONumber: PONumber_Edit.value,
    Category: Category_Edit.value,
    Quantity_Plan: Quantity_Plan_Edit.value,
    CycleTime_Plan: CycleTime_Edit.value,
    Time_Plan: Time_Edit.value,
    Note: Note_Edit.value,
    Created_At: formattedSelectedDate.value,
  });

  try {
    const response = await axios.put(
      `${Url}/Summary/Edit-item/${GetID.value}`,
      formData
    );
    console.log(response.data.message);
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    Error();
  }
};

/**
 * Saves new customer data
 * Makes an API call to create a new customer
 */

const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Type: Type_Add.value,
    PlanID: route.params.id,
    PONumber: PONumber_Add.value,
    Category: Category_Add.value,
    Quantity_Plan: Quantity_Plan_Add.value,
    CycleTime_Plan: CycleTime_Add.value,
    Time_Plan: Time_Add.value,
    Note: Note_Add.value,
    Created_At: formattedSelectedDate.value,
  });

  try {
    const response = await axios.post(`${Url}/Summary/Add-item`, formData);
    console.log(response.data);
    MessageDialog.value = "Thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    Error();
  }
};

function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  DialogLoading.value = false;
}

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}

function initializeChart() {
  if (!productionChart.value) return;

  const ctx = productionChart.value.getContext("2d");

  // Destroy existing chart if it exists
  if (chart) {
    chart.destroy();
  }

  // Create new chart with initial data
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Data.labels,
      datasets: [
        {
          label: "SMT",
          backgroundColor: "rgba(25, 118, 210, 0.8)",
          borderColor: "#1976D2",
          data: Data.SMT,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        },
        {
          label: "AOI",
          backgroundColor: "rgba(192,192,192, 0.8)",
          borderColor: "#C0C0C0",
          data: Data.AOI,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        },
        {
          label: "RW",
          backgroundColor: "rgba(255, 0, 0, 0.8)",
          borderColor: "#FF0000",
          data: Data.Hand,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        },
        {
          label: "IPQC",
          backgroundColor: "rgba(255, 0, 255, 0.8)",
          borderColor: "#FF00FF",
          data: Data.IPQC,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        },
        {
          label: "Assembly",
          backgroundColor: "rgba(255, 165, 0, 0.8)",
          borderColor: "#FFA500",
          data: Data.Test,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        },
        {
          label: "OQC",
          backgroundColor: "rgba(76, 175, 80, 0.8)",
          borderColor: "#4CAF50",
          data: Data.OQC,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.9,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        title: {
          display: true,
          text: "Biểu đồ sản xuất theo ngày",
          font: {
            size: 16,
            weight: "bold",
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat("vi-VN").format(
                  context.parsed.y
                );
              }
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          stacked: false,
          title: {
            display: true,
            text: "Số lượng",
            font: {
              weight: "bold",
            },
          },
          ticks: {
            callback: function (value) {
              return new Intl.NumberFormat("vi-VN").format(value);
            },
          },
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
        },
        x: {
          stacked: false,
          title: {
            display: true,
            text: "Ngày",
            font: {
              weight: "bold",
            },
          },
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

// Add doughnut chart initialization function
function initializeDoughnutChart() {
  if (!doughnutChart.value) return;

  const ctx = doughnutChart.value.getContext("2d");

  // Destroy existing chart if it exists
  if (doughnutChartInstance) {
    doughnutChartInstance.destroy();
  }

  // Calculate total for percentage
  const total =
    Data.SMT.reduce((a, b) => a + b, 0) +
    Data.AOI.reduce((a, b) => a + b, 0) +
    Data.RW.reduce((a, b) => a + b, 0) +
    Data.IPQC.reduce((a, b) => a + b, 0) +
    Data.Assembly.reduce((a, b) => a + b, 0) +
    Data.OQC.reduce((a, b) => a + b, 0);

  // Create new chart
  doughnutChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["SMT", "AOI", "RW", "IPQC", "Assembly", "OQC"],
      datasets: [
        {
          data: [
            ((Data.SMT.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
            ((Data.AOI.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
            ((Data.RW.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
            ((Data.IPQC.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
            ((Data.Assembly.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
            ((Data.OQC.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ],
          backgroundColor: [
            "rgba(25, 118, 210, 0.8)",
            "rgba(192,192,192, 0.8)",
            "rgba(255, 0, 0, 0.8)",
            "rgba(255, 0, 255, 0.8)",
            "rgba(255, 165, 0, 0.8)",
            "rgba(76, 175, 80, 0.8)",
          ],
          borderColor: [
            "#1976D2",
            "#C0C0C0",
            "#FF0000",
            "#FF00FF",
            "#FFA500",
            "#4CAF50",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw || 0;
              return `${label}: ${value}%`;
            },
          },
        },
      },
    },
  });
}

// Update fetchProductionData to use real data
async function fetchProductionData() {
  try {
    DialogLoading.value = true;

    // Use real data from manufactureDetails
    if (manufactureDetails.value && manufactureDetails.value.length > 0) {
      totalSMT.value = Data.SMT.reduce((a, b) => a + b, 0);
      totalAOI.value = Data.AOI.reduce((a, b) => a + b, 0);
      totalRW.value = Data.RW.reduce((a, b) => a + b, 0);
      totalIPQC.value = Data.IPQC.reduce((a, b) => a + b, 0);
      totalAssembly.value = Data.Assembly.reduce((a, b) => a + b, 0);
      totalOQC.value = Data.OQC.reduce((a, b) => a + b, 0);
    }
  } catch (error) {
    console.error("Error fetching production data:", error);
    DialogFailed.value = true;
  } finally {
    DialogLoading.value = false;
  }
}

// Watch for time range changes
watch(chartTimeRange, () => {
  fetchProductionData();
});

// Watch for changes in manufactureDetails
watch(
  manufactureDetails,
  (newData) => {
    if (newData && newData.length > 0) {
      // Update Data object
      Data.labels = newData.map((item) => `${item.Date}`);
      Data.SMT = newData.map((item) => item.SMT);
      Data.AOI = newData.map((item) => item.AOI);
      Data.RW = newData.map((item) => item.RW);
      Data.IPQC = newData.map((item) => item.IPQC);
      Data.Assembly = newData.map((item) => item.Assembly);
      Data.OQC = newData.map((item) => item.OQC);

      // Calculate total input
      totalInput.value = newData.reduce(
        (sum, item) => sum + (item.Total || 0),
        0
      );

      // Update bar chart if it exis
      if (chart) {
        chart.data.labels = Data.labels;
        chart.data.datasets[0].data = Data.SMT;
        chart.data.datasets[1].data = Data.AOI;
        chart.data.datasets[2].data = Data.RW;
        chart.data.datasets[3].data = Data.IPQC;
        chart.data.datasets[4].data = Data.Assembly;
        chart.data.datasets[5].data = Data.OQC;
        chart.update();
      }

      // Update doughnut chart if it exists
      if (doughnutChartInstance) {
        const total =
          Data.SMT.reduce((a, b) => a + b, 0) +
          Data.AOI.reduce((a, b) => a + b, 0) +
          Data.RW.reduce((a, b) => a + b, 0) +
          Data.IPQC.reduce((a, b) => a + b, 0) +
          Data.Assembly.reduce((a, b) => a + b, 0) +
          Data.OQC.reduce((a, b) => a + b, 0);

        doughnutChartInstance.data.datasets[0].data = [
          ((Data.SMT.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ((Data.AOI.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ((Data.RW.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ((Data.IPQC.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ((Data.Assembly.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ((Data.OQC.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
        ];
        doughnutChartInstance.update();
      }

      // Update statistics
      totalSMT.value = Data.SMT.reduce((a, b) => a + b, 0);
      totalAOI.value = Data.AOI.reduce((a, b) => a + b, 0);
      totalRW.value = Data.RW.reduce((a, b) => a + b, 0);
      totalIPQC.value = Data.IPQC.reduce((a, b) => a + b, 0);
      totalAssembly.value = Data.Assembly.reduce((a, b) => a + b, 0);
      totalOQC.value = Data.OQC.reduce((a, b) => a + b, 0);
    }
  },
  { deep: true, immediate: true }
);

// Add watcher for history changes
watch(
  history,
  (newHistory) => {
    console.log("History data updated:", newHistory);
  },
  { deep: true }
);

// Add watcher for history errors
watch(historyError, (error) => {
  if (error) {
    console.error("History error:", error);
    DialogFailed.value = true;
    MessageErrorDialog.value = error;
  }
});
</script>
<script>
export default {
  components: {
    ButtonBack,
    ButtonEye,
    InputSearch,
    InputField,
    InputFiles,
    ButtonImportFile,
    ButtonDownload,
    ButtonNextManufacture,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
  },
};
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}
.v-card:hover {
  transform: translateY(-2px);
}
.color-SMT {
  color: #1976d2;
}
.color-AOI {
  color: #c0c0c0;
}
.color-Hand {
  color: #ff0000;
}
.color-IPQC {
  color: #ff00ff;
}
.color-Test {
  color: #ffa500;
}
.color-OQC {
  color: #4caf50;
}
</style>
