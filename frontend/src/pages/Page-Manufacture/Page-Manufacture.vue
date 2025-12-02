<!-- Template chính chứa giao diện người dùng -->
<template>
  <div>
    <!-- Card chính chứa toàn bộ nội dung -->
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <!-- Tiêu đề trang -->
      <v-card-title class="text-h4 font-weight-light" v-if="lgAndUp">
        Danh sách sản xuất
      </v-card-title>

      <v-card-text>
        <v-row class="mb-3">
          <v-col cols="12" md="3">
            <CardStatistic
              title="Tổng PO"
              :value="totalUniquePO"
              icon="mdi-file-document-multiple"
              color="primary"
              subtitle="Tổng số PO"
            />
          </v-col>
          <v-col cols="12" md="3">
            <CardStatistic
              title="Tổng đơn hàng"
              :value="manufacture.length || 0"
              icon="mdi-package-variant-closed"
              color="primary"
              subtitle="Tổng số đơn hàng"
            />
          </v-col>
          <v-col cols="12" md="3">
            <CardStatistic
              title="Đơn hàng hoàn thành"
              :value="manufacture.filter((item) => item.Status_Output === 'Hoàn thành').length"
              icon="mdi-check-circle"
              color="success"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-success mb-1">
                  {{ progressCompleted }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="progressCompleted"
                  height="8"
                  color="success"
                  rounded
                  class="mt-4"
                  bg-color="success"
                  bg-opacity="0.2"
                ></v-progress-linear>
              </template>
            </CardStatistic>
          </v-col>
          <v-col cols="12" md="3">
            <CardStatistic
              title="Đơn hàng đang sản xuất"
              :value="manufacture.filter((item) => item.Status_Output === 'Đang sản xuất').length"
              icon="mdi-progress-wrench"
              color="warning"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-warning mb-1">
                  {{ progressManufacture }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="progressManufacture"
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
        <!-- Card chứa bảng dữ liệu -->
        <v-card variant="elevated" elevation="0" class="rounded-xl border">
          <!-- Header của bảng với các nút chức năng -->
          <v-card-title class="d-flex align-center pe-2">
            <!-- Nút thêm mới -->
            <ButtonAdd @add="DialogAdd = true" />
            <v-spacer></v-spacer>
            <!-- Component tìm kiếm -->
            <InputSearch
              :modelValue="search"
              @update:modelValue="search = $event"
            />
          </v-card-title>

          <!-- Nội dung bảng dữ liệu -->
          <v-card-text class="overflow-auto">
            <!-- Bảng dữ liệu chính -->
            <v-data-table-virtual
              :group-by="groupBy"
              density="comfortable"
              :headers="Headers"
              :items="manufacture"
              :search="search"
              :items-per-page="itemsPerPage"
              :page="page"
              @update:page="page = $event"
              class="elevation-0"
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
              height="64vh"
            >
              <template
                v-slot:group-header="{
                  item,
                  columns,
                  toggleGroup,
                  isGroupOpen,
                }"
              >
                <tr>
                  <td
                    :colspan="columns.length"
                    class="cursor-pointer"
                    v-ripple
                    @click="toggleGroup(item)"
                  >
                    <div class="d-flex align-center">
                      <v-btn
                        :icon="isGroupOpen(item) ? '$expand' : '$next'"
                        color="medium-emphasis"
                        density="comfortable"
                        size="small"
                        variant="text"
                      ></v-btn>

                      <span class="ms-4 font-weight-bold text-primary"
                        >{{ item.value }} ({{ item.items.length }})</span
                      >
                    </div>
                  </td>
                </tr>
              </template>
              <!-- Cột thao tác -->
              <template #[`item.id`]="{ item }">
                <div class="d-flex">
                  <ButtonEye @detail="PushItem(item.id)" />
                  <ButtonEdit @edit="GetItem(item.id)" />
                </div>
              </template>

              <!-- Cột trạng thái -->
              <template #[`item.Status_Output`]="{ item }">
                <v-chip
                  v-if="item.Status_Output == 'Hoàn thành'"
                  color="success"
                  variant="tonal"
                  size="small"
                >
                  {{ item.Status_Output }}
                </v-chip>
                <v-chip v-else color="warning" variant="tonal" size="small">
                  {{ item.Status_Output }}
                </v-chip>
              </template>
              <template #[`item.Total`]="{ item }">
                <v-chip color="primary" variant="tonal" size="small">{{
                  item.Total
                }}</v-chip>
              </template>
              <template #[`item.Total_Output`]="{ item }">
                <v-chip color="success" variant="tonal" size="small">{{
                  item.Total_Output
                }}</v-chip>
              </template>
              <template #[`item.Progress`]="{ item }">
                <v-progress-linear
                  v-model="item.Progress"
                  height="20"
                  color="success"
                  rounded
                  class="rounded-lg"
                >
                  <strong
                    >{{ Number.parseFloat(item.Progress).toFixed(1) }}%</strong
                  >
                </v-progress-linear>
              </template>
            </v-data-table-virtual>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Dialog chỉnh sửa dữ liệu -->
    <v-dialog
      :model-value="DialogEdit"
      @update:model-value="DialogEdit = $event"
      width="500"
      scrollable
    >
      <v-card max-width="500" class="overflow-y-auto rounded-lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
          Cập nhật dữ liệu
        </v-card-title>
        <v-card-text>
          <InputField
            label="Tên dự án"
            :model-value="Name_Edit"
            @update:model-value="Name_Edit = $event"
          />
          <InputField
            label="Tên đơn hàng"
            v-model="Name_Order_Edit"
            @update:model-value="Name_Order_Edit = $event"
          />
          <InputField
            label="Tổng sản phẩm"
            type="number"
            suffix="pcs"
            :model-value="Total_Edit"
            @update:model-value="Total_Edit = $event"
          />
          <!-- <InputSelect
            label="Quy trình"
            :items="[
              'SMT',
              'AOI',
              'IPQC (SMT)',
              'Assembly',
              'IPQC',
              'Test 1',
              'Test 2',
              'Box Build',
              'Tẩm phủ',
              'OQC',
              'RW',
              'Thành phẩm',
            ]"
            multiple
            chips
            hint="Lựa chọn quy trình phù hợp"
            v-model="Level_Edit"
            @update:model-value="(val) => (Level_Edit = val)"
          /> -->

          <!-- Thêm input cho quy trình khác trong dialog chỉnh sửa -->
          <div>
            <!-- Hiển thị danh sách quy trình tùy chỉnh đã thêm -->
            <div v-if="customProcessListEdit.length > 0">
              <div class="text-caption text-grey mb-1">Quy trình đã thêm:</div>
              <div class="d-flex flex-wrap ga-2 mb-5">
                <v-chip
                  v-for="(process, index) in customProcessListEdit"
                  :key="process"
                  closable
                  color="secondary"
                  size="small"
                  @click:close="removeCustomProcessEdit(index)"
                >
                  {{ process }}
                </v-chip>
              </div>
            </div>
            <InputField
              label="Thêm quy trình khác"
              v-model="customProcessEdit"
              placeholder="Nhập tên quy trình và nhấn Enter"
              @keyup.enter="addCustomProcessEdit"
              hint="Nhập và nhấn Enter để thêm nhiều quy trình"
            >
              <template #append>
                <v-btn
                  icon="mdi-plus-circle"
                  size="small"
                  color="primary"
                  variant="text"
                  @click="addCustomProcessEdit"
                  :disabled="!customProcessEdit || !customProcessEdit.trim()"
                ></v-btn>
              </template>
            </InputField>
          </div>

          <InputField
            label="Ngày tạo"
            type="date"
            class="mt-3"
            v-model="Date_Edit"
          />
          <InputTextarea
            label="Ghi chú"
            :model-value="Note_Edit"
            @update:model-value="Note_Edit = $event"
          />
        </v-card-text>
        <v-card-actions>
          <ButtonDelete @delete="DialogRemove = true" />
          <v-spacer></v-spacer>
          <ButtonCancel @cancel="DialogEdit = false" />
          <ButtonSave @save="SaveEdit()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog thêm mới dữ liệu -->
    <v-dialog
      :model-value="DialogAdd"
      @update:model-value="DialogAdd = $event"
      width="500"
      scrollable
    >
      <v-card max-width="500" class="overflow-y-auto rounded-lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
          Thêm dữ liệu sản xuất
        </v-card-title>
        <v-card-text>
          <InputField label="Tên dự án" v-model="Name_Manufacture_Add" />
          <InputField
            label="Tên đơn hàng"
            v-model="Name_Order_Manufacture"
            :rules="[requiredRule]"
            @update:model-value="Name_Order_Manufacture = $event"
          />
          <InputField
            label="Tổng sản phẩm"
            type="number"
            suffix="pcs"
            :model-value="Total_Manufacture_Add"
            :rules="[requiredRule]"
            @update:model-value="Total_Manufacture_Add = $event"
          />
          <!-- <InputSelect
            label="Quy trình"
            :items="[
              'SMT',
              'AOI',
              'IPQC (SMT)',
              'Assembly',
              'IPQC',
              'Test 1',
              'Test 2',
              'Box Build',
              'Tẩm phủ',
              'OQC',
              'RW',
              'Thành phẩm',
            ]"
            multiple
            chips
            hint="Lựa chọn quy trình phù hợp"
            v-model="Level_Manufacture_Add"
            @update:model-value="(val) => (Level_Manufacture_Add = val)"
          /> -->

          <!-- Thêm input cho quy trình khác -->
          <div>
            <!-- Hiển thị danh sách quy trình tùy chỉnh đã thêm -->
            <div v-if="customProcessList.length > 0">
              <div class="text-caption text-grey mb-1">Quy trình đã thêm:</div>
              <div class="d-flex flex-wrap ga-2 mb-5">
                <v-chip
                  v-for="(process, index) in customProcessList"
                  :key="index"
                  closable
                  color="secondary"
                  size="small"
                  @click:close="removeCustomProcess(index)"
                >
                  {{ process }}
                </v-chip>
              </div>
            </div>
            <InputField
              label="Thêm quy trình khác"
              v-model="customProcess"
              placeholder="Nhập tên quy trình và nhấn Enter"
              @keyup.enter="addCustomProcess"
              hint="Nhập và nhấn Enter để thêm nhiều quy trình"
            >
              <template #append>
                <v-btn
                  icon="mdi-plus-circle"
                  size="small"
                  color="primary"
                  variant="text"
                  @click="addCustomProcess"
                  :disabled="!customProcess || !customProcess.trim()"
                ></v-btn>
              </template>
            </InputField>
          </div>

          <InputField
            class="mt-3"
            label="Ngày tạo"
            type="date"
            v-model="Date_Manufacture_Add"
            :rules="[requiredRule]"
            @update:model-value="Date_Manufacture_Add = $event"
          />
          <InputTextarea
            label="Ghi chú"
            :model-value="Note_Add_Manufacture"
            @update:model-value="Note_Add_Manufacture = $event"
          />
        </v-card-text>
        <v-card-actions>
          <ButtonCancel @cancel="DialogAdd = false" />
          <ButtonSave @save="SaveAdd()" :disabled="!Name_Manufacture_Add || !Name_Order_Manufacture || !Total_Manufacture_Add || !Date_Manufacture_Add" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog xác nhận xóa -->
    <v-dialog
      :model-value="DialogRemove"
      @update:model-value="DialogRemove = $event"
      width="500"
    >
      <v-card max-width="500" class="rounded-lg">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
          Xoá dữ liệu sản xuất
        </v-card-title>
        <v-card-text>
          Bạn có chắc chắn muốn xoá kế hoạch sản phẩm này ?
        </v-card-text>
        <template #actions>
          <ButtonCancel @cancel="DialogRemove = false" />
          <ButtonDelete @delete="RemoveItem()" />
        </template>
      </v-card>
    </v-dialog>
    <!-- Dialog import file -->
    <v-dialog
      :model-value="Dialog"
      @update:model-value="Dialog = $event"
      width="400"
    >
      <v-card max-width="400" class="rounded-xl">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
          Thêm dữ liệu sản xuất
        </v-card-title>
        <v-card-text>
          <InputFiles
            label="Thêm File Excel"
            :model-value="File"
            @update:model-value="File = $event"
          />
        </v-card-text>
        <template #actions>
          <ButtonCancel @cancel="Dialog = false" />
          <ButtonSave @save="ImportFile()" />
        </template>
      </v-card>
    </v-dialog>

    <!-- Các component thông báo và loading -->
    <SnackbarSuccess
      :model-value="DialogSuccess"
      @update:model-value="DialogSuccess = $event"
      :message="MessageDialog"
    />
    <SnackbarFailed
      :model-value="DialogFailed"
      @update:model-value="DialogFailed = $event"
      :message="MessageErrorDialog"
    />
    <Loading
      :model-value="DialogLoading"
      @update:model-value="DialogLoading = $event"
    />
  </div>
</template>

<script setup>
// Import các thư viện cần thiết
import axios from "axios";
import { useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";
import { useDisplay } from "vuetify";
import { ref, onMounted, computed, reactive, watch } from "vue";

// Import các components
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import { useManufacture } from "@/composables/Manufacture/useManufacture";

// Khởi tạo các composables và biến môi trường
const { manufacture, manufactureError } = useManufacture();
const { mdAndDown, lgAndUp } = useDisplay();
// Khởi tạo các biến môi trường
const Url = import.meta.env.VITE_API_URL;
const router = useRouter();

// Khởi tạo các biến ref cho dialog
const GetID = ref("");
const Dialog = ref(false);
const DialogEdit = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogRemove = ref(false);
const DialogAdd = ref(false);
const DialogLoading = ref(false);

// Khởi tạo các biến ref cho form chỉnh sửa
const File = ref(null);
const Name_Edit = ref("");
const Name_Order_Edit = ref("");
const Total_Edit = ref(0);
const DelaySMT_Edit = ref(0);
const Date_Edit = ref("");
const Note_Edit = ref("");
const Level_Edit = ref("");
const Quantity_Edit = ref(1);

// Khởi tạo các biến ref cho quy trình tùy chỉnh trong dialog chỉnh sửa
const customProcessEdit = ref("");
const customProcessListEdit = ref([]);

// Khởi tạo các biến ref cho form thêm mới
// Khởi tạo các biến ref cho form thêm mới
const Name_Manufacture_Add = ref("");
const Name_Order_Manufacture = ref("");
const Date_Manufacture_Add = ref("");
const Note_Manufacture_Add = ref("");
const Total_Manufacture_Add = ref(0);
const Level_Manufacture_Add = ref(null);
const customProcess = ref("");
const customProcessList = ref([]);

// Khởi tạo các biến ref cho thông tin người dùng và tìm kiếm
const UserInfo = ref("");
const Date_Expired = ref("");
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);
const isRunning = localStorage.getItem("isRunning");

// Khởi tạo các biến ref cho thông báo
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// Định nghĩa cấu trúc bảng
const groupBy = [{ key: "Name" }];
const Headers = [
  { title: "Đơn hàng", key: "Name_Order" },
  { title: "Trạng thái", key: "Status_Output", width: "150px" },
  { title: "Tổng sản phẩm", key: "Total" },
  { title: "Tổng đầu ra", key: "Total_Output" },
  { title: "Tiến độ", key: "Progress" },
  { title: "Quy trình", key: "Level", width: "200px" },
  { title: "Ngày tạo", key: "Date" },
  { title: "Người tạo", key: "Creater" },
  { title: "Ghi chú", key: "Note" },
  { title: "Thao tác", key: "id", sortable: false },
];

const requiredRule = (value) => !!value || "Không được để trống";

const progressManufacture = computed(() => {
  return Number.parseFloat(
    manufacture.value.filter((item) => item.Status_Output === "Đang sản xuất").length / manufacture.value.length * 100
  ).toFixed(1);
});

const progressCompleted = computed(() => {
  return Number.parseFloat(
    manufacture.value.filter((item) => item.Status_Output === "Hoàn thành").length / manufacture.value.length * 100
  ).toFixed(1);
});

const totalUniquePO = computed(() => {
  if (!manufacture.value) return 0;
  const uniquePOIDs = new Set(manufacture.value.map((item) => item.Name));
  return uniquePOIDs.size;
});

// Hàm kiểm tra token và lấy thông tin người dùng khi component được mount
onMounted(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    UserInfo.value = decoded.Username;
    Date_Expired.value = new Date(decoded.exp * 1000);
  } else {
    console.log("Không tìm thấy token!");
    DialogFailed.value = true;
    router.push("/");
  }
});

const addCustomProcess = () => {
  if (customProcess.value && customProcess.value.trim()) {
    const processName = customProcess.value.trim();

    // Kiểm tra trùng lặp
    if (!customProcessList.value.includes(processName)) {
      customProcessList.value.push(processName);

      // Cập nhật Level_Manufacture_Add
      if (!Level_Manufacture_Add.value) {
        Level_Manufacture_Add.value = [];
      }
      if (!Level_Manufacture_Add.value.includes(processName)) {
        Level_Manufacture_Add.value.push(processName);
      }
    }

    // Reset input
    customProcess.value = "";
  }
};

// Thêm method để xóa quy trình tùy chỉnh
const removeCustomProcess = (index) => {
  if (index >= 0 && index < customProcessList.value.length) {
    const processName = customProcessList.value[index];

    // Xóa khỏi danh sách tùy chỉnh
    customProcessList.value.splice(index, 1);

    // Xóa khỏi Level_Manufacture_Add
    if (Level_Manufacture_Add.value) {
      const levelIndex = Level_Manufacture_Add.value.indexOf(processName);
      if (levelIndex > -1) {
        Level_Manufacture_Add.value.splice(levelIndex, 1);
      }
    }
  }
};

// Thêm method để thêm quy trình tùy chỉnh trong dialog chỉnh sửa
const addCustomProcessEdit = () => {
  if (customProcessEdit.value && customProcessEdit.value.trim()) {
    const processName = customProcessEdit.value.trim();

    // Kiểm tra trùng lặp
    if (!customProcessListEdit.value.includes(processName)) {
      customProcessListEdit.value.push(processName);

      // Không cần cập nhật Level_Edit vì Level_Edit chỉ chứa quy trình chuẩn
      // Quy trình tùy chỉnh được quản lý riêng trong customProcessListEdit
    }

    // Reset input
    customProcessEdit.value = "";
  }
};

// Thêm method để xóa quy trình tùy chỉnh trong dialog chỉnh sửa
const removeCustomProcessEdit = (index) => {
  if (index >= 0 && index < customProcessListEdit.value.length) {
    const processName = customProcessListEdit.value[index];

    // Xóa khỏi danh sách tùy chỉnh
    customProcessListEdit.value.splice(index, 1);

    // Không cần xóa khỏi Level_Edit vì Level_Edit chỉ chứa quy trình chuẩn
    // Quy trình tùy chỉnh được quản lý riêng trong customProcessListEdit
  }
};

// Reset khi đóng dialog
watch(DialogAdd, (newVal) => {
  if (!newVal) {
    customProcess.value = "";
    customProcessList.value = [];
  }
});

// Reset khi đóng dialog chỉnh sửa
watch(DialogEdit, (newVal) => {
  if (!newVal) {
    customProcessEdit.value = "";
    customProcessListEdit.value = [];
  }
});

// Hàm chuyển hướng đến trang chi tiết sản phẩm
function PushItem(value) {
  const found = manufacture.value.find((v) => v.id === value);
  router.push(`/San-xuat/Chi-tiet/${value}`);
  localStorage.setItem("ProductName", found.Name);
  localStorage.setItem("ProductID", value);
  localStorage.setItem("DelaySMT", found.DelaySMT);
  localStorage.setItem("QuantityBoard", found.Quantity);
}

// Hàm lấy thông tin item để chỉnh sửa
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = manufacture.value.find((v) => v.id === value);
  Name_Edit.value = found.Name;
  Name_Order_Edit.value = found.Name_Order;
  Total_Edit.value = found.Total;

  // Xử lý Level để tách quy trình chuẩn và quy trình tùy chỉnh
  const levelArray = found.Level.split("-");

  customProcessListEdit.value = levelArray;
  Date_Edit.value = found.Date_unixepoch;
  Note_Edit.value = found.Note;
  DelaySMT_Edit.value = found.DelaySMT;
  Quantity_Edit.value = found.Quantity;
}

// Hàm lưu thông tin chỉnh sửa
// Hàm lưu thông tin chỉnh sửa
const SaveEdit = async () => {
  DialogLoading.value = true;

  // Gom dữ liệu người dùng nhập
  const allProcesses = [
    ...(Array.isArray(Level_Edit.value) ? Level_Edit.value : []),
    ...(Array.isArray(customProcessListEdit.value)
      ? customProcessListEdit.value
      : []),
  ];

  // Xử lý sạch dữ liệu: trim + bỏ rỗng
  let cleaned = allProcesses.map(p => p.trim()).filter(p => p);

  // Loại duplicate theo thứ tự giữ nguyên
  let uniqueLevels = cleaned.filter((p, i) => cleaned.indexOf(p) === i);

  // ❗ Đảm bảo Thành phẩm cuối cùng
  uniqueLevels = uniqueLevels.filter(p => p !== "Thành phẩm"); // bỏ tạm

  // Nếu người dùng không chọn thì tự thêm
  uniqueLevels.push("Thành phẩm");

  const levelString = uniqueLevels.join("-");

  const formData = reactive({
    Name: Name_Edit.value,
    Name_Order: Name_Order_Edit.value,
    Timestamp: Date_Edit.value,
    Creater: UserInfo.value,
    Note: Note_Edit.value,
    Total: Total_Edit.value,
    DelaySMT: DelaySMT_Edit.value,
    Level: levelString, // giá trị đúng
    Quantity: Quantity_Edit.value,
  });

  try {
    const response = await axios.put(
      `${Url}/PlanManufacture/Edit/${GetID.value}`,
      formData
    );
    MessageDialog.value = response.data.message;
    Reset();
  } catch (error) {
    MessageErrorDialog.value =
      error.response?.data?.message || "Có lỗi xảy ra!";
    Error();
  } finally {
    DialogLoading.value = false;
  }
};


// Hàm lưu thông tin thêm mới
const SaveAdd = async () => {
  DialogLoading.value = true;

  // ✅ Quy tắc sắp xếp ưu tiên
  const processPriority = {
    SMT: 1,
    RW: 99,
    "Thành phẩm": 100,
  };

  // ✅ Gom các quy trình người dùng đã chọn
  const mergedLevels = [
    ...(Array.isArray(Level_Manufacture_Add.value)
      ? Level_Manufacture_Add.value
      : []),
    ...(Array.isArray(customProcessList.value) ? customProcessList.value : []),
  ];

  // ➕ Nếu chưa có "Thành phẩm" thì tự thêm
  if (!mergedLevels.includes("Thành phẩm")) {
    mergedLevels.push("Thành phẩm");
  }

  // ✅ Loại bỏ trùng lặp
  const uniqueLevels = [...new Set(mergedLevels)];

  // ✅ Sắp xếp theo ưu tiên
  const sortedLevels = uniqueLevels.sort((a, b) => {
    const pa = processPriority[a] ?? 50;
    const pb = processPriority[b] ?? 50;

    if (pa === pb) {
      return mergedLevels.indexOf(a) - mergedLevels.indexOf(b);
    }
    return pa - pb;
  });

  const formData = {
    Name: Name_Manufacture_Add.value,
    Name_Order: Name_Order_Manufacture.value,
    Timestamp: Date_Manufacture_Add.value,
    Total: Total_Manufacture_Add.value,
    Note: Note_Manufacture_Add.value,
    Creater: UserInfo.value,
    DelaySMT: 10000,
    Quantity: 1,
    Level: sortedLevels,
    ProjectID: 1,
  };

  try {
    const response = await axios.post(`${Url}/PlanManufacture/Add`, formData);
    MessageDialog.value = "Đã thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    Error();
  } finally {
    DialogLoading.value = false;
  }
};

// Hàm xóa item
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/PlanManufacture/Delete/${GetID.value}`
    );
    MessageDialog.value = response.data.message;
    Reset();
  } catch (error) {
    MessageErrorDialog.value = error.response.data.message;
    Error();
  }
};

// Hàm reset các dialog và form
function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  Dialog.value = false;
  DialogLoading.value = false;
  DialogFailed.value = false;
  Name_Manufacture_Add.value = "";
  Name_Order_Manufacture.value = "";
  Date_Manufacture_Add.value = "";
  Note_Manufacture_Add.value = "";
  Total_Manufacture_Add.value = 0;
  Level_Manufacture_Add.value = null;
}

// Hàm xử lý lỗi
function Error() {
  DialogFailed.value = true;
  DialogSuccess.value = false;
  DialogLoading.value = false;
  Name_Manufacture_Add.value = "";
  Name_Order_Manufacture.value = "";
  Date_Manufacture_Add.value = "";
  Note_Manufacture_Add.value = "";
  Total_Manufacture_Add.value = 0;
  Level_Manufacture_Add.value = null;
}
</script>

<!-- Đăng ký các components -->
<script>
export default {
  components: {
    InputSearch,
    InputFiles,
    InputField,
    ButtonImportFile,
    ButtonDownload,
    ButtonEye,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
  },
};
</script>
