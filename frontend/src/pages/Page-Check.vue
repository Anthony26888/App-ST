<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Kiểm tra số liệu linh kiện</v-card-title
    >
    <v-card-title class="d-flex">
      <ButtonImportFile @import-file="Dialog = true" />
      <v-btn
        prepend-icon="mdi mdi-pencil"
        variant="tonal"
        class="text-caption ms-2"
        color="primary"
        to="/Chinh-sua-so-lieu"
        >Chỉnh sửa</v-btn
      >
      <v-spacer></v-spacer>
      <InputSearch v-model="NamePO" />
      <v-btn color="primary" class="ms-2 text-caption" @click="Proccess()"
        >Xử lí</v-btn
      >
    </v-card-title>
    <v-card-text>
      <v-divider></v-divider>
      <v-empty-state
        v-if="checkBOM == '' || checkBOM == null"
        headline="OPPS !"
        title="Chưa có dữ liệu"
        text="Chon thêm file hoặc nhập tên PO"
        icon="mdi-folder-remove-outline"
      ></v-empty-state>
      <v-card variant="text" v-else>
        <v-card-title class="d-flex align-center pe-2">
          <p class="text-h6">{{ namePO }}</p>
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ checkBOM.length }} linh kiện)
          </p>
          <ButtonDownload @download-file="DownloadPO()" />
          <v-btn
            prepend-icon="mdi mdi-content-save-plus"
            color="blue-darken-4"
            class="ms-2 text-caption"
            variant="tonal"
            :disabled="OrderAvailable"
            @click="DialogAccept = true"
            >Lưu dữ liệu</v-btn
          >
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-card-text>
          <v-data-table
            :headers="Headers"
            :items="checkBOM"
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
                  :length="Math.ceil(checkBOM.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
            <template v-slot:item.Sửa="{ value }">
              <div>
                <ButtonEdit @edit="GetItem(value)" />
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="Dialog" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Tên dự án" v-model="InputPO" :rules="[required]" />
        <InputField label="Tên Bom" v-model="InputBOM" :rules="[required]" />
        <InputField
          label="Số lượng Board"
          v-model="InputQuantity"
          :rules="[required]"
        />
        <InputFiles v-model="File" :rules="[required]" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="Dialog = false" />
        <ButtonSave @save="ImportFile()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogEdit" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Dự toán hao phí" v-model="CostEstimate" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogAccept" width="400">
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-check" color="success" class="me-2"></v-icon>
        Xác nhận đơn hàng
      </v-card-title>
      <v-card-text>
        <InputSelect
          label="Chọn người nhận"
          v-model="Accept"
          :items="users"
          item-title="FullName"
          item-value="Username"
        />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAccept = false" />
        <ButtonAgree @agree="SaveTable()" />
        
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
        Xoá dữ liệu
      </v-card-title>
      <v-card-text> Bạn có chắc chắn muốn xoá dự án này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRoute, useRouter } from "vue-router";
import { onMounted, ref, computed, watch } from "vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import emailjs from "@emailjs/browser";
import { useCheckBOM } from "@/composables/useCheckBom";
import { useUsers } from "@/composables/useUsers";

const { checkBOM, fetchData } = useCheckBOM();
const { users } = useUsers();
const Url = import.meta.env.VITE_API_URL;
const Dialog = ref(false);
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const DialogAccept = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const Headers = ref(null);
const File = ref(null);
const InputPO = ref("");
const InputBOM = ref("");
const InputQuantity = ref(1);
const CostEstimate = ref(0);
const UserInfo = ref("");
const NamePO = ref("");
const namePO = ref("");
const GetID = ref("");
const Accept = ref(""); 
const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const toName = ref("Huỳnh Ngọc");

const email = ref("haidang34821@gmail.com");
onMounted(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    UserInfo.value = decoded.Username;
  } else {
    console.log("Không tìm thấy token!");
  }
});
function GetItem(value) {
  DialogEdit.value = true;
  const found = checkBOM.value.find((v) => v.Sửa === value);
  CostEstimate.value = found.Dự_Toán_Hao_Phí;
  GetID.value = found.PartNumber_1;
}
const Proccess = () => {
  const id = NamePO.value;
  if (!id) {
    Error("Vui lòng nhập tên PO."); // Thông báo nếu chưa nhập PO
    return;
  }
  namePO.value = NamePO.value;
  fetchData(id);
};
watch(
  checkBOM,
  (newBomData) => {
    console.log("checkBOM changed, generating headers with:", newBomData); // Log để kiểm tra
    generateHeaders(newBomData); // Gọi hàm generateHeaders với dữ liệu mới
  },
  { deep: true }
); // deep: true
function generateHeaders(bomData) {
  if (bomData && bomData.length > 0) {
    // Lấy keys từ object ĐẦU TIÊN trong mảng
    const firstItemKeys = Object.keys(bomData[0]);
    console.log("Generating headers from keys:", firstItemKeys); // Log để kiểm tra keys
    Headers.value = firstItemKeys.map((key) => ({
      title: key.replace(/_/g, " "), // Thay thế gạch dưới bằng khoảng trắng
      key: key, // key để v-data-table lấy dữ liệu
      sortable: true, // Có thể thêm sortable
    }));
  } else {
    console.log("No data to generate headers, clearing headers."); // Log khi không có dữ liệu
    Headers.value = []; // Reset headers nếu không có dữ liệu
  }
}
// Import File
const ImportFile = async () => {
  DialogLoading.value = true;
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = String(now.getFullYear()).slice(-2);
  const DateNow = `${day}/${month}/${year}`;
  const formData = new FormData();
  formData.append("file", File.value);
  formData.append("PO", InputPO.value);
  formData.append("BOM", InputBOM.value);
  formData.append("SL_Board", InputQuantity.value);
  formData.append("TimeStamp", DateNow);
  formData.append("Creater", UserInfo.value);
  axios
    .post(`${Url}/upload`, formData)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const DownloadPO = async () => {
  try {
    const response = await fetch(`${Url}/Download-PO/${namePO.value}`);
    if (!response.ok) throw new Error("Download failed");

    // Convert response to blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create a link to download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${namePO.value}.xlsx`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};
// Save Table
const SaveTable = async () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = String(now.getFullYear()).slice(-2);
  const DateNow = `${day}/${month}/${year}`;
  const TotalType = checkBOM.value.length;
  const TotalItems = checkBOM.value.reduce(
    (accumulator, currentItem) => {
      const quantity = Number(currentItem.SL_Tổng) || 0;
      return accumulator + quantity;
    },
    0 // Initial value for the sum remains 0
  );
  DialogLoading.value = true;
  const formData = {
    Name_PO: NamePO.value,
    Quantity_Type: TotalType,
    Quantity_Items: TotalItems,
    Status: 0,
    Date: DateNow,
    Creater: UserInfo.value,
  };
  axios
    .post(`${Url}/ListPO/upload-new-PO`, formData)
    .then(function (response) {
      console.log(response);
      sendEmail();
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const SaveEdit = () => {
  DialogLoading.value = true;
  const formData = {
    Input_Hao_Phi: CostEstimate.value,
    Name_Item: GetID.value,
  };
  console.log(formData);
  axios
    .put(`${Url}/CheckBom/Update-Hao-Phi`, formData)
    .then(function (response) {
      console.log(response);
      const id = NamePO.value;
      fetchData(id);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
// Send Email
const sendEmail = async () => {
  DialogLoading.value = true;
  const found = users.value.find((v) => v.Username === UserInfo.value);
  const foundAccept = users.value.find((v) => v.Username === Accept.value);
  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        toName: foundAccept.FullName,
        fromName: found.FullName,
        message: `Đơn hàng ${namePO.value} đã được tạo thành công. Bộ phận Kho kiểm tra và xác nhận thông tin đơn hàng để tiến hành xuất hàng.`,
        email: foundAccept.Email,
        level: found.Level,
      },
      publicKey
    );
    console.log("SUCCESS!", response.status, response.text);
    DialogSuccess.value = true;
    DialogLoading.value = false;
    // Reset form sau khi gửi thành công (tùy chọn)
    toName.value = "";
    email.value = "";
  } catch (error) {
    console.error("FAILED...", error);
    DialogFailed.value = true;
    DialogLoading.value = false;
  }
};

function Reset() {
  DialogSuccess.value = true;
  Dialog.value = false;
  DialogLoading.value = false;
  DialogEdit.value = false;
  DialogAccept.value = false;
  DialogRemove.value = false;
}
function Error() {
  DialogFailed.value = true;
  Dialog.value = false;
  DialogLoading.value = false;
  DialogEdit.value = false;
}
</script>
<script>
export default {
  components: {
    ButtonImportFile,
    ButtonDownload,
    ButtonSave,
    ButtonCancel,
    InputSearch,
    InputField,
    InputFiles,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    ButtonAgree,
  },
  data() {
    return {
      search: "",
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {},
};
</script>
<style lang=""></style>
