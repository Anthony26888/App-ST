<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Kiểm tra số liệu linh kiện</v-card-title
    >
    <v-card-text>
      <v-container>
        <v-row justify="center" align="center">
          <v-col cols="2">
            <v-btn
              prepend-icon="mdi mdi-plus"
              variant="tonal"
              class="text-caption mb-4"
              @click="Dialog = true"
              >Import File</v-btn
            >
          </v-col>
          <v-col cols="8">
            <v-text-field
              label="Tên dự án"
              v-model="NamePO"
              clearable
              variant="solo-filled"
            ></v-text-field>
          </v-col>
          <v-col cols="2">
            <v-btn
              prepend-icon="mdi mdi-plus"
              variant="tonal"
              class="text-caption mb-4"
              @click="Dialog = true"
              >Import File</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
      <v-divider></v-divider>
      <v-empty-state
        v-if="NamePO == null || NamePO == ''"
        headline="OPPS !"
        title="Chưa có dữ liệu"
        text="Chon thêm file hoặc nhập tên PO"
        image="/src/assets/Empty.png"
      ></v-empty-state>
      <v-card
        variant="text"
        v-if="Bom.length > 0 && NamePO != null && NamePO != ''"
      >
        <v-card-title class="d-flex align-center pe-2">
          <p class="text-h6">{{ NamePO }}</p>
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ Bom.length }} linh kiện)
          </p>
          <v-btn
            prepend-icon="mdi mdi-download"
            color="success"
            class="ms-2 text-caption"
            variant="tonal"
            @click="DownloadPO()"
            >Tải file</v-btn
          >
          <v-btn
            prepend-icon="mdi mdi-content-save-plus"
            color="blue-darken-4"
            class="ms-2 text-caption"
            variant="tonal"
            :disabled="OrderAvailable"
            @click="
              SaveTable();
              DialogSuccess = true;
            "
            >Lưu dữ liệu</v-btn
          >
          <v-btn
            prepend-icon="mdi mdi-content-save-plus"
            color="red"
            class="ms-2 text-caption"
            variant="tonal"
            @click="DialogRemove = true"
            >Xoá dữ liệu</v-btn
          >
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

        <v-card-text>
          <v-data-table
            :headers="Headers"
            :items="Bom"
            :search="search"
            :items-per-page="itemsPerPage"
            v-model:page="page"
          >
            <template v-slot:bottom>
              <div class="text-center pt-2">
                <v-pagination v-model="page" :length="pageCount"></v-pagination>
              </div>
            </template>

            <template v-slot:item.id="{ item }">
              <v-icon @click="EditItem(item)" color="primary"
                >mdi-pencil</v-icon
              >
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="Dialog" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
      <v-card-text>
        <v-text-field
          label="Tên dự án"
          v-model="InputPO"
          variant="solo-filled"
          clearable
          :rules="[required]"
        ></v-text-field>
        <v-text-field
          label="Tên BOM"
          v-model="InputBOM"
          variant="solo-filled"
          clearable
          :rules="[required]"
        ></v-text-field>
        <v-text-field
          label="Số lượng Board"
          v-model="InputQuantity"
          type="number"
          variant="solo-filled"
          :rules="[required]"
        ></v-text-field>
        <v-file-input
          clearable
          label="Thêm File Excel"
          variant="solo-filled"
          v-model="File"
          accept=".xlsx"
          :rules="[required]"
        ></v-file-input>
      </v-card-text>
      <template v-slot:actions>
        <v-btn @click="Dialog = false" variant="tonal">Huỷ</v-btn>
        <v-btn
          class="bg-primary"
          @click="
            ImportFile();
            DialogSuccess = true;
          "
          >Nhập dữ liệu</v-btn
        >
      </template>
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
            @click="
              DialogSuccess = false;
              File = null;
              Dialog = false;
              DialogEdit = false;
              CostEstimate = '';
              InputPO = '';
              InputBOM = '';
              InputQuantity = '1';
            "
          ></v-btn>
        </template>
      </v-empty-state>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogFailed">
    <v-card width="500" height="400" class="mx-auto">
      <v-empty-state icon="mdi-close-circle">
        <template v-slot:media>
          <v-icon color="red"></v-icon>
        </template>

        <template v-slot:headline>
          <div class="text-h4">Xảy ra lỗi</div>
        </template>

        <template v-slot:text>
          <div class="text-medium-emphasis text-caption">
            Dữ liệu chưa chính xác. Cần kiểm tra lại
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
            @click="
              DialogFailed = false;
              File = null;
              Dialog = false;
              DialogEdit = false;
              CostEstimate = '';
              InputPO = '';
              InputBOM = '';
              InputQuantity = '1';
            "
          ></v-btn>
        </template>
      </v-empty-state>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Cập nhật dữ liệu">
      <v-card-text>
        <v-text-field
          label="Dự toán hao phí"
          v-model="CostEstimate"
          clearable
          variant="solo-filled"
        ></v-text-field>
      </v-card-text>
      <template v-slot:actions>
        <v-btn @click="DialogEdit = false" variant="tonal">Huỷ</v-btn>
        <v-btn
          class="bg-primary"
          @click="
            SaveEdit();
            DialogSuccess = true;
          "
          >Nhập dữ liệu</v-btn
        >
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá dự án này ? </v-card-text>
      <template v-slot:actions>
        <v-btn @click="DialogRemove = false" variant="tonal">Huỷ</v-btn>
        <v-btn
          class="bg-red"
          @click="
            RemoveItem();
            Bom = [];
            NamePO = '';
            DialogRemove = false;
          "
          >Xoá</v-btn
        >
      </template>
    </v-card>
  </v-dialog>
</template>
<script setup>
import axios from "axios";
import { jwtDecode } from "jwt-decode";
</script>
<script>
export default {
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      UserInfo: "",
      search: "",
      Headers: [],
      Bom: [],
      NamePO: "",
      CostEstimate: "",
      GetRow: "",
      File: null,
      InputPO: "",
      InputBOM: "",
      InputQuantity: "1",
      OrderAvailable: null,
      Dialog: false,
      DialogEdit: false,
      DialogSuccess: false,
      DialogFailed: false,
      DialogRemove: false,
      Date: "",
      itemsPerPage: 15,
      page: 1,
      UserInterval: null,
    };
  },
  created() {
    this.DateNow();
    this.getUserInfo();
  },
  mounted() {
    this.UserInterval = setInterval(this.FetchTable, 1000);
  },
  beforeUnmount() {
    // Clear the interval when the component is destroyed
    if (this.UserInterval) {
      clearInterval(this.UserInterval);
    }
  },
  computed: {
    pageCount() {
      return Math.ceil(this.Bom.length / this.itemsPerPage);
    },
  },
  methods: {
    async ImportFile() {
      const formData = new FormData();
      formData.append("file", this.File);
      formData.append("PO", this.InputPO);
      formData.append("BOM", this.InputBOM);
      formData.append("SL_Board", this.InputQuantity);
      axios
        .post(`${this.Url}/upload`, formData)
        .then(function (response) {
          console.log(response);
          this.DialogSuccess = true;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async FetchTable() {
      if (this.NamePO) {
        try {
          const res = await fetch(`${this.Url}/CheckBom/${this.NamePO}`);
          this.Bom = await res.json();
          this.generateHeaders();
          this.FetchOrders();
        } catch (error) {
          this.DialogFailed = true;
          console.error("Error fetching user data:", error);
        }
      }
    },
    generateHeaders() {
      if (this.Bom.length > 0) {
        this.Headers = Object.keys(this.Bom[0]).map((key) => ({
          title: key.replace(/_/g, " "), // Format header text
          key: key,
          value: key,
        }));
      }
    },
    async DownloadPO() {
      try {
        const response = await fetch(`${this.Url}/Download-PO/${this.NamePO}`);
        if (!response.ok) throw new Error("Download failed");

        // Convert response to blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Create a link to download
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.NamePO}.xlsx`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading file:", error);
      }
    },
    async SaveTable() {
      const Item = {
        Name_PO: this.NamePO,
        Quantity_Type: this.Bom.length,
        Quantity_Items: this.Bom.reduce((sum, item) => sum + item.SL_Tổng, 0),
        Status: 0,
        Date: this.Date,
        Creater: this.UserInfo,
      };
      axios
        .post(`${this.Url}/ListPO/upload-new-PO`, Item)
        .then(function (response) {
          console.log(response);
          this.DialogSuccess = true;
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    EditItem(item) {
      // const value = this.Bom.find((v) => v.id == item);
      this.GetRow = item.id;
      this.DialogEdit = true;
    },
    async SaveEdit() {
      const Item = {
        Name_Item: this.GetRow,
        Input_Hao_Phi: this.CostEstimate,
      };
      axios
        .put(`${this.Url}/CheckBom/Update-Hao-Phi`, Item)
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
        .delete(`${this.Url}/CheckBOM/Delete-item/${this.NamePO}`)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async FetchOrders() {
      if (this.NamePO) {
        try {
          const res = await fetch(`${this.Url}/Orders/${this.NamePO}`);
          const OrdersAvailable = await res.json();
          if (OrdersAvailable.Name_PO == this.NamePO) {
            this.OrderAvailable = true;
          } else {
            this.OrderAvailable = false;
          }
        } catch (error) {
          this.DialogFailed = true;
          console.error("Error fetching user data:", error);
        }
      }
    },
    getUserInfo() {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        this.UserInfo = decoded.Username;
      } else {
        console.log("Không tìm thấy token!");
      }
    },
    DateNow() {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const year = String(now.getFullYear()).slice(-2);
      this.Date = `${day}/${month}/${year}`;
    },
    required(v) {
      return !!v || "Dữ liệu trống";
    },
  },
};
</script>
<style lang=""></style>
