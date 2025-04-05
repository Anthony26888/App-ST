<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light">
      <ButtonBack to="/Don-hang" />
    </v-card-title>
    <v-card-title class="text-h4 font-weight-light"
      >Chi tiết đơn hàng</v-card-title
    >
    <v-card-text>
      <v-card flat>
        <v-card-title class="d-flex align-center pe-2">
          <v-icon icon="mdi mdi-cart-arrow-down"></v-icon> &nbsp;
          {{ $route.params.id }}
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ Detail_Order.length }} linh kiện)
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
          :items="Detail_Order"
          :header="Headers"
          :items-per-page="itemsPerPage"
          v-model:page="page"
        >
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination v-model="page" :length="pageCount"></v-pagination>
            </div>
          </template>

          <template v-slot:item.id="{ item }">
            <v-btn
              icon="mdi mdi-pencil"
              @click="EditItem(item)"
              variant="tonal"
              color="primary"
              size="md"
            >
            </v-btn>
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
          <template v-slot:actions>
            <ButtonCancel @cancel="DialogAccept = false" />
            <v-btn
              class="bg-green"
              @click="
                WareHouseAccept();
                WareHouseAcceptInventory();
                DialogAccept = false;
              "
              >Đồng ý</v-btn
            >
          </template>
        </v-card>
      </v-dialog>
    </v-card-text>
  </v-card>
</template>
<script setup>
import axios from "axios";
import { computed } from "vue";
import InputSearch from "@/components/Input-Search.vue"
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import { useSocket } from "@/composables/useWebSocket";
const { orders } = useSocket();
const route = useRoute();
const  status  = computed(() => {
  if (!orders.value || !Array.isArray(orders.value)) return null;
  const found = orders.value.find((v) => v.Name_PO === route.params.id);
  return found ? found.Status : null;
});
</script>
<script>
export default {
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
  mounted() {
    this.intervalId = setInterval(this.FetchTable, 1000);
  },
  beforeUnmount() {
    // Clear the interval when the component is destroyed
    if (this.UserInterval) {
      clearInterval(this.UserInterval);
    }
  },
  computed: {
    pageCount() {
      return Math.ceil(this.Detail_Order.length / this.itemsPerPage);
    },
  },
  methods: {
    async FetchTable() {
      if (this.$route.params.id) {
        try {
          const res = await fetch(
            `${this.Url}/Orders/${this.$route.params.id}`
          );
          this.Detail_Order = await res.json();
          this.generateHeaders();
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    },
    generateHeaders() {
      if (this.Detail_Order.length > 0) {
        this.Headers = Object.keys(this.Detail_Order[0]).map((key) => ({
          title: key.replace(/_/g, " "), // Format header text
          key: key,
          value: key,
        }));
      }
    },
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
      this.Reset()
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
        (this.DialogSuccess = false);
    },
    async WareHouseAccept() {
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
