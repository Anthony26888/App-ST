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
                  <v-list-item
                    @click="DialogAddGerber = true"
                    prepend-icon="mdi-plus"
                  >
                    <v-list-item-title class="text-caption"
                      >Gerber</v-list-item-title
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
                <span>So sánh Gerber và Pick & Place</span>
                <!-- <Button-Download @click="downloadExcelPnP()"/> -->
                <v-spacer></v-spacer>
                <!-- Coordinate scaling controls -->
                <v-btn
                  @click="GetSettingPCB()"
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
                >
                  <!-- GRID -->
                  <div v-if="showGrid" class="coordinate-grid-overlay">
                    <svg width="100%" height="100%">
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

                  <!-- SVG -->
                  <div
                    ref="svgWrapper"
                    v-html="currentSvgContent"
                    class="svg-full-wrapper"
                  ></div>

                  <!-- Subtle Status Bar -->
                  <div class="gerber-status-bar d-flex align-center px-4 py-1">
                    <div class="d-flex align-center me-4">
                      <v-icon size="x-small" color="primary" class="me-1"
                        >mdi-magnify-plus</v-icon
                      >
                      <span class="text-caption font-weight-bold"
                        >{{ Math.round(zoomLevel * 100) }}%</span
                      >
                    </div>
                    <v-divider
                      vertical
                      class="mx-2 my-1"
                      style="opacity: 0.2"
                    ></v-divider>
                    <div class="d-flex align-center ms-2">
                      <v-icon size="x-small" color="success" class="me-1"
                        >mdi-axis-arrow</v-icon
                      >
                      <span
                        class="text-caption font-weight-medium text-grey-darken-2"
                      >
                        X: <span class="text-black">{{ mouseCoords.x }}</span>
                        <span class="ms-2">Y: </span
                        ><span class="text-black">{{ mouseCoords.y }}</span>
                        <span class="ms-1 text-grey">mm</span>
                      </span>
                    </div>
                    <v-spacer></v-spacer>
                    <div class="text-caption text-grey-darken-1">
                      {{ selectedLayer }} Layer
                    </div>
                  </div>
                </div>

                <v-empty-state
                  v-if="overlayMode !== 'pnp' && !currentGerberSvg"
                  title="Dữ liệu trống"
                  text="Chưa có dữ liệu Gerber"
                  icon="mdi-image-off"
                  class="mt-10"
                />
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <v-tabs-window-item :value="3">
            <v-card-title class="d-flex align-center pe-2">
              <v-btn
                @click="GetSettingPCB()"
                prepend-icon="mdi-file-document"
                color="primary"
                variant="tonal"
                class="text-caption ms-2"
              >
                Dữ liệu PCB & Panel
              </v-btn>
              <Button-Download
                @click="DownloadPCB()"
                text="Tải file PCB"
              />
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
                      <v-toolbar flat class="d-flex align-center bg-transparent" >
                        <v-toolbar-title>
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
                      <v-toolbar flat class="d-flex align-center bg-transparent">
                        <v-toolbar-title>
                          <v-icon
                            color="success"
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
      :items="['Top', 'Bottom']"
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
    v-model="DialogAddGerberPDF"
    width="700"
    title="Thêm dữ liệu Gerber PDF"
    icon="mdi-file-pdf-box"
  >
    <InputFiles
      label="Nhập file Gerber PDF (.pdf)"
      class="mt-2"
      v-model="FileGerberPDF"
      accept=".pdf"
      name="gerber-pdf"
    />
    <v-select
      v-model="LayerGerberPDF"
      :items="['Top', 'Bottom']"
      label="Layer"
      class="mt-3"
      density="comfortable"
      variant="outlined"
      prepend-inner-icon="mdi-layers-triple"
    />
    <v-alert type="info" variant="tonal" class="mt-2 text-caption">
      Upload file PDF Gerber – hệ thống sẽ tự động convert trang đầu tiên thành
      ảnh SVG và hiển thị trong tab Gerber.
    </v-alert>
    <template #actions>
      <ButtonCancel @cancel="DialogAddGerberPDF = false" />
      <ButtonSave @save="uploadGerberPDF" />
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
          <p class="font-weight-thin">Đã Offset X: {{ hintOffsetX }} mm</p>
          <br />
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
          <p class="font-weight-thin">Đã Offset Y: {{ hintOffsetY }} mm</p>
          <br />
          <p class="font-weight-thin">
            Tổng Offset Y: {{ totalAddedY.toFixed(2) }} mm
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
            v-model.number="length"
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
import { ref, watch, computed, onMounted, reactive } from "vue";
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
const FileGerberPDF = ref(null);
const LayerGerberPDF = ref("Top");
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

const manualOffsetX = ref(0);
const manualOffsetY = ref(0);
const totalAddedX = ref(0);
const totalAddedY = ref(0);
const totalAdjustedCountX = ref(0);
const totalAdjustedCountY = ref(0);
const hintOffsetX = ref(0);
const hintOffsetY = ref(0);

// --- Setting PCB States ---
const width = ref(0);
const length = ref(0);
const originOffsetX = ref(0);
const originOffsetY = ref(0);
const railOffsetX = ref(0);
const railOffsetY = ref(0);
const angle = ref(0);
const rotationMode = ref("CW");

// --- DigiKey API States ---
const GetDigikey = ref("");
const accessToken = ref(null);
const tokenType = ref(null);
const ResultSearch = ref(null);

// --- Table & Data States ---
const Headers = [
  { title: "STT", key: "stt" },
  { title: "Designator", key: "designator", width: "150px" },
  { title: "MPN", key: "mpn", width: "150px" },
  { title: "X (mm)", key: "x" },
  { title: "Y (mm)", key: "y" },
  { title: "Rotation", key: "rotation" },
  { title: "Layer", key: "layer" },
  { title: "Description", key: "description_bom" },
  { title: "Width", key: "width" },
  { title: "Length", key: "length" },
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
const searchBom = ref("");
const itemsPerPageBom = ref(20);
const pageBom = ref(1);
const searchPCBTopLayer = ref("");
const searchPCBBottomLayer = ref("");
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

  const svgHeight = getSvgRenderedHeight(svg);
  let offset = [];
  if (selectedLayer.value === "Top") {
    const offsetSettingY = detailSetting.value[0].manualOffsetY_top || 0;
    const offsetSettingX = detailSetting.value[0].manualOffsetX_top || 0;
    offset = filteredPnP.value.map((pnp) => ({
      ...pnp,
      y: pnp.y - offsetSettingY,
      x: pnp.x - offsetSettingX,
    }));
  } else {
    const offsetSettingY = detailSetting.value[0].manualOffsetY_bottom || 0;
    const offsetSettingX = detailSetting.value[0].manualOffsetX_bottom || 0;
    offset = filteredPnP.value.map((pnp) => ({
      ...pnp,
      y: pnp.y - offsetSettingY,
      x: pnp.x - offsetSettingX,
    }));
  }
  const pnpMarkers = offset
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

      // Invert Y to move origin to bottom-left of SVG and apply extra Y offset (in mm)
      // Prefer inverting around PnP bounds (handles non-zero origins); fallback to SVG height
      {
        const extraYOffsetUnits =
          (unit === "mm" ? pnpYOffsetMm.value : pnpYOffsetMm.value / 25.4) *
          coordinateScale.value;
        if (
          pnpBounds.value &&
          Number.isFinite(pnpBounds.value.minY) &&
          Number.isFinite(pnpBounds.value.maxY)
        ) {
          const yRawInverted =
            pnpBounds.value.maxY + pnpBounds.value.minY - (pnp.y ?? 0);
          transformedY =
            yRawInverted * coordinateScale.value +
            coordinateOffsetY.value +
            extraYOffsetUnits;
        } else if (svgHeight !== null) {
          transformedY = svgHeight - transformedY + extraYOffsetUnits;
        } else {
          transformedY = transformedY + extraYOffsetUnits;
        }
      }

      const desiredRotation =
        pnp.rotation || pnp.rot || coordinateRotation.value;
      const componentRotation = ((-desiredRotation % 360) + 360) % 360;
      const displayRotation = ((desiredRotation % 360) + 360) % 360;

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
        <g transform="translate(${transformedX}, ${transformedY}) rotate(${componentRotation}) scale(${crosshairScale})" class="pnp-marker" data-designator="${pnp.designator}">
          ${componentMarkup}
          <!-- Crosshair marker -->
          <line x1="-25" y1="0" x2="25" y2="0" stroke="red" stroke-width="1.5" opacity="0.9"/>
          <line x1="0" y1="-25" x2="0" y2="25" stroke="red" stroke-width="1.5" opacity="0.9"/>
          <!-- Circle around the point -->
          <circle cx="0" cy="0" r="2" fill="none" stroke="red" stroke-width="0.8" opacity="0.8"/>
          <!-- Designator label -->
          <text
            x="6"
            y="3"
            font-size="23"
            fill="blue"
            font-weight="bold"
            transform="rotate(${designatorLabelAngle.value})"
            transform-origin="6 3"
          >${pnp.designator}</text>
          <title>${pnp.designator}: X=${pnp.x}mm, Y=${pnp.y}mm</title>
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

// ==========================================
// 5. LIFECYCLE HOOKS
// ==========================================

onMounted(() => {
  if (coordinateScale.value) {
    coordinateScale.value /= 0.0254;
  }
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

    gerberFileList.value.forEach(({ file, layer }) => {
      // Gửi kèm layer metadata qua filename hoặc field riêng
      formData.append("FileGerber", file);
      formData.append(
        "layers",
        gerberFileList.value.map((i) => i.layer),
      ); // mảng layers tương ứng
      formData.append("layer", LayerGerber.value);
    });

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

const uploadGerberPDF = async () => {
  if (!FileGerberPDF.value) {
    MessageCautionDialog.value = "Vui lòng chọn file PDF";
    DialogCaution.value = true;
    return;
  }
  DialogLoading.value = true;
  try {
    const formData = new FormData();
    formData.append("FileGerberPDF", FileGerberPDF.value);
    formData.append("layer", LayerGerberPDF.value);

    await axios.post(`${Url}/upload-gerber-pdf/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    DialogSuccess.value = true;
    MessageDialog.value = `Upload Gerber PDF (${LayerGerberPDF.value}) thành công`;
    DialogAddGerberPDF.value = false;
    FileGerberPDF.value = null;
    LayerGerberPDF.value = "Top";
    DialogLoading.value = false;
  } catch (error) {
    console.error("Lỗi upload Gerber PDF:", error.response?.data || error);
    DialogLoading.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value =
      error.response?.data?.error || "Upload Gerber PDF thất bại";
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

const GetSettingPCB = () => {
  DialogSettingPCB.value = true;
  const found = detailSetting.value[0];
  if (selectedLayer.value == "Top") {
    hintOffsetX.value = found.manualOffsetX_top;
    hintOffsetY.value = found.manualOffsetY_top;
  } else {
    hintOffsetX.value = found.manualOffsetX_bottom;
    hintOffsetY.value = found.manualOffsetY_bottom;
  }
  length.value = found.length;
  width.value = found.width;
  angle.value = found.angle;
  railOffsetX.value = found.railOffsetX;
  railOffsetY.value = found.railOffsetY;
  originOffsetX.value = found.originOffsetX;
  originOffsetY.value = found.originOffsetY;
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
  const formData = reactive({
    manualOffsetX_top:
      selectedLayer.value == "Top"
        ? totalAddedX.value
        : detailSetting.value[0].manualOffsetX_top,
    manualOffsetY_top:
      selectedLayer.value == "Top"
        ? totalAddedY.value
        : detailSetting.value[0].manualOffsetY_top,
    manualOffsetX_bottom:
      selectedLayer.value == "Bottom"
        ? totalAddedX.value
        : detailSetting.value[0].manualOffsetX_bottom,
    manualOffsetY_bottom:
      selectedLayer.value == "Bottom"
        ? totalAddedY.value
        : detailSetting.value[0].manualOffsetY_bottom,
    width: width.value,
    length: length.value,
    originOffsetX: originOffsetX.value,
    originOffsetY: originOffsetY.value,
    railOffsetX: railOffsetX.value,
    railOffsetY: railOffsetY.value,
    angle: angle.value,
  });
  try {
    const response = await axios.put(
      `${Url}/SettingPCB/Edit-item/${id}`,
      formData,
    );
    DialogLoading.value = false;
    DialogSettingPCB.value = false;
    DialogSuccess.value = true;
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    run();
  } catch (error) {
    DialogLoading.value = false;
    DialogSettingPCB.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
  }
};

// Apply rotation mode
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

    rotationOffset: pickValue(raw.rotationOffset, 0, true)
  };
}

/* =======================
   TRANSFORM
======================= */
function transform(p) {
  const cfg = getCfgByLayer(p.layer);

  let px = toNum(p.x);
  let py = toNum(p.y);
  let pr = toNum(p.rotation);

  if (px === null || py === null) {
    console.warn("❌ Invalid XY:", p);
    return null;
  }

  if (pr === null) pr = 0;

  let x = px - cfg.X0;
  let y = py - cfg.Y0;
  let r = normalizeRotation(pr);

  r = normalizeRotation(r + cfg.rotationOffset);

  // mirror bottom
  if (p.layer?.toLowerCase() === "bottom") {
    x = cfg.L - x;
    r = -r;
  }

  // rotate
  let x2, y2;

  switch (cfg.angle) {
    case 90:
      x2 = y;
      y2 = cfg.L - x;
      break;
    case 180:
      x2 = cfg.L - x;
      y2 = cfg.W - y;
      break;
    case 270:
      x2 = cfg.W - y;
      y2 = x;
      break;
    default:
      x2 = x;
      y2 = y;
  }

  // rotation
  let r2 =
    cfg.rotationMode === "CCW"
      ? r + cfg.angle
      : r - cfg.angle;

  // offset
  x2 += cfg.offsetX;
  y2 += cfg.offsetY;

  r2 = normalizeRotation(r2);

  return {
    ...p,
    x: Number(x2.toFixed(3)),
    y: Number(y2.toFixed(3)),
    rotation: r2
  };
}

/* =======================
   COMPUTED
======================= */
const transformedPnP = ref([]);

watch(detailPnP, (val) => {
  transformedPnP.value = val
    .map(transform)
    .filter(Boolean);
}, { immediate: true });

const resultTop = ref([]);
const resultBottom = ref([]);

watch(transformedPnP, (val) => {
  resultTop.value = val.filter(
    (p) => p.layer?.toLowerCase() === "top"
  );

  resultBottom.value = val.filter(
    (p) => p.layer?.toLowerCase() === "bottom"
  );
}, { immediate: true });

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
    MPN: item.mpn
  }));

  const wsTop = XLSX.utils.json_to_sheet(topData);
  const wbTop = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbTop, wsTop, "Top");

  const bufferTop = XLSX.write(wbTop, {
    bookType: "xlsx",
    type: "array"
  });

  saveAs(
    new Blob([bufferTop], { type: "application/octet-stream" }),
    `PnP_Top_${Date.now()}.xlsx`
  );

  // ===== BOTTOM =====
  const bottomData = resultBottom.value.map((item, index) => ({
    STT: index + 1,
    Designator: item.designator,
    X: item.x,
    Y: item.y,
    Rotation: item.rotation,
    Layer: item.layer,
    MPN: item.mpn
  }));

  const wsBottom = XLSX.utils.json_to_sheet(bottomData);
  const wbBottom = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbBottom, wsBottom, "Bottom");

  const bufferBottom = XLSX.write(wbBottom, {
    bookType: "xlsx",
    type: "array"
  });

  saveAs(
    new Blob([bufferBottom], { type: "application/octet-stream" }),
    `PnP_Bottom_${Date.now()}.xlsx`
  );
}
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
</style>
