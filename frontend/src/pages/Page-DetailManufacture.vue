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
              <v-card class="mx-auto " variant="text" >
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
              <v-card class="mx-auto" variant="text" >
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

        <v-row class="mb-4 mt-2">
          <v-col cols="12" sm="4">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">SMT</div>
              </template>
              <template v-slot:append>
                <ButtonNextManufacture :to="`/San-xuat/SMT/${id}`" />
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
          <v-col cols="12" sm="4">
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
          <v-col cols="12" sm="4">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">Hàn tay</div>
              </template>
              <template v-slot:append>
                <ButtonNextManufacture :to="`/San-xuat/Han-tay/${id}`" />
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-Hand">
                  {{ totalHand }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng sản phẩm hàn tay
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mb-4">
          <v-col cols="12" sm="4">
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
          <v-col cols="12" sm="4">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">Test</div>
              </template>
              <template v-slot:append>
                <ButtonNextManufacture :to="`/San-xuat/Test/${id}`" />
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-Test">
                  {{ totalTest }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng Test
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
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
    </v-card>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  onMounted,
  onBeforeMount,
  onUnmounted,
  computed,
  nextTick,
} from "vue";
import axios from "axios";
import { useRoute } from "vue-router";
import Chart from "chart.js/auto";
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import ButtonNextManufacture from "@/components/Button-Next-Manufacture.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// ... existing imports ...
import { watch } from "vue";
import { useManufactureDetails } from "@/composables/useManufactureDetails";

// ... existing refs and constants ...
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const id = route.params.id;
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);
const DialogLoading = ref(false);
const DialogFailed = ref(false);
const { manufactureDetails, connectionStatus } = useManufactureDetails(id);

// Production statistics
const NameManufacture = localStorage.getItem("ProductName");
// Table

const isBegin = ref(false);
const isConnecting = ref(false);
const connectionStatusMessage = ref("");
const connectionStatusColor = ref("");
const showStatusSnackbar = ref(false);

// Production statistics
const totalInput = ref(0);
const totalSMT = ref(0);
const totalAOI = ref(0);
const totalHand = ref(0);
const totalIPQC = ref(0);
const totalTest = ref(0);
const totalOQC = ref(0);

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
  Hand: manufactureDetails.value?.map((item) => item.Hand) || [],
  IPQC: manufactureDetails.value?.map((item) => item.IPQC) || [],
  Test: manufactureDetails.value?.map((item) => item.Test) || [],
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
  if (localStorage.getItem("isRunning") === id) {
    isBegin.value = true;
  } else {
    isBegin.value = false;
    localStorage.removeItem("isRunning");
  }
});

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
          label: "Hàn tay",
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
          label: "Test",
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
    Data.Hand.reduce((a, b) => a + b, 0) +
    Data.IPQC.reduce((a, b) => a + b, 0) +
    Data.Test.reduce((a, b) => a + b, 0) +
    Data.OQC.reduce((a, b) => a + b, 0);

  // Create new chart
  doughnutChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["SMT", "AOI", "Hàn tay", "IPQC", "Test", "OQC"],
      datasets: [
        {
          data: [
            ((Data.SMT.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
            ((Data.AOI.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
            ((Data.Hand.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
            ((Data.IPQC.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
            ((Data.Test.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
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
      totalHand.value = Data.Hand.reduce((a, b) => a + b, 0);
      totalIPQC.value = Data.IPQC.reduce((a, b) => a + b, 0);
      totalTest.value = Data.Test.reduce((a, b) => a + b, 0);
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
      Data.Hand = newData.map((item) => item.Hand);
      Data.IPQC = newData.map((item) => item.IPQC);
      Data.Test = newData.map((item) => item.Test);
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
        chart.data.datasets[2].data = Data.Hand;
        chart.data.datasets[3].data = Data.IPQC;
        chart.data.datasets[4].data = Data.Test;
        chart.data.datasets[5].data = Data.OQC;
        chart.update();
      }

      // Update doughnut chart if it exists
      if (doughnutChartInstance) {
        const total =
          Data.SMT.reduce((a, b) => a + b, 0) +
          Data.AOI.reduce((a, b) => a + b, 0) +
          Data.Hand.reduce((a, b) => a + b, 0) +
          Data.IPQC.reduce((a, b) => a + b, 0) +
          Data.Test.reduce((a, b) => a + b, 0) +
          Data.OQC.reduce((a, b) => a + b, 0);

        doughnutChartInstance.data.datasets[0].data = [
          ((Data.SMT.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ((Data.AOI.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ((Data.Hand.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ((Data.IPQC.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ((Data.Test.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
          ((Data.OQC.reduce((a, b) => a + b, 0) / total) * 100).toFixed(1),
        ];
        doughnutChartInstance.update();
      }

      // Update statistics
      totalSMT.value = Data.SMT.reduce((a, b) => a + b, 0);
      totalAOI.value = Data.AOI.reduce((a, b) => a + b, 0);
      totalHand.value = Data.Hand.reduce((a, b) => a + b, 0);
      totalIPQC.value = Data.IPQC.reduce((a, b) => a + b, 0);
      totalTest.value = Data.Test.reduce((a, b) => a + b, 0);
      totalOQC.value = Data.OQC.reduce((a, b) => a + b, 0);
    }
  },
  { deep: true, immediate: true }
);
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
