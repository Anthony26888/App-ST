<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light" v-if="lgAndUp"
      >Danh sách bảo trì</v-card-title
    >
    <v-card-title class="mb-3">
      <v-row v-if="lgAndUp">
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Tổng số thiết bị"
            :value="machine?.length || 0"
            icon="mdi-cog"
            color="primary"
          />
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Thiết bị đã bảo trì"
            :value="
              machine?.filter((p) => p.Status === 'Chưa tới hạn').length || 0
            "
            icon="mdi-check-circle"
            color="success"
          />
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Thiết bị chưa bảo trì"
            :value="
              machine?.filter((p) => p.Status === 'Cần bảo trì').length || 0
            "
            icon="mdi-alert-circle"
            color="warning"
          />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col cols="4">
          <CardStatistic
            title="Tổng"
            :value="machine?.length || 0"
            icon="mdi-cog"
            color="primary"
          />
        </v-col>
        <v-col cols="4">
          <CardStatistic
            title="Đã bảo trì"
            :value="
              machine?.filter((p) => p.Status === 'Chưa tới hạn').length || 0
            "
            icon="mdi-check-circle"
            color="success"
          />
        </v-col>
        <v-col cols="4">
          <CardStatistic
            title="Đến hạn"
            :value="
              machine?.filter((p) => p.Status === 'Cần bảo trì').length || 0
            "
            icon="mdi-alert-circle"
            color="warning"
          />
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-text>
      <v-card variant="elevated" elevation="0" class="rounded-xl border">
        <v-card-title class="d-flex align-center pe-2" v-if="lgAndUp">
          <v-btn
            prepend-icon="mdi mdi-plus"
            variant="tonal"
            color="primary"
            class="text-caption ms-2"
            @click="DialogAdd = true"
            >Thêm</v-btn
          >
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>
        <v-card-title class="d-flex align-center" v-else>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-card-text class="overflow-auto">
          <v-data-table
            v-if="lgAndUp"
            density="compact"
            :headers="Headers"
            :items="machine"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
            class="elevation-0"
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
            height="60vh"
            show-expand
            item-value="MaThietBi"
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
              <v-badge
                v-if="getSchedules(internalItem.raw).length > 0"
                floating
                location="top left"
                :color="
                  getSchedules(internalItem.raw).filter(
                    (p) => p.Status === 'Cần bảo trì'
                  ).length > 0
                    ? 'error'
                    : 'grey'
                "
                :content="
                  getSchedules(internalItem.raw).filter(
                    (p) => p.Status === 'Cần bảo trì'
                  ).length > 0
                    ? getSchedules(internalItem.raw).filter(
                        (p) => p.Status === 'Cần bảo trì'
                      ).length
                    : 0
                "
              >
                <v-btn
                  v-if="getSchedules(internalItem.raw).length > 0"
                  :append-icon="
                    isExpanded(internalItem)
                      ? 'mdi-chevron-up'
                      : 'mdi-chevron-down'
                  "
                  :text="isExpanded(internalItem) ? 'Thu gọn' : 'Lịch bảo trì'"
                  class="text-none"
                  color="medium-emphasis"
                  size="small"
                  variant="text"
                  width="105"
                  border
                  slim
                  @click="toggleExpand(internalItem)"
                ></v-btn>
              </v-badge>
            </template>

            <template v-slot:expanded-row="{ columns, item }">
              <tr>
                <td :colspan="columns.length" class="py-4">
                  <v-card rounded="lg" border class="pa-4">
                    <!-- Lịch bảo trì -->
                    <template v-slot:prepend>
                      <p class="font-weight-bold">Lịch bảo trì</p>
                    </template>
                    <template v-slot:append>
                      <v-btn
                        variant="text"
                        class="text-primary text-caption"
                        :to="`/Bao-tri/Lich-bao-tri/${item.MaThietBi}`"
                      >Xem chi tiết</v-btn>
                    </template>

                    <v-table
                      density="compact"
                      v-if="getSchedules(item).length > 0"
                    >
                      <thead>
                        <tr class="bg-grey-lighten-4">
                          <th class="text-left">Loại bảo trì</th>
                          <th class="text-left">Chu kỳ</th>
                          <th class="text-left">Đơn vị</th>
                          <th class="text-left">Ngày tiếp theo</th>
                          <th class="text-left">Trạng thái</th>
                          <th class="text-left">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="schedule in getSchedules(item)"
                          :key="schedule.MaLich"
                        >
                          <td class="py-2">
                            {{ schedule.LoaiBaoTri }}
                          </td>
                          <td class="py-2">
                            {{ schedule.ChuKyBaoTri }}
                          </td>
                          <td class="py-2">
                            {{ schedule.DonViChuKy }}
                          </td>
                          <td class="py-2">
                            {{ schedule.NgayBaoTriTiepTheo }}
                          </td>
                          <td class="py-2">
                            <v-chip
                              :text="schedule.Status"
                              :color="
                                schedule.Status === 'Chưa tới hạn'
                                  ? 'green'
                                  : 'red'
                              "
                              size="small"
                              variant="tonal"
                            />
                          </td>
                          <td class="py-2">
                            {{ schedule.GhiChu }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                    <div v-else class="text-center text-grey text-caption py-4">
                      Chưa có lịch bảo trì
                    </div>
                  </v-card>
                </td>
              </tr>
            </template>

            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(machine.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
            <template #item.Image="{ value }">
              <v-img
                v-if="value"
                :src="`${API_URL}${value}`"
                width="100"
                height="100"
                cover
                :lazy-src="`${API_URL}${value}`"
                :aspect-ratio="1"
                :eager="true"
                :loading="true"
                :placeholder="`${API_URL}${value}`"
                class="rounded-lg ma-2"
              />
              <v-img
                v-else
                src="@/assets/no-image-available.png"
                width="100"
                height="100"
                cover
                :aspect-ratio="1"
                :eager="true"
                :loading="true"
                lazy-src="@/assets/no-image-available.png"
                class="rounded-lg ma-2"
              />
            </template>
            <template #item.Condition="{ value }">
              <div>
                <v-chip
                  v-if="value == 'Hư hỏng'"
                  color="red"
                  text="Hư hỏng"
                  size="small"
                ></v-chip>
                <v-chip
                  v-else
                  color="green"
                  text="Tốt"
                  size="small"
                ></v-chip>
              </div>
            </template>

            <template v-slot:item.Status="{ value }">
              <div>
                <v-chip
                  v-if="value == 'Chưa tới hạn'"
                  color="green"
                  text="Chưa đến hạn"
                  size="small"
                ></v-chip>
                <v-chip
                  v-else
                  color="red"
                  text="Cần bảo trì"
                  size="small"
                ></v-chip>
              </div>
            </template>
            <template v-slot:item.MaThietBi="{ value }">
              <div class="d-flex">
                <ButtonEye @detail="PushItem(value)" />
                <ButtonEdit @edit="GetItem(value)" />
              </div>
            </template>
            <template #item.MoTa="{ item }">
              <div style="white-space: pre-line">{{ item.MoTa }}</div>
            </template>
          </v-data-table>
          <v-data-table-virtual
            density="compact"
            :headers="Headers"
            :items="machine"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
            class="elevation-0"
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
            height="58vh"
            item-value="MaThietBi"
            v-else
          >
            <template v-slot:item.Image="{ value }">
              <div>
                <v-img
                  :src="value"
                  width="100"
                  height="100"
                  class="rounded"
                  cover
                ></v-img>
              </div>
            </template>
            <template v-slot:item.Status="{ value }">
              <div>
                <v-chip
                  v-if="value == 'Chưa tới hạn'"
                  color="green"
                  text="Chưa đến hạn"
                  size="small"
                ></v-chip>
                <v-chip
                  v-else
                  color="red"
                  text="Cần bảo trì"
                  size="small"
                ></v-chip>
              </div>
            </template>
            <template v-slot:item.MaThietBi="{ value }">
              <div class="d-flex">
                <ButtonEye @detail="PushItem(value)" />
                <ButtonEdit @edit="GetItem(value)" />
              </div>
            </template>
            <template #item.MoTa="{ item }">
              <div style="white-space: pre-line">{{ item.MoTa }}</div>
            </template>
          </v-data-table-virtual>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <BaseDialog
    v-model="DialogEdit"
    icon="mdi-pencil"
    title="Cập nhật thiết bị"
    max-width="700"
  >
    <v-row>
      <v-col cols="12" md="12">
        <InputField label="Mã thiết bị" v-model="MachineCode_Edit" />
      </v-col>
      <v-col cols="12" md="6">
        <InputField label="Tên thiết bị" v-model="TenThietBi_Edit" />
      </v-col>
      <v-col cols="12" md="6">
        <InputField label="Loại thiết bị" v-model="LoaiThietBi_Edit" />
      </v-col>
      <v-col cols="12" md="6">
        <InputField label="Nhà sản xuất" v-model="NhaSanXuat_Edit" />
      </v-col>
      <v-col cols="12" md="6">
        <InputDate label="Ngày mua" v-model="NgayMua_Edit" />
      </v-col>
      <v-col cols="12" md="6">
        <InputField label="Vị trí" v-model="ViTri_Edit" />
      </v-col>
      <v-col cols="12" md="6">
        <InputSelect label="Tình trạng" v-model="TinhTrang_Edit" :items="['Tốt', 'Hư hỏng']" />
      </v-col>
      <v-col cols="12">
        <v-row>
          <v-col cols="10">
            <v-file-input
              v-model="Image_Edit"
              label="Đổi hình ảnh khác"
              accept="image/*"
              prepend-icon="mdi-camera"
            />
          </v-col>
          <v-col cols="2">
            <v-img
              :src="ImagePreview_Edit"
              v-if="ImagePreview_Edit"
              width="100"
              height="100"
              class="rounded"
              cover
            ></v-img>
            <v-img
              src="@/assets/no-image-available.png"
              v-else
              width="100"
              height="100"
              class="rounded"
              cover
            ></v-img>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        <InputTextarea label="Mô tả" v-model="MoTa_Edit" />
      </v-col>
    </v-row>
    <template #actions>
      <ButtonDelete @delete="DialogRemove = true" />
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogEdit = false" />
      <ButtonSave @save="SaveEdit()" class="ms-2" />
    </template>
  </BaseDialog>

  <BaseDialog
    v-model="DialogRemove"
    icon="mdi-delete"
    title="Xóa thiết bị"
    max-width="500"
  >
    <p>Bạn có chắc chắn muốn xóa bản ghi thiết bị này?</p>
    <template #actions>
      <ButtonCancel @cancel="DialogRemove = false" />
      <ButtonDelete @delete="RemoveItem()" />
    </template>
  </BaseDialog>

  <BaseDialog
    v-model="DialogAdd"
    title="Thêm thiết bị"
    icon="mdi-plus"
    max-width="700"
  >
    <v-row>
      <v-col cols="12" md="12">
        <InputField label="Mã thiết bị" v-model="MachineCode_Add" />
      </v-col>
      <v-col cols="12" md="6">
        <InputField label="Tên thiết bị" v-model="TenThietBi_Add" />
      </v-col>
      <v-col cols="12" md="6">
        <InputField label="Loại thiết bị" v-model="LoaiThietBi_Add" />
      </v-col>
      <v-col cols="12" md="6">
        <InputField label="Nhà sản xuất" v-model="NhaSanXuat_Add" />
      </v-col>
      <v-col cols="12" md="6">
        <InputDate label="Ngày mua" v-model="NgayMua_Add" />
      </v-col>
      <v-col cols="12">
        <InputField label="Vị trí" v-model="ViTri_Add" />
      </v-col>
      <v-col cols="12">
        <v-row>
          <v-col cols="10">
            <v-file-input
              label="Hình ảnh máy"
              v-model="Image_Add"
              accept="image/*"
              prepend-icon="mdi-camera"
            ></v-file-input>
          </v-col>
          <v-col cols="2">
            <v-img
              :src="ImagePreview_Add"
              v-if="ImagePreview_Add"
              width="100"
              height="100"
              class="rounded"
              cover
            ></v-img>
            <v-img
              src="@/assets/no-image-available.png"
              v-else
              width="100"
              height="100"
              class="rounded"
              cover
            ></v-img>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        <InputTextarea label="Mô tả" v-model="MoTa_Add" />
      </v-col>
    </v-row>
    <template #actions>
      <ButtonCancel @cancel="DialogAdd = false" />
      <ButtonSave @save="SaveAdd()" />
    </template>
  </BaseDialog>

  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import { ref, watch } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

// Composables
import { useMachine } from "@/composables/Maintenance/useMachine";

// Components
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonSave from "@/components/Button-Save.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import InputDate from "@/components/Input-Date.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonRemove from "@/components/Button-Remove.vue";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.VITE_API_ERP_URL || "http://localhost:3000";
// Router
const router = useRouter();
const { mdAndDown, lgAndUp } = useDisplay();
// Initialize composables
const { machine } = useMachine();

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const Dialog = ref(false); // Main dialog
const DialogEdit = ref(false); // Edit dialog
const DialogSuccess = ref(false); // Success notification
const DialogFailed = ref(false); // Error notification
const DialogRemove = ref(false); // Remove confirmation dialog
const DialogAdd = ref(false); // Add new item dialog
const DialogLoading = ref(false); // Loading state
const DialogAddSchedule = ref(false); // Add new schedule dialog
const DialogRemoveSchedule = ref(false); // Remove schedule confirmation dialog
const DialogEditSchedule = ref(false); // Edit schedule dialog

// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== FORM STATES =====
// File upload state
const File = ref(null);

// Current item being processed
const GetID = ref("");

// Edit form states
const TenThietBi_Edit = ref(""); // Device name for editing
const LoaiThietBi_Edit = ref(""); // Device type for editing
const NhaSanXuat_Edit = ref(""); // Manufacturer for editing
const NgayMua_Edit = ref(""); // Purchase date for editing
const ViTri_Edit = ref(""); // Location for editing
const MoTa_Edit = ref(""); // Description for editing
const Image_Edit = ref(null); // Image for editing
const ImagePreview_Edit = ref(null); // Image preview for editing
const TinhTrang_Edit = ref(""); // Condition for editing
const MachineCode_Edit = ref(""); // Machine code for editing

// Add form states
const TenThietBi_Add = ref(""); // Device name for adding new
const LoaiThietBi_Add = ref(""); // Device type for adding new
const NhaSanXuat_Add = ref(""); // Manufacturer for adding new
const NgayMua_Add = ref(""); // Purchase date for adding new
const ViTri_Add = ref(""); // Location for adding new
const MoTa_Add = ref(""); // Description for adding new
const Image_Add = ref(null); // Image for adding new
const ImagePreview_Add = ref(null);
const MachineCode_Add = ref("");

// ===== TABLE CONFIGURATION =====
// Search and pagination states
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(15);

// Table headers configuration
const Headers = [
  { title: "Ảnh", key: "Image", width: "150" },
  { title: "Mã thiết bị", key: "MachineCode", width: "200" },
  { title: "Tên thiết bị", key: "TenThietBi", width: "250" },
  { title: "Loại thiết bị", key: "LoaiThietBi" },
  { title: "Nhà sản xuất", key: "NhaSanXuat" },
  { title: "Ngày mua", key: "NgayMuaConvert" },
  { title: "Tình trạng", key: "Condition" },
  { title: "Vị trí", key: "ViTri" },
  { title: "Mô tả", key: "MoTa", width: "250" },
  { title: "Thao tác", key: "MaThietBi", sortable: false },
];

watch(Image_Add, (file) => {
  if (!file) {
    ImagePreview_Add.value = null;
    return;
  }

  ImagePreview_Add.value = URL.createObjectURL(file);
});

watch(Image_Edit, (file) => {
  if (!file) {
    ImagePreview_Edit.value = null;
    return;
  }

  ImagePreview_Edit.value = URL.createObjectURL(file);
});

// ===== CRUD OPERATIONS =====
/**
 * Navigates to device details page and stores device information
 * @param {string} value - The ID of the device to view
 */
function PushItem(value) {
  const found = machine.value.find((v) => v.MaThietBi === value);
  router.push(`/Bao-tri/Chi-tiet/${value}`);
  localStorage.setItem("MaintenanceID", found.TenThietBi);

}

/**
 * Prepares an item for editing by setting up the edit dialog
 * @param {string} value - The ID of the item to edit
 */
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;

  const found = machine.value.find((v) => v.MaThietBi === value);

  TenThietBi_Edit.value = found.TenThietBi;
  LoaiThietBi_Edit.value = found.LoaiThietBi;
  NhaSanXuat_Edit.value = found.NhaSanXuat;
  NgayMua_Edit.value = found.NgayMuaUnixpoch;
  ViTri_Edit.value = found.ViTri;
  MoTa_Edit.value = found.MoTa;
  Image_Edit.value = null;
  TinhTrang_Edit.value = found.Condition;
  MachineCode_Edit.value = found.MachineCode;

  // ✅ preview ảnh từ server
  ImagePreview_Edit.value = found.Image ? `${API_URL}${found.Image}` : null;
}

/**
 * Saves edited device data
 * Makes an API call to update device information
 */
const SaveEdit = async () => {
  DialogLoading.value = true;

  const formData = new FormData();

  formData.append("TenThietBi", TenThietBi_Edit.value);
  formData.append("LoaiThietBi", LoaiThietBi_Edit.value);
  formData.append("NhaSanXuat", NhaSanXuat_Edit.value);
  formData.append("NgayMua", NgayMua_Edit.value);
  formData.append("ViTri", ViTri_Edit.value);
  formData.append("MoTa", MoTa_Edit.value);
  formData.append("TinhTrang", TinhTrang_Edit.value);
  formData.append("MachineCode", MachineCode_Edit.value);

  // ✅ CHỈ append nếu có chọn ảnh mới
  if (Image_Edit.value) {
    formData.append("image", Image_Edit.value);
  }

  try {
    const response = await axios.put(
      `${Url}/Machine/Edit/${GetID.value}`,
      formData
    );

    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    Reset();
  } catch (error) {
    console.error(error);
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    Error();
  } finally {
    DialogLoading.value = false;
  }
};

/**
 * Saves new device data
 * Makes an API call to create a new device
 */
const SaveAdd = async () => {
  DialogLoading.value = true;

  const formData = new FormData();
  formData.append("TenThietBi", TenThietBi_Add.value);
  formData.append("LoaiThietBi", LoaiThietBi_Add.value);
  formData.append("NhaSanXuat", NhaSanXuat_Add.value);
  formData.append("NgayMua", NgayMua_Add.value);
  formData.append("ViTri", ViTri_Add.value);
  formData.append("MoTa", MoTa_Add.value);
  formData.append("MachineCode", MachineCode_Add.value);

  if (Image_Add.value) {
    formData.append("image", Image_Add.value);
  }

  try {
    await axios.post(`${Url}/Machine/Add`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    Reset();
    DialogSuccess.value = true;
    MessageDialog.value = "Thêm dữ liệu thành công";
  } catch (err) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
  } finally {
    DialogLoading.value = false;
    DialogAdd.value = false;
  }
};

/**
 * Removes a device from the system
 * Makes an API call to delete the device
 */
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(`${Url}/Machine/Delete/${GetID.value}`);
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
 * Imports device data from a file
 * Makes an API call to upload and process the file
 */
const ImportFile = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", File.value);

  try {
    const response = await axios.post(`${Url}/Maintenance/upload`, formData);
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
const getMaintenanceHistory = (item) => {
  if (
    !item.MaintenanceHistory ||
    item.MaintenanceHistory === "" ||
    item.MaintenanceHistory === "[]"
  )
    return [];
  try {
    const parsed = JSON.parse(`[${item.MaintenanceHistory}]`);
    return parsed.filter((s) => s && s.MaBaoTri);
  } catch (e) {
    return [];
  }
};

const getSchedules = (item) => {
  if (!item.Schedules || item.Schedules === "" || item.Schedules === "[]")
    return [];
  try {
    const parsed = JSON.parse(`[${item.Schedules}]`);
    return parsed.filter((s) => s && s.MaLich);
  } catch (e) {
    return [];
  }
};

/**
 * Resets all dialog states and form data
 * Called after successful operations
 */
function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  Dialog.value = false;
  DialogLoading.value = false;
  TenThietBi_Add.value = "";
  LoaiThietBi_Add.value = "";
  NhaSanXuat_Add.value = "";
  NgayMua_Add.value = "";
  ViTri_Add.value = "";
  MoTa_Add.value = "";
  MachineCode_Add.value = "";
  Image_Add.value = null;
  ImagePreview_Add.value = null;
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
    ButtonAdd,
    ButtonCancel,
    ButtonSave,
    ButtonRemove,
    ButtonEdit,
    ButtonImportFile,
    ButtonDownload,
    ButtonEye,
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      File: null,
    };
  },
};
</script>
