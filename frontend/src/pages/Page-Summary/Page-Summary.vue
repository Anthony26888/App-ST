<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="calc(100vh)">
    <v-card-title
      class="d-flex flex-wrap justify-space-between align-center pa-4 ga-2"
    >
      <span class="text-h4 font-weight-light" v-if="lgAndUp"
        >Báo cáo hằng ngày</span
      >
      <v-spacer v-if="lgAndUp"></v-spacer>
      <div class="d-flex align-center flex-wrap ga-2 justify-end">
        <v-tooltip text="Phân tích AI" location="start">
          <template v-slot:activator="{ props }">
            <v-btn variant="text" class="mt-2" @click="analyze" v-bind="props">
              <v-icon start size="24" color="primary">mdi-robot</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-sheet
          rounded="lg"
          border
          class="d-flex align-center px-4 py-2 mt-2 ms-2"
          color="surface"
          elevation="0"
          v-tooltip="'Chọn ngày xem báo cáo'"
        >
          <div class="text-subtitle-2 mr-4 text-medium-emphasis">
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
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="mdi-calendar"
                class="font-weight-bold"
              >
                {{ formattedSelectedDate }}
              </v-btn>
            </template>
            <v-date-picker
              v-model="selectedDate"
              @update:model-value="dateMenu = false"
              :first-day-of-week="1"
              color="primary"
            ></v-date-picker>
          </v-menu>
        </v-sheet>
      </div>
    </v-card-title>

    <!-- Thống kê tổng quan -->
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <CardStatistic
            title="Tổng số dự án"
            :value="summaryPlanManufacture.length || 0"
            icon="mdi-book-multiple"
            color="primary"
          >
            <template #bottom>
              <div
                class="text-caption text-success mt-2"
                v-if="projectComparePercent > 0"
              >
                +{{ projectComparePercent }}% vs hôm qua
              </div>
              <div
                class="text-caption text-error mt-2"
                v-else-if="projectComparePercent < 0"
              >
                {{ projectComparePercent }}% vs hôm qua
              </div>
              <div class="text-caption text-warning mt-2" v-else>
                0% vs hôm qua
              </div>
            </template>
          </CardStatistic>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <CardStatistic
            title="Tổng số hạng mục"
            :value="summary.length || 0"
            icon="mdi-tag"
            color="info"
          >
            <template #bottom>
              <div
                class="text-caption text-success mt-2"
                v-if="categoryComparePercent > 0"
              >
                +{{ categoryComparePercent }}% vs hôm qua
              </div>
              <div
                class="text-caption text-error mt-2"
                v-else-if="categoryComparePercent < 0"
              >
                {{ categoryComparePercent }}% vs hôm qua
              </div>
              <div class="text-caption text-warning mt-2" v-else>
                0% vs hôm qua
              </div>
            </template>
          </CardStatistic>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <CardStatistic
            title="Hạng mục hoàn thành"
            :value="totalCategoryPassToday.length || 0"
            icon="mdi-check-circle"
            color="success"
          >
            <template #bottom>
              <div class="text-caption text-medium-emphasis mt-2">
                Đạt mục tiêu: {{ goalAchievementPercent }}%
              </div>
            </template>
          </CardStatistic>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <CardStatistic
            title="Dự án đang thực hiện"
            :value="totalCategoryInProgressToday"
            icon="mdi-clock-time-three-outline"
            color="warning"
          >
            <template #bottom>
              <div class="text-caption text-error font-weight-bold mt-2">
                Đang trễ
              </div>
            </template>
          </CardStatistic>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="7">
          <v-card class="mb-4 rounded-xl border" elevation="0" height="540px">
            <v-card-title class="d-flex align-center">
              <v-avatar color="primary" variant="tonal" size="32" class="me-3">
                <v-icon icon="mdi-list-status" size="20"></v-icon>
              </v-avatar>
              <span class="text-h6 font-weight-bold"
                >Đơn hàng đang sản xuất</span
              >
            </v-card-title>
            <v-card-text
              class="overflow-y-auto"
              style="height: calc(100% - 64px)"
            >
              <v-data-table-virtual
                density="compact"
                :items="summary"
                :search="search"
                class="bg-transparent"
                :headers="HeadersProject"
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
                <template #[`item.Quantity_Plan`]="{ item }">
                  <v-chip color="primary" variant="tonal" size="small">{{
                    item.Quantity_Plan
                  }}</v-chip>
                </template>
                <template #[`item.Quantity_Counting`]="{ item }">
                  <v-chip color="success" variant="tonal" size="small">{{
                    item.Quantity_Counting
                  }}</v-chip>
                </template>
                <template v-slot:item.Percent="{ item }">
                  <v-progress-linear
                    :model-value="Number(item.Percent || 0)"
                    height="25"
                    color="success"
                    rounded
                    class="rounded-lg"
                  >
                    <strong>{{ Number(item.Percent || 0).toFixed(1) }}%</strong>
                  </v-progress-linear>
                </template>
              </v-data-table-virtual>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="5">
          <v-card class="mb-4 rounded-xl border" elevation="0">
            <v-card-title class="d-flex align-center">
              <v-avatar color="primary" variant="tonal" size="32" class="me-3">
                <v-icon icon="mdi-chart-donut" size="20"></v-icon>
              </v-avatar>
              <span class="text-h6 font-weight-bold"
                >Phân bổ theo hạng mục</span
              >
            </v-card-title>
            <v-card-text class="overflow-y-auto">
              <!-- Sơ lược hạng mục cao nhất, thấp nhất -->
              <v-row class="mb-2" dense>
                <v-col cols="6">
                  <v-card
                    variant="tonal"
                    class="rounded-lg text-success pa-2"
                    elevation="0"
                  >
                    <div
                      class="text-caption text-medium-emphasis font-weight-medium"
                    >
                      Hạng mục cao nhất
                    </div>
                    <div
                      class="text-subtitle-1 font-weight-bold text-truncate"
                      :title="maxPassCategory"
                    >
                      {{ maxPassCategory || "-" }}
                    </div>
                    <div class="text-caption font-weight-bold">
                      {{ maxPassCategoryData }} pcs
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card
                    variant="tonal"
                    class="rounded-lg text-warning pa-2"
                    elevation="0"
                  >
                    <div
                      class="text-caption text-medium-emphasis font-weight-medium"
                    >
                      Hạng mục thấp nhất
                    </div>
                    <div
                      class="text-subtitle-1 font-weight-bold text-truncate"
                      :title="minPassCategory"
                    >
                      {{ minPassCategory || "-" }}
                    </div>
                    <div class="text-caption font-weight-bold">
                      {{ minPassCategoryData || "-" }} pcs
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <ChartDonutSummary
                :labels="categoryLabels"
                :data="categoryData"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="4">
          <v-card class="mb-4 rounded-xl border" elevation="0" height="600px">
            <v-card-title class="d-flex align-center">
              <v-avatar color="primary" variant="tonal" size="32" class="me-3">
                <v-icon icon="mdi-list-status" size="20"></v-icon>
              </v-avatar>
              <span class="text-h6 font-weight-bold">Danh sách hạng mục</span>
            </v-card-title>
            <v-card-text
              class="overflow-y-auto"
              style="height: calc(100% - 64px)"
            >
              <v-list
                :lines="false"
                density="compact"
                nav
                v-if="summaryTypeGrouped.length > 0"
              >
                <!-- TYPE -->
                <v-list-group v-for="(type, i) in summaryTypeGrouped" :key="i">
                  <template #activator="{ props }">
                    <v-list-item
                      v-bind="props"
                      :title="type.Type"
                      prepend-icon="mdi-cog"
                    />
                  </template>

                  <!-- CATEGORY -->
                  <v-list-item
                    v-for="(categoryItem, j) in type.categories"
                    :key="j"
                    :title="categoryItem.Category"
                    prepend-icon="mdi-tag"
                    :value="categoryItem.Category"
                    color="primary"
                    @click="
                      handleCategoryClick(categoryItem.Category, categoryItem)
                    "
                  />
                </v-list-group>
              </v-list>
              <v-empty-state
                v-else
                class="mt-5"
                title="Không có dữ liệu"
                text="Không có dữ liệu để hiển thị"
                icon="mdi-chart-bar"
              ></v-empty-state>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="8">
          <v-card class="mb-4 rounded-xl border" elevation="0" height="600px">
            <v-card-title class="d-flex align-center">
              <v-avatar color="primary" variant="tonal" size="32" class="me-3">
                <v-icon icon="mdi-chart-bar" size="20"></v-icon>
              </v-avatar>
              <span class="text-h6 font-weight-bold"
                >Hạng mục {{ selectedCategory }}</span
              >
              <v-spacer></v-spacer>
              <v-btn
                v-if="selectedCategory !== ''"
                color="error"
                variant="tonal"
                class="text-caption"
                rounded="xl"
                prepend-icon="mdi-close"
                @click="handleClose"
              >
                Đóng
              </v-btn>
            </v-card-title>
            <v-card-text
              v-if="selectedCategory !== ''"
              class="overflow-y-auto"
              style="height: calc(100% - 64px)"
            >
              <v-row>
                <v-col cols="12" sm="4">
                  <v-card
                    variant="tonal"
                    class="rounded-lg text-primary pa-2"
                    elevation="0"
                    height="95px"
                  >
                    <div
                      class="text-caption text-medium-emphasis font-weight-medium"
                    >
                      Kế hoạch
                    </div>
                    <div class="text-subtitle-1 font-weight-bold text-truncate">
                      {{
                        selectedCategoryData.find(
                          (item) => item.Category === selectedCategory,
                        )?.Quantity_Plan || 0
                      }}
                      pcs
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-card
                    variant="tonal"
                    class="rounded-lg text-success pa-2"
                    elevation="0"
                    height="95px"
                  >
                    <div
                      class="text-caption text-medium-emphasis font-weight-medium"
                    >
                      Hoàn thành
                    </div>
                    <div class="text-subtitle-1 font-weight-bold text-truncate">
                      {{
                        selectedCategoryData.find(
                          (item) => item.Category === selectedCategory,
                        )?.Quantity_Counting || 0
                      }}
                      pcs
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-card
                    variant="tonal"
                    class="rounded-lg text-warning pa-2"
                    elevation="0"
                    height="95px"
                  >
                    <div
                      class="text-caption text-medium-emphasis font-weight-medium"
                    >
                      Tỉ lệ
                    </div>
                    <div class="text-subtitle-1 font-weight-bold text-truncate">
                      {{ selectedCategoryRate }}%
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12">
                  <LinePointChart
                    :title="`Tiến độ ${selectedCategory}`"
                    :labels="progress"
                    :datasets="[
                      {
                        label: 'Số lượng',
                        data: passList,
                        color: '#1976D2',
                      },
                    ]"
                  />
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-text
              v-else
              class="overflow-y-auto"
              style="height: calc(100% - 64px)"
            >
              <v-row>
                <v-col cols="12" sm="4">
                  <v-card
                    variant="tonal"
                    class="rounded-lg text-primary pa-2"
                    elevation="0"
                    height="95px"
                  >
                    <div
                      class="text-caption text-medium-emphasis font-weight-medium"
                    >
                      Tổng số công đoạn
                    </div>
                    <div
                      class="text-subtitle-1 font-weight-bold text-truncate"
                      :title="progressGroup.length"
                    >
                      {{ progressGroup.length || 0 }}
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-card
                    variant="tonal"
                    class="rounded-lg text-success pa-2"
                    elevation="0"
                    height="95px"
                  >
                    <div
                      class="text-caption text-medium-emphasis font-weight-medium"
                    >
                      Công đoạn cao nhất
                    </div>
                    <div
                      class="text-subtitle-1 font-weight-bold text-truncate"
                      :title="maxPassTypeGroup"
                    >
                      {{ maxPassTypeGroup }}
                    </div>
                    <div class="text-caption font-weight-bold">
                      {{ maxPassDataGroup }} pcs
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-card
                    variant="tonal"
                    class="rounded-lg text-error pa-2"
                    elevation="0"
                    height="95px"
                  >
                    <div
                      class="text-caption text-medium-emphasis font-weight-medium"
                    >
                      Công đoạn thấp nhất
                    </div>
                    <div
                      class="text-subtitle-1 font-weight-bold text-truncate"
                      :title="minPassTypeGroup"
                    >
                      {{ minPassTypeGroup }}
                    </div>
                    <div class="text-caption font-weight-bold">
                      {{ minPassDataGroup }} pcs
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12">
                  <StackedBarChartSummary
                    :labels="progressGroup"
                    :passData="passDataGroup"
                    title="Kết quả sản xuất theo công đoạn"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <BaseDialog
    v-model="DialogAI"
    max-width="1000px"
    :title="'Phân tích AI - Báo cáo ngày ' + formattedSelectedDate"
    icon="mdi-robot"
  >
    <v-card>
      <v-card-text class="pa-6">
        <div v-if="aiLoading && !aiText" class="text-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="mt-4 text-medium-emphasis">AI đang phân tích dữ liệu...</p>
        </div>

        <div v-else-if="aiText">
          <v-row>
            <!-- Left Col: Analysis Result -->
            <v-col cols="12" md="6">
              <v-alert
                type="info"
                variant="tonal"
                class="h-100"
                style="max-height: 550px; overflow-y: auto"
              >
                <div class="text-subtitle-2 font-weight-bold mb-2">
                  📊 Phân tích từ AI:
                </div>
                <div style="white-space: pre-wrap; line-height: 1.6">
                  {{ aiText }}
                </div>
              </v-alert>
            </v-col>

            <!-- Right Col: Chat Interface -->
            <v-col cols="12" md="6">
              <div class="d-flex flex-column h-100">
                <div
                  class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center"
                >
                  <v-icon icon="mdi-chat" class="mr-2" color="primary"></v-icon>
                  💬 Hỏi thêm AI
                </div>

                <!-- Chat Messages -->
                <div
                  class="chat-messages mb-4 pa-3 rounded-lg flex-grow-1"
                  style="
                    height: 400px;
                    overflow-y: auto;
                    background-color: rgba(var(--v-theme-surface-variant), 0.3);
                  "
                  ref="chatContainer"
                >
                  <div
                    v-if="messages.length === 0"
                    class="text-center text-medium-emphasis mt-10"
                  >
                    <v-icon
                      icon="mdi-message-text-outline"
                      size="48"
                      class="mb-2"
                    ></v-icon>
                    <div>Bạn có thắc mắc gì về báo cáo này không?</div>
                  </div>

                  <div
                    v-for="(message, index) in messages"
                    :key="index"
                    class="mb-3"
                  >
                    <div
                      v-if="message.role === 'user'"
                      class="d-flex justify-end"
                    >
                      <v-chip
                        color="primary"
                        variant="flat"
                        class="px-4 py-2"
                        style="
                          height: auto;
                          white-space: pre-wrap;
                          max-width: 80%;
                        "
                      >
                        {{ message.content }}
                      </v-chip>
                    </div>
                    <div v-else class="d-flex justify-start">
                      <v-chip
                        color="surface-variant"
                        variant="flat"
                        class="px-4 py-2"
                        style="
                          height: auto;
                          white-space: pre-wrap;
                          max-width: 80%;
                        "
                      >
                        {{ message.content }}
                      </v-chip>
                    </div>
                  </div>

                  <!-- Current streaming response -->
                  <div v-if="currentChatResponse" class="d-flex justify-start">
                    <v-chip
                      color="surface-variant"
                      variant="flat"
                      class="px-4 py-2"
                      style="
                        height: auto;
                        white-space: pre-wrap;
                        max-width: 80%;
                      "
                    >
                      {{ currentChatResponse }}
                      <v-progress-circular
                        indeterminate
                        size="16"
                        width="2"
                        class="ml-2"
                      ></v-progress-circular>
                    </v-chip>
                  </div>
                </div>

                <!-- Chat Input -->
                <div class="d-flex gap-2">
                  <v-text-field
                    v-model="chatInput"
                    placeholder="Hỏi AI về báo cáo này..."
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    :disabled="chatLoading"
                    @keyup.enter="sendChatMessage"
                  >
                    <template v-slot:prepend-inner>
                      <v-icon
                        icon="mdi-message-text-outline"
                        size="20"
                      ></v-icon>
                    </template>
                  </v-text-field>
                  <v-btn
                    color="primary"
                    :loading="chatLoading"
                    :disabled="!chatInput.trim()"
                    @click="sendChatMessage"
                  >
                    <v-icon>mdi-send</v-icon>
                  </v-btn>
                </div>

                <div class="text-caption text-medium-emphasis mt-2">
                  💡 Ví dụ: "Tại sao lỗi SMT cao?", "Làm sao cải thiện tỷ lệ
                  Pass?"
                </div>
              </div>
            </v-col>
          </v-row>
        </div>

        <div v-else class="text-center py-8 text-medium-emphasis">
          <v-icon icon="mdi-robot-outline" size="64" class="mb-4"></v-icon>
          <p>Nhấn nút "Phân tích AI" để bắt đầu</p>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <ButtonSave @click="analyze" :loading="aiLoading">
          <v-icon start>mdi-robot</v-icon>
          Phân tích lại
        </ButtonSave>
        <ButtonCancel variant="text" @click="DialogAI = false"
          >Đóng</ButtonCancel
        >
      </v-card-actions>
    </v-card>
  </BaseDialog>

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
import StackedBarChartSummary from "@/components/Chart-StackedBar-Summary.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import LinePointChart from "@/components/Chart-PointLine-Summary.vue";
import ChartDonutSummary from "@/components/Chart-Donut-Summary.vue";

// Composables
import { useSummary } from "@/composables/Summary/useSummary";
import { useSummaryYesterday } from "@/composables/Summary/useSummaryYesterday";
import { useCompareSummary } from "@/composables/Summary/useCompareSummary";
import { useSummaryFail } from "@/composables/Summary/useSummaryFail";
import { useSummaryAI } from "@/composables/Summary/useSummaryAI";
import { useHistoryPart } from "@/composables/Manufacture/useHistoryPart";
import { useActived } from "@/composables/Summary/useActived";

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
const DialogAI = ref(false); // AI dialog
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

const summaryFailChart = ref({
  "Lỗi hàn": 0,
  "Lỗi linh kiện": 0,
  "Lỗi ngoại quan": 0,
  "Lỗi chức năng": 0,
  "Lỗi lắp ráp cơ khí": 0,
  "Lỗi quy trình / Vận hành": 0,
  "Lỗi không xác định": 0,
});

const summaryDetailByType = computed(() => {
  if (!summary.value) return [];
  const grouped = {};
  summary.value.forEach((item) => {
    const type = item.Type || "Lỗi không xác định";
    if (!grouped[type]) {
      grouped[type] = {
        type: type,
        ok: 0,
        error: 0,
      };
    }
    grouped[type].ok += Number(item.Quantity_Counting || 0);
    grouped[type].error += Number(item.Quantity_Error || 0);
  });
  return Object.values(grouped);
});

// ========Data SelectedType========
const selectedCategory = ref("");
const selectedCategoryData = ref([]);
const selectedPlanID = ref("");
const categoryDataChart = ref([]);

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

const HeadersProject = [
  { title: "Tên dự án", key: "PONumber", width: "200px" },
  { title: "Hạng mục", key: "Category", width: "200px" },
  { title: "Công đoạn", key: "Type" },
  { title: "Kế hoạch (pcs)", key: "Quantity_Plan" },
  { title: "Thực tế (pcs)", key: "Quantity_Counting" },
  { title: "Tỉ lệ (%)", key: "Percent" },
];

const HeadersActived = [
  { title: "Tên thiết bị", key: "Device" },
  { title: "Công đoạn", key: "Source" },
  { title: "Trạng thái", key: "status" },
  { title: "Lần cuối online", key: "LatestTimestamp" },
];

// ===== COMPUTED =======

const summaryTypeGrouped = computed(() => {
  const grouped = {};

  summary.value.forEach((item) => {
    if (!grouped[item.Type]) {
      grouped[item.Type] = {
        Type: item.Type,
        categories: [],
      };
    }

    const exists = grouped[item.Type].categories.some(
      (c) => c.Category === item.Category,
    );

    if (!exists) {
      grouped[item.Type].categories.push({
        Category: item.Category,
        PlanID: item.PlanID,
      });
    }
  });

  return Object.values(grouped);
});

const summaryPlanManufacture = computed(() => {
  const grouped = {};

  summary.value.forEach((item) => {
    if (!grouped[item.Name]) {
      grouped[item.Name] = {
        Name: item.Name,
        PlanID: item.PlanID,
        summaryType: {},
      };
    }

    if (!grouped[item.Name].summaryType[item.Type]) {
      grouped[item.Name].summaryType[item.Type] = {
        Type: item.Type,
        categories: [],
      };
    }

    const exists = grouped[item.Name].summaryType[
      item.Type
    ].categories.includes(item.Category);

    if (!exists) {
      grouped[item.Name].summaryType[item.Type].categories.push(item.Category);
    }
  });

  return Object.values(grouped).map((nameItem) => ({
    ...nameItem,
    summaryType: Object.values(nameItem.summaryType),
  }));
});

const summaryPlanManufactureYesterday = computed(() => {
  const grouped = {};

  summaryYesterday.value.forEach((item) => {
    if (!grouped[item.Name]) {
      grouped[item.Name] = {
        Name: item.Name,
        PlanID: item.PlanID,
        summaryType: {},
      };
    }

    if (!grouped[item.Name].summaryType[item.Type]) {
      grouped[item.Name].summaryType[item.Type] = {
        Type: item.Type,
        categories: [],
      };
    }

    const exists = grouped[item.Name].summaryType[
      item.Type
    ].categories.includes(item.Category);

    if (!exists) {
      grouped[item.Name].summaryType[item.Type].categories.push(item.Category);
    }
  });

  return Object.values(grouped).map((nameItem) => ({
    ...nameItem,
    summaryType: Object.values(nameItem.summaryType),
  }));
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

const formattedSelectedYesterday = computed(() => {
  const date = selectedDate.value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate() - 1).padStart(2, "0");
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
const { summaryYesterday, summaryYesterdayError } = useSummaryYesterday(
  formattedSelectedYesterday,
);
const { compareSummary } = useCompareSummary(formattedSelectedDate);
const { summaryFail, summaryFailError } = useSummaryFail(formattedSelectedDate);
const { historyPart } = useHistoryPart(selectedPlanID);
const {
  aiText,
  loading: aiLoading,
  analyze: analyzeAI,
  messages,
  chatLoading,
  currentChatResponse,
  askQuestion,
  clearChat,
} = useSummaryAI();
const { status, statusError } = useActived();

// Chat input
const chatInput = ref("");

// AI Analysis function (includes comparison if available)
const analyze = () => {
  DialogAI.value = true;

  // Prepare concise summary data (optimized for speed)
  const summaryData = {
    date: formattedSelectedDate.value,
    stats: {
      totalPO: Total_Po_Today.value,
      totalCategory: Total_Category_Today.value,
      completed:
        summary.value?.filter((item) => Number(item.Percent) >= 100).length ||
        0,
      inProgress:
        summary.value?.filter((item) => Number(item.Percent) < 100).length || 0,
      passRate: overallSummaryRate.value,
      totalPass: totalSummaryOK.value,
      totalFail: totalSummaryError.value,
    },
    // Add process breakdown with detailed stats
    processes: summaryDetailByType.value || {},
  };

  // Add comparison if available (concise format)
  if (compareSummary.value && compareSummary.value.length > 0) {
    const comp = compareSummary.value[0];
    summaryData.comparison = {
      yesterdayPO: comp.Yesterday_Total_PONumber || 0,
      yesterdayCategory: comp.Yesterday_Total_Category || 0,
      poTrend: comp.PONumber_Trend_Percent || 0,
      categoryTrend: comp.Category_Trend_Percent || 0,
    };
  }

  // Add top 3 error types only (if any)
  const topErrors = Object.entries(summaryFailChart.value)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => `${type}: ${count}`);

  if (topErrors.length > 0) {
    summaryData.topErrors = topErrors;
  }

  // Add full raw data for detailed AI questions
  summaryData.fullData = {
    // Complete summary list with all details
    summaryList: summary.value || [],
    // Manufacture fail details
    manufactureFail: Manufacture_Fail.value || [],
    // Fail chart breakdown
    failByGroup: summaryFailChart.value || {},
    // Summary by type with all details
    summaryByType: summaryDetailByType.value || {},
  };

  analyzeAI(summaryData);
};

// Send chat message
const chatContainer = ref(null);
const sendChatMessage = async () => {
  if (!chatInput.value.trim()) return;

  await askQuestion(chatInput.value);
  chatInput.value = "";

  // Auto-scroll to bottom
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

// Watch for new messages to auto-scroll
watch(
  () => messages.value.length,
  () => {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    });
  },
);

// Watch for streaming response to auto-scroll
watch(currentChatResponse, () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
});

// Clear chat when closing dialog
watch(DialogAI, (newVal) => {
  if (!newVal) {
    clearChat();
    chatInput.value = "";
  }
});

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
  summaryFail,
  (newVal) => {
    if (!Array.isArray(newVal)) return;

    // Reset statistics
    for (const key in summaryFailChart.value) {
      summaryFailChart.value[key] = 0;
    }

    // Process each record
    newVal.forEach((item) => {
      if (item.GroupFail && item.GroupFail.trim() !== "") {
        const errors = item.GroupFail.split(",").map((e) => e.trim());
        errors.forEach((err) => {
          if (summaryFailChart.value[err] !== undefined) {
            summaryFailChart.value[err]++;
          }
        });
      } else {
        // No GroupFail -> count as "Lỗi không xác định"
        summaryFailChart.value["Lỗi không xác định"]++;
      }
    });
  },
  { immediate: true, deep: true },
);

watch(
  summary,
  (newValue) => {
    if (Array.isArray(newValue) && newValue.length > 0) {
      // Lọc các phần tử có Quantity_Error > 0
      Manufacture_Fail.value = newValue.filter(
        (item) => Number(item.Quantity_Error) > 0,
      );
    } else {
      // Nếu mảng rỗng hoặc không hợp lệ, reset lại
      Manufacture_Fail.value = [];
    }
  },
  { immediate: true, deep: true },
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
  { immediate: true, deep: true },
);

watch(historyPart, (newData) => {
  categoryDataChart.value = newData.filter(
    (item) => item.PartNumber === selectedCategory.value,
  );
});

const totalCategoryPassToday = computed(() => {
  if (!summary.value) return []; // Phòng hờ summary chưa có dữ liệu

  return summary.value.filter((item) => {
    return (
      Number(item.Quantity_Counting || 0) >= Number(item.Quantity_Plan || 0)
    );
  });
});

const totalCategoryPassYesterday = computed(() => {
  if (!summaryYesterday.value) return []; // Phòng hờ summary chưa có dữ liệu

  return summaryYesterday.value.filter((item) => {
    return (
      Number(item.Quantity_Counting || 0) >= Number(item.Quantity_Plan || 0)
    );
  });
});

// ======= Computed Trend/Percentage changes =======
const projectComparePercent = computed(() => {
  const today = summaryPlanManufacture.value.length;
  const yesterday = summaryPlanManufactureYesterday.value.length;
  if (yesterday === 0) {
    return today > 0 ? 100 : 0;
  }
  return parseFloat((((today - yesterday) / yesterday) * 100).toFixed(1));
});

const categoryComparePercent = computed(() => {
  const today = summary.value.length;
  const yesterday = summaryYesterday.value.length;
  if (yesterday === 0) {
    return today > 0 ? 100 : 0;
  }
  return parseFloat((((today - yesterday) / yesterday) * 100).toFixed(1));
});

const goalAchievementPercent = computed(() => {
  const total = summary.value ? summary.value.length : 0;
  if (total === 0) return 0;
  const completed = totalCategoryPassToday.value.length;
  return parseFloat(((completed / total) * 100).toFixed(1));
});

const totalCategoryInProgressToday = computed(() => {
  const total = summary.value ? summary.value.length : 0;
  return total - totalCategoryPassToday.value.length;
});

const selectedCategoryRate = computed(() => {
  if (!selectedCategory.value || !selectedCategoryData.value) return 0;
  const data = selectedCategoryData.value.find(
    (item) => item.Category === selectedCategory.value,
  );
  if (!data) return 0;
  const plan = Number(data.Quantity_Plan || 0);
  const counting = Number(data.Quantity_Counting || 0);
  if (plan === 0) return 0;
  return parseFloat(((counting / plan) * 100).toFixed(1));
});

// ===== CHART CONFIGURATION =====s
const progress = computed(() =>
  categoryDataChart.value.map((item) => item.Timestamp || 0),
);

const passList = computed(() =>
  categoryDataChart.value.map((item) => Number(item.Quantity || 0)),
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
    value: +((value / total) * 100).toFixed(1), // phần trăm
    count: value, // số lượng thật
    color: colors[i % colors.length],
  }));
});

const handleCategoryClick = (category, item) => {
  selectedCategory.value = category;

  selectedCategoryData.value = summary.value.filter(
    (row) => row.Category === category,
  );

  selectedPlanID.value = item.PlanID;
  categoryDataChart.value = historyPart.value.filter(
    (item) => item.PartNumber === selectedCategory.value,
  );
};

const handleClose = () => {
  selectedCategory.value = "";
  selectedCategoryData.value = [];
  selectedPlanID.value = "";
  categoryDataChart.value = [];
};

const passSummaryGroup = computed(() => {
  const grouped = {};

  summary.value.forEach((item) => {
    const source = item.Type;
    const surface = item.Surface;
    const qty = Number(item.Quantity_Counting || 0);

    if (!grouped[source]) {
      grouped[source] = {
        top: 0,
        bottom: 0,
        oneSide: 0,
      };
    }

    if (surface === "TOP") {
      grouped[source].top += qty;
    }

    if (surface === "BOTTOM") {
      grouped[source].bottom += qty;
    }

    if (surface === "1 Mặt") {
      grouped[source].oneSide += qty;
    }
  });

  const result = {};

  Object.entries(grouped).forEach(([source, item]) => {
    const values = [];

    if (item.oneSide > 0) values.push(item.oneSide);

    // Có đủ TOP + BOTTOM
    if (item.top > 0 && item.bottom > 0) {
      values.push(Math.min(item.top, item.bottom));
    } else {
      // Chỉ có TOP hoặc chỉ có BOTTOM
      if (item.top > 0) values.push(item.top);
      if (item.bottom > 0) values.push(item.bottom);
    }

    result[source] = values.length ? Math.min(...values) : 0;
  });

  return result;
});

const progressGroup = computed(() => Object.keys(passSummaryGroup.value));

const passDataGroup = computed(() => Object.values(passSummaryGroup.value));

const maxPassDataGroup = computed(() => {
  return passDataGroup.value.length ? Math.max(...passDataGroup.value) : "-";
});

const maxPassTypeGroup = computed(() => {
  if (
    !passSummaryGroup.value ||
    Object.keys(passSummaryGroup.value).length === 0
  )
    return "-";
  return Object.entries(passSummaryGroup.value).reduce(
    (max, [type, qty]) => {
      return qty > max.qty ? { type, qty } : max;
    },
    { type: "-", qty: -Infinity },
  ).type;
});

const minPassDataGroup = computed(() => {
  return passDataGroup.value.length ? Math.min(...passDataGroup.value) : "-";
});

const minPassTypeGroup = computed(() => {
  if (
    !passSummaryGroup.value ||
    Object.keys(passSummaryGroup.value).length === 0
  )
    return "-";
  return Object.entries(passSummaryGroup.value).reduce(
    (min, [type, qty]) => {
      return qty < min.qty ? { type, qty } : min;
    },
    { type: "-", qty: Infinity },
  ).type;
});

// Category Summary Grouping (Hạng mục)
const categorySummaryGroup = computed(() => {
  const grouped = {};
  if (Array.isArray(summary.value)) {
    summary.value.forEach((item) => {
      const cat = item.Category;
      if (!cat) return;
      const qty = Number(item.Quantity_Counting || 0);
      grouped[cat] = (grouped[cat] || 0) + qty;
    });
  }
  return grouped;
});

const categoryLabels = computed(() => Object.keys(categorySummaryGroup.value));
const categoryData = computed(() => Object.values(categorySummaryGroup.value));

const maxPassCategoryData = computed(() => {
  const values = categoryData.value;
  return values.length ? Math.max(...values) : 0;
});

const maxPassCategory = computed(() => {
  if (
    !categorySummaryGroup.value ||
    Object.keys(categorySummaryGroup.value).length === 0
  )
    return "-";
  return Object.entries(categorySummaryGroup.value).reduce(
    (max, [cat, qty]) => {
      return qty > max.qty ? { cat, qty } : max;
    },
    { cat: "-", qty: -Infinity },
  ).cat;
});

const minPassCategoryData = computed(() => {
  const values = categoryData.value;
  return values.length ? Math.min(...values) : 0;
});

const minPassCategory = computed(() => {
  if (
    !categorySummaryGroup.value ||
    Object.keys(categorySummaryGroup.value).length === 0
  )
    return "-";
  return Object.entries(categorySummaryGroup.value).reduce(
    (min, [cat, qty]) => {
      return qty < min.qty ? { cat, qty } : min;
    },
    { cat: "-", qty: Infinity },
  ).cat;
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
    CardStatistic,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang=""></style>
