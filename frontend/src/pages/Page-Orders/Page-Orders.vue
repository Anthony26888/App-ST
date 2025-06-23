<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách đơn hàng
    </v-card-title>
    <v-card-title>
      <v-row>
        <v-col cols="12" sm="4" md="4">
          <v-card class="rounded-lg" color="primary" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Tổng số đơn hàng</div>
              <div class="text-h4 font-weight-bold">
                {{ orders?.length || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <v-card class="rounded-lg" color="success" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Đơn hoàn thành</div>
              <div class="text-h4 font-weight-bold">
                {{
                  orders?.filter((p) => p.Status === '1').length || 0
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <v-card class="rounded-lg" color="warning" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Đơn chưa hoàn thành</div>
              <div class="text-h4 font-weight-bold">
                {{
                  orders?.filter((p) => p.Status === '0').length ||
                  0
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <p class="text-subtitle-1 font-weight-thin text-subtitle-1">
        {{ orders.length }} đơn hàng
      </p>
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
          'items-per-page-text': 'Số hàng mỗi trang',
        }"
        :header-props="{
          sortByText: 'Sắp xếp theo',
          sortDescText: 'Giảm dần',
          sortAscText: 'Tăng dần',
        }"
        :loading="DialogLoading"
        loading-text="Đang tải dữ liệu..."
        no-data-text="Không có dữ liệu"
        no-results-text="Không tìm thấy kết quả"
        :hover="true"
        :dense="false"
        :fixed-header="true"
        height="calc(100vh - 330px)"
      >
        <template v-slot:item.id="{ value }">
          <div class="d-flex">
            <ButtonEye @detail="PushItem(value)" />
            <ButtonRemove @remove="GetItem(value)" />
          </div>
        </template>
        <template v-slot:item.Status="{ value }">
          <div class="text-start">
            <v-chip
              :color="value == 1 ? 'green' : 'red'"
              :text="value == 1 ? 'Kho đã xác nhận' : 'Chờ kho xác nhận'"
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
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

// Composables
import { useOrders } from "@/composables/Orders/useOrders";

// Components
import InputSearch from "@/components/Input-Search.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonEye from "@/components/Button-Eye.vue";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Initialize composables and router
const { orders } = useOrders();
const router = useRouter();

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogRemove = ref(null); // Remove item confirmation dialog
const DialogSuccess = ref(null); // Success notification
const DialogFailed = ref(null); // Error notification

// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== ITEM STATES =====
// Current item being processed
const GetID = ref("");

// ===== CRUD OPERATIONS =====
/**
 * Navigates to order details page and stores creator information
 * @param {string} value - The ID of the order to view
 */
function PushItem(value) {
  const found = orders.value.find((v) => v.id === value);
  localStorage.setItem("Creater_Order", found.Creater);
  router.push(`/Don-hang/${found.Name_PO}`);
}

/**
 * Prepares an item for deletion by setting up the confirmation dialog
 * @param {string} value - The ID of the item to delete
 */
function GetItem(value) {
  DialogRemove.value = true;
  GetID.value = value;
}

/**
 * Removes an order from the system
 * Makes an API call to delete the order and handles the response
 */
const RemoveItem = async () => {
  try {
    const response = await axios.delete(
      `${Url}/Orders/delete-item/${GetID.value}`
    );
    console.log(response);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.error(error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

// ===== UTILITY FUNCTIONS =====
/**
 * Resets dialog states after successful operation
 * Shows success notification and closes remove dialog
 */
function Reset() {
  DialogSuccess.value = true;
  DialogRemove.value = false;
}

/**
 * Handles error states
 * Shows error notification
 */
function Error() {
  DialogFailed.value = true;
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
          noWrap: true,
        },
        {
          key: "Quantity_Type",
          title: "Tổng loại linh kiện",
          width: "150px",
          noWrap: true,
        },
        {
          key: "Quantity_Items",
          title: "Tổng linh kiện sử dụng",
          width: "150px",
          noWrap: true,
        },
        { key: "Status", title: "Tình trạng", width: "150px", noWrap: true },
        { key: "Creater", title: "Người tạo", width: "150px", noWrap: true },
        { key: "Date", title: "Ngày tạo", width: "150px", noWrap: true },
        { title: "", key: "id", sortable: false, width: "100px", noWrap: true },
      ],
      search: "",
      itemsPerPage: 10,
      page: 1,
    };
  },
  methods: {},
};
</script>
<style>
.v-data-table-header th {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
</style>
