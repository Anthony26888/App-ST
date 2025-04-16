<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách tồn kho</v-card-title
    >
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <ButtonImportFile @import-file="Dialog = true" />
          <ButtonAdd @click="DialogNewItems = true" />
          <ButtonDownload @download-file="DownloadInventory()" />
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ warehouse.length }} linh kiện)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="overflow-auto">
          <v-data-table
            :headers="Headers"
            :items="warehouse"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
          >
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(warehouse.length / this.itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
            <template v-slot:item.id="{ value }">
              <ButtonEdit @click="GetItem(value)" />
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
  <v-dialog v-model="DialogNewItems" scrollable>
    <v-card
      width="600"
      class="mx-auto overflow-y-auto"
      prepend-icon="mdi-update"
      title="Thêm linh kiện"
    >
      <v-card-text>
        <InputField label="Part Number 1" v-model="PartNumber1" />
        <InputField label="Part Number 2" v-model="PartNumber2" />
        <v-textarea
          label="Mô tả"
          variant="solo-filled"
          v-model="Description"
          clearable
        ></v-textarea>
        <v-row>
          <v-col>
            <InputField label="Nhập kho" type="number" v-model="Input" />
          </v-col>
          <v-col>
            <InputField label="Xuất kho" type="number" v-model="Output" />
          </v-col>
          <v-col>
            <InputField label="Tồn kho" type="number" v-model="inventory" />
          </v-col>
        </v-row>
        <InputField label="Vị trí" v-model="Location" />
        <InputField label="Khách hàng" v-model="Customer" />
        <InputField label="Ghi chú" v-model="Note" />
        <InputField label="Ghi chú xuất" v-model="Note_Output" />
      </v-card-text>
      <v-card-actions>
        <ButtonCancel @cancel="DialogNewItems = false" />
        <ButtonSave @save="NewItem()" />
      </v-card-actions>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" />
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
            <InputField label="Nhập kho" type="number" v-model="Input_Edit" @input="updateInventoryOnOutput"/>
          </v-col>
          <v-col>
            <InputField label="Xuất kho" type="number" v-model="Output_Edit" @input="updateInventoryOnOutput"/>
          </v-col>
          <v-col>
            <InputField label="Tồn kho" type="number" v-model="inventory_Edit" :readonly="true" />
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
        <ButtonSave @save="SaveEditItem()" />
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
</template>
<script setup>
import axios from "axios";
import { useWareHouse } from "@/composables/useWareHouse";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
const { warehouse } = useWareHouse();
const router = useRouter();
const Url = import.meta.env.VITE_API_URL;
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogNewItem = ref(false);
const GetID = ref('');
function GetItem(value){
  DialogEdit.value = true;
  const found = warehouse.value.find((v) => v.id === value);
  
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
    ButtonAdd,
    InputSearch,
    InputFiles,
    SnackbarSuccess,
  },
  data() {
    return {
      
      search: "",
      Dialog: false,
      DialogNewItems: false,
      DialogSuccess: false,
      DialogEdit: false,
      DialogRemove: false,
      GetRow: "",
      File: null,
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
      PartNumber1: "",
      PartNumber2: "",
      Description: "",
      Input: "",
      Output: "",
      inventory: "",
      Location: "",
      Customer: "",
      Note: "",
      Note_Output: "",
      PartNumber1_Edit: "",
      PartNumber2_Edit: "",
      Description_Edit: "",
      Input_Edit: "",
      Output_Edit: "",
      inventory_Edit: "",
      Location_Edit: "",
      Customer_Edit: "",
      Note_Edit: "",
      Note_Output_Edit: "",
      id_Edit: "",
      UserInterval: null,
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {
    updateInventoryOnOutput(event) {
      const outputValue = parseInt(event.target.value) || 0;
      const inputValue = parseInt(this.Input_Edit) || 0;
      if (!this.Output_Edit) {
        this.inventory_Edit = inputValue;
      } else if((inputValue - outputValue) > 0){
        this.inventory_Edit = inputValue - outputValue;
      } else{
        this.inventory_Edit = 0
      }
    },
    async ImportFile() {
      const formData = new FormData();
      formData.append("file", this.File);
      this.Reset();
      axios
        .post(`${this.Url}/WareHouse/Upload`, formData)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async NewItem() {
      const Items = {
        Description: this.Description,
        PartNumber_1: this.PartNumber1,
        PartNumber_2: this.PartNumber2,
        Input: this.Input,
        Output: this.Output,
        Inventory: this.inventory,
        Location: this.Location,
        Customer: this.Customer,
        Note: this.Note,
        Note_Output: this.Note_Output,
      };
      this.Reset();
      axios
        .post(`${this.Url}/Inventory/upload-new-item`, Items)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    Reset() {
      (this.DialogSuccess = true),
        (this.PartNumber1 = ""),
        (this.PartNumber2 = ""),
        (this.Description = ""),
        (this.Input = ""),
        (this.Output = ""),
        (this.inventory = ""),
        (this.Location = ""),
        (this.Customer = ""),
        (this.Note = ""),
        (this.Note_Output = ""),
        (this.PartNumber1 = ""),
        (this.PartNumber2 = ""),
        (this.Description = ""),
        (this.Input = ""),
        (this.Output = ""),
        (this.inventory = ""),
        (this.Location = ""),
        (this.Customer = ""),
        (this.Note = ""),
        (this.Note_Output = "");
      (this.File = null), (this.DialogEdit = false);
      this.Dialog = false;
      this.DialogRemove = false;
      this.DialogNewItems = false;
    },
    async DownloadInventory() {
      try {
        const response = await fetch(`${this.Url}/Ware-House/download`);
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
      }
    },
    EditItem(value) {
      this.DialogEdit = true;
      this.FetchDetailItem(value);
    },
    async FetchDetailItem(value) {
      if (value) {
        try {
          const res = await fetch(`${this.Url}/WareHouse/${value}`);
          const DetailItem = await res.json();
          (this.PartNumber1_Edit = DetailItem[0].PartNumber_1),
            (this.PartNumber2_Edit = DetailItem[0].PartNumber_2),
            (this.Description_Edit = DetailItem[0].Description),
            (this.Input_Edit = DetailItem[0].Input),
            (this.Output_Edit = DetailItem[0].Output),
            (this.inventory_Edit = DetailItem[0].Inventory),
            (this.Location_Edit = DetailItem[0].Location),
            (this.Customer_Edit = DetailItem[0].Customer),
            (this.Note_Edit = DetailItem[0].Note),
            (this.Note_Output_Edit = DetailItem[0].Note_Output);
          this.id_Edit = DetailItem[0].id;
        } catch (error) {
          this.DialogFailed = true;
          console.error("Error fetching user data:", error);
        }
      }
    },
    async SaveEditItem() {
      const Item = {
        PartNumber1_Edit: this.PartNumber1_Edit,
        PartNumber2_Edit: this.PartNumber2_Edit,
        Description_Edit: this.Description_Edit,
        Input_Edit: this.Input_Edit,
        Output_Edit: this.Output_Edit,
        inventory_Edit: this.inventory_Edit,
        Location_Edit: this.Location_Edit,
        Customer_Edit: this.Customer_Edit,
        Note_Edit: this.Note_Edit,
        Note_Output_Edit: this.Note_Output_Edit,
      };
      this.Reset();
      axios
        .put(`${this.Url}/WareHouse/update-item/${this.id_Edit}`, Item)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async RemoveItem() {
      this.Reset();
      axios
        .delete(`${this.Url}/WareHouse/delete-item/${this.id_Edit}`)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
};
</script>
<style lang=""></style>
