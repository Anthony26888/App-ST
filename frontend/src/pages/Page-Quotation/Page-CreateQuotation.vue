<template>
  <v-card variant="text" class="app-page">
    <PageHeader
      back-to="/Bao-gia"
      :crumbs="[
        { title: 'Kinh doanh', to: '/Bao-gia' },
        { title: 'Tạo báo giá' },
      ]"
    />

    <v-card-text class="d-flex flex-column flex-grow-1" style="min-height: 0">
      <v-card variant="elevated" elevation="0" class="rounded-xl border">
        <v-tabs v-model="step" color="primary" show-arrows>
          <v-tab :value="1" class="text-caption">1. Thông tin</v-tab>
          <v-tab :value="2" class="text-caption">2. Nhập BOM</v-tab>
          <v-tab :value="3" class="text-caption">3. Bảng giá</v-tab>
          <v-tab :value="4" class="text-caption">4. Xem trước</v-tab>
        </v-tabs>
        <v-divider />

        <v-card-text class="pt-4">
          <v-window v-model="step">
            <!-- ================= STEP 1 ================= -->
            <v-window-item :value="1">
              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-combobox
                    v-model="form.customer_name"
                    :items="customerNames"
                    label="Khách hàng *"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    clearable
                    @update:modelValue="onCustomerChange"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.project_name"
                    label="Tên dự án *"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="form.board_qty"
                    label="Số lượng board *"
                    type="number"
                    min="1"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="form.price_book_id"
                    :items="priceBooks"
                    item-title="name"
                    item-value="id"
                    label="Bảng giá áp dụng *"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    @update:modelValue="loadPriceBook"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="form.currency"
                    :items="['VND', 'USD']"
                    label="Tiền tệ"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <InputDate
                    v-model="form.valid_until"
                    label="Ngày hiệu lực"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.payment_terms"
                    label="Điều khoản thanh toán"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    placeholder="VD: 50% tạm ứng, 50% sau khi giao"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.lead_time"
                    label="Thời gian giao hàng"
                    variant="outlined"
                    density="compact"
                    hide-details="auto"
                    placeholder="VD: 7-10 ngày"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="form.note"
                    label="Ghi chú"
                    variant="outlined"
                    density="compact"
                    rows="2"
                    auto-grow
                    hide-details="auto"
                  />
                </v-col>
              </v-row>
            </v-window-item>

            <!-- ================= STEP 2 ================= -->
            <v-window-item :value="2">
              <v-row dense>
                <v-col cols="12" md="6">
                  <v-file-input
                    label="File BOM khách hàng (.xlsx, .xls, .csv)"
                    accept=".xlsx,.xls,.csv"
                    variant="outlined"
                    density="compact"
                    prepend-icon="mdi-file-excel"
                    show-size
                    :loading="loadingFile"
                    @update:modelValue="onFileChange"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="headerRow"
                    :items="rowOptions"
                    item-title="title"
                    item-value="value"
                    label="Dòng tiêu đề"
                    variant="outlined"
                    density="compact"
                    hide-details
                    @update:modelValue="changeHeaderRow"
                  />
                </v-col>
                <v-col cols="12" md="3" class="d-flex align-center">
                  <v-chip
                    v-if="fileName"
                    color="success"
                    variant="tonal"
                    size="small"
                  >
                    {{ fileName }}
                  </v-chip>
                </v-col>
              </v-row>

              <v-alert
                v-if="bomError"
                type="error"
                variant="tonal"
                density="compact"
                class="mt-2"
              >
                {{ bomError }}
              </v-alert>

              <template v-if="columnOptions.length">
                <div class="text-subtitle-2 mt-4 mb-2">Ánh xạ cột</div>
                <v-row dense>
                  <v-col
                    v-for="field in mappingFields"
                    :key="field.key"
                    cols="6"
                    md="3"
                  >
                    <v-select
                      v-model="mapping[field.key]"
                      :items="columnOptions"
                      item-title="title"
                      item-value="value"
                      :label="field.label"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    />
                  </v-col>
                </v-row>

                <div class="d-flex align-center mt-4 mb-2">
                  <span class="text-subtitle-2">Xem trước dữ liệu</span>
                  <v-spacer />
                  <v-chip size="small" variant="tonal" color="primary">
                    {{ buildLines().length }} dòng
                  </v-chip>
                </div>

                <v-table density="compact" class="border rounded">
                  <thead>
                    <tr class="bg-grey-lighten-4">
                      <th class="text-caption">Designator</th>
                      <th class="text-caption">MPN</th>
                      <th class="text-caption">Description</th>
                      <th class="text-caption">SL/board</th>
                      <th class="text-caption">Package</th>
                      <th class="text-caption">Pad</th>
                      <th class="text-caption">Quy trình</th>
                      <th class="text-caption">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, index) in mappedPreview" :key="index">
                      <td class="text-caption">{{ line.designator || '—' }}</td>
                      <td class="text-caption">{{ line.mpn || '—' }}</td>
                      <td class="text-caption">
                        {{ line.description || '—' }}
                      </td>
                      <td class="text-caption">{{ line.quantity || '—' }}</td>
                      <td class="text-caption">{{ line.package || '—' }}</td>
                      <td class="text-caption">{{ line.pad_count || '—' }}</td>
                      <td class="text-caption">
                        {{ line.process_code || '—' }}
                      </td>
                      <td class="text-caption">{{ line.note || '—' }}</td>
                    </tr>
                    <tr v-if="mappedPreview.length === 0">
                      <td
                        colspan="8"
                        class="text-center text-grey py-4 text-caption"
                      >
                        Không có dữ liệu. Kiểm tra lại dòng tiêu đề và ánh xạ
                        cột.
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </template>

              <div v-else class="text-center text-medium-emphasis py-10">
                <v-icon size="48">mdi-microsoft-excel</v-icon>
                <p class="text-body-2 mt-2">Chọn file BOM để bắt đầu.</p>
              </div>
            </v-window-item>

            <!-- ================= STEP 3 ================= -->
            <v-window-item :value="3">
              <v-row dense>
                <v-col cols="12" lg="8">
                  <div class="d-flex align-center flex-wrap ga-2 mb-2">
                    <v-text-field
                      v-model="itemSearch"
                      label="Tìm designator / MPN / mô tả"
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      hide-details
                      style="max-width: 320px"
                    />
                    <v-checkbox
                      v-model="onlyReview"
                      density="compact"
                      hide-details
                      color="warning"
                      label="Chỉ dòng cần kiểm tra"
                    />
                    <v-spacer />
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="primary"
                      class="text-caption"
                      prepend-icon="mdi-tag-plus-outline"
                      :disabled="!form.price_book_id"
                      @click="openGroupDialog()"
                    >
                      Thêm nhóm giá
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="primary"
                      class="text-caption"
                      prepend-icon="mdi-cash-plus"
                      :disabled="!form.price_book_id"
                      @click="openOverrideDialog()"
                    >
                      Thêm giá MPN
                    </v-btn>
                    <v-chip color="primary" variant="tonal" size="small">
                      {{ items.length }} dòng
                    </v-chip>
                    <v-chip color="warning" variant="tonal" size="small">
                      {{ reviewCount }} cần kiểm tra
                    </v-chip>
                    <v-chip color="error" variant="tonal" size="small">
                      {{ noPriceCount }} chưa có giá
                    </v-chip>
                    <v-chip
                      v-if="dnpCount"
                      color="grey"
                      variant="tonal"
                      size="small"
                    >
                      {{ dnpCount }} DNP
                    </v-chip>
                  </div>

                  <div class="quotation-table-wrap border rounded">
                    <v-table density="compact" fixed-header height="58vh">
                      <thead>
                        <tr class="bg-grey-lighten-4">
                          <th class="text-caption">Designator</th>
                          <th class="text-caption">MPN</th>
                          <th class="text-caption">Description</th>
                          <th class="text-caption">Package</th>
                          <th class="text-caption">Mount</th>
                          <th class="text-caption text-center">SL/board</th>
                          <th
                            v-if="isPadMode"
                            class="text-caption text-center"
                            style="min-width: 110px"
                          >
                            Số pad
                          </th>
                          <th
                            v-if="isPadMode"
                            class="text-caption"
                            style="min-width: 150px"
                          >
                            Quy trình
                          </th>
                          <th
                            class="text-caption text-right"
                            style="min-width: 110px"
                          >
                            Đơn giá
                          </th>
                          <th
                            class="text-caption text-right"
                            style="min-width: 120px"
                          >
                            Thành tiền
                          </th>
                          <th v-if="!isPadMode" class="text-caption">Nguồn</th>
                          <th class="text-caption">Trạng thái</th>
                          <th
                            class="text-caption text-center"
                            style="width: 48px"
                          ></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(item, index) in filteredItems"
                          :key="index"
                          @click="selectRow(item)"
                        >
                          <td
                            class="text-caption cell-ellipsis"
                            :title="item.designator"
                          >
                            {{ item.designator || '—' }}
                          </td>
                          <td
                            class="text-caption cell-ellipsis"
                            :title="item.mpn"
                          >
                            {{ item.mpn || '—' }}
                          </td>
                          <td
                            class="text-caption cell-ellipsis"
                            :title="item.description"
                          >
                            {{ item.description || '—' }}
                          </td>
                          <td class="text-caption">
                            <v-chip
                              v-if="item.package"
                              size="x-small"
                              variant="tonal"
                              color="primary"
                            >
                              {{ item.package }}
                            </v-chip>
                            <v-chip
                              v-else
                              size="x-small"
                              variant="tonal"
                              color="warning"
                            >
                              Chưa rõ
                            </v-chip>
                          </td>
                          <td class="text-caption">
                            <v-chip
                              size="x-small"
                              variant="tonal"
                              color="secondary"
                            >
                              {{ item.mount_type || '—' }}
                            </v-chip>
                          </td>
                          <td class="text-caption text-center">
                            <v-text-field
                              v-model.number="item.quantity_per_board"
                              type="number"
                              min="0"
                              density="compact"
                              variant="underlined"
                              hide-details
                              style="max-width: 74px; margin: 0 auto"
                              :disabled="item.dnp === 1"
                              @update:modelValue="touchItem(item)"
                            />
                          </td>
                          <td v-if="isPadMode" class="text-caption">
                            <v-text-field
                              v-model.number="item.pad_count"
                              type="number"
                              min="0"
                              density="compact"
                              variant="underlined"
                              hide-details
                              class="text-center pad-input"
                              :disabled="item.dnp === 1"
                              @update:modelValue="onPadInput(item)"
                              @blur="commitPadCount(item)"
                              @keydown.enter="commitPadCount(item)"
                            />
                          </td>
                          <td v-if="isPadMode">
                            <v-select
                              v-model="item.process_code"
                              :items="['SMT', 'HAND', 'PICK']"
                              density="compact"
                              variant="underlined"
                              hide-details
                              clearable
                              placeholder="Chọn quy trình"
                              style="min-width: 150px"
                              :disabled="item.dnp === 1"
                              @update:modelValue="onProcessChange(item)"
                            />
                          </td>
                          <td
                            v-if="isPadMode"
                            class="text-caption text-right font-weight-medium"
                          >
                            {{ formatMoney(item.unit_price) }}
                            <span class="text-medium-emphasis">
                              /{{ item.unit === 'con' ? 'con' : 'pad' }}
                            </span>
                          </td>
                          <td v-else>
                            <v-text-field
                              v-model.number="item.unit_price"
                              type="number"
                              min="0"
                              density="compact"
                              variant="underlined"
                              hide-details
                              prefix=""
                              class="text-right"
                              :disabled="item.dnp === 1"
                              @update:modelValue="onPriceChange(item)"
                            />
                          </td>
                          <td
                            class="text-caption text-right font-weight-medium"
                          >
                            {{ formatMoney(item.line_total) }}
                          </td>
                          <td v-if="!isPadMode">
                            <v-chip
                              size="x-small"
                              variant="tonal"
                              :color="methodColor(item.match_method)"
                            >
                              {{ methodLabel(item.match_method) }}
                            </v-chip>
                          </td>
                          <td>
                            <div class="d-flex flex-wrap ga-1">
                              <v-chip
                                v-if="item.dnp === 1"
                                size="x-small"
                                variant="tonal"
                                color="grey"
                              >
                                DNP
                              </v-chip>
                              <template v-else>
                                <v-chip
                                  v-if="item.needs_review"
                                  size="x-small"
                                  variant="tonal"
                                  color="warning"
                                >
                                  Cần kiểm tra
                                </v-chip>
                                <v-chip
                                  v-if="hasNoPrice(item)"
                                  size="x-small"
                                  variant="tonal"
                                  color="error"
                                >
                                  Chưa có giá
                                </v-chip>
                                <v-chip
                                  v-if="!item.needs_review && !hasNoPrice(item)"
                                  size="x-small"
                                  variant="tonal"
                                  color="success"
                                >
                                  OK
                                </v-chip>
                              </template>
                            </div>
                          </td>
                          <td class="text-center">
                            <v-menu location="bottom end">
                              <template #activator="{ props: menuProps }">
                                <v-btn
                                  icon="mdi-dots-vertical"
                                  size="x-small"
                                  variant="text"
                                  v-bind="menuProps"
                                />
                              </template>
                              <v-list density="compact">
                                <v-list-item
                                  prepend-icon="mdi-information-variant-circle"
                                  title="Xem chi tiết DigiKey"
                                  :disabled="!item.mpn"
                                  @click="openDetail(item.mpn)"
                                />
                                <v-list-item
                                  prepend-icon="mdi-tag-plus-outline"
                                  title="Tạo nhóm giá từ dòng này"
                                  :disabled="item.dnp === 1"
                                  @click="openGroupDialog(item)"
                                />
                                <v-list-item
                                  prepend-icon="mdi-cash-plus"
                                  title="Tạo giá MPN từ dòng này"
                                  :disabled="!item.mpn || item.dnp === 1"
                                  @click="openOverrideDialog(item)"
                                />
                              </v-list>
                            </v-menu>
                          </td>
                        </tr>
                        <tr v-if="filteredItems.length === 0">
                          <td
                            :colspan="isPadMode ? 12 : 11"
                            class="text-center text-grey py-6 text-caption"
                          >
                            Không có dòng phù hợp.
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>
                </v-col>

                <v-col cols="12" lg="4">
                  <div class="quotation-summary">
                    <v-card variant="outlined" class="rounded-xl mb-3">
                      <v-card-title class="text-subtitle-1 py-3">
                        <v-icon start size="18" color="primary"
                          >mdi-tag-outline</v-icon
                        >
                        Tổng hợp
                      </v-card-title>
                      <v-card-text class="text-body-2">
                        <div class="d-flex align-center mb-2">
                          <span class="text-medium-emphasis">Bảng giá</span>
                          <v-spacer />
                          <span class="font-weight-medium">{{
                            priceBookName
                          }}</span>
                        </div>
                        <v-text-field
                          v-model.number="form.board_qty"
                          label="Số board"
                          type="number"
                          min="1"
                          density="compact"
                          variant="outlined"
                          hide-details
                          class="mb-3"
                        />
                        <v-divider class="mb-3" />
                        <div class="d-flex mb-1">
                          <span>Tạm tính gia công</span>
                          <v-spacer />
                          <span class="font-weight-medium">{{
                            formatMoney(itemsSubtotal)
                          }}</span>
                        </div>
                        <div class="d-flex mb-1">
                          <span>Phí khác</span>
                          <v-spacer />
                          <span class="font-weight-medium">{{
                            formatMoney(feesTotal)
                          }}</span>
                        </div>
                        <div class="d-flex align-center mb-1">
                          <span>Chiết khấu</span>
                          <v-spacer />
                          <v-text-field
                            v-model.number="form.discount_value"
                            type="number"
                            min="0"
                            density="compact"
                            variant="outlined"
                            hide-details
                            style="max-width: 130px"
                          />
                        </div>
                        <div class="d-flex align-center mb-2">
                          <span>VAT (%)</span>
                          <v-spacer />
                          <v-text-field
                            v-model.number="form.vat_percent"
                            type="number"
                            min="0"
                            max="100"
                            density="compact"
                            variant="outlined"
                            hide-details
                            style="max-width: 100px"
                          />
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
                            {{ formatMoney(total) }}
                          </span>
                        </div>
                        <div class="d-flex align-center mt-1">
                          <span class="text-caption text-medium-emphasis"
                            >Giá / board</span
                          >
                          <v-spacer />
                          <span class="text-caption font-weight-medium">
                            {{ formatMoney(pricePerBoard) }}
                          </span>
                        </div>

                        <v-alert
                          v-if="unmappedCount"
                          type="warning"
                          variant="tonal"
                          density="compact"
                          class="mt-3 text-caption"
                        >
                          {{ unmappedCount }} dòng chưa gán nhóm giá.
                        </v-alert>
                        <v-alert
                          v-else-if="reviewCount"
                          type="info"
                          variant="tonal"
                          density="compact"
                          class="mt-3 text-caption"
                        >
                          {{ reviewCount }} dòng cần kiểm tra lại.
                        </v-alert>
                      </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="rounded-xl">
                      <v-card-title
                        class="text-subtitle-1 py-3 d-flex align-center"
                      >
                        <v-icon start size="18" color="secondary"
                          >mdi-receipt-text-outline</v-icon
                        >
                        Phí khác
                        <v-spacer />
                        <v-btn
                          size="x-small"
                          variant="tonal"
                          color="primary"
                          prepend-icon="mdi-plus"
                          @click="addCostLine"
                        >
                          Thêm
                        </v-btn>
                      </v-card-title>
                      <v-card-text v-if="costLines.length" class="pt-0">
                        <div
                          v-for="(fee, index) in costLines"
                          :key="index"
                          class="d-flex align-center ga-2 mb-2"
                        >
                          <v-text-field
                            v-model="fee.name"
                            placeholder="Tên phí (setup, stencil...)"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                          <v-text-field
                            v-model.number="fee.amount"
                            type="number"
                            min="0"
                            density="compact"
                            variant="outlined"
                            hide-details
                            style="max-width: 120px"
                          />
                          <v-btn
                            icon="mdi-close"
                            size="x-small"
                            variant="text"
                            color="error"
                            @click="removeCostLine(index)"
                          />
                        </div>
                      </v-card-text>
                      <v-card-text
                        v-else
                        class="text-caption text-medium-emphasis pt-0"
                      >
                        Chưa có phí nào. Có thể bỏ trống nếu giá đã bao gồm tất
                        cả.
                      </v-card-text>
                    </v-card>
                  </div>
                </v-col>
              </v-row>
            </v-window-item>

            <!-- ================= STEP 4 ================= -->
            <v-window-item :value="4">
              <v-row>
                <v-col cols="12" lg="7">
                  <v-card variant="outlined" class="rounded-xl">
                    <v-card-title class="text-subtitle-1"
                      >Thông tin báo giá</v-card-title
                    >
                    <v-card-text class="text-body-2">
                      <v-row dense>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Khách hàng
                          </div>
                          <div class="font-weight-medium">
                            {{ form.customer_name || '—' }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Dự án
                          </div>
                          <div class="font-weight-medium">
                            {{ form.project_name || '—' }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Số board
                          </div>
                          <div class="font-weight-medium">
                            {{ form.board_qty }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Bảng giá
                          </div>
                          <div class="font-weight-medium">
                            {{ priceBookName }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Hiệu lực
                          </div>
                          <div class="font-weight-medium">
                            {{ formatDate(form.valid_until) || '—' }}
                          </div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="text-caption text-medium-emphasis">
                            Thời gian giao
                          </div>
                          <div class="font-weight-medium">
                            {{ form.lead_time || '—' }}
                          </div>
                        </v-col>
                        <v-col cols="12">
                          <div class="text-caption text-medium-emphasis">
                            Điều khoản thanh toán
                          </div>
                          <div class="font-weight-medium">
                            {{ form.payment_terms || '—' }}
                          </div>
                        </v-col>
                        <v-col v-if="form.note" cols="12">
                          <div class="text-caption text-medium-emphasis">
                            Ghi chú
                          </div>
                          <div class="font-weight-medium">{{ form.note }}</div>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <v-alert
                    v-if="reviewCount || unmappedCount"
                    type="warning"
                    variant="tonal"
                    class="mt-3"
                  >
                    Có {{ reviewCount }} dòng cần kiểm tra và
                    {{ unmappedCount }} dòng chưa gán nhóm giá. Bạn vẫn có thể
                    lưu, sau đó xử lý lại trong trang chi tiết.
                  </v-alert>
                </v-col>

                <v-col cols="12" lg="5">
                  <v-card variant="outlined" class="rounded-xl">
                    <v-card-title class="text-subtitle-1"
                      >Tổng tiền</v-card-title
                    >
                    <v-card-text class="text-body-2">
                      <div class="d-flex mb-1">
                        <span>Tạm tính gia công</span>
                        <v-spacer />
                        <span>{{ formatMoney(itemsSubtotal) }}</span>
                      </div>
                      <div class="d-flex mb-1">
                        <span>Phí khác</span>
                        <v-spacer />
                        <span>{{ formatMoney(feesTotal) }}</span>
                      </div>
                      <div class="d-flex mb-1">
                        <span>Chiết khấu</span>
                        <v-spacer />
                        <span>-{{ formatMoney(discount) }}</span>
                      </div>
                      <div class="d-flex mb-2">
                        <span>VAT ({{ form.vat_percent }}%)</span>
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
                          {{ formatMoney(total) }}
                        </span>
                      </div>
                      <div class="d-flex mt-1">
                        <span class="text-caption text-medium-emphasis"
                          >Giá / board</span
                        >
                        <v-spacer />
                        <span class="text-caption font-weight-medium">{{
                          formatMoney(pricePerBoard)
                        }}</span>
                      </div>

                      <v-btn
                        block
                        color="primary"
                        class="mt-4"
                        prepend-icon="mdi-content-save"
                        :loading="saving"
                        @click="save(false)"
                      >
                        Lưu báo giá
                      </v-btn>
                      <v-btn
                        block
                        variant="tonal"
                        color="success"
                        class="mt-2"
                        prepend-icon="mdi-microsoft-excel"
                        :loading="saving"
                        @click="save(true)"
                      >
                        Lưu và xuất Excel
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>
          </v-window>
        </v-card-text>

        <v-divider />
        <v-card-actions class="px-4 py-3">
          <v-btn
            variant="text"
            :disabled="step === 1 || saving"
            @click="prev"
            class="text-caption"
          >
            Quay lại
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="step < 4"
            color="primary"
            :loading="resolving"
            @click="next"
            class="text-caption"
          >
            Tiếp tục
            <v-icon end>mdi-arrow-right</v-icon>
          </v-btn>
          <v-btn
            v-else
            color="primary"
            :loading="saving"
            prepend-icon="mdi-content-save"
            @click="save(false)"
            class="text-caption"
          >
            Lưu báo giá
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-card-text>
  </v-card>

  <DigiKeyInfoDialog v-model="dialogDetail" :mpn="detailMpn" />
  <PriceGroupDialog
    v-model="dialogGroup"
    :initial="groupInitial"
    :saving="savingGroup"
    :price-book-id="form.price_book_id"
    :pricing-mode="priceBookDetail.book?.pricing_mode"
    :existing-codes="existingGroupCodes"
    assign-existing
    @submit="saveGroupFromQuote"
    @use-existing="assignExistingGroup"
  />
  <PriceOverrideDialog
    v-model="dialogOverride"
    :initial="overrideInitial"
    :saving="savingOverride"
    @submit="saveOverrideFromQuote"
  />

  <SnackbarSuccess v-model="snackbarSuccess" :message="message" />
  <SnackbarFailed v-model="snackbarFailed" :message="errorMessage" />
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import PageHeader from '@/components/Page-Header.vue';
import InputDate from '@/components/Input-Date.vue';
import SnackbarSuccess from '@/components/Snackbar-Success.vue';
import SnackbarFailed from '@/components/Snackbar-Failed.vue';
import DigiKeyInfoDialog from '@/components/DigiKey-InfoDialog.vue';
import PriceGroupDialog from '@/components/Quotation/PriceGroup-Dialog.vue';
import PriceOverrideDialog from '@/components/Quotation/PriceOverride-Dialog.vue';
import { useBomImport } from '@/composables/Quotation/useBomImport.js';

const Url = import.meta.env.VITE_API_URL;
const router = useRouter();

const step = ref(1);
const loadingFile = ref(false);
const resolving = ref(false);
const saving = ref(false);

const customers = ref([]);
const priceBooks = ref([]);
const priceBookDetail = ref({
  book: null,
  groups: [],
  overrides: [],
  pad_rates: [],
});
const items = ref([]);
const costLines = ref([]);

const dialogDetail = ref(false);
const detailMpn = ref('');
const dialogGroup = ref(false);
const dialogOverride = ref(false);
const groupInitial = ref({});
const overrideInitial = ref({});
const sourceItem = ref(null);
const savingGroup = ref(false);
const savingOverride = ref(false);

const snackbarSuccess = ref(false);
const snackbarFailed = ref(false);
const message = ref('');
const errorMessage = ref('');

const form = reactive({
  customer_name: '',
  customer_id: null,
  project_name: '',
  price_book_id: null,
  currency: 'VND',
  board_qty: 1000,
  valid_until: '',
  payment_terms: '',
  lead_time: '',
  discount_value: 0,
  vat_percent: 8,
  note: '',
});

const {
  fileName,
  headerRow,
  mapping,
  rowOptions,
  columnOptions,
  mappedPreview,
  error: bomError,
  loadFile,
  changeHeaderRow,
  buildLines,
} = useBomImport();

const mappingFields = [
  { key: 'designator', label: 'Designator / Ref' },
  { key: 'mpn', label: 'MPN / Part Number' },
  { key: 'mpn2', label: 'MPN 2' },
  { key: 'mpn3', label: 'MPN 3' },
  { key: 'description', label: 'Description' },
  { key: 'quantity', label: 'Số lượng' },
  { key: 'package', label: 'Package / Footprint' },
  { key: 'pad_count', label: 'Số pad (nếu có)' },
  { key: 'process', label: 'Quy trình (nếu có)' },
  { key: 'note', label: 'Note' },
];

const customerNames = computed(() =>
  customers.value.map((customer) => customer.name).filter(Boolean)
);

const isPadMode = computed(
  () => priceBookDetail.value.book?.pricing_mode === 'per_pad'
);

const padRateMap = computed(() => {
  const map = new Map();
  (priceBookDetail.value.pad_rates || []).forEach((rate) => {
    map.set(
      String(rate.process_code || '').toUpperCase(),
      Number(rate.rate) || 0
    );
  });
  return map;
});

const priceBookName = computed(() => {
  const book = priceBooks.value.find((item) => item.id === form.price_book_id);
  return book ? book.name : '—';
});

const existingGroupCodes = computed(() =>
  (priceBookDetail.value.groups || []).map((group) => group.group_code)
);

const itemSearch = ref('');
const onlyReview = ref(false);
const pinnedItems = ref([]);

const filteredItems = computed(() => {
  const keyword = itemSearch.value.trim().toLowerCase();
  return items.value.filter((item) => {
    if (
      onlyReview.value &&
      !item.needs_review &&
      !pinnedItems.value.includes(item)
    ) {
      return false;
    }
    if (!keyword) return true;
    return [
      item.designator,
      item.mpn,
      item.description,
      item.package,
      item.group_code,
      item.group_name,
      item.process_code,
      item.pad_count_source,
    ].some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(keyword)
    );
  });
});

const itemsSubtotal = computed(() =>
  items.value.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0)
);
const feesTotal = computed(() =>
  costLines.value.reduce((sum, fee) => sum + (Number(fee.amount) || 0), 0)
);
const subtotal = computed(() => itemsSubtotal.value + feesTotal.value);
const discount = computed(() =>
  Math.min(Math.max(0, Number(form.discount_value) || 0), subtotal.value)
);
const taxable = computed(() => Math.max(0, subtotal.value - discount.value));
const vatAmount = computed(
  () => taxable.value * (Math.max(0, Number(form.vat_percent) || 0) / 100)
);
const total = computed(
  () => Math.round((taxable.value + vatAmount.value) / 100) * 100
);
const pricePerBoard = computed(() =>
  Math.round(total.value / Math.max(1, Number(form.board_qty) || 1))
);
const reviewCount = computed(
  () => items.value.filter((item) => item.needs_review).length
);
const noPriceCount = computed(
  () => items.value.filter((item) => hasNoPrice(item)).length
);
const unmappedCount = computed(() =>
  isPadMode.value
    ? items.value.filter((item) => !item.pad_count && Number(item.dnp) !== 1)
        .length
    : items.value.filter((item) => !item.group_code).length
);
const dnpCount = computed(
  () => items.value.filter((item) => Number(item.dnp) === 1).length
);

function hasNoPrice(item) {
  if (Number(item.dnp) === 1) return false;
  return Number(item.unit_price) <= 0 || Number(item.line_total) <= 0;
}

function formatMoney(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(Number(value) || 0))} đ`;
}

function formatDate(value) {
  if (!value) return '';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(value);
}

function methodLabel(method) {
  return (
    {
      master: 'Part Master',
      alias: 'Alias',
      mpn_override: 'Giá MPN',
      package_exact: 'Package',
      package_wildcard: 'Package',
      package_contains: 'Package',
      package_regex: 'Package',
      keyword: 'Từ khóa',
      manual: 'Thủ công',
      dnp: 'DNP',
      none: 'Chưa có',
    }[method] ||
    method ||
    '—'
  );
}

function methodColor(method) {
  if (method === 'manual') return 'primary';
  if (method === 'dnp') return 'grey';
  if (method === 'none') return 'error';
  if (method === 'keyword') return 'warning';
  return 'success';
}

function onCustomerChange(value) {
  const found = customers.value.find((customer) => customer.name === value);
  form.customer_id = found ? found.id : null;
}

async function loadInitial() {
  try {
    const [customerRes, bookRes] = await Promise.all([
      axios.get(`${Url}/Quotation/Customers`),
      axios.get(`${Url}/Quotation/PriceBook/List`),
    ]);
    customers.value = Array.isArray(customerRes.data) ? customerRes.data : [];
    priceBooks.value = Array.isArray(bookRes.data) ? bookRes.data : [];
    const defaultBook =
      priceBooks.value.find((book) => Number(book.is_default) === 1) ||
      priceBooks.value[0];
    if (defaultBook) {
      form.price_book_id = defaultBook.id;
      await loadPriceBook();
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Không tải được dữ liệu khách hàng / bảng giá';
    snackbarFailed.value = true;
  }
}

async function loadPriceBook() {
  if (!form.price_book_id) return;
  try {
    const { data } = await axios.get(
      `${Url}/Quotation/PriceBook/${form.price_book_id}`
    );
    priceBookDetail.value = {
      book: data.book,
      groups: Array.isArray(data.groups) ? data.groups : [],
      overrides: Array.isArray(data.overrides) ? data.overrides : [],
      pad_rates: Array.isArray(data.pad_rates) ? data.pad_rates : [],
    };
  } catch (error) {
    console.error(error);
  }
}

async function onFileChange(file) {
  loadingFile.value = true;
  try {
    await loadFile(file);
  } finally {
    loadingFile.value = false;
  }
}

function validateInfo() {
  if (!form.customer_name?.trim()) {
    errorMessage.value = 'Vui lòng nhập hoặc chọn khách hàng';
    snackbarFailed.value = true;
    return false;
  }
  if (!form.project_name?.trim()) {
    errorMessage.value = 'Vui lòng nhập tên dự án';
    snackbarFailed.value = true;
    return false;
  }
  if (!Number(form.board_qty) || Number(form.board_qty) <= 0) {
    errorMessage.value = 'Số lượng board phải lớn hơn 0';
    snackbarFailed.value = true;
    return false;
  }
  if (!form.price_book_id) {
    errorMessage.value = 'Vui lòng chọn bảng giá mẫu';
    snackbarFailed.value = true;
    return false;
  }
  return true;
}

function padRateFor(processCode) {
  return (
    Number(padRateMap.value.get(String(processCode || '').toUpperCase())) || 0
  );
}

function applyPadRate(item) {
  if (!isPadMode.value || item.unit === 'con') return;
  item.unit = 'pad';
  item.unit_price = padRateFor(item.process_code);
}

function recomputeLine(item) {
  applyPadRate(item);
  item.line_total = computeLineTotal(item);
}

function computeLineTotal(item) {
  if (Number(item.dnp) === 1) return 0;
  const qty = Number(item.quantity_per_board) || 0;
  const price = Number(item.unit_price) || 0;
  const pin = Number(item.pin_count) || 0;
  const pad = Number(item.pad_count) || 0;
  const board = Math.max(1, Number(form.board_qty) || 1);
  switch (item.unit) {
    case 'pad':
      return Math.round(qty * pad * board * price);
    case 'chan':
    case 'moi':
      return Math.round(qty * pin * board * price);
    case 'board':
      return Math.round(board * price);
    case 'fixed':
      return Math.round(price);
    default:
      return Math.round(qty * board * price);
  }
}

function recomputeAll() {
  items.value.forEach((item) => {
    recomputeLine(item);
  });
}

watch(
  () => form.board_qty,
  () => recomputeAll()
);

function touchItem(item) {
  item.is_manual = 1;
  item.match_method = 'manual';
  item.confidence = 1;
  item.needs_review = isPadMode.value
    ? !item.process_code ||
      item.process_code === 'PICK' ||
      !Number(item.pad_count)
      ? 1
      : 0
    : 0;
  item.line_total = computeLineTotal(item);
}

function onPriceChange(item) {
  touchItem(item);
}

function onGroupChange(item) {
  const group = (priceBookDetail.value.groups || []).find(
    (g) => g.group_code === item.group_code
  );
  if (isPadMode.value) {
    item.group_name = group?.group_name || '';
    item.mount_type = group?.mount_type || item.mount_type;
    if (!item.is_manual && group?.mount_type) {
      const mount = String(group.mount_type).toUpperCase();
      if (mount.includes('GẮP')) {
        item.process_code = '';
        item.needs_review = 1;
      } else if (mount.includes('HÀN')) {
        item.process_code = 'HAND';
      } else {
        item.process_code = 'SMT';
      }
    }
    if (!item.pad_count && group?.pin_count != null && group.pin_count !== '') {
      item.pad_count = Number(group.pin_count);
      item.pad_count_source = 'group';
    }
    item.unit = 'pad';
    recomputeLine(item);
    return;
  }

  if (group) {
    item.group_name = group.group_name;
    item.unit = group.unit;
    item.mount_type = group.mount_type || item.mount_type;
    item.unit_price = Number(group.unit_price) || 0;
    if (group.pin_count != null && group.pin_count !== '') {
      item.pin_count = Number(group.pin_count);
    }
  } else {
    item.group_name = '';
    item.unit_price = 0;
  }
  touchItem(item);
}

function onPadInput(item) {
  item.pad_count_source = 'manual';
  item.is_manual = 1;
  recomputeLine(item);
}

function commitPadCount(item) {
  item.pad_count_source = 'manual';
  item.is_manual = 1;
  item.match_method = 'manual';
  item.needs_review =
    !item.process_code ||
    item.process_code === 'PICK' ||
    !Number(item.pad_count)
      ? 1
      : 0;
  recomputeLine(item);
}

function onProcessChange(item) {
  if (!item.process_code || item.process_code === 'PICK') {
    item.unit = 'pad';
    item.unit_price = 0;
    item.is_manual = 1;
    item.match_method = 'manual';
    item.needs_review = 1;
    item.line_total = 0;
    item.warnings = (item.warnings || []).filter(
      (warning) => warning !== 'PICK_MANUAL'
    );
    if (item.process_code === 'PICK') {
      item.warnings.push('PICK_MANUAL');
    }
    return;
  }
  item.is_manual = 1;
  item.match_method = 'manual';
  item.needs_review = !Number(item.pad_count) ? 1 : 0;
  item.warnings = (item.warnings || []).filter(
    (warning) => warning !== 'PICK_MANUAL'
  );
  recomputeLine(item);
}

function normalizePackage(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function normalizeMpn(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function openDetail(mpn) {
  const value = String(mpn || '').trim();
  if (!value) return;
  detailMpn.value = value;
  dialogDetail.value = true;
}

function openGroupDialog(item = null) {
  sourceItem.value = item || null;
  groupInitial.value = item
    ? {
        mpn: item.mpn || '',
        description: item.description || '',
        group_name: '',
        mount_type: item.mount_type || 'SMT',
        unit: item.unit || 'con',
        unit_price: Number(item.unit_price) || 0,
        pin_mode: item.pin_count != null ? 'fixed' : 'manual',
        pin_count: item.pin_count ?? null,
        patterns: item.package || '',
        priority: 100,
        active: true,
      }
    : {};
  dialogGroup.value = true;
}

function openOverrideDialog(item = null) {
  sourceItem.value = item || null;
  overrideInitial.value = item
    ? {
        mpn: item.mpn || '',
        unit_price: Number(item.unit_price) || 0,
        mount_type: item.mount_type || '',
        pin_count: item.pin_count ?? null,
        scope: 'global',
        note: item.note || '',
      }
    : {};
  dialogOverride.value = true;
}

function applyGroupToItems(groupCode, patterns) {
  const patternSet = new Set(
    (patterns || [])
      .map((pattern) => normalizePackage(pattern?.pattern ?? pattern))
      .filter(Boolean)
  );
  items.value.forEach((item) => {
    const pkg = normalizePackage(item.package);
    const isSource = sourceItem.value === item;
    const samePackage = pkg && patternSet.has(pkg);
    if (!isSource && !samePackage) return;
    item.group_code = groupCode;
    onGroupChange(item);
  });
}

function applyOverrideToItems(payload) {
  const targetMpn = normalizeMpn(payload.mpn);
  const price = Number(payload.unit_price) || 0;
  const updated = [];
  pinnedItems.value = [];
  items.value.forEach((item) => {
    const matches = [item.mpn, item.raw_mpn]
      .map((value) => normalizeMpn(value))
      .some((value) => value && value === targetMpn);
    if (!matches) return;
    item.unit_price = price;
    item.unit = 'con';
    if (payload.mount_type) item.mount_type = payload.mount_type;
    if (payload.pin_count != null && payload.pin_count !== '') {
      item.pin_count = Number(payload.pin_count);
    }
    if (!item.group_code) {
      item.group_code = 'MPN_OVERRIDE';
      item.group_name = 'Giá riêng MPN';
    }
    item.is_manual = 1;
    item.match_method = 'mpn_override';
    item.confidence = 0.95;
    item.needs_review = 0;
    item.line_total = computeLineTotal(item);
    updated.push(item);
  });
  pinnedItems.value = updated;
}

function selectRow(item) {
  if (pinnedItems.value.length && !pinnedItems.value.includes(item)) {
    pinnedItems.value = [];
  }
}

watch(onlyReview, () => {
  pinnedItems.value = [];
});

function assignExistingGroup(payload) {
  if (!payload?.group_code) return;
  dialogGroup.value = false;
  applyGroupToItems(
    payload.group_code,
    payload.pattern ? [payload.pattern] : []
  );
  sourceItem.value = null;
  message.value = `Đã gán nhóm ${payload.group_code}`;
  snackbarSuccess.value = true;
}

async function saveGroupFromQuote(payload) {
  if (!form.price_book_id) {
    errorMessage.value = 'Vui lòng chọn bảng giá mẫu';
    snackbarFailed.value = true;
    return;
  }
  savingGroup.value = true;
  try {
    await axios.post(`${Url}/Quotation/PriceBook/${form.price_book_id}/Group`, {
      ...payload,
      created_by: localStorage.getItem('Username') || '',
    });
    await loadPriceBook();
    applyGroupToItems(payload.group_code, payload.patterns);
    dialogGroup.value = false;
    sourceItem.value = null;
    message.value = 'Đã thêm nhóm giá';
    snackbarSuccess.value = true;
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Lưu nhóm giá thất bại';
    snackbarFailed.value = true;
  } finally {
    savingGroup.value = false;
  }
}

async function saveOverrideFromQuote(payload) {
  if (!form.price_book_id) {
    errorMessage.value = 'Vui lòng chọn bảng giá mẫu';
    snackbarFailed.value = true;
    return;
  }
  savingOverride.value = true;
  try {
    await axios.post(
      `${Url}/Quotation/PriceBook/${form.price_book_id}/Override`,
      {
        ...payload,
        created_by: localStorage.getItem('Username') || '',
      }
    );
    await loadPriceBook();
    applyOverrideToItems(payload);
    dialogOverride.value = false;
    sourceItem.value = null;
    message.value = 'Đã thêm giá riêng MPN';
    snackbarSuccess.value = true;
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Lưu giá MPN thất bại';
    snackbarFailed.value = true;
  } finally {
    savingOverride.value = false;
  }
}

async function resolveItems() {
  const lines = buildLines();
  if (!lines.length) {
    errorMessage.value =
      'Không có dòng BOM nào. Kiểm tra lại file và ánh xạ cột.';
    snackbarFailed.value = true;
    return;
  }
  resolving.value = true;
  try {
    const { data } = await axios.post(`${Url}/Quotation/ResolveBom`, {
      price_book_id: form.price_book_id,
      board_qty: form.board_qty,
      lines,
    });
    items.value = (data.items || []).map((item, index) => {
      const explicitProcess = String(
        lines[index]?.process_code || lines[index]?.process || ''
      ).trim();
      const next = {
        ...item,
        warnings: Array.isArray(item.warnings) ? item.warnings : [],
      };
      if (next.process_code === 'PICK' && !explicitProcess) {
        next.process_code = '';
        next.unit = 'pad';
        next.unit_price = 0;
        next.line_total = 0;
        next.needs_review = 1;
        next.warnings = next.warnings.filter((w) => w !== 'PICK_MANUAL');
      }
      return next;
    });
    pinnedItems.value = [];
    costLines.value = [];
    step.value = 3;
  } catch (error) {
    console.error(error);
    errorMessage.value = error.response?.data?.error || 'Mapping BOM thất bại';
    snackbarFailed.value = true;
  } finally {
    resolving.value = false;
  }
}

function addCostLine() {
  costLines.value.push({ name: '', amount: 0 });
}

function removeCostLine(index) {
  costLines.value.splice(index, 1);
}

async function next() {
  if (step.value === 1) {
    if (!validateInfo()) return;
    step.value = 2;
    return;
  }
  if (step.value === 2) {
    await resolveItems();
    return;
  }
  if (step.value === 3) {
    if (!items.value.length) {
      errorMessage.value = 'Chưa có dòng BOM nào để lập báo giá';
      snackbarFailed.value = true;
      return;
    }
    step.value = 4;
    return;
  }
  if (step.value === 4) {
    await save(false);
  }
}

function prev() {
  if (step.value > 1) step.value -= 1;
}

async function downloadQuote(id, quoteNo) {
  const response = await axios.get(`${Url}/Quotation/Quotes/${id}/Export`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `BaoGia_${quoteNo || id}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

async function save(exportAfter) {
  if (!items.value.length) {
    errorMessage.value = 'Chưa có dòng BOM nào để lưu';
    snackbarFailed.value = true;
    return;
  }
  saving.value = true;
  try {
    const payload = {
      customer_id: form.customer_id,
      customer_name: form.customer_name,
      project_name: form.project_name,
      price_book_id: form.price_book_id,
      currency: form.currency,
      board_qty: form.board_qty,
      valid_until: form.valid_until,
      payment_terms: form.payment_terms,
      lead_time: form.lead_time,
      discount_value: form.discount_value,
      vat_percent: form.vat_percent,
      note: form.note,
      created_by: localStorage.getItem('Username') || '',
      items: items.value,
      cost_lines: costLines.value,
    };
    const { data } = await axios.post(`${Url}/Quotation/Quotes`, payload);
    message.value = `Đã tạo báo giá ${data.quote_no}`;
    snackbarSuccess.value = true;
    if (exportAfter) {
      try {
        await downloadQuote(data.id, data.quote_no);
      } catch (downloadError) {
        console.error(downloadError);
      }
    }
    router.push(`/Bao-gia/${data.id}`);
  } catch (error) {
    console.error(error);
    errorMessage.value = error.response?.data?.error || 'Lưu báo giá thất bại';
    snackbarFailed.value = true;
  } finally {
    saving.value = false;
  }
}

onMounted(loadInitial);
</script>

<style scoped>
.quotation-summary {
  position: sticky;
  top: 80px;
}

.quotation-table-wrap {
  overflow: hidden;
}

.cell-ellipsis {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pad-input {
  width: 68px;
  margin: 0 auto;
}

@media (max-width: 1264px) {
  .quotation-summary {
    position: static;
  }
}
</style>
