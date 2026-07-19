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
          <v-tab :value="2" class="text-caption">Tính toán PnP</v-tab>
          <v-tab :value="3" class="text-caption">Gerber</v-tab>
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
                    @click="DialogAddBom = true"
                    prepend-icon="mdi-plus"
                  >
                    <v-list-item-title class="text-caption"
                      >File Bom gốc</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item
                    @click="DialogAddBomMountType = true"
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
                </v-list>
              </v-menu>

              <v-btn
                color="error"
                variant="tonal"
                prepend-icon="mdi-delete"
                class="text-caption ms-2"
                @click="DialogDeleteBomHighlight = true"
                :disabled="rawBomHighlight.length === 0"
                >Xoá Bom</v-btn
              >
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

              <!-- Filter: MPN Thiếu -->
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
                  >Thiếu MPN</v-chip
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
                    @click="DialogAddPnP = true"
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
                @click="DialogDeletePickPlace = true"
                :disabled="combineBom.length === 0"
                >Xoá Pickplace</v-btn
              >
              <v-spacer></v-spacer>
              <InputSearch v-model="searchBom" />
            </v-card-title>
            <v-card-text>
              <v-data-table
                density="comfortable"
                :headers="Headers"
                :items="combineBom"
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
                      :length="Math.ceil(combineBom.length / itemsPerPageBom)"
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
              <v-btn
                @click="DialogSettingPCB = true"
                prepend-icon="mdi-file-document"
                color="primary"
                variant="tonal"
                class="text-caption ms-2"
              >
                Dữ liệu PCB & Panel
              </v-btn>
              <Button-Download @click="DownloadPCB()" text="Tải file PCB" />
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <v-data-table-virtual
                    density="comfortable"
                    :headers="HeadersPCBTop"
                    :items="resultTop"
                    :search="searchPCBTopLayer"
                    :items-per-page="itemPerPCBTopLayer"
                    v-model:page="pagePCBTopLayer"
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
                    height="58vh"
                  >
                    <template v-slot:top>
                      <v-toolbar
                        flat
                        class="d-flex align-center bg-transparent"
                      >
                        <v-toolbar-title class="text-success font-weight-bold">
                          <v-icon
                            color="success"
                            icon="mdi-arrow-collapse-up"
                            size="x-small"
                            start
                          ></v-icon>

                          Top Layer
                        </v-toolbar-title>

                        <InputSearch v-model="searchPCBTopLayer" />
                      </v-toolbar>
                    </template>

                    <template v-slot:item.stt="{ index }">
                      {{
                        (pagePCBTopLayer - 1) * itemPerPCBTopLayer + index + 1
                      }}
                    </template>

                    <template v-slot:item.x="{ item }">
                      {{ item.x }}
                    </template>
                    <template v-slot:item.y="{ item }">
                      {{ item.y }}
                    </template>
                  </v-data-table-virtual>
                </v-col>
                <v-divider vertical></v-divider>
                <v-col cols="6">
                  <v-data-table-virtual
                    density="comfortable"
                    :headers="HeadersPCBBottom"
                    :items="resultBottom"
                    :search="searchPCBBottomLayer"
                    :items-per-page="itemPerPCBBottomLayer"
                    v-model:page="pagePCBBottomLayer"
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
                    height="58vh"
                  >
                    <template v-slot:top>
                      <v-toolbar
                        flat
                        class="d-flex align-center bg-transparent"
                      >
                        <v-toolbar-title class="text-error font-weight-bold">
                          <v-icon
                            color="error"
                            icon="mdi-arrow-collapse-down"
                            size="x-small"
                            start
                          ></v-icon>

                          Bottom Layer
                        </v-toolbar-title>

                        <InputSearch v-model="searchPCBBottomLayer" />
                      </v-toolbar>
                    </template>

                    <template v-slot:item.stt="{ index }">
                      {{
                        (pagePCBBottomLayer - 1) * itemPerPCBBottomLayer +
                        index +
                        1
                      }}
                    </template>

                    <template v-slot:item.x="{ item }">
                      {{ item.x }}
                    </template>
                    <template v-slot:item.y="{ item }">
                      {{ item.y }}
                    </template>
                  </v-data-table-virtual>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tabs-window-item>

          <v-tabs-window-item :value="3">
            <v-card class="rounded-lg elevation-1 bg-surface" height="100vh">
              <v-card-title class="d-flex align-center pa-4 border-b">
                <div class="d-flex g-2">
                  <v-btn
                    prepend-icon="mdi-import"
                    color="primary"
                    variant="tonal"
                    class="text-caption"
                    @click="DialogAddGerber = true"
                  >
                    Nhập dữ liệu
                  </v-btn>

                  <v-btn
                    prepend-icon="mdi-file-document-multiple-outline"
                    color="warning"
                    variant="tonal"
                    class="text-caption ms-2"
                    @click="DialogEditGerber = true"
                  >
                    Danh sách Gerber
                  </v-btn>
                </div>

                <v-spacer></v-spacer>

                <div
                  class="d-flex align-center g-3"
                  style="
                    max-width: 400px;
                    width: 100%;
                    justify-content: flex-end;
                  "
                >
                  <v-btn
                    prepend-icon="mdi-tune"
                    variant="outlined"
                    color="secondary"
                    class="text-none font-weight-medium me-3"
                    title="Cài đặt tọa độ"
                    @click="DialogCoordinateSettings = true"
                  >
                    Cài đặt
                  </v-btn>

                  <v-select
                    v-model="selectedLayer"
                    :items="['Top', 'Bottom']"
                    label="Layer"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 130px"
                    prepend-inner-icon="mdi-layers-outline"
                  />
                </div>
              </v-card-title>

              <v-card-text class="pa-4" style="height: calc(100vh - 75px)">
                <v-row class="fill-height" spacing="4">
                  <v-col cols="7" class="fill-height">
                    <v-card
                      variant="outlined"
                      class="fill-height border-dashed rounded-lg overflow-hidden position-relative bg-grey-lighten-5"
                    >
                      <div
                        v-if="
                          (currentGerberSvg || hasPcbImage) &&
                          overlayMode !== 'pnp'
                        "
                        class="fill-height"
                      >
                        <div
                          style="
                            position: absolute;
                            top: 16px;
                            right: 16px;
                            z-index: 20;
                          "
                        >
                          <v-btn
                            prepend-icon="mdi-refresh"
                            @click="resetsZoom"
                            class="text-none font-weight-medium elevation-2"
                            color="error"
                            variant="flat"
                            size="small"
                          >
                            Reset Zoom
                          </v-btn>
                        </div>

                        <div
                          class="gerber-svg-container-full fill-height"
                          ref="svgContainer"
                          @mousemove="handleDragMove"
                          @mousedown="handleDragStart"
                          @mouseup="handleDragEnd"
                          @mouseleave="handleDragEnd"
                          @wheel.prevent="handleWheelZoom"
                          :data-zoom-low="zoomLevel < 2"
                          :class="{ 'is-dragging': isDragging }"
                          :style="{
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            position: 'relative',
                          }"
                        >
                          <canvas
                            ref="gerberCanvas"
                            style="
                              position: absolute;
                              top: 0;
                              left: 0;
                              width: 100%;
                              height: 100%;
                              pointer-events: none;
                            "
                            :style="layerTransformStyle"
                          ></canvas>

                          <svg
                            ref="svgWrapper"
                            id="gerber-svg"
                            class="svg-full-wrapper"
                            style="
                              position: absolute;
                              top: 0;
                              left: 0;
                              width: 100%;
                              height: 100%;
                              pointer-events: none;
                            "
                            :style="layerTransformStyle"
                          >
                            <g
                              class="pnp-markers-layer"
                              v-memo="[pnpMarkersArray, allActiveHighlights]"
                              :transform="pnpGroupFlipTransform"
                            >
                              <g
                                v-for="marker in pnpMarkersArray"
                                :key="marker.designator"
                                class="pnp-marker"
                                :data-designator="marker.designator"
                                :transform="marker.transform"
                                style="pointer-events: auto"
                                @click="handleMarkerClick(marker)"
                              >
                                <rect
                                  class="pnp-highlight-frame"
                                  :x="-400"
                                  :y="-400"
                                  width="800"
                                  height="800"
                                  fill="none"
                                  stroke="#D32F2F"
                                  stroke-width="20"
                                  :style="{
                                    display:
                                      selectedPnPGerber.includes(marker.id) ||
                                      marker.designator ===
                                        combinePnPGerber[currentIndex]
                                          ?.designator
                                        ? 'block'
                                        : 'none',
                                  }"
                                />
                                <rect
                                  class="pnp-highlight-frame"
                                  :x="-marker.rectL / 2 || -20"
                                  :y="-marker.rectW / 2 || -20"
                                  :width="marker.rectL || 20"
                                  :height="marker.rectW || 20"
                                  fill="red"
                                  stroke="red"
                                  :stroke-width="marker.strokeMain * 0.5"
                                  style="display: none"
                                />
                                <polygon
                                  points="0,0 -4, -2 -4, 2"
                                  fill="#D32F2F"
                                  :transform="`translate(${
                                    marker.anchorSize + 1
                                  }, 0) scale(${marker.strokeMain * 0.5})`"
                                />
                                <g
                                  class="crosshair-group pnp-crosshair"
                                  stroke="#D32F2F"
                                  :stroke-width="marker.strokeMain"
                                >
                                  <line
                                    :x1="-marker.anchorSize"
                                    y1="0"
                                    :x2="marker.anchorSize"
                                    y2="0"
                                  />
                                  <line
                                    x1="0"
                                    :y1="-marker.anchorSize"
                                    x2="0"
                                    :y2="marker.anchorSize"
                                  />
                                </g>
                                <text
                                  class="pnp-label"
                                  :x="marker.strokeMain"
                                  :y="-marker.strokeMain"
                                  :font-size="marker.fontSize"
                                  fill="blue"
                                  font-weight="bold"
                                  style="
                                    paint-order: stroke;
                                    stroke: white;
                                    user-select: none;
                                  "
                                  :stroke-width="marker.fontSize * 0.1 + 'px'"
                                  :transform="marker.textTransform"
                                >
                                  {{ marker.designator }}
                                </text>
                              </g>
                            </g>
                          </svg>
                        </div>
                      </div>

                      <v-empty-state
                        v-slot
                        v-if="
                          overlayMode !== 'pnp' &&
                          !currentGerberSvg &&
                          !hasPcbImage
                        "
                        title="Dữ liệu trống"
                        text="Hệ thống chưa ghi nhận dữ liệu Gerber. Vui lòng nhập dữ liệu để bắt đầu."
                        icon="mdi-file-cad"
                        class="fill-height d-flex flex-column align-center justify-center text-grey-darken-1"
                      />
                    </v-card>
                  </v-col>

                  <v-col cols="5" class="fill-height d-flex flex-column g-3">
                    <v-card
                      variant="outlined"
                      class="rounded-lg overflow-hidden flex-grow-1 mb-3"
                    >
                      <v-toolbar
                        flat
                        class="px-3 border-b bg-transparent"
                        height="64"
                      >
                        <InputSearch
                          v-model="searchPnPGerber"
                          class="flex-grow-1 me-3"
                        />

                        <v-divider vertical inset class="mx-2"></v-divider>

                        <div
                          class="d-flex align-center bg-grey-lighten-4 rounded-pill px-2 py-1"
                        >
                          <v-btn
                            icon="mdi-chevron-left"
                            variant="text"
                            density="comfortable"
                            color="primary"
                            @click="navigatePnP('prev')"
                            :disabled="!combinePnPGerber.length"
                          ></v-btn>

                          <span
                            class="text-caption font-weight-bold px-2 text-center"
                            style="min-width: 75px"
                          >
                            {{ combinePnPGerber.length ? currentIndex + 1 : 0 }}
                            / {{ combinePnPGerber.length }}
                          </span>

                          <v-btn
                            icon="mdi-chevron-right"
                            variant="text"
                            density="comfortable"
                            color="primary"
                            @click="navigatePnP('next')"
                            :disabled="!combinePnPGerber.length"
                          ></v-btn>
                        </div>
                      </v-toolbar>

                      <v-data-table-virtual
                        density="compact"
                        :headers="HeadersPnPGerber"
                        :items="combinePnPGerber"
                        :search="searchPnPGerber"
                        v-model="selectedPnPGerber"
                        item-value="id"
                        :loading="DialogLoading"
                        loading-text="Đang tải dữ liệu linh kiện..."
                        no-data-text="Không có dữ liệu hiển thị"
                        :hover="true"
                        fixed-header
                        height="calc(50vh - 80px)"
                        show-select
                      >
                        <template
                          v-slot:header.data-table-select="{
                            allSelected,
                            selectAll,
                            someSelected,
                          }"
                        >
                          <v-checkbox-btn
                            :indeterminate="someSelected && !allSelected"
                            :model-value="allSelected"
                            color="primary"
                            @update:model-value="selectAll(!allSelected)"
                          ></v-checkbox-btn>
                        </template>

                        <template
                          v-slot:item.data-table-select="{
                            internalItem,
                            isSelected,
                            toggleSelect,
                          }"
                        >
                          <v-checkbox-btn
                            :model-value="isSelected(internalItem)"
                            color="primary"
                            @update:model-value="toggleSelect(internalItem)"
                          ></v-checkbox-btn>
                        </template>

                        <template v-slot:item.stt="{ index }">
                          <span class="text-grey font-weight-medium">{{
                            (pagePCBTopLayer - 1) * itemPerPCBTopLayer +
                            index +
                            1
                          }}</span>
                        </template>

                        <template v-slot:item.x="{ item }"
                          ><code>{{ item.x }}</code></template
                        >
                        <template v-slot:item.y="{ item }"
                          ><code>{{ item.y }}</code></template
                        >

                        <template v-slot:item.id="{ item }">
                          <div class="d-flex align-center justify-end">
                            <v-tooltip
                              text="Xem chi tiết trên bản vẽ"
                              location="top"
                            >
                              <template v-slot:activator="{ props }">
                                <v-btn
                                  v-bind="props"
                                  size="small"
                                  icon="mdi-eye-outline"
                                  @click="GetZoomPnP(item.id)"
                                  color="primary"
                                  variant="text"
                                ></v-btn>
                              </template>
                            </v-tooltip>

                            <v-menu transition="scale-transition">
                              <template v-slot:activator="{ props }">
                                <v-btn
                                  v-bind="props"
                                  icon="mdi-dots-vertical"
                                  variant="text"
                                  size="small"
                                  color="grey-darken-1"
                                ></v-btn>
                              </template>
                              <v-list
                                density="compact"
                                class="rounded-lg elevation-3 py-1"
                              >
                                <v-list-item
                                  @click="GetAddSize(item)"
                                  prepend-icon="mdi-ruler"
                                  class="text-caption"
                                >
                                  <v-list-item-title
                                    >Thêm kích thước</v-list-item-title
                                  >
                                </v-list-item>
                                <v-list-item
                                  @click="GetItemEdit(item)"
                                  prepend-icon="mdi-pencil-outline"
                                  class="text-caption"
                                >
                                  <v-list-item-title
                                    >Chỉnh sửa thông tin</v-list-item-title
                                  >
                                </v-list-item>
                                <v-divider class="my-1"></v-divider>
                                <v-list-item
                                  @click="getAccessToken(item)"
                                  prepend-icon="mdi-tag-search-outline"
                                  class="text-caption"
                                  color="secondary"
                                >
                                  <v-list-item-title
                                    >Tra cứu linh kiện</v-list-item-title
                                  >
                                </v-list-item>
                              </v-list>
                            </v-menu>
                          </div>
                        </template>
                      </v-data-table-virtual>
                    </v-card>

                    <v-card
                      variant="outlined"
                      class="rounded-lg overflow-hidden d-flex flex-column align-center justify-center bg-grey-lighten-5"
                      style="height: calc(50vh - 45px)"
                    >
                      <div
                        v-if="dialogImageUrl"
                        class="pa-3 fill-height w-100 d-flex align-center justify-center bg-white"
                      >
                        <div
                          class="position-relative d-flex align-center justify-center"
                          style="width: 100%; height: 100%"
                        >
                          <v-img
                            :src="dialogImageUrl"
                            max-width="100%"
                            max-height="100%"
                            aspect-ratio="1/1"
                            class="rounded-lg elevation-1"
                            alt="Component Preview"
                          >
                            <template v-slot:placeholder>
                              <div
                                class="d-flex align-center justify-center fill-height bg-grey-lighten-4"
                              >
                                <v-progress-circular
                                  indeterminate
                                  color="primary"
                                ></v-progress-circular>
                              </div>
                            </template>
                          </v-img>

                          <div
                            style="
                              position: absolute;
                              top: 50%;
                              left: 50%;
                              transform: translate(-50%, -50%);
                              width: 100px;
                              height: 100px;
                              pointer-events: none;
                              z-index: 10;
                            "
                          >
                            <svg
                              width="100"
                              height="100"
                              viewBox="0 0 100 100"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <!-- Crosshair lines -->
                              <line
                                x1="0"
                                y1="50"
                                x2="100"
                                y2="50"
                                stroke="#D32F2F"
                                stroke-width="2"
                              />
                              <line
                                x1="50"
                                y1="0"
                                x2="50"
                                y2="100"
                                stroke="#D32F2F"
                                stroke-width="2"
                              />

                              <circle cx="50" cy="50" r="2" fill="#D32F2F" />

                              <!-- Directional arrow based on rotation -->
                              <!-- Arrow group centered at (50,50), rotated per component rotation -->
                              <!-- 0°=left, 90°=up, 180°=right, 270°=down -->
                              <g
                                :transform="`rotate(${dialogRotation}, 50, 50)`"
                              >
                                <!-- Arrow pointing LEFT at 0° -->
                                <!-- Shaft from center to left edge -->
                                <line
                                  x1="50"
                                  y1="50"
                                  x2="12"
                                  y2="50"
                                  stroke="#1565C0"
                                  stroke-width="2.5"
                                  stroke-linecap="round"
                                />
                                <!-- Arrowhead pointing left -->
                                <polygon
                                  points="8,50 16,45 16,55"
                                  fill="#1565C0"
                                />
                              </g>
                            </svg>
                          </div>
                        </div>
                      </div>

                      <v-empty-state
                        v-else
                        title="Không có hình ảnh"
                        text="Chọn hoặc xem chi tiết linh kiện để hiển thị ảnh thực tế."
                        icon="mdi-image-off-outline"
                        class="text-grey-darken-1"
                      />
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
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
    v-model="DialogAddGerber"
    width="1000"
    title="Thêm dữ liệu Gerber"
    icon="mdi-plus"
  >
    <!-- Upload files -->
    <InputFiles
      label="Nhập file Gerber (.gtp, .gbp, .gtl, .gbl, ...)"
      class="mt-2"
      v-model="FileGerber"
      accept="*"
      name="gerber"
      multiple
    />
    <v-select
      v-model="LayerGerber"
      :items="[
        { label: 'Top', value: 'Top' },
        { label: 'Bottom', value: 'Bottom' },
        // { label: 'WG Top', value: 'WG Top' },
        // { label: 'WG Bottom', value: 'WG Bottom' },
      ]"
      item-title="label"
      item-value="value"
      label="Layer"
      class="mt-3"
      density="comfortable"
      variant="outlined"
      prepend-inner-icon="mdi-layers-triple"
    />

    <!-- File list với layer selector -->
    <div v-if="gerberFileList.length > 0" class="mt-3">
      <p class="text-subtitle-2 mb-2">Danh sách file & chọn layer:</p>
      <v-table density="compact" class="rounded border">
        <thead>
          <tr>
            <th>Tên file</th>
            <th style="width: 220px">Layer</th>
            <th style="width: 40px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in gerberFileList" :key="index">
            <td>
              <div class="d-flex align-center gap-2">
                <v-icon size="16" color="grey">mdi-file-outline</v-icon>
                <span
                  class="text-body-2 text-truncate"
                  style="max-width: 350px"
                >
                  {{ item.file.name }}
                </span>
              </div>
            </td>
            <td>
              <v-select
                v-model="item.layer"
                :items="layerOptions"
                item-title="label"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="my-1"
              >
                <template #item="{ item: opt, props }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :color="opt.raw.color" size="14" class="mr-1">
                        mdi-square
                      </v-icon>
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item: opt }">
                  <v-icon :color="opt.raw.color" size="14" class="mr-1">
                    mdi-square
                  </v-icon>
                  <span class="text-body-2">{{ opt.raw.label }}</span>
                </template>
              </v-select>
            </td>
            <td>
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                color="error"
                @click="removeFile(index)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
      <p class="text-caption text-grey mt-2">
        <v-icon size="14" color="grey">mdi-information-outline</v-icon>
        Lưu ý: Layer của file Gerber sẽ là .gko .gtp, .gto, gbp, gbo.
      </p>
    </div>

    <template #actions>
      <ButtonCancel @cancel="closeDialog" />
      <ButtonSave
        @save="uploadGerber"
        :disabled="gerberFileList.length === 0"
      />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogAddSize"
    width="600"
    title="Cập nhật kích thước linh kiện"
    icon="mdi-update"
  >
    <InputField
      label="Mã linh kiện | Manufacture Part Number"
      v-model="MPN_Add_Size"
      disabled
    />
    <InputField label="Loại | Package" v-model="Package_Add_Size" />
    <v-row>
      <v-col cols="6">
        <InputField label="Chiều dài | Length (mm)" v-model="Length_Add_Size" />
      </v-col>
      <v-col cols="6">
        <InputField label="Chiều rộng | Width (mm)" v-model="Width_Add_Size" />
      </v-col>
    </v-row>
    <template #actions>
      <ButtonCancel @cancel="DialogAddSize = false" />
      <ButtonSave @save="SaveAddSize()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogRemove"
    width="400"
    title="Xoá dữ liệu"
    icon="mdi-delete"
  >
    Bạn có chắc chắn muốn xoá Bom này ?
    <template #actions>
      <ButtonCancel @cancel="DialogRemove = false" />
      <ButtonDelete @delete="RemoveItem()" />
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
    v-model="DialogCoordinateSettings"
    width="700"
    title="Cài đặt tọa độ & Căn chỉnh"
    icon="mdi-tune"
  >
    <div class="bg-blue-lighten-5 pa-3 rounded-lg mb-4 border-s-lg border-blue">
      <p class="text-caption font-weight-bold text-blue-darken-2 mb-2">
        1. Kích thước Panel thực tế:
      </p>
      <v-row density="compact">
        <v-col cols="6">
          <InputField
            v-model.number="width"
            label="Chiều rộng (W)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
            hide-details
          />
        </v-col>
        <v-col cols="6">
          <InputField
            v-model.number="height"
            label="Chiều cao (H)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
            hide-details
          />
        </v-col>
      </v-row>
    </div>

    <p class="text-caption text-grey mb-2">2. Điều chỉnh thủ công SVG (mm):</p>

    <div class="ga-2">
      <v-row>
        <v-col>
          <InputField
            v-model.number="manualOffsetGerberX"
            label="Điều chỉnh X (mm)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
        <v-col>
          <InputField
            v-model.number="manualOffsetGerberY"
            label="Điều chỉnh Y (mm)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
      </v-row>
    </div>

    <p class="text-caption text-grey mb-2">
      3. Điều chỉnh tọa độ thủ công (mm):
    </p>

    <div class="ga-2">
      <v-row>
        <v-col>
          <InputField
            v-model.number="manualOffsetX"
            label="Điều chỉnh X (mm)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
          <p class="font-weight-thin">
            Tổng Offset X: {{ totalAddedX.toFixed(2) }} mm
          </p>
          <br />
          <p class="font-weight-thin">
            Đã Offset X:
            {{ selectedLayer === "Top" ? hintOffsetX_top : hintOffsetX_bottom }}
            mm
          </p>
        </v-col>
        <v-col>
          <InputField
            v-model.number="manualOffsetY"
            label="Điều chỉnh Y (mm)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
          <p class="font-weight-thin">
            Tổng Offset Y: {{ totalAddedY.toFixed(2) }} mm
          </p>
          <br />
          <p class="font-weight-thin">
            Đã Offset Y:
            {{ selectedLayer === "Top" ? hintOffsetY_top : hintOffsetY_bottom }}
            mm
          </p>
        </v-col>
      </v-row>
    </div>
    <div class="d-flex flex-wrap ga-2 mt-2">
      <v-btn
        @click="applyManualAdjustmentX"
        color="success"
        variant="tonal"
        size="small"
        prepend-icon="mdi-cursor-pointer"
        :disabled="manualOffsetX === 0"
        class="text-caption"
      >
        Áp dụng X
      </v-btn>
      <v-btn
        @click="applyManualAdjustmentY"
        color="success"
        variant="tonal"
        size="small"
        prepend-icon="mdi-cursor-pointer"
        :disabled="manualOffsetY === 0"
        class="text-caption"
      >
        Áp dụng Y
      </v-btn>
      <v-btn
        @click="applyManualAdjustment"
        color="success"
        variant="tonal"
        size="small"
        prepend-icon="mdi-cursor-pointer"
        :disabled="manualOffsetX === 0 && manualOffsetY === 0"
        class="text-caption"
      >
        Áp dụng cả X&Y
      </v-btn>
      <v-btn
        @click="resetManualAdjustment"
        color="warning"
        variant="tonal"
        size="small"
        prepend-icon="mdi-refresh"
        class="text-caption"
      >
        Reset điều chỉnh
      </v-btn>
    </div>

    <v-divider class="my-3" />
    <p class="text-caption text-grey mb-2">4. Căn chỉnh thông minh & Tỉ lệ:</p>

    <div class="d-flex flex-wrap ga-2">
      <v-btn
        @click="autoAlignOverlay"
        color="deep-purple"
        variant="tonal"
        size="small"
        prepend-icon="mdi-auto-fix"
        :disabled="
          (!currentGerberSvg && !hasPcbImage) ||
          !filteredPnP ||
          filteredPnP.length === 0
        "
        class="text-caption"
        title="Tính toán delta đưa tâm linh kiện về tâm board"
      >
        Căn Giữa Board
      </v-btn>
      <v-btn
        @click="alignToOrigin"
        color="indigo"
        variant="tonal"
        size="small"
        prepend-icon="mdi-ray-start-arrow"
        :disabled="
          (!currentGerberSvg && !hasPcbImage) ||
          !filteredPnP ||
          filteredPnP.length === 0
        "
        class="text-caption"
        title="Đưa điểm thấp nhất của PnP về gốc tọa độ Gerber"
      >
        Căn về Gốc (Origin)
      </v-btn>
      <v-chip
        v-if="autoAlignResult"
        size="small"
        color="deep-purple"
        variant="tonal"
        class="text-caption align-self-center"
      >
        Δ X={{ autoAlignResult.dx.toFixed(2) }} Y={{
          autoAlignResult.dy.toFixed(2)
        }}
        mm
      </v-chip>
    </div>

    <v-divider class="my-3"></v-divider>
    <div class="d-flex gap-2">
      <v-btn
        @click="resetCoordinates"
        color="secondary"
        variant="tonal"
        size="small"
        class="text-caption"
      >
        Reset
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        variant="tonal"
        class="text-caption me-2"
        @click="SaveOffsetPnP()"
        >Áp dụng PnP</v-btn
      >
      <ButtonSave @save="SaveSettingPCB()" />
    </div>
  </BaseDialog>
  <BaseDialog v-model="DialogSettingPCB" title="Cài đặt PCB" max-width="600px">
    <v-card-text>
      <div class="text-body-small pa-3 text-black">
        Kích thước PCB (mm)
        <v-btn
          variant="text"
          size="small"
          class="text-caption ms-2"
          color="primary"
          prepend-icon="mdi-information-variant-circle"
        >
          <v-tooltip activator="parent" location="end"
            >Lấy kích thước PCB</v-tooltip
          >
        </v-btn>
      </div>

      <v-row>
        <v-col cols="6">
          <InputField
            v-model="width"
            label="Chiều rộng (W)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
        <v-col cols="6">
          <InputField
            v-model.number="height"
            label="Chiều cao (H)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
      </v-row>

      <div class="text-body-small pa-3 text-black">
        Khoảng cách pitch mặt Bottom (mm)
        <v-btn
          variant="text"
          size="small"
          class="text-caption ms-2"
          color="primary"
          prepend-icon="mdi-information-variant-circle"
        >
          <v-tooltip activator="parent" location="end"
            >Khoảng cách giữa 2 linh kiện cùng tên của 2 board ngoài cùng
            panel</v-tooltip
          >
        </v-btn>
      </div>

      <v-row>
        <v-col cols="6">
          <InputField
            v-model="edgeX"
            label="Khoảng cách pitch trục X"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
        <v-col cols="6">
          <InputField
            v-model.number="edgeY"
            label="Khoảng cách pitch trục Y"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
      </v-row>

      <div class="text-body-small pa-3 text-black">
        Góc xoay (độ)
        <v-btn
          variant="text"
          size="small"
          class="text-caption ms-2"
          color="primary"
          prepend-icon="mdi-information-variant-circle"
        >
          <v-tooltip activator="parent" location="end"
            >Góc xoay của PCB so với góc chuẩn</v-tooltip
          >
        </v-btn>
      </div>
      <v-row>
        <v-col cols="12">
          <InputSelect
            v-model.number="angle"
            label="Góc xoay (độ)"
            :items="[0, 90, 180]"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
      </v-row>
    </v-card-text>
    <template v-slot:actions>
      <Button-Cancel @click="DialogSettingPCB = false"></Button-Cancel>
      <Button-Save @click="SaveSettingPCB()"></Button-Save>
    </template>
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
      <p>2. Chữ màu <span style="color: orange">cam</span> là thiếu MPN.</p>
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
    v-model="DialogEditGerber"
    width="600"
    title="Danh sách file Gerber"
    icon="mdi-file-document-multiple-outline"
  >
    <v-card-text>
      <v-list density="compact" v-if="detailGerber && detailGerber.length > 0">
        <v-list-item
          v-for="(item, index) in detailGerber"
          :key="item.id || index"
          :title="item.filename || item.layer"
          :subtitle="`Bề mặt: ${item.layer} | Đơn vị: ${item.unit}`"
        >
          <template v-slot:prepend>
            <v-icon :color="LAYER_COLORS[item.layer] || 'grey'"
              >mdi-file-outline</v-icon
            >
          </template>
          <template v-slot:append>
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              size="small"
              @click="RemoveGerberData(item.id)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
      <div v-else class="text-center pa-5 text-grey">
        Chưa có file Gerber nào được tải lên.
      </div>
    </v-card-text>
    <template #actions>
      <ButtonCancel @cancel="DialogEditGerber = false" />
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
</template>
<script setup>
import axios from "axios";
import { ref, watch, computed, onMounted, reactive, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useCombineBom } from "@/composables/CheckBOM/useCombineBom";
import { useBomHighlight } from "@/composables/CheckBOM/useBomHighlight";
import { useRawBomHighlight } from "@/composables/CheckBOM/useRawBomHighlight";
import { usePnPFile } from "@/composables/CheckBOM/usePnPFile";
import { useGerberFile } from "@/composables/CheckBOM/useGerberFile";
import { useSettingPCB } from "@/composables/CheckBOM/useSettingPCB";

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
import BaseDialog from "@/components/BaseDialog.vue";

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
const clientId = import.meta.env.VITE_DIGIKEY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_DIGIKEY_CLIENT_SECRET;
const route = useRoute();
const id = route.params.id;

// --- Gerber Layer Options & Extension Map ---
/** Danh sách layer Gerber với màu sắc đặc trưng, dùng trong dialog upload */
const layerOptions = [
  { label: "Màu Đỏ", value: "copper_top", color: "#cc0000" },
  { label: "Màu Xanh", value: "copper_bottom", color: "#0000cc" },
  { label: "Màu Xanh Lá", value: "soldermask_top", color: "#00aa44" },
  { label: "Màu Xanh Lá", value: "soldermask_bottom", color: "#00aa44" },
  { label: "Màu Trắng", value: "silkscreen_top", color: "#ffffff" },
  { label: "Màu Vàng", value: "silkscreen_bottom", color: "#ffff00" },
  { label: "Màu Cam", value: "board_outline", color: "#ffaa00" },
  { label: "Màu Xám", value: "drill", color: "#888888" },
];

/** Map từ extension file Gerber sang loại layer mặc định */
const EXT_LAYER_MAP = {
  ".gtl": "copper_top",
  ".gbl": "copper_bottom",
  ".gtp": "drill",
  ".gbp": "drill",
  ".gto": "silkscreen_top",
  ".gbo": "silkscreen_bottom",
  ".gko": "board_outline",
  ".drl": "drill",
  ".exc": "drill",
  ".xln": "drill",
};

/** Map màu layer – đồng bộ với backend LAYER_COLORS */
/** Map màu layer theo chuẩn Altium Designer 2D */
const LAYER_COLORS = {
  // Copper – giảm đỏ/xanh xuống tone pastel
  copper_top: "#FF8A80", // đỏ nhạt (thay vì đỏ đậm)
  copper_bottom: "#82B1FF", // xanh nhạt

  // Soldermask – xanh lá rất nhẹ (gần như nền)
  soldermask_top: "#A5D6A7",
  soldermask_bottom: "#A5D6A7",

  // Silkscreen – giữ sáng nhưng không chói
  silkscreen_top: "#FFF9C4", // vàng rất nhạt
  silkscreen_bottom: "#F8BBD0", // hồng pastel

  // Board outline – tím nhạt (đỡ gắt hơn magenta)
  board_outline: "#CE93D8",

  // Drill – xám sáng hơn
  drill: "#E0E0E0",
};

/**
 * Patch SVG cũ trong DB: thay currentColor bằng màu layer thực.
 * Dùng DOMParser để xử lý đúng cấu trúc SVG lồng nhau.
 */
function patchSvgColors(svgString) {
  if (!svgString || !svgString.includes("currentColor")) return svgString;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) return svgString;

    // Tìm tất cả <g> có data-layer và patch các element con
    const layerGroups = svgEl.querySelectorAll("g[data-layer]");
    if (layerGroups.length > 0) {
      layerGroups.forEach((g) => {
        const layer = g.getAttribute("data-layer");
        const color = LAYER_COLORS[layer];
        if (!color) return;
        // Patch tất cả element con có fill/stroke="currentColor"
        g.querySelectorAll("[fill='currentColor']").forEach((el) =>
          el.setAttribute("fill", color),
        );
        g.querySelectorAll("[stroke='currentColor']").forEach((el) =>
          el.setAttribute("stroke", color),
        );
        // Patch chính <g> nếu cần
        if (g.getAttribute("fill") === "currentColor")
          g.setAttribute("fill", color);
        if (g.getAttribute("stroke") === "currentColor")
          g.setAttribute("stroke", color);
      });
    } else {
      // SVG đơn layer: patch toàn bộ với màu copper_top mặc định
      const defaultColor = "#cc0000";
      svgEl
        .querySelectorAll("[fill='currentColor']")
        .forEach((el) => el.setAttribute("fill", defaultColor));
      svgEl
        .querySelectorAll("[stroke='currentColor']")
        .forEach((el) => el.setAttribute("stroke", defaultColor));
    }
    return new XMLSerializer().serializeToString(doc);
  } catch (e) {
    // Fallback: regex đơn giản nếu DOMParser thất bại
    return svgString
      .replace(/\bfill="currentColor"/gi, `fill="#cc0000"`)
      .replace(/\bstroke="currentColor"/gi, `stroke="#cc0000"`);
  }
}

// ==========================================
// 2. COMPOSABLES
// ==========================================
const { combineBom } = useCombineBom(id);
const { bomHighlight } = useBomHighlight(id);
const { rawBomHighlight } = useRawBomHighlight(id);
const { detailPnP } = usePnPFile(id);
const { detailGerber, deleteGerberFile } = useGerberFile(id);
const { detailSetting } = useSettingPCB(id);

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
const DialogAddGerber = ref(false);
const DialogAddWG = ref(false);
const DialogSettingPCB = ref(false);
const DialogCoordinateSettings = ref(false);
const DialogAddSize = ref(false);
const DialogRemove = ref(false);
const DialogFailed = ref(false);
const DialogCaution = ref(false); // Warning notification
const DialogLoading = ref(false); // Loading state
const DialogSuccess = ref(false);
const DialogInfo = ref(false);
const DialogDownloadBomHighlight = ref(false);
const DialogDeleteBomHighlight = ref(false);
const DialogRemoveImage = ref(false);
const ImageToDelete = ref("");
const DialogDeletePickPlace = ref(false);
const DialogEditGerber = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");
const MessageCautionDialog = ref("");
const tab = ref(null);

// --- File & Project States ---
const project_name = ref(localStorage.getItem("BomName"));
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

const FileGerber = ref(null);
const LayerGerber = ref("Top");
const gerberFileList = ref([]);
const titleBomhighlight = ref("");

// --- Gerber & SVG View States ---
const overlayMode = ref("both"); // 'both', 'gerber', 'pnp'
const svgContainer = ref(null);
const gerberCanvas = ref(null); // Ref Cho Canvas
const zoomLevel = ref(1);
const mouseCoords = reactive({ x: 0, y: 0 });
const svgWrapper = ref(null);
const selectedLayer = ref("Top");
const selectedPnPGerber = ref([]);
const selectedPnPGrouped = ref([]);
const temporaryHighlights = ref(new Set());

let _gerberImage = null; // Image object cache cho Gerber
let _gerberImageW = 0; // Kích thước ảnh thực tế (px) sau khi render
let _gerberImageH = 0;
let _isGerberImageLoaded = false;
let _resizeObserver = null;

// --- Coordinate & Transformation States ---
const coordinateScale = ref(1);
const coordinateOffsetX = ref(0);
const coordinateOffsetY = ref(0);
const coordinateRotation = ref(0);
const showGrid = ref(false);
const showComponentBoxes = ref(true);
const pnpYOffsetMm = ref(12);

const flipX = ref(false);
const flipY = ref(false);
const swapXY = ref(false);

const cx = ref(0);
const cy = ref(0);
const rotationAngle = ref(0);
const svgRotation = ref(0);
const mirrorMode = ref("");

const totalAddedX = ref(0.0);
const totalAddedY = ref(0.0);
const totalAdjustedCountX = ref(0.0);
const totalAdjustedCountY = ref(0.0);
const hintOffsetX_top = ref(0.0);
const hintOffsetY_top = ref(0.0);
const hintOffsetX_bottom = ref(0.0);
const hintOffsetY_bottom = ref(0.0);

// --- Setting PCB States ---
const width = ref(0);
const height = ref(0);
const manualOffsetX = ref(0.0);
const manualOffsetY = ref(0.0);
const manualOffsetGerberX = ref(0.0);
const manualOffsetGerberY = ref(0.0);
const angle = ref(0);
const edgeX = ref(0);
const edgeY = ref(0);

// --- DigiKey API States ---
const GetDigikey = ref("");
const accessToken = ref(null);
const tokenType = ref(null);
const ResultSearch = ref(null);

// --- Diaglog Image States ---
const dialogOpen = ref(false);
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
  { title: "Thiếu MPN", key: "is_missing", width: "50px" },
  { title: "Thao tác", key: "id", sortable: false },
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

const HeadersPCBTop = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator", width: "150px" },
  { title: "X (mm)", key: "x" },
  { title: "Y (mm)", key: "y" },
  { title: "Rotation", key: "rotation" },
];

const HeadersPCBBottom = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator", width: "150px" },
  { title: "X (mm)", key: "x" },
  { title: "Y (mm)", key: "y" },
  { title: "Rotation", key: "rotation" },
];

const HeadersPnPGerber = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator", width: "50px" },
  { title: "X (mm)", key: "x", width: "50px" },
  { title: "Y (mm)", key: "y", width: "50px" },
  { title: "Rotation", key: "rotation", width: "50px" },
  { title: "Thao tác", key: "id", sortable: false },
];

const HeadersPnPGrouped = [
  { title: "MPN", key: "mpn", width: "150px" },
  { title: "Số lượng", key: "quantity", width: "80px" },
  { title: "Designator", key: "designators", width: "200px" },
  // { title: "Tọa độ (X, Y)", key: "coordinates", width: "200px" },
  { title: "Thao tác", key: "id", sortable: false },
];
const searchBom = ref("");
const searchBomHighlight = ref("");
const filterBomHighlightType = ref([]);
const filterBomHighlightHasImage = ref(null);
const filterBomHighlightIsMissing = ref(null);
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
const searchPCBTopLayer = ref("");
const searchPCBBottomLayer = ref("");
const searchPnPGerber = ref("");
const searchPnPGrouped = ref(""); // New
const itemPerPCBTopLayer = ref(15);
const itemPerPCBBottomLayer = ref(15);
const pagePCBTopLayer = 1;
const pagePCBBottomLayer = 1;

const MPN_Add_Size = ref("");
const Package_Add_Size = ref("");
const Length_Add_Size = ref("");
const Width_Add_Size = ref("");

const GetIDPnP = ref("");
const GetIDSize = ref("");
const Check_Size = ref("");
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

// --- Zoom & ViewBox States ---
/** ViewBox gốc của board – dùng để reset về toàn bộ board */
const baseViewBox = ref({ x: 0, y: 0, w: 0, h: 0 });

const hasPcbImage = ref(false);
const pcbFileInput = ref(null);
function handlePcbImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    _gerberImage = img;
    _gerberImageW = img.width;
    _gerberImageH = img.height;
    _isGerberImageLoaded = true;
    hasPcbImage.value = true;

    if (!baseViewBox.value || baseViewBox.value.w === 0) {
      baseViewBox.value = { x: 0, y: 0, w: img.width, h: img.height };
      _currentViewBox.x = 0;
      _currentViewBox.y = 0;
      _currentViewBox.w = img.width;
      _currentViewBox.h = img.height;
    }

    drawGerberOnCanvas();
  };
  img.src = url;
}
/**
 * ViewBox hiện tại – dùng plain object (KHÔNG phải reactive ref) để tránh
 * Vue re-render mỗi animation frame khi zoom/pan. Chỉ cập nhật DOM trực tiếp.
 */
let _currentViewBox = { x: 0, y: 0, w: 0, h: 0 };
// Alias ref chỉ dùng cho read-only binding trong template (currentIndex, etc.)
const currentViewBox = ref({ x: 0, y: 0, w: 0, h: 0 });
/** Mức phóng to khi click vào linh kiện (7 = phóng to 7×) */
const ZOOM_IN_LEVEL = 7;
/** Trạng thái đang thực hiện animation zoom */
const isZooming = ref(false);
/** Index linh kiện đang được highlight/focus trong danh sách Gerber PnP */
const currentIndex = ref(-1);

// --- Drag to Pan States ---
/** Đang kéo chuột để pan SVG */
const isDragging = ref(false);
/** Điểm bắt đầu kéo chuột (client coords) */
const dragStart = ref({ x: 0, y: 0 });
/** ViewBox tại thời điểm bắt đầu kéo */
const dragStartViewBox = ref({ x: 0, y: 0, w: 0, h: 0 });

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

const topLayerCount = computed(() => {
  if (!combineBom.value) return 0;
  return combineBom.value.filter(
    (item) => item.layer === "Top" || item.layer === "TopLayer",
  ).length;
});

const bottomLayerCount = computed(() => {
  if (!combineBom.value) return 0;
  return combineBom.value.filter(
    (item) => item.layer === "Bottom" || item.layer === "BottomLayer",
  ).length;
});

const componentsWithSize = computed(() => {
  if (!filteredPnP.value) return 0;
  return filteredPnP.value.filter(
    (p) => p.width && p.length && p.width > 0 && p.length > 0,
  ).length;
});

const pnpBounds = computed(() => {
  if (!filteredPnP.value || filteredPnP.value.length === 0) return null;
  const valid = filteredPnP.value.filter(
    (p) => typeof p.x === "number" && typeof p.y === "number",
  );
  if (valid.length === 0) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of valid) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    cxRaw: (minX + maxX) / 2,
    cyRaw: (minY + maxY) / 2,
  };
});

const currentGerberSvg = computed(() => {
  const dg = detailGerber.value;
  if (!dg) return "";
  let raw = "";
  if (Array.isArray(dg) && dg.length > 0) {
    const byLayer = dg.find(
      (item) => item && item.layer === selectedLayer.value && item.svg,
    );
    if (byLayer && typeof byLayer.svg === "string") raw = byLayer.svg;
  } else if (dg && typeof dg === "object") {
    raw = dg.svg || "";
  } else if (typeof dg === "string") {
    raw = dg;
  }
  // Patch màu: fix SVG cũ trong DB còn dùng currentColor
  return patchSvgColors(raw);
});

const currentGerberUnit = computed(() => {
  const dg = detailGerber.value;
  if (!dg) return "";
  if (Array.isArray(dg) && dg.length > 0) {
    const byLayer = dg.find(
      (item) => item && item.layer === selectedLayer.value && item.unit,
    );
    if (byLayer && typeof byLayer.unit === "string") return byLayer.unit;
    return "";
  } else if (dg && typeof dg === "object") {
    return dg.unit || "";
  } else if (typeof dg === "string") {
    return dg;
  }
  return "";
});

// Legacy currentSvgContent removed

const combinePnPGerber = computed(() => {
  if (selectedLayer.value === "Top") {
    return combineBom.value.filter(
      (item) =>
        item.layer === "Top" ||
        item.layer === "TopLayer" ||
        item.layer === "top" ||
        item.layer === "TOPLAYER" ||
        item.layer === "toplayer" ||
        item.layer === "TOP",
    );
  }
  if (selectedLayer.value === "Bottom") {
    return combineBom.value.filter(
      (item) =>
        item.layer === "Bottom" ||
        item.layer === "BottomLayer" ||
        item.layer === "bottom" ||
        item.layer === "BOTTOMLAYER" ||
        item.layer === "bottomlayer" ||
        item.layer === "BOTTOM",
    );
  }
  if (selectedLayer.value === "WG Top") {
    return resultTop.value;
  }
  if (selectedLayer.value === "WG Bottom") {
    return resultBottom.value;
  }
});

const combinePnPGerberGrouped = computed(() => {
  const baseList = combinePnPGerber.value || [];
  const groups = {};
  baseList.forEach((item) => {
    const key = item.mpn || item.ManufacturerPartNumber || "Unknown";
    if (!groups[key]) {
      groups[key] = {
        mpn: key,
        quantity: 0,
        designators: [],
        items: [],
        layer: item.layer,
        id: key, // Use MPN as ID for table
      };
    }
    groups[key].quantity++;
    groups[key].designators.push(item.designator);
    groups[key].coordinates = groups[key].coordinates || [];
    groups[key].coordinates.push(`(${item.x}, ${item.y})`);
    groups[key].items.push(item);
  });

  return Object.values(groups);
});

function getSvgViewBox(svgString) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.querySelector("svg");

    if (!svgEl) return null;

    const viewBox = svgEl.getAttribute("viewBox");
    if (!viewBox) return null;

    const parts = viewBox
      .split(/[\s,]+/)
      .filter((s) => s.length > 0)
      .map(Number);
    if (parts.length < 4 || parts.some((n) => isNaN(n))) {
      console.warn("Invalid viewBox format detected:", viewBox);
      return null;
    }

    const [minX, minY, width, height] = parts;

    return { minX, minY, width, height };
  } catch (e) {
    console.warn("getSvgViewBox error:", e);
    return null;
  }
}

function getComponentTransform(pnp, vb, isBottom, scaleValue) {
  const factor = scaleValue || 1;

  const hX = isBottom
    ? Number(hintOffsetX_bottom.value || 0)
    : Number(hintOffsetX_top.value || 0);

  const hY = isBottom
    ? Number(hintOffsetY_bottom.value || 0)
    : Number(hintOffsetY_top.value || 0);

  let x = (Number(pnp.x) + hX) * factor;
  let y = (Number(pnp.y) + hY) * factor;

  if (swapXY.value) [x, y] = [y, x];

  let tx = vb.minX + x + Number(coordinateOffsetX.value || 0) * factor;

  let ty =
    vb.minY + vb.height - y - Number(coordinateOffsetY.value || 0) * factor;

  return { tx, ty, factor };
}

const transformedPnP = computed(() => {
  return detailPnP.value.map((p) => transform(p)).filter(Boolean);
});

// --- PnP Markers Array for SVG Overlay ---
const pnpMarkersArray = computed(() => {
  if ((!currentGerberSvg.value && !hasPcbImage.value) || !filteredPnP.value)
    return [];

  const vb = currentGerberSvg.value
    ? getSvgViewBox(currentGerberSvg.value)
    : {
        minX: baseViewBox.value.x,
        minY: baseViewBox.value.y,
        width: baseViewBox.value.w,
        height: baseViewBox.value.h,
      };
  if (!vb) return [];

  const isBottom = String(selectedLayer.value || "")
    .toLowerCase()
    .includes("bottom");

  const OFFSET_X = manualOffsetGerberX.value;
  const OFFSET_Y = manualOffsetGerberY.value;
  return filteredPnP.value
    .filter((p) => p.x != null && p.y != null && p.designator)
    .map((pnp) => {
      const { tx, ty, factor } = getComponentTransform(
        pnp,
        vb,
        isBottom,
        coordinateScale.value,
      );

      const pnpRot = Number(pnp.rotation || pnp.rot || 0);
      const uiRot = Number(coordinateRotation.value || 0);

      let displayRotation;
      if (isBottom) {
        // Khi group đã flip-X, chỉ cần negate pnpRot để hướng đúng
        displayRotation = (pnpRot + uiRot) % 360;
      } else {
        displayRotation = (180 - pnpRot + uiRot) % 360;
      }
      if (displayRotation < 0) displayRotation += 360;

      let finalTx = tx + OFFSET_X * factor;
      let finalTy = ty + OFFSET_Y * factor;

      let rectW = (pnp.width || 0) * factor;
      let rectL = (pnp.length || 0) * factor;
      if (swapXY.value) [rectW, rectL] = [rectL, rectW];

      const strokeMain = factor * 0.1;
      const anchorSize = Math.max(rectW, rectL) / 2 + factor * 0.5;
      const fontSize = factor * 0.2;
      // textFlip được xử lý bởi pnpGroupFlipTransform ở SVG group level
      // Không cần scale(-1,1) riêng lẻ trên từng text

      return {
        id: pnp.id,
        designator: pnp.designator,
        transform: `translate(${finalTx}, ${finalTy}) rotate(${displayRotation})`,
        textTransform:
          `rotate(${-displayRotation})` + (isBottom ? ` scale(-1, 1)` : ""),
        rectW,
        rectL,
        strokeMain,
        anchorSize,
        fontSize,
      };
    });
});

const isBottomLayerActive = computed(() => {
  return String(selectedLayer.value || "")
    .toLowerCase()
    .includes("bottom");
});

const layerTransformStyle = computed(() => {
  return isBottomLayerActive.value
    ? { transform: "scaleX(-1)", transformOrigin: "center center" }
    : {};
});

/**
 * Transform flip-X cho SVG overlay đã được thay thế bằng CSS `layerTransformStyle`.
 */
const pnpGroupFlipTransform = computed(() => {
  return "";
});

const normalizeLayers = (layer) =>
  String(layer || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

const resultTop = computed(() =>
  transformedPnP.value.filter(
    (p) =>
      normalizeLayers(p.layer) === "toplayer" ||
      normalizeLayers(p.layer) === "top",
  ),
);

const resultBottom = computed(() =>
  transformedPnP.value.filter(
    (p) =>
      normalizeLayers(p.layer) === "bottomlayer" ||
      normalizeLayers(p.layer) === "bottom",
  ),
);
// ==========================================
// 5. LIFECYCLE HOOKS
// ==========================================

onMounted(() => {
  if (coordinateScale.value) {
    coordinateScale.value /= 0.0254;
  }
});

// 6. WATCHERS
// ==========================================

// Watch for fullscreen change to reset zoom
watch(
  () => document.fullscreenElement,
  () => {
    if (!document.fullscreenElement) {
      resetsZoom();
    }
  },
);

// Reset zoom when container size changes
watch(
  svgContainer,
  () => {
    if (svgContainer.value) {
      resetsZoom();
    }
  },
  { immediate: true },
);

watch(FileGerber, (val) => {
  if (!val) return;

  const incoming = Array.isArray(val) ? val : [val];
  const existingNames = new Set(gerberFileList.value.map((i) => i.file.name));

  incoming.forEach((file) => {
    if (existingNames.has(file.name)) return;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    const layer = EXT_LAYER_MAP[ext] ?? "copper_top";
    gerberFileList.value.push({ file, layer });
  });
});

// Watch currentSvgContent is legacy, no longer needed with Canvas architecture

watch(detailSetting, (val) => {
  if (!val.length) return;

  const found = val[0];
  hintOffsetX_top.value = Number(found.manualOffsetX_top.toFixed(2)) || 0;
  hintOffsetY_top.value = Number(found.manualOffsetY_top.toFixed(2)) || 0;
  hintOffsetX_bottom.value = Number(found.manualOffsetX_bottom.toFixed(2)) || 0;
  hintOffsetY_bottom.value = Number(found.manualOffsetY_bottom.toFixed(2)) || 0;
  manualOffsetGerberX.value = Number(found.manualOffsetGerberX) || 0;
  manualOffsetGerberY.value = Number(found.manualOffsetGerberY) || 0;

  width.value = found.width || 0;
  height.value = found.height || 0;
  edgeX.value = found.edgeX || 0;
  edgeY.value = found.edgeY || 0;

  angle.value = found.angle || 0;
});

// ==========================================
// 7. CORE FUNCTIONS
// ==========================================

// --- 7.1 File Upload Handlers ---

/**
 * Upload file BOM (.xlsx) lên server và cập nhật danh sách BOM cho project
 */
const uploadBOM = async () => {
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("FileBom", FileBom.value);
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
    MessageErrorDialog.value = "Upload Bom thất bại";
    console.error("Lỗi upload BOM:", error);
    DialogLoading.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

const uploadBOMMountType = async () => {
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
    MessageErrorDialog.value = "Upload Bom thất bại";
    DialogLoading.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

/**
 * Upload file Pick & Place (.xlsx) lên server và cập nhật tọa độ linh kiện
 */
const uploadPNP = async () => {
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("FilePnP", FilePnP.value);
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
    MessageErrorDialog.value = "Upload Pick&Place thất bại";
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

// --- 7.3 Gerber File Dialog Actions ---
/** Xóa một file Gerber khỏi danh sách theo index
 * @param {number} index - Vị trí file cần xóa
 */
const removeFile = (index) => {
  gerberFileList.value.splice(index, 1);
};

/** Đóng dialog upload Gerber và xóa danh sách file đã chọn */
const closeDialog = () => {
  DialogAddGerber.value = false;
  gerberFileList.value = [];
  FileGerber.value = null;
};

/**
 * Upload nhiều file Gerber cùng lúc lên server
 * Mỗi file có thể thuộc layer khác nhau (copper_top, copper_bottom, ...)
 */
const uploadGerber = async () => {
  if (gerberFileList.value.length === 0) return;

  DialogLoading.value = true;

  try {
    const formData = new FormData();

    // 1. append file
    gerberFileList.value.forEach(({ file }) => {
      formData.append("FileGerber", file);
    });

    // 2. append layers (JSON)
    formData.append(
      "layers",
      JSON.stringify(gerberFileList.value.map((i) => i.layer)),
    );

    // 3. append Top / Bottom (string)
    formData.append("layerGerber", LayerGerber.value);

    await axios.post(`${Url}/upload-gerber/${id}`, formData);

    DialogSuccess.value = true;
    MessageDialog.value = `Upload ${gerberFileList.value.length} file Gerber thành công`;
    closeDialog();
  } catch (error) {
    console.error("Lỗi upload Gerber:", error.response?.data || error);
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload Gerber thất bại";
  } finally {
    DialogLoading.value = false;
  }
};

// --- 7.2 Data Edit/Update Handlers ---

/**
 * Mở dialog chỉnh sửa và điền thông tin Pick & Place của item được chọn
 * @param {Object} item - Đối tượng linh kiện từ bảng BOM/PnP
 */
const GetItemEdit = (item) => {
  DialogEdit.value = true;
  GetIDPnP.value = item.id;
  PnP_X_Edit.value = item.x;
  PnP_Y_Edit.value = item.y;
  PnP_Angle_Edit.value = item.rotation;
  PnP_Type_Edit.value = item.type;
  PnP_Layer_Edit.value = item.layer;
};

const GetItemBomEdit = (item) => {
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
 * Mở dialog cập nhật kích thước linh kiện (length, width, package)
 * Xác định nguồn: 'override', 'package_map', hoặc thêm mới
 * @param {Object} item - Đối tượng linh kiện từ bảng Gerber PnP
 */
const GetAddSize = (item) => {
  DialogAddSize.value = true;
  MPN_Add_Size.value = item.mpn;
  Package_Add_Size.value = item.package;
  Length_Add_Size.value = item.length;
  Width_Add_Size.value = item.width;
  if (item.source == "override") {
    return (
      (GetIDSize.value = item.id_components_overrides),
      (Check_Size.value = item.source)
    );
  }
  if (item.source == "package_map") {
    return (
      (GetIDSize.value = item.id_component),
      (Check_Size.value = item.source),
      GetIDSize.value
    );
  }
};

/**
 * Lưu kích thước linh kiện (length, width, package)
 * Xử lý 3 trường hợp: package_map (cập nhật), override (cập nhật), mới (thêm)
 */
const SaveAddSize = async () => {
  DialogLoading.value = true;

  if (Check_Size.value == "package_map") {
    const formData = reactive({
      package: Package_Add_Size.value,
      length: Length_Add_Size.value,
      width: Width_Add_Size.value,
    });
    try {
      const response = await axios.put(
        `${Url}/Component/Edit-item/${GetIDSize.value}`,
        formData,
      );
      console.log(response.data.message);

      DialogLoading.value = false;
      DialogAddSize.value = false;
      DialogSuccess.value = true;
      MessageDialog.value = "Thêm dữ liệu thành công";
    } catch (error) {
      DialogLoading.value = false;
      DialogAddSize.value = false;
      DialogFailed.value = true;
      MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    }
  } else if (Check_Size.value == "override") {
    const formData = reactive({
      package: Package_Add_Size.value,
      length: Length_Add_Size.value,
      width: Width_Add_Size.value,
    });
    try {
      const response = await axios.put(
        `${Url}/Component-overrides/Edit-item/${GetIDSize.value}`,
        formData,
      );
      console.log(response.data.message);

      DialogLoading.value = false;
      DialogAddSize.value = false;
      DialogSuccess.value = true;
      MessageDialog.value = "Thêm dữ liệu thành công";
    } catch (error) {
      console.log(error);
      DialogLoading.value = false;
      DialogAddSize.value = false;
      DialogFailed.value = true;
      MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    }
  } else {
    const formData = reactive({
      mpn: MPN_Add_Size,
      package: Package_Add_Size.value,
      length: Length_Add_Size.value,
      width: Width_Add_Size.value,
    });
    try {
      const response = await axios.post(
        `${Url}/Component-overrides/Add-item`,
        formData,
      );
      DialogLoading.value = false;
      DialogAddSize.value = false;
      DialogSuccess.value = true;
      MessageDialog.value = "Thêm dữ liệu thành công";
    } catch (error) {
      DialogLoading.value = false;
      DialogAddSize.value = false;
      DialogFailed.value = true;
      MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    }
  }
};

/**
 * Lưu thông tin Pick & Place đã chỉnh sửa (toạ độ X/Y, góc, layer, loại hàn)
 */
const SaveEditPnP = async () => {
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
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
  }
};

const SaveEditType = async () => {
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
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
  }
};

const SaveOffsetPnP = async () => {
  DialogLoading.value = true;

  try {
    const payload = {
      offsetX: Number(totalAddedX.value) || 0,
      offsetY: Number(totalAddedY.value) || 0,
    };

    // validate
    if (isNaN(payload.offsetX) || isNaN(payload.offsetY)) {
      throw new Error("Offset không hợp lệ");
    }

    const response = await axios.put(
      `${Url}/PickPlace-BomPCB/Edit-item-offset/${route.params.id}`,
      payload,
    );

    DialogSuccess.value = true;
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    DialogCoordinateSettings.value = false;
    totalAddedX.value = 0;
    totalAddedY.value = 0;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error || "Chỉnh sửa dữ liệu thất bại";
  } finally {
    DialogLoading.value = false;
    DialogCoordinateSettings.value = false;
  }
};

/**
 * Lưu cài đặt PCB/Panel lên server:
 * offset manual (X, Y cho Top/Bottom), kích thước PCB, tọa độ gốc máy SMT,
 * rìa panel (rail), góc xoay. Reset bộ đếm offset sau khi lưu.
 */
const SaveSettingPCB = async () => {
  DialogLoading.value = true;

  const isTop = selectedLayer.value === "Top";

  const formData = {
    manualOffsetX_top: isTop
      ? toNum(hintOffsetX_top.value) + toNum(totalAddedX.value)
      : toNum(hintOffsetX_top.value),

    manualOffsetY_top: isTop
      ? toNum(hintOffsetY_top.value) + toNum(totalAddedY.value)
      : toNum(hintOffsetY_top.value),

    manualOffsetX_bottom: !isTop
      ? toNum(hintOffsetX_bottom.value) + toNum(totalAddedX.value)
      : toNum(hintOffsetX_bottom.value),

    manualOffsetY_bottom: !isTop
      ? toNum(hintOffsetY_bottom.value) + toNum(totalAddedY.value)
      : toNum(hintOffsetY_bottom.value),

    manualOffsetGerberX: toNum(manualOffsetGerberX.value),
    manualOffsetGerberY: toNum(manualOffsetGerberY.value),

    width: width.value,
    height: height.value,
    edgeX: edgeX.value,
    edgeY: edgeY.value,
    angle: angle.value,
  };

  try {
    await axios.put(`${Url}/SettingPCB/Edit-item/${id}`, formData);

    // 🔥 QUAN TRỌNG
    totalAddedX.value = 0;
    totalAddedY.value = 0;

    DialogSuccess.value = true;
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    transformedPnP.value = detailPnP.value.map(transform).filter(Boolean);
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
  } finally {
    DialogLoading.value = false;
    DialogSettingPCB.value = false;
    DialogCoordinateSettings.value = false;
  }
};

const DeleteAllBomHighlight = async () => {
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
    MessageErrorDialog.value = "Xóa dữ liệu thất bại";
    DialogDeleteBomHighlight.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

const DeleteAllPickPlace = async () => {
  DialogLoading.value = true;
  try {
    await axios.delete(`${Url}/Pickplace-BomPCB/Delete-item-pickplace/${id}`);
    DialogSuccess.value = true;
    MessageDialog.value = "Xóa dữ liệu thành công";
    DialogDeletePickPlace.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Xóa dữ liệu thất bại";
    DialogDeletePickPlace.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

const RemoveImage = async () => {
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
    MessageErrorDialog.value = "Xóa ảnh thất bại";
    DialogRemoveImage.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

const RemoveGerberData = async (id) => {
  DialogLoading.value = true;
  try {
    await axios.delete(`${Url}/Pickplace-BomPCB/Delete-item-gerber/${id}`);

    DialogSuccess.value = true;
    MessageDialog.value = "Xóa dữ liệu thành công";
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Xóa dữ liệu thất bại";
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
const SortSMT = () => {
  searchBom.value = "SMT";
};

/** Lọc bảng BOM – chỉ hiển thị linh kiện hàn tay */
const SortHand = () => {
  searchBom.value = "Hand";
};

/** Xóa bộ lọc – hiển thị tất cả linh kiện */
const ResetSort = () => {
  searchBom.value = "";
};

// ==========================================
// 7.4 COORDINATE UTILS & PCB TRANSFORM
// ==========================================
// ======================
// HELPERS
// ======================
function toNum(v) {
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function round(v) {
  return Math.round(v * 1000) / 1000;
}

function normalizeRotation(r) {
  r = r % 360;
  return r < 0 ? r + 360 : r;
}

function normalizeLayer(name) {
  return (name || "").toLowerCase().replace(/\s/g, "").replace("layer", "");
}

// ======================
// CONFIG
// ======================
function getCfgByLayer(layer) {
  const raw = detailSetting.value?.[0] || {};

  return {
    H: toNum(raw.H ?? 0) || 0,
    W: toNum(raw.W ?? 0) || 0,

    angle: normalizeRotation(toNum(raw.angle ?? 0)),

    rotationOffset: toNum(raw.rotationOffset ?? 0) || 0,

    mirrorAxis: raw.mirrorAxis || "X", // "X" hoặc "Y"
  };
}

// ======================
// MAIN TRANSFORM
// ======================
function transform(p) {
  const px = toNum(p.x);
  const py = toNum(p.y);
  let pr = toNum(p.rotation);

  if (px === null || py === null) return null;
  if (pr === null) pr = 0;

  const W = Number(width.value) || 0;
  const H = Number(height.value) || 0;

  const edgeXv = Number(edgeX.value) || 0;
  const edgeYv = Number(edgeY.value) || 0;

  const layer = normalizeLayer(p.layer);
  const isBottom = layer === "bottom";

  let x = px;
  let y = py;
  let r = normalizeRotation(pr);

  let x2, y2, r2;

  // ======================
  // ROTATE (tách riêng Top / Bottom)
  // ======================
  if (!isBottom) {
    // ===== TOP =====
    switch (angle.value) {
      case 0:
        x2 = x;
        y2 = y;
        r2 = normalizeRotation(r + angle.value);
        break;

      case 90:
        x2 = H - y;
        y2 = x;
        r2 = normalizeRotation(r + angle.value);
        break;

      case 180:
        x2 = W - x;
        y2 = H - y;
        r2 = normalizeRotation(r + angle.value);
        break;
    }
  } else {
    // ===== BOTTOM (mirror trước) =====
    const xm = W - x;

    switch (angle.value) {
      case 0:
        x2 = -(W - edgeXv - x);
        y2 = y + edgeYv;
        r2 = normalizeRotation(r - angle.value);
        break;

      case 90:
        x2 = -(y - edgeYv);
        y2 = x; // = x
        r2 = normalizeRotation(r - angle.value);
        break;

      case 180:
        x2 = edgeXv + xm; // = x
        y2 = H - (y + edgeYv);
        r2 = normalizeRotation(r - angle.value);
        break;
    }
  }

  // ======================
  // OUTPUT
  // ======================
  return {
    ...p,
    x: round(x2),
    y: round(y2),
    rotation: r2,
  };
}
// ==========================================
// 7.5 DOWNLOAD HANDLERS
// ==========================================

/**
 * Xuất dữ liệu PnP hiện tại ra file Excel (.xlsx) sử dụng ExcelJS
 * Bao gồm: Designator, X, Y, Rotation, Layer, MPN
 */
const downloadExcelPnP = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Dữ liệu SMT");

  // Tạo header
  worksheet.columns = [
    { header: "Designator", key: "designator", width: 20 },
    { header: "X-Center", key: "x", width: 20 },
    { header: "Y-Center", key: "y", width: 20 },
    { header: "Rotation", key: "rotation", width: 20 },
    { header: "Layer", key: "layer", width: 20 },
    { header: "MPN", key: "mpn", width: 50 },
  ];

  // Thêm dữ liệu từ composables
  filteredPnP.value.forEach((item) => {
    worksheet.addRow(item);
  });

  // Xuất buffer
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "DataSMT.xlsx");
};

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

/**
 * Xuất dữ liệu PCB Working (sau transform về hệ máy SMT) ra 2 file Excel:
 * PnP_Top_*.xlsx và PnP_Bottom_*.xlsx
 */
const DownloadPCB = () => {
  // 👉 Convert data
  // ===== TOP =====
  const topData = resultTop.value.map((item, index) => ({
    STT: index + 1,
    Designator: item.designator,
    MPN: item.mpn,
    X: item.x,
    Y: item.y,
    Rotation: item.rotation,
  }));

  const wsTop = XLSX.utils.json_to_sheet(topData);
  const wbTop = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbTop, wsTop, "Top");

  const bufferTop = XLSX.write(wbTop, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([bufferTop], { type: "application/octet-stream" }),
    `PnP_Top.xlsx`,
  );

  // ===== BOTTOM =====
  const bottomData = resultBottom.value.map((item, index) => ({
    STT: index + 1,
    Designator: item.designator,
    MPN: item.mpn,
    X: item.x,
    Y: item.y,
    Rotation: item.rotation,
  }));

  const wsBottom = XLSX.utils.json_to_sheet(bottomData);
  const wbBottom = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbBottom, wsBottom, "Bottom");

  const bufferBottom = XLSX.write(wbBottom, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([bufferBottom], { type: "application/octet-stream" }),
    `PnP_Bottom.xlsx`,
  );
};
// ==========================================
// 7.6 COORDINATE MANUAL ADJUSTMENT
// ==========================================

/**
 * Dịch chuyển toạ độ X của tất cả linh kiện PnP theo offset nhập tay
 * Cập nhật bộ đếm tổng delta X đã áp dụng
 */
const applyManualAdjustmentX = () => {
  if (!detailPnP.value || detailPnP.value.length === 0) {
    MessageCautionDialog.value = "Không có dữ liệu Pick&Place để điều chỉnh";
    DialogCaution.value = true;
    return;
  }

  if (manualOffsetX.value === 0) {
    MessageCautionDialog.value = "Không có điều chỉnh X nào để áp dụng";
    DialogCaution.value = true;
    return;
  }
  let adjustedCountX = 0;
  detailPnP.value = detailPnP.value.map((item) => {
    if (item.x === null) return item;

    adjustedCountX += 1;
    return {
      ...item,
      x: Number((item.x + manualOffsetX.value).toFixed(3)),
    };
  });

  totalAddedX.value += manualOffsetX.value;
  totalAdjustedCountX.value += adjustedCountX;

  MessageDialog.value = `Đã điều chỉnh X cho ${adjustedCountX} điểm Pick&Place: +${manualOffsetX.value.toFixed(
    3,
  )}mm (Cộng dồn X: +${totalAddedX.value.toFixed(
    3,
  )}mm, Tổng điểm đã cập nhật X: ${totalAdjustedCountX.value})`;
  DialogSuccess.value = true;

  manualOffsetX.value = 0;
};

/**
 * Dịch chuyển toạ độ Y của tất cả linh kiện PnP theo offset nhập tay
 * Cập nhật bộ đếm tổng delta Y đã áp dụng
 */
const applyManualAdjustmentY = () => {
  if (!detailPnP.value || detailPnP.value.length === 0) {
    MessageCautionDialog.value = "Không có dữ liệu Pick&Place để điều chỉnh";
    DialogCaution.value = true;
    return;
  }

  if (manualOffsetY.value === 0) {
    MessageCautionDialog.value = "Không có điều chỉnh Y nào để áp dụng";
    DialogCaution.value = true;
    return;
  }

  let adjustedCountY = 0;
  detailPnP.value = detailPnP.value.map((item) => {
    if (item.y === null) return item;

    adjustedCountY += 1;
    return {
      ...item,
      y: Number((item.y + manualOffsetY.value).toFixed(3)),
    };
  });

  totalAddedY.value += manualOffsetY.value;
  totalAdjustedCountY.value += adjustedCountY;

  MessageDialog.value = `Đã điều chỉnh Y cho ${adjustedCountY} điểm Pick&Place: +${manualOffsetY.value.toFixed(
    3,
  )}mm (Cộng dồn Y: +${totalAddedY.value.toFixed(
    3,
  )}mm, Tổng điểm đã cập nhật Y: ${totalAdjustedCountY.value})`;
  DialogSuccess.value = true;

  manualOffsetY.value = 0;
};

/**
 * Dịch chuyển đồng thời cả X và Y của tất cả linh kiện Pick & Place
 */
const applyManualAdjustment = () => {
  if (!detailPnP.value || detailPnP.value.length === 0) {
    MessageCautionDialog.value = "Không có dữ liệu Pick&Place để điều chỉnh";
    DialogCaution.value = true;
    return;
  }

  if (manualOffsetX.value === 0 && manualOffsetY.value === 0) {
    MessageCautionDialog.value = "Không có điều chỉnh nào để áp dụng";
    DialogCaution.value = true;
    return;
  }

  let adjustedCountX = 0;
  let adjustedCountY = 0;
  detailPnP.value = detailPnP.value.map((item) => {
    const hasX = item.x !== null;
    const hasY = item.y !== null;
    if (!hasX && !hasY) return item;

    if (hasX) adjustedCountX += 1;
    if (hasY) adjustedCountY += 1;

    return {
      ...item,
      x: hasX ? Number((item.x + manualOffsetX.value).toFixed(2)) : item.x,
      y: hasY ? Number((item.y + manualOffsetY.value).toFixed(2)) : item.y,
    };
  });

  if (manualOffsetX.value !== 0) {
    totalAddedX.value += manualOffsetX.value;
    totalAdjustedCountX.value += adjustedCountX;
  }
  if (manualOffsetY.value !== 0) {
    totalAddedY.value += manualOffsetY.value;
    totalAdjustedCountY.value += adjustedCountY;
  }

  MessageDialog.value = `Đã điều chỉnh ${
    adjustedCountX + adjustedCountY
  } cập nhật: X +${manualOffsetX.value.toFixed(
    3,
  )}mm (cộng dồn: +${totalAddedX.value.toFixed(3)}mm, điểm X: ${
    totalAdjustedCountX.value
  }), Y +${manualOffsetY.value.toFixed(
    3,
  )}mm (cộng dồn: +${totalAddedY.value.toFixed(3)}mm, điểm Y: ${
    totalAdjustedCountY.value
  })`;
  DialogSuccess.value = true;

  manualOffsetX.value = 0;
  manualOffsetY.value = 0;
};

/** Đặt lại giá trị offset thủ công X và Y về 0 (không lưu vào CSDL) */
const resetManualAdjustment = () => {
  manualOffsetX.value = 0;
  manualOffsetY.value = 0;
  MessageDialog.value = "Đã reset điều chỉnh thủ công";
  DialogSuccess.value = true;
};

// --- Kết quả lần auto-align gần nhất (hiển thị chip) ---
const autoAlignResult = ref(null);

/**
 * Tự động căn chỉnh overlay PnP khớp với Gerber (Tính toán theo mm):
 * 1. Tính tâm của các linh kiện PnP trong file (đơn vị mm)
 * 2. Tính tâm của Board PCB (đơn vị mm = L/2, W/2)
 * 3. Độ lệch Delta = Tâm_Board - Tâm_PnP
 * 4. Cập nhật Delta vào các ô Nhập tay (manualOffsetX/Y)
 */
const autoAlignOverlay = () => {
  const list = filteredPnP.value?.filter((p) => p.x != null && p.y != null);
  if (!list || list.length === 0) {
    MessageCautionDialog.value = "Không có dữ liệu PnP hợp lệ trên layer này";
    DialogCaution.value = true;
    return;
  }

  if (width.value <= 0 || height.value <= 0) {
    MessageCautionDialog.value =
      "Vui lòng nhập Chiều rộng (W) và Chiều cao (H) của PCB trước";
    DialogCaution.value = true;
    return;
  }

  // --- BƯỚC 1: Tính tâm của các linh kiện PnP (mm) ---
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  list.forEach((p) => {
    const px = Number(p.x);
    const py = Number(p.y);
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  });

  const pnpCenterX = (minX + maxX) / 2;
  const pnpCenterY = (minY + maxY) / 2;

  // --- BƯỚC 2: Tính tâm của PCB (mm) ---
  // Lấy viewBox từ SVG để biết điểm bắt đầu thực tế (mm)
  const vb = getSvgViewBox(currentGerberSvg.value);
  const factor = 1000 / 25.4;
  const startX = vb ? vb.minX / factor : 0;
  const startY = vb ? vb.minY / factor : 0;

  const pcbCenterX = startX + width.value / 2;
  const pcbCenterY = startY + height.value / 2;

  // --- BƯỚC 3: Tính Delta cần bù (mm) ---
  const dx = pcbCenterX - pnpCenterX;
  const dy = pcbCenterY - pnpCenterY;

  // --- BƯỚC 4: Điền vào ô nhập tay ---
  manualOffsetX.value = Number(dx.toFixed(3));
  manualOffsetY.value = Number(dy.toFixed(3));

  // Reset SVG offset để tránh cộng dồn sai
  coordinateOffsetX.value = 0;
  coordinateOffsetY.value = 0;

  autoAlignResult.value = { dx, dy };

  MessageDialog.value = `Căn Giữa: Đã tính toán Delta X=${dx.toFixed(
    2,
  )}mm, Y=${dy.toFixed(2)}mm. Nhấn "Áp dụng" để xem thử.`;
  DialogSuccess.value = true;
};

/**
 * Đưa điểm thấp nhất (Min-X, Min-Y) của các linh kiện PnP về mốc zero của board.
 * Thường dùng khi board Gerber có origin ở góc dưới cùng bên trái.
 */
const alignToOrigin = () => {
  const list = filteredPnP.value?.filter((p) => p.x != null && p.y != null);
  if (!list || list.length === 0) {
    MessageCautionDialog.value = "Không có dữ liệu PnP hợp lệ";
    DialogCaution.value = true;
    return;
  }

  // Lấy giá trị nhỏ nhất trong PnP
  let minX = Infinity;
  let minY = Infinity;

  list.forEach((p) => {
    const px = Number(p.x);
    const py = Number(p.y);
    if (px < minX) minX = px;
    if (py < minY) minY = py;
  });

  // Delta để đưa Min-X, Min-Y về (0,0)
  const dx = -minX;
  const dy = -minY;

  manualOffsetX.value = Number(dx.toFixed(3));
  manualOffsetY.value = Number(dy.toFixed(3));

  // Reset SVG offset
  coordinateOffsetX.value = 0;
  coordinateOffsetY.value = 0;

  autoAlignResult.value = { dx, dy };

  MessageDialog.value = `Căn Origin: Đã dịch chuyển sao cho MinX=${minX}mm -> 0, MinY=${minY}mm -> 0.`;
  DialogSuccess.value = true;
};

/**
 * Đặt lại toàn bộ cài đặt toạ độ về mặc định:
 * offset, rotation, flip, swap, manual, pan/zoom
 */
const resetCoordinates = () => {
  coordinateOffsetX.value = 0;
  coordinateOffsetY.value = 0;
  coordinateRotation.value = 0;
  resetsZoom();
};

/**
 * Tính toạ độ tâm board PnP sau khi áp dụng scale và offset
 * @returns {{ cxT: number, cyT: number }}
 */
const getTransformedCenter = () => {
  if (!pnpBounds.value) return { cxT: 0, cyT: 0 };
  const cxT =
    pnpBounds.value.cxRaw * coordinateScale.value + coordinateOffsetX.value;
  const cyT =
    pnpBounds.value.cyRaw * coordinateScale.value + coordinateOffsetY.value;
  return { cxT, cyT };
};

/**
 * Biến đổi toạ độ thực sang toạ độ hiển thị theo scale/offset/flip/swap
 * @param {number} x - Toạ độ X gốc
 * @param {number} y - Toạ độ Y gốc
 * @returns {{ x: number, y: number }}
 */
const getTransformedCoordinates = (x, y) => {
  let transformedX = x * coordinateScale.value + coordinateOffsetX.value;
  let transformedY = y * coordinateScale.value + coordinateOffsetY.value;

  const { cxT, cyT } = getTransformedCenter();
  if (flipX.value) transformedX = 2 * cxT - transformedX;
  if (flipY.value) transformedY = 2 * cyT - transformedY;
  if (swapXY.value) [transformedX, transformedY] = [transformedY, transformedX];

  return { x: transformedX, y: transformedY };
};

// ==========================================
// 7.7 SVG VIEWER INTERACTION
// ==========================================

/**
 * Lấy chiều cao SVG từ viewBox hoặc thuộc tính height
 * @param {string} svgString - Nội dung SVG dạng chuỗi
 * @returns {number|null}
 */
const getSvgRenderedHeight = (svgString) => {
  if (typeof svgString !== "string") return null;
  const viewBoxMatch = svgString.match(/viewBox\s*=\s*"([^"]+)"/i);
  if (viewBoxMatch && viewBoxMatch[1]) {
    const parts = viewBoxMatch[1]
      .trim()
      .split(/\s+/)
      .map((n) => Number(n));
    if (parts.length === 4 && parts.every((v) => Number.isFinite(v))) {
      return parts[3];
    }
  }
  const heightMatch = svgString.match(/height\s*=\s*"([^"]+)"/i);
  if (heightMatch && heightMatch[1]) {
    const val = heightMatch[1].trim();
    const num = Number(val.replace(/[^0-9.+-]/g, ""));
    if (Number.isFinite(num)) return num;
  }
  return null;
};

/**
 * Theo dõi vị trí chuột trong SVG, chuyển sang toạ độ board (mm) theo thời gian thực
 * Cập nhật mouseCoords.x và mouseCoords.y
 * @param {MouseEvent} event
 */
const handleMouseMoveSVG = (event) => {
  const svgElement = document.getElementById("gerber-svg");
  if (!svgElement) return;

  const point = svgElement.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;

  try {
    const ctm = svgElement.getScreenCTM().inverse();
    const svgPoint = point.matrixTransform(ctm);
    const scale = coordinateScale.value || 1;
    const offsetX = coordinateOffsetX.value || 0;
    const offsetY = coordinateOffsetY.value || 0;

    let boardX = (svgPoint.x - offsetX) / scale;
    let boardY = (svgPoint.y - offsetY) / scale;

    mouseCoords.x = boardX.toFixed(2);
    mouseCoords.y = boardY.toFixed(2);
  } catch (e) {}
};

// ==========================================
// 7.7 ZOOM & PAN – MOUSE WHEEL + DRAG
// ==========================================

/** Cache SVG element để tránh querySelector() mỗi event */
let _cachedSvgEl = null;
function getCachedSvgEl() {
  if (!_cachedSvgEl || !_cachedSvgEl.isConnected) {
    _cachedSvgEl = svgWrapper.value;
  }
  return _cachedSvgEl;
}

/** Cache rect để tránh getBoundingClientRect() mỗi wheel event */
let _cachedRect = null;
let _rectStaleTimer = null;
function getCachedRect(svgEl) {
  if (!_cachedRect) {
    _cachedRect = svgEl.getBoundingClientRect();
    // Invalidate sau 200ms (đủ để cover cả chuỗi wheel events)
    clearTimeout(_rectStaleTimer);
    _rectStaleTimer = setTimeout(() => {
      _cachedRect = null;
    }, 200);
  }
  return _cachedRect;
}

/**
 * Zoom SVG bằng con lăn chuột, tâm zoom tại vị trí con trỏ
 * Dùng plain object _currentViewBox thay vì reactive ref để tránh Vue re-render.
 */
function handleWheelZoom(event) {
  event.preventDefault();
  if (!baseViewBox.value || baseViewBox.value.w === 0) return;

  const svgEl = getCachedSvgEl();
  if (!svgEl) return;

  // Tỉ lệ zoom mỗi bước cuộn (12%)
  const ZOOM_FACTOR = 0.12;
  const direction = event.deltaY < 0 ? -1 : 1; // -1 = zoom in, 1 = zoom out
  const factor = 1 + direction * ZOOM_FACTOR;

  // Giới hạn kích thước viewBox
  const MIN_W = baseViewBox.value.w / 50;
  const MAX_W = baseViewBox.value.w * 5;

  const newW = Math.min(Math.max(_currentViewBox.w * factor, MIN_W), MAX_W);
  const newH = _currentViewBox.h * (newW / _currentViewBox.w);

  // Chuyển vị trí con trỏ sang tọa độ SVG viewBox (dùng cached rect)
  const rect = getCachedRect(svgEl);
  let ratioX = (event.clientX - rect.left) / rect.width;
  if (isBottomLayerActive.value) {
    ratioX = 1 - ratioX;
  }
  const ratioY = (event.clientY - rect.top) / rect.height;

  // Tính tọa độ SVG tại vị trí con trỏ TRƯỚC khi zoom
  const svgCursorX = _currentViewBox.x + ratioX * _currentViewBox.w;
  const svgCursorY = _currentViewBox.y + ratioY * _currentViewBox.h;

  // Điều chỉnh origin sao cho điểm dưới con trỏ không bị dịch
  _currentViewBox.x = svgCursorX - ratioX * newW;
  _currentViewBox.y = svgCursorY - ratioY * newH;
  _currentViewBox.w = newW;
  _currentViewBox.h = newH;

  // Cập nhật zoomLevel ref để trigger LOD CSS
  if (baseViewBox.value.w > 0) {
    zoomLevel.value = baseViewBox.value.w / newW;
  }

  applyViewBox();
}

/** Drag state – plain objects để tránh Vue overhead trong hot path */
let _dragStartX = 0;
let _dragStartY = 0;
let _dragStartVB = { x: 0, y: 0, w: 0, h: 0 };
let _dragRect = null;

/** Bắt đầu kéo chuột để pan SVG */
function handleDragStart(event) {
  if (event.button !== 0) return;
  isDragging.value = true;
  _dragStartX = event.clientX;
  _dragStartY = event.clientY;
  _dragStartVB = { ..._currentViewBox };
  // Cache rect tại thời điểm bắt đầu drag để tránh reflow mỗi mousemove
  const svgEl = getCachedSvgEl();
  _dragRect = svgEl ? svgEl.getBoundingClientRect() : null;
  event.preventDefault();
}

/** RAF handle cho mousemove throttle */
let _mouseMoveRAF = null;

/** Di chuyển chuột khi đang kéo – pan SVG theo delta */
function handleDragMove(event) {
  if (!isDragging.value) return;
  if (!_dragRect) return;

  // Throttle với RAF để tránh xử lý quá nhiều mousemove events
  if (_mouseMoveRAF) return;
  _mouseMoveRAF = requestAnimationFrame(() => {
    _mouseMoveRAF = null;
    // Tỉ lệ: 1 pixel client = bao nhiêu đơn vị SVG
    const scaleX = _dragStartVB.w / _dragRect.width;
    const scaleY = _dragStartVB.h / _dragRect.height;

    let dxScreen = (event.clientX - _dragStartX) * scaleX;
    let dx = isBottomLayerActive.value ? -dxScreen : dxScreen;
    let dy = (event.clientY - _dragStartY) * scaleY;

    _currentViewBox.x = _dragStartVB.x - dx;
    _currentViewBox.y = _dragStartVB.y - dy;
    // w, h không thay đổi khi drag

    applyViewBoxDirect(); // Dùng direct không qua RAF queue kép
  });
}

/** Kết thúc kéo chuột */
function handleDragEnd() {
  isDragging.value = false;
  _mouseMoveRAF = null;
}

// Legacy svgPanZoom functions removed

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
  GetDigikey.value = found.mpn;

  const tokenUrl = "https://api.digikey.com/v1/oauth2/token";
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId); // <-- Bổ sung
  params.append("client_secret", clientSecret); // <-- Bổ sung

  try {
    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    accessToken.value = response.data.access_token;
    tokenType.value = response.data.token_type;

    console.log("Đã lấy access token thành công:", accessToken.value);

    if (accessToken.value && tokenType.value && GetDigikey.value) {
      return await searchProduct();
    }

    return true;
  } catch (error) {
    console.error(
      "Lỗi khi lấy access token:",
      error.response ? error.response.data : error.message,
    );
    MessageErrorDialog.value = "Lỗi khi lấy access token";
    return false;
  }
};

/**
 * Tìm kiếm thông tin sản phẩm trên DigiKey bằng MPN (accessToken phải có sẵn)
 * Hiển thị kết quả trong DialogInfo
 */
const searchProduct = async () => {
  if (!accessToken.value) {
    console.error("Chưa có access token. Vui lòng lấy token trước.");
    return;
  }

  const searchUrl = `https://api.digikey.com/products/v4/search/${GetDigikey.value}/productdetails`;

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        Authorization: `${tokenType.value} ${accessToken.value}`,
        "Content-Type": "application/json",
        "X-DIGIKEY-Client-Id": `${clientId}`,
      },
    });
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

// ==========================================
// 8. HELPER FUNCTIONS
// ==========================================

/**
 * Trả về style màu sắc theo trạng thái layer
 * @param {string} status - 'bottom' hoặc 'top'
 * @returns {Object} style object
 */
const getColor = (status) => {
  if (status === "bottom") {
    return {
      color: "red",
      fontWeight: "bold",
    };
  }
  return {};
};

// ==========================================
// 9. SVG ZOOM & COMPONENT NAVIGATION
// ==========================================

/**
 * Khởi tạo Gerber Viewer: parse viewBox, setup Canvas, fit view, load image.
 * Gọi khi SVG data thay đổi HOẶC khi user chuyển sang tab chứa viewer.
 */
function initGerberViewer(svgString) {
  if (!svgString) return;
  _cachedSvgEl = null;
  _cachedRect = null;

  const vb = getSvgViewBox(svgString);
  if (!vb) return;

  baseViewBox.value = {
    x: vb.minX,
    y: vb.minY,
    w: vb.width,
    h: vb.height,
  };

  setupSvgStaticAttributes();

  const container = svgContainer.value;
  const rect = container ? container.getBoundingClientRect() : null;

  // Luôn bắt đầu với Fit-to-Board (viewport = toàn bộ board)
  // KHÔNG dùng Zoom-1 (px = SVG unit) vì Gerber SVG không dùng hệ đơn vị pixel
  _currentViewBox.x = vb.minX;
  _currentViewBox.y = vb.minY;
  _currentViewBox.w = vb.width;
  _currentViewBox.h = vb.height;

  currentViewBox.value = { ..._currentViewBox };

  prepareGerberImage(svgString);
  applyViewBox();
  initResizeObserver();
}

// Theo dõi khi SVG data thay đổi
watch(
  () => currentGerberSvg.value,
  (newSvg) => {
    if (!newSvg) return;
    // nextTick để đảm bảo DOM đã render (nếu tab đang active)
    nextTick(() => {
      if (svgContainer.value) {
        // Tab Gerber đang active → init luôn
        initGerberViewer(newSvg);
      }
      // Nếu container chưa có (user đang ở tab khác),
      // watch(tab) bên dưới sẽ gọi initGerberViewer khi user chuyển sang
    });
  },
);

// Theo dõi khi user chuyển sang tab Gerber hoặc Check MPN
// để khởi tạo viewer nếu data đã sẵn sàng nhưng DOM mới vừa mount
watch(tab, (newTab) => {
  if ((newTab === 3 || newTab === 4) && currentGerberSvg.value) {
    // Đợi DOM của tab window item render xong
    nextTick(() => {
      initGerberViewer(currentGerberSvg.value);
    });
  }
});

/**
 * Theo dõi kích thước container để cập nhật độ phân giải Canvas
 */
function initResizeObserver() {
  if (_resizeObserver) _resizeObserver.disconnect();
  const container = svgContainer.value;
  if (!container) return;

  _resizeObserver = new ResizeObserver(() => {
    setupSvgStaticAttributes();
    drawGerberOnCanvas();
  });
  _resizeObserver.observe(container);
}

/**
 * Áp dụng _currentViewBox lên SVG DOM trực tiếp (không throttle, không Vue)
 * Dùng cho animation để không bị drop frame
 */
/**
 * Áp dụng _currentViewBox lên SVG và Canvas trực tiếp
 */
function applyViewBoxDirect() {
  const svgEl = getCachedSvgEl();
  const canvasEl = gerberCanvas.value;
  if (!svgEl || !canvasEl) return;

  const { x, y, w, h } = _currentViewBox;
  if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) return;

  // 1. Cập nhật viewBox cho SVG (Markers)
  svgEl.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);

  // 2. Vẽ lại Canvas (Gerber)
  drawGerberOnCanvas();
}

/**
 * Vẽ ảnh Gerber đã cache lên Canvas dựa trên _currentViewBox
 */
function drawGerberOnCanvas() {
  const canvas = gerberCanvas.value;
  if (!canvas || !_gerberImage || !_isGerberImageLoaded) return;

  const bvb = baseViewBox.value;
  const cvb = _currentViewBox;
  if (!bvb || bvb.w === 0 || bvb.h === 0 || cvb.w === 0 || cvb.h === 0) return;
  if (!_gerberImageW || !_gerberImageH) return;

  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.width / dpr;
  const cssH = canvas.height / dpr;

  const ctx = canvas.getContext("2d");

  // Reset về physical px để clear đúng toàn bộ canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Scale DPR để draw trong CSS coordinate space (sắc nét trên màn Retina)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Map currentViewBox (SVG units) → source region trong image pixels
  // Chuẩn hóa qua baseViewBox để không phụ thuộc vào đơn vị SVG (mils/mm/...)
  const srcX = ((cvb.x - bvb.x) / bvb.w) * _gerberImageW;
  const srcY = ((cvb.y - bvb.y) / bvb.h) * _gerberImageH;
  const srcW = (cvb.w / bvb.w) * _gerberImageW;
  const srcH = (cvb.h / bvb.h) * _gerberImageH;

  // Lớp vẽ Gerber lên canvas. Viewport đã được chuẩn hóa bởi `cvb`.
  // Flip-X cho mặt Bottom đã được xử lý bằng CSS via `layerTransformStyle`.

  ctx.drawImage(_gerberImage, srcX, srcY, srcW, srcH, 0, 0, cssW, cssH);
}

/**
 * Chuyển đổi SVG String sang Image object để cache
 */
function prepareGerberImage(svgString) {
  if (!svgString) {
    _gerberImage = null;
    _gerberImageW = 0;
    _gerberImageH = 0;
    _isGerberImageLoaded = false;
    return;
  }

  let processedSvg = svgString;
  if (!processedSvg.includes("http://www.w3.org/2000/svg")) {
    processedSvg = processedSvg.replace(
      "<svg",
      '<svg xmlns="http://www.w3.org/2000/svg"',
    );
  }

  // Dùng kích thước cố định hợp lý (MAX 4096px) thay vì viewBox width/height
  // Tránh browser từ chối render ảnh quá lớn (vd: Gerber mils = 100000px)
  const vb = getSvgViewBox(processedSvg);
  if (vb && vb.width > 0 && vb.height > 0) {
    const MAX_DIM = 4096;
    const aspect = vb.width / vb.height;
    const imgW = aspect >= 1 ? MAX_DIM : Math.round(MAX_DIM * aspect);
    const imgH = aspect >= 1 ? Math.round(MAX_DIM / aspect) : MAX_DIM;
    _gerberImageW = imgW;
    _gerberImageH = imgH;
    // Ghi đè width/height tường minh (loại bỏ giá trị cũ nếu có)
    processedSvg = processedSvg.replace(/<svg([^>]*)>/, (match, attrs) => {
      const cleaned = attrs
        .replace(/\s+width="[^"]*"/g, "")
        .replace(/\s+height="[^"]*"/g, "");
      return `<svg${cleaned} width="${imgW}" height="${imgH}">`;
    });
  }

  _isGerberImageLoaded = false;
  const img = new Image();
  const svgBlob = new Blob([processedSvg], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    _gerberImage = img;
    _isGerberImageLoaded = true;
    URL.revokeObjectURL(url);
    drawGerberOnCanvas();
  };
  img.onerror = (err) => {
    console.error("Lỗi khi load Gerber Image sang Canvas:", err);
    URL.revokeObjectURL(url);
    _isGerberImageLoaded = false;
    _gerberImageW = 0;
    _gerberImageH = 0;
  };
  img.src = url;
}

/**
 * Thiết lập các thuộc tính tĩnh cho SVG một lần duy nhất
 */
function setupSvgStaticAttributes() {
  const svgEl = getCachedSvgEl();
  if (svgEl) {
    svgEl.style.width = "100%";
    svgEl.style.height = "100%";
    svgEl.setAttribute("preserveAspectRatio", "none");
    // Dùng 'none' để canvas và SVG overlay dùng cùng scale X/Y
    // Nếu dùng 'xMidYMid meet': SVG letterbox nhưng canvas stretch → lệch không đều!
  }

  const canvas = gerberCanvas.value;
  const container = svgContainer.value;
  if (canvas && container) {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    // KHÔNG setTransform ở đây — drawGerberOnCanvas tự xử lý DPR
    // Tránh conflict giữa ctx transform cũ và drawImage coords mới
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true; // Cho Gerber SVG scale mượt
  }
}

/**
 * Áp dụng _currentViewBox lên SVG DOM, dùng RAF để skip duplicate frames.
 * Pattern: luôn ghi _rafPending state, RAF callback sẽ đọc giá trị MỚI NHẤT.
 */
let _rafPending = false;
function applyViewBox() {
  if (_rafPending) return; // Đã có frame pending, RAF sẽ tự lấy state mới nhất
  _rafPending = true;
  requestAnimationFrame(() => {
    _rafPending = false;
    applyViewBoxDirect();
  });
}

/**
 * Zoom SVG đến một điểm cụ thể với animation mượt mà
 * @param {number} svgX - Tọa độ X trong hệ SVG viewBox
 * @param {number} svgY - Tọa độ Y trong hệ SVG viewBox
 * @param {number} targetZoomLevel - Mức zoom (7 = phóng to 7× board)
 */
async function zoomToSvgPoint(svgX, svgY, targetZoomLevel) {
  const targetW = baseViewBox.value.w / targetZoomLevel;
  const targetH = baseViewBox.value.h / targetZoomLevel;

  const targetX = svgX - targetW / 2;
  const targetY = svgY - targetH / 2;

  await animateViewBox(targetX, targetY, targetW, targetH, 350);
}

/**
 * Animation ViewBox từ trạng thái hiện tại sang trạng thái đích (ease-in-out)
 * @param {number} toX, toY - Góc trên trái viewBox đích
 * @param {number} toW, toH - Kích thước viewBox đích
 * @param {number} duration - Thời gian animation (ms)
 * @returns {Promise}
 */
function animateViewBox(toX, toY, toW, toH, duration) {
  return new Promise((resolve) => {
    // Dùng plain values (không reactive) cho hot animation path
    const startX = _currentViewBox.x;
    const startY = _currentViewBox.y;
    const startW = _currentViewBox.w;
    const startH = _currentViewBox.h;
    const start = performance.now();

    const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const e = ease(t);

      // Cập nhật plain object – không trigger Vue reactivity
      _currentViewBox.x = startX + (toX - startX) * e;
      _currentViewBox.y = startY + (toY - startY) * e;
      _currentViewBox.w = startW + (toW - startW) * e;
      _currentViewBox.h = startH + (toH - startH) * e;

      // Cập nhật zoom-level để trigger LOD CSS
      if (baseViewBox.value.w > 0) {
        zoomLevel.value = baseViewBox.value.w / _currentViewBox.w;
      }

      applyViewBoxDirect(); // Thao tác DOM trực tiếp, không qua Vue

      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

/**
 * Highlight linh kiện trên SVG theo designator
 * Xóa highlight cũ → tìm marker theo data-designator → thêm class → tự xóa sau 1s
 * @param {string} designator - Mã designator (vd: R1, C2, U3)
 */
let highlightTimer = null;
function highlightComponent(designator) {
  highlightComponents([designator]);
}

/**
 * Hiệu ứng highlight cho danh sách linh kiện trên viewer
 * @param {string[]} designators - Danh sách mã designator
 */
function highlightComponents(designators) {
  // Cập nhật temporaryHighlights để watcher tự động kích hoạt applySelectionHighlights
  temporaryHighlights.value = new Set(designators);

  // Xóa timer cũ nếu có
  if (highlightTimer) {
    clearTimeout(highlightTimer);
    highlightTimer = null;
  }

  // Tự động xóa highlight tạm thời sau 3 giây
  highlightTimer = setTimeout(() => {
    temporaryHighlights.value = new Set();
    highlightTimer = null;
    openImage(null);
  }, 60000);
}

/**
 * Tổng hợp tất cả các designator cần highlight (từ selection + temporary)
 */
const allActiveHighlights = computed(() => {
  const highlights = new Set();

  // 1. Phác thảo từ selection bảng individual
  selectedPnPGerber.value.forEach((id) => {
    const item = combinePnPGerber.value.find((i) => i.id === id);
    if (item && item.designator) highlights.add(item.designator);
  });

  // 2. Phác thảo từ selection bảng grouped
  selectedPnPGrouped.value.forEach((groupId) => {
    const group = combinePnPGerberGrouped.value.find((g) => g.id === groupId);
    if (group && group.designators) {
      group.designators.forEach((d) => highlights.add(d));
    }
  });

  // 3. Phác thảo từ temporary highlights (zoom/search)
  temporaryHighlights.value.forEach((d) => highlights.add(d));

  return highlights;
});

/**
 * Áp dụng class highlight vào DOM SVG một cách trực tiếp để tối ưu hiệu năng
 */
function applySelectionHighlights() {
  if (!svgWrapper.value) return;

  const markers = svgWrapper.value.querySelectorAll(".pnp-marker");
  const activeSet = allActiveHighlights.value;

  markers.forEach((marker) => {
    const designator = marker.getAttribute("data-designator");
    if (activeSet.has(designator)) {
      marker.classList.add("highlighted-pnp");
    } else {
      marker.classList.remove("highlighted-pnp");
    }
  });
}

// Watchers để cập nhật highlight
watch(allActiveHighlights, () => {
  applySelectionHighlights();
});

watch(pnpMarkersArray, () => {
  nextTick(() => {
    applySelectionHighlights();
  });
});

/**
 * Zoom SVG đến vị trí linh kiện theo ID và highlight linh kiện đó
 * @param {string|number} componentId - ID của linh kiện cần zoom tới
 */
async function GetZoomPnP(componentId) {
  const pnp = filteredPnP.value?.find((p) => p.id === componentId);
  if (
    !pnp ||
    !baseViewBox.value ||
    isNaN(baseViewBox.value.w) ||
    baseViewBox.value.w === 0
  )
    return;

  // Kiểm tra tọa độ pnp có hợp lệ không
  if (isNaN(Number(pnp.x)) || isNaN(Number(pnp.y))) {
    console.warn("Linh kiện có tọa độ không hợp lệ:", pnp.designator, {
      x: pnp.x,
      y: pnp.y,
    });
    return;
  }

  // ViewBox hiện tại của board
  const vb = {
    minX: baseViewBox.value.x,
    minY: baseViewBox.value.y,
    width: baseViewBox.value.w,
    height: baseViewBox.value.h,
  };

  const isBottom = String(selectedLayer.value || "")
    .toLowerCase()
    .includes("bottom");

  // 1. Lấy tọa độ thô (thanh toán với cùng quy chuẩn logic với lớp overlay)
  let { tx, ty, factor } = getComponentTransform(
    pnp,
    vb,
    isBottom,
    coordinateScale.value,
  );

  // 2. Đồng bộ OFFSET (phải khớp với svgWithPnP dùng manualOffsetGerberX/Y)
  const OFFSET_X = manualOffsetGerberX.value;
  const OFFSET_Y = manualOffsetGerberY.value;

  tx += OFFSET_X * factor;
  ty += OFFSET_Y * factor;

  // 3. Thực hiện Zoom đến điểm (tx, ty) đã tính toán
  // ZOOM_IN_LEVEL ví dụ là 8 hoặc 10 tùy độ soi kỹ

  // await zoomToSvgPoint(tx, ty, 3);
  highlightComponent(pnp.designator);

  // 4. Crop hình ảnh tới vị trí crosshair và hiển thị
  if (_gerberImage && _isGerberImageLoaded) {
    const bvb = baseViewBox.value;
    if (bvb && bvb.w > 0 && bvb.h > 0) {
      const imgX = ((tx - bvb.x) / bvb.w) * _gerberImageW;
      const imgY = ((ty - bvb.y) / bvb.h) * _gerberImageH;

      const cropSize = 300; // kích thước vùng crop
      const sx = imgX - cropSize / 2;
      const sy = imgY - cropSize / 2;

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropSize;
      cropCanvas.height = cropSize;
      const ctx = cropCanvas.getContext("2d");
      ctx.drawImage(
        _gerberImage,
        sx,
        sy,
        cropSize,
        cropSize,
        0,
        0,
        cropSize,
        cropSize,
      );

      const croppedDataUrl = cropCanvas.toDataURL("image/png");
      openImage(croppedDataUrl, pnp.rotation);
    }
  }
}

/**
 * Zoom đến nhóm linh kiện (cùng MPN)
 * @param {Object} group - Đối tượng nhóm từ combinePnPGerberGrouped
 */
async function GetZoomGroup(group) {
  if (!group || !group.items || group.items.length === 0) return;
  if (!baseViewBox.value || baseViewBox.value.w === 0) return;

  const vb = {
    minX: baseViewBox.value.x,
    minY: baseViewBox.value.y,
    width: baseViewBox.value.w,
    height: baseViewBox.value.h,
  };

  const isBottom = String(selectedLayer.value || "")
    .toLowerCase()
    .includes("bottom");

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  group.items.forEach((item) => {
    let { tx, ty, factor } = getComponentTransform(
      item,
      vb,
      isBottom,
      coordinateScale.value,
    );

    const OFFSET_X = manualOffsetGerberX.value;
    const OFFSET_Y = manualOffsetGerberY.value;

    tx += OFFSET_X * factor;
    ty += OFFSET_Y * factor;

    if (tx < minX) minX = tx;
    if (tx > maxX) maxX = tx;
    if (ty < minY) minY = ty;
    if (ty > maxY) maxY = ty;
  });

  // Tính toán vùng bao (bounding box) với lề (margin)
  const width = maxX - minX;
  const height = maxY - minY;
  const margin = Math.max(width, height, 50) * 0.3; // 30% margin

  const targetW = Math.max(width + margin * 2, baseViewBox.value.w / 10);
  const targetH = Math.max(height + margin * 2, baseViewBox.value.h / 10);
  const targetX = minX + width / 2 - targetW / 2;
  const targetY = minY + height / 2 - targetH / 2;

  await animateViewBox(targetX, targetY, targetW, targetH, 500);
  highlightComponents(group.designators);
}
/**
 * Đặt lại zoom về toàn bộ board với animation mượt mà
 * Xóa tất cả highlight khi reset
 */
/**
 * Đặt lại zoom về trạng thái mặc định (Zoom 1.0)
 * Nếu đã đang ở Zoom 1.0, thực hiện Fit to Screen
 */
async function resetsZoom() {
  if (!baseViewBox.value || baseViewBox.value.w === 0) return;
  const vb = baseViewBox.value;
  // Luôn về Fit-to-Board (toàn bộ board)
  // Không dùng 'Zoom 1.0 = CSS px' vì viewBox là SVG units, không phải pixels
  await animateViewBox(vb.x, vb.y, vb.w, vb.h, 350);
}

/**
 * Di chuyển sang linh kiện trước/tiếp theo trong danh sách Gerber PnP
 * Tự động zoom và highlight linh kiện được chọn
 * @param {'prev'|'next'} direction - Hướng di chuyển
 */
function navigatePnP(direction) {
  if (!combinePnPGerber.value.length) return;

  if (direction === "next") {
    currentIndex.value =
      (currentIndex.value + 1) % combinePnPGerber.value.length;
  } else {
    currentIndex.value =
      (currentIndex.value - 1 + combinePnPGerber.value.length) %
      combinePnPGerber.value.length;
  }

  const targetItem = combinePnPGerber.value[currentIndex.value];
  if (targetItem) {
    GetZoomPnP(targetItem.id);
    highlightComponent(targetItem.designator);
  }
}

/**
 * Xử lý click vào marker trên viewer
 */
function handleMarkerClick(marker) {
  // Đồng bộ index và highlight
  currentIndex.value = combinePnPGerber.value.findIndex(
    (item) => item.id === marker.id,
  );
  highlightComponent(marker.designator);
  // Zoom nhẹ vào linh kiện nếu chưa zoom
  if (zoomLevel.value < 4) {
    GetZoomPnP(marker.id);
  }
}

/**
 * Xử lý khi người dùng click icon mắt trực tiếp trên bảng Gerber PnP
 * Cập nhật currentIndex và thực hiện zoom + highlight
 * @param {string|number} id - ID của linh kiện được click
 */
function handleManualZoom(id) {
  currentIndex.value = combinePnPGerber.value.findIndex(
    (item) => item.id === id,
  );
  GetZoomPnP(id);
  // Tìm item để lấy designator cho highlight
  const item = combinePnPGerber.value[currentIndex.value];
  if (item) highlightComponent(item.designator);
}

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
.gerber-container {
  width: 100%;
  height: 100%;
  background: white;
}

.gerber-overlay-container {
  width: 100%;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.gerber-svg-container-full {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #ffffff;
  position: relative;
  user-select: none;
  display: flex;
  flex-direction: column;
}

.svg-full-wrapper {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.svg-full-wrapper :deep(svg) {
  width: 100% !important;
  height: 100% !important;
  display: block;
  color: inherit;
  /* optimizeSpeed giúp render nhanh hơn khi có hàng nghìn paths */
  shape-rendering: optimizeSpeed;
  text-rendering: optimizeSpeed;
  /* Hardware acceleration */
  will-change: viewBox;
}

.gerber-status-bar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-top: 1px solid #e0e0e0;
  z-index: 10;
  height: 32px;
}

.gerber-svg-container :deep(svg) {
  width: 100%;
  height: auto;
  max-width: 100%;
  display: block;
}

.coordinates-info {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.coordinates-info h4 {
  color: #1976d2;
  margin-bottom: 16px;
}

/* Responsive design */
@media (max-width: 768px) {
  .gerber-svg-container {
    max-height: 50vh;
    padding: 8px;
  }

  .coordinates-info {
    padding: 12px;
  }
}

/* Coordinate grid overlay */
.coordinate-grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

.grid-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Enhanced PnP marker styles */
.gerber-svg-container-full :deep(.pnp-marker) {
  cursor: pointer;
  /* KHÔNG dùng transition: all vì gây lag khi rất nhiều markers zoom cùng lúc */
  z-index: 999;
}

/* Component body rectangle */
.gerber-svg-container-full :deep(.pnp-component-body) {
  fill: rgba(255, 179, 0, 0.4);
  stroke: #e65100;
  stroke-width: 3;
  /* Bỏ transition: all – chỉ giữ cho hover styles */
}

/* Component outline for better visibility */
.gerber-svg-container-full :deep(.pnp-component-outline) {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.5;
  stroke-dasharray: 2, 2;
  opacity: 1;
  /* Bỏ transition: all */
}

.gerber-svg-container-full :deep(.pnp-marker:hover) {
  opacity: 1 !important;
  filter: brightness(1.1) drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
}

.gerber-svg-container-full :deep(.pnp-marker:hover .pnp-component-body) {
  fill: rgba(255, 179, 0, 0.6);
  stroke: #bf360c;
  stroke-width: 3.5;
}

.gerber-svg-container-full :deep(.pnp-marker:hover .pnp-component-outline) {
  stroke: #ffffff;
  stroke-width: 2;
  opacity: 1;
}

.gerber-svg-container-full :deep(.pnp-marker:hover circle) {
  stroke-width: 1.5;
  r: 3;
  stroke: #e65100;
}

.gerber-svg-container-full :deep(.pnp-marker:hover line) {
  stroke-width: 2.5;
  stroke: #e65100;
}

.gerber-svg-container-full :deep(.pnp-marker:hover text) {
  font-size: 4;
  fill: #1565c0;
  font-weight: bold;
}

/* Default marker styles - làm rõ hơn */
.gerber-svg-container-full :deep(.pnp-marker line) {
  stroke: #ff0000;
  stroke-width: 1.5;
  opacity: 0.9;
}

.gerber-svg-container-full :deep(.pnp-marker circle) {
  stroke: #ff0000;
  stroke-width: 0.8;
  opacity: 0.8;
}

.gerber-svg-container-full :deep(.pnp-marker text) {
  font-family: "Arial", sans-serif;
  font-weight: bold;
  text-anchor: start;
  fill: #1565c0;
  opacity: 0.9;
}

/* Level of Detail (LOD) optimizations */

/* Khi zoom < 2: Ẩn text và arrow để giảm gánh nặng render */
.gerber-svg-container-full[data-zoom-low="true"] :deep(.pnp-label),
.gerber-svg-container-full[data-zoom-low="true"] :deep(polygon) {
  display: none !important;
}

/* Khi zoom < 2: Đơn giản hóa crosshair */
.gerber-svg-container-full[data-zoom-low="true"] :deep(.pnp-crosshair line) {
  stroke-width: 0.5px;
  stroke: #ff5252;
}

/* Layering optimization */
.gerber-svg-container-full :deep(svg) {
  contain: paint layout;
}

/* Disable expensive filters during dragging */
.gerber-svg-container-full.is-dragging :deep(.pnp-marker) {
  pointer-events: none !important;
}

.gerber-svg-container-full.is-dragging :deep(.pnp-marker:hover) {
  filter: none !important;
}

/* Coordinate row hover effect */
.coordinate-row:hover {
  background-color: #f5f5f5;
}

/* PnP only view styling */
.pnp-only-view {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  padding: 32px;
  text-align: center;
}

/* Zoom indicator */
.zoom-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: red;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10;
}

/* Fullscreen enhancements */
.gerber-svg-container-full:fullscreen {
  background: black;
  padding: 20px;
}

.gerber-svg-container-full:fullscreen :deep(svg) {
  max-height: 90vh;
}

/* Loading state for SVG */
.gerber-svg-container-full.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
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

/* Coordinate transformation info */
.coordinate-info .transformation-info {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 16px;
  font-family: "Courier New", monospace;
  font-size: 12px;
}

.coordinate-info .transformation-info .label {
  font-weight: bold;
  color: #1976d2;
}

.coordinate-info .transformation-info .value {
  color: #666;
}

/* Trong <style> hoặc scoped styles */

/* SVG container cần overflow: hidden và position: relative */
.gerber-svg-container-full {
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.gerber-svg-container-full:active {
  cursor: grabbing;
}

/* SVG wrapper – zoom xử lý qua viewBox nên không dùng CSS transform */
.svg-full-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  /* will-change: contents giúp browser tạo layer riêng cho SVG lớn */
  will-change: contents;
  contain: strict;
  transition: none;
}

/* Highlight khi zoom đến component */
.pnp-marker.highlighted circle {
  animation: pulse-ring 0.6s ease-out 3;
  stroke: #00e5ff !important;
  stroke-width: 2px !important;
}

.pnp-marker.highlighted line {
  stroke: #00e5ff !important;
}

.pnp-marker.highlighted text {
  fill: #ff6d00 !important;
  font-size: 26px !important;
}

@keyframes pulse-highlight {
  0% {
    transform: scale(1);
    opacity: 1;
    stroke-width: 2;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.8;
    stroke-width: 5;
  }

  100% {
    transform: scale(1);
    opacity: 1;
    stroke-width: 2;
  }
}

/* Class highlights linh kiện khi focus */
:deep(.pnp-marker.highlighted-pnp) {
  filter: drop-shadow(0 0 15px green);
  z-index: 9999 !important;
}

:deep(.pnp-marker.highlighted-pnp .pnp-highlight-frame) {
  display: block !important;
}

:deep(.pnp-marker.highlighted-pnp .crosshair-group) {
  stroke: red !important; /* Làm sáng dấu thập trên nền đỏ */
  stroke-width: 4px !important;
}

:deep(.pnp-marker.highlighted-pnp line) {
  stroke: red !important;
}

:deep(.pnp-marker.highlighted-pnp text) {
  fill: red !important;
  font-weight: 900 !important;
  paint-order: stroke;
  stroke: red;
  stroke-width: 8px;
  font-size: 1.3em !important;
}

.altium-style text {
  dominant-baseline: middle;
  text-anchor: start;
  pointer-events: none;
}

.pnp-marker {
  transition: transform 0.1s ease-out;
}

.pnp-marker:hover {
  filter: brightness(1.2);
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
