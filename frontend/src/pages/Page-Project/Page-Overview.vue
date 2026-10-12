<template lang="">
  <v-card variant="text" class="app-page">
    <PageHeader :crumbs="[{ title: 'Tổng quan' }]" />
    <v-card-text
      class="d-flex flex-column flex-grow-1"
      style="min-height: 0; gap: 16px"
    >
      <!-- Welcome -->
      <div>
        <div class="app-page-title font-weight-bold">
          {{ greeting }}, {{ UserInfo || "bạn" }} 👋
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ overviewSubtitle }}
        </div>
      </div>

      <!-- KPI -->
      <v-row dense>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Lịch giao trễ hạn"
            :value="overdueCount"
            icon="mdi-alert-circle"
            color="error"
          >
            <template #bottom>
              <div class="text-caption text-medium-emphasis mt-1">
                Cần xử lý ngay
              </div>
            </template>
          </CardStatistic>
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Giao hôm nay / ngày mai"
            :value="dueSoonCount"
            icon="mdi-truck-delivery"
            color="info"
          >
            <template #bottom>
              <div class="text-caption text-medium-emphasis mt-1">
                Hôm nay {{ statistics.Today || 0 }} · Mai
                {{ statistics.Tomorrow || 0 }}
              </div>
            </template>
          </CardStatistic>
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Đơn đang sản xuất"
            :value="manufacturingCount"
            icon="mdi-progress-wrench"
            color="warning"
          >
            <template #value-append>
              <div class="text-body-2 font-weight-bold text-warning">
                {{ manufactureProgress }}%
              </div>
            </template>
            <template #bottom>
              <v-progress-linear
                :model-value="manufactureProgress"
                height="6"
                color="warning"
                rounded
                class="mt-1"
              ></v-progress-linear>
            </template>
          </CardStatistic>
        </v-col>
        <v-col cols="6" md="3">
          <CardStatistic
            title="Đơn hoàn thành"
            :value="manufactureDoneCount"
            icon="mdi-check-circle"
            color="success"
          >
            <template #bottom>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ manufactureDoneCount }}/{{ manufacturingList.length }} đơn
              </div>
            </template>
          </CardStatistic>
        </v-col>
      </v-row>

      <!-- Gantt + Donut -->
      <v-row dense>
        <v-col cols="12" md="8">
          <v-card variant="elevated" elevation="0" class="rounded-xl border h-100">
            <v-card-title class="d-flex align-center">
              <span class="text-subtitle-1 font-weight-bold">
                Cần xử lý 7 ngày ({{ latePOGroups.length }} nhóm ·
                {{ fmtQty(weekTotalQty) }} pcs)
              </span>
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                class="text-none"
                to="/Du-an"
              >
                Xem hết
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-for="p in latePOGroups" :key="p.name" class="mb-1">
                <div
                  class="d-flex align-center ga-3 py-1 po-group-row"
                  @click="togglePOGroup(p.name)"
                >
                  <v-avatar
                    :color="p.hasOverdue ? 'error' : 'info'"
                    variant="tonal"
                    size="36"
                  >
                    <v-icon
                      :icon="p.hasOverdue ? 'mdi-alert' : 'mdi-calendar-clock'"
                      size="20"
                    ></v-icon>
                  </v-avatar>
                  <div class="min-width-0">
                    <div
                      class="text-body-2 font-weight-bold text-high-emphasis text-truncate"
                      :title="p.name"
                    >
                      {{ p.name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ p.count }} lịch · {{ fmtQty(p.qty) }} pcs ·
                      <span v-if="p.hasOverdue">sâu nhất {{ p.maxDays }}d</span>
                      <span v-else>gần nhất {{ p.minDue }}d tới</span>
                    </div>
                  </div>
                  <v-spacer></v-spacer>
                  <v-icon
                    size="small"
                    color="medium-emphasis"
                    :icon="
                      expandedPO === p.name
                        ? 'mdi-chevron-down'
                        : 'mdi-chevron-right'
                    "
                  ></v-icon>
                </div>
                <v-expand-transition>
                  <div v-show="expandedPO === p.name" class="ps-6">
                    <div
                      v-for="s in p.items"
                      :key="s.id"
                      class="d-flex align-center ga-3 py-1"
                      :title="s.Message"
                    >
                      <v-avatar
                        :color="delayColor(s)"
                        variant="tonal"
                        size="30"
                      >
                        <v-icon
                          :icon="
                            s.DaysRemaining < 0
                              ? 'mdi-truck-alert'
                              : 'mdi-truck-clock'
                          "
                          size="16"
                        ></v-icon>
                      </v-avatar>
                      <div class="min-width-0">
                        <div
                          class="text-body-2 font-weight-medium text-high-emphasis text-truncate"
                        >
                          {{ scheduleShort(s.Message) }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ delayLabel(s) }}
                        </div>
                      </div>
                      <v-spacer></v-spacer>
                      <div class="d-flex flex-column align-end ga-1">
                        <v-chip
                          size="x-small"
                          :color="delayColor(s)"
                          variant="tonal"
                        >
                          {{ p.name }}
                        </v-chip>
                        <small class="text-high-emphasis opacity-60">
                          SL: {{ fmtQty(s.Quantity) }} pcs
                        </small>
                      </div>
                      <v-tooltip
                        :text="
                          canConfirm(s)
                            ? 'Xác nhận đã giao'
                            : 'Chưa tới hạn giao'
                        "
                        location="top"
                        v-if="canTick"
                      >
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            :icon="
                              confirmingIds.includes(s.id)
                                ? 'mdi-loading'
                                : 'mdi-check'
                            "
                            :color="
                              canConfirm(s) ? 'success' : 'medium-emphasis'
                            "
                            :disabled="
                              !canConfirm(s) || confirmingIds.includes(s.id)
                            "
                            :loading="confirmingIds.includes(s.id)"
                            size="x-small"
                            variant="tonal"
                            @click="confirmDelivery(s)"
                          ></v-btn>
                        </template>
                      </v-tooltip>
                    </div>
                    <div
                      class="text-caption text-medium-emphasis text-end py-1"
                    >
                      Tổng nhóm: {{ fmtQty(p.qty) }} pcs / {{ p.count }} lịch
                    </div>
                  </div>
                </v-expand-transition>
              </div>
              <v-alert
                v-if="confirmError"
                type="error"
                variant="tonal"
                density="compact"
                class="mt-2"
              >
                {{ confirmError }}
              </v-alert>
              <div
                v-if="latePOGroups.length === 0"
                class="text-center text-grey text-caption py-4"
              >
                7 ngày tới không có lịch cần xử lý. Thật tuyệt!
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card
            variant="elevated"
            elevation="0"
            class="rounded-xl border h-100"
          >
            <v-card-title class="text-subtitle-1 font-weight-bold">
              Rủi ro giao hàng
            </v-card-title>
            <v-card-text>
              <div
                v-for="b in agingBuckets"
                :key="b.key"
                class="mb-3"
              >
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span class="font-weight-medium" :class="`text-${b.color}`">
                    ● {{ b.title }}
                  </span>
                  <span class="font-weight-bold">
                    {{ b.count }} đơn · {{ b.qty }} pcs
                  </span>
                </div>
                <v-progress-linear
                  :model-value="b.percent"
                  :color="b.color"
                  height="8"
                  rounded
                ></v-progress-linear>
              </div>
              <v-divider class="my-3"></v-divider>
              <div class="text-body-2">
                Tổng:
                <strong>{{ riskTotal.count }} đơn</strong>
                ·
                <strong>{{ riskTotal.qty }} pcs</strong>
                · trễ sâu nhất
                <strong>{{ riskTotal.maxDays }}d</strong>
              </div>
              <div
                v-if="overdueList.length === 0"
                class="text-center text-grey text-caption py-2"
              >
                Không có nợ giao hàng. Thật tuyệt!
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- SX 24h qua + Đơn tắc nghẽn -->
      <v-row dense>
        <v-col cols="12" md="8">
          <v-card
            variant="elevated"
            elevation="0"
            class="rounded-xl border h-100"
          >
            <v-card-title class="d-flex align-center">
              <span class="text-subtitle-1 font-weight-bold">
                SX 24h qua ({{ recentList.length }})
              </span>
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                class="text-none"
                to="/San-xuat"
              >
                Sang SX
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div
                v-for="r in recentList"
                :key="r.id"
                class="d-flex align-center ga-2 py-1"
                :title="`${r.OrderName} · ${r.Stage}`"
              >
                <div class="min-width-0">
                  <div class="text-body-2 font-weight-medium text-truncate">
                    {{ r.OrderName || "(Chưa rõ đơn)" }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ dayLabel(r.WorkDate) }}
                  </div>
                </div>
                <v-spacer></v-spacer>
                <v-chip size="x-small" variant="tonal" color="info">
                  {{ r.Stage }}
                </v-chip>
                <span class="text-body-2 font-weight-bold text-success">
                  +{{ r.ProducedQuantity }}
                </span>
              </div>
              <div
                v-if="recentList.length === 0"
                class="text-center text-grey text-caption py-4"
              >
                24h qua chưa có nhập liệu SX
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card
            variant="elevated"
            elevation="0"
            class="rounded-xl border h-100"
          >
            <v-card-title class="d-flex align-center">
              <span class="text-subtitle-1 font-weight-bold">
                Đơn tắc nghẽn
              </span>
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                size="small"
                class="text-none"
                to="/San-xuat"
              >
                Sang SX
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div
                v-for="m in stuckOrders"
                :key="m.id"
                class="d-flex align-center ga-2 py-1"
                :title="m.Name_Order || m.Name"
              >
                <span class="text-body-2 font-weight-medium text-truncate">
                  {{ m.Name_Order || m.Name }}
                </span>
                <v-spacer></v-spacer>
                <v-chip size="x-small" variant="tonal" color="warning">
                  kẹt {{ m.stuckDays }}d
                </v-chip>
                <span class="text-caption font-weight-bold">
                  {{ Math.round(Number(m.Progress) || 0) }}%
                </span>
              </div>
              <div
                v-if="stuckOrders.length === 0"
                class="text-center text-grey text-caption py-4"
              >
                Không có đơn tắc nghẽn. Thật tuyệt!
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref } from "vue";
import axios from "axios";
import PageHeader from "@/components/Page-Header.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import { useNotification } from "@/composables/Project/useNotification";
import { useManufacture } from "@/composables/Manufacture/useManufacture";
import { useRecentProduction } from "@/composables/Manufacture/useRecentProduction";

const Url = import.meta.env.VITE_API_URL;

const UserInfo =
  localStorage.getItem("Username") || localStorage.getItem("User") || "";

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 13) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
});

const { notifications, statistics } = useNotification();
const { manufacture } = useManufacture();

// Lịch chưa giao (view chỉ chứa Chưa giao)
const pending = computed(() =>
  (notifications.value || []).filter((n) => n != null),
);

const overdueList = computed(() =>
  pending.value
    .filter((n) => (n.DaysRemaining ?? 99) < 0)
    .sort((a, b) => (a.DaysRemaining ?? 0) - (b.DaysRemaining ?? 0)),
);

const overdueCount = computed(() => overdueList.value.length);

const dueSoonCount = computed(
  () =>
    (Number(statistics.value?.Today) || 0) +
    (Number(statistics.value?.Tomorrow) || 0),
);



// PO trễ gộp nhóm (mở rộng từng PO, tối đa 8 nhóm)
const expandedPO = ref("");
// Phạm vi 7 ngày: trễ tối đa 7d + tới hạn trong 7d (ngoài phạm vi vẫn đếm ở KPI/Rủi ro)
const latePOGroups = computed(() => {
  const map = new Map();
  const inScope = pending.value.filter((n) => {
    const d = n?.DaysRemaining ?? 99;
    return d >= -7 && d <= 7;
  });
  for (const n of inScope) {
    const name = String(n?.Message || "").split(" - ")[0].trim() || "(Không rõ PO)";
    const d = n?.DaysRemaining ?? 0;
    const cur = map.get(name) || {
      name, count: 0, qty: 0, maxDays: 0, minDue: 99, items: [],
    };
    cur.count += 1;
    cur.qty += Number(n?.Quantity) || 0;
    if (d < 0) cur.maxDays = Math.max(cur.maxDays, -d);
    else cur.minDue = Math.min(cur.minDue, d);
    cur.items.push(n);
    map.set(name, cur);
  }
  return [...map.values()]
    .map((g) => ({
      ...g,
      hasOverdue: g.maxDays > 0,
      items: g.items.sort(
        (a, b) => (a.DaysRemaining ?? 0) - (b.DaysRemaining ?? 0),
      ),
    }))
    .sort((a, b) => b.maxDays - a.maxDays || a.minDue - b.minDue || b.qty - a.qty)
    .slice(0, 8);
});

// Tổng SL toàn card + format ngàn (1.200 thay vì 1200)
const weekTotalQty = computed(() =>
  latePOGroups.value.reduce((s, g) => s + (Number(g.qty) || 0), 0),
);

const fmtQty = (v) => {
  const n = Number(v) || 0;
  return new Intl.NumberFormat("vi-VN").format(n);
};

const togglePOGroup = (name) => {
  expandedPO.value = expandedPO.value === name ? "" : name;
};

// Tên rút gọn của 1 lịch trong PO (phần sau dấu " - ")
const scheduleShort = (message) => {
  const parts = String(message || "").split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : message;
};

// Gom tuổi nợ 1 lần cho card Rủi ro (trễ 1-3d / 4-7d / >7d)
const agingBuckets = computed(() => {
  const defs = [
    { key: "b1", title: "Trễ 1–3 ngày", color: "warning", min: 1, max: 3 },
    { key: "b2", title: "Trễ 4–7 ngày", color: "orange", min: 4, max: 7 },
    { key: "b3", title: "Trễ trên 7 ngày", color: "error", min: 8, max: 9999 },
  ];
  const totalQty =
    overdueList.value.reduce(
      (s, n) => s + (Number(n?.Quantity) || 0),
      0,
    ) || 1;
  return defs.map((d) => {
    const items = overdueList.value.filter((n) => {
      const late = -(n?.DaysRemaining ?? 0);
      return late >= d.min && late <= d.max;
    });
    const qty = items.reduce((s, n) => s + (Number(n?.Quantity) || 0), 0);
    return {
      ...d,
      count: items.length,
      qty,
      percent: Math.round((qty * 100) / totalQty),
    };
  });
});

const riskTotal = computed(() => {
  const qty = overdueList.value.reduce(
    (s, n) => s + (Number(n?.Quantity) || 0),
    0,
  );
  const maxDays = overdueList.value.reduce(
    (m, n) => Math.max(m, -(n?.DaysRemaining ?? 0)),
    0,
  );
  return { count: overdueList.value.length, qty, maxDays };
});

// Đơn tắc nghẽn: đang SX, tạo lâu nhất (top 3)
const stuckOrders = computed(() => {
  const dayMs = 86400000;
  const now = Date.now();
  return manufacturingList.value
    .filter((m) => m.Status_Output === "Đang sản xuất" && m.Date)
    .map((m) => {
      const created = new Date(m.Date).getTime();
      return {
        ...m,
        stuckDays: isNaN(created) ? 0 : Math.max(0, Math.floor((now - created) / dayMs)),
      };
    })
    .sort((a, b) => b.stuckDays - a.stuckDays)
    .slice(0, 3);
});

// Số đơn hoàn thành (KPI)
const manufactureDoneCount = computed(
  () =>
    manufacturingList.value.filter((m) => m.Status_Output === "Hoàn thành")
      .length,
);

// Nhập liệu SX 24h qua: tên đơn + công đoạn + SL (mới nhất trước, tối đa 8)
const { recentProduction } = useRecentProduction();

const recentList = computed(() =>
  [...(recentProduction.value || [])]
    .sort((a, b) => String(b.WorkDate || "") > String(a.WorkDate || "") ? 1 : -1)
    .slice(0, 8),
);

// Nhãn ngày chính xác tới mức data cho phép (Timestamp chỉ có ngày)
const dayLabel = (workDate) => {
  const s = String(workDate || "").slice(0, 10);
  if (!s) return "";
  const today = new Date();
  const ymd = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (s === ymd(today)) return "Hôm nay";
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  if (s === ymd(y)) return "Hôm qua";
  const [y0, m0, d0] = s.split("-");
  return `${d0}/${m0}`;
};

const manufacturingList = computed(() => manufacture.value || []);
const manufacturingCount = computed(
  () =>
    manufacturingList.value.filter((m) => m.Status_Output === "Đang sản xuất")
      .length,
);
const manufactureProgress = computed(() => {
  const total = manufacturingList.value.length;
  if (!total) return 0;
  const done = manufacturingList.value.filter(
    (m) => m.Status_Output === "Hoàn thành",
  ).length;
  return Math.round((done * 100) / total);
});



const overviewSubtitle = computed(
  () =>
    `Hôm nay có ${overdueCount.value} lịch trễ · ${dueSoonCount.value} lịch tới hạn · SX đạt ${manufactureProgress.value}%`,
);

// Chỉ tick được lịch đã tới hạn (trễ/hôm nay/ngày mai)
const canConfirm = (s) => (s?.DaysRemaining ?? 99) <= 1;

// Tick xác nhận inline: cùng API + luật với DetailPO (ngày thực = hôm nay)
const confirmingIds = ref([]);
const confirmError = ref("");
const canTick =
  localStorage.getItem("LevelUser") === "Admin" ||
  localStorage.getItem("LevelUser") === "Quản lý kinh doanh";

const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const confirmDelivery = async (s) => {
  if (!canConfirm(s) || confirmingIds.value.includes(s.id)) return;
  confirmingIds.value.push(s.id);
  confirmError.value = "";
  try {
    await axios.put(
      `${Url}/Project/DetailProject/Confirm-item/${s.id}`,
      { ActualDate: todayYMD() },
    );
  } catch (error) {
    confirmError.value =
      error?.response?.data?.message || "Xác nhận giao hàng thất bại";
  } finally {
    confirmingIds.value = confirmingIds.value.filter((x) => x !== s.id);
  }
};

const delayLabel = (s) => {
  const d = s?.DaysRemaining ?? 0;
  if (d < 0) return `Trễ ${-d} ngày`;
  if (d === 0) return "Hôm nay";
  if (d === 1) return "Ngày mai";
  return `Còn ${d} ngày`;
};

const delayColor = (s) => {
  const d = s?.DaysRemaining ?? 0;
  if (d < 0) return "error";
  if (d <= 1) return "warning";
  return "info";
};

</script>

<style scoped>
.min-width-0 {
  min-width: 0;
}
</style>
