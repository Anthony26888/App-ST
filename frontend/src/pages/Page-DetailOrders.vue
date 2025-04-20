<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Don-hang" />
      <p class="text-h4 font-weight-light ms-3">Chi tiết đơn hàng</p>
    </v-card-title>
    <v-card-text>
      <v-card flat>
        <v-card-title class="d-flex align-center pe-2">
          <v-icon icon="mdi mdi-cart-arrow-down"></v-icon> &nbsp;
          {{ $route.params.id }}
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ compare.length }} linh kiện)
          </p>
          <ButtonDownload @download-file="DownloadOrder()" />
          <v-btn
            v-if="status == 0"
            prepend-icon="mdi mdi-check-all"
            color="blue-darken-4"
            class="ms-2 text-caption"
            variant="tonal"
            @click="DialogAccept = true"
            >Kho xác nhận</v-btn
          >

          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-divider></v-divider>
        <v-data-table
          :search="search"
          :items="compare"
          :header="headers"
          :items-per-page="itemsPerPage"
          v-model:page="page"
        >
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(compare.length / this.itemsPerPage)"
              ></v-pagination>
            </div>
          </template>

          <template v-slot:item.id="{ value }">
            <ButtonEdit @edit="GetItem(value)" />
          </template>
        </v-data-table>
      </v-card>
      <v-dialog v-model="DialogEdit" width="400">
        <v-card
          max-width="400"
          prepend-icon="mdi-update"
          title="Cập nhật dữ liệu"
        >
          <v-card-text>
            <v-text-field
              label="Hao phí thực tế"
              v-model="ActualCost"
              clearable
              type="number"
              variant="solo-filled"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <ButtonCancel @cancel="DialogEdit = false" />
            <ButtonSave @save="SaveEdit()" />
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-model="DialogAccept" width="400">
        <v-card
          max-width="400"
          prepend-icon="mdi-update"
          title="Kho xác nhận dữ liệu"
        >
          <v-card-text> Bạn có chắc chắn muốn xác nhận dữ liệu? </v-card-text>
          <v-card-actions>
            <ButtonCancel @cancel="DialogAccept = false" />
            <ButtonAgree @agree="WareHouseAcceptWareHouse()" />
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-text>
  </v-card>
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { ref, watch } from "vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import { useSocket } from "@/composables/useWebSocket";
import { useDetailOrder } from "@/composables/useDetailOrder";
const route = useRoute();
const id = route.params.id;
const { orders } = useSocket();
const { compare, compareError, headers } = useDetailOrder(id);
const Url = import.meta.env.VITE_API_URL;
const status = computed(() => {
  if (!orders.value || !Array.isArray(orders.value)) return null;
  const found = orders.value.find((v) => v.Name_PO === route.params.id);
  return found ? found.Status : null;
});

const DialogEdit = ref(false);
const DialogAccept = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const NamePO = ref("");
const PartNumber_1 = ref("");
const GetID = ref("");
const ActualCost = ref("");

onMounted(() => {
  const storeData = localStorage.getItem("PO");
  NamePO.value = storeData;
});
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = compare.value.find((v) => v.id === value);
  PartNumber_1.value = found.PartNumber_1;
  ActualCost.value = found.Hao_Phí_Thực_Tế;
}
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = {
    Input_Hao_Phi_Thuc_Te: ActualCost.value,
    PartNumber_1: PartNumber_1.value,
  };
  axios
    .put(`${Url}/CheckBom/Update-Hao-Phi-Thuc-Te`, formData)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};

const WareHouseAcceptWareHouse = async () => {
  DialogLoading.value = true;
  axios
    .put(`${Url}/WareHouse/update-Inventory-CheckBom/${id}`)
    .then(function (response) {
      console.log(response);
      WareHouseAccept();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const WareHouseAccept = async () => {
  
  axios
    .put(`${Url}/Orders/WareHouse-Accept/${id}`)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const DownloadOrder = async () => {
  try {
    const response = await fetch(
      `${Url}/Download-Order/${id}`
    );
    if (!response.ok) throw new Error("Download failed");

    // Convert response to blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create a link to download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.xlsx`;
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
  DialogEdit.value = false;
  DialogLoading.value = false;
  DialogSuccess.value = true;
  DialogAccept.value = false;
}
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
  DialogAccept.value = false;
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
    SnackbarFailed,
    Loading,
    ButtonBack,
    ButtonEdit,
    ButtonAgree,
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      search: "",
      Headers: [],

      itemsPerPage: 12,
      page: 1,
    };
  },
  methods: {
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
