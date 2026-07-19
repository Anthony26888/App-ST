<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <template v-slot:title>
      <v-card-title class="text-h4 font-weight-light"
        >Danh sách dự án</v-card-title
      >
    </template>
    <template v-slot:append>
      <v-btn
        icon="mdi-chat"
        variant="text"
        color="primary"
        @click="DialogAIChat = true"
      ></v-btn>
      <NotificationBell />
    </template>
    <v-card-text>
      <v-card-title class="mb-3">
        <v-row v-if="lgAndUp">
          <v-col cols="12" sm="6" md="3">
            <CardStatistic
              title="Tổng số khách hàng"
              :value="project?.length || 0"
              icon="mdi-account-group"
              color="primary"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <CardStatistic
              title="Tổng số PO"
              :value="
                project?.reduce((sum, p) => sum + (p.Quantity_PO || 0), 0) || 0
              "
              icon="mdi-file-document-multiple"
              color="info"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <CardStatistic
              title="Tổng PO hoàn thành"
              :value="
                filteredProjectFind?.filter((p) => p.Status === 'Hoàn thành')
                  .length || 0
              "
              icon="mdi-check-circle"
              color="success"
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <CardStatistic
              title="Tổng PO đang sản xuất"
              :value="
                filteredProjectFind?.filter((p) => p.Status === 'Đang sản xuất')
                  .length || 0
              "
              icon="mdi-progress-wrench"
              color="warning"
            />
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col cols="6">
            <CardStatistic
              title="Tổng khách hàng"
              :value="project?.length || 0"
              icon="mdi-account-group"
              color="primary"
            />
          </v-col>
          <v-col cols="6">
            <CardStatistic
              title="Tổng PO"
              :value="
                project?.reduce((sum, p) => sum + (p.Quantity_PO || 0), 0) || 0
              "
              icon="mdi-file-document-multiple"
              color="info"
            />
          </v-col>
          <v-col cols="6">
            <CardStatistic
              title="Hoàn thành"
              :value="
                filteredProjectFind?.filter((p) => p.Status === 'Hoàn thành')
                  .length || 0
              "
              icon="mdi-check-circle"
              color="success"
            />
          </v-col>
          <v-col cols="6">
            <CardStatistic
              title="Đang sản xuất"
              :value="
                filteredProjectFind?.filter((p) => p.Status === 'Đang sản xuất')
                  .length || 0
              "
              icon="mdi-progress-wrench"
              color="warning"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-card variant="elevated" elevation="0" class="rounded-xl border">
        <v-card-title class="d-flex align-center" v-if="lgAndUp">
          <!-- <ButtonImportFile @import-file="Dialog = true" /> -->
          <ButtonAdd
            @add="DialogAdd = true"
            v-if="LevelUser == 'Admin' || LevelUser == 'Quản lý kinh doanh'"
          />
          <v-menu :location="location">
            <template v-slot:activator="{ props }">
              <v-btn
                color="orange"
                v-bind="props"
                class="ms-2 text-caption"
                prepend-icon="mdi-filter"
                variant="tonal"
              >
                Bộ lọc
              </v-btn>
            </template>

            <v-list>
              <v-list-item
                v-for="(item, index) in itemsFilter"
                :key="index"
                :value="item.value"
                @click="search = item.value"
              >
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn
            class="ms-2 text-caption"
            variant="tonal"
            color="pink"
            @click="DialogFind = true"
          >
            <v-icon>mdi-magnify</v-icon>Tìm nâng cao</v-btn
          >
          <ButtonDownload @click="DownloadProject()" />
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <v-card-title class="d-flex align-center" v-else>
          <!-- <ButtonImportFile @import-file="Dialog = true" /> -->
          <v-row>
            <v-col cols="1">
              <v-menu :location="location">
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="orange"
                    v-bind="props"
                    class="ms-2 text-caption"
                    icon="mdi-filter"
                    variant="text"
                  >
                  </v-btn>
                </template>

                <v-list>
                  <v-list-item
                    v-for="(item, index) in itemsFilter"
                    :key="index"
                    :value="item.value"
                    @click="search = item.value"
                  >
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-col>
            <v-col cols="11">
              <InputSearch v-model="search" />
            </v-col>
          </v-row>
        </v-card-title>

        <v-card-text class="overflow-auto">
          <v-data-table-virtual
            v-if="lgAndUp"
            density="comfortable"
            :headers="Headers"
            :items="project"
            :search="search"
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
            height="66vh"
          >
            <template v-slot:item.Status="{ value }">
              <div>
                <v-chip
                  :color="
                    value === 'Hoàn thành'
                      ? 'success'
                      : value === 'Đang sản xuất'
                      ? 'warning'
                      : 'error'
                  "
                  variant="tonal"
                  class="text-caption"
                  size="small"
                >
                  {{ value }}
                </v-chip>
              </div>
            </template>
            <template v-slot:item.id="{ value }">
              <div class="d-flex align-center">
                <ButtonEye @detail="PushItem(value)" />
                <ButtonEdit
                  class="ms-2"
                  @edit="GetItem(value)"
                  v-if="
                    LevelUser == 'Admin' || LevelUser == 'Quản lý kinh doanh'
                  "
                />
                <Button-Download-Icon
                  @click="DownloadProjectDetail(value)"
                ></Button-Download-Icon>
              </div>
            </template>
            <template #[`item.Percent_Completed`]="{ item }">
              <v-progress-linear
                v-model="item.Percent_Completed"
                height="25"
                color="success"
                rounded
                class="rounded-lg"
              >
                <strong>{{ item.Percent_Completed }}%</strong>
              </v-progress-linear>
            </template>
          </v-data-table-virtual>

          <v-data-table-virtual
            v-else
            :headers="Headers"
            density="compact"
            :items="project"
            :search="search"
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
            height="calc(100vh - 400px)"
          >
            <template v-slot:item.Status="{ value }">
              <div>
                <v-chip
                  :color="
                    value === 'Hoàn thành'
                      ? 'success'
                      : value === 'Đang sản xuất'
                      ? 'warning'
                      : 'error'
                  "
                  variant="tonal"
                  class="text-caption"
                >
                  {{ value }}
                </v-chip>
              </div>
            </template>
            <template #[`item.Percent_Completed`]="{ item }">
              <v-progress-linear
                v-model="item.Percent_Completed"
                height="25"
                color="success"
                rounded
                class="rounded-lg"
              >
                <strong>{{ item.Percent_Completed || 0 }}%</strong>
              </v-progress-linear>
            </template>
            <template v-slot:item.id="{ value }">
              <div class="d-flex align-center">
                <ButtonEye @detail="PushItem(value)" />
                <ButtonEdit
                  class="ms-2"
                  @edit="GetItem(value)"
                  v-if="
                    LevelUser == 'Admin' || LevelUser == 'Quản lý kinh doanh'
                  "
                />
                <Button-Download-Icon
                  @click="DownloadProjectDetail(value)"
                ></Button-Download-Icon>
              </div>
            </template>
            <template #[`item.Note`]>
              <div style="white-space: pre-line">{{ item.Note }}</div>
            </template>
          </v-data-table-virtual>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <BaseDialog
    title="Thêm dữ liệu"
    icon="mdi-plus"
    max-width="500"
    v-model="DialogAdd"
  >
    <InputField label="Khách hàng" v-model="Customer_Add" />
    <InputTextarea
      style="white-space: pre-line"
      label="Ghi chú"
      v-model="Note_Add"
    />
    <template v-slot:actions>
      <ButtonCancel @cancel="DialogAdd = false" />
      <ButtonSave @save="SaveAdd()" />
    </template>
  </BaseDialog>

  <BaseDialog
    title="Cập nhật dữ liệu"
    icon="mdi-pencil"
    max-width="500"
    v-model="DialogEdit"
  >
    <InputField label="Khách hàng" v-model="Customer_Edit" />
    <InputTextarea
      style="white-space: pre-line"
      label="Ghi chú"
      v-model="Note_Edit"
    />
    <template v-slot:actions>
      <ButtonDelete @delete="DialogRemove = true" />
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogEdit = false" />
      <ButtonSave @save="SaveEdit()" />
    </template>
  </BaseDialog>

  <BaseDialog
    title="Xoá dữ liệu"
    icon="mdi-delete"
    max-width="400"
    v-model="DialogRemove"
  >
    <p>Bạn có chắc chắn muốn xoá khách hàng này ?</p>
    <template v-slot:actions>
      <ButtonCancel @cancel="DialogRemove = false" />
      <ButtonDelete @delete="RemoveItem()" />
    </template>
  </BaseDialog>

  <BaseDialog
    title="Tìm kiếm nâng cao"
    icon="mdi-filter"
    max-width="1300"
    v-model="DialogFind"
  >
    <v-card-title>
      <v-row class="ms-2">
        <v-col cols="3" md="3">
          <InputDate v-model="startDateDelivery" label="Từ ngày giao hàng" />
        </v-col>
        <v-col cols="3" md="3">
          <InputDate v-model="endDateDelivery" label="Đến ngày giao hàng" />
        </v-col>
        <v-col cols="1" md="1">
          <v-tooltip text="Xoá lọc" location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                color="error"
                class="text-caption mt-2"
                variant="text"
                icon="mdi-filter-remove"
                @click="
                  (startDate = ''),
                    (endDate = ''),
                    (search = ''),
                    (startDateDelivery = ''),
                    (endDateDelivery = ''),
                    (DialogFilterDate = false)
                "
              ></v-btn>
            </template>
          </v-tooltip>
        </v-col>
        <v-col cols="5">
          <InputSearch
            variant="solo-filled"
            density="comfortable"
            v-model="searchFind"
          />
        </v-col>
      </v-row>
    </v-card-title>
    <v-data-table-virtual
      fixed-header
      density="compact"
      :headers="HeadersFind"
      :items="filteredProjectFind"
      :search="searchFind"
      :items-per-page="itemsPerPageFind"
      v-model:page="pageFind"
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
      height="calc(100vh - 320px)"
    >
      <template v-slot:item.Status="{ value }">
        <div>
          <v-chip
            :color="
              value === 'Hoàn thành'
                ? 'success'
                : value === 'Đang sản xuất'
                ? 'warning'
                : 'error'
            "
            variant="tonal"
            size="small"
            class="text-caption"
          >
            {{ value }}
          </v-chip>
        </div>
      </template>
      <template v-slot:item.id="{ item }">
        <div class="d-flex align-center">
          <ButtonEye @detail="PushItemFind(item)" />
        </div>
      </template>
      <template v-slot:item.Date_Created_PO="{ item }">
        {{ item.Date_Created_PO.split("-").reverse().join("/") }}
      </template>
      <template v-slot:item.Date_Delivery_PO="{ item }">
        {{ item.Date_Delivery_PO.split("-").reverse().join("/") }}
      </template>
    </v-data-table-virtual>
  </BaseDialog>

  <BaseDialog
    v-model="DialogAIChat"
    title="Trợ lý AI - Giao diện Giao hàng"
    icon="mdi-robot"
    width="100%"
    max-width="1200"
  >
    <div class="chat-container">
      <div class="chat-messages" ref="chatBody">
        <div
          v-if="messages.length === 0"
          class="empty-chat-state d-flex flex-column align-center justify-center py-10"
        >
          <v-icon size="64" color="grey-lighten-2"
            >mdi-chat-processing-outline</v-icon
          >
          <div class="text-h6 text-grey-darken-1 mt-4">
            Chào mừng bạn đến với Trợ lý AI!
          </div>
          <div class="text-body-2 text-grey">
            Hỏi tôi về tình trạng giao hàng, PO trễ hoặc tóm tắt khách hàng.
          </div>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message-wrapper"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="d-flex align-end"
            :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'"
          >
            <v-avatar
              size="36"
              :color="msg.role === 'user' ? 'primary' : 'secondary'"
              class="elevation-2 mx-2 mb-1"
            >
              <v-icon size="20" color="white">
                {{ msg.role === "user" ? "mdi-account" : "mdi-robot" }}
              </v-icon>
            </v-avatar>

            <div
              class="message-bubble shadow-sm"
              :class="[
                msg.role === 'user' ? 'user-bubble' : 'ai-bubble',
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-grey-lighten-4 text-black',
              ]"
            >
              <div class="text-body-1">{{ msg.text }}</div>

              <div
                v-if="msg.meta?.intent || msg.meta?.matchedCustomer"
                class="mt-2 pt-2 border-top-dash text-caption opacity-80"
              >
                <div v-if="msg.meta?.intent" class="d-flex align-center">
                  <v-icon size="12" class="me-1">mdi-tag-outline</v-icon>
                  Ý định: {{ msg.meta.intent.type || "-" }}
                </div>
                <div
                  v-if="msg.meta?.matchedCustomer"
                  class="d-flex align-center mt-1"
                >
                  <v-icon size="12" class="me-1">mdi-account-outline</v-icon>
                  Khách hàng: {{ msg.meta.matchedCustomer }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="message-wrapper justify-start">
          <div class="d-flex align-end">
            <v-avatar size="36" color="secondary" class="elevation-2 mx-2 mb-1">
              <v-icon size="20" color="white">mdi-robot</v-icon>
            </v-avatar>
            <div class="message-bubble ai-bubble bg-grey-lighten-4">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mx-4 mt-4"
          border="start"
          density="compact"
        >
          {{ error }}
        </v-alert>
      </div>

      <v-divider></v-divider>

      <div class="chat-footer pa-4">
        <div class="suggestions-container mb-3" v-if="messages.length < 5">
          <div class="text-caption text-grey-darken-1 mb-2">Gợi ý câu hỏi:</div>
          <div class="d-flex flex-wrap gap-2">
            <v-chip
              v-for="hint in [
                'PO nào trễ',
                'Tóm tắt khách hàng...',
                'Hôm nay giao gì',
              ]"
              :key="hint"
              size="small"
              variant="outlined"
              color="primary"
              class="cursor-pointer hover-chip"
              @click="
                question = hint.includes('...') ? 'Tóm tắt khách hàng' : hint
              "
            >
              {{ hint }}
            </v-chip>
          </div>
        </div>

        <div class="d-flex align-end">
          <v-textarea
            v-model="question"
            placeholder="Nhập câu hỏi tại đây..."
            variant="outlined"
            rows="1"
            auto-grow
            hide-details
            density="comfortable"
            class="flex-grow-1 custom-textarea rounded-xl"
            @keydown.enter.exact.prevent="handleSend"
            bg-color="white"
          >
            <template v-slot:append-inner>
              <v-btn
                icon="mdi-send"
                variant="text"
                color="primary"
                :loading="loading"
                :disabled="!question.trim()"
                @click="handleSend"
              />
            </template>
          </v-textarea>

          <v-btn
            icon="mdi-delete-sweep-outline"
            variant="text"
            color="grey-darken-1"
            class="ms-2 mb-1"
            title="Xóa chat"
            @click="clearMessages"
          />
        </div>
      </div>
    </div>
  </BaseDialog>

  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import { nextTick, watch } from "vue";
import { useDeliveryChat } from "@/composables/Project/useAIChat";
import axios from "axios";
import { useRouter } from "vue-router";
import { ref, reactive, computed } from "vue";
import { useDisplay } from "vuetify";
// Components
import InputSearch from "@/components/Input-Search.vue";
import InputFiles from "@/components/Input-Files.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
import ButtonImportFile from "@/components/Button-ImportFile.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonDownloadIcon from "@/components/Button-Download-Icon.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import ButtonAI from "@/components/Button-AI.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import NotificationBell from "@/components/NotificationBell.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import InputDate from "@/components/Input-Date.vue";

// Composables
import { useProject } from "@/composables/Project/useProject";
import { useProjectFind } from "@/composables/Project/useProjectFind";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;
// ===== STATE MANAGEMENT =====
const { mdAndDown, lgAndUp } = useDisplay();
// Router
const router = useRouter();

// Initialize composables
const { project } = useProject();
const { projectFind } = useProjectFind();

// ===== DIALOG STATES =====
// Control visibility of various dialogs
const Dialog = ref(false); // Main dialog
const DialogEdit = ref(false); // Edit dialog
const DialogSuccess = ref(false); // Success notification
const DialogFailed = ref(false); // Error notification
const DialogRemove = ref(false); // Remove confirmation dialog
const DialogAdd = ref(false); // Add new item dialog
const DialogLoading = ref(false); // Loading state
const DialogFilterDate = ref(false); // Filter by date dialog
const DialogFind = ref(false); // Find by date dialog
const DialogAIChat = ref(false); // AI chat dialog
// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== FORM STATES =====
// File upload state
const File = ref(null);

// Customer form states
const Customer_Edit = ref(""); // Customer name for editing
const Customer_Add = ref("");
const Note_Edit = ref("");
const Note_Add = ref("");
const GetID = ref(""); // Current item ID being processed

// ===== Table States =====
const Headers = ref([
  { key: "Customer", title: "Khách hàng", width: "200" },
  { key: "Status", title: "Trạng thái", width: "200" },
  { key: "Quantity_PO", title: "Tổng PO", width: "200" },
  { key: "Quantity_Orders", title: "Tổng đơn hàng", width: "200" },
  { key: "Percent_Completed", title: "Tỉ lệ hoàn thành", width: "200" },
  { key: "Note", title: "Ghi chú", width: "400" },
  { key: "id", sortable: false, title: "Thao tác" },
]);

const HeadersFind = ref([
  { key: "CustomerName", title: "KH", width: "70" },
  { key: "POID", title: "Tên dự án", width: "150" },
  {
    key: "ProductDetail",
    title: "Tên đơn hàng",
    sortable: false,
    width: "400",
  },
  { key: "Status", title: "Trạng thái đơn hàng", sortable: true, width: "150" },
  {
    key: "DeliveryDate",
    title: "Ngày giao hàng",
    sortable: true,
    width: "150",
  },
  {
    key: "DeliveryQuantity",
    title: "Số lượng giao hàng",
    sortable: true,
    width: "150",
  },
  {
    key: "DeliveryStatus",
    title: "Trạng thái giao hàng",
    sortable: true,
    width: "150",
  },
  { key: "id", sortable: false, title: "Thao tác" },
]);

const itemsFilter = [
  { title: "Tất cả", value: "" },
  { title: "Chưa có đơn hàng", value: "Chưa có đơn hàng" },
  { title: "Đang sản xuất", value: "Đang sản xuất" },
  { title: "Hoàn thành", value: "Hoàn thành" },
];

const startDate = ref("");
const endDate = ref("");

const startDateDelivery = ref("");
const endDateDelivery = ref("");

const search = ref("");
const searchFind = ref("");

const itemsPerPage = ref(15);
const page = ref(1);

const itemsPerPageFind = ref(15);
const pageFind = ref(1);
// ===== FILTER STATES =====

// ===== User Information =====
const UserInfo = ref(null);
const LevelUser = localStorage.getItem("LevelUser");

// ===== COMPUTED =======
const filteredProjectFind = computed(() => {
  return projectFind.value.filter((item) => {
    const projectDate = new Date(item.Date_Created_PO);
    const deliveryDate = new Date(item.DeliveryDateUnixpoch);
    const start = startDate.value ? new Date(startDate.value) : null;
    const end = endDate.value ? new Date(endDate.value) : null;
    const startDelivery = startDateDelivery.value
      ? new Date(startDateDelivery.value)
      : null;
    const endDelivery = endDateDelivery.value
      ? new Date(endDateDelivery.value)
      : null;

    if (start && projectDate < start) return false;
    if (end && projectDate > end) return false;
    if (startDelivery && deliveryDate < startDelivery) return false;
    if (endDelivery && deliveryDate > endDelivery) return false;
    return true;
  });
});

// ===== CRUD OPERATIONS =====
/**
 * Navigates to customer details page and stores customer information
 * @param {string} value - The ID of the customer to view
 */
function PushItem(value) {
  const found = project.value.find((v) => v.id === value);
  router.push(`/Du-an/Don-hang/${value}`);
  localStorage.setItem("Customers", found.Customer);
  localStorage.setItem("CustomersID", value);
}

function PushItemFind(item) {
  localStorage.setItem("Customers", item.CustomerName);
  localStorage.setItem("CustomersID", item.id);
  localStorage.setItem("POID", item.POID);
  localStorage.setItem("ProductID", item.ProductDetail);
  localStorage.setItem("PO", item.PO);
  router.push(`/Du-an/Don-hang/${item.CustomerID}`);
}

/**
 * Prepares an item for editing by setting up the edit dialog
 * @param {string} value - The ID of the item to edit
 */
function GetItem(value) {
  DialogEdit.value = true;
  GetID.value = value;
  const found = project.value.find((v) => v.id === value);
  Customer_Edit.value = found.Customer;
  Note_Edit.value = found.Note;
}

/**
 * Saves edited customer data
 * Makes an API call to update customer information
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    CustomerName: Customer_Edit.value,
    Note: Note_Edit.value,
  });

  try {
    const response = await axios.put(
      `${Url}/Project/Customer/Edit-item/${GetID.value}`,
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

/**
 * Saves new customer data
 * Makes an API call to create a new customer
 */
const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    CustomerName: Customer_Add.value,
    Note: Note_Add.value,
  });

  try {
    const response = await axios.post(
      `${Url}/Project/Customer/Add-item`,
      formData,
    );
    DialogLoading.value = false;
    DialogAdd.value = false;
    DialogSuccess.value = true;
    MessageDialog.value = "Thêm dữ liệu thành công";
  } catch (error) {
    DialogLoading.value = false;
    DialogAdd.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
  }
};

/**
 * Removes a customer from the system
 * Makes an API call to delete the customer
 */
const RemoveItem = async (id) => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Project/Customer/Delete-item/${GetID.value}`,
    );
    DialogRemove.value = false;
    DialogSuccess.value = true;
    DialogLoading.value = false;
    DialogEdit.value = false;
    MessageDialog.value = "Xoá dữ liệu thành công";
  } catch (error) {
    DialogRemove.value = false;
    DialogLoading.value = false;
    DialogFailed.value = true;
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
  }
};

// ===== FILE OPERATIONS =====
/**
 * Imports customer data from a file
 * Makes an API call to upload and process the file
 */
const ImportFile = async () => {
  DialogLoading.value = true;
  const formData = new FormData();
  formData.append("file", File.value);

  try {
    const response = await axios.post(
      `${Url}/Project/Customer/Upload-file`,
      formData,
    );
    MessageDialog.value = "Tải file thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Tải file thất bại";
    Error();
  }
};

/**
 * Downloads warehouse data as an Excel file
 */
const DownloadProject = async () => {
  try {
    const response = await fetch(`${Url}/Project/download`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Dự_án.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
    MessageErrorDialog.value = "Lỗi tải file";
    Error();
  }
};
/**
 * /Downloads warehouse data as an Excel file
 */
const DownloadProjectDetail = async (value) => {
  try {
    const response = await fetch(`${Url}/Project-Detail/download/${value}`);
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Chi_tiết_dự_án.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error);
    MessageErrorDialog.value = "Lỗi tải file";
    Error();
  }
};

// ===== UTILITY FUNCTIONS =====
/**
 * Resets all dialog states and form data
 * Called after successful operations
 */
function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  Dialog.value = false;
  DialogLoading.value = false;
  Customer_Add.value = "";
  Years_Add.value = "";
  Customer_Edit.value = "";
  Years_Edit.value = "";
}

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}

const question = ref("");
const chatBody = ref(null);

const { loading, error, messages, sendMessage, clearMessages } =
  useDeliveryChat();

async function handleSend() {
  const text = question.value.trim();
  if (!text || loading.value) return;

  question.value = "";
  await sendMessage(text);
}

watch(
  () => messages.value.length,
  async () => {
    await nextTick();
    const el = chatBody.value?.$el || chatBody.value;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  },
);
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
    InputDate,
    ButtonAI,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 75vh;
  background-color: #fcfcfc;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-wrapper {
  display: flex;
  width: 100%;
}

.message-bubble {
  max-width: 75%;
  padding: 12px 16px;
  position: relative;
  white-space: pre-wrap;
  line-height: 1.5;
}

.user-bubble {
  border-radius: 20px 20px 4px 20px;
}

.ai-bubble {
  border-radius: 20px 20px 20px 4px;
}

.border-top-dash {
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
}

.text-white .border-top-dash {
  border-top-color: rgba(255, 255, 255, 0.2);
}

.shadow-sm {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
}

.cursor-pointer {
  cursor: pointer;
}

.hover-chip:hover {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
  transition: all 0.3s ease;
}

.gap-2 {
  gap: 8px;
}

/* Typing Dots Animation */
.typing-dots {
  display: flex;
  padding: 4px 0;
}

.typing-dots span {
  height: 8px;
  width: 8px;
  background: #999;
  border-radius: 50%;
  display: block;
  margin: 0 3px;
  animation: typing 1s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}

.custom-textarea :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

.custom-textarea :deep(.v-field--focused .v-field__outline) {
  --v-field-border-opacity: 1;
}
</style>
