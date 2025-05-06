<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >
      <ButtonBack to="/san-xuat" />
      Theo dõi sản xuất</v-card-title
    >
    <v-card-title class="d-flex align-center pe-2">
      <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
          {{ NameManufacture }}

      <v-spacer></v-spacer>
      
    </v-card-title>
    <v-card-text>
      <!-- Production Statistics Cards -->
      <v-row class="mb-4">
        <v-col cols="12" sm="3">
          <v-card class="mx-auto" elevation="2">
            <v-card-text>
              <div class="text-h6 mb-2">Số lượng đề ra</div>
              <div class="text-h4 font-weight-bold text-info">
                {{ totalTarget }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Tổng số lượng cần đạt được
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="3">
          <v-card class="mx-auto" elevation="2">
            <v-card-text>
              <div class="text-h6 mb-2">Số lượng đầu vào</div>
              <div class="text-h4 font-weight-bold text-primary">
                {{ totalInput }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Tổng số lượng sản phẩm đầu vào
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="3">
          <v-card class="mx-auto" elevation="2">
            <v-card-text>
              <div class="text-h6 mb-2">Số lượng đầu ra</div>
              <div class="text-h4 font-weight-bold text-success">
                {{ totalOutput }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Tổng số lượng sản phẩm đầu ra
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="3">
          <v-card class="mx-auto" elevation="2">
            <v-card-text>
              <div class="text-h6 mb-2">Tỉ lệ thành công</div>
              <div class="text-h4 font-weight-bold" :class="successRateColor">
                {{ successRate }}%
              </div>
              <div class="text-caption text-medium-emphasis">
                Tỉ lệ sản phẩm đạt chuẩn
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Production Chart -->
      <v-card class="mb-4" elevation="2">
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

      
    </v-card-text>
  </v-card>

  <!-- Existing dialogs -->
  // ... existing dialogs ...
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from "vue";
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
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import { watch } from "vue";
import { useManufactureDetails } from "@/composables/useManufactureDetails";
import { useManufacture } from "@/composables/useManufacture";
import { useSensorCount } from "@/composables/useSensorCount";


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
const { manufacture } = useManufacture();
const { count } = useSensorCount(id);
console.log("connectionStatus:", connectionStatus.value);
// Production statistics
const NameManufacture = localStorage.getItem("ProductName");

const totalInput = ref(0);
const totalOutput = ref(0);
const totalTarget = ref(0);
const successRate = computed(() => {
  if (totalInput.value === 0) return 0;
  return ((totalOutput.value / totalInput.value) * 100).toFixed(1);
});

const successRateColor = computed(() => {
  const rate = parseFloat(successRate.value);
  if (rate >= 90) return "text-success";
  if (rate >= 70) return "text-warning";
  return "text-error";
});

// Chart configuration
const chartTimeRange = ref('Tháng');
const productionChart = ref(null);
let chart = null;

// Data for chart
const Data = {
  labels: manufactureDetails.value?.map(item => item.Date) || [],
  input: manufactureDetails.value?.map(item => item.Input) || [],
  output: manufactureDetails.value?.map(item => item.Output) || [],
  target: manufactureDetails.value?.map(item => item.Total) || []
};
console.log("Data:", Data);


// Initialize chart
onMounted(() => {
  // Wait for next tick to ensure DOM is ready
  nextTick(() => {
    initializeChart();
    fetchProductionData();
  });
});

function initializeChart() {
  if (!productionChart.value) return;

  const ctx = productionChart.value.getContext('2d');
  
  // Destroy existing chart if it exists
  if (chart) {
    chart.destroy();
  }

  // Create new chart with initial data
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Data.labels,
      datasets: [
        {
          label: 'Đầu vào',
          backgroundColor: 'rgba(25, 118, 210, 0.8)',
          borderColor: '#1976D2',
          data: Data.input,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        },
        {
          label: 'Đầu ra',
          backgroundColor: 'rgba(76, 175, 80, 0.8)',
          borderColor: '#4CAF50',
          data: Data.output,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        },
        {
          label: 'Mục tiêu',
          type: 'line',
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          data: Data.target,
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointStyle: 'dash',
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        title: {
          display: true,
          text: 'Biểu đồ sản xuất theo ngày',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('vi-VN').format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          stacked: false,
          title: {
            display: true,
            text: 'Số lượng',
            font: {
              weight: 'bold'
            }
          },
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('vi-VN').format(value);
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          stacked: false,
          title: {
            display: true,
            text: 'Ngày',
            font: {
              weight: 'bold'
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Update fetchProductionData to use real data
async function fetchProductionData() {
  try {
    DialogLoading.value = true;
    
    // Use real data from manufactureDetails
    if (manufactureDetails.value && manufactureDetails.value.length > 0) {
      totalInput.value = Data.input.reduce((a, b) => a + b, 0);
      totalOutput.value = Data.output.reduce((a, b) => a + b, 0);
      totalTarget.value = Data.target[0] || 0;
    }
  } catch (error) {
    console.error('Error fetching production data:', error);
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
watch(manufactureDetails, (newData) => {
  if (newData && newData.length > 0) {
    // Update Data object
    Data.labels = newData.map(item => item.Date);
    Data.input = newData.map(item => item.Input);
    Data.output = newData.map(item => item.Output);
    Data.target = newData.map(item => item.Total);

    // Update chart if it exists
    if (chart) {
      chart.data.labels = Data.labels;
      chart.data.datasets[0].data = Data.input;
      chart.data.datasets[1].data = Data.output;
      chart.data.datasets[2].data = Data.target;
      chart.update();
    }

    // Update statistics
    totalInput.value = Data.input.reduce((a, b) => a + b, 0);
    totalOutput.value = Data.output.reduce((a, b) => a + b, 0);
    totalTarget.value = Data.target[0] || 0;
  }
}, { deep: true, immediate: true });

// ... existing methods ...
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
</style>
