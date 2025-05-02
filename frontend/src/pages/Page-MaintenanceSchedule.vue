<template lang="">
  <div>
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="d-flex">
        <ButtonBack :to="`/Bao-tri/Chi-tiet/${route.params.id}`" />
        <p class="text-h4 font-weight-light ms-3">Lịch bảo trì định kì</p>
      </v-card-title>
      <v-card-text>
        <v-card variant="text">
          <v-card-title class="d-flex align-center pe-2">
            <v-icon icon="mdi mdi-calendar-clock"></v-icon> &nbsp; {{ route.params.id }}

            <ButtonAdd @add="DialogAdd = true" />
            <p class="ms-2 font-weight-thin text-subtitle-1">
              ( {{ maintenanceSchedule.length }} lịch bảo trì)
            </p>
            <v-spacer></v-spacer>
            <InputSearch v-model="search" />
          </v-card-title>

          <v-data-table
            :search="search"
            :items="maintenanceSchedule"
            :headers="Headers"
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
            <template v-slot:item.SoNgayConLai="{ value }">
              <div>
                <v-chip
                  v-if="value > 15"
                  color="green"
                  :text="`${value} ngày`"
                  size="small"
                ></v-chip>
                <v-chip
                  v-else
                  color="red"
                  :text="`${value} ngày`"
                  size="small"
                ></v-chip>
              </div>
            </template>
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(maintenanceSchedule.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
            <template v-slot:item.TrangThai="{ item }">
              <div class="text-start">
                <v-chip
                  v-if="item.TrangThai === 'Chưa thực hiện'"
                  color="orange"
                  text="Chưa thực hiện"
                  size="small"
                ></v-chip>
                <v-chip
                  v-else-if="item.TrangThai === 'Đang thực hiện'"
                  color="blue"
                  text="Đang thực hiện"
                  size="small"
                ></v-chip>
                <v-chip
                  v-else-if="item.TrangThai === 'Đã hoàn thành'"
                  color="green"
                  text="Đã hoàn thành"
                  size="small"
                ></v-chip>
              </div>
            </template>
            <template v-slot:item.id="{ item }">
              <ButtonEdit @edit="GetItem(item)" />
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>
    </v-card>

    <v-dialog v-model="DialogEdit" width="500" scrollable>
      <v-card class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
          Cập nhật lịch bảo trì
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12">
              <InputField
                label="Loại bảo trì"
                v-model="LoaiBaoTri_Edit"
                hint="Ví dụ: Bảo trì định kỳ, Bảo trì phòng ngừa"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Chu kỳ bảo trì"
                v-model="ChuKyBaoTri_Edit"
                type="number"
                hint="Số lượng chu kỳ"
              />
            </v-col>
            <v-col cols="6">
              <InputSelect
                label="Đơn vị chu kỳ"
                v-model="DonViChuKy_Edit"
                hint="Ví dụ: Tháng, Quý, Năm"
                :items="itemsDonViChuKy"
                item-text="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Ngày bắt đầu"
                v-model="NgayBatDau_Edit"
                type="date"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Ngày bảo trì tiếp theo"
                v-model="NgayBaoTriTiepTheo_Edit"
                type="date"
                readonly
                :hint="calculateNextDateEdit"
              />
            </v-col>
            <v-col cols="12">
              <InputTextarea
                label="Ghi chú"
                v-model="GhiChu_Edit"
                hint="Ghi chú về lịch bảo trì"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4">
          <ButtonDelete @delete="DialogRemove = true" />
          <v-spacer></v-spacer>
          <ButtonCancel @cancel="DialogEdit = false" />
          <ButtonSave @save="SaveEdit()" class="ms-2" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="DialogAdd" width="500" scrollable>
      <v-card class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
          Thêm lịch bảo trì
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12">
              <InputField
                label="Loại bảo trì"
                v-model="LoaiBaoTri_Add"
                hint="Ví dụ: Bảo trì định kỳ, Bảo trì phòng ngừa"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Chu kỳ bảo trì"
                v-model="ChuKyBaoTri_Add"
                type="number"
                hint="Số lượng chu kỳ"
              />
            </v-col>
            <v-col cols="6">
              <InputSelect
                label="Đơn vị chu kỳ"
                v-model="DonViChuKy_Add"
                hint="Ví dụ: Tháng, Năm"
                :items="itemsDonViChuKy"
                item-text="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Ngày bắt đầu"
                v-model="NgayBatDau_Add"
                type="date"
              />
            </v-col>
            <v-col cols="6">
              <InputField
                label="Ngày bảo trì tiếp theo"
                v-model="NgayBaoTriTiepTheo_Add"
                type="date"
                readonly
                :hint="calculateNextDate"
              />
            </v-col>
            <v-col cols="12">
              <InputTextarea
                label="Ghi chú"
                v-model="GhiChu_Add"
                hint="Ghi chú về lịch bảo trì"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <ButtonCancel @cancel="DialogAdd = false" />
          <ButtonSave @save="SaveAdd()" class="ms-2" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="DialogRemove" width="400">
      <v-card>
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-delete" color="error" class="me-2"></v-icon>
          Xóa lịch bảo trì
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="text-body-1">
            Bạn có chắc chắn muốn xóa lịch bảo trì này?
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <ButtonCancel @cancel="DialogRemove = false" />
          <ButtonDelete @delete="DeleteItem()" class="ms-2" />
        </v-card-actions>
      </v-card>
    </v-dialog>
    <SnackbarSuccess v-model="DialogSuccess" />
    <SnackbarFailed v-model="DialogFailed" />
    <Loading v-model="DialogLoading" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import InputSearch from "@/components/Input-Search.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import { useMaintenanceSchedule } from "@/composables/useMaintenanceSchedule";

const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);
const DialogLoading = ref(false);
const DialogAdd = ref(false);
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const id = localStorage.getItem("MaintenanceID");
const GetID = ref("");
// Data for table
const { maintenanceSchedule } = useMaintenanceSchedule(id);

// Headers for data table
const Headers = [
  { title: "Loại bảo trì", key: "LoaiBaoTri", sortable: true },
  { title: "Chu kỳ bảo trì", key: "ChuKyBaoTri", sortable: true },
  { title: "Đơn vị chu kỳ", key: "DonViChuKy", sortable: true },
  { title: "Ngày bắt đầu", key: "NgayBatDau", sortable: true },
  {
    title: "Ngày bảo trì tiếp theo",
    key: "NgayBaoTriTiepTheo",
    sortable: true,
  },
  { title: "Hạn bảo trì", key: "SoNgayConLai", sortable: true },
  { title: "Ghi chú", key: "GhiChu", sortable: true },
  { title: "Thao tác", key: "id", sortable: false },
];

// Form data for Add
const LoaiBaoTri_Add = ref("");
const ChuKyBaoTri_Add = ref("");
const DonViChuKy_Add = ref("");
const NgayBatDau_Add = ref("");
const NgayBaoTriTiepTheo_Add = ref("");
const GhiChu_Add = ref("");

// Form data for Edit
const LoaiBaoTri_Edit = ref("");
const ChuKyBaoTri_Edit = ref("");
const DonViChuKy_Edit = ref("");
const NgayBatDau_Edit = ref("");
const NgayBaoTriTiepTheo_Edit = ref("");
const GhiChu_Edit = ref("");

// Add items for DonViChuKy select
const itemsDonViChuKy = ["Tháng", "Quý", "Năm"];

// Add computed property for next date calculation
const calculateNextDate = computed(() => {
  if (
    !NgayBatDau_Add.value ||
    !ChuKyBaoTri_Add.value ||
    !DonViChuKy_Add.value
  ) {
    return "Vui lòng nhập đầy đủ thông tin ngày bắt đầu, chu kỳ và đơn vị";
  }

  const startDate = new Date(NgayBatDau_Add.value);
  let nextDate = new Date(startDate);
  const cycleValue = parseInt(ChuKyBaoTri_Add.value) || 0;

  switch (DonViChuKy_Add.value) {
    case "Tháng":
      nextDate.setMonth(startDate.getMonth() + cycleValue);
      break;
    case "Quý":
      nextDate.setMonth(startDate.getMonth() + cycleValue * 3);
      break;
    case "Năm":
      nextDate.setFullYear(startDate.getFullYear() + cycleValue);
      break;
  }

  NgayBaoTriTiepTheo_Add.value = nextDate.toISOString().split("T")[0];
  return `Ngày bảo trì tiếp theo: ${nextDate.toLocaleDateString("vi-VN")}`;
});

// Add computed property for next date calculation in Edit dialog
const calculateNextDateEdit = computed(() => {
  if (
    !NgayBatDau_Edit.value ||
    !ChuKyBaoTri_Edit.value ||
    !DonViChuKy_Edit.value
  ) {
    return "Vui lòng nhập đầy đủ thông tin ngày bắt đầu, chu kỳ và đơn vị";
  }

  const startDate = new Date(NgayBatDau_Edit.value);
  let nextDate = new Date(startDate);
  const cycleValue = parseInt(ChuKyBaoTri_Edit.value) || 0;

  switch (DonViChuKy_Edit.value) {
    case "Tháng":
      nextDate.setMonth(startDate.getMonth() + cycleValue);
      break;
    case "Quý":
      nextDate.setMonth(startDate.getMonth() + cycleValue * 3);
      break;
    case "Năm":
      nextDate.setFullYear(startDate.getFullYear() + cycleValue);
      break;
  }

  NgayBaoTriTiepTheo_Edit.value = nextDate.toISOString().split("T")[0];
  return `Ngày bảo trì tiếp theo: ${nextDate.toLocaleDateString("vi-VN")}`;
});

// Methods
const GetItem = (item) => {
  LoaiBaoTri_Edit.value = item.LoaiBaoTri;
  ChuKyBaoTri_Edit.value = item.ChuKyBaoTri;
  DonViChuKy_Edit.value = item.DonViChuKy;
  NgayBatDau_Edit.value = item.NgayBatDau;
  NgayBaoTriTiepTheo_Edit.value = item.NgayBaoTriTiepTheo;
  GhiChu_Edit.value = item.GhiChu;
  GetID.value = item.id;
  DialogEdit.value = true;
};

const SaveAdd = async () => {
  DialogLoading.value = true;

  const formData = {
    MaThietBi: localStorage.getItem("MaintenanceID"),
    LoaiBaoTri: LoaiBaoTri_Add.value,
    ChuKyBaoTri: ChuKyBaoTri_Add.value,
    DonViChuKy: DonViChuKy_Add.value,
    NgayBatDau: NgayBatDau_Add.value,
    NgayBaoTriTiepTheo: NgayBaoTriTiepTheo_Add.value,
    GhiChu: GhiChu_Add.value,
  };

  try {
    const response = await axios.post(
      `${Url}/MaintenanceSchedule/Add`,
      formData
    );
    console.log(response.data);
    Reset();
  } catch (error) {
    console.error("Error adding maintenance schedule:", error);
    Error();
  } finally {
    DialogLoading.value = false;
    DialogAdd.value = false;
  }
};

const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = {
    MaThietBi: localStorage.getItem("MaintenanceID"),
    LoaiBaoTri: LoaiBaoTri_Edit.value,
    ChuKyBaoTri: ChuKyBaoTri_Edit.value,
    DonViChuKy: DonViChuKy_Edit.value,
    NgayBatDau: NgayBatDau_Edit.value,
    NgayBaoTriTiepTheo: NgayBaoTriTiepTheo_Edit.value,
    GhiChu: GhiChu_Edit.value,
  };

  try {
    const response = await axios.put(
      `${Url}/MaintenanceSchedule/Edit/${id}`,
      formData
    );
    console.log(response.data);
    Reset();
  } catch (error) {
    console.error("Error updating maintenance schedule:", error);
    Error();
  }
};

const DeleteItem = () => {
  // Implement delete logic here
  axios
    .delete(`${Url}/MaintenanceSchedule/Delete/${id}`)
    .then(function (response) {
      console.log(response.data.message);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};

// Add Reset method
const Reset = () => {
  LoaiBaoTri_Add.value = "";
  ChuKyBaoTri_Add.value = "";
  DonViChuKy_Add.value = "";
  NgayBatDau_Add.value = "";
  NgayBaoTriTiepTheo_Add.value = "";
  GhiChu_Add.value = "";
  DialogSuccess.value = true;
  DialogFailed.value = false;
  DialogLoading.value = false;
  DialogAdd.value = false;
  DialogEdit.value = false;
  DialogRemove.value = false;
};

// Add ResetEdit method
const Error = () => {
  DialogFailed.value = true;
  DialogLoading.value = false;
  DialogAdd.value = false;
  DialogEdit.value = false;
  DialogRemove.value = false;
  LoaiBaoTri_Add.value = "";
  ChuKyBaoTri_Add.value = "";
  DonViChuKy_Add.value = "";
  NgayBatDau_Add.value = "";
  NgayBaoTriTiepTheo_Add.value = "";
  GhiChu_Add.value = "";
};
</script>
<script>
export default {
  components: {
    InputSearch,
    InputTextarea,
    InputField,
    ButtonAdd,
    ButtonDelete,
    ButtonDownload,
    ButtonSave,
    ButtonCancel,
    ButtonBack,
    ButtonEdit,
    ButtonAgree,
    ButtonEye,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    InputSelect,
  },
};
</script>
