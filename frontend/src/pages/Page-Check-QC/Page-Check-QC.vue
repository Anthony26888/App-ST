<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Danh-sach-pnp-qc" />
      <p class="text-h4 font-weight-light ms-3">{{ project_name }}</p>
    </v-card-title>
    <!-- Stats Cards -->
    <v-card-title>
      <v-row>
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Tổng linh kiện"
            :value="combineBomQC.length || 0"
            icon="mdi-chip"
            color="primary"
            :totalLabel2="topLayerCountWaiting + bottomLayerCountWaiting"
            :totalLabel3="topLayerCountDone + bottomLayerCountDone"
            label2="Chưa kiểm tra"
            label3="Đã kiểm tra"
          >
          </CardStatistic>
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Top"
            :value="
              combineBomQC.filter(
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
            :totalLabel2="topLayerCountWaiting"
            :totalLabel3="topLayerCountDone"
            label2="Chưa kiểm tra"
            label3="Đã kiểm tra"
          >
          </CardStatistic>
        </v-col>
        <v-col cols="12" sm="4" md="4">
          <CardStatistic
            title="Bottom"
            :value="
              combineBomQC.filter(
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
            :totalLabel2="bottomLayerCountWaiting"
            :totalLabel3="bottomLayerCountDone"
            label2="Chưa kiểm tra"
            label3="Đã kiểm tra"
          >
          </CardStatistic>
        </v-col>
      </v-row>
    </v-card-title>

    <v-card-text>
      <v-card class="rounded-lg elevation-1 bg-surface" height="100vh">
        <v-card-title class="d-flex align-center pa-4 border-b">
          <div class="d-flex g-2">
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
                  prepend-icon="mdi-file-document-plus-outline"
                >
                  <v-list-item-title class="text-caption"
                    >File Pick&Place</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  @click="DialogAddBom = true"
                  prepend-icon="mdi-file-document-plus-outline"
                >
                  <v-list-item-title class="text-caption"
                    >File BOM</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  @click="DialogAddFileTop = true"
                  prepend-icon="mdi-format-vertical-align-top"
                >
                  <v-list-item-title class="text-caption"
                    >File PCB Mặt Top</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  @click="DialogAddFileBottom = true"
                  prepend-icon="mdi-format-vertical-align-bottom"
                >
                  <v-list-item-title class="text-caption"
                    >File PCB Mặt Bottom</v-list-item-title
                  >
                </v-list-item>
              </v-list>
            </v-menu>

            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  prepend-icon="mdi-delete"
                  append-icon="mdi-chevron-down"
                  color="error"
                  variant="tonal"
                  class="text-caption ms-2"
                >
                  Xoá dữ liệu
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  @click="DialogDeleteBom = true"
                  prepend-icon="mdi-file-document-remove-outline"
                >
                  <v-list-item-title class="text-caption"
                    >File Bom
                  </v-list-item-title>
                </v-list-item>
                <v-list-item
                  @click="DialogDeletePickPlace = true"
                  prepend-icon="mdi-file-document-remove-outline"
                >
                  <v-list-item-title class="text-caption"
                    >File Pick&Place</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  @click="DialogDeleteSetting = true"
                  prepend-icon="mdi-cog-off-outline"
                >
                  <v-list-item-title class="text-caption"
                    >Dữ liệu cài đặt</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  @click="DialogDeleteAllCheckData = true"
                  prepend-icon="mdi-list-status"
                >
                  <v-list-item-title class="text-caption">
                    Toàn bộ dữ liệu kiểm tra</v-list-item-title
                  >
                </v-list-item>
              </v-list>
            </v-menu>
            <v-tooltip text="Kiểm tra hình ảnh pcb">
              <template v-slot:activator="{ props }">
                <v-btn
                  color="success"
                  variant="tonal"
                  class="text-caption ms-2"
                  prepend-icon="mdi-file-document-check-outline"
                  v-bind="props"
                  @click="$router.push(`/Kiem-tra-image-qc/${id}`)"
                >
                  Kiểm tra
                </v-btn>
              </template>
            </v-tooltip>
            <v-divider vertical class="mx-2"></v-divider>
            <div
              class="d-flex align-center rounded-lg text-caption ms-3"
              style="gap: 12px; height: 40px"
            >
              <!-- Grid -->
              <v-switch
                v-model="isGridMode"
                label="Lưới"
                size="small"
                true-icon="mdi-check"
                false-icon="mdi-close"
                hide-details
                density="compact"
                color="primary"
                class="ma-0 pa-0 align-self-center"
              />

              <template v-if="isGridMode">
                <v-text-field
                  v-model.number="gridRows"
                  type="number"
                  density="compact"
                  variant="outlined"
                  hide-details
                  label="Hàng"
                  style="width: 80px"
                  min="1"
                />
                <v-text-field
                  v-model.number="gridCols"
                  type="number"
                  density="compact"
                  variant="outlined"
                  hide-details
                  label="Cột"
                  style="width: 80px"
                  min="1"
                />
              </template>

              <v-divider vertical class="mx-2"></v-divider>

              <v-switch
                v-model="isShowAllWaiting"
                label="Kiểm tra"
                size="small"
                hide-details
                density="compact"
                color="primary"
                true-icon="mdi-check"
                false-icon="mdi-close"
                class="ma-0 pa-0 align-self-center"
              />

              <v-divider vertical class="mx-2"></v-divider>

              <!-- Align -->
              <v-btn
                :color="isAlignMode ? 'primary' : 'default'"
                :variant="isAlignMode ? 'flat' : 'text'"
                prepend-icon="mdi-crosshairs-gps"
                density="comfortable"
                class="text-caption"
                @click="toggleAlignMode"
              >
                Căn chỉnh
              </v-btn>

              <span
                v-if="isAlignMode"
                class="text-caption"
                :class="
                  alignStep === 5
                    ? 'text-success font-weight-bold'
                    : 'text-primary'
                "
              >
                {{
                  [
                    "",
                    "Trái Trên",
                    "Phải Trên",
                    "Trái Dưới",
                    "Phải Dưới",
                    "Hoàn tất",
                  ][alignStep]
                }}
              </span>

              <v-btn
                v-if="isAlignMode && alignStep > 1"
                icon="mdi-refresh"
                variant="text"
                size="small"
                color="error"
                @click="resetAlign"
              />

              <v-btn
                v-if="isAlignMode && alignStep === 5"
                icon="mdi-check"
                variant="text"
                size="small"
                color="success"
                @click="ApplyAlign"
              />
            </div>
          </div>

          <v-spacer></v-spacer>

          <div
            class="d-flex align-center g-3"
            style="max-width: 400px; width: 100%; justify-content: flex-end"
          >
            <v-btn
              prepend-icon="mdi-tune"
              variant="outlined"
              color="secondary"
              class="text-caption me-3"
              title="Cài đặt tọa độ"
              @click="DialogSettings = true"
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
                <!-- Hidden file input for PCB image upload -->
                <input
                  ref="pcbFileInput"
                  type="file"
                  accept="image/*,.pdf"
                  style="display: none"
                  @change="onPcbImageSelected"
                />

                <img
                  v-if="imageSample"
                  ref="pcbSampleImg"
                  :src="`${Url_Image}/${imageSample}`"
                  crossorigin="anonymous"
                  style="display: none"
                />

                <div v-if="imageUrl" class="pcb-wrapper">
                  <img
                    ref="pcbImg"
                    :src="imageUrl"
                    class="pcb-image"
                    @load="onImageLoad"
                    @click="onImageClick"
                    :style="{
                      cursor:
                        isAlignMode && alignStep < 5 ? 'crosshair' : 'default',
                    }"
                    crossorigin="anonymous"
                  />

                  <svg
                    class="overlay-svg"
                    :width="imageWidth"
                    :height="imageHeight"
                    v-if="imageWidth"
                  >
                    <!-- Lưới Grid -->
                    <g v-if="isGridMode">
                      <!-- Vertical lines -->
                      <line
                        v-for="i in gridCols > 1 ? gridCols - 1 : 0"
                        :key="'v-' + i"
                        :x1="(i / gridCols) * imageWidth"
                        :y1="0"
                        :x2="(i / gridCols) * imageWidth"
                        :y2="imageHeight"
                        stroke="rgba(0, 255, 0, 0.5)"
                        stroke-width="1"
                        stroke-dasharray="4"
                      />
                      <!-- Horizontal lines -->
                      <line
                        v-for="i in gridRows > 1 ? gridRows - 1 : 0"
                        :key="'h-' + i"
                        :x1="0"
                        :y1="(i / gridRows) * imageHeight"
                        :x2="imageWidth"
                        :y2="(i / gridRows) * imageHeight"
                        stroke="rgba(0, 255, 0, 0.5)"
                        stroke-width="1"
                        stroke-dasharray="4"
                      />
                      <!-- Clickable Cells -->
                      <template v-for="r in gridRows" :key="'row-' + r">
                        <rect
                          v-for="c in gridCols"
                          :key="'col-' + c + '-' + r"
                          :x="((c - 1) / gridCols) * imageWidth"
                          :y="((r - 1) / gridRows) * imageHeight"
                          :width="(1 / gridCols) * imageWidth"
                          :height="(1 / gridRows) * imageHeight"
                          fill="transparent"
                          stroke="transparent"
                          style="cursor: pointer"
                          @click.stop="onGridCellClick(r, c)"
                          class="grid-cell-hover"
                        />
                      </template>
                    </g>

                    <!-- Fiducial Markers -->
                    <g
                      v-if="fiducialTL"
                      :transform="`translate(${getFiducialX(
                        fiducialTL,
                      )}, ${getFiducialY(fiducialTL)})`"
                    >
                      <line
                        x1="-30"
                        y1="0"
                        x2="30"
                        y2="0"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <line
                        x1="0"
                        y1="-30"
                        x2="0"
                        y2="30"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="4"
                        fill="transparent"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <text
                        x="30"
                        y="-30"
                        fill="blue"
                        font-size="14"
                        font-weight="bold"
                      >
                        Trái Trên
                      </text>
                    </g>
                    <g
                      v-if="fiducialTR"
                      :transform="`translate(${getFiducialX(
                        fiducialTR,
                      )}, ${getFiducialY(fiducialTR)})`"
                    >
                      <line
                        x1="-30"
                        y1="0"
                        x2="30"
                        y2="0"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <line
                        x1="0"
                        y1="-30"
                        x2="0"
                        y2="30"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="4"
                        fill="transparent"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <text
                        x="10"
                        y="-10"
                        fill="blue"
                        font-size="14"
                        font-weight="bold"
                      >
                        Phải Trên
                      </text>
                    </g>
                    <g
                      v-if="fiducialBL"
                      :transform="`translate(${getFiducialX(
                        fiducialBL,
                      )}, ${getFiducialY(fiducialBL)})`"
                    >
                      <line
                        x1="-30"
                        y1="0"
                        x2="30"
                        y2="0"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <line
                        x1="0"
                        y1="-30"
                        x2="0"
                        y2="30"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="4"
                        fill="transparent"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <text
                        x="30"
                        y="-30"
                        fill="blue"
                        font-size="14"
                        font-weight="bold"
                      >
                        Trái Dưới
                      </text>
                    </g>
                    <g
                      v-if="fiducialBR"
                      :transform="`translate(${getFiducialX(
                        fiducialBR,
                      )}, ${getFiducialY(fiducialBR)})`"
                    >
                      <line
                        x1="-30"
                        y1="0"
                        x2="30"
                        y2="0"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <line
                        x1="0"
                        y1="-30"
                        x2="0"
                        y2="30"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="4"
                        fill="transparent"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <text
                        x="10"
                        y="-10"
                        fill="blue"
                        font-size="14"
                        font-weight="bold"
                      >
                        Phải Dưới
                      </text>
                    </g>

                    <g v-for="item in svgPoints" :key="item.id">
                      <!-- Crosshair -->

                      <line
                        v-if="isActivePoint(item)"
                        :x1="item.px - 20"
                        :y1="item.py"
                        :x2="item.px + 20"
                        :y2="item.py"
                        :stroke="getPointColor(item.id)"
                        :stroke-width="getPointStrokeWidth(item.id)"
                      />

                      <line
                        v-if="isActivePoint(item)"
                        :x1="item.px"
                        :y1="item.py - 20"
                        :x2="item.px"
                        :y2="item.py + 20"
                        :stroke="getPointColor(item.id)"
                        :stroke-width="getPointStrokeWidth(item.id)"
                      />

                      <!-- Center Dot -->

                      <circle
                        :cx="item.px"
                        :cy="item.py"
                        r="2"
                        :fill="getPointColor(item.id)"
                        v-if="isActivePoint(item)"
                      />

                      <!-- Selected -->

                      <rect
                        v-if="
                          String(activePointId) === String(item.id) &&
                          activeGroupPointIds.length === 0
                        "
                        :x="item.px - 100"
                        :y="item.py - 100"
                        width="200"
                        height="200"
                        fill="none"
                        stroke="red"
                        stroke-width="4"
                      />

                      <!-- Designator -->

                      <text
                        v-if="isActivePoint(item)"
                        :x="item.px + 12"
                        :y="item.py - 12"
                        font-size="20"
                        :fill="getPointColor(item.id)"
                        stroke="black"
                        stroke-width="0.3"
                      >
                        {{ item.designator }}
                      </text>
                    </g>
                  </svg>
                </div>

                <!-- Empty state with upload button -->
                <div
                  v-else
                  class="fill-height d-flex flex-column align-center justify-center text-grey-darken-1"
                  style="cursor: pointer"
                  @click="$refs.pcbFileInput.click()"
                >
                  <v-icon size="64" color="grey-lighten-1"
                    >mdi-image-plus</v-icon
                  >
                  <p class="text-body-2 mt-2">Nhấn để tải hình ảnh PCB lên</p>
                </div>

                <!-- Upload overlay button when image exists -->
                <v-btn
                  v-if="imageUrl"
                  icon="mdi-camera-flip-outline"
                  size="small"
                  color="white"
                  variant="flat"
                  class="pcb-upload-btn"
                  @click="$refs.pcbFileInput.click()"
                  title="Đổi hình ảnh PCB"
                ></v-btn>
              </v-card>
            </v-col>

            <v-col cols="5" class="fill-height d-flex flex-column g-3">
              <v-card
                variant="outlined"
                class="rounded-lg overflow-hidden flex-grow-1 mb-3"
              >
                <v-tabs
                  v-model="tab"
                  align-tabs="center"
                  color="orange-accent-4"
                >
                  <v-tab value="one" class="text-caption">Linh kiện</v-tab>
                  <v-tab value="two" class="text-caption">MPN</v-tab>
                </v-tabs>

                <v-divider></v-divider>

                <v-tabs-window v-model="tab">
                  <v-tabs-window-item value="one">
                    <v-sheet class="pa-5">
                      <v-toolbar
                        flat
                        class="px-3 border-b bg-transparent"
                        height="64"
                      >
                        <InputSearch
                          v-model="searchPnPQC"
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
                            :disabled="!combinePnPQC.length"
                          ></v-btn>

                          <span
                            class="text-caption font-weight-bold px-2 text-center"
                            style="min-width: 75px"
                          >
                            {{ combinePnPQC.length ? currentIndex + 1 : 0 }}
                            / {{ combinePnPQC.length }}
                          </span>

                          <v-btn
                            icon="mdi-chevron-right"
                            variant="text"
                            density="comfortable"
                            color="primary"
                            @click="navigatePnP('next')"
                            :disabled="!combinePnPQC.length"
                          ></v-btn>
                        </div>
                      </v-toolbar>

                      <v-data-table-virtual
                        ref="pnpTable"
                        density="compact"
                        :headers="HeadersPnPQC"
                        :items="combinePnPQC"
                        :search="searchPnPQC"
                        v-model="selectedPnPQC"
                        item-value="id"
                        :loading="DialogLoading"
                        loading-text="Đang tải dữ liệu linh kiện..."
                        no-data-text="Không có dữ liệu hiển thị"
                        :hover="true"
                        fixed-header
                        height="calc(50vh - 220px)"
                        :row-props="rowProps"
                      >
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
                                  @click="
                                    GetZoomPnP(item.id);
                                    GetZoomPnPSample(item.id);
                                  "
                                  color="primary"
                                  variant="text"
                                ></v-btn>
                              </template>
                            </v-tooltip>
                          </div>
                        </template>
                      </v-data-table-virtual>
                    </v-sheet>
                  </v-tabs-window-item>
                  <v-tabs-window-item value="two">
                    <v-sheet class="pa-5">
                      <v-toolbar
                        flat
                        class="px-3 border-b bg-transparent"
                        height="64"
                      >
                        <InputSearch
                          v-model="searchBomQC"
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
                            @click="navigateBom('prev')"
                            :disabled="!combineRawBomQC.length"
                          ></v-btn>

                          <span
                            class="text-caption font-weight-bold px-2 text-center"
                            style="min-width: 75px"
                          >
                            {{
                              combineRawBomQC.length ? currentIndexBom + 1 : 0
                            }}
                            / {{ combineRawBomQC.length }}
                          </span>

                          <v-btn
                            icon="mdi-chevron-right"
                            variant="text"
                            density="comfortable"
                            color="primary"
                            @click="navigateBom('next')"
                            :disabled="!combineRawBomQC.length"
                          ></v-btn>
                        </div>
                      </v-toolbar>

                      <v-data-table-virtual
                        ref="pnpTable"
                        density="compact"
                        :headers="HeadersPnPQC"
                        :items="combinePnPQC"
                        :search="searchPnPQC"
                        v-model="selectedPnPQC"
                        item-value="id"
                        :loading="DialogLoading"
                        loading-text="Đang tải dữ liệu linh kiện..."
                        no-data-text="Không có dữ liệu hiển thị"
                        :hover="true"
                        fixed-header
                        height="calc(50vh - 220px)"
                        :row-props="rowProps"
                        class="table-pnp"
                      >
                        <!-- STT -->
                        <template v-slot:item.stt="{ index }">
                          <span class="text-grey font-weight-medium">
                            {{
                              (pagePCBTopLayer - 1) * itemPerPCBTopLayer +
                              index +
                              1
                            }}
                          </span>
                        </template>

                        <!-- X -->
                        <template v-slot:item.x="{ item }">
                          <code>{{ item.x }}</code>
                        </template>

                        <!-- Y -->
                        <template v-slot:item.y="{ item }">
                          <code>{{ item.y }}</code>
                        </template>

                        <!-- MPN -->
                        <template v-slot:item.mpn="{ item }">
                          <v-tooltip :text="item.mpn" location="top">
                            <template #activator="{ props }">
                              <div
                                v-bind="props"
                                class="text-truncate"
                                style="max-width: 220px"
                              >
                                {{ item.mpn }}
                              </div>
                            </template>
                          </v-tooltip>
                        </template>

                        <!-- Description -->
                        <template v-slot:item.description="{ item }">
                          <v-tooltip :text="item.description" location="top">
                            <template #activator="{ props }">
                              <div
                                v-bind="props"
                                class="text-truncate"
                                style="max-width: 300px"
                              >
                                {{ item.description }}
                              </div>
                            </template>
                          </v-tooltip>
                        </template>

                        <!-- Button -->
                        <template v-slot:item.id="{ item }">
                          <div class="d-flex justify-center">
                            <v-tooltip
                              text="Xem chi tiết trên bản vẽ"
                              location="top"
                            >
                              <template #activator="{ props }">
                                <v-btn
                                  v-bind="props"
                                  icon="mdi-eye-outline"
                                  size="small"
                                  color="primary"
                                  variant="text"
                                  @click="
                                    GetZoomPnP(item.id);
                                    GetZoomPnPSample(item.id);
                                  "
                                />
                              </template>
                            </v-tooltip>
                          </div>
                        </template>
                      </v-data-table-virtual>
                    </v-sheet>
                  </v-tabs-window-item>
                </v-tabs-window>
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
                    <!-- Navigation -->
                    <div
                      v-if="activeGroupPointIds.length > 1"
                      style="
                        position: absolute;
                        top: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 100;
                      "
                    >
                      <div
                        class="d-flex align-center bg-white rounded-pill px-2 py-1 elevation-3"
                      >
                        <v-btn
                          icon="mdi-chevron-left"
                          variant="text"
                          density="comfortable"
                          color="primary"
                          @click="NavigateGroupZoom('prev')"
                        />

                        <span class="text-caption font-weight-bold px-3">
                          Điểm thứ {{ currentGroupZoomIndex + 1 }} /
                          {{ activeGroupPointIds.length }}
                        </span>

                        <v-btn
                          icon="mdi-chevron-right"
                          variant="text"
                          density="comfortable"
                          color="primary"
                          @click="NavigateGroupZoom('next')"
                        />
                      </div>
                    </div>

                    <!-- Image -->
                    <v-img
                      :src="dialogImageUrl"
                      max-width="100%"
                      max-height="100%"
                      aspect-ratio="1/1"
                      class="rounded-lg elevation-1 position-relative"
                      alt="Component Preview"
                    >
                      <template #placeholder>
                        <div
                          class="d-flex align-center justify-center fill-height bg-grey-lighten-4"
                        >
                          <v-progress-circular indeterminate color="primary" />
                        </div>
                      </template>
                      <template #default>
                        <svg
                          v-if="zoomedGridBox && isGridMode"
                          style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            z-index: 10;
                          "
                          :viewBox="`0 0 ${zoomedGridBox.w} ${zoomedGridBox.h}`"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          <g
                            v-for="item in gridCellPoints"
                            :key="'zoomed-' + item.id"
                          >
                            <!-- Crosshair inside -->
                            <line
                              :x1="item.px - zoomedGridBox.x - 5"
                              :y1="item.py - zoomedGridBox.y"
                              :x2="item.px - zoomedGridBox.x + 5"
                              :y2="item.py - zoomedGridBox.y"
                              :stroke="
                                activePointId === item.id
                                  ? 'blue'
                                  : item.status === 'Waiting'
                                  ? 'red'
                                  : 'green'
                              "
                              :stroke-width="activePointId === item.id ? 2 : 1"
                              @click="GetZoomPnP(item.id)"
                              style="cursor: pointer"
                            />
                            <line
                              :x1="item.px - zoomedGridBox.x"
                              :y1="item.py - zoomedGridBox.y - 5"
                              :x2="item.px - zoomedGridBox.x"
                              :y2="item.py - zoomedGridBox.y + 5"
                              :stroke="
                                activePointId === item.id
                                  ? 'blue'
                                  : item.status === 'Waiting'
                                  ? 'red'
                                  : 'green'
                              "
                              :stroke-width="activePointId === item.id ? 2 : 1"
                              @click="GetZoomPnP(item.id)"
                              style="cursor: pointer"
                            />
                            <!-- <text
                              :x="item.px - zoomedGridBox.x + 15"
                              :y="item.py - zoomedGridBox.y - 15"
                              font-size="8"
                              :fill="activePointId === item.id ? 'blue' : 'red'"
                              stroke="black"
                              stroke-width="0.3"
                            >
                              {{ item.designator }}
                            </text> -->
                          </g>
                        </svg>
                      </template>
                    </v-img>

                    <!-- Crosshair -->
                    <div
                      v-if="!zoomedGridBox"
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
                        <line
                          x1="0"
                          y1="50"
                          x2="100"
                          y2="50"
                          stroke="red"
                          stroke-width="2"
                        />
                        <line
                          x1="50"
                          y1="0"
                          x2="50"
                          y2="100"
                          stroke="red"
                          stroke-width="2"
                        />
                      </svg>
                    </div>

                    <!-- Save Button Overlay -->
                    <div
                      v-if="GetIDPnP"
                      style="
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        z-index: 200;
                        padding: 12px;
                        background: linear-gradient(
                          to top,
                          rgba(255, 255, 255, 0.95),
                          rgba(255, 255, 255, 0.6),
                          transparent
                        );
                      "
                    >
                      <v-row dense>
                        <v-col cols="8">
                          <v-btn
                            v-if="StatusPnP == 'Waiting' || openSubmit == true"
                            class="text-subtitle-2 font-weight-bold"
                            block
                            size="large"
                            color="success"
                            prepend-icon="mdi-check-circle"
                            :loading="loadingAlign"
                            @click="SaveStatusPnP()"
                          >
                            Xác nhận linh kiện
                          </v-btn>
                          <v-btn
                            v-else
                            class="text-subtitle-2 font-weight-bold"
                            block
                            size="large"
                            color="error"
                            prepend-icon="mdi-close-circle"
                            @click="CancelStatusPnP()"
                          >
                            Huỷ
                          </v-btn>
                        </v-col>
                        <v-col cols="4">
                          <v-btn
                            class="text-subtitle-2 font-weight-bold"
                            block
                            size="large"
                            color="grey-darken-3"
                            prepend-icon="mdi-arrow-left-circle"
                            @click="handleBackClick()"
                          >
                            Quay lại
                          </v-btn>
                        </v-col>
                      </v-row>
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
      <v-card class="mt-5 rounded-lg">
        <v-card-title class="d-flex align-center pe-2">
          <v-icon color="primary">mdi-history</v-icon>
          <p class="text-h6 ms-2">Lịch sử kiểm tra</p>
          <v-spacer></v-spacer>

          <v-select
            v-model="filterStatusHistory"
            :items="['Tất cả', 'Hoàn thành', 'Chưa hoàn thành']"
            label="Trạng thái"
            density="compact"
            variant="outlined"
            hide-details
            class="me-3"
            style="max-width: 170px"
          />

          <v-select
            v-model="sortDesignatorHistory"
            :items="[
              { title: 'Mặc định', value: 'default' },
              { title: 'A-Z', value: 'asc' },
              { title: 'Z-A', value: 'desc' },
            ]"
            item-title="title"
            item-value="value"
            label="Designator"
            density="compact"
            variant="outlined"
            hide-details
            class="me-3"
            style="max-width: 150px"
          />

          <InputSearch
            v-model="searchHistoryQC"
            placeholder="Tìm kiếm linh kiện"
          />
        </v-card-title>
        <v-card-text>
          <v-data-table-virtual
            ref="pnpTableBom"
            density="compact"
            :headers="HeaderHistoryPnPQC"
            :items="combineStatusPnPQC"
            :search="searchHistoryQC"
            v-model="selectedBomQC"
            item-value="id"
            :loading="DialogLoading"
            loading-text="Đang tải dữ liệu linh kiện..."
            no-data-text="Không có dữ liệu hiển thị"
            :hover="true"
            fixed-header
            height="calc(100vh - 220px)"
            :row-props="rowProps"
          >
            <template v-slot:item.stt="{ index }">
              <span class="text-grey font-weight-medium">{{
                (pagePCBTopLayer - 1) * itemPerPCBTopLayer + index + 1
              }}</span>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip
                :color="item.status === 'Done' ? 'success' : 'error'"
                variant="tonal"
                size="small"
                class="font-weight-medium"
                density="comfortable"
                >{{ item.status === "Done" ? "Hoàn thành" : "Chưa hoàn thành" }}
              </v-chip></template
            >
          </v-data-table-virtual>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <BaseDialog
    v-model="DialogAddBom"
    width="600"
    title="Thêm dữ liệu BOM"
    icon="mdi-file-document-plus-outline"
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
    icon="mdi-file-document-plus-outline"
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
    v-model="DialogAddFileTop"
    width="600"
    title="Thêm file PCB mặt Top"
    icon="mdi-format-vertical-align-top"
  >
    <InputFiles
      label="Nhập file PCB mặt Top (.pdf)"
      class="mt-2"
      v-model="FileTop"
      name="fileTop"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogAddFileTop = false" />
      <ButtonSave @save="uploadFileTop()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogAddFileBottom"
    width="600"
    title="Thêm file PCB mặt Bottom"
    icon="mdi-format-vertical-align-bottom"
  >
    <InputFiles
      label="Nhập file PCB mặt Bottom (.pdf)"
      class="mt-2"
      v-model="FileBottom"
      name="fileBottom"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogAddFileBottom = false" />
      <ButtonSave @save="uploadFileBottom()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogSettings"
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
            label="Chiều rộng W (mm)"
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
            label="Chiều cao H (mm)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="0.01"
            hide-details
          />
        </v-col>
      </v-row>
    </div>

    <p class="text-caption text-grey mb-2">
      2. Điều chỉnh tọa độ thủ công (mm):
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
        </v-col>
      </v-row>
    </div>
    <v-divider class="my-3"></v-divider>
    <div class="d-flex gap-2">
      <v-spacer></v-spacer>
      <v-btn color="primary" class="text-caption me-2" @click="SaveSettingPCB()"
        >Áp dụng PnP</v-btn
      >
    </div>
  </BaseDialog>
  <BaseDialog
    v-model="DialogDeleteBom"
    width="600"
    title="Xoá dữ liệu Bom"
    icon="mdi-delete"
  >
    <v-card-text> Bạn có chắc xoá dữ liệu Bom này? </v-card-text>
    <template #actions>
      <ButtonCancel @cancel="DialogDeleteBom = false" />
      <ButtonDelete @delete="DeleteAllBom()" />
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
    v-model="DialogDeleteSetting"
    width="600"
    title="Xoá dữ liệu cài đặt"
    icon="mdi-delete"
  >
    <v-card-text> Bạn có chắc xoá dữ liệu cài đặt này? </v-card-text>
    <template #actions>
      <ButtonCancel @cancel="DialogDeleteSetting = false" />
      <ButtonDelete @delete="DeleteSetting()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogDeleteAllCheckData"
    width="600"
    title="Xoá toàn bộ dữ liệu kiểm tra"
    icon="mdi-delete"
  >
    <v-card-text> Bạn có chắc xoá toàn bộ dữ liệu kiểm tra này? </v-card-text>
    <template #actions>
      <ButtonCancel @cancel="DialogDeleteAllCheckData = false" />
      <ButtonDelete @delete="DeleteAllCheckData()" />
    </template>
  </BaseDialog>
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarCaution v-model="DialogCaution" :message="MessageCautionDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import {
  ref,
  watch,
  computed,
  onMounted,
  reactive,
  nextTick,
  shallowRef,
} from "vue";
import { useRoute } from "vue-router";
import { useCombineBomQC } from "@/composables/CheckQC/useCombineBomQC";
import { usePnPFile } from "@/composables/CheckBOM/usePnPFile";
import { useSettingPCBQC } from "@/composables/CheckQC/useSettingPCBQC";
import { useRawBomQC } from "@/composables/CheckQC/useRawBomQC";
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
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs`;
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
const { combineBomQC } = useCombineBomQC(id);
const { detailPnP } = usePnPFile(id);
const { detailSettingQC } = useSettingPCBQC(id);
const { rawBomQC } = useRawBomQC(id);

// ==========================================
// 3. STATE MANAGEMENT
// ==========================================

// --- Dialog & UI States ---
const DialogAddBom = ref(false);
const DialogAddPnP = ref(false);
const DialogAddFileTop = ref(false);
const DialogAddFileBottom = ref(false);
const DialogAddGerber = ref(false);
const DialogSettingPCB = ref(false);
const DialogSettings = ref(false);
const DialogRemove = ref(false);
const DialogFailed = ref(false);
const DialogLoading = ref(false); // Loading state
const DialogSuccess = ref(false);
const DialogDeletePickPlace = ref(false);
const DialogDeleteBom = ref(false);
const DialogDeleteSetting = ref(false);
const DialogDeleteAllCheckData = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// --- File & Project States ---
const project_name = ref(localStorage.getItem("ProjectQC"));
const FileBom = ref(null);
const FilePnP = ref(null);
const FileTop = ref(null);
const FileBottom = ref(null);
const FileGoldenImage = ref(0);

// File image trong database
const selectedLayer = ref("Top");
const pagePCBTopLayer = 1;
const itemPerPCBTopLayer = ref(15);
const currentIndex = ref(-1);
const currentIndexBom = ref(-1);

// --- Input Field States ---
const width = ref(0);
const height = ref(0);
const imageSample = ref("");
const manualOffsetX = ref(0);
const manualOffsetY = ref(0);

// --- Table & Data States ---
const pnpTable = ref(null);
const tab = ref("one");
const rowProps = (data) => {
  if (
    String(activePointId.value) === String(data.item.id) ||
    activeGroupPointIds.value.includes(data.item.id)
  ) {
    return {
      class: "bg-grey-lighten-3",
    };
  }
  return {};
};

const HeadersPnPQC = [
  {
    title: "Designator",
    key: "designator",
    width: "120px",
  },
  {
    title: "MPN",
    key: "mpn",
    width: "220px",
  },
  {
    title: "Description",
    key: "description",
    width: "300px",
  },
  {
    title: "Thao tác",
    key: "id",
    width: "90px",
    sortable: false,
    align: "center",
  },
];
const HeadersBomQC = [
  { title: "STT", key: "stt" },
  { title: "MPN", key: "mpn", width: "200px" },
  { title: "Designator", key: "designator" },
  { title: "Thao tác", key: "id", sortable: false },
];
const HeaderHistoryPnPQC = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator" },
  { title: "MPN", key: "mpn" },
  { title: "Description", key: "description" },
  { title: "Trạng thái", key: "status" },
];
const searchPnPQC = ref("");
const searchHistoryQC = ref("");
const filterStatusHistory = ref("Tất cả");
const sortDesignatorHistory = ref("default");
const selectedPnPQC = ref([]);
const searchBomQC = ref("");
const searchHistoryBomQC = ref("");
const selectedBomQC = ref([]);
const itemsPerPageBom = ref(20);
const pageBom = ref(1);

// ===============================
// PCB IMAGE + PNP OVERLAY
// ===============================

const imageUrl = ref("");
const pcbImg = ref(null);
const pcbFileInput = ref(null);
const pdfPage = shallowRef(null);

const imageWidth = ref(0);
const imageHeight = ref(0);

const isGridMode = ref(false);
const isShowAllWaiting = ref(false);
const gridRows = ref(5);
const gridCols = ref(5);
const activeGridRow = ref(null);
const activeGridCol = ref(null);

const activePointId = ref(null);
const activeGroupPointIds = ref([]);
const currentGroupZoomIndex = ref(0);
const dialogImageUrl = ref("");
const GetIDPnP = ref(null);
const StatusPnP = ref(null);

const zoomedGridBox = ref(null);

const gridCellPoints = computed(() => {
  if (!zoomedGridBox.value || !isGridMode.value) return [];
  const box = zoomedGridBox.value;
  return svgPoints.value.filter((p) => {
    return (
      p.px >= box.x &&
      p.px <= box.x + box.w &&
      p.py >= box.y &&
      p.py <= box.y + box.h
    );
  });
});

const isActivePoint = (item) => {
  return (
    String(activePointId.value) === String(item.id) ||
    activeGroupPointIds.value.includes(item.id) ||
    (isShowAllWaiting.value &&
      (item.status === "Waiting" || item.status === "Waiting"))
  );
};

const getPointColor = (id) => {
  return String(activePointId.value) === String(id) &&
    activeGroupPointIds.value.length > 1
    ? "blue"
    : "red";
};

const getPointStrokeWidth = (id) => {
  return String(activePointId.value) === String(id) &&
    activeGroupPointIds.value.length > 1
    ? 2
    : 1;
};

// Board Size (mm)
const boardWidthMM = computed(() => width.value);
const boardHeightMM = computed(() => height.value);

// ======================================
// Fiducial Alignment State
// ======================================
const isAlignMode = ref(false);
const alignStep = ref(0); // 0: off, 1: TL, 2: TR, 3: BL, 4: BR, 5: done
const fiducialTL = ref(null); // { x, y } in px
const fiducialTR = ref(null); // { x, y } in px
const fiducialBL = ref(null); // { x, y } in px
const fiducialBR = ref(null); // { x, y } in px

// ==========================================
// 4. COMPUTED PROPERTIES
// ==========================================
watch(
  [detailSettingQC, selectedLayer],
  async ([val]) => {
    if (!val?.length) return;

    const found = val[0];

    width.value = Number(found.width) || 0;
    height.value = Number(found.height) || 0;

    let pcbFile = "";

    if (selectedLayer.value === "Top" || selectedLayer.value === "TopLayer") {
      pcbFile = found.fileTop || "";
    } else if (
      selectedLayer.value === "Bottom" ||
      selectedLayer.value === "BottomLayer"
    ) {
      pcbFile = found.fileBottom || "";
    }

    await loadPcb(pcbFile);

    fiducialBL.value = found.fiducialBL ? JSON.parse(found.fiducialBL) : null;

    fiducialBR.value = found.fiducialBR ? JSON.parse(found.fiducialBR) : null;

    fiducialTL.value = found.fiducialTL ? JSON.parse(found.fiducialTL) : null;

    fiducialTR.value = found.fiducialTR ? JSON.parse(found.fiducialTR) : null;

    if (
      fiducialTL.value &&
      fiducialTR.value &&
      fiducialBL.value &&
      fiducialBR.value
    ) {
      alignStep.value = 5;
    } else {
      alignStep.value = 1;
    }
  },
  {
    immediate: true,
  },
);
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

const topLayerCountWaiting = computed(() => {
  if (!combineBomQC.value) return 0;

  return combineBomQC.value.filter(
    (item) =>
      (item.layer === "Top" || item.layer === "TopLayer") &&
      item.status === "Waiting",
  ).length;
});

const bottomLayerCountWaiting = computed(() => {
  if (!combineBomQC.value) return 0;
  return combineBomQC.value.filter(
    (item) =>
      (item.layer === "Bottom" || item.layer === "BottomLayer") &&
      item.status === "Waiting",
  ).length;
});

const bottomLayerCountDone = computed(() => {
  if (!combineBomQC.value) return 0;
  return combineBomQC.value.filter(
    (item) =>
      (item.layer === "Bottom" || item.layer === "BottomLayer") &&
      item.status === "Done",
  ).length;
});

const topLayerCountDone = computed(() => {
  if (!combineBomQC.value) return 0;
  return combineBomQC.value.filter(
    (item) =>
      (item.layer === "Top" || item.layer === "TopLayer") &&
      item.status === "Done",
  ).length;
});

const componentsWithSize = computed(() => {
  if (!filteredPnP.value) return 0;
  return filteredPnP.value.filter(
    (p) => p.width && p.length && p.width > 0 && p.length > 0,
  ).length;
});

// Legacy currentSvgContent removed

const combinePnPQC = computed(() => {
  if (selectedLayer.value === "Top") {
    return combineBomQC.value.filter(
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
    return combineBomQC.value.filter(
      (item) =>
        item.layer === "Bottom" ||
        item.layer === "BottomLayer" ||
        item.layer === "bottom" ||
        item.layer === "BOTTOMLAYER" ||
        item.layer === "bottomlayer" ||
        item.layer === "BOTTOM",
    );
  }
});

const combineRawBomQC = computed(() => {
  if (selectedLayer.value === "Top") {
    return rawBomQC.value.filter((item) =>
      item.layers?.toLowerCase().includes("top"),
    );
  }

  if (selectedLayer.value === "Bottom") {
    return rawBomQC.value.filter((item) =>
      item.layers?.toLowerCase().includes("bottom"),
    );
  }

  return rawBomQC.value;
});

const combineStatusPnPQC = computed(() => {
  let data = [];

  if (selectedLayer.value === "Top") {
    data = combineBomQC.value.filter((item) =>
      ["Top", "TopLayer", "top", "TOPLAYER", "toplayer", "TOP"].includes(
        item.layer,
      ),
    );
  } else if (selectedLayer.value === "Bottom") {
    data = combineBomQC.value.filter((item) =>
      [
        "Bottom",
        "BottomLayer",
        "bottom",
        "BOTTOMLAYER",
        "bottomlayer",
        "BOTTOM",
      ].includes(item.layer),
    );
  }

  if (filterStatusHistory.value === "Hoàn thành") {
    data = data.filter((item) => item.status === "Done");
  } else if (filterStatusHistory.value === "Chưa hoàn thành") {
    data = data.filter((item) => item.status !== "Done");
  }

  let result = [...data];
  if (sortDesignatorHistory.value === "asc") {
    result.sort((a, b) => {
      const nameA = a.designator || "";
      const nameB = b.designator || "";
      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  } else if (sortDesignatorHistory.value === "desc") {
    result.sort((a, b) => {
      const nameA = a.designator || "";
      const nameB = b.designator || "";
      return nameB.localeCompare(nameA, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  } else {
    result.sort((a, b) => {
      if (a.status === "Done" && b.status !== "Done") return -1;
      if (a.status !== "Done" && b.status === "Done") return 1;
      return 0;
    });
  }

  return result;
});

function navigatePnP(direction) {
  if (!combinePnPQC.value.length) return;

  if (direction === "next") {
    currentIndex.value = (currentIndex.value + 1) % combinePnPQC.value.length;
  } else {
    currentIndex.value =
      (currentIndex.value - 1 + combinePnPQC.value.length) %
      combinePnPQC.value.length;
  }

  const targetItem = combinePnPQC.value[currentIndex.value];
  if (targetItem) {
    GetZoomPnP(targetItem.id);
    GetZoomPnPSample(targetItem.id);
  }
}

function navigateBom(direction) {
  if (!combineRawBomQC.value.length) return;

  if (direction === "next") {
    currentIndexBom.value =
      (currentIndexBom.value + 1) % combineRawBomQC.value.length;
  } else {
    currentIndexBom.value =
      (currentIndexBom.value - 1 + combineRawBomQC.value.length) %
      combineRawBomQC.value.length;
  }

  const targetItem = combineRawBomQC.value[currentIndexBom.value];
  if (targetItem) {
    GetZoomPnPGroup(targetItem.id);
  }
}

function toggleAlignMode() {
  isAlignMode.value = !isAlignMode.value;
  if (isAlignMode.value && alignStep.value === 0) {
    alignStep.value = 1;
    fiducialTL.value = null;
    fiducialTR.value = null;
    fiducialBL.value = null;
    fiducialBR.value = null;
  }
}

function resetAlign() {
  alignStep.value = 1;
  fiducialTL.value = null;
  fiducialTR.value = null;
  fiducialBL.value = null;
  fiducialBR.value = null;
}

function onImageClick(event) {
  if (!isAlignMode.value || alignStep.value >= 5) return;

  const rect = pcbImg.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const rx = x / rect.width;
  const ry = y / rect.height;

  if (alignStep.value === 1) {
    fiducialTL.value = { x: rx, y: ry };
    alignStep.value = 2;
  } else if (alignStep.value === 2) {
    fiducialTR.value = { x: rx, y: ry };
    alignStep.value = 3;
  } else if (alignStep.value === 3) {
    fiducialBL.value = { x: rx, y: ry };
    alignStep.value = 4;
  } else if (alignStep.value === 4) {
    fiducialBR.value = { x: rx, y: ry };
    alignStep.value = 5;
  }
}

// ======================================
// Upload PCB Image
// ======================================

async function renderPdf(arrayBuffer) {
  const typedArray = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument(typedArray).promise;
  const page = await pdf.getPage(1);

  pdfPage.value = page;

  const scale = 2;

  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext("2d");

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  imageUrl.value = canvas.toDataURL("image/png");
}
const baseURL = import.meta.env.VITE_API_URL;
// Ví dụ:
// http://192.168.1.10:3000

async function loadPcb(source) {
  try {
    if (!source) {
      imageUrl.value = "";
      pdfPage.value = null;
      return;
    }

    // ========= Upload từ máy =========
    if (source instanceof File) {
      if (source.type === "application/pdf") {
        const arrayBuffer = await source.arrayBuffer();
        await renderPdf(arrayBuffer);
      } else {
        pdfPage.value = null;
        imageUrl.value = URL.createObjectURL(source);
      }
    }

    // ========= Load từ Database =========
    else if (typeof source === "string") {
      const fileUrl = `${baseURL}/${source}`;

      if (source.toLowerCase().endsWith(".pdf")) {
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error("Không tải được file PDF");
        }

        const arrayBuffer = await response.arrayBuffer();

        await renderPdf(arrayBuffer);
      } else {
        pdfPage.value = null;
        imageUrl.value = fileUrl;
      }
    }

    activePointId.value = null;
    dialogImageUrl.value = "";
  } catch (err) {
    console.error(err);

    imageUrl.value = "";
    pdfPage.value = null;
  }
}
async function onPcbImageSelected(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  await loadPcb(file);
}
// ======================================
// Get Actual Display Size
// ======================================

function updateImageSize() {
  if (!pcbImg.value) return;

  const rect = pcbImg.value.getBoundingClientRect();

  imageWidth.value = rect.width;
  imageHeight.value = rect.height;
}

const handleBackClick = () => {
  GetIDPnP.value = null;
  StatusPnP.value = null;
  if (isGridMode.value && activeGridRow.value && activeGridCol.value) {
    onGridCellClick(activeGridRow.value, activeGridCol.value);
  } else {
    dialogImageUrl.value = "";
    zoomedGridBox.value = null;
  }
};

function onGridCellClick(row, col) {
  const img = pcbImg.value;
  if (!img) return;

  activeGridRow.value = row;
  activeGridCol.value = col;

  const rows = Math.max(1, gridRows.value);
  const cols = Math.max(1, gridCols.value);

  // Xóa các điểm đã chọn trước đó
  activePointId.value = null;
  activeGroupPointIds.value = [];
  GetIDPnP.value = null;
  StatusPnP.value = null;

  const displayCellW = imageWidth.value / cols;
  const displayCellH = imageHeight.value / rows;
  zoomedGridBox.value = {
    x: (col - 1) * displayCellW,
    y: (row - 1) * displayCellH,
    w: displayCellW,
    h: displayCellH,
  };

  if (pdfPage.value) {
    dialogImageUrl.value = "";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const pdfViewport = pdfPage.value.getViewport({ scale: 1 });

    // Kích thước cell trên tọa độ gốc PDF
    const cellPdfWidth = pdfViewport.width / cols;
    const cellPdfHeight = pdfViewport.height / rows;

    const pdfX = (col - 1) * cellPdfWidth;
    const pdfY = (row - 1) * cellPdfHeight;

    // Render với kích thước hiển thị tối đa ~800px để không bị nặng
    const maxRenderSize = 800;
    let renderScale = 1;
    if (cellPdfWidth > maxRenderSize || cellPdfHeight > maxRenderSize) {
      renderScale = Math.min(
        maxRenderSize / cellPdfWidth,
        maxRenderSize / cellPdfHeight,
      );
    } else {
      renderScale = Math.max(
        1,
        Math.min(maxRenderSize / cellPdfWidth, maxRenderSize / cellPdfHeight),
      );
    }

    canvas.width = cellPdfWidth * renderScale;
    canvas.height = cellPdfHeight * renderScale;

    const cropViewport = pdfPage.value.getViewport({
      scale: renderScale,
      offsetX: -pdfX * renderScale,
      offsetY: -pdfY * renderScale,
    });

    const renderContext = {
      canvasContext: ctx,
      viewport: cropViewport,
    };

    pdfPage.value
      .render(renderContext)
      .promise.then(() => {
        dialogImageUrl.value = canvas.toDataURL("image/png");
      })
      .catch((err) => {
        console.error("Lỗi render PDF grid:", err);
      });
    return;
  }

  // Zoom cho file Image
  const natCellW = img.naturalWidth / cols;
  const natCellH = img.naturalHeight / rows;
  const natX = (col - 1) * natCellW;
  const natY = (row - 1) * natCellH;

  const maxCanvasSize = 800;
  let scale = 1;
  if (natCellW > maxCanvasSize || natCellH > maxCanvasSize) {
    scale = Math.min(maxCanvasSize / natCellW, maxCanvasSize / natCellH);
  } else {
    scale = Math.max(
      1,
      Math.min(maxCanvasSize / natCellW, maxCanvasSize / natCellH),
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = natCellW * scale;
  canvas.height = natCellH * scale;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    img,
    natX,
    natY,
    natCellW,
    natCellH,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  dialogImageUrl.value = canvas.toDataURL("image/png");
}

function onZoomedGridPointClick(componentId) {
  GetIDPnP.value = componentId;
  const foundStatus = combinePnPQC.value.find((val) => val.id === componentId);
  StatusPnP.value = foundStatus?.status;

  activePointId.value = componentId;
  activeGroupPointIds.value = [];

  if (combinePnPQC.value && combinePnPQC.value.length) {
    const index = combinePnPQC.value.findIndex(
      (p) => String(p.id) === String(componentId),
    );
    if (index !== -1) {
      currentIndex.value = index;
      nextTick(() => {
        if (pnpTable.value) {
          pnpTable.value.scrollToIndex(index);
        }
      });
    }
  }
}

function onImageLoad() {
  updateImageSize();
}

onMounted(() => {
  window.addEventListener("resize", updateImageSize);
});

// ======================================
// MM -> PIXEL
// ======================================

function getFiducialX(f) {
  if (!f) return 0;
  return f.x > 1 ? f.x : f.x * imageWidth.value;
}

function getFiducialY(f) {
  if (!f) return 0;
  return f.y > 1 ? f.y : f.y * imageHeight.value;
}

const svgPoints = computed(() => {
  if (!imageWidth.value || !imageHeight.value || !combinePnPQC.value?.length) {
    return [];
  }

  return combinePnPQC.value
    .filter(
      (item) =>
        item.x !== null &&
        item.y !== null &&
        !isNaN(Number(item.x)) &&
        !isNaN(Number(item.y)),
    )
    .map((item) => {
      const mmX = Number(item.x) + Number(manualOffsetX.value || 0);
      const mmY = Number(item.y) + Number(manualOffsetY.value || 0);

      let px, py;

      if (
        fiducialTL.value &&
        fiducialTR.value &&
        fiducialBL.value &&
        fiducialBR.value
      ) {
        // Căng chỉnh theo 4 điểm sử dụng Bilinear Interpolation
        // U: Tỷ lệ theo trục X (0 ở trái, 1 ở phải)
        // V: Tỷ lệ theo trục Y (0 ở dưới, 1 ở trên)
        const u = mmX / boardWidthMM.value;
        const v = mmY / boardHeightMM.value;

        // Nội suy tọa độ X và Y
        px =
          (1 - u) * (1 - v) * getFiducialX(fiducialBL.value) +
          u * (1 - v) * getFiducialX(fiducialBR.value) +
          (1 - u) * v * getFiducialX(fiducialTL.value) +
          u * v * getFiducialX(fiducialTR.value);

        py =
          (1 - u) * (1 - v) * getFiducialY(fiducialBL.value) +
          u * (1 - v) * getFiducialY(fiducialBR.value) +
          (1 - u) * v * getFiducialY(fiducialTL.value) +
          u * v * getFiducialY(fiducialTR.value);
      } else {
        // Mặc định căng chỉnh theo kích thước ảnh
        px = (mmX / boardWidthMM.value) * imageWidth.value;

        // Nếu ảnh PCB được chụp từ TOP VIEW
        py =
          imageHeight.value - (mmY / boardHeightMM.value) * imageHeight.value;
      }

      return {
        ...item,
        px,
        py,
      };
    });
});

// ======================================
// Zoom Component
// ======================================

function GetZoomPnP(componentId) {
  zoomedGridBox.value = null;
  GetIDPnP.value = componentId;
  const foundStatus = combinePnPQC.value.find((val) => val.id === componentId);
  StatusPnP.value = foundStatus?.status;
  if (width.value == 0 || height.value == 0)
    return (
      (DialogFailed.value = true),
      (MessageErrorDialog.value =
        "Chưa có dữ liệu chiều dài hoặc chiều rộng PCB")
    );
  const point = svgPoints.value.find(
    (p) => String(p.id) === String(componentId),
  );

  if (!point) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Không tìm thấy linh kiện";
    return;
  }

  activePointId.value = componentId;
  activeGroupPointIds.value = [];

  if (combinePnPQC.value && combinePnPQC.value.length) {
    const index = combinePnPQC.value.findIndex(
      (p) => String(p.id) === String(componentId),
    );
    if (index !== -1) {
      currentIndex.value = index;
      nextTick(() => {
        if (pnpTable.value) {
          pnpTable.value.scrollToIndex(index);
        }
      });
    }
  }

  const img = pcbImg.value;

  if (!img) return;

  if (pdfPage.value) {
    dialogImageUrl.value = "";
    const cropSize = 300;
    const canvas = document.createElement("canvas");
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");

    const pdfViewport = pdfPage.value.getViewport({ scale: 1 });
    const pdfToDisplayScale = imageWidth.value / pdfViewport.width;

    const pdfX = point.px / pdfToDisplayScale;
    const pdfY = point.py / pdfToDisplayScale;

    const pdfCropHalf = 30 / pdfToDisplayScale;
    const renderScale = cropSize / 2 / pdfCropHalf;

    const scaledPdfX = pdfX * renderScale;
    const scaledPdfY = pdfY * renderScale;

    const offsetX = cropSize / 2 - scaledPdfX;
    const offsetY = cropSize / 2 - scaledPdfY;

    const cropViewport = pdfPage.value.getViewport({
      scale: renderScale,
      offsetX: offsetX,
      offsetY: offsetY,
    });

    const renderContext = {
      canvasContext: ctx,
      viewport: cropViewport,
    };

    pdfPage.value
      .render(renderContext)
      .promise.then(() => {
        dialogImageUrl.value = canvas.toDataURL("image/png");
        console.log("PDF zoom rendered successfully.");
      })
      .catch((err) => {
        console.error("Lỗi render PDF:", err);
      });
    return;
  }

  const canvas = document.createElement("canvas");

  const cropSize = 300;

  canvas.width = cropSize;
  canvas.height = cropSize;

  const ctx = canvas.getContext("2d");

  // Pixel trên ảnh gốc
  const natX = (point.px / imageWidth.value) * img.naturalWidth;

  const natY = (point.py / imageHeight.value) * img.naturalHeight;

  const scaleX = img.naturalWidth / imageWidth.value;

  const cropHalf = 30 * scaleX;

  let sx = natX - cropHalf;
  let sy = natY - cropHalf;

  let sw = cropHalf * 2;
  let sh = cropHalf * 2;

  if (sx < 0) {
    sw += sx;
    sx = 0;
  }

  if (sy < 0) {
    sh += sy;
    sy = 0;
  }

  if (sx + sw > img.naturalWidth) {
    sw = img.naturalWidth - sx;
  }

  if (sy + sh > img.naturalHeight) {
    sh = img.naturalHeight - sy;
  }

  ctx.clearRect(0, 0, cropSize, cropSize);

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cropSize, cropSize);

  dialogImageUrl.value = canvas.toDataURL("image/png");
}

// ===============================
// PCB GOLDEN IMAGE (SAMPLE)
// ===============================

const pcbSampleImg = ref(null);
const activeSamplePointId = ref(null);
const dialogSampleImageUrl = ref("");

// Board Size (mm)
const boardSampleWidthMM = computed(() => width.value);
const boardSampleHeightMM = computed(() => height.value);

// ======================================
// Zoom Component
// ======================================

function GetZoomPnPGroup(componentId) {
  zoomedGridBox.value = null;
  if (width.value == 0 || height.value == 0) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Chưa có dữ liệu chiều dài hoặc chiều rộng PCB";
    return;
  }

  const bomItem = combineRawBomQC.value.find(
    (p) => String(p.id) === String(componentId),
  );

  if (!bomItem) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Không tìm thấy BOM item";
    return;
  }

  const designators = bomItem.designator
    ? bomItem.designator.split(",").map((d) => d.trim())
    : [];

  const matchedPoints = combinePnPQC.value.filter((p) =>
    designators.includes(p.designator),
  );

  if (matchedPoints.length === 0) {
    DialogFailed.value = true;
    MessageErrorDialog.value =
      "Không tìm thấy tọa độ linh kiện nào trong danh sách PnP";
    return;
  }

  currentGroupZoomIndex.value = 0;

  // Zoom vào linh kiện đầu tiên để hiển thị ở 2 bảng PCB Test/Sample
  GetZoomPnP(matchedPoints[0].id);
  GetZoomPnPSample(matchedPoints[0].id);

  // Đặt danh sách group các id sau khi gọi GetZoomPnP để không bị clear
  activeGroupPointIds.value = matchedPoints.map((p) => p.id);
}

function NavigateGroupZoom(direction) {
  if (activeGroupPointIds.value.length <= 1) return;

  if (direction === "next") {
    currentGroupZoomIndex.value =
      (currentGroupZoomIndex.value + 1) % activeGroupPointIds.value.length;
  } else {
    currentGroupZoomIndex.value =
      (currentGroupZoomIndex.value - 1 + activeGroupPointIds.value.length) %
      activeGroupPointIds.value.length;
  }

  const pointId = activeGroupPointIds.value[currentGroupZoomIndex.value];
  const groupIds = [...activeGroupPointIds.value];

  GetZoomPnP(pointId);
  GetZoomPnPSample(pointId);

  activeGroupPointIds.value = groupIds;
}

function GetZoomPnPSample(componentId) {
  if (width.value == 0 || height.value == 0) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Chưa có dữ liệu chiều dài hoặc chiều rộng PCB";
    return;
  }
  const point = combinePnPQC.value.find(
    (p) => String(p.id) === String(componentId),
  );

  if (!point) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Không tìm thấy linh kiện";
    return;
  }

  activeSamplePointId.value = componentId;

  const img = pcbSampleImg.value;

  if (!img || !img.naturalWidth) return;

  const canvas = document.createElement("canvas");

  const cropSize = 300;

  canvas.width = cropSize;
  canvas.height = cropSize;

  const ctx = canvas.getContext("2d");

  const mmX = Number(point.x);
  const mmY = Number(point.y);

  // Pixel trên ảnh gốc
  const natX = (mmX / boardSampleWidthMM.value) * img.naturalWidth;
  const natY = (1 - mmY / boardSampleHeightMM.value) * img.naturalHeight;

  const displayWidth = imageWidth.value > 0 ? imageWidth.value : 800;
  const scaleX = img.naturalWidth / displayWidth;

  const cropHalf = 80 * scaleX;

  let sx = natX - cropHalf;
  let sy = natY - cropHalf;

  let sw = cropHalf * 2;
  let sh = cropHalf * 2;

  if (sx < 0) {
    sw += sx;
    sx = 0;
  }

  if (sy < 0) {
    sh += sy;
    sy = 0;
  }

  if (sx + sw > img.naturalWidth) {
    sw = img.naturalWidth - sx;
  }

  if (sy + sh > img.naturalHeight) {
    sh = img.naturalHeight - sy;
  }

  ctx.clearRect(0, 0, cropSize, cropSize);

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cropSize, cropSize);

  dialogSampleImageUrl.value = canvas.toDataURL("image/png");
}

const GetPnP = (id) => {
  GetIDPnP.value = id;
};

/**
 * Upload file BOM (.xlsx) lên server và cập nhật danh sách BOM cho project
 */
const uploadBOM = async () => {
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("FileBom", FileBom.value);

    // Bây giờ Backend đã phản hồi, await sẽ kết thúc tại đây
    await axios.post(`${Url}/UploadQC/upload-bom-qc/${id}`, formData);

    DialogSuccess.value = true;
    MessageDialog.value = "Upload Bom thành công";
    DialogAddBom.value = false;
    FileBom.value = null;
  } catch (error) {
    console.error(error);
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload Bom thất bại";
  } finally {
    // Luôn luôn tắt Loading dù thành công hay lỗi
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
    await axios.post(`${Url}/UploadQC/upload-pickplace-qc/${id}`, formData);
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

/**
 * Upload file Pick & Place (.xlsx) lên server và cập nhật tọa độ linh kiện
 */
const uploadFileTop = async () => {
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("fileTop", FileTop.value);
    await axios.put(`${Url}/UploadQC/Upload-file-top/${id}`, formData);
    DialogSuccess.value = true;
    MessageDialog.value = "Upload file top thành công";
    DialogAddFileTop.value = false;
    FileTop.value = null;
    DialogLoading.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload file top thất bại";
    DialogLoading.value = false;
  }
};

/**
 * Upload file Pick & Place (.xlsx) lên server và cập nhật tọa độ linh kiện
 */
const uploadFileBottom = async () => {
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("fileBottom", FileBottom.value);
    await axios.put(`${Url}/UploadQC/Upload-file-bottom/${id}`, formData);
    DialogSuccess.value = true;
    MessageDialog.value = "Upload file bottom thành công";
    DialogAddFileBottom.value = false;
    FileBottom.value = null;
    DialogLoading.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload file bottom thất bại";
    DialogLoading.value = false;
  }
};

// --- 7.2 Data Edit/Update Handlers ---

/**
 * Mở dialog chỉnh sửa và điền thông tin Pick & Place của item được chọn
 * @param {Object} item - Đối tượng linh kiện từ bảng BOM/PnP
 */

const GetSettingPCBQC = () => {
  DialogSettings.value = true;
  const found = detailSettingQC.value.find((val) => {
    return val.project_id === Number(route.params.id);
  });
  if (!found) return;
  width.value = found.width;
  height.value = found.height;
  imageSample.value = found.image;
};

/**
 * Lưu cài đặt PCB/Panel lên server:
 * offset manual (X, Y cho Top/Bottom), kích thước PCB, tọa độ gốc máy SMT,
 * rìa panel (rail), góc xoay. Reset bộ đếm offset sau khi lưu.
 */
const SaveSettingPCB = async () => {
  const x = Number(manualOffsetX.value);
  const y = Number(manualOffsetY.value);

  if (isNaN(x) || isNaN(y)) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Offset phải là một số hợp lệ";
    return;
  }

  if (isNaN(Number(width.value)) || isNaN(Number(height.value))) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Width hoặc Height không hợp lệ";
    return;
  }

  DialogLoading.value = true;

  try {
    const currentLayer = combineBomQC.value[0]?.layer || "";

    const offsetPayload = {
      offsetX: x,
      offsetY: y,
      layer: currentLayer,
    };

    const settingPayload = {
      width: Number(width.value),
      height: Number(height.value),
    };

    console.log("Setting Payload:", settingPayload);

    await Promise.all([
      axios.put(
        `${Url}/Pickplace-BomQC/Edit-offset/${route.params.id}`,
        offsetPayload,
      ),

      axios.put(
        `${Url}/SettingPCB-QC/Edit-item/${route.params.id}`,
        settingPayload,
      ),
    ]);

    DialogSuccess.value = true;
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";

    DialogSettings.value = false;

    manualOffsetX.value = 0;
    manualOffsetY.value = 0;
  } catch (error) {
    console.error(error);

    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Chỉnh sửa dữ liệu thất bại";
  } finally {
    DialogLoading.value = false;
  }
};

const ApplyAlign = async () => {
  DialogLoading.value = true;
  try {
    await axios.put(
      `${Url}/SettingPCB-QC/apply-align/${route.params.id}`,
      {
        fiducialBL: fiducialBL.value,
        fiducialBR: fiducialBR.value,
        fiducialTL: fiducialTL.value,
        fiducialTR: fiducialTR.value,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    DialogSuccess.value = true;
    MessageDialog.value = "Áp dụng dữ liệu thành công";
    isAlignMode.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Áp dụng dữ liệu thất bại";
  } finally {
    DialogLoading.value = false;
  }
};

// Save Status in Pickplace QC table
const SaveStatusPnP = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.put(
      `${Url}/Pickplace-BomQC/Edit-item-status/${GetIDPnP.value}`,
    );
    DialogLoading.value = false;
    StatusPnP.value = "Done";
    DialogSuccess.value = true;
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
  } catch (error) {
    DialogLoading.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
  }
};

// Cancel Status in Pickplace QC table
const CancelStatusPnP = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.put(
      `${Url}/Pickplace-BomQC/Cancel-item-status/${GetIDPnP.value}`,
    );
    DialogLoading.value = false;
    StatusPnP.value = "Waiting";
    DialogSuccess.value = true;
    MessageDialog.value = "Huỷ dữ liệu thành công";
  } catch (error) {
    DialogLoading.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Huỷ dữ liệu thất bại";
  }
};

// Delete Bom
const DeleteAllBom = async () => {
  DialogLoading.value = true;
  try {
    await axios.delete(`${Url}/Pickplace-BomQC/Delete-item-bom/${id}`);
    DialogSuccess.value = true;
    MessageDialog.value = "Xóa dữ liệu thành công";
    DialogDeleteBom.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Xóa dữ liệu thất bại";
    DialogDeleteBom.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

// Delete PickPlace
const DeleteAllPickPlace = async () => {
  DialogLoading.value = true;
  try {
    await axios.delete(`${Url}/Pickplace-BomQC/Delete-item-pickplace/${id}`);
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

// Delete Setting
const DeleteSetting = async () => {
  DialogLoading.value = true;
  try {
    await axios.put(`${Url}/SettingPCB-QC/Delete-item/${id}`);
    DialogSuccess.value = true;
    MessageDialog.value = "Xóa dữ liệu thành công";
    DialogDeleteSetting.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Xóa dữ liệu thất bại";
    DialogDeleteSetting.value = false;
  } finally {
    DialogLoading.value = false;
  }
};

// Delete All Check Data
const DeleteAllCheckData = async () => {
  DialogLoading.value = true;
  try {
    await axios.put(`${Url}/PickPlace-BomQC/Change-all-status/${id}`);
    DialogSuccess.value = true;
    MessageDialog.value = "Xóa dữ liệu thành công";
    DialogDeleteAllCheckData.value = false;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Xóa dữ liệu thất bại";
    DialogDeleteAllCheckData.value = false;
  } finally {
    DialogLoading.value = false;
  }
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
.pcb-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Ảnh tự động co giãn theo khung nhưng KHÔNG bị cắt */
.pcb-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* Đảm bảo hiển thị đầy đủ, tạo viền trống nếu ảnh lệch tỉ lệ với v-card */
  display: block;
}

/* SVG phải bám vừa khít theo kích thước của ảnh */
.overlay-svg {
  position: absolute;
  /* Nếu dùng object-fit contain, bạn nên để SVG fit theo đúng kích thước width/height 
     mà hàm onImageLoad tính toán được từ thẻ img */
  pointer-events: none;
}

/* Nút đổi hình ảnh PCB */
.pcb-upload-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.pcb-upload-btn:hover {
  opacity: 1;
}

.grid-cell-hover {
  pointer-events: auto;
}
.grid-cell-hover:hover {
  fill: rgba(0, 255, 0, 0.2) !important;
  stroke: rgba(0, 255, 0, 0.8) !important;
  stroke-width: 2px !important;
}

.table-pnp .text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Giữ cột thao tác luôn nhìn thấy */
.table-pnp th:last-child,
.table-pnp td:last-child {
  position: sticky;
  right: 0;
  background: rgb(var(--v-theme-surface));
  z-index: 2;
}

/* Header của cột thao tác */
.table-pnp th:last-child {
  z-index: 3;
}
</style>
