<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title>
      <v-btn
        prepend-icon="mdi-arrow-left"
        variant="text"
        class="text-caption"
        to="/Kiem-tra-so-lieu"
        >Trở lại</v-btn
      >
    </v-card-title>
    <v-card-title class="text-h4 font-weight-light"
      >Chỉnh sửa số liệu</v-card-title
    >
    <v-card-text>
      <v-data-table
        :headers="Headers"
        :items="bom"
        :search="search"
        :items-per-page="itemsPerPage"
        v-model:page="page"
      >
        <template v-slot:bottom>
          <div class="text-center pt-2">
            <v-pagination
              v-model="page"
              :length="Math.ceil(bom.length / this.itemsPerPage)"
            ></v-pagination>
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
</template>
<script setup>
import axios from "axios";
import { useSocket } from "@/composables/useWebSocket";

const { bom } = useSocket();
</script>
<script>
export default {
  data() {
    return {
      Headers: [
        {
          key: "Description",
          title: "Description",
        },
        { key: "Manufacturer_1", title: "Manufacturer_1" },
        { key: "PartNumber_1", title: "PartNumber_1" },
        { key: "Manufacturer_2", title: "Manufacturer_2" },
        { key: "PartNumber_2", title: "PartNumber_2" },
        { key: "Manufacturer_3", title: "Manufacturer_3" },
        { key: "PartNumber_3", title: "PartNumber_3" },
        { key: "So_Luong", title: "Số lượng" },
        { key: "SL_Board", title: "SL Board" },
        { key: "Bom", title: "Tên Bom" },
        { key: "PO", title: "Tên dự án" },
        { key: "id", title: "Sửa" },
      ],
      search: "",
      itemsPerPage: 15,
      page: 1,
    };
  },
};
</script>
<style lang=""></style>
