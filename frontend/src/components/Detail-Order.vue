<template lang="">
  <v-card-text>
    <v-card flat>
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-cart-arrow-down"></v-icon> &nbsp;
        {{ $route.params.PO }}
        <p class="ms-2 font-weight-thin text-subtitle-1">
          ( {{ Detail_Order.length }} linh kiện)
        </p>
        <v-btn
          prepend-icon="mdi mdi-download"
          color="success"
          class="ms-2 text-caption"
          variant="tonal"
          @click="DownloadOrder()"
          >Tải file</v-btn
        >
        <v-btn
          v-if="Status == 0"
          prepend-icon="mdi mdi-check-all"
          color="blue-darken-4"
          class="ms-2 text-caption"
          variant="tonal"
          @click="DialogAccept = true"
          >Kho xác nhận</v-btn
        >

        <v-spacer></v-spacer>

        <v-text-field
          v-model="search"
          density="compact"
          label="Tìm kiếm"
          prepend-inner-icon="mdi-magnify"
          variant="solo-filled"
          flat
          hide-details
          single-line
        ></v-text-field>
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
          <v-btn @click="DialogEdit = false" variant="tonal">Huỷ</v-btn>
          <v-btn
            class="bg-primary"
            @click="
              SaveEdit();
              DialogSuccess = true;
            "
            >Nhập dữ liệu</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="DialogSuccess">
      <v-card width="500" height="400" class="mx-auto">
        <v-empty-state icon="$success">
          <template v-slot:media>
            <v-icon color="success"></v-icon>
          </template>

          <template v-slot:headline>
            <div class="text-h4">Thành Công</div>
          </template>

          <template v-slot:text>
            <div class="text-medium-emphasis text-caption">
              Dữ liệu đã được nhập vào hệ thống
            </div>
          </template>
          <template v-slot:actions>
            <v-btn
              class="text-none"
              color="primary"
              elevation="1"
              rounded="lg"
              size="small"
              text="Tiếp tục"
              width="96"
              @click="ResetInput()"
            ></v-btn>
          </template>
        </v-empty-state>
      </v-card>
    </v-dialog>
    <v-dialog v-model="DialogAccept" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Kho xác nhận dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xác nhận dữ liệu? </v-card-text>
      <template v-slot:actions>
        <v-btn @click="DialogAccept = false" variant="tonal">Huỷ</v-btn>
        <v-btn
          class="bg-green"
          @click="
            WareHouseAccept(); WareHouseAcceptInventory()
            DialogAccept = false;
          "
          >Đồng ý</v-btn
        >
      </template>
    </v-card>
  </v-dialog>
  </v-card-text>
</template>
<script setup>
import axios from "axios";
</script>
<script>
export default {
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      search: "",
      Headers: [],
      Detail_Order: [],
      Information:null,
      Status:null,
      ActualCost: "",
      GetRow: "",
      ID: this.$route.params.id,
      Name_PO: this.$route.params.PO,
      Accept: "Kho đã xác nhận",
      DialogEdit: false,
      DialogSuccess: false,
      DialogAccept:false,
      itemsPerPage: 12,
      page: 1,
      intervalId:null,
      intervalId2:null
    };
  },
  mounted() {
    this.GetOrder()
    this.intervalId = setInterval(this.FetchTable, 1000);
    this.intervalId2 = setInterval(this.GetOrder, 1000);
  },
  beforeUnmount() {
    // Clear the interval when the component is destroyed
    if (this.UserInterval) {
      clearInterval(this.UserInterval);
    }
    if (this.UserInterval2) {
      clearInterval(this.UserInterval2);
    }
  },
  computed: {
    pageCount() {
      return Math.ceil(this.Detail_Order.length / this.itemsPerPage);
    },
  },
  methods: {
    async FetchTable() {
      if (this.$route.params.PO) {
        try {
          const res = await fetch(
            `${this.Url}/Orders/${this.$route.params.PO}`
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
      axios
        .put(`${this.Url}/CheckBom/Update-Hao-Phi-Thuc-Te`, Item)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    ResetInput() {
      (this.ActualCost = ""),
        (this.DialogEdit = false),
        (this.DialogSuccess = false);
    },
    async WareHouseAccept() {
      axios
        .put(`${this.Url}/Orders/WareHouse-Accept/${this.$route.params.PO}`)
        .then(function (response) {
          console.log(response);
          this.WareHouseAcceptInventory()
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async WareHouseAcceptInventory() {
      axios
        .put(`${this.Url}/Inventory/update-Inventory-CheckBom/${this.$route.params.PO}`)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async GetOrder() {
      try {
        const res = await fetch(`${this.Url}/Orders/Information/${this.$route.params.PO}`);
        this.Information = await res.json();
        this.Status = this.Information[0].Status
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
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
