<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex" v-if="lgAndUp">
      <ButtonBack :to="`/Du-an`" />
      <p class="text-h4 font-weight-light ms-3">Chi tiết đơn hàng</p>
    </v-card-title>
    <v-card-title class="d-flex" v-else>
      <ButtonBack :to="`/Du-an`" />
      <v-icon icon="mdi mdi-cart-variant"></v-icon> &nbsp;
      {{ NameCustomer }}
    </v-card-title>
    <v-card-text>
      <v-card-title class="mb-3">
        <v-row v-if="lgAndUp">
          <v-col cols="12" sm="6" md="3">
            <CardStatistic
              title="Tổng số PO"
              :value="totalUniquePO || 0"
              icon="mdi-file-document-multiple"
              color="primary"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <CardStatistic
              title="Tổng số đơn hàng"
              :value="detailProjectPO?.length || 0"
              icon="mdi-package-variant-closed"
              color="info"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <CardStatistic
              title="Tổng đơn hàng hoàn thành"
              :value="
                detailProjectPO?.filter((p) => p.Status === 'Hoàn thành')
                  .length || 0
              "
              icon="mdi-check-circle"
              color="success"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <CardStatistic
              title="Tổng đơn hàng đang sản xuất"
              :value="
                detailProjectPO?.filter((p) => p.Status === 'Đang sản xuất')
                  .length || 0
              "
              icon="mdi-progress-wrench"
              color="warning"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-card variant="elevated" elevation="0" class="rounded-xl border">
        <v-card-title class="d-flex align-center pe-2" v-if="lgAndUp">
          <v-icon icon="mdi mdi-cart-variant"></v-icon> &nbsp;
          {{ NameCustomer }}

          <ButtonAdd
            @add="DialogAdd = true"
            v-if="LevelUser == 'Admin' || LevelUser == 'Quản lý kinh doanh'"
          />
          <!-- <ButtonDownload @download-file="DownloadOrder()" /> -->
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-card-title class="d-flex align-center pe-2" v-else>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-data-table-virtual
          :group-by="[{ key: 'POID' }]"
          density="comfortable"
          :search="search"
          :items="detailProjectPO"
          :headers="Headers"
          :loading="DialogLoading"
          loading-text="Đang tải dữ liệu..."
          no-data-text="Không có dữ liệu"
          no-results-text="Không tìm thấy kết quả"
          :hover="true"
          :dense="false"
          :fixed-header="true"
          height="calc(100vh - 300px)"
          show-expand
        >
          <template
            v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }"
          >
            <tr>
              <td
                :colspan="columns.length"
                class="cursor-pointer"
                v-ripple
                @click="toggleGroup(item)"
              >
                <div class="d-flex align-center">
                  <v-btn
                    :icon="isGroupOpen(item) ? '$expand' : '$next'"
                    color="medium-emphasis"
                    density="comfortable"
                    size="small"
                    variant="text"
                  ></v-btn>

                  <span class="ms-4 font-weight-bold text-primary"
                    >{{ item.value }} ({{ item.items.length }})</span
                  >
                </div>
              </td>
            </tr>
          </template>

          <template
            v-slot:item.data-table-expand="{
              internalItem,
              isExpanded,
              toggleExpand,
            }"
          >
            <v-btn
              v-if="getScheduleDeliveries(internalItem.raw).length > 0"
              :append-icon="
                isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'
              "
              :text="isExpanded(internalItem) ? 'Thu gọn' : 'Lịch giao'"
              class="text-none"
              color="medium-emphasis"
              size="small"
              variant="text"
              width="105"
              border
              slim
              @click="toggleExpand(internalItem)"
            ></v-btn>
          </template>

          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="py-4">
                <v-sheet rounded="lg" border class="pa-4">
                  <!-- Lịch giao hàng -->
                  <div class="mb-4">
                    <h4 class="text-subtitle1 font-weight-bold mb-3">
                      Lịch giao hàng
                    </h4>

                    <v-table
                      v-if="getScheduleDeliveries(item).length > 0"
                      density="compact"
                    >
                      <thead>
                        <tr class="bg-grey-lighten-4">
                          <th class="text-left">Ngày giao</th>
                          <th class="text-left">Số lượng</th>
                          <th class="text-left">Trạng thái</th>
                          <th class="text-left">Tình trạng giao</th>
                          <th class="text-left">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="schedule in getScheduleDeliveries(item)"
                          :key="schedule.id"
                        >
                          <td class="py-2">
                            {{ schedule.DeliveryDateConvert }}
                          </td>
                          <td class="py-2">
                            {{ schedule.DeliveryQuantity }}
                          </td>
                          <td class="py-2">
                            <v-chip
                              v-if="schedule.DeliveryCheck == 'Chưa giao'"
                              :text="`${schedule.DeliveryStatus}`"
                              :color="
                                schedule.DeliveryStatus === 'Chưa đến hạn'
                                  ? 'green'
                                  : schedule.DeliveryStatus === 'Trễ hạn'
                                  ? 'red'
                                  : 'primary'
                              "
                              variant="tonal"
                              size="small"
                            ></v-chip>
                            <div v-else>-</div>
                          </td>
                          <td class="py-2">
                            <v-chip
                              :text="`${schedule.DeliveryCheck}`"
                              :color="
                                schedule.DeliveryCheck === 'Chưa giao'
                                  ? 'primary '
                                  : schedule.DeliveryCheck === 'Đã giao'
                                  ? 'success'
                                  : 'primary'
                              "
                              variant="tonal"
                              size="small"
                            ></v-chip>
                          </td>
                          <td class="py-2">
                            <ButtonEdit
                              @edit="GetConfirm(schedule.id)"
                              v-if="
                                LevelUser == 'Admin' ||
                                LevelUser == 'Quản lý kinh doanh'
                              "
                            />
                          </td>
                        </tr>
                      </tbody>
                    </v-table>

                    <div v-else class="text-center text-grey text-caption py-4">
                      Chưa có lịch giao hàng
                    </div>
                  </div>
                </v-sheet>
              </td>
            </tr>
          </template>

          <template v-slot:item.id="{ item }">
            <div class="d-flex">
              <ButtonEdit
                @edit="GetItem(item)"
                v-if="LevelUser == 'Admin' || LevelUser == 'Quản lý kinh doanh'"
              />
              <v-btn
                color="success"
                icon="mdi-plus"
                variant="text"
                size="xs"
                @click="GetItemManufacture(item)"
              ></v-btn>
            </div>
          </template>

          <template #item.Status="{ value }">
            <div class="text-start">
              <v-chip
                :color="
                  value === 'Hoàn thành'
                    ? 'success'
                    : value === 'Đang sản xuất'
                    ? 'warning'
                    : 'error'
                "
                variant="tonal"
                class="text-caption"
                size="small"
              >
                {{ value }}
              </v-chip>
            </div>
          </template>

          <template #[`item.Percent_Delivered`]="{ item }">
            <v-progress-linear
              v-model="item.Percent_Delivered"
              height="25"
              color="success"
              rounded
              class="rounded-lg"
            >
              <strong>{{ item.Percent_Delivered }}%</strong>
            </v-progress-linear>
          </template>

          <template #item.Note="{ item }">
            <div style="white-space: pre-line">{{ item.Note }}</div>
          </template>
        </v-data-table-virtual>
      </v-card>
    </v-card-text>
  </v-card>

  <!-- Dialog cập nhật dữ liệu -->
  <BaseDialog
    title="Cập nhật dữ liệu"
    icon="mdi-pencil"
    max-width="1200"
    v-model="DialogEdit"
  >
    <v-row>
      <v-col cols="7">
        <InputField label="Tên PO" v-model="PO_Edit" />
        <InputField label="Chi tiết đơn hàng" v-model="Product_Detail_Edit" />
        <v-row>
          <v-col cols="4">
            <InputField
              label="SL đơn hàng"
              type="number"
              v-model="Quantity_Product_Edit"
            />
          </v-col>
          <v-col cols="4">
            <InputField
              label="SL đã giao"
              type="number"
              v-model="Quantity_Delivered_Edit"
            />
          </v-col>
          <v-col cols="4">
            <InputField
              label="SL còn nợ"
              type="number"
              v-model="Quantity_Amount_Edit"
            />
          </v-col>
        </v-row>
        <InputTextarea
          style="white-space: pre-line"
          label="Ghi chú"
          v-model="Note_Edit"
        />
      </v-col>
      <v-col cols="5">
        <div class="d-flex justify-space-between align-center mb-3">
          <h4 class="text-h6">Lịch giao hàng</h4>
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-plus"
            @click="AddDeliveryRowEdit()"
          >
            Thêm lịch
          </v-btn>
        </div>

        <div class="delivery-header mb-2">
          <v-row no-gutters class="pa-2 bg-grey-lighten-4 rounded">
            <v-col cols="6">
              <small class="text-secondary font-weight-bold">Ngày giao</small>
            </v-col>
            <v-col cols="5">
              <small class="text-secondary font-weight-bold">Số lượng</small>
            </v-col>
          </v-row>
        </div>

        <div class="delivery-rows">
          <v-row
            v-for="(item, index) in DeliverySchedules_Edit"
            :key="index"
            no-gutters
            class="mb-2 align-center"
          >
            <v-col cols="6" class="pe-2">
              <InputField
                label="Ngày tạo"
                type="date"
                v-model="item.DeliveryDate"
                @update:model-value="item.DeliveryDate = $event"
              />
            </v-col>
            <v-col cols="5" class="pe-2">
              <InputField
                label="Ngày tạo"
                type="number"
                v-model="item.DeliveryQuantity"
                @update:model-value="item.DeliveryQuantity = $event"
              />
            </v-col>
            <v-col cols="1" class="text-center">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                @click="RemoveDeliveryRowEdit(index, item.id)"
              ></v-btn>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
    <template #actions>
      <ButtonDelete @delete="DialogRemove = true" />
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogEdit = false" />
      <ButtonSave @save="SaveEdit()" />
    </template>
  </BaseDialog>

  <!-- Dialog thêm mới dữ liệu -->
  <BaseDialog
    v-model="DialogAdd"
    title="Thêm dữ liệu"
    icon="mdi-plus"
    max-width="1200"
  >
    <div class="mb-4">
      <v-row>
        <v-col cols="7">
          <h4 class="text-h6 mb-3">Thông tin chung</h4>
          <InputField label="Tên PO" v-model="PO_Add" />
          <InputField label="Đơn hàng" v-model="Product_Detail_Add" />
          <v-row>
            <v-col cols="4">
              <InputField
                label="SL đơn hàng"
                type="number"
                v-model="Quantity_Product_Add"
              />
            </v-col>
            <v-col cols="4">
              <InputField
                label="SL đã giao"
                type="number"
                v-model="Quantity_Delivered_Add"
              />
            </v-col>
            <v-col cols="4">
              <InputField
                label="SL còn nợ"
                type="number"
                v-model="Quantity_Amount_Add"
                disabled
              />
            </v-col>
          </v-row>
          <InputTextarea label="Ghi chú chung" v-model="Note_Add" />
        </v-col>
        <!-- Lịch giao hàng -->
        <v-col cols="5">
          <div class="d-flex justify-space-between align-center mb-3">
            <h4 class="text-h6">Lịch giao hàng</h4>
            <v-btn
              color="primary"
              size="small"
              variant="tonal"
              prepend-icon="mdi-plus"
              @click="AddDeliveryRow()"
            >
              Thêm lịch
            </v-btn>
          </div>

          <div class="delivery-header mb-2">
            <v-row no-gutters class="pa-2 bg-grey-lighten-4 rounded">
              <v-col cols="6">
                <small class="text-secondary font-weight-bold">Ngày giao</small>
              </v-col>
              <v-col cols="5">
                <small class="text-secondary font-weight-bold">Số lượng</small>
              </v-col>
            </v-row>
          </div>

          <div class="delivery-rows">
            <v-row
              v-for="(item, index) in DeliverySchedules"
              :key="index"
              no-gutters
              class="mb-2 align-center"
            >
              <v-col cols="6" class="pe-2">
                <v-text-field
                  v-model="item.delivery_date"
                  type="date"
                  density="compact"
                  hide-details
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="5" class="pe-2">
                <v-text-field
                  v-model.number="item.delivery_quantity"
                  type="number"
                  density="compact"
                  hide-details
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="1" class="text-center">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="RemoveDeliveryRow(index)"
                ></v-btn>
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
    </div>
    <template #actions>
      <ButtonCancel @cancel="DialogAdd = false" />
      <ButtonSave @save="SaveAdd()" />
    </template>
  </BaseDialog>

  <!-- Dialog thêm mới dữ liệu -->
  <BaseDialog
    v-model="DialogAddManufacture"
    title="Chuyển dữ liệu xuống sản xuất"
    icon="mdi-plus"
    max-width="700"
  >
    <InputField label="Tên dự án" v-model="NamePO" />
    <InputField
      label="Tên đơn hàng"
      v-model="Name_Order_Manufacture"
      @update:model-value="Name_Order_Manufacture = $event"
    />
    <InputField
      label="Tổng sản phẩm"
      type="number"
      :model-value="Total_Manufacture_Add"
      @update:model-value="Total_Manufacture_Add = $event"
    />

    <!-- Thêm input cho quy trình khác (giống DialogAdd ở Page-Manufacture.vue) -->
    <div class="mt-3">
      <!-- Hiển thị danh sách quy trình tùy chỉnh đã thêm -->
      <div v-if="customProcessList.length > 0">
        <div class="text-caption text-grey mb-1">Quy trình đã thêm:</div>
        <div class="d-flex flex-wrap ga-2 mb-5">
          <v-chip
            v-for="(process, index) in customProcessList"
            :key="index"
            closable
            color="secondary"
            size="small"
            @click:close="removeCustomProcess(index)"
          >
            {{ process }}
          </v-chip>
        </div>
      </div>
      <InputField
        label="Thêm quy trình khác"
        v-model="customProcess"
        placeholder="Nhập tên quy trình và nhấn Enter"
        @keyup.enter="addCustomProcess"
        hint="Nhập và nhấn Enter để thêm nhiều quy trình"
      >
        <template #append>
          <v-btn
            icon="mdi-plus-circle"
            size="small"
            color="primary"
            variant="text"
            @click="addCustomProcess"
            :disabled="!customProcess || !customProcess.trim()"
          ></v-btn>
        </template>
      </InputField>
    </div>
    <InputField
      label="Ngày tạo"
      type="date"
      v-model="Date_Manufacture_Add"
      :rules="[requiredRule]"
      @update:model-value="Date_Manufacture_Add = $event"
    />
    <InputTextarea
      label="Ghi chú"
      :model-value="Note_Add_Manufacture"
      @update:model-value="Note_Add_Manufacture = $event"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogAddManufacture = false" />
      <ButtonSave @save="SaveAddManufacture()" />
    </template>
  </BaseDialog>

  <!-- Dialog xoá dữ liệu -->
  <BaseDialog
    v-model="DialogRemove"
    title="Xoá dữ liệu"
    icon="mdi-delete"
    max-width="400"
  >
    <p>Bạn có chắc chắn muốn xoá đơn hàng này ?</p>
    <template #actions>
      <ButtonCancel @cancel="DialogRemove = false" />
      <ButtonDelete @delete="RemoveItem()" />
    </template>
  </BaseDialog>

  <!-- Dialog chỉnh sửa trạng thái giao hàng -->
  <BaseDialog
    v-model="DialogConfirm"
    title="Xác nhận giao hàng"
    icon="mdi-truck-delivery"
    max-width="500px"
  >
    <p>Bạn có xác nhận đơn hàng đã giao ?</p>
    <template #actions>
      <ButtonCancel @cancel="DialogConfirm = false" />
      <ButtonSave @save="ConfirmItem()" />
    </template>
  </BaseDialog>

  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { ref, watch, onMounted, reactive } from "vue";
import { jwtDecode } from "jwt-decode";
import { useDisplay } from "vuetify";
// Components
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import InputSelect from "@/components/Input-Select.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import BaseDialog from "@/components/BaseDialog.vue";

// Composables
import { useDetailProjectPO } from "@/composables/Project/useDetailProjectPO";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Route and ID
const route = useRoute();
const id = route.params.id;

// Initialize composables
const { detailProjectPO, detailProjectPOError } = useDetailProjectPO(id);
const { mdAndDown, lgAndUp } = useDisplay();
// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogEdit = ref(false); // Edit dialog
const DialogSuccess = ref(false); // Success notification
const DialogFailed = ref(false); // Error notification
const DialogRemove = ref(false); // Remove confirmation dialog
const DialogAdd = ref(false); // Add new item dialog
const DialogLoading = ref(false); // Loading state
const DialogAddManufacture = ref(false);
const DialogConfirm = ref(false);
// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== FORM STATES =====
// Current item being processed
const GetID = ref("");
const GetIDManufacture = ref("");
const GetIDConfirm = ref("");

// Edit form states
const PO_Edit = ref("");
const Product_Detail_Edit = ref(""); // Product details for editing
const Quantity_Product_Edit = ref(0); // Product quantity for editing
const Quantity_Delivered_Edit = ref(0); // Delivered quantity for editing
const Note_Edit = ref(""); // Note for editing
const DeliverySchedules_Edit = ref([]);

// Add form states
const PO_Add = ref("");
const Product_Detail_Add = ref(""); // Product details for adding new
const Quantity_Product_Add = ref(0); // Product quantity for adding new
const Quantity_Delivered_Add = ref(0); // Delivered quantity for adding new
const Note_Add = ref(""); // Note for adding new

// Khởi tạo các biến ref cho form thêm mới
const Name_Manufacture_Add = ref("");
const Name_Order_Manufacture = ref("");
const Date_Manufacture_Add = ref("");
const Note_Add_Manufacture = ref("");
const Total_Manufacture_Add = ref(0);
const Level_Manufacture_Add = ref(null);

// Quy trình tùy chỉnh (giống DialogAdd ở Page-Manufacture.vue)
const customProcess = ref("");
const customProcessList = ref([]);

// Customer and PO information
const CustomerID = ref(null); // Customer ID from localStorage
const NamePO = ref(null); // PO name from localStorage
const NameCustomer = ref(null); // Customer name from localStorage

// Table states
// const groupBy = [{ key: 'Product_Detail', order: 'asc',  title: "Chi tiết đơn hàng" }]
const Headers = ref([
  { key: "Product_Detail", title: "Chi tiết đơn hàng", width: "20%" },
  { key: "Status", title: "Trạng thái", width: "10%" },
  { key: "Quantity_Product", title: "SL đơn hàng", width: "10%" },
  { key: "Quantity_Delivered", title: "SL đã giao", width: "10%" },
  { key: "Quantity_Amount", title: "SL còn nợ", width: "10%" },
  { key: "Quantity_Manufacture", title: "SL sản xuất", width: "10%" },
  { key: "Percent_Delivered", title: "Tỷ lệ", width: "10%" },
  { key: "Note", title: "Ghi chú", width: "15%" },
  { key: "id", title: "Thao tác", width: "5%" },
]);
const search = ref("");
const itemsPerPage = ref(12);
const page = ref(1);
const requiredRule = (value) => !!value || "Không được để trống";

// ===== USER INFORMATION =====
const LevelUser = localStorage.getItem("LevelUser");
const UserInfo = ref("");
const Date_Expired = ref("");
// ===== LIFECYCLE HOOKS =====
/**
 * Initializes component data from localStorage
 * Retrieves customer ID, PO name, and customer name
 */

onMounted(() => {
  const storedData = localStorage.getItem("CustomersID");
  const storeData = localStorage.getItem("PO");
  const storedsData = localStorage.getItem("Customers");
  CustomerID.value = storedData;
  NamePO.value = storeData;
  NameCustomer.value = storedsData;
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    UserInfo.value = decoded.Username;
    Date_Expired.value = new Date(decoded.exp * 1000);
  } else {
    console.log("Không tìm thấy token!");
    DialogFailed.value = true;
    route.push("/");
  }
});

// ===== COMPUTED =====
const Quantity_Amount_Edit = computed(() => {
  return Quantity_Product_Edit.value - Quantity_Delivered_Edit.value;
});

const Quantity_Amount_Add = computed(() => {
  return Quantity_Product_Add.value - Quantity_Delivered_Add.value;
});

const totalUniquePO = computed(() => {
  if (!detailProjectPO.value) return 0;
  const uniquePOIDs = new Set(detailProjectPO.value.map((item) => item.POID));
  return uniquePOIDs.size;
});

// Lịch giao hàng
const DeliverySchedules = ref([]);

// Methods
const AddDeliveryRow = () => {
  DeliverySchedules.value.push({
    delivery_date: "",
    delivery_quantity: null,
  });
};

const RemoveDeliveryRow = (index) => {
  DeliverySchedules.value.splice(index, 1);
};

const AddDeliveryRowEdit = () => {
  DeliverySchedules_Edit.value.push({
    DeliveryDate: "",
    DeliveryQuantity: null,
  });
};

// Helper: Convert Unix epoch (10 digits) to YYYY-MM-DD
const unixToDateString = (unixTimestamp) => {
  if (!unixTimestamp) return "";
  const date = new Date(unixTimestamp * 1000); // Convert to milliseconds
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: Convert YYYY-MM-DD to Unix epoch (10 digits)
const dateStringToUnix = (dateString) => {
  if (!dateString) return null;
  return Math.floor(new Date(dateString).getTime() / 1000);
};

// Parse DeliverySchedules từ JSON
const getScheduleDeliveries = (item) => {
  if (!item.DeliverySchedules || item.DeliverySchedules === "") return [];
  try {
    const parsed = JSON.parse(`[${item.DeliverySchedules}]`);
    return parsed
      .filter((s) => s && s.id)
      .map((s) => ({
        ...s,
        DeliveryDate: s.DeliveryDate, // Convert to YYYY-MM-DD for display
      }));
  } catch (e) {
    return [];
  }
};

// ===== CRUD OPERATIONS =====
/**
 * Prepares an item for editing by setting up the edit dialog
 * @param {Object} item - The item to edit containing product details and quantities
 */
function GetItem(item) {
  DialogEdit.value = true;
  GetID.value = item.id;
  PO_Edit.value = item.POID;
  Product_Detail_Edit.value = item.Product_Detail;
  Quantity_Product_Edit.value = item.Quantity_Product;
  Quantity_Delivered_Edit.value = item.Quantity_Delivered;
  Quantity_Amount_Edit.value = item.Quantity_Amount;
  Note_Edit.value = item.Note;
  DeliverySchedules_Edit.value = getScheduleDeliveries(item);
  console.log(DeliverySchedules_Edit.value);
}

function GetItemManufacture(item) {
  DialogAddManufacture.value = true;
  NamePO.value = item.POID;
  Name_Manufacture_Add.value = item.PO;
  Name_Order_Manufacture.value = item.Product_Detail;
  Total_Manufacture_Add.value = item.Quantity_Product;
  GetIDManufacture.value = item.id;
}

const GetConfirm = (id) => {
  DialogConfirm.value = true;
  GetIDConfirm.value = id;
};

/**
 * Saves edited item data
 * Makes an API call to update item information
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Product_Detail: Product_Detail_Edit.value,
    Quantity_Product: Quantity_Product_Edit.value,
    Quantity_Delivered: Quantity_Delivered_Edit.value,
    Quantity_Amount: Quantity_Amount_Edit.value,
    Note: Note_Edit.value,
    POID: PO_Edit.value,
  });

  try {
    // Update main item data
    const response = await axios.put(
      `${Url}/Project/Customer/Edit-Item/${GetID.value}`,
      formData
    );

    // Update delivery schedules
    for (const schedule of DeliverySchedules_Edit.value) {
      if (schedule.id) {
        // Update existing schedule
        await axios.put(
          `${Url}/Project/Customer/Edit-Schedule-Delivery/${schedule.id}`,
          {
            DeliveryDate: dateStringToUnix(schedule.DeliveryDate), // Convert to Unix epoch
            DeliveryQuantity: schedule.DeliveryQuantity,
          }
        );
      } else {
        // Add new schedule
        await axios.post(`${Url}/Project/Customer/Add-Schedule-Delivery`, {
          ItemId: GetID.value,
          DeliveryDate: dateStringToUnix(schedule.DeliveryDate), // Convert to Unix epoch
          DeliveryQuantity: schedule.DeliveryQuantity,
        });
      }
    }

    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    Error();
  }
};

/**
 * Saves new item data
 * Makes an API call to create a new item
 */
const SaveAdd = async () => {
  // Validate thông tin chính
  if (
    !PO_Add.value ||
    !Product_Detail_Add.value ||
    !Quantity_Product_Add.value
  ) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Vui lòng điền đầy đủ thông tin chính";
    return;
  }

  DialogLoading.value = true;

  try {
    // Lưu thông tin chính
    const mainData = {
      Product_Detail: Product_Detail_Add.value,
      Quantity_Product: Quantity_Product_Add.value,
      Quantity_Delivered: Quantity_Delivered_Add.value,
      Quantity_Amount: Quantity_Amount_Add.value,
      Note: Note_Add.value,
      POID: PO_Add.value,
      CustomerID: CustomerID.value,
    };

    const mainResponse = await axios.post(
      `${Url}/Project/Customer/Add-Item`,
      mainData
    );

    // Lưu lịch giao hàng vào bảng ScheduleDelivery
    const itemId = mainResponse.data.id;

    for (const schedule of DeliverySchedules.value) {
      await axios.post(`${Url}/Project/Customer/Add-Schedule-Delivery`, {
        ItemId: itemId,
        DeliveryDate: schedule.delivery_date,
        DeliveryQuantity: schedule.delivery_quantity,
      });
    }

    DialogSuccess.value = true;
    MessageDialog.value = "Thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    console.error(error);
  } finally {
    DialogLoading.value = false;
  }
};

const ConfirmItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.put(
      `${Url}/Project/Customer/Confirm-Item/${GetIDConfirm.value}`
    );
    MessageDialog.value = "Xác nhận giao hàng thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Xác nhận giao hàng thất bại";
    Error();
  }
};

/**
 * Removes an item from the system
 * Makes an API call to delete the item
 */
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Project/Customer/Delete-Item/${GetID.value}`
    );
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

const RemoveDeliveryRowEdit = async (index, id) => {
  DeliverySchedules_Edit.value.splice(index, 1);
  try {
    const response = await axios.delete(
      `${Url}/Project/Customer/Delete-Schedule-Delivery/${id}`
    );
    DialogSuccess.value = true;
    MessageDialog.value = "Xoá dữ liệu thành công";
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    console.error(error);
  } finally {
    DialogLoading.value = false;
  }
};

// Hàm lưu thông tin thêm mới
const SaveAddManufacture = async () => {
  DialogLoading.value = true;
  // ✅ Quy tắc sắp xếp ưu tiên
  const processPriority = {
    SMT: 1,
    RW: 99,
    "Thành phẩm": 100,
  };

  // ✅ Gom các quy trình người dùng đã chọn
  const mergedLevels = [
    ...(Array.isArray(Level_Manufacture_Add.value)
      ? Level_Manufacture_Add.value
      : []),
    ...(Array.isArray(customProcessList.value) ? customProcessList.value : []),
  ];

  // ➕ Nếu chưa có "Thành phẩm" thì tự thêm
  if (!mergedLevels.includes("Thành phẩm")) {
    mergedLevels.push("Thành phẩm");
  }

  // ✅ Loại bỏ trùng lặp
  const uniqueLevels = [...new Set(mergedLevels)];

  // ✅ Sắp xếp theo ưu tiên
  const sortedLevels = uniqueLevels.sort((a, b) => {
    const pa = processPriority[a] ?? 50;
    const pb = processPriority[b] ?? 50;

    if (pa === pb) {
      return mergedLevels.indexOf(a) - mergedLevels.indexOf(b);
    }
    return pa - pb;
  });
  const formData = reactive({
    Name: NamePO.value,
    Name_Order: Name_Order_Manufacture.value,
    Date: Date_Manufacture_Add.value,
    Total: Total_Manufacture_Add.value,
    Note: Note_Add_Manufacture.value,
    Creater: UserInfo.value,
    DelaySMT: 10000,
    Quantity: 1,
    Level: sortedLevels,
    ProjectID: GetIDManufacture.value,
  });
  try {
    const response = await axios.post(`${Url}/PlanManufacture/Add`, formData);
    DialogLoading.value = false;
    DialogSuccess.value = true;
    DialogAddManufacture.value = false;
    MessageDialog.value = response.data.message;
  } catch (error) {
    DialogAddManufacture.value = false;
    DialogFailed.value = true;
    DialogLoading.value = false;
    MessageErrorDialog.value = error;
  }
};

// ===== FILE OPERATIONS =====
/**
 * Downloads order data as an Excel file
 * Makes an API call to get the file and triggers download
 */
const DownloadOrder = async () => {
  const NameExcel = `${NameCustomer.value}-${NamePO.value}`;

  try {
    const response = await fetch(
      `${Url}/Project/Customer/Orders/Download/${id}?filename=${encodeURIComponent(
        NameExcel
      )}`
    );
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${NameExcel}.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    MessageDialog.value = "Tải file thành công";
  } catch (error) {
    console.error("Error downloading file:", error);
    MessageErrorDialog.value = "Tải file thất bại";
    Error();
  }
};

// ===== UTILITY FUNCTIONS =====
/**
 * Resets all dialog states and form data
 * Called after successful operations
 */
function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  DialogLoading.value = false;
  DialogConfirm.value = false;
  DialogAddManufacture.value = false;
  GetID.value = "";
  Product_Detail_Add.value = "";
  Quantity_Product_Add.value = "";
  Quantity_Delivered_Add.value = "";
  Quantity_Amount_Add.value = "";

  // Reset các trường thêm mới sản xuất
  Name_Manufacture_Add.value = "";
  Name_Order_Manufacture.value = "";
  Date_Manufacture_Add.value = "";
  Note_Add_Manufacture.value = "";
  Total_Manufacture_Add.value = 0;
  Level_Manufacture_Add.value = null;
  customProcess.value = "";
  customProcessList.value = [];
  DeliverySchedules.value = [];
}

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}

// ===== CUSTOM PROCESS HANDLERS (giống Page-Manufacture.vue) =====
const addCustomProcess = () => {
  if (customProcess.value && customProcess.value.trim()) {
    const processName = customProcess.value.trim();
    if (!customProcessList.value.includes(processName)) {
      customProcessList.value.push(processName);

      if (!Level_Manufacture_Add.value) {
        Level_Manufacture_Add.value = [];
      }
      if (!Level_Manufacture_Add.value.includes(processName)) {
        Level_Manufacture_Add.value.push(processName);
      }
    }
    customProcess.value = "";
  }
};

const removeCustomProcess = (index) => {
  if (index >= 0 && index < customProcessList.value.length) {
    const processName = customProcessList.value[index];
    customProcessList.value.splice(index, 1);
    if (Level_Manufacture_Add.value) {
      const levelIndex = Level_Manufacture_Add.value.indexOf(processName);
      if (levelIndex > -1) {
        Level_Manufacture_Add.value.splice(levelIndex, 1);
      }
    }
  }
};

// Reset danh sách quy trình tùy chỉnh khi đóng dialog
watch(DialogAddManufacture, (newVal) => {
  if (!newVal) {
    customProcess.value = "";
    customProcessList.value = [];
  }
});
</script>
<script>
export default {
  components: {
    ButtonCancel,
    ButtonDownload,
    ButtonSave,
    InputSearch,
    InputField,
    SnackbarSuccess,
    ButtonBack,
    ButtonEdit,
    ButtonAgree,
    ButtonAdd,
    SnackbarFailed,
    Loading,
    InputTextarea,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang=""></style>
