<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Danh-sach-pnp" />
      <p class="text-h4 font-weight-light ms-3">{{ project_name }}</p>
    </v-card-title>
    <!-- Stats Cards -->
    <v-card-title>
      <v-row>
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Tổng linh kiện"
            :value="combineBom.length || 0"
            icon="mdi-chip"
            color="primary"
            :totalLabel1="statsBom.total.smt"
            :totalLabel2="statsBom.total.handSolder"
            :totalLabel3="statsBom.total.handPlace"
            label1="SMT"
            label2="Hàn tay"
            label3="Gắp tay"
          >
          </CardStatistic>
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Top"
            :value="
              combineBom.filter(
                (item) =>
                  item.layer === 'Top' ||
                  item.layer === 'TopLayer' ||
                  item.layer === 'top' ||
                  item.layer === 'toplayer' ||
                  item.layer === 'TOP' ||
                  item.layer === 'TOPLAYER',
              ).length || 0
            "
            icon="mdi-arrow-collapse-up"
            color="success"
            :totalLabel1="statsBom.top.smt"
            :totalLabel2="statsBom.top.handSolder"
            :totalLabel3="statsBom.top.handPlace"
            label1="SMT"
            label2="Hàn tay"
            label3="Gắp tay"
          >
          </CardStatistic>
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Bottom"
            :value="
              combineBom.filter(
                (item) =>
                  item.layer === 'Bottom' ||
                  item.layer === 'BottomLayer' ||
                  item.layer === 'bottom' ||
                  item.layer === 'bottomlayer' ||
                  item.layer === 'BOTTOM' ||
                  item.layer === 'BOTTOMLAYER',
              ).length || 0
            "
            icon="mdi-arrow-collapse-down"
            color="error"
            :totalLabel1="statsBom.bottom.smt"
            :totalLabel2="statsBom.bottom.handSolder"
            :totalLabel3="statsBom.bottom.handPlace"
            label1="SMT"
            label2="Hàn tay"
            label3="Gắp tay"
          >
          </CardStatistic>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <v-card variant="elevated" elevation="0" class="rounded-xl border">
        <v-tabs v-model="tab" align-tabs="center" color="primary">
          <v-tab :value="0" class="text-caption">Bom</v-tab>
          <v-tab :value="1" class="text-caption">Pick & Place</v-tab>
          <v-tab :value="2" class="text-caption">So sánh</v-tab>
          <v-tab :value="3" class="text-caption">Thống kê</v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab">
          <v-tabs-window-item :value="0">
            <v-card-title class="d-flex align-center pe-2">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    prepend-icon="mdi-import"
                    append-icon="mdi-chevron-down"
                    color="primary"
                    variant="tonal"
                    class="text-caption"
                  >
                    Nhập dữ liệu
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    @click="!checkLock() && (DialogAddBom = true)"
                    prepend-icon="mdi-plus"
                  >
                    <v-list-item-title class="text-caption"
                      >File Bom gốc</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item
                    @click="!checkLock() && (DialogAddBomMountType = true)"
                    prepend-icon="mdi-file-table-outline"
                  >
                    <v-list-item-title class="text-caption"
                      >File Bom Highlight</v-list-item-title
                    >
                  </v-list-item>
                </v-list>
              </v-menu>

              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    prepend-icon="mdi-export"
                    append-icon="mdi-chevron-down"
                    color="success"
                    variant="tonal"
                    class="text-caption ms-2"
                  >
                    Xuất dữ liệu
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    @click="DialogDownloadBomHighlight = true"
                    prepend-icon="mdi-download"
                  >
                    <v-list-item-title class="text-caption"
                      >Tải file Bom Highlight</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item
                    @click="DialogReportMissing = true"
                    prepend-icon="mdi-download"
                  >
                    <v-list-item-title class="text-caption"
                      >Report Missing</v-list-item-title
                    >
                  </v-list-item>
                </v-list>
              </v-menu>

              <v-btn
                color="error"
                variant="tonal"
                prepend-icon="mdi-delete"
                class="text-caption ms-2"
                @click="!checkLock() && (DialogDeleteBomHighlight = true)"
                :disabled="rawBomHighlight.length === 0"
                >Xoá Bom</v-btn
              >

              <!-- Nút tìm datasheet khi có row được chọn -->
              <template v-if="selectedBomRows.length > 0">
                <v-btn
                  color="indigo"
                  variant="tonal"
                  prepend-icon="mdi-book-search-outline"
                  class="text-caption ms-2"
                  :loading="DialogFindingDatasheet"
                  @click="findDatasheets()"
                >
                  Tìm Datasheet ({{ selectedBomRows.length }})
                </v-btn>
                <v-btn
                  color="grey"
                  variant="text"
                  size="small"
                  class="text-caption ms-1"
                  @click="selectedBomRows = []"
                >
                  Bỏ chọn tất cả
                </v-btn>
              </template>

              <v-spacer></v-spacer>

              <!-- Filter: Type -->
              <v-chip-group
                v-model="filterBomHighlightType"
                class="ms-2"
                selected-class="text-primary"
                filter
                multiple
                column
              >
                <v-chip
                  value="SMT"
                  size="small"
                  variant="tonal"
                  color="primary"
                  filter
                  >SMT</v-chip
                >
                <v-chip
                  value="Hàn tay"
                  size="small"
                  variant="tonal"
                  color="pink"
                  filter
                  >Hàn tay</v-chip
                >
                <v-chip
                  value="Gắp tay"
                  size="small"
                  variant="tonal"
                  color="green"
                  filter
                  >Gắp tay</v-chip
                >
              </v-chip-group>

              <!-- Filter: Image -->
              <v-chip-group
                v-model="filterBomHighlightHasImage"
                class="ms-1"
                selected-class="text-orange"
              >
                <v-chip
                  :value="true"
                  size="small"
                  variant="tonal"
                  color="orange"
                  filter
                  prepend-icon="mdi-image"
                  >Có hình ảnh</v-chip
                >
              </v-chip-group>

              <!-- Filter: Pickplace Thiếu -->
              <v-chip-group
                v-model="filterBomHighlightIsMissing"
                class="ms-1"
                selected-class="text-error"
              >
                <v-chip
                  :value="true"
                  size="small"
                  variant="tonal"
                  color="error"
                  filter
                  prepend-icon="mdi-close-circle"
                  >Thiếu Pickplace</v-chip
                >
              </v-chip-group>

              <InputSearch v-model="searchBomHighlight" class="ms-2" />
            </v-card-title>
            <v-card-text>
              <v-data-table
                density="comfortable"
                :headers="HeadersRawBomHighlight"
                :items="filteredBomHighlight"
                :search="searchBomHighlight"
                :items-per-page="itemsPerPageBomHighlight"
                v-model:page="pageBomHighlight"
                v-model="selectedBomRows"
                show-select
                item-value="id"
                class="elevation-0"
                :row-props="getRowClass"
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
                :dense="false"
                :fixed-header="true"
                height="59vh"
              >
                <!-- STT -->
                <template v-slot:item.stt="{ index }">
                  {{
                    (pageBomHighlight - 1) * itemsPerPageBomHighlight +
                    index +
                    1
                  }}
                </template>

                <!-- Action -->
                <template v-slot:item.id="{ item }">
                  <div class="d-flex">
                    <v-tooltip text="Chỉnh sửa" location="top">
                      <template v-slot:activator="{ props }">
                        <ButtonEdit
                          @edit="GetItemBomEdit(item)"
                          v-bind="props"
                        />
                      </template>
                    </v-tooltip>

                    <!-- <v-tooltip text="Xem linh kiện" location="top">
                      <template v-slot:activator="{ props }">
                        <ButtonSearch
                          @search="getAccessToken(item)"
                          v-bind="props"
                          class="ms-2"
                        />
                      </template>
                    </v-tooltip> -->
                  </div>
                </template>

                <!-- Type -->
                <template v-slot:item.type="{ value }">
                  <v-chip
                    :color="
                      value === 'SMT'
                        ? 'primary'
                        : value === 'Hàn tay'
                        ? 'pink'
                        : value === 'Gắp tay'
                        ? 'green'
                        : 'primary'
                    "
                    size="small"
                    variant="tonal"
                  >
                    {{ value || "SMT" }}
                  </v-chip>
                </template>

                <!-- MPN Missing -->
                <template v-slot:item.is_missing="{ value }">
                  <p class="text-red">{{ value }}</p>
                </template>

                <!-- Image -->
                <template v-slot:item.image="{ value }">
                  <div class="d-flex flex-wrap align-center ga-2 my-2">
                    <template v-for="(img, i) in safeParse(value)" :key="i">
                      <v-img
                        :src="`${Url_Image}/${img}`"
                        width="150"
                        height="150"
                        class="rounded border mr-2"
                        @click="openImage(`${Url_Image}/${img}`)"
                        style="cursor: pointer"
                      />
                    </template>
                  </div>
                </template>

                <!-- Pagination -->
                <template v-slot:bottom>
                  <div class="text-center pt-2">
                    <v-pagination
                      v-model="pageBomHighlight"
                      :length="
                        Math.ceil(
                          filteredBomHighlight.length /
                            itemsPerPageBomHighlight,
                        )
                      "
                    />
                  </div>
                </template>
              </v-data-table>
            </v-card-text>
          </v-tabs-window-item>
          <v-tabs-window-item :value="1">
            <v-card-title class="d-flex align-center pe-2">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    prepend-icon="mdi-import"
                    append-icon="mdi-chevron-down"
                    color="primary"
                    variant="tonal"
                    class="text-caption"
                  >
                    Nhập dữ liệu
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    @click="!checkLock() && (DialogAddPnP = true)"
                    prepend-icon="mdi-plus"
                  >
                    <v-list-item-title class="text-caption"
                      >Pick & Place</v-list-item-title
                    >
                  </v-list-item>
                </v-list>
              </v-menu>

              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    prepend-icon="mdi-export"
                    append-icon="mdi-chevron-down"
                    color="success"
                    variant="tonal"
                    class="text-caption ms-2"
                  >
                    Xuất dữ liệu
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    @click="DownloadPnPBottom()"
                    prepend-icon="mdi-download"
                  >
                    <v-list-item-title class="text-caption"
                      >Tải file Bottom</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item
                    @click="DownloadPnPTop()"
                    prepend-icon="mdi-download"
                  >
                    <v-list-item-title class="text-caption"
                      >Tải file Top</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item
                    @click="DownloadPnP()"
                    prepend-icon="mdi-download"
                  >
                    <v-list-item-title class="text-caption"
                      >Tải file chung</v-list-item-title
                    >
                  </v-list-item>
                </v-list>
              </v-menu>

              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    prepend-icon="mdi-sort"
                    append-icon="mdi-chevron-down"
                    color="grey"
                    variant="tonal"
                    class="text-caption ms-2"
                  >
                    Sắp xếp
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item @click="SortTop()" prepend-icon="mdi-arrow-up">
                    <v-list-item-title class="text-caption"
                      >Bề mặt Top</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item
                    @click="SortBottom()"
                    prepend-icon="mdi-arrow-down"
                  >
                    <v-list-item-title class="text-caption"
                      >Bề mặt Bottom</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item @click="ResetSort()" prepend-icon="mdi-refresh">
                    <v-list-item-title class="text-caption"
                      >Tất cả</v-list-item-title
                    >
                  </v-list-item>
                </v-list>
              </v-menu>
              <v-btn
                color="error"
                variant="tonal"
                prepend-icon="mdi-delete"
                class="text-caption ms-2"
                @click="!checkLock() && (DialogDeletePickPlace = true)"
                :disabled="combineBom.length === 0"
                >Xoá Pickplace</v-btn
              >
              <v-spacer></v-spacer>
              <v-chip-group
                v-model="filterCombineBomMPNMissing"
                class="ms-2"
                selected-class="text-error"
                filter
                column
              >
                <v-chip
                  :value="true"
                  size="small"
                  variant="tonal"
                  color="error"
                  filter
                  >Thiếu MPN</v-chip
                >
              </v-chip-group>

              <InputSearch v-model="searchBom" />
            </v-card-title>
            <v-card-text>
              <v-data-table
                density="comfortable"
                :headers="Headers"
                :items="filteredCombineBom"
                :search="searchBom"
                :items-per-page="itemsPerPageBom"
                v-model:page="pageBom"
                class="elevation-0"
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
                :dense="false"
                :fixed-header="true"
                :row-props="getRowProps"
                height="59vh"
              >
                <template v-slot:bottom>
                  <div class="text-center pt-2">
                    <v-pagination
                      v-model="pageBom"
                      :length="
                        Math.ceil(filteredCombineBom.length / itemsPerPageBom)
                      "
                    ></v-pagination>
                  </div>
                </template>
                <template v-slot:item.stt="{ index }">
                  {{ (pageBom - 1) * itemsPerPageBom + index + 1 }}
                </template>
                <template v-slot:item.id="{ item }">
                  <div class="d-flex">
                    <v-tooltip text="Chỉnh sửa" location="top">
                      <template v-slot:activator="{ props }">
                        <ButtonEdit @edit="GetItemEdit(item)" v-bind="props" />
                      </template>
                    </v-tooltip>
                    <v-tooltip text="Xem linh kiện" location="top">
                      <template v-slot:activator="{ props }">
                        <ButtonSearch
                          @search="getAccessToken(item)"
                          v-bind="props"
                          class="ms-2"
                        />
                      </template>
                    </v-tooltip>
                  </div>
                </template>
                <template v-slot:item.mount_type="{ value }">
                  <v-chip
                    :color="
                      value === 'SMT'
                        ? 'primary'
                        : value === 'HAND'
                        ? 'error'
                        : 'warning'
                    "
                    size="small"
                    variant="tonal"
                  >
                    {{ value }}
                  </v-chip>
                </template>
                <template v-slot:item.layer="{ value }">
                  <v-chip
                    :color="
                      value === 'Top' ||
                      value === 'top' ||
                      value === 'TopLayer' ||
                      value === 'toplayer' ||
                      value === 'Top Layer' ||
                      value === 'top layer' ||
                      value === 'TOP' ||
                      value === 'TOPLAYER' ||
                      value === 'TOP LAYER'
                        ? 'success'
                        : 'error'
                    "
                    size="small"
                    variant="tonal"
                  >
                    {{ value }}
                  </v-chip>
                </template>
                <template v-slot:item.type="{ value }">
                  <v-chip
                    :color="value === 'SMT' ? 'primary' : 'warning'"
                    size="small"
                    variant="tonal"
                  >
                    {{ value }}
                  </v-chip>
                </template>
                <template v-slot:item.x="{ item }">
                  {{ item.x }}
                </template>
                <template v-slot:item.y="{ item }">
                  {{ item.y }}
                </template>
                <template v-slot:item.need_review="{ value }">
                  <v-icon
                    :icon="value === 1 ? 'mdi-check' : 'mdi-alert-outline'"
                    :color="value === 1 ? 'success' : 'warning'"
                  ></v-icon>
                </template>
              </v-data-table>
            </v-card-text>
          </v-tabs-window-item>
          <v-tabs-window-item :value="2">
            <v-card-title class="d-flex align-center pe-2">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    prepend-icon="mdi-import"
                    append-icon="mdi-chevron-down"
                    color="primary"
                    variant="tonal"
                    class="text-caption"
                  >
                    Nhập dữ liệu
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    @click="!checkLock() && (DialogAddBomNew = true)"
                    prepend-icon="mdi-plus"
                  >
                    <v-list-item-title class="text-caption"
                      >File Bom mới</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item
                    @click="!checkLock() && (DialogAddPickplaceNew = true)"
                    prepend-icon="mdi-plus"
                  >
                    <v-list-item-title class="text-caption"
                      >File Pickplace mới</v-list-item-title
                    >
                  </v-list-item>
                </v-list>
              </v-menu>

              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    prepend-icon="mdi-export"
                    append-icon="mdi-chevron-down"
                    color="success"
                    variant="tonal"
                    class="text-caption ms-2"
                  >
                    Xuất dữ liệu
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    @click="DownloadCompareBomReport()"
                    prepend-icon="mdi-download"
                  >
                    <v-list-item-title class="text-caption"
                      >Tải báo cáo so sánh Bom</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item
                    @click="DownloadComparePickplaceReport()"
                    prepend-icon="mdi-download"
                  >
                    <v-list-item-title class="text-caption"
                      >Tải báo cáo so sánh Pickplace</v-list-item-title
                    >
                  </v-list-item>
                </v-list>
              </v-menu>

              <v-select
                v-model="compareStatusFilter"
                :items="statusFilterOptions"
                label="Trạng thái"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                clearable
                style="max-width: 160px"
                class="ms-2"
              ></v-select>

              <div class="d-flex align-center ms-4 ga-2 text-caption">
                <v-chip
                  v-if="compareStatusCounts.match"
                  size="small"
                  color="green"
                  variant="tonal"
                >
                  Trùng: {{ compareStatusCounts.match }}
                </v-chip>
                <v-chip
                  v-if="compareStatusCounts.change"
                  size="small"
                  color="orange"
                  variant="tonal"
                >
                  Thay đổi: {{ compareStatusCounts.change }}
                </v-chip>
                <v-chip
                  v-if="compareStatusCounts.add"
                  size="small"
                  color="blue"
                  variant="tonal"
                >
                  Mới: {{ compareStatusCounts.add }}
                </v-chip>
                <v-chip
                  v-if="compareStatusCounts.remove"
                  size="small"
                  color="red"
                  variant="tonal"
                >
                  Xoá: {{ compareStatusCounts.remove }}
                </v-chip>
              </div>

              <v-spacer></v-spacer>

              <div class="d-flex align-center ms-3 text-caption">
                <v-btn-toggle
                  v-model="compareMode"
                  density="comfortable"
                  divided
                  color="primary"
                >
                  <v-btn value="bom" class="text-caption">Bom</v-btn>
                  <v-btn value="pnp" class="text-caption">Pick & Place</v-btn>
                </v-btn-toggle>
              </div>

              <InputSearch v-model="searchBomHighlight" class="ms-2" />
            </v-card-title>
            <v-card-text>
              <template v-if="compareMode === 'bom'">
                <v-data-table
                  density="comfortable"
                  :headers="compareHeader"
                  :items="compareFilteredRows"
                  :search="searchBomHighlight"
                  :items-per-page="itemsPerPageBomHighlight"
                  v-model:page="pageBomHighlight"
                  item-value="id"
                  class="elevation-0"
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
                  :dense="false"
                  :fixed-header="true"
                  height="59vh"
                >
                  <!-- STT -->
                  <template v-slot:item.stt="{ index }">
                    {{
                      (pageBomHighlight - 1) * itemsPerPageBomHighlight +
                      index +
                      1
                    }}
                  </template>

                  <!-- Bom cũ - Designator -->
                  <template v-slot:item.old_designator="{ item }">
                    <template v-if="item.oldList && item.oldList.length">
                      <span
                        v-for="(x, i) in item.oldList"
                        :key="'od' + i"
                        :class="x.diff ? 'text-red font-weight-medium' : ''"
                      >
                        <template v-if="i > 0">, </template>{{ x.ref }}
                      </span>
                    </template>
                    <span v-else class="text-grey">—</span>
                  </template>

                  <!-- Bom cũ - MPN -->
                  <template v-slot:item.old_mpn="{ item }">
                    <span
                      :class="
                        item.oldList && item.oldList.some((x) => x.diff)
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.old_mpn || "—" }}
                    </span>
                  </template>

                  <!-- Bom mới - Designator -->
                  <template v-slot:item.new_designator="{ item }">
                    <template v-if="item.newList && item.newList.some(Boolean)">
                      <span
                        v-for="(x, i) in item.newList"
                        :key="'nd' + i"
                        :class="
                          x && x.diff ? 'text-red font-weight-medium' : ''
                        "
                      >
                        <template v-if="i > 0">, </template
                        >{{ x ? x.ref : "—" }}
                      </span>
                    </template>
                    <span v-else class="text-grey">—</span>
                  </template>

                  <!-- Bom mới - MPN -->
                  <template v-slot:item.new_mpn="{ item }">
                    <span
                      :class="
                        item.newList && item.newList.some((x) => x && x.diff)
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.new_mpn || "—" }}
                    </span>
                  </template>

                  <!-- Trạng thái -->
                  <template v-slot:item.status="{ item }">
                    <v-chip
                      v-if="item.status !== 'none'"
                      :color="
                        item.status === 'match'
                          ? 'green'
                          : item.status === 'change'
                          ? 'orange'
                          : 'blue'
                      "
                      size="small"
                      variant="tonal"
                    >
                      {{
                        item.status === "match"
                          ? "Trùng"
                          : item.status === "change"
                          ? "Thay đổi"
                          : "Mới"
                      }}
                    </v-chip>
                    <span v-else class="text-grey">—</span>
                  </template>

                  <!-- Pagination -->
                  <template v-slot:bottom>
                    <div class="text-center pt-2">
                      <v-pagination
                        v-model="pageBomHighlight"
                        :length="
                          Math.ceil(
                            compareFilteredRows.length /
                              itemsPerPageBomHighlight,
                          )
                        "
                      />
                    </div>
                  </template>
                </v-data-table>
                <div
                  v-if="!FileBomNew && bomCompareRows.length === 0"
                  class="text-center text-grey py-4 text-caption"
                >
                  Chưa có dữ liệu Bom. Vui lòng nhập "File Bom mới" để so sánh.
                </div>
              </template>

              <template v-else>
                <v-data-table
                  density="comfortable"
                  :headers="PnPCompareHeader"
                  :items="compareFilteredRows"
                  :search="searchBomHighlight"
                  :items-per-page="itemsPerPageBomHighlight"
                  v-model:page="pagePnPCompare"
                  item-value="id"
                  class="elevation-0"
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
                  :dense="false"
                  :fixed-header="true"
                  height="59vh"
                >
                  <template v-slot:item.stt="{ index }">
                    {{
                      (pagePnPCompare - 1) * itemsPerPageBomHighlight +
                      index +
                      1
                    }}
                  </template>

                  <template v-slot:item.old_designator="{ item }">
                    <span
                      v-if="item.oldList && item.oldList.some(Boolean)"
                      :class="
                        item.status === 'remove'
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.old_designator }}
                    </span>
                    <span v-else class="text-grey">—</span>
                  </template>

                  <template v-slot:item.old_x="{ item }">
                    <span
                      :class="
                        item.oldList &&
                        item.oldList.some((o) => o && o.diffFields.x)
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.old_x }}
                    </span>
                  </template>

                  <template v-slot:item.old_y="{ item }">
                    <span
                      :class="
                        item.oldList &&
                        item.oldList.some((o) => o && o.diffFields.y)
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.old_y }}
                    </span>
                  </template>

                  <template v-slot:item.old_rotation="{ item }">
                    <span
                      :class="
                        item.oldList &&
                        item.oldList.some((o) => o && o.diffFields.rotation)
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.old_rotation }}
                    </span>
                  </template>

                  <template v-slot:item.old_layer="{ item }">
                    <span
                      :class="
                        item.oldList &&
                        item.oldList.some((o) => o && o.diffFields.layer)
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.old_layer }}
                    </span>
                  </template>

                  <template v-slot:item.new_designator="{ item }">
                    <span
                      v-if="item.newList && item.newList.some(Boolean)"
                      :class="
                        item.status === 'add'
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.new_designator }}
                    </span>
                    <span v-else class="text-grey">—</span>
                  </template>

                  <template v-slot:item.new_x="{ item }">
                    <span
                      :class="
                        item.newList &&
                        item.newList.some((n) => n && n.diffFields.x)
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.new_x }}
                    </span>
                  </template>

                  <template v-slot:item.new_y="{ item }">
                    <span
                      :class="
                        item.newList &&
                        item.newList.some((n) => n && n.diffFields.y)
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.new_y }}
                    </span>
                  </template>

                  <template v-slot:item.new_rotation="{ item }">
                    <span
                      :class="
                        item.newList &&
                        item.newList.some((n) => n && n.diffFields.rotation)
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.new_rotation }}
                    </span>
                  </template>

                  <template v-slot:item.new_layer="{ item }">
                    <span
                      :class="
                        item.newList &&
                        item.newList.some((n) => n && n.diffFields.layer)
                          ? 'text-red font-weight-medium'
                          : ''
                      "
                    >
                      {{ item.new_layer }}
                    </span>
                  </template>

                  <template v-slot:item.status="{ item }">
                    <v-chip
                      v-if="item.status !== 'none'"
                      :color="
                        item.status === 'match'
                          ? 'green'
                          : item.status === 'change'
                          ? 'orange'
                          : item.status === 'remove'
                          ? 'red'
                          : 'blue'
                      "
                      size="small"
                      variant="tonal"
                    >
                      {{
                        item.status === "match"
                          ? "Trùng"
                          : item.status === "change"
                          ? "Thay đổi"
                          : item.status === "remove"
                          ? "Xoá"
                          : "Mới"
                      }}
                    </v-chip>
                    <span v-else class="text-grey">—</span>
                  </template>

                  <template v-slot:bottom>
                    <div class="text-center pt-2">
                      <v-pagination
                        v-model="pagePnPCompare"
                        :length="
                          Math.ceil(
                            compareFilteredRows.length /
                              itemsPerPageBomHighlight,
                          )
                        "
                      />
                    </div>
                  </template>
                </v-data-table>

                <div
                  v-if="!FilePickplaceNew && pnpCompareRows.length === 0"
                  class="text-center text-grey py-4 text-caption"
                >
                  Chưa có dữ liệu Pickplace. Vui lòng nhập "File Pickplace mới"
                  để so sánh.
                </div>
              </template>
            </v-card-text>
          </v-tabs-window-item>
          <v-tabs-window-item :value="3">
            <v-card-text>
              <v-row class="d-flex justify-end mb-2">
                <v-btn
                  color="success"
                  variant="tonal"
                  size="small"
                  class="text-caption"
                  prepend-icon="mdi-file-excel"
                  @click="downloadSummaryExcel()"
                >
                  Tải báo cáo
                </v-btn>
              </v-row>
              <v-row class="mb-2">
                <v-col cols="12" sm="4">
                  <CardStatistic
                    title="Thiếu Pick & Place"
                    :value="dashMissingPnPList.length"
                    icon="mdi-package-variant-closed-remove"
                    color="warning"
                  >
                  </CardStatistic>
                </v-col>
                <v-col cols="12" sm="4">
                  <CardStatistic
                    title="Thiếu MPN"
                    :value="dashMissingMpnList.length"
                    icon="mdi-numeric"
                    color="error"
                  >
                  </CardStatistic>
                </v-col>
                <v-col cols="12" sm="4">
                  <CardStatistic
                    title="DNP"
                    :value="dashDnpList.length"
                    icon="mdi-close-circle"
                    color="secondary"
                  >
                  </CardStatistic>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="6">
                  <v-card
                    variant="elevated"
                    elevation="0"
                    class="rounded-xl border h-100 d-flex flex-column"
                  >
                    <v-card-title class="text-subtitle-1 font-weight-bold">
                      Phân bố theo loại linh kiện
                    </v-card-title>
                    <v-card-text class="d-flex flex-column flex-grow-1">
                      <ChartDonutSummary
                        :labels="['SMT', 'Hàn tay', 'Gắp tay']"
                        :data="dashDonutData"
                        title="Phân bố theo loại"
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card
                    variant="elevated"
                    elevation="0"
                    class="rounded-xl border h-100 d-flex flex-column"
                  >
                    <v-card-title class="text-subtitle-1 font-weight-bold">
                      Top MPN
                    </v-card-title>
                    <v-card-text class="d-flex flex-column flex-grow-1">
                      <v-table density="comfortable" class="border rounded-lg">
                        <thead>
                          <tr class="bg-indigo-lighten-5">
                            <th
                              class="text-caption font-weight-bold"
                              style="width: 40px"
                            >
                              #
                            </th>
                            <th class="text-caption font-weight-bold">MPN</th>
                            <th class="text-caption font-weight-bold text-end">
                              Quantity (pcs)
                            </th>
                            <th class="text-caption font-weight-bold text-end">
                              % of Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(item, idx) in dashTopMpn" :key="idx">
                            <td class="text-caption">{{ idx + 1 }}</td>
                            <td class="text-caption font-weight-medium">
                              {{ item.mpn }}
                            </td>
                            <td class="text-caption text-end font-weight-bold">
                              {{ dashFormatNum(item.count) }}
                            </td>
                            <td class="text-caption">
                              <div class="d-flex align-center justify-end">
                                <v-progress-linear
                                  :model-value="item.pctNum"
                                  height="8"
                                  rounded
                                  color="primary"
                                  class="me-2"
                                  style="max-width: 90px"
                                ></v-progress-linear>
                                <span class="text-caption">{{ item.pct }}</span>
                              </div>
                            </td>
                          </tr>
                          <tr v-if="dashTopMpn.length === 0">
                            <td
                              colspan="4"
                              class="text-center text-grey py-6 text-caption"
                            >
                              Không có dữ liệu
                            </td>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-row class="mt-1">
                <v-col cols="12">
                  <v-card
                    variant="elevated"
                    elevation="0"
                    class="rounded-xl border"
                  >
                    <v-card-title class="text-subtitle-1 font-weight-bold">
                      Phân loại thiếu linh kiện
                    </v-card-title>
                    <v-card-text>
                      <v-tabs v-model="tabMissing" color="primary" class="mb-2">
                        <v-tab value="mpn" class="text-caption"
                          >Thiếu MPN</v-tab
                        >
                        <v-tab value="pnp" class="text-caption"
                          >Thiếu Pick &amp; Place</v-tab
                        >
                        <v-tab value="dnp" class="text-caption">DNP</v-tab>
                      </v-tabs>
                      <v-tabs-window v-model="tabMissing">
                        <v-tabs-window-item value="mpn">
                          <v-table
                            density="comfortable"
                            class="border rounded-lg"
                          >
                            <thead>
                              <tr class="bg-indigo-lighten-5">
                                <th class="text-caption font-weight-bold">
                                  Designator
                                </th>
                                <th class="text-caption font-weight-bold">
                                  MPN
                                </th>
                                <th class="text-caption font-weight-bold">
                                  Description
                                </th>
                                <th
                                  class="text-caption font-weight-bold text-end"
                                >
                                  Qty
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="(item, idx) in dashMissingMpnList"
                                :key="idx"
                              >
                                <td class="text-caption">
                                  {{ item.designator }}
                                </td>
                                <td class="text-caption">{{ item.mpn }}</td>
                                <td class="text-caption">
                                  {{ item.description }}
                                </td>
                                <td class="text-caption text-end">
                                  {{ dashFormatNum(item.quantity) }}
                                </td>
                              </tr>
                              <tr v-if="dashMissingMpnList.length === 0">
                                <td
                                  colspan="4"
                                  class="text-center text-grey py-6 text-caption"
                                >
                                  Không có dữ liệu
                                </td>
                              </tr>
                            </tbody>
                          </v-table>
                        </v-tabs-window-item>
                        <v-tabs-window-item value="pnp">
                          <v-table
                            density="comfortable"
                            class="border rounded-lg"
                          >
                            <thead>
                              <tr class="bg-indigo-lighten-5">
                                <th class="text-caption font-weight-bold">
                                  Designator
                                </th>
                                <th class="text-caption font-weight-bold">
                                  MPN
                                </th>
                                <th class="text-caption font-weight-bold">
                                  Description
                                </th>
                                <th
                                  class="text-caption font-weight-bold text-end"
                                >
                                  Qty
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="(item, idx) in dashMissingPnPList"
                                :key="idx"
                              >
                                <td class="text-caption">
                                  {{ item.designator }}
                                </td>
                                <td class="text-caption">{{ item.mpn }}</td>
                                <td class="text-caption">
                                  {{ item.description }}
                                </td>
                                <td class="text-caption text-end">
                                  {{ dashFormatNum(item.quantity) }}
                                </td>
                              </tr>
                              <tr v-if="dashMissingPnPList.length === 0">
                                <td
                                  colspan="4"
                                  class="text-center text-grey py-6 text-caption"
                                >
                                  Không có dữ liệu
                                </td>
                              </tr>
                            </tbody>
                          </v-table>
                        </v-tabs-window-item>
                        <v-tabs-window-item value="dnp">
                          <v-table
                            density="comfortable"
                            class="border rounded-lg"
                          >
                            <thead>
                              <tr class="bg-indigo-lighten-5">
                                <th class="text-caption font-weight-bold">
                                  Designator
                                </th>
                                <th class="text-caption font-weight-bold">
                                  MPN
                                </th>
                                <th class="text-caption font-weight-bold">
                                  Description
                                </th>
                                <th
                                  class="text-caption font-weight-bold text-end"
                                >
                                  Qty
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(item, idx) in dashDnpList" :key="idx">
                                <td class="text-caption">
                                  {{ item.designator }}
                                </td>
                                <td class="text-caption">{{ item.mpn }}</td>
                                <td class="text-caption">
                                  {{ item.description }}
                                </td>
                                <td class="text-caption text-end">
                                  {{ dashFormatNum(item.quantity) }}
                                </td>
                              </tr>
                              <tr v-if="dashDnpList.length === 0">
                                <td
                                  colspan="4"
                                  class="text-center text-grey py-6 text-caption"
                                >
                                  Không có dữ liệu
                                </td>
                              </tr>
                            </tbody>
                          </v-table>
                        </v-tabs-window-item>
                      </v-tabs-window>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-card-text>
  </v-card>

  <BaseDialog
    v-model="DialogAddBom"
    width="800"
    title="Thêm dữ liệu BOM"
    icon="mdi-plus"
  >
    <InputFiles
      label="Nhập file Bom (.xlsx)"
      class="mt-2"
      v-model="FileBom"
      name="bom"
    />
    <div v-if="FileBom" class="mt-4">
      <v-divider class="mb-4"></v-divider>
      <div class="d-flex justify-space-between align-center mb-5">
        <div class="d-flex align-center">
          <span class="text-caption text-grey me-2">Dòng tiêu đề:</span>
          <v-select
            v-model="BomSelectedHeaderRow"
            :items="
              [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                (i) => ({ title: `Dòng ${i + 1}`, value: i }),
              )
            "
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 130px; height: 32px"
            class="elevation-0"
          ></v-select>
        </div>
        <v-checkbox
          v-model="BomNormalizeDesignator"
          density="compact"
          hide-details
          color="primary"
        >
          <template #label>
            <span class="text-body-2">
              Chuẩn hoá Designator
              <v-tooltip location="top" max-width="320">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="14" class="ml-1" color="grey"
                    >mdi-information-outline</v-icon
                  >
                </template>
                Chuyển đổi dữ liệu bẩn: mở rộng dải ký hiệu (VD: R1-R5 → R1, R2,
                R3, R4, R5) và xoá bỏ các dấu không cần thiết, chỉ giữ lại dấu
                phẩy giữa các ký hiệu.
              </v-tooltip>
            </span>
          </template>
        </v-checkbox>
      </div>
      <v-row density="compact" class="mb-1">
        <v-col cols="6" md="4">
          <v-select
            v-model="BomMapping.designator"
            :items="BomHeaders"
            item-title="title"
            item-value="value"
            label="Designator / Ref"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="BomMapping.mpn"
            :items="BomHeaders"
            item-title="title"
            item-value="value"
            label="MPN / Comment"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="BomMapping.mpn2"
            :items="BomHeaders"
            item-title="title"
            item-value="value"
            label="MPN 2"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="BomMapping.mpn3"
            :items="BomHeaders"
            item-title="title"
            item-value="value"
            label="MPN 3"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="BomMapping.quantity"
            :items="BomHeaders"
            item-title="title"
            item-value="value"
            label="Quantity"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="BomMapping.description"
            :items="BomHeaders"
            item-title="title"
            item-value="value"
            label="Description"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="BomMapping.note"
            :items="BomHeaders"
            item-title="title"
            item-value="value"
            label="Note"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          ></v-select>
        </v-col>
      </v-row>

      <p class="text-subtitle-2 mb-0 me-4 mt-2">
        Bản xem trước dữ liệu (Preview)
      </p>
      <v-table density="compact" class="border rounded mt-2">
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="py-2">
              <span class="text-caption font-weight-bold">Designator</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">MPN</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Quantity</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Description</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Note</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in BomPreviewMapped" :key="i">
            <td class="text-caption">{{ item.designator }}</td>
            <td class="text-caption">{{ item.mpn }}</td>
            <td class="text-caption">{{ item.quantity }}</td>
            <td class="text-caption">{{ item.description }}</td>
            <td class="text-caption">{{ item.note }}</td>
          </tr>
          <tr v-if="BomPreviewMapped.length === 0">
            <td colspan="5" class="text-center text-grey py-4 text-caption">
              Không có dữ liệu (Vui lòng kiểm tra lại Dòng tiêu đề)
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <template #actions>
      <ButtonCancel @cancel="DialogAddBom = false" />
      <ButtonSave @save="uploadBOM()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogAddBomMountType"
    width="600"
    title="Thêm dữ liệu BOM Highlight"
    icon="mdi-plus"
  >
    <InputFiles
      label="Nhập file Bom Highlight (.xlsx)"
      class="mt-2"
      v-model="FileBomMountType"
      name="bom"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogAddBomMountType = false" />
      <ButtonSave @save="uploadBOMMountType()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogAddBomNew"
    width="800"
    title="Nhập File Bom mới (so sánh)"
    icon="mdi-compare"
  >
    <InputFiles
      label="Nhập file Bom mới (.xlsx)"
      class="mt-2"
      v-model="FileBomNew"
      name="bom-new"
    />
    <div v-if="FileBomNew" class="mt-4">
      <v-divider class="mb-4"></v-divider>
      <div class="d-flex justify-space-between align-center mb-5">
        <div class="d-flex align-center">
          <span class="text-caption text-grey me-2">Dòng tiêu đề:</span>
          <v-select
            v-model="BomNewSelectedHeaderRow"
            :items="
              [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                (i) => ({ title: `Dòng ${i + 1}`, value: i }),
              )
            "
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 130px; height: 32px"
            class="elevation-0"
          ></v-select>
        </div>
        <v-checkbox
          v-model="BomNewNormalizeDesignator"
          density="compact"
          hide-details
          color="primary"
        >
          <template #label>
            <span class="text-body-2">Chuẩn hoá Designator</span>
          </template>
        </v-checkbox>
      </div>
      <v-row density="compact" class="mb-1">
        <v-col cols="6" md="4">
          <v-select
            v-model="BomNewMapping.designator"
            :items="BomNewHeaderOptions"
            item-title="title"
            item-value="value"
            label="Designator / Ref"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="BomNewMapping.mpn"
            :items="BomNewHeaderOptions"
            item-title="title"
            item-value="value"
            label="MPN / Comment"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="BomNewMapping.description"
            :items="BomNewHeaderOptions"
            item-title="title"
            item-value="value"
            label="Description"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="BomNewMapping.quantity"
            :items="BomNewHeaderOptions"
            item-title="title"
            item-value="value"
            label="Quantity"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
      </v-row>

      <p class="text-subtitle-2 mb-0 me-4 mt-2">
        Bản xem trước dữ liệu (Preview)
      </p>
      <v-table density="compact" class="border rounded mt-2">
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="py-2">
              <span class="text-caption font-weight-bold">Designator</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">MPN</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Quantity</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Description</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in BomNewPreviewMapped" :key="i">
            <td class="text-caption">{{ item.designator }}</td>
            <td class="text-caption">{{ item.mpn }}</td>
            <td class="text-caption">{{ item.quantity }}</td>
            <td class="text-caption">{{ item.description }}</td>
          </tr>
          <tr v-if="BomNewPreviewMapped.length === 0">
            <td colspan="4" class="text-center text-grey py-4 text-caption">
              Không có dữ liệu (Vui lòng kiểm tra lại Dòng tiêu đề)
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <template #actions>
      <ButtonCancel @cancel="DialogAddBomNew = false" />
      <ButtonSave @save="applyBomNewCompare()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogAddPickplaceNew"
    width="800"
    title="Nhập File Pickplace mới (so sánh)"
    icon="mdi-compare"
  >
    <InputFiles
      label="Nhập file Pickplace mới (.xlsx)"
      class="mt-2"
      v-model="FilePickplaceNew"
      name="pickplace-new"
    />
    <div v-if="FilePickplaceNew" class="mt-4">
      <v-divider class="mb-4"></v-divider>
      <div class="d-flex justify-space-between align-center mb-5">
        <div class="d-flex align-center">
          <span class="text-caption text-grey me-2">Dòng tiêu đề:</span>
          <v-select
            v-model="PkNewSelectedHeaderRow"
            :items="PkNewHeaderRowOptions"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 240px; height: 32px"
            class="elevation-0"
          ></v-select>
        </div>
        <div class="d-flex align-center">
          <v-checkbox
            v-model="PkNewNormalizeDesignator"
            density="compact"
            hide-details
            color="primary"
          >
            <template #label>
              <span class="text-body-2">Chuẩn hoá Designator</span>
            </template>
          </v-checkbox>
          <v-checkbox
            v-model="PkNewCleanDirtyData"
            density="compact"
            hide-details
            color="primary"
            class="ms-3"
          >
            <template #label>
              <span class="text-body-2">Loại bỏ dữ liệu bẩn</span>
            </template>
          </v-checkbox>
        </div>
      </div>
      <v-row density="compact" class="mb-1">
        <v-col cols="6" md="4">
          <v-select
            v-model="PkNewMapping.designator"
            :items="PkNewHeaderRowOptions"
            item-title="title"
            item-value="value"
            label="Designator / Ref"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="PkNewMapping.posX"
            :items="PkNewHeaderRowOptions"
            item-title="title"
            item-value="value"
            label="X"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="PkNewMapping.posY"
            :items="PkNewHeaderRowOptions"
            item-title="title"
            item-value="value"
            label="Y"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="PkNewMapping.rotation"
            :items="PkNewHeaderRowOptions"
            item-title="title"
            item-value="value"
            label="Rotation"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="PkNewMapping.layer"
            :items="PkNewHeaderRowOptions"
            item-title="title"
            item-value="value"
            label="Layer"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="PkNewMapping.note"
            :items="PkNewHeaderRowOptions"
            item-title="title"
            item-value="value"
            label="Note"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          ></v-select>
        </v-col>
      </v-row>

      <p class="text-subtitle-2 mb-0 me-4 mt-2">
        Bản xem trước dữ liệu (Preview)
      </p>
      <v-table density="compact" class="border rounded mt-2">
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="py-2">
              <span class="text-caption font-weight-bold">Designator</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">X</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Y</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Rotation</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Layer</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, i) in PkNewPreviewMapped"
            :key="i"
            :class="item._dirty ? 'error lighten-5' : ''"
          >
            <td class="text-caption">{{ item.designator }}</td>
            <td class="text-caption">{{ item.posX }}</td>
            <td class="text-caption">{{ item.posY }}</td>
            <td class="text-caption">{{ item.rotation }}</td>
            <td class="text-caption">{{ item.layer }}</td>
          </tr>
          <tr v-if="PkNewPreviewMapped.length === 0">
            <td colspan="5" class="text-center text-grey py-4 text-caption">
              Không có dữ liệu (Vui lòng kiểm tra lại Dòng tiêu đề)
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <template #actions>
      <ButtonCancel @cancel="DialogAddPickplaceNew = false" />
      <ButtonSave @save="applyPickplaceNewCompare()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogAddPnP"
    width="800"
    title="Thêm dữ liệu Pick & Place"
    icon="mdi-plus"
  >
    <InputFiles
      label="Nhập file Pick & Place (.xlsx)"
      class="mt-2"
      v-model="FilePnP"
      name="pnp"
    />
    <div v-if="FilePnP" class="mt-4">
      <v-divider class="mb-4"></v-divider>

      <!-- Lựa chọn dòng tiêu đề -->
      <p class="text-subtitle-2 mb-2 me-4">Lựa chọn dòng tiêu đề</p>
      <v-select
        v-model="PnPSelectedHeaderRow"
        :items="PnPHeaderRowOptions"
        item-title="title"
        item-value="value"
        label="Dòng tiêu đề (Header Row)"
        density="compact"
        variant="outlined"
        hide-details
        prepend-inner-icon="mdi-table-row"
        class="mb-4"
        style="max-width: 320px"
      ></v-select>

      <p class="text-subtitle-2 mb-2 me-4">
        Lựa chọn các cột tương ứng trong file Pickplace
      </p>
      <v-row density="compact" class="mb-1">
        <v-col cols="6" md="4">
          <v-select
            v-model="PnPMapping.designator"
            :items="PnPHeaders"
            item-title="title"
            item-value="value"
            label="Designator / Ref"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="PnPMapping.layer"
            :items="PnPHeaders"
            item-title="title"
            item-value="value"
            label="Layer / Side"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="PnPMapping.posX"
            :items="PnPHeaders"
            item-title="title"
            item-value="value"
            label="X (mm)"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="PnPMapping.posY"
            :items="PnPHeaders"
            item-title="title"
            item-value="value"
            label="Y (mm)"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="PnPMapping.rotation"
            :items="PnPHeaders"
            item-title="title"
            item-value="value"
            label="Rotation"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="6" md="4">
          <v-select
            v-model="PnPMapping.note"
            :items="PnPHeaders"
            item-title="title"
            item-value="value"
            label="Note (Tuỳ chọn)"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          ></v-select>
        </v-col>
      </v-row>
      <div class="d-flex flex-wrap gap-2 align-center">
        <v-checkbox
          v-model="PnPNormalizeDesignator"
          label="Chuẩn hoá Designator (VD: R1-R10)"
          density="compact"
          hide-details
          color="primary"
        ></v-checkbox>
        <v-checkbox
          v-model="PnPCleanDirtyData"
          density="compact"
          hide-details
          color="warning"
        >
          <template #label>
            <span class="text-body-2">
              Loại bỏ dữ liệu bẩn
              <v-tooltip location="top" max-width="300">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="14" class="ml-1" color="grey"
                    >mdi-information-outline</v-icon
                  >
                </template>
                Lọc bỏ các dòng có Designator không đúng định dạng chuẩn (ví dụ:
                thiếu chữ cái đầu, chứa ký tự đặc biệt không hợp lệ, ô
                trống...). Chỉ giữ lại các ref hợp lệ như R1, C10, U5...
              </v-tooltip>
            </span>
          </template>
        </v-checkbox>
      </div>
      <v-divider class="mb-4"></v-divider>
      <p class="text-subtitle-2 mb-0 me-4">Bản xem trước dữ liệu (Preview)</p>
      <v-table density="compact" class="border rounded">
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="py-2">
              <span class="text-caption font-weight-bold"
                >Designator / Ref</span
              >
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Layer / Side</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">X (mm)</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Y (mm)</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Rotation</span>
            </th>
            <th class="py-2">
              <span class="text-caption font-weight-bold">Note</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, i) in PnPPreviewMapped.slice(0, 5)"
            :key="i"
            :class="{ 'bg-orange-lighten-5': item._dirty }"
          >
            <td class="text-caption">
              <span :class="item._dirty ? 'text-orange-darken-3' : ''">{{
                item.designator
              }}</span>
              <v-chip
                v-if="item._dirty"
                size="x-small"
                color="warning"
                variant="tonal"
                class="ml-1"
                >bẩn</v-chip
              >
            </td>
            <td class="text-caption">{{ item.layer }}</td>
            <td class="text-caption">{{ item.posX }}</td>
            <td class="text-caption">{{ item.posY }}</td>
            <td class="text-caption">{{ item.rotation }}</td>
            <td class="text-caption">{{ item.note }}</td>
          </tr>
          <tr v-if="PnPPreviewMapped.length === 0">
            <td colspan="6" class="text-center text-grey py-4 text-caption">
              Không có dữ liệu (Vui lòng kiểm tra lại Dòng tiêu đề)
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <div v-else class="mt-4">
      <p class="text-bold text-warning">Lưu ý:</p>
      <p class="font-weight-light ms-2">
        Vui lòng chọn file để tiến hành mapping.
      </p>
    </div>
    <template #actions>
      <ButtonCancel @cancel="DialogAddPnP = false" />
      <ButtonSave @save="uploadPNP" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogEdit"
    width="600"
    title="Chỉnh sửa Pick & Place"
    icon="mdi-update"
  >
    <v-row>
      <v-col cols="4">
        <InputField
          label="Toạ độ X (mm)"
          v-model="PnP_X_Edit"
          hint="Toa độ X linh kiện"
        />
      </v-col>
      <v-col cols="4">
        <InputField
          label="Toạ độ Y (mm)"
          v-model="PnP_Y_Edit"
          hint="Toa độ Y linh kiện"
        />
      </v-col>
      <v-col cols="4">
        <InputField label="Góc" v-model="PnP_Angle_Edit" hint="Góc linh kiện" />
      </v-col>
    </v-row>

    <InputSelect
      label="Bề mặt"
      v-model="PnP_Layer_Edit"
      hint="Bề mặt PCB"
      :items="['Top', 'Bottom']"
      item-text="text"
      item-value="value"
    />

    <InputSelect
      label="Định dạng"
      v-model="PnP_Type_Edit"
      hint="Định dạng hàn tay hoặc SMT"
      :items="['SMT', 'Hàn tay']"
      item-text="text"
      item-value="value"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogEdit = false" />
      <ButtonSave @save="SaveEditPnP()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogInfo"
    width="800"
    title="Thông số kỹ thuật"
    icon="mdi-information-variant-circle"
  >
    <v-row>
      <v-col>
        <v-img :src="ResultSearch.Product.PhotoUrl"></v-img>
      </v-col>
      <v-col>
        <v-list-item density="comfortable" lines="two">
          <template v-slot:title>
            <strong class="text-h6">
              {{ ResultSearch.Product.ManufacturerProductNumber }}
            </strong>
          </template>
        </v-list-item>

        <v-table class="text-caption" density="compact">
          <tbody>
            <tr>
              <td><strong>Datasheet</strong></td>
              <td>
                <v-btn
                  size="small"
                  prepend-icon="mdi-database-arrow-right"
                  :href="ResultSearch.Product.DatasheetUrl"
                  target="_blank"
                  color="primary"
                  variant="tonal"
                  class="text-caption"
                >
                  Datasheet
                </v-btn>
              </td>
            </tr>
            <tr
              v-for="item in ResultSearch.Product.Parameters"
              :key="item.name"
            >
              <td>
                <strong>{{ item.ParameterText }}</strong>
              </td>
              <td>{{ item.ValueText }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </BaseDialog>

  <BaseDialog
    v-model="DialogDownloadBomHighlight"
    width="600"
    title="Tải file Bom Highlight"
    icon="mdi-download"
  >
    <InputField label="Tên tiêu đề file Bom" v-model="titleBomhighlight" />
    <div class="text-body-small pa-3 text-black">
      <p class="text-orange">Lưu ý:</p>
      <p>1. Chữ màu <span style="color: red">đỏ</span> là Bottom.</p>
      <p>
        2. Chữ màu <span style="color: #4eaeea">xanh dương</span> là thiếu
        Pickplace.
      </p>
    </div>
    <template #actions>
      <ButtonCancel @cancel="DialogDownloadBomHighlight = false" />
      <ButtonDownload
        :disabled="!titleBomhighlight"
        @download-file="DownloadBomHighlight()"
      />
    </template>
  </BaseDialog>

  <BaseDialog
    v-model="DialogReportMissing"
    width="500"
    title="Báo cáo Component Thiếu"
    icon="mdi-chart-bar"
  >
    <v-card-text>
      <div class="d-flex flex-column gap-2 text-body-1">
        <div class="d-flex justify-space-between">
          <span class="font-weight-medium">Tổng Designator (BOM):</span>
          <span>{{ statsReportMissing.totalBOMDesignators }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="font-weight-medium"
            >Tổng Designator (Pick & Place):</span
          >
          <span>{{ statsReportMissing.totalPnPDesignators }}</span>
        </div>
        <v-divider class="my-2"></v-divider>
        <div class="d-flex justify-space-between text-error">
          <span class="font-weight-medium">Thiếu Pick & Place:</span>
          <span class="font-weight-bold">{{
            statsReportMissing.missingPnPCount
          }}</span>
        </div>
        <div class="d-flex justify-space-between text-warning">
          <span class="font-weight-medium">Thiếu MPN:</span>
          <span class="font-weight-bold">{{
            statsReportMissing.missingMPNCount
          }}</span>
        </div>
      </div>
    </v-card-text>
    <template #actions>
      <ButtonCancel @cancel="DialogReportMissing = false" />
      <v-btn
        color="success"
        class="text-caption"
        variant="tonal"
        prepend-icon="mdi-file-excel"
        @click="DownloadMissingExcelReport"
        :disabled="
          statsReportMissing.missingPnPCount === 0 &&
          statsReportMissing.missingMPNCount === 0
        "
      >
        Xuất Excel
      </v-btn>
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogEditType"
    width="700"
    title="Cập nhật loại linh kiện"
    icon="mdi-update"
  >
    <InputSelect
      label="Loại linh kiện phù hợp"
      v-model="MPN_Type_Edit"
      :items="['SMT', 'Hàn tay', 'Gắp tay']"
    />

    <v-row>
      <v-col cols="8">
        <InputFiles
          v-model="MPN_Image_Edit"
          label="Hình ảnh linh kiện"
          :multiple="true"
          :accept="'.jpg,.jpeg,.png'"
          prepend-icon="mdi-camera"
        />
      </v-col>

      <v-col cols="4" class="d-flex justify-center align-center">
        <div
          class="position-relative"
          v-for="(img, i) in safeParse(MPN_Image_Edit)"
          :key="i"
        >
          <!-- IMAGE -->
          <v-img
            :src="`${Url_Image}/${img}`"
            alt="Hình ảnh linh kiện"
            width="70"
            height="70"
            cover
            class="rounded-lg border ms-5"
          />

          <!-- DELETE BUTTON -->
          <v-btn
            v-if="MPN_Image_Edit"
            icon
            size="xl-small"
            color="red"
            class="delete-image-btn"
            @click="openRemoveImage(img)"
          >
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>

          <!-- EMPTY -->
          <div
            v-if="!MPN_Image_Edit"
            class="d-flex align-center justify-center text-grey border rounded-lg"
            style="width: 110px; height: 110px"
          >
            Không có ảnh
          </div>
        </div>
      </v-col>
    </v-row>
    <v-divider class="my-2"></v-divider>
    <v-card class="bg-surface pa-2" variant="text">
      <v-card-title class="text-center text-h6"
        ><v-icon color="primary" size="22">mdi-information-outline</v-icon>
        Thông tin thêm</v-card-title
      >
      <v-card-text>
        <v-list>
          <v-list-item>
            <v-list-item-subtitle> Tên MPN:</v-list-item-subtitle>
            <v-list-item-title>{{
              MPN_Name_Edit || "Chưa có dữ liệu"
            }}</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-subtitle>Mô tả:</v-list-item-subtitle>
            <v-list-item-title>{{
              MPN_Description_Edit || "Chưa có dữ liệu"
            }}</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-subtitle>Tên dự án đã dùng:</v-list-item-subtitle>
            <v-list-item-title
              >{{ infoProjectName || "Chưa có dữ liệu" }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-subtitle>Người tạo:</v-list-item-subtitle>
            <v-list-item-title>{{
              infoCreatedBy || "Chưa có dữ liệu"
            }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    <template #actions>
      <ButtonCancel @cancel="DialogEditType = false" />
      <ButtonSave @save="SaveEditType()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogDeleteBomHighlight"
    width="600"
    title="Xoá dữ liệu Bom"
    icon="mdi-delete"
  >
    <v-card-text> Bạn có chắc xoá dữ liệu Bom này? </v-card-text>
    <template #actions>
      <ButtonCancel @cancel="DialogDeleteBomHighlight = false" />
      <ButtonDelete @delete="DeleteAllBomHighlight()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogDeletePickPlace"
    width="600"
    title="Xoá dữ liệu PickPlace"
    icon="mdi-delete"
  >
    <v-card-text> Bạn có chắc xoá dữ liệu PickPlace này? </v-card-text>
    <template #actions>
      <ButtonCancel @cancel="DialogDeletePickPlace = false" />
      <ButtonDelete @delete="DeleteAllPickPlace()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogRemoveImage"
    width="600"
    title="Xoá hình ảnh"
    icon="mdi-delete"
  >
    <v-card-text> Bạn có chắc xoá hình ảnh này? </v-card-text>
    <template #actions>
      <ButtonCancel @cancel="DialogRemoveImage = false" />
      <ButtonDelete @delete="RemoveImage()" />
    </template>
  </BaseDialog>
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarCaution v-model="DialogCaution" :message="MessageCautionDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
  <DialogLicenseComp
    v-model="DialogLicense"
    :username="Username"
    :current-license="CurrentLicense"
    :remaining-uses="LicenseUse"
    :project-count="ProjectCount"
    @activated="GetLicenseInfo"
  />

  <!-- Dialog kết quả tìm Datasheet -->
  <BaseDialog
    v-model="DialogDatasheetResult"
    max-width="900"
    scrollable
    :persistent="true"
    icon="mdi-book-search-outline"
    title="Kết quả tìm Datasheet"
  >
    <v-card-text class="pa-4">
      <!-- Thống kê nhanh -->
      <div class="d-flex gap-3 mb-4">
        <v-chip
          color="success"
          variant="tonal"
          size="small"
          prepend-icon="mdi-check-circle"
        >
          Có datasheet:
          {{ datasheetResults.filter((r) => r.datasheetUrl).length }}
        </v-chip>
        <v-chip
          color="error"
          variant="tonal"
          size="small"
          prepend-icon="mdi-close-circle"
          class="ms-2"
        >
          Không có:
          {{ datasheetResults.filter((r) => !r.datasheetUrl).length }}
        </v-chip>
        <v-chip color="grey" variant="tonal" size="small" class="ms-2">
          Tổng: {{ datasheetResults.length }}
        </v-chip>
      </div>

      <v-table density="comfortable" class="border rounded-lg">
        <thead>
          <tr class="bg-indigo-lighten-5">
            <th class="text-caption font-weight-bold py-3" style="width: 50px">
              No.
            </th>
            <th class="text-caption font-weight-bold py-3">MPN</th>
            <th class="text-caption font-weight-bold py-3" style="width: 64px">
              Ảnh
            </th>
            <th class="text-caption font-weight-bold py-3">Manufacturer</th>
            <th class="text-caption font-weight-bold py-3">Nguồn</th>
            <th class="text-caption font-weight-bold py-3">Link Datasheet</th>
            <th class="text-caption font-weight-bold py-3" style="width: 100px">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, idx) in datasheetResults"
            :key="idx"
            :class="item.datasheetUrl ? '' : 'bg-red-lighten-5'"
          >
            <td class="text-caption">{{ idx + 1 }}</td>
            <td class="text-caption font-weight-medium">{{ item.mpn }}</td>
            <td class="text-caption">
              <v-img
                v-if="item.photoUrl"
                :src="item.photoUrl"
                width="48"
                height="48"
                cover
                class="rounded-lg border"
                style="cursor: pointer"
                @click="openDatasheetImage(item)"
              >
                <template v-slot:error>
                  <div
                    class="d-flex align-center justify-center fill-height bg-grey-lighten-3"
                  >
                    <v-icon color="grey" size="20"
                      >mdi-image-broken-variant</v-icon
                    >
                  </div>
                </template>
              </v-img>
              <v-icon v-else color="grey" size="20"
                >mdi-image-off-outline</v-icon
              >
            </td>
            <td class="text-caption text-grey">
              {{ item.manufacturer || "—" }}
            </td>
            <td class="text-caption">
              <div
                class="d-flex align-center ga-1"
                :title="`Datasheet: ${item.dSource || '—'} · Ảnh: ${
                  item.iSource || '—'
                }`"
              >
                <v-chip
                  size="x-small"
                  :color="
                    item.dSource === 'DigiKey'
                      ? 'indigo'
                      : item.dSource === 'LCSC'
                      ? 'green'
                      : 'orange'
                  "
                  variant="tonal"
                  prepend-icon="mdi-book-open-page-variant"
                >
                  DS
                </v-chip>
                <v-chip
                  v-if="item.iSource"
                  size="x-small"
                  :color="item.iSource === 'DigiKey' ? 'indigo' : 'green'"
                  variant="tonal"
                  prepend-icon="mdi-image"
                >
                  IMG
                </v-chip>
              </div>
            </td>
            <td class="text-caption">
              <a
                v-if="item.datasheetUrl"
                :href="item.datasheetUrl"
                target="_blank"
                class="text-indigo text-decoration-none d-flex align-center gap-1"
                style="
                  max-width: 320px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                "
              >
                <v-icon size="14" color="indigo">mdi-open-in-new</v-icon>
                {{ item.datasheetUrl }}
              </a>
              <span v-else class="text-error">Không tìm thấy</span>
            </td>
            <td class="text-caption">
              <v-chip
                :color="item.datasheetUrl ? 'success' : 'error'"
                size="x-small"
                variant="tonal"
              >
                {{ item.datasheetUrl ? "Yes" : "No" }}
              </v-chip>
            </td>
          </tr>
          <tr v-if="datasheetResults.length === 0">
            <td colspan="7" class="text-center text-grey py-6 text-caption">
              Không có dữ liệu
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>

    <v-card-actions class="pa-4 pt-0">
      <v-spacer />
      <v-btn
        color="grey"
        variant="tonal"
        class="text-caption"
        @click="DialogDatasheetResult = false"
        >Đóng</v-btn
      >
      <v-btn
        color="success"
        variant="tonal"
        prepend-icon="mdi-file-excel"
        class="text-caption ms-2"
        :disabled="datasheetResults.length === 0"
        @click="downloadDatasheetExcel()"
        >Tải về (.xlsx)</v-btn
      >
    </v-card-actions>
  </BaseDialog>

  <!-- Dialog xem + tải ảnh sản phẩm -->
  <BaseDialog
    v-model="DialogDatasheetImage"
    width="600"
    :persistent="true"
    icon="mdi-image-search-outline"
    title="Hình ảnh sản phẩm"
  >
    <v-card-text class="pa-4 d-flex justify-center">
      <v-img
        :src="datasheetImageUrl"
        :max-height="450"
        max-width="540"
        cover
        class="rounded-lg border"
        eager
      >
        <template v-slot:error>
          <div
            class="d-flex align-center justify-center fill-height bg-grey-lighten-3"
            style="min-height: 300px"
          >
            <v-icon color="grey" size="48">mdi-image-broken-variant</v-icon>
          </div>
        </template>
      </v-img>
    </v-card-text>

    <v-card-actions class="pa-4 pt-0">
      <v-spacer />
      <v-btn
        color="grey"
        variant="tonal"
        class="text-caption"
        @click="DialogDatasheetImage = false"
        >Đóng</v-btn
      >
      <v-btn
        color="success"
        variant="tonal"
        prepend-icon="mdi-download"
        class="text-caption ms-2"
        @click="downloadDatasheetImage()"
        >Tải về</v-btn
      >
    </v-card-actions>
  </BaseDialog>
</template>
<script setup>
import axios from "axios";
import { ref, watch, computed, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useCombineBom } from "@/composables/CheckBOM/useCombineBom";
import { useBomHighlight } from "@/composables/CheckBOM/useBomHighlight";
import { useRawBomHighlight } from "@/composables/CheckBOM/useRawBomHighlight";
import { usePnPFile } from "@/composables/CheckBOM/usePnPFile";

import ButtonBack from "@/components/Button-Back.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputSelect from "@/components/Input-Select.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarCaution from "@/components/Snackbar-Caution.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonSearch from "@/components/Button-Search.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import Loading from "@/components/Loading.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import ChartDonutSummary from "@/components/Chart-Donut-Summary.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import DialogLicenseComp from "@/components/Dialog-License.vue";
import Logo from "@/assets/avatar-ST.jpg";

import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
//

// ==========================================
// 1. CONSTANTS & API CONFIG
// ==========================================
const Url = import.meta.env.VITE_API_URL;
const Url_Image = "https://api.erpst.io.vn";
// const Url_Image = import.meta.env.VITE_API_URL;
const route = useRoute();
const id = route.params.id;

// ==========================================
// 2. COMPOSABLES
// ==========================================
const { combineBom } = useCombineBom(id);
const { rawBomHighlight } = useRawBomHighlight(id);
const { detailPnP } = usePnPFile(id);

const statsBom = computed(() => {
  let count = {
    total: { smt: 0, handSolder: 0, handPlace: 0 },
    top: { smt: 0, handSolder: 0, handPlace: 0 },
    bottom: { smt: 0, handSolder: 0, handPlace: 0 },
  };

  const layerMap = new Map();
  combineBom.value.forEach((item) => {
    if (!item.designator) return;
    const layer = (item.layer || "").toLowerCase();
    let normalizedLayer = "unknown";
    if (["top", "toplayer"].includes(layer)) normalizedLayer = "top";
    else if (["bottom", "bottomlayer"].includes(layer))
      normalizedLayer = "bottom";

    layerMap.set(item.designator.trim().toUpperCase(), normalizedLayer);
  });

  rawBomHighlight.value.forEach((item) => {
    const designators = (item.designator || "")
      .split(",")
      .map((d) => d.trim().toUpperCase())
      .filter((d) => d);
    const type = item.type;

    designators.forEach((d) => {
      const layer = layerMap.get(d) || "unknown";

      if (layer === "top") {
        if (type === "SMT") count.top.smt++;
        else if (type === "Hàn tay") count.top.handSolder++;
        else if (type === "Gắp tay") count.top.handPlace++;
      } else if (layer === "bottom") {
        if (type === "SMT") count.bottom.smt++;
        else if (type === "Hàn tay") count.bottom.handSolder++;
        else if (type === "Gắp tay") count.bottom.handPlace++;
      }

      if (type === "SMT") count.total.smt++;
      else if (type === "Hàn tay") count.total.handSolder++;
      else if (type === "Gắp tay") count.total.handPlace++;
    });
  });

  return count;
});
// ==========================================
// 3. STATE MANAGEMENT
// ==========================================

// --- Dialog & UI States ---
const DialogEdit = ref(false);
const DialogEditType = ref(false);
const DialogAddBom = ref(false);
const DialogAddBomMountType = ref(false);
const DialogAddPnP = ref(false);
const DialogFailed = ref(false);
const DialogCaution = ref(false); // Warning notification
const DialogLoading = ref(false); // Loading state
const DialogSuccess = ref(false);
const DialogInfo = ref(false);
const DialogDownloadBomHighlight = ref(false);
const DialogReportMissing = ref(false);
const DialogDeleteBomHighlight = ref(false);
const DialogRemoveImage = ref(false);
const ImageToDelete = ref("");
const DialogDeletePickPlace = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");
const MessageCautionDialog = ref("");
const tab = ref(null);
const tabMissing = ref("mpn");

// --- Datasheet Finder States ---
const selectedBomRows = ref([]);
const DialogFindingDatasheet = ref(false);
const DialogDatasheetResult = ref(false);
const DialogDatasheetImage = ref(false);
const datasheetImageUrl = ref("");
const datasheetImageName = ref("image.jpg");
const datasheetResults = ref([]);

// Nexar API credentials (from environment variables)

// --- File & Project States ---
const project_name = ref(localStorage.getItem("BomName"));

// --- License States ---
const Username = ref(localStorage.getItem("Username") || "");
const DialogLicense = ref(false);
const CurrentLicense = ref("Starter");
const LicenseUse = ref(0);
const ProjectCount = ref(0);
const UploadCount = ref(0);
const uploadLimitMap = {
  Starter: 6,
  Plus: 30,
  Pro: 150,
  Enterprise: Infinity,
};
const licenseColor = computed(
  () =>
    ({ Starter: "grey", Plus: "primary", Pro: "amber", Enterprise: "purple" }[
      CurrentLicense.value
    ] || "grey"),
);

const GetLicenseInfo = async () => {
  if (!Username.value) return;
  try {
    const { data } = await axios.get(`${Url}/License/Info/${Username.value}`);
    CurrentLicense.value = data.License || "Starter";
    LicenseUse.value = data.LicenseUse ?? 0;
    ProjectCount.value = data.ProjectCount || 0;
    UploadCount.value = data.UploadCount || 0;
  } catch (error) {
    console.error("Error fetching license:", error);
  }
};

const checkLock = () => {
  const msg =
    (UploadCount.value ?? 0) >= (uploadLimitMap[CurrentLicense.value] ?? 6) &&
    Number.isFinite(uploadLimitMap[CurrentLicense.value] ?? 6)
      ? "Bạn đã đạt giới hạn lượt nhập liệu của gói hiện tại. Vui lòng nâng cấp để tiếp tục."
      : "";
  if (!msg) return false;
  MessageErrorDialog.value = msg;
  DialogFailed.value = true;
  DialogLicense.value = true;
  return true;
};

onMounted(() => {
  GetLicenseInfo();
});
const FileBom = ref(null);
const BomHeaders = ref([]);
const BomPreviewRows = ref([]);
const BomSelectedHeaderRow = ref(0);
const BomMapping = ref({
  description: "",
  mpn: "",
  mpn2: "",
  mpn3: "",
  designator: "",
  quantity: "",
  note: "",
});
const BomNormalizeDesignator = ref(true);

// --- Bom mới (so sánh client-side, không lưu DB) ---
const DialogAddBomNew = ref(false);
const FileBomNew = ref(null);
const BomNewPreviewRows = ref([]);
const BomNewFullRows = ref([]);
const BomNewApplied = ref([]);
const BomNewSelectedHeaderRow = ref(0);
const BomNewMapping = ref({
  description: "",
  mpn: "",
  mpn2: "",
  mpn3: "",
  designator: "",
  quantity: "",
  note: "",
});
const BomNewNormalizeDesignator = ref(true);

// --- Chế độ so sánh trong tab "So sánh" ---
const compareMode = ref("bom");

const compareStatusFilter = ref(null);
const statusFilterOptions = [
  { title: "Mới", value: "new" },
  { title: "Thay đổi", value: "change" },
  { title: "Xoá", value: "remove" },
];

const compareFilteredRows = computed(() => {
  const rows =
    compareMode.value === "pnp" ? pnpCompareRows.value : bomCompareRows.value;
  const f = compareStatusFilter.value;
  if (!f || f === "all") return rows;
  return rows.filter((r) => {
    const s = r.status === "add" ? "new" : r.status;
    return s === f;
  });
});

const compareStatusCounts = computed(() => {
  const rows =
    compareMode.value === "pnp" ? pnpCompareRows.value : bomCompareRows.value;
  const counts = { match: 0, change: 0, add: 0, remove: 0 };
  rows.forEach((r) => {
    if (r.status === "match") counts.match++;
    else if (r.status === "change") counts.change++;
    else if (r.status === "add" || r.status === "new") counts.add++;
    else if (r.status === "remove") counts.remove++;
  });
  return counts;
});

watch([compareStatusFilter, compareMode], () => {
  pageBomHighlight.value = 1;
  pagePnPCompare.value = 1;
});

// --- Pickplace mới (so sánh client-side, không lưu DB) ---
const DialogAddPickplaceNew = ref(false);
const FilePickplaceNew = ref(null);
const PkNewPreviewRows = ref([]);
const PkNewFullRows = ref([]);
const PkNewApplied = ref([]);
const PkNewSelectedHeaderRow = ref(0);
const PkNewMapping = ref({
  designator: "",
  layer: "",
  posX: "",
  posY: "",
  rotation: "",
  note: "",
});
const PkNewNormalizeDesignator = ref(false);
const PkNewCleanDirtyData = ref(false);

/**
 * Chuẩn hoá chuỗi designator từ file BOM:
 * 1. Mở rộng dải: R1-R5 → R1, R2, R3, R4, R5
 * 2. Xoá các ký tự đặc biệt không cần thiết (giữ lại chữ-số và dấu phẩy)
 * 3. Chuẩn hoá khoảng trắng quanh dấu phẩy
 */
const normalizeBomDesignator = (raw) => {
  if (raw == null) return "";
  let str = String(raw).trim();
  // Bước 1: Mở rộng dải kiểu PREFIX_NUM-NUM (VD: R1-R5, C10-C12, FB1-FB3)
  str = str.replace(
    /([A-Za-z]+)(\d+)-\s*\1?(\d+)/g,
    (match, prefix, start, end) => {
      const s = parseInt(start, 10);
      const e = parseInt(end, 10);
      if (e < s) return match; // bảo toàn nếu không hợp lệ
      return Array.from(
        { length: e - s + 1 },
        (_, i) => `${prefix}${s + i}`,
      ).join(", ");
    },
  );
  // Bước 2: Xoá các ký tự đặc biệt không phải chữ-số, khoảng trắng hoặc dấu phẩy
  str = str.replace(/[^A-Za-z0-9,\s]/g, ",");
  // Bước 3: Chuẩn hoá: tách bởi dấu phẩy, trim từng phần, bỏ phần rỗng, nối lại
  str = str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(", ");
  return str;
};

const BomPreviewMapped = computed(() => {
  if (!BomPreviewRows.value || BomPreviewRows.value.length === 0) return [];
  const startRow = parseInt(BomSelectedHeaderRow.value) + 1;
  const rawData = BomPreviewRows.value.slice(startRow);
  const mapped = [];
  for (const row of rawData) {
    if (!row || row.length === 0) continue;
    const rawDesignator =
      BomMapping.value.designator !== ""
        ? row[BomMapping.value.designator]
        : "";
    mapped.push({
      description:
        BomMapping.value.description !== ""
          ? row[BomMapping.value.description]
          : "",
      mpn: BomMapping.value.mpn !== "" ? row[BomMapping.value.mpn] : "",
      mpn2: BomMapping.value.mpn2 !== "" ? row[BomMapping.value.mpn2] : "",
      mpn3: BomMapping.value.mpn3 !== "" ? row[BomMapping.value.mpn3] : "",
      designator: BomNormalizeDesignator.value
        ? normalizeBomDesignator(rawDesignator)
        : rawDesignator != null
        ? String(rawDesignator)
        : "",
      quantity:
        BomMapping.value.quantity !== "" ? row[BomMapping.value.quantity] : "",
      note: BomMapping.value.note !== "" ? row[BomMapping.value.note] : "",
    });
  }
  return mapped;
});

const FileBomMountType = ref(null);
const FilePnP = ref(null);
const PnPHeaders = ref([]);
const PnPPreviewRows = ref([]);
const PnPSelectedHeaderRow = ref(0);
const PnPMapping = ref({
  designator: "",
  layer: "",
  posX: "",
  posY: "",
  rotation: "",
  note: "",
});
const PnPNormalizeDesignator = ref(false);
const PnPCleanDirtyData = ref(false);

// Các tùy chọn dòng tiêu đề: hiển thị 15 dòng đầu tiên của file
const PnPHeaderRowOptions = computed(() => {
  return PnPPreviewRows.value.map((row, i) => {
    const preview = row
      .filter((cell) => cell !== null && cell !== undefined && cell !== "")
      .slice(0, 4)
      .join(" | ");
    return {
      title: `Dòng ${i + 1}${preview ? ` — ${preview}` : ""}`,
      value: i,
    };
  });
});
// Regex chuẩn designator: bắt đầu bằng chữ cái, tiếp theo là số (VD: R1, C10, U5, FB3)
const VALID_DESIGNATOR_RE = /^[A-Za-z]+\d+[A-Za-z0-9]*$/;

const PnPPreviewMapped = computed(() => {
  if (!PnPPreviewRows.value || PnPPreviewRows.value.length === 0) return [];
  const startRow = parseInt(PnPSelectedHeaderRow.value) + 1;
  const rawData = PnPPreviewRows.value.slice(startRow);
  const mapped = [];
  for (const row of rawData) {
    if (!row || row.length === 0) continue;
    const designator =
      PnPMapping.value.designator !== ""
        ? row[PnPMapping.value.designator]
        : "";
    const designatorStr = designator != null ? String(designator).trim() : "";
    const isDirty = !VALID_DESIGNATOR_RE.test(designatorStr);
    if (PnPCleanDirtyData.value && isDirty) continue;
    mapped.push({
      designator: designatorStr,
      layer: PnPMapping.value.layer !== "" ? row[PnPMapping.value.layer] : "",
      posX: PnPMapping.value.posX !== "" ? row[PnPMapping.value.posX] : "",
      posY: PnPMapping.value.posY !== "" ? row[PnPMapping.value.posY] : "",
      rotation:
        PnPMapping.value.rotation !== "" ? row[PnPMapping.value.rotation] : "",
      note: PnPMapping.value.note !== "" ? row[PnPMapping.value.note] : "",
      _dirty: isDirty,
    });
  }
  return mapped;
});

const titleBomhighlight = ref("");

// Mặt PCB hiện tại (dùng cho việc lọc danh sách PnP)
const selectedLayer = ref("Top");

// --- DigiKey API States ---
const GetDigikey = ref("");
const accessToken = ref(null);
const tokenType = ref(null);
const digikeyTokenExpireTime = ref(0);
const ResultSearch = ref(null);

// --- Diaglog Image States ---
const dialogImageUrl = ref("");
const dialogRotation = ref(0);

// --- Table & Data States ---
const Headers = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator" },
  { title: "MPN", key: "mpn", width: "200px" },
  { title: "X (mm)", key: "x" },
  { title: "Y (mm)", key: "y" },
  { title: "Rotation", key: "rotation" },
  { title: "Layer", key: "layer" },
  // { title: "Type", key: "type" },
  { title: "Description", key: "description_bom", width: "150px" },
  { title: "Note", key: "note", width: "150px" },
  { title: "Thao tác", key: "id", sortable: false },
];

const baseHeaders = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator" },
  { title: "MPN", key: "mpn", width: "200px" },
  { title: "MPN#2", key: "mpn2", width: "200px" },
  { title: "MPN#3", key: "mpn3", width: "200px" },
  { title: "Description", key: "description" },
  { title: "Quantity", key: "quantity" },
  { title: "Type", key: "type" },
  { title: "Note", key: "note", width: "100px" },
  { title: "Image", key: "image", width: "200px" },
  { title: "Thiếu Pickplace", key: "is_missing", width: "50px" },
  { title: "Thao tác", key: "id", sortable: false },
];

const compareHeader = [
  { title: "STT", value: "stt", width: "60px" },
  {
    title: "Bom cũ",
    align: "center",
    children: [
      { title: "Designator", value: "old_designator", width: "120px" },
      { title: "MPN", value: "old_mpn", width: "180px" },
      { title: "Description", value: "old_description" },
    ],
  },
  {
    title: "Bom mới",
    align: "center",
    children: [
      { title: "Designator", value: "new_designator", width: "120px" },
      { title: "MPN", value: "new_mpn", width: "180px" },
      { title: "Description", value: "new_description" },
    ],
  },
  {
    title: "Trạng thái",
    value: "status",
    width: "120px",
  },
];
const PnPCompareHeader = [
  { title: "STT", value: "stt", width: "60px" },
  {
    title: "Pickplace cũ",
    align: "center",
    children: [
      { title: "Designator", value: "old_designator", width: "110px" },
      { title: "X", value: "old_x", width: "80px" },
      { title: "Y", value: "old_y", width: "80px" },
      { title: "Rotation", value: "old_rotation", width: "90px" },
      { title: "Layer", value: "old_layer", width: "90px" },
    ],
  },
  {
    title: "Pickplace mới",
    align: "center",
    children: [
      { title: "Designator", value: "new_designator", width: "110px" },
      { title: "X", value: "new_x", width: "80px" },
      { title: "Y", value: "new_y", width: "80px" },
      { title: "Rotation", value: "new_rotation", width: "90px" },
      { title: "Layer", value: "new_layer", width: "90px" },
    ],
  },
  {
    title: "Trạng thái",
    value: "status",
    width: "120px",
  },
];
const HeadersRawBomHighlight = computed(() => {
  const hasMpn2 = rawBomHighlight.value.some(
    (item) => item.mpn2 && item.mpn2.toString().trim() !== "",
  );

  const hasMpn3 = rawBomHighlight.value.some(
    (item) => item.mpn3 && item.mpn3.toString().trim() !== "",
  );

  return baseHeaders.filter((header) => {
    if (header.key === "mpn2" && !hasMpn2) {
      return false;
    }

    if (header.key === "mpn3" && !hasMpn3) {
      return false;
    }

    return true;
  });
});

const searchBom = ref("");
const searchBomHighlight = ref("");
const filterBomHighlightType = ref([]);
const filterBomHighlightHasImage = ref(null);
const filterBomHighlightIsMissing = ref(null);
const filterCombineBomMPNMissing = ref(null);

const filteredCombineBom = computed(() => {
  let items = combineBom.value || [];
  if (filterCombineBomMPNMissing.value === true) {
    items = items.filter(
      (item) => !item.mpn || item.mpn.toString().trim() === "",
    );
  }
  return items;
});

const filteredBomHighlight = computed(() => {
  let items = rawBomHighlight.value;

  if (filterBomHighlightType.value.length > 0) {
    items = items.filter((item) =>
      filterBomHighlightType.value.includes(item.type || "SMT"),
    );
  }
  if (filterBomHighlightHasImage.value === true) {
    items = items.filter((item) => {
      const imgs = safeParse(item.image);
      return Array.isArray(imgs) && imgs.length > 0;
    });
  }
  if (filterBomHighlightIsMissing.value === true) {
    items = items.filter(
      (item) => item.is_missing && item.is_missing.trim() !== "",
    );
  }
  return items;
});
const itemsPerPageBom = ref(20);
const pageBom = ref(1);
const itemsPerPageBomHighlight = ref(20);
const pageBomHighlight = ref(1);
const pagePnPCompare = ref(1);

const GetIDPnP = ref("");
const PnP_Angle_Edit = ref("");
const PnP_X_Edit = ref("");
const PnP_Y_Edit = ref("");
const PnP_Type_Edit = ref("");
const PnP_Layer_Edit = ref("");
const MPN_Type_Edit = ref("");
const MPN_Name_Edit = ref("");
const MPN_Description_Edit = ref("");
const MPN_Image_Edit = ref("");
const infoProjectName = ref("");
const infoCreatedBy = ref("");

// ==========================================
// 4. COMPUTED PROPERTIES
// ==========================================

const filteredPnP = computed(() => {
  const list = detailPnP.value || [];
  return list.filter((p) => {
    // Nếu đang chọn mặt Top, chấp nhận cả "Top" và "TopLayer"
    if (selectedLayer.value === "Top" || selectedLayer.value === "WG Top") {
      return (
        p.layer === "Top" ||
        p.layer === "TopLayer" ||
        p.layer === "TOP" ||
        p.layer === "TOPLAYER"
      );
    }
    // Nếu đang chọn mặt Bottom, chấp nhận cả "Bottom" và "BottomLayer"
    if (
      selectedLayer.value === "Bottom" ||
      selectedLayer.value === "WG Bottom"
    ) {
      return (
        p.layer === "Bottom" ||
        p.layer === "BottomLayer" ||
        p.layer === "BOTTOM" ||
        p.layer === "BOTTOMLAYER"
      );
    }
    return false;
  });
});
// ==========================================
// 7. CORE FUNCTIONS
// ==========================================

// --- 7.1 File Upload Handlers ---

/**
 * Upload file BOM (.xlsx) lên server và cập nhật danh sách BOM cho project
 */
const uploadBOM = async () => {
  if (checkLock()) return;
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("FileBom", FileBom.value);
    formData.append("created_by", Username.value);
    formData.append("headerRowIndex", BomSelectedHeaderRow.value);
    formData.append("columnMapping", JSON.stringify(BomMapping.value));
    formData.append("normalizeDesignator", BomNormalizeDesignator.value);

    await axios.post(`${Url}/UploadPCB/upload-bom-pcb/${id}`, formData);
    DialogSuccess.value = true;
    MessageDialog.value = "Upload Bom thành công";
    DialogAddBom.value = false;
    FileBom.value = null;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error || "Upload Bom thất bại";
    console.error("Lỗi upload BOM:", error);
    DialogLoading.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

const uploadBOMMountType = async () => {
  if (checkLock()) return;
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("FileBomMountType", FileBomMountType.value);
    formData.append("created_by", localStorage.getItem("Username"));
    await axios.post(`${Url}/UploadPCB/upload-bom-highlight/${id}`, formData);
    DialogSuccess.value = true;
    MessageDialog.value = "Upload Bom thành công";
    DialogAddBomMountType.value = false;
    FileBomMountType.value = null;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error || "Upload Bom thất bại";
    DialogLoading.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

/**
 * Upload file Pick & Place (.xlsx) lên server và cập nhật tọa độ linh kiện
 */
const uploadPNP = async () => {
  if (checkLock()) return;
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("FilePnP", FilePnP.value);
    formData.append("created_by", Username.value);
    formData.append("headerRowIndex", PnPSelectedHeaderRow.value);
    formData.append("columnMapping", JSON.stringify(PnPMapping.value));
    formData.append("normalizeDesignator", PnPNormalizeDesignator.value);
    formData.append("cleanDirtyData", PnPCleanDirtyData.value);

    await axios.post(`${Url}/UploadPCB/upload-pickplace-pcb/${id}`, formData);
    DialogSuccess.value = true;
    MessageDialog.value = "Upload Pick&Place thành công";
    DialogAddPnP.value = false;
    FilePnP.value = null;
    DialogLoading.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error || "Upload Pick&Place thất bại";
    console.error("Lỗi upload PickPlace:", error);
    DialogLoading.value = false;
  }
};

watch(FilePnP, async (newFile) => {
  if (newFile) {
    try {
      const arrayBuffer = await newFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: true,
      });

      PnPPreviewRows.value = jsonData.slice(0, 15);
      PnPSelectedHeaderRow.value = 0;
      updatePnPHeaders();
    } catch (error) {
      console.error("Lỗi đọc file PnP", error);
    }
  } else {
    PnPPreviewRows.value = [];
    PnPHeaders.value = [];
  }
});

watch(FileBom, async (newFile) => {
  if (newFile) {
    try {
      const arrayBuffer = await newFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: true,
      });

      BomPreviewRows.value = jsonData.slice(0, 5);
      BomSelectedHeaderRow.value = 0;
      updateBomHeaders();
    } catch (error) {
      console.error("Lỗi đọc file BOM", error);
    }
  } else {
    BomPreviewRows.value = [];
    BomHeaders.value = [];
  }
});

const updateBomHeaders = () => {
  if (BomPreviewRows.value.length > BomSelectedHeaderRow.value) {
    const row = BomPreviewRows.value[BomSelectedHeaderRow.value];
    BomHeaders.value = row
      ? row.map((h, i) => ({ title: h || `Cột ${i + 1}`, value: i }))
      : [];

    const getMatch = (h, regex) => regex.test(String(h.title).toLowerCase());

    BomMapping.value = {
      description:
        BomHeaders.value.find((h) => getMatch(h, /desc/))?.value ?? "",
      mpn:
        BomHeaders.value.find((h) => getMatch(h, /mpn|comment|part/))?.value ??
        "",
      mpn2: BomHeaders.value.find((h) => getMatch(h, /mpn2/))?.value ?? "",
      mpn3: BomHeaders.value.find((h) => getMatch(h, /mpn3/))?.value ?? "",
      designator:
        BomHeaders.value.find((h) => getMatch(h, /ref|des|designator/))
          ?.value ?? "",
      quantity:
        BomHeaders.value.find((h) => getMatch(h, /qty|quantity/))?.value ?? "",
      note:
        BomHeaders.value.find((h) => getMatch(h, /note|remark/))?.value ?? "",
    };
  }
};

watch(BomSelectedHeaderRow, updateBomHeaders);

watch(FileBomNew, async (newFile) => {
  if (newFile) {
    try {
      const arrayBuffer = await newFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: true,
      });
      BomNewFullRows.value = jsonData;
      BomNewPreviewRows.value = jsonData.slice(0, 15);
      BomNewSelectedHeaderRow.value = 0;
      updateBomNewHeaders();
    } catch (error) {
      console.error("Lỗi đọc file BOM mới", error);
    }
  } else {
    BomNewFullRows.value = [];
    BomNewPreviewRows.value = [];
  }
});

const updateBomNewHeaders = () => {
  if (BomNewPreviewRows.value.length > BomNewSelectedHeaderRow.value) {
    const row = BomNewPreviewRows.value[BomNewSelectedHeaderRow.value];
    const headers = row
      ? row.map((h, i) => ({ title: h || `Cột ${i + 1}`, value: i }))
      : [];
    const getMatch = (h, regex) => regex.test(String(h).toLowerCase());
    BomNewMapping.value = {
      description: headers.find((h) => getMatch(h.title, /desc/))?.value ?? "",
      mpn:
        headers.find((h) => getMatch(h.title, /mpn|comment|part/))?.value ?? "",
      mpn2: headers.find((h) => getMatch(h.title, /mpn2/))?.value ?? "",
      mpn3: headers.find((h) => getMatch(h.title, /mpn3/))?.value ?? "",
      designator:
        headers.find((h) => getMatch(h.title, /ref|des|designator/))?.value ??
        "",
      quantity:
        headers.find((h) => getMatch(h.title, /qty|quantity/))?.value ?? "",
      note: headers.find((h) => getMatch(h.title, /note|remark/))?.value ?? "",
    };
  }
};

watch(BomNewSelectedHeaderRow, updateBomNewHeaders);

const mapBomNewRows = (rows) => {
  const startRow = parseInt(BomNewSelectedHeaderRow.value) + 1;
  const rawData = rows.slice(startRow);
  const mapped = [];
  for (const row of rawData) {
    if (!row || row.length === 0) continue;
    const rawDesignator =
      BomNewMapping.value.designator !== ""
        ? row[BomNewMapping.value.designator]
        : "";
    mapped.push({
      description:
        BomNewMapping.value.description !== ""
          ? row[BomNewMapping.value.description]
          : "",
      mpn: BomNewMapping.value.mpn !== "" ? row[BomNewMapping.value.mpn] : "",
      designator: BomNewNormalizeDesignator.value
        ? normalizeBomDesignator(rawDesignator)
        : rawDesignator != null
        ? String(rawDesignator)
        : "",
      quantity:
        BomNewMapping.value.quantity !== ""
          ? row[BomNewMapping.value.quantity]
          : "",
      note:
        BomNewMapping.value.note !== "" ? row[BomNewMapping.value.note] : "",
    });
  }
  return mapped;
};

const BomNewPreviewMapped = computed(() => {
  if (!BomNewPreviewRows.value || BomNewPreviewRows.value.length === 0)
    return [];
  return mapBomNewRows(BomNewPreviewRows.value);
});

const BomNewFullMapped = computed(() => {
  if (!BomNewFullRows.value || BomNewFullRows.value.length === 0) return [];
  return mapBomNewRows(BomNewFullRows.value);
});

const BomNewHeaderOptions = computed(() => {
  if (BomNewPreviewRows.value.length > BomNewSelectedHeaderRow.value) {
    const row = BomNewPreviewRows.value[BomNewSelectedHeaderRow.value];
    return row
      ? row.map((h, i) => ({ title: h || `Cột ${i + 1}`, value: i }))
      : [];
  }
  return [];
});

const applyBomNewCompare = () => {
  BomNewApplied.value = BomNewFullMapped.value;
  DialogAddBomNew.value = false;
};

const splitDesignators = (str) => {
  if (str == null) return [];
  return String(str)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const normMpn = (mpn) =>
  mpn != null ? String(mpn).replace(/\s+/g, "").toLowerCase() : "";

const bomCompareRows = computed(() => {
  const oldItems = rawBomHighlight.value || [];
  const newItems = BomNewApplied.value;
  const noNewData = newItems.length === 0;

  const newMap = new Map();
  newItems.forEach((row) => {
    const newMpn = normMpn(row.mpn);
    splitDesignators(row.designator).forEach((ref) => {
      const key = ref.toUpperCase();
      if (!newMap.has(key)) {
        newMap.set(key, {
          ref,
          mpn: newMpn,
          mpnRaw: row.mpn,
          description: row.description,
          used: false,
        });
      }
    });
  });

  const rows = [];

  oldItems.forEach((item) => {
    const oldRefs = splitDesignators(item.designator);
    const oldMpnNorm = normMpn(item.mpn);

    const oldList = [];
    const newList = [];

    let anyDiff = oldRefs.length === 0;

    oldRefs.forEach((ref) => {
      const key = ref.toUpperCase();
      if (noNewData) {
        oldList.push({ ref, mpn: item.mpn, diff: false });
        newList.push(null);
        return;
      }

      const nEntry = newMap.get(key);
      if (nEntry) {
        nEntry.used = true;
        if (nEntry.mpn === oldMpnNorm) {
          oldList.push({ ref, mpn: item.mpn, diff: false });
          newList.push({
            ref,
            mpn: nEntry.mpnRaw,
            diff: false,
            desc: nEntry.description,
          });
        } else {
          anyDiff = true;
          oldList.push({ ref, mpn: item.mpn, diff: true });
          newList.push({
            ref,
            mpn: nEntry.mpnRaw,
            diff: true,
            desc: nEntry.description,
          });
        }
      } else {
        anyDiff = true;
        oldList.push({ ref, mpn: item.mpn, diff: true });
        newList.push(null);
      }
    });

    if (!noNewData) {
      const extraNew = [];
      newMap.forEach((n, key) => {
        if (n.used) return;
        if (n.mpn !== oldMpnNorm) return;
        if (oldList.some((o) => o.ref.toUpperCase() === key)) return;
        extraNew.push(n);
      });
      if (extraNew.length > 0) {
        anyDiff = true;
        extraNew.forEach((n) => {
          n.used = true;
          newList.push({
            ref: n.ref,
            mpn: n.mpnRaw,
            diff: true,
            desc: n.description,
          });
        });
      }
    }

    const newDescList = newList
      .filter(Boolean)
      .map((x) => x.desc)
      .filter(Boolean);
    rows.push({
      id: `row_${rows.length}`,
      oldList,
      newList,
      old_designator: oldList.length
        ? oldList.map((x) => x.ref).join(", ")
        : "",
      new_designator: newList.length
        ? newList
            .filter(Boolean)
            .map((x) => x.ref)
            .join(", ")
        : "",
      old_mpn: item.mpn || "",
      new_mpn: newList.length
        ? [...new Set(newList.filter(Boolean).map((x) => x.mpn))].join(", ")
        : "",
      old_description: item.description || "",
      new_description:
        newDescList.length > 0 ? [...new Set(newDescList)].join(", ") : "",
      status: noNewData ? "none" : anyDiff ? "change" : "match",
      extraAdded: newList.filter(Boolean).some((x) => x.diff),
    });
  });

  if (!noNewData) {
    const newGrouped = new Map();
    newMap.forEach((n) => {
      if (n.used) return;
      if (!newGrouped.has(n.mpn)) {
        newGrouped.set(n.mpn, { mpnRaw: n.mpnRaw, refs: new Set() });
      }
      newGrouped.get(n.mpn).refs.add(n.ref);
    });

    newGrouped.forEach((grp) => {
      const refs = [...grp.refs];
      rows.push({
        id: `row_${rows.length}`,
        oldList: [],
        newList: refs.map((ref) => ({
          ref,
          mpn: grp.mpnRaw,
          diff: true,
          desc: "",
        })),
        old_designator: "",
        new_designator: refs.join(", "),
        old_mpn: "",
        new_mpn: grp.mpnRaw,
        old_description: "",
        new_description: "",
        status: "new",
        extraAdded: true,
      });
    });
  }

  return rows;
});

const updatePickplaceNewHeaders = () => {
  if (PkNewPreviewRows.value.length > PkNewSelectedHeaderRow.value) {
    const row = PkNewPreviewRows.value[PkNewSelectedHeaderRow.value];
    const headers = row
      ? row.map((h, i) => ({ title: h || `Cột ${i + 1}`, value: i }))
      : [];
    const getMatch = (h, regex) => regex.test(String(h.title).toLowerCase());

    PkNewMapping.value = {
      designator:
        headers.find((h) => getMatch(h, /ref|des|designator/))?.value ?? "",
      layer: headers.find((h) => getMatch(h, /layer|side/))?.value ?? "",
      posX:
        headers.find((h) =>
          getMatch(h, /\bx\b|posx|mid x|ref x|pad x|center x/),
        )?.value ?? "",
      posY:
        headers.find((h) =>
          getMatch(h, /\by\b|posy|mid y|ref y|pad y|center y/),
        )?.value ?? "",
      rotation:
        headers.find((h) => getMatch(h, /\br\b|rot|rotation/))?.value ?? "",
      note: headers.find((h) => getMatch(h, /note|comment|desc/))?.value ?? "",
    };
  }
};
watch(PkNewSelectedHeaderRow, updatePickplaceNewHeaders);

const mapPkNewRows = (rows) => {
  const startRow = parseInt(PkNewSelectedHeaderRow.value) + 1;
  const rawData = rows.slice(startRow);
  const mapped = [];
  for (const row of rawData) {
    if (!row || row.length === 0) continue;
    const designator =
      PkNewMapping.value.designator !== ""
        ? row[PkNewMapping.value.designator]
        : "";
    const designatorStr = designator != null ? String(designator).trim() : "";
    const isDirty = !VALID_DESIGNATOR_RE.test(designatorStr);
    if (PkNewCleanDirtyData.value && isDirty) continue;
    mapped.push({
      designator: designatorStr,
      layer:
        PkNewMapping.value.layer !== "" ? row[PkNewMapping.value.layer] : "",
      posX:
        PkNewMapping.value.posX !== ""
          ? Number(Number(row[PkNewMapping.value.posX]).toFixed(2))
          : "",
      posY:
        PkNewMapping.value.posY !== ""
          ? Number(Number(row[PkNewMapping.value.posY]).toFixed(2))
          : "",
      rotation:
        PkNewMapping.value.rotation !== ""
          ? row[PkNewMapping.value.rotation]
          : "",
      note: PkNewMapping.value.note !== "" ? row[PkNewMapping.value.note] : "",
      _dirty: isDirty,
    });
  }
  return mapped;
};

const PkNewPreviewMapped = computed(() => {
  if (!PkNewPreviewRows.value || PkNewPreviewRows.value.length === 0) return [];
  return mapPkNewRows(PkNewPreviewRows.value);
});

const PkNewFullMapped = computed(() => {
  if (!PkNewFullRows.value || PkNewFullRows.value.length === 0) return [];
  return mapPkNewRows(PkNewFullRows.value);
});

const PkNewHeaderRowOptions = computed(() => {
  return PkNewPreviewRows.value.map((row, i) => {
    const preview = row
      .filter((cell) => cell !== null && cell !== undefined && cell !== "")
      .slice(0, 4)
      .join(" | ");
    return {
      title: `Dòng ${i + 1}${preview ? ` — ${preview}` : ""}`,
      value: i,
    };
  });
});

const applyPickplaceNewCompare = () => {
  PkNewApplied.value = PkNewFullMapped.value;
  DialogAddPickplaceNew.value = false;
};

watch(FilePickplaceNew, async (newFile) => {
  if (newFile) {
    try {
      const arrayBuffer = await newFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        blankrows: true,
      });
      PkNewFullRows.value = jsonData;
      PkNewPreviewRows.value = jsonData.slice(0, 15);
      PkNewSelectedHeaderRow.value = 0;
      updatePickplaceNewHeaders();
    } catch (error) {
      console.error("Lỗi đọc file Pickplace mới", error);
    }
  } else {
    PkNewFullRows.value = [];
    PkNewPreviewRows.value = [];
  }
});

const numOrNull = (v) => {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return isNaN(n) ? String(v).trim() : Number(n.toFixed(2));
};

const sameCoord = (a, b) => String(a).trim() === String(b).trim();

const pnpCompareRows = computed(() => {
  const oldItems = detailPnP.value || [];
  const newItems = PkNewApplied.value;
  const noNewData = newItems.length === 0;

  const oldMap = new Map();
  oldItems.forEach((item) => {
    const key = String(item.designator || "").toUpperCase();
    if (!key) return;
    oldMap.set(key, {
      designator: item.designator,
      x: numOrNull(item.x),
      y: numOrNull(item.y),
      rotation: numOrNull(item.rotation),
      layer: item.layer != null ? String(item.layer).trim() : "",
    });
  });

  const newMap = new Map();
  newItems.forEach((item) => {
    const key = String(item.designator || "").toUpperCase();
    if (!key) return;
    newMap.set(key, {
      designator: item.designator,
      x: numOrNull(item.posX),
      y: numOrNull(item.posY),
      rotation: numOrNull(item.rotation),
      layer: item.layer != null ? String(item.layer).trim() : "",
      used: false,
    });
  });

  const rows = [];

  oldMap.forEach((old, key) => {
    const n = newMap.get(key);
    const oldRow = {
      designator: old.designator,
      x: old.x,
      y: old.y,
      rotation: old.rotation,
      layer: old.layer,
      diffFields: {},
    };
    const newRow = n
      ? {
          designator: n.designator,
          x: n.x,
          y: n.y,
          rotation: n.rotation,
          layer: n.layer,
          diffFields: {},
        }
      : null;

    let status = "match";
    if (noNewData) {
      status = "none";
      rows.push({
        id: `pnp_row_${rows.length}`,
        oldList: [oldRow],
        newList: [null],
        old_designator: old.designator,
        old_x: old.x,
        old_y: old.y,
        old_rotation: old.rotation,
        old_layer: old.layer,
        new_designator: "",
        new_x: "",
        new_y: "",
        new_rotation: "",
        new_layer: "",
        status,
      });
      return;
    }

    if (!n) {
      status = "remove";
    } else {
      n.used = true;
      ["x", "y", "rotation", "layer"].forEach((f) => {
        if (!sameCoord(old[f], n[f])) {
          status = "change";
          oldRow.diffFields[f] = true;
          newRow.diffFields[f] = true;
        }
      });
    }

    rows.push({
      id: `pnp_row_${rows.length}`,
      oldList: [oldRow],
      newList: newRow ? [newRow] : [null],
      old_designator: old.designator,
      old_x: old.x,
      old_y: old.y,
      old_rotation: old.rotation,
      old_layer: old.layer,
      new_designator: newRow ? n.designator : "",
      new_x: newRow ? n.x : "",
      new_y: newRow ? n.y : "",
      new_rotation: newRow ? n.rotation : "",
      new_layer: newRow ? n.layer : "",
      status,
    });
  });

  if (!noNewData) {
    newMap.forEach((n) => {
      if (n.used) return;
      rows.push({
        id: `pnp_row_${rows.length}`,
        oldList: [null],
        newList: [
          {
            designator: n.designator,
            x: n.x,
            y: n.y,
            rotation: n.rotation,
            layer: n.layer,
            diffFields: {},
          },
        ],
        old_designator: "",
        old_x: "",
        old_y: "",
        old_rotation: "",
        old_layer: "",
        new_designator: n.designator,
        new_x: n.x,
        new_y: n.y,
        new_rotation: n.rotation,
        new_layer: n.layer,
        status: "add",
      });
    });
  }

  return rows;
});

const updatePnPHeaders = () => {
  if (PnPPreviewRows.value.length > PnPSelectedHeaderRow.value) {
    const row = PnPPreviewRows.value[PnPSelectedHeaderRow.value];
    PnPHeaders.value = row
      ? row.map((h, i) => ({ title: h || `Cột ${i + 1}`, value: i }))
      : [];

    // Auto-map based on common keywords
    const getMatch = (h, regex) => regex.test(String(h.title).toLowerCase());

    PnPMapping.value = {
      designator:
        PnPHeaders.value.find((h) => getMatch(h, /ref|des|designator/))
          ?.value ?? "",
      layer:
        PnPHeaders.value.find((h) => getMatch(h, /layer|side/))?.value ?? "",
      posX:
        PnPHeaders.value.find((h) =>
          getMatch(h, /\bx\b|posx|mid x|ref x|pad x/),
        )?.value ?? "",
      posY:
        PnPHeaders.value.find((h) =>
          getMatch(h, /\by\b|posy|mid y|ref y|pad y/),
        )?.value ?? "",
      rotation:
        PnPHeaders.value.find((h) => getMatch(h, /\br\b|rot|rotation/))
          ?.value ?? "",
      note:
        PnPHeaders.value.find((h) => getMatch(h, /note|comment|desc/))?.value ??
        "",
    };
  }
};

watch(PnPSelectedHeaderRow, updatePnPHeaders);

// --- 7.2 Data Edit/Update Handlers ---

/**
 * Mở dialog chỉnh sửa và điền thông tin Pick & Place của item được chọn
 * @param {Object} item - Đối tượng linh kiện từ bảng BOM/PnP
 */
const GetItemEdit = (item) => {
  if (checkLock()) return;
  DialogEdit.value = true;
  GetIDPnP.value = item.id;
  PnP_X_Edit.value = item.x;
  PnP_Y_Edit.value = item.y;
  PnP_Angle_Edit.value = item.rotation;
  PnP_Type_Edit.value = item.type;
  PnP_Layer_Edit.value = item.layer;
};

const GetItemBomEdit = (item) => {
  if (checkLock()) return;
  DialogEditType.value = true;
  GetIDPnP.value = item.id;
  MPN_Type_Edit.value = item.type;
  MPN_Name_Edit.value = item.mpn;
  MPN_Description_Edit.value = item.description;
  MPN_Image_Edit.value = item.image;
  infoProjectName.value = item.project_name;
  infoCreatedBy.value = item.created_by;
};

/**
 * Lưu thông tin Pick & Place đã chỉnh sửa (toạ độ X/Y, góc, layer, loại hàn)
 */
const SaveEditPnP = async () => {
  if (checkLock()) return;
  DialogLoading.value = true;
  const formData = reactive({
    x: PnP_X_Edit.value,
    y: PnP_Y_Edit.value,
    rotation: PnP_Angle_Edit.value,
    type: PnP_Type_Edit.value,
    layer: PnP_Layer_Edit.value,
  });

  try {
    const response = await axios.put(
      `${Url}/Pickplace-BomPCB/Edit-item-pickplace/${GetIDPnP.value}`,
      formData,
    );
    DialogLoading.value = false;
    DialogEdit.value = false;
    DialogSuccess.value = true;
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
  } catch (error) {
    DialogLoading.value = false;
    DialogEdit.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error || "Chỉnh sửa dữ liệu thất bại";
  }
};

const SaveEditType = async () => {
  if (checkLock()) return;
  DialogLoading.value = true;

  try {
    // =========================
    // UPDATE BOM HIGHLIGHT
    // =========================
    const formData = new FormData();
    formData.append("type", MPN_Type_Edit.value);

    // Chỉ append khi là file mới (và xử lý nếu nó là file đơn lẻ hoặc phần tử đầu tiên của mảng)
    const singleFile = Array.isArray(MPN_Image_Edit.value)
      ? MPN_Image_Edit.value[0]
      : MPN_Image_Edit.value;
    if (singleFile instanceof File) {
      formData.append("image", singleFile);
    }

    await axios.put(
      `${Url}/Pickplace-BomPCB/Edit-item-bomhighlight/${GetIDPnP.value}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    // Kiểm tra xem người dùng có chọn file mới nào để upload không
    const hasNewImages = Array.isArray(MPN_Image_Edit.value)
      ? MPN_Image_Edit.value.length > 0
      : !!MPN_Image_Edit.value;

    // =========================
    // ADD MPN MOUNT TYPE (Chỉ chạy khi thực sự có ảnh mới)
    // =========================
    if (hasNewImages) {
      const formDataMountType = new FormData();

      formDataMountType.append("mpn", MPN_Name_Edit.value);
      formDataMountType.append("mount_type", MPN_Type_Edit.value);
      formDataMountType.append("description", MPN_Description_Edit.value);
      formDataMountType.append("project_id", route.params.id);
      formDataMountType.append("created_by", localStorage.getItem("Username"));

      // 🔥 FIX: Lặp qua mảng file một cách an toàn
      if (Array.isArray(MPN_Image_Edit.value)) {
        MPN_Image_Edit.value.forEach((file) => {
          if (file instanceof File) {
            formDataMountType.append("image", file);
          }
        });
      } else if (MPN_Image_Edit.value instanceof File) {
        formDataMountType.append("image", MPN_Image_Edit.value);
      }

      await axios.post(
        `${Url}/Pickplace-BomPCB/Add-item-mpntype`,
        formDataMountType,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
    }

    // =========================
    // DELETE (Chạy khi có yêu cầu xóa ảnh và KHÔNG upload thêm ảnh mới)
    // =========================
    if (MPN_Type_Edit.value === "SMT" && !hasNewImages && ImageToDelete.value) {
      await axios.delete(`${Url}/Pickplace-BomPCB/Delete-item-mpntype-image`, {
        data: {
          mpnName: MPN_Name_Edit.value,
          image: ImageToDelete.value,
        },
      });
    }

    const noImage =
      MPN_Image_Edit.value == null ||
      (Array.isArray(MPN_Image_Edit.value) &&
        MPN_Image_Edit.value.length === 0);

    if (MPN_Type_Edit.value !== "SMT" && noImage) {
      await axios.delete(
        `${Url}/Pickplace-BomPCB/Delete-item-mpntype/${MPN_Name_Edit.value}`,
      );
    }
    console.log(MPN_Name_Edit.value);
    DialogLoading.value = false;
    DialogEditType.value = false;
    DialogSuccess.value = true;
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
  } catch (error) {
    console.error(error);

    DialogLoading.value = false;
    DialogEditType.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error || "Chỉnh sửa dữ liệu thất bại";
  }
};

const DeleteAllBomHighlight = async () => {
  if (checkLock()) return;
  DialogLoading.value = true;
  try {
    await axios.delete(
      `${Url}/Pickplace-BomPCB/Delete-item-bomhighlight/${id}`,
    );

    await axios.delete(`${Url}/Pickplace-BomPCB/Delete-item-bom/${id}`);

    DialogSuccess.value = true;
    MessageDialog.value = "Xóa dữ liệu thành công";
    rawBomHighlight.value = [];
    DialogDeleteBomHighlight.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error || "Xóa dữ liệu thất bại";
    DialogDeleteBomHighlight.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

const DeleteAllPickPlace = async () => {
  if (checkLock()) return;
  DialogLoading.value = true;
  try {
    await axios.delete(`${Url}/Pickplace-BomPCB/Delete-item-pickplace/${id}`);
    DialogSuccess.value = true;
    MessageDialog.value = "Xóa dữ liệu thành công";
    DialogDeletePickPlace.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error || "Xóa dữ liệu thất bại";
    DialogDeletePickPlace.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

const RemoveImage = async () => {
  if (checkLock()) return;
  DialogLoading.value = true;

  try {
    await axios.delete(
      `${Url}/Pickplace-BomPCB/Delete-item-mpntype-image/${MPN_Name_Edit.value}`,
      {
        data: {
          image: ImageToDelete.value,
        },
      },
    );

    DialogSuccess.value = true;
    MessageDialog.value = "Xóa ảnh thành công";
    DialogRemoveImage.value = false;
    ImageToDelete.value = "";
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error || "Xóa ảnh thất bại";
    DialogRemoveImage.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

// --- 7.3 Table Sort / Filter ---

/** Lọc bảng BOM – chỉ hiển thị linh kiện mặt Top */
const SortTop = () => {
  searchBom.value = "Top";
};

/** Lọc bảng BOM – chỉ hiển thị linh kiện mặt Bottom */
const SortBottom = () => {
  searchBom.value = "Bottom";
};

/** Lọc bảng BOM – chỉ hiển thị linh kiện kiểu SMT */

/** Lọc bảng BOM – chỉ hiển thị linh kiện hàn tay */

/** Xóa bộ lọc – hiển thị tất cả linh kiện */
const ResetSort = () => {
  searchBom.value = "";
};

// ==========================================
// 7.5 DOWNLOAD HANDLERS
// ==========================================

/**
 * Tải file Pick & Place tổng hợp (cả Top + Bottom) từ server
 */
const DownloadPnP = async () => {
  try {
    const response = await fetch(
      `${Url}/DownloadPCB/download-pickplace-all/${id}`,
    );
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `PnP_TOPbot.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    MessageErrorDialog.value = "Tải file thất bại";
    console.error("Error downloading file:", error);
  }
};

/** Tải file Pick & Place chỉ dành cho mặt Top từ server */
const DownloadPnPTop = async () => {
  try {
    const response = await fetch(
      `${Url}/DownloadPCB/download-pickplace-top/${id}`,
    );
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `PickPlace_TOP.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    MessageErrorDialog.value = "Tải file thất bại";
    console.error("Error downloading file:", error);
  }
};

/** Tải file Pick & Place chỉ dành cho mặt Bottom từ server */
const DownloadPnPBottom = async () => {
  try {
    const response = await fetch(
      `${Url}/DownloadPCB/download-pickplace-bottom/${id}`,
    );
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `PickPlace_bot.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    MessageErrorDialog.value = "Tải file thất bại";
    console.error("Error downloading file:", error);
  }
};

/** Tải file BOM Highlight (phân loại theo bề mặt và trạng thái review) từ server */
const DownloadBomHighlight = async () => {
  try {
    const title = encodeURIComponent(
      titleBomhighlight.value || "BOM HIGHLIGHT",
    );

    const response = await fetch(
      `${Url}/DownloadPCB/download-bom-highlight/${id}?title=${title}`,
    );

    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${titleBomhighlight.value || "BomHighlight"}.xlsx`;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    DialogDownloadBomHighlight.value = false;
  } catch (error) {
    MessageErrorDialog.value = "Tải file thất bại";
    console.error("Error downloading file:", error);
  }
};

const statsReportMissing = computed(() => {
  let missingPnPDsnList = [];
  let missingMPNDsnList = [];

  // Sheet 1: từ filteredBomHighlight (những component thiếu PickPlace)
  const bomHighlightItems = filteredBomHighlight.value || [];
  bomHighlightItems.forEach((item) => {
    if (item.is_missing && item.is_missing.trim() !== "") {
      const rawDesignators = (
        item.designators ||
        item.designator ||
        ""
      ).toString();
      if (!rawDesignators) return;
      missingPnPDsnList.push({
        designator: rawDesignators.trim(),
        mpn: item.mpn || "",
        description: item.description || item.description_bom || "",
        quantity: item.quantity || 1,
        note: item.note || "",
        status: "Missing in Pick & Place",
        remark: "Please verify placement data.",
      });
    }
  });

  // Sheet 2: từ filteredCombineBom (những component thiếu MPN)
  const combineBomItems = filteredCombineBom.value || [];
  combineBomItems.forEach((item) => {
    if (!item.mpn || item.mpn.toString().trim() === "") {
      const rawDesignators = (
        item.designators ||
        item.designator ||
        ""
      ).toString();
      if (!rawDesignators) return;
      missingMPNDsnList.push({
        designator: rawDesignators.trim(),
        mpn: "",
        description: item.description || item.description_bom || "",
        quantity: item.quantity || 1,
        type: item.type || "",
        note: item.note || "",
        status: "Missing MPN",
        remark: "Please provide valid MPN.",
      });
    }
  });

  // Tổng số designator trong BOM
  let totalBOMDesignators = 0;
  (combineBom.value || []).forEach((item) => {
    const dsns = (item.designators || item.designator || "")
      .toString()
      .split(/[\s,]+/)
      .filter((d) => d.trim() !== "");
    totalBOMDesignators += dsns.length;
  });

  return {
    totalBOMDesignators,
    totalPnPDesignators: filteredPnP.value ? filteredPnP.value.length : 0,
    missingPnPCount: missingPnPDsnList.length,
    missingMPNCount: missingMPNDsnList.length,
    missingPnPDsnList,
    missingMPNDsnList,
  };
});

// ==========================================
// THỐNG KÊ (STATISTICS) DASHBOARD
// ==========================================
const dashFormatNum = (value) => {
  return Number(value || 0).toLocaleString("en-US");
};

const dashTotalDesignator = computed(() => {
  let total = 0;
  (combineBom.value || []).forEach((item) => {
    const dsns = (item.designators || item.designator || "")
      .toString()
      .split(/[\s,]+/)
      .filter((d) => d.trim() !== "");
    total += dsns.length;
  });
  return total;
});

const dashMissingPnPList = computed(() => {
  return statsReportMissing.value.missingPnPDsnList;
});

const dashMissingMpnList = computed(() => {
  return statsReportMissing.value.missingMPNDsnList;
});

const dashDnpList = computed(() => {
  const items = rawBomHighlight.value || [];
  return items.filter(
    (item) => item.note && item.note.toString().trim().toLowerCase() === "dnp",
  );
});

const dashDonutData = computed(() => {
  return [
    statsBom.value.total.smt,
    statsBom.value.total.handSolder,
    statsBom.value.total.handPlace,
  ];
});

const dashTopMpn = computed(() => {
  const map = new Map();
  (combineBom.value || []).forEach((item) => {
    if (!item.mpn || item.mpn.toString().trim() === "") return;
    const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    const key = item.mpn.trim();
    map.set(key, (map.get(key) || 0) + qty);
  });
  const list = Array.from(map.entries())
    .map(([mpn, count]) => ({ mpn, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const total = list.reduce((s, item) => s + item.count, 0);
  return list.map((item) => ({
    ...item,
    pct: total > 0 ? ((item.count / total) * 100).toFixed(1) + "%" : "0%",
    pctNum: total > 0 ? (item.count / total) * 100 : 0,
  }));
});

const dashTypeQty = computed(() => {
  const pcs = (type) => {
    let qty = 0;
    (rawBomHighlight.value || []).forEach((item) => {
      if ((item.type || "SMT") !== type) return;
      qty += Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    });
    return qty;
  };
  const rows = [
    { type: "SMT", qty: pcs("SMT") },
    { type: "Hàn tay", qty: pcs("Hàn tay") },
    { type: "Gắp tay", qty: pcs("Gắp tay") },
  ];
  const total = rows.reduce((s, r) => s + r.qty, 0);
  return rows.map((r) => ({
    ...r,
    pct: total > 0 ? ((r.qty / total) * 100).toFixed(2) + "%" : "0%",
  }));
});

const generateSheet = (
  worksheet,
  title,
  dataList,
  descriptionText,
  logoId,
  stats = null,
) => {
  // =========================
  // Page Setup
  // =========================
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    verticalCentered: false,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3,
    },
  };

  worksheet.addImage(logoId, {
    tl: {
      col: 0.5,
      row: 0.8,
    },
    ext: {
      width: 70,
      height: 70,
    },
  });
  // 1. Title
  worksheet.mergeCells("A1:E1");

  const titleCell = worksheet.getCell("A1");

  titleCell.value = `${title} Report`;

  titleCell.font = {
    name: "Calibri",
    size: 20,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4E78" },
  };

  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.getRow(1).height = 80;

  // 2. Subtitle
  worksheet.mergeCells("A2:E2");

  const sub = worksheet.getCell("A2");

  sub.value = "SMT Assembly Verification Report";

  sub.font = {
    italic: true,
    size: 11,
    color: { argb: "FF666666" },
  };

  sub.alignment = {
    horizontal: "center",
  };

  // 3. Description
  worksheet.getCell("A4").value = "Description:";
  worksheet.getCell("A4").font = {
    name: "Calibri",
    bold: true,
  };
  worksheet.getCell("A4").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFF2F2F2",
    },
  };

  worksheet.mergeCells("A5:E8");

  const descCell = worksheet.getCell("A5");

  descCell.value = descriptionText;

  descCell.font = {
    name: "Calibri",
    size: 11,
  };

  descCell.alignment = {
    wrapText: true,
    vertical: "top",
    horizontal: "left",
  };

  worksheet.getRow(5).height = 20;
  worksheet.getRow(6).height = 20;
  worksheet.getRow(7).height = 20;
  worksheet.getRow(8).height = 20;

  // 4. Report Information
  worksheet.getCell("A10").value = "Report Information";

  worksheet.getCell("A10").font = {
    bold: true,
  };

  worksheet.getCell("A10").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFF2F2F2",
    },
  };

  worksheet.getCell("A11").value = "Report Date";
  worksheet.getCell("B11").value = new Date().toLocaleDateString();

  worksheet.getCell("A12").value = "Project";
  worksheet.getCell("B12").value = project_name.value;

  worksheet.getCell("A13").value = "Generated By";
  worksheet.getCell("B13").value = "PCB Review Assistant";

  worksheet.getCell("A14").value = "Report Type";
  worksheet.getCell("B14").value = title;

  // 5. Summary
  worksheet.getCell("A16").value = "Summary";
  worksheet.getCell("A16").font = {
    name: "Calibri",
    bold: true,
  };

  worksheet.getCell("A16").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFF2F2F2",
    },
  };

  worksheet.getCell("A17").value = "Total BOM Components";
  worksheet.getCell("B17").value = (
    stats || statsReportMissing.value
  ).totalBOMDesignators;

  worksheet.getCell("A18").value = "Total Pick & Place Components";
  worksheet.getCell("B18").value = (
    stats || statsReportMissing.value
  ).totalPnPDesignators;

  worksheet.getCell("A19").value = "Missing Components";
  worksheet.getCell("B19").value = dataList.length;

  worksheet.getCell("A20").value = "Missing Rate";

  const missingRate =
    (stats || statsReportMissing.value).totalPnPDesignators > 0
      ? (
          (dataList.length /
            (stats || statsReportMissing.value).totalPnPDesignators) *
          100
        ).toFixed(2) + "%"
      : "0.00%";

  worksheet.getCell("B20").value = missingRate;

  // Màu đỏ cho Missing Rate
  worksheet.getCell("B20").font = {
    name: "Calibri",
    bold: true,
    color: {
      argb: "FFFF0000",
    },
  };

  // Căn lề trái toàn bộ Summary
  for (let row = 16; row <= 20; row++) {
    worksheet.getCell(`A${row}`).alignment = {
      horizontal: "left",
      vertical: "middle",
    };

    worksheet.getCell(`B${row}`).alignment = {
      horizontal: "left",
      vertical: "middle",
    };
  }
  // 6. Table Header (starts at row 16)
  worksheet.getCell("A22").value = "Missing Designator List";

  worksheet.getCell("A22").font = {
    bold: true,
    size: 12,
  };
  worksheet.getCell("A22").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFF2F2F2",
    },
  };

  const headerRowIndex = 23;
  const headers = ["Designator", "MPN", "Description", "Quantity", "Note"];
  const headerRow = worksheet.getRow(headerRowIndex);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" },
    };
    cell.font = {
      color: { argb: "F8F9FA" },
      bold: true,
      name: "Calibri",
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD9D9D9" } },
      left: { style: "thin", color: { argb: "FFD9D9D9" } },
      right: { style: "thin", color: { argb: "FFD9D9D9" } },
      bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  worksheet.views = [{ state: "frozen", ySplit: headerRowIndex }];

  // Set columns widths
  worksheet.columns = [
    { key: "designator", width: 40 },
    { key: "mpn", width: 30 },
    { key: "description", width: 45 },
    { key: "quantity", width: 10 },
    { key: "note", width: 25 },
  ];

  // Add Data
  dataList.forEach((item, index) => {
    const row = worksheet.addRow({
      designator: item.designator,
      mpn: item.mpn,
      description: item.description,
      quantity: item.quantity,
      type: item.type,
      note: item.note,
    });

    row.eachCell((cell) => {
      cell.font = { name: "Calibri" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = {
        wrapText: true,
        vertical: "top",
      };
      if (index % 2 !== 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF2F2F2" },
        };
      }
    });
  });

  worksheet.autoFilter = {
    from: `A${headerRowIndex}`,
    to: `E${headerRowIndex}`,
  };
  // =========================
  // Footer
  // =========================

  const footerStart = worksheet.lastRow.number + 2;

  // Đường kẻ phía trên Footer
  for (let col = 1; col <= 5; col++) {
    worksheet.getCell(footerStart - 1, col).border = {
      top: {
        style: "medium",
        color: { argb: "FF1F4E78" },
      },
    };
  }

  // Merge
  worksheet.mergeCells(`A${footerStart}:E${footerStart}`);
  worksheet.mergeCells(`A${footerStart + 1}:E${footerStart + 1}`);
  worksheet.mergeCells(`A${footerStart + 2}:E${footerStart + 2}`);
  worksheet.mergeCells(`A${footerStart + 3}:E${footerStart + 3}`);

  // End of Report
  const endCell = worksheet.getCell(`A${footerStart}`);
  endCell.value = "End of Report";
  endCell.font = {
    name: "Calibri",
    size: 12,
    bold: true,
  };
  endCell.alignment = {
    horizontal: "center",
  };

  // Prepared by
  const preparedCell = worksheet.getCell(`A${footerStart + 1}`);
  preparedCell.value = "Generated by ERPST system";
  preparedCell.font = {
    name: "Calibri",
    italic: true,
    color: { argb: "FF666666" },
  };
  preparedCell.alignment = {
    horizontal: "center",
  };

  // Auto generated
  const autoCell = worksheet.getCell(`A${footerStart + 2}`);
  autoCell.value =
    "This report was automatically generated based on the supplied BOM and Pick & Place files.";
  autoCell.font = {
    name: "Calibri",
    size: 10,
    color: { argb: "FF808080" },
  };
  autoCell.alignment = {
    horizontal: "center",
  };

  // Company name
  const companyCell = worksheet.getCell(`A${footerStart + 3}`);
  companyCell.value = "© 2026 Super Tec Company. All rights reserved.";
  companyCell.font = {
    name: "Calibri",
    size: 10,
    color: { argb: "FF808080" },
  };
  companyCell.alignment = {
    horizontal: "center",
  };
};

const DownloadMissingExcelReport = async () => {
  try {
    const workbook = new ExcelJS.Workbook();

    const response = await fetch(Logo);
    const logoBuffer = await response.arrayBuffer();

    const logoId = workbook.addImage({
      buffer: logoBuffer,
      extension: "png",
    });

    // Generate Sheet 1
    const ws1 = workbook.addWorksheet("Missing PickPlace");
    generateSheet(
      ws1,
      "Missing Pick & Place",
      statsReportMissing.value.missingPnPDsnList,
      `This report summarizes all component designators that are listed in the Bill of Materials (BOM) but cannot be found in the supplied Pick & Place file.
The purpose of this report is to identify missing placement data before SMT production begins, ensuring that all required components have valid placement coordinates and rotation information.
Please review the listed items and provide an updated Pick & Place file or confirm whether these components are intentionally omitted from assembly.`,
      logoId,
    );

    // Generate Sheet 2
    const ws2 = workbook.addWorksheet("Missing MPN");
    generateSheet(
      ws2,
      "Missing MPN",
      statsReportMissing.value.missingMPNDsnList,
      [
        "This report summarizes all component designators for which a valid Manufacturer Part Number (MPN) could not be identified from the supplied Bill of Materials (BOM)",
        "The purpose of this report is to identify missing or unmatched MPN information before SMT production begins, ensuring that every component can be accurately verified, sourced, and assembled.",
        "Please review the listed items and provide the correct MPN information or an updated BOM to ensure accurate manufacturing and material traceability.",
      ].join("\n"),
      logoId,
    );
    const excelBuffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([excelBuffer]), "Missing_PickPlace_Report.xlsx");

    DialogReportMissing.value = false;
  } catch (error) {
    MessageErrorDialog.value = "Xuất báo cáo thất bại";
    console.error("Error generating report:", error);
  }
};

// ==========================================
// THỐNG KÊ SUMMARY EXCEL EXPORT
// ==========================================
const downloadSummaryExcel = async () => {
  if (dashTotalDesignator.value === 0) {
    MessageCautionDialog.value = "No data available to export the report.";
    DialogCaution.value = true;
    return;
  }
  DialogLoading.value = true;
  try {
    const workbook = new ExcelJS.Workbook();
    const project = project_name.value || "Unknown";

    const NAVY = "FF1F4E78";
    const NAVY2 = "FF2E5E8C";
    const LIGHT = "FFD9E2F3";
    const ZEBRA = "FFF2F2F2";
    const WHITE = "FFFFFFFF";
    const RED = "FFC00000";
    const ORANGE = "FFED7D31";
    const PURPLE = "FF7030A0";
    const SMTCOL = "FF1867C0";
    const HANCOL = "FFB00020";
    const GAPCOL = "FF4CAF50";
    const BORDER = { style: "thin" };
    const cellBorder = {
      top: BORDER,
      left: BORDER,
      right: BORDER,
      bottom: BORDER,
    };

    const setCell = (ws, addr, value, opts = {}) => {
      const cell = ws.getCell(addr);
      cell.value = value;
      if (opts.fill)
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: opts.fill },
        };
      if (opts.font) cell.font = { name: "Calibri", ...opts.font };
      if (opts.align) cell.alignment = { vertical: "middle", ...opts.align };
      if (opts.border) cell.border = cellBorder;
      return cell;
    };

    const landscapeSetup = (ws) => {
      ws.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        horizontalCentered: true,
        verticalCentered: true,
        margins: {
          left: 0.3,
          right: 0.3,
          top: 0.5,
          bottom: 0.5,
          header: 0.3,
          footer: 0.3,
        },
      };
    };

    const logoResp = await fetch(Logo);
    const logoBuffer = await logoResp.arrayBuffer();
    const logoId = workbook.addImage({
      buffer: logoBuffer,
      extension: "png",
    });

    // ===== OVERVIEW =====
    const overview = workbook.addWorksheet("Overview");
    landscapeSetup(overview);
    overview.columns = [16, 16, 16, 16, 16, 16].map((width) => ({
      width,
    }));
    overview.addImage(logoId, {
      tl: { col: 0.5, row: 0.8 },
      ext: { width: 70, height: 70 },
    });

    // Header band
    overview.getRow(1).height = 80;
    overview.mergeCells("A1:F1");
    setCell(overview, "A1", "PCB BOM READINESS REPORT", {
      fill: NAVY,
      font: { bold: true, size: 20, color: { argb: WHITE } },
      align: { horizontal: "center" },
    });
    overview.mergeCells("A2:F2");
    setCell(overview, "A2", "SMT Assembly Verification & Readiness Summary", {
      font: { italic: true, size: 12, color: { argb: "FF666666" } },
      align: { horizontal: "center" },
    });

    // General Information
    overview.mergeCells("A4:F4");
    setCell(overview, "A4", "General Information", {
      fill: LIGHT,
      font: { bold: true, size: 12 },
      align: { horizontal: "left" },
    });
    const reportDate = new Date();
    const infoRows = [
      ["Project:", project],
      [
        "Report Date:",
        reportDate.toLocaleDateString("en-GB") +
          " " +
          reportDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
      ],
      ["Prepared by:", localStorage.getItem("Username") || ""],
      ["Report Version:", "1.0"],
    ];
    infoRows.forEach(([k, v], i) => {
      const row = 5 + i;
      setCell(overview, `A${row}`, k, { font: { bold: true } });
      setCell(overview, `B${row}`, v, {});
      overview.mergeCells(`B${row}:F${row}`);
    });

    // 3 KPI cards
    const kpiRow = 10;
    overview.getRow(kpiRow).height = 30;
    overview.getRow(kpiRow + 1).height = 44;
    const kpis = [
      {
        label: "Total Missing MPN",
        value: dashMissingMpnList.value.length,
        color: RED,
      },
      {
        label: "Total Missing Pick&Place",
        value: dashMissingPnPList.value.length,
        color: ORANGE,
      },
      { label: "Total DNP", value: dashDnpList.value.length, color: PURPLE },
    ];
    kpis.forEach((kpi, i) => {
      const b = i * 2 + 1;
      const c1 = String.fromCharCode(64 + b);
      const c2 = String.fromCharCode(64 + b + 1);
      overview.mergeCells(`${c1}${kpiRow}:${c2}${kpiRow}`);
      setCell(overview, `${c1}${kpiRow}`, kpi.label, {
        fill: kpi.color,
        font: { bold: true, size: 11, color: { argb: WHITE } },
        align: { horizontal: "center" },
        border: true,
      });
      overview.mergeCells(`${c1}${kpiRow + 1}:${c2}${kpiRow + 1}`);
      setCell(overview, `${c1}${kpiRow + 1}`, kpi.value, {
        fill: kpi.color,
        font: { bold: true, size: 22, color: { argb: WHITE } },
        align: { horizontal: "center" },
        border: true,
      });
    });

    // Component Type Comparison
    const cmpTitleRow = 13;
    overview.mergeCells(`A${cmpTitleRow}:F${cmpTitleRow}`);
    setCell(overview, `A${cmpTitleRow}`, "Component Type Comparison", {
      fill: NAVY,
      font: { bold: true, size: 14, color: { argb: WHITE } },
      align: { horizontal: "center" },
      border: true,
    });
    const cmpHeadRow = cmpTitleRow + 1;
    setCell(overview, `A${cmpHeadRow}`, "Type", {
      fill: NAVY2,
      font: { bold: true, color: { argb: WHITE } },
      align: { horizontal: "center" },
      border: true,
    });
    overview.mergeCells(`B${cmpHeadRow}:C${cmpHeadRow}`);
    setCell(overview, `B${cmpHeadRow}`, "Quantity (pcs)", {
      fill: NAVY2,
      font: { bold: true, color: { argb: WHITE } },
      align: { horizontal: "center" },
      border: true,
    });
    overview.mergeCells(`D${cmpHeadRow}:F${cmpHeadRow}`);
    setCell(overview, `D${cmpHeadRow}`, "% of Total", {
      fill: NAVY2,
      font: { bold: true, color: { argb: WHITE } },
      align: { horizontal: "center" },
      border: true,
    });
    const typeColors = { SMT: SMTCOL, "Hàn tay": HANCOL, "Gắp tay": GAPCOL };
    dashTypeQty.value.forEach((row, i) => {
      const r = cmpHeadRow + 1 + i;
      setCell(overview, `A${r}`, row.type, {
        fill: typeColors[row.type] || null,
        font: { bold: true, color: { argb: WHITE } },
        border: true,
      });
      overview.mergeCells(`B${r}:C${r}`);
      setCell(overview, `B${r}`, row.qty, {
        border: true,
        font: { bold: true, size: 11 },
        align: { horizontal: "right" },
        fill: i % 2 === 1 ? ZEBRA : null,
      });
      overview.mergeCells(`D${r}:F${r}`);
      setCell(overview, `D${r}`, row.pct, {
        border: true,
        align: { horizontal: "center" },
        fill: i % 2 === 1 ? ZEBRA : null,
      });
    });

    // Top MPN full-width
    const tmTitleRow = cmpHeadRow + 4;
    overview.mergeCells(`A${tmTitleRow}:F${tmTitleRow}`);
    setCell(overview, `A${tmTitleRow}`, "Top MPN by Quantity", {
      fill: NAVY,
      font: { bold: true, size: 14, color: { argb: WHITE } },
      align: { horizontal: "center" },
      border: true,
    });
    const tmHeadRow = tmTitleRow + 1;
    overview.mergeCells(`A${tmHeadRow}:B${tmHeadRow}`);
    setCell(overview, `A${tmHeadRow}`, "MPN", {
      fill: NAVY2,
      font: { bold: true, color: { argb: WHITE } },
      border: true,
    });
    overview.mergeCells(`C${tmHeadRow}:D${tmHeadRow}`);
    setCell(overview, `C${tmHeadRow}`, "Qty", {
      fill: NAVY2,
      font: { bold: true, color: { argb: WHITE } },
      align: { horizontal: "center" },
      border: true,
    });
    overview.mergeCells(`E${tmHeadRow}:F${tmHeadRow}`);
    setCell(overview, `E${tmHeadRow}`, "% of Total", {
      fill: NAVY2,
      font: { bold: true, color: { argb: WHITE } },
      align: { horizontal: "center" },
      border: true,
    });
    dashTopMpn.value.forEach((item, i) => {
      const r = tmHeadRow + 1 + i;
      overview.mergeCells(`A${r}:B${r}`);
      setCell(overview, `A${r}`, item.mpn, {
        border: true,
        fill: i % 2 === 1 ? ZEBRA : null,
      });
      overview.mergeCells(`C${r}:D${r}`);
      setCell(overview, `C${r}`, item.count, {
        border: true,
        align: { horizontal: "right" },
        font: { bold: true },
        fill: i % 2 === 1 ? ZEBRA : null,
      });
      overview.mergeCells(`E${r}:F${r}`);
      setCell(overview, `E${r}`, item.pct, {
        border: true,
        align: { horizontal: "center" },
        fill: i % 2 === 1 ? ZEBRA : null,
      });
    });

    // Footer
    const footRow = tmHeadRow + 12;
    overview.mergeCells(`A${footRow}:F${footRow}`);
    setCell(
      overview,
      `A${footRow}`,
      "Prepared by Super Tech  |  Confidential",
      {
        font: { italic: true, size: 9, color: { argb: "FF999999" } },
        align: { horizontal: "center" },
      },
    );

    // ===== DETAIL SHEETS =====
    const detailSpecs = [
      {
        name: "Missing Pick & Place",
        title: "Missing Pick & Place",
        list: statsReportMissing.value.missingPnPDsnList,
        desc: "This report summarizes all component designators that are listed in the Bill of Materials (BOM) but cannot be found in the supplied Pick & Place file.\nPlease review the listed items and provide an updated Pick & Place file or confirm whether these components are intentionally omitted from assembly.",
      },
      {
        name: "Missing MPN",
        title: "Missing MPN",
        list: statsReportMissing.value.missingMPNDsnList,
        desc: "This report summarizes all component designators for which a valid Manufacturer Part Number (MPN) could not be identified from the supplied Bill of Materials (BOM).\nPlease review the listed items and provide the correct MPN information or an updated BOM.",
      },
      {
        name: "DNP",
        title: "DNP",
        list: dashDnpList.value.map((d) => ({
          designator: d.designator || d.designators || d.designator || "",
          mpn: d.mpn || "",
          description: d.description || d.description_bom || "",
          quantity: d.quantity || 1,
          type: d.type || "",
          note: d.note || "",
        })),
        desc: "This report summarizes all components marked as Do Not Populate (DNP) in the Bill of Materials.\nThese components should not be placed during assembly.",
      },
    ];
    detailSpecs.forEach((spec) => {
      const ws = workbook.addWorksheet(spec.name);
      generateSheet(ws, spec.title, spec.list, spec.desc, logoId, {
        totalBOMDesignators: dashTotalDesignator.value,
        totalPnPDesignators: statsReportMissing.value.totalPnPDesignators,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const safeName = project.replace(/[\\/:*?"<>|]/g, "_");
    saveAs(new Blob([buffer]), `PCB_BOM_Readiness_${safeName}.xlsx`);
    DialogSuccess.value = true;
    MessageDialog.value = "Report exported successfully";
  } catch (error) {
    console.error("Error exporting summary report:", error);
    DialogFailed.value = true;
    MessageErrorDialog.value = "Export report failed";
  } finally {
    DialogLoading.value = false;
  }
};

// ==========================================
// DIGIKEY DATASHEET FINDER
// ==========================================

const getDigikeyTokenForDatasheet = async () => {
  // 1. Dùng token đã cache nếu còn hạn (tránh gọi API lặp lại gây rate limit)
  if (accessToken.value && Date.now() < digikeyTokenExpireTime.value) {
    return accessToken.value;
  }

  try {
    const response = await axios.post(`${Url}/DigiKey/token`);
    const token = response.data.access_token;
    accessToken.value = token;
    tokenType.value = response.data.token_type || "Bearer";
    const expiresIn = response.data.expires_in || 600;
    digikeyTokenExpireTime.value = Date.now() + (expiresIn - 60) * 1000;

    return token;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error_description ||
      error.response?.data?.error ||
      error.message;
    console.error(
      "Lỗi lấy token DigiKey:",
      error.response ? error.response.data : error,
    );
    throw new Error(
      `Không thể kết nối đến DigiKey API (${errorMsg}). Vui lòng kiểm tra lại Client ID / Secret.`,
    );
  }
};

const searchDigikeyProduct = async (mpn) => {
  const searchUrl = `${Url}/DigiKey/search/${encodeURIComponent(
    mpn,
  )}/productdetails`;
  try {
    const response = await axios.get(searchUrl);
    return response.data;
  } catch (error) {
    return null;
  }
};

const searchLcscProduct = async (mpn) => {
  const searchUrl = `${Url}/LCSC/search/${encodeURIComponent(mpn)}`;
  try {
    const response = await axios.get(searchUrl);
    return response.data;
  } catch (error) {
    return null;
  }
};

/**
 * Hàm chính: lấy MPN từ các row đã chọn → tìm trên Digikey → hiển thị dialog kết quả
 */
const findDatasheets = async () => {
  // Lấy danh sách item được chọn
  const selectedItems = rawBomHighlight.value.filter((item) =>
    selectedBomRows.value.includes(item.id),
  );

  // Gom tất cả MPN duy nhất (mpn, mpn2, mpn3)
  const mpnSet = new Set();
  selectedItems.forEach((item) => {
    if (item.mpn && item.mpn.trim()) mpnSet.add(item.mpn.trim());
    if (item.mpn2 && item.mpn2.trim()) mpnSet.add(item.mpn2.trim());
    if (item.mpn3 && item.mpn3.trim()) mpnSet.add(item.mpn3.trim());
  });

  const mpnList = [...mpnSet];
  if (mpnList.length === 0) {
    MessageCautionDialog.value = "Các dòng đã chọn không có MPN hợp lệ.";
    DialogCaution.value = true;
    return;
  }

  DialogFindingDatasheet.value = true;
  datasheetResults.value = [];

  try {
    // Chạy tìm kiếm cho tất cả các MPN — datasheet & ảnh tra độc lập:
    // Datasheet: DigiKey → LCSC → Google | Ảnh: DigiKey → LCSC → null
    const promises = mpnList.map(async (mpn) => {
      const result = await searchDigikeyProduct(mpn);
      const digiOk = result && result.Product;

      let datasheetUrl =
        digiOk && result.Product.DatasheetUrl
          ? result.Product.DatasheetUrl
          : "";
      let photoUrl =
        digiOk && result.Product.PhotoUrl ? result.Product.PhotoUrl : "";
      let dSource = digiOk && datasheetUrl ? "DigiKey" : "";
      let iSource = digiOk && photoUrl ? "DigiKey" : "";
      let manufacturer = digiOk
        ? result.Product.Manufacturer?.Name || "DigiKey"
        : "";

      // Chỉ gọi LCSC khi DigiKey còn thiếu datasheet HOẶC ảnh
      let lcsc = null;
      if (dSource !== "DigiKey" || iSource !== "DigiKey") {
        lcsc = await searchLcscProduct(mpn);
      }

      // Datasheet: DigiKey → LCSC → Google
      if (!datasheetUrl && lcsc && lcsc.pdfUrl) {
        datasheetUrl = lcsc.pdfUrl;
        dSource = "LCSC";
      }
      if (!datasheetUrl) {
        datasheetUrl = `https://www.google.com/search?q=${encodeURIComponent(
          mpn + " datasheet pdf",
        )}`;
        dSource = "Google";
      }

      // Ảnh: DigiKey → LCSC → null
      if (!photoUrl && lcsc && lcsc.imageUrl) {
        photoUrl = lcsc.imageUrl;
        iSource = "LCSC";
      }

      if (!manufacturer) manufacturer = lcsc?.manufacturer || "—";

      return {
        mpn: mpn,
        manufacturer,
        datasheetUrl,
        photoUrl,
        dSource,
        iSource,
      };
    });

    datasheetResults.value = await Promise.all(promises);
    DialogDatasheetResult.value = true;
  } catch (error) {
    console.error("Lỗi tìm datasheet DigiKey:", error);
    MessageErrorDialog.value = error.message || "Tìm datasheet thất bại";
    DialogFailed.value = true;
  } finally {
    DialogFindingDatasheet.value = false;
  }
};

/**
 * 4. Tải kết quả Datasheet ra file Excel (.xlsx)
 */
const downloadDatasheetExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Datasheet Results");

    // Header
    ws.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "MPN", key: "mpn", width: 30 },
      { header: "Manufacturer", key: "manufacturer", width: 30 },
      { header: "Link Datasheet", key: "datasheetUrl", width: 60 },
      { header: "Status", key: "status", width: 12 },
    ];

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3949AB" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    });
    headerRow.height = 22;

    // Data rows
    datasheetResults.value.forEach((item, idx) => {
      const row = ws.addRow({
        no: idx + 1,
        mpn: item.mpn,
        manufacturer: item.manufacturer,
        datasheetUrl: item.datasheetUrl || "Không tìm thấy",
        status: item.datasheetUrl ? "Yes" : "No",
      });

      // Hyperlink nếu có URL
      if (item.datasheetUrl) {
        row.getCell("datasheetUrl").value = {
          text: item.datasheetUrl,
          hyperlink: item.datasheetUrl,
        };
        row.getCell("datasheetUrl").font = {
          color: { argb: "FF3949AB" },
          underline: true,
        };
      }

      // Màu status
      row.getCell("status").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: item.datasheetUrl ? "FFE8F5E9" : "FFFFEBEE" },
      };
      row.getCell("status").font = {
        color: { argb: item.datasheetUrl ? "FF2E7D32" : "FFCC0000" },
        bold: true,
      };
      row.getCell("status").alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      // Zebra stripe
      if (idx % 2 === 1) {
        ["no", "mpn", "manufacturer"].forEach((k) => {
          row.getCell(k).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          };
        });
      }

      row.eachCell((cell) => {
        if (!cell.border) {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
        }
        cell.alignment = cell.alignment || {
          vertical: "middle",
          wrapText: false,
        };
      });
      row.height = 18;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Datasheet_Results_${Date.now()}.xlsx`);
  } catch (error) {
    console.error("Lỗi xuất Excel datasheet:", error);
    MessageErrorDialog.value = "Xuất file Excel thất bại";
    DialogFailed.value = true;
  }
};

const DownloadCompareBomReport = async () => {
  try {
    const rows = bomCompareRows.value || [];
    if (BomNewApplied.value.length === 0) {
      MessageErrorDialog.value = "Chưa có dữ liệu Bom mới để so sánh";
      DialogFailed.value = true;
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("So sanh BOM");

    ws.columns = [
      { key: "stt", width: 8 },
      { key: "oldDesignator", width: 40 },
      { key: "oldMpn", width: 32 },
      { key: "oldDesc", width: 55 },
      { key: "newDesignator", width: 40 },
      { key: "newMpn", width: 32 },
      { key: "newDesc", width: 55 },
      { key: "status", width: 14 },
    ];

    const headerRow1 = ws.addRow([
      "STT",
      "Bom cũ",
      "Bom cũ",
      "Bom cũ",
      "Bom mới",
      "Bom mới",
      "Bom mới",
      "Trạng thái",
    ]);
    ws.mergeCells("B1:D1");
    ws.mergeCells("E1:G1");

    const headerRow2 = ws.addRow([
      "",
      "Designator",
      "MPN",
      "Description",
      "Designator",
      "MPN",
      "Description",
      "Trạng thái",
    ]);

    const styleHeaderCell = (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3949AB" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    };

    headerRow1.eachCell(styleHeaderCell);
    headerRow2.eachCell(styleHeaderCell);
    headerRow1.height = 22;
    headerRow2.height = 22;

    const buildRichText = (list) => {
      if (!list || list.length === 0) return null;
      const runs = [];
      list.forEach((x, i) => {
        if (i > 0) runs.push({ text: ", " });
        const refStr = x && x.ref ? x.ref : "—";
        if (x && x.diff) {
          runs.push({
            text: refStr,
            font: { color: { argb: "FFC62828" }, bold: true },
          });
        } else {
          runs.push({ text: refStr });
        }
      });
      return runs.length ? { richText: runs } : null;
    };

    const hasAnyDiff = (list) => list && list.some((x) => x && x.diff);

    const statusText = (status) =>
      status === "match"
        ? "Trùng"
        : status === "new"
        ? "Mới"
        : status === "change"
        ? "Thay đổi"
        : "";

    const statusColors = {
      match: { fill: "FFE8F5E9", font: "FF2E7D32" },
      change: { fill: "FFFFF3E0", font: "FFF57C00" },
      new: { fill: "FFE3F2FD", font: "FF1565C0" },
    };

    rows.forEach((item, idx) => {
      const row = ws.addRow({
        stt: idx + 1,
        oldDesignator: "",
        oldMpn: item.old_mpn || "",
        oldDesc: item.old_description || "",
        newDesignator: "",
        newMpn: item.new_mpn || "",
        newDesc: item.new_description || "",
        status: statusText(item.status),
      });

      row.getCell("oldDesignator").value = buildRichText(item.oldList);
      row.getCell("newDesignator").value = buildRichText(item.newList);

      if (hasAnyDiff(item.oldList)) {
        row.getCell("oldMpn").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFEBEE" },
        };
        row.getCell("oldMpn").font = {
          color: { argb: "FFC62828" },
          bold: true,
        };
      }
      if (hasAnyDiff(item.newList)) {
        row.getCell("newMpn").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFEBEE" },
        };
        row.getCell("newMpn").font = {
          color: { argb: "FFC62828" },
          bold: true,
        };
      }

      if (item.status !== "none") {
        const sc = statusColors[item.status] || {};
        row.getCell("status").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: sc.fill || "FFFFFFFF" },
        };
        row.getCell("status").font = {
          color: { argb: sc.font || "FF000000" },
          bold: true,
        };
      }

      if (idx % 2 === 1) {
        ["stt", "oldDesc", "newDesc"].forEach((k) => {
          row.getCell(k).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          };
        });
        if (!row.getCell("oldMpn").fill) {
          row.getCell("oldMpn").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          };
          row.getCell("newMpn").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          };
        }
      }

      row.eachCell((cell) => {
        if (!cell.border) {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
        }
        cell.alignment = cell.alignment || {
          vertical: "middle",
          wrapText: true,
        };
      });
      row.getCell("stt").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      row.getCell("status").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      row.height = 26;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Bom_Compare_Report.xlsx`);
  } catch (error) {
    console.error("Lỗi xuất báo cáo so sánh:", error);
    MessageErrorDialog.value = "Xuất file báo cáo so sánh thất bại";
    DialogFailed.value = true;
  }
};

const DownloadComparePickplaceReport = async () => {
  try {
    if (PkNewApplied.value.length === 0) {
      MessageErrorDialog.value = "Chưa có dữ liệu Pickplace mới để so sánh";
      DialogFailed.value = true;
      return;
    }

    const rows = pnpCompareRows.value || [];

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("So sanh Pickplace");

    ws.columns = [
      { key: "stt", width: 8 },
      { key: "oldDesignator", width: 22 },
      { key: "oldX", width: 14 },
      { key: "oldY", width: 14 },
      { key: "oldRot", width: 14 },
      { key: "oldLayer", width: 14 },
      { key: "newDesignator", width: 22 },
      { key: "newX", width: 14 },
      { key: "newY", width: 14 },
      { key: "newRot", width: 14 },
      { key: "newLayer", width: 14 },
      { key: "status", width: 14 },
    ];

    const headerRow1 = ws.addRow([
      "STT",
      "Pickplace cũ",
      "Pickplace cũ",
      "Pickplace cũ",
      "Pickplace cũ",
      "Pickplace cũ",
      "Pickplace mới",
      "Pickplace mới",
      "Pickplace mới",
      "Pickplace mới",
      "Pickplace mới",
      "Trạng thái",
    ]);
    ws.mergeCells("B1:F1");
    ws.mergeCells("G1:K1");

    const headerRow2 = ws.addRow([
      "",
      "Designator",
      "X",
      "Y",
      "Rotation",
      "Layer",
      "Designator",
      "X",
      "Y",
      "Rotation",
      "Layer",
      "Trạng thái",
    ]);

    const styleHeaderCell = (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF00695C" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true, name: "Calibri" };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    };

    headerRow1.eachCell(styleHeaderCell);
    headerRow2.eachCell(styleHeaderCell);
    headerRow1.height = 22;
    headerRow2.height = 22;

    const redFont = { color: { argb: "FFC62828" }, bold: true };
    const redFill = (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFEBEE" },
      };
      cell.font = redFont;
    };

    const statusText = (status) =>
      status === "match"
        ? "Trùng"
        : status === "add"
        ? "Mới"
        : status === "remove"
        ? "Xoá"
        : status === "change"
        ? "Thay đổi"
        : "";

    const statusColors = {
      match: { fill: "FFE8F5E9", font: "FF2E7D32" },
      change: { fill: "FFFFF3E0", font: "FFF57C00" },
      remove: { fill: "FFFFEBEE", font: "FFC62828" },
      add: { fill: "FFE3F2FD", font: "FF1565C0" },
    };

    const diff = (list, field) =>
      list && list.some((o) => o && o.diffFields && o.diffFields[field]);

    rows.forEach((item, idx) => {
      const row = ws.addRow({
        stt: idx + 1,
        oldDesignator:
          item.status === "remove" ? item.old_designator : item.old_designator,
        oldX: item.old_x,
        oldY: item.old_y,
        oldRot: item.old_rotation,
        oldLayer: item.old_layer,
        newDesignator: item.new_designator,
        newX: item.new_x,
        newY: item.new_y,
        newRot: item.new_rotation,
        newLayer: item.new_layer,
        status: statusText(item.status),
      });

      if (item.status === "remove" && row.getCell("oldDesignator").value) {
        redFill(row.getCell("oldDesignator"));
      }
      if (item.status === "add" && row.getCell("newDesignator").value) {
        redFill(row.getCell("newDesignator"));
      }

      const markDiffCells = (prefix) => {
        ["x", "y", "rotation", "layer"].forEach((f) => {
          const colKey =
            f === "rotation" ? "Rot" : f[0].toUpperCase() + f.slice(1);
          const col = prefix + colKey;
          if (diff(prefix === "old" ? item.oldList : item.newList, f)) {
            redFill(row.getCell(col));
          }
        });
      };
      markDiffCells("old");
      markDiffCells("new");

      if (item.status !== "none") {
        const sc = statusColors[item.status] || {};
        row.getCell("status").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: sc.fill || "FFFFFFFF" },
        };
        row.getCell("status").font = {
          color: { argb: sc.font || "FF000000" },
          bold: true,
        };
      }

      row.eachCell((cell) => {
        if (!cell.border) {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
        }
        cell.alignment = cell.alignment || {
          vertical: "middle",
          wrapText: true,
        };
      });
      row.getCell("stt").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      row.getCell("status").alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      row.height = 24;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Pickplace_Compare_Report.xlsx`);
  } catch (error) {
    console.error("Lỗi xuất báo cáo so sánh Pickplace:", error);
    MessageErrorDialog.value = "Xuất file báo cáo so sánh Pickplace thất bại";
    DialogFailed.value = true;
  }
};

// ==========================================
// 7.8 DIGIKEY API
// ==========================================

/**
 * Lấy access token từ DigiKey OAuth2 rồi gọi searchProduct()
 * @param {Object} value - Item BOM có trường id và mpn
 */
const getAccessToken = async (value) => {
  DialogLoading.value = true;
  const found = combineBom.value.find((v) => v.id === value.id);
  GetDigikey.value = found ? found.mpn : "";

  try {
    const token = await getDigikeyTokenForDatasheet();
    if (token && GetDigikey.value) {
      return await searchProduct();
    }
    return true;
  } catch (error) {
    console.error("Lỗi khi lấy access token:", error.message);
    MessageErrorDialog.value = error.message || "Lỗi khi lấy access token";
    DialogFailed.value = true;
    return false;
  } finally {
    DialogLoading.value = false;
  }
};

/**
 * Tìm kiếm thông tin sản phẩm trên DigiKey bằng MPN (accessToken phải có sẵn)
 * Hiển thị kết quả trong DialogInfo
 */
const searchProduct = async () => {
  if (!GetDigikey.value) {
    console.error("Chưa có MPN. Vui lòng chọn linh kiện trước.");
    return;
  }

  const searchUrl = `${Url}/DigiKey/search/${encodeURIComponent(
    GetDigikey.value,
  )}/productdetails`;

  try {
    const response = await axios.get(searchUrl);
    ResultSearch.value = response.data;
    DialogSuccess.value = true;
    MessageDialog.value = "Tìm kiếm sản phẩm thành công";

    if (ResultSearch.value) {
      return (DialogInfo.value = true), (DialogLoading.value = false);
    }

    return response.data;
  } catch (error) {
    console.error(
      "Lỗi khi tìm kiếm sản phẩm:",
      error.response ? error.response.data : error.message,
    );
    DialogFailed.value = true;
    DialogLoading.value = false;
    MessageErrorDialog.value = "Lỗi khi tìm kiếm sản phẩm";
    return null;
  }
};

const getRowClass = (data) => {
  const row = data?.item || data;

  if (row.note && row.note.toString().trim().toLowerCase() === "dnp") {
    return { class: "row-yellow" };
  }

  if (row.type === "Hàn tay") {
    return { class: "row-rose" };
  }

  if (row.type === "Gắp tay") {
    return { class: "row-green" };
  }

  return {};
};

const getRowProps = ({ item }) => {
  return {
    class: !item.mpn || item.mpn.trim() === "" ? "bg-orange-lighten-5" : "",
  };
};

const safeParse = (value) => {
  try {
    return JSON.parse(value || "[]");
  } catch (e) {
    return [];
  }
};
const openRemoveImage = (img) => {
  ImageToDelete.value = img;
  DialogRemoveImage.value = true;
};

function openImage(imageUrl, rotation = 0) {
  dialogImageUrl.value = imageUrl;
  dialogRotation.value = Number(rotation) || 0;
}

const openDatasheetImage = (item) => {
  datasheetImageUrl.value = item.photoUrl || "";
  datasheetImageName.value = `${String(item.mpn || "image").replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  )}.jpg`;
  DialogDatasheetImage.value = true;
};

const downloadDatasheetImage = () => {
  if (!datasheetImageUrl.value) return;
  const url = `${Url}/DigiKey/image?url=${encodeURIComponent(
    datasheetImageUrl.value,
  )}&filename=${encodeURIComponent(datasheetImageName.value)}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = datasheetImageName.value;
  document.body.appendChild(a);
  a.click();
  a.remove();
};
</script>
<script>
export default {
  components: {
    ButtonBack,
    ButtonEdit,
    ButtonDelete,
    InputSearch,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
  },
};
</script>
<style scoped>
/* PnP only view styling */
.pnp-only-view {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  padding: 32px;
  text-align: center;
}

/* Error state styling */
.error-state {
  text-align: center;
  padding: 40px;
  color: #d32f2f;
}

.error-state .v-icon {
  margin-bottom: 16px;
}

.altium-style text {
  dominant-baseline: middle;
  text-anchor: start;
  pointer-events: none;
}

:deep(.row-yellow td) {
  background-color: #fef9c3 !important;
}

:deep(.row-rose td) {
  background-color: #ffe4e6 !important;
}

:deep(.row-green td) {
  background-color: #dcfce7 !important;
}
.delete-image-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}

/* Thêm class hỗ trợ tối ưu layout UI */
.border-bottom {
  border-bottom: 1px solid #e0e0e0 !important;
}
.border-end {
  border-right: 1px solid #e0e0e0 !important;
}
.max-width-search {
  max-width: 240px;
}
.bg-black-opacity {
  background: rgba(0, 0, 0, 0.6);
}
.text-neutral-light {
  color: #757575;
}
</style>
