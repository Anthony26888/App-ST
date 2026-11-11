<template>
  <v-card variant="text" class="app-page">
    <PageHeader
      :crumbs="[
        { title: 'Mua hàng' },
        { title: 'Tổng hợp mua hàng', to: '/Kiem-tra-so-lieu' },
        { title: project?.project_name || 'Chi tiết' },
      ]"
    />

    <v-card-text class="d-flex flex-column flex-grow-1" style="min-height: 0">
      <v-card
        v-if="project"
        variant="elevated"
        elevation="0"
        class="rounded-xl border app-card-fill"
      >
        <v-card-title class="d-flex align-center flex-wrap ga-2 pe-2">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            size="small"
            @click="goBack"
          />
          <div class="me-2">
            <div class="text-h6">{{ project.project_name }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ project.customer_name || "Chưa có khách hàng" }}
              · {{ sourceLabel(project.source_type) }}
              · {{ formatDate(project.updated_at || project.created_at) }}
            </div>
          </div>
          <v-chip
            :color="statusColor(project.status)"
            variant="tonal"
            size="small"
          >
            {{ statusLabel(project.status) }}
          </v-chip>
          <v-spacer />
          <v-btn
            prepend-icon="mdi-download"
            variant="tonal"
            color="secondary"
            class="text-caption"
            :loading="exporting"
            @click="exportProject"
          >
            Xuất Excel
          </v-btn>
          <v-btn
            prepend-icon="mdi-refresh"
            color="primary"
            variant="tonal"
            class="text-caption"
            :loading="fetching"
            :disabled="digikeyConnected === false"
            @click="fetchDigiKey"
          >
            Lấy giá DigiKey tự động
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-row class="mb-3">
            <v-col cols="6" md="3">
              <CardStatistic
                title="Linh kiện"
                :value="formatQty(project.summary?.line_count || project.item_count)"
                icon="mdi-chip"
                color="primary"
                subtitle="MPN sau khi gộp"
              />
            </v-col>
            <v-col cols="6" md="3">
              <CardStatistic
                title="Tổng QTY"
                :value="formatQty(project.summary?.total_qty || project.total_qty)"
                icon="mdi-cube-outline"
                color="info"
                subtitle="Số lượng cần mua"
              />
            </v-col>
            <v-col cols="6" md="3">
              <CardStatistic
                title="Có giá DigiKey"
                :value="`${project.summary?.priced_count || 0} / ${project.summary?.line_count || project.item_count || 0}`"
                icon="mdi-tag-check-outline"
                color="success"
                subtitle="Linh kiện đã có giá"
              />
            </v-col>
            <v-col cols="6" md="3">
              <CardStatistic
                title="Giá trị DigiKey"
                :value="formatUsd(project.summary?.total_usd || project.total_usd)"
                icon="mdi-currency-usd"
                color="warning"
                subtitle="Tổng thành tiền"
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="digikeyConnected === false"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Chưa kết nối DigiKey. Vào
            <router-link to="/Cai-dat/" class="text-primary">Cài đặt</router-link>
            để kết nối trước khi lấy giá tự động.
          </v-alert>

          <v-alert
            v-if="fetchError"
            type="error"
            variant="tonal"
            density="compact"
            closable
            class="mb-3"
            @click:close="fetchError = ''"
          >
            {{ fetchError }}
          </v-alert>

          <div
            v-if="project.source_files?.length"
            class="d-flex flex-wrap ga-2 mb-2"
          >
            <span class="text-caption text-medium-emphasis">
              File BOM:
            </span>
            <v-chip
              v-for="(file, index) in project.source_files"
              :key="index"
              size="x-small"
              variant="tonal"
              color="primary"
            >
              {{ sourceFileName(file) }}
            </v-chip>
          </div>

          <div
            v-if="project.quote_ids?.length"
            class="d-flex flex-wrap ga-2 mb-2"
          >
            <span class="text-caption text-medium-emphasis">Mã BG:</span>
            <v-chip
              v-for="quoteId in project.quote_ids"
              :key="quoteId"
              size="x-small"
              variant="tonal"
              color="info"
            >
              #{{ quoteId }}
            </v-chip>
          </div>

          <v-textarea
            v-if="project.note"
            :model-value="project.note"
            label="Ghi chú"
            variant="outlined"
            density="compact"
            rows="2"
            readonly
            hide-details
            class="mb-3"
          />

          <div class="d-flex align-center ga-2 mb-2">
            <span class="text-subtitle-2">Danh sách linh kiện</span>
            <v-chip size="x-small" variant="tonal">
              {{ project.items?.length || 0 }}
            </v-chip>
            <v-spacer />
            <InputSearch v-model="search" />
          </div>

          <PurchaseItemsTable
            :items="project.items || []"
            :loading="loading"
            :search="search"
            :items-per-page="25"
            :editable="true"
            @edit="openEdit"
            @image="openImage"
          />
        </v-card-text>
      </v-card>

      <v-empty-state
        v-else-if="!loading"
        icon="mdi-folder-search-outline"
        title="Không tìm thấy dự án"
        text="Dự án mua hàng không tồn tại hoặc đã bị xoá."
      >
        <template #actions>
          <v-btn color="primary" variant="tonal" @click="goBack">
            Về danh sách
          </v-btn>
        </template>
      </v-empty-state>

      <v-skeleton-loader v-else type="card, table" />
    </v-card-text>
  </v-card>

  <BaseDialog
    v-model="dialogEdit"
    width="420"
    title="Sửa số lượng mua"
    icon="mdi-pencil-outline"
  >
    <div class="text-caption text-medium-emphasis mb-2">
      {{ editItem?.mpn }}
    </div>
    <v-text-field
      v-model.number="editQty"
      type="number"
      min="0"
      label="SL mua"
      variant="outlined"
      density="compact"
      hide-details
    />
    <template #actions>
      <ButtonCancel @cancel="dialogEdit = false" />
      <v-btn
        color="primary"
        variant="tonal"
        :loading="savingItem"
        @click="saveItemQty"
      >
        Lưu
      </v-btn>
    </template>
  </BaseDialog>

  <v-dialog v-model="dialogImage" max-width="560">
    <v-card class="rounded-xl">
      <v-card-title class="d-flex align-center">
        <span class="text-body-2">{{ imageMpn }}</span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="dialogImage = false"
        />
      </v-card-title>
      <v-card-text class="text-center">
        <v-img :src="imageSrc" max-height="440" contain />
      </v-card-text>
    </v-card>
  </v-dialog>

  <SnackbarSuccess v-model="snackbarSuccess" :message="message" />
  <SnackbarFailed v-model="snackbarFailed" :message="errorMessage" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "@/components/Page-Header.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import InputSearch from "@/components/Input-Search.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import PurchaseItemsTable from "@/components/Purchase-Items-Table.vue";
import {
  formatUsd,
  formatQty,
  formatDate,
  statusLabel,
  statusColor,
  sourceLabel,
  componentImageUrl,
} from "@/utils/purchase.js";

const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const router = useRouter();

const project = ref(null);
const loading = ref(false);
const search = ref("");
const exporting = ref(false);
const fetching = ref(false);
const savingItem = ref(false);
const digikeyConnected = ref(null);
const fetchError = ref("");
const pollTimer = ref(null);
const snackbarSuccess = ref(false);
const snackbarFailed = ref(false);
const message = ref("");
const errorMessage = ref("");

const dialogEdit = ref(false);
const editItem = ref(null);
const editQty = ref(0);

const dialogImage = ref(false);
const imageSrc = ref("");
const imageMpn = ref("");

function goBack() {
  router.push("/Kiem-tra-so-lieu");
}

async function loadProject() {
  loading.value = true;
  try {
    const { data } = await axios.get(
      `${Url}/Purchase/Projects/${route.params.id}`,
    );
    project.value = data?.project || null;
  } catch (error) {
    project.value = null;
    errorMessage.value =
      error?.response?.data?.error || "Không tải được dự án mua hàng";
    snackbarFailed.value = true;
  } finally {
    loading.value = false;
  }
}

async function loadDigikeyStatus() {
  try {
    const { data } = await axios.get(`${Url}/DigiKey/OAuth/Status`);
    digikeyConnected.value = Boolean(data?.connected);
  } catch {
    digikeyConnected.value = null;
  }
}

function sourceFileName(file) {
  if (typeof file === "string") return file;
  const boardQty = Number(file?.board_qty) || 1;
  return `${file?.name || "BOM"} (SL board: ${boardQty})`;
}

function openEdit(item) {
  editItem.value = item;
  editQty.value = Number(item.purchase_qty || item.quantity) || 0;
  dialogEdit.value = true;
}

async function saveItemQty() {
  if (!editItem.value || editQty.value < 0) return;
  savingItem.value = true;
  try {
    const items = (project.value.items || []).map((item) => {
      if (item.id !== editItem.value.id) return item;
      const qty = Number(editQty.value) || 0;
      return {
        ...item,
        purchase_qty: qty,
        digikey_extended_price_usd:
          Math.round(
            Number(item.digikey_unit_price_usd || 0) * qty * 100,
          ) / 100,
      };
    });
    const { data } = await axios.put(
      `${Url}/Purchase/Projects/${project.value.id}`,
      {
        project_name: project.value.project_name,
        customer_name: project.value.customer_name,
        source_type: project.value.source_type,
        status: project.value.status,
        note: project.value.note,
        quote_ids: project.value.quote_ids,
        source_files: project.value.source_files,
        items,
      },
    );
    project.value = data.project;
    dialogEdit.value = false;
    message.value = "Đã cập nhật số lượng mua";
    snackbarSuccess.value = true;
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.error || "Không cập nhật được số lượng mua";
    snackbarFailed.value = true;
  } finally {
    savingItem.value = false;
  }
}

function openImage(item) {
  imageSrc.value = componentImageUrl(item);
  imageMpn.value = item?.mpn || "";
  dialogImage.value = Boolean(imageSrc.value);
}

function clearPoll() {
  if (pollTimer.value) {
    clearTimeout(pollTimer.value);
    pollTimer.value = null;
  }
}

async function pollFetchJob(jobId) {
  try {
    const { data } = await axios.get(
      `${Url}/Purchase/FetchDigiKey/${jobId}`,
    );
    if (data?.status === "success") {
      fetching.value = false;
      clearPoll();
      message.value = "Đã lấy giá DigiKey xong";
      snackbarSuccess.value = true;
      await loadProject();
      return;
    }
    if (data?.status === "error") {
      fetching.value = false;
      clearPoll();
      fetchError.value = data?.error || "Lấy giá DigiKey thất bại";
      return;
    }
    pollTimer.value = setTimeout(() => pollFetchJob(jobId), 2500);
  } catch (error) {
    fetching.value = false;
    clearPoll();
    fetchError.value =
      error?.response?.data?.error || "Không kiểm tra được tiến trình lấy giá";
  }
}

async function fetchDigiKey() {
  fetchError.value = "";
  fetching.value = true;
  try {
    const { data } = await axios.post(
      `${Url}/Purchase/Projects/${project.value.id}/FetchDigiKey`,
    );
    if (data?.job_id) {
      pollFetchJob(data.job_id);
    } else {
      fetching.value = false;
      await loadProject();
    }
  } catch (error) {
    const payload = error?.response?.data;
    fetching.value = false;
    if (payload?.code === "DIGIKEY_FETCH_RUNNING" && payload?.job_id) {
      fetching.value = true;
      pollFetchJob(payload.job_id);
      return;
    }
    if (payload?.code === "DIGIKEY_NOT_CONNECTED") {
      digikeyConnected.value = false;
    }
    fetchError.value = payload?.error || "Không bắt đầu được lấy giá DigiKey";
  }
}

async function exportProject() {
  exporting.value = true;
  try {
    const response = await axios.get(
      `${Url}/Purchase/Projects/${project.value.id}/Export`,
      { responseType: "blob" },
    );
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${project.value.project_name || "mua-hang"}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.error || "Không xuất được Excel";
    snackbarFailed.value = true;
  } finally {
    exporting.value = false;
  }
}

onMounted(() => {
  loadProject();
  loadDigikeyStatus();
});

onBeforeUnmount(clearPoll);
</script>
