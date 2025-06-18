<template>
  <div>
    <!-- Card chính chứa toàn bộ nội dung -->
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <!-- Phần tiêu đề và nút quay lại -->
      <v-card-title class="text-h4 font-weight-light">
        <ButtonBack v-if="LevelUser === 'Nhân viên'" :to="`/Danh-sach-cong-viec`" @click="removeGoBackListWork" />
        <ButtonBack v-else :to="`/San-xuat/Chi-tiet/${back}`" />
        Theo dõi sản xuất SMT
      </v-card-title>

      <!-- Phần điều khiển và trạng thái -->
      <v-card-title class="d-flex align-center pe-2">
        <!-- Tên sản phẩm -->
        <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
        <v-breadcrumbs :items="[`${NameManufacture}`, `${Name_Order}`]">
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>
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
          Độ trể: {{ Delay }} ms
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
          <v-col cols="12" sm="4">
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
          <v-col cols="12" sm="4">
            <v-card class="mx-auto" elevation="2">
              <v-card-text>
                <div class="text-h6 mb-2">Đầu ra</div>
                <div class="text-h4 font-weight-bold text-primary">
                  {{ manufactureSMT.length }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng đầu ra
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Thẻ thống kê đầu ra board-->
          <v-col cols="12" sm="4">
            <v-card class="mx-auto" elevation="2">
              <v-card-text>
                <div class="text-h6 mb-2">Đầu ra board</div>
                <div class="text-h4 font-weight-bold text-success">
                  {{ QuantityBoard * manufactureSMT.length || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng board (board/panel)
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
import { useHistory } from "@/composables/Manufacture/useHistory";
import { useManufactureSMT } from "@/composables/Manufacture/useManufactureSMT";
import { useManufacture } from "@/composables/Manufacture/useManufacture";
import { useDeviceStatusSocket } from "@/composables/Manufacture/useStatusSensor";

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
const back = localStorage.getItem("ManufactureID");

// ===== User Information =====
const LevelUser = localStorage.getItem("LevelUser");

// Cấu hình cột cho bảng dữ liệu
const Headers = [
  { title: "STT", key: "id" },
  { title: "Mã sản phẩm", key: "Input" },
  { title: "Thời gian", key: "Timestamp" },
];

// ===== Khởi tạo composables và quản lý dữ liệu =====
const { manufactureSMT, manufactureSMTError } = useManufactureSMT(id);
const { manufacture, manufactureFound, manufactureError } = useManufacture();
const { history, historyError } = useHistory(back);
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
const NameManufacture = ref("");
const Name_Order = ref("");
const QuantityBoard =ref(0);
const Delay = ref(0);


// Trạng thái kết nối Arduino
const isBegin = ref(false);
const isConnecting = ref(false);

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


// Thêm watch để theo dõi manufactureFound
watch(manufactureFound, (newValue) => {
  if (newValue) {
    console.log('Manufacture data updated:', newValue);
    // Có thể thêm xử lý khác nếu cần
  }
}, { immediate: true });

// Watch for changes in manufacture details to calculate total input
watch(
  () => history,
  (newData) => {
    console.log("History data:", newData);
    if (newData?.value && Array.isArray(newData.value)) {
      const filteredHistory = newData.value.filter(item => item.Type === 'SMT');
      totalInput.value = filteredHistory.reduce((sum, item) => sum + (Number(item.Quantity_Plan) || 0), 0);
      const data = newData.value[0];
      Name_Order.value = data?.Name_Order;
      NameManufacture.value = data?.PONumber;
      Delay.value = data?.DelaySMT;
      QuantityBoard.value = data?.QuantityBoard;
    }
  },
  { immediate: true, deep: true },
);
// ===== Các phương thức =====
/**
 * Kết nối với thiết bị Arduino và quản lý trạng thái sản xuất
 * - Gửi yêu cầu cấu hình đến ESP32 với DelaySMT từ manufactureFound
 * - Cập nhật trạng thái kết nối
 * - Xử lý lỗi nếu có
 */

const connectArduino = () => {
  if (!manufactureFound.value) {
    console.error('Manufacture data not available');
    MessageErrorDialog.value = "Không thể lấy dữ liệu sản xuất";
    DialogFailed.value = true;
    return;
  }

  const delaySMT = manufactureFound.value.DelaySMT;

  if (typeof delaySMT !== 'number' || delaySMT < 0) {
    console.error('Invalid DelaySMT value:', delaySMT);
    MessageErrorDialog.value = "Giá trị độ trễ không hợp lệ";
    DialogFailed.value = true;
    return;
  }

  const formData = reactive({
    project_id: isBegin.value ? "" : route.params.id,
    delay: delaySMT, // Sử dụng DelaySMT từ manufactureFound
  });
  isConnecting.value = true;

  axios
    .post(`${Url}/api/esp-config`, formData)
    .then(function (response) {
      console.log('Arduino config response:', response.data);
      isBegin.value = !isBegin.value;
      
      // Cập nhật localStorage dựa trên trạng thái mới
      if (isBegin.value) {
        localStorage.setItem("isRunning", route.params.id);
      } else {
        localStorage.removeItem("isRunning");
      }

      MessageDialog.value = isBegin.value 
        ? `Đã bắt đầu sản xuất với độ trễ ${delaySMT}ms` 
        : "Đã dừng sản xuất";
      DialogSuccess.value = true;
    })
    .catch(function (error) {
      console.error('Arduino config error:', error);
      MessageErrorDialog.value = error.response?.data?.message || "Có lỗi xảy ra khi gửi đến Esp32";
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
