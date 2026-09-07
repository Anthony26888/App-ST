<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Cai-dat" />
      <p class="text-h4 font-weight-light ms-3">Quản lý License</p>
    </v-card-title>
    <v-card-text>
      <!-- SINH KEY TỪ MÃ XÁC NHẬN CỦA KHÁCH -->
      <v-card variant="elevated" elevation="0" class="rounded-xl border mb-4">
        <v-card-title class="text-subtitle-1 font-weight-bold">
          Tạo mã kích hoạt từ mã xác nhận của khách
        </v-card-title>
        <v-card-text>
          <v-row align="center">
            <v-col cols="12" sm="11">
              <v-text-field
                label="Nhập mã xác nhận từ khách (VD: REQ-XXXX-XXXX)"
                v-model="requestCode"
                variant="outlined"
                hide-details
                @keyup.enter="GenerateByCode()"
              />
            </v-col>
            <v-col cols="12" sm="1">
              <v-btn
                class="bg-gradient text-caption font-weight-bold"
                prepend-icon="mdi mdi-key-chain"
                :loading="DialogLoading"
                :disabled="!requestCode"
                @click="GenerateByCode()"
              >
                Tạo mã
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- DANH SÁCH KEY -->
      <v-card variant="elevated" elevation="0" class="rounded-xl border">
        <v-card-title class="d-flex align-center pe-2">
          <p class="text-subtitle-1 font-weight-thin">
            {{ keys.length }} mã license
          </p>
          <v-spacer></v-spacer>
          <InputSelect
            :items="['Tất cả', 'unused', 'used']"
            label="Trạng thái"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            class="ms-2"
            style="max-width: 200px"
            v-model="filterStatus"
          />
        </v-card-title>
        <v-data-table
          density="comfortable"
          :headers="Headers"
          :items="filteredKeys"
          class="elevation-0"
          :items-per-page="15"
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
          :fixed-header="true"
          height="68vh"
        >
          <template v-slot:item.LicenseKey="{ item }">
            <div class="d-flex align-center">
              <code>{{ item.LicenseKey }}</code>
              <v-btn
                icon="mdi-content-copy"
                size="x-small"
                variant="text"
                class="ms-2"
                @click="copy(item.LicenseKey)"
              />
            </div>
          </template>
          <template v-slot:item.SourceCode="{ item }">
            <code class="text-caption">{{ item.SourceCode || "—" }}</code>
          </template>
          <template v-slot:item.LicensePlan="{ item }">
            <v-chip
              size="small"
              :color="item.LicensePlan === 'Pro' ? 'amber' : 'primary'"
              class="text-white font-weight-bold"
              >{{ item.LicensePlan }}</v-chip
            >
          </template>
          <template v-slot:item.Status="{ item }">
            <v-chip
              size="small"
              :color="item.Status === 'unused' ? 'green' : 'grey'"
              class="text-white font-weight-bold"
              >{{ item.Status }}</v-chip
            >
          </template>
          <template v-slot:item.UsedBy="{ item }">
            <span v-if="item.UsedBy">{{ item.UsedBy }}</span>
            <span v-else class="text-grey-darken-1">{{
              item.Note ? item.Note.split(" - ")[1] : "—"
            }}</span>
          </template>
          <template v-slot:item.RemainingUses="{ item }">
            <v-chip
              v-if="item.Status === 'used'"
              size="small"
              :color="
                item.RemainingUses <= 0
                  ? 'grey'
                  : item.RemainingUses <= 3
                  ? 'orange'
                  : 'green'
              "
              class="text-white font-weight-bold"
              >{{ item.RemainingUses ?? 0 }}</v-chip
            >
            <span v-else class="text-grey">—</span>
          </template>
        </v-data-table>
      </v-card>
    </v-card-text>
  </v-card>
  <BaseDialog>
    <v-alert v-if="generatedInfo" type="success" class="mt-3" variant="tonal">
      <div class="d-flex align-center">
        <div class="flex-grow-1">
          <p class="mb-1 font-weight-bold">Đã sinh mã kích hoạt:</p>
          <code class="d-block text-h6 font-weight-bold">{{
            generatedInfo.keys[0]
          }}</code>
          <p class="text-caption mb-1 mt-2">
            Gói: {{ generatedInfo.request.plan }} · Người dùng:
            {{ generatedInfo.request.username }} · Số lượt:
            {{ generatedInfo.request.uses }}
          </p>
          <p class="text-caption mb-0">
            Thời gian xác nhận: {{ generatedInfo.request.confirmAt }} · Ngày tạo
            mã: {{ generatedInfo.request.date }}
          </p>
        </div>
        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          icon="mdi-content-copy"
          @click="copy(generatedInfo.keys[0])"
        >
        </v-btn>
      </div>
    </v-alert>
  </BaseDialog>
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import InputSearch from "@/components/Input-Search.vue";
import InputSelect from "@/components/Input-Select.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import ButtonBack from "@/components/Button-Back.vue";
import BaseDialog from "@/components/BaseDialog.vue";

const Url = import.meta.env.VITE_API_URL;
const Username = ref(localStorage.getItem("Username") || "");

const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

const requestCode = ref("");
const generatedInfo = ref(null);
const keys = ref([]);
const filterStatus = ref("Tất cả");

const Headers = [
  { key: "LicenseKey", title: "Mã license", noWrap: true },
  { key: "SourceCode", title: "Mã xác nhận", noWrap: true },
  { key: "LicensePlan", title: "Gói", noWrap: true },
  { key: "Status", title: "Trạng thái", noWrap: true },
  { key: "UsedBy", title: "Người dùng", noWrap: true },
  { key: "Uses", title: "Cấp", noWrap: true },
  { key: "RemainingUses", title: "Còn lại", noWrap: true },
  { key: "Date", title: "Ngày sinh", noWrap: true },
];

const filteredKeys = computed(() => {
  if (filterStatus.value === "Tất cả") return keys.value;
  return keys.value.filter((k) => k.Status === filterStatus.value);
});

const GetKeys = async () => {
  try {
    const { data } = await axios.get(
      `${Url}/License/List?username=${Username.value}`,
    );
    keys.value = data;
  } catch (error) {
    console.error("Error fetching license keys:", error);
    MessageErrorDialog.value = "Không thể tải danh sách mã license";
    DialogFailed.value = true;
  }
};

const GenerateByCode = async () => {
  DialogLoading.value = true;
  try {
    const { data } = await axios.post(`${Url}/License/Generate-By-Code`, {
      username: Username.value,
      code: requestCode.value,
    });
    generatedInfo.value = data;
    requestCode.value = "";
    MessageDialog.value = data.message || "Sinh mã thành công";
    DialogSuccess.value = true;
    await GetKeys();
  } catch (error) {
    console.error("Error generating key:", error);
    MessageErrorDialog.value =
      error.response?.data?.error || "Sinh mã thất bại";
    DialogFailed.value = true;
  } finally {
    DialogLoading.value = false;
  }
};

const copy = async (text) => {
  await navigator.clipboard.writeText(text);
  MessageDialog.value = "Đã copy mã license";
  DialogSuccess.value = true;
};

onMounted(() => {
  GetKeys();
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
  const socket = io(SOCKET_URL);
  socket.on("UpdateLicense", () => {
    GetKeys();
  });
  onUnmounted(() => socket.disconnect());
});
</script>
<style scoped>
.bg-gradient {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)),
    rgb(var(--v-theme-secondary))
  );
  color: white;
}
</style>
