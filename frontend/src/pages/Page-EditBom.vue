<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Kiem-tra-so-lieu" />
      <p class="text-h4 font-weight-light ms-3">Chỉnh sửa số liệu</p>
    </v-card-title>
    <v-card-title>
      <InputSearch v-model="search" />
    </v-card-title>
    <v-card-text>
      <v-data-table
        :headers="Headers"
        :items="detailBom"
        :search="search"
        :items-per-page="itemsPerPage"
        v-model:page="page"
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
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Cập nhật dữ liệu">
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
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { ref, watch } from "vue";
import { useDetailBom } from "@/composables/useDetailBom";
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
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const RemoveItem = async () => {
  DialogLoading.value = true
  axios
    .delete(`${Url}/CheckBom/Delete-Item/${Bom_Edit.value}`)
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
  DialogEdit.value = false;
  DialogSuccess.value = true;
  DialogRemove.value = false;
  DialogLoading.value = false;
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
        { key: "id", title: "Sửa" },
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
