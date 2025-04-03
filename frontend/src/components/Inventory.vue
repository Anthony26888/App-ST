<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Danh sách tồn kho</v-card-title
    >
    <v-card-text>
      <v-card variant="text">
        <v-card-title class="d-flex align-center pe-2">
          <v-btn
            prepend-icon="mdi mdi-plus"
            variant="tonal"
            class="text-caption"
            @click="Dialog = true"
            >Import File</v-btn
          >
          <v-btn
            prepend-icon="mdi mdi-plus"
            variant="tonal"
            color="primary"
            class="text-caption ms-2"
            @click="DialogNewItems = true"
            >Thêm</v-btn
          >
          <v-btn
            prepend-icon="mdi mdi-download"
            color="success"
            class="ms-2 text-caption"
            variant="tonal"
            @click="DownloadInventory()"
            >Tải file</v-btn
          >
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ warehouse.length }} linh kiện)
          </p>
          <v-spacer></v-spacer>
          <v-text-field
            v-model="search"
            density="compact"
            label="Tìm kiếm"
            prepend-inner-icon="mdi-magnify"
            variant="solo-filled"
            flat
            hide-details
            single-line
            clearable
            max-width="400"
          ></v-text-field>
        </v-card-title>
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
                <v-pagination v-model="page" :length="Math.ceil(warehouse.length / this.itemsPerPage)"></v-pagination>
              </div>
            </template>
            <template v-slot:item.id="{ value }">
              <v-btn
                icon="mdi-pencil"
                size="xl"
                color="primary"
                variant="text"
                @click="EditItem(value)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <v-dialog v-model="Dialog" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
      <v-card-text>
        <v-file-input
          clearable
          label="Thêm File Excel"
          variant="solo-filled"
          v-model="File"
          accept=".xlsx"
        ></v-file-input>
      </v-card-text>
      <template v-slot:actions>
        <v-btn @click="Dialog = false" variant="tonal">Huỷ</v-btn>
        <v-btn class="bg-primary" @click="ImportFile(); DialogSuccess=true">Nhập dữ liệu</v-btn>
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
        <v-text-field
          label="Part Number 1"
          variant="solo-filled"
          v-model="PartNumber1"
          clearable
        ></v-text-field>
        <v-text-field
          label="Part Number 2"
          variant="solo-filled"
          v-model="PartNumber2"
          clearable
        ></v-text-field>
        <v-textarea
          label="Mô tả"
          variant="solo-filled"
          v-model="Description"
          clearable
        ></v-textarea>
        <v-row>
          <v-col>
            <v-text-field
              type="num"
              label="Nhập kho"
              v-model="Input"
              variant="solo-filled"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              type="num"
              label="Xuất kho"
              v-model="Output"
              variant="solo-filled"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              type="num"
              label="Tồn kho"
              v-model="inventory"
              variant="solo-filled"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-text-field
          label="Vị trí"
          variant="solo-filled"
          v-model="Location"
          clearable
        ></v-text-field>
        <v-text-field
          clearable
          label="Khách hàng"
          variant="solo-filled"
          v-model="Customer"
        ></v-text-field>
        <v-text-field
          clearable
          label="Ghi chú"
          variant="solo-filled"
          v-model="Note"
        ></v-text-field>
        <v-text-field
          clearable
          label="Ghi chú xuất"
          variant="solo-filled"
          v-model="Note_Output"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="DialogNewItems = false" variant="tonal">Huỷ</v-btn>
        <v-btn class="bg-primary" @click="NewItem(), (DialogSuccess = true)"
          >Nhập dữ liệu</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogSuccess">
    <v-card width="500" height="400" class="mx-auto">
      <v-empty-state icon="$success">
        <template v-slot:media>
          <v-icon color="success"></v-icon>
        </template>

        <template v-slot:headline>
          <div class="text-h4">Thành Công</div>
        </template>

        <template v-slot:text>
          <div class="text-medium-emphasis text-caption">
            Dữ liệu đã được nhập vào hệ thống
          </div>
        </template>
        <template v-slot:actions>
          <v-btn
            class="text-none"
            color="primary"
            elevation="1"
            rounded="lg"
            size="small"
            text="Tiếp tục"
            width="96"
            @click="ResetInput()"
          ></v-btn>
        </template>
      </v-empty-state>
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
        <v-text-field
          label="Part Number 1"
          variant="solo-filled"
          v-model="PartNumber1_Edit"
          clearable
        ></v-text-field>
        <v-text-field
          label="Part Number 2"
          variant="solo-filled"
          v-model="PartNumber2_Edit"
          clearable
        ></v-text-field>
        <v-textarea
          label="Mô tả"
          variant="solo-filled"
          v-model="Description_Edit"
          clearable
        ></v-textarea>
        <v-row>
          <v-col>
            <v-text-field
              type="num"
              label="Nhập kho"
              v-model="Input_Edit"
              variant="solo-filled"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              type="num"
              label="Xuất kho"
              v-model="Output_Edit"
              variant="solo-filled"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              type="num"
              label="Tồn kho"
              v-model="inventory_Edit"
              variant="solo-filled"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-text-field
          label="Vị trí"
          variant="solo-filled"
          v-model="Location_Edit"
          clearable
        ></v-text-field>
        <v-text-field
          clearable
          label="Khách hàng"
          variant="solo-filled"
          v-model="Customer_Edit"
        ></v-text-field>
        <v-text-field
          clearable
          label="Ghi chú"
          variant="solo-filled"
          v-model="Note_Edit"
        ></v-text-field>
        <v-text-field
          clearable
          label="Ghi chú xuất"
          variant="solo-filled"
          v-model="Note_Output_Edit"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="DialogRemove = true" variant="tonal" class="bg-red">Xoá linh kiện</v-btn>
        <v-spacer></v-spacer>
        <v-btn @click="DialogEdit = false" variant="tonal">Huỷ</v-btn>
        <v-btn class="bg-primary" @click="SaveEditItem(), (DialogSuccess = true)"
          >Nhập dữ liệu</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text>
        Bạn có chắc chắn muốn xoá linh kiện này ?
      </v-card-text>
      <template v-slot:actions>
        <v-btn @click="DialogRemove = false" variant="tonal">Huỷ</v-btn>
        <v-btn class="bg-red" @click="RemoveItem(); ResetInput()">Xoá</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>
<script setup>
import axios from "axios";
import { useSocket } from "@/composables/useWebSocket";

const { warehouse } = useSocket();
</script>
<script>
export default {
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      search: "",
      Dialog: false,
      DialogNewItems: false,
      DialogSuccess: false,
      DialogEdit:false,
      DialogRemove:false,
      GetRow:"",
      File:null,
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
      id_Edit : "",
      UserInterval:null,
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {
    async ImportFile() {
      const formData = new FormData();
      formData.append("file", this.File);
      axios
        .post(`${this.Url}/upload-inventory`, formData)
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
      axios
        .post(`${this.Url}/Inventory/upload-new-item`, Items)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    ResetInput() {
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
        this.File = null,
        this.DialogEdit = false;
        this.Dialog = false;
        this.DialogRemove = false;
      (this.DialogNewItems = false), (this.DialogSuccess = false);
    },
    async DownloadInventory() {
      try {
        const response = await fetch(`${this.Url}/Download-Inventory`);
        if (!response.ok) throw new Error("Download failed");

        // Convert response to blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Create a link to download
        const a = document.createElement("a");
        a.href = url;
        a.download = `Tồn_Kho.xlsx`;
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
      this.FetchDetailItem(value)
    },
    async FetchDetailItem(value){
      if (value) {
        try {
          const res = await fetch(`${this.Url}/Inventory/${value}`);
          const DetailItem = await res.json();
          this.PartNumber1_Edit =  DetailItem[0].PartNumber_1,
          this.PartNumber2_Edit =  DetailItem[0].PartNumber_2,
          this.Description_Edit =  DetailItem[0].Description,
          this.Input_Edit =  DetailItem[0].Input,
          this.Output_Edit =  DetailItem[0].Output,
          this.inventory_Edit = DetailItem[0].Inventory,
          this.Location_Edit =  DetailItem[0].Location,
          this.Customer_Edit =  DetailItem[0].Customer,
          this.Note_Edit =  DetailItem[0].Note,
          this.Note_Output_Edit =  DetailItem[0].Note_Output
          this.id_Edit = DetailItem[0].id
        } catch (error) {
          this.DialogFailed = true;
          console.error("Error fetching user data:", error);
        }
      }
    },
    async SaveEditItem() {
      const Item = {
        PartNumber1_Edit : this.PartNumber1_Edit,
        PartNumber2_Edit : this.PartNumber2_Edit,
        Description_Edit : this.Description_Edit,
        Input_Edit : this.Input_Edit,
        Output_Edit : this.Output_Edit,
        inventory_Edit : this.inventory_Edit,
        Location_Edit : this.Location_Edit,
        Customer_Edit : this.Customer_Edit,
        Note_Edit : this.Note_Edit,
        Note_Output_Edit : this.Note_Output_Edit,
      };
      axios
        .put(`${this.Url}/Inventory/update-item/${this.id_Edit}`, Item)
        .then(function (response) {
          console.log(response);
          this.DialogSuccess = true;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async RemoveItem() {
      axios
        .delete(`${this.Url}/Inventory/delete-item/${this.id_Edit}`)
        .then(function (response) {
          console.log(response);
          this.DialogRemove = false;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
};
</script>
<style lang=""></style>
