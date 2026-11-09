<template>
  <v-card variant="text" class="app-page">
    <PageHeader
      back-to="/Bao-gia"
      :crumbs="[
        { title: 'Kinh doanh', to: '/Bao-gia' },
        { title: quote?.quote_no || 'Chi tiết báo giá' },
      ]"
    >
      <template #actions>
        <v-btn
          variant="tonal"
          color="success"
          prepend-icon="mdi-microsoft-excel"
          class="text-caption"
          @click="downloadFile('Export')"
        >
          Xuất Excel
        </v-btn>
        <v-btn
          variant="tonal"
          color="warning"
          prepend-icon="mdi-alert-circle-outline"
          class="text-caption ms-2"
          @click="downloadFile('UnmappedExport')"
        >
          Dòng chưa mapping
        </v-btn>
        <v-btn
          variant="tonal"
          color="secondary"
          prepend-icon="mdi-content-duplicate"
          class="text-caption ms-2"
          @click="cloneQuote"
        >
          Nhân bản
        </v-btn>
        <v-btn
          variant="tonal"
          color="error"
          prepend-icon="mdi-delete-outline"
          class="text-caption ms-2"
          @click="dialogDelete = true"
        >
          Xoá
        </v-btn>
      </template>
    </PageHeader>

    <v-card-text class="d-flex flex-column flex-grow-1" style="min-height: 0">
      <v-row class="mb-3">
        <v-col cols="6" md="3">
          <CardStatistic
            title="Tổng tiền"
            :value="formatMoney(quote?.total)"
            icon="mdi-cash-multiple"
            color="primary"
          />
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Số board"
            :value="quote?.board_qty || 0"
            icon="mdi-layers-outline"
            color="info"
          />
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Trạng thái"
            :value="quote?.status || '—'"
            icon="mdi-progress-check"
            :color="statusColor(quote?.status)"
          />
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Dòng cần kiểm tra"
            :value="reviewItems.length"
            icon="mdi-alert-outline"
            color="warning"
          />
        </v-col>
      </v-row>

      <v-card
        variant="elevated"
        elevation="0"
        class="rounded-xl border app-card-fill"
      >
        <v-card-title class="d-flex align-center flex-wrap ga-2">
          <span class="text-subtitle-1 font-weight-bold">{{
            quote?.quote_no
          }}</span>
          <v-chip
            :color="statusColor(quote?.status)"
            variant="tonal"
            size="small"
          >
            {{ quote?.status }}
          </v-chip>
          <v-chip
            v-if="quote?.pricing_mode === 'per_pad'"
            color="primary"
            variant="tonal"
            size="small"
          >
            Gia công theo pad
          </v-chip>
          <v-spacer />
          <v-select
            v-model="newStatus"
            :items="statuses"
            label="Đổi trạng thái"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 220px"
          />
          <v-btn
            color="primary"
            variant="tonal"
            class="text-caption"
            :loading="updatingStatus"
            @click="updateStatus"
          >
            Cập nhật
          </v-btn>
        </v-card-title>

        <v-tabs v-model="tab" color="primary">
          <v-tab :value="0">Tổng quan</v-tab>
          <v-tab :value="1">Bảng giá chi tiết</v-tab>
          <v-tab :value="2">Giá linh kiện</v-tab>
          <v-tab :value="3">Lịch sử</v-tab>
        </v-tabs>
        <v-divider />

        <v-card-text class="app-table-fill">
          <v-window v-model="tab">
            <v-window-item :value="0">
              <v-row>
                <v-col cols="12" md="7">
                  <v-card variant="outlined" class="rounded-xl">
                    <v-card-title class="text-subtitle-1"
                      >Thông tin</v-card-title
                    >
                    <v-card-text class="text-body-2">
                      <v-row dense>
                        <v-col cols="12" md="6" class="mt-2">
                          <div class="text-caption text-medium-emphasis">
                            Khách hàng
                          </div>
                          <div class="font-weight-medium">
                            {{ quote?.customer_name || '—' }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Dự án
                          </div>
                          <div class="font-weight-medium">
                            {{ quote?.project_name || '—' }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Bảng giá
                          </div>
                          <div class="font-weight-medium">
                            {{ quote?.price_book_name || '—' }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Ngày tạo
                          </div>
                          <div class="font-weight-medium">
                            {{ formatDate(quote?.created_at) || '—' }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Hiệu lực
                          </div>
                          <div class="font-weight-medium">
                            {{ formatDate(quote?.valid_until) || '—' }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Thời gian giao
                          </div>
                          <div class="font-weight-medium">
                            {{ quote?.lead_time || '—' }}
                          </div>
                        </v-col>
                        <v-col cols="12">
                          <div class="text-caption text-medium-emphasis">
                            Điều khoản thanh toán
                          </div>
                          <div class="font-weight-medium">
                            {{ quote?.payment_terms || '—' }}
                          </div>
                        </v-col>
                        <v-col v-if="quote?.note" cols="12">
                          <div class="text-caption text-medium-emphasis">
                            Ghi chú
                          </div>
                          <div class="font-weight-medium">{{ quote.note }}</div>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" md="5">
                  <v-card variant="outlined" class="rounded-xl">
                    <v-card-title class="text-subtitle-1"
                      >Tổng tiền</v-card-title
                    >
                    <v-card-text class="text-body-2">
                      <div class="d-flex mb-1">
                        <span>Tạm tính</span>
                        <v-spacer />
                        <span>{{ formatMoney(quote?.subtotal) }}</span>
                      </div>
                      <div class="d-flex mb-1">
                        <span>Chiết khấu</span>
                        <v-spacer />
                        <span>-{{ formatMoney(quote?.discount_value) }}</span>
                      </div>
                      <div class="d-flex mb-2">
                        <span>VAT ({{ quote?.vat_percent || 0 }}%)</span>
                        <v-spacer />
                        <span>{{ formatMoney(vatAmount) }}</span>
                      </div>
                      <v-divider class="mb-2" />
                      <div class="d-flex align-center">
                        <span class="text-subtitle-1 font-weight-bold"
                          >TỔNG CỘNG</span
                        >
                        <v-spacer />
                        <span
                          class="text-subtitle-1 font-weight-bold text-primary"
                        >
                          {{ formatMoney(quote?.total) }}
                        </span>
                      </div>
                      <div class="d-flex mt-1">
                        <span class="text-caption text-medium-emphasis"
                          >Giá / board</span
                        >
                        <v-spacer />
                        <span class="text-caption font-weight-medium">
                          {{ formatMoney(pricePerBoard) }}
                        </span>
                      </div>
                    </v-card-text>
                  </v-card>

                  <v-card
                    v-if="costLines.length"
                    variant="outlined"
                    class="rounded-xl mt-3"
                  >
                    <v-card-title class="text-subtitle-1"
                      >Phí khác</v-card-title
                    >
                    <v-card-text class="text-body-2 pt-0">
                      <div
                        v-for="fee in costLines"
                        :key="fee.id"
                        class="d-flex mb-1"
                      >
                        <span>{{ fee.name }}</span>
                        <v-spacer />
                        <span>{{ formatMoney(fee.amount) }}</span>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>

            <v-window-item :value="1">
              <AppDataTable
                :headers="itemHeaders"
                :items="items"
                :items-per-page="20"
              >
                <template #[`item.mpn`]="{ item }">
                  <div class="d-flex align-center">
                    <span class="text-caption">{{ item.mpn || '—' }}</span>
                    <v-btn
                      v-if="item.mpn"
                      icon="mdi-information-variant-circle"
                      size="x-small"
                      variant="text"
                      color="primary"
                      class="ms-1"
                      @click="openDetail(item.mpn)"
                    />
                  </div>
                </template>
                <template #[`item.dnp`]="{ item }">
                  <v-chip
                    v-if="item.dnp"
                    size="x-small"
                    color="grey"
                    variant="tonal"
                  >
                    DNP
                  </v-chip>
                </template>
                <template #[`item.needs_review`]="{ item }">
                  <v-chip
                    v-if="item.needs_review"
                    size="x-small"
                    color="warning"
                    variant="tonal"
                  >
                    Cần kiểm tra
                  </v-chip>
                  <v-chip v-else size="x-small" color="success" variant="tonal"
                    >OK</v-chip
                  >
                </template>
                <template #[`item.unit_price`]="{ item }">
                  {{ formatMoney(item.unit_price) }}
                  <span v-if="item.unit === 'pad'" class="text-medium-emphasis"
                    >/pad</span
                  >
                </template>
                <template #[`item.line_total`]="{ item }">
                  <span class="font-weight-medium">{{
                    formatMoney(item.line_total)
                  }}</span>
                </template>
                <template #[`item.match_method`]="{ item }">
                  <span class="text-caption">{{ item.match_method }}</span>
                </template>
              </AppDataTable>
            </v-window-item>

            <v-window-item :value="2">
              <div class="d-flex flex-wrap align-center ga-2 mb-3">
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-cloud-download-outline"
                  class="text-caption"
                  :loading="componentFetching"
                  :disabled="componentImport?.status === 'running'"
                  @click="fetchDigikeyPrices(true)"
                >
                  Lấy giá DigiKey tự động
                </v-btn>
                <v-file-input
                  v-model="componentFile"
                  label="File myLists.xlsx"
                  accept=".xlsx,.xls"
                  density="compact"
                  variant="outlined"
                  hide-details
                  prepend-icon=""
                  prepend-inner-icon="mdi-microsoft-excel"
                  style="max-width: 280px"
                />
                <v-btn
                  variant="tonal"
                  color="success"
                  prepend-icon="mdi-upload"
                  class="text-caption"
                  :loading="componentUploading"
                  :disabled="!hasComponentFile"
                  @click="importComponentFile"
                >
                  Nhập file
                </v-btn>
                <v-btn
                  variant="tonal"
                  color="secondary"
                  prepend-icon="mdi-download"
                  class="text-caption"
                  :disabled="!componentPrices.length"
                  @click="exportComponentPrices"
                >
                  Xuất Excel
                </v-btn>
                <v-btn
                  variant="text"
                  color="error"
                  prepend-icon="mdi-delete-outline"
                  class="text-caption"
                  :disabled="!componentPrices.length"
                  @click="deleteComponentPrices"
                >
                  Xoá dữ liệu
                </v-btn>
                <v-spacer />
                <v-text-field
                  v-model.number="exchangeRate"
                  label="Tỷ giá VND/USD"
                  type="number"
                  min="0"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 190px"
                  @blur="saveExchangeRate"
                />
              </div>

              <v-alert
                v-if="componentError"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-3"
                closable
                @click:close="componentError = ''"
              >
                {{ componentError }}
              </v-alert>
              <v-alert
                v-if="componentMessage"
                type="success"
                variant="tonal"
                density="compact"
                class="mb-3"
                closable
                @click:close="componentMessage = ''"
              >
                {{ componentMessage }}
              </v-alert>
              <v-alert
                v-if="componentImport?.status === 'running'"
                type="info"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                <div class="d-flex align-center ga-2">
                  <v-progress-circular indeterminate size="18" width="2" />
                  Đang lấy giá DigiKey... Bạn có thể chuyển tab khác.
                </div>
              </v-alert>
              <v-alert
                v-if="componentImport?.status === 'error'"
                type="warning"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                Lần lấy giá gần nhất lỗi: {{ componentImport.error_message }}
              </v-alert>
              <v-alert
                v-if="digikeyStatus && !digikeyStatus.connected"
                type="info"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                Chưa kết nối DigiKey.
                <router-link to="/Cai-dat" class="text-primary font-weight-medium">
                  Vào Cài đặt để kết nối
                </router-link>
                hoặc dùng file myLists.xlsx.
              </v-alert>

              <v-row class="mb-2">
                <v-col cols="6" md="3">
                  <CardStatistic
                    title="Tổng MyLists USD"
                    :value="formatUsd(componentImport?.total_usd)"
                    icon="mdi-currency-usd"
                    color="success"
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <CardStatistic
                    title="Tổng VND"
                    :value="formatMoney(componentTotalVnd)"
                    icon="mdi-cash-multiple"
                    color="primary"
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <CardStatistic
                    title="Giá / board"
                    :value="formatMoney(componentPerBoardVnd)"
                    icon="mdi-layers-outline"
                    color="info"
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <CardStatistic
                    title="Dòng chưa có giá"
                    :value="componentMissingPriceCount"
                    icon="mdi-alert-outline"
                    color="warning"
                  />
                </v-col>
                <v-col v-if="componentNonStockTotal > 0" cols="6" md="3">
                  <CardStatistic
                    title="Non-Stock (không tính)"
                    :value="formatUsd(componentNonStockTotal)"
                    icon="mdi-package-variant-closed"
                    color="grey"
                  />
                </v-col>
              </v-row>

              <div class="d-flex flex-wrap align-center ga-2 mb-2">
                <v-select
                  v-model="componentFilter"
                  :items="componentFilterOptions"
                  item-title="title"
                  item-value="value"
                  label="Lọc trạng thái"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 220px"
                />
                <span class="text-caption text-medium-emphasis">
                  Nguồn:
                  {{
                    componentImport?.source === 'auto'
                      ? 'MyLists API'
                      : componentImport?.source === 'manual'
                        ? 'File myLists.xlsx'
                        : '—'
                  }}
                  <span v-if="componentImport?.digikey_list_name">
                    · {{ componentImport.digikey_list_name }}
                  </span>
                </span>
              </div>

              <AppDataTable
                :headers="componentHeaders"
                :items="filteredComponentPrices"
                :items-per-page="25"
              >
                <template #[`item.mpn`]="{ item }">
                  <span class="text-caption">{{ item.mpn || '—' }}</span>
                </template>
                <template #[`item.image_url`]="{ item }">
                  <v-img
                    v-if="item.image_url || item.thumbnail_url"
                    :src="componentImageUrl(item)"
                    width="44"
                    height="44"
                    cover
                    class="rounded border cursor-pointer mx-auto"
                    @click="openComponentImage(item)"
                  />
                  <span v-else class="text-caption text-medium-emphasis">—</span>
                </template>
                <template #[`item.digikey_pn`]="{ item }">
                  <span class="text-caption">{{ item.digikey_pn || '—' }}</span>
                </template>
                <template #[`item.unit_price_usd`]="{ item }">
                  {{ formatUsd(item.unit_price_usd) }}
                  <div
                    v-if="Number(item.reference_unit_price_usd) > 0"
                    class="text-caption text-medium-emphasis"
                  >
                    Tham khảo {{ formatUsd(item.reference_unit_price_usd) }}
                  </div>
                </template>
                <template #[`item.extended_price_usd`]="{ item }">
                  <span class="font-weight-medium">{{
                    formatUsd(item.extended_price_usd)
                  }}</span>
                </template>
                <template #[`item.match_status`]="{ item }">
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="componentStatusColor(item.match_status)"
                  >
                    {{ componentStatusLabel(item.match_status) }}
                  </v-chip>
                </template>
                <template #[`item.warnings`]="{ item }">
                  <span class="text-caption text-medium-emphasis">
                    {{ (item.warnings || []).join(', ') || '—' }}
                  </span>
                </template>
              </AppDataTable>

              <div
                v-if="!componentPrices.length && componentImport?.status !== 'running'"
                class="text-caption text-medium-emphasis mt-3"
              >
                Chưa có dữ liệu giá linh kiện. Bấm “Lấy giá DigiKey tự động”
                hoặc nhập file myLists.xlsx.
              </div>
            </v-window-item>

            <v-window-item :value="3">
              <v-timeline v-if="audit.length" density="compact" side="end">
                <v-timeline-item
                  v-for="log in audit"
                  :key="log.id"
                  dot-color="primary"
                  size="small"
                >
                  <div class="text-body-2">
                    <strong>{{ actionLabel(log.action) }}</strong>
                    <span class="text-medium-emphasis ms-2">{{
                      log.username
                    }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatDateTime(log.created_at) }}
                  </div>
                  <div v-if="auditDetail(log)" class="text-caption mt-1">
                    {{ auditDetail(log) }}
                  </div>
                </v-timeline-item>
              </v-timeline>
              <div v-else class="text-center text-medium-emphasis py-10">
                Chưa có lịch sử thao tác.
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <BaseDialog
    v-model="dialogDelete"
    width="420"
    title="Xoá báo giá"
    icon="mdi-delete"
  >
    Bạn có chắc chắn muốn xoá báo giá <strong>{{ quote?.quote_no }}</strong
    >?
    <template #actions>
      <ButtonCancel @cancel="dialogDelete = false" />
      <ButtonDelete @delete="removeQuote" />
    </template>
  </BaseDialog>

  <DigiKeyInfoDialog v-model="dialogDetail" :mpn="detailMpn" />

  <BaseDialog
    v-model="dialogComponentImage"
    width="520"
    title="Ảnh linh kiện"
    icon="mdi-image-outline"
  >
    <div class="text-center">
      <div class="text-subtitle-2 font-weight-medium mb-2">
        {{ componentImageMpn }}
      </div>
      <v-img
        v-if="componentImageSrc"
        :src="componentImageSrc"
        max-height="360"
        contain
      />
    </div>
  </BaseDialog>

  <SnackbarSuccess v-model="snackbarSuccess" :message="message" />
  <SnackbarFailed v-model="snackbarFailed" :message="errorMessage" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/Page-Header.vue';
import CardStatistic from '@/components/Card-Statistic.vue';
import AppDataTable from '@/components/App-DataTable.vue';
import BaseDialog from '@/components/BaseDialog.vue';
import DigiKeyInfoDialog from '@/components/DigiKey-InfoDialog.vue';
import ButtonCancel from '@/components/Button-Cancel.vue';
import ButtonDelete from '@/components/Button-Delete.vue';
import SnackbarSuccess from '@/components/Snackbar-Success.vue';
import SnackbarFailed from '@/components/Snackbar-Failed.vue';

const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const router = useRouter();
const id = route.params.id;

const quote = ref(null);
const items = ref([]);
const costLines = ref([]);
const audit = ref([]);
const tab = ref(0);
const newStatus = ref('Nháp');
const updatingStatus = ref(false);
const dialogDelete = ref(false);
const dialogDetail = ref(false);
const detailMpn = ref('');
const snackbarSuccess = ref(false);
const snackbarFailed = ref(false);
const message = ref('');
const errorMessage = ref('');

const componentImport = ref(null);
const componentPrices = ref([]);
const componentLoading = ref(false);
const componentFetching = ref(false);
const componentUploading = ref(false);
const componentFile = ref(null);
const componentError = ref('');
const componentMessage = ref('');
const exchangeRate = ref(0);
const componentFilter = ref('all');
const dialogComponentImage = ref(false);
const componentImageSrc = ref('');
const componentImageMpn = ref('');
const digikeyStatus = ref(null);
let componentPollTimer = null;

const statuses = ['Nháp', 'Đã gửi', 'Chấp nhận', 'Từ chối', 'Hết hạn'];

const componentHeaders = [
  { title: 'STT', key: 'line_no', width: '60px' },
  { title: 'Designator', key: 'reference_designator', width: '130px' },
  { title: 'MPN', key: 'mpn', width: '170px' },
  { title: 'Ảnh', key: 'image_url', width: '70px', sortable: false },
  { title: 'DigiKey PN', key: 'digikey_pn', width: '150px' },
  { title: 'NSX', key: 'manufacturer', width: '120px' },
  { title: 'SL yêu cầu', key: 'quantity_requested', width: '100px' },
  { title: 'SL mua', key: 'quantity_purchased', width: '90px' },
  { title: 'MOQ', key: 'moq', width: '80px' },
  { title: 'Đơn giá', key: 'unit_price_usd', width: '110px' },
  { title: 'Thành tiền', key: 'extended_price_usd', width: '120px' },
  { title: 'Tồn kho', key: 'quantity_available', width: '100px' },
  { title: 'Lead time', key: 'lead_time', width: '110px' },
  { title: 'Trạng thái', key: 'match_status', width: '120px' },
  { title: 'Cảnh báo', key: 'warnings', width: '220px' },
];

const componentFilterOptions = [
  { title: 'Tất cả', value: 'all' },
  { title: 'Đã khớp', value: 'MATCHED' },
  { title: 'Không có giá', value: 'NO_PRICE' },
  { title: 'Không khớp BOM', value: 'UNMATCHED' },
  { title: 'BOM thiếu trong file', value: 'MISSING_IN_LIST' },
  { title: 'Thiếu MPN', value: 'NO_MPN' },
];

const itemHeaders = [
  { title: 'STT', key: 'line_no', width: '60px' },
  { title: 'Designator', key: 'designator', width: '160px' },
  { title: 'MPN', key: 'mpn', width: '180px' },
  { title: 'Description', key: 'description', width: '240px' },
  { title: 'Package', key: 'package', width: '100px' },
  { title: 'Mount', key: 'mount_type', width: '100px' },
  { title: 'SL/board', key: 'quantity_per_board', width: '90px' },
  { title: 'Số pad', key: 'pad_count', width: '80px' },
  { title: 'Quy trình', key: 'process_code', width: '100px' },
  { title: 'Nhóm giá', key: 'group_code', width: '130px' },
  { title: 'ĐVT', key: 'unit', width: '70px' },
  { title: 'Đơn giá', key: 'unit_price', width: '110px' },
  { title: 'Thành tiền', key: 'line_total', width: '130px' },
  { title: 'Nguồn', key: 'match_method', width: '120px' },
  { title: 'DNP', key: 'dnp', width: '70px' },
  { title: 'Trạng thái', key: 'needs_review', width: '120px' },
];

const reviewItems = computed(() =>
  items.value.filter((item) => item.needs_review)
);

const vatAmount = computed(() => {
  const subtotal = Number(quote.value?.subtotal) || 0;
  const discount = Number(quote.value?.discount_value) || 0;
  const vat = Number(quote.value?.vat_percent) || 0;
  return Math.max(0, subtotal - discount) * (vat / 100);
});

const pricePerBoard = computed(() =>
  Math.round(
    (Number(quote.value?.total) || 0) /
      Math.max(1, Number(quote.value?.board_qty) || 1)
  )
);

const componentTotalVnd = computed(
  () =>
    (Number(componentImport.value?.total_usd) || 0) *
    (Number(exchangeRate.value) || 0)
);

const componentPerBoardVnd = computed(
  () =>
    componentTotalVnd.value /
    Math.max(1, Number(quote.value?.board_qty) || 1)
);

const filteredComponentPrices = computed(() => {
  if (componentFilter.value === 'all') return componentPrices.value;
  return componentPrices.value.filter(
    (row) => row.match_status === componentFilter.value
  );
});

const componentMissingPriceCount = computed(
  () =>
    componentPrices.value.filter(
      (row) => !(Number(row.extended_price_usd) > 0)
    ).length
);

const componentNonStockTotal = computed(() =>
  componentPrices.value
    .filter(
      (row) =>
        /non[- ]?stock/i.test(String(row.stock_status || "")) &&
        Number(row.extended_price_usd) > 0,
    )
    .reduce((sum, row) => sum + Number(row.extended_price_usd), 0),
);

const hasComponentFile = computed(() =>
  Array.isArray(componentFile.value)
    ? componentFile.value.length > 0
    : !!componentFile.value
);

function formatMoney(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(Number(value) || 0))} đ`;
}

function formatDate(value) {
  if (!value) return '';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(value);
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN');
}

function formatUsd(value, digits = 4) {
  return `$${(Number(value) || 0).toFixed(digits)}`;
}

function componentImageUrl(row) {
  const raw = row?.image_url || row?.thumbnail_url || '';
  if (!raw) return '';
  return `${Url}/DigiKey/image?inline=1&url=${encodeURIComponent(raw)}`;
}

function openComponentImage(row) {
  const src = componentImageUrl(row);
  if (!src) return;
  componentImageSrc.value = src;
  componentImageMpn.value = row?.mpn || row?.requested_mpn || '';
  dialogComponentImage.value = true;
}

function componentStatusLabel(status) {
  return (
    {
      MATCHED: 'Đã khớp',
      MOQ_APPLIED: 'Đã áp MOQ',
      NO_PRICE: 'Không có giá',
      NO_MATCH: 'Chưa có trong MyList',
      UNMATCHED: 'Không khớp BOM',
      MISSING_IN_LIST: 'BOM thiếu trong file',
      DUPLICATE: 'Trùng MPN',
      NO_MPN: 'Thiếu MPN',
    }[status] || status || '—'
  );
}

function componentStatusColor(status) {
  return (
    {
      MATCHED: 'success',
      MOQ_APPLIED: 'success',
      NO_PRICE: 'warning',
      NO_MATCH: 'warning',
      UNMATCHED: 'info',
      MISSING_IN_LIST: 'error',
      DUPLICATE: 'warning',
      NO_MPN: 'grey',
    }[status] || 'grey'
  );
}

function statusColor(status) {
  return (
    {
      Nháp: 'grey',
      'Đã gửi': 'info',
      'Chấp nhận': 'success',
      'Từ chối': 'error',
      'Hết hạn': 'warning',
    }[status] || 'grey'
  );
}

function actionLabel(action) {
  return (
    {
      create: 'Tạo báo giá',
      update: 'Cập nhật báo giá',
      status: 'Đổi trạng thái',
      clone: 'Nhân bản',
      delete: 'Xoá',
    }[action] || action
  );
}

function auditDetail(log) {
  if (log.action === 'status') {
    try {
      const before = JSON.parse(log.before_json || '{}');
      const after = JSON.parse(log.after_json || '{}');
      return `${before.status || '?'} → ${after.status || '?'}`;
    } catch {
      return '';
    }
  }
  return '';
}

async function loadQuote() {
  try {
    const { data } = await axios.get(`${Url}/Quotation/Quotes/${id}`);
    quote.value = data.quote;
    items.value = data.items || [];
    costLines.value = data.cost_lines || [];
    audit.value = data.audit || [];
    newStatus.value = data.quote?.status || 'Nháp';
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Không tải được báo giá';
    snackbarFailed.value = true;
  }
}

async function loadComponentPrices() {
  componentLoading.value = true;
  try {
    const { data } = await axios.get(
      `${Url}/Quotation/Quotes/${id}/ComponentPrices`
    );
    componentImport.value = data.import || null;
    componentPrices.value = data.prices || [];
    digikeyStatus.value = data.digikey_status || null;
    exchangeRate.value =
      Number(data.import?.exchange_rate) || Number(exchangeRate.value) || 0;
    if (data.import?.status === 'running') {
      startComponentPolling();
    } else {
      stopComponentPolling();
    }
    return data;
  } catch (error) {
    componentError.value =
      error.response?.data?.error || 'Không tải được giá linh kiện';
    return null;
  } finally {
    componentLoading.value = false;
  }
}

function startComponentPolling() {
  if (componentPollTimer) return;
  componentPollTimer = window.setInterval(async () => {
    const data = await loadComponentPrices();
    if (data?.import?.status !== 'running') {
      stopComponentPolling();
    }
  }, 2500);
}

function stopComponentPolling() {
  if (!componentPollTimer) return;
  window.clearInterval(componentPollTimer);
  componentPollTimer = null;
}

async function fetchDigikeyPrices(force = true) {
  componentFetching.value = true;
  componentError.value = '';
  componentMessage.value = '';
  try {
    const { data } = await axios.post(
      `${Url}/Quotation/Quotes/${id}/ComponentPrices/FetchDigiKey`,
      { force }
    );
    componentMessage.value =
      data.message ||
      (data.skipped
        ? 'BOM không đổi, dùng lại giá đã lưu.'
        : 'Đang lấy giá DigiKey...');
    await loadComponentPrices();
  } catch (error) {
    componentError.value =
      error.response?.data?.error || 'Không lấy được giá DigiKey';
  } finally {
    componentFetching.value = false;
  }
}

async function importComponentFile() {
  const file = Array.isArray(componentFile.value)
    ? componentFile.value[0]
    : componentFile.value;
  if (!file) {
    componentError.value = 'Vui lòng chọn file myLists.xlsx';
    return;
  }
  componentUploading.value = true;
  componentError.value = '';
  componentMessage.value = '';
  try {
    const form = new FormData();
    form.append('file', file);
    if (exchangeRate.value) {
      form.append('exchange_rate', String(exchangeRate.value));
    }
    const { data } = await axios.post(
      `${Url}/Quotation/Quotes/${id}/ComponentPrices/Import`,
      form
    );
    componentMessage.value = `Đã nhập ${
      data.import?.line_count || data.prices?.length || 0
    } dòng giá linh kiện.`;
    componentFile.value = Array.isArray(componentFile.value)
      ? []
      : null;
    await loadComponentPrices();
  } catch (error) {
    componentError.value =
      error.response?.data?.error || 'Nhập file myLists.xlsx thất bại';
  } finally {
    componentUploading.value = false;
  }
}

async function saveExchangeRate() {
  if (exchangeRate.value == null || exchangeRate.value === '') return;
  componentError.value = '';
  try {
    await axios.put(
      `${Url}/Quotation/Quotes/${id}/ComponentPrices/ExchangeRate`,
      { exchange_rate: Number(exchangeRate.value) || 0 }
    );
  } catch (error) {
    componentError.value =
      error.response?.data?.error || 'Cập nhật tỷ giá thất bại';
  }
}

async function exportComponentPrices() {
  try {
    const response = await axios.get(
      `${Url}/Quotation/Quotes/${id}/ComponentPrices/Export`,
      { responseType: 'blob' }
    );
    const filename = `GiaLinhKien_${quote.value?.quote_no || id}.xlsx`;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch {
    componentError.value = 'Xuất Excel giá linh kiện thất bại';
  }
}

async function deleteComponentPrices() {
  if (!window.confirm('Xoá toàn bộ dữ liệu giá linh kiện của báo giá này?')) {
    return;
  }
  try {
    await axios.delete(`${Url}/Quotation/Quotes/${id}/ComponentPrices`);
    componentMessage.value = 'Đã xoá dữ liệu giá linh kiện.';
    await loadComponentPrices();
  } catch (error) {
    componentError.value =
      error.response?.data?.error || 'Xoá dữ liệu giá linh kiện thất bại';
  }
}

async function updateStatus() {
  updatingStatus.value = true;
  try {
    await axios.put(`${Url}/Quotation/Quotes/${id}/Status`, {
      status: newStatus.value,
      username: localStorage.getItem('Username') || '',
    });
    quote.value.status = newStatus.value;
    message.value = 'Đã cập nhật trạng thái';
    snackbarSuccess.value = true;
    await loadQuote();
    if (newStatus.value === 'Đã gửi') {
      const data = await loadComponentPrices();
      if (
        data?.digikey_status?.connected &&
        data?.import?.status !== 'running'
      ) {
        await fetchDigikeyPrices(false);
      }
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Cập nhật thất bại';
    snackbarFailed.value = true;
  } finally {
    updatingStatus.value = false;
  }
}

async function cloneQuote() {
  try {
    const { data } = await axios.post(`${Url}/Quotation/Quotes/${id}/Clone`);
    message.value = `Đã nhân bản: ${data.quote_no}`;
    snackbarSuccess.value = true;
    router.push(`/Bao-gia/${data.id}`);
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Nhân bản thất bại';
    snackbarFailed.value = true;
  }
}

async function removeQuote() {
  try {
    await axios.delete(`${Url}/Quotation/Quotes/${id}`);
    dialogDelete.value = false;
    router.push('/Bao-gia');
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Xoá thất bại';
    snackbarFailed.value = true;
  }
}

async function downloadFile(kind) {
  try {
    const response = await axios.get(`${Url}/Quotation/Quotes/${id}/${kind}`, {
      responseType: 'blob',
    });
    const suffix = kind === 'Export' ? 'BaoGia' : 'LinhKienChuaMapping';
    const filename = `${suffix}_${quote.value?.quote_no || id}.xlsx`;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch {
    errorMessage.value = 'Xuất file thất bại';
    snackbarFailed.value = true;
  }
}

function openDetail(mpn) {
  const value = String(mpn || '').trim();
  if (!value) return;
  detailMpn.value = value;
  dialogDetail.value = true;
}

onMounted(() => {
  loadQuote();
  loadComponentPrices();
});

onBeforeUnmount(stopComponentPolling);
</script>
