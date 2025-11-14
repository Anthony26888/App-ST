<template lang="">
  <v-card
    variant="text"
    class="overflow-y-auto"
    height="calc(100vh)"
    v-if="lgAndUp"
  >
    <v-card-title class="d-flex justify-space-between align-center pa-4">
      <span class="text-h4 font-weight-light">Báo cáo hằng ngày</span>
      <v-spacer></v-spacer>
      <v-toolbar rounded="lg" border floating class="mt-3">
        <div class="d-flex align-center px-4">
          <div class="text-subtitle-1 mr-4">
            {{ formattedWeekDate }}
          </div>
          <v-menu
            v-model="dateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            min-width="auto"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                class="text-subtitle-1"
                prepend-icon="mdi-calendar"
              >
                {{ formattedSelectedDate }}
              </v-btn>
            </template>
            <v-date-picker
              v-model="selectedDate"
              @update:model-value="dateMenu = false"
              :first-day-of-week="1"
            ></v-date-picker>
          </v-menu>
        </div>
      </v-toolbar>
    </v-card-title>

    <!-- Thống kê tổng quan -->
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-xl" color="primary" variant="tonal">
            <v-card-text>
              <div
                class="text-subtitle-1 d-flex justify-space-between align-center"
              >
                Tổng số PO
                <v-icon
                  :color="
                    Percent_Compare_Po > 0
                      ? 'success'
                      : Percent_Compare_Po < 0
                      ? 'error'
                      : 'warning'
                  "
                  :icon="
                    Percent_Compare_Po > 0
                      ? 'mdi-arrow-up'
                      : Percent_Compare_Po < 0
                      ? 'mdi-arrow-down'
                      : 'mdi-minus'
                  "
                  size="small"
                ></v-icon>
              </div>
              <div class="text-h4 font-weight-bold">
                {{ Total_Po_Today }}
              </div>
              <div
                class="text-caption text-success"
                v-if="Percent_Compare_Po > 0"
              >
                {{ Percent_Compare_Po }} % vs hôm qua
              </div>
              <div
                class="text-caption text-error"
                v-else-if="Percent_Compare_Po < 0"
              >
                {{ Percent_Compare_Po }} % vs hôm qua
              </div>
              <div class="text-caption text-warning" v-else>
                100% vs hôm qua
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-xl" color="info" variant="tonal">
            <v-card-text>
              <div
                class="text-subtitle-1 d-flex justify-space-between align-center"
              >
                Tổng số hạng mục
                <v-icon
                  :color="
                    Percent_Compare_Category > 0
                      ? 'success'
                      : Percent_Compare_Category < 0
                      ? 'error'
                      : 'warning'
                  "
                  :icon="
                    Percent_Compare_Category > 0
                      ? 'mdi-arrow-up'
                      : Percent_Compare_Category < 0
                      ? 'mdi-arrow-down'
                      : 'mdi-minus'
                  "
                  size="small"
                ></v-icon>
              </div>
              <div class="text-h4 font-weight-bold">
                {{ Total_Category_Today }}
              </div>
              <div
                class="text-caption text-success"
                v-if="Percent_Compare_Category > 0"
              >
                {{ Percent_Compare_Category }} % vs hôm qua
              </div>
              <div
                class="text-caption text-error"
                v-else-if="Percent_Compare_Category < 0"
              >
                {{ Percent_Compare_Category }} % vs hôm qua
              </div>
              <div class="text-caption text-warning" v-else>
                100% vs hôm qua
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-xl" color="success" variant="tonal">
            <v-card-text>
              <div
                class="text-subtitle-1 d-flex justify-space-between align-center"
              >
                Hạng mục hoàn thành
                <v-icon
                  icon="mdi-check-circle"
                  color="success"
                  size="small"
                ></v-icon>
              </div>
              <div class="text-h4 font-weight-bold">
                {{
                  summary?.filter((item) => Number(item.Percent) >= 100)
                    .length || 0
                }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Đạt mục tiêu:
                {{
                  ((summary?.filter((item) => Number(item.Percent) >= 100)
                    .length || 0) /
                    Total_Category_Today) *
                  100
                }}
                %
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-xl" color="warning" variant="tonal">
            <v-card-text>
              <div
                class="text-subtitle-1 d-flex justify-space-between align-center"
              >
                Dự án đang thực hiện
                <v-icon
                  icon="mdi-clock-time-three-outline"
                  color="warning"
                  size="small"
                ></v-icon>
              </div>
              <div class="text-h4 font-weight-bold">
                {{
                  summary?.filter((item) => Number(item.Percent) < 100)
                    .length || 0
                }}
              </div>
              <div class="text-caption text-error font-weight-bold">
                Đang trễ
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts -->
      <v-row>
        <v-col cols="12" md="8">
          <v-card class="mb-4 rounded-xl" elevation="2" height="500px">
            <v-toolbar flat dense>
              <v-toolbar-title>
                <v-icon
                  color="primary"
                  icon="mdi-chart-bar"
                  size="x-small"
                  start
                ></v-icon>
                Biểu đồ kế hoạch và thực tế
              </v-toolbar-title>
            </v-toolbar>
            <v-card-text>
              <StackedBarChart
                :labels="progress"
                :passData="passList"
                :failData="failList"
                :planData="planList"
              />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <!-- Thay thế pie chart bằng bảng chi tiết công đoạn -->
          <v-card class="mb-4 rounded-xl" elevation="2" height="500px">
            <v-toolbar flat dense>
              <v-toolbar-title>
                <v-icon
                  color="primary"
                  icon="mdi-book-multiple"
                  size="x-small"
                  start
                ></v-icon>
                Chi tiết theo công đoạn
              </v-toolbar-title>
            </v-toolbar>
            <v-card-text class="pa-4">
              <div class="detail-table-container">
                <v-table density="compact" class="elevation-1 rounded">
                  <thead>
                    <tr>
                      <th class="text-left text-caption">Loại</th>
                      <th class="text-center text-caption">Tổng Pass</th>
                      <th class="text-center text-caption">Tổng Fail</th>
                      <th class="text-center text-caption">Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in summaryDetailByType"
                      :key="index"
                    >
                      <td class="text-caption font-weight-medium">
                        {{ item.type }}
                      </td>
                      <td class="text-center">
                        <v-chip size="x-small" color="success" variant="tonal">
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
                    <span class="text-caption">Tổng Pass:</span>
                    <v-chip size="small" color="success" variant="tonal">
                      {{ totalSummaryOK }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-caption">Tổng Fail:</span>
                    <v-chip size="small" color="error" variant="tonal">
                      {{ totalSummaryError }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-caption">Tỷ lệ chung:</span>
                    <v-chip
                      size="small"
                      :color="
                        overallSummaryRate >= 95
                          ? 'success'
                          : overallSummaryRate >= 80
                          ? 'warning'
                          : 'error'
                      "
                      variant="tonal"
                    >
                      {{ overallSummaryRate }}%
                    </v-chip>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Bảng dữ liệu -->
      <v-data-table-virtual
        :headers="Headers"
        :items="summary"
        :search="search"
        :group-by="[{ key: 'Type' }]"
        class="mt-3 rounded-xl"
        fixed-header
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
      >
        <template v-slot:top>
          <v-toolbar flat dense>
            <v-toolbar-title>
              <v-icon
                color="primary"
                icon="mdi-book-multiple"
                size="x-small"
                start
              ></v-icon>
              Báo cáo chi tiết
            </v-toolbar-title>
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
        <template v-slot:item.Percent="{ item }">
          <v-progress-linear
            v-model="item.Percent"
            height="25"
            color="success"
            rounded
            class="rounded-lg"
          >
            <strong>{{ item.Percent.toFixed(1) }}%</strong>
          </v-progress-linear>
        </template>
      </v-data-table-virtual>

      <!-- Bảng dữ liệu tỷ lệ lỗi -->
      <v-row>
        <v-col lg="7" md="12">
          <v-data-table-virtual
            :headers="HeadersError"
            :items="Manufacture_Fail"
            :group-by="[{ key: 'PONumber' }]"
            class="mt-5 rounded-xl"
            fixed-header
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
            height="435px"
          >
            <template v-slot:top>
              <v-toolbar flat dense>
                <v-toolbar-title>
                  <v-icon
                    color="primary"
                    icon="mdi-book-multiple"
                    size="x-small"
                    start
                  ></v-icon>
                  Tỷ lệ lỗi trong đơn hàng
                </v-toolbar-title>
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

            <template #[`item.Total_Summary_ID`]="{ item }">
              <v-chip color="success" variant="tonal">{{
                item.Total_Summary_ID
              }}</v-chip>
            </template>
            <template #[`item.Quantity_Error`]="{ item }">
              <v-chip color="warning" variant="tonal">{{
                item.Quantity_Error
              }}</v-chip>
            </template>
            <template #[`item.Percent_Error`]="{ item }">
              <v-progress-linear
                :model-value="Number(item.Percent_Error)"
                height="25"
                color="success"
                class="rounded-lg"
              >
                <strong>{{ Number(item.Percent_Error).toFixed(1) }}%</strong>
              </v-progress-linear>
            </template>
          </v-data-table-virtual>
        </v-col>
        <v-col lg="5" md="12">
          <v-card class="mb-4 rounded-xl mt-5" elevation="2" height="500px">
            <v-toolbar flat dense>
              <v-toolbar-title>
                <v-icon
                  color="primary"
                  icon="mdi-chart-donut"
                  size="x-small"
                  start
                ></v-icon>
                Biểu đồ thông tin lỗi
              </v-toolbar-title>
            </v-toolbar>
            <v-card-text>
              <v-pie
                :items="pieItems"
                :legend="{
                  position: $vuetify.display.mdAndUp ? 'right' : 'bottom',
                }"
                :tooltip="{ subtitleFormat: '[value]%' }"
                class="pa-3 mt-3 justify-center"
                gap="2"
                inner-cut="70"
                item-key="id"
                rounded="2"
                size="300"
                animation
                hide-slice
                reveal
              >
                <template v-slot:center>
                  <div class="text-center">
                    <div class="text-h3">{{ summaryFail.length }}</div>
                    <div class="opacity-70 mt-1 mb-n1">Tổng</div>
                  </div>
                </template>
              </v-pie>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <!-- Mobile -->

  <v-card
    variant="text"
    class="overflow-y-auto"
    height="calc(100vh - 80px)"
    v-else
  >
    <v-card-title class="d-flex justify-space-between align-center pa-4">
      <v-toolbar rounded="lg" border floating class="mt-3">
        <div class="d-flex align-center px-4">
          <div class="text-subtitle-1 mr-4">
            {{ formattedWeekDate }}
          </div>
          <v-menu
            v-model="dateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            min-width="auto"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                class="text-subtitle-1"
                prepend-icon="mdi-calendar"
              >
                {{ formattedSelectedDate }}
              </v-btn>
            </template>
            <v-date-picker
              v-model="selectedDate"
              @update:model-value="dateMenu = false"
              :first-day-of-week="1"
            ></v-date-picker>
          </v-menu>
        </div>
      </v-toolbar>
    </v-card-title>

    <!-- Thống kê tổng quan -->
    <v-card-text>
      <v-row>
        <v-col cols="6">
          <v-card class="rounded-lg" color="primary" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Tổng số PO</div>
              <div class="text-h4 font-weight-bold">
                {{ summary?.map((item) => item.PONumber).length || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-card class="rounded-lg" color="info" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Tổng số hạng mục</div>
              <div class="text-h4 font-weight-bold">
                {{ summary?.map((item) => item.Category).length || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="6">
          <v-card class="rounded-lg" color="success" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Dự án hoàn thành</div>
              <div class="text-h4 font-weight-bold">
                {{
                  summary?.filter((item) => Number(item.Percent) >= 100)
                    .length || 0
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-card class="rounded-lg" color="warning" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Đang thực hiện</div>
              <div class="text-h4 font-weight-bold">
                {{
                  summary?.filter((item) => Number(item.Percent) < 100)
                    .length || 0
                }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts -->
      <v-row>
        <v-col cols="12" md="12">
          <!-- Thay thế pie chart bằng bảng chi tiết công đoạn -->
          <v-card class="mb-4 rounded-xl" elevation="2" height="500px">
            <v-toolbar flat dense>
              <v-toolbar-title>
                <v-icon
                  color="primary"
                  icon="mdi-book-multiple"
                  size="x-small"
                  start
                ></v-icon>
                Chi tiết theo công đoạn
              </v-toolbar-title>
            </v-toolbar>
            <v-card-text class="pa-4">
              <div class="detail-table-container">
                <v-table density="compact" class="elevation-1 rounded">
                  <thead>
                    <tr>
                      <th class="text-left text-caption">Loại</th>
                      <th class="text-center text-caption">Tổng Pass</th>
                      <th class="text-center text-caption">Tổng Fail</th>
                      <th class="text-center text-caption">Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in summaryDetailByType"
                      :key="index"
                    >
                      <td class="text-caption font-weight-medium">
                        {{ item.type }}
                      </td>
                      <td class="text-center">
                        <v-chip size="x-small" color="success" variant="tonal">
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
                    <span class="text-caption">Tổng Pass:</span>
                    <v-chip size="small" color="success" variant="tonal">
                      {{ totalSummaryOK }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="text-caption">Tổng Fail:</span>
                    <v-chip size="small" color="error" variant="tonal">
                      {{ totalSummaryError }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between align-center">
                    <span class="text-caption">Tỷ lệ chung:</span>
                    <v-chip
                      size="small"
                      :color="
                        overallSummaryRate >= 95
                          ? 'success'
                          : overallSummaryRate >= 80
                          ? 'warning'
                          : 'error'
                      "
                      variant="tonal"
                    >
                      {{ overallSummaryRate }}%
                    </v-chip>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Bảng dữ liệu -->
      <v-data-table-virtual
        :headers="Headers"
        :items="summary"
        :search="search"
        :group-by="[{ key: 'Type' }]"
        class="mt-3"
        fixed-header
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
      >
        <template v-slot:top>
          <v-toolbar flat dense>
            <v-toolbar-title>
              <v-icon
                color="primary"
                icon="mdi-book-multiple"
                size="x-small"
                start
              ></v-icon>
              Báo cáo chi tiết
            </v-toolbar-title>
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
        <template v-slot:item.Percent="{ item }">
          <v-progress-linear v-model="item.Percent" height="25" color="success">
            <strong>{{ item.Percent.toFixed(1) }}%</strong>
          </v-progress-linear>
        </template>
      </v-data-table-virtual>

      <!-- Bảng dữ liệu tỷ lệ lỗi -->
      <v-data-table-virtual
        :headers="HeadersError"
        :items="Manufacture_Fail"
        :group-by="[{ key: 'PONumber' }]"
        class="mt-5"
        fixed-header
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
        elevation="2"
      >
        <template v-slot:top>
          <v-toolbar flat dense>
            <v-toolbar-title>
              <v-icon
                color="primary"
                icon="mdi-book-multiple"
                size="x-small"
                start
              ></v-icon>
              Tỷ lệ lỗi trong đơn hàng
            </v-toolbar-title>
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
        <template #[`item.Total_Summary_ID`]="{ item }">
          <v-chip color="success" variant="tonal">{{
            item.Total_Summary_ID
          }}</v-chip>
        </template>
        <template #[`item.Quantity_Error`]="{ item }">
          <v-chip color="warning" variant="tonal">{{
            item.Quantity_Error
          }}</v-chip>
        </template>
        <template #[`item.Percent_Error`]="{ item }">
          <v-progress-linear
            :model-value="Number(item.Percent_Error)"
            height="25"
            color="success"
            class="rounded-lg"
          >
            <strong>{{ Number(item.Percent_Error).toFixed(1) }}%</strong>
          </v-progress-linear>
        </template>
      </v-data-table-virtual>
      <v-card class="mb-4 rounded-xl mt-5" elevation="2" height="500px">
        <v-toolbar flat dense>
          <v-toolbar-title>
            <v-icon
              color="primary"
              icon="mdi-chart-donut"
              size="x-small"
              start
            ></v-icon>
            Biểu đồ kế hoạch và thực tế
          </v-toolbar-title>
        </v-toolbar>
        <v-card-text>
          <v-pie
            :items="pieItems"
            :legend="{
              position: $vuetify.display.mdAndUp ? 'right' : 'bottom',
            }"
            :tooltip="{ subtitleFormat: '[value]%' }"
            class="pa-3 mt-3 justify-center"
            gap="2"
            inner-cut="70"
            item-key="id"
            rounded="2"
            size="300"
            animation
            hide-slice
            reveal
          >
            <template v-slot:center>
              <div class="text-center">
                <div class="text-h3">{{ summaryFail.length }}</div>
                <div class="opacity-70 mt-1 mb-n1">Tổng</div>
              </div>
            </template>
          </v-pie>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { useRouter } from "vue-router";
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";
import Chart from "chart.js/auto";
import { useDisplay } from "vuetify";

// Components

import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import StackedBarChart from "@/components/Chart-StackedBar-PageSummary.vue";

// Composables
import { useSummary } from "@/composables/Summary/useSummary";
import { useCompareSummary } from "@/composables/Summary/useCompareSummary";
import { useSummaryFail } from "@/composables/Summary/useSummaryFail";

// import { useActived } from "@/composables/Summary/useActived";

// ===== STATE MANAGEMENT =====
const { mdAndDown, lgAndUp } = useDisplay();
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Router
const router = useRouter();

// Initialize composables

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogSuccess = ref(false); // Success notification
const DialogFailed = ref(false); // Error notification
const DialogLoading = ref(false); // Loading state
// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// =======Data Summary ========
const Total_Category_Today = ref(0);
const Total_Po_Today = ref(0);
const Percent_Compare_Po = ref(0);
const Percent_Compare_Category = ref(0);
const Manufacture_Fail = ref([]);

// ===== Table States =====
const search = ref("");
const itemsPerPage = ref(15);
const page = ref(1);
const Headers = ref([
  { key: "PONumber", title: "Dự án", width: "150" },
  { key: "Name_Order", title: "Đơn hàng", width: "150" },
  { key: "Category", title: "Hạng mục", width: "200" },
  {
    title: "Kế hoạch",
    align: "center",
    children: [
      { title: "Vòng lập (s)", key: "CycleTime_Plan" },
      { title: "Thời gian (s)", key: "Time_Plan" },
      { title: "Đầu vào (pcs)", key: "Quantity_Plan" },
    ],
  },
  {
    title: "Thực tế",
    align: "center",
    children: [
      { title: "Đầu ra (pcs)", key: "Quantity_Real" },
      { title: "Phần trăm (%)", key: "Percent" },
      { title: "Ghi chú", key: "Note" },
    ],
  },
]);

const HeadersError = ref([
  { key: "Category", title: "Dự án" },
  { key: "Type", title: "Công đoạn" },
  { key: "Total_Summary_ID", title: "SL đã sản xuất" },
  { key: "Quantity_Error", title: "Hàng lỗi" },
  { key: "Percent_Error", title: "Tỷ lệ lỗi" },
]);

const HeadersActived = [
  { title: "Tên thiết bị", key: "Device" },
  { title: "Công đoạn", key: "Source" },
  { title: "Trạng thái", key: "status" },
  { title: "Lần cuối online", key: "LatestTimestamp" },
];

// ===== COMPUTED =======

// Tổng hợp dữ liệu summary theo Type (loại)
const summaryDetailByType = computed(() => {
  if (!summary.value || !Array.isArray(summary.value)) return [];
  // Giả sử Quantity_Real là OK, Quantity_Error là lỗi (nếu có)
  // Nếu không có Quantity_Error, sẽ lấy 0
  const grouped = {};
  summary.value.forEach((item) => {
    const type = item.Type || "Không phân loại";
    if (!grouped[type]) {
      grouped[type] = { ok: 0, error: 0 };
    }
    grouped[type].ok += Number(item.Quantity_Real) || 0;
    grouped[type].error += Number(item.Quantity_Error) || 0;
  });
  return Object.entries(grouped).map(([type, { ok, error }]) => {
    const total = ok + error;
    const rate = total > 0 ? Math.round((ok / total) * 100) : 0;
    return { type, ok, error, rate };
  });
});

const totalSummaryOK = computed(() => {
  return summaryDetailByType.value.reduce((sum, item) => sum + item.ok, 0);
});
const totalSummaryError = computed(() => {
  return summaryDetailByType.value.reduce((sum, item) => sum + item.error, 0);
});
const overallSummaryRate = computed(() => {
  const total = totalSummaryOK.value + totalSummaryError.value;
  return total > 0 ? Math.round((totalSummaryOK.value / total) * 100) : 0;
});

// format date for v-data-picker
const dateMenu = ref(false);
const selectedDate = ref(new Date());

const formattedSelectedDate = computed(() => {
  const date = selectedDate.value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});
const formattedWeekDate = computed(() => {
  const selectedDateObj = new Date(selectedDate.value);
  const day = selectedDateObj.getDay();
  const diff = selectedDateObj.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(selectedDateObj);
  monday.setDate(diff);

  const getWeekNumber = (d) => {
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const weekNumber = getWeekNumber(monday);
  const weekday = selectedDateObj.toLocaleDateString("vi-VN", {
    weekday: "long",
    timeZone: "Asia/Bangkok",
  });

  return `Tuần ${weekNumber} - ${weekday}`;
});

// Pass the computed ref to useSummary

const { summary, summaryError } = useSummary(formattedSelectedDate);
const { compareSummary } = useCompareSummary(formattedSelectedDate);
const { summaryFail, summaryFailError } = useSummaryFail(formattedSelectedDate);
// const { status, statusError } = useActived();

// Hàm tính số giây chênh lệch giữa hiện tại và timestamp dạng dd/MM/yyyy HH:mm:ss
const getTimeDifference = (timestamp) => {
  if (!timestamp) return Infinity;
  const now = new Date();
  // Nếu timestamp là dạng "26/07/2025 14:08:39"
  const [datePart, timePart] = timestamp.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  const itemTime = new Date(year, month - 1, day, hour, minute, second);
  return Math.abs((now - itemTime) / 1000);
};

// Watch for errors
watch(summaryError, (error) => {
  if (error) {
    MessageErrorDialog.value = error;
    DialogFailed.value = true;
  }
});

watch(
  summary,
  (newValue) => {
    if (Array.isArray(newValue) && newValue.length > 0) {
      // Lọc các phần tử có Quantity_Error > 0
      Manufacture_Fail.value = newValue.filter(
        (item) => Number(item.Quantity_Error) > 0
      );
    } else {
      // Nếu mảng rỗng hoặc không hợp lệ, reset lại
      Manufacture_Fail.value = [];
    }
  },
  { immediate: true, deep: true }
);

watch(
  compareSummary,
  (newValue) => {
    if (newValue && typeof newValue === "object") {
      // Check if newValue is an array and has items
      if (Array.isArray(newValue) && newValue.length > 0) {
        const data = newValue[0]; // Get first item if it's an array
        Total_Category_Today.value = data.Today_Total_Category;
        Total_Po_Today.value = data.Today_Total_PONumber;
        Percent_Compare_Category.value = data.Category_Trend_Percent;
        Percent_Compare_Po.value = data.PONumber_Trend_Percent;
      } else {
        // If it's a single object
        Total_Category_Today.value = newValue.Today_Total_Category || 0;
        Total_Po_Today.value = newValue.Today_Total_PONumber || 0;
        Percent_Compare_Category.value = newValue.Category_Trend_Percent || 0;
        Percent_Compare_Po.value = newValue.PONumber_Trend_Percent || 0;
      }
    }
  },
  { immediate: true, deep: true }
);

// Add debug logging

// ===== CHART CONFIGURATION =====s
const progress = computed(() =>
  summary.value.map((item) => item.Category || 0)
);

const passList = computed(() =>
  summary.value.map((item) => Number(item.Quantity_Real || 0))
);

const failList = computed(() =>
  summary.value.map((item) => Number(item.Quantity_Error || 0))
);

const planList = computed(() =>
  summary.value.map((item) => Number(item.Quantity_Plan || 0))
);

const progressFail = computed(() =>
  Manufacture_Fail.value.map((item) => item.Category || 0)
);

const failListTable = computed(() =>
  Manufacture_Fail.value.map((item) => Number(item.Quantity_Error || 0))
);

const summaryFailChart = ref({
  "Lỗi hàn": 0,
  "Lỗi linh kiện": 0,
  "Lỗi ngoại quan": 0,
  "Lỗi chức năng": 0,
  "Lỗi lắp ráp cơ khí": 0,
  "Lỗi quy trình / Vận hành": 0,
  "Lỗi không xác định": 0, // bản ghi GroupFail rỗng/null
});

watch(
  summaryFail,
  (newVal) => {
    if (!Array.isArray(newVal)) return;

    // Reset lại thống kê
    for (const key in summaryFailChart.value) {
      summaryFailChart.value[key] = 0;
    }

    // Duyệt từng bản ghi
    newVal.forEach((item) => {
      if (item.GroupFail && item.GroupFail.trim() !== "") {
        const errors = item.GroupFail.split(",").map((e) => e.trim());
        errors.forEach((err) => {
          if (summaryFailChart.value[err] !== undefined) {
            summaryFailChart.value[err]++;
          }
        });
      } else {
        // Không có GroupFail → đếm vào "Lỗi không xác định"
        summaryFailChart.value["Lỗi không xác định"]++;
      }
    });
  },
  { immediate: true, deep: true }
);

// Pie chart items
const pieItems = computed(() => {
  const colors = [
    "rgba(255,99,132,0.8)",
    "rgba(255,159,64,0.8)",
    "rgba(255,205,86,0.8)",
    "rgba(75,192,192,0.8)",
    "rgba(54,162,235,0.8)",
    "rgba(153,102,255,0.8)",
    "rgba(200,200,200,0.5)", // màu cho "Lỗi không xác định"
  ];

  const entries = Object.entries(summaryFailChart.value).filter(
    ([_, value]) => Number.isFinite(value) && value > 0
  );

  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  // Trường hợp không có lỗi nào
  if (total === 0) {
    return [
      {
        id: 1,
        title: "Không lỗi",
        value: 100,
        count: 0,
        color: "rgba(200,200,200,0.5)",
      },
    ];
  }

  // Chuyển sang dạng {id, title, value: %, count, color}
  return entries.map(([title, value], i) => ({
    id: i + 1,
    title,
    value: +((value / total) * 100).toFixed(1), // phần trăm
    count: value, // số lượng thật
    color: colors[i % colors.length],
  }));
});

// ===== UTILITY FUNCTIONS =====
/**
 * Resets all dialog states and form data
 * Called after successful operations
 */
function Reset() {
  DialogSuccess.value = true;
  DialogLoading.value = false;
}

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}
</script>
<script>
export default {
  components: {
    InputSearch,
    InputFiles,
    InputField,
    ButtonImportFile,
    ButtonDownload,
    ButtonEye,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    InputSelect,
    InputTextarea,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang=""></style>
