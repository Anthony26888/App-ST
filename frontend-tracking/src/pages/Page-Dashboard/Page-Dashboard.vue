<template>
  <v-container fluid class="pa-4">
    <!-- Header Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold text-primary mb-2">
              Dashboard Theo Dõi Đơn Hàng
            </h1>
            <p class="text-subtitle-1 text-grey-darken-1">
              Tổng quan và theo dõi trạng thái đơn hàng
            </p>
          </div>
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-refresh"
            @click="refreshData"
            :loading="loading"
          >
            Làm mới dữ liệu
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-center">
              <v-avatar color="primary" size="48" class="me-3">
                <v-icon color="white" size="24">mdi-cart-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold text-primary">
                  {{ statistics.totalOrders }}
                </div>
                <div class="text-caption text-grey-darken-1">
                  Tổng đơn hàng
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-center">
              <v-avatar color="success" size="48" class="me-3">
                <v-icon color="white" size="24">mdi-check-circle</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold text-success">
                  {{ statistics.completedOrders }}
                </div>
                <div class="text-caption text-grey-darken-1">
                  Đã hoàn thành
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-center">
              <v-avatar color="warning" size="48" class="me-3">
                <v-icon color="white" size="24">mdi-clock-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold text-warning">
                  {{ statistics.pendingOrders }}
                </div>
                <div class="text-caption text-grey-darken-1">
                  Đang xử lý
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="2">
          <v-card-text class="pa-4">
            <div class="d-flex align-center">
              <v-avatar color="error" size="48" class="me-3">
                <v-icon color="white" size="24">mdi-alert-circle</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold text-error">
                  {{ statistics.delayedOrders }}
                </div>
                <div class="text-caption text-grey-darken-1">
                  Trễ hạn
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Section -->
    <v-row class="mb-6">
      <v-col cols="12" md="8">
        <v-card elevation="2" class="chart-card">
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2" color="primary">mdi-chart-line</v-icon>
            Biểu đồ đơn hàng theo tháng
          </v-card-title>
          <v-card-text>
            <div class="chart-container">
              <canvas ref="orderChart" height="300"></canvas>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="2" class="chart-card">
          <v-card-title class="d-flex align-center">
            <v-icon class="me-2" color="primary">mdi-chart-pie</v-icon>
            Phân bố trạng thái
          </v-card-title>
          <v-card-text>
            <div class="chart-container">
              <canvas ref="statusChart" height="300"></canvas>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters and Search -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          label="Tìm kiếm đơn hàng"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          density="comfortable"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="Lọc theo trạng thái"
          variant="outlined"
          clearable
          density="comfortable"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="priorityFilter"
          :items="priorityOptions"
          label="Lọc theo độ ưu tiên"
          variant="outlined"
          clearable
          density="comfortable"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn
          color="primary"
          variant="outlined"
          block
          @click="exportData"
          prepend-icon="mdi-download"
        >
          Xuất Excel
        </v-btn>
      </v-col>
    </v-row>

    <!-- Orders Table -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="me-2" color="primary">mdi-table</v-icon>
          Danh sách đơn hàng
        </div>
        <v-chip color="primary" variant="outlined">
          {{ filteredOrders.length }} đơn hàng
        </v-chip>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredOrders"
        :loading="loading"
        class="elevation-0"
        item-key="id"
        :items-per-page="10"
        :search="searchQuery"
      >
        <!-- Order ID Column -->
        <template v-slot:item.orderId="{ item }">
          <v-chip
            color="primary"
            variant="outlined"
            size="small"
            class="font-weight-medium"
          >
            {{ item.orderId }}
          </v-chip>
        </template>

        <!-- Status Column -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            variant="flat"
            size="small"
            class="font-weight-medium"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Priority Column -->
        <template v-slot:item.priority="{ item }">
          <v-chip
            :color="getPriorityColor(item.priority)"
            variant="flat"
            size="small"
            class="font-weight-medium"
          >
            {{ item.priority }}
          </v-chip>
        </template>

        <!-- Progress Column -->
        <template v-slot:item.progress="{ item }">
          <div class="d-flex align-center">
            <v-progress-linear
              :model-value="item.progress"
              :color="getProgressColor(item.progress)"
              height="8"
              rounded
              class="me-2"
              style="min-width: 100px;"
            />
            <span class="text-caption">{{ item.progress }}%</span>
          </div>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              color="primary"
              @click="viewOrder(item)"
            />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="warning"
              @click="editOrder(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="deleteOrder(item)"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Order Details Dialog -->
    <v-dialog v-model="orderDialog" max-width="800px">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Chi tiết đơn hàng</span>
          <v-btn icon="mdi-close" variant="text" @click="orderDialog = false" />
        </v-card-title>
        <v-card-text v-if="selectedOrder">
          <v-row>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <v-list-item-title>Mã đơn hàng</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedOrder.orderId }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Khách hàng</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedOrder.customer }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Trạng thái</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="getStatusColor(selectedOrder.status)"
                      variant="flat"
                      size="small"
                    >
                      {{ selectedOrder.status }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Độ ưu tiên</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="getPriorityColor(selectedOrder.priority)"
                      variant="flat"
                      size="small"
                    >
                      {{ selectedOrder.priority }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <v-list-item-title>Ngày tạo</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedOrder.createdDate) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Ngày giao hàng</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedOrder.deliveryDate) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Giá trị đơn hàng</v-list-item-title>
                  <v-list-item-subtitle>{{ formatCurrency(selectedOrder.totalAmount) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Tiến độ</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-progress-linear
                      :model-value="selectedOrder.progress"
                      :color="getProgressColor(selectedOrder.progress)"
                      height="8"
                      rounded
                    />
                    {{ selectedOrder.progress }}%
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay v-model="loading" class="align-center justify-center">
      <v-progress-circular
        color="primary"
        indeterminate
        size="64"
      />
    </v-overlay>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'

// Reactive data
const data = ref([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const orderDialog = ref(false)
const selectedOrder = ref(null)

// Sample data
const sampleData = [
  {
    id: 1,
    orderId: 'ORD-001',
    customer: 'Công ty ABC',
    status: 'Đang xử lý',
    priority: 'Cao',
    progress: 65,
    totalAmount: 15000000,
    createdDate: '2024-01-15',
    deliveryDate: '2024-02-15',
    description: 'Đơn hàng sản phẩm điện tử'
  },
  {
    id: 2,
    orderId: 'ORD-002',
    customer: 'Công ty XYZ',
    status: 'Hoàn thành',
    priority: 'Trung bình',
    progress: 100,
    totalAmount: 8500000,
    createdDate: '2024-01-10',
    deliveryDate: '2024-01-25',
    description: 'Đơn hàng linh kiện máy móc'
  },
  {
    id: 3,
    orderId: 'ORD-003',
    customer: 'Công ty DEF',
    status: 'Chờ xác nhận',
    priority: 'Thấp',
    progress: 25,
    totalAmount: 12000000,
    createdDate: '2024-01-20',
    deliveryDate: '2024-02-20',
    description: 'Đơn hàng phụ tùng ô tô'
  },
  {
    id: 4,
    orderId: 'ORD-004',
    customer: 'Công ty GHI',
    status: 'Đang giao hàng',
    priority: 'Cao',
    progress: 85,
    totalAmount: 22000000,
    createdDate: '2024-01-12',
    deliveryDate: '2024-02-10',
    description: 'Đơn hàng thiết bị công nghiệp'
  },
  {
    id: 5,
    orderId: 'ORD-005',
    customer: 'Công ty JKL',
    status: 'Trễ hạn',
    priority: 'Cao',
    progress: 45,
    totalAmount: 18000000,
    createdDate: '2024-01-05',
    deliveryDate: '2024-01-30',
    description: 'Đơn hàng máy móc nông nghiệp'
  },
  {
    id: 6,
    orderId: 'ORD-006',
    customer: 'Công ty MNO',
    status: 'Hoàn thành',
    priority: 'Trung bình',
    progress: 100,
    totalAmount: 9500000,
    createdDate: '2024-01-08',
    deliveryDate: '2024-01-28',
    description: 'Đơn hàng thiết bị y tế'
  },
  {
    id: 7,
    orderId: 'ORD-007',
    customer: 'Công ty PQR',
    status: 'Đang xử lý',
    priority: 'Thấp',
    progress: 30,
    totalAmount: 7500000,
    createdDate: '2024-01-18',
    deliveryDate: '2024-02-25',
    description: 'Đơn hàng phụ kiện điện tử'
  },
  {
    id: 8,
    orderId: 'ORD-008',
    customer: 'Công ty STU',
    status: 'Chờ xác nhận',
    priority: 'Cao',
    progress: 15,
    totalAmount: 16000000,
    createdDate: '2024-01-22',
    deliveryDate: '2024-02-18',
    description: 'Đơn hàng linh kiện máy tính'
  }
]

// Table headers
const headers = [
  { title: 'Mã đơn hàng', key: 'orderId', sortable: true },
  { title: 'Khách hàng', key: 'customer', sortable: true },
  { title: 'Trạng thái', key: 'status', sortable: true },
  { title: 'Độ ưu tiên', key: 'priority', sortable: true },
  { title: 'Tiến độ', key: 'progress', sortable: true },
  { title: 'Giá trị', key: 'totalAmount', sortable: true },
  { title: 'Ngày tạo', key: 'createdDate', sortable: true },
  { title: 'Ngày giao', key: 'deliveryDate', sortable: true },
  { title: 'Thao tác', key: 'actions', sortable: false }
]

// Filter options
const statusOptions = [
  'Chờ xác nhận',
  'Đang xử lý',
  'Đang giao hàng',
  'Hoàn thành',
  'Trễ hạn'
]

const priorityOptions = [
  'Cao',
  'Trung bình',
  'Thấp'
]

// Computed properties
const statistics = computed(() => {
  const total = data.value.length
  const completed = data.value.filter(item => item.status === 'Hoàn thành').length
  const pending = data.value.filter(item => ['Chờ xác nhận', 'Đang xử lý', 'Đang giao hàng'].includes(item.status)).length
  const delayed = data.value.filter(item => item.status === 'Trễ hạn').length
  
  return {
    totalOrders: total,
    completedOrders: completed,
    pendingOrders: pending,
    delayedOrders: delayed
  }
})

const filteredOrders = computed(() => {
  let filtered = data.value

  if (statusFilter.value) {
    filtered = filtered.filter(item => item.status === statusFilter.value)
  }

  if (priorityFilter.value) {
    filtered = filtered.filter(item => item.priority === priorityFilter.value)
  }

  return filtered
})

// Methods
const refreshData = async () => {
  loading.value = true
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  data.value = [...sampleData]
  loading.value = false
}

const getStatusColor = (status) => {
  const colors = {
    'Chờ xác nhận': 'orange',
    'Đang xử lý': 'blue',
    'Đang giao hàng': 'purple',
    'Hoàn thành': 'green',
    'Trễ hạn': 'red'
  }
  return colors[status] || 'grey'
}

const getPriorityColor = (priority) => {
  const colors = {
    'Cao': 'red',
    'Trung bình': 'orange',
    'Thấp': 'green'
  }
  return colors[priority] || 'grey'
}

const getProgressColor = (progress) => {
  if (progress < 30) return 'red'
  if (progress < 70) return 'orange'
  return 'green'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const viewOrder = (order) => {
  selectedOrder.value = order
  orderDialog.value = true
}

const editOrder = (order) => {
  console.log('Edit order:', order)
  // Implement edit functionality
}

const deleteOrder = (order) => {
  console.log('Delete order:', order)
  // Implement delete functionality
}

const exportData = () => {
  console.log('Export data')
  // Implement export functionality
}

// Chart references
const orderChart = ref(null)
const statusChart = ref(null)

// Initialize charts
const initCharts = async () => {
  await nextTick()
  
  // Order chart
  if (orderChart.value) {
    new Chart(orderChart.value, {
      type: 'line',
      data: {
        labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
        datasets: [{
          label: 'Số đơn hàng',
          data: [12, 19, 15, 25, 22, 30],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }

  // Status chart
  if (statusChart.value) {
    new Chart(statusChart.value, {
      type: 'doughnut',
      data: {
        labels: ['Hoàn thành', 'Đang xử lý', 'Chờ xác nhận', 'Trễ hạn'],
        datasets: [{
          data: [statistics.value.completedOrders, statistics.value.pendingOrders, 2, statistics.value.delayedOrders],
          backgroundColor: [
            '#4CAF50',
            '#2196F3',
            '#FF9800',
            '#F44336'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          }
        }
      }
    })
  }
}

// Lifecycle
onMounted(() => {
  data.value = [...sampleData]
  initCharts()
})
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s ease-in-out;
  border-radius: 12px;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.chart-card {
  border-radius: 12px;
}

.chart-container {
  position: relative;
  height: 300px;
}

.v-data-table {
  border-radius: 12px;
}

.gap-2 {
  gap: 8px;
}
</style>