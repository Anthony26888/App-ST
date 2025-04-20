<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách dự án</v-card-title
    >
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <ButtonImportFile @import-file="Dialog = true" />
          <v-btn
            prepend-icon="mdi mdi-plus"
            variant="tonal"
            color="primary"
            class="text-caption ms-2"
            @click="DialogAdd = true"
            >Thêm</v-btn
          >
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ project.length }} dự án)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="overflow-auto">
          <v-data-table
            :headers="Headers"
            :items="project"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
          >
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(project.length / this.itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
            <template v-slot:item.id="{ value }">
              <div>
                <ButtonEye @detail="PushItem(value)" />
                <ButtonEdit @edit="GetItem(value)" />
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Cập nhật dữ liệu">
      <v-card-text>
        <InputField label="Khách hàng" v-model="Customer_Edit" />
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
    <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
      <v-card-text>
        <InputField label="Khách hàng" v-model="Customer_Add" />
      </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá khách hàng này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="Dialog" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
      <v-card-text>
        <InputFiles abel="Thêm File Excel" v-model="File" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="Dialog = false" />
        <ButtonSave @save="ImportFile()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { useRouter } from "vue-router";
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import { useProject } from "@/composables/useProject";
import Loading from "@/components/Loading.vue"
const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const GetID = ref("");
const Dialog = ref(false);
const DialogEdit = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogRemove = ref(false);
const DialogAdd = ref(false);
const File = ref(null);
const Customer_Edit = ref("");
const Customer_Add = ref("");
const { project } = useProject();
function PushItem(value) {
  const found = project.value.find((v) => v.id === value);
  router.push(`/Du-an/Khach-hang/${value}`);
  localStorage.setItem("Customers", found.Customers);
  localStorage.setItem("CustomersID", value);
}
function GetItem(value) {
  console.log(value);
  DialogEdit.value = true;
  GetID.value = value;
  const found = project.value.find((v) => v.id === value);
  Customer_Edit.value = found.Customers;
}
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    CustomerName: Customer_Edit.value, // Giá trị ban đầu
  });
  axios
    .put(`${Url}/Project/Customer/Edit-Customer/${GetID.value}`, formData)
    .then(function (response) {
      console.log(response.data.message);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error()
    });
};

const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    CustomerName: Customer_Add.value, // Giá trị ban đầu
  });
  axios
    .post(`${Url}/Project/Customer/Add-Customer`, formData)
    .then(function (response) {
      console.log(response.data);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error()
    });
};
const RemoveItem = async (id) => {
  DialogLoading.value = true;
  axios
    .delete(`${Url}/Project/Customer/Delete-Customer/${GetID.value}`)
    .then(function (response) {
      console.log(response.data.message);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error()
    });
};
const ImportFile = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", File.value);
  axios
    .post(`${Url}/Project/upload`, formData)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error()
    });
};
function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  Dialog.value = false;
  DialogLoading.value = false;
  Customer_Add.value = "";
}
function Error(){
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
    Loading
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      File: null,
      search: "",
      Headers: [
        { key: "Customers", title: "Khách hàng" },
        { key: "Quantity_PO", title: "Số lượng PO" },
        { key: "Years", title: "Năm tạo" },
        {
          key: "id",
          sortable: false,
          title: "Xem",
        },
      ],
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {
  },
};
</script>
<style lang=""></style>
