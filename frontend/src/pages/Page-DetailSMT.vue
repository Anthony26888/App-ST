<template>
  <div>
    <!-- Card chính chứa toàn bộ nội dung -->
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <!-- Phần tiêu đề và nút quay lại -->
      <v-card-title class="text-h4 font-weight-light">
        <ButtonBack :to="`/San-xuat/Chi-tiet/${id}`" />
        Theo dõi sản xuất SMT
      </v-card-title>

      <!-- Phần điều khiển và trạng thái -->
      <v-card-title class="d-flex align-center pe-2">
        <!-- Tên sản phẩm -->
        <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
        {{ NameManufacture }}
        <v-spacer></v-spacer>

        <!-- Hiển thị trạng thái kết nối -->
        <v-chip
          :prepend-icon="status === 'Online' ? 'mdi-contactless-payment-circle' : 'mdi-web-off'"
          :color="status === 'Online' ? 'green' : 'red'"
          class="ma-2"
          dark
          size="large"
        >
          {{ status }}
        </v-chip>

        <!-- Nhập thời gian delay -->
        <v-chip
          prepend-icon="mdi-clock-outline"
          color="orange"
          class="ma-2"
          variant="tonal"
          dark
          size="large"
        >
          Độ trể: {{ manufactureFound.DelaySMT }} ms
        </v-chip>

        <!-- Các nút điều khiển -->
        <v-btn
          class="text-caption ms-2"
          @click="connectArduino"
          :color="isBegin ? 'error' : 'success'"
          :loading="isConnecting"
        >
          <v-icon :icon="isBegin ? 'mdi-stop' : 'mdi-play'"></v-icon>
          &nbsp;
          {{ isBegin ? "Dừng" : "Bắt đầu" }}
        </v-btn>
        <v-btn @click="DialogRemove = true" color="error" class="ms-2 text-caption">
          Reset dữ liệu
        </v-btn>
      </v-card-title>

      <!-- Phần nội dung chính -->
      <v-card-text>
        <!-- Thống kê sản xuất -->
        <v-row class="mb-4">
          <!-- Thẻ thống kê đầu vào -->
          <v-col cols="12" sm="6">
            <v-card class="mx-auto" elevation="2">
              <v-card-text>
                <div class="text-h6 mb-2">Đầu vào</div>
                <div class="text-h4 font-weight-bold text-error">
                  {{ totalInput }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng đầu vào
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Thẻ thống kê đầu ra -->
          <v-col cols="12" sm="6">
            <v-card class="mx-auto" elevation="2">
              <v-card-text>
                <div class="text-h6 mb-2">Đầu ra</div>
                <div class="text-h4 font-weight-bold text-success">
                  {{ manufactureSMT.length }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng đầu ra
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Bảng chi tiết sản xuất -->
        <v-card class="mt-4" variant="text">
          <v-card-title class="d-flex align-center">
            <span>Bảng chi tiết sản xuất</span>
            <v-spacer></v-spacer>
            <InputSearch v-model="search" />
          </v-card-title>
          <v-data-table
            :headers="Headers"
            :items="manufactureSMT"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model="page"
            class="elevation-1 mt-4"
            :footer-props="{
              'items-per-page-options': [10, 20, 50, 100],
              'items-per-page-text': 'Số hàng mỗi trang',
            }"
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
            height="calc(100vh - 200px)"
          >
            <template #[`bottom`]>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil((manufactureAOI?.length || 0) / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Các dialog và thông báo -->
    <!-- Dialog xác nhận xóa dữ liệu -->
    <v-dialog v-model="DialogRemove" width="400">
      <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
        <v-card-text> Bạn có chắc chắn muốn xoá dữ liệu ? </v-card-text>
        <template v-slot:actions>
          <ButtonCancel @cancel="DialogRemove = false" />
          <ButtonDelete @delete="resetData()" />
        </template>
      </v-card>
    </v-dialog>

    <!-- Các component thông báo -->
    <Loading v-model="DialogLoading" />
    <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
    <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  </div>
</template>

<script setup>
// ===== Import các thư viện và component =====
// Import từ Vue core
import { ref, watch, reactive } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

// Import các composables
import { useManufactureDetails } from "@/composables/useManufactureDetails";
import { useManufactureSMT } from "@/composables/useManufactureSMT";
import { useManufacture } from "@/composables/useManufacture";
import { useDeviceStatusSocket } from "@/composables/useStatusSensor";

// Import các component
import Loading from "@/components/Loading.vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";

// ===== Cấu hình và hằng số =====
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const id = route.params.id;

// Cấu hình cột cho bảng dữ liệu
const Headers = [
  { title: "STT", key: "id" },
  { title: "Mã sản phẩm", key: "Input" },
  { title: "Thời gian", key: "Timestamp" },
];

// ===== Khởi tạo composables và quản lý dữ liệu =====
const manufactureDetails = useManufactureDetails(id);
const { manufactureSMT, manufactureSMTError } = useManufactureSMT(id);
const { manufacture, manufactureFound, manufactureError } = useManufacture();
console.log(manufactureFound);

const { status } = useDeviceStatusSocket("esp32-001");

// ===== Khai báo các biến reactive =====
// Trạng thái UI
const DialogLoading = ref(false);
const DialogRemove = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// Trạng thái bảng dữ liệu
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);

// Trạng thái sản xuất
const totalInput = ref(0);
const totalOutput = ref(0);
const NameManufacture = localStorage.getItem("ProductName");

// Trạng thái kết nối Arduino
const isBegin = ref(false);
const isConnecting = ref(false);
const delay = ref(null);

// ===== Lifecycle Hooks =====
onMounted(() => {
  // Kiểm tra trạng thái sản xuất đang chạy
  if (localStorage.getItem("isRunning") === id) {
    isBegin.value = true;
  } else {
    isBegin.value = false;
    localStorage.removeItem("isRunning");
  }
  
});

// ===== Watchers =====
// Theo dõi thay đổi chi tiết sản xuất để tính tổng đầu vào
watch(
  () => manufactureDetails.manufactureDetails,
  (newData) => {
    if (newData?.value && Array.isArray(newData.value)) {
      totalInput.value = newData.value.reduce(
        (sum, item) => sum + (item.Total || 0),
        0
      );
    }
  },
  { immediate: true, deep: true }
);


// ===== Các phương thức =====
/**
 * Kết nối với thiết bị Arduino và quản lý trạng thái sản xuất
 * - Gửi yêu cầu cấu hình đến ESP32
 * - Cập nhật trạng thái kết nối
 * - Xử lý lỗi nếu có
 */
const connectArduino = () => {
  const formData = reactive({
    project_id: isBegin.value ? "" : route.params.id,
    delay: delay.value,
  });
  
  isConnecting.value = true;
  axios
    .post(`${Url}/api/esp-config`, formData)
    .then(function (response) {
      console.log(response.data);
      isBegin.value = !isBegin.value;
      MessageDialog.value = "Đã gửi dữ liệu đến Esp32";
      DialogSuccess.value = true;
    })
    .catch(function (error) {
      console.log(error);
      MessageErrorDialog.value = "Có lỗi xảy ra khi gửi đến Esp32";
      DialogFailed.value = true;
    })
    .finally(() => {
      isConnecting.value = false;
    });
};

/**
 * Reset toàn bộ dữ liệu sản xuất
 * - Xóa dữ liệu từ server
 * - Cập nhật trạng thái UI
 * - Reset các biến đếm
 */
const resetData = () => {
  axios
    .delete(`${Url}/reset-data/${id}`)
    .then(function (response) {
      console.log(response.data);
      MessageDialog.value = "Xoá dữ liệu thành công";
      DialogSuccess.value = true;
      isBegin.value = false;
      localStorage.removeItem("isRunning");
      totalInput.value = 0;
      totalOutput.value = 0;
      DialogRemove.value = false;
    })
    .catch(function (error) {
      console.log(error);
      MessageErrorDialog.value = "Xoá dữ liệu thất bại";
      DialogFailed.value = true;
      DialogRemove.value = false;
    });
};
</script>
