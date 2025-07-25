<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex justify-space-between align-center pa-4">
      <span class="text-h4 font-weight-light">Báo cáo hằng ngày</span>
      <v-spacer></v-spacer>
      <v-toolbar rounded="lg" border floating class="mt-3">
        <div class="d-flex align-center px-4">
          <div class="text-subtitle-1 mr-4">
            {{ formattedWeekDate }}
          </div>
          <v-menu
            v-model="dateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            min-width="auto"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                class="text-subtitle-1"
                prepend-icon="mdi-calendar"
              >
                {{ formattedSelectedDate }}
              </v-btn>
            </template>
            <v-date-picker
              v-model="selectedDate"
              @update:model-value="dateMenu = false"
              :first-day-of-week="1"
            ></v-date-picker>
          </v-menu>
        </div>
      </v-toolbar>
    </v-card-title>

    <!-- Thống kê tổng quan -->
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg" color="primary" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Tổng số PO</div>
              <div class="text-h4 font-weight-bold">
                {{ summary?.map((item) => item.PONumber).length || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg" color="info" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Tổng số hạng mục</div>
              <div class="text-h4 font-weight-bold">
                {{ summary?.map((item) => item.Category).length || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg" color="success" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Dự án hoàn thành</div>
              <div class="text-h4 font-weight-bold">
                {{
                  summary?.filter((item) => Number(item.Percent) >= 100)
                    .length || 0
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg" color="warning" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Dự án đang thực hiện</div>
              <div class="text-h4 font-weight-bold">
                {{
                  summary?.filter((item) => Number(item.Percent) < 100)
                    .length || 0
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts -->
      <v-row>
        <v-col cols="12" md="7">
          <v-card class="mb-4 rounded-xl" elevation="2" height="500px">
            <v-card-title class="d-flex align-center">
              <span>Biểu đồ so sánh kế hoạch và thực tế theo hạng mục</span>
            </v-card-title>
            <v-card-text>
              <canvas ref="summaryChart" height="400"></canvas>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="5">
          <v-card class="mb-4 rounded-xl" elevation="2" height="500px">
            <v-card-title class="d-flex align-center">
              <span>Phân bố theo loại</span>
            </v-card-title>
            <v-card-text>
              <canvas ref="pieChart" height="400"></canvas>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Bảng dữ liệu -->
      <v-data-table-virtual
        :headers="Headers"
        :items="summary"
        :search="search"
        :group-by="[{ key: 'Type' }]"
        class="mt-3"
        fixed-header
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
              Báo cáo chi tiết
            </v-toolbar-title>
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
              <span class="font-weight-bold text-primary">{{
                item.value
              }}</span>
            </td>
          </tr>
        </template>
        <template #[`item.Quantity_Plan`]="{ item }">
          <v-chip color="primary" variant="tonal">{{
            item.Quantity_Plan
          }}</v-chip>
        </template>
        <template #[`item.Quantity_Real`]="{ item }">
          <v-chip color="success" variant="tonal">{{
            item.Quantity_Real
          }}</v-chip>
        </template>
        <template v-slot:item.Percent="{ item }">
          <v-progress-linear v-model="item.Percent" height="25" color="success">
            <strong>{{ item.Percent.toFixed(1) }}%</strong>
          </v-progress-linear>
        </template>
      </v-data-table-virtual>

      <!-- Bảng dữ liệu tỷ lệ lỗi -->
      <v-data-table-virtual
        :headers="HeadersError"
        :items="summary"
        :group-by="[{ key: 'Name_Order' }]"
        class="mt-5"
        fixed-header
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
              Tỷ lệ lỗi trong đơn hàng
            </v-toolbar-title>
          </v-toolbar>
        </template>

        <template v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }">
          <tr>
            <td :colspan="columns.length">
              <v-btn
                variant="text"
                :icon="isGroupOpen ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                @click="toggleGroup(item)"
                class="me-2"
              ></v-btn>
              <span class="font-weight-bold text-primary">{{ item.value }}</span>
            </td>
          </tr>
        </template>

        <template #[`item.Quantity_Error`]="{ item }">
          <div class="d-flex">
            <p class="text-primary">
              {{ item.Quantity_Real + item.Quantity_Error }}
            </p>
            /
            <p class="text-error">{{ item.Quantity_Error }}</p>
          </div>
        </template>
        <template #[`item.Quantity_Real`]="{ item }">
          <v-progress-linear
            :model-value="
              Number(
                (item.Quantity_Error * 100) /
                  (item.Quantity_Real + item.Quantity_Error) || 0
              )
            "
            height="25"
            color="success"
          >
            <strong
              >{{
                (
                  (item.Quantity_Error * 100) /
                    (item.Quantity_Real + item.Quantity_Error) || 0
                ).toFixed(1)
              }}%</strong
            >
          </v-progress-linear>
        </template>
      </v-data-table-virtual>

      <!-- Bảng dữ liệu hoạt động các công đoạn -->
      <v-data-table-virtual
        :items="status"
        :headers="HeadersActived"
        item-value="device_id"
        class="mt-5"
        fixed-header
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
              Hoạt động các công đoạn
            </v-toolbar-title>
          </v-toolbar>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="item.status === 'online' ? 'green' : 'red'" dark>
            <v-icon left>{{ item.status === 'online' ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
            {{ item.status === 'online' ? 'Đang hoạt động' : 'Ngắt kết nối' }}
          </v-chip>
        </template>
      </v-data-table-virtual>
    </v-card-text>
  </v-card>

  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { useRouter } from "vue-router";
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import Chart from "chart.js/auto";

// Components
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// Composables
import { useSummary } from "@/composables/Summary/useSummary";
import { useActived } from "@/composables/Summary/useActived"

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Router
const router = useRouter();

// Initialize composables

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogSuccess = ref(false); // Success notification
const DialogFailed = ref(false); // Error notification
const DialogLoading = ref(false); // Loading state
// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== Table States =====
const search = ref("");
const itemsPerPage = ref(15);
const page = ref(1);
const Headers = ref([
  { key: "PONumber", title: "Dự án", width: "150" },
  { key: "Name_Order", title: "Đơn hàng", width: "150" },
  { key: "Category", title: "Hạng mục", width: "300" },
  {
    title: "Kế hoạch",
    align: "center",
    children: [
      { title: "Số lượng (pcs)", key: "Quantity_Plan" },
      { title: "Vòng lập (s)", key: "CycleTime_Plan" },
      { title: "Thời gian (s)", key: "Time_Plan" },
    ],
  },
  {
    title: "Thực tế",
    align: "center",
    children: [
      { title: "Số lượng (pcs)", key: "Quantity_Real" },
      { title: "Phần trăm (%)", key: "Percent" },
      { title: "Ghi chú", key: "Note" },
    ],
  },
]);

const HeadersError = ref([
  { key: "PONumber", title: "Dự án" },
  { key: "Type", title: "Công đoạn"},
  { key: "Quantity_Error", title: "Tổng / Lỗi" },
  { key: "Quantity_Real", title: "Tỷ lệ lỗi" },
]);


const HeadersActived = [
  { title: 'ID thiết bị', key: 'Device' },
  { title: 'Tên thiết bị', key: 'Source' },
  { title: 'Trạng thái', key: 'status' },
  { title: 'Lần cuối online', key: 'LatestTimestamp' }
]

// ===== COMPUTED =======
const dateMenu = ref(false);
const selectedDate = ref(new Date().toLocaleDateString("sv")); // Returns YYYY-MM-DD in local time

const formattedSelectedDate = computed(() => {
  const date = new Date(selectedDate.value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
});

const formattedWeekDate = computed(() => {
  const selectedDateObj = new Date(selectedDate.value);
  const day = selectedDateObj.getDay();
  const diff = selectedDateObj.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(selectedDateObj);
  monday.setDate(diff);

  const getWeekNumber = (d) => {
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const weekNumber = getWeekNumber(monday);
  const weekday = selectedDateObj.toLocaleDateString("vi-VN", {
    weekday: "long",
    timeZone: "Asia/Bangkok",
  });

  return `Tuần ${weekNumber} - ${weekday}`;
});


// Pass the computed ref to useSummary
const { summary, summaryError } = useSummary(formattedSelectedDate);
const  { status,  statusError, } = useActived()

// Watch for errors
watch(summaryError, (error) => {
  if (error) {
    MessageErrorDialog.value = error;
    DialogFailed.value = true;
  }
});

// Add debug logging
watch(
  summary,
  (newValue) => {
    console.log("Summary data updated:", newValue);
  },
  { deep: true }
);

// ===== CHART CONFIGURATION =====
const summaryChart = ref(null);
const pieChart = ref(null);
let chart = null;
let pieChartInstance = null;

// Initialize charts
onMounted(() => {
  nextTick(() => {
    initializeChart();
    initializePieChart();
  });
});

function initializeChart() {
  if (!summaryChart.value) return;

  const ctx = summaryChart.value.getContext("2d");

  // Destroy existing chart if it exists
  if (chart) {
    chart.destroy();
  }

  // Group data by Category
  const groupedData =
    summary.value?.reduce((acc, item) => {
      if (!acc[item.Category]) {
        acc[item.Category] = {
          plan: 0,
          real: 0,
        };
      }
      acc[item.Category].plan += Number(item.Quantity_Plan) || 0;
      acc[item.Category].real += Number(item.Quantity_Real) || 0;
      return acc;
    }, {}) || {};

  // Sort categories by total quantity (plan + real)
  const sortedCategories = Object.entries(groupedData)
    .sort(([, a], [, b]) => b.plan + b.real - (a.plan + a.real))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  // Prepare data for chart
  const chartData = {
    labels: Object.keys(sortedCategories),
    datasets: [
      {
        label: "Kế hoạch",
        data: Object.values(sortedCategories).map((item) => item.plan),
        backgroundColor: "rgba(25, 118, 210, 0.8)",
        borderColor: "#1976D2",
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
      {
        label: "Thực tế",
        data: Object.values(sortedCategories).map((item) => item.real),
        backgroundColor: "rgba(76, 175, 80, 0.8)",
        borderColor: "#4CAF50",
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
    ],
  };

  // Create new chart
  chart = new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      indexAxis: 'y', // This makes it horizontal
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
          text: "Biểu đồ so sánh kế hoạch và thực tế theo hạng mục",
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
            title: function (tooltipItems) {
              const category = tooltipItems[0].label;
              const planValue =
                tooltipItems[0].dataset.data[tooltipItems[0].dataIndex];
              const realValue =
                tooltipItems[1].dataset.data[tooltipItems[0].dataIndex];
              const percentage = ((realValue / planValue) * 100).toFixed(1);

              return [
                `Hạng mục: ${category}`,
                `Kế hoạch: ${new Intl.NumberFormat("vi-VN").format(
                  planValue
                )} pcs`,
                `Thực tế: ${new Intl.NumberFormat("vi-VN").format(
                  realValue
                )} pcs`,
                `Tỷ lệ hoàn thành: ${percentage}%`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
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
        y: {
          stacked: false,
          title: {
            display: true,
            text: "Hạng mục",
            font: {
              weight: "bold",
            },
          },
          grid: {
            display: false,
          },
          ticks: {
            display: true,
            autoSkip: false, // Luôn hiển thị tất cả nhãn
            maxTicksLimit: 50, // Hoặc bỏ dòng này đi, hoặc set lớn hơn số hạng mục tối đa
          },
        },
      },
      layout: {
        padding: {
          left: 20,
        },
      },
    },
  });
}

function initializePieChart() {
  if (!pieChart.value) return;

  const ctx = pieChart.value.getContext("2d");

  // Destroy existing chart if it exists
  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  // Group data by Type
  const groupedData =
    summary.value?.reduce((acc, item) => {
      const type = item.Type || "Không phân loại";
      if (!acc[type]) {
        acc[type] = {
          quantity: 0,
          count: 0,
        };
      }
      acc[type].quantity += Number(item.Quantity_Real) || 0;
      acc[type].count += 1;
      return acc;
    }, {}) || {};

  // Calculate total quantity
  const totalQuantity = Object.values(groupedData).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Sort types by quantity and calculate percentages
  const sortedTypes = Object.entries(groupedData)
    .sort(([, a], [, b]) => b.quantity - a.quantity)
    .reduce((acc, [key, value]) => {
      acc[key] = {
        ...value,
        percentage: ((value.quantity / totalQuantity) * 100).toFixed(1),
      };
      return acc;
    }, {});

  // Sinh màu động đủ cho tất cả hạng mục
  const colorPalette = [
    "rgba(25, 118, 210, 0.8)",
    "rgba(76, 175, 80, 0.8)",
    "rgba(255, 152, 0, 0.8)",
    "rgba(233, 30, 99, 0.8)",
    "rgba(156, 39, 176, 0.8)",
    "rgba(0, 150, 136, 0.8)",
    "rgba(255, 87, 34, 0.8)",
    "rgba(63, 81, 181, 0.8)",
    "rgba(0, 188, 212, 0.8)",
    "rgba(205, 220, 57, 0.8)",
    "rgba(121, 85, 72, 0.8)",
    "rgba(139, 195, 74, 0.8)",
    "rgba(255, 193, 7, 0.8)",
    "rgba(233, 30, 99, 0.8)",
    "rgba(103, 58, 183, 0.8)",
    "rgba(0, 150, 136, 0.8)",
  ];
  const borderPalette = colorPalette.map(c => c.replace('0.8', '1'));

  const labels = Object.keys(sortedTypes);
  const backgroundColor = labels.map((_, i) => colorPalette[i % colorPalette.length]);
  const borderColor = labels.map((_, i) => borderPalette[i % borderPalette.length]);

  // Create new chart (doughnut chart)
  pieChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label: "Tỷ lệ (%)",
          data: Object.values(sortedTypes).map((item) => parseFloat(item.percentage)),
          backgroundColor,
          borderColor,
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
            font: {
              size: 12,
            },
            generateLabels: function (chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map(function (label, i) {
                  const value = data.datasets[0].data[i];
                  return {
                    text: `${label} (${value}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor[i],
                    lineWidth: 1,
                    hidden: isNaN(data.datasets[0].data[i]),
                    index: i,
                  };
                });
              }
              return [];
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw || 0;
              const typeData = sortedTypes[label];
              return [
                `${label}: ${value}%`,
                `Số lượng: ${new Intl.NumberFormat("vi-VN").format(typeData.quantity)}`,
                `Số hạng mục: ${typeData.count}`,
              ];
            },
          },
        },
        title: {
          display: true,
          text: "Phân bố theo loại (%)",
          font: {
            size: 16,
            weight: "bold",
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
      },
    },
  });
}

// Watch for changes in summary data
watch(
  summary,
  (newData) => {
    if (newData) {
      if (chart) {
        // Update bar chart
        const groupedData = newData.reduce((acc, item) => {
          if (!acc[item.Category]) {
            acc[item.Category] = {
              plan: 0,
              real: 0,
            };
          }
          acc[item.Category].plan += Number(item.Quantity_Plan) || 0;
          acc[item.Category].real += Number(item.Quantity_Real) || 0;
          return acc;
        }, {});

        const sortedCategories = Object.entries(groupedData)
          .sort(([, a], [, b]) => b.plan + b.real - (a.plan + a.real))
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});

        chart.data.labels = Object.keys(sortedCategories);
        chart.data.datasets[0].data = Object.values(sortedCategories).map(
          (item) => item.plan
        );
        chart.data.datasets[1].data = Object.values(sortedCategories).map(
          (item) => item.real
        );
        chart.update();
      }

      if (pieChartInstance) {
        // Update pie chart
        const groupedData = newData.reduce((acc, item) => {
          const type = item.Type || "Không phân loại";
          if (!acc[type]) {
            acc[type] = {
              quantity: 0,
              count: 0,
            };
          }
          acc[type].quantity += Number(item.Quantity_Real) || 0;
          acc[type].count += 1;
          return acc;
        }, {});

        // Calculate total quantity
        const totalQuantity = Object.values(groupedData).reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        // Sort types by quantity and calculate percentages
        const sortedTypes = Object.entries(groupedData)
          .sort(([, a], [, b]) => b.quantity - a.quantity)
          .reduce((acc, [key, value]) => {
            acc[key] = {
              ...value,
              percentage: ((value.quantity / totalQuantity) * 100).toFixed(1),
            };
            return acc;
          }, {});

        // Sinh màu động đủ cho tất cả hạng mục
        const colorPalette = [
          "rgba(25, 118, 210, 0.8)",
          "rgba(76, 175, 80, 0.8)",
          "rgba(255, 152, 0, 0.8)",
          "rgba(233, 30, 99, 0.8)",
          "rgba(156, 39, 176, 0.8)",
          "rgba(0, 150, 136, 0.8)",
          "rgba(255, 87, 34, 0.8)",
          "rgba(63, 81, 181, 0.8)",
          "rgba(0, 188, 212, 0.8)",
          "rgba(205, 220, 57, 0.8)",
          "rgba(121, 85, 72, 0.8)",
          "rgba(139, 195, 74, 0.8)",
          "rgba(255, 193, 7, 0.8)",
          "rgba(233, 30, 99, 0.8)",
          "rgba(103, 58, 183, 0.8)",
          "rgba(0, 150, 136, 0.8)",
        ];
        const borderPalette = colorPalette.map(c => c.replace('0.8', '1'));

        const labels = Object.keys(sortedTypes);
        const backgroundColor = labels.map((_, i) => colorPalette[i % colorPalette.length]);
        const borderColor = labels.map((_, i) => borderPalette[i % borderPalette.length]);

        // Update chart data
        pieChartInstance.data.labels = labels;
        pieChartInstance.data.datasets[0].data = Object.values(sortedTypes).map(
          (item) => parseFloat(item.percentage)
        );
        pieChartInstance.data.datasets[0].backgroundColor = backgroundColor;
        pieChartInstance.data.datasets[0].borderColor = borderColor;

        // Force chart update with animation
        pieChartInstance.update("active");
      }
    }
  },
  { deep: true, immediate: true }
);

// ===== UTILITY FUNCTIONS =====
/**
 * Resets all dialog states and form data
 * Called after successful operations
 */
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
</script>
<script>
export default {
  components: {
    InputSearch,
    InputFiles,
    InputField,
    ButtonImportFile,
    ButtonDownload,
    ButtonEye,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    InputSelect,
    InputTextarea,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang=""></style>
