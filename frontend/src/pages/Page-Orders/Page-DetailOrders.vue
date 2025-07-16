<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Don-hang" />
      <p class="text-h4 font-weight-light ms-3">Chi tiết đơn hàng</p>
    </v-card-title>
    <v-card-text>
      <v-card variant="text">
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

        <v-data-table
          :search="search"
          :items="compare"
          :headers="Headers"
          :items-per-page="itemsPerPage"
          v-model:page="page"
          :loading="DialogLoading"
          loading-text="Đang tải dữ liệu..."
          no-data-text="Không có dữ liệu"
          no-results-text="Không tìm thấy kết quả"
          :hover="true"
          :dense="false"
          :fixed-header="true"
          height="calc(100vh - 200px)"
        >
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(compare.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>

          <template v-slot:item.Sửa="{ value }">
            <div class="d-flex">
              <ButtonEdit @edit="GetItem(value)" />
            </div>
          </template>
          <template v-slot:item.SL_Tổng="{ value }">
            <v-chip variant="tonal" color="success" label >
              {{ value }}
            </v-chip>
          </template>

          <template v-slot:item.SL_Tồn_Kho="{ value }">
            <v-chip variant="tonal" color="primary" v-if="value !== null" label>
              {{ value }}
            </v-chip>
          </template>

          <template v-slot:item.SL_Tồn_Kho_Misa="{ value }">
            <v-chip variant="tonal" color="warning" v-if="value !== null" label>
              {{ value }}
            </v-chip>
          </template>

          <template v-slot:item.Số_Lượng_Cần_Mua="{ value }">
            {{ value }}
          </template>

          <template v-slot:item.Số_Lượng_Cần_Mua_Misa="{ value }">
            {{ value }}
          </template>

        </v-data-table>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="600" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <InputSelect label="Mã Kho" v-model="Ma_Kho" :items="Customer" />
          </v-col>
          <v-col>
            <InputField disabled v-model="SL_Ton_Kho"/>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <InputSelect label="Mã Kho Misa" v-model="Ma_Kho_Misa" :items="Customer_Misa" />
          </v-col>
          <v-col>
            <InputField disabled v-model="SL_Ton_Kho_Misa"/>
          </v-col>
        </v-row>
        
        
        <!-- <InputField label="Hao phí thực tế" v-model="ActualCost" /> -->
      </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogAccept" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-check" color="success" class="me-2"></v-icon>
        Kho xác nhận dữ liệu
      </v-card-title>
      <v-card-text> Bạn có chắc chắn muốn xác nhận dữ liệu? </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogAccept = false" />
        <ButtonAgree @agree="WareHouseAcceptWareHouse();WareHouse2AcceptWareHouse()" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogInfo" width="800" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center">
        <v-icon
          icon="mdi-information-variant-circle"
          color="primary"
          class="me-2"
        ></v-icon>
        Thông số kỹ thuật
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="DialogInfo = false"
        ></v-btn>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col>
            <v-img :src="ResultSearch.Product.PhotoUrl"></v-img>
          </v-col>
          <v-col>
            <v-list-item density="comfortable" lines="two">
              <template v-slot:title>
                <strong class="text-h6">
                  {{ ResultSearch.Product.ManufacturerProductNumber }}
                </strong>
              </template>
            </v-list-item>

            <v-table class="text-caption" density="compact">
              <tbody>
                <tr>
                  <td><strong>Datasheet</strong></td>
                  <td>
                    <v-btn
                      size="small"
                      prepend-icon="mdi-database-arrow-right"
                      :href="ResultSearch.Product.DatasheetUrl"
                      target="_blank"
                      color="primary"
                      variant="tonal"
                      class="text-caption"
                    >
                      Datasheet
                    </v-btn>
                  </td>
                </tr>
                <tr
                  v-for="item in ResultSearch.Product.Parameters"
                  :key="item.name"
                >
                  <td>
                    <strong>{{ item.ParameterText }}</strong>
                  </td>
                  <td>{{ item.ValueText }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <SnackbarCaution v-model="DialogCaution" :message="MessageCautionDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { jwtDecode } from "jwt-decode";
import { Buffer } from "buffer";
import emailjs from "@emailjs/browser";

// Composables
import { useDetailOrder } from "@/composables/Orders/useDetailOrder";
import { useWareHouseFind } from "@/composables/Warehouse/useWareHouseFind";
import { useWareHouse2Find } from "@/composables/Warehouse/useWareHouse2Find";
import { useUsers } from "@/composables/Settings/useUsers";
import { useOrders } from "@/composables/Orders/useOrders";

// Components
import InputSearch from "@/components/Input-Search.vue";
import InputSelect from "@/components/Input-Select.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// ===== STATE MANAGEMENT =====
// Route and API Configuration
const route = useRoute();
const id = route.params.id;
const Url = import.meta.env.VITE_API_URL;

// Initialize composables
const PartNumber_1 = ref("");
const { orders } = useOrders();
const { users } = useUsers();
const { compare, compareError, headers } = useDetailOrder(id);
const { WareHouseFind, WareHouseFindError } = useWareHouseFind(PartNumber_1);
const { WareHouse2Find, WareHouse2FindError } = useWareHouse2Find(PartNumber_1);
console.log(compare)

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogEdit = ref(false);      // Edit item dialog
const DialogAccept = ref(false);    // Accept confirmation dialog
const DialogSuccess = ref(false);   // Success notification
const DialogFailed = ref(false);    // Error notification
const DialogLoading = ref(false);   // Loading state
const DialogCaution = ref(false);   // Warning notification
const DialogInfo = ref(false);      // Product info dialog

// ===== FORM STATES =====
// Item data states

const NamePO = ref("");
const GetID = ref("");
const Ma_Kho = ref("");
const Ma_Kho_Misa = ref("");
const Customer = ref([]);
const Customer_Misa = ref([]);
const SL_Ton_Kho = ref(0);
const SL_Ton_Kho_Misa = ref(0);

const UserInfo = ref("");
const ActualCost = ref("");
const GetDigikey = ref("");
const search = ref("");
const itemsPerPage = ref(15);
const page = ref(1);

// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");
const MessageCautionDialog = ref("");

// ===== TABLE CONFIGURATION =====
const Headers = ref([]);

// ===== DIGIKEY API CONFIGURATION =====
const clientId = import.meta.env.VITE_DIGIKEY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_DIGIKEY_CLIENT_SECRET;
const accessToken = ref(null);
const tokenType = ref(null);
const expires_in = ref(null);
const ResultSearch = ref(null);

// ===== EMAIL CONFIGURATION =====
const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// ===== COMPUTED PROPERTIES =====
/**
 * Computes the status of the current order
 * @returns {number|null} The status of the order or null if not found
 */
const status = computed(() => {
  if (!orders.value || !Array.isArray(orders.value)) return null;
  const found = orders.value.find((v) => v.Name_PO === route.params.id);
  return found ? found.Status : null;
});
const formattedSelectedDate = computed(() => {
  const date = new Date();
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
});

// ===== LIFECYCLE HOOKS =====
/**
 * Initialize component data on mount
 * Sets up user info and PO data from localStorage
 */
onMounted(() => {
  const storeData = localStorage.getItem("PO");
  NamePO.value = storeData;
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    UserInfo.value = decoded.Username;
  } else {
    console.log("Không tìm thấy token!");
  }
});



// ===== WATCHERS =====
/**
 * Watch for changes in compare data to regenerate table headers
 */
watch(
  compare,
  (newBomData) => {
    console.log("checkBOM changed, generating headers with:", newBomData);
    generateHeaders(newBomData);
  },
  { deep: true }
);

/**
 * Watch for changes in WareHouseFind data to update Customer options
 */
watch(WareHouseFind, (newData) => {
  if (newData && newData.length > 0) {
    Customer.value = newData.map(item => item.Customer);
    // Find the stock quantity for the selected warehouse
    const selectedWarehouse = newData.find((item) => item.Customer === Ma_Kho.value);
    SL_Ton_Kho.value = selectedWarehouse ? selectedWarehouse.SL_Ton_Kho || 0 : 0;
  }
}, { immediate: true });

/**
 * Watch for changes in Ma_Kho to update SL_Ton_Kho
 */
watch(Ma_Kho, (newValue) => {
  if (WareHouseFind.value && WareHouseFind.value.length > 0) {
    const selectedWarehouse = WareHouseFind.value.find((item) => item.Customer === newValue);
    SL_Ton_Kho.value = selectedWarehouse ? selectedWarehouse.SL_Ton_Kho || 0 : 0;
  }
});

/**
 * Watch for changes in WareHouse2Find data to update Customer_Misa options
 */
watch(WareHouse2Find, (newData) => {
  if (newData && newData.length > 0) {
    Customer_Misa.value = newData.map(item => item.Customer);
    // Find the stock quantity for the selected warehouse
    const selectedWarehouse2 = newData.find((item) => item.Customer === Ma_Kho_Misa.value);
    SL_Ton_Kho_Misa.value = selectedWarehouse2 ? selectedWarehouse2.SL_Ton_Kho_Misa || 0 : 0;
  }
}, { immediate: true });

watch(Ma_Kho_Misa, (newValue) => {
  if (WareHouse2Find.value && WareHouse2Find.value.length > 0) {
    const selectedWarehouse2 = WareHouse2Find.value.find((item) => item.Customer === newValue);
    SL_Ton_Kho_Misa.value = selectedWarehouse2 ? selectedWarehouse2.SL_Ton_Kho_Misa || 0 : 0;
  }
});


// ===== TABLE OPERATIONS =====
/**
 * Generates table headers based on BOM data structure
 * @param {Array} bomData - The BOM data array
 */
function generateHeaders(bomData) {
  if (bomData && bomData.length > 0) {
    const firstItemKeys = Object.keys(bomData[0]);
        // Remove the last 4 headers
    const filteredKeys = firstItemKeys;
    Headers.value = filteredKeys.map((key) => ({
      title: key.replace(/_/g, " "),
      key: key,
      sortable: true,
      width: 200,
    }));
  } else {
    console.log("No data to generate headers, clearing headers.");
    Headers.value = [];
  }
}

// ===== CRUD OPERATIONS =====
/**
 * Fetches and populates item data for editing
 * @param {string} value - The ID of the item to edit
 */
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = compare.value.find((v) => v.Sửa === value);
  console.log(value)
  if (found) {
    PartNumber_1.value = found.PartNumber_1;
    ActualCost.value = found.Hao_Phi_Thực_Tế;
    Ma_Kho.value = found.Mã_Kho;
    Ma_Kho_Misa.value = found.Mã_Kho_Misa;
  }
}

/**
 * Saves edited item data
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = {
    Input_Hao_Phi_Thuc_Te: ActualCost.value,
    Ma_Kho: Ma_Kho.value,
    Ma_Kho_Misa: Ma_Kho_Misa.value,
    PartNumber_1: PartNumber_1.value,
    PO: id,
  };

  try {
    const response = await axios.put(`${Url}/DetailOrders/Update`, formData);
    console.log(response);
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    Error();
  }
};

// ===== WAREHOUSE OPERATIONS =====
/**
 * Updates warehouse inventory for the current order
 */
const WareHouseAcceptWareHouse = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.put(`${Url}/WareHouse/update-Inventory-CheckBom/${id}`);
    console.log(response);
    WareHouseAccept();
    WareHouseLog();
  } catch (error) {
    console.log(error);
    Error();
  }
};

const WareHouseLog = async () => {
  DialogLoading.value = true;
  const formData = {
    Updated_by: UserInfo.value,
    Created_at: formattedSelectedDate.value
  };
  try {
    const response = await axios.post(`${Url}/insert-log/${id}`, formData);
    console.log(response);
  } catch (error) {
    console.log(error);
    Error();
  }
};

/**
 * Updates warehouse2 inventory for the current order
 */
const WareHouse2AcceptWareHouse = async () => {
  DialogLoading.value = true;

  try {
    const response = await axios.put(`${Url}/WareHouse2/update-Inventory-CheckBom/${id}`);
    console.log(response);
    WareHouseAccept();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Xác nhận dữ liệu thất bại";
    Error();
  }
};

/**
 * Finalizes warehouse acceptance of the order
 */
const WareHouseAccept = async () => {
  try {
    const response = await axios.put(`${Url}/Orders/WareHouse-Accept/${id}`);
    console.log(response);
    await sendEmail();
    Reset();
    MessageDialog.value = "Xác nhận dữ liệu thành công";
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Xác nhận dữ liệu thất bại";
    Error();
  }
};

// ===== FILE OPERATIONS =====
/**
 * Downloads order data as an Excel file
 */
const DownloadOrder = async () => {
  try {
    const response = await fetch(`${Url}/Download-Order/${id}`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    MessageErrorDialog.value = "Tải file thất bại";
    console.error("Error downloading file:", error);
    Error();
  }
};

// ===== DIGIKEY API OPERATIONS =====
/**
 * Gets access token from DigiKey API
 * @param {string} value - The ID of the item to search
 */
const getAccessToken = async (value) => {
  DialogLoading.value = true;
  const found = compare.value.find((v) => v.Sửa === value);
  GetDigikey.value = found.PartNumber_1;
  const authString = Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf-8"
  ).toString("base64");
  const tokenUrl = "https://api.digikey.com/v1/oauth2/token";
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  try {
    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authString}`,
      },
    });
    accessToken.value = response.data.access_token;
    tokenType.value = response.data.token_type;
    expires_in.value = response.data.expires_in;
    if (accessToken.value && tokenType.value && GetDigikey.value) {
      return searchProduct();
    }
    console.log("Đã lấy access token thành công:", accessToken);
    return true;
  } catch (error) {
    console.error(
      "Lỗi khi lấy access token:",
      error.response ? error.response.data : error.message
    );
    MessageErrorDialog.value = "Lấy access token thất bại";
    return false;
  }
};

/**
 * Searches for product details using DigiKey API
 */
const searchProduct = async () => {
  if (!accessToken.value) {
    console.error("Chưa có access token. Vui lòng lấy token trước.");
    return;
  }

  const searchUrl = `https://api.digikey.com/products/v4/search/${GetDigikey.value}/productdetails`;

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        Authorization: `${tokenType.value} ${accessToken.value}`,
        "Content-Type": "application/json",
        "X-DIGIKEY-Client-Id": `${clientId}`,
      },
    });
    ResultSearch.value = response.data;
    MessageDialog.value = "Tìm kiếm sản phẩm thành công";
    if (ResultSearch.value) {
      DialogInfo.value = true;
      Reset();
      return;
    }
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi khi tìm kiếm sản phẩm:",
      error.response ? error.response.data : error.message
    );
    MessageErrorDialog.value = "Tìm kiếm sản phẩm thất bại";
    DialogCaution.value = true;
    DialogLoading.value = false;
    return null;
  }
};

// ===== EMAIL OPERATIONS =====
/**
 * Sends email notification about order status
 */
const sendEmail = async () => {
  DialogLoading.value = true;
  const found = users.value.find((v) => v.Username === UserInfo.value);
  const foundAccept = users.value.find((v) => v.Username === localStorage.getItem("Creater_Order"));
  
  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        toName: foundAccept.FullName,
        fromName: found.FullName,
        message: `Đơn hàng ${route.params.id} đã được bộ phận kho xác nhận hoàn tất kiểm tra.`,
        email: foundAccept.Email,
        level: found.Level,
      },
      publicKey
    );
    console.log("SUCCESS!", response.status, response.text);
    MessageDialog.value = "Gửi email thành công";
    Reset();
  } catch (error) {
    console.error("FAILED...", error);
    MessageErrorDialog.value = "Gửi email thất bại";
    Error();
  }
};

// ===== UTILITY FUNCTIONS =====
/**
 * Resets all dialog states and shows success notification
 */
function Reset() {
  DialogEdit.value = false;
  DialogLoading.value = false;
  DialogSuccess.value = true;
  DialogAccept.value = false;
  DialogInfo.value = false;
  DialogFailed.value = false;
  DialogCaution.value = false;
}

/**
 * Handles error states and resets dialogs
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
  DialogAccept.value = false;
  DialogInfo.value = false;
  DialogCaution.value = false;
  DialogEdit.value = false;
  DialogSuccess.value = false;
}
</script>

<script>
/**
 * Component Configuration
 * Defines component registration and default data
 */
export default {
  // Register child components
  components: {
    ButtonCancel,
    ButtonDownload,
    ButtonSave,
    InputSearch,
    InputSelect,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    ButtonBack,
    ButtonEdit,
    ButtonAgree,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>

<style lang=""></style>
