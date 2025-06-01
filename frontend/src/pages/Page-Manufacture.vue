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
              ( {{ manufacture.length }} kế hoạch)
            </p>
            <v-spacer></v-spacer>
            <!-- Component tìm kiếm -->
            <InputSearch :modelValue="search" @update:modelValue="search = $event" />
          </v-card-title>

          <!-- Nội dung bảng dữ liệu -->
          <v-card-text class="overflow-auto">
            <!-- Bảng dữ liệu chính -->
            <v-data-table
              :headers="Headers"
              :items="manufacture"
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
                    :length="Math.ceil(manufacture.length / itemsPerPage)"
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
              <template #[`item.Status`]="{ item }">
                <v-chip v-if="item.Status == isRunning" color="success" variant="tonal">
                  Đang chạy
                </v-chip>
                <v-chip v-else color="error" variant="tonal"> Đã dừng </v-chip>
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
    <v-dialog :model-value="DialogEdit" @update:model-value="DialogEdit = $event" width="400">
      <v-card max-width="400">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
          Cập nhật dữ liệu
        </v-card-title>
        <v-card-text>
          <InputField label="Tên dự án" :model-value="Name_Edit" @update:model-value="Name_Edit = $event" />
          <InputField label="Tổng sản phẩm" type="number" :model-value="Total_Edit" @update:model-value="Total_Edit = $event" />
          <InputField label="Độ trể SMT" type="number" :model-value="DelaySMT_Edit" @update:model-value="DelaySMT_Edit = $event" />
          <InputField label="Ngày tạo" type="date" :model-value="Date_Edit" @update:model-value="Date_Edit = $event" />
          <InputTextarea label="Ghi chú" :model-value="Note_Edit" @update:model-value="Note_Edit = $event" />
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
    <v-dialog :model-value="DialogAdd" @update:model-value="DialogAdd = $event" width="400">
      <v-card max-width="400">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
          Thêm dữ liệu
        </v-card-title>
        <v-card-text>
          <InputField label="Tên dự án" :model-value="Name_Add" @update:model-value="Name_Add = $event" />
          <InputField label="Tổng sản phẩm" type="number" :model-value="Total_Add" @update:model-value="Total_Add = $event" />
          <InputField label="Độ trể SMT" type="number" :model-value="DelaySMT_Add" @update:model-value="DelaySMT_Add = $event" />
          <InputField label="Ngày tạo" type="date" :model-value="Date_Add" @update:model-value="Date_Add = $event" />
          <InputTextarea label="Ghi chú" :model-value="Note_Add" @update:model-value="Note_Add = $event" />
        </v-card-text>
        <v-card-actions>
          <ButtonCancel @cancel="DialogAdd = false" />
          <ButtonSave @save="SaveAdd()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog xác nhận xóa -->
    <v-dialog :model-value="DialogRemove" @update:model-value="DialogRemove = $event" width="400">
      <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
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
    <v-dialog :model-value="Dialog" @update:model-value="Dialog = $event" width="400">
      <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
        <v-card-text>
          <InputFiles label="Thêm File Excel" :model-value="File" @update:model-value="File = $event" />
        </v-card-text>
        <template #actions>
          <ButtonCancel @cancel="Dialog = false" />
          <ButtonSave @save="ImportFile()" />
        </template>
      </v-card>
    </v-dialog>

    <!-- Các component thông báo và loading -->
    <SnackbarSuccess :model-value="DialogSuccess" @update:model-value="DialogSuccess = $event" :message="MessageDialog" />
    <SnackbarFailed :model-value="DialogFailed" @update:model-value="DialogFailed = $event" :message="MessageErrorDialog" />
    <Loading :model-value="DialogLoading" @update:model-value="DialogLoading = $event" />
  </div>
</template>

<script setup>
// Import các thư viện cần thiết
import axios from "axios";
import { useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";
import { ref, onMounted, computed, reactive } from "vue";

// Import các components
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import { useManufacture } from "@/composables/useManufacture";

// Khởi tạo các composables và biến môi trường
const { manufacture, manufactureError } = useManufacture();
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

// Khởi tạo các biến ref cho form thêm mới
const Name_Add = ref("");
const Date_Add = ref("");
const Note_Add = ref("");
const Total_Add = ref(0);
const DelaySMT_Add = ref(50);


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
  { title: "Tên dự án", key: "Name" },
  { title: "Trạng thái", key: "Status" },
  { title: "Tổng sản phẩm", key: "Total" },
  { title: "Độ trể SMT", key: "DelaySMT" },
  { title: "Ngày tạo", key: "Date" },
  { title: "Người tạo", key: "Creater" },
  { title: "Ghi chú", key: "Note" },
  { title: "Thao tác", key: "id", sortable: false },
];

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

// Hàm chuyển hướng đến trang chi tiết sản phẩm
function PushItem(value) {
  const found = manufacture.value.find((v) => v.id === value);
  router.push(`/San-xuat/Chi-tiet/${value}`);
  localStorage.setItem("ProductName", found.Name);
  localStorage.setItem("ProductID", value);
}

// Hàm lấy thông tin item để chỉnh sửa
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = manufacture.value.find((v) => v.id === value);
  Name_Edit.value = found.Name;
  Total_Edit.value = found.Total;
  DelaySMT_Edit.value = found.DelaySMT;
  Date_Edit.value = found.Date;
  Note_Edit.value = found.Note;
}

// Hàm lưu thông tin chỉnh sửa
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Name: Name_Edit.value,
    Date: Date_Edit.value,
    Creater: UserInfo.value,
    Note: Note_Edit.value,
    Total: Total_Edit.value,
    DelaySMT: DelaySMT_Edit.value,
  });
  try {
    const response = await axios.put(`${Url}/PlanManufacture/Edit/${GetID.value}`, formData);
    console.log(response.data.message);
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
    Name: Name_Add.value,
    Status: false,
    Date: Date_Add.value,
    Total: Total_Add.value,
    Note: Note_Add.value,
    Creater: UserInfo.value,
  });
  try {
    const response = await axios.post(`${Url}/PlanManufacture/Add`, formData);
    console.log(response.data);
    MessageDialog.value = response.data.message;
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = error.response.data.message;
    Error();
  }
};

// Hàm xóa item
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(`${Url}/PlanManufacture/Delete/${GetID.value}`);
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
  Name_Add.value = "";
  Date_Add.value = "";
}

// Hàm xử lý lỗi
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
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
