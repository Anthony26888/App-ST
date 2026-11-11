<template>
  <v-card variant="text" class="app-page">
    <PageHeader :crumbs="[{ title: 'Mua hàng' }, { title: 'Tổng hợp mua hàng' }]" />

    <v-card-text class="d-flex flex-column flex-grow-1" style="min-height: 0">
      <v-row class="mb-3">
        <v-col cols="6" md="3">
          <CardStatistic
            title="Dự án mua hàng"
            :value="projects.length"
            icon="mdi-clipboard-list-outline"
            color="primary"
            subtitle="Tổng dự án đã tạo"
          />
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Linh kiện"
            :value="formatQty(totalItems)"
            icon="mdi-chip"
            color="info"
            subtitle="MPN sau khi gộp"
          />
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Số lượng mua"
            :value="formatQty(totalQuantity)"
            icon="mdi-cube-outline"
            color="warning"
            subtitle="Tổng QTY các dự án"
          />
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Giá trị DigiKey"
            :value="formatUsd(totalUsd)"
            icon="mdi-currency-usd"
            color="success"
            subtitle="Tổng tiền đã lấy giá"
          />
        </v-col>
      </v-row>

      <v-card variant="elevated" elevation="0" class="rounded-xl border app-card-fill">
        <v-card-title class="d-flex align-center flex-wrap ga-2 pe-2">
          <v-btn
            prepend-icon="mdi-plus"
            variant="tonal"
            color="primary"
            class="text-caption"
            @click="goCreate"
          >
            Tạo dự án
          </v-btn>
          <v-btn
            icon="mdi-refresh"
            variant="text"
            color="primary"
            size="small"
            v-tooltip:top="'Tải lại'"
            :loading="loading"
            @click="loadProjects"
          />
          <v-spacer />
          <v-select
            v-model="sourceFilter"
            :items="sourceOptions"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 170px"
          />
          <InputSearch v-model="search" />
        </v-card-title>

        <v-card-text class="app-table-fill pt-0">
          <AppDataTable
            :headers="headers"
            :items="filteredProjects"
            :search="search"
            :items-per-page="20"
            :loading="loading"
            density="compact"
          >
            <template #[`item.project_name`]="{ item }">
              <v-btn
                variant="text"
                color="primary"
                class="text-caption px-0 text-none"
                @click="goDetail(item.id)"
              >
                {{ item.project_name }}
              </v-btn>
            </template>
            <template #[`item.source_type`]="{ item }">
              <v-chip
                :color="item.source_type === 'quote' ? 'info' : 'primary'"
                variant="tonal"
                size="small"
                :prepend-icon="
                  item.source_type === 'quote'
                    ? 'mdi-file-document-outline'
                    : 'mdi-file-table-outline'
                "
              >
                {{ sourceLabel(item.source_type) }}
              </v-chip>
            </template>
            <template #[`item.total_qty`]="{ item }">
              {{ formatQty(item.total_qty) }}
            </template>
            <template #[`item.total_usd`]="{ item }">
              <span class="font-weight-medium">{{ formatUsd(item.total_usd) }}</span>
            </template>
            <template #[`item.status`]="{ item }">
              <v-chip
                :color="statusColor(item.status)"
                variant="tonal"
                size="small"
              >
                {{ statusLabel(item.status) }}
              </v-chip>
            </template>
            <template #[`item.updated_at`]="{ item }">
              {{ formatDate(item.updated_at) }}
            </template>
            <template #[`item.id`]="{ item }">
              <div class="d-flex align-center">
                <ButtonEye @detail="goDetail(item.id)" />
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
                <v-icon size="48" color="medium-emphasis">
                  mdi-clipboard-text-outline
                </v-icon>
                <p class="text-body-2 text-medium-emphasis mt-2">
                  Chưa có dự án mua hàng. Bấm "Tạo dự án" để bắt đầu.
                </p>
              </div>
            </template>
          </AppDataTable>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <BaseDialog
    v-model="dialogDelete"
    width="420"
    title="Xoá dự án mua hàng"
    icon="mdi-delete"
  >
    Bạn có chắc chắn muốn xoá dự án
    <strong>{{ selectedProject?.project_name }}</strong>?
    <template #actions>
      <ButtonCancel @cancel="dialogDelete = false" />
      <ButtonDelete @delete="removeProject" />
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
import ButtonEye from "@/components/Button-Eye.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import {
  formatUsd,
  formatQty,
  formatDate,
  statusLabel,
  statusColor,
  sourceLabel,
} from "@/utils/purchase.js";

const Url = import.meta.env.VITE_API_URL;
const router = useRouter();

const projects = ref([]);
const loading = ref(false);
const search = ref("");
const sourceFilter = ref("all");
const dialogDelete = ref(false);
const selectedProject = ref(null);
const snackbarSuccess = ref(false);
const snackbarFailed = ref(false);
const message = ref("");
const errorMessage = ref("");

const sourceOptions = [
  { title: "Tất cả nguồn", value: "all" },
  { title: "File BOM", value: "bom" },
  { title: "Mã báo giá", value: "quote" },
];

const headers = [
  { title: "Dự án", key: "project_name", width: "240px" },
  { title: "Khách hàng", key: "customer_name", width: "180px" },
  { title: "Nguồn", key: "source_type", width: "140px" },
  { title: "Linh kiện", key: "item_count", width: "100px", align: "end" },
  { title: "QTY", key: "total_qty", width: "100px", align: "end" },
  { title: "Giá DigiKey", key: "total_usd", width: "150px", align: "end" },
  { title: "Trạng thái", key: "status", width: "130px" },
  { title: "Cập nhật", key: "updated_at", width: "120px" },
  { title: "Người tạo", key: "created_by", width: "130px" },
  { title: "Thao tác", key: "id", sortable: false, width: "100px" },
];

const filteredProjects = computed(() => {
  if (sourceFilter.value === "all") return projects.value;
  return projects.value.filter(
    (project) => project.source_type === sourceFilter.value,
  );
});

const totalItems = computed(() =>
  projects.value.reduce((sum, project) => sum + (Number(project.item_count) || 0), 0),
);
const totalQuantity = computed(() =>
  projects.value.reduce((sum, project) => sum + (Number(project.total_qty) || 0), 0),
);
const totalUsd = computed(() =>
  projects.value.reduce((sum, project) => sum + (Number(project.total_usd) || 0), 0),
);

async function loadProjects() {
  loading.value = true;
  try {
    const { data } = await axios.get(`${Url}/Purchase/Projects`);
    projects.value = Array.isArray(data?.projects) ? data.projects : [];
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.error || "Không tải được danh sách dự án mua hàng";
    snackbarFailed.value = true;
  } finally {
    loading.value = false;
  }
}

function goCreate() {
  router.push("/Kiem-tra-so-lieu/Tao-moi");
}

function goDetail(id) {
  router.push(`/Kiem-tra-so-lieu/${id}`);
}

function askDelete(project) {
  selectedProject.value = project;
  dialogDelete.value = true;
}

async function removeProject() {
  try {
    await axios.delete(`${Url}/Purchase/Projects/${selectedProject.value.id}`);
    dialogDelete.value = false;
    message.value = "Đã xoá dự án mua hàng";
    snackbarSuccess.value = true;
    await loadProjects();
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.error || "Không xoá được dự án mua hàng";
    snackbarFailed.value = true;
  }
}

onMounted(loadProjects);
</script>
