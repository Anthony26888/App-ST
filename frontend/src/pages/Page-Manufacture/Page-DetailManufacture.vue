<template>
  <div class="manufacture-detail">
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light" v-if="lgAndUp">
        <ButtonBack to="/san-xuat" />
        Theo dõi sản xuất
      </v-card-title>
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-cart" color="primary"></v-icon> &nbsp;
        <v-breadcrumbs
          :items="[`${NameManufacture}`, `${NameOrder}`]"
          :class="mdAndDown ? 'text-caption text-wrap' : ''"
        >
          <template v-slot:divider>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </template>
        </v-breadcrumbs>
      </v-card-title>

      <v-card-text class="pa-6">
        <!-- Main Stats Overview -->
        <v-row class="mb-6">
          <v-col cols="" md="4">
            <v-card class="rounded-xl" color="primary" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Đầu vào</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalInput }}
                </div>
                <div class="text-caption">Tổng số lượng đầu vào</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="rounded-xl" color="success" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Hàng thành phẩm</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalOutput }}
                </div>
                <v-progress-linear
                  v-model="PercentOutput"
                  height="20"
                  class="rounded-lg"
                >
                  <strong class="text-black">{{ PercentOutput }}%</strong>
                </v-progress-linear>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="rounded-xl" color="warning" variant="tonal">
              <v-card-text>
                <div class="text-subtitle-1">Hàng lỗi</div>
                <div class="text-h4 font-weight-bold">
                  {{ totalError }}
                </div>
                <v-progress-linear
                  v-model="PercentError"
                  height="20"
                  class="rounded-lg"
                >
                  <strong class="text-black">{{ PercentError }}%</strong>
                </v-progress-linear>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <div class="d-flex align-center justify-start flex-wrap gap-4">
          <template v-for="(card, index) in levelArray" :key="card.id">
            <v-tooltip text="Nhấn vào xem chi tiết" location="bottom">
              <template v-slot:activator="{ props }">
                <ProcessCard
                  v-bind="props"
                  :title="card.Type"
                  :pass="
                    card.Type === 'RW'
                      ? `${totalError + totalFixed - totalFixed}`
                      : Number.parseFloat(
                          (card.Quantity_Pass / totalInput) * 100
                        ).toFixed(1) + '%'
                  "
                  :fail="
                    card.Type === 'RW'
                      ? Number.parseFloat(
                          (totalFixed / (totalError + totalFixed)) * 100
                        ).toFixed(1) + '%'
                      : Number.parseFloat(
                          (card.Quantity_Fail / totalInput) * 100
                        ).toFixed(1) + '%'
                  "
                  color="success"
                  :is-selected="selectedTitle === card.Type"
                  @card-click="selectCard"
                  @toggle-bottleneck="toggleBottleneck"
                  class="mb-4"
                />

                <div
                  v-if="index < levelArray.length - 1"
                  class="flow-arrow mx-4 d-none d-md-block"
                >
                  →
                </div>
              </template>
            </v-tooltip>
          </template>
          <v-tooltip text="Đóng">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="ms-5"
                icon="mdi-close"
                @click="CloseTabProgress()"
              ></v-btn>
            </template>
          </v-tooltip>
        </div>
        <v-card v-show="Detail_Popup_Card" class="rounded-xl">
          <v-card-title
            class="d-flex align-center pa-4 bg-grey-lighten-2 rounded-t-lg"
          >
            <v-icon
              icon="mdi-information"
              color="primary"
              class="me-2"
            ></v-icon>
            Chi tiết công đoạn sản xuất
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="3">
                <v-card-title
                  ><h2 class="text-bold font-italic">
                    {{ Quantity_Detail_Title }}
                  </h2></v-card-title
                >
                <v-divider width="200px"></v-divider>
                <v-card-text>
                  <div v-if="Quantity_Detail_Title === 'SMT'">
                    <div class="d-flex">
                      <h1 class="text-info">Top:</h1>
                      <h1 class="ms-2 font-weight-light">
                        {{ SMT_Top_Pass }} pcs
                      </h1>
                    </div>
                    <div class="d-flex">
                      <h1 class="text-error">Bottom:</h1>
                      <h1 class="ms-2 font-weight-light">
                        {{ SMT_Bottom_Pass }} pcs
                      </h1>
                    </div>
                    <div class="d-flex">
                      <h1 class="text-success">Tổng:</h1>
                      <h1 class="ms-2 font-weight-light">
                        {{ Quantity_Detail_Pass }} pcs
                      </h1>
                    </div>
                    <div class="d-flex">
                      <h1 class="text-warning">Còn lại:</h1>
                      <h1 class="ms-2 font-weight-light">
                        {{ totalInput - Quantity_Detail_Pass }} pcs
                      </h1>
                    </div>
                  </div>
                  <div v-else>
                    <div class="d-flex">
                      <h1 class="text-success">Pass:</h1>
                      <h1 class="ms-2 font-weight-light">
                        {{ Quantity_Detail_Pass }} pcs
                      </h1>
                    </div>
                    <div class="d-flex">
                      <h1 class="text-error">Fail:</h1>
                      <h1 class="ms-2 font-weight-light">
                        {{ Quantity_Detail_Fail }} pcs
                      </h1>
                    </div>
                    <div class="d-flex">
                      <h1 class="text-info">Đã sửa:</h1>
                      <h1 class="ms-2 font-weight-light">
                        {{ Quantity_Detail_Fixed }} pcs
                      </h1>
                    </div>
                    <div class="d-flex">
                      <h1 class="text-warning">Còn lại:</h1>
                      <h1 class="ms-2 font-weight-light">
                        {{ Quantity_Detail_Remain }} pcs
                      </h1>
                    </div>
                  </div>
                </v-card-text>
              </v-col>
              <v-col
                cols="4"
                class="d-flex flex-column align-center justify-center"
              >
                <v-pie
                  title="Biểu đồ phần trăm %"
                  animation
                  :legend="{
                    position: $vuetify.display.mdAndUp ? 'right' : 'bottom',
                  }"
                  :tooltip="{ subtitleFormat: '[value]%' }"
                  reveal
                  :items="VPieData"
                />
                <div class="h-0">
                  <svg
                    height="0"
                    version="1.1"
                    width="0"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="pattern-0"
                        height="20"
                        patternTransform="rotate(145) scale(.2)"
                        patternUnits="userSpaceOnUse"
                        width="20"
                      >
                        <path
                          d="M0 10h20zm0 20h20zm0 20h20zm0 20h20z"
                          fill="none"
                          stroke="rgb(var(--v-theme-surface))"
                          stroke-width="3"
                        />
                      </pattern>
                    </defs>
                  </svg>
                </div>
              </v-col>
              <v-col cols="5">
                <v-card-title>Danh sách hàng lỗi</v-card-title>
                <v-card-text>
                  <v-data-table
                    :headers="HeadersHistoryPartError"
                    :items="manufactureRW"
                    fixed-header
                    v-model:page="pageRW"
                    v-model:items-per-page="itemsPerPageRW"
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
                  >
                    <template v-slot:item.stt="{ index }">
                      {{ (page - 1) * itemsPerPage + index + 1 }}
                    </template>
                    <template #[`item.Status`]="{ item }">
                      <v-chip
                        :color="
                          item.Status === 'fail'
                            ? 'warning'
                            : item.Status === 'fixed'
                            ? 'info'
                            : 'success'
                        "
                        size="small"
                        variant="tonal"
                      >
                        {{
                          item.Status === "fail"
                            ? "Fail"
                            : item.Status === "fixed"
                            ? "Fixed"
                            : "Pass"
                        }}
                      </v-chip>
                      <v-chip
                        class="ms-2"
                        size="small"
                        color="info"
                        variant="tonal"
                        v-if="item.Note"
                        >Fixed</v-chip
                      >
                    </template>
                    <template #[`item.PartNumber`]="{ item }">
                      <p v-if="item.PartNumber == 1">{{ NameOrder }}</p>
                      <p v-else>{{ item.PartNumber }}</p>
                    </template>
                    <template #[`item.RWID`]="{ item }">
                      <v-chip color="success" variant="tonal" v-if="item.RWID">
                        <v-icon>mdi-check</v-icon>
                      </v-chip>
                      <v-chip v-else variant="tonal" color="error">
                        <v-icon>mdi-alert</v-icon>
                      </v-chip>
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
                          v-model="pageRW"
                          :length="
                            Math.ceil(manufactureRW.length / itemsPerPageRW)
                          "
                        ></v-pagination>
                      </div>
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-col>
              <v-row>
                <v-col cols="2"></v-col>
                <v-col cols="8">
                  <v-divider :thickness="3"></v-divider>
                </v-col>
                <v-col cols="2"></v-col>
              </v-row>

              <v-col cols="12">
                <v-data-table
                  :group-by="groupBy"
                  density="compact"
                  :headers="HeadersHistory"
                  :items="history"
                  fixed-header
                  loading-text="Đang tải dữ liệu..."
                  no-data-text="Không có dữ liệu"
                  no-results-text="Không tìm thấy kết quả"
                  class="elevation-0"
                  v-model:page="pageDetail"
                  v-model:items-per-page="itemsPerPageDetail"
                >
                  <template v-slot:top>
                    <v-toolbar flat dense class="rounded-t-lg" color="white">
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
                    v-slot:group-header="{
                      item,
                      columns,
                      toggleGroup,
                      isGroupOpen,
                    }"
                  >
                    <tr>
                      <td
                        :colspan="columns.length"
                        class="cursor-pointer"
                        v-ripple
                        @click="toggleGroup(item)"
                      >
                        <div class="d-flex align-center">
                          <v-btn
                            :icon="isGroupOpen(item) ? '$expand' : '$next'"
                            color="medium-emphasis"
                            density="comfortable"
                            size="small"
                            variant="text"
                          ></v-btn>

                          <span class="ms-4 font-weight-bold text-primary"
                            >{{ item.value }} ({{ item.items.length }})</span
                          >
                        </div>
                      </td>
                    </tr>
                  </template>

                  <template #[`item.id`]="{ item }">
                    <div class="d-flex gap-2">
                      <ButtonEye @click="PushItem(item)" />
                      <ButtonEdit @click="GetItem(item)" />
                    </div>
                  </template>

                  <template #[`item.Category`]="{ item }">
                    {{ item.Category }}
                    <v-chip
                      v-if="item?.Line_SMT"
                      :color="
                        item.Line_SMT === 'Line 1' ? 'brown' : 'deep-orange'
                      "
                      size="small"
                      variant="tonal"
                      class="ms-2"
                    >
                      {{ item.Line_SMT }}
                    </v-chip>
                  </template>

                  <template #[`item.Quantity_Plan`]="{ item }">
                    <v-chip color="primary" variant="tonal" size="small">{{
                      item.Quantity_Plan
                    }}</v-chip>
                  </template>

                  <template #[`item.Quantity_Real`]="{ item }">
                    <v-chip color="success" variant="tonal" size="small">{{
                      item.Quantity_Real
                    }}</v-chip>
                  </template>

                  <template #[`item.Quantity_Error`]="{ item }">
                    <v-chip color="warning" variant="tonal" size="small">{{
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
                      <strong
                        >{{
                          Number.parseFloat(item.Percent).toFixed(1)
                        }}%</strong
                      >
                    </v-progress-linear>
                  </template>
                  <template #[`bottom`]>
                    <div class="text-center pt-2">
                      <v-pagination
                        v-model="pageDetail"
                        :length="Math.ceil(history.length / itemsPerPageDetail)"
                      ></v-pagination>
                    </div>
                  </template>
                </v-data-table>
              </v-col>
              <v-row>
                <v-col cols="2"></v-col>
                <v-col cols="8">
                  <v-divider :thickness="3"></v-divider>
                </v-col>
                <v-col cols="2"></v-col>
              </v-row>
              <v-col cols="12">
                <StackedBarChart
                  :labels="days"
                  :passData="passList"
                  :failData="failList"
                  :planData="planList"
                  title="Kết quả sản xuất theo ngày"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Chart thống kê công đoạn -->
        <v-row class="mb-6 mt-5">
          <!-- Chart Card -->
          <v-col cols="12" md="7">
            <v-card class="rounded-xl h-100" elevation="2">
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
                <StackedBarChartSummary
                  :labels="progress"
                  :passData="passListSummary"
                  :failData="failListSummary"
                  title="Kết quả sản xuất theo ngày"
                />
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Chart chi tiết công đoạn -->
          <v-col cols="12" md="5">
            <v-card class="rounded-xl h-100" elevation="2">
              <v-card-title
                class="d-flex align-center pa-4 bg-grey-lighten-2 rounded-t-lg"
              >
                <v-icon
                  icon="mdi-chart-donut"
                  class="me-2"
                  color="primary"
                ></v-icon>
                Tổng hợp lỗi
              </v-card-title>
              <v-card-text class="pa-4">
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
                      <div class="text-h3">
                        {{ manufactureFail.length || 0 }}
                      </div>
                      <div class="opacity-70 mt-1 mb-n1">Tổng</div>
                    </div>
                  </template>
                </v-pie>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Lịch sử sản xuất -->
        <v-card class="rounded-xl mt-5" elevation="2">
          <v-data-table
            :headers="HeadersHistoryPart"
            :items="historyPart"
            :search="searchHistory"
            fixed-header
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
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
            height="calc(100vh - 350px)"
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
            <template v-slot:item.stt="{ index }">
              {{ (page - 1) * itemsPerPage + index + 1 }}
            </template>
            <template #[`item.Status`]="{ item }">
              <v-chip
                :color="
                  item.Status === 'fail'
                    ? 'warning'
                    : item.Status === 'fixed'
                    ? 'info'
                    : 'success'
                "
                size="small"
                variant="tonal"
              >
                {{
                  item.Status === "fail"
                    ? "Fail"
                    : item.Status === "fixed"
                    ? "Fixed"
                    : "Pass"
                }}
              </v-chip>
              <v-chip
                class="ms-2"
                size="small"
                color="info"
                variant="tonal"
                v-if="item.Note"
                >Fixed</v-chip
              >
            </template>
            <template #[`item.PartNumber`]="{ item }">
              <p v-if="item.PartNumber == 1">{{ NameOrder }}</p>
              <p v-else>{{ item.PartNumber }}</p>
            </template>

            <template #[`item.Note`]="{ item }">
              <div style="white-space: pre-line" class="text-error">
                {{ item.Note }}
              </div>
            </template>
            <template #[`item.TimestampRW`]="{ item }">
              <p class="text-info">{{ item.TimestampRW }}</p>
            </template>
            <template #[`item.RWID`]="{ item }">
              <v-chip
                color="success"
                class="ms-2"
                v-if="item.RWID === 'Done'"
                size="small"
                variant="tonal"
              >
                <v-icon>mdi-check</v-icon>
              </v-chip>
            </template>
            <template #[`item.id`]="{ item }">
              <v-btn
                size="small"
                variant="text"
                color="error"
                icon="mdi-trash-can"
                @click="GetItemHistory(item)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Dialog Add -->
    <v-dialog v-model="DialogAdd" width="800" scrollable>
      <v-card max-width="700" class="overflow-y-auto rounded-lg">
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
            <v-row>
              <v-col cols="4">
                <InputSelect
                  label="Công đoạn"
                  :items="LevelSelectAdd"
                  hint="Lựa chọn công đoạn phù hợp"
                  v-model="Type_Add"
                  :rules="requiredRuleEmpty"
                />
              </v-col>
              <v-col cols="4">
                <InputSelect
                  label="Bề mặt"
                  :items="['TOP', 'BOTTOM', '1 Mặt']"
                  hint="Lựa chọn bề mặt phù hợp"
                  v-model="Surface_Add"
                  :disabled="Type_Add != 'SMT'"
                  :rules="requiredRuleEmpty"
                />
              </v-col>
              <v-col cols="4">
                <InputSelect
                  label="Vị trí line"
                  :items="['Line 1', 'Line 2']"
                  hint="Lựa chọn công đoạn phù hợp"
                  v-model="Line_Add"
                  :disabled="Type_Add != 'SMT'"
                  :rules="requiredRule"
                />
              </v-col>
            </v-row>

            <InputField
              label="Hạng mục"
              v-model="Category_Add"
              :rules="requiredRuleEmpty"
            />

            <v-row>
              <v-col cols="12" sm="4">
                <InputField
                  label="Số lượng (pcs)"
                  type="number"
                  v-model="Quantity_Plan_Add"
                  :rules="requiredRuleEmpty"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <InputField
                  label="Vòng lặp (giây)"
                  type="number"
                  v-model="CycleTime_Add"
                  :rules="requiredRuleEmpty"
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
              :rules="requiredRuleEmpty"
            />
            <InputTextarea label="Ghi chú" v-model="Note_Add" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <ButtonCancel @cancel="DialogAdd = false" />
          <ButtonSave @save="SaveAdd()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Edit -->
    <v-dialog v-model="DialogEdit" width="700" scrollable>
      <v-card max-width="600" class="overflow-y-auto rounded-lg">
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
          <InputSelect
            label="Vị trí line"
            :items="['Line 1', 'Line 2']"
            hint="Lựa chọn công đoạn phù hợp"
            v-model="Line_Edit"
            :rules="requiredRule"
            :disabled="Type_Edit != 'SMT'"
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
          <InputField
            type="date"
            label="Ngày tạo"
            v-model="Date_DetailManufacture_Edit"
          />
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
      <v-card class="rounded-lg">
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
      <v-card
        max-width="400"
        prepend-icon="mdi-delete"
        title="Xoá dữ liệu"
        class="rounded-lg"
      >
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
import { shallowRef, toRef } from "vue";
import Chart from "chart.js/auto";
import { useDisplay } from "vuetify";
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
import ProcessCard from "@/components/Card-Flow-Proccess.vue";
import StackedBarChart from "@/components/Chart-StackedBar.vue";
import StackedBarChartSummary from "@/components/Chart-StackedBar-Summary.vue";

// ... existing imports ...
import { useManufactureDetails } from "@/composables/Manufacture/useManufactureDetails";
import { useManufacture } from "@/composables/Manufacture/useManufacture";
import { useHistory } from "@/composables/Manufacture/useHistory";
import { useHistoryPart } from "@/composables/Manufacture/useHistoryPart";
import { useManufactureSummary } from "@/composables/Manufacture/useManufactureSummary";
import { useManufactureRW } from "@/composables/Manufacture/useManufactureRW";
import { useManufactureFail } from "@/composables/Manufacture/useManufactureFail";

// ... existing refs and constants ...
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const router = useRouter();
const id = route.params.id;
const typeFilter = ref(route.query.Type || null);

const { manufactureDetails, connectionStatus } = useManufactureDetails(id);
const { manufacture, manufactureFound, manufactureError, isConnected } =
  useManufacture();
const { historyPart, historyPartError } = useHistoryPart(id);
const { manufactureSummary, refresh } = useManufactureSummary(id);
const { manufactureRW, manufactureRWError } = useManufactureRW(id, typeFilter);
const { history } = useHistory(id, typeFilter);
const { manufactureFail } = useManufactureFail(id);
const { mdAndDown, lgAndUp } = useDisplay();
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
const totalOutput = ref(0);
const totalSMT_1 = ref(0);
const totalSMT_2 = ref(0);
const totalSMT_3 = ref(0);
const totalSMT_4 = ref(0);
const totalRW = ref(0);

const totalError = ref(0);
const totalRWError = ref(0);
const totalFixed = ref(0);
const percentRW = ref(0);
const totalOutput_Fail = ref(0);

const PercentOutput = computed(() =>
  Number.parseFloat((totalOutput.value * 100) / totalInput.value).toFixed(1)
);

const PercentError = computed(() =>
  Number.parseFloat((totalError.value * 100) / totalInput.value).toFixed(1)
);

const PercentFixed = computed(
  () => (totalFixed.value * 100) / totalError.value
);
// Level
const Level_SMT = ref(false);
const LevelSelectAdd = ref(null);
const levelArray = ref([]);
// Data
const DataManufacture = ref(null);
const Quantity_Detail_Title = ref("");
const Quantity_Detail_Pass = ref(0);
const Quantity_Detail_Fail = ref(0);
const Quantity_Detail_Fixed = ref(0);
const Quantity_Detail_Remain = ref(0);
const SMT_Top_Pass = ref(0);
const SMT_Bottom_Pass = ref(0);

// ===== FORM ADD =====
const Type_Add = ref("");
const Line_Add = ref("");
const PONumber_Add = ref(localStorage.getItem("ProductName"));
const Name_Order_Add = ref("");
const Category_Add = ref("");
const Quantity_Plan_Add = ref("");
const CycleTime_Add = ref("");
const Note_Add = ref("");
const Date_DetailManufacture_Add = ref("");
const Surface_Add = ref("");

// ===== FORM EDIT =====
const Type_Edit = ref("");
const PONumber_Edit = ref("");
const Name_Order_Edit = ref("");
const Category_Edit = ref("");
const Line_Edit = ref("");
const Quantity_Plan_Edit = ref("");
const CycleTime_Edit = ref("");
const Note_Edit = ref("");
const Note_RW_Edit = ref("");
const Date_DetailManufacture_Edit = ref("");

// ===== FORM SETTING SMT =====
const DelaySMT_Edit = ref(10000);
const Quantity_Edit = ref(1);

// Table
const searchHistory = ref("");
const page = ref(1);
const pageDetail = ref(1);
const pageRW = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageDetail = ref(5);
const itemsPerPageRW = ref(5);

// Chart
const days = computed(() => {
  return history.value.map((item) => formatDate(item.Created_At));
});

const passList = computed(() =>
  history.value.map((item) => Number(item.Quantity_Real || 0))
);

const failList = computed(() =>
  history.value.map((item) => Number(item.Quantity_Error || 0))
);

const planList = computed(() =>
  history.value.map((item) => Number(item.Quantity_Plan || 0))
);

const progress = computed(() => {
  return manufactureSummary.value.map((item) => formatDate(item.Type));
});

const passListSummary = computed(() =>
  manufactureSummary.value.map((item) => Number(item.Quantity_Pass || 0))
);

const failListSummary = computed(() =>
  manufactureSummary.value.map((item) => Number(item.Quantity_Fail || 0))
);
const VPieData = ref([]);

// Choose card with hightlight board
const selectedTitle = ref(null);
const Detail_Popup_Card = ref(false);

// Table Fail
const Manufacture_Fail = ref([]);
const Manufacture_History = ref([]);

// Table
const groupBy = [{ key: "Category" }];
const HeadersHistory = [
  { title: "Ngày", key: "Created_At", sortable: true },
  {
    title: "Kế hoạch",
    align: "center",
    children: [
      { title: "Vòng lập (s)", key: "CycleTime_Plan" },
      { title: "Thời gian (s)", key: "Time_Plan" },
      { title: "Đầu vào", key: "Quantity_Plan" },
    ],
  },
  {
    title: "Thực tế",
    align: "center",
    children: [
      { title: "Hàng pass", key: "Quantity_Real" },
      { title: "Hàng fail", key: "Quantity_Error" },
      { title: "Phần trăm (%)", key: "Percent" },
      // { title: "RW đã sửa", key: "Total_Fixed"},
    ],
  },
  { title: "Ghi chú", key: "Note" },
  { title: "Thao tác", key: "id", sortable: false },
];
const HeadersHistoryPart = [
  { title: "STT", key: "stt" },
  { title: "Mã hàng", key: "PartNumber", sortable: true },
  { title: "Vị trí", key: "Source", sortable: true },
  { title: "Trạng thái", key: "Status", sortable: true },
  { title: "Ghi chú lỗi", key: "Note", sortable: true },
  { title: "Thời gian", key: "Timestamp", sortable: true },
  { title: "RW đã sửa", key: "RWID", sortable: true },
  { title: "Thời gian RW", key: "TimestampRW", sortable: true },
  // { title: "Thao tác", key: "id", sortable: true },
];

const HeadersHistoryPartError = [
  { title: "STT", key: "stt" },
  { title: "Mã hàng", key: "PartNumber", sortable: true },
  { title: "Trạng thái", key: "Status", sortable: true },
  { title: "Trạng thái RW", key: "RWID", sortable: true },
  { title: "Loại lỗi", key: "GroupFail", sortable: true },
  { title: "Ghi chú lỗi", key: "Note", sortable: true },
];

// =============== Rules ============
const formRef = ref(null);
const isFormValid = ref(true);
const requiredRule = computed(() => {
  if (Type_Add.value === "SMT") {
    return [(v) => !!v || "Dữ liệu này không được bỏ trống"];
  }

  // Nếu không phải SMT thì không cần validate
  return [];
});
const requiredRuleEmpty = computed(() => [(v) => !!v || "Không được bỏ trống"]);

function formatDate(dateString) {
  if (!dateString) return "";
  const parts = dateString.split(/[-/]/);
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  }
  return dateString;
}

// Watch for manufactureDetails changes
watch(
  manufactureDetails,
  (newValue) => {
    if (!newValue || typeof newValue !== "object") return;

    const data = Array.isArray(newValue) ? newValue[0] : newValue;
    if (!data || typeof data.Level !== "string" || !data.Level.trim()) {
      levelArray.value = [];
      return;
    }

    // ✅ Tách chuỗi Level thành mảng công đoạn
    let levels = data.Level.split("-").map((s) => s.trim());

    // ✅ Sắp xếp thứ tự công đoạn
    levels = levels.sort((a, b) => {
      const upperA = a.toUpperCase();
      const upperB = b.toUpperCase();

      // 1️⃣ SMT luôn ở đầu
      if (upperA.includes("SMT") && !upperB.includes("SMT")) return -1;
      if (!upperA.includes("SMT") && upperB.includes("SMT")) return 1;

      // 2️⃣ OQC ngay sau SMT
      if (upperA.includes("AOI") && !upperB.includes("AOI")) return -1;
      if (!upperA.includes("AOI") && upperB.includes("AOI")) return 1;

      // 3️⃣ RW và Thành phẩm luôn ở cuối
      const isAEnd = ["RW", "THÀNH PHẨM"].some((x) => upperA.includes(x));
      const isBEnd = ["RW", "THÀNH PHẨM"].some((x) => upperB.includes(x));
      if (isAEnd && !isBEnd) return 1;
      if (!isAEnd && isBEnd) return -1;

      // 4️⃣ Giữ nguyên thứ tự gốc nếu không có điều kiện đặc biệt
      return 0;
    });

    // ✅ Sinh mảng object công đoạn tương ứng
    levelArray.value = levels.map((step, index) => ({
      Type: step,
      Quantity_Pass: 0,
      Quantity_Fail: 0,
      Quantity_RW: 0,
      Total_Summary_ID: index + 1,
    }));

    // ---- Gán các giá trị khác như cũ ----
    DataManufacture.value = data.Level;
    Level_SMT.value = data.Level.includes("SMT");
    totalInput.value = data.Total || 0;
    totalOutput.value = data.Quantity_Pass || 0;
    totalError.value = data.Quantity_Error || 0;
    totalFixed.value = data.Quantity_Fixed || 0;
    totalOutput_Fail.value = data.Quantity_Output_Fail || 0;
    totalSMT_1.value = data.SMT_1 || 0;
    totalSMT_2.value = data.SMT_2 || 0;
    totalSMT_3.value = data.SMT_3 || 0;
    totalSMT_4.value = data.SMT_4 || 0;
    Quantity_Edit.value = data.Quantity;
    DelaySMT_Edit.value = data.DelaySMT;
    LevelSelectAdd.value = data.Level.split("-");
    NameOrder.value = data.Name_Order;
    Name_Order_Add.value = data.Name_Order;
    Name_Order_Edit.value = data.Name_Order;
  },
  { immediate: true, deep: true }
);

watch(
  manufactureSummary,
  (newValue) => {
    // Duyệt từng phần tử trong levelArray để cập nhật giá trị tương ứng
    levelArray.value = levelArray.value.map((lvl) => {
      const match = newValue.find((item) => item.Type === lvl.Type);

      // Nếu tìm thấy bản ghi tương ứng trong manufactureSummary
      if (match) {
        return {
          ...lvl,
          Quantity_Pass: match.Quantity_Pass || 0,
          Quantity_Fail: match.Quantity_Fail || 0,
          Quantity_RW: match.Quantity_RW || 0,
          Total_Summary_ID: match.Total_Summary_ID || lvl.Total_Summary_ID,
        };
      }

      // Nếu không có dữ liệu thống kê tương ứng, giữ nguyên
      return lvl;
    });
    const resetValues = () => {
      Quantity_Detail_Pass.value = 0;
      Quantity_Detail_Fail.value = 0;
      Quantity_Detail_Remain.value = 0;

      VPieData.value = [
        { key: 1, title: "Pass", value: 0, color: "#72c789" },
        { key: 2, title: "Fail", value: 0, color: "#d43d51" },
        {
          key: 3,
          title: "Còn lại",
          value: 100,
          color: "rgba(var(--v-theme-on-surface), .2)",
          pattern: "url(#pattern-0)",
        },
      ];
    };

    if (!newValue || !Array.isArray(newValue) || newValue.length === 0) {
      resetValues();
      return;
    }

    // ✅ Chỉ cập nhật dữ liệu tương ứng với màn hình đang xem
    const currentType = Quantity_Detail_Title.value;
    const found = newValue.find((x) => x.Type === currentType);

    if (!found) {
      resetValues();
      return;
    }

    if (currentType === "SMT") {
      Quantity_Detail_Pass.value = totalSMT_1.value + totalSMT_2.value;
      SMT_Top_Pass.value = found.SMT_Top_Quantity || 0;
      SMT_Bottom_Pass.value = found.SMT_Bottom_Quantity || 0;
    } else {
      const pass = found.Quantity_Pass || 0;
      const fail = found.Quantity_Fail || 0;
      const remain = Math.max(0, totalInput.value - (pass + fail));

      Quantity_Detail_Pass.value = pass;
      Quantity_Detail_Fail.value = fail;
      Quantity_Detail_Remain.value = remain;

      const round1 = (num) => Number(num.toFixed(1));

      const Percent_Pass = round1((pass / totalInput.value) * 100);
      const Percent_Fail = round1((fail / totalInput.value) * 100);
      const Percent_Remain = round1((remain / totalInput.value) * 100);

      VPieData.value = [
        { key: 1, title: "Pass", value: Percent_Pass, color: "#72c789" },
        { key: 2, title: "Fail", value: Percent_Fail, color: "#d43d51" },
        {
          key: 3,
          title: "Còn lại",
          value: Percent_Remain,
          color: "rgba(var(--v-theme-on-surface), .2)",
          pattern: "url(#pattern-0)",
        },
      ];
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => route.query.Type,
  (newType) => {
    typeFilter.value = newType || null;
  }
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
  manufactureFail,
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
    value: +Number((value / total) * 100).toFixed(1), // phần trăm
    count: value, // số lượng thật
    color: colors[i % colors.length],
  }));
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

// ====== CRUD ========
const PushItem = (item) => {
  localStorage.setItem("ManufactureID", id);
  if (item.Type === "SMT") {
    router.push(`/San-xuat/SMT/${item.id}`);
  } else if (item.Type === "RW") {
    router.push(`/San-xuat/RW/${item.id}`);
  } else {
    router.push(`/San-xuat/${item.Type}/${item.id}`);
  }
};

const GetItem = (item) => {
  DialogEdit.value = true;
  Type_Edit.value = item.Type;
  PONumber_Edit.value = item.PONumber;
  Name_Order_Edit.value = item.Name_Order;
  Category_Edit.value = item.Category;
  Line_Edit.value = item.Line_SMT;
  Quantity_Plan_Edit.value = item.Quantity_Plan;
  CycleTime_Edit.value = item.CycleTime_Plan;
  Time_Edit.value = item.Time_Plan;
  Note_Edit.value = item.Note;
  Date_DetailManufacture_Edit.value = item.Created_At_unixepoch;
  GetID.value = item.id;
};

const GetItemHistory = (item) => {
  DialogRemoveHistory.value = true;
  GetIDHistory.value = item.id;
  if (
    item.Source == "SMT - Printer" ||
    item.Source == "SMT - Gắp linh kiện Juki" ||
    item.Source == "SMT - Gắp linh kiện Yamaha" ||
    item.Source == "SMT - Gắp linh kiện Topaz"
  ) {
    GetSourceHistory.value = "ManufactureSMT";
  } else {
    GetSourceHistory.value = `Manufacture${item.Source}`;
  }
};
const GetDetailProgress = async (item) => {
  if (item == "RW") {
    return router.push(`/San-xuat/RW/${route.params.id}`);
  }
  router.push(`/San-xuat/Chi-tiet/${route.params.id}?Type=${item}`);
  const found = manufactureSummary.value.find((v) => v.Type === item);
  const found_Fail = manufactureRW.value.filter((v) => v.Type === item);
  Manufacture_Fail.value = found_Fail;
  Type_Add.value = item;

  Quantity_Detail_Title.value = item;

  if (!found) {
    // Nếu không có dữ liệu
    Quantity_Detail_Pass.value = 0;
    Quantity_Detail_Fail.value = 0;
    Quantity_Detail_Fixed.value = 0;
    Quantity_Detail_Remain.value = totalInput.value || 0;
    SMT_Top_Pass.value = 0;
    SMT_Bottom_Pass.value = 0;

    VPieData.value = [
      { key: 1, title: "Pass", value: 0, color: "#72c789" },
      { key: 2, title: "Fail", value: 0, color: "#d43d51" },
      {
        key: 3,
        title: "Còn lại",
        value: 100,
        color: "rgba(var(--v-theme-on-surface), .2)",
        pattern: "url(#pattern-0)",
      },
    ];
    return; // ✅ Quan trọng: thoát luôn để không xử lý tiếp
  }

  // ✅ Đoạn này chỉ chạy khi found có dữ liệu
  Quantity_Detail_Pass.value = found.Quantity_Pass || 0;
  Quantity_Detail_Fail.value = found.Quantity_Fail || 0;
  Quantity_Detail_Fixed.value = found.Quantity_Fixed || 0;
  SMT_Top_Pass.value = found.SMT_Top_Quantity || 0;
  SMT_Bottom_Pass.value = found.SMT_Bottom_Quantity || 0;

  const remain =
    totalInput.value -
    (Quantity_Detail_Pass.value + Quantity_Detail_Fail.value);
  Quantity_Detail_Remain.value = remain > 0 ? remain : 0;

  const round1 = (num) => Number(num.toFixed(1));

  const percentPass =
    round1((Quantity_Detail_Pass.value / totalInput.value) * 100) || 0;
  const percentFail =
    round1((Quantity_Detail_Fail.value / totalInput.value) * 100) || 0;
  const percentRemain =
    round1((Quantity_Detail_Remain.value / totalInput.value) * 100) || 0;

  VPieData.value = [
    { key: 1, title: "Pass", value: percentPass, color: "#72c789" },
    { key: 2, title: "Fail", value: percentFail, color: "#d43d51" },
    {
      key: 3,
      title: "Còn lại",
      value: percentRemain,
      color: "rgba(var(--v-theme-on-surface), .2)",
      pattern: "url(#pattern-0)",
    },
  ];
};

const selectCard = (title) => {
  selectedTitle.value = title; // Đặt thẻ này là thẻ được chọn
  Detail_Popup_Card.value = true;
  // Tìm thẻ trong mảng để xác định nó có phải là bottleneck không
  // Phân nhánh logic hành động
  GetDetailProgress(title);
};

const toggleBottleneck = () => {
  // Hành động chuyển đổi Bottleneck (giữ nguyên)
  console.log("Toggle Bottleneck action...");
  // Logic thực tế để thay đổi trạng thái isBottleneck của một card nào đó
};

const HandleBottleneckAction = (title) => {
  // 🚨 HÀNH ĐỘNG MỚI KHI NHẤN VÀO VIỀN ĐỎ
  console.error(
    `🚨 [BOTTLENECK PRIORITY] Đã nhấn vào Bottleneck: ${title}. Cần xử lý gấp!`
  );
  // Thêm logic xử lý ưu tiên tại đây (ví dụ: mở modal, gọi API xử lý)
};

const CloseTabProgress = () => {
  router.push(`/San-xuat/Chi-tiet/${route.params.id}`);
  Detail_Popup_Card.value = false;
};

const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Type: Type_Edit.value,
    PlanID: route.params.id,
    PONumber: PONumber_Edit.value,
    Category: Category_Edit.value,
    Line_SMT: Line_Edit.value,
    Quantity_Plan: Quantity_Plan_Edit.value,
    CycleTime_Plan: CycleTime_Edit.value,
    Time_Plan: Time_Edit.value,
    Note: Note_Edit.value,
    Timestamp: Date_DetailManufacture_Edit.value,
  });

  try {
    const response = await axios.put(
      `${Url}/Summary/Edit-item/${GetID.value}`,
      formData
    );
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
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
    Line_SMT: Line_Add.value,
    Quantity_Plan: Quantity_Plan_Add.value,
    CycleTime_Plan: CycleTime_Add.value,
    Time_Plan: Time_Add.value,
    Note: Note_Add.value,
    Timestamp: Date_DetailManufacture_Add.value,
    Surface: Surface_Add.value,
  });
  try {
    const response = await axios.post(`${Url}/Summary/Add-item`, formData);
    MessageDialog.value = "Thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    Error();
  }
};

// Hàm xóa item
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Summary/Delete-item/${GetID.value}?PlanID=${route.params.id}&Type=${Type_Edit.value}`
    );
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
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
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
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
  Date_DetailManufacture_Add.value = "";
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
  Date_DetailManufacture_Add.value = "";
}

// Update fetchProductionData to use the watcher
async function fetchProductionData() {
  try {
    DialogLoading.value = true;
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Lỗi không lấy được dữ liệu";
  } finally {
    DialogLoading.value = false;
  }
}
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
    StackedBarChart,
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
