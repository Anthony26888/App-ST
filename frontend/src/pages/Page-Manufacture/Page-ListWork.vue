<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex justify-space-between align-center pa-4">
      <span class="text-h4 font-weight-light" v-if="lgAndUp">Danh sách công việc</span>
      <v-spacer v-if="lgAndUp"></v-spacer>
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

    <v-card-text>
      <!-- Thống kê tổng quan -->
      <v-row v-if="lgAndUp">
        <v-col cols="12" sm="6" md="6">
          <v-card class="rounded-xl" color="primary" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Tổng số quy trình</div>
              <div class="text-h4 font-weight-bold">
                {{ totalOrders }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="6">
          <v-card class="rounded-xl" color="warning" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Tổng số công việc</div>
              <div class="text-h4 font-weight-bold">
                {{ completedOrders }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col cols="6">
          <v-card class="rounded-xl" color="primary" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Quy trình</div>
              <div class="text-h4 font-weight-bold">
                {{ totalOrders }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-card class="rounded-xl" color="warning" variant="tonal">
            <v-card-text>
              <div class="text-subtitle-1">Công việc</div>
              <div class="text-h4 font-weight-bold">
                {{ completedOrders }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Danh sách công việc -->
      <v-card class="mt-4" v-if="lgAndUp"  >
        <v-empty-state
          v-if="summary == ''"
          headline="OPPS !"
          title="Chưa có dữ liệu"
          icon="mdi-folder-remove-outline"
          height="calc(100vh - 250px)"
        ></v-empty-state>
        <div class="table-container">
          <template v-for="(group, type) in groupedSummary" :key="type">
            <v-card-title
              class="text-primary font-weight-bold text-h6 py-4 d-flex align-center sticky-header"
            >
              <v-icon start color="primary" class="mr-2"
                >mdi-folder-outline</v-icon
              >
              {{ type }}
            </v-card-title>

            <v-table density="compact" class="mb-4" >
              <thead class="sticky-header">
                <tr>
                  <th class="text-left">Mã PO</th>
                  <th class="text-left">Đơn hàng</th>
                  <th class="text-center">Hạng mục</th>
                  <th class="text-center">Thời gian tạo</th>
                  <th class="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in group"
                  :key="item.PONumber"
                  class="hover-row"
                >
                  <td>
                    <div class="d-flex align-center">
                      <v-avatar
                        variant="text "
                        size="35"
                        class="rounded-lg mr-2"
                      >
                        <v-icon size="small">mdi-tools</v-icon>
                      </v-avatar>
                      <span class="font-weight-medium">{{
                        item.PONumber
                      }}</span>
                    </div>
                  </td>
                  <td>{{ item.Name_Order }}</td>
                  <td class="text-center">
                    <v-chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      class="rounded-lg"
                    >
                      {{ item.Category }}
                    </v-chip>
                  </td>
                  <td class="text-center">
                    <div class="d-flex align-center justify-center">
                      <v-icon size="small" color="grey" class="mr-1"
                        >mdi-clock-outline</v-icon
                      >
                      <span class="text-caption">{{ item.Created_At }}</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <v-btn
                      color="primary"
                      icon="mdi-chevron-right"
                      variant="tonal"
                      size="small"
                      class="rounded-lg"
                      @click="PushItem(item)"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <v-divider class="mb-4"></v-divider>
          </template>
        </div>
      </v-card>


      <v-card class="mt-4" v-else >
        <v-empty-state
          v-if="summary == ''"
          headline="OPPS !"
          title="Chưa có dữ liệu"
          icon="mdi-folder-remove-outline"
          height="calc(100vh - 320px)"
        ></v-empty-state>
        <div class="table-container" >
          <template v-for="(group, type) in groupedSummary" :key="type">
            <v-card-title
              class="text-primary font-weight-bold text-h6 py-4 d-flex align-center sticky-header"
            >
              <v-icon start color="primary" class="mr-2"
                >mdi-folder-outline</v-icon
              >
              {{ type }}
            </v-card-title>

            <v-table density="compact" class="mb-4" >
              <thead class="sticky-header">
                <tr>
                  <th class="text-left">Mã PO</th>
                  <th class="text-left">Đơn hàng</th>
                  <th class="text-center">Hạng mục</th>
                  <th class="text-center">Thời gian tạo</th>
                  <th class="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in group"
                  :key="item.PONumber"
                  class="hover-row"
                >
                  <td>
                    <div class="d-flex align-center">
                      <v-avatar
                        variant="text "
                        size="35"
                        class="rounded-lg mr-2"
                      >
                        <v-icon size="small">mdi-tools</v-icon>
                      </v-avatar>
                      <span class="font-weight-medium">{{
                        item.PONumber
                      }}</span>
                    </div>
                  </td>
                  <td>{{ item.Name_Order }}</td>
                  <td class="text-center">
                    <v-chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      class="rounded-lg"
                    >
                      {{ item.Category }}
                    </v-chip>
                  </td>
                  <td class="text-center">
                    <div class="d-flex align-center justify-center">
                      <v-icon size="small" color="grey" class="mr-1"
                        >mdi-clock-outline</v-icon
                      >
                      <span class="text-caption">{{ item.Created_At }}</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <v-btn
                      color="primary"
                      icon="mdi-chevron-right"
                      variant="tonal"
                      size="small"
                      class="rounded-lg"
                      @click="PushItem(item)"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <v-divider class="mb-4"></v-divider>
          </template>
        </div>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
// Composables
import { useSummary } from "@/composables/Summary/useSummary";

const dateMenu = ref(false);
const { mdAndDown, lgAndUp } = useDisplay();
// API
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const router = useRouter();

//  Choose date
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

// Statistics computed properties
const totalOrders = computed(() => {
  if (!summary.value || !Array.isArray(summary.value)) return 0;
  const uniqueTypes = new Set(summary.value.map((item) => item.Type));
  return uniqueTypes.size;
});

const completedOrders = computed(() => {
  if (!summary.value || !Array.isArray(summary.value)) return 0;
  const uniqueCategories = new Set(summary.value.map((item) => item.Category));
  return uniqueCategories.size;
});

const groupedSummary = computed(() => {
  if (!summary.value || !Array.isArray(summary.value)) {
    return {};
  }

  return summary.value.reduce((acc, item) => {
    const type = item.Type || "Uncategorized";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {});
});

watch(
  summary,
  (newData) => {
    if (!newData?.value) {
      console.log("No history data available");
      return;
    }

    if (!Array.isArray(newData.value)) {
      console.log("History data is not an array");
      return;
    }
  },
  { deep: true }
);

// ====== CRUD =======
const PushItem = (item) => {
  localStorage.setItem("ManufactureID", item.PlanID);
  localStorage.setItem("Go-Back-List-Work", true);
  if (item.Type === "SMT") {
    router.push(`/San-xuat/SMT/${item.id}`);
  } else{
    router.push(`/San-xuat/${item.Type}/${item.id}`);
  }
};
</script>
<script>
export default {};
</script>
<style scoped>
.table-container {
  height: 100%;
  overflow-y: auto;
  padding: 0 16px;
}

.sticky-header {
  position: sticky;
  top: 0;
  background-color: rgb(var(--v-theme-surface));
  z-index: 1;
}

.hover-row:hover {
  background-color: rgb(var(--v-theme-surface-variant));
  cursor: pointer;
}

.v-table {
  background: transparent !important;
}

.v-table .v-table__wrapper > table {
  border-spacing: 0 4px;
  border-collapse: separate;
}

.v-table .v-table__wrapper > table > tbody > tr {
  background-color: rgb(var(--v-theme-surface));
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.v-table .v-table__wrapper > table > tbody > tr > td {
  border-bottom: none;
  padding: 12px 16px;
}

.v-table .v-table__wrapper > table > thead > tr > th {
  border-bottom: none;
  padding: 12px 16px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  background-color: rgb(var(--v-theme-surface));
}
</style>
