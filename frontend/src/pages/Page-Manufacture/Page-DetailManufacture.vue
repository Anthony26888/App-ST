<template>
  <div>
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light">
        <ButtonBack to="/san-xuat" />
        Theo dõi sản xuất</v-card-title
      >
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
        {{ NameManufacture }}
      </v-card-title>

      <v-card-text>
        <v-snackbar
          v-model="showStatusSnackbar"
          :color="connectionStatusColor"
          :timeout="3000"
          location="bottom"
        >
          {{ connectionStatusMessage }}
        </v-snackbar>

        <!-- Production Statistics Cards -->
        <v-card elevation="2" class="mx-auto rounded-xl">
          <v-row class="">
            <v-col cols="12" sm="4">
              <v-card class="mx-auto" variant="text">
                <v-card-text>
                  <div class="text-h6 mb-2">Đầu vào</div>
                  <div class="text-h4 font-weight-bold text-error">
                    {{ totalInput }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Tổng số lượng đầu vào
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-divider inset vertical></v-divider>
            <v-col cols="12" sm="4">
              <v-card class="mx-auto" variant="text">
                <v-card-text>
                  <div class="text-h6 mb-2">Đầu ra</div>
                  <div class="text-h4 font-weight-bold text-success">
                    {{ totalOQC }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Tổng số lượng đầu ra
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-divider inset vertical></v-divider>
            <v-col cols="12" sm="4">
              <v-card class="mx-auto" variant="text">
                <v-card-text>
                  <div class="text-h6 mb-2">Tỷ lệ</div>
                  <div class="text-h4 font-weight-bold text-primary">
                    {{ percent }} %
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Phần trăm số lượng đầu ra
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card>

        <v-row class="mb-4 mt-2" cols="auto">
          <v-col cols="12" sm="4" v-if="Level_SMT == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">SMT</div>
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-SMT">
                  {{ totalSMT }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng SMT
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4" v-if="Level_AOI == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">AOI</div>
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-AOI">
                  {{ totalAOI }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng AOI
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4" v-if="Level_RW == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">RW</div>
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-Hand">
                  {{ totalRW }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng sản phẩm RW
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4" v-if="Level_IPQC == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">IPQC</div>
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-IPQC">
                  {{ totalIPQC }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng IPQC
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4" v-if="Level_Assembly == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">Assembly</div>
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-Test">
                  {{ totalAssembly }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng Assembly
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4" v-if="Level_OQC == true">
            <v-card class="mx-auto rounded-xl" elevation="2">
              <template v-slot:prepend>
                <div class="text-h6 mb-2">OQC</div>
              </template>
              <v-card-text>
                <div class="text-h4 font-weight-bold color-OQC">
                  {{ totalOQC }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng OQC
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text>
        <!-- Bảng dữ liệu -->
        <v-data-table
          :headers="HeadersHistory"
          :items="history"
          :search="search"
          :group-by="[{ key: 'Type' }]"
          class="mt-3"
        >
          <template v-slot:top>
            <v-toolbar flat dense>
              <v-toolbar-title>
                <v-icon
                  color="medium-primay"
                  icon="mdi-book-multiple"
                  size="x-small"
                  start
                ></v-icon>
                Kế hoạch sản xuất
              </v-toolbar-title>

              <v-spacer></v-spacer>

              <ButtonAdd label="Thêm" @click="DialogAdd = true" />
            </v-toolbar>
          </template>

          <template
            v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }"
          >
            <tr>
              <td :colspan="columns.length">
                <v-btn
                  variant="text"
                  :icon="isGroupOpen ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                  @click="toggleGroup(item)"
                  class="me-2"
                ></v-btn>
                <span class="font-weight-bold">{{ item.value }}</span>
              </td>
            </tr>
          </template>
          
          <template v-slot:item.id="{ item }">
            <div class="d-flex gap-2">
              <ButtonEye @click="PushItem(item)" />
              <ButtonEdit @click="GetItem(item)" />
            </div>
          </template>
 
          <template v-slot:item.Percent="{ item }">
            <v-progress-linear v-model="item.Percent" height="25" color="success">
              <strong>{{ Math.ceil(item.Percent) }}%</strong>
            </v-progress-linear>
          </template>
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(history.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="DialogAdd" width="500" scrollable>
      <v-card max-width="500" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
          Thêm dữ liệu kế hoạch
        </v-card-title>
        <v-card-text>
          <InputSelect
            label="Công đoạn"
            :items="['SMT', 'AOI', 'RW', 'IPQC', 'Assembly', 'OQC']"
            v-model="Type_Add"
          />
          <InputField label="Số PO" v-model="PONumber_Add" />
          <InputField label="Hạng mục" v-model="Category_Add" />

          <v-row>
            <v-col cols="12" sm="4">
              <InputField
                label="Số lượng"
                type="number"
                v-model="Quantity_Plan_Add"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField
                label="Vòng lặp"
                type="number"
                v-model="CycleTime_Add"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField label="Thời gian" type="number" v-model="Time_Add" />
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

    <!-- Dialog Edit ---->
    <v-dialog v-model="DialogEdit" width="500" scrollable>
      <v-card max-width="500" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
          Sửa dữ liệu kế hoạch
        </v-card-title>
        <v-card-text>
          <InputSelect
            label="Công đoạn"
            :items="['SMT', 'AOI', 'RW', 'IPQC', 'Assembly', 'OQC']"
            v-model="Type_Edit"
          />
          <InputField label="Số PO" v-model="PONumber_Edit" />
          <InputField label="Hạng mục" v-model="Category_Edit" />

          <v-row>
            <v-col cols="12" sm="4">
              <InputField
                label="Số lượng"
                type="number"
                v-model="Quantity_Plan_Edit"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField
                label="Vòng lặp"
                type="number"
                v-model="CycleTime_Edit"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField label="Thời gian" type="number" v-model="Time_Edit" />
            </v-col>
          </v-row>
          <InputTextarea label="Ghi chú" v-model="Note_Edit" />
        </v-card-text>
        <v-card-actions>
          <ButtonCancel @cancel="DialogEdit = false" />
          <ButtonSave @save="SaveEdit()" />
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Dialog xác nhận xóa -->
    <v-dialog v-model="DialogRemove" max-width="500px">
      <v-card>
        <v-card-title>Xác nhận xóa</v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa dự án này?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="RemoveItem">Xác nhận</v-btn>
          <v-btn color="error" @click="DialogRemove = false">Hủy</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
    <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
    <Loading v-model="DialogLoading" />
  </div>
</template>

<script setup>
import { ref, watch, reactive, computed, nextTick, onMounted } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import Chart from "chart.js/auto";
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonNextManufacture from "@/components/Button-Next-Manufacture.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// ... existing imports ...
import { useManufactureDetails } from "@/composables/useManufactureDetails";
import { useManufacture } from "@/composables/useManufacture";
import { useHistory } from "@/composables/useHistory";

// ... existing refs and constants ...
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const router = useRouter();
const id = route.params.id;

const { manufactureDetails, connectionStatus } = useManufactureDetails(id);
const { manufacture, manufactureFound, manufactureError, isConnected } =
  useManufacture();
const { history, historyError, refresh } = useHistory(id);

console.log(manufactureDetails);
// Dialog
const DialogSuccess = ref(false);
const DialogLoading = ref(false);
const DialogFailed = ref(false);
const DialogAdd = ref(false);
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");
// Production statistics
const NameManufacture = localStorage.getItem("ProductName");
const GetID = ref(null);

// Production statistics
const totalInput = ref(0);
const totalSMT = ref(0);
const totalAOI = ref(0);
const totalRW = ref(0);
const totalIPQC = ref(0);
const totalAssembly = ref(0);
const totalOQC = ref(0);

// Level
const Level_SMT = ref(false);
const Level_AOI = ref(0);
const Level_RW = ref(0);
const Level_IPQC = ref(0);
const Level_Assembly = ref(0);
const Level_OQC = ref(0);

// Data
const DataManufacture = ref(null);
console.log(DataManufacture); 
// ===== FORM ADD =====
const Type_Add = ref("");
const PONumber_Add = ref(localStorage.getItem("ProductName"));
const Category_Add = ref("");
const Quantity_Plan_Add = ref("");
const CycleTime_Add = ref("");
const Time_Add = ref("");
const Note_Add = ref("");

// ===== FORM EDIT =====
const Type_Edit = ref("");
const PONumber_Edit = ref("");
const Category_Edit = ref("");
const Quantity_Plan_Edit = ref("");
const CycleTime_Edit = ref("");
const Time_Edit = ref("");
const Note_Edit = ref("");

// Table
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);
const HeadersHistory = [
  { title: "Ngày", key: "Created_At", sortable: true },
  { title: "Công đoạn", key: "Type", sortable: true },
  { title: "Tên dự án", key: "PONumber", sortable: true },
  { title: "Tên danh mục", key: "Category", sortable: true },
  { title: "Đầu vào", key: "Quantity_Plan", sortable: true },
  { title: "Đầu ra", key: "Quantity_Real", sortable: true },
  { title: "Tỷ lệ (%)", key: "Percent", sortable: true },
  { title: "Thao tác", key: "id", sortable: false },
];

// Watch for manufactureFound changes to update levels
watch(
  manufactureDetails,
  (newValue) => {
    console.log('manufactureDetails raw value:', newValue);
    if (newValue) {
      const data = Array.isArray(newValue) ? newValue[0] : newValue;
      
      if (data && data.Level) {
        DataManufacture.value = data.Level;
        
        Level_SMT.value = DataManufacture.value.includes("SMT");
        Level_AOI.value = DataManufacture.value.includes("AOI");
        Level_RW.value = DataManufacture.value.includes("RW");
        Level_IPQC.value = DataManufacture.value.includes("IPQC");
        Level_Assembly.value = DataManufacture.value.includes("Assembly");
        Level_OQC.value = DataManufacture.value.includes("OQC");
      }
    }
  },
  { immediate: true, deep: true }
);

// Watch for manufacture errors
watch(manufactureError, (error) => {
  if (error) {
    console.error("Manufacture error:", error);
    DialogFailed.value = true;
  }
});

// Computed percent Input and Output
const percent = computed(() => {
  if (totalInput.value === 0 || totalOQC.value === 0) {
    return 0;
  }
  return Math.round((totalOQC.value / totalInput.value) * 100);
});



// Status last seen
const now = Date.now();
const timeout = 60000;

let chart = null;

// Initialize chart
onMounted(() => {
  nextTick(() => {
    fetchProductionData();
  });
});

// ====== COMPUTED ======
const formattedSelectedDate = computed(() => {
  const date = new Date();
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok"
  });
});

// ====== CRUD ========
const PushItem = (item) => {
  localStorage.setItem("ManufactureID", id);
  if (item.Type === "SMT") {
    router.push(`/san-xuat/SMT/${item.id}`);
  } else if (item.Type === "AOI") {
    router.push(`/san-xuat/AOI/${item.id}`);
  } else if (item.Type === "RW") {
    router.push(`/san-xuat/RW/${item.id}`);
  } else if (item.Type === "Assembly") {
    router.push(`/san-xuat/Assembly/${item.id}`);
  } else if (item.Type === "IPQC") {
    router.push(`/san-xuat/IPQC/${item.id}`);
  } else if (item.Type === "OQC") {
    router.push(`/san-xuat/OQC/${item.id}`);
  }
};

const GetItem = (item) => {
  DialogEdit.value = true;
  Type_Edit.value = item.Type;
  PONumber_Edit.value = item.PONumber;
  Category_Edit.value = item.Category;
  Quantity_Plan_Edit.value = item.Quantity_Plan;
  CycleTime_Edit.value = item.CycleTime_Plan;
  Time_Edit.value = item.Time_Plan;
  Note_Edit.value = item.Note;
  GetID.value = item.id;
};

const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Type: Type_Edit.value,
    PlanID: route.params.id,
    PONumber: PONumber_Edit.value,
    Category: Category_Edit.value,
    Quantity_Plan: Quantity_Plan_Edit.value,
    CycleTime_Plan: CycleTime_Edit.value,
    Time_Plan: Time_Edit.value,
    Note: Note_Edit.value,
    Created_At: formattedSelectedDate.value,
  });

  try {
    const response = await axios.put(
      `${Url}/Summary/Edit-item/${GetID.value}`,
      formData
    );
    console.log(response.data.message);
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    Error();
  }
};

/**
 * Saves new customer data
 * Makes an API call to create a new customer
 */

const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Type: Type_Add.value,
    PlanID: route.params.id,
    PONumber: PONumber_Add.value,
    Category: Category_Add.value,
    Quantity_Plan: Quantity_Plan_Add.value,
    CycleTime_Plan: CycleTime_Add.value,
    Time_Plan: Time_Add.value,
    Note: Note_Add.value,
    Created_At: formattedSelectedDate.value,
  });

  try {
    const response = await axios.post(`${Url}/Summary/Add-item`, formData);
    console.log(response.data);
    MessageDialog.value = "Thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    Error();
  }
};

function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  DialogLoading.value = false;
}

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}

// Watch for manufactureDetails changes
watch(
  manufactureDetails,
  (newValue) => {
    console.log('Raw manufactureDetails:', newValue); // Debug raw data
    if (newValue && typeof newValue === 'object') {
      // Check if newValue is an array and has items
      if (Array.isArray(newValue) && newValue.length > 0) {
        const data = newValue[0]; // Get first item if it's an array
        totalInput.value = data.Total || 0;
        totalSMT.value = data.SMT || 0;
        totalAOI.value = data.AOI || 0;
        totalRW.value = data.RW || 0;
        totalIPQC.value = data.IPQC || 0;
        totalAssembly.value = data.Assembly || 0;
        totalOQC.value = data.OQC || 0;
      } else {
        // If it's a single object
        totalInput.value = newValue.Total || 0;
        totalSMT.value = newValue.SMT || 0;
        totalAOI.value = newValue.AOI || 0;
        totalRW.value = newValue.RW || 0;
        totalIPQC.value = newValue.IPQC || 0;
        totalAssembly.value = newValue.Assembly || 0;
        totalOQC.value = newValue.OQC || 0;
      }
    }
  },
  { immediate: true, deep: true }
);

// Update fetchProductionData to use the watcher
async function fetchProductionData() {
  try {
    DialogLoading.value = true;
    console.log('Current manufactureDetails:', manufactureDetails.value); // Debug current value
  } catch (error) {
    console.error("Error fetching production data:", error);
    DialogFailed.value = true;
  } finally {
    DialogLoading.value = false;
  }
}

// Add watcher for history changes
watch(
  history,
  (newHistory) => {
    console.log("History data updated:", newHistory);
  },
  { deep: true }
);

// Add watcher for history errors
watch(historyError, (error) => {
  if (error) {
    console.error("History error:", error);
    DialogFailed.value = true;
    MessageErrorDialog.value = error;
  }
});
</script>
<script>
export default {
  components: {
    ButtonBack,
    ButtonEye,
    InputSearch,
    InputField,
    InputFiles,
    ButtonImportFile,
    ButtonDownload,
    ButtonNextManufacture,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
  },
};
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}
.v-card:hover {
  transform: translateY(-2px);
}
.color-SMT {
  color: #1976d2;
}
.color-AOI {
  color: #c0c0c0;
}
.color-Hand {
  color: #ff0000;
}
.color-IPQC {
  color: #ff00ff;
}
.color-Test {
  color: #ffa500;
}
.color-OQC {
  color: #4caf50;
}
</style>
