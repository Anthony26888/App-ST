<template>
  <div style="height: 400px">
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
  labels: Array,
  passData: Array,
  failData: Array,
  planData: Array,       // ✅ NEW
  title: String,
});

const chartCanvas = ref(null);
let chartInstance = null;

const renderChart = () => {
  if (!chartCanvas.value) return;

  if (chartInstance) chartInstance.destroy();

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
          maxBarThickness: 40,
        },
        {
          label: "Fail",
          data: props.failData || [],
          backgroundColor: "rgba(229, 57, 53, 0.8)",
          stack: "stack1",
          maxBarThickness: 40,
        },
        {
          label: "Kế hoạch",
          type: "line",                // ✅ Đổi từ bar → line
          data: props.planData || [],
          borderColor: "rgba(33, 150, 243, 1)",
          borderWidth: 2,
          tension: 0.3,                // ✅ Bo cong đường line
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "y",                // ✅ Vẫn cùng trục Y
        }
        
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        title: {
          display: !!props.title,
          text: props.title,
        },
      },
      scales: {
        x: {
          stacked: true, // ✅ Chỉ stack Actual (Plan không ảnh hưởng)
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
          barPercentage: 0.65,
          categoryPercentage: 0.7,
        },
      },
    },
  });
};

// Update chart when props change
watch(
  () => [props.labels, props.passData, props.failData, props.planData],
  () => {
    if (!chartInstance) return renderChart();

    chartInstance.data.labels = props.labels || [];
    chartInstance.data.datasets[0].data = props.passData || [];
    chartInstance.data.datasets[1].data = props.failData || [];
    chartInstance.data.datasets[2].data = props.planData || []; // ✅ NEW
    chartInstance.update();
  },
  { deep: true }
);

onMounted(() => renderChart());
onUnmounted(() => chartInstance?.destroy());
</script>
