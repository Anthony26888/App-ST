<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="text-h4 font-weight-light"
      >Kiểm tra số liệu linh kiện</v-card-title
    >
    <v-card-title class="d-flex">
      <ButtonImportFile @import-file="Dialog = true" />
      <v-btn
        prepend-icon="mdi mdi-pencil"
        variant="tonal"
        class="text-caption ms-2"
        color="primary"
        to="/Chinh-sua-so-lieu"
        >Chỉnh sửa</v-btn
      >
      <v-spacer></v-spacer>
      <InputSearch v-model="NamePO" />
    </v-card-title>
    <v-card-text>
      <v-divider></v-divider>
      <v-empty-state
        v-if="NamePO == null || NamePO == ''"
        headline="OPPS !"
        title="Chưa có dữ liệu"
        text="Chon thêm file hoặc nhập tên PO"
        icon="mdi-folder-remove-outline"
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
          <ButtonDownload @download-file="DownloadPO()" />
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
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
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
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
  <v-dialog v-model="Dialog" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Thêm dữ liệu">
      <v-card-text>
        <InputField label="Tên dự án" v-model="InputPO" :rules="[required]" />
        <InputField label="Tên Bom" v-model="InputBOM" :rules="[required]" />
        <InputField
          label="Số lượng Board"
          v-model="InputQuantity"
          :rules="[required]"
        />
        <InputFiles v-model="File" :rules="[required]" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="Dialog = false" />
        <ButtonSave @save="ImportFile()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" />
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Cập nhật dữ liệu">
      <v-card-text>
        <InputField label="Dự toán hao phí" v-model="CostEstimate" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá dự án này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </v-card>
  </v-dialog>
</template>
<script setup>
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
</script>
<script>
export default {
  components: {
    ButtonImportFile,
    ButtonDownload,
    ButtonSave,
    ButtonCancel,
    InputSearch,
    InputField,
    InputFiles,
    SnackbarSuccess
  },
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
      timeout: 5000,
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
      formData.append("TimeStamp", this.Date);
      formData.append("Creater", this.UserInfo)
      this.Reset();
      axios
        .post(`${this.Url}/upload`, formData)
        .then(function (response) {
          console.log(response);
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
      this.Reset();
      axios
        .post(`${this.Url}/ListPO/upload-new-PO`, Item)
        .then(function (response) {
          console.log(response);
          tthis.Reset();
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
      this.Reset();
      axios
        .put(`${this.Url}/CheckBom/Update-Hao-Phi`, Item)
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
        .delete(`${this.Url}/CheckBOM/Delete-item/${this.NamePO}`)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
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
    Reset() {
      (this.Dialog = false), (this.DialogSuccess = true);
      (this.DialogRemove = false), (this.File = null);
      this.DialogEdit = false;
      this.CostEstimate = "";
      this.InputPO = "";
      this.InputBOM = "";
      this.InputQuantity = "1";
      this.Bom = [];
      this.search=""
    },
  },
};
</script>
<style lang=""></style>
