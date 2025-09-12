<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <p class="text-h4 font-weight-light ms-3">Chỉnh sửa số liệu</p>
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <ButtonAdd @add="DialogAdd = true" />
      <p class="text-subtitle-1 font-weight-thin text-subtitle-1 ms-2">
        {{ filterBom.length }} dự án
      </p>
      <v-spacer></v-spacer>
      <InputSearch v-model="search" />
    </v-card-title>
    <v-card-text>
      <v-data-table
        :headers="Headers"
        :items="filterBom"
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
              :length="Math.ceil(filterBom.length / itemsPerPage)"
            ></v-pagination>
          </div>
        </template>
        <template v-slot:item.id="{ value }">
          <div class="d-flex">
            <ButtonEye @detail="PushItem(value)" />
            <ButtonEdit @edit="GetItem(value)" />
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogAdd" width="500" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm tên dự án
      </v-card-title>
      <v-card-text>
        <InputField label="Nhập tên dự án" v-model="FileName" />
        <InputField label="Thời gian tạo" type="date" v-model="Created_at" />
        <InputTextarea label="Ghi chú" v-model="Note" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogEdit" width="500" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Chỉnh sửa dự án
      </v-card-title>
      <v-card-text>
        <InputField label="Tên dự án" v-model="FileName_Edit" />
        <InputField label="Thời gian tạo" type="date" v-model="Created_at_Edit" />
        <InputTextarea label="Ghi chú" v-model="Note_Edit" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonDelete @delete="DialogRemove = true" />
        <v-spacer></v-spacer>
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
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

import { useFilterBom } from "@/composables/CheckBOM/useFilterBom.js";
import ButtonBack from "@/components/Button-Back.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonRemove from "@/components/Button-Remove.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import Loading from "@/components/Loading.vue";


// Data from Composables

const { filterBom, filterBomError } = useFilterBom();
const Url = import.meta.env.VITE_API_URL;
const GetID = ref("");

// Router
const router = useRouter();

// Dialog status
const DialogAdd = ref(false);
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const DialogSuccess = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");


// Data 
const FileName = ref("");
const Created_at = ref("");
const Note = ref("");

const FileName_Edit = ref("");
const Created_at_Edit = ref("");
const Note_Edit = ref("");

// Table status
const Headers = [
  { key: "project_name", title: "Tên dự án" },
  { key: "created_at", title: "Ngày tạo" },
  { key: "note", title: "Ghi chú" },
  { key: "id", title: "Thao tác" },
];
const search = ref("");
const itemsPerPage = ref(15);
const page =  ref(1);

// Function
function PushItem(value) {
  router.push(`/Kiem-tra-so-lieu-pnp/${value}`);
  const found = filterBom.value.find((v) => v.id === value);
  localStorage.setItem("BomName", found.project_name)
}

const GetItem = (value) => {
  DialogEdit.value = true
  GetID.value = value
  const found = filterBom.value.find((v) => v.id === value);
  FileName_Edit.value = found.project_name;
  Created_at_Edit.value = found.created_at;
  Note_Edit.value = found.note;
}

const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    project_name: FileName.value,
    created_at: Created_at.value,
    note: Note.value
  });
  try {
    const response = await axios.post(`${Url}/FilterBom/Add-item`, formData);
    console.log(response.data);
    Reset();
    MessageDialog.value = "Thêm dữ liệu dự án thành công"
  } catch (error) {
    console.error("Error adding maintenance record:", error);
    MessageErrorDialog.value = "Lỗi thêm dữ liệu dự án"
    Error();
  } finally {
    DialogLoading.value = false;
  }
};

const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    project_name: FileName_Edit.value,
    created_at: Created_at_Edit.value,
    note: Note_Edit.value
  });
  try {
    const response = await axios.put(`${Url}/FilterBom/Edit-item/${GetID.value}`, formData);
    console.log(response.data);
    Reset();
    MessageDialog.value = "Thêm dữ liệu dự án thành công"
  } catch (error) {
    console.error("Error adding maintenance record:", error);
    MessageErrorDialog.value = "Lỗi thêm dữ liệu dự án"
    Error();
  } finally {
    DialogLoading.value = false;
  }
};

const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(`${Url}/FilterBom/Delete-item/${GetID.value}`);
    console.log(response.data.message);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

function Reset() {
  DialogAdd.value = false;
  DialogSuccess.value = true;
  DialogRemove.value = false;
  DialogLoading.value = false;
  DialogRemove.value = false;
  DialogEdit.value = false;
  FileName.value = "";
  Created_at.value = "";
  Note.value = "";
}
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}
</script>
<script>
export default {
  components: {
    ButtonBack,
    ButtonEdit,
    ButtonRemove,
    ButtonDelete,
    InputSearch,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
  },
};
</script>
<style lang=""></style>
