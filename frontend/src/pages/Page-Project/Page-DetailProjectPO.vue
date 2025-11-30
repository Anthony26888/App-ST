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
      <v-card-title class="mb-5">
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
              :value="detailProjectPO?.filter((p) => p.Status === 'Hoàn thành').length || 0"
              icon="mdi-check-circle"
              color="success"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <CardStatistic
              title="Tổng đơn hàng đang sản xuất"
              :value="detailProjectPO?.filter((p) => p.Status === 'Đang sản xuất').length || 0"
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

          <ButtonAdd @add="DialogAdd = true" />
          <!-- <ButtonDownload @download-file="DownloadOrder()" /> -->
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-card-title class="d-flex align-center pe-2" v-else>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-data-table-virtual
          :group-by="[{ key: 'POID' }]"
          v-if="lgAndUp"
          density="comfortable"
          :search="search"
          :items="detailProjectPO"
          :item-p
          :headers="Headers"
          :loading="DialogLoading"
          loading-text="Đang tải dữ liệu..."
          no-data-text="Không có dữ liệu"
          no-results-text="Không tìm thấy kết quả"
          :hover="true"
          :dense="false"
          :fixed-header="true"
          height="69vh"
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

        <v-data-table-virtual
          v-else
          :group-by="[{ key: 'POID' }]"
          density="compact"
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
          height="70vh"
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
  <v-dialog v-model="DialogEdit" width="500">
    <v-card max-width="500" class="rounded-lg">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu
      </v-card-title>
      <v-card-text>
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
        <InputTextarea label="Ghi chú" v-model="Note_Edit" />
      </v-card-text>
      <v-card-actions>
        <ButtonDelete @delete="DialogRemove = true" />
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="DialogAdd" width="500">
    <v-card
      max-width="500"
      class="rounded-lg"
    >
    <v-card-title class="d-flex align-center pa-4">
      <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
      Thêm dữ liệu
    </v-card-title>
      <v-card-text>
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
            />
          </v-col>
        </v-row>
        <InputTextarea label="Ghi chú" v-model="Note_Add" />
      </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog thêm mới dữ liệu -->
  <v-dialog
    :model-value="DialogAddManufacture"
    @update:model-value="DialogAddManufacture = $event"
    width="500"
    scrollable
  >
    <v-card max-width="500" class="overflow-y-auto rounded-lg">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
        Chuyển dữ liệu xuống sản xuất
      </v-card-title>
      <v-card-text>
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
        <!-- <InputSelect
          label="Quy trình"
          :items="[
            'SMT',
            'AOI',
            'IPQC (SMT)',
            'Assembly',
            'IPQC',
            'Test 1',
            'Test 2',
            'Box Build',
            'Tẩm phủ',
            'OQC',
            'RW',
            'Thành phẩm',
          ]"
          multiple
          chips
          hint="Lựa chọn quy trình phù hợp"
          v-model="Level_Manufacture_Add"
          @update:model-value="(val) => (Level_Manufacture_Add = val)"
        /> -->

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
      </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogAddManufacture = false" />
        <ButtonSave @save="SaveAddManufacture()" :disabled="!NamePO || !Name_Order_Manufacture || !Total_Manufacture_Add || !Date_Manufacture_Add" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- Dialog xoá dữ liệu -->
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" class="rounded-lg">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
        Xoá dữ liệu
      </v-card-title>
      <v-card-text> Bạn có chắc chắn muốn xoá đơn hàng này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </v-card>
  </v-dialog>
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
// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== FORM STATES =====
// Current item being processed
const GetID = ref("");
const GetIDManufacture = ref("");

// Edit form states
const PO_Edit = ref("");
const Product_Detail_Edit = ref(""); // Product details for editing
const Quantity_Product_Edit = ref(0); // Product quantity for editing
const Quantity_Delivered_Edit = ref(0); // Delivered quantity for editing
const Note_Edit = ref(""); // Note for editing

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
}

function GetItemManufacture(item) {
  DialogAddManufacture.value = true;
  NamePO.value = item.POID;
  Name_Manufacture_Add.value = item.PO;
  Name_Order_Manufacture.value = item.Product_Detail;
  Total_Manufacture_Add.value = item.Quantity_Product;
  GetIDManufacture.value = item.id;
}

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
    const response = await axios.put(
      `${Url}/Project/Customer/Edit-Item/${GetID.value}`,
      formData
    );
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
  DialogLoading.value = true;
  const formData = reactive({
    Product_Detail: Product_Detail_Add.value,
    Quantity_Product: Quantity_Product_Add.value,
    Quantity_Delivered: Quantity_Delivered_Add.value,
    Quantity_Amount: Quantity_Amount_Add.value,
    Note: Note_Add.value,
    POID: PO_Add.value,
    CustomerID: CustomerID.value,
  });

  try {
    const response = await axios.post(
      `${Url}/Project/Customer/Add-Item`,
      formData
    );
    MessageDialog.value = "Thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
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
