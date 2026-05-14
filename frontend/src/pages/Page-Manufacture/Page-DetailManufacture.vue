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
          <v-col cols="12" md="4">
            <CardStatistic
              title="Đầu vào"
              :value="totalInput"
              icon="mdi-import"
              color="primary"
              subtitle="Tổng số lượng đầu vào"
            />
          </v-col>

          <v-col cols="12" md="4">
            <CardStatistic
              title="Hàng thành phẩm"
              :value="totalOutput"
              icon="mdi-check-circle"
              color="success"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-success mb-1">
                  {{ PercentOutput }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="PercentOutput"
                  height="8"
                  color="success"
                  rounded
                  class="mt-4"
                  bg-color="success"
                  bg-opacity="0.2"
                ></v-progress-linear>
              </template>
            </CardStatistic>
          </v-col>

          <v-col cols="12" md="4">
            <CardStatistic
              title="Còn lại"
              :value="totalInput - totalOutput"
              icon="mdi-alert-circle"
              color="warning"
            >
              <template #value-append>
                <div class="text-h6 font-weight-medium text-warning mb-1">
                  {{ PercentError }}%
                </div>
              </template>
              <template #bottom>
                <v-progress-linear
                  v-model="PercentError"
                  height="8"
                  color="warning"
                  rounded
                  class="mt-4"
                  bg-color="warning"
                  bg-opacity="0.2"
                ></v-progress-linear>
              </template>
            </CardStatistic>
          </v-col>
        </v-row>
        <div class="d-flex align-center justify-start flex-wrap gap-4">
          <template v-for="(card, index) in levelArray" :key="card.id">
            <v-tooltip text="Nhấn vào xem chi tiết" location="bottom">
              <template v-slot:activator="{ props }">
                <ProcessCard
                  v-bind="props"
                  :title="card.Type"
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
        <v-card
          v-show="Detail_Popup_Card"
          class="rounded-xl mt-6 border-0"
          elevation="0"
          color="transparent"
        >
          <v-card class="rounded-xl border" elevation="0">
            <v-card-title class="d-flex align-center pa-4 bg-surface border-b">
              <v-avatar color="primary" variant="tonal" size="32" class="me-3">
                <v-icon icon="mdi-information" size="20"></v-icon>
              </v-avatar>
              <span class="text-h6 font-weight-bold"
                >Chi tiết công đoạn sản xuất</span
              >
            </v-card-title>
            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="4">
                  <div class="mb-4">
                    <div class="text-overline text-medium-emphasis mb-1">
                      Công đoạn
                    </div>
                    <h2 class="text-h4 font-weight-bold text-primary">
                      {{ selectedTitle }}
                    </h2>
                  </div>
                  <v-divider class="mb-4"></v-divider>
                  <v-row dense>
                    <v-col cols="6">
                      <v-card
                        class="pa-4 rounded-xl border"
                        elevation="0"
                        color="surface-light"
                      >
                        <div class="d-flex align-center">
                          <v-avatar
                            color="info"
                            variant="tonal"
                            size="40"
                            class="me-3"
                          >
                            <v-icon size="24">mdi-arrow-collapse-up</v-icon>
                          </v-avatar>
                          <div>
                            <div
                              class="text-medium-emphasis text-caption font-weight-medium"
                            >
                              Top
                            </div>
                            <div class="text-h6 font-weight-bold">
                              {{ passTop }}
                            </div>
                          </div>
                        </div>
                      </v-card>
                    </v-col>

                    <v-col cols="6">
                      <v-card
                        class="pa-4 rounded-xl border"
                        elevation="0"
                        color="surface-light"
                      >
                        <div class="d-flex align-center">
                          <v-avatar
                            color="error"
                            variant="tonal"
                            size="40"
                            class="me-3"
                          >
                            <v-icon size="24">mdi-arrow-collapse-down</v-icon>
                          </v-avatar>
                          <div>
                            <div
                              class="text-medium-emphasis text-caption font-weight-medium"
                            >
                              Bottom
                            </div>
                            <div class="text-h6 font-weight-bold">
                              {{ passBottom }}
                            </div>
                          </div>
                        </div>
                      </v-card>
                    </v-col>
                    <v-col cols="6">
                      <v-card
                        class="pa-4 rounded-xl border"
                        elevation="0"
                        color="surface-light"
                      >
                        <div class="d-flex align-center">
                          <v-avatar
                            color="success"
                            variant="tonal"
                            size="40"
                            class="me-3"
                          >
                            <v-icon size="24">mdi-check-circle</v-icon>
                          </v-avatar>
                          <div>
                            <div
                              class="text-medium-emphasis text-caption font-weight-medium"
                            >
                              Tổng Pass
                            </div>
                            <div class="text-h6 font-weight-bold">
                              {{ passOneSide }}
                            </div>
                          </div>
                        </div>
                      </v-card>
                    </v-col>

                    <v-col cols="6">
                      <v-card
                        class="pa-4 rounded-xl border"
                        elevation="0"
                        color="surface-light"
                      >
                        <div class="d-flex align-center">
                          <v-avatar
                            color="warning"
                            variant="tonal"
                            size="40"
                            class="me-3"
                          >
                            <v-icon size="24">mdi-timer-sand</v-icon>
                          </v-avatar>
                          <div>
                            <div
                              class="text-medium-emphasis text-caption font-weight-medium"
                            >
                              Còn lại
                            </div>
                            <div class="text-h6 font-weight-bold">
                              {{ totalInput - passOneSide }}
                            </div>
                          </div>
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-col>
                <v-col
                  cols="3"
                  class="d-flex flex-column align-center justify-center"
                >
                  <v-pie
                    title="Biểu đồ phần trăm số lượng"
                    animation
                    :legend="{
                      position: 'bottom',
                    }"
                    :tooltip="{ subtitleFormat: '[value]%' }"
                    reveal
                    gap="2"
                    inner-cut="70"
                    item-key="key"
                    rounded="2"
                    hide-slice
                    :items="pieData"
                    :size="268"
                  >
                    <template v-slot:center>
                      <div class="text-center">
                        <div class="text-h4">
                          {{ passOneSide }}
                          <span style="font-size: 14px">pcs</span>
                        </div>
                        <div class="opacity-70 mt-1 mb-n1">Tổng Pass</div>
                      </div>
                    </template>
                  </v-pie>

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
                <v-col
                  cols="5"
                  class="d-flex flex-column align-center justify-center"
                >
                  <v-pie
                    title="Biểu đồ phần trăm Top và Bottom"
                    animation
                    :legend="{
                      position: 'bottom',
                    }"
                    :tooltip="{ subtitleFormat: '[value]%' }"
                    reveal
                    gap="2"
                    inner-cut="70"
                    item-key="key"
                    rounded="2"
                    hide-slice
                    :items="pieDataTopBottom"
                    :size="268"
                  >
                    <template v-slot:center>
                      <div class="text-center">
                        <div class="text-h4 text-info">
                          {{ passTop }}
                          <span style="font-size: 14px">pcs</span>
                        </div>
                        <v-divider :thickness="1"></v-divider>
                        <div class="text-h4 text-red">
                          {{ passBottom }}
                          <span style="font-size: 14px">pcs</span>
                        </div>
                      </div>
                    </template>
                  </v-pie>

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
              </v-row>
            </v-card-text>
          </v-card>
          <v-card class="rounded-xl border mt-5" elevation="0">
            <v-card-title class="d-flex align-center pa-4 bg-surface border-b">
              <v-avatar color="primary" variant="tonal" size="32" class="me-3">
                <v-icon icon="mdi-book-multiple" size="20"></v-icon>
              </v-avatar>
              <span class="text-h6 font-weight-bold">Kế hoạch sản xuất</span>
              <v-spacer></v-spacer>
              <ButtonAdd label="Thêm" class="mr-2" @click="DialogAdd = true" />
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <v-card variant="elevated" elevation="0" class="rounded-xl">
                    <v-data-table-virtual
                      :group-by="groupBy"
                      density="comfortable"
                      :headers="HeadersHistory"
                      :items="
                        history.filter((item) => item.Type === selectedTitle)
                      "
                      fixed-header
                      loading-text="Đang tải dữ liệu..."
                      no-data-text="Không có dữ liệu"
                      no-results-text="Không tìm thấy kết quả"
                      class="bg-transparent"
                      v-model:page="pageDetail"
                      v-model:items-per-page="itemsPerPageDetail"
                      hover
                    >
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
                                >{{ item.value }} ({{
                                  item.items.length
                                }})</span
                              >
                            </div>
                          </td>
                        </tr>
                      </template>

                      <template #[`item.id`]="{ item }">
                        <div class="d-flex gap-2">
                          <v-btn
                            icon="mdi-progress-check"
                            color="success"
                            size="small"
                            variant="text"
                            @click="DialogComplete = true; GetItemOutput(item)"
                          />
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
                    </v-data-table-virtual>
                  </v-card>
                </v-col>
                <v-col cols="12">
                  <StackedBarChart
                    :labels="days"
                    :passDataOneSide="passDataOneSide"
                    :passDataTop="passListTop"
                    :passDataBottom="passListBottom"
                    :planData="planList"
                    title="Kết quả sản xuất theo ngày"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-card>

        <!-- Chart thống kê công đoạn -->
        <v-row class="mb-6 mt-5">
          <!-- Chart Card -->
          <v-col cols="12" md="7">
            <v-card class="rounded-xl h-100 border" elevation="0">
              <v-card-title
                class="d-flex align-center pa-4 bg-surface border-b"
              >
                <v-avatar
                  color="primary"
                  variant="tonal"
                  size="32"
                  class="me-3"
                >
                  <v-icon icon="mdi-chart-bar" size="20"></v-icon>
                </v-avatar>
                <span class="text-h6 font-weight-bold"
                  >Thống kê theo công đoạn sản xuất</span
                >
              </v-card-title>
              <v-card-text class="pa-4">
                <StackedBarChartSummary
                  :labels="progress"
                  :passData="passData"
                  :planData="Array(progress.length).fill(totalInput)"
                  title="Kết quả sản xuất theo ngày"
                />
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Chart chi tiết công đoạn -->
          <v-col cols="12" md="5">
            <v-card class="rounded-xl h-100 border" elevation="0">
              <v-card-title
                class="d-flex align-center pa-4 bg-surface border-b"
              >
                <v-avatar
                  color="primary"
                  variant="tonal"
                  size="32"
                  class="me-3"
                >
                  <v-icon icon="mdi-chart-donut" size="20"></v-icon>
                </v-avatar>
                <span class="text-h6 font-weight-bold"
                  >Tiến trình công đoạn</span
                >
              </v-card-title>
              <v-card-text class="pa-4 d-flex justify-center">
                <v-pie
                  title="Biểu đồ phần trăm số lượng"
                  animation
                  :legend="{
                    position: 'bottom',
                  }"
                  :tooltip="{ subtitleFormat: '[value]%' }"
                  reveal
                  gap="2"
                  inner-cut="70"
                  item-key="key"
                  rounded="2"
                  hide-slice
                  :items="pieDataProccess"
                  :size="268"
                >
                  <template v-slot:center>
                    <div class="text-center">
                      <div class="text-h4">
                        {{
                          passData.length > 0
                            ? passData[passData.length - 1]
                            : passOneSide
                        }}
                        <span style="font-size: 14px">pcs</span>
                      </div>
                      <div class="opacity-70 mt-1 mb-n1">
                        {{
                          progress.length > 0
                            ? progress[progress.length - 1]
                            : "Tổng Pass"
                        }}
                      </div>
                    </div>
                  </template>
                </v-pie>

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
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Lịch sử sản xuất -->
        <v-card class="rounded-xl mt-5 border" elevation="0">
          <v-data-table
            :headers="HeadersHistoryPart"
            :items="historyPart"
            :search="searchHistory"
            fixed-header
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            class="bg-transparent"
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
            hover
            density="comfortable"
            height="50vh"
          >
            <template v-slot:top>
              <v-toolbar flat color="transparent" class="border-b px-2">
                <v-toolbar-title class="d-flex align-center">
                  <v-avatar
                    color="primary"
                    variant="tonal"
                    size="32"
                    class="me-3"
                  >
                    <v-icon icon="mdi-history" size="20"></v-icon>
                  </v-avatar>
                  <span class="text-h6 font-weight-bold">Lịch sử sản xuất</span>
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
    <BaseDialog
      v-model="DialogAdd"
      title="Thêm dữ liệu kế hoạch"
      icon="mdi-plus"
      max-width="800"
    >
      <!-- FORM để nguyên -->
      <v-form ref="formRef" v-model="isFormValid">
        <v-row>
          <v-col col="12" md="6">
            <InputField disabled label="Số PO" v-model="PONumber_Add" />
          </v-col>
          <v-col col="12" md="6">
            <InputField disabled label="Đơn hàng" v-model="Name_Order_Add" />
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
        <v-autocomplete
          label="Tên hạng mục"
          variant="outlined"
          clearable
          :items="groupEditCategory"
          v-model="Category_Add"
          :rules="requiredRuleEmpty"
        ></v-autocomplete>
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

        <InputDate
          label="Ngày tạo"
          v-model="Date_DetailManufacture_Add"
          :rules="requiredRuleEmpty"
        />
        <InputTextarea label="Ghi chú" v-model="Note_Add" />
      </v-form>

      <!-- ACTION -->
      <template #actions>
        <ButtonCancel @cancel="DialogAdd = false" />
        <ButtonSave
          @save="SaveAdd()"
          :disabled="
            !PONumber_Add ||
            !Name_Order_Add ||
            !Type_Add ||
            !Surface_Add ||
            !Category_Add ||
            !Quantity_Plan_Add ||
            !CycleTime_Add ||
            !Time_Add ||
            !Date_DetailManufacture_Add
          "
        />
      </template>
    </BaseDialog>

    <!-- Dialog Edit -->
    <BaseDialog
      v-model="DialogEdit"
      title="Sửa dữ liệu kế hoạch"
      icon="mdi-pencil"
      max-width="800"
    >
      <v-row>
        <v-col col="12" md="6">
          <InputField disabled label="Số PO" v-model="PONumber_Edit" />
        </v-col>
        <v-col col="12" md="6">
          <InputField disabled label="Đơn hàng" v-model="Name_Order_Edit" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="4">
          <InputSelect
            label="Quy trình"
            :items="LevelSelectAdd"
            hint="Lựa chọn quy trình phù hợp"
            v-model="Type_Edit"
            @update:model-value="(val) => (Type_Edit = val)"
          />
        </v-col>
        <v-col cols="4">
          <InputSelect
            label="Bề mặt"
            :items="['TOP', 'BOTTOM', '1 Mặt']"
            hint="Lựa chọn bề mặt phù hợp"
            v-model="Surface_Edit"
            :rules="requiredRuleEmpty"
          />
        </v-col>
        <v-col cols="4">
          <InputSelect
            label="Vị trí line"
            :items="['Line 1', 'Line 2']"
            hint="Lựa chọn công đoạn phù hợp"
            v-model="Line_Edit"
            :rules="requiredRule"
            :disabled="Type_Edit != 'SMT'"
          />
        </v-col>
      </v-row>
      <v-autocomplete
        label="Tên hạng mục"
        :items="
          history
            .filter((item) => item.Type === selectedTitle)
            .map((item) => item.Category)
        "
        v-model="Category_Edit"
      ></v-autocomplete>

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
      <InputDate label="Ngày tạo" v-model="Date_DetailManufacture_Edit" />
      <InputTextarea label="Ghi chú" v-model="Note_Edit" />
      <template #actions>
        <ButtonDelete @delete="DialogRemove = true" />
        <v-spacer></v-spacer>
        <ButtonCancel @cancel="DialogEdit = false" />
        <ButtonSave @save="SaveEdit()" />
      </template>
    </BaseDialog>

    <!-- Dialog Complete   -->
    <BaseDialog
      v-model="DialogComplete"
      title="Hoàn thành dữ liệu kế hoạch"
      icon="mdi-check-circle"
      max-width="500px"
    >
      <v-row>
        <v-col cols="12">
          <InputField
            label="Số lượng (pcs)"
            type="number"
            v-model="Quantity_Complete_Complete"
            :rules="requiredRuleEmpty"
          />
        </v-col>
      </v-row>

      <template #actions>
        <v-spacer />
        <ButtonCancel @cancel="DialogComplete = false" />
        <ButtonSave @save="CompleteItem()" />
      </template>
    </BaseDialog>

    <!-- Dialog Remove -->
    <BaseDialog
      v-model="DialogRemove"
      title="Xoá dữ liệu kế hoạch"
      icon="mdi-trash-can"
      max-width="500px"
    >
      Bạn có chắc chắn muốn xóa dữ liệu kế hoạch này?
      <template #actions>
        <v-spacer />
        <ButtonCancel @cancel="DialogRemove = false" />
        <ButtonDelete @delete="RemoveItem()" />
      </template>
    </BaseDialog>

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
import { debounce } from "lodash-es";
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
import PointLineChartSummary from "@/components/Chart-PointLine-Summary.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import InputDate from "@/components/Input-Date.vue";

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
const DialogComplete = ref(false);
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
const totalError = ref(0);
const totalFixed = ref(0);

const totalOutput = computed(() => {
  return (
    historyPart.value
      .filter((item) => item.Source === "Thành phẩm")
      .reduce((acc, item) => acc + item.Quantity, 0) || 0
  );
});
const PercentOutput = computed(() =>
  Number.parseFloat((totalOutput.value * 100) / totalInput.value).toFixed(1),
);

const PercentError = computed(() =>
  Number.parseFloat((totalError.value * 100) / totalInput.value).toFixed(1),
);

const PercentFixed = computed(
  () => (totalFixed.value * 100) / totalError.value,
);
// Level
const Level_SMT = ref(false);
const LevelSelectAdd = ref(null);
const levelArray = ref([]);
// Data
const DataManufacture = ref(null);

const historys = ref([]);
const passTop = ref(0);
const passBottom = ref(0);
const passOneSide = ref(0);
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
const Surface_Add = ref("1 Mặt");

// ===== FORM EDIT =====
const Type_Edit = ref("");
const Surface_Edit = ref("");
const PONumber_Edit = ref("");
const Name_Order_Edit = ref("");
const Category_Edit = ref("");
const Line_Edit = ref("");
const Quantity_Plan_Edit = ref("");
const CycleTime_Edit = ref("");
const Note_Edit = ref("");
const Date_DetailManufacture_Edit = ref("");

const Quantity_Complete_Complete = ref("");

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

// Choose card with hightlight board
const selectedTitle = ref(null);
const Detail_Popup_Card = ref(false);

//Hearder table
// Hearder table
const HeadersHistoryPart = [
  { title: "STT", key: "stt" },
  { title: "Mã hàng", key: "PartNumber", sortable: true },
  { title: "Vị trí", key: "Source", sortable: true },
  { title: "Trạng thái", key: "Status", sortable: true },
  { title: "Số lượng", key: "Quantity", sortable: true },
  { title: "Thời gian", key: "Timestamp", sortable: true },
  // { title: "RW đã sửa", key: "RWID", sortable: true },
  // { title: "Thời gian RW", key: "TimestampRW", sortable: true },
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

const groupBy = [{ key: "Category" }];
const  groupEditCategory = ref([])

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
      { title: "Đầu ra", key: "Quantity_Real" },
      { title: "Phần trăm (%)", key: "Percent" },
      // { title: "RW đã sửa", key: "Total_Fixed"},
    ],
  },
  { title: "Ghi chú", key: "Note" },
  { title: "Thao tác", key: "id", sortable: false },
];

// Chart
const days = computed(() => {
  return history.value
    .filter((item) => item.Type === selectedTitle.value)
    .map((item) => formatDate(item.Created_At));
});

const passListTop = computed(() =>
  history.value
    .filter(
      (item) => item.Type === selectedTitle.value && item.Surface === "TOP",
    )
    .map((item) => Number(item.Quantity_Real || 0)),
);

const passListBottom = computed(() =>
  history.value
    .filter(
      (item) => item.Type === selectedTitle.value && item.Surface === "BOTTOM",
    )
    .map((item) => Number(item.Quantity_Real || 0)),
);

const passDataOneSide = computed(() =>
  history.value
    .filter(
      (item) => item.Type === selectedTitle.value && item.Surface === "1 Mặt",
    )
    .map((item) => Number(item.Quantity_Real || 0)),
);

const planList = computed(() =>
  history.value
    .filter((item) => item.Type === selectedTitle.value)
    .map((item) => Number(item.Quantity_Plan || 0)),
);

const passListSummary = computed(() => {
  const grouped = {};

  historyPart.value.forEach((item) => {
    const source = item.Source;
    const surface = item.Surface;
    const qty = Number(item.Quantity || 0);

    if (!grouped[source]) {
      grouped[source] = {
        top: 0,
        bottom: 0,
        oneSide: 0,
      };
    }

    // 1 mặt => lấy total luôn
    if (surface === "1 Mặt") {
      grouped[source].oneSide += qty;
    }

    // TOP
    if (surface === "TOP") {
      grouped[source].top += qty;
    }

    // BOTTOM
    if (surface === "BOTTOM") {
      grouped[source].bottom += qty;
    }
  });

  // Tính kết quả cuối
  const result = {};

  Object.keys(grouped).forEach((source) => {
    const item = grouped[source];

    // nếu có 1 mặt
    if (item.oneSide > 0) {
      result[source] = item.oneSide;
    } else {
      // lấy giá trị nhỏ hơn giữa TOP và BOTTOM
      result[source] = Math.min(item.top, item.bottom);
    }
  });

  return result;
});

const progress = computed(() => Object.keys(passListSummary.value));

const passData = computed(() => Object.values(passListSummary.value));

const pieData = computed(() => {
  const pass = Number(passOneSide.value) || 0;
  const total = Number(totalInput.value) || 0;

  if (total === 0 && pass === 0) {
    return [
      {
        key: 1,
        title: "Còn lại",
        value: 100,
        color: "rgba(var(--v-theme-on-surface), .2)",
        pattern: "url(#pattern-0)",
      },
    ];
  }

  const remaining = Math.max(total - pass, 0);
  const divisor = total || 1;

  return [
    {
      key: 1,
      title: "Pass",
      value: Number(((pass / divisor) * 100).toFixed(1)),
      color: "#72c789",
    },
    {
      key: 2,
      title: "Còn lại",
      value: 100 - Number(((pass / divisor) * 100).toFixed(1)),
      color: "rgba(var(--v-theme-on-surface), .2)",
      pattern: "url(#pattern-0)",
    },
  ];
});

const pieDataTopBottom = computed(() => {
  const pieTop = Number(passTop.value) || 0;
  const pieBottom = Number(passBottom.value) || 0;
  const total = Number(totalInput.value) || 0;

  if (total === 0 && pieTop === 0 && pieBottom === 0) {
    return [
      {
        key: 1,
        title: "Còn lại",
        value: 100,
        color: "rgba(var(--v-theme-on-surface), .2)",
        pattern: "url(#pattern-0)",
      },
    ];
  }
  const divisor = pieTop + pieBottom || 1;

  return [
    {
      key: 1,
      title: "Top",
      value: Number(((pieTop / divisor) * 100).toFixed(1)) || 0,
      color: "#1976d2",
    },
    {
      key: 2,
      title: "Bottom",
      value: Number(((pieBottom / divisor) * 100).toFixed(1)) || 0,
      color: "#ff6361",
    },
    {
      key: 3,
      title: "Còn lại",
      value:
        100 -
        Number(((pieTop / divisor) * 100).toFixed(1)) -
        Number(((pieBottom / divisor) * 100).toFixed(1)),
      color: "rgba(var(--v-theme-on-surface), .2)",
      pattern: "url(#pattern-0)",
    },
  ];
});

const pieDataProccess = computed(() => {
  const total = Number(totalInput.value) || 0;
  const labels = progress.value || [];
  const values = passData.value || [];

  if (total === 0 || labels.length === 0) {
    return [
      {
        key: 1,
        title: "Còn lại",
        value: 100,
        color: "rgba(var(--v-theme-on-surface), .2)",
        pattern: "url(#pattern-0)",
      },
    ];
  }

  const colors = [
    "#1976d2",
    "#fb8c00",
    "#43a047",
    "#f44336",
    "#9c27b0",
    "#3f51b5",
    "#00acc1",
    "#ffeb3b",
  ];

  // Map each stage to a slice
  const items = labels.map((label, index) => {
    const val = Number(values[index]) || 0;
    const percent = Number(((val / total) * 100).toFixed(1)) || 0;
    return {
      key: index + 1,
      title: label,
      value: percent,
      color: colors[index % colors.length],
    };
  });

  // Calculate 'Remaining' based on the last stage (highest progress)
  const maxPass =
    values.length > 0 ? Math.max(...values.map((v) => Number(v) || 0)) : 0;
  const remainingPercent = Math.max(
    100 - Number(((maxPass / total) * 100).toFixed(1)),
    0,
  );

  if (remainingPercent > 0.1) {
    items.push({
      key: items.length + 1,
      title: "Còn lại",
      value: Number(remainingPercent.toFixed(1)),
      color: "rgba(var(--v-theme-on-surface), .2)",
      pattern: "url(#pattern-0)",
    });
  }

  return items;
});

// Table Fail

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
const isManufactureDetailsReady = ref(false);
const isManufactureSummaryReady = ref(false);
const currentDetailStatsLoading = ref(true); // ✅ Loading riêng cho currentDetailStats

watch(
  manufactureDetails,
  (newValue) => {
    // ✅ Kiểm tra dữ liệu có hợp lệ không
    if (!newValue || typeof newValue !== "object") {
      isManufactureDetailsReady.value = false;
      return;
    }

    const data = Array.isArray(newValue) ? newValue[0] : newValue;

    if (!data || typeof data.Level !== "string" || !data.Level.trim()) {
      levelArray.value = [];
      isManufactureDetailsReady.value = false;
      return;
    }

    // ✅ Tách chuỗi Level thành mảng công đoạn
    let levels = data.Level.split("-").map((s) => s.trim());
    if (levels.length === 0) {
      levelArray.value = [];
      isManufactureDetailsReady.value = false;
      return;
    }

    // ✅ Sắp xếp thứ tự công đoạn
    levels = levels.sort((a, b) => {
      const upperA = a.toUpperCase();
      const upperB = b.toUpperCase();

      // 1️⃣ SMT luôn ở đầu
      if (upperA.includes("SMT") && !upperB.includes("SMT")) return -1;
      if (!upperA.includes("SMT") && upperB.includes("SMT")) return 1;

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

    // ---- Gán các giá trị khác ----
    DataManufacture.value = data.Level;
    Level_SMT.value = data.Level.includes("SMT");
    totalInput.value = data.Total || 0;
    totalError.value = data.Quantity_Error || 0;
    totalFixed.value = data.Quantity_Fixed || 0;
    Quantity_Edit.value = data.Quantity;
    DelaySMT_Edit.value = data.DelaySMT;
    LevelSelectAdd.value = data.Level.split("-");
    NameOrder.value = data.Name_Order;
    Name_Order_Add.value = data.Name_Order;
    Name_Order_Edit.value = data.Name_Order;

    // ✅ Đánh dấu dữ liệu đã sẵn sàng
    isManufactureDetailsReady.value = true;
  },
  { immediate: true, deep: true },
);

watch(
  () => route.query.Type,
  (newType) => {
    typeFilter.value = newType || null;
  },
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
  { immediate: true, deep: true },
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
    ([_, value]) => Number.isFinite(value) && value > 0,
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
  // if (item.Type === "SMT") {
  //   router.push(`/San-xuat/SMT/${item.id}`);
  // } else if (item.Type === "RW") {
  //   router.push(`/San-xuat/RW/${item.id}`);
  // } else {
  //   router.push(`/San-xuat/${item.Type}/${item.id}`);
  // }
  router.push(`/San-xuat/${item.Type}/${item.id}`);
};

const GetItem = (item) => {
  DialogEdit.value = true;
  Type_Edit.value = item.Type;
  PONumber_Edit.value = item.PONumber;
  Name_Order_Edit.value = item.Name_Order;
  Category_Edit.value = item.Category;
  Line_Edit.value = item.Line_SMT;
  Surface_Edit.value = item.Surface;
  Quantity_Plan_Edit.value = item.Quantity_Plan;
  CycleTime_Edit.value = item.CycleTime_Plan;
  Time_Edit.value = item.Time_Plan;
  Note_Edit.value = item.Note;
  Date_DetailManufacture_Edit.value = item.Created_At_unixepoch;
  GetID.value = item.id;
};

const GetItemOutput = (item) => {
  Type_Edit.value = item.Type;
  PONumber_Edit.value = item.PONumber;
  Name_Order_Edit.value = item.Name_Order;
  Category_Edit.value = item.Category;
  Line_Edit.value = item.Line_SMT;
  Surface_Edit.value = item.Surface;
  Quantity_Plan_Edit.value = item.Quantity_Plan;
  CycleTime_Edit.value = item.CycleTime_Plan;
  Time_Edit.value = item.Time_Plan;
  Note_Edit.value = item.Note;
  Date_DetailManufacture_Edit.value = item.Created_At_unixepoch;
  GetID.value = item.id;
};

const selectCard = (title) => {
  selectedTitle.value = title;
  Detail_Popup_Card.value = true;
  Type_Add.value = title;
  groupEditCategory.value = [
    ...new Set(
      history.value
        .filter((item) => item.Type === selectedTitle.value)
        .map((item) => item.Category)
        .filter(Boolean),
    ),
  ];
  historys.value = historyPart.value.filter((item) => item.Source === title);

  if (title === "SMT" || title === "AOI") {
    passTop.value = historys.value
      .filter((item) => item.Surface === "TOP")
      .reduce((sum, item) => sum + Number(item.Quantity || 0), 0);

    passBottom.value = historys.value
      .filter((item) => item.Surface === "BOTTOM")
      .reduce((sum, item) => sum + Number(item.Quantity || 0), 0);

    passOneSide.value = historys.value
      .filter((item) => item.Surface === "1 Mặt")
      .reduce((sum, item) => sum + Number(item.Quantity || 0), 0);

    // Nếu TOP hoặc BOTTOM lớn hơn thì dùng giá trị lớn nhất
    if (passTop.value > passOneSide.value) {
      passOneSide.value = passBottom.value;
    }

    if (passBottom.value > passOneSide.value) {
      passOneSide.value = passTop.value;
    }
  } else {
    passOneSide.value = historys.value
      .filter((item) => item.Surface === "1 Mặt")
      .reduce((sum, item) => sum + Number(item.Quantity || 0), 0);

    passTop.value = 0;
    passBottom.value = 0;
  }
};

const toggleBottleneck = () => {
  // Hành động chuyển đổi Bottleneck (giữ nguyên)
  console.log("Toggle Bottleneck action...");
  // Logic thực tế để thay đổi trạng thái isBottleneck của một card nào đó
};

const HandleBottleneckAction = (title) => {
  // 🚨 HÀNH ĐỘNG MỚI KHI NHẤN VÀO VIỀN ĐỎ
  console.error(
    `🚨 [BOTTLENECK PRIORITY] Đã nhấn vào Bottleneck: ${title}. Cần xử lý gấp!`,
  );
  // Thêm logic xử lý ưu tiên tại đây (ví dụ: mở modal, gọi API xử lý)
};

const CloseTabProgress = () => {
  router.push(`/San-xuat/Chi-tiet/${route.params.id}`);
  Detail_Popup_Card.value = false;
};

const SaveEdit = async () => {
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
    Surface: Surface_Edit.value,
  });

  try {
    const response = await axios.put(
      `${Url}/Summary/Edit-item/${GetID.value}`,
      formData,
    );
    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    DialogSuccess.value = true;
  } catch (error) {
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    DialogFailed.value = true;
  } finally {
    DialogEdit.value = false;
    DialogLoading.value = false;
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
    DialogSuccess.value = true;
    DialogAdd.value = false;
  } catch (error) {
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    DialogFailed.value = true;
    DialogAdd.value = false;
  }
};

const CompleteItem = async () => {
  DialogLoading.value = true;
  // 2. Cấu trúc lại formData để bao gồm tất cả dữ liệu
  const formData = reactive({
    HistoryID: GetID.value,
    PartNumber: Category_Edit.value,
    Status: "pass",
    GroupFail: null,
    Note: null,
    PlanID: route.params.id,
    Type: Type_Edit.value,
    Quantity: Quantity_Complete_Complete.value || 1,
    Surface: Surface_Edit.value,
  });

  try {
    const response = await axios.post(`${Url}/ManufactureCounting`, formData);
    DialogLoading.value = false;

    // Reset các giá trị sau khi thành công
    Quantity_Complete_Complete.value = 1
    DialogSuccess.value = true;
    DialogComplete.value = false;
    MessageDialog.value = "Sản phẩm đã được nhập thành công";
  } catch (error) {
    DialogLoading.value = false;
    Quantity_Complete_Complete.value = 1;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Lỗi khi nhập mã sản phẩm";
  }
};

// Hàm xóa item
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Summary/Delete-item/${GetID.value}?PlanID=${route.params.id}&Type=${Type_Edit.value}`,
    );
    MessageDialog.value = "Xoá dữ liệu thành công";
    DialogSuccess.value = true;
  } catch (error) {
    MessageErrorDialog.value = "Xoá dữ liệu thất bạị";
    DialogFailed.value = true;
  }
};

// Hàm xóa item lịch sử sản xuất
const RemoveItemHistory = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Manufacture/Delete-item-history/${GetIDHistory.value}?table=${GetSourceHistory.value}`,
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
  Surface_Add.value = "1 Mặt";
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
  Type_Add.value = selectedTitle.value;
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
    CardStatistic,
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
