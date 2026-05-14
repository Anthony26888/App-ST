<template>
  <div style="height: 450px; width: 100%">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

// Register chart modules
Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

// =====================
// Props
// =====================
const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },

  // Multiple datasets
  datasets: {
    type: Array,
    default: () => [],
  },

  title: {
    type: String,
    default: "Line Chart",
  },
});

// =====================
// Refs
// =====================
const chartCanvas = ref(null);
let chartInstance = null;

// =====================
// Render Chart
// =====================
const renderChart = () => {
  if (!chartCanvas.value) return;

  // Destroy old chart
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const ctx = chartCanvas.value.getContext("2d");

  chartInstance = new Chart(ctx, {
    type: "line",

    data: {
      labels: props.labels || [],

      datasets: (props.datasets || []).map((item) => ({
        label: item.label || "",

        data: item.data || [],

        borderColor: item.color || "#1976D2",

        backgroundColor: item.color || "#1976D2",

        borderWidth: item.borderWidth || 3,

        tension: item.tension ?? 0.3,

        fill: item.fill || false,

        // =====================
        // Point Styling
        // =====================
        pointRadius: item.pointRadius || 5,

        pointHoverRadius: item.pointHoverRadius || 8,

        pointBackgroundColor:
          item.pointBackgroundColor || item.color || "#1976D2",

        pointBorderColor: item.pointBorderColor || "#ffffff",

        pointBorderWidth: item.pointBorderWidth || 2,

        // =====================
        // Optional
        // =====================
        hidden: item.hidden || false,
      })),
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
          title: {
            display: true,
            text: "Công đoạn",
          },

          grid: {
            display: false,
          },
        },

        y: {
          beginAtZero: true,

          title: {
            display: true,
            text: "Số lượng",
          },
        },
      },
    },
  });
};

// =====================
// Watch props changes
// =====================
watch(
  () => [props.labels, props.datasets],
  () => {
    renderChart();
  },
  {
    deep: true,
  },
);

// =====================
// Lifecycle
// =====================
onMounted(() => {
  renderChart();
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>