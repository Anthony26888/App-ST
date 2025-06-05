<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex justify-space-between align-center pa-4">
      <span class="text-h4 font-weight-light">Báo cáo hằng ngày</span>
      <v-spacer></v-spacer>
      <v-toolbar rounded="lg" border floating class="mt-3">
        <div class="d-flex align-center px-4">
          <div class="text-subtitle-1 mr-4">
            {{ formattedWeekDate }}
          </div>
          <v-menu
            v-model="dateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            min-width="auto"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                class="text-subtitle-1"
                prepend-icon="mdi-calendar"
              >
                {{ formattedSelectedDate }}
              </v-btn>
            </template>
            <v-date-picker
              v-model="selectedDate"
              @update:model-value="dateMenu = false"
              :first-day-of-week="1"
            ></v-date-picker>
          </v-menu>
        </div>
      </v-toolbar>
    </v-card-title>

    <!-- Thống kê tổng quan -->
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg" color="primary" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Tổng số PO</div>
              <div class="text-h4 font-weight-bold">
                {{ summary?.map((item) => item.PONumber).length || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg" color="info" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Tổng số hạng mục</div>
              <div class="text-h4 font-weight-bold">
                {{ summary?.map((item) => item.Category).length || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg" color="success" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Dự án hoàn thành</div>
              <div class="text-h4 font-weight-bold">
                {{
                  project?.filter((p) => p.Status === "Hoàn thành").length || 0
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg" color="warning" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Dự án đang thực hiện</div>
              <div class="text-h4 font-weight-bold">
                {{
                  project?.filter((p) => p.Status === "Chưa xong").length || 0
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Bảng dữ liệu -->
      <v-data-table
        :headers="Headers"
        :items="summary"
        :search="search"
        :group-by="[{ key: 'Type' }]"
        class="mt-5"
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
              Báo cáo chi tiết
            </v-toolbar-title>

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
            <ButtonEdit @click="GetItem(item)" />
          </div>
        </template>
        <template v-slot:item.Percent="{ item }">
          {{ item.Percent }}%
        </template>

        <template v-slot:bottom>
          <div class="text-center pt-2">
            <v-pagination
              v-model="page"
              :length="Math.ceil(summary.length / itemsPerPage)"
            ></v-pagination>
          </div>
        </template>
      </v-data-table>
    </v-card-text>

    <v-dialog v-model="DialogAdd" width="500" scrollable>
      <v-card max-width="500" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
          Thêm dữ liệu kế hoạch
        </v-card-title>
        <v-card-text>
          <InputSelect
            label="Công đoạn"
            :items="['SMT', 'AOI-IPQC', 'RW', 'ASSEMBLY', 'IPQC', 'OQC']"
            variant="solo-filled"
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
            :items="['SMT', 'AOI-IPQC', 'RW', 'ASSEMBLY', 'IPQC', 'OQC']"
            variant="solo-filled"
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
  </v-card>

  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { useRouter } from "vue-router";
import { ref, reactive, computed, watch } from "vue";

// Components
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// Composables
import { useSummary } from "@/composables/useSummary";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Router
const router = useRouter();

// Initialize composables

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogSuccess = ref(false); // Success notification
const DialogFailed = ref(false); // Error notification
const DialogLoading = ref(false); // Loading state
const DialogRemove = ref(false); // Remove confirmation dialog
const DialogAdd = ref(false); // Add new item dialog
const DialogEdit = ref(false); // Edit dialog
const GetID = ref("");
// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== FORM ADD =====
const Type_Add = ref("");
const PONumber_Add = ref("");
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

// ===== Table States =====
const search = ref("");
const itemsPerPage = ref(10);
const page = ref(1);
const Headers = ref([
  { key: "PONumber", title: "Số PO", width: "150" },
  { key: "Category", title: "Hạng mục", width: "300" },
  {
    title: "Kế hoạch",
    align: "center",
    children: [
      { title: "Số lượng (pcs)", key: "Quantity_Plan" },
      { title: "Vòng lập (s)", key: "CycleTime_Plan" },
      { title: "Thời gian (s)", key: "Time_Plan" },
    ],
  },
  {
    title: "Thực tế",
    align: "center",
    children: [
      { title: "Số lượng (pcs)", key: "Quantity_Real" },
      { title: "Phần trăm (%)", key: "Percent" },
      { title: "Ghi chú", key: "Note" },
    ],
  },
  { key: "id", sortable: false, title: "Thao tác" },
]);

// ===== COMPUTED =======
const dateMenu = ref(false);
const selectedDate = ref(new Date().toISOString().substr(0, 10));

const formattedSelectedDate = computed(() => {
  const date = new Date(selectedDate.value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
});

// Pass the computed ref to useSummary
const { summary, summaryError } = useSummary(formattedSelectedDate);

const formattedWeekDate = computed(() => {
  // Create a new date object from selectedDate to avoid mutation
  const selectedDateObj = new Date(selectedDate.value);
  const day = selectedDateObj.getDay();
  const diff = selectedDateObj.getDate() - day + (day === 0 ? -6 : 1);

  // Create a new date for Monday
  const monday = new Date(selectedDateObj);
  monday.setDate(diff);

  // Calculate week number
  const getWeekNumber = (d) => {
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const weekNumber = getWeekNumber(monday);

  // Get weekday from the selected date
  const weekday = selectedDateObj.toLocaleDateString("vi-VN", {
    weekday: "long",
  });

  return `Tuần ${weekNumber} - ${weekday}`;
});

// Watch for errors
watch(summaryError, (error) => {
  if (error) {
    MessageErrorDialog.value = error;
    DialogFailed.value = true;
  }
});

// Add debug logging
watch(
  summary,
  (newValue) => {
    console.log("Summary data updated:", newValue);
  },
  { deep: true }
);

// ===== CRUD OPERATIONS =====
/**
 * Navigates to customer details page and stores customer information
 * @param {string} value - The ID of the customer to view
 */

/** CRUD
 * Saves edited customer data
 * Makes an API call to update customer information
 */

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


/**
 * Removes a customer from the system
 * Makes an API call to delete the customer
 */
const RemoveItem = async (id) => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Project/Customer/Delete-Customer/${GetID.value}`
    );
    console.log(response.data.message);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

// ===== FILE OPERATIONS =====
/**
 * Imports customer data from a file
 * Makes an API call to upload and process the file
 */
const ImportFile = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", File.value);

  try {
    const response = await axios.post(`${Url}/Project/upload`, formData);
    console.log(response);
    MessageDialog.value = "Tải file thành công";
    Reset();
  } catch (error) {
    console.log(error);
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
}

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}
</script>
<script>
export default {
  components: {
    InputSearch,
    InputFiles,
    InputField,
    ButtonImportFile,
    ButtonDownload,
    ButtonEye,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    InputSelect,
    InputTextarea,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang=""></style>
