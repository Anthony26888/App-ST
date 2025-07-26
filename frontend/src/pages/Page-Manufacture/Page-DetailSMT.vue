<template>
  <div>
    <!-- Card chính chứa toàn bộ nội dung -->
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <!-- Phần tiêu đề và nút quay lại -->
      <v-card-title class="text-h4 font-weight-light d-flex align-center">
        <ButtonBack
          v-if="LevelUser === 'Nhân viên'"
          :to="`/Danh-sach-cong-viec`"
          @click="removeGoBackListWork"
        />
        <ButtonBack v-else :to="`/San-xuat/Chi-tiet/${back}`" />
        <span class="ml-2">Theo dõi sản xuất SMT</span>
      </v-card-title>

      <!-- Phần điều khiển và trạng thái -->
      <v-card-title class="d-flex align-center pe-2">
        <!-- Tên sản phẩm -->
        <v-icon icon="mdi mdi-tools" color="primary" size="large"></v-icon>
        <v-breadcrumbs :items="[`${NameManufacture}`, `${Name_Order}`]">
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>
        <v-spacer></v-spacer>

        <!-- Hiển thị trạng thái kết nối -->
        <v-chip
          :prepend-icon="
            status === 'Online'
              ? 'mdi-contactless-payment-circle'
              : 'mdi-web-off'
          "
          :color="status === 'Online' ? 'green' : 'red'"
          class="ma-2"
          dark
          size="large"
        >
          {{ status }}
        </v-chip>

        <!-- Thời gian delay -->
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
        <v-btn
          @click="DialogRemove = true"
          color="error"
          class="ms-2 text-caption"
        >
          Reset dữ liệu
        </v-btn>
      </v-card-title>

      <!-- Phần nội dung chính -->
      <v-card-text>
        <!-- Thống kê sản xuất -->
        <v-row class="mb-4">
          <!-- Thẻ thống kê đầu vào -->
          <v-col cols="12" sm="4">
            <v-card class="rounded-lg" color="primary" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu vào</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalInput }}
                </div>
                <div class="text-caption">Tổng số lượng đầu vào</div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Thẻ thống kê đầu ra -->
          <v-col cols="12" sm="4">
            <v-card class="rounded-lg" color="success" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu ra</div>
                <div class="text-h4 font-weight-bold">
                  {{
                    manufactureSMT.filter(
                      (item) => item.Source === "Máy Reflow"
                    ).length || 0
                  }}
                </div>
                <div class="text-caption">Tổng số lượng đầu ra</div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Thẻ thống kê đầu ra board-->
          <v-col cols="12" sm="4">
            <v-card class="rounded-lg" color="info" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu ra board</div>
                <div class="text-h4 font-weight-bold">
                  {{
                    QuantityBoard *
                      manufactureSMT.filter(
                        (item) => item.Source === "Máy Reflow"
                      ).length || 0
                  }}
                </div>
                <div class="text-caption">
                  Tổng số lượng board (board/panel)
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- SMT Cards Grouped with Title and Vertical Dividers -->
        <v-row class="mb-6 align-center justify-center">
          <v-col cols="12">
            <v-row class="justify-center pa-4" align="center">
              <!-- Printer -->
              <v-col
                cols="12"
                sm="4"
                class="d-flex justify-center mb-3 mb-sm-0"
              >
                <v-card
                  class="pa-3 rounded-lg d-flex flex-column align-center"
                  color="primary"
                  variant="tonal"
                  style="min-height: 150px; max-width: 340px; width: 100%"
                >
                  <v-icon color="primary" size="30">mdi-printer</v-icon>
                  <div class="text-h6 font-weight-bold mb-1 mt-2">Printer</div>
                  <div class="text-h4 font-weight-bold mb-1">
                    <span>{{
                      manufactureSMT.filter(
                        (item) => item.Source === "Máy printer"
                      ).length || 0
                    }}</span>
                  </div>
                </v-card>
              </v-col>
              <!-- Gắp linh kiện -->
              <v-col
                cols="12"
                sm="4"
                class="d-flex justify-center mb-3 mb-sm-0"
              >
                <v-card
                  class="pa-3 rounded-lg d-flex flex-column align-center"
                  color="warning"
                  variant="tonal"
                  style="min-height: 150px; max-width: 340px; width: 100%"
                >
                  <v-icon color="warning" size="30"
                    >mdi-robot-industrial</v-icon
                  >
                  <div class="text-h6 font-weight-bold mb-1 mt-2">
                    Gắp linh kiện
                  </div>
                  <div class="text-h4 font-weight-bold mb-1">
                    <span>{{
                      manufactureSMT.filter(
                        (item) => item.Source === "Máy gắp linh kiện"
                      ).length || 0
                    }}</span>
                  </div>
                </v-card>
              </v-col>
              <!-- Lò Reflow -->
              <v-col cols="12" sm="4" class="d-flex justify-center">
                <v-card
                  class="pa-3 rounded-lg d-flex flex-column align-center"
                  color="success"
                  variant="tonal"
                  style="min-height: 150px; max-width: 340px; width: 100%"
                >
                  <v-icon color="success" size="30">mdi-fire</v-icon>
                  <div class="text-h6 font-weight-bold mb-1 mt-2">
                    Lò Reflow
                  </div>
                  <div class="text-h4 font-weight-bold mb-1">
                    <span>{{
                      manufactureSMT.filter(
                        (item) => item.Source === "Máy Reflow"
                      ).length || 0
                    }}</span>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Bảng chi tiết sản xuất -->
        <v-card class="mt-4 rounded-lg" variant="text">
          <v-card-title class="d-flex align-center">
            <span class="text-h6">Bảng chi tiết sản xuất</span>
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
            height="calc(100vh - 300px)"
          >
            <template #[`item.Status`]="{ item }">
              <v-chip
                :color="item.Status === 'ok' ? 'success' : 'error'"
                size="small"
                variant="tonal"
              >
                {{ item.Status === "ok" ? "OK" : "Lỗi" }}
              </v-chip>
            </template>
            <template #[`item.Source`]="{ item }">
              <v-chip
                :color="
                  item.Source === 'Máy printer'
                    ? 'primary'
                    : item.Source === 'Máy gắp linh kiện'
                    ? 'warning'
                    : 'success'
                "
                size="small"
                variant="outlined"
              >
                {{ item.Source }}
              </v-chip>
            </template>
            <template #[`item.PartNumber`]="{ item }">
              <p v-if="item.PartNumber == 1">{{ Name_Order }}</p>
            </template>
            <template #[`bottom`]>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="
                    Math.ceil((manufactureSMT?.length || 0) / itemsPerPage)
                  "
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
import { ref, watch, reactive, computed } from "vue";
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
  { title: "Mã sản phẩm", key: "PartNumber" },
  { title: "Trạng thái", key: "Status" },
  { title: "Vị trí", key: "Source" },
  { title: "Thời gian", key: "Timestamp" },
];

// ===== Khởi tạo composables và quản lý dữ liệu =====
const { manufactureSMT, manufactureSMTError } = useManufactureSMT(id);
const { manufacture, manufactureFound, manufactureError } = useManufacture();
const { history, historyError } = useHistory(back);
const { status } = useDeviceStatusSocket("esp32-001");
console.log(manufactureFound)

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
const QuantityBoard = ref(0);
const Delay = ref(0);
const PlanID = ref("");

// Trạng thái kết nối Arduino
const isBegin = ref(false);
const isConnecting = ref(false);

// Lưu trữ ID của manufacture
const manufactureId = ref(null);

// Thêm biến totalSMT để dùng cho progress SMT
const totalSMT = computed(() => manufactureSMT.length);

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
watch(
  manufactureFound,
  (newValue) => {
    if (newValue) {
      console.log("Manufacture data updated:", newValue);
      // Lấy ID từ manufactureFound
      manufactureId.value = newValue.id;
      console.log("Manufacture ID:", manufactureId.value);
      // Có thể thêm xử lý khác nếu cần
    }
  },
  { immediate: true }
);

// Watch for changes in manufacture details to calculate total input
watch(
  () => history,
  (newData) => {
    console.log("History data:", newData);
    if (newData?.value && Array.isArray(newData.value)) {
      const data = newData.value[0];
      Name_Order.value = data?.Name_Order;
      NameManufacture.value = data?.PONumber;
      Delay.value = data?.DelaySMT;
      QuantityBoard.value = data?.Quantity;
      PlanID.value = data?.PlanID;
      totalInput.value = data?.Quantity_Plan;
    }
  },
  { immediate: true, deep: true }
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
    console.error("Manufacture data not available");
    MessageErrorDialog.value = "Không thể lấy dữ liệu sản xuất";
    DialogFailed.value = true;
    return;
  }
  const delaySMT = Number(Delay.value);
  if (isNaN(delaySMT) || delaySMT < 0) {
    MessageErrorDialog.value = "Giá trị độ trễ không hợp lệ";
    DialogFailed.value = true;
    return;
  }

  const formData = reactive({
    project_id: isBegin.value ? "" : route.params.id,
    delay: delaySMT, // Sử dụng DelaySMT từ manufactureFound
    plan_id: manufactureId.value
  });
  isConnecting.value = true;

  axios
    .post(`${Url}/api/esp-config`, formData)
    .then(function (response) {
      console.log("Arduino config response:", response.data);
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
      console.error("Arduino config error:", error);
      MessageErrorDialog.value =
        error.response?.data?.message || "Có lỗi xảy ra khi gửi đến Esp32";
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
    .delete(`${Url}/reset-data/${route.params.id}`)
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
