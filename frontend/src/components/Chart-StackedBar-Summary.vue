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
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },
  passData: {
    type: Array,
    default: () => [],
  },
  failData: {
    type: Array,
    default: () => [],
  },
  planData: {
    type: Array,
    default: () => [],
  },
});

const chartCanvas = ref(null);
let chartInstance = null;

const renderChart = () => {
  if (!chartCanvas.value) return;

  // Destroy existing chart if it exists
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
        {
          label: "Pass",
          data: props.passData || [],
          backgroundColor: "rgba(0, 200, 83, 0.8)",
          stack: "stack1",
          maxBarThickness: 80,
        },
        {
          label: "Fail",
          data: props.failData || [],
          backgroundColor: "rgba(229, 57, 53, 0.8)",
          stack: "stack1",
          maxBarThickness: 80,
        },
        {
          label: "Kế hoạch",
          data: props.planData || [],
          type: "line", // Thay đổi loại thành 'line'
          borderColor: "rgba(33, 150, 243, 1)", // Xanh dương (Blue)
          backgroundColor: "rgba(33, 150, 243, 0.2)", // Background nhạt hơn
          pointBackgroundColor: "rgba(33, 150, 243, 1)",
          fill: false, // Không tô màu dưới đường
          tension: 0.3, // Độ cong của đường
          stack: "stack2", // TẮT stacked bằng cách dùng stack khác
          yAxisID: 'y', // Đảm bảo sử dụng trục Y chính
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: props.title,
          font: { size: 18 },
        },
        legend: { position: "bottom" },
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: "Công đoạn",
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: "Số lượng sản phẩm",
          },
        },
      },
      elements: {
        bar: {
          barPercentage: 0.6,
          categoryPercentage: 0.8,
        },
      },
    },
  });
};

// Watch for prop changes and update chart
watch(
  () => [props.labels, props.passData, props.failData],
  () => {
    if (chartInstance) {
      chartInstance.data.labels = props.labels || [];
      chartInstance.data.datasets[0].data = props.passData || [];
      chartInstance.data.datasets[1].data = props.failData || [];
      chartInstance.data.datasets[2].data = props.planData || [];
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
