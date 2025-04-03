<template lang="">
  <v-card
    variant="text"
    class="overflow-y-auto"
    height="100vh"
    v-if="DetailOrder == false"
  >
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách đơn hàng
    </v-card-title>
    <v-card-text v-if="orders.length > 0">
      <v-text-field
        v-model="search"
        density="compact"
        label="Tìm kiếm"
        prepend-inner-icon="mdi-magnify"
        variant="solo-filled"
        flat
        hide-details
        single-line
        clearable
        max-width="400"
      ></v-text-field>
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
            @click="EditTable(value)"
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
        image="/src/assets/Empty.png"
      ></v-empty-state>
    </v-card-text>
  </v-card>

  <div v-if="DetailOrder == true">
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light"
        ><v-btn prepend-icon="mdi-chevron-left" variant="text" @click="GoBack()"
          >Trở lại</v-btn
        >
      </v-card-title>
      <v-card-text>
        <Detail />
      </v-card-text>
    </v-card>
  </div>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá dự án này ? </v-card-text>
      <template v-slot:actions>
        <v-btn @click="DialogRemove = false" variant="tonal">Huỷ</v-btn>
        <v-btn
          class="bg-red"
          @click="
            RemoveItem();
            DialogRemove = false;
          "
          >Xoá</v-btn
        >
      </template>
    </v-card>
  </v-dialog>
</template>
<script setup>
import axios from "axios";
import router from "@/router/index";
import { useSocket } from "@/composables/useWebSocket";

const { orders } = useSocket();
console.log(orders);
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
      DetailOrder: false,
      DialogRemove: false,
      itemsPerPage: 10,
      page: 1,
      intervalId: null,
    };
  },
  methods: {
    EditTable(value) {
      const item = this.Orders.find((v) => v.id == value);
      this.Name_PO = item.Name_PO;
      router.push({
        name: "Pages",
        params: { id: 1, PO: this.Name_PO },
      });
      this.DetailOrder = true;
    },
    async FetchTableOrder() {
      try {
        const res = await fetch(`${this.Url}/CheckBom/${this.Name_PO}`);
        this.Order = await res.json();
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
    GetRemove(value) {
      this.id_Remove = value;
      this.DialogRemove = true;
    },
    async RemoveItem() {
      axios
        .delete(`${this.Url}/Orders/delete-item/${this.id_Remove}`)
        .then(function (response) {
          console.log(response);
          this.DialogRemove = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    GoBack() {
      (this.DetailOrder = false),
        router.push({
          name: "Home",
        });
    },
  },
};
</script>
<style lang=""></style>
