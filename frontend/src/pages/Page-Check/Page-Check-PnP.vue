<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex">
      <ButtonBack to="/Danh-sach-pnp" />
      <p class="text-h4 font-weight-light ms-3">Dữ liệu SMT</p>
    </v-card-title>
    <v-card-title class="d-flex align-center pe-2">
      <v-btn
        @click="DialogAddBom = true"
        prepend-icon="mdi-plus"
        class="text-caption"
        color="primary"
        variant="tonal"
        >Thêm file Bom</v-btn
      >
      <v-btn
        @click="DialogAddPnP = true"
        prepend-icon="mdi-plus"
        class="text-caption"
        color="primary ms-2"
        variant="tonal"
        >Thêm file Pick & Place</v-btn
      >
      <v-btn
        @click="DialogAddGerber = true"
        prepend-icon="mdi-plus"
        class="text-caption ms-2"
        color="primary"
        variant="tonal"
        >Thêm file Gerber</v-btn
      >
      <ButtonDownload @download-file="DownloadPnP()" />
      <p class="text-subtitle-1 font-weight-thin text-subtitle-1 ms-2">
        {{ combineBom.length }} linh kiện
        <span v-if="componentsWithSize > 0" class="text-caption text-grey">
          ({{ componentsWithSize }} có kích thước)
        </span>
      </p>
      <v-spacer></v-spacer>
      <InputSearch v-model="searchBom" />
    </v-card-title>
    <v-card-text>
      <v-data-table
        :headers="Headers"
        :items="combineBom"
        :search="searchBom"
        :items-per-page="itemsPerPageBom"
        v-model:page="pageBom"
        class="elevation-1"
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
        height="calc(100vh - 200px)"
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
            <ButtonEdit @edit="GetItemEdit(item)" />
            <ButtonSearch @search="getAccessToken(item)" class="ms-2" />
            <v-btn
              icon="mdi-update"
              color="success"
              variant="text"
              @click="GetAddSize(item)"
            ></v-btn>
          </div>
        </template>
        <template v-slot:item.mount_type="{ value }">
          <v-chip
            :color="value === 'SMT' ? 'primary' : 'warning'"
            size="small"
            variant="tonal"
          >
            {{ value }}
          </v-chip>
        </template>
        <template v-slot:item.layer="{ value }">
          <v-chip
            :color="value === 'Top' ? 'success' : 'error'"
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
      </v-data-table>
    </v-card-text>
    <v-card-title class="d-flex align-center mt-5">
      <span>So sánh Gerber và Pick & Place</span>
      <v-spacer></v-spacer>
      <!-- Coordinate scaling controls -->
      <v-btn
        title="Cập nhật"
        icon="mdi-update"
        color="success"
        class="text-caption"
        variant="tonal"
      ></v-btn>
      <v-btn
        @click="GetSettingSVG()"
        icon="mdi-tune"
        size="small"
        variant="outlined"
        class="me-2 ms-2"
        title="Cài đặt tọa độ"
      ></v-btn>

      <!-- Controls for overlay -->
      <v-btn-toggle v-model="overlayMode" color="primary" group class="me-4">
        <v-btn value="both" size="small">Cả hai</v-btn>
        <v-btn value="gerber" size="small">Chỉ Gerber</v-btn>
        <v-btn value="pnp" size="small">Chỉ PnP</v-btn>
      </v-btn-toggle>

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

      <v-btn
        @click="resetZoom"
        icon="mdi-magnify-close"
        size="small"
        variant="outlined"
        class="me-2"
        title="Reset zoom"
      ></v-btn>

      <v-btn
        @click="toggleFullscreen"
        icon="mdi-fullscreen"
        size="small"
        variant="outlined"
        title="Fullscreen"
      ></v-btn>

      <!-- <v-btn
        @click="showGrid = !showGrid"
        :icon="showGrid ? 'mdi-grid-off' : 'mdi-grid'"
        size="small"
        variant="outlined"
        :color="showGrid ? 'success' : 'default'"
        title="Toggle Grid"
        class="ms-2"
      ></v-btn>

      <v-btn
        @click="showComponentBoxes = !showComponentBoxes"
        :icon="showComponentBoxes ? 'mdi-square-outline' : 'mdi-square'"
        size="small"
        variant="outlined"
        :color="showComponentBoxes ? 'success' : 'default'"
        title="Toggle Component Boxes"
        class="ms-2"
      ></v-btn> -->
    </v-card-title>
    <v-card-text class="mt-3">
      <v-row>
        <v-col cols="12">
          <!-- Hiển thị SVG với overlay Pick & Place -->
          <div
            v-if="svgWithPnP && overlayMode !== 'pnp'"
            class="gerber-svg-container"
            ref="svgContainer"
            @wheel="handleZoom"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
          >
            <!-- Coordinate grid overlay -->
            <div v-if="showGrid" class="coordinate-grid-overlay">
              <svg width="100%" height="100%" class="grid-svg">
                <defs>
                  <pattern
                    id="grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="#e0e0e0"
                      stroke-width="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div v-html="currentSvgContent" :style="svgContainerStyle"></div>

            <!-- Zoom indicator -->
            <div class="zoom-indicator">{{ Math.round(zoomLevel * 100) }}%</div>
          </div>

          <!-- Hiển thị chỉ tọa độ PnP nếu chọn mode PnP -->
          <div
            v-if="
              overlayMode === 'pnp' && filteredPnP && filteredPnP.length > 0
            "
            class="pnp-only-view"
          >
            <div class="text-center pa-8">
              <v-icon size="64" color="primary">mdi-map-marker</v-icon>
              <p class="text-h6 mt-4">Chế độ xem tọa độ Pick & Place</p>
              <p class="text-body-2 text-grey">
                Sử dụng bảng bên dưới để xem chi tiết
              </p>
            </div>
          </div>

          <!-- Thông tin tọa độ -->
          <div v-if="filteredPnP && filteredPnP.length > 0" class="mt-4">
            <v-card-title class="d-flex align-center pe-2">
              Tọa độ Pick & Place
              <p class="text-subtitle-1 font-weight-thin text-subtitle-1 ms-2">
                ({{ filteredPnP.length }} điểm)
              </p>
              <Button-Download @click="downloadExcelPnP()"/>
              <v-spacer></v-spacer>
              <InputSearch v-model="searchPnP" />
            </v-card-title>

            <!-- Transformation info -->
            <div class="transformation-info">
              <div class="d-flex flex-wrap gap-4">
                <span
                  ><span class="label">Scale:</span>
                  <span class="value">{{
                    coordinateScale.toFixed(3)
                  }}</span></span
                >
                <span
                  ><span class="label">Offset X:</span>
                  <span class="value"
                    >{{ coordinateOffsetX.toFixed(2) }}mm</span
                  ></span
                >
                <span
                  ><span class="label">Offset Y:</span>
                  <span class="value"
                    >{{ coordinateOffsetY.toFixed(2) }}mm</span
                  ></span
                >
                <span
                  ><span class="label">Global Rotation:</span>
                  <span class="value"
                    >{{ coordinateRotation.toFixed(1) }}°</span
                  ></span
                >
                <span
                  ><span class="label">SVG Rotation:</span>
                  <span class="value">{{ svgRotation.toFixed(1) }}°</span></span
                >
              </div>
              <div class="d-flex flex-wrap gap-4 mt-2">
                <span
                  ><span class="label">Flip X:</span>
                  <span
                    class="value"
                    :class="flipX ? 'text-error' : 'text-success'"
                    >{{ flipX ? "ON" : "OFF" }}</span
                  ></span
                >
                <span
                  ><span class="label">Flip Y:</span>
                  <span
                    class="value"
                    :class="flipY ? 'text-error' : 'text-success'"
                    >{{ flipY ? "ON" : "OFF" }}</span
                  ></span
                >
                <span
                  ><span class="label">Swap X↔Y:</span>
                  <span
                    class="value"
                    :class="swapXY ? 'text-warning' : 'text-success'"
                    >{{ swapXY ? "ON" : "OFF" }}</span
                  ></span
                >
              </div>
              <div class="d-flex flex-wrap gap-4 mt-2">
                <span
                  ><span class="label">Label Angle:</span>
                  <span class="value"
                    >{{ designatorLabelAngle.toFixed(1) }}°</span
                  ></span
                >
                <span
                  ><span class="label">Body Angle:</span>
                  <span class="value"
                    >{{ componentBodyAngle.toFixed(1) }}°</span
                  ></span
                >
              </div>
              <div class="mt-2 text-caption text-grey">
                <strong>Coordinate Note:</strong> Use Flip X/Y to correct
                upside-down or mirrored coordinates. Use Swap X↔Y if X and Y
                axes are swapped between PnP and Gerber.
              </div>
            </div>

            <v-data-table
              class="mt-2 elevation-1"
              density="compact"
              :search="searchPnP"
              :headers="HeadersPnP"
              :items="filteredPnP"
              item-key="designator"
              :items-per-page="itemsPerPagePnP"
              hide-default-footer
              v-model:page="pagePnP"
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
              height="calc(100vh - 400px)"
            >
              <template #item.designator="{ item }">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ item.designator }}
                </v-chip>
              </template>

              <template #item.rotation="{ item }">
                <v-chip size="small" color="info" variant="tonal">
                  {{ (item.rotation || item.rot || 0).toFixed(1) }}°
                </v-chip>
              </template>
<!-- 
              <template #item.tx="{ item }">
                {{ getTransformedCoordinates(item.x, item.y).x.toFixed(2) }}
              </template>

              <template #item.ty="{ item }">
                {{ getTransformedCoordinates(item.x, item.y).y.toFixed(2) }}
              </template>

              <template #item.finalRotation="{ item }">
                <v-chip size="small" color="success" variant="tonal">
                  {{
                    (
                      (item.rotation || item.rot || 0) + coordinateRotation
                    ).toFixed(1)
                  }}°
                </v-chip>
              </template> -->
              <template v-slot:item.stt="{ index }">
                {{ (pagePnP - 1) * itemsPerPagePnP + index + 1 }}
              </template>

              <template #item.layer="{ item }">
                <v-chip
                  size="small"
                  :color="item.layer === 'Top' ? 'success' : 'error'"
                  variant="tonal"
                >
                  {{ item.layer || "Top" }}
                </v-chip>
              </template>
              <template v-slot:bottom>
                <div class="text-center pt-2">
                  <v-pagination
                    v-model="pagePnP"
                    :length="Math.ceil(filteredPnP.length / itemsPerPagePnP)"
                  ></v-pagination>
                </div>
              </template>
            </v-data-table>
          </div>

          <!-- Thông báo khi không có dữ liệu -->
          <div v-if="!svgWithPnP && !currentGerberSvg" class="text-center pa-8">
            <v-icon size="64" color="grey">mdi-image-off</v-icon>
            <p class="text-h6 text-grey mt-4">Chưa có dữ liệu Gerber</p>
          </div>

          <div
            v-if="!filteredPnP || filteredPnP.length === 0"
            class="text-center pa-8"
          >
            <v-icon size="64" color="grey">mdi-map-marker-off</v-icon>
            <p class="text-h6 text-grey mt-4">Chưa có dữ liệu Pick & Place</p>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <v-dialog v-model="DialogAddBom" width="600" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu BOM
      </v-card-title>
      <v-card-text>
        <InputFiles
          label="Nhập file Bom (.xlsx)"
          class="mt-2"
          v-model="FileBom"
          name="bom"
        />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAddBom = false" />
        <ButtonSave @save="uploadBOM()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogAddPnP" width="700" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu Pick & Place
      </v-card-title>
      <v-card-text>
        <InputFiles
          label="Nhập file Pick & Place (.xlsx)"
          class="mt-2"
          v-model="FilePnP"
          name="pnp"
        />
        <div class="">
          <p class="text-bold text-warning">Lưu ý: </p>
          <p class="font-weight-light ms-2">Giá trị PosX, PosY cần chuyển về giá trị mm.</p>
          <p class="font-weight-light ms-2">Giá trị Layer thay thế là Top và Bottom.</p>
        </div>
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAddPnP = false" />
        <ButtonSave @save="uploadPNP" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogAddGerber" width="700" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Thêm dữ liệu Gerber
      </v-card-title>
      <v-card-text>
        <InputFiles
          label="Nhập file Gerber (.gtp, .gbp)"
          class="mt-2"
          v-model="FileGerber"
          accept="*"
          name="gerber"
        />
        <div class="d-flex">
          <p class="text-bold text-warning">Lưu ý:</p>
          <p class="font-weight-light ms-2">Cần chuyển đổi đơn vị file Gerber .gtp, .gbp là inch</p>
        </div>
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAddGerber = false" />
        <ButtonSave @save="uploadGerber" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogAddSize" width="600" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Cập nhật kích thước linh kiện
        <v-spacer></v-spacer>
        <v-btn>close</v-btn>
      </v-card-title>
      <v-card-text>
        <InputField
          label="Mã linh kiện | Manufacture Part Number"
          v-model="MPN_Add_Size"
          disabled
        />
        <InputField label="Loại | Package" v-model="Package_Add_Size" />
        <InputField label="Chiều dài | Length (mm)" v-model="Length_Add_Size" />
        <InputField label="Chiều rộng | Width (mm)" v-model="Width_Add_Size" />
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogAddSize = false" />
        <ButtonSave @save="SaveAddSize()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogRemove" width="400">
    <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
      <v-card-text> Bạn có chắc chắn muốn xoá Bom này ? </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogEdit" width="500">
    <v-card max-width="500">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-update" color="primary" class="me-2"></v-icon>
        Chỉnh sửa Pick & Place
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="4">
            <InputField label="Toạ độ X (mm)" v-model="PnP_X_Edit" />
          </v-col>
          <v-col cols="4">
            <InputField label="Toạ độ Y (mm)" v-model="PnP_Y_Edit" />
          </v-col>
          <v-col cols="4">
            <InputSelect
              label="Góc°"
              v-model="PnP_Angle_Edit"
              hint="Góc toạ độ các linh kiện"
              :items="[0, 90, 180, 270]"
              item-text="text"
              item-value="value"
            />
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
      </v-card-text>
      <template v-slot:actions>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEditPnP()" />
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="DialogInfo" width="800" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon
          icon="mdi-information-variant-circle"
          color="primary"
          class="me-2"
        ></v-icon>
        Thông số kỹ thuật

        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="DialogInfo = false"
        ></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
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
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="DialogCoordinateSettings" width="700" scrollable>
    <v-card class="overflow-y-auto">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-tune" color="primary" class="me-2"></v-icon>
        Cài đặt tọa độ
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="DialogCoordinateSettings = false"
        ></v-btn>
      </v-card-title>
      <v-card-text class="pa-4">
        <!-- Preset transformations -->
        <!-- <p class="text-caption text-grey mb-2">Preset transformations:</p>
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            @click="applyPreset('mm_to_inch')"
            size="small"
            variant="outlined"
            color="primary"
          >
            mm → inch (/0.0254)
          </v-btn>
          <v-btn
            @click="applyPreset('inch_to_mm')"
            size="small"
            variant="outlined"
            color="primary"
          >
            inch → mm (×25.4)
          </v-btn>
          <v-btn
            @click="applyPreset('mil_to_mm')"
            size="small"
            variant="outlined"
            color="primary"
          >
            mil → mm (×0.0254)
          </v-btn>
          <v-btn
            @click="applyPreset('mm_to_um')"
            size="small"
            variant="outlined"
            color="primary"
          >
            mm → µm (×1000)
          </v-btn>
        </div> -->

        <!-- <v-divider class="my-3"></v-divider> -->

        <!-- Board rotation and flip controls -->
        <p class="text-caption text-grey mb-2">Xoay & Lật Pick&Place:</p>

        <!-- Nút lật mặt -->
        <div class="d-flex flex-wrap ga-2 mt-2">
          <v-btn
            @click="flipX = !flipX"
            :color="flipX ? 'error' : 'default'"
            prepend-icon="mdi-flip-horizontal"
            size="small"
            variant="outlined"
          >
            {{ flipX ? "✓" : "✗" }} Lật X
          </v-btn>
          <v-btn
            @click="flipY = !flipY"
            :color="flipY ? 'error' : 'default'"
            prepend-icon="mdi-flip-vertical"
            size="small"
            variant="outlined"
          >
            {{ flipY ? "✓" : "✗" }} Lật Y
          </v-btn>
          <v-btn
            @click="swapXY = !swapXY"
            :color="swapXY ? 'warning' : 'default'"
            prepend-icon="mdi-swap-horizontal"
            size="small"
            variant="outlined"
          >
            {{ swapXY ? "✓" : "✗" }} Đổi X↔Y
          </v-btn>
        </div>

        <!-- Custom angle rotation -->
        <!-- Chọn tâm xoay -->
        <div class="d-flex flex-wrap ga-2 mt-3">
          <InputField
            v-model.number="cx"
            label="cx (tâm X)"
            type="number"
            density="comfortable"
            variant="outlined"
          />
          <InputField
            v-model.number="cy"
            label="cy (tâm Y)"
            type="number"
            density="comfortable"
            variant="outlined"
          />
        </div>

        <!-- Nút xoay nhanh -->
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            @click="quickRotate(90)"
            color="primary"
            prepend-icon="mdi-rotate-orbit"
            size="small"
          >
            90°
          </v-btn>
          <v-btn @click="quickRotate(180)" variant="tonal" size="small">
            180°
          </v-btn>
          <v-btn @click="quickRotate(270)" variant="tonal" size="small">
            270°
          </v-btn>
          <v-btn @click="quickRotate(-90)" variant="tonal" size="small">
            -90° (CW)
          </v-btn>
        </div>
        <div class="d-flex flex-wrap ga-2 mt-2">
          <InputField
            v-model.number="rotationAngle"
            label="Góc xoay tùy chỉnh (độ)"
            type="number"
            density="comfortable"
            variant="outlined"
            class="flex-grow-1"
          />
          <v-btn
            @click="rotatePnPAroundCenter"
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-rotate-3d-variant"
            class="mt-2"
          >
            Xoay
          </v-btn>
        </div>

        <!-- Điều chỉnh tọa độ thủ công -->
        <v-divider class="my-3"></v-divider>
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
            </v-col>
          </v-row>
        </div>

        <!-- Nút điều chỉnh nhanh
        <div class="d-flex flex-wrap ga-2 mt-2">
          <v-btn
            @click="quickAdjustX(1)"
            color="primary"
            prepend-icon="mdi-arrow-right"
            size="small"
            variant="outlined"
          >
            +1mm X
          </v-btn>
          <v-btn
            @click="quickAdjustX(-1)"
            color="primary"
            prepend-icon="mdi-arrow-left"
            size="small"
            variant="outlined"
          >
            -1mm X
          </v-btn>
          <v-btn
            @click="quickAdjustY(1)"
            color="primary"
            prepend-icon="mdi-arrow-down"
            size="small"
            variant="outlined"
          >
            +1mm Y
          </v-btn>
          <v-btn
            @click="quickAdjustY(-1)"
            color="primary"
            prepend-icon="mdi-arrow-up"
            size="small"
            variant="outlined"
          >
            -1mm Y
          </v-btn>
        </div>

        <div class="d-flex flex-wrap ga-2 mt-2">
          <v-btn
            @click="quickAdjustX(0.1)"
            color="secondary"
            prepend-icon="mdi-arrow-right"
            size="small"
            variant="outlined"
          >
            +0.1mm X
          </v-btn>
          <v-btn
            @click="quickAdjustX(-0.1)"
            color="secondary"
            prepend-icon="mdi-arrow-left"
            size="small"
            variant="outlined"
          >
            -0.1mm X
          </v-btn>
          <v-btn
            @click="quickAdjustY(0.1)"
            color="secondary"
            prepend-icon="mdi-arrow-down"
            size="small"
            variant="outlined"
          >
            +0.1mm Y
          </v-btn>
          <v-btn
            @click="quickAdjustY(-0.1)"
            color="secondary"
            prepend-icon="mdi-arrow-up"
            size="small"
            variant="outlined"
          >
            -0.1mm Y
          </v-btn>
        </div> -->

        <!-- Áp dụng điều chỉnh thủ công -->
        <div class="d-flex flex-wrap ga-2 mt-2">
          <v-btn
            @click="applyManualAdjustmentX"
            color="success"
            variant="tonal"
            size="small"
            prepend-icon="mdi-cursor-pointer"
            :disabled="manualOffsetX === 0"
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
          >
            Áp dụng cả X&Y
          </v-btn>
          <v-btn
            @click="resetManualAdjustment"
            color="warning"
            variant="tonal"
            size="small"
            prepend-icon="mdi-refresh"
          >
            Reset điều chỉnh
          </v-btn>
        </div>

        <v-divider class="my-3"></v-divider>
        <v-row>
          <!-- Điều khiển góc designator label -->
          <v-col cols="6">
            <p class="text-caption text-grey mb-2">
              Điều khiển góc designator label:
            </p>

            <div class="d-flex flex-wrap ga-2">
              <InputField
                v-model.number="designatorLabelAngle"
                label="Góc designator label (°)"
                type="number"
                density="comfortable"
                variant="outlined"
                step="1"
                min="-360"
                max="360"
              />
            </div>

            <!-- Nút xoay nhanh designator label -->
            <div class="d-flex flex-wrap ga-2 mt-2">
              <v-btn
                @click="rotateDesignatorLabel(90)"
                color="info"
                prepend-icon="mdi-rotate-right"
                size="small"
                variant="outlined"
              >
                +90°
              </v-btn>
              <v-btn
                @click="rotateDesignatorLabel(-90)"
                color="info"
                prepend-icon="mdi-rotate-left"
                size="small"
                variant="outlined"
              >
                -90°
              </v-btn>
              <v-btn
                @click="rotateDesignatorLabel(180)"
                color="info"
                prepend-icon="mdi-rotate-3d-variant"
                size="small"
                variant="outlined"
              >
                +180°
              </v-btn>
              <v-btn
                @click="resetDesignatorLabelAngle"
                color="warning"
                prepend-icon="mdi-refresh"
                size="small"
                variant="tonal"
                :disabled="designatorLabelAngle === 0"
              >
                Reset góc label
              </v-btn>
            </div>
          </v-col>
          <v-col cols="6">
            <!-- Điều khiển góc xoay component body rectangle -->
            <p class="text-caption text-grey mb-2">
              Điều khiển góc xoay component body rectangle:
            </p>

            <div class="d-flex flex-wrap ga-2">
              <InputField
                v-model.number="componentBodyAngle"
                label="Góc xoay component body (°)"
                type="number"
                density="comfortable"
                variant="outlined"
                step="1"
                min="-360"
                max="360"
              />
            </div>

            <!-- Nút xoay nhanh component body -->
            <div class="d-flex flex-wrap ga-2 mt-2">
              <v-btn
                @click="rotateComponentBody(90)"
                color="success"
                prepend-icon="mdi-rotate-right"
                size="small"
                variant="outlined"
              >
                +90°
              </v-btn>
              <v-btn
                @click="rotateComponentBody(-90)"
                color="success"
                prepend-icon="mdi-rotate-left"
                size="small"
                variant="outlined"
              >
                -90°
              </v-btn>
              <v-btn
                @click="rotateComponentBody(180)"
                color="success"
                prepend-icon="mdi-rotate-3d-variant"
                size="small"
                variant="outlined"
              >
                +180°
              </v-btn>
              <v-btn
                @click="resetComponentBodyAngle"
                color="warning"
                prepend-icon="mdi-refresh"
                size="small"
                variant="tonal"
                :disabled="componentBodyAngle === 0"
              >
                Reset góc body
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <!-- Điều khiển xoay SVG -->
        <v-divider class="my-3"></v-divider>
        <p class="text-caption text-grey mb-2">Điều khiển xoay SVG:</p>

        <div class="d-flex flex-wrap ga-2">
          <InputField
            v-model.number="svgRotation"
            label="Góc xoay SVG (°)"
            type="number"
            density="comfortable"
            variant="outlined"
            step="1"
            min="-360"
            max="360"
          />
        </div>
        <div class="d-flex flex-wrap ga-2 mt-2">
          <v-btn
            @click="rotateSvg(90)"
            color="info"
            prepend-icon="mdi-rotate-right"
            size="small"
            variant="outlined"
          >
            +90°
          </v-btn>
          <v-btn
            @click="rotateSvg(-90)"
            color="info"
            prepend-icon="mdi-rotate-left"
            size="small"
            variant="outlined"
          >
            -90°
          </v-btn>
          <v-btn
            @click="rotateSvg(180)"
            color="info"
            prepend-icon="mdi-rotate-3d-variant"
            size="small"
            variant="outlined"
          >
            +180°
          </v-btn>
          <!-- <v-btn
            @click="autoRotateSvgToFitPnP"
            color="success"
            prepend-icon="mdi-auto-fix"
            size="small"
            variant="tonal"
            :disabled="!detailPnP || detailPnP.length === 0"
          >
            Tự động xoay
          </v-btn> -->
          <v-btn
            @click="resetSvgRotation"
            color="warning"
            prepend-icon="mdi-refresh"
            size="small"
            variant="tonal"
            :disabled="svgRotation === 0"
          >
            Reset xoay
          </v-btn>
          <!-- <v-btn
            @click="testSvgRotation"
            color="info"
            prepend-icon="mdi-bug"
            size="small"
            variant="outlined"
          >
            Test xoay
          </v-btn> -->
        </div>

        <!-- Áp dụng tất cả biến đổi -->
        <v-divider class="my-3"></v-divider>

        <v-divider class="my-3"></v-divider>
        <div class="d-flex gap-2">
          <v-btn
            @click="resetCoordinates"
            color="secondary"
            variant="tonal"
            size="small"
          >
            Reset
          </v-btn>
          <v-spacer></v-spacer>
          <ButtonSave @save="SaveSettingSVG()" />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarCaution v-model="DialogCaution" :message="MessageCautionDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { ref, watch, computed, onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import { useCombineBom } from "@/composables/CheckBOM/useCombineBom";
import { usePnPFile } from "@/composables/CheckBOM/usePnPFile";
import { useGerberFile } from "@/composables/CheckBOM/useGerberFile";
import { useSettingSVG } from "@/composables/CheckBOM/useSettingSVG";

import ButtonBack from "@/components/Button-Back.vue";
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputSelect from "@/components/Input-Select.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarCaution from "@/components/Snackbar-Caution.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonRemove from "@/components/Button-Remove.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonSearch from "@/components/Button-Search.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import Loading from "@/components/Loading.vue";

import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
//

const Url = import.meta.env.VITE_API_URL;
const GetID = ref("");
const route = useRoute();
const id = route.params.id;
const { combineBom, combineBomErrror } = useCombineBom(id);
const { detailPnP, detailPnPError } = usePnPFile(id);
const { detailGerber, detailGerberError } = useGerberFile(id);
const { detailSetting, detailSettingError } = useSettingSVG(id);
// Dialog status
const DialogEdit = ref(false);
const DialogAddBom = ref(false);
const DialogAddPnP = ref(false);
const DialogAddGerber = ref(false);
const DialogAddSize = ref(false);
const DialogRemove = ref(false);
const DialogFailed = ref(false);
const DialogCaution = ref(false); // Warning notification
const DialogLoading = ref(false); // Loading state
const DialogSuccess = ref(false);
const DialogInfo = ref(false);
const DialogCoordinateSettings = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");
const MessageCautionDialog = ref("");

// Data page
const FileBom = ref(null);
const FilePnP = ref(null);
const FileGerber = ref(null);

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

// Overlay controls
const overlayMode = ref("both"); // 'both', 'gerber', 'pnp'
const svgContainer = ref(null);
const zoomLevel = ref(1);

// Layer selection
const selectedLayer = ref("Top");

// Coordinate transformation controls
const coordinateScale = ref(1);
const coordinateOffsetX = ref(0);
const coordinateOffsetY = ref(0);
const coordinateRotation = ref(0);
const showGrid = ref(false);
const showComponentBoxes = ref(true);

// Coordinate flip controls
const flipX = ref(false);
const flipY = ref(false);
const swapXY = ref(false);

// Board rotation controls
const cx = ref(0);
const cy = ref(0);
const rotationAngle = ref(0);
const svgRotation = ref(0);

// Designator label and component body rotation controls
const designatorLabelAngle = ref(0);
const componentBodyAngle = ref(0);

// Manual coordinate adjustment
const manualOffsetX = ref(0);
const manualOffsetY = ref(0);
const totalAddedX = ref(0);
const totalAddedY = ref(0);
const totalAdjustedCountX = ref(0);
const totalAdjustedCountY = ref(0);

// Data search item in digikey
const clientId = import.meta.env.VITE_DIGIKEY_CLIENT_ID;
const clientSecret = import.meta.env.VITE_DIGIKEY_CLIENT_SECRET;
const GetDigikey = ref("");
const accessToken = ref(null);
const tokenType = ref(null);
const expires_in = ref(null);
const ResultSearch = ref(null);

// Table status
const Headers = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator", width: "150px" },
  { title: "Manufacture Part Number", key: "mpn", width: "150px" },
  { title: "X (mm)", key: "x" },
  { title: "Y (mm)", key: "y" },
  { title: "Rotation", key: "rotation" },
  { title: "Layer", key: "layer" },
  { title: "Định dạng", key: "type" },
  { title: "Package", key: "description_bom" },
  { title: "Width", key: "width" },
  { title: "Length", key: "length" },
  { title: "Thao tác", key: "id", sortable: false },
];

const HeadersPnP = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator" },
  { title: "Transformed X(mm)", key: "x" },
  { title: "Transformed Y (mm)", key: "y" },
  { title: "Final Rotation (°)", key: "rotation" },
  { title: "Layer", key: "layer" },
  { title: "MPN", key: "mpn" },
];
const searchBom = ref("");
const itemsPerPageBom = ref(20);
const pageBom = ref(1);

const searchPnP = ref("")
const itemsPerPagePnP = ref(20);
const pagePnP = ref(1);
// Color mapping for match quality categories

// ============ onMounted =============

onMounted(() => {
  if (coordinateScale.value) {
    return (coordinateScale.value /= 0.0254);
  }

  if (detailSetting.value) {
    return rotatePnPAroundCenter();
  }
});

// Function

const uploadBOM = async () => {
  try {
    const formData = new FormData();
    formData.append("FileBom", FileBom.value);
    await axios.post(`${Url}/upload-bom/${id}`, formData);
    DialogSuccess.value = true;
    MessageDialog.value = "Upload Bom thành công";
    DialogAddBom.value = false;
    FileBom.value = null;
    console.log("BOM upload thành công");
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload Bom thất bại";
    console.error("Lỗi upload BOM:", error);
  }
};

const uploadPNP = async () => {
  try {
    const formData = new FormData();
    formData.append("FilePnP", FilePnP.value);
    await axios.post(`${Url}/upload-pickplace/${id}`, formData);
    DialogSuccess.value = true;
    MessageDialog.value = "Upload Pick&Place thành công";
    DialogAddPnP.value = false;
    FilePnP.value = null;
    console.log("PickPlace upload thành công");
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload Pick&Place thất bại";
    console.error("Lỗi upload PickPlace:", error);
  }
};

const uploadGerber = async () => {
  try {
    const formData = new FormData();
    // Nếu Vuetify trả về mảng thì lấy phần tử đầu tiên
    formData.append("FileGerber", FileGerber.value);

    await axios.post(`${Url}/upload-gerber/${id}`, formData);

    DialogSuccess.value = true;
    MessageDialog.value = "Upload Gerber thành công";
    DialogAddGerber.value = false;
    FileGerber.value = null;
    console.log("Gerber upload thành công");
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Upload Gerber thất bại";
    console.error("Lỗi upload Gerber:", error.response?.data || error);
  }
};

// ====== Edit Pick Place ===========
const GetItemEdit = (item) => {
  DialogEdit.value = true;
  GetIDPnP.value = item.id;
  PnP_X_Edit.value = item.x;
  PnP_Y_Edit.value = item.y;
  PnP_Angle_Edit.value = item.rotation;
  PnP_Type_Edit.value = item.type;
  PnP_Layer_Edit.value = item.layer;
};

const GetSettingSVG = () => {
  DialogCoordinateSettings.value = true;
  const found = detailSetting.value.find((item) => (item.id = id));
  console.log(selectedLayer.value);
  if (selectedLayer.value == "Top") {
    manualOffsetX.value = found.manualOffsetX_top;

    manualOffsetY.value = found.manualOffsetY_top;
    cx.value = found.cx_top;
    cy.value = found.cy_top;
    rotationAngle.value = found.rotation_top;
    svgRotation.value = found.rotationSVG_top;
    designatorLabelAngle.value = found.labelAngle_top || 0;
    componentBodyAngle.value = found.componentBodyAngle_top || 0;
    if (found.flipX_top == 1 || found.flipX_top == true) {
      flipX.value = true;
    } else {
      flipX.value = false;
    }
    if (found.flipY_top == 1 || found.flipY_top == true) {
      flipY.value = true;
    } else {
      flipY.value = false;
    }
    if (found.swapXY_top == 1 || found.swapXY_top == true) {
      swapXY.value = true;
    }
  } else {
    manualOffsetX.value = found.manualOffsetX_bottom;
    manualOffsetY.value = found.manualOffsetY_bottom;
    cx.value = found.cx_bottom;
    cy.value = found.cy_bottom;
    rotationAngle.value = found.rotation_bottom;
    svgRotation.value = found.rotationSVG_bottom;
    designatorLabelAngle.value = found.labelAngle_bottom || 0;
    componentBodyAngle.value = found.componentBodyAngle_bottom || 0;
    if (found.flipX_bottom == 1 || found.flipX_bottom == true) {
      flipX.value = true;
    } else {
      flipX.value = false;
    }
    if (found.flipY_bottom == 1 || found.flipY_bottom == true) {
      flipY.value = true;
    } else {
      flipY.value = false;
    }
    if (found.swapXY_bottom == 1 || found.swapXY_bottom == true) {
      swapXY.value = true;
    } else {
      swapXY.value = false;
    }
  }
};

// Get information Update size
const GetAddSize = (item) => {
  DialogAddSize.value = true;
  MPN_Add_Size.value = item.mpn;
  Package_Add_Size.value = item.package;
  Length_Add_Size.value = item.length;
  Width_Add_Size.value = item.width;
  console.log(GetIDSize.value);
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
        formData
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
    console.log(GetIDSize.value);
    try {
      const response = await axios.put(
        `${Url}/Component-overrides/Edit-item/${GetIDSize.value}`,
        formData
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
        formData
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
      formData
    );
    console.log(response.data.message);

    DialogLoading.value = false;
    DialogEdit.value = false;
    DialogSuccess.value = true;
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
  } catch (error) {
    console.log(error);
    DialogLoading.value = false;
    DialogEdit.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
  }
};

const SaveSettingSVG = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    flipX: flipX.value,
    flipY: flipY.value,
    swapXY: swapXY.value,
    cx: cx.value,
    cy: cy.value,
    rotation: rotationAngle.value,
    rotationSVG: svgRotation.value,
    designatorLabelAngle: designatorLabelAngle.value,
    componentBodyAngle: componentBodyAngle.value,
    manualOffsetX: totalAddedX.value,
    manualOffsetY: totalAddedY.value,
    labelAngle: designatorLabelAngle.value,
    componentBodyAngle: componentBodyAngle.value,
  });
  if (selectedLayer.value == "Top") {
    try {
      const response = await axios.put(
        `${Url}/SettingSVG/Edit-item-top/${id}`,
        formData
      );
      console.log(response.data.message);

      DialogLoading.value = false;
      DialogCoordinateSettings.value = false;
      DialogSuccess.value = true;
      MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    } catch (error) {
      console.log(error);
      DialogLoading.value = false;
      DialogCoordinateSettings.value = false;
      DialogFailed.value = true;
      MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    }
  } else {
    try {
      const response = await axios.put(
        `${Url}/SettingSVG/Edit-item-bottom/${id}`,
        formData
      );
      console.log(response.data.message);

      DialogLoading.value = false;
      DialogCoordinateSettings.value = false;
      DialogSuccess.value = true;
      MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    } catch (error) {
      console.log(error);
      DialogLoading.value = false;
      DialogCoordinateSettings.value = false;
      DialogFailed.value = true;
      MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    }
  }
};

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
    expires_in.value = response.data.expires_in;

    console.log("Đã lấy access token thành công:", accessToken.value);

    if (accessToken.value && tokenType.value && GetDigikey.value) {
      return await searchProduct();
    }

    return true;
  } catch (error) {
    console.error(
      "Lỗi khi lấy access token:",
      error.response ? error.response.data : error.message
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
      (DialogCaution.value = true),
      (DialogLoading.value = false)
    );
    DialogFailed.value = true;
    DialogLoading.value = false;
    MessageErrorDialog.value = "Lỗi khi tìm kiếm sản phẩm";
    return null;
  }
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
    Error();
  }
};

// Project demo (id=1)
const loadData = async () => {
  await loadGerber(1);
  await loadPnP(1);
};

// Combine Gerber + Pick&Place overlay
const svgWithPnP = computed(() => {
  if (!currentGerberSvg.value || !filteredPnP.value) return "";

  let svg = currentGerberSvg.value;
  if (!svg || typeof svg !== "string") {
    console.warn("Không tìm thấy SVG hợp lệ trong detailGerber");
    return "";
  }

  if (!currentGerberUnit.value || !filteredPnP.value) return "";

  let unit = currentGerberUnit.value;
  if (!unit || typeof svg !== "string") {
    console.warn("Không tìm thấy đơn vị đo hợp lệ trong detailGerber");
    return "";
  }
  const pnpMarkers = filteredPnP.value
    .filter((pnp) => pnp.x !== null && pnp.y !== null && pnp.designator)
    .map((pnp) => {
      let transformedX =
        pnp.x * coordinateScale.value + coordinateOffsetX.value;
      let transformedY =
        pnp.y * coordinateScale.value + coordinateOffsetY.value;

      const { cxT, cyT } = getTransformedCenter();
      if (flipX.value) transformedX = 2 * cxT - transformedX;
      if (flipY.value) transformedY = 2 * cyT - transformedY;
      if (swapXY.value)
        [transformedX, transformedY] = [transformedY, transformedX];

      const componentRotation =
        pnp.rotation || pnp.rot || coordinateRotation.value;

      let rectWidth = (pnp.width || 0) * coordinateScale.value;
      let rectLength = (pnp.length || 0) * coordinateScale.value;
      if (swapXY.value) [rectWidth, rectLength] = [rectLength, rectWidth];

      // scale theo đơn vị
      let scale_mm_square = 0.02;
      let scale_mm_crosshair = 50;
      let scale_inch_square = 1; // ví dụ
      let scale_inch_crosshair = 1; // ví dụ

      let squareScale, crosshairScale;
      if (unit === "mm") {
        squareScale = scale_mm_square;
        crosshairScale = scale_mm_crosshair;
        coordinateScale.value = 1000;
      } else {
        squareScale = scale_inch_square;
        crosshairScale = scale_inch_crosshair;
      }

      let componentMarkup = "";
      if (rectWidth > 0 && rectLength > 0 && showComponentBoxes.value) {
        componentMarkup = `
          <!-- Component body rectangle with rotation -->
          <g transform="rotate(${
            componentBodyAngle.value
          }) scale(${squareScale})">
            <rect
              class="pnp-component-body"
              x="${-(rectWidth / 2)}"
              y="${-(rectLength / 2)}"
              width="${rectWidth}"
              height="${rectLength}"
              fill="rgba(0, 150, 136, 0.1)"
              stroke="#009688"
              stroke-width="1.5"
              opacity="0.8"
            />
            <!-- Component outline for better visibility -->
            <rect
              class="pnp-component-outline"
              x="${-(rectWidth / 2)}"
              y="${-(rectLength / 2)}"
              width="${rectWidth}"
              height="${rectLength}"
              fill="none"
              stroke="#1976d2"
              stroke-width="0.8"
              stroke-dasharray="2,2"
              opacity="0.6"
            />
          </g>
        `;
      }

      return `
        <g transform="translate(${transformedX}, ${transformedY}) rotate(${componentRotation}) scale(${crosshairScale})" class="pnp-marker" data-designator="${
        pnp.designator
      }">
          ${componentMarkup}
          <!-- Crosshair marker - làm to hơn để dễ nhìn -->
          <line x1="-25" y1="0" x2="25" y2="0" stroke="red" stroke-width="1.5" opacity="0.9"/>
          <line x1="0" y1="-25" x2="0" y2="25" stroke="red" stroke-width="1.5" opacity="0.9"/>
          <!-- Circle around the point - làm to hơn -->
          <circle cx="0" cy="0" r="2" fill="none" stroke="red" stroke-width="0.8" opacity="0.8"/>
          <!-- Designator label with rotation -->
          <text
            x="6"
            y="3"
            font-size="23"
            fill="blue"
            font-weight="bold"
            opacity="1"
            transform="rotate(${designatorLabelAngle.value})"
            transform-origin="6 3"
          >${pnp.designator}</text>
          <!-- Coordinate info on hover -->
          <title>${pnp.designator}: X=${transformedX.toFixed(
        2
      )}inch, Y=${transformedY.toFixed(
        2
      )}inch, Rotation=${componentRotation.toFixed(1)}° (Original: X=${
        pnp.x
      }mm, Y=${pnp.y}mm${
        rectWidth > 0 && rectLength > 0
          ? `, Size=${(pnp.width || 0).toFixed(2)}x${(pnp.length || 0).toFixed(
              2
            )}mm`
          : ""
      })</title>
    </g>
      `;
    })
    .join("");

  return svg.replace("</svg>", `${pnpMarkers}</svg>`);
});

// SVG rotation state

// Computed properties for better performance
const componentsWithSize = computed(() => {
  if (!filteredPnP.value) return 0;
  return filteredPnP.value.filter(
    (p) => p.width && p.length && p.width > 0 && p.length > 0
  ).length;
});

// Pan and zoom state
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const lastPanPoint = ref({ x: 0, y: 0 });

// Computed for current SVG content based on overlay mode
const currentSvgContent = computed(() => {
  if (overlayMode.value === "both") {
    return svgWithPnP.value;
  } else if (overlayMode.value === "gerber") {
    return currentGerberSvg.value || "";
  }
  return "";
});

// Computed for SVG container transform style
const svgContainerStyle = computed(() => {
  const transforms = [];

  // Add pan transform
  if (panX.value !== 0 || panY.value !== 0) {
    transforms.push(`translate(${panX.value}px, ${panY.value}px)`);
  }

  // Add zoom transform
  if (zoomLevel.value !== 1) {
    transforms.push(`scale(${zoomLevel.value})`);
  }

  // Add SVG rotation transform
  if (svgRotation.value !== 0) {
    transforms.push(`rotate(${svgRotation.value}deg)`);
  }

  return {
    transform: transforms.join(" "),
    transformOrigin: "center center",
    cursor: isPanning.value ? "grabbing" : "grab",
  };
});

// Helper function to calculate transformed coordinates
const getTransformedCoordinates = (x, y) => {
  let transformedX = x * coordinateScale.value + coordinateOffsetX.value;
  let transformedY = y * coordinateScale.value + coordinateOffsetY.value;

  // Apply flips around board center and swaps
  const { cxT, cyT } = getTransformedCenter();
  if (flipX.value) transformedX = 2 * cxT - transformedX;
  if (flipY.value) transformedY = 2 * cyT - transformedY;
  if (swapXY.value) [transformedX, transformedY] = [transformedY, transformedX];

  return { x: transformedX, y: transformedY };
};

// Pan and Zoom logic
const handleZoom = (event) => {
  event.preventDefault();
  const delta = event.deltaY;
  const zoomFactor = delta > 0 ? 0.9 : 1.1;
  const newScale = zoomLevel.value * zoomFactor;

  // Limit zoom range
  if (newScale >= 0.1 && newScale <= 5) {
    // Calculate zoom center (mouse position relative to container)
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calculate new pan to keep mouse position fixed
    const scaleDiff = newScale - zoomLevel.value;
    panX.value -= mouseX * scaleDiff * 0.1;
    panY.value -= mouseY * scaleDiff * 0.1;

    zoomLevel.value = newScale;
  }
};

const handleMouseDown = (event) => {
  if (event.button === 0) {
    // Left mouse button only
    isPanning.value = true;
    lastPanPoint.value = { x: event.clientX, y: event.clientY };
    event.preventDefault();
  }
};

const handleMouseMove = (event) => {
  if (isPanning.value) {
    const deltaX = event.clientX - lastPanPoint.value.x;
    const deltaY = event.clientY - lastPanPoint.value.y;

    panX.value += deltaX;
    panY.value += deltaY;

    lastPanPoint.value = { x: event.clientX, y: event.clientY };
    event.preventDefault();
  }
};

const handleMouseUp = () => {
  isPanning.value = false;
};

const resetPanAndZoom = () => {
  panX.value = 0;
  panY.value = 0;
  zoomLevel.value = 1;
};

const centerSvg = () => {
  if (svgContainer.value) {
    const container = svgContainer.value;
    const rect = container.getBoundingClientRect();

    // Center the SVG in the container
    panX.value = rect.width / 2;
    panY.value = rect.height / 2;
  }
};

const resetZoom = () => {
  resetPanAndZoom();
};

const toggleFullscreen = () => {
  const svgContainerElement = svgContainer.value;
  if (svgContainerElement) {
    if (!document.fullscreenElement) {
      svgContainerElement.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    } else {
      document.exitFullscreen();
    }
  }
};

// Watch for fullscreen change to reset zoom
watch(
  () => document.fullscreenElement,
  () => {
    if (!document.fullscreenElement) {
      resetZoom();
    }
  }
);

// Reset zoom when container size changes
watch(
  svgContainer,
  () => {
    if (svgContainer.value) {
      // Container size change handling - just reset zoom for now
      resetZoom();
    }
  },
  { immediate: true }
);

// Reset coordinate transformation
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

// Rotate point around center function
const rotatePoint = (x, y, cx, cy, deg) => {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const xt = x - cx;
  const yt = y - cy;
  const xpt = xt * cos - yt * sin;
  const ypt = xt * sin + yt * cos;
  return { xRot: xpt + cx, yRot: ypt + cy };
};

// Quick rotation function
const quickRotate = (angle) => {
  if (!detailPnP.value || detailPnP.value.length === 0) {
    MessageCautionDialog.value = "Không có dữ liệu Pick&Place để xoay";
    DialogCaution.value = true;
    return;
  }

  detailPnP.value = detailPnP.value.map((item) => {
    if (item.x === null || item.y === null) return item;

    const { xRot, yRot } = rotatePoint(
      item.x,
      item.y,
      cx.value,
      cy.value,
      angle
    );
    return { ...item, x: Number(xRot.toFixed(3)), y: Number(yRot.toFixed(3)) };
  });

  MessageDialog.value = `Đã xoay ${
    detailPnP.value.length
  } điểm Pick&Place quanh tâm (${cx.value.toFixed(2)}, ${cy.value.toFixed(
    2
  )}) với góc ${angle}°`;
  DialogSuccess.value = true;
};

// Rotate Pick&Place around board center (custom angle)
const rotatePnPAroundCenter = () => {
  if (!detailPnP.value || detailPnP.value.length === 0) {
    MessageCautionDialog.value = "Không có dữ liệu Pick&Place để xoay";
    DialogCaution.value = true;
    return;
  }

  if (rotationAngle.value === 0) {
    MessageCautionDialog.value = "Vui lòng nhập góc xoay khác 0";
    DialogCaution.value = true;
    return;
  }

  quickRotate(rotationAngle.value);
};

// Manual coordinate adjustment functions

const adjustCoordinates = (deltaX, deltaY) => {
  manualOffsetX.value += deltaX;
  manualOffsetY.value += deltaY;
};

// Quick adjustment functions (incremental)
const quickAdjustX = (deltaX) => {
  manualOffsetX.value += deltaX;
};

const quickAdjustY = (deltaY) => {
  manualOffsetY.value += deltaY;
};

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
  console.log(manualOffsetX.value);
  let adjustedCountX = 0;
  detailPnP.value = detailPnP.value.map((item) => {
    if (item.x === null) return item;

    adjustedCountX += 1;
    return {
      ...item,
      x: Number(item.x + manualOffsetX.value),
    };
  });

  totalAddedX.value += manualOffsetX.value;
  totalAdjustedCountX.value += adjustedCountX;

  MessageDialog.value = `Đã điều chỉnh X cho ${adjustedCountX} điểm Pick&Place: +${manualOffsetX.value.toFixed(
    3
  )}mm (Cộng dồn X: +${totalAddedX.value.toFixed(
    3
  )}mm, Tổng điểm đã cập nhật X: ${totalAdjustedCountX.value})`;
  DialogSuccess.value = true;

  // Reset manual offset X after applying
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
      y: Number(item.y + manualOffsetY.value),
    };
  });

  totalAddedY.value += manualOffsetY.value;
  totalAdjustedCountY.value += adjustedCountY;

  MessageDialog.value = `Đã điều chỉnh Y cho ${adjustedCountY} điểm Pick&Place: +${manualOffsetY.value.toFixed(
    3
  )}mm (Cộng dồn Y: +${totalAddedY.value.toFixed(
    3
  )}mm, Tổng điểm đã cập nhật Y: ${totalAdjustedCountY.value})`;
  DialogSuccess.value = true;

  // Reset manual offset Y after applying
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
      x: hasX ? Number((item.x + manualOffsetX.value).toFixed(3)) : item.x,
      y: hasY ? Number((item.y + manualOffsetY.value).toFixed(3)) : item.y,
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
    3
  )}mm (cộng dồn: +${totalAddedX.value.toFixed(3)}mm, điểm X: ${
    totalAdjustedCountX.value
  }), Y +${manualOffsetY.value.toFixed(
    3
  )}mm (cộng dồn: +${totalAddedY.value.toFixed(3)}mm, điểm Y: ${
    totalAdjustedCountY.value
  })`;
  DialogSuccess.value = true;

  // Reset manual offsets after applying
  manualOffsetX.value = 0;
  manualOffsetY.value = 0;
};

const resetManualAdjustment = () => {
  manualOffsetX.value = 0;
  manualOffsetY.value = 0;
  MessageDialog.value = "Đã reset điều chỉnh thủ công";
  DialogSuccess.value = true;
};

// Preset transformation functions
// const applyPreset = (presetType) => {
//   if (!detailPnP.value || detailPnP.value.length === 0) {
//     MessageCautionDialog.value = "Không có dữ liệu Pick&Place để biến đổi";
//     DialogCaution.value = true;
//     return;
//   }

//   let transformationApplied = false;
//   let transformationName = "";
//   let transformationDescription = "";

//   switch (presetType) {
//     case "mm_to_inch":
//       // Convert mm to inch (divide by 25.4)
//       coordinateScale.value = 1 / 0.0254;
//       transformationApplied = true;
//       transformationName = "mm → inch";
//       transformationDescription = "Chia cho 25.4";
//       break;

//     case "inch_to_mm":
//       // Convert inch to mm (multiply by 25.4)
//       coordinateScale.value = 25.4;
//       transformationApplied = true;
//       transformationName = "inch → mm";
//       transformationDescription = "Nhân với 25.4";
//       break;

//     case "mil_to_mm":
//       // Convert mil to mm (multiply by 0.0254)
//       coordinateScale.value = 0.0254;
//       transformationApplied = true;
//       transformationName = "mil → mm";
//       transformationDescription = "Nhân với 0.0254";
//       break;

//     case "mm_to_um":
//       // Convert mm to µm (multiply by 1000)
//       coordinateScale.value = 1000;
//       transformationApplied = true;
//       transformationName = "mm → µm";
//       transformationDescription = "Nhân với 1000";
//       break;

//     default:
//       MessageCautionDialog.value = "Loại biến đổi không hợp lệ";
//       DialogCaution.value = true;
//       return;
//   }

//   if (transformationApplied) {
//     MessageDialog.value = `Đã áp dụng biến đổi ${transformationName} (${transformationDescription}) cho ${detailPnP.value.length} điểm Pick&Place`;
//     DialogSuccess.value = true;
//   }
// };

// SVG rotation functions
const rotateSvg = (angle) => {
  svgRotation.value += angle;
  // Keep angle between -360 and 360 degrees
  if (svgRotation.value > 360) svgRotation.value -= 360;
  if (svgRotation.value < -360) svgRotation.value += 360;
};

const setSvgRotation = (angle) => {
  svgRotation.value = angle;
};

const resetSvgRotation = () => {
  svgRotation.value = 0;
  MessageDialog.value = "Đã reset xoay SVG";
  DialogSuccess.value = true;
};

// Designator label rotation functions
const rotateDesignatorLabel = (angle) => {
  designatorLabelAngle.value += angle;
  // Keep angle between -360 and 360 degrees
  if (designatorLabelAngle.value > 360) designatorLabelAngle.value -= 360;
  if (designatorLabelAngle.value < -360) designatorLabelAngle.value += 360;

  MessageDialog.value = `Đã xoay designator label ${
    angle > 0 ? "+" : ""
  }${angle}° (Tổng: ${designatorLabelAngle.value}°)`;
  DialogSuccess.value = true;
};

const resetDesignatorLabelAngle = () => {
  designatorLabelAngle.value = 0;
  MessageDialog.value = "Đã reset góc designator label";
  DialogSuccess.value = true;
};

// Component body rotation functions
const rotateComponentBody = (angle) => {
  componentBodyAngle.value += angle;
  // Keep angle between -360 and 360 degrees
  if (componentBodyAngle.value > 360) componentBodyAngle.value -= 360;
  if (componentBodyAngle.value < -360) componentBodyAngle.value += 360;

  MessageDialog.value = `Đã xoay component body ${
    angle > 0 ? "+" : ""
  }${angle}° (Tổng: ${componentBodyAngle.value}°)`;
  DialogSuccess.value = true;
};

const resetComponentBodyAngle = () => {
  componentBodyAngle.value = 0;
  MessageDialog.value = "Đã reset góc component body";
  DialogSuccess.value = true;
};

// const autoRotateSvgToFitPnP = () => {
//   if (!detailPnP.value || detailPnP.value.length === 0) {
//     MessageCautionDialog.value = "Không có dữ liệu Pick&Place để phân tích";
//     DialogCaution.value = true;
//     return;
//   }

//   // Analyze PnP data to determine optimal rotation
//   const rotations = detailPnP.value
//     .filter((pnp) => pnp.rotation !== null && pnp.rotation !== undefined)
//     .map((pnp) => pnp.rotation || pnp.rot || 0);

//   if (rotations.length === 0) {
//     MessageCautionDialog.value =
//       "Không tìm thấy thông tin xoay trong dữ liệu Pick&Place";
//     DialogCaution.value = true;
//     return;
//   }

//   // Calculate average rotation
//   const avgRotation =
//     rotations.reduce((sum, rot) => sum + rot, 0) / rotations.length;

//   // Normalize to common angles (0, 90, 180, 270)
//   const normalizedRotation = Math.round(avgRotation / 90) * 90;

//   setSvgRotation(normalizedRotation);
//   MessageDialog.value = `Đã xoay SVG ${normalizedRotation}° để phù hợp với dữ liệu Pick&Place`;
//   DialogSuccess.value = true;
// };

// Test SVG rotation function
// const testSvgRotation = () => {
//   console.log("Testing SVG rotation...");
//   console.log("Current svgRotation:", svgRotation.value);
//   console.log("Current SVG container style:", svgContainerStyle.value);

//   // Test with a simple rotation
//   svgRotation.value = 45;
//   console.log("After setting rotation to 45°:", svgRotation.value);
//   console.log("Updated SVG container style:", svgContainerStyle.value);

//   MessageDialog.value =
//     "Đã test xoay SVG 45°. Kiểm tra console để xem kết quả.";
//   DialogSuccess.value = true;
// };

const GetSetting = () => {
  const found = detailSetting.value[0];
  if (found) {
    rotationAngle.value = found.rotation;
    cx.value = found.cx;
    cy.value = found.cy;
    hintOffsetX.value = found.manualOffsetX;
    hintOffsetY.value = found.manualOffsetY;
    swapXY.value = found.swapXY;
  } else {
  }
};

// Debug coordinate info
const debugCoordinates = () => {
  console.log("Current Coordinates:");
  console.log("Scale:", coordinateScale.value);
  console.log("Offset X:", coordinateOffsetX.value);
  console.log("Offset Y:", coordinateOffsetY.value);
  console.log("Global Rotation:", coordinateRotation.value);
  console.log("Flip X:", flipX.value);
  console.log("Flip Y:", flipY.value);
  console.log("Swap X↔Y:", swapXY.value);
  console.log("Zoom Level:", zoomLevel.value);
  console.log("Rotation Center X:", cx.value);
  console.log("Rotation Center Y:", cy.value);
  console.log("Rotation Angle:", rotationAngle.value);
  console.log("Manual Offset X:", manualOffsetX.value);
  console.log("Manual Offset Y:", manualOffsetY.value);
  console.log("SVG Rotation:", svgRotation.value);
  console.log("Designator Label Angle:", designatorLabelAngle.value);
  console.log("Component Body Angle:", componentBodyAngle.value);

  // Log PnP data with rotation
  if (detailPnP.value && detailPnP.value.length > 0) {
    console.log("PnP Data with Rotation:");
    detailPnP.value.forEach((item, index) => {
      const transformed = getTransformedCoordinates(item.x, item.y);
      console.log(
        `${index + 1}. ${item.designator}: Original(X=${item.x}, Y=${
          item.y
        }) → Transformed(X=${transformed.x.toFixed(
          2
        )}, Y=${transformed.y.toFixed(2)})`
      );
    });
  }
};

// Computed bounds and center of current PnP dataset (raw units)
const pnpBounds = computed(() => {
  if (!filteredPnP.value || filteredPnP.value.length === 0) return null;
  const valid = filteredPnP.value.filter(
    (p) => typeof p.x === "number" && typeof p.y === "number"
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

// Helper to get center in transformed space (after scale and offsets)
const getTransformedCenter = () => {
  if (!pnpBounds.value) return { cxT: 0, cyT: 0 };
  const cxT =
    pnpBounds.value.cxRaw * coordinateScale.value + coordinateOffsetX.value;
  const cyT =
    pnpBounds.value.cyRaw * coordinateScale.value + coordinateOffsetY.value;
  return { cxT, cyT };
};

// Current Gerber SVG for selected layer
const currentGerberSvg = computed(() => {
  const dg = detailGerber.value;
  if (!dg) return "";
  if (Array.isArray(dg) && dg.length > 0) {
    const byLayer = dg.find(
      (item) => item && item.layer === selectedLayer.value && item.svg
    );
    if (byLayer && typeof byLayer.svg === "string") return byLayer.svg;
    return dg[0]?.svg || "";
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
      (item) => item && item.layer === selectedLayer.value && item.unit
    );
    if (byLayer && typeof byLayer.unit === "string") return byLayer.unit;
    return dg[0]?.unit || "";
  } else if (dg && typeof dg === "object") {
    return dg.unit || "";
  } else if (typeof dg === "string") {
    return dg;
  }
  return "";
});

// Filtered PnP by selected layer
const filteredPnP = computed(() => {
  const list = detailPnP.value || [];
  return list.filter((p) => (p.layer || "Top") === selectedLayer.value && p.type === "SMT");
  
});


const downloadExcelPnP = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Dữ liệu SMT")

  // Tạo header
  worksheet.columns = [
    { header: "Designator", key: "designator", width: 20 },
    { header: "X-Center", key: "x", width: 20 },
    { header: "Y- Center", key: "y", width: 20 },
    { header: "Rotation", key: "rotation", width: 20 },
    { header: "Layer", key: "layer", width: 20 },
    { header: "MPN", key: "mpn", width: 50 },
  ]

  // Thêm dữ liệu từ composables
  filteredPnP.value.forEach((item) => {
    worksheet.addRow(item)
  })

  // Xuất buffer
  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buffer]), "DataSMT.xlsx")
}
</script>
<script>
export default {
  components: {
    ButtonBack,
    ButtonEdit,
    ButtonRemove,
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

.gerber-svg-container {
  width: 100%;
  height: 70vh;
  overflow: hidden;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  user-select: none;
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
.gerber-svg-container :deep(.pnp-marker) {
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

/* Component body rectangle */
.gerber-svg-container :deep(.pnp-component-body) {
  fill: rgba(0, 150, 136, 0.15);
  stroke: #009688;
  stroke-width: 1.5;
  transition: all 0.2s ease;
}

/* Component outline for better visibility */
.gerber-svg-container :deep(.pnp-component-outline) {
  fill: none;
  stroke: #1976d2;
  stroke-width: 0.5;
  stroke-dasharray: 2, 2;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.gerber-svg-container :deep(.pnp-marker:hover) {
  opacity: 1 !important;
  filter: brightness(1.3) drop-shadow(0 0 3px rgba(255, 0, 0, 0.5));
}

.gerber-svg-container :deep(.pnp-marker:hover .pnp-component-body) {
  fill: rgba(0, 150, 136, 0.25);
  stroke: #ff4444;
  stroke-width: 2;
}

.gerber-svg-container :deep(.pnp-marker:hover .pnp-component-outline) {
  stroke: #ff4444;
  stroke-width: 1;
  opacity: 0.8;
}

.gerber-svg-container :deep(.pnp-marker:hover circle) {
  stroke-width: 1.2;
  r: 3;
  stroke: #ff4444;
}

.gerber-svg-container :deep(.pnp-marker:hover line) {
  stroke-width: 2;
  stroke: #ff4444;
}

.gerber-svg-container :deep(.pnp-marker:hover text) {
  font-size: 4;
  fill: #1565c0;
  font-weight: bold;
}

/* Default marker styles - làm rõ hơn */
.gerber-svg-container :deep(.pnp-marker line) {
  stroke: #ff0000;
  stroke-width: 1.5;
  opacity: 0.9;
}

.gerber-svg-container :deep(.pnp-marker circle) {
  stroke: #ff0000;
  stroke-width: 0.8;
  opacity: 0.8;
}

.gerber-svg-container :deep(.pnp-marker text) {
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
.gerber-svg-container:fullscreen {
  background: black;
  padding: 20px;
}

.gerber-svg-container:fullscreen :deep(svg) {
  max-height: 90vh;
}

/* Loading state for SVG */
.gerber-svg-container.loading {
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
</style>
