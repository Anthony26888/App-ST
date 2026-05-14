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

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },

  // Cột TOP
  passDataTop: {
    type: Array,
    default: () => [],
  },

  // Cột BOTTOM
  passDataBottom: {
    type: Array,
    default: () => [],
  },

  passDataOneSide: {
    type: Array,
    default: () => [],
  },

  // Line kế hoạch
  planData: {
    type: Array,
    default: () => [],
  },

  title: {
    type: String,
    default: "Kết quả sản xuất theo ngày",
  },
});

const chartCanvas = ref(null);
let chartInstance = null;

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

      datasets: [
        // ===== TOP =====
        {
          label: "Pass Top",
          data: props.passDataTop || [],
          backgroundColor: "rgba(33, 150, 243, 0.8)", // Xanh dương
          borderColor: "rgba(33, 150, 243, 1)",
          borderWidth: 1,
          maxBarThickness: 50,
        },

        // ===== BOTTOM =====
        {
          label: "Pass Bottom",
          data: props.passDataBottom || [],
          backgroundColor: "rgba(229, 57, 53, 0.8)", // Đỏ
          borderColor: "rgba(229, 57, 53, 1)",
          borderWidth: 1,
          maxBarThickness: 50,
        },

        // ===== ONE SIDE =====
        {
          label: "Pass",
          data: props.passDataOneSide || [],
          borderColor: "rgba(0, 200, 83, 1)", // Xanh lá
          backgroundColor: "rgba(0, 200, 83, 1)",
          borderWidth: 1,
          maxBarThickness: 50,
        },

        // ===== PLAN LINE =====
        {
          label: "Kế hoạch",
          data: props.planData || [],
          type: "line",

          
          backgroundColor: "rgba(255, 165, 0, 0.8)", // Cam
          borderColor: "rgba(255, 165, 0, 1)",
          pointRadius: 4,

          borderWidth: 3,
          fill: false,
          tension: 0.3,

          yAxisID: "y",
        },
      ],
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
          stacked: false,

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
          stacked: false,

          title: {
            display: true,
            text: "Số lượng sản phẩm",
          },
        },
      },

      elements: {
        bar: {
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
      },
    },
  });
};

// ===== WATCH UPDATE =====
watch(
  () => [
    props.labels,
    props.passDataTop,
    props.passDataBottom,
    props.planData,
    props.title,
  ],
  () => {
    if (chartInstance) {
      chartInstance.data.labels = props.labels || [];

      chartInstance.data.datasets[0].data =
        props.passDataTop || [];

      chartInstance.data.datasets[1].data =
        props.passDataBottom || [];

      chartInstance.data.datasets[2].data =
        props.passDataOneSide || [];

      chartInstance.data.datasets[3].data =
        props.planData || [];

      chartInstance.options.plugins.title.text =
        props.title;

      chartInstance.update();
    } else {
      renderChart();
    }
  },
  { deep: true }
);

// ===== MOUNT =====
onMounted(() => {
  renderChart();
});

// ===== UNMOUNT =====
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>