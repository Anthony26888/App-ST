<!-- Template chính chứa giao diện người dùng -->
<template>
  <div>
    <!-- Card chính chứa toàn bộ nội dung -->
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <!-- Tiêu đề trang -->
      <v-card-title class="text-h4 font-weight-light">
        Danh sách sản xuất
      </v-card-title>

      <v-card-text>
        <!-- Card chứa bảng dữ liệu -->
        <v-card variant="text">
          <!-- Header của bảng với các nút chức năng -->
          <v-card-title class="d-flex align-center pe-2">
            <!-- Nút thêm mới -->
            <v-btn
              prepend-icon="mdi mdi-plus"
              variant="tonal"
              color="primary"
              class="text-caption ms-2"
              @click="DialogAdd = true"
            >
              Thêm
            </v-btn>
            <!-- Hiển thị tổng số kế hoạch -->
            <p class="ms-2 font-weight-thin text-subtitle-1">
              ( {{ sortedManufacture.length }} kế hoạch)
            </p>
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
            <v-data-table
              :headers="Headers"
              :items="sortedManufacture"
              :search="search"
              :items-per-page="itemsPerPage"
              :page="page"
              @update:page="page = $event"
              class="elevation-1"
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
              <!-- Phân trang -->
              <template #bottom>
                <div class="text-center pt-2">
                  <v-pagination
                    :model-value="page"
                    @update:model-value="page = $event"
                    :length="Math.ceil(sortedManufacture.length / itemsPerPage)"
                  ></v-pagination>
                </div>
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
                >
                  {{ item.Status_Output }}
                </v-chip>
                <v-chip v-else color="warning" variant="tonal">
                  {{ item.Status_Output }}
                </v-chip>
              </template>
              <template #[`item.Total`]="{ item }">
                <v-chip color="primary" variant="tonal">{{
                  item.Total
                }}</v-chip>
              </template>
              <template #[`item.Total_Output`]="{ item }">
                <v-chip color="success" variant="tonal">{{
                  item.Total_Output
                }}</v-chip>
              </template>
              <!-- Cột độ trễ SMT -->
              <template #[`item.DelaySMT`]="{ item }">
                <p>{{ item.DelaySMT }} ms</p>
              </template>
            </v-data-table>
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
      <v-card max-width="500" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
          Cập nhật dữ liệu
        </v-card-title>
        <v-card-text>
          <InputField
            :disabled="true"
            label="Tên dự án"
            :model-value="Name_Edit"
            @update:model-value="Name_Edit = $event"
          />
          <InputField
            label="Tổng sản phẩm"
            type="number"
            :model-value="Total_Edit"
            @update:model-value="Total_Edit = $event"
          />
          <InputSelect
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
              'Nhập kho',
            ]"
            multiple
            chips
            hint="Lựa chọn quy trình phù hợp"
            v-model="Level_Edit"
            @update:model-value="(val) => (Level_Edit = val)"
          />

          <!-- Thêm input cho quy trình khác trong dialog chỉnh sửa -->
          <div class="mt-3">
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

            <!-- Hiển thị danh sách quy trình tùy chỉnh đã thêm -->
            <div v-if="customProcessListEdit.length > 0" class="mt-2">
              <div class="text-caption text-grey mb-1">Quy trình đã thêm:</div>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="(process, index) in customProcessListEdit"
                  :key="index"
                  closable
                  color="secondary"
                  size="small"
                  @click:close="removeCustomProcessEdit(index)"
                >
                  {{ process }}
                </v-chip>
              </div>
            </div>
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
      <v-card max-width="500" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
          Thêm dữ liệu sản xuất
        </v-card-title>
        <v-card-text>
          <InputField label="Tên dự án" v-model="Name_Manufacture_Add" />
          <InputField
            label="Tên đơn hàng"
            v-model="Name_Order_Manufacture"
            @update:model-value="Name_Order_Manufacture = $event"
          />
          <InputField
            label="Tổng sản phẩm"
            type="number"
            :model-value="Total_Manufacture_Add"
            @update:model-value="Total_Manufacture_Add = $event"
          />
          <InputSelect
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
              'Nhập kho',
            ]"
            multiple
            chips
            hint="Lựa chọn quy trình phù hợp"
            v-model="Level_Manufacture_Add"
            @update:model-value="(val) => (Level_Manufacture_Add = val)"
          />

          <!-- Thêm input cho quy trình khác -->
          <div class="mt-3">
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

            <!-- Hiển thị danh sách quy trình tùy chỉnh đã thêm -->
            <div v-if="customProcessList.length > 0" class="mt-2">
              <div class="text-caption text-grey mb-1">Quy trình đã thêm:</div>
              <div class="d-flex flex-wrap ga-2">
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
          </div>

          <InputField
            class="mt-3"
            label="Ngày tạo"
            type="date"
            v-model="Date_Manufacture_Add"
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
          <ButtonSave @save="SaveAdd()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog xác nhận xóa -->
    <v-dialog
      :model-value="DialogRemove"
      @update:model-value="DialogRemove = $event"
      width="500"
    >
      <v-card max-width="500" prepend-icon="mdi-delete" title="Xoá dữ liệu">
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
      <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
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
import { useManufacture } from "@/composables/Manufacture/useManufacture";

// Khởi tạo các composables và biến môi trường
const { manufacture, manufactureError } = useManufacture();

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
const Total_Edit = ref(0);
const DelaySMT_Edit = ref(0);
const Date_Edit = ref("");
const Note_Edit = ref("");
const Level_Edit = ref("");
const Quantity_Edit = ref(1);
const Quantity_IPQCSMT_Edit = ref(1);
const Quantity_IPQC_Edit = ref(1);
const Quantity_AOI_Edit = ref(1);
const Quantity_Assembly_Edit = ref(1);
const Quantity_BoxBuild_Edit = ref(1);
const Quantity_Test1_Edit = ref(1);
const Quantity_Test2_Edit = ref(1);
const Quantity_ConformalCoating_Edit = ref(1);
const Quantity_OQC_Edit = ref(1);

// Khởi tạo các biến ref cho quy trình tùy chỉnh trong dialog chỉnh sửa
const customProcessEdit = ref('');
const customProcessListEdit = ref([]);

// Khởi tạo các biến ref cho form thêm mới
// Khởi tạo các biến ref cho form thêm mới
const Name_Manufacture_Add = ref("");
const Name_Order_Manufacture = ref("");
const Date_Manufacture_Add = ref("");
const Note_Manufacture_Add = ref("");
const Total_Manufacture_Add = ref(0);
const Level_Manufacture_Add = ref(null);
const customProcess = ref('')
const customProcessList = ref([])

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
const Headers = [
  { title: "Số PO", key: "Name" },
  { title: "Đơn hàng", key: "Name_Order" },
  { title: "Trạng thái", key: "Status_Output", width: "150px" },
  { title: "Tổng sản phẩm", key: "Total" },
  { title: "Tổng đầu ra", key: "Total_Output" },
  { title: "Quy trình", key: "Level", width: "200px" },
  { title: "Ngày tạo", key: "Date" },
  { title: "Người tạo", key: "Creater" },
  { title: "Ghi chú", key: "Note" },
  { title: "Thao tác", key: "id", sortable: false },
];


// 🔸 Hàm chuyển unixepoch → yyyy-mm-dd
const formatDateForInput = (timestamp) => {
  if (!timestamp) return ''
  const d = new Date((timestamp + 12 * 60 * 60) * 1000)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Hàm chuyển yyyy-mm-dd → unixepoch
const dateStringToUnix = (value) => {
  if (!value) return null
  return Math.floor(new Date(value).getTime() / 1000)
}

// Computed property để sắp xếp dữ liệu theo ngày tạo (mới nhất ở cuối)
const sortedManufacture = computed(() => {
  if (!manufacture.value || !Array.isArray(manufacture.value)) {
    return [];
  }
  
  return [...manufacture.value].sort((a, b) => {
    // Sắp xếp theo ngày tạo, mới nhất ở cuối
    const dateA = new Date(a.Date || a.created_at || 0);
    const dateB = new Date(b.Date || b.created_at || 0);
    
    // Nếu cùng ngày, sắp xếp theo ID để đảm bảo thứ tự nhất quán
    if (dateA.getTime() === dateB.getTime()) {
      return (a.id || 0) - (b.id || 0);
    }
    
    return dateA.getTime() - dateB.getTime();
  });
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
    const processName = customProcess.value.trim()
    
    // Kiểm tra trùng lặp
    if (!customProcessList.value.includes(processName)) {
      customProcessList.value.push(processName)
      
      // Cập nhật Level_Manufacture_Add
      if (!Level_Manufacture_Add.value) {
        Level_Manufacture_Add.value = []
      }
      if (!Level_Manufacture_Add.value.includes(processName)) {
        Level_Manufacture_Add.value.push(processName)
      }
    }
    
    // Reset input
    customProcess.value = ''
  }
}

// Thêm method để xóa quy trình tùy chỉnh
const removeCustomProcess = (index) => {
  if (index >= 0 && index < customProcessList.value.length) {
    const processName = customProcessList.value[index]
    
    // Xóa khỏi danh sách tùy chỉnh
    customProcessList.value.splice(index, 1)
    
    // Xóa khỏi Level_Manufacture_Add
    if (Level_Manufacture_Add.value) {
      const levelIndex = Level_Manufacture_Add.value.indexOf(processName)
      if (levelIndex > -1) {
        Level_Manufacture_Add.value.splice(levelIndex, 1)
      }
    }
  }
}

// Thêm method để thêm quy trình tùy chỉnh trong dialog chỉnh sửa
const addCustomProcessEdit = () => {
  if (customProcessEdit.value && customProcessEdit.value.trim()) {
    const processName = customProcessEdit.value.trim()
    
    // Kiểm tra trùng lặp
    if (!customProcessListEdit.value.includes(processName)) {
      customProcessListEdit.value.push(processName)
      
      // Không cần cập nhật Level_Edit vì Level_Edit chỉ chứa quy trình chuẩn
      // Quy trình tùy chỉnh được quản lý riêng trong customProcessListEdit
    }
    
    // Reset input
    customProcessEdit.value = ''
  }
}

// Thêm method để xóa quy trình tùy chỉnh trong dialog chỉnh sửa
const removeCustomProcessEdit = (index) => {
  if (index >= 0 && index < customProcessListEdit.value.length) {
    const processName = customProcessListEdit.value[index]
    
    // Xóa khỏi danh sách tùy chỉnh
    customProcessListEdit.value.splice(index, 1)
    
    // Không cần xóa khỏi Level_Edit vì Level_Edit chỉ chứa quy trình chuẩn
    // Quy trình tùy chỉnh được quản lý riêng trong customProcessListEdit
  }
}

// Reset khi đóng dialog
watch(DialogAdd, (newVal) => {
  if (!newVal) {
    customProcess.value = ''
    customProcessList.value = []
  }
})

// Reset khi đóng dialog chỉnh sửa
watch(DialogEdit, (newVal) => {
  if (!newVal) {
    customProcessEdit.value = ''
    customProcessListEdit.value = []
  }
})

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
  Total_Edit.value = found.Total;
  
  // Xử lý Level để tách quy trình chuẩn và quy trình tùy chỉnh
  const levelArray = found.Level.split("-");
  const standardProcesses = [
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
    'Nhập kho',
  ];
  
  const customProcesses = levelArray.filter(process => !standardProcesses.includes(process));
  const standardSelected = levelArray.filter(process => standardProcesses.includes(process));
  
  Level_Edit.value = standardSelected;
  customProcessListEdit.value = customProcesses;
  Date_Edit.value = found.Date;
  Note_Edit.value = found.Note;
  DelaySMT_Edit.value = found.DelaySMT;
  Quantity_Edit.value = found.Quantity;
  Quantity_IPQCSMT_Edit.value = found.Quantity_IPQCSMT;
  Quantity_IPQC_Edit.value = found.Quantity_IPQC;
  Quantity_AOI_Edit.value = found.Quantity_AOI;
  Quantity_Assembly_Edit.value = found.Quantity_Assembly;
  Quantity_BoxBuild_Edit.value = found.Quantity_BoxBuild;
  Quantity_Test1_Edit.value = found.Quantity_Test1;
  Quantity_Test2_Edit.value = found.Quantity_Test2;
  Quantity_ConformalCoating_Edit.value = found.Quantity_ConformalCoating;
  Quantity_OQC_Edit.value = found.Quantity_OQC;
}

// Hàm lưu thông tin chỉnh sửa
const SaveEdit = async () => {
  DialogLoading.value = true;
  
  // Kết hợp quy trình chuẩn và quy trình tùy chỉnh
  const allProcesses = [...(Level_Edit.value || []), ...customProcessListEdit.value];
  const levelString = allProcesses.join("-");
  const formData = reactive({
    Name: Name_Edit.value,
    Date: dateStringToUnix(Date_Edit.value),
    Creater: UserInfo.value,
    Note: Note_Edit.value,
    Total: Total_Edit.value,
    DelaySMT: DelaySMT_Edit.value,
    Level: levelString,
    Quantity: Quantity_Edit.value
  });
  try {
    const response = await axios.put(
      `${Url}/PlanManufacture/Edit/${GetID.value}`,
      formData
    );
    MessageDialog.value = response.data.message;
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = error.response.data.message;
    Error();
  }
};

// Hàm lưu thông tin thêm mới
const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Name: Name_Manufacture_Add.value,
    Name_Order: Name_Order_Manufacture.value,
    Date: Date_Manufacture_Add,
    Total: Total_Manufacture_Add.value,
    Note: Note_Manufacture_Add.value,
    Creater: UserInfo.value,
    DelaySMT: 5000,
    Quantity: 1,
    Level: Level_Manufacture_Add.value,
    ProjectID: 1,
  });
  try {
    const response = await axios.post(`${Url}/PlanManufacture/Add`, formData);
    console.log(response.data);
    MessageDialog.value = "Đã thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    Error();
  }
};

// Hàm xóa item
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/PlanManufacture/Delete/${GetID.value}`
    );
    console.log(response.data.message);
    MessageDialog.value = response.data.message;
    Reset();
  } catch (error) {
    console.log(error);
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
