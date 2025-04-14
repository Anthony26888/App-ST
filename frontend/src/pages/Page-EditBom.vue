<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Kiem-tra-so-lieu" />
      <p class="text-h4 font-weight-light ms-3">Chỉnh sửa số liệu</p>
    </v-card-title>
    <v-card-title>
      <InputSearch v-model="search" />
    </v-card-title>
    <v-card-text>
      <v-data-table
        :headers="Headers"
        :items="detailBom"
        :search="search"
        :items-per-page="itemsPerPage"
        v-model:page="page"
      >
        <template v-slot:bottom>
          <div class="text-center pt-2">
            <v-pagination
              v-model="page"
              :length="Math.ceil(detailBom.length / this.itemsPerPage)"
            ></v-pagination>
          </div>
        </template>
        <template v-slot:item.id="{ value }">
          <div class="d-flex">
            <ButtonEdit @edit="FetchDetailItem(value)" />
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
  <v-dialog v-model="DialogEdit" width="400">
    <v-card max-width="400" prepend-icon="mdi-update" title="Cập nhật dữ liệu">
      <v-card-text>
        <InputField label="Tên dự án" v-model="PO_Edit" />
        <InputField label="Số lượng board" v-model="Quanity_Edit" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonDelete @delete="DialogRemove = true" />
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEditItem()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá Bom này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="DeleteItem()" />
      </template>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" />
</template>
<script setup>
import axios from "axios";
import { useDetailBom } from "@/composables/useDetailBom";
import ButtonBack from "@/components/Button-Back.vue";
import InputSearch from "@/components/Input-Search.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonRemove from "@/components/Button-Remove.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
const { detailBom } = useDetailBom();
</script>
<script>
export default {
  components :{
    ButtonBack,
    ButtonEdit,
    ButtonRemove,
    ButtonDelete,
    InputSearch,
    SnackbarSuccess
  },
  data() {
    return {
      Url: import.meta.env.VITE_API_URL,
      Headers: [
        { key: "PO", title: "Tên dự án" },
        { key: "Bom", title: "Tên Bom" },
        { key: "SL_Board", title: "Số lượng Board" },
        { key: "SL_LK", title: "Số lượng linh kiện" },
        { key: "Creater", title: "Người tạo" },
        { key: "TimeStamp", title: "Thời gian tạo" },
        { key: "id", title: "Sửa" },
      ],
      search: "",
      PO_Edit: "",
      Bom_Edit: "",
      Quanity_Edit: "",
      DialogEdit: false,
      DialogSuccess: false,
      DialogRemove: false,
      itemsPerPage: 15,
      page: 1,
    };
  },
  methods: {
    async FetchDetailItem(value) {
      this.DialogEdit = true;
      if (value) {
        try {
          const res = await fetch(`${this.Url}/CheckBom/Detail/${value}`);
          const DetailBom = await res.json();
          this.PO_Edit = DetailBom[0].PO;
          this.Bom_Edit = DetailBom[0].Bom;
          this.Quanity_Edit = DetailBom[0].SL_Board;
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    },
    async SaveEditItem() {
      const Item = {
        PO: this.PO_Edit,
        Bom: this.Bom_Edit,
        SL_Board: this.Quanity_Edit,
      };
      this.Reset();
      axios
        .put(`${this.Url}/CheckBom/Edit-Item/${this.Bom_Edit}`, Item)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    async DeleteItem() {
      this.Reset();
      axios
        .delete(`${this.Url}/CheckBom/Delete-Item/${this.Bom_Edit}`)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    Reset() {
      (this.DialogEdit = false), (this.DialogSuccess = true);
      this.DialogRemove = false;
    },
  },
};
</script>
<style lang=""></style>
