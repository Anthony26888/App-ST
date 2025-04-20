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
      <v-btn color="primary" class="ms-2 text-caption" @click="Process()"
        >Xử lí</v-btn
      >
    </v-card-title>
    <v-card-text>
      <v-divider></v-divider>
      <v-empty-state
        v-if="checkBOM == ''"
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
            @click="SaveTable()"
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
          >
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(checkBOM.length / this.itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="Dialog" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
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
  <SnackbarSuccess v-model="DialogSuccess" />
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Cập nhật dữ liệu">
      <v-card-text>
        <InputField label="Dự toán hao phí" v-model="CostEstimate" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
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
import { ref, computed } from "vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import { useCheckBOM } from "@/composables/useCheckBom";
// const { checkBOM } = useCheckBOM(id);
const checkBOM = ref("");
const Url = import.meta.env.VITE_API_URL;
const Dialog = ref(false);
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const Headers = ref(null);
const File = ref(null);
const InputPO = ref("");
const InputBOM = ref("");
const InputQuantity = ref(1);
const UserInfo = ref("");
const NamePO = ref("");
const namePO = ref("");
onMounted(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    UserInfo.value = decoded.Username;
  } else {
    console.log("Không tìm thấy token!");
  }
});
function Process() {
  DialogLoading.value = true;
  if (NamePO.value) {
    axios
      .get(`${Url}/CheckBom/${this.NamePO}`)
      .then(function (response) {
        console.log(response);
        checkBOM.value = response.data;
        namePO.value = NamePO.value;
        generateHeaders();
        Reset();
      })
      .catch(function (error) {
        console.log(error);
        Error();
      });
  }
}
function generateHeaders() {
  if (checkBOM.length > 0) {
    Headers.value = Object.keys(checkBOM).map((key) => ({
      title: key.replace(/_/g, ""), // Format header text
      key: key,
      value: key,
    }));
  }
}
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
const SaveTable = async () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = String(now.getFullYear()).slice(-2);
  const DateNow = `${day}/${month}/${year}`;
  const TotalType = checkBOM.value.length;
  const TotalItems = checkBOM.value.reduce(
    (accumulator, currentItem) => {
      // Access 'SL_Tổng' from the current item object
      // Use Number() and || 0 to handle potential non-numeric values or missing properties gracefully
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
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
function Reset() {
  DialogSuccess.value = true;
  Dialog.value = false;
  DialogLoading.value = false;
}
function Error() {
  DialogFailed.value = true;
  Dialog.value = false;
  DialogLoading.value = false;
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
