<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách đơn hàng
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <p class="text-subtitle-1">Có {{ orders.length }} đơn hàng</p>
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
          <ButtonEye @detail="PushItem(value)" />
          <ButtonRemove @remove="GetItem(value)" />
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
              :length="Math.ceil(orders.length / itemsPerPage)"
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
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOrders } from "@/composables/useOrders";
import InputSearch from "@/components/Input-Search.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonEye from "@/components/Button-Eye.vue";
const Url = import.meta.env.VITE_API_URL;
const { orders } = useOrders();
const router = useRouter();
const DialogRemove = ref(null);
const DialogSuccess = ref(null);
const DialogFailed = ref(null);
const GetID = ref("")
function PushItem(value) {
  const found = orders.value.find((v) => v.id === value);
  router.push(`/Don-hang/${found.Name_PO}`);
}
function GetItem(value) {
  DialogRemove.value = true;
  GetID.value = value
}
const RemoveItem = async () => {
  axios
    .delete(`${Url}/Orders/delete-item/${GetID.value}`)
    .then(function (response) {
      console.log(response);
      Reset()
    })
    .catch(function (error) {
      console.log(error);
      Error()
    });
};
function Reset(){
  DialogSuccess.value = true;
  DialogRemove.value = false
}
function Error(){
  DialogFailed.value = true
}
</script>
<script>
export default {
  components: {
    ButtonDelete,
    ButtonCancel,
    InputSearch,
    SnackbarSuccess,
    SnackbarFailed,
    ButtonEye,
  },
  data() {
    return {
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
      itemsPerPage: 10,
      page: 1,
    };
  },
  methods: {
    
  },
};
</script>
<style lang=""></style>
