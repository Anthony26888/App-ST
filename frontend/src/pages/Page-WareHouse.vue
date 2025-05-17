<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách tồn kho</v-card-title
    >
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <ButtonImportFile @import-file="Dialog = true" />
          <ButtonAdd @click="DialogAdd = true" />
          <ButtonDownload @download-file="DownloadWareHouse()" />
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
              'items-per-page-text': 'Số hàng mỗi trang'
            }"
            :header-props="{
              sortByText: 'Sắp xếp theo',
              sortDescText: 'Giảm dần',
              sortAscText: 'Tăng dần'
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
                <ButtonEdit @edit="GetItem(value)" />
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
  <v-dialog v-model="DialogAdd" scrollable>
    <v-card
      width="600"
      class="mx-auto overflow-y-auto"
    >
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
            <InputField label="Tồn kho" type="number" v-model="inventory_Add" />
          </v-col>
        </v-row>
        <InputField label="Vị trí" v-model="Location_Add" />
        <InputField label="Khách hàng" v-model="Customer_Add" />
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
    <v-card
      width="600"
      class="mx-auto overflow-y-auto"
    >
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật dữ liệu
      </v-card-title>
      <v-card-text >
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
              label="Tồn kho"
              type="number"
              v-model="inventory_Edit"
              :readonly="true"
            />
          </v-col>
        </v-row>
        <InputField label="Vị trí" v-model="Location_Edit" />
        <InputField label="Khách hàng" v-model="Customer_Edit" />
        <InputField label="Ghi chú" v-model="Note_Edit" />
        <InputField label="Ghi chú xuất" v-model="Note_Output_Edit" />
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
        <div class="text-body-1">
          Bạn có chắc chắn muốn xóa linh kiện này?
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" class="ms-2" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogInfo" width="800" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-information-variant-circle" color="primary" class="me-2"></v-icon>
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
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarCaution v-model="DialogCaution" />
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { useWareHouse } from "@/composables/useWareHouse";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Buffer } from "buffer";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonSearch from "@/components/Button-Search.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import SnackbarCaution from "@/components/Snackbar-Caution.vue";
import Loading from "@/components/Loading.vue";
const { warehouse } = useWareHouse();
const router = useRouter();
const Url = import.meta.env.VITE_API_URL;
const Dialog = ref(false);
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogAdd = ref(false);
const DialogInfo = ref(false);
const DialogCaution = ref(false);
const DialogLoading = ref(false);
const Headers = ref([
  {
    key: "Description",
    sortable: false,
    title: "Mô tả",
    width: "200px",
    noWrap: true
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
const File = ref(null);
const PartNumber1_Edit = ref("");
const PartNumber2_Edit = ref("");
const Description_Edit = ref("");
const Input_Edit = ref("");
const Output_Edit = ref("");
const inventory_Edit = ref("");
const Location_Edit = ref("");
const Customer_Edit = ref("");
const Note_Edit = ref("");
const Note_Output_Edit = ref("");
const PartNumber1_Add = ref("");
const PartNumber2_Add = ref("");
const Description_Add = ref("");
const Input_Add = ref("");
const Output_Add = ref("");
const inventory_Add = ref("");
const Location_Add = ref("");
const Customer_Add = ref("");
const Note_Add = ref("");
const Note_Output_Add = ref("");
const GetID = ref("");
const GetDigikey = ref("");
const clientId = import.meta.env.VITE_DIGIKEY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_DIGIKEY_CLIENT_SECRET;
const accessToken = ref(null);
const tokenType = ref(null);
const expires_in = ref(null);
const ResultSearch = ref(null);
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = warehouse.value.find((v) => v.id === value);
  PartNumber1_Edit.value = found.PartNumber_1;
  PartNumber2_Edit.value = found.PartNumber_2;
  Description_Edit.value = found.Description;
  Input_Edit.value = found.Input;
  Output_Edit.value = found.Output;
  inventory_Edit.value = found.Inventory;
  Location_Edit.value = found.Location;
  Customer_Edit.value = found.Customer;
  Note_Edit.value = found.Note;
  Note_Output_Edit.value = found.Note_Output_Edit;
}
function updateInventoryOnOutput(event) {
  const outputValue = parseInt(event.target.value) || 0;
  const inputValue = parseInt(Input_Edit.value) || 0;
  if (!Output_Edit.value) {
    inventory_Edit.value = inputValue;
  } else if (inputValue - outputValue > 0) {
    inventory_Edit.value = inputValue - outputValue;
  } else {
    inventory_Edit.value = 0;
  }
}
const SaveEdit = async () => {
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
  };
  axios
    .put(`${Url}/WareHouse/update-item/${GetID.value}`, formData)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
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
  axios
    .post(`${Url}/WareHouse/upload-new-item`, formData)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const RemoveItem = async () => {
  DialogLoading.value = true;
  axios
    .delete(`${Url}/WareHouse/delete-item/${GetID.value}`)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const ImportFile = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", File.value);
  axios
    .post(`${Url}/WareHouse/Upload`, formData)
    .then(function (response) {
      console.log(response);
      Reset();
    })
    .catch(function (error) {
      console.log(error);
      Error();
    });
};
const DownloadWareHouse = async () => {
  try {
    const response = await fetch(`${Url}/Ware-House/download`);
    if (!response.ok) throw new Error("Download failed");

    // Convert response to blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create a link to download
    const a = document.createElement("a");
    a.href = url;
    a.download = `Kho.xlsx`;
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
  const found = warehouse.value.find((v) => v.id === value);
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
  DialogSuccess.value = true;
  DialogRemove.value = false;
  DialogAdd.value = false;
  Dialog.value = false;
  DialogLoading.value = false;
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
}
function Error() {
  DialogFailed.value = false;
  DialogLoading.value = false;
  DialogCaution.value = true;
  DialogSuccess.value = false;
  File.value = null;
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
  },
  data() {
    return {
      search: "",
      
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {},
};
</script>
<style lang=""></style>
