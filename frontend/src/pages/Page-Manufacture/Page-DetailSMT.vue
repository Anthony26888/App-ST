<template>
  <div>
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <!-- Tiêu đề -->
      <v-card-title class="text-h4 font-weight-light d-flex align-center">
        <ButtonBack
          v-if="LevelUser === 'Nhân viên'"
          :to="`/Danh-sach-cong-viec`"
          @click="removeGoBackListWork"
        />
        <ButtonBack v-else :to="`/San-xuat/Chi-tiet/${back}`" />
        <span class="ml-2">Theo dõi sản xuất SMT</span>
      </v-card-title>

      <!-- Thanh điều khiển -->
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-tools" color="primary" size="large"></v-icon>
        <v-breadcrumbs :items="[`${NameManufacture}`, `${Name_Order}`]">
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>
        <v-spacer></v-spacer>

        <!-- Trạng thái kết nối -->
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

        <!-- Delay -->
        <v-chip
          prepend-icon="mdi-clock-outline"
          color="orange"
          class="ma-2"
          variant="tonal"
          dark
          size="large"
        >
          Độ trễ: {{ Delay }} ms
        </v-chip>

        <!-- Nút bắt đầu / dừng -->
        <v-btn
          class="text-caption ms-2"
          variant="tonal"
          @click="handleToggleProduction"
          :color="isRunning ? 'warning' : 'success'"
          :loading="isConnecting"
        >
          <v-icon :icon="isRunning ? 'mdi-stop' : 'mdi-play'"></v-icon>
          &nbsp;
          {{ isRunning ? "Dừng" : "Bắt đầu" }}
        </v-btn>
      </v-card-title>

      <!-- Nội dung chính -->
      <v-card-text>
        <!-- Thống kê -->
        <v-row class="mb-4">
          <v-col cols="12" sm="4">
            <v-card class="rounded-lg" color="primary" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu vào</div>
                <div class="text-h4 font-weight-bold">{{ totalInput }}</div>
                <div class="text-caption">Tổng số lượng đầu vào</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card class="rounded-lg" color="success" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu ra</div>
                <div class="text-h4 font-weight-bold">
                  {{
                    manufactureSMT.filter((i) => i.Source === "Máy Reflow").length || 0
                  }}
                </div>
                <div class="text-caption">Tổng số lượng đầu ra</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card class="rounded-lg" color="info" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu ra board</div>
                <div class="text-h4 font-weight-bold">
                  {{
                    QuantityBoard *
                      manufactureSMT.filter((i) => i.Source === "Máy Reflow").length || 0
                  }}
                </div>
                <div class="text-caption">Tổng số lượng board</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Bảng chi tiết -->
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
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            class="elevation-1 mt-4"
            :footer-props="{
              'items-per-page-options': [10, 20, 50, 100],
              'items-per-page-text': 'Số hàng mỗi trang'
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
            <template v-slot:item.stt="{ index }">
              {{ (page - 1) * itemsPerPage + index + 1 }}
            </template>
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
          </v-data-table>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Thông báo -->
    <Loading v-model="DialogLoading" />
    <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
    <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { useHistory } from "@/composables/Manufacture/useHistory";
import { useManufactureSMT } from "@/composables/Manufacture/useManufactureSMT";
import { useManufacture } from "@/composables/Manufacture/useManufacture";
import { useDeviceStatusSocket } from "@/composables/Manufacture/useStatusSensor";
import Loading from "@/components/Loading.vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonBack from "@/components/Button-Back.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";

const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const id = route.params.id;
const back = localStorage.getItem("ManufactureID");
const LevelUser = localStorage.getItem("LevelUser");

const Headers = [
  { title: "STT", key: "stt" },
  { title: "Mã sản phẩm", key: "PartNumber" },
  { title: "Trạng thái", key: "Status" },
  { title: "Vị trí", key: "Source" },
  { title: "Thời gian", key: "Timestamp" }
];

const { manufactureSMT } = useManufactureSMT(id);
const { manufactureFound } = useManufacture();
const { history } = useHistory(back);
const { status } = useDeviceStatusSocket("esp32-001");

const DialogLoading = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

const search = ref("");
const page = ref(1);
const itemsPerPage = ref(15);

const totalInput = ref(0);
const NameManufacture = ref("");
const Name_Order = ref("");
const QuantityBoard = ref(0);
const Delay = ref(0);
const PlanID = ref("");
const Action = ref("");

const isConnecting = ref(false);
const isRunning = computed(() => Action.value === "running");

watch(
  () => history,
  (newData) => {
    if (newData?.value?.length) {
      const selected =
        newData.value.find((item) => String(item.id) === String(id)) ||
        newData.value[0];
      Name_Order.value = selected?.Name_Order;
      NameManufacture.value = selected?.PONumber;
      Delay.value = selected?.DelaySMT;
      QuantityBoard.value = selected?.Quantity;
      PlanID.value = selected?.PlanID;
      totalInput.value = selected?.Quantity_Plan;
      Action.value = selected?.Action;
    }
  },
  { immediate: true, deep: true }
);

const showError = (msg) => {
  MessageErrorDialog.value = msg;
  DialogFailed.value = true;
};

const handleToggleProduction = async () => {
  if (!manufactureFound.value) {
    return showError("Không thể lấy dữ liệu sản xuất");
  }

  const delaySMT = Number(Delay.value);
  if (isNaN(delaySMT) || delaySMT < 0) {
    return showError("Giá trị độ trễ không hợp lệ");
  }

  const newAction = isRunning.value ? "stopped" : "running";

  try {
    isConnecting.value = true;

    // Nếu bắt đầu => dừng tất cả plan khác và ESP32 cũ
    if (newAction === "running") {
      await axios.put(`${Url}/Summary/Edit-item-action-stopped`);
      await axios.post(`${Url}/esp-config`, {
        project_id: "",
        delay: 0,
        plan_id: ""
      });
    }

    // Gửi config cho ESP32 hiện tại
    await axios.post(`${Url}/esp-config`, {
      project_id: newAction === "running" ? route.params.id : "",
      delay: delaySMT,
      plan_id: localStorage.getItem("ManufactureID")
    });

    // Cập nhật action
    await axios.put(`${Url}/Summary/Edit-item-action/${id}`, { Action: newAction });
    Action.value = newAction;

    MessageDialog.value =
      newAction === "running"
        ? `Đã bắt đầu sản xuất với độ trễ ${delaySMT}ms`
        : "Đã dừng sản xuất";
    DialogSuccess.value = true;
  } catch (error) {
    showError(error.response?.data?.message || "Có lỗi xảy ra khi thực hiện");
  } finally {
    isConnecting.value = false;
  }
};
</script>
