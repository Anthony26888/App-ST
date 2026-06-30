<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100%">
    <v-card-title class="d-flex">
      <ButtonBack :to="`/Kiem-tra-pnp-qc/${id}`" />
      <p class="text-h4 font-weight-light ms-3">{{ project_name }}</p>
    </v-card-title>

    <v-card-text>
      <v-card class="rounded-lg elevation-1 bg-surface" height="100%">
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
                  @click="DialogAddImageTop = true"
                  prepend-icon="mdi-image-plus"
                >
                  <v-list-item-title class="text-caption"
                    >Hình ảnh PCB Mặt Top</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  @click="DialogAddImageBottom = true"
                  prepend-icon="mdi-image-plus"
                >
                  <v-list-item-title class="text-caption"
                    >Hình ảnh PCB Mặt Bottom</v-list-item-title
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
                  @click="DialogDeleteSetting = true"
                  prepend-icon="mdi-image-remove"
                >
                  <v-list-item-title class="text-caption"
                    >Hình ảnh PCB Top</v-list-item-title
                  >
                </v-list-item>
                <v-list-item
                  @click="DialogDeleteSetting = true"
                  prepend-icon="mdi-image-remove"
                >
                  <v-list-item-title class="text-caption"
                    >Hình ảnh PCB Bottom</v-list-item-title
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

        <v-card-text class="pa-4" style="height: calc(100vh - 45px)">
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
                  <!-- Grid Toolbar -->
                  <div
                    v-if="imageUrl && imageSample"
                    class="d-flex align-center bg-white opacity-80 rounded-lg px-2 py-2 elevation-2 position-absolute"
                    style="top: 8px; left: 10px; z-index: 10"
                  >
                    <v-btn
                      :color="isGridMode ? 'primary' : 'default'"
                      variant="text"
                      density="comfortable"
                      prepend-icon="mdi-grid"
                      @click="isGridMode = !isGridMode"
                      class="text-caption me-2"
                    >
                      Lưới
                    </v-btn>
                    <template v-if="isGridMode">
                      <v-text-field
                        v-model.number="gridRows"
                        type="number"
                        density="compact"
                        hide-details
                        variant="outlined"
                        style="width: 70px"
                        class="text-caption me-2"
                        label="Hàng"
                        min="1"
                      ></v-text-field>
                      <v-text-field
                        v-model.number="gridCols"
                        type="number"
                        density="compact"
                        hide-details
                        variant="outlined"
                        style="width: 70px"
                        class="text-caption"
                        label="Cột"
                        min="1"
                      ></v-text-field>
                    </template>
                  </div>

                  <!-- Căn chỉnh Fiducial Toolbar -->
                  <div
                    class="d-flex align-center bg-white opacity-80 rounded-lg px-2 py-2 elevation-2 position-absolute"
                    style="top: 8px; left: 300px; z-index: 10"
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
                    class="overlay-grid"
                    :width="imageWidth"
                    :height="imageHeight"
                    v-if="imageWidth && isGridMode"
                    style="position: absolute; pointer-events: auto; z-index: 5"
                  >
                    <g v-for="r in gridRows" :key="'r' + r">
                      <g v-for="c in gridCols" :key="'c' + c">
                        <rect
                          :x="(c - 1) * (imageWidth / gridCols)"
                          :y="(r - 1) * (imageHeight / gridRows)"
                          :width="imageWidth / gridCols"
                          :height="imageHeight / gridRows"
                          fill="transparent"
                          stroke="rgba(0, 255, 0, 0.5)"
                          stroke-width="1"
                          style="cursor: pointer"
                          @click="onGridClick(r, c)"
                          @mouseenter="hoverGrid = { r, c }"
                          @mouseleave="hoverGrid = null"
                        />
                        <rect
                          v-if="
                            hoverGrid && hoverGrid.r === r && hoverGrid.c === c
                          "
                          :x="(c - 1) * (imageWidth / gridCols)"
                          :y="(r - 1) * (imageHeight / gridRows)"
                          :width="imageWidth / gridCols"
                          :height="imageHeight / gridRows"
                          fill="rgba(0, 255, 0, 0.2)"
                          pointer-events="none"
                        />
                        <rect
                          v-if="
                            activeGrid &&
                            activeGrid.r === r &&
                            activeGrid.c === c
                          "
                          :x="(c - 1) * (imageWidth / gridCols)"
                          :y="(r - 1) * (imageHeight / gridRows)"
                          :width="imageWidth / gridCols"
                          :height="imageHeight / gridRows"
                          fill="rgba(255, 0, 0, 0.2)"
                          stroke="red"
                          stroke-width="2"
                          pointer-events="none"
                        />
                      </g>
                    </g>
                  </svg>

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
              <v-row>
                <v-col cols="12">
                  <v-card
                    variant="outlined"
                    class="rounded-lg overflow-hidden position-relative bg-grey-lighten-5"
                    style="height: 43vh"
                  >
                    <!-- Toolbar Overlay -->
                    <v-toolbar
                      density="compact"
                      flat
                      style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 20;
                        background: rgba(46, 125, 50, 0) !important;
                      "
                    >
                      <v-toolbar-title
                        class="text-subtitle-1 font-weight-medium text-primary"
                      >
                        PCB Test
                      </v-toolbar-title>

                      <v-btn
                        icon="mdi-fit-to-screen"
                        variant="text"
                        color="white"
                      />
                    </v-toolbar>

                    <!-- Image -->
                    <div
                      v-if="dialogImageUrl"
                      class="fill-height w-100 d-flex align-center justify-center bg-white"
                    >
                      <div
                        class="position-relative d-flex align-center justify-center"
                        style="width: 100%; height: 100%"
                      >
                        <v-img
                          :src="dialogImageUrl"
                          width="100%"
                          height="100%"
                          contain
                          class="rounded-lg"
                          alt="PCB Sample"
                        >
                          <template #placeholder>
                            <div
                              class="fill-height d-flex align-center justify-center bg-grey-lighten-4"
                            >
                              <v-progress-circular
                                indeterminate
                                color="primary"
                              />
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
                            z-index: 30;
                          "
                        >
                          <svg
                            width="100"
                            height="100"
                            viewBox="0 0 100 100"
                            fill="none"
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

                    <v-card-text
                      v-else
                      class="fill-height d-flex align-center justify-center"
                    >
                      <v-empty-state
                        title="Không có hình ảnh"
                        text="Chọn hoặc xem chi tiết linh kiện để hiển thị ảnh thực tế."
                        icon="mdi-image-off-outline"
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12">
                  <v-card
                    variant="outlined"
                    class="rounded-lg overflow-hidden position-relative bg-grey-lighten-5"
                    style="height: 43vh"
                  >
                    <!-- Toolbar Overlay -->
                    <v-toolbar
                      density="compact"
                      flat
                      style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 20;
                        background: rgba(46, 125, 50, 0) !important;
                      "
                    >
                      <v-toolbar-title
                        class="text-subtitle-1 font-weight-medium text-green-accent-4"
                      >
                        PCB Mẫu
                      </v-toolbar-title>

                      <v-btn
                        icon="mdi-fit-to-screen"
                        variant="text"
                        color="white"
                      />
                    </v-toolbar>

                    <!-- Image -->
                    <div
                      v-if="dialogSampleImageUrl"
                      class="fill-height w-100 d-flex align-center justify-center bg-white"
                    >
                      <div
                        class="position-relative d-flex align-center justify-center"
                        style="width: 100%; height: 100%"
                      >
                        <v-img
                          :src="dialogSampleImageUrl"
                          width="100%"
                          height="100%"
                          contain
                          class="rounded-lg"
                          alt="PCB Sample"
                        >
                          <template #placeholder>
                            <div
                              class="fill-height d-flex align-center justify-center bg-grey-lighten-4"
                            >
                              <v-progress-circular
                                indeterminate
                                color="primary"
                              />
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
                            z-index: 30;
                          "
                        >
                          <svg
                            width="100"
                            height="100"
                            viewBox="0 0 100 100"
                            fill="none"
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

                    <v-card-text
                      v-else
                      class="fill-height d-flex align-center justify-center"
                    >
                      <v-empty-state
                        title="Không có hình ảnh"
                        text="Chọn hoặc xem chi tiết linh kiện để hiển thị ảnh thực tế."
                        icon="mdi-image-off-outline"
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
    v-model="DialogAddImageTop"
    width="600"
    title="Thêm hình ảnh PCB mặt Top"
    icon="mdi-format-vertical-align-top"
  >
    <InputFiles
      label="Nhập hình ảnh PCB mặt Top (.jpeg, .jpg, .png)"
      class="mt-2"
      v-model="ImageTop"
      name="ImageTop"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogAddImageTop = false" />
      <ButtonSave @save="uploadImageTop()" />
    </template>
  </BaseDialog>
  <BaseDialog
    v-model="DialogAddImageBottom"
    width="600"
    title="Thêm hình ảnh PCB mặt Bottom"
    icon="mdi-format-vertical-align-bottom"
  >
    <InputFiles
      label="Nhập hình ảnh PCB mặt Bottom (.jpeg, .jpg, .png)"
      class="mt-2"
      v-model="ImageBottom"
      name="ImageBottom"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogAddImageBottom = false" />
      <ButtonSave @save="uploadImageBottom()" />
    </template>
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
// const Url_Image = "https://api.erpst.io.vn";
const Url_Image = import.meta.env.VITE_API_URL;
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
const DialogAddImageTop = ref(false);
const DialogAddImageBottom = ref(false);
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

const ImageTop = ref(null);
const ImageBottom = ref(null);

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
const GetIDPnP = ref(null);
const StatusPnP = ref(null);

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

// Grid State
const isGridMode = ref(false);
const gridRows = ref(3);
const gridCols = ref(3);
const hoverGrid = ref(null);
const activeGrid = ref(null);

function onGridClick(r, c) {
  activeGrid.value = { r, c };

  if (activePointId.value) {
    activePointId.value = null; // deselect component
    activeGroupPointIds.value = [];
  }

  const cellWidth = imageWidth.value / gridCols.value;
  const cellHeight = imageHeight.value / gridRows.value;
  const cellX = (c - 1) * cellWidth;
  const cellY = (r - 1) * cellHeight;
  const px = cellX + cellWidth / 2;
  const py = cellY + cellHeight / 2;

  const fracX = px / imageWidth.value;
  const fracY = py / imageHeight.value;
  const fracW = cellWidth / imageWidth.value;
  const fracH = cellHeight / imageHeight.value;

  // 1. Zoom Test Image
  const imgTest = pcbImg.value;
  if (imgTest && imgTest.naturalWidth) {
    const natX = fracX * imgTest.naturalWidth;
    const natY = fracY * imgTest.naturalHeight;
    const maxNatSize = Math.max(
      fracW * imgTest.naturalWidth,
      fracH * imgTest.naturalHeight,
    );
    const cropHalf = maxNatSize / 2;

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
    if (sx + sw > imgTest.naturalWidth) {
      sw = imgTest.naturalWidth - sx;
    }
    if (sy + sh > imgTest.naturalHeight) {
      sh = imgTest.naturalHeight - sy;
    }

    const canvas = document.createElement("canvas");
    const cropSize = 500;
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, cropSize, cropSize);
    ctx.drawImage(imgTest, sx, sy, sw, sh, 0, 0, cropSize, cropSize);
    dialogImageUrl.value = canvas.toDataURL("image/png");
  }

  // 2. Zoom Sample Image
  const imgSample = pcbSampleImg.value;
  if (imgSample && imgSample.naturalWidth) {
    const natX = fracX * imgSample.naturalWidth;
    const natY = fracY * imgSample.naturalHeight;
    const maxNatSize = Math.max(
      fracW * imgSample.naturalWidth,
      fracH * imgSample.naturalHeight,
    );
    const cropHalf = maxNatSize / 2;

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
    if (sx + sw > imgSample.naturalWidth) {
      sw = imgSample.naturalWidth - sx;
    }
    if (sy + sh > imgSample.naturalHeight) {
      sh = imgSample.naturalHeight - sy;
    }

    const canvas = document.createElement("canvas");
    const cropSize = 500;
    canvas.width = cropSize;
    canvas.height = cropSize;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, cropSize, cropSize);
    ctx.drawImage(imgSample, sx, sy, sw, sh, 0, 0, cropSize, cropSize);
    dialogSampleImageUrl.value = canvas.toDataURL("image/png");
  }
}

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
    if (selectedLayer.value === "Top" || selectedLayer.value === "TopLayer") {
      imageSample.value = found.imageSampleTop || "";
    } else if (
      selectedLayer.value === "Bottom" ||
      selectedLayer.value === "BottomLayer"
    ) {
      imageSample.value = found.imageSampleBottom || "";
    }

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

// ===============================
// PCB GOLDEN IMAGE (SAMPLE)
// ===============================

const pcbSampleImg = ref(null);
const activeSamplePointId = ref(null);
const dialogSampleImageUrl = ref("");

// Board Size (mm)
const boardSampleWidthMM = computed(() => width.value);
const boardSampleHeightMM = computed(() => height.value);

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

/**
 * Upload file Pick & Place (.xlsx) lên server và cập nhật tọa độ linh kiện
 */
const uploadImageTop = async () => {
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("imageSampleTop", ImageTop.value);
    await axios.put(
      `${Url}/SettingPCB-QC/Upload-image-sample-top/${id}`,
      formData,
    );
    DialogSuccess.value = true;
    MessageDialog.value = "Upload file top thành công";
    DialogAddImageTop.value = false;
    ImageTop.value = null;
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
const uploadImageBottom = async () => {
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("imageSampleBottom", ImageBottom.value);
    await axios.put(
      `${Url}/SettingPCB-QC/Upload-image-sample-bottom/${id}`,
      formData,
    );
    DialogSuccess.value = true;
    MessageDialog.value = "Upload file bottom thành công";
    DialogAddImageBottom.value = false;
    ImageBottom.value = null;
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

// Save Status in Pickplace QC table
const SaveStatusPnP = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.put(
      `${Url}/PickPlaceQC/Edit-item-status/${GetIDPnP.value}`,
    );
    DialogLoading.value = false;
    GetIDPnP.value = null;
    StatusPnP.value = "Done";
    DialogSuccess.value = true;
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
  } catch (error) {
    DialogLoading.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
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
