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
  Title,
  LineElement,
  PointElement
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
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
  passData: {
    type: Array,
    default: () => [],
  },
  failData: {
    type: Array,
    default: () => [],
  },
  // *** Đã thêm: Dữ liệu Kế hoạch (Planned Data) ***
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

  // Hủy biểu đồ hiện tại nếu có
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const ctx = chartCanvas.value.getContext("2d");

  chartInstance = new Chart(ctx, {
    // *** Loại Biểu đồ Gốc là bar ***
    type: "bar", 
    data: {
      labels: props.labels || [],
      datasets: [
        {
          label: "Pass",
          data: props.passData || [],
          backgroundColor: "rgba(0, 200, 83, 0.8)", // Xanh lá
          stack: "stack1",
          maxBarThickness: 80,
        },
        {
          label: "Fail",
          data: props.failData || [],
          backgroundColor: "rgba(229, 57, 53, 0.8)", // Đỏ
          stack: "stack1",
          maxBarThickness: 80,
        },
        // *** Đã thêm: Dataset Kế hoạch dưới dạng Line ***
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
        tooltip: {
             mode: 'index',
             intersect: false,
        }
      },
      scales: {
        x: {
          stacked: true, // Cột vẫn xếp chồng
          title: {
            display: true,
            text: "Ngày sản xuất",
          },
        },
        y: {
          id: 'y',
          stacked: true, // Cột vẫn xếp chồng
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
  () => [props.labels, props.passData, props.failData, props.planData, props.title], // Thêm plannedData và title vào watch
  () => {
    if (chartInstance) {
      // Cập nhật dữ liệu
      chartInstance.data.labels = props.labels || [];
      chartInstance.data.datasets[0].data = props.passData || [];
      chartInstance.data.datasets[1].data = props.failData || [];
      chartInstance.data.datasets[2].data = props.planData || []; // Cập nhật dữ liệu Kế hoạch
      
      // Cập nhật tiêu đề (title)
      chartInstance.options.plugins.title.text = props.title;

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