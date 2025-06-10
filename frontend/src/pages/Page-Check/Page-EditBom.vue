<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Kiem-tra-so-lieu" />
      <p class="text-h4 font-weight-light ms-3">Chỉnh sửa số liệu</p>
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <p class="text-subtitle-1 font-weight-thin text-subtitle-1">{{ detailBom.length }} dự án</p>
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
  <v-dialog v-model="DialogEdit" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Tên dự án" v-model="PO_Edit" />
        <InputField label="Số lượng board" v-model="Quantity_Edit" />
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
import { useDetailBom } from "@/composables/CheckBOM/useDetailBom";
import ButtonBack from "@/components/Button-Back.vue";
import InputSearch from "@/components/Input-Search.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonRemove from "@/components/Button-Remove.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import Loading from "@/components/Loading.vue"
const { detailBom } = useDetailBom();
const Url = import.meta.env.VITE_API_URL;
const GetID = ref("");
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const DialogSuccess = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");
const PO_Edit = ref("");
const Bom_Edit = ref("");
const Quantity_Edit = ref("");
function GetItem(value) {
  GetID.value = value;
  DialogEdit.value = true;
  const found = detailBom.value.find((v) => v.id === value);
  PO_Edit.value = found.PO;
  Bom_Edit.value = found.Bom;
  Quantity_Edit.value = found.SL_Board;
}
const SaveEdit = async () => {
  DialogLoading.value = true
  DialogLoading.value = true
  const formData = {
    PO: PO_Edit.value,
    SL_Board: Quantity_Edit.value,
  };
  axios
    .put(`${Url}/CheckBom/Edit-Item/${Bom_Edit.value}`, formData)
    .then(function (response) {
      console.log(response);
      MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
      Error();
    });
};
const RemoveItem = async () => {
  DialogLoading.value = true
  axios
    .delete(`${Url}/CheckBom/Delete-Item/${Bom_Edit.value}`)
    .then(function (response) {
      console.log(response);
      MessageDialog.value = "Xoá dữ liệu thành công";
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      MessageErrorDialog.value = "Xoá dữ liệu thất bại";
      Error();
    });
};
function Reset() {
  DialogEdit.value = false;
  DialogSuccess.value = true;
  DialogRemove.value = false;
  DialogLoading.value = false;
  DialogRemove.value = false;
  DialogFailed.value = false;
}
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false
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
    Loading
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      Headers: [
        { key: "PO", title: "Tên dự án" },
        { key: "Bom", title: "Tên Bom" },
        { key: "SL_Board", title: "Số lượng Board" },
        { key: "SL_LK", title: "Số lượng linh kiện" },
        { key: "Creater", title: "Người tạo" },
        { key: "TimeStamp", title: "Thời gian tạo" },
        { key: "id", title: "Thao tác" },
      ],
      search: "",
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {},
};
</script>
<style lang=""></style>
