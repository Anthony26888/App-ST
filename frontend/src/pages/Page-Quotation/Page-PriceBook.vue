<template>
  <v-card variant="text" class="app-page">
    <PageHeader
      back-to="/Bao-gia"
      :crumbs="[
        { title: 'Kinh doanh', to: '/Bao-gia' },
        { title: 'Bảng giá mẫu' },
      ]"
    >
      <template #actions>
        <v-btn
          variant="tonal"
          color="secondary"
          prepend-icon="mdi-flask-outline"
          class="text-caption"
          @click="openTestDialog"
        >
          Test mapping
        </v-btn>
      </template>
    </PageHeader>

    <v-card-text class="d-flex flex-column flex-grow-1" style="min-height: 0">
      <v-row>
        <v-col cols="12" lg="3">
          <v-card variant="outlined" class="rounded-xl">
            <v-card-title class="d-flex align-center text-subtitle-1">
              Bảng giá
              <v-spacer />
              <v-btn
                icon="mdi-plus"
                size="small"
                variant="tonal"
                color="primary"
                @click="openBookDialog()"
              />
            </v-card-title>
            <v-list density="compact" nav>
              <v-list-item
                v-for="book in books"
                :key="book.id"
                :active="selectedBookId === book.id"
                @click="selectBook(book.id)"
              >
                <template #title>
                  <span class="text-body-2">{{ book.name }}</span>
                </template>
                <template #subtitle>
                  <span class="text-caption"
                    >{{ book.group_count }} nhóm giá</span
                  >
                </template>
                <template #append>
                  <v-chip
                    v-if="Number(book.is_default) === 1"
                    size="x-small"
                    color="success"
                    variant="tonal"
                    class="me-1"
                  >
                    Mặc định
                  </v-chip>
                  <v-btn
                    icon="mdi-pencil"
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click.stop="openBookDialog(book)"
                  />
                  <v-btn
                    icon="mdi-delete-outline"
                    size="x-small"
                    variant="text"
                    color="error"
                    @click.stop="askDelete('book', book)"
                  />
                </template>
              </v-list-item>
              <v-list-item v-if="!books.length">
                <template #title>
                  <span class="text-caption text-medium-emphasis"
                    >Chưa có bảng giá</span
                  >
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" lg="9">
          <v-card variant="outlined" class="rounded-xl">
            <v-card-title class="d-flex align-center flex-wrap ga-2">
              <span class="text-subtitle-1 font-weight-bold">
                {{ bookData.book?.name || 'Chọn bảng giá' }}
              </span>
              <v-chip
                v-if="bookData.book"
                size="small"
                variant="tonal"
                color="grey"
              >
                v{{ bookData.book.version }}
              </v-chip>
              <v-spacer />
              <v-btn
                variant="tonal"
                color="primary"
                prepend-icon="mdi-plus"
                class="text-caption"
                :disabled="!bookData.book"
                @click="openGroupDialog()"
              >
                Thêm nhóm giá
              </v-btn>
            </v-card-title>

            <v-tabs v-model="tab" color="primary">
              <!-- <v-tab :value="0" class="text-caption">{{
                isPadMode ? 'Phân loại linh kiện' : 'Nhóm giá'
              }}</v-tab> -->
              <v-tab v-if="isPadMode" :value="2" class="text-caption"
                >Giá pad</v-tab
              >
              <v-tab :value="1" class="text-caption">Giá riêng MPN</v-tab>
            </v-tabs>
            <v-divider />

            <v-card-text>
              <v-window v-model="tab">
                <v-window-item :value="0">
                  <v-table density="compact" class="border rounded">
                    <thead>
                      <tr class="bg-grey-lighten-4">
                        <th class="text-caption">Mã</th>
                        <th class="text-caption">Tên nhóm</th>
                        <th class="text-caption">Mount</th>
                        <th class="text-caption">Đơn vị</th>
                        <th class="text-caption">Số chân</th>
                        <th v-if="!isPadMode" class="text-caption text-right">
                          Đơn giá
                        </th>
                        <th class="text-caption text-center">Ưu tiên</th>
                        <th class="text-caption">Pattern</th>
                        <th class="text-caption text-center">Active</th>
                        <th class="text-caption">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="group in bookData.groups" :key="group.id">
                        <td class="text-caption font-weight-medium">
                          {{ group.group_code }}
                        </td>
                        <td class="text-caption">{{ group.group_name }}</td>
                        <td class="text-caption">{{ group.mount_type }}</td>
                        <td class="text-caption">{{ group.unit }}</td>
                        <td class="text-caption" :title="pinHint(group)">
                          <div class="d-flex flex-column">
                            <span class="font-weight-medium">{{
                              pinSummary(group)
                            }}</span>
                            <span class="text-caption text-medium-emphasis">
                              {{ pinModeLabel(group.pin_mode) }}
                            </span>
                          </div>
                        </td>
                        <td v-if="!isPadMode" class="text-caption text-right">
                          {{ formatMoney(group.unit_price) }}
                        </td>
                        <td class="text-caption text-center">
                          {{ group.priority }}
                        </td>
                        <td class="text-caption pattern-cell">
                          {{
                            (group.patterns || [])
                              .map((p) => p.pattern)
                              .join(', ') ||
                            (group.keywords
                              ? `Từ khóa: ${group.keywords}`
                              : '—')
                          }}
                        </td>
                        <td class="text-center">
                          <v-icon
                            :color="
                              Number(group.active) === 1 ? 'success' : 'grey'
                            "
                            size="18"
                          >
                            {{
                              Number(group.active) === 1
                                ? 'mdi-check-circle'
                                : 'mdi-minus-circle'
                            }}
                          </v-icon>
                        </td>
                        <td>
                          <v-btn
                            icon="mdi-pencil"
                            size="x-small"
                            variant="text"
                            color="primary"
                            @click="openGroupDialog(group)"
                          />
                          <v-btn
                            icon="mdi-delete-outline"
                            size="x-small"
                            variant="text"
                            color="error"
                            @click="askDelete('group', group)"
                          />
                        </td>
                      </tr>
                      <tr v-if="!bookData.groups.length">
                        <td
                          :colspan="isPadMode ? 9 : 10"
                          class="text-center text-grey py-6 text-caption"
                        >
                          Chưa có nhóm giá nào.
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-window-item>

                <v-window-item v-if="isPadMode" :value="2">
                  <v-alert
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="mb-3 text-caption"
                  >
                    Giá mẫu, sale cập nhật theo giá thực tế. PICK/gắp tay không
                    tự tính giá.
                  </v-alert>
                  <v-table density="compact" class="border rounded">
                    <thead>
                      <tr class="bg-grey-lighten-4">
                        <th class="text-caption">Quy trình</th>
                        <th class="text-caption">Tên</th>
                        <th
                          class="text-caption text-right"
                          style="width: 160px"
                        >
                          Đơn giá/pad
                        </th>
                        <th class="text-caption">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="rate in padRates" :key="rate.process_code">
                        <td class="text-caption font-weight-medium">
                          {{ rate.process_code }}
                        </td>
                        <td class="text-caption">{{ rate.process_name }}</td>
                        <td>
                          <v-text-field
                            v-model.number="rate.rate"
                            type="number"
                            min="0"
                            density="compact"
                            variant="underlined"
                            hide-details
                            class="text-right"
                          />
                        </td>
                        <td>
                          <v-text-field
                            v-model="rate.note"
                            density="compact"
                            variant="underlined"
                            hide-details
                          />
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                  <div class="d-flex justify-end mt-3">
                    <v-btn
                      color="primary"
                      variant="tonal"
                      prepend-icon="mdi-content-save"
                      class="text-caption"
                      :loading="savingPadRates"
                      @click="savePadRates"
                    >
                      Lưu giá pad
                    </v-btn>
                  </div>
                </v-window-item>

                <v-window-item :value="1">
                  <div class="d-flex justify-end mb-2">
                    <v-btn
                      variant="tonal"
                      color="primary"
                      size="small"
                      prepend-icon="mdi-plus"
                      :disabled="!bookData.book"
                      @click="openOverrideDialog"
                    >
                      Thêm giá MPN
                    </v-btn>
                  </div>
                  <v-table density="compact" class="border rounded">
                    <thead>
                      <tr class="bg-grey-lighten-4">
                        <th class="text-caption">MPN</th>
                        <th class="text-caption text-right">Đơn giá</th>
                        <th class="text-caption">Mount</th>
                        <th class="text-caption">Số chân</th>
                        <th class="text-caption">Phạm vi</th>
                        <th class="text-caption">Ghi chú</th>
                        <th class="text-caption">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="override in bookData.overrides"
                        :key="override.id"
                      >
                        <td class="text-caption font-weight-medium">
                          <div class="d-flex align-center">
                            <span>{{ override.mpn }}</span>
                            <v-btn
                              v-if="override.mpn"
                              icon="mdi-information-variant-circle"
                              size="x-small"
                              variant="text"
                              color="primary"
                              class="ms-1"
                              @click="openDetail(override.mpn)"
                            />
                          </div>
                        </td>
                        <td class="text-caption text-right">
                          {{ formatMoney(override.unit_price) }}
                        </td>
                        <td class="text-caption">
                          {{ override.mount_type || '—' }}
                        </td>
                        <td class="text-caption">
                          {{ override.pin_count ?? '—' }}
                        </td>
                        <td class="text-caption">{{ override.scope }}</td>
                        <td class="text-caption">{{ override.note || '—' }}</td>
                        <td>
                          <v-btn
                            icon="mdi-delete-outline"
                            size="x-small"
                            variant="text"
                            color="error"
                            @click="askDelete('override', override)"
                          />
                        </td>
                      </tr>
                      <tr v-if="!bookData.overrides.length">
                        <td
                          colspan="7"
                          class="text-center text-grey py-6 text-caption"
                        >
                          Chưa có giá riêng MPN.
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <!-- BOOK DIALOG -->
  <BaseDialog
    v-model="dialogBook"
    width="520"
    :title="editingBook ? 'Sửa bảng giá' : 'Thêm bảng giá'"
    icon="mdi-tag-multiple-outline"
  >
    <v-text-field
      v-model="bookForm.name"
      label="Tên bảng giá *"
      variant="outlined"
      density="compact"
      class="mb-2"
    />
    <v-select
      v-model="bookForm.currency"
      :items="['VND', 'USD']"
      label="Tiền tệ"
      variant="outlined"
      density="compact"
      class="mb-2"
    />
    <v-textarea
      v-model="bookForm.note"
      label="Ghi chú"
      variant="outlined"
      density="compact"
      rows="2"
      class="mb-2"
    />
    <v-checkbox
      v-model="bookForm.is_default"
      label="Đặt làm bảng giá mặc định"
      density="compact"
      hide-details
    />
    <template #actions>
      <ButtonCancel @cancel="dialogBook = false" />
      <ButtonSave :disabled="!bookForm.name?.trim()" @save="saveBook" />
    </template>
  </BaseDialog>

  <!-- GROUP DIALOG -->
  <PriceGroupDialog
    v-model="dialogGroup"
    :initial="groupInitial"
    :editing="Boolean(editingGroup)"
    :saving="savingGroup"
    :price-book-id="selectedBookId"
    :pricing-mode="bookData.book?.pricing_mode"
    :existing-codes="existingGroupCodes"
    @submit="saveGroup"
    @use-existing="editMatchedGroup"
  />

  <!-- OVERRIDE DIALOG -->
  <PriceOverrideDialog
    v-model="dialogOverride"
    :initial="overrideInitial"
    :saving="savingOverride"
    @submit="saveOverride"
  />

  <DigiKeyInfoDialog v-model="dialogDetail" :mpn="detailMpn" />

  <!-- TEST DIALOG -->
  <BaseDialog
    v-model="dialogTest"
    width="900"
    title="Test mapping"
    icon="mdi-flask-outline"
  >
    <div class="d-flex align-center mb-2">
      <span class="text-caption text-medium-emphasis">
        Nhập thử MPN / Description / Package / SL để kiểm tra nhóm giá.
      </span>
      <v-spacer />
      <v-btn
        size="small"
        variant="tonal"
        color="primary"
        prepend-icon="mdi-plus"
        @click="addTestRow"
      >
        Thêm dòng
      </v-btn>
    </div>
    <v-table density="compact" class="border rounded mb-3">
      <thead>
        <tr class="bg-grey-lighten-4">
          <th class="text-caption">MPN</th>
          <th class="text-caption">Description</th>
          <th class="text-caption">Package</th>
          <th class="text-caption" style="width: 80px">SL</th>
          <th class="text-caption" style="width: 50px"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in testRows" :key="index">
          <td>
            <v-text-field
              v-model="row.mpn"
              density="compact"
              variant="outlined"
              hide-details
            />
          </td>
          <td>
            <v-text-field
              v-model="row.description"
              density="compact"
              variant="outlined"
              hide-details
            />
          </td>
          <td>
            <v-text-field
              v-model="row.package"
              density="compact"
              variant="outlined"
              hide-details
            />
          </td>
          <td>
            <v-text-field
              v-model.number="row.quantity"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
            />
          </td>
          <td>
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              color="error"
              @click="removeTestRow(index)"
            />
          </td>
        </tr>
      </tbody>
    </v-table>
    <div class="d-flex justify-end mb-3">
      <v-btn
        color="primary"
        variant="tonal"
        prepend-icon="mdi-play"
        :loading="testing"
        @click="runTest"
      >
        Kiểm tra mapping
      </v-btn>
    </div>
    <v-table v-if="testResults.length" density="compact" class="border rounded">
      <thead>
        <tr class="bg-grey-lighten-4">
          <th class="text-caption">MPN</th>
          <th class="text-caption">Package</th>
          <th class="text-caption">Số chân</th>
          <th v-if="isPadMode" class="text-caption">Số pad</th>
          <th v-if="isPadMode" class="text-caption">Quy trình</th>
          <th class="text-caption">Nhóm giá</th>
          <th class="text-caption text-right">Đơn giá</th>
          <th class="text-caption">Nguồn</th>
          <th class="text-caption">Tin cậy</th>
          <th class="text-caption">Cảnh báo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in testResults" :key="index">
          <td class="text-caption">
            <div class="d-flex align-center">
              <span>{{ row.mpn || '—' }}</span>
              <v-btn
                v-if="row.mpn"
                icon="mdi-information-variant-circle"
                size="x-small"
                variant="text"
                color="primary"
                class="ms-1"
                @click="openDetail(row.mpn)"
              />
            </div>
          </td>
          <td class="text-caption">{{ row.package || '—' }}</td>
          <td class="text-caption">{{ row.pin_count ?? '—' }}</td>
          <td v-if="isPadMode" class="text-caption">
            {{ row.pad_count ?? '—' }}
          </td>
          <td v-if="isPadMode" class="text-caption">
            {{ row.process_code || '—' }}
          </td>
          <td class="text-caption">{{ row.group_code || '—' }}</td>
          <td class="text-caption text-right">
            {{ formatMoney(row.unit_price) }}
          </td>
          <td class="text-caption">{{ row.match_method }}</td>
          <td class="text-caption">
            {{ Math.round((Number(row.confidence) || 0) * 100) }}%
          </td>
          <td class="text-caption">
            {{ (row.warnings || []).join(', ') || '—' }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <template #actions>
      <ButtonCancel @cancel="dialogTest = false" />
    </template>
  </BaseDialog>

  <BaseDialog
    v-model="dialogDelete"
    width="420"
    title="Xoá dữ liệu"
    icon="mdi-delete"
  >
    Bạn có chắc chắn muốn xoá mục này?
    <template #actions>
      <ButtonCancel @cancel="dialogDelete = false" />
      <ButtonDelete @delete="confirmDelete" />
    </template>
  </BaseDialog>

  <SnackbarSuccess v-model="snackbarSuccess" :message="message" />
  <SnackbarFailed v-model="snackbarFailed" :message="errorMessage" />
</template>

<script setup>
import { computed, onMounted, reactive, ref, nextTick } from 'vue';
import axios from 'axios';
import PageHeader from '@/components/Page-Header.vue';
import BaseDialog from '@/components/BaseDialog.vue';
import ButtonSave from '@/components/Button-Save.vue';
import ButtonCancel from '@/components/Button-Cancel.vue';
import ButtonDelete from '@/components/Button-Delete.vue';
import SnackbarSuccess from '@/components/Snackbar-Success.vue';
import SnackbarFailed from '@/components/Snackbar-Failed.vue';
import DigiKeyInfoDialog from '@/components/DigiKey-InfoDialog.vue';
import PriceGroupDialog from '@/components/Quotation/PriceGroup-Dialog.vue';
import PriceOverrideDialog from '@/components/Quotation/PriceOverride-Dialog.vue';

const Url = import.meta.env.VITE_API_URL;

const books = ref([]);
const selectedBookId = ref(null);
const bookData = ref({ book: null, groups: [], overrides: [], pad_rates: [] });
const tab = ref(0);
const padRates = ref([]);
const savingPadRates = ref(false);
const isPadMode = computed(
  () => bookData.value.book?.pricing_mode === 'per_pad'
);

const existingGroupCodes = computed(() =>
  (bookData.value.groups || []).map((group) => group.group_code)
);

const dialogBook = ref(false);
const dialogGroup = ref(false);
const dialogOverride = ref(false);
const dialogTest = ref(false);
const dialogDelete = ref(false);
const dialogDetail = ref(false);
const detailMpn = ref('');
const editingBook = ref(null);
const editingGroup = ref(null);
const groupInitial = ref({});
const overrideInitial = ref({});
const savingGroup = ref(false);
const savingOverride = ref(false);
const deleteTarget = ref(null);

const snackbarSuccess = ref(false);
const snackbarFailed = ref(false);
const message = ref('');
const errorMessage = ref('');

const bookForm = reactive({
  name: '',
  currency: 'VND',
  pricing_mode: 'per_pad',
  note: '',
  is_default: false,
});

function normalizePadRates(rows) {
  const map = new Map(
    (Array.isArray(rows) ? rows : []).map((row) => [
      String(row.process_code || '').toUpperCase(),
      row,
    ])
  );
  return ['SMT', 'HAND'].map((code) => ({
    process_code: code,
    process_name:
      map.get(code)?.process_name ||
      (code === 'SMT' ? 'Pad SMT' : 'Pad hàn tay / THT'),
    rate: Number(map.get(code)?.rate) || 0,
    note: map.get(code)?.note || 'Giá mẫu',
    active: Number(map.get(code)?.active ?? 1) === 1 ? 1 : 0,
  }));
}

const testing = ref(false);
const testRows = ref([{ mpn: '', description: '', package: '', quantity: 1 }]);
const testResults = ref([]);

function formatMoney(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(Number(value) || 0))} đ`;
}

function pinSummary(group) {
  if (group?.pin_count != null && group.pin_count !== '') {
    return `${group.pin_count} chân`;
  }
  const hasMin = group?.pin_min != null && group.pin_min !== '';
  const hasMax = group?.pin_max != null && group.pin_max !== '';
  if (hasMin && hasMax) return `${group.pin_min}–${group.pin_max} chân`;
  if (hasMin) return `${group.pin_min}+ chân`;
  if (hasMax) return `≤${group.pin_max} chân`;
  if (group?.pin_mode === 'passive') return 'Không xác định';
  return group?.pin_mode === 'parse' ? 'Theo package' : 'Theo BOM';
}

function pinModeLabel(mode) {
  switch (mode) {
    case 'fixed':
      return 'Cố định';
    case 'parse':
      return 'Tự tách';
    case 'manual':
      return 'Nhập tay';
    case 'passive':
      return 'Không xác định';
    default:
      return '—';
  }
}

function pinHint(group) {
  const mode = group?.pin_mode;
  const base =
    mode === 'fixed'
      ? 'Nhóm có số chân cố định.'
      : mode === 'parse'
        ? 'Số chân tự tách từ package/tên, VD: SOT-23-5 → 5.'
        : 'Số chân lấy từ dòng BOM hoặc nhập tay.';
  const priceNote =
    group?.unit === 'con'
      ? " Đơn vị 'con' nên số chân chỉ để phân biệt, không nhân vào giá."
      : '';
  return `${base}${priceNote}`;
}

async function loadBooks() {
  try {
    const { data } = await axios.get(`${Url}/Quotation/PriceBook/List`);
    books.value = Array.isArray(data) ? data : [];
    const preferred =
      books.value.find((book) => book.id === selectedBookId.value) ||
      books.value.find((book) => Number(book.is_default) === 1) ||
      books.value[0];
    if (preferred) {
      selectedBookId.value = preferred.id;
      await loadBook(preferred.id);
    } else {
      selectedBookId.value = null;
      bookData.value = { book: null, groups: [], overrides: [], pad_rates: [] };
      padRates.value = normalizePadRates([]);
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Không tải được bảng giá';
    snackbarFailed.value = true;
  }
}

async function loadBook(id) {
  if (!id) return;
  try {
    const { data } = await axios.get(`${Url}/Quotation/PriceBook/${id}`);
    bookData.value = {
      book: data.book,
      groups: Array.isArray(data.groups) ? data.groups : [],
      overrides: Array.isArray(data.overrides) ? data.overrides : [],
      pad_rates: Array.isArray(data.pad_rates) ? data.pad_rates : [],
    };
    padRates.value = normalizePadRates(data.pad_rates);
    if (
      String(data.book?.pricing_mode || '') === 'per_pad' &&
      tab.value === 0
    ) {
      tab.value = 2;
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Không tải được chi tiết bảng giá';
    snackbarFailed.value = true;
  }
}

function selectBook(id) {
  selectedBookId.value = id;
  loadBook(id);
}

function openBookDialog(book = null) {
  editingBook.value = book;
  bookForm.name = book?.name || '';
  bookForm.currency = book?.currency || 'VND';
  bookForm.pricing_mode = book?.pricing_mode || 'per_pad';
  bookForm.note = book?.note || '';
  bookForm.is_default = Number(book?.is_default) === 1;
  dialogBook.value = true;
}

async function saveBook() {
  try {
    const payload = {
      name: bookForm.name,
      currency: bookForm.currency,
      pricing_mode: bookForm.pricing_mode,
      note: bookForm.note,
      is_default: bookForm.is_default ? 1 : 0,
      created_by: localStorage.getItem('Username') || '',
    };
    if (editingBook.value) {
      await axios.put(
        `${Url}/Quotation/PriceBook/Edit/${editingBook.value.id}`,
        payload
      );
      message.value = 'Đã cập nhật bảng giá';
    } else {
      const { data } = await axios.post(
        `${Url}/Quotation/PriceBook/Add`,
        payload
      );
      selectedBookId.value = data.id;
      message.value = 'Đã tạo bảng giá';
    }
    dialogBook.value = false;
    snackbarSuccess.value = true;
    await loadBooks();
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Lưu bảng giá thất bại';
    snackbarFailed.value = true;
  }
}

function openGroupDialog(group = null) {
  editingGroup.value = group;
  groupInitial.value = group
    ? {
        group_code: group.group_code,
        group_name: group.group_name,
        mount_type: group.mount_type,
        unit: group.unit,
        pin_mode: group.pin_mode,
        pin_count: group.pin_count,
        pin_min: group.pin_min,
        pin_max: group.pin_max,
        unit_price: Number(group.unit_price) || 0,
        priority: Number(group.priority) || 100,
        patterns: (group.patterns || [])
          .map((pattern) => pattern.pattern)
          .join('\n'),
        keywords: group.keywords || '',
        active: Number(group.active) === 1,
      }
    : {};
  dialogGroup.value = true;
}

async function editMatchedGroup(payload) {
  if (!payload?.group_code) return;
  dialogGroup.value = false;
  const group = (bookData.value.groups || []).find(
    (item) => item.group_code === payload.group_code
  );
  if (!group) {
    errorMessage.value = 'Không tìm thấy nhóm giá đã khớp';
    snackbarFailed.value = true;
    return;
  }
  await nextTick();
  openGroupDialog(group);
}

async function saveGroup(payload) {
  savingGroup.value = true;
  try {
    const body = {
      ...payload,
      created_by: localStorage.getItem('Username') || '',
    };
    if (editingGroup.value) {
      await axios.put(
        `${Url}/Quotation/PriceBook/Group/${editingGroup.value.id}`,
        body
      );
      message.value = 'Đã cập nhật nhóm giá';
    } else {
      await axios.post(
        `${Url}/Quotation/PriceBook/${selectedBookId.value}/Group`,
        body
      );
      message.value = 'Đã thêm nhóm giá';
    }
    dialogGroup.value = false;
    snackbarSuccess.value = true;
    await loadBook(selectedBookId.value);
    await loadBooks();
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Lưu nhóm giá thất bại';
    snackbarFailed.value = true;
  } finally {
    savingGroup.value = false;
  }
}

async function savePadRates() {
  if (!selectedBookId.value) return;
  savingPadRates.value = true;
  try {
    await axios.put(
      `${Url}/Quotation/PriceBook/${selectedBookId.value}/PadRates`,
      {
        rates: padRates.value,
        created_by: localStorage.getItem('Username') || '',
      }
    );
    message.value = 'Đã cập nhật giá pad';
    snackbarSuccess.value = true;
    await loadBook(selectedBookId.value);
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Lưu giá pad thất bại';
    snackbarFailed.value = true;
  } finally {
    savingPadRates.value = false;
  }
}

function openOverrideDialog() {
  overrideInitial.value = {};
  dialogOverride.value = true;
}

async function saveOverride(payload) {
  savingOverride.value = true;
  try {
    await axios.post(
      `${Url}/Quotation/PriceBook/${selectedBookId.value}/Override`,
      {
        ...payload,
        created_by: localStorage.getItem('Username') || '',
      }
    );
    dialogOverride.value = false;
    message.value = 'Đã thêm giá riêng MPN';
    snackbarSuccess.value = true;
    await loadBook(selectedBookId.value);
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Lưu giá MPN thất bại';
    snackbarFailed.value = true;
  } finally {
    savingOverride.value = false;
  }
}

function openDetail(mpn) {
  const value = String(mpn || '').trim();
  if (!value) return;
  detailMpn.value = value;
  dialogDetail.value = true;
}

function askDelete(type, item) {
  deleteTarget.value = { type, item };
  dialogDelete.value = true;
}

async function confirmDelete() {
  const target = deleteTarget.value;
  if (!target) return;
  try {
    if (target.type === 'book') {
      await axios.delete(`${Url}/Quotation/PriceBook/Delete/${target.item.id}`);
      if (selectedBookId.value === target.item.id) selectedBookId.value = null;
      message.value = 'Đã xoá bảng giá';
    } else if (target.type === 'group') {
      await axios.delete(`${Url}/Quotation/PriceBook/Group/${target.item.id}`);
      message.value = 'Đã xoá nhóm giá';
    } else if (target.type === 'override') {
      await axios.delete(
        `${Url}/Quotation/PriceBook/Override/${target.item.id}`
      );
      message.value = 'Đã xoá giá MPN';
    }
    dialogDelete.value = false;
    snackbarSuccess.value = true;
    await loadBooks();
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Xoá thất bại';
    snackbarFailed.value = true;
  }
}

function openTestDialog() {
  testResults.value = [];
  if (!testRows.value.length) {
    testRows.value = [{ mpn: '', description: '', package: '', quantity: 1 }];
  }
  dialogTest.value = true;
}

function addTestRow() {
  testRows.value.push({ mpn: '', description: '', package: '', quantity: 1 });
}

function removeTestRow(index) {
  testRows.value.splice(index, 1);
}

async function runTest() {
  testing.value = true;
  try {
    const lines = testRows.value
      .filter((row) => row.mpn || row.description || row.package)
      .map((row) => ({
        mpn: row.mpn,
        description: row.description,
        package: row.package,
        quantity: row.quantity || 1,
        designator: '',
        note: '',
      }));
    const { data } = await axios.post(`${Url}/Quotation/ResolveBom`, {
      price_book_id: selectedBookId.value,
      board_qty: 1,
      lines,
    });
    testResults.value = data.items || [];
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Test mapping thất bại';
    snackbarFailed.value = true;
  } finally {
    testing.value = false;
  }
}

onMounted(loadBooks);
</script>

<style scoped>
.pattern-cell {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
