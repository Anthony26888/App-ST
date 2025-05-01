<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack :to="`/Du-an/Khach-hang/${CustomerID}`" />
      <p class="text-h4 font-weight-light ms-3">Chi tiết đơn hàng</p>
    </v-card-title>
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <v-icon icon="mdi mdi-cart-variant"></v-icon> &nbsp;
          {{ NamePO }}
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ detailProjectPO.length }} đơn hàng)
          </p>
          <ButtonAdd @add="DialogAdd = true" />
          <ButtonDownload @download-file="DownloadOrder()" />
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-data-table
          :search="search"
          :items="detailProjectPO"
          :headers="Headers"
          :items-per-page="itemsPerPage"
          v-model:page="page"
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
                :length="Math.ceil(detailProjectPO.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>

          <template v-slot:item.id="{ item }">
            <ButtonEdit @edit="GetItem(item)" />
          </template>
        </v-data-table>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Cập nhật dữ liệu">
      <v-card-text>
        <InputField label="Chi tiết đơn hàng" v-model="Product_Detail_Edit" />
        <InputField
          label="SL đơn hàng"
          type="number"
          v-model="Quantity_Product_Edit"
        />
        <InputField
          label="SL đã giao"
          type="number"
          v-model="Quantity_Delivered_Edit"
        />
        <InputField
          label="SL còn nợ"
          type="number"
          v-model="Quantity_Amount_Edit"
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

  <v-dialog v-model="DialogAdd" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
      <v-card-text>
        <InputField label="Đơn hàng" v-model="Product_Detail_Add" />
        <InputField
          label="SL đơn hàng"
          type="number"
          v-model="Quantity_Product_Add"
        />
        <InputField
          label="SL đã giao"
          type="number"
          v-model="Quantity_Delivered_Add"
        />
        <InputField
          label="SL còn nợ"
          type="number"
          v-model="Quantity_Amount_Add"
        />
      </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá đơn hàng này ? </v-card-text>
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
import { useRoute } from "vue-router";
import { ref, watch } from "vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import { useDetailProjectPO } from "@/composables/useDetailProjectPO";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue"
const route = useRoute();
const id = route.params.id;
const Url = import.meta.env.VITE_API_URL;
const DialogEdit = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogRemove = ref(false);
const DialogAdd = ref(false);
const DialogLoading = ref(false);
const GetID = ref("");
const Product_Detail_Edit = ref("");
const Quantity_Product_Edit = ref("");
const Quantity_Delivered_Edit = ref("");
const Quantity_Amount_Edit = ref("");
const Product_Detail_Add = ref("");
const Quantity_Product_Add = ref("");
const Quantity_Delivered_Add = ref("");
const Quantity_Amount_Add = ref("");
const CustomerID = ref(null);
const NamePO = ref(null);
const NameCustomer = ref(null);
const { detailProjectPO, detailProjectPOError } = useDetailProjectPO(id);
onMounted(() => {
  const storedData = localStorage.getItem("CustomersID");
  const storeData = localStorage.getItem("PO");
  const storedsData = localStorage.getItem("Customers");
  CustomerID.value = storedData;
  NamePO.value = storeData;
  NameCustomer.value = storedsData;
});

function GetItem(item) {
  DialogEdit.value = true;
  GetID.value = item.id;
  Product_Detail_Edit.value = item.Product_Detail;
  Quantity_Product_Edit.value = item.Quantity_Product;
  Quantity_Delivered_Edit.value = item.Quantity_Delivered;
  Quantity_Amount_Edit.value = item.Quantity_Amount;
}
const SaveEdit = async () => {
  const formData = reactive({
    Product_Detail: Product_Detail_Edit.value, // Giá trị ban đầu
    Quantity_Product: Quantity_Product_Edit.value,
    Quantity_Delivered: Quantity_Delivered_Edit.value,
    Quantity_Amount: Quantity_Amount_Edit.value,
  });
  axios
    .put(`${Url}/Project/Customer/Edit-Item/${GetID.value}`, formData)
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
  const formData = reactive({
    Product_Detail: Product_Detail_Add.value, // Giá trị ban đầu
    Quantity_Product: Quantity_Product_Add.value,
    Quantity_Delivered: Quantity_Delivered_Add.value,
    Quantity_Amount: Quantity_Amount_Add.value,
    POID: id,
  });
  axios
    .post(`${Url}/Project/Customer/Add-Item`, formData)
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
  axios
    .delete(`${Url}/Project/Customer/Delete-Item/${GetID.value}`)
    .then(function (response) {
      console.log(response.data.message);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error()
    });
};

const DownloadOrder = async () => {
  const NameExcel = `${NameCustomer.value}-${NamePO.value}`
  try {
    const response = await fetch(
      `${Url}/Project/Customer/Orders/Download/${id}?filename=${encodeURIComponent(NameExcel)}`
    );
    if (!response.ok) throw new Error("Download failed");

    // Convert response to blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create a link to download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${NameExcel}.xlsx`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
    Error()
  }
};

function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  Product_Detail_Add.value = "";
  Quantity_Product_Add.value = "";
  Quantity_Delivered_Add.value = "";
  Quantity_Amount_Add.value = "";
}
function Error(){
  DialogFailed.value = true
}
</script>
<script>
export default {
  components: {
    ButtonCancel,
    ButtonDownload,
    ButtonSave,
    InputSearch,
    InputField,
    SnackbarSuccess,
    ButtonBack,
    ButtonEdit,
    ButtonAgree,
    ButtonAdd,
    SnackbarFailed,
    Loading
  },
  data() {
    return {
      search: "",
      Headers: [
        { key: "Product_Detail", title: "Chi tiết đơn hàng" },
        { key: "Quantity_Product", title: "SL đơn hàng" },
        { key: "Quantity_Delivered", title: "SL đơn đã giao" },
        { key: "Quantity_Amount", title: "SL còn nợ" },
        {
          key: "id",
          sortable: false,
          title: "Sửa",
        },
      ],
      itemsPerPage: 12,
      page: 1,
    };
  },
  methods: {
    
  },
};
</script>
<style lang=""></style>
