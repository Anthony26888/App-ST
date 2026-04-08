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
          />
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Top"
            :value="
              combineBom.filter(
                (item) =>
                  item.layer === 'Top' ||
                  item.layer === 'TopLayer' ||
                  item.layer === 'top',
              ).length || 0
            "
            icon="mdi-arrow-collapse-up"
            color="success"
          />
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Bottom"
            :value="
              combineBom.filter(
                (item) =>
                  item.layer === 'Bottom' ||
                  item.layer === 'BottomLayer' ||
                  item.layer === 'bottom',
              ).length || 0
            "
            icon="mdi-arrow-collapse-down"
            color="error"
          />
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <v-card variant="elevated" elevation="0" class="rounded-xl border">
        <v-tabs v-model="tab" align-tabs="center" color="deep-orange">
          <v-tab :value="1" class="text-caption">Bom và Pick & Place</v-tab>
          <v-tab :value="2" class="text-caption">Gerber</v-tab>
          <v-tab :value="3" class="text-caption">PCB & Panel</v-tab>
          <!-- <v-tab :value="4" class="text-caption">Gerber PnP</v-tab> -->
        </v-tabs>

        <v-tabs-window v-model="tab">
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
                    @click="DialogAddBom = true"
                    prepend-icon="mdi-plus"
                  >
                    <v-list-item-title class="text-caption"
                      >BOM</v-list-item-title
                    >
                  </v-list-item>
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
                    @click="DownloadPnP()"
                    prepend-icon="mdi-download"
                  >
                    <v-list-item-title class="text-caption"
                      >Tải file PnP</v-list-item-title
                    >
                  </v-list-item>
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
                    @click="DownloadBomHighlight()"
                    prepend-icon="mdi-download"
                  >
                    <v-list-item-title class="text-caption"
                      >Tải file Bom Highlight</v-list-item-title
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
                  <v-list-item @click="SortSMT()" prepend-icon="mdi-chip">
                    <v-list-item-title class="text-caption"
                      >SMT</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item
                    @click="SortHand()"
                    prepend-icon="mdi-screwdriver"
                  >
                    <v-list-item-title class="text-caption"
                      >Hàn tay</v-list-item-title
                    >
                  </v-list-item>
                  <v-list-item @click="ResetSort()" prepend-icon="mdi-refresh">
                    <v-list-item-title class="text-caption"
                      >Tất cả</v-list-item-title
                    >
                  </v-list-item>
                </v-list>
              </v-menu>
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
                height="58vh"
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
                      value === 'Top' || value === 'top' || value === 'TopLayer'
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
            <v-card height="100vh" variant="text">
              <v-card-title class="d-flex align-center mt-5" height="62vh">
                <v-btn
                  v-bind="props"
                  prepend-icon="mdi-import"
                  color="primary"
                  variant="tonal"
                  class="text-caption"
                  @click="DialogAddGerber = true"
                >
                  Nhập dữ liệu
                </v-btn>
                <!-- <Button-Download @click="downloadExcelPnP()"/> -->
                <v-spacer></v-spacer>
                <!-- Coordinate scaling controls -->

                <v-btn
                  @click="DialogCoordinateSettings = true"
                  prepend-icon="mdi-tune"
                  variant="tonal"
                  class="me-2 ms-2 text-caption"
                  title="Cài đặt tọa độ"
                  >Cài đặt</v-btn
                >

                <!-- Controls for overlay -->

                <!-- Layer select -->
                <v-select
                  v-model="selectedLayer"
                  :items="['Top', 'Bottom']"
                  label="Layer"
                  class="me-4"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  style="max-width: 160px"
                />
              </v-card-title>
              <v-row>
                <v-col cols="6">
                  <v-card-text
                    class="pa-0 ma-0 overflow-hidden"
                    style="height: calc(100vh - 120px)"
                  >
                    <!-- Hiển thị SVG với overlay Pick & Place -->

                    <div
                      v-if="svgWithPnP && overlayMode !== 'pnp'"
                      class="gerber-svg-container-full"
                      ref="svgContainer"
                      @mousemove="handleMouseMoveSVG"
                      style="overflow: hidden; position: relative"
                    >
                      <div
                        style="
                          position: absolute;
                          bottom: 15px;
                          right: 15px;
                          z-index: 20;
                        "
                      >
                        <v-btn
                          prepend-icon="mdi-refresh"
                          @click="resetsZoom"
                          class="text-caption"
                          title="Reset View (H)"
                          color="error"
                          variant="tonal"
                        >
                          Reset Zoom
                        </v-btn>
                      </div>
                      <svg width="100" height="100" viewBox="0 0 120 120">
                        <g class="compass-static">
                          <line
                            x1="50"
                            y1="60"
                            x2="20"
                            y2="60"
                            stroke="#555"
                            stroke-width="2"
                            marker-end="url(#arrow-gray)"
                          />
                          <text x="5" y="64" fill="#888" font-size="10">
                            0°
                          </text>

                          <line
                            x1="60"
                            y1="50"
                            x2="60"
                            y2="80"
                            stroke="#555"
                            stroke-width="2"
                            marker-end="url(#arrow-gray)"
                          />
                          <text x="55" y="95" fill="#888" font-size="10">
                            90°
                          </text>

                          <line
                            x1="70"
                            y1="60"
                            x2="100"
                            y2="60"
                            stroke="#555"
                            stroke-width="2"
                            marker-end="url(#arrow-gray)"
                          />
                          <text x="105" y="64" fill="#888" font-size="10">
                            180°
                          </text>

                          <line
                            x1="60"
                            y1="70"
                            x2="60"
                            y2="40"
                            stroke="#555"
                            stroke-width="2"
                            marker-end="url(#arrow-gray)"
                          />
                          <text x="50" y="30" fill="#888" font-size="10">
                            270°
                          </text>
                        </g>
                      </svg>
                      <div class="rotation-value">
                        {{ currentCompRotation }}°
                      </div>
                      <div v-if="showGrid" class="coordinate-grid-overlay">
                        ...
                      </div>

                      <div
                        ref="svgWrapper"
                        v-html="svgWithPnP"
                        class="svg-full-wrapper"
                        style="width: 100%; height: 100%"
                      ></div>
                    </div>

                    <v-empty-state
                      v-if="overlayMode !== 'pnp' && !currentGerberSvg"
                      title="Dữ liệu trống"
                      text="Chưa có dữ liệu Gerber"
                      icon="mdi-image-off"
                      class="mt-10"
                    />
                  </v-card-text>
                </v-col>
                <v-col cols="6">
                  <v-data-table-virtual
                    density="comfortable"
                    :headers="HeadersPnPGerber"
                    :items="combinePnPGerber"
                    :search="searchPnPGerber"
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
                    height="80vh"
                  >
                    <template v-slot:top>
                      <v-toolbar
                        flat
                        class="d-flex align-center bg-transparent"
                      >
                        <InputSearch v-model="searchPnPGerber" />
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
                    <template v-slot:item.id="{ item }">
                      <div class="d-flex">
                        <v-tooltip text="Xem chi tiết" location="top">
                          <template v-slot:activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="small"
                              icon="mdi-eye"
                              @click="GetZoomPnP(item.id)"
                              color="primary"
                              variant="text"
                            ></v-btn>
                          </template>
                        </v-tooltip>

                        <v-tooltip text="Xem chi tiết" location="top">
                          <template v-slot:activator="{ props }">
                            <Button-Edit @click="GetAddSize(item)" />
                          </template>
                        </v-tooltip>
                      </div>
                    </template>
                  </v-data-table-virtual>
                </v-col>
              </v-row>
            </v-card>
          </v-tabs-window-item>

          <v-tabs-window-item :value="3">
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
                        <v-toolbar-title class="text-primary font-weight-bold">
                          <v-icon
                            color="primary"
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
        </v-tabs-window>
      </v-card>
    </v-card-text>
  </v-card>

  <BaseDialog
    v-model="DialogAddBom"
    width="600"
    title="Thêm dữ liệu BOM"
    icon="mdi-plus"
  >
    <InputFiles
      label="Nhập file Bom (.xlsx)"
      class="mt-2"
      v-model="FileBom"
      name="bom"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogAddBom = false" />
      <ButtonSave @save="uploadBOM()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogAddPnP"
    width="700"
    title="Thêm dữ liệu Pick & Place"
    icon="mdi-plus"
  >
    <InputFiles
      label="Nhập file Pick & Place (.xlsx)"
      class="mt-2"
      v-model="FilePnP"
      name="pnp"
    />
    <div class="">
      <p class="text-bold text-warning">Lưu ý:</p>
      <p class="font-weight-light ms-2">
        Giá trị PosX, PosY cần chuyển về giá trị mm.
      </p>
      <p class="font-weight-light ms-2">
        Giá trị Layer thay thế là Top và Bottom.
      </p>
    </div>
    <template #actions>
      <ButtonCancel @cancel="DialogAddPnP = false" />
      <ButtonSave @save="uploadPNP" />
    </template>
  </BaseDialog>

  <BaseDialog
    v-model="DialogAddGerber"
    width="700"
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
                  style="max-width: 250px"
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
    </div>

    <!-- Note -->
    <div class="d-flex mt-3">
      <p class="text-bold text-warning">Lưu ý:</p>
      <p class="font-weight-light ms-2">
        Cần chuyển đổi đơn vị file Gerber .gtp, .gbp là inch
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
    <InputField label="Chiều dài | Length (mm)" v-model="Length_Add_Size" />
    <InputField label="Chiều rộng | Width (mm)" v-model="Width_Add_Size" />
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
    title="Cài đặt tọa độ"
    icon="mdi-tune"
  >
    <p class="text-caption text-grey mb-2">Điều chỉnh tọa độ thủ công:</p>

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
      <ButtonSave @save="SaveSettingPCB()" />
    </div>
  </BaseDialog>
  <BaseDialog v-model="DialogSettingPCB" title="Cài đặt PCB" max-width="600px">
    <v-card-text>
      <div class="text-body-small pa-3 text-black">Toạ độ gốc máy SMT (mm)</div>

      <v-row>
        <v-col cols="6">
          <InputField
            v-model.number="machineX"
            label="Machine X"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
        <v-col cols="6">
          <InputField
            v-model.number="machineY"
            label="Machine Y"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
      </v-row>
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
            v-model="length"
            label="Chiều dài L (mm)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
        <v-col cols="6">
          <InputField
            v-model.number="width"
            label="Chiều rộng W (mm)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
      </v-row>
      <div class="text-body-small pa-3 text-black">
        Toạ độ gốc (mm)
        <v-btn
          variant="text"
          size="small"
          class="text-caption ms-2"
          color="primary"
          prepend-icon="mdi-information-variant-circle"
        >
          <v-tooltip activator="parent" location="end"
            >Lấy toạ độ góc trái dưới từ PCB</v-tooltip
          >
        </v-btn>
      </div>

      <v-row>
        <v-col cols="6">
          <InputField
            v-model.number="originOffsetX"
            label="Toạ độ X (mm)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
        <v-col cols="6">
          <InputField
            v-model.number="originOffsetY"
            label="Toạ độ Y (mm)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
      </v-row>

      <div class="text-body-small pa-3 text-black">
        Rìa Panel (mm)
        <v-btn
          variant="text"
          size="small"
          class="text-caption ms-2"
          color="primary"
          prepend-icon="mdi-information-variant-circle"
        >
          <v-tooltip activator="parent" location="end"
            >Phần rìa X, Y của PCB</v-tooltip
          >
        </v-btn>
      </div>

      <v-row>
        <v-col cols="6">
          <InputField
            v-model.number="railOffsetX"
            label="Rìa X (mm)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
          />
        </v-col>
        <v-col cols="6">
          <InputField
            v-model.number="railOffsetY"
            label="Rìa Y (mm)"
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
        <v-col cols="4">
          <InputSelect
            v-model="rotationMode"
            :items="['CCW', 'CW']"
            label="Chế độ xoay"
            density="comfortable"
            variant="outlined"
          />
        </v-col>
        <v-col cols="8">
          <InputSelect
            v-model.number="angle"
            label="Góc xoay (độ)"
            :items="[0, 90, 180, 270]"
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
import svgPanZoom from "svg-pan-zoom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
//

// ==========================================
// 1. CONSTANTS & API CONFIG
// ==========================================
const Url = import.meta.env.VITE_API_URL;
const clientId = import.meta.env.VITE_DIGIKEY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_DIGIKEY_CLIENT_SECRET;
const route = useRoute();
const id = route.params.id;

// ==========================================
// 2. COMPOSABLES
// ==========================================
const { combineBom } = useCombineBom(id);
const { bomHighlight } = useBomHighlight(id);
const { detailPnP } = usePnPFile(id);
const { detailGerber } = useGerberFile(id);
const { detailSetting } = useSettingPCB(id);

// ==========================================
// 3. STATE MANAGEMENT
// ==========================================

// --- Dialog & UI States ---
const DialogEdit = ref(false);
const DialogAddBom = ref(false);
const DialogAddPnP = ref(false);
const DialogAddGerber = ref(false);
const DialogAddGerberPDF = ref(false);
const DialogSettingPCB = ref(false);
const DialogCoordinateSettings = ref(false);
const DialogAddSize = ref(false);
const DialogRemove = ref(false);
const DialogFailed = ref(false);
const DialogCaution = ref(false); // Warning notification
const DialogLoading = ref(false); // Loading state
const DialogSuccess = ref(false);
const DialogInfo = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");
const MessageCautionDialog = ref("");
const tab = ref(null);

// --- File & Project States ---
const project_name = ref(localStorage.getItem("BomName"));
const FileBom = ref(null);
const FilePnP = ref(null);
const FileGerber = ref(null);
const LayerGerber = ref("Top");
const gerberFileList = ref([]);

// --- Gerber & SVG View States ---
const overlayMode = ref("both"); // 'both', 'gerber', 'pnp'
const svgContainer = ref(null);
const zoomLevel = ref(1);
const mouseCoords = reactive({ x: 0, y: 0 });
const svgWrapper = ref(null);
const panZoomInstance = ref(null);
const selectedLayer = ref("Top");

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
const designatorLabelAngle = ref(0);
const componentBodyAngle = ref(0);
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
const length = ref(0);
const manualOffsetX = ref(0.0);
const manualOffsetY = ref(0.0);
const originOffsetX = ref(0.0);
const originOffsetY = ref(0.0);
const railOffsetX = ref(0.0);
const railOffsetY = ref(0.0);
const angle = ref(0);
const machineX = ref(0.0);
const machineY = ref(0.0);
const rotationMode = ref("CW");

// --- DigiKey API States ---
const GetDigikey = ref("");
const accessToken = ref(null);
const tokenType = ref(null);
const ResultSearch = ref(null);

// --- Table & Data States ---
const Headers = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator" },
  { title: "MPN", key: "mpn", width: "200px" },
  { title: "X (mm)", key: "x" },
  { title: "Y (mm)", key: "y" },
  { title: "Rotation", key: "rotation" },
  { title: "Layer", key: "layer" },
  { title: "Description", key: "description_bom", width: "150px" },
  { title: "Mount Type", key: "mount_type" },
  { title: "Need Review", key: "need_review" },
  { title: "Thao tác", key: "id", sortable: false },
];

const HeadersPCBTop = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator", width: "150px" },
  { title: "X (mm)", key: "x" },
  { title: "Y (mm)", key: "y" },
  { title: "Rotation", key: "rotation" },
  { title: "MPN", key: "mpn", width: "150px" },
];

const HeadersPCBBottom = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator", width: "150px" },
  { title: "X (mm)", key: "x" },
  { title: "Y (mm)", key: "y" },
  { title: "Rotation", key: "rotation" },
  { title: "MPN", key: "mpn", width: "150px" },
];

const HeadersPnPGerber = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator", width: "100px" },
  { title: "X (mm)", key: "x", width: "25px" },
  { title: "Y (mm)", key: "y", width: "25px" },
  { title: "Rotation", key: "rotation", width: "25px" },
  { title: "Length (mm)", key: "length", width: "25px" },
  { title: "Width (mm)", key: "width", width: "25px" },
  { title: "Thao tác", key: "id", sortable: false },
];
const searchBom = ref("");
const itemsPerPageBom = ref(20);
const pageBom = ref(1);
const searchPCBTopLayer = ref("");
const searchPCBBottomLayer = ref("");
const searchPnPGerber = ref("");
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

// ==========================================
// 4. COMPUTED PROPERTIES
// ==========================================

const filteredPnP = computed(() => {
  const list = detailPnP.value || [];
  return list.filter(
    (p) => (p.layer || "Top") === selectedLayer.value && p.type === "SMT",
  );
});

const topLayerCount = computed(() => {
  if (!combineBom.value) return 0;
  return combineBom.value.filter((item) => item.layer === "Top").length;
});

const bottomLayerCount = computed(() => {
  if (!combineBom.value) return 0;
  return combineBom.value.filter((item) => item.layer === "Bottom").length;
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
  if (Array.isArray(dg) && dg.length > 0) {
    const byLayer = dg.find(
      (item) => item && item.layer === selectedLayer.value && item.svg,
    );
    if (byLayer && typeof byLayer.svg === "string") return byLayer.svg;
    return "";
  } else if (dg && typeof dg === "object") {
    return dg.svg || "";
  } else if (typeof dg === "string") {
    return dg;
  }
  return "";
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

const currentSvgContent = computed(() => {
  let content = "";
  if (overlayMode.value === "both") {
    content = svgWithPnP.value;
  } else if (overlayMode.value === "gerber") {
    content = currentGerberSvg.value || "";
  }

  if (!content) return "";

  // Inject ID and Viewport for svg-pan-zoom
  return prepareSvg(content);
});

const combinePnPGerber = computed(() => {
  if (selectedLayer.value === "Top") {
    return combineBom.value.filter((item) => item.layer === "Top");
  } else {
    return combineBom.value.filter((item) => item.layer === "Bottom");
  }
});

function getSvgViewBox(svgString) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.querySelector("svg");

    if (!svgEl) return null;

    const viewBox = svgEl.getAttribute("viewBox");
    if (!viewBox) return null;

    const [minX, minY, width, height] = viewBox.split(/[\s,]+/).map(Number);

    return { minX, minY, width, height };
  } catch (e) {
    console.warn("getSvgViewBox error:", e);
    return null;
  }
}
// Combine Gerber + Pick&Place overlay
const svgWithPnP = computed(() => {
  if (!currentGerberSvg.value || !filteredPnP.value) return "";

  let svg = currentGerberSvg.value;
  if (!svg || typeof svg !== "string") return "";

  const unit = currentGerberUnit.value;
  if (!unit) return "";

  const vb = getSvgViewBox(svg);
  if (!vb) return svg;

  const isBottom = selectedLayer.value === "Bottom";

  let offset = [];
  if (selectedLayer.value === "Top") {
    offset = filteredPnP.value.map((pnp) => ({
      ...pnp,
      x: Number(pnp.x) + Number(hintOffsetX_top.value),
      y: Number(pnp.y) + Number(hintOffsetY_top.value),
    }));
  } else {
    offset = filteredPnP.value.map((pnp) => ({
      ...pnp,
      x: Number(pnp.x) + Number(hintOffsetX_bottom.value),
      y: Number(pnp.y) + Number(hintOffsetY_bottom.value),
    }));
  }
  const pnpMarkers = offset
    .filter((p) => p.x != null && p.y != null && p.designator)
    .map((pnp) => {
      // =========================
      // 1. SCALE
      // =========================
      let x = pnp.x * coordinateScale.value;
      let y = pnp.y * coordinateScale.value;

      // =========================
      // 2. SWAP XY
      // =========================
      if (swapXY.value) {
        [x, y] = [y, x];
      }

      // =========================
      // 3. APPLY VIEWBOX (🔥 FIX CHÍNH)
      // =========================
      let transformedX = vb.minX + x + coordinateOffsetX.value;

      let transformedY = vb.minY + (vb.height - y) + coordinateOffsetY.value;

      // =========================
      // 4. MIRROR BOTTOM
      // =========================
      if (isBottom) {
        if (mirrorMode.value === "x") {
          transformedX = vb.minX + vb.width - (transformedX - vb.minX);
        }

        if (mirrorMode.value === "y") {
          transformedY = vb.minY + vb.height - (transformedY - vb.minY);
        }
      }

      // =========================
      // 5. OFFSET Y tinh chỉnh
      // =========================
      const extraYOffsetUnits =
        (unit === "mm" ? pnpYOffsetMm.value : pnpYOffsetMm.value / 25.4) *
        coordinateScale.value;

      transformedY += extraYOffsetUnits;

      // =========================
      // 6. ROTATION
      // =========================
      const desiredRotation =
        pnp.rotation || pnp.rot || coordinateRotation.value;

      function fixRotation(r) {
        const n = ((Number(r) % 360) + 360) % 360;

        if (n === 0) return 180;
        if (n === 180) return 0;

        return n; // giữ nguyên 90 và 270
      }

      const componentRotation = fixRotation(desiredRotation);

      // =========================
      // 7. SIZE
      // =========================
      let rectWidth = (pnp.width || 0) * coordinateScale.value;
      let rectLength = (pnp.length || 0) * coordinateScale.value;

      if (swapXY.value) {
        [rectWidth, rectLength] = [rectLength, rectWidth];
      }

      const squareScale = unit === "mm" ? 0.02 : 1;
      const crosshairScale = unit === "mm" ? 50 : 1;

      // =========================
      // 8. DRAW
      // =========================
      let componentMarkup = "";

      if (rectWidth > 0 && rectLength > 0 && showComponentBoxes.value) {
        componentMarkup = `
    <g transform="rotate(${componentBodyAngle.value}) scale(${squareScale})">
      <rect
        x="${-(rectLength / 2)}"
        y="${-(rectWidth / 2)}"
        width="${rectLength}"
        height="${rectWidth}"
        fill="rgba(255, 179, 0, 0.4)"
        stroke="#E65100"
        stroke-width="3"
      />
    </g>
  `;
      }

      return `
        <g 
          transform="translate(${transformedX}, ${transformedY}) rotate(${componentRotation}) scale(${crosshairScale})"
          class="pnp-marker"
          data-designator="${pnp.designator}"
        >
          ${componentMarkup}

          <!-- Crosshair -->
          <line x1="-25" y1="0" x2="25" y2="0" stroke="red"/>
          <line x1="0" y1="-25" x2="0" y2="25" stroke="red"/>

          <!-- Center -->
          <circle cx="0" cy="0" r="2" stroke="red" fill="none"/>

          <!-- Label -->
          <text
            x="6"
            y="3"
            font-size="23"
            fill="blue"
            font-weight="bold"
            transform="rotate(${designatorLabelAngle.value})"
          >
            ${pnp.designator}
          </text>
        </g>
      `;
    })
    .join("");

  return svg.replace("</svg>", `${pnpMarkers}</svg>`);
});

const PCBTopLayer = computed(() => {
  return combineBom.value.filter((item) => item.layer === "Top");
});

const PCBBottomLayer = computed(() => {
  return combineBom.value.filter((item) => item.layer === "Bottom");
});

const transformedPnP = computed(() => {
  return detailPnP.value.map((p) => transform(p)).filter(Boolean);
});

const resultTop = computed(() =>
  transformedPnP.value.filter((p) => p.layer?.toLowerCase() === "top"),
);

const resultBottom = computed(() =>
  transformedPnP.value.filter((p) => p.layer?.toLowerCase() === "bottom"),
);
// ==========================================
// 5. LIFECYCLE HOOKS
// ==========================================

onMounted(() => {
  if (coordinateScale.value) {
    coordinateScale.value /= 0.0254;
  }
});

// 7. WATCHERS
// ==========================================

// Watch for fullscreen change to reset zoom
watch(
  () => document.fullscreenElement,
  () => {
    if (!document.fullscreenElement) {
      resetZoom();
    }
  },
);

// Reset zoom when container size changes
watch(
  svgContainer,
  () => {
    if (svgContainer.value) {
      resetZoom();
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

watch(currentSvgContent, async () => {
  await nextTick();
  initPanZoom();
});

watch(detailSetting, (val) => {
  if (!val.length) return;

  const found = val[0];
  hintOffsetX_top.value = Number(found.manualOffsetX_top.toFixed(2)) || 0;
  hintOffsetY_top.value = Number(found.manualOffsetY_top.toFixed(2)) || 0;
  hintOffsetX_bottom.value = Number(found.manualOffsetX_bottom.toFixed(2)) || 0;
  hintOffsetY_bottom.value = Number(found.manualOffsetY_bottom.toFixed(2)) || 0;

  length.value = found.length;
  width.value = found.width;

  machineX.value = found.machineX;
  machineY.value = found.machineY;

  originOffsetX.value = found.originOffsetX;
  originOffsetY.value = found.originOffsetY;

  railOffsetX.value = found.railOffsetX;
  railOffsetY.value = found.railOffsetY;

  angle.value = found.angle;
});

// ==========================================
// 6. CORE FUNCTIONS
// ==========================================

// --- File Upload Handlers ---

const uploadBOM = async () => {
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("FileBom", FileBom.value);
    await axios.post(`${Url}/upload-bom/${id}`, formData);
    DialogSuccess.value = true;
    MessageDialog.value = "Upload Bom thành công";
    DialogAddBom.value = false;
    FileBom.value = null;
    DialogLoading.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload Bom thất bại";
    console.error("Lỗi upload BOM:", error);
    DialogLoading.value = false;
  }
};

const uploadPNP = async () => {
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("FilePnP", FilePnP.value);
    await axios.post(`${Url}/upload-pickplace/${id}`, formData);
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

const layerOptions = [
  { label: "Copper Top", value: "copper_top", color: "#cc0000" },
  { label: "Copper Bottom", value: "copper_bottom", color: "#0000cc" },
  { label: "Soldermask Top", value: "soldermask_top", color: "#00aa44" },
  { label: "Soldermask Bottom", value: "soldermask_bottom", color: "#00aa44" },
  { label: "Silkscreen Top", value: "silkscreen_top", color: "#ffffff" },
  { label: "Silkscreen Bottom", value: "silkscreen_bottom", color: "#ffff00" },
  { label: "Board Outline", value: "board_outline", color: "#ffaa00" },
  { label: "Drill", value: "drill", color: "#888888" },
];

// Map extension → layer mặc định
const EXT_LAYER_MAP = {
  ".gtl": "copper_top",
  ".gbl": "copper_bottom",
  ".gtp": "soldermask_top",
  ".gbp": "soldermask_bottom",
  ".gto": "silkscreen_top",
  ".gbo": "silkscreen_bottom",
  ".gko": "board_outline",
  ".drl": "drill",
  ".exc": "drill",
  ".xln": "drill",
};

// ─── Watch: sync FileGerbers → gerberFileList ─────────────────────────────

// ─── Actions ─────────────────────────────────────────────────────────────────
const removeFile = (index) => {
  gerberFileList.value.splice(index, 1);
};

const closeDialog = () => {
  DialogAddGerber.value = false;
  gerberFileList.value = [];
  FileGerber.value = null;
};

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

// --- Data Edit/Update Handlers ---
const GetItemEdit = (item) => {
  DialogEdit.value = true;
  GetIDPnP.value = item.id;
  PnP_X_Edit.value = item.x;
  PnP_Y_Edit.value = item.y;
  PnP_Angle_Edit.value = item.rotation;
  PnP_Type_Edit.value = item.type;
  PnP_Layer_Edit.value = item.layer;
};

// Get information Update size
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

// Get information  Update size of accessory
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
      console.log(error);
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

// Put item in Pickplace table
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
      `${Url}/PickPlace/Edit-item/${GetIDPnP.value}`,
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

// Put item in Pickplace table with x, y transform-origin

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

    width: width.value,
    length: length.value,
    machineX: machineX.value,
    machineY: machineY.value,
    originOffsetX: originOffsetX.value,
    originOffsetY: originOffsetY.value,
    railOffsetX: railOffsetX.value,
    railOffsetY: railOffsetY.value,
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

const SortTop = () => {
  searchBom.value = "Top";
};

const SortBottom = () => {
  searchBom.value = "Bottom";
};

const SortSMT = () => {
  searchBom.value = "SMT";
};

const SortHand = () => {
  searchBom.value = "Hand";
};

const ResetSort = () => {
  searchBom.value = "";
};

/* =======================
   UTILS
======================= */

// Chuyển đổi giá trị sang số
function toNum(v) {
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function pickValue(primary, fallback, allowZero = false) {
  const v = toNum(primary);

  if (v === null) return fallback;
  if (!allowZero && v === 0) return fallback;

  return v;
}

function normalizeRotation(r) {
  return ((r % 360) + 360) % 360;
}

/* =======================
   CONFIG THEO LAYER
======================= */
function getCfgByLayer(layer) {
  const raw = detailSetting.value?.[0] || {};

  const pcbLayer =
    layer?.toLowerCase() === "bottom"
      ? PCBBottomLayer.value?.[0] || {}
      : PCBTopLayer.value?.[0] || {};

  return {
    X0: pickValue(raw.X0, pcbLayer.X0 ?? 0),
    Y0: pickValue(raw.Y0, pcbLayer.Y0 ?? 0),

    L: pickValue(raw.L, pcbLayer.L ?? 0),
    W: pickValue(raw.W, pcbLayer.W ?? 0),

    offsetX: pickValue(raw.offsetX, pcbLayer.offsetX ?? 0),
    offsetY: pickValue(raw.offsetY, pcbLayer.offsetY ?? 0),

    angle: pickValue(raw.angle, 0, true),

    rotationMode: raw.rotationMode || "CCW",

    rotationOffset: pickValue(raw.rotationOffset, 0, true),

    machineX: toNum(raw.machineX, 0),
    machineY: toNum(raw.machineY, 0),
  };
}

/* =======================
   TRANSFORM (CHUẨN)
======================= */
function transform(p) {
  const cfg = getCfgByLayer(p.layer);

  let px = toNum(p.x);
  let py = toNum(p.y);
  let pr = toNum(p.rotation);

  if (px === null || py === null) return null;
  if (pr === null) pr = 0;

  // ======================
  // 1. Đưa về MACHINE ORIGIN (QUAN TRỌNG)
  // ======================
  let x = px - cfg.X0 + cfg.machineX;
  let y = py - cfg.Y0 + cfg.machineY;

  let r = normalizeRotation(pr + cfg.rotationOffset);

  // ======================
  // 2. Rotate PANEL
  // ======================
  let x2, y2;

  switch (cfg.angle) {
    case 90:
      x2 = y;
      y2 = cfg.W - x;
      break;

    case 180:
      x2 = cfg.L - x;
      y2 = cfg.W - y;
      break;

    case 270:
      x2 = cfg.L - y;
      y2 = x;
      break;

    default:
      x2 = x;
      y2 = y;
  }

  let r2 = cfg.rotationMode === "CCW" ? r + cfg.angle : r - cfg.angle;

  // ======================
  // 3. Mirror BOTTOM
  // ======================
  if (p.layer?.toLowerCase() === "bottom") {
    y2 = cfg.W - y2;
    r2 = -r2;
  }

  // ======================
  // 4. Offset calibration
  // ======================
  x2 += cfg.offsetX;
  y2 += cfg.offsetY;

  r2 = normalizeRotation(r2);

  return {
    ...p,
    x: Number(x2.toFixed(3)),
    y: Number(y2.toFixed(3)),
    rotation: r2,
  };
}

// --- Download Handlers ---

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

const DownloadPnP = async () => {
  try {
    const response = await fetch(`${Url}/PickPlace/download/${id}`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `PickPlace.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    MessageErrorDialog.value = "Tải file thất bại";
    console.error("Error downloading file:", error);
  }
};

const DownloadPnPTop = async () => {
  try {
    const response = await fetch(`${Url}/PickPlaceTop/download/${id}`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `PickPlace_Top.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    MessageErrorDialog.value = "Tải file thất bại";
    console.error("Error downloading file:", error);
  }
};

const DownloadPnPBottom = async () => {
  try {
    const response = await fetch(`${Url}/PickPlaceBottom/download/${id}`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `PickPlace_Bottom.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    MessageErrorDialog.value = "Tải file thất bại";
    console.error("Error downloading file:", error);
  }
};

const DownloadBomHighlight = async () => {
  try {
    const response = await fetch(`${Url}/BomHighlight/download/${id}`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `BomHighlight.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    MessageErrorDialog.value = "Tải file thất bại";
    console.error("Error downloading file:", error);
  }
};

const DownloadPCB = () => {
  // 👉 Convert data
  // ===== TOP =====
  const topData = resultTop.value.map((item, index) => ({
    STT: index + 1,
    Designator: item.designator,
    X: item.x,
    Y: item.y,
    Rotation: item.rotation,
    Layer: item.layer,
    MPN: item.mpn,
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
    `PnP_Top_${Date.now()}.xlsx`,
  );

  // ===== BOTTOM =====
  const bottomData = resultBottom.value.map((item, index) => ({
    STT: index + 1,
    Designator: item.designator,
    X: item.x,
    Y: item.y,
    Rotation: item.rotation,
    Layer: item.layer,
    MPN: item.mpn,
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
    `PnP_Bottom_${Date.now()}.xlsx`,
  );
};
// --- Coordinate Transformation Logic ---

/**
 * Rotates a point around a center by a given angle
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

const resetManualAdjustment = () => {
  manualOffsetX.value = 0;
  manualOffsetY.value = 0;
  MessageDialog.value = "Đã reset điều chỉnh thủ công";
  DialogSuccess.value = true;
};

const resetCoordinates = () => {
  coordinateOffsetX.value = 0;
  coordinateOffsetY.value = 0;
  coordinateRotation.value = 0;
  flipX.value = false;
  flipY.value = false;
  swapXY.value = false;
  cx.value = 0;
  cy.value = 0;
  rotationAngle.value = 0;
  manualOffsetX.value = 0;
  manualOffsetY.value = 0;
  svgRotation.value = 0;
  designatorLabelAngle.value = 0;
  componentBodyAngle.value = 0;
  resetPanAndZoom();
};

const getTransformedCenter = () => {
  if (!pnpBounds.value) return { cxT: 0, cyT: 0 };
  const cxT =
    pnpBounds.value.cxRaw * coordinateScale.value + coordinateOffsetX.value;
  const cyT =
    pnpBounds.value.cyRaw * coordinateScale.value + coordinateOffsetY.value;
  return { cxT, cyT };
};

const getTransformedCoordinates = (x, y) => {
  let transformedX = x * coordinateScale.value + coordinateOffsetX.value;
  let transformedY = y * coordinateScale.value + coordinateOffsetY.value;

  const { cxT, cyT } = getTransformedCenter();
  if (flipX.value) transformedX = 2 * cxT - transformedX;
  if (flipY.value) transformedY = 2 * cyT - transformedY;
  if (swapXY.value) [transformedX, transformedY] = [transformedY, transformedX];

  return { x: transformedX, y: transformedY };
};

// --- SVG & View Interaction Logic ---

/**
 * Parses SVG height from viewBox or height attribute
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
 * Real-time coordinate tracking on mouse move
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

const resetPanAndZoom = () => {
  if (panZoomInstance.value) {
    panZoomInstance.value.reset();
    panZoomInstance.value.fit();
    panZoomInstance.value.center();
  }
  zoomLevel.value = 1;
};

const resetZoom = () => {
  resetPanAndZoom();
};

/**
 * Prepares SVG string with necessary IDs and viewports
 */
function prepareSvg(svgString) {
  if (!svgString) return "";
  let svg = svgString;
  if (!svg.includes('id="gerber-svg"')) {
    svg = svg.replace("<svg", '<svg id="gerber-svg"');
  }
  if (!svg.includes('class="viewport"')) {
    svg = svg.replace(/<svg[^>]*>/, (match) => {
      return match + '<g class="viewport">';
    });
    svg = svg.replace("</svg>", "</g></svg>");
  }
  return svg;
}

/**
 * Initializes pan and zoom for the SVG viewer
 */
function initPanZoom() {
  nextTick(() => {
    const svgElement = document.getElementById("gerber-svg");
    if (!svgElement) return;
    if (panZoomInstance.value) {
      panZoomInstance.value.destroy();
    }

    panZoomInstance.value = svgPanZoom(svgElement, {
      zoomEnabled: true,
      controlIconsEnabled: false,
      fit: true,
      center: true,
      minZoom: 0.1,
      maxZoom: 50,
      zoomScaleSensitivity: 0.4,
      mouseWheelZoomEnabled: true,
      preventMouseEventsDefault: true,
      viewportSelector: ".viewport",
      onZoom: (scale) => {
        zoomLevel.value = scale;
      },
    });
  });
}

// ===== DIGIKEY API OPERATIONS =====
/**
 * Gets access token from DigiKey API
 * @param {string} value - The ID of the item to search
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
 * Searches for product details using DigiKey API
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

// ==========================================
// 8. HELPER FUNCTIONS
// ==========================================

const getColor = (status) => {
  if (status === "bottom") {
    return {
      color: "red",
      fontWeight: "bold",
    };
  }
  return {};
};

// ==================== ZOOM STATE ====================
const currentViewBox = ref({ x: 0, y: 0, w: 0, h: 0 });
const baseViewBox = ref({ x: 0, y: 0, w: 0, h: 0 });
const ZOOM_IN_LEVEL = 18; // Phóng to 10 lần
const isZooming = ref(false);
// 1. Theo dõi khi SVG thay đổi để lấy thông số gốc
watch(
  () => svgWithPnP.value,
  (newSvg) => {
    if (!newSvg) return;

    // Đợi DOM render xong v-html
    nextTick(() => {
      const vb = getSvgViewBox(newSvg);
      if (vb) {
        baseViewBox.value = {
          x: vb.minX,
          y: vb.minY,
          w: vb.width,
          h: vb.height,
        };
        // Khởi tạo view ban đầu là toàn bộ board
        currentViewBox.value = { ...baseViewBox.value };
        applyViewBox();
      }
    });
  },
);

// 2. Hàm áp dụng ViewBox vào thẻ SVG thực tế
function applyViewBox() {
  if (!svgWrapper.value) return;
  const svgEl = svgWrapper.value.querySelector("svg");
  if (!svgEl) return;

  const { x, y, w, h } = currentViewBox.value;

  // Ép trình duyệt render lại vector dựa trên ViewBox mới
  svgEl.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);

  // Quan trọng: Để SVG lấp đầy container mà không mờ
  svgEl.style.width = "100%";
  svgEl.style.height = "100%";
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
}

// 3. Hàm Zoom chuyên nghiệp (Animation)
async function zoomToSvgPoint(svgX, svgY, targetZoomLevel) {
  // targetZoomLevel ví dụ là 10 (nghĩa là soi kỹ gấp 10 lần kích thước board)
  const targetW = baseViewBox.value.w / targetZoomLevel;
  const targetH = baseViewBox.value.h / targetZoomLevel;

  // Tính toán tọa độ X, Y để điểm svgX, svgY nằm chính giữa màn hình
  const targetX = svgX - targetW / 2;
  const targetY = svgY - targetH / 2;

  await animateViewBox(targetX, targetY, targetW, targetH, 400);
}

function animateViewBox(toX, toY, toW, toH, duration) {
  return new Promise((resolve) => {
    const startX = currentViewBox.value.x;
    const startY = currentViewBox.value.y;
    const startW = currentViewBox.value.w;
    const startH = currentViewBox.value.h;
    const start = performance.now();

    const ease = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const e = ease(t);

      currentViewBox.value = {
        x: startX + (toX - startX) * e,
        y: startY + (toY - startY) * e,
        w: startW + (toW - startW) * e,
        h: startH + (toH - startH) * e,
      };

      applyViewBox();

      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

function highlightComponent(designator) {
  if (!svgWrapper.value) return;

  // 1. Xóa tất cả highlight cũ
  const allMarkers = svgWrapper.value.querySelectorAll(".pnp-marker");
  allMarkers.forEach((el) => el.classList.remove("highlighted-pnp"));

  // 2. Tìm marker của linh kiện hiện tại dựa trên attribute data-designator
  const marker = svgWrapper.value.querySelector(
    `.pnp-marker[data-designator="${designator}"]`,
  );

  if (marker) {
    marker.classList.add("highlighted-pnp");

    // 3. Tự động xóa highlight sau 3 giây để tránh rối mắt
    setTimeout(() => {
      marker.classList.remove("highlighted-pnp");
    }, 1000);
  }
}

async function GetZoomPnP(componentId) {
  const pnp = filteredPnP.value?.find((p) => p.id === componentId);
  if (!pnp) return;

  // Tái sử dụng logic tính toán tọa độ y hệt như trong hàm computed svgWithPnP của bạn
  const vb = baseViewBox.value;
  let x = pnp.x * coordinateScale.value;
  let y = pnp.y * coordinateScale.value;
  if (swapXY.value) [x, y] = [y, x];

  let tx = vb.x + x + coordinateOffsetX.value;
  let ty = vb.y + (vb.h - y) + coordinateOffsetY.value;

  // Mirror logic cho mặt Bottom
  if (selectedLayer.value === "Bottom") {
    if (mirrorMode.value === "x") tx = vb.x + vb.w - (tx - vb.x);
    if (mirrorMode.value === "y") ty = vb.y + vb.h - (ty - vb.y);
  }

  // Thực hiện zoom
  await zoomToSvgPoint(tx, ty, ZOOM_IN_LEVEL);
  highlightComponent(pnp.designator);
}

async function resetsZoom() {
  if (!baseViewBox.value || baseViewBox.value.w === 0) return;

  // Tính toán vị trí gốc
  const { x, y, w, h } = baseViewBox.value;

  isZooming.value = true;

  // Sử dụng lại hàm animateViewBox đã viết ở trên
  await animateViewBox(x, y, w, h, 500); // 500ms cho mượt

  // Xóa tất cả highlight cũ khi reset (tùy chọn)
  if (svgWrapper.value) {
    svgWrapper.value
      .querySelectorAll(".pnp-marker.highlighted-pnp")
      .forEach((el) => el.classList.remove("highlighted-pnp"));
  }

  isZooming.value = false;
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
  background: #f9f9f9;
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
  z-index: 1;
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
  transition: all 0.2s ease;
  z-index: 10;
}

/* Component body rectangle */
.gerber-svg-container-full :deep(.pnp-component-body) {
  fill: rgba(255, 179, 0, 0.4);
  stroke: #e65100;
  stroke-width: 3;
  transition: all 0.2s ease;
}

/* Component outline for better visibility */
.gerber-svg-container-full :deep(.pnp-component-outline) {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.5;
  stroke-dasharray: 2, 2;
  opacity: 1;
  transition: all 0.2s ease;
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
  color: white;
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

/* SVG wrapper nhận transform */
.svg-full-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform; /* GPU acceleration */
  transition: none; /* animation được xử lý bởi JS */
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

@keyframes pulse-ring {
  0% {
    r: 2;
    opacity: 1;
  }
  50% {
    r: 8;
    opacity: 0.6;
  }
  100% {
    r: 2;
    opacity: 1;
  }
}

/* Class này sẽ được thêm vào thẻ <g> của linh kiện */
:deep(.pnp-marker.highlighted-pnp) {
  filter: drop-shadow(
    0 0 5px rgba(255, 255, 0, 0.8)
  ); /* Tạo quầng sáng xung quanh */
}

:deep(.pnp-marker.highlighted-pnp circle) {
  stroke: #00ff00 !important; /* Đổi màu tâm thành xanh lá */
  stroke-width: 5px !important;
  r: 4px !important; /* Phóng to nhẹ vòng tròn tâm */
}

:deep(.pnp-marker.highlighted-pnp line) {
  stroke: #ffff00 !important; /* Đổi crosshair thành màu vàng */
  stroke-width: 3px !important;
}

:deep(.pnp-marker.highlighted-pnp text) {
  fill: #ffffff !important;
  paint-order: stroke;
  stroke: #000000;
  stroke-width: 4px; /* Tạo viền đen cho chữ để dễ đọc trên mọi nền */
}
</style>
