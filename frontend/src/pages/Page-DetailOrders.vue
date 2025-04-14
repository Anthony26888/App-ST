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

          <template v-slot:item.id="{ item }">
            <ButtonEdit @edit="EditItem(item)" />
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
            <ButtonAgree @agree="WareHouseAcceptInventory()" />
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-text>
  </v-card>
  <SnackbarSuccess v-model="DialogSuccess" />
</template>
<script setup>
import axios from "axios";
import { computed } from "vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import { useSocket } from "@/composables/useWebSocket";
import { useDetailOrder } from "@/composables/useDetailOrder";
const { orders } = useSocket();
const status = computed(() => {
  if (!orders.value || !Array.isArray(orders.value)) return null;
  const found = orders.value.find((v) => v.Name_PO === route.params.id);
  return found ? found.Status : null;
});
const route = useRoute();
const id = route.params.id;
const { compare, compareError, headers } = useDetailOrder(id);
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
    ButtonAgree
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      search: "",
      Headers: [],
      Detail_Order: [],
      Information: null,
      Status: null,
      ActualCost: "",
      GetRow: "",
      ID: this.$route.params.id,
      Name_PO: this.$route.params.PO,
      Accept: "Kho đã xác nhận",
      DialogEdit: false,
      DialogSuccess: false,
      DialogAccept: false,
      itemsPerPage: 12,
      page: 1,
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
        this.DialogAccept = false
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
