<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách sản xuất</v-card-title
    >
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <v-btn
            prepend-icon="mdi mdi-plus"
            variant="tonal"
            color="primary"
            class="text-caption ms-2"
            @click="DialogAdd = true"
            >Thêm</v-btn
          >
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ manufacture.length }} kế hoạch)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>
        <v-card-text class="overflow-auto">
          <v-data-table
            :headers="Headers"
            :items="manufacture"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
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
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(manufacture.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>

            <template v-slot:item.id="{ value }">
              <div class="d-flex">
                <ButtonEye @detail="PushItem(value)" />
                <ButtonEdit @edit="GetItem(value)" />
              </div>
            </template>
            <template v-slot:item.Status="{ value }">
              <v-chip v-if="value == isRunning" color="success" variant="tonal">
                Đang chạy
              </v-chip>
              <v-chip v-else color="error" variant="tonal"> Đã dừng </v-chip>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Tên dự án" v-model="Name_Edit" />
        <InputField label="Tổng sản phẩm" type="number" v-model="Total_Edit" />
        <InputField label="Ngày tạo" type="date" v-model="Date_Edit" />
        <InputTextarea label="Ghi chú" v-model="Note_Edit" />
      </v-card-text>
      <v-card-actions>
        <ButtonDelete @delete="DialogRemove = true" />
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="DialogAdd" width="400">
    <v-card max-width="400">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Tên dự án" v-model="Name_Add" />
        <InputField label="Tổng sản phẩm" type="number" v-model="Total_Add" />
        <InputField label="Ngày tạo" type="date" v-model="Date_Add" />
        <InputTextarea label="Ghi chú" v-model="Note_Add" />
      </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá kế hoạch sản phẩm này ?
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="Dialog" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
      <v-card-text>
        <InputFiles label="Thêm File Excel" v-model="File" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="Dialog = false" />
        <ButtonSave @save="ImportFile()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>

<script setup>
import axios from "axios";
import { useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";
import { ref, onMounted, computed } from "vue";
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

const { manufacture, manufactureError } = useManufacture();
const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const GetID = ref("");
const Dialog = ref(false);
const DialogEdit = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogRemove = ref(false);
const DialogAdd = ref(false);
const DialogLoading = ref(false);
const File = ref(null);
const Name_Edit = ref("");
const Total_Edit = ref(0);
const Date_Edit = ref("");
const Note_Edit = ref("");
const Name_Add = ref("");
const Date_Add = ref("");
const Note_Add = ref("");
const Total_Add = ref(0);
const UserInfo = ref("");
const Date_Expired = ref("");
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);
const isRunning = localStorage.getItem("isRunning");
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

const Headers = [
  { title: "Tên dự án", key: "Name" },
  { title: "Trạng thái", key: "Status" },
  { title: "Tổng sản phẩm", key: "Total" },
  { title: "Ngày tạo", key: "Date" },
  { title: "Người tạo", key: "Creater" },
  { title: "Ghi chú", key: "Note" },
  { title: "Thao tác", key: "id", sortable: false },
];

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

function PushItem(value) {
  const found = manufacture.value.find((v) => v.id === value);
  router.push(`/San-xuat/Chi-tiet/${value}`);
  localStorage.setItem("ProductName", found.Name);
  localStorage.setItem("ProductID", value);
}

function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = manufacture.value.find((v) => v.id === value);
  Name_Edit.value = found.Name;
  Total_Edit.value = found.Total;
  Date_Edit.value = found.Date;
  Note_Edit.value = found.Note;
}

const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Name: Name_Edit.value,
    Date: Date_Edit.value,
    Creater: UserInfo.value,
    Note: Note_Edit.value,
    Total: Total_Edit.value,
  });
  axios
    .put(`${Url}/PlanManufacture/Edit/${GetID.value}`, formData)
    .then(function (response) {
      console.log(response.data.message);
      MessageDialog.value = response.data.message;
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      MessageErrorDialog.value = error.response.data.message;
      Error();
    });
};

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
  axios
    .post(`${Url}/PlanManufacture/Add`, formData)
    .then(function (response) {
      console.log(response.data);
      MessageDialog.value = response.data.message;
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      MessageErrorDialog.value = error.response.data.message;
      Error();
    });
};

const RemoveItem = async () => {
  DialogLoading.value = true;
  axios
    .delete(`${Url}/PlanManufacture/Delete/${GetID.value}`)
    .then(function (response) {
      console.log(response.data.message);
      MessageDialog.value = response.data.message;
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      MessageErrorDialog.value = error.response.data.message;
      Error();
    });
};

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

function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}
</script>

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
