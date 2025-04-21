<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách tồn kho 2</v-card-title
    >
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <ButtonImportFile @import-file="Dialog = true" />
          <v-btn
            prepend-icon="mdi mdi-plus"
            variant="tonal"
            color="primary"
            class="text-caption ms-2"
            @click="DialogAdd = true"
            >Thêm</v-btn
          >
          <ButtonDownload @download-file="DownloadInventory()" />
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ warehouse2.length }} linh kiện)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="overflow-auto">
          <v-data-table
            :headers="Headers"
            :items="warehouse2"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
          >
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(warehouse2.length / this.itemsPerPage)"
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
      prepend-icon="mdi-update"
      title="Thêm linh kiện"
    >
      <v-card-text>
        <InputField label="Part Number 1" v-model="PartNumber1_Add" />
        <InputField label="Part Number 2" v-model="PartNumber2_Add" />
        <v-textarea
          label="Mô tả"
          variant="solo-filled"
          v-model="Description_Add"
          clearable
        ></v-textarea>
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

  <v-dialog v-model="DialogEdit" width="400" scrollable>
    <v-card
      width="600"
      class="mx-auto overflow-y-auto"
      prepend-icon="mdi-update"
      title="Cập nhật dữ liệu"
    >
      <v-card-text>
        <InputField label="Part Number 1" v-model="PartNumber1_Edit" />
        <InputField label="Part Number 2" v-model="PartNumber2_Edit" />
        <v-textarea
          label="Mô tả"
          variant="solo-filled"
          v-model="Description_Edit"
          clearable
        ></v-textarea>
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
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá linh kiện này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogInfo" width="800">
    <v-card
      max-width="800"
      prepend-icon="mdi-information-variant-circle"
      title="Thông số kỹ thuật"
    >
      <template v-slot:append>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="DialogInfo = false"
        ></v-btn>
      </template>
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
  <Loading v-model="DialogLoading" />
  <SnackbarSuccess v-model="DialogSuccess" />
  <SnackbarFailed v-model="DialogFailed" />
  <SnackbarCaution v-model="DialogCaution" />
</template>
<script setup>
import axios from "axios";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWareHouse2 } from "@/composables/useWareHouse2";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import SnackbarCaution from "@/components/Snackbar-Caution.vue";
import ButtonSearch from "@/components/Button-Search.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import Loading  from "@/components/Loading.vue";
import { Buffer } from "buffer"
const { warehouse2 } = useWareHouse2();
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
  const found = warehouse2.value.find((v) => v.id === value);
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
    .put(`${Url}/WareHouse2/update-item/${GetID.value}`, formData)
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
    .post(`${Url}/WareHouse2/upload-new-item`, formData)
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
    .delete(`${Url}/WareHouse2/delete-item/${GetID.value}`)
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
    .post(`${Url}/WareHouse2/Upload`, formData)
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
    const response = await fetch(`${Url}/Ware-House2/download`);
    if (!response.ok) throw new Error("Download failed");

    // Convert response to blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create a link to download
    const a = document.createElement("a");
    a.href = url;
    a.download = `Kho2.xlsx`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};
const getAccessToken = async (value) => {
  DialogLoading.value = true;
  const found = warehouse2.value.find((v) => v.id === value);
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
      DialogCaution.value = true,
      DialogLoading.value = false
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
}
function Error() {
  DialogLoading.value = false;
  DialogSuccess.value = false;
  DialogFailed.value = true;
}
</script>
<script>
export default {
  components: {
    InputField,
    ButtonDelete,
    ButtonCancel,
    ButtonDownload,
    ButtonImportFile,
    ButtonSave,
    InputSearch,
    InputFiles,
    SnackbarSuccess,
    SnackbarFailed,
    SnackbarCaution,
    Loading,
    ButtonSearch,
    ButtonEdit
  },
  data() {
    return {
      search: "",
      Headers: [
        {
          key: "Description",
          sortable: false,
          title: "Mô tả",
          width: "200px",
        },
        { key: "PartNumber_1", title: "Mã hàng 1" },
        { key: "PartNumber_2", title: "Mã hàng 2" },
        { key: "Input", title: "SL Nhập" },
        { key: "Output", title: "SL Xuất" },
        { key: "Inventory", title: "SL Tồn kho" },
        { key: "Location", title: "Vị trí" },
        { key: "Customer", title: "Mã kho" },
        { key: "Note", title: "Ghi chú" },
        { key: "Note_Output", title: "Ghi chú xuất" },
        { key: "id", title: "Sửa" },
      ],
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {},
};
</script>
<style lang=""></style>
