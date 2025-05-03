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
              <ButtonSearch @search="getAccessToken(value)" />
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="400" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu
      </v-card-title>
      <v-card-text>
        <InputField label="Hao phí thực tế" v-model="ActualCost" />
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
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
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
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarFailed v-model="DialogFailed" />
  <SnackbarCaution v-model="DialogCaution" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { ref, watch } from "vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import { useSocket } from "@/composables/useWebSocket";
import { useDetailOrder } from "@/composables/useDetailOrder";
import { Buffer } from "buffer";
const route = useRoute();
const id = route.params.id;
const { orders } = useSocket();
const { compare, compareError, headers } = useDetailOrder(id);
const Url = import.meta.env.VITE_API_URL;
const status = computed(() => {
  if (!orders.value || !Array.isArray(orders.value)) return null;
  const found = orders.value.find((v) => v.Name_PO === route.params.id);
  return found ? found.Status : null;
});
const Headers = ref([]);
const DialogEdit = ref(false);
const DialogAccept = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const DialogCaution = ref(false);
const DialogInfo = ref(false);
const NamePO = ref("");
const PartNumber_1 = ref("");
const GetID = ref("");
const ActualCost = ref("");
const GetDigikey = ref("");
const clientId = import.meta.env.VITE_DIGIKEY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_DIGIKEY_CLIENT_SECRET;
const accessToken = ref(null);
const tokenType = ref(null);
const expires_in = ref(null);
const ResultSearch = ref(null);
const search = ref("");
const itemsPerPage = ref(12);
const page = ref(1);

onMounted(() => {
  const storeData = localStorage.getItem("PO");
  NamePO.value = storeData;
});
watch(
  compare,
  (newBomData) => {
    console.log("checkBOM changed, generating headers with:", newBomData); // Log để kiểm tra
    generateHeaders(newBomData); // Gọi hàm generateHeaders với dữ liệu mới
  },
  { deep: true }
); // deep: trues
function generateHeaders(bomData) {
  if (bomData && bomData.length > 0) {
    // Lấy keys từ object ĐẦU TIÊN trong mảng
    const firstItemKeys = Object.keys(bomData[0]);
    console.log("Generating headers from keys:", firstItemKeys); // Log để kiểm tra keys
    Headers.value = firstItemKeys.map((key) => ({
      title: key.replace(/_/g, " "), // Thay thế gạch dưới bằng khoảng trắng
      key: key, // key để v-data-table lấy dữ liệu
      sortable: true, // Có thể thêm sortable
      width: 200,
    }));

  } else {
    console.log("No data to generate headers, clearing headers."); // Log khi không có dữ liệu
    Headers.value = []; // Reset headers nếu không có dữ liệu
  }
}
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = compare.value.find((v) => v.Sửa === value);
  PartNumber_1.value = found.PartNumber_1;
  ActualCost.value = found.Hao_Phí_Thực_Tế;
}
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = {
    Input_Hao_Phi_Thuc_Te: ActualCost.value,
    PartNumber_1: PartNumber_1.value,
  };
  axios
    .put(`${Url}/CheckBom/Update-Hao-Phi-Thuc-Te`, formData)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};

const WareHouseAcceptWareHouse = async () => {
  DialogLoading.value = true;
  axios
    .put(`${Url}/WareHouse/update-Inventory-CheckBom/${id}`)
    .then(function (response) {
      console.log(response);
      WareHouseAccept();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};

const WareHouse2AcceptWareHouse = async () => {
  DialogLoading.value = true;
  axios
    .put(`${Url}/WareHouse2/update-Inventory-CheckBom/${id}`)
    .then(function (response) {
      console.log(response);
      WareHouseAccept();
    })
    .catch(function (error) {
      console.log(error); 
      Error();
    });
};
const WareHouseAccept = async () => {
  axios
    .put(`${Url}/Orders/WareHouse-Accept/${id}`)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const DownloadOrder = async () => {
  try {
    const response = await fetch(`${Url}/Download-Order/${id}`);
    if (!response.ok) throw new Error("Download failed");

    // Convert response to blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create a link to download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.xlsx`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
    Error();
  }
};
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
      Error(),
      "Lỗi khi lấy access token:",
      error.response ? error.response.data : error.message
    );
    return false;
  }
};

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
    return null;
  }
};
function Reset() {
  DialogEdit.value = false;
  DialogLoading.value = false;
  DialogSuccess.value = true;
  DialogAccept.value = false;
}
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
  DialogAccept.value = false;
}
</script>
<script>
export default {
  components: {
    ButtonCancel,
    ButtonDownload,
    ButtonSave,
    InputSearch,
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
