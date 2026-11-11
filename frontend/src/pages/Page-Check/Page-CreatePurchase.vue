<template>
  <v-card variant="text" class="app-page">
    <PageHeader
      :crumbs="[
        { title: 'Mua hàng' },
        { title: 'Tổng hợp mua hàng', to: '/Kiem-tra-so-lieu' },
        { title: 'Tạo dự án' },
      ]"
    />

    <v-card-text class="d-flex flex-column flex-grow-1" style="min-height: 0">
      <v-card variant="elevated" elevation="0" class="rounded-xl border">
        <v-card-title class="d-flex align-center">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            size="small"
            @click="goBack"
          />
          <span class="text-h6 ms-1">Tạo dự án mua hàng</span>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.project_name"
                label="Tên dự án *"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.customer_name"
                label="Khách hàng"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>
          <v-textarea
            v-model="form.note"
            label="Ghi chú"
            variant="outlined"
            density="compact"
            rows="2"
            hide-details
            class="mt-3"
          />

          <v-tabs v-model="activeSource" color="primary" class="mt-4">
            <v-tab value="bom" class="text-caption">
              <v-icon start>mdi-file-table-multiple-outline</v-icon>
              Import nhiều file BOM
            </v-tab>
            <v-tab value="quote" class="text-caption">
              <v-icon start>mdi-file-document-multiple-outline</v-icon>
              Gộp mã báo giá
            </v-tab>
          </v-tabs>

          <v-window v-model="activeSource" class="mt-3">
            <v-window-item value="bom">
              <v-file-input
                v-model="bomFileInput"
                label="Chọn một hoặc nhiều file BOM"
                accept=".xlsx,.xls,.csv"
                variant="outlined"
                density="compact"
                prepend-icon="mdi-paperclip"
                show-size
                multiple
                hide-details
                class="mt-2"
                @update:modelValue="onFilesSelected"
              />

              <v-alert
                v-if="importError"
                type="error"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                {{ importError }}
              </v-alert>

              <div v-if="hasFiles" class="d-flex align-center ga-2 mt-3 mb-2">
                <v-chip color="primary" variant="tonal" size="small">
                  {{ files.length }} file
                </v-chip>
                <v-chip color="info" variant="tonal" size="small">
                  {{ totalLines }} dòng
                </v-chip>
              </div>

              <v-expansion-panels v-if="hasFiles" multiple variant="accordion">
                <v-expansion-panel
                  v-for="file in files"
                  :key="file.id"
                  :value="file.id"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center ga-2 flex-grow-1">
                      <v-icon color="primary">mdi-file-table-outline</v-icon>
                      <span class="text-body-2 font-weight-medium">
                        {{ file.name }}
                      </span>
                      <v-chip size="x-small" variant="tonal">
                        {{ buildLines(file).length }} dòng
                      </v-chip>
                      <v-spacer />
                      <v-btn
                        icon="mdi-close"
                        size="x-small"
                        variant="text"
                        color="error"
                        v-tooltip:top="'Bỏ file'"
                        @click.stop="removeFile(file.id)"
                      />
                    </div>
                  </v-expansion-panel-title>

                  <v-expansion-panel-text>
                    <v-row dense>
                      <v-col cols="12" md="3">
                        <v-text-field
                          v-model.number="file.board_qty"
                          type="number"
                          min="1"
                          label="SL board"
                          variant="outlined"
                          density="compact"
                          hide-details
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-select
                          :model-value="file.headerRow"
                          :items="rowOptionsFor(file)"
                          label="Dòng tiêu đề"
                          variant="outlined"
                          density="compact"
                          hide-details
                          @update:modelValue="changeHeaderRow(file, $event)"
                        />
                      </v-col>
                    </v-row>

                    <v-row dense class="mt-1">
                      <v-col
                        v-for="field in mappingFields"
                        :key="field.key"
                        cols="12"
                        sm="6"
                        md="3"
                      >
                        <v-select
                          v-model="file.mapping[field.key]"
                          :items="columnOptionsFor(file)"
                          :label="field.label"
                          variant="outlined"
                          density="compact"
                          clearable
                          hide-details
                        />
                      </v-col>
                    </v-row>

                    <v-table
                      v-if="previewLines(file).length"
                      density="compact"
                      class="mt-3 border rounded"
                    >
                      <thead>
                        <tr>
                          <th class="text-caption">MPN</th>
                          <th class="text-caption">QTY</th>
                          <th class="text-caption">Description</th>
                          <th class="text-caption">Designator</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(line, index) in previewLines(file)"
                          :key="index"
                        >
                          <td class="text-caption">
                            {{ line.mpn || line.mpn2 }}
                          </td>
                          <td class="text-caption">{{ line.quantity }}</td>
                          <td class="text-caption">{{ line.description }}</td>
                          <td class="text-caption">{{ line.designator }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <div class="d-flex justify-end mt-4">
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-merge"
                  class="text-caption"
                  :loading="consolidating"
                  :disabled="!hasFiles"
                  @click="consolidateBom"
                >
                  Tổng hợp BOM
                </v-btn>
              </div>
            </v-window-item>

            <v-window-item value="quote">
              <v-row class="mt-2">
                <v-col cols="12" md="5">
                  <v-select
                    v-model="selectedCustomer"
                    :items="customerOptions"
                    label="Khách hàng"
                    variant="outlined"
                    density="compact"
                    clearable
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="7" class="d-flex align-center">
                  <v-chip color="info" variant="tonal" size="small">
                    {{ selectedQuoteIds.length }} mã báo giá được chọn
                  </v-chip>
                </v-col>
              </v-row>

              <v-alert
                v-if="!quotes.length"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                Chưa có báo giá nào để gộp.
              </v-alert>

              <AppDataTable
                v-else
                v-model="selectedQuoteIds"
                :headers="quoteHeaders"
                :items="quoteOptions"
                :items-per-page="10"
                :show-select="true"
                density="compact"
                class="mt-3"
              >
                <template #[`item.created_at`]="{ item }">
                  {{ formatDate(item.created_at) }}
                </template>
                <template #[`item.status`]="{ item }">
                  <v-chip
                    :color="statusColor(item.status)"
                    variant="tonal"
                    size="x-small"
                  >
                    {{ statusLabel(item.status) }}
                  </v-chip>
                </template>
                <template #no-data>
                  <div class="text-center py-4 text-medium-emphasis">
                    Không có báo giá phù hợp
                  </div>
                </template>
              </AppDataTable>

              <div class="d-flex justify-end mt-4">
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-merge"
                  class="text-caption"
                  :loading="consolidating"
                  :disabled="!selectedQuoteIds.length"
                  @click="consolidateQuotes"
                >
                  Tổng hợp báo giá
                </v-btn>
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>

      <v-card
        v-if="previewRows.length"
        variant="elevated"
        elevation="0"
        class="rounded-xl border mt-3"
      >
        <v-card-title class="d-flex align-center flex-wrap ga-2">
          <v-icon color="success">mdi-check-decagram-outline</v-icon>
          <span class="text-h6">Kết quả tổng hợp</span>
          <v-chip color="primary" variant="tonal" size="small">
            {{ previewRows.length }} linh kiện
          </v-chip>
          <v-chip variant="tonal" size="small">
            {{ formatQty(previewSummary.total_qty) }} QTY
          </v-chip>
          <v-chip
            v-if="previewSummary.total_usd"
            color="success"
            variant="tonal"
            size="small"
          >
            {{ formatUsd(previewSummary.total_usd) }}
          </v-chip>
          <v-spacer />
          <v-btn
            v-if="activeSource === 'bom'"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-refresh"
            class="text-caption me-2"
            :loading="fetchingPrice"
            :disabled="digikeyConnected === false"
            @click="fetchPricePreview"
          >
            Lấy giá DigiKey
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save-outline"
            class="text-caption"
            :loading="saving"
            @click="saveProject"
          >
            Lưu dự án
          </v-btn>
        </v-card-title>
        <v-card-text
          v-if="digikeyConnected === false && activeSource === 'bom'"
          class="pb-0"
        >
          <v-alert type="warning" variant="tonal" density="compact">
            Chưa kết nối DigiKey. Vào
            <router-link to="/Cai-dat/" class="text-primary"
              >Cài đặt</router-link
            >
            để kết nối trước khi lấy giá tự động.
          </v-alert>
        </v-card-text>
        <v-card-text class="app-table-fill pt-0">
          <PurchaseItemsTable
            :items="previewRows"
            :items-per-page="10"
            :search="previewSearch"
          />
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <SnackbarSuccess v-model="snackbarSuccess" :message="message" />
  <SnackbarFailed v-model="snackbarFailed" :message="errorMessage" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import PageHeader from '@/components/Page-Header.vue';
import AppDataTable from '@/components/App-DataTable.vue';
import SnackbarSuccess from '@/components/Snackbar-Success.vue';
import SnackbarFailed from '@/components/Snackbar-Failed.vue';
import PurchaseItemsTable from '@/components/Purchase-Items-Table.vue';
import { useMultiBomImport } from '@/composables/Purchase/useMultiBomImport.js';
import {
  formatDate,
  formatQty,
  formatUsd,
  statusColor,
  statusLabel,
} from '@/utils/purchase.js';

const Url = import.meta.env.VITE_API_URL;
const router = useRouter();

const form = ref({
  project_name: '',
  customer_name: '',
  note: '',
});
const activeSource = ref('bom');
const bomFileInput = ref([]);
const previewRows = ref([]);
const previewSummary = ref({ total_qty: 0 });
const previewSearch = ref('');
const saving = ref(false);
const consolidating = ref(false);
const snackbarSuccess = ref(false);
const snackbarFailed = ref(false);
const message = ref('');
const errorMessage = ref('');

const fetchingPrice = ref(false);
const digikeyConnected = ref(null);
const pollTimer = ref(null);

const quotes = ref([]);
const selectedCustomer = ref('');
const selectedQuoteIds = ref([]);

const {
  files,
  error: importError,
  hasFiles,
  totalLines,
  columnOptionsFor,
  rowOptionsFor,
  addFiles,
  removeFile,
  changeHeaderRow,
  buildLines,
  previewLines,
  validate,
  payload,
} = useMultiBomImport();

const mappingFields = [
  { key: 'mpn', label: 'MPN' },
  { key: 'mpn2', label: 'MPN 2' },
  { key: 'mpn3', label: 'MPN 3' },
  { key: 'description', label: 'Description' },
  { key: 'quantity', label: 'Số lượng' },
  { key: 'manufacturer', label: 'Nhà sản xuất' },
  { key: 'designator', label: 'Designator' },
  { key: 'note', label: 'Ghi chú / DNP' },
];

const quoteHeaders = [
  { title: 'Mã BG', key: 'quote_no', width: '140px' },
  { title: 'Dự án', key: 'project_name', width: '220px' },
  { title: 'Khách hàng', key: 'customer_name', width: '180px' },
  { title: 'SL board', key: 'board_qty', width: '90px', align: 'end' },
  { title: 'Linh kiện', key: 'item_count', width: '100px', align: 'end' },
  { title: 'Trạng thái', key: 'status', width: '120px' },
  { title: 'Ngày tạo', key: 'created_at', width: '110px' },
];

const customerOptions = computed(() =>
  Array.from(
    new Set(
      quotes.value
        .map((quote) => String(quote.customer_name || '').trim())
        .filter(Boolean)
    )
  ).sort()
);

const quoteOptions = computed(() => {
  if (!selectedCustomer.value) return quotes.value;
  return quotes.value.filter(
    (quote) => quote.customer_name === selectedCustomer.value
  );
});

watch(activeSource, () => {
  previewRows.value = [];
  previewSummary.value = { total_qty: 0 };
});

watch(selectedCustomer, () => {
  selectedQuoteIds.value = [];
});

async function loadQuotes() {
  try {
    const { data } = await axios.get(`${Url}/Quotation/Quotes`);
    quotes.value = Array.isArray(data) ? data : [];
    if (customerOptions.value.length === 1) {
      selectedCustomer.value = customerOptions.value[0];
    }
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.error || 'Không tải được danh sách báo giá';
    snackbarFailed.value = true;
  }
}

async function onFilesSelected(selected) {
  if (!selected?.length) return;
  await addFiles(selected);
  bomFileInput.value = [];
}

async function consolidateBom() {
  const validationError = validate();
  if (validationError) {
    errorMessage.value = validationError;
    snackbarFailed.value = true;
    return;
  }
  consolidating.value = true;
  try {
    const { data } = await axios.post(`${Url}/Purchase/Bom/Consolidate`, {
      files: payload(),
    });
    previewRows.value = Array.isArray(data?.rows) ? data.rows : [];
    previewSummary.value = data?.summary || { total_qty: 0 };
    if (!form.value.project_name) {
      form.value.project_name = `Tổng hợp BOM ${new Date().toLocaleDateString('vi-VN')}`;
    }
    message.value = `Đã tổng hợp ${previewRows.value.length} linh kiện`;
    snackbarSuccess.value = true;
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.error || 'Không tổng hợp được BOM';
    snackbarFailed.value = true;
  } finally {
    consolidating.value = false;
  }
}

async function consolidateQuotes() {
  if (!selectedQuoteIds.value.length) return;
  consolidating.value = true;
  try {
    const { data } = await axios.post(`${Url}/Purchase/Quotes/Consolidate`, {
      quote_ids: selectedQuoteIds.value,
    });
    previewRows.value = Array.isArray(data?.rows) ? data.rows : [];
    previewSummary.value = data?.summary || { total_qty: 0 };
    if (!form.value.customer_name && data?.customer_name) {
      form.value.customer_name = data.customer_name;
    }
    if (!form.value.project_name) {
      form.value.project_name = `Mua hàng ${data?.customer_name || ''}`.trim();
    }
    message.value = `Đã tổng hợp ${previewRows.value.length} linh kiện`;
    snackbarSuccess.value = true;
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.error || 'Không tổng hợp được báo giá';
    snackbarFailed.value = true;
  } finally {
    consolidating.value = false;
  }
}

async function saveProject() {
  if (!form.value.project_name.trim()) {
    errorMessage.value = 'Chưa nhập tên dự án mua hàng';
    snackbarFailed.value = true;
    return;
  }
  if (!previewRows.value.length) {
    errorMessage.value = 'Chưa có dữ liệu tổng hợp để lưu';
    snackbarFailed.value = true;
    return;
  }
  saving.value = true;
  try {
    const { data } = await axios.post(`${Url}/Purchase/Projects`, {
      project_name: form.value.project_name.trim(),
      customer_name: form.value.customer_name.trim(),
      note: form.value.note,
      source_type: activeSource.value,
      quote_ids: activeSource.value === 'quote' ? selectedQuoteIds.value : [],
      source_files:
        activeSource.value === 'bom'
          ? files.value.map((file) => ({
              name: file.name,
              board_qty: Number(file.board_qty) || 1,
              line_count: buildLines(file).length,
            }))
          : [],
      items: previewRows.value,
    });
    message.value = 'Đã lưu dự án mua hàng';
    snackbarSuccess.value = true;
    router.push(`/Kiem-tra-so-lieu/${data.project.id}`);
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.error || 'Không lưu được dự án mua hàng';
    snackbarFailed.value = true;
  } finally {
    saving.value = false;
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

function clearPoll() {
  if (pollTimer.value) {
    clearTimeout(pollTimer.value);
    pollTimer.value = null;
  }
}

async function pollPreviewJob(jobId) {
  try {
    const { data } = await axios.get(`${Url}/Purchase/FetchDigiKey/${jobId}`);
    if (data?.status === 'success') {
      fetchingPrice.value = false;
      clearPoll();
      previewRows.value = Array.isArray(data.items) ? data.items : [];
      previewSummary.value = data.summary || { total_qty: 0 };
      message.value = `Đã lấy giá DigiKey cho ${previewRows.value.length} linh kiện`;
      snackbarSuccess.value = true;
      return;
    }
    if (data?.status === 'error') {
      fetchingPrice.value = false;
      clearPoll();
      errorMessage.value = data.error || 'Lấy giá DigiKey thất bại';
      snackbarFailed.value = true;
      return;
    }
    pollTimer.value = setTimeout(() => pollPreviewJob(jobId), 2500);
  } catch (error) {
    fetchingPrice.value = false;
    clearPoll();
    errorMessage.value =
      error?.response?.data?.error || 'Không kiểm tra được tiến trình lấy giá';
    snackbarFailed.value = true;
  }
}

async function fetchPricePreview() {
  if (!previewRows.value.length) {
    errorMessage.value = 'Chưa có dữ liệu tổng hợp để lấy giá';
    snackbarFailed.value = true;
    return;
  }
  fetchingPrice.value = true;
  try {
    const { data } = await axios.post(
      `${Url}/Purchase/Bom/FetchDigiKeyPreview`,
      { items: previewRows.value, project_name: form.value.project_name }
    );
    if (data?.job_id) {
      pollPreviewJob(data.job_id);
    } else {
      fetchingPrice.value = false;
    }
  } catch (error) {
    const payload = error?.response?.data;
    fetchingPrice.value = false;
    if (payload?.code === 'DIGIKEY_NOT_CONNECTED') {
      digikeyConnected.value = false;
    }
    errorMessage.value = payload?.error || 'Không bắt đầu được lấy giá DigiKey';
    snackbarFailed.value = true;
  }
}

function goBack() {
  router.push('/Kiem-tra-so-lieu');
}

onMounted(() => {
  loadQuotes();
  loadDigikeyStatus();
});

onBeforeUnmount(clearPoll);
</script>
