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
    <v-card-text v-if="orders.length > 0">
      <v-data-table
        :headers="Headers"
        :items="orders"
        :search="search"
        :items-per-page="itemsPerPage"
        class="elevation-1"
        :footer-props="{
          'items-per-page-options': [10, 20, 50, 100],
          'items-per-page-text': 'Số hàng mỗi trang'
        }"
        :header-props="{
          sortByText: 'Sắp xếp theo',
          sortDescText: 'Giảm dần',
          sortAscText: 'Tăng dần'
        }"
        :loading="DialogLoading"
        loading-text="Đang tải dữ liệu..."
        no-data-text="Không có dữ liệu"
        no-results-text="Không tìm thấy kết quả"
        :hover="true"
        :dense="false"
        :fixed-header="true"
        height="calc(100vh - 200px)"
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
    <v-card-text v-else>
      <v-empty-state
        headline="OPPS !"
        title="Chưa có dữ liệu"
        text="Hãy tạo đơn hàng mới"
        icon="mdi-folder-remove-outline"
      ></v-empty-state>
    </v-card-text>
  </v-card>

  <v-dialog v-model="DialogRemove" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
        Xoá dữ liệu
      </v-card-title>
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
        {
          key: "Name_PO",
          title: "Tên dự án",
          width: "200px",
          noWrap: true
        },
        { key: "Quantity_Type", title: "Tổng loại linh kiện", width: "150px", noWrap: true },
        { key: "Quantity_Items", title: "Tổng linh kiện sử dụng", width: "150px", noWrap: true },
        { key: "Status", title: "Tình trạng", width: "150px", noWrap: true },
        { key: "Creater", title: "Người tạo", width: "150px", noWrap: true },
        { key: "Date", title: "Ngày tạo", width: "150px", noWrap: true },
        { title: "", key: "id", sortable: false, width: "100px", noWrap: true }
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
<style>
.v-data-table-header th {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
</style>
