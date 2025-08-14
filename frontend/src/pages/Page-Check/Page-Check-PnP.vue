<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Kiem-tra-so-lieu" />
      <p class="text-h4 font-weight-light ms-3">Chỉnh sửa số liệu</p>
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <ButtonAdd @add="DialogAdd = true" />
      <p class="text-subtitle-1 font-weight-thin text-subtitle-1 ms-2">
        {{ detailBom.length }} dự án
      </p>
      <v-spacer></v-spacer>
      <InputSearch v-model="search" />
    </v-card-title>
    <v-card-text>
      <v-data-table
        :headers="Headers"
        :items="detailBom"
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
              :length="Math.ceil(detailBom.length / itemsPerPage)"
            ></v-pagination>
          </div>
        </template>
        <template v-slot:item.id="{ value }">
          <div class="d-flex">
            <ButtonEdit @edit="GetItem(value)" />
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogAdd" width="600" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu BOM + Pịck & Place + Gerber
      </v-card-title>
      <v-card-text>
        <InputFiles
          label="Nhập file Bom (.csv, xlsx)"
          class="mt-2"
          v-model="FileBom"
          name="bom"
        />
        <InputFiles
          label="Nhập file Pick & Place (.csv, xlsx)"
          class="mt-2"
          v-model="FilePnP"
          name="pickplace"
        />
        <InputFiles
          label="Nhập file Gerber (.zip)"
          class="mt-2"
          v-model="FileGerber"
        />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="handleUpload" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá Bom này ? </v-card-text>
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
import { useRoute } from "vue-router";
import { useDetailBom } from "@/composables/CheckBOM/useDetailBom";
import ButtonBack from "@/components/Button-Back.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonRemove from "@/components/Button-Remove.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import Loading from "@/components/Loading.vue";

//
const { detailBom } = useDetailBom();
const Url = import.meta.env.VITE_API_URL;
const GetID = ref("");
const route = useRoute();
const id = route.params.id;


// Dialog status
const DialogAdd = ref(false);
const DialogRemove = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const DialogSuccess = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");


// Data page
const FileBom = ref(null);
const FilePnP = ref(null);
const FileGerber = ref(null);


// Table status
const search = ref("");
const itemsPerPage = ref(15);
const page =  ref(1);

// Function
const handleUpload = async () => {
  try {
    const formData = new FormData();
    if (FileBom.value) formData.append("bom", FileBom.value);
    if (FilePnP.value) formData.append("pickplace", FilePnP.value);
    // if (FileGerber.value) formData.append("gerber", FileGerber.value);

    const res = await axios.post(`${Url}/upload-bom-pickplace-gerber/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("✅ Upload thành công:", res.data);
    DialogSuccess.value = true;
    MessageDialog.value = "Tải file lên thành công"
    DialogAdd.value = false;
    FileBom.value = "";
    FilePnP.value = "";
  } catch (err) {
    console.error("❌ Lỗi upload:", err);
    DialogFailed.value = true;
    MessageErrorDialog.value = "Tải file lên thất bại"
    DialogAdd.value = false;
  }
};
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
