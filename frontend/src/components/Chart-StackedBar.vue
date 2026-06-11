<template>
  <div style="height: 450px">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";

import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

// ================= PROPS =================
const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },

  // TOP
  passDataTop: {
    type: Array,
    default: () => [],
  },

  // BOTTOM
  passDataBottom: {
    type: Array,
    default: () => [],
  },

  // ONE SIDE
  passDataOneSide: {
    type: Array,
    default: () => [],
  },

  // PLAN LINE
  planData: {
    type: Array,
    default: () => [],
  },

  title: {
    type: String,
    default: "Kết quả sản xuất theo ngày",
  },
});

// ================= REF =================
const chartCanvas = ref(null);

let chartInstance = null;

// ================= CREATE DATASETS =================
const createDatasets = () => {
  const datasets = [];

  // ===== TOP =====
  if (
    props.passDataTop &&
    props.passDataTop.some((v) => v !== null && v !== undefined)
  ) {
    datasets.push({
      label: "Pass Top",
      data: props.passDataTop,

      backgroundColor: "rgba(33, 150, 243, 0.8)",
      borderColor: "rgba(33, 150, 243, 1)",

      borderWidth: 1,
      maxBarThickness: 50,

      order: 2,
    });
  }

  // ===== BOTTOM =====
  if (
    props.passDataBottom &&
    props.passDataBottom.some((v) => v !== null && v !== undefined)
  ) {
    datasets.push({
      label: "Pass Bottom",
      data: props.passDataBottom,

      backgroundColor: "rgba(229, 57, 53, 0.8)",
      borderColor: "rgba(229, 57, 53, 1)",

      borderWidth: 1,
      maxBarThickness: 50,

      order: 2,
    });
  }

  // ===== ONE SIDE =====
  if (
    props.passDataOneSide &&
    props.passDataOneSide.some((v) => v !== null && v !== undefined)
  ) {
    datasets.push({
      label: "Pass",
      data: props.passDataOneSide,

      backgroundColor: "rgba(0, 200, 83, 0.8)",
      borderColor: "rgba(0, 200, 83, 1)",

      borderWidth: 1,
      maxBarThickness: 50,

      order: 2,
    });
  }

  return datasets;
};

// ================= RENDER CHART =================
const renderChart = () => {
  if (!chartCanvas.value) return;

  // destroy old chart
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const ctx = chartCanvas.value.getContext("2d");

  chartInstance = new Chart(ctx, {
    type: "bar",

    data: {
      labels: props.labels || [],

      datasets: createDatasets(),
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false,
      },

      plugins: {
        title: {
          display: true,

          text: props.title,

          font: {
            size: 18,
          },
        },

        legend: {
          position: "bottom",
        },

        tooltip: {
          mode: "index",
          intersect: false,
        },
      },

      scales: {
        x: {
          stacked: true,

          title: {
            display: true,
            text: "Ngày sản xuất",
          },

          grid: {
            display: false,
          },
        },

        y: {
          beginAtZero: true,

          stacked: true,

          title: {
            display: true,
            text: "Số lượng sản phẩm",
          },
        },
      },

      elements: {
        bar: {
          borderRadius: 4,

          barPercentage: 0.6,

          categoryPercentage: 0.7,
        },
      },
    },
  });
};

// ================= WATCH =================
watch(
  () => [
    props.labels,
    props.passDataTop,
    props.passDataBottom,
    props.passDataOneSide,
    props.planData,
    props.title,
  ],
  () => {
    renderChart();
  },
  {
    deep: true,
  }
);

// ================= MOUNT =================
onMounted(() => {
  renderChart();
});

// ================= UNMOUNT =================
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>