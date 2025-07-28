<template>
  <div class="manufacture-detail">
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light">
        <ButtonBack to="/san-xuat" />
        Theo dõi sản xuất
      </v-card-title>
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-cart"></v-icon> &nbsp;
        <v-breadcrumbs :items="[`${NameManufacture}`, `${NameOrder}`]">
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>
        <v-spacer></v-spacer>
        <v-btn
          prepend-icon="mdi-cog"
          variant="tonal"
          color="primary"
          class="ms-2 text-caption"
          @click="DialogSettingSMT = true"
          >Cài đặt</v-btn
        >
      </v-card-title>

      <v-card-text class="pa-6">
        <!-- Main Stats Overview -->
        <v-row class="mb-6">
          <v-col cols="12" md="3">
            <v-card class="rounded-lg" color="primary" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu vào</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalInput }}
                </div>
                <div class="text-caption">Tổng số lượng đầu vào</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="rounded-lg" color="success" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu ra</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalWarehouse }}
                </div>
                <div class="text-caption">Tổng số lượng đầu ra</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="rounded-lg" color="warning" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Hàng lỗi</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalError }}
                </div>
                <div class="text-caption">Tổng số lượng hàng lỗi</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="rounded-lg" color="info" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Tỷ lệ</div>
                <div class="text-h4 font-weight-bold">{{ percent }}%</div>
                <div class="text-caption">Tỉ lệ hàng hoá</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- SMT Cards Grouped with Title and Vertical Dividers -->
        <v-row v-if="Level_SMT" class="mb-6 align-center">
          <v-col cols="12">
            <v-card class="rounded-lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                SMT
              </v-card-title>
              <v-card-text class="pa-4">
                <div
                  class="d-flex align-center flex-wrap-sm-nowrap flex-column flex-sm-row"
                >
                  <div
                    class="flex-grow-1 d-flex flex-column align-center mb-4 mb-sm-0"
                  >
                    <div class="text-h6 font-weight-bold mb-2">Printer</div>
                    <div class="text-h4 font-weight-bold mb-2">
                      <span class="text-primary">{{ totalInput }}</span> /
                      <span class="text-success">{{ totalSMT_3 }}</span>
                    </div>
                    <v-progress-circular
                      :model-value="(totalSMT_3 / totalInput) * 100"
                      color="primary"
                      size="48"
                    >
                      {{ Math.round((totalSMT_3 / totalInput) * 100) }}%
                    </v-progress-circular>
                    <div class="text-caption text-medium-emphasis mt-2">
                      Tổng số lượng SMT (Printer)
                    </div>
                  </div>
                  <v-divider
                    vertical
                    class="mx-0 d-none d-sm-flex"
                    style="height: 120px"
                  ></v-divider>
                  <div
                    class="flex-grow-1 d-flex flex-column align-center mb-4 mb-sm-0"
                  >
                    <div class="text-h6 font-weight-bold mb-2">
                      Gắp linh kiện
                    </div>
                    <div class="text-h4 font-weight-bold mb-2">
                      <span class="text-primary">{{ totalInput }}</span> /
                      <span class="text-success">{{ totalSMT_2 }}</span>
                    </div>
                    <v-progress-circular
                      :model-value="(totalSMT_2 / totalInput) * 100"
                      color="primary"
                      size="48"
                    >
                      {{ Math.round((totalSMT_2 / totalInput) * 100) }}%
                    </v-progress-circular>
                    <div class="text-caption text-medium-emphasis mt-2">
                      Tổng số lượng SMT (Gắp linh kiện)
                    </div>
                  </div>
                  <v-divider
                    vertical
                    class="mx-0 d-none d-sm-flex"
                    style="height: 120px"
                  ></v-divider>
                  <div class="flex-grow-1 d-flex flex-column align-center">
                    <div class="text-h6 font-weight-bold mb-2">Lò Reflow</div>
                    <div class="text-h4 font-weight-bold mb-2">
                      <span class="text-primary">{{ totalInput }}</span> /
                      <span class="text-success">{{ totalSMT_1 }}</span>
                    </div>
                    <v-progress-circular
                      :model-value="(totalSMT_1 / totalInput) * 100"
                      color="primary"
                      size="48"
                    >
                      {{ Math.round((totalSMT_1 / totalInput) * 100) }}%
                    </v-progress-circular>
                    <div class="text-caption text-medium-emphasis mt-2">
                      Tổng số lượng SMT (Lò Reflow)
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <!-- End SMT Cards Group -->

        <!-- Process Cards Grid -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="4" v-if="Level_AOI">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                AOI
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> /
                    <span class="text-success">{{ totalAOI }}</span> /
                    <span class="text-error">{{ totalAOIError }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalAOI / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalAOI / totalInput) * 100) }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng AOI
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" v-if="Level_IPQCSMT">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                IPQC (SMT)
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> /
                    <span class="text-success">{{ totalIPQCSMT }}</span> /
                    <span class="text-error">{{ totalIPQCSMTError }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalIPQCSMT / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalIPQCSMT / totalInput) * 100) }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng IPQC (SMT)
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" v-if="Level_Assembly">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                Assembly
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> /
                    <span class="text-success">{{ totalAssembly }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalAssembly / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalAssembly / totalInput) * 100) }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng Assembly
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" v-if="Level_IPQC">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                IPQC
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> /
                    <span class="text-success">{{ totalIPQC }}</span> /
                    <span class="text-error">{{ totalIPQCError }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalIPQC / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalIPQC / totalInput) * 100) }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng IPQC
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" v-if="Level_Test_1">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                Test 1
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> /
                    <span class="text-success">{{ totalTest1 }}</span> /
                    <span class="text-error">{{ totalTest1Error }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalTest1 / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalTest1 / totalInput) * 100) }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng Test 1
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" v-if="Level_BoxBuild">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                Box Build
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> /
                    <span class="text-success">{{ totalBoxBuild }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalBoxBuild / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalBoxBuild / totalInput) * 100) }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng Box Build
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" v-if="Level_ConformalCoating">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                Tẩm phủ
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> /
                    <span class="text-success">{{
                      totalConformalCoating
                    }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalConformalCoating / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{
                      Math.round((totalConformalCoating / totalInput) * 100)
                    }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng Tẩm phủ
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" v-if="Level_Test_2">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                Test 2
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> /
                    <span class="text-success">{{ totalTest2 }}</span> /
                    <span class="text-error">{{ totalTest2Error }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalTest2 / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalTest2 / totalInput) * 100) }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng Test 2
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" v-if="Level_OQC">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                OQC
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> /
                    <span class="text-success">{{ totalOQC }}</span> /
                    <span class="text-error">{{ totalOQCError }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalOQC / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalOQC / totalInput) * 100) }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng OQC
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                RW
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-warning">{{ totalError }}</span> /
                    <span class="text-primary">{{ totalFixed }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalFixed / totalError) * 100 || 0"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalFixed / totalError) * 100) || 0 }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng sản phẩm RW
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-card class="h-100" rounded="lg">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg"
              >
                Nhập kho
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> /
                    <span class="text-success">{{ totalWarehouse }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalWarehouse / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalWarehouse / totalInput) * 100) }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng nhập kho
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Data Table Section -->
        <v-card class="rounded-lg" elevation="2">
          <v-data-table-virtual
            :headers="HeadersHistory"
            :items="history"
            :group-by="[{ key: 'Type' }]"
            fixed-header
            class="elevation-0"
          >
            <template v-slot:top>
              <v-toolbar flat dense class="rounded-t-lg">
                <v-toolbar-title class="d-flex align-center">
                  <v-icon
                    color="primary"
                    icon="mdi-book-multiple"
                    size="small"
                    class="me-2"
                  ></v-icon>
                  <span class="text-h6">Kế hoạch sản xuất</span>
                </v-toolbar-title>

                <v-spacer></v-spacer>

                <ButtonAdd
                  label="Thêm"
                  class="mr-2"
                  @click="DialogAdd = true"
                />
              </v-toolbar>
            </template>

            <template
              v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }"
            >
              <tr>
                <td :colspan="columns.length">
                  <v-btn
                    variant="text"
                    :icon="isGroupOpen ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                    @click="toggleGroup(item)"
                    class="me-2"
                  ></v-btn>
                  <span class="font-weight-bold text-primary">{{
                    item.value
                  }}</span>
                </td>
              </tr>
            </template>

            <template #[`item.id`]="{ item }">
              <div class="d-flex gap-2">
                <ButtonEye @click="PushItem(item)" />
                <ButtonEdit @click="GetItem(item)" />
              </div>
            </template>

            <template #[`item.Quantity_Plan`]="{ item }">
              <v-chip color="primary" variant="tonal">{{
                item.Quantity_Plan
              }}</v-chip>
            </template>

            <template #[`item.Quantity_Real`]="{ item }">
              <v-chip color="success" variant="tonal">{{
                item.Quantity_Real
              }}</v-chip>
            </template>

            <template #[`item.Quantity_Error`]="{ item }">
              <v-chip color="warning" variant="tonal">{{
                item.Quantity_Error
              }}</v-chip>
            </template>

            <template #[`item.Percent`]="{ item }">
              <v-progress-linear
                v-model="item.Percent"
                height="25"
                color="success"
                rounded
                class="rounded-lg"
              >
                <strong>{{ Math.ceil(item.Percent).toFixed(1) }}%</strong>
              </v-progress-linear>
            </template>
          </v-data-table-virtual>
        </v-card>

        <!-- Chart thống kê công đoạn -->
        <v-row class="mb-6 mt-5">
          <!-- Chart Card -->
          <v-col cols="12" md="8">
            <v-card class="rounded-lg h-100" elevation="2">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 rounded-t-lg"
              >
                <v-icon
                  icon="mdi-chart-bar"
                  color="primary"
                  class="me-2"
                ></v-icon>
                Thống kê theo công đoạn sản xuất
              </v-card-title>
              <v-card-text class="pa-4">
                <div
                  class="chart-container"
                  style="position: relative; height: 400px"
                >
                  <canvas ref="historyChart"></canvas>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Chart chi tiết công đoạn -->
          <v-col cols="12" md="4">
            <v-card class="rounded-lg h-100" elevation="2">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 rounded-t-lg"
              >
                <v-icon icon="mdi-table" class="me-2" color="primary"></v-icon>
                Chi tiết theo công đoạn
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="detail-table-container">
                  <v-table density="compact" class="elevation-1 rounded">
                    <thead>
                      <tr>
                        <th class="text-left text-caption">Công đoạn</th>
                        <th class="text-center text-caption">OK</th>
                        <th class="text-center text-caption">Lỗi</th>
                        <th class="text-center text-caption">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in chartDetailData" :key="index">
                        <td class="text-caption font-weight-medium">
                          {{ item.process }}
                          <v-chip
                            v-if="item.multiplier > 1"
                            size="x-small"
                            color="info"
                            variant="tonal"
                            class="ms-1"
                            :title="`Hệ số nhân: ${item.multiplier}`"
                          >
                            ×{{ item.multiplier }}
                          </v-chip>
                        </td>
                        <td class="text-center">
                          <v-chip
                            size="x-small"
                            color="success"
                            variant="tonal"
                          >
                            {{ item.ok }}
                          </v-chip>
                        </td>
                        <td class="text-center">
                          <v-chip size="x-small" color="error" variant="tonal">
                            {{ item.error }}
                          </v-chip>
                        </td>
                        <td class="text-center">
                          <v-chip
                            size="x-small"
                            :color="
                              item.rate >= 95
                                ? 'success'
                                : item.rate >= 80
                                ? 'warning'
                                : 'error'
                            "
                            variant="tonal"
                          >
                            {{ item.rate }}%
                          </v-chip>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>

                  <!-- Summary Stats -->
                  <div class="mt-4">
                    <v-divider class="mb-3"></v-divider>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-caption">Tổng OK:</span>
                      <v-chip size="small" color="success" variant="tonal">
                        {{ totalChartOK }}
                      </v-chip>
                    </div>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-caption">Tổng Lỗi:</span>
                      <v-chip size="small" color="error" variant="tonal">
                        {{ totalChartError }}
                      </v-chip>
                    </div>
                    <div class="d-flex justify-space-between align-center">
                      <span class="text-caption">Tỷ lệ chung:</span>
                      <v-chip
                        size="small"
                        :color="
                          overallRate >= 95
                            ? 'success'
                            : overallRate >= 80
                            ? 'warning'
                            : 'error'
                        "
                        variant="tonal"
                      >
                        {{ overallRate }}%
                      </v-chip>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Lịch sử sản xuất -->
        <v-card class="rounded-lg mt-5" elevation="2">
          <v-data-table
            :headers="HeadersHistoryPart"
            :items="historyPart"
            :search="searchHistory"
            fixed-header
            :items-per-page="itemsPerPage"
            v-model:page="page"
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
            height="calc(100vh - 200px)"
          >
            <template v-slot:top>
              <v-toolbar flat dense class="rounded-t-lg">
                <v-toolbar-title class="d-flex align-center">
                  <v-icon
                    color="primary"
                    icon="mdi-history"
                    size="small"
                    class="me-2"
                  ></v-icon>
                  <span class="text-h6">Lịch sử sản xuất</span>
                </v-toolbar-title>

                <v-spacer></v-spacer>

                <InputSearch v-model="searchHistory" class="mr-2" />
              </v-toolbar>
            </template>
            <template #[`item.Status`]="{ item }">
              <v-chip
                :color="
                  item.Status === 'error'
                    ? 'warning'
                    : item.Status === 'fixed'
                    ? 'info'
                    : 'success'
                "
                size="small"
                variant="tonal"
              >
                {{
                  item.Status === "error"
                    ? "Lỗi"
                    : item.Status === "fixed"
                    ? "Đã sửa"
                    : "OK"
                }}
              </v-chip>
            </template>
            <template #[`item.PartNumber`]="{ item }">
              <p v-if="item.PartNumber == 1">{{ NameOrder }}</p>
              <p v-else>{{ item.PartNumber }}</p>
            </template>
            <template #item.Note="{ item }">
              <div style="white-space: pre-line" class="text-error">
                {{ item.Note }}
              </div>
            </template>
            <template #item.id="{ item }">
              <v-btn
                size="small"
                variant="text"
                color="error"
                icon="mdi-trash-can"
                @click="GetItemHistory(item)"
              ></v-btn>
            </template>
            <template #[`bottom`]>
              <div class="text-center pt-2">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(historyPart.length / itemsPerPage)"
                ></v-pagination>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Dialog Add -->
    <v-dialog v-model="DialogAdd" width="700" scrollable>
      <v-card max-width="600" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
          Thêm dữ liệu kế hoạch
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="isFormValid">
            <v-row>
              <v-col col="12" md="6">
                <InputField disabled label="Số PO" v-model="PONumber_Add" />
              </v-col>
              <v-col col="12" md="6">
                <InputField
                  disabled
                  label="Đơn hàng"
                  v-model="Name_Order_Add"
                />
              </v-col>
            </v-row>
            <InputSelect
              label="Công đoạn"
              :items="LevelSelectAdd"
              hint="Lựa chọn công đoạn phù hợp"
              v-model="Type_Add"
              :rules="requiredRule"
            />
            <InputField
              label="Hạng mục"
              v-model="Category_Add"
              :rules="requiredRule"
            />

            <v-row>
              <v-col cols="12" sm="4">
                <InputField
                  label="Số lượng (pcs)"
                  type="number"
                  v-model="Quantity_Plan_Add"
                  :rules="requiredRule"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <InputField
                  label="Vòng lặp (giây)"
                  type="number"
                  v-model="CycleTime_Add"
                  :rules="requiredRule"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <InputField
                  label="Thời gian (giờ)"
                  type="number"
                  v-model="Time_Add"
                />
              </v-col>
            </v-row>

            <InputField
              label="Ngày tạo"
              type="date"
              v-model="Date_DetailManufacture_Add"
              :rules="requiredRule"
            />
          </v-form>
          <InputTextarea label="Ghi chú" v-model="Note_Add" />
        </v-card-text>
        <v-card-actions>
          <ButtonCancel @cancel="DialogAdd = false" />
          <ButtonSave @save="SaveAdd()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Edit -->
    <v-dialog v-model="DialogEdit" width="700" scrollable>
      <v-card max-width="600" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
          Sửa dữ liệu kế hoạch
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col col="12" md="6">
              <InputField disabled label="Số PO" v-model="PONumber_Edit" />
            </v-col>
            <v-col col="12" md="6">
              <InputField disabled label="Đơn hàng" v-model="Name_Order_Edit" />
            </v-col>
          </v-row>
          <InputSelect
            label="Quy trình"
            :items="LevelSelectAdd"
            hint="Lựa chọn quy trình phù hợp"
            v-model="Type_Edit"
            @update:model-value="(val) => (Type_Edit = val)"
          />
          <InputField label="Hạng mục" v-model="Category_Edit" />

          <v-row>
            <v-col cols="12" sm="4">
              <InputField
                label="Số lượng (pcs)"
                type="number"
                v-model="Quantity_Plan_Edit"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField
                label="Vòng lặp (giây)"
                type="number"
                v-model="CycleTime_Edit"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField
                label="Thời gian (giờ)"
                type="number"
                v-model="Time_Edit"
              />
            </v-col>
          </v-row>
          <InputTextarea label="Ghi chú" v-model="Note_Edit" />
        </v-card-text>
        <v-card-actions>
          <ButtonDelete @delete="DialogRemove = true" />
          <v-spacer></v-spacer>
          <ButtonCancel @cancel="DialogEdit = false" />
          <ButtonSave @save="SaveEdit()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Remove -->
    <v-dialog v-model="DialogRemove" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-trash-can" color="error" class="me-2"></v-icon>
          Xoá dữ liệu kế hoạch
        </v-card-title>
        <v-card-text
          >Bạn có chắc chắn muốn xóa dữ liệu kế hoạch này?</v-card-text
        >
        <v-card-actions>
          <v-spacer />
          <ButtonCancel @cancel="DialogRemove = false" />
          <ButtonDelete @delete="RemoveItem()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Setting SMT -->
    <v-dialog v-model="DialogSettingSMT" max-width="700px">
      <v-card>
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-cog" color="primary" class="me-2"></v-icon>
          Cài đặt dây chuyền
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col>
              <InputField
                v-model="DelaySMT_Edit"
                label="Độ trễ SMT (ms)"
                type="number"
              />
            </v-col>
            <v-col>
              <InputField
                v-model="Quantity_Edit"
                label="Số lượng board SMT"
                type="number"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <InputField
                v-model="Quantity_IPQCSMT_Edit"
                label="Số lượng board IPQC SMT"
                type="number"
              />
            </v-col>
            <v-col>
              <InputField
                v-model="Quantity_IPQC_Edit"
                label="Số lượng board IPQC"
                type="number"
              />
            </v-col>
            <v-col>
              <InputField
                v-model="Quantity_AOI_Edit"
                label="Số lượng board AOI"
                type="number"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <InputField
                v-model="Quantity_Assembly_Edit"
                label="Số lượng board Assembly"
                type="number"
              />
            </v-col>
            <v-col>
              <InputField
                v-model="Quantity_BoxBuild_Edit"
                label="Số lượng board BoxBuild"
                type="number"
              />
            </v-col>
            <v-col>
              <InputField
                v-model="Quantity_ConformalCoating_Edit"
                label="Số lượng board Tẩm phủ"
                type="number"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <InputField
                v-model="Quantity_Test1_Edit"
                label="Số lượng board Test 1"
                type="number"
              />
            </v-col>
            <v-col>
              <InputField
                v-model="Quantity_Test2_Edit"
                label="Số lượng board Test 2"
                type="number"
              />
            </v-col>
            <v-col>
              <InputField
                v-model="Quantity_OQC_Edit"
                label="Số lượng board OQC"
                type="number"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <ButtonCancel @cancel="DialogSettingSMT = false" />
          <ButtonSave @save="SaveEditSettingSMT()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog xác nhận xóa dữ liệu lịch sử sản xuất -->
    <v-dialog v-model="DialogRemoveHistory" width="400">
      <v-card max-width="400" prepend-icon="mdi-delete" title="Xoá dữ liệu">
        <v-card-text> Bạn có chắc chắn muốn xoá dữ liệu ? </v-card-text>
        <template v-slot:actions>
          <ButtonCancel @cancel="DialogRemoveHistory = false" />
          <ButtonDelete @delete="RemoveItemHistory()" />
        </template>
      </v-card>
    </v-dialog>

    <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
    <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
    <Loading v-model="DialogLoading" />
  </div>
</template>

<script setup>
import {
  ref,
  watch,
  reactive,
  computed,
  nextTick,
  onMounted,
  onUnmounted,
} from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import Chart from "chart.js/auto";
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonSave from "@/components/Button-Save.vue";
import InputSelect from "@/components/Input-Select.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import ButtonNextManufacture from "@/components/Button-Next-Manufacture.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";

// ... existing imports ...
import { useManufactureDetails } from "@/composables/Manufacture/useManufactureDetails";
import { useManufacture } from "@/composables/Manufacture/useManufacture";
import { useHistory } from "@/composables/Manufacture/useHistory";
import { useHistoryPart } from "@/composables/Manufacture/useHistoryPart";

// ... existing refs and constants ...
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const router = useRouter();
const id = route.params.id;

const { manufactureDetails, connectionStatus } = useManufactureDetails(id);
const { manufacture, manufactureFound, manufactureError, isConnected } =
  useManufacture();
const { history, historyError, refresh } = useHistory(id);
const { historyPart, historyPartError } = useHistoryPart(id);
// Dialog
const DialogSuccess = ref(false);
const DialogLoading = ref(false);
const DialogFailed = ref(false);
const DialogAdd = ref(false);
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const DialogRemoveHistory = ref(false);

const DialogSettingSMT = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// Production statistics
const NameManufacture = localStorage.getItem("ProductName");
const NameOrder = ref(null);
const GetID = ref(null);
const GetIDHistory = ref(null);
const GetSourceHistory = ref(null);

// Production statistics
const totalInput = ref(0);
const totalSMT_1 = ref(0);
const totalSMT_2 = ref(0);
const totalSMT_3 = ref(0);
const totalAOI = ref(0);
const totalRW = ref(0);
const totalIPQC = ref(0);
const totalIPQCSMT = ref(0);
const totalAssembly = ref(0);
const totalOQC = ref(0);
const totalTest1 = ref(0);
const totalTest2 = ref(0);
const totalBoxBuild = ref(0);
const totalConformalCoating = ref(0);
const totalWarehouse = ref(0);

const totalError = ref(0);
const totalAOIError = ref(0);
const totalRWError = ref(0);
const totalIPQCError = ref(0);
const totalIPQCSMTError = ref(0);
const totalAssemblyError = ref(0);
const totalOQCError = ref(0);
const totalTest1Error = ref(0);
const totalTest2Error = ref(0);
const totalBoxBuildError = ref(0);
const totalConformalCoatingError = ref(0);
const totalWarehouseError = ref(0);
const totalFixed = ref(0);

// Level
const Level_SMT = ref(false);
const Level_AOI = ref(0);
const Level_IPQC = ref(0);
const Level_Assembly = ref(0);
const Level_OQC = ref(0);
const Level_IPQCSMT = ref(0);
const Level_Test_1 = ref(0);
const Level_Test_2 = ref(0);
const Level_BoxBuild = ref(0);
const Level_ConformalCoating = ref(0);
const LevelSelectAdd = ref(null);

// Data
const DataManufacture = ref(null);
// ===== FORM ADD =====
const Type_Add = ref("");
const PONumber_Add = ref(localStorage.getItem("ProductName"));
const Name_Order_Add = ref("");
const Category_Add = ref("");
const Quantity_Plan_Add = ref("");
const CycleTime_Add = ref("");
const Note_Add = ref("");
const Date_DetailManufacture_Add = ref("");

// ===== FORM EDIT =====
const Type_Edit = ref("");
const PONumber_Edit = ref("");
const Name_Order_Edit = ref("");
const Category_Edit = ref("");
const Quantity_Plan_Edit = ref("");
const CycleTime_Edit = ref("");
const Note_Edit = ref("");

// ===== FORM SETTING SMT =====
const DelaySMT_Edit = ref(50);
const Quantity_Edit = ref(1);
const Quantity_IPQCSMT_Edit = ref(1);
const Quantity_IPQC_Edit = ref(1);
const Quantity_AOI_Edit = ref(1);
const Quantity_Assembly_Edit = ref(1);
const Quantity_BoxBuild_Edit = ref(1);
const Quantity_Test1_Edit = ref(1);
const Quantity_Test2_Edit = ref(1);
const Quantity_ConformalCoating_Edit = ref(1);
const Quantity_OQC_Edit = ref(1);

// Table
const searchHistory = ref("");
const page = ref(1);
const itemsPerPage = ref(15);

// Chart
const historyChart = ref(null);
const chartInstance = ref(null);

// Table
const HeadersHistory = [
  { title: "Ngày", key: "Created_At", sortable: true },
  { title: "Tên danh mục", key: "Category", sortable: true },
  { title: "Đầu vào", key: "Quantity_Plan", sortable: true },
  { title: "Đầu ra", key: "Quantity_Real", sortable: true },
  { title: "Hàng lỗi", key: "Quantity_Error", sortable: true },
  { title: "RW đã sửa", key: "Total_Fixed", sortable: true },
  { title: "Thao tác", key: "id", sortable: false },
];
const HeadersHistoryPart = [
  { title: "Mã hàng", key: "PartNumber", sortable: true },
  { title: "Vị trí", key: "Source", sortable: true },
  { title: "Trạng thái", key: "Status", sortable: true },
  { title: "Thời gian", key: "Timestamp", sortable: true },
  { title: "Ghi chú lỗi", key: "Note", sortable: true },
  { title: "Thời gian RW", key: "TimestampRW", sortable: true },
  { title: "Thao tác", key: "id", sortable: true },
];

// =============== Rules ============
const formRef = ref(null);
const isFormValid = ref(true);
const requiredRule = [(v) => !!v || "Dữ liệu này không được bỏ trống"];

// Watch for manufactureFound changes to update levels
watch(
  manufactureDetails,
  (newValue) => {
    if (newValue) {
      const data = Array.isArray(newValue) ? newValue[0] : newValue;

      if (data && data.Level) {
        DataManufacture.value = data.Level;

        Level_SMT.value = DataManufacture.value.includes("SMT");
        Level_AOI.value = DataManufacture.value.includes("AOI");
        Level_IPQC.value = DataManufacture.value.includes("IPQC");
        Level_Assembly.value = DataManufacture.value.includes("Assembly");
        Level_OQC.value = DataManufacture.value.includes("OQC");
        Level_IPQCSMT.value = DataManufacture.value.includes("IPQC (SMT)");
        Level_Test_1.value = DataManufacture.value.includes("Test 1");
        Level_Test_2.value = DataManufacture.value.includes("Test 2");
        Level_BoxBuild.value = DataManufacture.value.includes("Box Build");
        Level_ConformalCoating.value =
          DataManufacture.value.includes("Tẩm phủ");
      }
    }
  },
  { immediate: true, deep: true }
);

// Watch for manufactureDetails changes
watch(
  manufactureDetails,
  (newValue) => {
    if (newValue && typeof newValue === "object") {
      // Check if newValue is an array and has items
      if (Array.isArray(newValue) && newValue.length > 0) {
        const data = newValue[0]; // Get first item if it's an array
        console.log(data);
        totalInput.value = data.Total || 0;
        totalError.value = data.Quantity_Error || 0;
        totalFixed.value = data.Quantity_Fixed || 0;
        totalSMT_1.value = data.SMT_1 || 0;
        totalSMT_2.value = data.SMT_2 || 0;
        totalSMT_3.value = data.SMT_3 || 0;
        totalAOI.value = data.AOI || 0;
        totalRW.value = data.RW || 0;
        totalIPQC.value = data.IPQC || 0;
        totalAssembly.value = data.Assembly || 0;
        totalOQC.value = data.OQC || 0;
        totalTest1.value = data.Test1 || 0;
        totalTest2.value = data.Test2 || 0;
        totalBoxBuild.value = data.BoxBuild || 0;
        totalConformalCoating.value = data.ConformalCoating || 0;
        totalWarehouse.value = data.Warehouse || 0;
        totalIPQCSMT.value = data.IPQCSMT || 0;
        totalAOIError.value = data.AOIError || 0;
        totalRWError.value = data.RWError || 0;
        totalIPQCError.value = data.IPQCError || 0;
        totalIPQCSMTError.value = data.IPQCSMTError || 0;
        totalAssemblyError.value = data.AssemblyError || 0;
        totalOQCError.value = data.OQCError || 0;
        totalTest1Error.value = data.Test1Error || 0;
        totalTest2Error.value = data.Test2Error || 0;
        totalBoxBuildError.value = data.BoxBuildError || 0;
        totalConformalCoatingError.value = data.ConformalCotaingError || 0;
        totalWarehouseError.value = data.WarehouseError || 0;
        Quantity_Edit.value = data.Quantity;
        DelaySMT_Edit.value = data.DelaySMT;
        (Quantity_AOI_Edit.value = data.Quantity_AOI),
          (Quantity_Assembly_Edit.value = data.Quantity_Assembly),
          (Quantity_ConformalCoating_Edit.value =
            data.Quantity_ConformalCoating),
          (Quantity_IPQCSMT_Edit.value = data.Quantity_IPQCSMT),
          (Quantity_IPQC_Edit.value = data.Quantity_IPQC),
          (Quantity_Test1_Edit.value = data.Quantity_Test1),
          (Quantity_Test2_Edit.value = data.Quantity_Test2),
          (Quantity_BoxBuild_Edit.value = data.Quantity_BoxBuild),
          (Quantity_OQC_Edit.value = data.Quantity_OQC),
          (LevelSelectAdd.value = data.Level.split("-"));
        NameOrder.value = data.Name_Order;
        Name_Order_Add.value = data.Name_Order;
        Name_Order_Edit.value = data.Name_Order;
      } else {
        // If it's a single object
        totalInput.value = newValue.Total || 0;
        totalError.value = newValue.Quantity_Error || 0;
        totalSMT_1.value = newValue.SMT_1 || 0;
        totalSMT_2.value = newValue.SMT_2 || 0;
        totalSMT_3.value = newValue.SMT_3 || 0;
        totalAOI.value = newValue.AOI || 0;
        totalRW.value = newValue.RW || 0;
        totalIPQC.value = newValue.IPQC || 0;
        totalAssembly.value = newValue.Assembly || 0;
        totalOQC.value = newValue.OQC || 0;
        totalTest1.value = newValue.Test1 || 0;
        totalTest2.value = newValue.Test2 || 0;
        totalBoxBuild.value = newValue.BoxBuild || 0;
        totalConformalCoating.value = newValue.ConformalCoating || 0;
        totalWarehouse.value = newValue.Warehouse || 0;
        totalIPQCSMT.value = newValue.IPQCSMT || 0;
        totalAOIError.value = newValue.AOIError || 0;
        totalRWError.value = newValue.RWError || 0;
        totalIPQCError.value = newValue.IPQCError || 0;
        totalIPQCSMTError.value = newValue.IPQCSMTError || 0;
        totalAssemblyError.value = newValue.AssemblyError || 0;
        totalOQCError.value = newValue.OQCError || 0;
        totalTest1Error.value = newValue.Test1Error || 0;
        totalTest2Error.value = newValue.Test2Error || 0;
        totalBoxBuildError.value = newValue.BoxBuildError || 0;
        totalConformalCoatingError.value = newValue.ConformalCoatingError || 0;
        totalWarehouseError.value = newValue.WarehouseError || 0;
        Quantity_Edit.value = newValue.Quantity;
        DelaySMT_Edit.value = newValue.DelaySMT;
        (Quantity_AOI_Edit.value = newValue.Quantity_AOI),
          (Quantity_Assembly_Edit.value = newValue.Quantity_Assembly),
          (Quantity_ConformalCoating_Edit.value =
            newValue.Quantity_ConformalCoating),
          (Quantity_IPQCSMT_Edit.value = newValue.Quantity_IPQCSMT),
          (Quantity_IPQC_Edit.value = newValue.Quantity_IPQC),
          (Quantity_Test1_Edit.value = newValue.Quantity_Test1),
          (Quantity_Test2_Edit.value = newValue.Quantity_Test2),
          (Quantity_BoxBuild_Edit.value = newValue.Quantity_BoxBuild),
          (Quantity_OQC_Edit.value = newValue.Quantity_OQC),
          (NameOrder.value = newValue.Name_Order);
      }
    }
  },
  { immediate: true, deep: true }
);

// Watch for manufacture errors
watch(manufactureError, (error) => {
  if (error) {
    console.error("Manufacture error:", error);
    DialogFailed.value = true;
  }
});

// Initialize chart
onMounted(() => {
  nextTick(() => {
    fetchProductionData();
    // Initialize chart after a short delay to ensure DOM is ready
    setTimeout(() => {
      initializeChart();
    }, 500);
  });
});

// Cleanup chart on unmount
onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
  }
});

// ====== COMPUTED ======
const formattedSelectedDate = computed(() => {
  const date = new Date(Date_DetailManufacture_Add.value);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
});

// Computed percent Input and Output
const percent = computed(() => {
  if (totalInput.value === 0 || totalWarehouse.value === 0) {
    return 0;
  }
  return Math.round((totalWarehouse.value / totalInput.value) * 100);
});

const Time_Add = computed(() => {
  if (Quantity_Plan_Add.value === 0 || CycleTime_Add.value === 0) {
    return 0;
  }
  return ((Quantity_Plan_Add.value * CycleTime_Add.value) / 3600).toFixed(1);
});

const Time_Edit = computed(() => {
  if (Quantity_Plan_Edit.value === 0 || CycleTime_Edit.value === 0) {
    return 0;
  }
  return ((Quantity_Plan_Edit.value * CycleTime_Edit.value) / 3600).toFixed(1);
});

// Chart data computed property
const chartData = computed(() => {
  if (!historyPart.value || !Array.isArray(historyPart.value)) {
    return {
      labels: [],
      datasets: [],
    };
  }

  // Define the process steps we want to track with possible variations
  const processSteps = [
    "SMT - Printer",
    "SMT - Gắp linh kiện",
    "SMT - Lò Reflow",
    "IPQCSMT",
    "AOI",
    "Assembly",
    "Test1",
    "Test2",
    "IPQC",
    "BoxBuild",
    "Tẩm phủ",
    "OQC",
    "Nhập kho", // Add warehouse entry step
  ];

  // Create a mapping for different possible source values
  const sourceMapping = {
    "SMT - Printer": ["SMT - Printer", "SMT-Printer", "SMT_Printer", "Printer"],
    "SMT - Gắp linh kiện": [
      "SMT - Gắp linh kiện",
      "SMT-Gắp linh kiện",
      "SMT_Gắp linh kiện",
      "Gắp linh kiện",
    ],
    "SMT - Lò Reflow": [
      "SMT - Lò Reflow",
      "SMT-Lò Reflow",
      "SMT_Lò Reflow",
      "Lò Reflow",
      "Reflow",
    ],
    IPQCSMT: ["IPQCSMT", "IPQC SMT", "IPQC-SMT"],
    AOI: ["AOI"],
    Assembly: ["Assembly", "assembly", "Lắp ráp"],
    Test1: ["Test1", "Test 1", "Test-1"],
    Test2: ["Test2", "Test 2", "Test-2"],
    IPQC: ["IPQC"],
    BoxBuild: ["BoxBuild", "Box Build", "Box-Build"],
    "Tẩm phủ": ["Tẩm phủ", "Conformal Coating", "ConformalCoating"],
    OQC: ["OQC"],
    "Nhập kho": [
      "Nhập kho",
      "Warehouse",
      "warehouse",
      "Kho",
      "kho",
      "Warehouse Entry",
      "warehouse entry",
    ], // Add warehouse entry mapping
  };

  // Get manufacture details for quantity multipliers
  const manufactureData = manufactureDetails.value;
  const data = Array.isArray(manufactureData)
    ? manufactureData[0]
    : manufactureData;

  // Define quantity multipliers for each process step
  const quantityMultipliers = {
    "SMT - Printer": data?.Quantity || 1,
    "SMT - Gắp linh kiện": data?.Quantity || 1,
    "SMT - Lò Reflow": data?.Quantity || 1,
    IPQCSMT: data?.Quantity_IPQCSMT || 1,
    AOI: data?.Quantity_AOI || 1,
    Assembly: data?.Quantity_Assembly || 1,
    Test1: data?.Quantity_Test1 || 1,
    Test2: data?.Quantity_Test2 || 1,
    IPQC: data?.Quantity_IPQC || 1,
    BoxBuild: data?.Quantity_BoxBuild || 1,
    "Tẩm phủ": data?.Quantity_ConformalCoating || 1,
    OQC: data?.Quantity_OQC || 1,
    "Nhập kho": data?.Quantity_Warehouse || data?.Warehouse || 1, // Add warehouse quantity multiplier
  };

  // Initialize counters for each process step
  const processCounts = {};
  processSteps.forEach((step) => {
    processCounts[step] = { ok: 0, error: 0 };
  });

  // Count OK and error items for each process step
  historyPart.value.forEach((item) => {
    if (item.Source) {
      // Find the matching process step
      let matchedStep = null;

      // First pass for exact match
      for (const [step, variations] of Object.entries(sourceMapping)) {
        if (
          variations.some((v) => v.toLowerCase() === item.Source.toLowerCase())
        ) {
          matchedStep = step;
          break;
        }
      }

      // Second pass for containment match if no exact match
      if (!matchedStep) {
        for (const [step, variations] of Object.entries(sourceMapping)) {
          if (
            variations.some(
              (variation) =>
                item.Source.toLowerCase().includes(variation.toLowerCase()) ||
                variation.toLowerCase().includes(item.Source.toLowerCase())
            )
          ) {
            matchedStep = step;
            break;
          }
        }
      }

      if (matchedStep && processCounts[matchedStep]) {
        const status = item.Status?.toLowerCase();
        if (status === "ok" || status === "success" || status === "pass") {
          processCounts[matchedStep].ok++;
        } else if (
          status === "error" ||
          status === "fail" ||
          status === "failed"
        ) {
          processCounts[matchedStep].error++;
        }
      }
    }
  });

  // Prepare data for chart with quantity multiplication
  const labels = [];
  const okData = [];
  const errorData = [];

  processSteps.forEach((step) => {
    const counts = processCounts[step];
    const multiplier = quantityMultipliers[step] || 1;

    if (counts.ok > 0 || counts.error > 0) {
      labels.push(step);
      okData.push(counts.ok * multiplier);
      errorData.push(counts.error * multiplier);
    }
  });

  return {
    labels,
    datasets: [
      {
        label: "OK",
        data: okData,
        backgroundColor: "rgba(76, 175, 80, 0.8)",
        borderColor: "#4CAF50",
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
      {
        label: "Lỗi",
        data: errorData,
        backgroundColor: "rgba(244, 67, 54, 0.8)",
        borderColor: "#F44336",
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
    ],
  };
});

// Detail table data computed property
const chartDetailData = computed(() => {
  if (!historyPart.value || !Array.isArray(historyPart.value)) {
    return [];
  }

  // Define the process steps we want to track with possible variations
  const processSteps = [
    "SMT - Printer",
    "SMT - Gắp linh kiện",
    "SMT - Lò Reflow",
    "IPQCSMT",
    "AOI",
    "Assembly",
    "Test1",
    "Test2",
    "IPQC",
    "BoxBuild",
    "Tẩm phủ",
    "OQC",
    "Nhập kho", // Add warehouse entry step
  ];

  // Create a mapping for different possible source values
  const sourceMapping = {
    "SMT - Printer": ["SMT - Printer", "SMT-Printer", "SMT_Printer", "Printer"],
    "SMT - Gắp linh kiện": [
      "SMT - Gắp linh kiện",
      "SMT-Gắp linh kiện",
      "SMT_Gắp linh kiện",
      "Gắp linh kiện",
    ],
    "SMT - Lò Reflow": [
      "SMT - Lò Reflow",
      "SMT-Lò Reflow",
      "SMT_Lò Reflow",
      "Lò Reflow",
      "Reflow",
    ],
    IPQCSMT: ["IPQCSMT", "IPQC SMT", "IPQC-SMT"],
    AOI: ["AOI"],
    Assembly: ["Assembly", "assembly", "Lắp ráp"],
    Test1: ["Test1", "Test 1", "Test-1"],
    Test2: ["Test2", "Test 2", "Test-2"],
    IPQC: ["IPQC"],
    BoxBuild: ["BoxBuild", "Box Build", "Box-Build"],
    "Tẩm phủ": ["Tẩm phủ", "Conformal Coating", "ConformalCoating"],
    OQC: ["OQC"],
    "Nhập kho": [
      "Nhập kho",
      "Warehouse",
      "warehouse",
      "Kho",
      "kho",
      "Warehouse Entry",
      "warehouse entry",
    ], // Add warehouse entry mapping
  };

  // Get manufacture details for quantity multipliers
  const manufactureData = manufactureDetails.value;
  const data = Array.isArray(manufactureData)
    ? manufactureData[0]
    : manufactureData;

  // Define quantity multipliers for each process step
  const quantityMultipliers = {
    "SMT - Printer": data?.Quantity || 1,
    "SMT - Gắp linh kiện": data?.Quantity || 1,
    "SMT - Lò Reflow": data?.Quantity || 1,
    IPQCSMT: data?.Quantity_IPQCSMT || 1,
    AOI: data?.Quantity_AOI || 1,
    Assembly: data?.Quantity_Assembly || 1,
    Test1: data?.Quantity_Test1 || 1,
    Test2: data?.Quantity_Test2 || 1,
    IPQC: data?.Quantity_IPQC || 1,
    BoxBuild: data?.Quantity_BoxBuild || 1,
    "Tẩm phủ": data?.Quantity_ConformalCoating || 1,
    OQC: data?.Quantity_OQC || 1,
    "Nhập kho": data?.Quantity_Warehouse || data?.Warehouse || 1, // Add warehouse quantity multiplier
  };

  // Initialize counters for each process step
  const processCounts = {};
  processSteps.forEach((step) => {
    processCounts[step] = { ok: 0, error: 0 };
  });

  // Count OK and error items for each process step
  historyPart.value.forEach((item) => {
    if (item.Source) {
      // Find the matching process step
      let matchedStep = null;

      // First pass for exact match
      for (const [step, variations] of Object.entries(sourceMapping)) {
        if (
          variations.some((v) => v.toLowerCase() === item.Source.toLowerCase())
        ) {
          matchedStep = step;
          break;
        }
      }

      // Second pass for containment match if no exact match
      if (!matchedStep) {
        for (const [step, variations] of Object.entries(sourceMapping)) {
          if (
            variations.some(
              (variation) =>
                item.Source.toLowerCase().includes(variation.toLowerCase()) ||
                variation.toLowerCase().includes(item.Source.toLowerCase())
            )
          ) {
            matchedStep = step;
            break;
          }
        }
      }

      if (matchedStep && processCounts[matchedStep]) {
        const status = item.Status?.toLowerCase();
        if (status === "ok" || status === "success" || status === "pass") {
          processCounts[matchedStep].ok++;
        } else if (
          status === "error" ||
          status === "fail" ||
          status === "failed"
        ) {
          processCounts[matchedStep].error++;
        }
      }
    }
  });

  // Prepare data for detail table with quantity multiplication
  const detailData = [];
  processSteps.forEach((step) => {
    const counts = processCounts[step];
    const multiplier = quantityMultipliers[step] || 1;
    const total = counts.ok + counts.error;

    if (total > 0) {
      const okQuantity = counts.ok * multiplier;
      const errorQuantity = counts.error * multiplier;
      const totalQuantity = total * multiplier;
      const rate =
        totalQuantity > 0 ? Math.round((okQuantity / totalQuantity) * 100) : 0;

      detailData.push({
        process: step,
        ok: okQuantity,
        error: errorQuantity,
        total: totalQuantity,
        rate: rate,
        multiplier: multiplier,
      });
    }
  });

  // Sort by total quantity descending
  return detailData.sort((a, b) => b.total - a.total);
});

// Summary statistics computed properties
const totalChartOK = computed(() => {
  return chartDetailData.value.reduce((sum, item) => sum + item.ok, 0);
});

const totalChartError = computed(() => {
  return chartDetailData.value.reduce((sum, item) => sum + item.error, 0);
});

const overallRate = computed(() => {
  const total = totalChartOK.value + totalChartError.value;
  return total > 0 ? Math.round((totalChartOK.value / total) * 100) : 0;
});

// ===== && CycleTime

// ====== CRUD ========
const PushItem = (item) => {
  localStorage.setItem("ManufactureID", id);
  if (item.Type === "SMT") {
    router.push(`/San-xuat/SMT/${item.id}`);
  } else if (item.Type === "AOI") {
    router.push(`/San-xuat/AOI/${item.id}`);
  } else if (item.Type === "RW") {
    router.push(`/San-xuat/RW/${item.id}`);
  } else if (item.Type === "Assembly") {
    router.push(`/San-xuat/Assembly/${item.id}`);
  } else if (item.Type === "IPQC") {
    router.push(`/San-xuat/IPQC/${item.id}`);
  } else if (item.Type === "OQC") {
    router.push(`/San-xuat/OQC/${item.id}`);
  } else if (item.Type === "Test 1") {
    router.push(`/San-xuat/Test1/${item.id}`);
  } else if (item.Type === "Test 2") {
    router.push(`/San-xuat/Test2/${item.id}`);
  } else if (item.Type === "Box Build") {
    router.push(`/San-xuat/BoxBuild/${item.id}`);
  } else if (item.Type === "Tẩm phủ") {
    router.push(`/San-xuat/Conformal-Coating/${item.id}`);
  } else if (item.Type === "Nhập kho") {
    router.push(`/San-xuat/Nhap-kho/${item.id}`);
  } else if (item.Type === "IPQC (SMT)") {
    router.push(`/San-xuat/IPQCSMT/${item.id}`);
  }
};

const GetItem = (item) => {
  DialogEdit.value = true;
  Type_Edit.value = item.Type;
  PONumber_Edit.value = item.PONumber;
  Name_Order_Edit.value = item.Name_Order;
  Category_Edit.value = item.Category;
  Quantity_Plan_Edit.value = item.Quantity_Plan;
  CycleTime_Edit.value = item.CycleTime_Plan;
  Time_Edit.value = item.Time_Plan;
  Note_Edit.value = item.Note;
  GetID.value = item.id;
};

const GetItemHistory = (item) => {
  DialogRemoveHistory.value = true;
  GetIDHistory.value = item.id;
  if (
    item.Source == "SMT - Printer" ||
    item.Source == "SMT - Gắn linh kiện" ||
    item.Source == "SMT - Lò Reflow"
  ) {
    GetSourceHistory.value = "ManufactureSMT";
  } else if (item.Source == "Tẩm phủ") {
    GetSourceHistory.value = "ManufactureConformalCoating";
  } else if (item.Source == "Nhập kho") {
    GetSourceHistory.value = "ManufactureWareHouse";
  } else {
    GetSourceHistory.value = `Manufacture${item.Source}`;
  }
  console.log(GetSourceHistory.value);
};

const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Type: Type_Edit.value,
    PlanID: route.params.id,
    PONumber: PONumber_Edit.value,
    Category: Category_Edit.value,
    Quantity_Plan: Quantity_Plan_Edit.value,
    CycleTime_Plan: CycleTime_Edit.value,
    Time_Plan: Time_Edit.value,
    Note: Note_Edit.value,
    Created_At: formattedSelectedDate.value,
  });

  try {
    const response = await axios.put(
      `${Url}/Summary/Edit-item/${GetID.value}`,
      formData
    );
    console.log(response.data.message);
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    Error();
  }
};

// Hàm lưu thông tin chỉnh sửa
const SaveEditSettingSMT = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    DelaySMT: DelaySMT_Edit.value,
    Quantity: Quantity_Edit.value,
    Quantity_AOI: Quantity_AOI_Edit.value,
    Quantity_IPQCSMT: Quantity_IPQCSMT_Edit.value,
    Quantity_IPQC: Quantity_IPQC_Edit.value,
    Quantity_Assembly: Quantity_Assembly_Edit.value,
    Quantity_BoxBuild: Quantity_BoxBuild_Edit.value,
    Quantity_ConformalCoating: Quantity_ConformalCoating_Edit.value,
    Quantity_Test1: Quantity_Test1_Edit.value,
    Quantity_Test2: Quantity_Test2_Edit.value,
    Quantity_OQC: Quantity_OQC_Edit.value,
  });
  try {
    const response = await axios.put(
      `${Url}/PlanManufacture/Edit-Line/${id}`,
      formData
    );
    console.log(response.data.message);
    MessageDialog.value = response.data.message;
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = error.response.data.message;
    Error();
  }
};

/**
 * Saves new customer data
 * Makes an API call to create a new customer
 */

const SaveAdd = async () => {
  const result = await formRef.value.validate();

  if (!result.valid) {
    MessageErrorDialog.value = "Vui lòng điền đầy đủ thông tin!";
    DialogFailed.value = true; // hoặc hiển thị dialog báo lỗi
    return;
  }
  DialogLoading.value = true;
  const formData = reactive({
    Type: Type_Add.value,
    PlanID: route.params.id,
    PONumber: PONumber_Add.value,
    Category: Category_Add.value,
    Quantity_Plan: Quantity_Plan_Add.value,
    CycleTime_Plan: CycleTime_Add.value,
    Time_Plan: Time_Add.value,
    Note: Note_Add.value,
    Created_At: formattedSelectedDate,
  });

  try {
    const response = await axios.post(`${Url}/Summary/Add-item`, formData);
    console.log(response.data);
    MessageDialog.value = "Thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    Error();
  }
};

// Hàm xóa item
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Summary/Delete-item/${GetID.value}`
    );
    console.log(response.data.message);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bạị";
    Error();
  }
};

// Hàm xóa item lịch sử sản xuất
const RemoveItemHistory = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Manufacture/Delete-item-history/${GetIDHistory.value}?table=${GetSourceHistory.value}`
    );
    console.log(response.data.message);
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    console.log(error);
    MessageErrorDialog.value = "Xoá dữ liệu thất bạị";
    Error();
  }
};

function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  DialogLoading.value = false;
  DialogFailed.value = false;
  DialogRemove.value = false;
  DialogSettingSMT.value = false;
  DialogRemoveHistory.value = false;
  Type_Add.value = "";
  Category_Add.value = "";
  Quantity_Plan_Add.value = "";
  CycleTime_Add.value = "";
  Note_Add.value = "";
}

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
  DialogRemove.value = false;
  DialogSuccess.value = false;
  DialogEdit.value = false;
  DialogAdd.value = false;
  DialogSettingSMT.value = false;
  DialogRemoveHistory.value = false;
  Type_Add.value = "";
  Category_Add.value = "";
  Quantity_Plan_Add.value = "";
  CycleTime_Add.value = "";
  Note_Add.value = "";
}

// Update fetchProductionData to use the watcher
async function fetchProductionData() {
  try {
    DialogLoading.value = true;
    console.log("Current manufactureDetails:", manufactureDetails.value); // Debug current value
  } catch (error) {
    console.error("Error fetching production data:", error);
    DialogFailed.value = true;
  } finally {
    DialogLoading.value = false;
  }
}

// Chart functions
const initializeChart = () => {
  if (!historyChart.value) return;
  // Kiểm tra dữ liệu chartData trước khi khởi tạo chart
  if (
    !chartData.value ||
    !Array.isArray(chartData.value.labels) ||
    !Array.isArray(chartData.value.datasets) ||
    chartData.value.labels.length === 0 ||
    chartData.value.datasets.length === 0
  ) {
    console.warn(
      "Chart data invalid, skipping chart initialization",
      chartData.value
    );
    // Nếu đã có chartInstance thì destroy để tránh lỗi
    if (chartInstance.value) {
      chartInstance.value.destroy();
      chartInstance.value = null;
    }
    return;
  }

  // Destroy existing chart if it exists
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }

  const ctx = historyChart.value.getContext("2d");

  chartInstance.value = new Chart(ctx, {
    type: "bar",
    data: chartData.value,
    options: {
      indexAxis: "y", // This makes it horizontal
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        title: {
          display: true,
          text: "Thống kê theo công đoạn sản xuất",
          font: {
            size: 16,
            weight: "bold",
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        tooltip: {
          callbacks: {
            title: function (tooltipItems) {
              const process = tooltipItems[0].label;
              const okValue =
                tooltipItems[0].dataset.data[tooltipItems[0].dataIndex];
              const errorValue =
                tooltipItems[1]?.dataset?.data[tooltipItems[0].dataIndex] || 0;
              const totalValue = okValue + errorValue;
              const percentage =
                totalValue > 0 ? ((okValue / totalValue) * 100).toFixed(1) : 0;

              return [
                `Công đoạn: ${process}`,
                `OK: ${new Intl.NumberFormat("vi-VN").format(
                  okValue
                )} sản phẩm`,
                `Lỗi: ${new Intl.NumberFormat("vi-VN").format(
                  errorValue
                )} sản phẩm`,
                `Tổng: ${new Intl.NumberFormat("vi-VN").format(
                  totalValue
                )} sản phẩm`,
                `Tỷ lệ thành công: ${percentage}%`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          stacked: false,
          title: {
            display: true,
            text: "Số lượng sản phẩm",
            font: {
              weight: "bold",
            },
          },
          ticks: {
            callback: function (value) {
              return new Intl.NumberFormat("vi-VN").format(value);
            },
          },
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
        },
        y: {
          stacked: false,
          title: {
            display: true,
            text: "Công đoạn",
            font: {
              weight: "bold",
            },
          },
          grid: {
            display: false,
          },
          ticks: {
            display: true,
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
      },
      layout: {
        padding: {
          left: 20,
        },
      },
    },
  });
};

const updateChart = () => {
  if (chartInstance.value) {
    chartInstance.value.data = chartData.value;
    chartInstance.value.update();
  }
};

// Add watcher for history changes
watch(
  history,
  (newHistory) => {
    console.log("History data updated:", newHistory);
  },
  { deep: true }
);

// Add watcher for historyPart changes to update chart
watch(
  historyPart,
  (newHistoryPart) => {
    console.log("HistoryPart data updated:", newHistoryPart);
    // Debug: Log first few items to understand data structure
    if (newHistoryPart && newHistoryPart.length > 0) {
      console.log("First 3 historyPart items:", newHistoryPart.slice(0, 3));
      console.log("Available Source values:", [
        ...new Set(newHistoryPart.map((item) => item.Source)),
      ]);
      console.log("Available Status values:", [
        ...new Set(newHistoryPart.map((item) => item.Status)),
      ]);
    }
    if (chartInstance.value) {
      updateChart();
    }
  },
  { deep: true }
);

// Add watcher for chartData changes
watch(
  chartData,
  (newChartData) => {
    if (chartInstance.value && newChartData.labels.length > 0) {
      updateChart();
    }
  },
  { deep: true }
);

// Add watcher for history errors
watch(historyError, (error) => {
  if (error) {
    console.error("History error:", error);
    DialogFailed.value = true;
    MessageErrorDialog.value = error;
  }
});
</script>
<script>
export default {
  components: {
    ButtonBack,
    ButtonEye,
    InputSearch,
    InputField,
    InputFiles,
    ButtonImportFile,
    ButtonDownload,
    ButtonNextManufacture,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
  },
};
</script>

<style scoped>
.manufacture-detail {
  background-color: #f5f5f5;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.v-data-table-virtual {
  border-radius: 12px;
  overflow: hidden;
}

.v-progress-linear {
  border-radius: 8px;
}

/* Dialog styles */
.v-dialog .v-card {
  border-radius: 16px;
}

.v-dialog .v-card-title {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

/* Table styles */
.v-data-table-virtual .v-table {
  border-radius: 12px;
  overflow: hidden;
}

.v-data-table-virtual .v-table__wrapper {
  border-radius: 12px;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Chart styles */
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.chart-container canvas {
  max-height: 100%;
  max-width: 100%;
}

/* Detail table styles */
.detail-table-container {
  height: 400px;
  overflow-y: auto;
  padding: 8px;
  background: white;
  border-radius: 8px;
}

.detail-table-container .v-table {
  font-size: 0.75rem;
}

.detail-table-container .v-table th {
  font-weight: 600;
  color: #1976d2;
  background-color: #f5f5f5;
}

.detail-table-container .v-table td {
  padding: 8px 4px;
  border-bottom: 1px solid #e0e0e0;
}

.detail-table-container .v-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* Custom scrollbar for detail table */
.detail-table-container::-webkit-scrollbar {
  width: 6px;
}

.detail-table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.detail-table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.detail-table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Card height alignment */
.h-100 {
  height: 100%;
}

/* Ensure cards have same height in row */
.v-row .v-col .v-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.v-row .v-col .v-card .v-card-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
