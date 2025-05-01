<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Bao-tri" />
      <p class="text-h4 font-weight-light ms-3">Chi tiết bảo trì</p>
    </v-card-title>
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
          {{ route.params.id }}

          <ButtonAdd @add="DialogAdd = true" />
          <v-btn
            variant="tonal"
            color="orange"
            prepend-icon="mdi-calendar-check"
            class="ms-2 text-caption"
            @click="PushSchedule()"
            >Lịch bảo trì định kì</v-btn
          >
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ maintenance.length }} bản ghi)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-data-table
          
          :search="search"
          :items="maintenance"
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
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(maintenance.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>
          <template v-slot:item.TrangThai="{ item }">
            <div class="text-start">
              <v-chip
                v-if="item.TrangThai === 'Chờ phê duyệt'"
                color="red"
                text="Chờ phê duyệt"
                size="small"
              ></v-chip>
              <v-chip
                v-else-if="item.TrangThai === 'Đang thực hiện'"
                color="orange"
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
            <ButtonEye @detail="PushItem(item)" />
          </template>
        </v-data-table>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="500" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu bảo trì
      </v-card-title>

      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12">
            <InputSelect
              label="Loại bảo trì"
              v-model="LoaiBaoTri_Edit"
              hint="Ví dụ: Bảo trì định kỳ, Sửa chữa, Thay thế"
              :items="itemsType"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputSelect
              label="Phương án"
              v-model="PhuongAn_Edit"
              hint="Mô tả phương án bảo trì"
              :items="itemsPlan"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputSelect
              label="Phụ tùng"
              v-model="PhuTung_Edit"
              hint="Liệt kê các phụ tùng sử dụng"
              :items="itemsSparePart"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputSelect
              label="Trạng thái"
              v-model="TrangThai_Edit"
              hint="Ví dụ: Đã hoàn thành, Đang thực hiện, Chờ phê duyệt"
              :items="itemsStatus"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Chi phí"
              v-model="ChiPhi_Edit"
              type="number"
              hint="Đơn vị: VND"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Ngày bảo trì"
              v-model="NgayBaoTri_Edit"
              type="date"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Ngày hoàn thành"
              v-model="NgayHoanThanh_Edit"
              type="date"
            />
          </v-col>
          <v-col cols="6">
            <InputField label="Người tạo" v-model="NguoiTao_Edit" />
          </v-col>
          <v-col cols="6">
            <InputField label="Người thực hiện" v-model="NguoiThucHien_Edit" />
          </v-col>
          <v-col cols="12">
            <InputTextarea
              label="Mô tả lỗi"
              v-model="MoTaLoi_Edit"
              hint="Mô tả chi tiết lỗi cần bảo trì"
            />
          </v-col>
          <v-col cols="12">
            <InputTextarea
              label="Biện pháp khắc phục"
              v-model="BienPhapKhacPhuc_Edit"
              hint="Mô tả cách thức khắc phục lỗi"
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
        Thêm dữ liệu bảo trì
      </v-card-title>

      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12">
            <InputSelect
              label="Loại bảo trì"
              v-model="LoaiBaoTri_Add"
              hint="Ví dụ: Bảo trì định kỳ, Sửa chữa, Thay thế"
              :items="itemsType"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputSelect
              label="Phương án"
              v-model="PhuongAn_Add"
              hint="Tìm kiếm phương án"
              :items="itemsPlan"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputSelect
              label="Phụ tùng"
              v-model="PhuTung_Add"
              hint="Liệt kê các phụ tùng sử dụng"
              :items="itemsSparePart"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputSelect
              label="Trạng thái"
              v-model="TrangThai_Add"
              hint="Ví dụ: Đã hoàn thành, Đang thực hiện, Chờ phê duyệt"
              :items="itemsStatus"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Chi phí"
              v-model="ChiPhi_Add"
              type="number"
              hint="Đơn vị: VND"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Ngày bảo trì"
              v-model="NgayBaoTri_Add"
              type="date"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Ngày hoàn thành"
              v-model="NgayHoanThanh_Add"
              type="date"
            />
          </v-col>
          <v-col cols="6">
            <InputField label="Người tạo" v-model="NguoiTao_Add" />
          </v-col>
          <v-col cols="6">
            <InputField label="Người thực hiện" v-model="NguoiThucHien_Add" />
          </v-col>
          <v-col cols="12">
            <InputTextarea
              label="Mô tả lỗi"
              v-model="MoTaLoi_Add"
              hint="Mô tả chi tiết lỗi cần bảo trì"
            />
          </v-col>
          <v-col cols="12">
            <InputTextarea
              label="Biện pháp khắc phục"
              v-model="BienPhapKhacPhuc_Add"
              hint="Mô tả cách thức khắc phục lỗi"
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
        Xóa bảo trì
      </v-card-title>

      <v-card-text class="pa-4">
        <div class="text-body-1">
          Bạn có chắc chắn muốn xóa bản ghi bảo trì này?
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" class="ms-2" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { ref, computed, reactive } from "vue";
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
import { useMaintenance } from "@/composables/useMaintenance";

const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const route = useRoute();
const id = localStorage.getItem("MaintenanceID");

// Dialog states
const DialogEdit = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogRemove = ref(false);
const DialogAdd = ref(false);
const DialogLoading = ref(false);
const GetID = ref("");

// Edit form fields
const LoaiBaoTri_Edit = ref("");
const MoTaLoi_Edit = ref("");
const BienPhapKhacPhuc_Edit = ref("");
const PhuongAn_Edit = ref("");
const PhuTung_Edit = ref("");
const NguoiTao_Edit = ref("");
const NguoiThucHien_Edit = ref("");
const ChiPhi_Edit = ref("");
const NgayBaoTri_Edit = ref("");
const NgayHoanThanh_Edit = ref("");
const TrangThai_Edit = ref("");

// Add form fields
const LoaiBaoTri_Add = ref("");
const itemsType = ref(["Bảo trì định kỳ", "Sửa chữa", "Thay thế"]);
const itemsStatus = ref(["Đã hoàn thành", "Đang thực hiện", "Chờ phê duyệt"]);
const itemsPlan = ref(["Sửa chữa nội bộ", "Dịch vụ ngoài "]);
const itemsSparePart = ref(["Có", "Không"]);
const MoTaLoi_Add = ref("");
const BienPhapKhacPhuc_Add = ref("");
const PhuongAn_Add = ref("");
const PhuTung_Add = ref("");
const NguoiTao_Add = ref("");
const NguoiThucHien_Add = ref("");
const ChiPhi_Add = ref("");
const NgayBaoTri_Add = ref("");
const NgayHoanThanh_Add = ref("");
const TrangThai_Add = ref("");

// Table states
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);

// Data
const { maintenance, maintenanceError } = useMaintenance(id);

const Headers = [
  { title: "Loại bảo trì", key: "LoaiBaoTri" },
  { title: "Mô tả lỗi", key: "MoTaLoi" },
  { title: "Biện pháp khắc phục", key: "BienPhapKhacPhuc" },
  { title: "Phương án", key: "PhuongAn" },
  { title: "Phụ tùng", key: "PhuTung" },
  { title: "Người tạo", key: "NguoiTao" },
  { title: "Người thực hiện", key: "NguoiThucHien" },
  { title: "Chi phí", key: "ChiPhi" },
  { title: "Ngày bảo trì", key: "NgayBaoTri" },
  { title: "Ngày hoàn thành", key: "NgayHoanThanh" },
  { title: "Trạng thái", key: "TrangThai" },
  { title: "Thao tác", key: "id", sortable: false },
];
function PushSchedule() {
  localStorage.setItem("MaintenanceID", id);
  router.push(`/Bao-tri/Lich-bao-tri/${route.params.id}`);
}

function PushItem(item) {
  localStorage.setItem("DetailMaintenanceID", item.MaBaoTri);
  router.push(`/Bao-tri/Chi-tiet-su-dung-phu-tung/${route.params.id}`);
}

function GetItem(item) {
  DialogEdit.value = true;
  GetID.value = item.MaBaoTri;
  LoaiBaoTri_Edit.value = item.LoaiBaoTri;
  MoTaLoi_Edit.value = item.MoTaLoi;
  BienPhapKhacPhuc_Edit.value = item.BienPhapKhacPhuc;
  PhuongAn_Edit.value = item.PhuongAn;
  PhuTung_Edit.value = item.PhuTung;
  NguoiTao_Edit.value = item.NguoiTao;
  NguoiThucHien_Edit.value = item.NguoiThucHien;
  ChiPhi_Edit.value = item.ChiPhi;
  NgayBaoTri_Edit.value = item.NgayBaoTri;
  NgayHoanThanh_Edit.value = item.NgayHoanThanh;
  TrangThai_Edit.value = item.TrangThai;
}

const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    LoaiBaoTri: LoaiBaoTri_Edit.value,
    MoTaLoi: MoTaLoi_Edit.value,
    BienPhapKhacPhuc: BienPhapKhacPhuc_Edit.value,
    PhuongAn: PhuongAn_Edit.value,
    PhuTung: PhuTung_Edit.value,
    NguoiTao: NguoiTao_Edit.value,
    NguoiThucHien: NguoiThucHien_Edit.value,
    ChiPhi: ChiPhi_Edit.value,
    NgayBaoTri: NgayBaoTri_Edit.value,
    NgayHoanThanh: NgayHoanThanh_Edit.value,
    TrangThai: TrangThai_Edit.value,
    MaThietBi: id,
  });
  axios
    .put(`${Url}/Maintenance/Edit/${GetID.value}`, formData)
    .then(function (response) {
      console.log(response.data.message);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};

const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    MaThietBi: localStorage.getItem("MaintenanceID"),
    NgayBaoTri: NgayBaoTri_Add.value,
    LoaiBaoTri: LoaiBaoTri_Add.value,
    MoTaLoi: MoTaLoi_Add.value,
    BienPhapKhacPhuc: BienPhapKhacPhuc_Add.value,
    NguoiTao: NguoiTao_Add.value,
    NguoiThucHien: NguoiThucHien_Add.value,
    ChiPhi: parseFloat(ChiPhi_Add.value) || 0,
    NgayHoanThanh: NgayHoanThanh_Add.value,
    TrangThai: TrangThai_Add.value,
    PhuongAn: PhuongAn_Add.value,
    PhuTung: PhuTung_Add.value,
  });

  try {
    const response = await axios.post(`${Url}/Maintenance/Add`, formData);
    console.log(response.data);
    Reset();
  } catch (error) {
    console.error("Error adding maintenance record:", error);
    Error();
  } finally {
    DialogLoading.value = false;
  }
};

const RemoveItem = async () => {
  DialogLoading.value = true;
  axios
    .delete(`${Url}/Maintenance/Delete/${GetID.value}`)
    .then(function (response) {
      console.log(response.data.message);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};

function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  DialogLoading.value = false;
  LoaiBaoTri_Add.value = "";
  MoTaLoi_Add.value = "";
  BienPhapKhacPhuc_Add.value = "";
  PhuongAn_Add.value = "";
  PhuTung_Add.value = "";
  NguoiTao_Add.value = "";
  NguoiThucHien_Add.value = "";
  ChiPhi_Add.value = "";
  NgayHoanThanh_Add.value = "";
  TrangThai_Add.value = "";
}

function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}
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
