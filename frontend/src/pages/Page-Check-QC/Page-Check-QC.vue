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
                  prepend-icon="mdi-plus"
                >
                  <v-list-item-title class="text-caption"
                    >File Pick&Place</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  @click="DialogAddBom = true"
                  prepend-icon="mdi-plus"
                >
                  <v-list-item-title class="text-caption"
                    >File BOM</v-list-item-title
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
                  prepend-icon="mdi-delete"
                >
                  <v-list-item-title class="text-caption"
                    >File BO
                  </v-list-item-title>
                </v-list-item>
                <v-list-item
                  @click="DialogDeletePickPlace = true"
                  prepend-icon="mdi-delete"
                >
                  <v-list-item-title class="text-caption"
                    >File Pick&Place</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  @click="DialogDeleteSetting = true"
                  prepend-icon="mdi-delete"
                >
                  <v-list-item-title class="text-caption"
                    >Dữ liệu cài đặt</v-list-item-title
                  >
                </v-list-item>
              </v-list>
            </v-menu>
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
              class="text-none font-weight-medium me-3"
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
                  accept="image/*"
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
                  <!-- Căn chỉnh Fiducial Toolbar -->
                  <div
                    class="d-flex align-center bg-white rounded-lg px-2 py-1 elevation-2 position-absolute"
                    style="top: 8px; left: 400px; z-index: 10"
                  >
                    <v-btn
                      :color="isAlignMode ? 'primary' : 'default'"
                      variant="text"
                      density="comfortable"
                      prepend-icon="mdi-crosshairs-gps"
                      @click="toggleAlignMode"
                      class="text-caption"
                    >
                      Căn chỉnh
                    </v-btn>
                    <span
                      v-if="isAlignMode"
                      class="text-caption ms-2"
                      :class="
                        alignStep === 5
                          ? 'text-success font-weight-bold'
                          : 'text-primary'
                      "
                    >
                      {{
                        alignStep === 1
                          ? "1. Chọn điểm Trái Trên"
                          : alignStep === 2
                          ? "2. Chọn điểm Phải Trên"
                          : alignStep === 3
                          ? "3. Chọn điểm Trái Dưới"
                          : alignStep === 4
                          ? "4. Chọn điểm Phải Dưới"
                          : "Hoàn tất căn chỉnh"
                      }}
                    </span>
                    <v-btn
                      v-if="isAlignMode && alignStep > 1"
                      icon="mdi-refresh"
                      variant="text"
                      size="small"
                      color="error"
                      @click="resetAlign"
                      class="ms-2"
                      title="Làm lại"
                    ></v-btn>
                    <v-btn
                      v-if="isAlignMode && alignStep === 5"
                      icon="mdi-check"
                      variant="text"
                      size="small"
                      color="success"
                      @click="ApplyAlign()"
                      class="ms-2"
                      title="Áp dụng"
                    ></v-btn>
                  </div>

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
                    <!-- Fiducial Markers -->
                    <g v-if="fiducialTL">
                      <line
                        :x1="fiducialTL.x - 30"
                        :y1="fiducialTL.y"
                        :x2="fiducialTL.x + 30"
                        :y2="fiducialTL.y"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <line
                        :x1="fiducialTL.x"
                        :y1="fiducialTL.y - 30"
                        :x2="fiducialTL.x"
                        :y2="fiducialTL.y + 30"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <circle
                        :cx="fiducialTL.x"
                        :cy="fiducialTL.y"
                        r="4"
                        fill="transparent"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <text
                        :x="fiducialTL.x + 30"
                        :y="fiducialTL.y - 30"
                        fill="blue"
                        font-size="14"
                        font-weight="bold"
                      >
                        Trái Trên
                      </text>
                    </g>
                    <g v-if="fiducialTR">
                      <line
                        :x1="fiducialTR.x - 30"
                        :y1="fiducialTR.y"
                        :x2="fiducialTR.x + 30"
                        :y2="fiducialTR.y"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <line
                        :x1="fiducialTR.x"
                        :y1="fiducialTR.y - 30"
                        :x2="fiducialTR.x"
                        :y2="fiducialTR.y + 30"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <circle
                        :cx="fiducialTR.x"
                        :cy="fiducialTR.y"
                        r="4"
                        fill="transparent"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <text
                        :x="fiducialTR.x + 10"
                        :y="fiducialTR.y - 10"
                        fill="blue"
                        font-size="14"
                        font-weight="bold"
                      >
                        Phải Trên
                      </text>
                    </g>
                    <g v-if="fiducialBL">
                      <line
                        :x1="fiducialBL.x - 30"
                        :y1="fiducialBL.y"
                        :x2="fiducialBL.x + 30"
                        :y2="fiducialBL.y"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <line
                        :x1="fiducialBL.x"
                        :y1="fiducialBL.y - 30"
                        :x2="fiducialBL.x"
                        :y2="fiducialBL.y + 30"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <circle
                        :cx="fiducialBL.x"
                        :cy="fiducialBL.y"
                        r="4"
                        fill="transparent"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <text
                        :x="fiducialBL.x + 30"
                        :y="fiducialBL.y - 30"
                        fill="blue"
                        font-size="14"
                        font-weight="bold"
                      >
                        Trái Dưới
                      </text>
                    </g>
                    <g v-if="fiducialBR">
                      <line
                        :x1="fiducialBR.x - 30"
                        :y1="fiducialBR.y"
                        :x2="fiducialBR.x + 30"
                        :y2="fiducialBR.y"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <line
                        :x1="fiducialBR.x"
                        :y1="fiducialBR.y - 30"
                        :x2="fiducialBR.x"
                        :y2="fiducialBR.y + 30"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <circle
                        :cx="fiducialBR.x"
                        :cy="fiducialBR.y"
                        r="4"
                        fill="transparent"
                        stroke="blue"
                        stroke-width="2"
                      />
                      <text
                        :x="fiducialBR.x + 10"
                        :y="fiducialBR.y - 10"
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
                        v-if="isActivePoint(item.id)"
                        :x1="item.px - 20"
                        :y1="item.py"
                        :x2="item.px + 20"
                        :y2="item.py"
                        :stroke="getPointColor(item.id)"
                        :stroke-width="getPointStrokeWidth(item.id)"
                      />

                      <line
                        v-if="isActivePoint(item.id)"
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
                        v-if="isActivePoint(item.id)"
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
                        v-if="isActivePoint(item.id)"
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
                        show-select
                        :row-props="rowProps"
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
                        ref="pnpTableBom"
                        density="compact"
                        :headers="HeadersBomQC"
                        :items="combineRawBomQC"
                        :search="searchBomQC"
                        v-model="selectedBomQC"
                        item-value="id"
                        :loading="DialogLoading"
                        loading-text="Đang tải dữ liệu linh kiện..."
                        no-data-text="Không có dữ liệu hiển thị"
                        :hover="true"
                        fixed-header
                        height="calc(50vh - 220px)"
                        show-select
                        :row-props="rowProps"
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
                                  @click="GetZoomPnPGroup(item.id)"
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
                </v-tabs-window>
              </v-card>

              <v-card
                variant="outlined"
                class="rounded-lg overflow-hidden d-flex flex-column align-center justify-center bg-grey-lighten-5"
                style="height: calc(50vh - 45px)"
                v-if="imageSample == null || imageSample == ''"
              >
                <div
                  v-if="dialogImageUrl"
                  class="pa-3 fill-height w-100 d-flex align-center justify-center bg-white"
                >
                  <div
                    class="position-relative d-flex align-center justify-center"
                    style="width: 100%; height: 100%"
                  >
                    <!-- Navigation nằm đè trên ảnh -->
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

                    <!-- Ảnh -->
                    <v-img
                      :src="dialogImageUrl"
                      max-width="100%"
                      max-height="100%"
                      aspect-ratio="1/1"
                      class="rounded-lg elevation-1"
                      alt="Component Preview"
                    >
                      <template #placeholder>
                        <div
                          class="d-flex align-center justify-center fill-height bg-grey-lighten-4"
                        >
                          <v-progress-circular indeterminate color="primary" />
                        </div>
                      </template>
                    </v-img>

                    <!-- Crosshair -->
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
              <v-row v-else>
                <v-col cols="6">
                  <v-card
                    variant="outlined"
                    class="rounded-lg overflow-hidden d-flex flex-column align-center justify-center bg-grey-lighten-5"
                    style="height: calc(50vh - 45px)"
                  >
                    <v-card-title
                      class="text-center w-100 text-subtitle-1 text-primary"
                      >PCB Test</v-card-title
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
                            <line
                              x1="0"
                              y1="50"
                              x2="100"
                              y2="50"
                              stroke="#D32F2F"
                              stroke-width="1"
                            />
                            <line
                              x1="50"
                              y1="0"
                              x2="50"
                              y2="100"
                              stroke="#D32F2F"
                              stroke-width="1"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <v-card-text v-else>
                      <v-empty-state
                        title="Không có hình ảnh"
                        text="Chọn hoặc xem chi tiết linh kiện để hiển thị ảnh thực tế."
                        icon="mdi-image-off-outline"
                        class="text-grey-darken-1"
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card
                    variant="outlined"
                    class="rounded-lg overflow-hidden d-flex flex-column align-center justify-center bg-grey-lighten-5"
                    style="height: calc(50vh - 45px)"
                  >
                    <v-card-title
                      class="text-center w-100 text-subtitle-1 text-success"
                      >PCB Mẫu</v-card-title
                    >
                    <div
                      v-if="dialogSampleImageUrl"
                      class="pa-3 fill-height w-100 d-flex align-center justify-center bg-white"
                    >
                      <div
                        class="position-relative d-flex align-center justify-center"
                        style="width: 100%; height: 100%"
                      >
                        <v-img
                          :src="dialogSampleImageUrl"
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
                            <line
                              x1="0"
                              y1="50"
                              x2="100"
                              y2="50"
                              stroke="#D32F2F"
                              stroke-width="1"
                            />
                            <line
                              x1="50"
                              y1="0"
                              x2="50"
                              y2="100"
                              stroke="#D32F2F"
                              stroke-width="1"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <v-card-text v-else>
                      <v-empty-state
                        title="Không có hình ảnh"
                        text="Chọn hoặc xem chi tiết linh kiện để hiển thị ảnh thực tế."
                        icon="mdi-image-off-outline"
                        class="text-grey-darken-1"
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-card-text>
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

    <p class="text-caption text-grey mb-2">3. Hình ảnh PCB Mẫu:</p>

    <div class="ga-2">
      <v-row>
        <v-col cols="8">
          <InputFiles
            v-model="FileGoldenImage"
            label="Chọn ảnh mẫu PCB"
            name="imageSample"
            accept=".png,.jpg,.jpeg"
          />
        </v-col>
        <v-col v-if="imageSample" cols="4" class="mx-auto">
          <v-img
            :src="`${Url_Image}/${imageSample}`"
            max-height="100px"
            rounded
          ></v-img>
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
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarCaution v-model="DialogCaution" :message="MessageCautionDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { ref, watch, computed, onMounted, reactive, nextTick } from "vue";
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
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// --- File & Project States ---
const project_name = ref(localStorage.getItem("ProjectQC"));
const FileBom = ref(null);
const FilePnP = ref(null);
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
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator" },
  { title: "MPN", key: "mpn", width: "200px" },
  { title: "Thao tác", key: "id", sortable: false },
];
const HeadersBomQC = [
  { title: "STT", key: "stt" },
  { title: "MPN", key: "mpn", width: "200px" },
  { title: "Designator", key: "designator" },
  { title: "Thao tác", key: "id", sortable: false },
];
const searchPnPQC = ref("");
const selectedPnPQC = ref([]);
const searchBomQC = ref("");
const selectedBomQC = ref([]);
const itemsPerPageBom = ref(20);
const pageBom = ref(1);

// ===============================
// PCB IMAGE + PNP OVERLAY
// ===============================

const imageUrl = ref("");
const pcbImg = ref(null);
const pcbFileInput = ref(null);

const imageWidth = ref(0);
const imageHeight = ref(0);

const activePointId = ref(null);
const activeGroupPointIds = ref([]);
const currentGroupZoomIndex = ref(0);
const dialogImageUrl = ref("");

const isActivePoint = (id) => {
  return (
    String(activePointId.value) === String(id) ||
    activeGroupPointIds.value.includes(id)
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
  detailSettingQC,
  (val) => {
    if (!val?.length) return;

    const found = val[0];

    width.value = Number(found.width) || 0;
    height.value = Number(found.height) || 0;
    imageSample.value = found.image || "";

    fiducialBL.value = found.fiducialBL ? JSON.parse(found.fiducialBL) : null;

    fiducialBR.value = found.fiducialBR ? JSON.parse(found.fiducialBR) : null;

    fiducialTL.value = found.fiducialTL ? JSON.parse(found.fiducialTL) : null;

    fiducialTR.value = found.fiducialTR ? JSON.parse(found.fiducialTR) : null;

    // Nếu đủ 4 điểm thì đánh dấu đã align xong
    if (
      fiducialTL.value &&
      fiducialTR.value &&
      fiducialBL.value &&
      fiducialBR.value
    ) {
      alignStep.value = 5;
    }
  },
  { immediate: true },
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

const topLayerCount = computed(() => {
  if (!combineBomQC.value) return 0;
  return combineBomQC.value.filter(
    (item) => item.layer === "Top" || item.layer === "TopLayer",
  ).length;
});

const bottomLayerCount = computed(() => {
  if (!combineBomQC.value) return 0;
  return combineBomQC.value.filter(
    (item) => item.layer === "Bottom" || item.layer === "BottomLayer",
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

  if (alignStep.value === 1) {
    fiducialTL.value = { x, y };
    alignStep.value = 2;
  } else if (alignStep.value === 2) {
    fiducialTR.value = { x, y };
    alignStep.value = 3;
  } else if (alignStep.value === 3) {
    fiducialBL.value = { x, y };
    alignStep.value = 4;
  } else if (alignStep.value === 4) {
    fiducialBR.value = { x, y };
    alignStep.value = 5;
  }
}

// ======================================
// Upload PCB Image
// ======================================

function onPcbImageSelected(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    imageUrl.value = e.target.result;
    activePointId.value = null;
    dialogImageUrl.value = "";
  };

  reader.readAsDataURL(file);
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

function onImageLoad() {
  updateImageSize();
}

onMounted(() => {
  window.addEventListener("resize", updateImageSize);
});

// ======================================
// MM -> PIXEL
// ======================================

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
          (1 - u) * (1 - v) * fiducialBL.value.x +
          u * (1 - v) * fiducialBR.value.x +
          (1 - u) * v * fiducialTL.value.x +
          u * v * fiducialTR.value.x;

        py =
          (1 - u) * (1 - v) * fiducialBL.value.y +
          u * (1 - v) * fiducialBR.value.y +
          (1 - u) * v * fiducialTL.value.y +
          u * v * fiducialTR.value.y;
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

/**
 * Upload file BOM (.xlsx) lên server và cập nhật danh sách BOM cho project
 */
const uploadBOM = async () => {
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("FileBom", FileBom.value);

    // Bây giờ Backend đã phản hồi, await sẽ kết thúc tại đây
    await axios.post(`${Url}/upload-bom-qc/${id}`, formData);

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
    await axios.post(`${Url}/upload-pickplace-qc/${id}`, formData);
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

  DialogLoading.value = true;

  try {
    const currentLayer = combineBomQC.value[0]?.layer || "";

    const offsetPayload = {
      offsetX: x,
      offsetY: y,
      layer: currentLayer,
    };

    // FormData cho SettingPCB
    const formData = new FormData();

    formData.append("width", width.value);
    formData.append("height", height.value);

    // giữ ảnh cũ nếu không upload mới
    formData.append("oldImage", imageSample.value || "");

    if (FileGoldenImage.value) {
      formData.append("image", FileGoldenImage.value);
    }

    const [resOffset, resSetting] = await Promise.all([
      axios.put(
        `${Url}/PickPlaceQC/Edit-offset/${route.params.id}`,
        offsetPayload,
      ),

      axios.put(`${Url}/SettingPCB-QC/Edit-item/${route.params.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
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

// Delete Bom
const DeleteAllBom = async () => {
  DialogLoading.value = true;
  try {
    await axios.delete(`${Url}/BomQC/Delete-item/${id}`);
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
    await axios.delete(`${Url}/PickPlaceQC/Delete-item/${id}`);
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
</style>
