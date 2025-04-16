<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Du-an" />
      <p class="text-h4 font-weight-light ms-3">Chi tiết PO</p>
    </v-card-title>
    <v-card-text>
      <v-card flat>
        <v-card-title class="d-flex align-center pe-2">
          <v-icon icon="mdi mdi-account-badge-outline"></v-icon> &nbsp;
          {{ NamePO }}

          <ButtonAdd @add="DialogAdd = true" />
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ detailProject.length }} PO)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-divider></v-divider>
        <v-data-table
          :search="search"
          :items="detailProject"
          :headers="Headers"
          :items-per-page="itemsPerPage"
          v-model:page="page"
        >
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(detailProject.length / this.itemsPerPage)"
              ></v-pagination>
            </div>
          </template>

          <template v-slot:item.id="{ item }">
            <div>
              <ButtonEye @detail="PushItem(item)" />
              <ButtonEdit @edit="GetItem(item)" />
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Cập nhật dữ liệu">
      <v-card-text>
        <InputField label="Chi tiết đơn hàng" v-model="PONumber_Edit" />
        <InputField
          label="Ngày tạo đơn"
          hint="Định dạng: 11/11/2025"
          v-model="Date_Created_Edit"
        />
        <InputField
          label="Ngày giao đơn"
          hint="Định dạng: 11/11/2025"
          v-model="Date_Delivery_Edit"
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
        <InputField label="Chi tiết đơn hàng" v-model="PONumber_Add" />
        <InputField
          label="Ngày tạo đơn"
          hint="Định dạng: 11/11/2025"
          v-model="Date_Created_Add"
        />
        <InputField
          label="Ngày giao đơn"
          hint="Định dạng: 11/11/2025"
          v-model="Date_Delivery_Add"
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
</template>
<script setup>
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { ref, computed } from "vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import { useDetailProject } from "@/composables/useDetailProject";
const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const DialogEdit = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogRemove = ref(false);
const DialogAdd = ref(false);
const GetID = ref("");
const PONumber_Edit = ref("");
const Date_Created_Edit = ref("");
const Date_Delivery_Edit = ref("");
const PONumber_Add = ref("");
const Date_Created_Add = ref("");
const Date_Delivery_Add = ref("");
const { detailProject, detailProjectError } = useDetailProject(id);
function PushItem(item) {
  localStorage.setItem("PO", item.PO);
  router.push(`/Du-an/Don-hang/${item.id}`);
}
function GetItem(item) {
  DialogEdit.value = true;
  GetID.value = item.id;
  PONumber_Edit.value = item.PO;
  Date_Created_Edit.value = item.Date_Created;
  Date_Delivery_Edit.value = item.Date_Delivery;
}
const SaveEdit = async () => {
  const formData = reactive({
    PONumber: PONumber_Edit.value, // Giá trị ban đầu
    DateCreated: Date_Created_Edit.value,
    DateDelivery: Date_Delivery_Edit.value,
    CustomerID: id,
  });
  axios
    .put(`${Url}/Project/Customer/Edit-Orders/${GetID.value}`, formData)
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
    PONumber: PONumber_Add.value, // Giá trị ban đầu
    DateCreated: Date_Created_Add.value,
    DateDelivery: Date_Delivery_Add.value,
    CustomerID: id,
  });
  axios
    .post(`${Url}/Project/Customer/Add-Orders`, formData)
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
    .delete(`${Url}/Project/Customer/Delete-Orders/${GetID.value}`)
    .then(function (response) {
      console.log(response.data.message);
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
  PONumber_Add.value = "";
  Date_Created_Add.value = "";
  Date_Delivery_Add.value = "";
}
function Error(){
  DialogFailed = true
}
</script>
<script>
export default {
  components: {
    ButtonCancel,
    ButtonDownload,
    ButtonSave,
    InputSearch,
    SnackbarSuccess,
    ButtonBack,
    ButtonEdit,
    ButtonAgree,
    ButtonEye,
    SnackbarFailed
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      search: "",
      Headers: [
        { key: "PO", title: "Đơn hàng" },
        { key: "Total_Product", title: "Tổng đơn hàng" },
        { key: "Total_Delivered", title: "Tổng đơn đã giao" },
        { key: "Total_Amount", title: "Tổng nợ" },
        { key: "Date_Created", title: "Ngày tạo" },
        { key: "Date_Delivery", title: "Ngày giao", width: "150px" },
        {
          key: "id",
          sortable: false,
          title: "Xem",
        },
      ],
      itemsPerPage: 12,
      page: 1,
      NamePO: localStorage.getItem("Customers"),
      intervalId: null,
      intervalId2: null,
    };
  },
  methods: {
    EditItem(item) {
      // const value = this.Bom.find((v) => v.id == item);
      this.GetRow = item.PartNumber_1;
      this.DialogEdit = true;
    },
    async SaveEdit() {
      const Item = {
        Name_Item: this.GetRow,
        Input_Hao_Phi_Thuc_Te: this.ActualCost,
      };
      this.Reset();
      axios
        .put(`${this.Url}/CheckBom/Update-Hao-Phi-Thuc-Te`, Item)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    Reset() {
      (this.ActualCost = ""),
        (this.DialogEdit = false),
        (this.DialogSuccess = true);
      this.DialogAccept = false;
    },
    async WareHouseAccept() {
      this.Reset();
      axios
        .put(`${this.Url}/Orders/WareHouse-Accept/${this.$route.params.id}`)
        .then(function (response) {
          console.log(response);
          this.WareHouseAcceptInventory();
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async WareHouseAcceptInventory() {
      this.WareHouseAccept();
      axios
        .put(
          `${this.Url}/Inventory/update-Inventory-CheckBom/${this.$route.params.id}`
        )
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async DownloadOrder() {
      try {
        const response = await fetch(
          `${this.Url}/Download-Order/${this.$route.params.PO}`
        );
        if (!response.ok) throw new Error("Download failed");

        // Convert response to blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Create a link to download
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.$route.params.PO}.xlsx`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading file:", error);
      }
    },
  },
};
</script>
<style lang=""></style>
