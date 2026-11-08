<template>
  <v-card variant="text" class="app-page">
    <PageHeader :crumbs="[{ title: 'Kinh doanh' }, { title: 'Báo giá' }]" />

    <v-card-text class="d-flex flex-column flex-grow-1" style="min-height: 0">
      <v-row class="mb-3">
        <v-col cols="6" md="3">
          <CardStatistic
            title="Tổng báo giá"
            :value="quotes.length"
            icon="mdi-file-document-multiple-outline"
            color="primary"
            subtitle="Tất cả báo giá"
          />
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Bản nháp"
            :value="countStatus('Nháp')"
            icon="mdi-pencil-outline"
            color="grey"
            subtitle="Chưa gửi khách"
          />
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Đã gửi"
            :value="countStatus('Đã gửi')"
            icon="mdi-send-outline"
            color="info"
            subtitle="Đang chờ phản hồi"
          />
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Đã chấp nhận"
            :value="countStatus('Chấp nhận')"
            icon="mdi-check-circle-outline"
            color="success"
            :subtitle="formatMoney(totalAccepted)"
          />
        </v-col>
      </v-row>

      <v-card variant="elevated" elevation="0" class="rounded-xl border app-card-fill">
        <v-card-title class="d-flex align-center flex-wrap ga-2 pe-2">
          <ButtonAdd @add="goCreate" />
          <v-btn
            variant="tonal"
            color="secondary"
            prepend-icon="mdi-tag-multiple-outline"
            class="text-caption ms-2"
            @click="goPriceBook"
          >
            Bảng giá mẫu
          </v-btn>
          <v-spacer />
          <InputSearch v-model="search" />
        </v-card-title>

        <v-card-text class="pb-0">
          <v-chip-group
            v-model="statusFilter"
            selected-class="text-primary"
            filter
            class="mb-2"
          >
            <v-chip value="all" size="small" variant="tonal" filter>Tất cả</v-chip>
            <v-chip
              v-for="status in statuses"
              :key="status"
              :value="status"
              size="small"
              variant="tonal"
              filter
            >
              {{ status }}
            </v-chip>
          </v-chip-group>
        </v-card-text>

        <v-card-text class="app-table-fill pt-0">
          <AppDataTable
            :headers="headers"
            :items="filteredQuotes"
            :search="search"
            :items-per-page="15"
          >
            <template #[`item.total`]="{ item }">
              <span class="font-weight-medium">{{ formatMoney(item.total) }}</span>
            </template>
            <template #[`item.status`]="{ item }">
              <v-chip
                :color="statusColor(item.status)"
                variant="tonal"
                size="small"
              >
                {{ item.status }}
              </v-chip>
            </template>
            <template #[`item.created_at`]="{ item }">
              {{ formatDate(item.created_at) }}
            </template>
            <template #[`item.valid_until`]="{ item }">
              {{ formatDate(item.valid_until) }}
            </template>
            <template #[`item.id`]="{ item }">
              <div class="d-flex align-center">
                <ButtonEye @detail="goDetail(item.id)" />
                <v-btn
                  icon="mdi-content-duplicate"
                  size="xs"
                  color="secondary"
                  variant="text"
                  v-tooltip:top="'Nhân bản'"
                  @click="cloneQuote(item.id)"
                />
                <v-btn
                  icon="mdi-delete-outline"
                  size="xs"
                  color="error"
                  variant="text"
                  v-tooltip:top="'Xoá'"
                  @click="askDelete(item)"
                />
              </div>
            </template>
            <template #no-data>
              <div class="app-empty-state text-center">
                <v-icon size="48" color="medium-emphasis">mdi-file-document-outline</v-icon>
                <p class="text-body-2 text-medium-emphasis mt-2">
                  Chưa có báo giá nào. Bấm "Thêm" để tạo báo giá đầu tiên.
                </p>
              </div>
            </template>
          </AppDataTable>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <BaseDialog v-model="dialogDelete" width="420" title="Xoá báo giá" icon="mdi-delete">
    Bạn có chắc chắn muốn xoá báo giá
    <strong>{{ selectedQuote?.quote_no }}</strong>?
    <template #actions>
      <ButtonCancel @cancel="dialogDelete = false" />
      <ButtonDelete @delete="removeQuote" />
    </template>
  </BaseDialog>

  <SnackbarSuccess v-model="snackbarSuccess" :message="message" />
  <SnackbarFailed v-model="snackbarFailed" :message="errorMessage" />
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import PageHeader from "@/components/Page-Header.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import AppDataTable from "@/components/App-DataTable.vue";
import InputSearch from "@/components/Input-Search.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";

const Url = import.meta.env.VITE_API_URL;
const router = useRouter();

const quotes = ref([]);
const search = ref("");
const statusFilter = ref("all");
const statuses = ["Nháp", "Đã gửi", "Chấp nhận", "Từ chối", "Hết hạn"];

const dialogDelete = ref(false);
const selectedQuote = ref(null);
const snackbarSuccess = ref(false);
const snackbarFailed = ref(false);
const message = ref("");
const errorMessage = ref("");

const headers = [
  { title: "Mã BG", key: "quote_no", width: "140px" },
  { title: "Khách hàng", key: "customer_name", width: "180px" },
  { title: "Dự án", key: "project_name", width: "200px" },
  { title: "Ngày tạo", key: "created_at", width: "110px" },
  { title: "Hiệu lực", key: "valid_until", width: "110px" },
  { title: "SL board", key: "board_qty", width: "90px" },
  { title: "Tổng tiền", key: "total", width: "140px" },
  { title: "Trạng thái", key: "status", width: "120px" },
  { title: "Người tạo", key: "created_by", width: "130px" },
  { title: "Thao tác", key: "id", sortable: false, width: "130px" },
];

const filteredQuotes = computed(() => {
  if (statusFilter.value === "all") return quotes.value;
  return quotes.value.filter((item) => item.status === statusFilter.value);
});

const totalAccepted = computed(() =>
  quotes.value
    .filter((item) => item.status === "Chấp nhận")
    .reduce((sum, item) => sum + (Number(item.total) || 0), 0),
);

function countStatus(status) {
  return quotes.value.filter((item) => item.status === status).length;
}

function statusColor(status) {
  return (
    {
      "Nháp": "grey",
      "Đã gửi": "info",
      "Chấp nhận": "success",
      "Từ chối": "error",
      "Hết hạn": "warning",
    }[status] || "grey"
  );
}

function formatMoney(value) {
  return `${new Intl.NumberFormat("vi-VN").format(Number(value) || 0)} đ`;
}

function formatDate(value) {
  if (!value) return "";
  const raw = String(value);
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : raw;
}

async function loadQuotes() {
  try {
    const { data } = await axios.get(`${Url}/Quotation/Quotes`);
    quotes.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(error);
    errorMessage.value = "Không tải được danh sách báo giá";
    snackbarFailed.value = true;
  }
}

function goCreate() {
  router.push("/Bao-gia/Tao-moi");
}

function goPriceBook() {
  router.push("/Bao-gia/Bang-gia");
}

function goDetail(id) {
  router.push(`/Bao-gia/${id}`);
}

async function cloneQuote(id) {
  try {
    const { data } = await axios.post(`${Url}/Quotation/Quotes/${id}/Clone`);
    message.value = `Đã nhân bản: ${data.quote_no}`;
    snackbarSuccess.value = true;
    await loadQuotes();
    router.push(`/Bao-gia/${data.id}`);
  } catch (error) {
    errorMessage.value = error.response?.data?.error || "Nhân bản thất bại";
    snackbarFailed.value = true;
  }
}

function askDelete(item) {
  selectedQuote.value = item;
  dialogDelete.value = true;
}

async function removeQuote() {
  if (!selectedQuote.value) return;
  try {
    await axios.delete(`${Url}/Quotation/Quotes/${selectedQuote.value.id}`);
    dialogDelete.value = false;
    message.value = "Đã xoá báo giá";
    snackbarSuccess.value = true;
    await loadQuotes();
  } catch (error) {
    errorMessage.value = error.response?.data?.error || "Xoá thất bại";
    snackbarFailed.value = true;
  }
}

onMounted(loadQuotes);
</script>

<style scoped>
.app-empty-state {
  padding: 40px 16px;
}
</style>
