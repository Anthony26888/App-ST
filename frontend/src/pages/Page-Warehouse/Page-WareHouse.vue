<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách tồn kho</v-card-title
    >
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <ButtonImportFile @import-file="Dialog = true" />
          <ButtonImportFile
            color="warning"
            class="ms-2"
            @import-file="DialogOutput = true"
          />
          <ButtonAdd @click="DialogAdd = true" />
          <ButtonDownload @download-file="DownloadWareHouse()" />
          <ButtonHistoryExport
            @history="DialogHistory = true"
            v-if="LevelUser == 'Admin' || LevelUser == 'Thủ kho'"
          />
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ warehouse.length }} linh kiện)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>
        <v-card-text class="overflow-auto">
          <v-data-table
            :headers="Headers"
            :items="warehouse"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
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
            height="calc(100vh - 200px)"
          >
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(warehouse.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
            <template v-slot:item.id="{ value }">
              <div>
                <ButtonEdit
                  @edit="GetItem(value)"
                  v-if="LevelUser == 'Admin' || LevelUser == 'Thủ kho'"
                />
                <ButtonSearch @search="getAccessToken(value)" />
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <v-dialog v-model="Dialog" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
      <v-card-text>
        <InputFiles abel="Thêm File Excel" v-model="File" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="Dialog = false" />
        <ButtonSave @save="ImportFile()" />
      </template>
    </v-card>
  </v-dialog>

  <v-dialog v-model="DialogOutput" width="600">
    <v-card max-width="600" color="#F5F5F5">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-magnify" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu trừ linh kiện
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="DialogOutput = false"
        ></v-btn>
      </v-card-title>
      <v-card-text>
        <div class="d-flex">
          <InputFiles
            label="Thêm File Excel trừ linh kiện"
            v-model="FileOutput"
            :disabled="temporaryWarehouse != ''"
          />
          <v-btn
            class="text-caption ms-2 mt-3"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-send"
            @click="ImportFile_Output()"
            :disabled="temporaryWarehouse != ''"
          >
            Gửi File
          </v-btn>
        </div>
      </v-card-text>
      <template v-slot:actions>
        <p class="text-error ms-2" v-if="temporaryWarehouse != ''">Đang có dữ liệu cần xem trước</p>
        <v-spacer></v-spacer>
        <v-btn
          class="text-caption"
          variant="tonal"
          color="success"
          prepend-icon="mdi-map-search-outline"
          @click="DialogPreview = true"
          >Xem trước</v-btn
        >
      </template>
    </v-card>
  </v-dialog>

  <v-dialog v-model="DialogPreview" width="1200">
    <v-card max-width="1200" color="#F5F5F5">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-magnify" color="primary" class="me-2"></v-icon>
        Kiểm tra dữ liệu sẽ trừ
        <v-spacer></v-spacer>
        <v-btn
          prepend-icon="mdi-check"
          color="success"
          class="text-caption me-2"
          @click="DialogAgree = true"
        >
          Xác nhận
        </v-btn>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="DialogPreview = false"
        ></v-btn>
      </v-card-title>
      <v-card-text class="overflow-auto">
        <v-data-table
          :headers="HeadersFile"
          :items="temporaryWarehouse"
          :search="searchFile"
          :items-per-page="itemsPerPage"
          v-model:page="page"
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
          height="calc(100vh - 320px)"
        >
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(temporaryWarehouse.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>
          <template v-slot:item.Status="{ value }">
            <div>
              <v-chip
                :color="value === 'Đã xác minh' ? 'green' : 'warning'"
                variant="tonal"
                class="text-caption"
              >
                {{ value }}
              </v-chip>
            </div>
          </template>
          <template v-slot:item.id="{ item }">
            <div class="d-flex align-center">
              <ButtonRemove @remove="GetRemove(item)" />
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="DialogAdd" scrollable>
    <v-card width="600" class="mx-auto overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm linh kiện
      </v-card-title>
      <v-card-text>
        <InputField label="Part Number 1" v-model="PartNumber1_Add" />
        <InputField label="Part Number 2" v-model="PartNumber2_Add" />
        <InputTextarea label="Mô tả" v-model="Description_Add" />
        <v-row>
          <v-col>
            <InputField label="Nhập kho" type="number" v-model="Input_Add" />
          </v-col>
          <v-col>
            <InputField label="Xuất kho" type="number" v-model="Output_Add" />
          </v-col>
          <v-col>
            <InputField
              label="Tồn kho"
              type="number"
              disabled
              v-model="inventory_Add"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <InputField label="Vị trí" v-model="Location_Add" />
          </v-col>
          <v-col>
            <InputField label="Khách hàng" v-model="Customer_Add" />
          </v-col>
        </v-row>
        <InputField label="Ghi chú" v-model="Note_Add" />
        <InputField label="Ghi chú xuất" v-model="Note_Output_Add" />
      </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave @save="SaveAdd()" />
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="DialogEdit" width="600" scrollable>
    <v-card width="600" class="mx-auto overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Part Number 1" v-model="PartNumber1_Edit" />
        <InputField label="Part Number 2" v-model="PartNumber2_Edit" />
        <InputTextarea label="Mô tả" v-model="Description_Edit" />
        <v-row>
          <v-col>
            <InputField
              label="Nhập kho"
              type="number"
              v-model="Input_Edit"
              @input="updateInventoryOnOutput"
            />
          </v-col>
          <v-col>
            <InputField
              label="Xuất kho"
              type="number"
              v-model="Output_Edit"
              @input="updateInventoryOnOutput"
            />
          </v-col>
          <v-col>
            <InputField
              disabled
              label="Tồn kho"
              type="number"
              v-model="inventory_Edit"
              :readonly="true"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <InputField label="Vị trí" v-model="Location_Edit" />
          </v-col>
          <v-col>
            <InputField label="Khách hàng" v-model="Customer_Edit" />
          </v-col>
        </v-row>
        <InputField label="Ghi chú" v-model="Note_Edit" />
        <InputField label="Ghi chú xuất" v-model="Note_Output_Edit" />
        <InputSelect
          ref="transactionTypeSelect"
          label="Loại giao dịch"
          :items="['Nhập', 'Xuất','Thay đổi thông tin']"
          v-model="TransactionType_Edit"
          :rules="[(v) => !!v || 'Vui lòng chọn loại giao dịch']"
          required
        />
      </v-card-text>
      <v-card-actions>
        <ButtonDelete @delete="DialogRemove = true" />
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
        Xóa linh kiện
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-1">Bạn có chắc chắn muốn xóa linh kiện này?</div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" class="ms-2" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemoveFile" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
        Xóa linh kiện cần trừ
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-1">Bạn có chắc chắn muốn xóa linh kiện này?</div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogRemoveFile = false" />
        <ButtonDelete @delete="RemoveItemFile()" class="ms-2" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogAgree" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-check" color="success" class="me-2"></v-icon>
        Xác nhận trừ linh kiện
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-1">
          Bạn có chắc chắn muốn trừ tồn kho những linh kiện này?
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogAgree = false" />
        <ButtonAgree @agree="UpdateFile_Output()" class="ms-2" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogInfo" width="800" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
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

      <v-card-text class="pa-4">
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

  <v-dialog v-model="DialogHistory" width="1200" scrollable>
    <v-card class="overflow-y-auto" color="#F5F5F5">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-history" color="primary" class="me-2"></v-icon>
        Lịch sử xuất nhập linh kiện
        <v-spacer></v-spacer>
        <InputSearch v-model="searchLog" />
        <v-btn
          icon="mdi-close"
          variant="text"
          class="ms-2"
          @click="DialogHistory = false"
        ></v-btn>
      </v-card-title>

      <v-card-text class="overflow-auto">
        <v-data-table
          :headers="HeadersHistoryLog"
          :items="warehouseLog"
          :search="searchLog"
          :items-per-page="itemsPerPage"
          v-model:page="page"
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
          height="calc(100vh - 320px)"
        >
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(warehouseLog.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>
          <template v-slot:item.ActionType="{ value }">
            <div>
              <v-chip
                :color="value === 'Xuất' ? 'warning' : 'success'"
                variant="tonal"
                class="text-caption"
              >
                {{ value }}
              </v-chip>
            </div>
          </template>
          <template v-slot:item.id="{ item }">
            <div class="d-flex align-center">
              <ButtonRemove @remove="GetRemove(item)" />
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>

  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarCaution v-model="DialogCaution" :message="MessageCautionDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Buffer } from "buffer";
import { jwtDecode } from "jwt-decode";

// Composables
import { useWareHouse } from "@/composables/Warehouse/useWareHouse";
import { useTemporaryWareHouse } from "@/composables/Warehouse/useTemporaryWareHouse";
import { useWareHouseLog } from "@/composables/Warehouse/useWareHouseLog";

// Components
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonRemove from "@/components/Button-Remove.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonHistoryExport from "@/components/Button-History-Export.vue";
import ButtonSearch from "@/components/Button-Search.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputSelect from "@/components/Input-Select.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import SnackbarCaution from "@/components/Snackbar-Caution.vue";
import Loading from "@/components/Loading.vue";

// ===== STATE MANAGEMENT =====
// Initialize composables and router
const { warehouse } = useWareHouse();
const { temporaryWarehouse } = useTemporaryWareHouse();
const { warehouseLog, warehouseLogError } = useWareHouseLog();
const router = useRouter();

// API Configuration
const Url = import.meta.env.VITE_API_URL;
const clientId = import.meta.env.VITE_DIGIKEY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_DIGIKEY_CLIENT_SECRET;

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const Dialog = ref(false); // Import file dialog
const DialogOutput = ref(false); // Import file dialog
const DialogPreview = ref(false); // Preview table
const DialogAgree = ref(false); // Agree file
const DialogEdit = ref(false); // Edit item dialog
const DialogRemove = ref(false); // Remove item confirmation dialog
const DialogRemoveFile = ref(false); // Remove item from Temporary warehouse
const DialogSuccess = ref(false); // Success notification
const DialogFailed = ref(false); // Error notification
const DialogAdd = ref(false); // Add new item dialog
const DialogInfo = ref(false); // Product info dialog
const DialogCaution = ref(false); // Warning notification
const DialogLoading = ref(false); // Loading state
const DialogHistory = ref(false); // History import, export in warehouse

// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");
const MessageCautionDialog = ref("");

// ===== TABLE CONFIGURATION =====
// Define table headers and their properties
const Headers = ref([
  {
    key: "Description",
    sortable: false,
    title: "Mô tả",
    width: "200px",
    noWrap: true,
  },
  { key: "PartNumber_1", title: "Mã hàng 1", width: "150px", noWrap: true },
  { key: "PartNumber_2", title: "Mã hàng 2", width: "150px", noWrap: true },
  { key: "Input", title: "SL Nhập", width: "100px", noWrap: true },
  { key: "Output", title: "SL Xuất", width: "100px", noWrap: true },
  { key: "Inventory", title: "SL Tồn kho", width: "100px", noWrap: true },
  { key: "Location", title: "Vị trí", width: "100px", noWrap: true },
  { key: "Customer", title: "Mã kho", width: "100px", noWrap: true },
  { key: "Note", title: "Ghi chú", width: "150px", noWrap: true },
  { key: "Note_Output", title: "Ghi chú xuất", width: "150px", noWrap: true },
  { key: "id", title: "Thao tác", width: "100px", noWrap: true },
]);

const HeadersFile = ref([
  {
    key: "Description",
    sortable: false,
    title: "Mô tả",
    width: "200px",
    noWrap: true,
  },
  { key: "PartNumber_1", title: "Mã hàng", width: "150px", noWrap: true },
  { key: "Location_1", title: "Vị trí file", width: "100px", noWrap: true },
  { key: "Location_2", title: "Vị trí kho", width: "100px", noWrap: true },
  { key: "Status", title: "Trạng thái", width: "100px", noWrap: true },
  { key: "Input", title: "SL Nhập", noWrap: true },
  { key: "Inventory", title: "SL Tồn kho", noWrap: true },
  { key: "Quantity_Amount", title: "SL sau trừ", noWrap: true },
  { key: "Note", title: "Ghi chú", width: "150px", noWrap: true },
  { key: "id", title: "Thao tác", noWrap: true },
]);

const HeadersHistoryLog = ref([
  { key: "PartNumber", title: "Mã hàng", width: "150px", noWrap: true },
  { key: "Customer", title: "Mã kho", width: "150px", noWrap: true },
  { key: "Location", title: "Vị trí", width: "150px", noWrap: true },
  { key: "ActionType", title: "Trạng thái", width: "150px", noWrap: true },
  { key: "Quantity", title: "Số lượng", width: "100px", noWrap: true },
  { key: "Updated_by", title: "Người thực hiện", width: "100px", noWrap: true },
  { key: "Created_at", title: "Ngày cập nhật", width: "100px", noWrap: true },
]);

const search = ref("");
const searchLog = ref("");
const itemsPerPage = ref(15);
const page = ref(1);

// ===== FORM STATES =====
// File upload state
const File = ref(null);
const FileOutput = ref(null);

// Edit form states
const PartNumber1_Edit = ref("");
const PartNumber2_Edit = ref("");
const Description_Edit = ref("");
const Input_Edit = ref("");
const Output_Edit = ref("");
// const inventory_Edit = ref("");
const Location_Edit = ref("");
const Customer_Edit = ref("");
const Note_Edit = ref("");
const Note_Output_Edit = ref("");
const TransactionType_Edit = ref("");
const inventory_Temporary = ref(0);
// Add form states
const PartNumber1_Add = ref("");
const PartNumber2_Add = ref("");
const Description_Add = ref("");
const Input_Add = ref(0);
const Output_Add = ref(0);
const Location_Add = ref("");
const Customer_Add = ref("");
const Note_Add = ref("");
const Note_Output_Add = ref("");

//History
const NameItem = ref("");

// User information
const UserInfo = ref("");

// ===== DIGIKEY API STATES =====
// States for DigiKey API integration
const GetID = ref("");
const GetIDRemove = ref("");
const GetDigikey = ref("");
const accessToken = ref(null);
const tokenType = ref(null);
const expires_in = ref(null);
const ResultSearch = ref(null);

// ===== COMPONENT REFS =====
const transactionTypeSelect = ref(null);

// ===== User Information =====
const LevelUser = localStorage.getItem("LevelUser");
onMounted(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    UserInfo.value = decoded.Username;
  } else {
    console.log("Không tìm thấy token!");
  }
});

const formattedSelectedDate = computed(() => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
});

// ===== CRUD OPERATIONS =====
/**
 * Fetches and populates item data for editing
 * @param {string} value - The ID of the item to edit
 */
const GetItem = (value) => {
  DialogEdit.value = true;
  GetID.value = value;
  const found = warehouse.value.find((v) => v.id === value);
  PartNumber1_Edit.value = found.PartNumber_1;
  PartNumber2_Edit.value = found.PartNumber_2;
  Description_Edit.value = found.Description;
  Input_Edit.value = found.Input;
  Output_Edit.value = found.Output;
  Location_Edit.value = found.Location;
  Customer_Edit.value = found.Customer;
  Note_Edit.value = found.Note;
  Note_Output_Edit.value = found.Note_Output_Edit;
  TransactionType_Edit.value = found.TransactionType;
  inventory_Temporary.value = found.Input - found.Output
};

const GetRemove = (item) => {
  DialogRemoveFile.value = true;
  GetIDRemove.value = item.id;
};

// ==== COMPUTED ======
const inventory_Add = computed(() => {
  return Input_Add.value - Output_Add.value;
});
const inventory_Edit = computed(() => {
  return Input_Edit.value - Output_Edit.value;
});
const inventory = computed(() => {
  return Math.abs(inventory_Edit.value - inventory_Temporary.value)
});
/**
 * Updates inventory count based on input and output values
 * @param {Event} event - The input event containing the new value
 */

/**
 * Saves edited item data to the server
 */
const SaveEdit = async () => {
  // Trigger validation on the InputSelect component
  if (transactionTypeSelect.value) {
    const isValid = await transactionTypeSelect.value.validate();
    if (!isValid) {
      return;
    }
  }
  
  if (!TransactionType_Edit.value) {
    MessageErrorDialog.value = "Vui lòng chọn loại giao dịch";
    DialogFailed.value = true;
    return;
  }
  DialogLoading.value = true;
  const formData = {
    PartNumber1_Edit: PartNumber1_Edit.value,
    PartNumber2_Edit: PartNumber2_Edit.value,
    Description_Edit: Description_Edit.value,
    Input_Edit: Input_Edit.value,
    Output_Edit: Output_Edit.value,
    inventory_Edit: inventory_Edit.value,
    Location_Edit: Location_Edit.value,
    Customer_Edit: Customer_Edit.value,
    Note_Edit: Note_Edit.value,
    Note_Output_Edit: Note_Output_Edit.value,
    TransactionType_Edit: TransactionType_Edit.value,
  };
  try {
    const response = await axios.put(
      `${Url}/WareHouse/update-item/${GetID.value}`,
      formData
    );
    console.log(response);
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    Reset();
    SaveLog();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    Error();
  }
};

/**
 * Saves new item data to the server
 */
const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = {
    Description: Description_Add.value,
    PartNumber_1: PartNumber1_Add.value,
    PartNumber_2: PartNumber2_Add.value,
    Input: Input_Add.value,
    Output: Output_Add.value,
    Inventory: inventory_Add.value,
    Location: Location_Add.value,
    Customer: Customer_Add.value,
    Note: Note_Add.value,
    Note_Output: Note_Output_Add.value,
  };
  try {
    const response = await axios.post(
      `${Url}/WareHouse/upload-new-item`,
      formData
    );
    console.log(response);
    MessageDialog.value = "Thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    Error();
  }
};

/**
 * Removes an item from the warehouse
 */
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/WareHouse/delete-item/${GetID.value}`
    );
    console.log(response);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

// Delete item in Temporary_WareHouse when do not match value in WareHouse
const RemoveItemFile = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Temporary-WareHouse/delete-item/${GetIDRemove.value}`
    );
    console.log(response);
    MessageDialog.value = "Xoá dữ liệu thành công";
    DialogSuccess.value = true
    DialogLoading.value = false
    DialogRemoveFile.value = false
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    DialogFailed.value = true
    DialogLoading.value = false
    DialogRemoveFile.value = false
  }
};

// Delete all item in Temporary_WareHouse table when already update WareHouse table
const RemoveAllFile = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Temporary-WareHouse/delete-all`
    );
    console.log(response);
  } catch (error) {
    console.log(error);
  }
};

// ===== FILE OPERATIONS =====
/**
 * Imports warehouse data from an Excel file
 */
const ImportFile = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", File.value);
  try {
    const response = await axios.post(`${Url}/WareHouse/Upload`, formData);
    console.log(response);
    MessageDialog.value = "Thêm dữ liệu thành công";
    Save_Import_File_Output()
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    Error();
  }
};

// Import File excel include item wanna export in WareHouse table
const ImportFile_Output = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", FileOutput.value);
  try {
    const response = await axios.post(
      `${Url}/Temporary_WareHouse/Upload`,
      formData
    );
    console.log(response);
    MessageDialog.value = "Thêm dữ liệu thành công";
    DialogSuccess.value = true;
    DialogLoading.value = false
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    Error();
  }
};

// Update value in WareHouse with Output and Note_Output
const UpdateFile_Output = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.put(`${Url}/Temporary_WareHouse/Update-File`);
    console.log(response);
    MessageDialog.value = "Đã trừ dữ liệu thành công";
    RemoveAllFile();
    Save_Export_File_Output();
    Reset()
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Trừ dữ liệu thất bại";
    Error();
  }
};

const SaveLog = async () => {
  const formData = {
    ActionType: TransactionType_Edit.value,
    PartNumber: PartNumber1_Edit.value,
    Quantity: inventory.value,
    Updated_by: UserInfo.value,
    Created_at: formattedSelectedDate.value,
    Customer: Customer_Edit.value,
    Location: Location_Edit.value
  };
  try {
    const response = await axios.post(
      `${Url}/WareHouse/Log/add-new-item`,
      formData
    );
    console.log(response);
  } catch (error) {
    console.log(error);
  }
};

// Import File excel include item wanna export in WareHouse table
const Save_Export_File_Output = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", FileOutput.value);
  formData.append("Updated_by", UserInfo.value); // Add Updated_by
  formData.append("Created_at", formattedSelectedDate.value); // Add Created_at
  try {
    const response = await axios.post(
      `${Url}/WarHouseLog/Upload-File-Export`,
      formData
    );
    console.log(response);
  } catch (error) {
    console.log(error);
  }
};

// Import File excel include item wanna export in WareHouse table
const Save_Import_File_Output = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", File.value);
  formData.append("Updated_by", UserInfo.value); // Add Updated_by
  formData.append("Created_at", formattedSelectedDate.value); // Add Created_at
  try {
    const response = await axios.post(
      `${Url}/WarHouseLog/Upload-File-Import`,
      formData
    );
    console.log(response);
  } catch (error) {
    console.log(error);
  }
};

/**
 * Downloads warehouse data as an Excel file
 */
const DownloadWareHouse = async () => {
  try {
    const response = await fetch(`${Url}/Ware-House/download`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Kho.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
    MessageErrorDialog.value = "Lỗi tải file";
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
  const found = warehouse.value.find((v) => v.id === value);
  GetDigikey.value = found.PartNumber_1;

  const tokenUrl = "https://api.digikey.com/v1/oauth2/token";
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);           // <-- Bổ sung
  params.append("client_secret", clientSecret);   // <-- Bổ sung

  try {
    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    accessToken.value = response.data.access_token;
    tokenType.value = response.data.token_type;
    expires_in.value = response.data.expires_in;

    console.log("Đã lấy access token thành công:", accessToken.value);

    if (accessToken.value && tokenType.value && GetDigikey.value) {
      return await searchProduct();
    }

    return true;
  } catch (error) {
    console.error(
      "Lỗi khi lấy access token:",
      error.response ? error.response.data : error.message
    );
    MessageErrorDialog.value = "Lỗi khi lấy access token";
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
      return (DialogInfo.value = true), Reset();
    }
    return response.data;
  } catch (error) {
    console.error(
      "Lỗi khi tìm kiếm sản phẩm:",
      error.response ? error.response.data : error.message,
      (DialogCaution.value = true),
      (DialogLoading.value = false)
    );
    MessageErrorDialog.value = "Lỗi khi tìm kiếm sản phẩm";
    return null;
  }
};

// ===== UTILITY FUNCTIONS =====
/**
 * Resets all form states and dialogs
 */
function Reset() {
  DialogEdit.value = false;
  DialogSuccess.value = true;
  DialogRemove.value = false;
  DialogAdd.value = false;
  Dialog.value = false;
  DialogOutput.value = false;
  DialogRemoveFile.value = false;
  DialogAgree.value = false;
  DialogLoading.value = false;
  DialogCaution.value = false;
  DialogPreview.value = false;
  DialogOutput.value = false;

  PartNumber1_Add.value = ref("");
  PartNumber2_Add.value = ref("");
  Description_Add.value = ref("");
  Input_Add.value = ref("");
  Output_Add.value = ref("");
  inventory_Add.value = ref("");
  Location_Add.value = ref("");
  Customer_Add.value = ref("");
  Note_Add.value = ref("");
  Note_Output_Add.value = ref("");
  File.value = null;
  FileOutput.value = null;
}

/**
 * Handles error states and resets loading
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
  DialogCaution.value = false;
  DialogSuccess.value = false;
  DialogOutput.value = false;
  DialogRemoveFile.value = false;
  DialogAgree.value = false;
  Dialog.value = false;
  File.value = null;
  FileOutput.value = null;
  FileOutput.value = null;
  DialogPreview.value = false;
  DialogOutput.value = false;
}
</script>
<script>
export default {
  components: {
    InputField,
    InputTextarea,
    ButtonDelete,
    ButtonCancel,
    ButtonDownload,
    ButtonImportFile,
    ButtonSave,
    ButtonAdd,
    InputSearch,
    InputFiles,
    SnackbarSuccess,
    SnackbarFailed,
    SnackbarCaution,
    ButtonSearch,
    Loading,
    ButtonHistoryExport,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang=""></style>
