<template lang="">
  <v-card
    variant="text"
    class="overflow-y-auto"
    height="100vh"
  >
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách đơn hàng
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <p class="text-subtitle-1">
        Có {{ orders.length }} đơn hàng
      </p>
      <v-spacer></v-spacer>
      <InputSearch v-model="search" />
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text v-if="orders.length > 0">
      <v-data-table
        :headers="Headers"
        :items="orders"
        :search="search"
        :items-per-page="itemsPerPage"
      >
        <template v-slot:item.id="{ value }">
          <v-btn
            icon="mdi-eye-outline"
            color="primary"
            variant="text"
            size="small"
            @click="FetchTableOrder(value)"
          ></v-btn>
          <v-btn

            icon="mdi-delete"
            color="red"
            variant="text"
            size="small"
            @click="GetRemove(value)"
          ></v-btn>
        </template>
        <template v-slot:item.Status="{ item }">
          <div class="text-start">
            <v-chip
              :color="Boolean(item.Status) ? 'green' : 'red'"
              :text="
                Boolean(item.Status) ? 'Kho đã xác nhận' : 'Chờ kho xác nhận'
              "
              size="small"
              label
            ></v-chip>
          </div>
        </template>
        <template v-slot:bottom>
          <div class="text-center pt-2">
            <v-pagination
              v-model="page"
              :length="Math.ceil(orders.length / this.itemsPerPage)"
            ></v-pagination>
          </div>
        </template>
      </v-data-table>
    </v-card-text>
    <v-card-text v-if="orders.length == 0">
      <v-empty-state
        headline="OPPS !"
        title="Chưa có dữ liệu"
        text="Hãy tạo đơn hàng mới"
        icon="mdi-folder-remove-outline"
      ></v-empty-state>
    </v-card-text>
  </v-card>

  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá dự án này ? </v-card-text>
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
import router from "@/router/index";
import { useSocket } from "@/composables/useWebSocket";
import InputSearch from "@/components/Input-Search.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
const { orders } = useSocket();
</script>
<script>
export default {
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      Headers: [
        { title: "", key: "id", sortable: false },
        {
          key: "Name_PO",
          title: "Tên dự án",
        },
        { key: "Quantity_Type", title: "Tổng loại linh kiện" },
        { key: "Quantity_Items", title: "Tổng linh kiện sử dụng" },
        { key: "Status", title: "Tình trạng" },
        { key: "Creater", title: "Người tạo" },
        { key: "Date", title: "Ngày tạo" },
      ],
      search: "",
      id_Remove: "",
      Name_PO: "",
      DialogRemove: false,
      DialogSuccess :false,
      itemsPerPage: 10,
      page: 1,
      intervalId: null,
    };
  },
  methods: {
    async FetchTableOrder(value) {
      try {
        const res = await fetch(`${this.Url}/Orders/Detail/${value}`);
        const orders = await res.json();
        this.Name_PO = orders[0].Name_PO;
        this.$router.push(`/Don-hang/${orders[0].Name_PO}`);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
    GetRemove(value) {
      this.id_Remove = value;
      this.DialogRemove = true;
    },
    async RemoveItem() {
      this.Reset()
      axios
        .delete(`${this.Url}/Orders/delete-item/${this.id_Remove}`)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    Reset(){
      this.DialogRemove = false,
      this.DialogSuccess = true
    }
  },
};
</script>
<style lang=""></style>
