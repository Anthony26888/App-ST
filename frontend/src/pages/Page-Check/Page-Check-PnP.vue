<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Danh-sach-pnp" />
      <p class="text-h4 font-weight-light ms-3">Dữ liệu SMT</p>
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <ButtonAdd @add="DialogAddBom = true" label="Thêm file Bom" />
      <ButtonAdd @add="DialogAddPnP = true" label="Thêm file Pick&Place" />
      <ButtonAdd @add="DialogAddGerber = true" label="Thêm file Gerber" />
      <p class="text-subtitle-1 font-weight-thin text-subtitle-1 ms-2">
        {{ combineBom.length }} linh kiện
      </p>
      <v-spacer></v-spacer>
      <InputSearch v-model="searchBom" />
    </v-card-title>
    <v-card-text>
      <v-data-table
        :headers="Headers"
        :items="combineBom"
        :search="searchBom"
        :items-per-page="itemsPerPageBom"
        v-model:page="pageBom"
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
              v-model="pageBom"
              :length="Math.ceil(combineBom.length / itemsPerPageBom)"
            ></v-pagination>
          </div>
        </template>
        <template v-slot:item.stt="{ index }">
          {{ (pageBom - 1) * itemsPerPageBom + index + 1 }}
        </template>
        <template v-slot:item.id="{ value }">
          <div class="d-flex">
            <ButtonEdit @edit="GetItem(value)" />
            <ButtonSearch @search="getAccessToken(value)" class="ms-2"/>
          </div>
        </template>
        <template v-slot:item.mount_type="{ value }">
          <v-chip
            :color="value === 'SMT' ? 'primary' : 'warning'"
            size="small"
            variant="tonal"
          >
            {{ value }}
          </v-chip>
        </template>
        <template v-slot:item.layer="{ value }">
          <v-chip
            :color="value === 'Top' ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            {{ value }}
          </v-chip>
        </template>
      </v-data-table>

      <v-card-title class="d-flex align-center pe-2 mt-5">
        So sánh Pick & Place và Gerber
        <p class="text-subtitle-1 font-weight-thin text-subtitle-1 ms-2">
          {{ combineBom.length }} linh kiện
        </p>
        <v-spacer></v-spacer>
        <InputSearch v-model="searchGerber" />
      </v-card-title>
      <v-data-table
        :headers="HeadersPnP"
        :items="combineGerber"
        :search="searchGerber"
        :items-per-page="itemsPerPageGerber"
        v-model:page="pageGerber"
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
              v-model="pageGerber"
              :length="Math.ceil(combineGerber.length / itemsPerPageGerber)"
            ></v-pagination>
          </div>
        </template>
        <template v-slot:item.stt="{ index }">
          {{ (pageGerber - 1) * itemsPerPageGerber + index + 1 }}
        </template>
        <template v-slot:item.id="{ value }">
          <div class="d-flex">
            <ButtonEdit @edit="GetItem(value)" />
            
          </div>
        </template>
        <template v-slot:item.layer="{ value }">
          <v-chip
            :color="value === 'Top' ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            {{ value }}
          </v-chip>
        </template>
        <template v-slot:item.match_quality="{ value }">
          <v-chip
            :color="getMatchColor(value)"
            size="small"
            variant="tonal"
          >
            {{ value }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogAddBom" width="600" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu BOM
      </v-card-title>
      <v-card-text>
        <InputFiles
          label="Nhập file Bom (.xlsx)"
          class="mt-2"
          v-model="FileBom"
          name="bom"
        />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAddBom = false" />
        <ButtonSave @save="uploadBOM()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogAddPnP" width="600" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu Pick & Place
      </v-card-title>
      <v-card-text>
        <InputFiles
          label="Nhập file Pick & Place (.csv)"
          class="mt-2"
          v-model="FilePnP"
          name="pnp"
        />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAddPnP = false" />
        <ButtonSave @save="uploadPNP" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogAddGerber" width="600" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu Gerber
      </v-card-title>
      <v-card-text>
        <InputFiles
          label="Nhập file Gerber"
          class="mt-2"
          v-model="FileGerber"
          accept="*"
          name="gerber"
        />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAddGerber = false" />
        <ButtonSave @save="uploadGerber" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá Bom này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Chỉnh sửa dữ liệu">
      <v-card-text>
        <InputField label="Toạ độ X (mm)" v-model="PosX"/>
        <InputField label="Toạ độ Y (mm)" v-model="PosY"/>
        <InputField label="Rotation" v-model="Rotation"/>
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarCaution v-model="DialogCaution" :message="MessageCautionDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useCombineBom } from "@/composables/CheckBOM/useCombineBom";
import { useCombineGerber } from "@/composables/CheckBOM/useCombineGerber";
import ButtonBack from "@/components/Button-Back.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonRemove from "@/components/Button-Remove.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonSearch from "@/components/Button-Search.vue";
import Loading from "@/components/Loading.vue";

//

const Url = import.meta.env.VITE_API_URL;
const GetID = ref("");
const route = useRoute();
const id = route.params.id;
const { combineBom, combineBomErrror } = useCombineBom(id);
const { combineGerber, combineGerberErrror } = useCombineGerber(id);

// Dialog status
const DialogEdit = ref(false);
const DialogAddBom = ref(false);
const DialogAddPnP = ref(false);
const DialogAddGerber = ref(false);
const DialogRemove = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const DialogSuccess = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// Data page
const FileBom = ref(null);
const FilePnP = ref(null);
const FileGerber = ref(null);

// Data search item in digikey
const GetDigikey = ref("");
const accessToken = ref(null);
const tokenType = ref(null);
const expires_in = ref(null);
const ResultSearch = ref(null);

// Table status
const Headers = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator", width: "150px" },
  { title: "Manufacture Part Number", key: "mpn", width: "150px" },
  { title: "X (mm)", key: "x" },
  { title: "Y (mm)", key: "y" },
  { title: "Rotation", key: "rotation" },
  { title: "Layer", key: "layer" },
  { title: "Định dạng", key: "mount_type" },
  { title: "Description", key: "description", width: "150px" },
  { title: "Thao tác", key: "id", sortable: false },
];

const HeadersPnP = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator", width: "250px" },
  { title: "X-PnP (mm)", key: "pick_x_mm" },
  { title: "Y-PnP (mm)", key: "pick_y_mm" },
  { title: "X-Gerber (mm)", key: "aligned_gerber_x_mm" },
  { title: "Y-Gerber (mm)", key: "aligned_gerber_y_mm" },
  { title: "Rotation", key: "rotation" },
  { title: "Layer", key: "layer" },
  { title: "Trùng khớp", key: "match_quality", width: "250px" },
];
const searchBom = ref("");
const itemsPerPageBom = ref(20);
const pageBom = ref(1);

const searchGerber = ref("");
const itemsPerPageGerber = ref(20);
const pageGerber = ref(1);
// Color mapping for match quality categories
const getMatchColor = (value) => {
  if (!value) return "secondary";
  if (/^PERFECT/.test(value)) return "success";
  if (/^EXCELLENT/.test(value)) return "info";
  if (/^GOOD/.test(value)) return "primary";
  if (/^OK/.test(value)) return "secondary";
  if (/^POOR/.test(value)) return "warning";
  if (/^BAD/.test(value)) return "error";
  return "secondary";
};
// Function
const GetItem = (item) =>{
  DialogEdit.value = true
};

const uploadBOM = async () => {
  try {
    const formData = new FormData();
    formData.append("FileBom", FileBom.value);
    await axios.post(`${Url}/upload-bom/${id}`, formData);
    DialogSuccess.value = true;
    MessageDialog.value = "Upload Bom thành công";
    DialogAddBom.value = false;
    FileBom.value = null;
    console.log("BOM upload thành công");
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload Bom thất bại";
    console.error("Lỗi upload BOM:", error);
  }
};

const uploadPNP = async () => {
  try {
    const formData = new FormData();
    formData.append("FilePnP", FilePnP.value);
    await axios.post(`${Url}/upload-pickplace/${id}`, formData);
    DialogSuccess.value = true;
    MessageDialog.value = "Upload Pick&Place thành công";
    DialogAddPnP.value = false;
    FilePnP.value = null;
    console.log("PickPlace upload thành công");
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload Pick&Place thất bại";
    console.error("Lỗi upload PickPlace:", error);
  }
};

const uploadGerber = async () => {
  try {
    const formData = new FormData();
    // Nếu Vuetify trả về mảng thì lấy phần tử đầu tiên
    formData.append(
      "FileGerber",
      Array.isArray(FileGerber.value) ? FileGerber.value[0] : FileGerber.value
    );

    await axios.post(`${Url}/upload-gerber/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    DialogSuccess.value = true;
    MessageDialog.value = "Upload Gerber thành công";
    DialogAddGerber.value = false;
    FileGerber.value = null;
    console.log("Gerber upload thành công");
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload Gerber thất bại";
    console.error("Lỗi upload Gerber:", error.response?.data || error);
  }
};


// ===== DIGIKEY API OPERATIONS =====
/**
 * Gets access token from DigiKey API
 * @param {string} value - The ID of the item to search
 */
 const getAccessToken = async (value) => {
  DialogLoading.value = true;
  const found = combineBom.value.find((v) => v.id === value);
  GetDigikey.value = found.mpn;

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
</script>
<script>
export default {
  components: {
    ButtonBack,
    ButtonEdit,
    ButtonRemove,
    ButtonDelete,
    InputSearch,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
  },
};
</script>
<style lang=""></style>
