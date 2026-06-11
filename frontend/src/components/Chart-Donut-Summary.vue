<template>
  <div style="height: 380px; width: 100%">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components needed for Doughnut chart
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: "",
  },
});

const chartCanvas = ref(null);
let chartInstance = null;

const renderChart = () => {
  if (!chartCanvas.value) return;

  // Destroy old chart instance to prevent memory leaks and overlapping charts
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const ctx = chartCanvas.value.getContext("2d");

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: props.labels || [],
      datasets: [
        {
          data: props.data || [],
          backgroundColor: [
            "rgba(25, 118, 210, 0.8)",  // Primary Blue
            "rgba(0, 200, 83, 0.8)",   // Success Green
            "rgba(255, 167, 38, 0.8)",  // Warning Orange
            "rgba(171, 71, 188, 0.8)",  // Purple
            "rgba(236, 64, 122, 0.8)",  // Pink
            "rgba(38, 166, 154, 0.8)",  // Teal
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            padding: 15,
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return ` ${label}: ${value} pcs (${percentage}%)`;
            },
          },
        },
      },
      cutout: "60%",
    },
  });
};

// Re-render or update chart when props change
watch(
  () => [props.labels, props.data],
  () => {
    if (chartInstance) {
      chartInstance.data.labels = props.labels || [];
      chartInstance.data.datasets[0].data = props.data || [];
      chartInstance.update();
    } else {
      renderChart();
    }
  },
  { deep: true }
);

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
