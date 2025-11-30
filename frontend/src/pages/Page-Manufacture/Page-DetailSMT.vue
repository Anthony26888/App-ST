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
        <span class="ml-2" v-if="lgAndUp">Theo dõi sản xuất SMT</span>
      </v-card-title>

      <!-- Thanh điều khiển -->
      <v-card-title class="d-flex align-center pe-2">
        <v-icon
          icon="mdi mdi-tools"
          color="primary"
          v-if="lgAndUp"
        ></v-icon> &nbsp;
        <v-breadcrumbs
          :items="[
            `${NameManufacture}`,
            `${Name_Order}`,
            `SMT (${Line_SMT})`,
            `${Category}`,
          ]"
          v-if="lgAndUp"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>
        <v-spacer></v-spacer>
        <div class="me-5" v-if="lgAndUp">
          <!-- Trạng thái kết nối -->
          <v-btn
            v-if="lgAndUp"
            prepend-icon="mdi-cog"
            variant="tonal"
            color="primary"
            class="ms-2 text-caption rounded-xl"
            @click="DialogSettingSMT = true"
            >Cài đặt</v-btn
          >
          <v-btn
            v-else
            icon="mdi-cog"
            variant="tonal"
            color="primary"
            class="ms-2 text-caption rounded-xl"
            @click="DialogSettingSMT = true"
          ></v-btn>
          <v-tooltip text="Trạng thái kết nối" location="top">
            <template v-slot:activator="{ props }">
              <v-chip
                v-bind="props"
                :prepend-icon="
                  currentStatus === 'Online'
                    ? 'mdi-contactless-payment-circle'
                    : 'mdi-web-off'
                "
                :color="currentStatus === 'Online' ? 'green' : 'red'"
                class="ms-2"
                dark
                size="large"
              >
                {{ currentStatus }}
              </v-chip>
            </template>
          </v-tooltip>

          <!-- Delay -->
          <v-tooltip text="Độ trễ" location="top">
            <template v-slot:activator="{ props }">
              <v-chip
                v-bind="props"
                prepend-icon="mdi-clock-outline"
                color="orange"
                class="ms-2"
                variant="tonal"
                dark
                size="large"
              >
                {{ Delay / 1000 }} giây
              </v-chip>
            </template>
          </v-tooltip>

          <!-- Nút bắt đầu / dừng -->
          <v-btn
            class="text-caption ms-2 rounded-xl"
            variant="tonal"
            @click="StartLine()"
            :color="isRunning ? 'error' : 'success'"
            :loading="isConnecting"
          >
            <v-icon :icon="isRunning ? 'mdi-stop' : 'mdi-play'"></v-icon>
            &nbsp;
            {{ isRunning ? "Dừng" : "Bắt đầu" }}
          </v-btn>
        </div>

        <div class="me-5 d-flex align-center" v-else>
          <!-- Trạng thái kết nối -->
          <v-chip
            :prepend-icon="
              currentStatus === 'Online'
                ? 'mdi-contactless-payment-circle'
                : 'mdi-web-off'
            "
            :color="currentStatus === 'Online' ? 'green' : 'red'"
            class="ma-2"
            dark
            size="small"
          >
            {{ currentStatus }}
          </v-chip>

          <!-- Delay -->
          <v-chip
            prepend-icon="mdi-clock-outline"
            color="orange"
            class="ma-2"
            variant="tonal"
            dark
            size="small"
          >
            Độ trễ: {{ Delay }} ms
          </v-chip>

          <!-- Nút bắt đầu / dừng -->
          <v-btn
            class="text-caption ms-2 rounded-lg"
            variant="tonal"
            @click="StartLine()"
            :color="isRunning ? 'error' : 'success'"
            :loading="isConnecting"
            size="small"
          >
            <v-icon :icon="isRunning ? 'mdi-stop' : 'mdi-play'"></v-icon>
            &nbsp;
            {{ isRunning ? "Dừng" : "Bắt đầu" }}
          </v-btn>
        </div>
      </v-card-title>

      <!-- Nội dung chính -->
      <v-card-text>
        <!-- Thống kê -->
        <v-row class="mb-4">
          <v-col cols="12" sm="4">
            <CardStatistic
              title="Đầu vào"
              :value="totalInput"
              icon="mdi-import"
              color="primary"
              subtitle="Tổng số lượng đầu vào"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <CardStatistic
              v-if="Line_SMT === 'Line 1'"
              title="Máy Printer"
              :value="
                QuantityBoard *
                  manufactureSMT.filter((i) => i.Source === 'Máy printer')
                    .length || 0
              "
              icon="mdi-printer"
              color="info"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-info mb-1">
                  {{ PercentOutput_Source_1 }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="PercentOutput_Source_1"
                  height="8"
                  color="info"
                  rounded
                  class="mt-4"
                  bg-color="info"
                  bg-opacity="0.2"
                ></v-progress-linear>
              </template>
            </CardStatistic>
            <CardStatistic
              v-else
              title="Máy gắp linh kiện Topaz"
              :value="
                QuantityBoard *
                  manufactureSMT.filter(
                    (i) => i.Source === 'Máy gắp linh kiện Topaz'
                  ).length || 0
              "
              icon="mdi-robot"
              color="info"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-info mb-1">
                  {{ PercentOutput_Source_3 }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="PercentOutput_Source_3"
                  height="8"
                  color="info"
                  rounded
                  class="mt-4"
                  bg-color="info"
                  bg-opacity="0.2"
                ></v-progress-linear>
              </template>
            </CardStatistic>
          </v-col>
          <v-col cols="12" sm="4">
            <CardStatistic
              v-if="Line_SMT === 'Line 1'"
              title="Máy gắp linh kiện Juki"
              :value="
                QuantityBoard *
                  manufactureSMT.filter(
                    (i) => i.Source === 'Máy gắp linh kiện Juki'
                  ).length || 0
              "
              icon="mdi-robot-industrial"
              color="warning"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-warning mb-1">
                  {{ PercentOutput_Source_2 }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="PercentOutput_Source_2"
                  height="8"
                  color="warning"
                  rounded
                  class="mt-4"
                  bg-color="warning"
                  bg-opacity="0.2"
                ></v-progress-linear>
              </template>
            </CardStatistic>
            <CardStatistic
              v-else
              title="Máy gắp linh kiện Yamaha"
              :value="
                QuantityBoard *
                  manufactureSMT.filter(
                    (i) => i.Source === 'Máy gắp linh kiện Yamaha'
                  ).length || 0
              "
              icon="mdi-robot-industrial"
              color="warning"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-warning mb-1">
                  {{ PercentOutput_Source_4 }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="PercentOutput_Source_4"
                  height="8"
                  color="warning"
                  rounded
                  class="mt-4"
                  bg-color="warning"
                  bg-opacity="0.2"
                ></v-progress-linear>
              </template>
            </CardStatistic>
          </v-col>
        </v-row>

        <!-- Bảng chi tiết -->
        <v-card class="mt-4 rounded-xl border" variant="elevated" elevation="0">
          <v-card-title class="d-flex align-center">
            <span class="text-h6" v-if="lgAndUp">Bảng chi tiết sản xuất</span>
            <v-tooltip text="Cài đặt">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-cog"
                  variant="toanl"
                  class="ms-2"
                  color="primary"
                  @click="DialogSetting = true"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-spacer v-if="lgAndUp"></v-spacer>
            <InputSearch v-model="search" />
          </v-card-title>
          <v-data-table
            v-if="lgAndUp"
            :headers="Headers"
            :items="manufactureSMT"
            :search="search"
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            class="elevation-1 mt-4 rounded-xl"
            :footer-props="{
              'items-per-page-options': [10, 20, 50, 100],
              'items-per-page-text': 'Số hàng mỗi trang',
            }"
            :loading="DialogLoading"
            loading-text="Đang tải dữ liệu..."
            no-data-text="Không có dữ liệu"
            no-results-text="Không tìm thấy kết quả"
            :hover="true"
            :dense="false"
            :fixed-header="true"
            height="49vh"
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
                {{ item.Status === "ok" ? "Pass" : "Fail" }}
              </v-chip>
            </template>
            <template #[`item.Source`]="{ item }">
              <v-chip
                :color="
                  item.Source === 'Máy printer'
                    ? 'info'
                    : item.Source === 'Máy gắp linh kiện Juki'
                    ? 'warning'
                    : item.Source === 'Máy gắp linh kiện Yamaha'
                    ? 'warning'
                    : 'info'
                "
                size="small"
                variant="tonal"
              >
                {{ item.Source }}
              </v-chip>
            </template>
            <template #[`item.Line`]="{ item }">
              <v-chip
                :color="
                  item.Line === 'Line 1'
                    ? 'brown-lighten-2'
                    : 'deep-orange-lighten-2'
                "
                size="small"
                variant="tonal"
              >
                {{ item.Line }}
              </v-chip>
            </template>
            <template #[`item.PartNumber`]="{ item }">
              <p v-if="item.PartNumber == 1">{{ Category }}</p>
              <p v-else>{{ item.PartNumber }}</p>
            </template>
            <template #item.id="{ item }">
              <v-btn
                size="small"
                variant="text"
                color="error"
                icon="mdi-trash-can"
                @click="GetItemHistory(item)"
              ></v-btn>
            </template>
            <template #[`bottom`]>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(manufactureSMT.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
          </v-data-table>
          <v-data-table
            v-else
            :headers="Headers"
            :items="manufactureSMT"
            :search="search"
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            class="elevation-1 mt-4 rounded-xl"
            :footer-props="{
              'items-per-page-options': [10, 20, 50, 100],
              'items-per-page-text': 'Số hàng mỗi trang',
            }"
            :loading="DialogLoading"
            loading-text="Đang tải dữ liệu..."
            no-data-text="Không có dữ liệu"
            no-results-text="Không tìm thấy kết quả"
            :hover="true"
            :dense="false"
            :fixed-header="true"
            height="220px"
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
                {{ item.Status === "ok" ? "Pass" : "Fail" }}
              </v-chip>
            </template>
            <template #[`item.Source`]="{ item }">
              <v-chip
                :color="
                  item.Source === 'Máy printer'
                    ? 'info'
                    : item.Source === 'Máy gắp linh kiện Juki'
                    ? 'warning'
                    : item.Source === 'Máy gắp linh kiện Yamaha'
                    ? 'warning'
                    : 'info'
                "
                size="small"
                variant="tonal"
              >
                {{ item.Source }}
              </v-chip>
            </template>
            <template #[`item.Line`]="{ item }">
              <v-chip
                :color="
                  item.Line === 'Line 1'
                    ? 'brown-lighten-2'
                    : 'deep-orange-lighten-2'
                "
                size="small"
                variant="tonal"
              >
                {{ item.Line }}
              </v-chip>
            </template>
            <template #[`item.PartNumber`]="{ item }">
              <p v-if="item.PartNumber == 1">{{ Category }}</p>
              <p v-else>{{ item.PartNumber }}</p>
            </template>
            <template #item.id="{ item }">
              <v-btn
                size="small"
                variant="text"
                color="error"
                icon="mdi-trash-can"
                @click="GetItemHistory(item)"
              ></v-btn>
            </template>
            <template #[`bottom`]>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(manufactureSMT.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Dialog xác nhận xóa dữ liệu lịch sử sản xuất -->
    <v-dialog v-model="DialogRemoveHistory" width="400">
      <v-card max-width="400">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
          Xoá dữ liệu
        </v-card-title>
        <v-card-text> Bạn có chắc chắn muốn xoá dữ liệu ? </v-card-text>
        <template v-slot:actions>
          <ButtonCancel @cancel="DialogRemoveHistory = false" />
          <ButtonDelete @delete="RemoveItemHistory()" />
        </template>
      </v-card>
    </v-dialog>

    <v-dialog v-model="DialogSetting" width="400">
      <v-card max-width="500">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
          Nhập só lượng đã sản xuất
        </v-card-title>
        <v-card-text>
          <InputField
            label="Số lượng sản phẩm"
            type="number"
            v-model="Quantity_Add"
            hide-details
            variant="outlined"
            density="comfortable"
            placeholder="VD: 5"
          />
        </v-card-text>
        <template v-slot:actions>
          <ButtonCancel @cancel="DialogSetting = false" />
          <ButtonSave @save="InputQuantity()" />
        </template>
      </v-card>
    </v-dialog>

    <!-- Dialog Setting SMT -->
    <v-dialog v-model="DialogSettingSMT" max-width="700px">
      <v-card class="rounded-lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-cog" color="primary" class="me-2"></v-icon>
          Cài đặt dây chuyền
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col>
              <InputField
                v-model="DelaySMT_Edit"
                label="Độ trễ SMT (ms)"
                type="number"
              />
            </v-col>
            <v-col>
              <InputField
                v-model="Quantity_Edit"
                label="Số lượng board SMT"
                type="number"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <ButtonCancel @cancel="DialogSettingSMT = false" />
          <ButtonSave @save="SaveEditSettingSMT()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Thông báo -->
    <Loading v-model="DialogLoading" />
    <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
    <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
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
import CardStatistic from "@/components/Card-Statistic.vue";

const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const id = route.params.id;
const back = localStorage.getItem("ManufactureID");
const LevelUser = localStorage.getItem("LevelUser");
const Line_SMT = ref("");
const currentStatus = computed(() =>
  Line_SMT.value === "Line 1" ? status.value : statusLine2.value
);

const { manufactureSMT } = useManufactureSMT(id);
const { manufactureFound } = useManufacture();

const { history } = useHistory(back);
const { status } = useDeviceStatusSocket("esp32-001");
const { status: statusLine2 } = useDeviceStatusSocket("esp32-002");
const { mdAndDown, lgAndUp } = useDisplay();
// Chọn trạng thái theo Line_SMT

const DialogLoading = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogRemoveHistory = ref(false);
const DialogSettingSMT = ref(false);
const DialogSetting = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

//Config table
const Headers = [
  { title: "STT", key: "stt" },
  { title: "Mã sản phẩm", key: "PartNumber" },
  { title: "Trạng thái", key: "Status" },
  { title: "Thiết bị", key: "Source" },
  { title: "Vị trí", key: "Line" },
  { title: "Thời gian", key: "Timestamp" },
  { title: "Thao tác", key: "id" },
];

const search = ref("");
const page = ref(1);
const itemsPerPage = ref(15);

const GetID = ref("");

const totalInput = ref(0);
const NameManufacture = ref("");
const Name_Order = ref("");
const QuantityBoard = ref(0);
const Delay = ref(0);
const PlanID = ref("");
const Action = ref("");
const Category = ref("");

const Quantity_Add = ref(1);

// ===== FORM SETTING SMT =====
const DelaySMT_Edit = ref(10000);
const Quantity_Edit = ref(1);

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
      Line_SMT.value = selected?.Line_SMT;
      Category.value = selected?.Category;
      DelaySMT_Edit.value = selected?.DelaySMT;
      Quantity_Edit.value = selected?.Quantity;
    }
  },
  { immediate: true, deep: true }
);

const PercentOutput = computed(() => {
  const list = Array.isArray(manufactureSMT.value) ? manufactureSMT.value : []; // fallback array

  const total = totalInput.value || 1; // tránh chia 0
  const source =
    Line_SMT.value === "Line 1"
      ? "Máy gắp linh kiện Juki"
      : "Máy gắp linh kiện Yamaha";

  const count = list.filter((i) => i?.Source === source).length;

  return Number.parseFloat((QuantityBoard.value * 100 * count) / total).toFixed(
    1
  );
});

const PercentOutput_Source_4 = computed(() => {
  const list = Array.isArray(manufactureSMT.value) ? manufactureSMT.value : []; // fallback array

  const total = totalInput.value || 1; // tránh chia 0
  const source = "Máy gắp linh kiện Yamaha";

  const count = list.filter((i) => i?.Source === source).length;

  return Number.parseFloat((QuantityBoard.value * 100 * count) / total).toFixed(
    1
  );
});

const PercentOutput_Source_3 = computed(() => {
  const list = Array.isArray(manufactureSMT.value) ? manufactureSMT.value : []; // fallback array

  const total = totalInput.value || 1; // tránh chia 0
  const source = "Máy gắp linh kiện Topaz";

  const count = list.filter((i) => i?.Source === source).length;

  return Number.parseFloat((QuantityBoard.value * 100 * count) / total).toFixed(
    1
  );
});

const PercentOutput_Source_2 = computed(() => {
  const list = Array.isArray(manufactureSMT.value) ? manufactureSMT.value : []; // fallback array

  const total = totalInput.value || 1; // tránh chia 0
  const source = "Máy gắp linh kiện Juki";

  const count = list.filter((i) => i?.Source === source).length;

  return Number.parseFloat((QuantityBoard.value * 100 * count) / total).toFixed(
    1
  );
});

const PercentOutput_Source_1 = computed(() => {
  const list = Array.isArray(manufactureSMT.value) ? manufactureSMT.value : []; // fallback array

  const total = totalInput.value || 1; // tránh chia 0
  const source = "Máy printer";

  const count = list.filter((i) => i?.Source === source).length;

  return Number.parseFloat((QuantityBoard.value * 100 * count) / total).toFixed(
    1
  );
});

const GetItemHistory = (item) => {
  DialogRemoveHistory.value = true;
  GetID.value = item.id;
};
// Hàm xóa item lịch sử sản xuất
const RemoveItemHistory = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/ManufactureSMT/Delete-item-history/${GetID.value}`
    );
    DialogSuccess.value = true;
    DialogLoading.value = false;
    DialogRemoveHistory.value = false;
    MessageDialog.value = "Xoá dữ liệu thành công";
  } catch (error) {
    DialogFailed.value = true;
    DialogLoading.value = false;
    DialogRemoveHistory.value = false;
    MessageErrorDialog.value = error;
    Error();
  }
};

const InputQuantity = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    HistoryID: id,
    PlanID: PlanID.value,
    Quantity: Quantity_Add.value || 1,
    Source: (Line_SMT.value = "Line 1" ? "source_2" : "source_4"),
    Type: "SMT",
  });

  try {
    const response = await axios.post(`${Url}/ManufactureSMT`, formData);
    DialogLoading.value = false;
    DialogSetting.value = false;
    // Reset các giá trị sau khi thành công
    Quantity_Add.value = 1;
    DialogSuccess.value = true;
    MessageDialog.value = "Sản phẩm đã được nhập thành công";
  } catch (error) {
    DialogLoading.value = false;
    DialogSetting.value = false;
    Quantity_Add.value = 1;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Lỗi khi nhập mã sản phẩm";
  } finally {
    DialogLoading.value = false;
  }
};

// Hàm lưu thông tin chỉnh sửa
const SaveEditSettingSMT = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    DelaySMT: DelaySMT_Edit.value,
    Quantity: Quantity_Edit.value,
    PlanID: PlanID.value,
    Type: "SMT",
  });
  try {
    const response = await axios.put(
      `${Url}/PlanManufacture/Edit-Line/${PlanID.value}`,
      formData
    );
    DialogSuccess.value = true;
    MessageDialog.value = response.data.message;
    DialogLoading.value = false;
    DialogSettingSMT.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = error;
    DialogLoading.value = false;
    DialogSettingSMT.value = false;
  }
};

const showError = (msg) => {
  MessageErrorDialog.value = msg;
  DialogFailed.value = true;
};

// Action line
// const StartLine = async () => {
//   if (Line_SMT.value == "Line 2") {
//     if (!manufactureFound.value) {
//       return showError("Không thể lấy dữ liệu sản xuất");
//     }

//     const delaySMT = Number(Delay.value);
//     if (isNaN(delaySMT) || delaySMT < 0) {
//       return showError("Giá trị độ trễ không hợp lệ");
//     }

//     const newAction = isRunning.value ? "stopped" : "running";

//     try {
//       isConnecting.value = true;

//       // Nếu bắt đầu => dừng tất cả plan khác và ESP32 cũ
//       if (newAction === "running") {
//         await axios.put(`${Url}/Summary/Edit-item-action-stopped-line2`);
//         await axios.post(`${Url}/esp-config-line2`, {
//           project_id: "",
//           delay: 0,
//           plan_id: "",
//         });
//       }

//       // Gửi config cho ESP32 hiện tại
//       await axios.post(`${Url}/esp-config-line2`, {
//         project_id: newAction === "running" ? route.params.id : "",
//         delay: delaySMT,
//         plan_id: localStorage.getItem("ManufactureID"),
//       });

//       // Cập nhật action
//       await axios.put(`${Url}/Summary/Edit-item-action/${id}`, {
//         Action: newAction,
//       });
//       Action.value = newAction;

//       MessageDialog.value =
//         newAction === "running"
//           ? `Đã bắt đầu sản xuất với độ trễ ${delaySMT}ms`
//           : "Đã dừng sản xuất";
//       DialogSuccess.value = true;
//     } catch (error) {
//       showError(error.response?.data?.message || "Có lỗi xảy ra khi thực hiện");
//     } finally {
//       isConnecting.value = false;
//     }
//   } else {
//     if (!manufactureFound.value) {
//       return showError("Không thể lấy dữ liệu sản xuất");
//     }

//     const delaySMT = Number(Delay.value);
//     if (isNaN(delaySMT) || delaySMT < 0) {
//       return showError("Giá trị độ trễ không hợp lệ");
//     }

//     const newAction = isRunning.value ? "stopped" : "running";

//     try {
//       isConnecting.value = true;

//       // Nếu bắt đầu => dừng tất cả plan khác và ESP32 cũ
//       if (newAction === "running") {
//         await axios.put(`${Url}/Summary/Edit-item-action-stopped-line1`);
//         await axios.post(`${Url}/esp-config`, {
//           project_id: "",
//           delay: 0,
//           plan_id: "",
//         });
//       }

//       // Gửi config cho ESP32 hiện tại
//       await axios.post(`${Url}/esp-config`, {
//         project_id: newAction === "running" ? route.params.id : "",
//         delay: delaySMT,
//         plan_id: localStorage.getItem("ManufactureID"),
//       });

//       // Cập nhật action
//       await axios.put(`${Url}/Summary/Edit-item-action/${id}`, {
//         Action: newAction,
//       });
//       Action.value = newAction;

//       MessageDialog.value =
//         newAction === "running"
//           ? `Đã bắt đầu sản xuất với độ trễ ${delaySMT}ms`
//           : "Đã dừng sản xuất";
//       DialogSuccess.value = true;
//     } catch (error) {
//       showError(error.response?.data?.message || "Có lỗi xảy ra khi thực hiện");
//     } finally {
//       isConnecting.value = false;
//     }
//   }
// };
// const StartLine = async () => {
//   if (!manufactureFound.value) {
//     return showError("Không thể lấy dữ liệu sản xuất");
//   }

//   const delaySMT = Number(Delay.value);
//   if (isNaN(delaySMT) || delaySMT < 0) {
//     return showError("Giá trị độ trễ không hợp lệ");
//   }

//   const isLine2 = Line_SMT.value === "Line 2";
//   const line = isLine2 ? 2 : 1;
//   const newAction = isRunning.value ? "stopped" : "running";

//   try {
//     isConnecting.value = true;

//     // Nếu bắt đầu => dừng tất cả plan khác trước
//     if (newAction === "running") {
//       await axios.put(`${Url}/Summary/Edit-item-action-stopped-line${line}`);

//       // Reset ESP32 đang chạy cũ
//       await axios.post(`${Url}/send-config-to-device`, {
//         project_id: "",
//         delay: 0,
//         plan_id: "",
//         line,
//       });
//     }

//     // Gửi config cho line hiện tại
//     await axios.post(`${Url}/send-config-to-device`, {
//       project_id: newAction === "running" ? route.params.id : "",
//       delay: delaySMT,
//       plan_id: localStorage.getItem("ManufactureID"),
//       line,
//     });

//     // Update trạng thái DB
//     await axios.put(`${Url}/Summary/Edit-item-action/${id}`, {
//       Action: newAction,
//     });

//     Action.value = newAction;

//     MessageDialog.value =
//       newAction === "running"
//         ? `Đã bắt đầu sản xuất (Line ${line}) - Delay: ${delaySMT}ms`
//         : `Đã dừng sản xuất trên Line ${line}`;

//     DialogSuccess.value = true;
//   } catch (error) {
//     console.error("⛔ Error:", error);
//     showError(error.response?.data?.error || "Có lỗi xảy ra khi thực hiện");
//   } finally {
//     isConnecting.value = false;
//   }
// };

const StartLine = async () => {
  if (!manufactureFound.value) {
    return showError("Không thể lấy dữ liệu sản xuất");
  }

  const delaySMT = Number(Delay.value);
  if (isNaN(delaySMT) || delaySMT < 0) {
    return showError("Giá trị độ trễ không hợp lệ");
  }

  const line = Line_SMT.value === "Line 2" ? 2 : 1;
  const newAction = isRunning.value ? "stopped" : "running";

  try {
    isConnecting.value = true;

    // Nếu bắt đầu => dừng tất cả plan khác trước
    if (newAction === "running") {
      await axios.put(`${Url}/Summary/Edit-item-action-stopped-line${line}`);

      // Reset config cũ trong gateway
      await axios.post(`${Url}/add-config`, {
        project_id: "",
        plan_id: "",
        delay: 0,
        line,
      });
    }

    // Gửi config mới lên ERPST server queue
    await axios.post(`${Url}/add-config`, {
      project_id: newAction === "running" ? route.params.id : "",
      plan_id: localStorage.getItem("ManufactureID"),
      delay: delaySMT,
      line,
    });

    // Update trạng thái sản xuất trong DB
    await axios.put(`${Url}/Summary/Edit-item-action/${id}`, {
      Action: newAction,
    });

    Action.value = newAction;
    DialogSuccess.value = true;
    MessageDialog.value =
      newAction === "running"
        ? `Đã bắt đầu sản xuất (Line ${line}) - Delay: ${delaySMT}ms`
        : `Đã dừng sản xuất trên Line ${line}`;
  } catch (error) {
    DialogFailed.value = false;
    MessageErrorDialog.value =
      error.response?.data?.error || "Có lỗi xảy ra khi thực hiện";
  } finally {
    isConnecting.value = false;
  }
};
</script>
