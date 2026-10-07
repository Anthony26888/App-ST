<template lang="">
  <v-card variant="text" class="app-page">
    <PageHeader
      title="Chi tiết đơn hàng"
      back-to="/Du-an"
      :crumbs="[
        { title: 'Dự án', to: '/Du-an' },
        { title: NameCustomer || 'Chi tiết' },
      ]"
    />
    <v-card-text class="d-flex flex-column flex-grow-1" style="min-height: 0">
      <v-card-title class="mb-3">
        <v-row>
          <v-col cols="6" md="3">
            <CardStatistic
              title="Tổng số PO"
              :value="totalUniquePO || 0"
              icon="mdi-file-document-multiple"
              color="primary"
            />
          </v-col>
          <v-col cols="6" md="3">
            <CardStatistic
              title="Tổng số đơn hàng"
              :value="detailProjectPO?.length || 0"
              icon="mdi-package-variant-closed"
              color="info"
            />
          </v-col>
          <v-col cols="6" md="3">
            <CardStatistic
              title="Tổng đơn hàng hoàn thành"
              :value="
                detailProjectPO?.filter((p) => p.Status === 'Hoàn thành')
                  .length || 0
              "
              icon="mdi-check-circle"
              color="success"
            />
          </v-col>
          <v-col cols="6" md="3">
            <CardStatistic
              title="Tổng đơn hàng đang sản xuất"
              :value="
                detailProjectPO?.filter((p) => p.Status === 'Đang sản xuất')
                  .length || 0
              "
              icon="mdi-progress-wrench"
              color="warning"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-card
        variant="elevated"
        elevation="0"
        class="rounded-xl border app-card-fill"
      >
        <v-card-title class="d-flex align-center flex-wrap ga-2 pe-2">
          <v-icon icon="mdi-account"></v-icon>
          <span class="text-truncate">{{ NameCustomer }}</span>

          <ButtonAdd
            @add="DialogAdd = true"
            v-if="LevelUser == 'Admin' || LevelUser == 'Quản lý kinh doanh'"
          />
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>

        <AppDataTable
          :group-by="[{ key: 'POID' }]"
          :search="search"
          :items="detailProjectPO"
          v-model:expanded="expanded"
          :headers="Headers"
          :loading="DialogLoading"
          show-expand
        >
          <template
            v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }"
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

          <template
            v-slot:item.data-table-expand="{ internalItem, isExpanded }"
          >
            <v-badge
              :content="getOverdueCount(internalItem.raw)"
              :model-value="getOverdueCount(internalItem.raw) > 0"
              color="error"
              location="top left"
            >
              <v-btn
                :append-icon="
                  isExpanded(internalItem)
                    ? 'mdi-chevron-up'
                    : 'mdi-chevron-down'
                "
                :text="
                  isExpanded(internalItem)
                    ? 'Thu gọn'
                    : `Lịch giao (${getScheduleDeliveries(internalItem.raw).length})`
                "
                class="text-none"
                color="medium-emphasis"
                size="small"
                variant="text"
                width="115"
                border
                slim
                @click="toggleSingleExpand(internalItem)"
              ></v-btn>
            </v-badge>
          </template>

          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="py-4">
                <v-sheet rounded="lg" border class="pa-4">
                  <!-- Lịch giao hàng -->
                  <div class="mb-4">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <h4 class="text-subtitle1 font-weight-bold">
                        Lịch giao hàng
                        <span class="text-caption text-medium-emphasis font-weight-regular">
                          (Đã hẹn {{ scheduledTotal(item) }} /
                          Đơn {{ Number(item.Quantity_Product) || 0 }} pcs)
                        </span>
                      </h4>
                      <v-btn
                        v-if="
                          LevelUser == 'Admin' ||
                          LevelUser == 'Quản lý kinh doanh'
                        "
                        color="primary"
                        variant="tonal"
                        size="small"
                        prepend-icon="mdi-plus"
                        class="text-none"
                        @click="GetItem(item)"
                      >
                        Thêm lịch
                      </v-btn>
                    </div>

                    <v-table
                      v-if="getScheduleDeliveries(item).length > 0"
                      density="compact"
                    >
                      <thead>
                        <tr class="bg-grey-lighten-4">
                          <th class="text-left">Ngày giao</th>
                          <th class="text-left">Số lượng</th>
                          <th class="text-left">Trạng thái</th>
                          <th class="text-left">Ngày thực giao</th>
                          <th class="text-left">Sớm/Trễ</th>
                          <th class="text-left">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(schedule, sIndex) in getScheduleDeliveries(
                            item,
                          )"
                          :key="`${schedule.id}-${sIndex}`"
                        >
                          <td class="py-2">
                            {{ toSlash(schedule.DeliveryDateConvert) }}
                          </td>
                          <td class="py-2">
                            {{ schedule.DeliveryQuantity }}
                          </td>
                          <td class="py-2">
                            <v-chip
                              :text="scheduleState(schedule).text"
                              :color="scheduleState(schedule).color"
                              variant="tonal"
                              size="small"
                            ></v-chip>
                          </td>
                          <td class="py-2">
                            {{
                              schedule.DeliveryCheck === "Đã giao" &&
                              schedule.ActualDeliveryDate
                                ? toSlash(schedule.ActualDeliveryDate)
                                : "—"
                            }}
                          </td>
                          <td class="py-2">
                            <v-chip
                              v-if="delayChip(schedule.DelayDays).text"
                              :text="delayChip(schedule.DelayDays).text"
                              :color="delayChip(schedule.DelayDays).color"
                              variant="tonal"
                              size="small"
                            ></v-chip>
                            <div v-else class="text-grey">—</div>
                          </td>
                          <td class="py-2">
                            <div
                              class="d-flex"
                              v-if="
                                LevelUser == 'Admin' ||
                                LevelUser == 'Quản lý kinh doanh'
                              "
                            >
                              <ButtonEdit
                                v-if="schedule.DeliveryCheck === 'Chưa giao'"
                                @edit="GetConfirm(schedule, item)"
                              />
                              <template v-else>
                                <v-tooltip
                                  text="Sửa ngày thực giao"
                                  location="top"
                                >
                                  <template #activator="{ props }">
                                    <v-btn
                                      v-bind="props"
                                      color="info"
                                      icon="mdi-calendar-edit"
                                      variant="text"
                                      size="xs"
                                      @click="GetEditActual(schedule)"
                                    ></v-btn>
                                  </template>
                                </v-tooltip>
                                <v-tooltip
                                  text="Hủy xác nhận giao hàng"
                                  location="top"
                                >
                                  <template #activator="{ props }">
                                    <v-btn
                                      v-bind="props"
                                      color="warning"
                                      icon="mdi-undo"
                                      variant="text"
                                      size="xs"
                                      @click="GetUnconfirm(schedule, item)"
                                    ></v-btn>
                                  </template>
                                </v-tooltip>
                              </template>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>

                    <div v-else class="text-center text-grey text-caption py-4">
                      Chưa có lịch giao hàng
                    </div>
                  </div>
                </v-sheet>
              </td>
            </tr>
          </template>

          <template v-slot:item.id="{ item }">
            <div class="d-flex">
              <ButtonEdit
                @edit="GetItem(item)"
                v-if="LevelUser == 'Admin' || LevelUser == 'Quản lý kinh doanh'"
              />
              <v-btn
                color="success"
                icon="mdi-plus"
                variant="text"
                size="xs"
                @click="GetItemManufacture(item)"
              ></v-btn>
            </div>
          </template>

          <template #item.Status="{ value }">
            <div class="text-start">
              <v-chip
                :text="statusChip(value).text"
                :color="statusChip(value).color"
                variant="tonal"
                class="text-caption"
                size="small"
              ></v-chip>
            </div>
          </template>

          <template #[`item.Percent_Manufacture`]="{ item }">
            <v-progress-linear
              v-model="item.Percent_Manufacture"
              height="25"
              color="success"
              rounded
              class="rounded-lg"
            >
              <strong>{{ Number(item.Percent_Manufacture || 0).toFixed(1) }}%</strong>
            </v-progress-linear>
          </template>

          <template #[`item.Percent_Delivery`]="{ item }">
            <v-progress-linear
              :model-value="deliveryPercent(item)"
              height="25"
              color="info"
              rounded
              class="rounded-lg"
            >
              <strong>{{ deliveryPercent(item).toFixed(1) }}%</strong>
            </v-progress-linear>
          </template>

          <template #item.Note="{ item }">
            <div style="white-space: pre-line">{{ item.Note }}</div>
          </template>

          <template #no-data>
            <div class="app-empty-state text-center">
              <v-icon
                icon="mdi-package-variant-closed"
                size="40"
                color="medium-emphasis"
                class="mb-2"
              ></v-icon>
              <div class="text-body-1 text-medium-emphasis mb-3">
                Chưa có đơn hàng nào
              </div>
              <v-btn
                v-if="LevelUser == 'Admin' || LevelUser == 'Quản lý kinh doanh'"
                color="primary"
                variant="tonal"
                prepend-icon="mdi-plus"
                class="text-none"
                @click="DialogAdd = true"
              >
                Thêm đơn hàng
              </v-btn>
            </div>
          </template>
        </AppDataTable>
      </v-card>
    </v-card-text>
  </v-card>

  <!-- Dialog cập nhật dữ liệu -->
  <BaseDialog
    title="Cập nhật dữ liệu"
    icon="mdi-pencil"
    max-width="1100" :fullscreen="mdAndDown"
    v-model="DialogEdit"
  >
    <v-row>
      <v-col cols="7">
        <InputField label="Tên PO" v-model="PO_Edit" />
        <InputField label="Chi tiết đơn hàng" v-model="Product_Detail_Edit" />
        <v-row>
          <v-col cols="4">
            <InputField
              label="SL đơn hàng"
              type="number"
              v-model="Quantity_Product_Edit"
            />
          </v-col>
          <v-col cols="4">
            <InputField
              label="SL đã giao"
              type="number"
              v-model="Quantity_Delivered_Edit"
            />
          </v-col>
          <v-col cols="4">
            <InputField
              label="SL còn nợ"
              type="number"
              v-model="Quantity_Amount_Edit"
            />
          </v-col>
        </v-row>
        <InputTextarea
          style="white-space: pre-line"
          label="Ghi chú"
          v-model="Note_Edit"
        />
      </v-col>
      <v-col cols="5">
        <div class="d-flex justify-space-between align-center mb-3">
          <h4 class="text-h6">Lịch giao hàng</h4>
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            prepend-icon="mdi-plus"
            class="text-caption text-medium-emphasis"
            @click="AddDeliveryRowEdit()"
          >
            Thêm lịch
          </v-btn>
        </div>

        <div class="delivery-header mb-2">
          <v-row no-gutters class="pa-2 bg-grey-lighten-4 rounded">
            <v-col cols="6">
              <small class="text-secondary font-weight-bold">Ngày giao</small>
            </v-col>
            <v-col cols="5">
              <small class="text-secondary font-weight-bold">Số lượng</small>
            </v-col>
          </v-row>
        </div>

        <div class="delivery-rows">
          <v-row
            v-for="(item, index) in DeliverySchedules_Edit"
            :key="index"
            no-gutters
            class="mb-2 align-center"
          >
            <v-col cols="6" class="pe-2">
              <InputDate
                label="Ngày tạo"
                v-model="item.DeliveryDate"
                @update:model-value="item.DeliveryDate = $event"
              />
            </v-col>
            <v-col cols="5" class="pe-2">
              <InputField
                label="Số lượng"
                suffix="pcs"
                type="number"
                v-model="item.DeliveryQuantity"
                @update:model-value="item.DeliveryQuantity = $event"
              />
            </v-col>
            <v-col cols="1" class="text-center">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                class="mb-4"
                @click="RemoveDeliveryRowEdit(index, item.id)"
              ></v-btn>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
    <template #actions>
      <ButtonDelete @delete="DialogRemove = true" />
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogEdit = false" />
      <ButtonSave @save="SaveEdit()" />
    </template>
  </BaseDialog>

  <!-- Dialog thêm mới dữ liệu -->
  <BaseDialog
    v-model="DialogAdd"
    title="Thêm dữ liệu"
    icon="mdi-plus"
    max-width="1100" :fullscreen="mdAndDown"
  >
    <div class="mb-4">
      <v-row>
        <v-col cols="7">
          <h4 class="text-h6 mb-3">Thông tin chung</h4>
          <InputField label="Tên PO" v-model="PO_Add" />
          <InputField label="Đơn hàng" v-model="Product_Detail_Add" />
          <v-row>
            <v-col cols="4">
              <InputField
                label="SL đơn hàng"
                type="number"
                v-model="Quantity_Product_Add"
              />
            </v-col>
            <v-col cols="4">
              <InputField
                label="SL đã giao"
                type="number"
                v-model="Quantity_Delivered_Add"
              />
            </v-col>
            <v-col cols="4">
              <InputField
                label="SL còn nợ"
                type="number"
                v-model="Quantity_Amount_Add"
                disabled
              />
            </v-col>
          </v-row>
          <InputTextarea label="Ghi chú chung" v-model="Note_Add" />
        </v-col>
        <!-- Lịch giao hàng -->
        <v-col cols="5">
          <div class="d-flex justify-space-between align-center mb-3">
            <h4 class="text-h6">Lịch giao hàng</h4>
            <v-btn
              color="primary"
              size="small"
              variant="tonal"
              prepend-icon="mdi-plus"
              class="text-caption text-medium-emphasis"
              @click="AddDeliveryRow()"
            >
              Thêm lịch
            </v-btn>
          </div>

          <div class="delivery-header mb-2">
            <v-row no-gutters class="pa-2 bg-grey-lighten-4 rounded">
              <v-col cols="6">
                <small class="text-secondary font-weight-bold">Ngày giao</small>
              </v-col>
              <v-col cols="5">
                <small class="text-secondary font-weight-bold">Số lượng</small>
              </v-col>
            </v-row>
          </div>

          <div class="delivery-rows">
            <v-row
              v-for="(item, index) in DeliverySchedules"
              :key="index"
              no-gutters
              class="mb-2 align-center"
            >
              <v-col cols="6" class="pe-2">
                <InputDate
                  v-model="item.delivery_date"
                  label="Ngày giao"
                ></InputDate>
              </v-col>
              <v-col cols="5" class="pe-2">
                <InputField
                  v-model.number="item.delivery_quantity"
                  type="number"
                  suffix="pcs"
                  label="Số lượng"
                ></InputField>
              </v-col>
              <v-col cols="1" class="text-center">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  class="mb-4"
                  @click="RemoveDeliveryRow(index)"
                ></v-btn>
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
    </div>
    <template #actions>
      <ButtonCancel @cancel="DialogAdd = false" />
      <ButtonSave @save="SaveAdd()" />
    </template>
  </BaseDialog>

  <!-- Dialog thêm mới dữ liệu -->
  <BaseDialog
    v-model="DialogAddManufacture"
    title="Chuyển dữ liệu xuống sản xuất"
    icon="mdi-plus"
    max-width="720" :fullscreen="mdAndDown"
  >
    <InputField label="Tên dự án" v-model="NamePO" />
    <InputField
      label="Tên đơn hàng"
      v-model="Name_Order_Manufacture"
      @update:model-value="Name_Order_Manufacture = $event"
    />
    <InputField
      label="Tổng sản phẩm"
      type="number"
      :model-value="Total_Manufacture_Add"
      @update:model-value="Total_Manufacture_Add = $event"
    />

    <!-- Thêm input cho quy trình khác (giống DialogAdd ở Page-Manufacture.vue) -->
    <div class="mt-3">
      <!-- Hiển thị danh sách quy trình tùy chỉnh đã thêm -->
      <div v-if="customProcessList.length > 0">
        <div class="text-caption text-grey mb-1">Quy trình đã thêm:</div>
        <div class="d-flex flex-wrap ga-2 mb-5">
          <v-chip
            v-for="(process, index) in customProcessList"
            :key="process"
            closable
            color="secondary"
            size="small"
            @click:close="removeCustomProcess(index)"
          >
            {{ process }}
          </v-chip>
        </div>
      </div>
      <InputField
        label="Thêm quy trình khác"
        v-model="customProcess"
        placeholder="Nhập tên quy trình và nhấn Enter"
        @keyup.enter="addCustomProcess"
        hint="Nhập và nhấn Enter để thêm nhiều quy trình"
      >
        <template #append>
          <v-btn
            icon="mdi-plus-circle"
            size="small"
            color="primary"
            variant="text"
            @click="addCustomProcess"
            :disabled="!customProcess || !customProcess.trim()"
          ></v-btn>
        </template>
      </InputField>
    </div>
    <InputDate
      label="Ngày tạo"
      v-model="Date_Manufacture_Add"
      :rules="[requiredRule]"
    />
    <InputTextarea
      label="Ghi chú"
      :model-value="Note_Add_Manufacture"
      @update:model-value="Note_Add_Manufacture = $event"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogAddManufacture = false" />
      <ButtonSave
        @save="SaveAddManufacture()"
        :disabled="!Date_Manufacture_Add"
      />
    </template>
  </BaseDialog>

  <!-- Dialog xoá dữ liệu -->
  <BaseDialog
    v-model="DialogRemove"
    title="Xoá dữ liệu"
    icon="mdi-delete"
    max-width="480" :fullscreen="mdAndDown"
  >
    <p>Bạn có chắc chắn muốn xoá đơn hàng này ?</p>
    <template #actions>
      <ButtonCancel @cancel="DialogRemove = false" />
      <ButtonDelete @delete="RemoveItem()" />
    </template>
  </BaseDialog>

  <!-- Dialog chỉnh sửa trạng thái giao hàng -->
  <BaseDialog
    v-model="DialogConfirm"
    title="Xác nhận giao hàng"
    icon="mdi-truck-delivery"
    max-width="480" :fullscreen="mdAndDown"
  >
    <p>
      Bạn có xác nhận giao
      <strong>{{ GetConfirmQuantity }} pcs</strong>
      <span v-if="GetConfirmItemName">cho "{{ GetConfirmItemName }}"</span>
      ? SL đã giao sẽ được cộng thêm.
    </p>
    <InputDate
      label="Ngày giao thực tế"
      v-model="GetActualDate"
      :rules="[requiredRule]"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogConfirm = false" />
      <ButtonSave @save="ConfirmItem()" :disabled="!GetActualDate" />
    </template>
  </BaseDialog>

  <!-- Dialog sửa ngày giao thực tế -->
  <BaseDialog
    v-model="DialogEditActual"
    title="Sửa ngày thực giao"
    icon="mdi-calendar-edit"
    max-width="480" :fullscreen="mdAndDown"
  >
    <p>
      Lịch giao <strong>{{ GetConfirmQuantity }} pcs</strong>
      <span v-if="GetConfirmItemName">cho "{{ GetConfirmItemName }}"</span
      >.
    </p>
    <InputDate
      label="Ngày giao thực tế"
      v-model="GetActualDate"
      :rules="[requiredRule]"
    />
    <template #actions>
      <ButtonCancel @cancel="DialogEditActual = false" />
      <ButtonSave @save="SaveEditActual()" :disabled="!GetActualDate" />
    </template>
  </BaseDialog>

  <!-- Dialog hủy xác nhận giao hàng -->
  <BaseDialog
    v-model="DialogUnconfirm"
    title="Hủy xác nhận giao hàng"
    icon="mdi-undo"
    max-width="480" :fullscreen="mdAndDown"
  >
    <p>
      Bạn có muốn hủy xác nhận giao
      <strong>{{ GetConfirmQuantity }} pcs</strong>
      <span v-if="GetConfirmItemName">cho "{{ GetConfirmItemName }}"</span>
      ? SL đã giao sẽ bị trừ ngược.
    </p>
    <template #actions>
      <ButtonCancel @cancel="DialogUnconfirm = false" />
      <ButtonSave @save="UnconfirmItem()" />
    </template>
  </BaseDialog>

  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
// ===== IMPORTS =====
// Core dependencies
import axios from "axios";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { ref, watch, onMounted, reactive, computed } from "vue";
import { jwtDecode } from "jwt-decode";
import { useDisplay } from "vuetify";
// Components
import InputSearch from "@/components/Input-Search.vue";
import InputField from "@/components/Input-Field.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import InputSelect from "@/components/Input-Select.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import CardStatistic from "@/components/Card-Statistic.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import InputDate from "@/components/Input-Date.vue";
import PageHeader from "@/components/Page-Header.vue";
import AppDataTable from "@/components/App-DataTable.vue";

// Composables
import { useDetailProjectPO } from "@/composables/Project/useDetailProjectPO";

// Shared UI
import {
  statusChip,
  scheduleState,
  delayChip,
} from "@/utils/deliveryStatus.js";

// ===== STATE MANAGEMENT =====
// API Configuration
const Url = import.meta.env.VITE_API_URL;

// Route and ID
const route = useRoute();
const id = route.params.id;

// Initialize composables
const { detailProjectPO, detailProjectPOError } = useDetailProjectPO(id);
const { mdAndDown, lgAndUp } = useDisplay();
// ===== DIALOG STATES =====
// Control visibility of various dialogs
const DialogEdit = ref(false); // Edit dialog
const DialogSuccess = ref(false); // Success notification
const DialogFailed = ref(false); // Error notification
const DialogRemove = ref(false); // Remove confirmation dialog
const DialogAdd = ref(false); // Add new item dialog
const DialogLoading = ref(false); // Loading state
const DialogAddManufacture = ref(false);
const DialogConfirm = ref(false);
const DialogUnconfirm = ref(false);
const DialogEditActual = ref(false);
// ===== MESSAGE DIALOG =====
// Message for success and error notifications
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// ===== FORM STATES =====
// Current item being processed
const GetID = ref("");
const GetIDManufacture = ref("");
const GetIDConfirm = ref("");
const GetConfirmQuantity = ref(0);
const GetConfirmItemName = ref("");
const GetActualDate = ref("");
const GetEditActualSchedule = ref(null);
// Ngày hôm nay YYYY-MM-DD (local)
const todayYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Edit form states
const PO_Edit = ref("");
const Product_Detail_Edit = ref(""); // Product details for editing
const Quantity_Product_Edit = ref(0); // Product quantity for editing
const Quantity_Delivered_Edit = ref(0); // Delivered quantity for editing
const Note_Edit = ref(""); // Note for editing
const DeliverySchedules_Edit = ref([]);

// Add form states
const PO_Add = ref("");
const Product_Detail_Add = ref(""); // Product details for adding new
const Quantity_Product_Add = ref(0); // Product quantity for adding new
const Quantity_Delivered_Add = ref(0); // Delivered quantity for adding new
const Note_Add = ref(""); // Note for adding new

// Khởi tạo các biến ref cho form thêm mới
const Name_Manufacture_Add = ref("");
const Name_Order_Manufacture = ref("");
const Date_Manufacture_Add = ref("");
const Note_Add_Manufacture = ref("");
const Total_Manufacture_Add = ref(0);
const Level_Manufacture_Add = ref(null);

// Quy trình tùy chỉnh (giống DialogAdd ở Page-Manufacture.vue)
const customProcess = ref("");
const customProcessList = ref([]);

// Customer and PO information
const CustomerID = ref(null); // Customer ID from localStorage
const NamePO = ref(null); // PO name from localStorage
const NameCustomer = ref(null); // Customer name from localStorage

// Table states
// const groupBy = [{ key: 'Product_Detail', order: 'asc',  title: "Chi tiết đơn hàng" }]
const Headers = ref([
  { key: "Product_Detail", title: "Chi tiết đơn hàng", width: "17%" },
  { key: "Status", title: "Trạng thái", width: "9%" },
  { key: "Quantity_Product", title: "SL đơn hàng", width: "8%" },
  { key: "Quantity_Delivered", title: "SL đã giao", width: "8%" },
  { key: "Quantity_Amount", title: "SL còn nợ", width: "8%" },
  { key: "Percent_Delivery", title: "Tỷ lệ giao", width: "10%" },
  { key: "Quantity_Manufacture", title: "SL thành phẩm", width: "8%" },
  { key: "Percent_Manufacture", title: "Tỷ lệ thành phẩm", width: "10%" },
  { key: "Note", title: "Ghi chú", width: "12%" },
  { key: "id", title: "Thao tác", width: "10%" },
]);
const search = ref("");
const itemsPerPage = ref(12);
const page = ref(1);
const requiredRule = (value) => !!value || "Không được để trống";
// Chỉ cho expand 1 dòng Lịch giao tại 1 thời điểm
const expanded = ref([]);
const toggleSingleExpand = (internalItem) => {
  const id = internalItem.raw?.id ?? internalItem.value;
  expanded.value = expanded.value[0] === id ? [] : [id];
};
// Đổi tìm kiếm thì thu gọn dòng đang mở
watch(search, () => {
  expanded.value = [];
});

// ===== USER INFORMATION =====
const LevelUser = localStorage.getItem("LevelUser");
const UserInfo = ref("");
const Date_Expired = ref("");
// ===== LIFECYCLE HOOKS =====
/**
 * Initializes component data from localStorage
 * Retrieves customer ID, PO name, and customer name
 */

onMounted(() => {
  const storedData = localStorage.getItem("CustomersID");
  const storeData = localStorage.getItem("PO");
  const storedsData = localStorage.getItem("Customers");
  CustomerID.value = storedData;
  NamePO.value = storeData;
  NameCustomer.value = storedsData;
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    UserInfo.value = decoded.Username;
    Date_Expired.value = new Date(decoded.exp * 1000);
  } else {
    console.log("Không tìm thấy token!");
    DialogFailed.value = true;
    route.push("/");
  }
});

// ===== COMPUTED =====
const Quantity_Amount_Edit = computed(() => {
  return Quantity_Product_Edit.value - Quantity_Delivered_Edit.value;
});

const Quantity_Amount_Add = computed(() => {
  return Quantity_Product_Add.value - Quantity_Delivered_Add.value;
});

const totalUniquePO = computed(() => {
  if (!detailProjectPO.value) return 0;
  const uniquePOIDs = new Set(detailProjectPO.value.map((item) => item.POID));
  return uniquePOIDs.size;
});

const pageSubtitle = computed(() => {
  const orders = detailProjectPO.value?.length || 0;
  return `${orders} đơn hàng · ${totalUniquePO.value} PO · ${NameCustomer.value || ""}`;
});

// Lịch giao hàng
const DeliverySchedules = ref([]);

// Methods
const AddDeliveryRow = () => {
  DeliverySchedules.value.push({
    delivery_date: "",
    delivery_quantity: null,
  });
};

const RemoveDeliveryRow = (index) => {
  DeliverySchedules.value.splice(index, 1);
};

const AddDeliveryRowEdit = () => {
  DeliverySchedules_Edit.value.push({
    DeliveryDate: "",
    DeliveryQuantity: null,
  });
};

// Helper: Convert Unix epoch (10 digits) to YYYY-MM-DD
const unixToDateString = (unixTimestamp) => {
  if (!unixTimestamp) return "";
  const date = new Date(unixTimestamp * 1000); // Convert to milliseconds
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: Convert YYYY-MM-DD to Unix epoch (10 digits)
const dateStringToUnix = (dateString) => {
  if (!dateString) return null;
  return Math.floor(new Date(dateString).getTime() / 1000);
};

// Parse DeliverySchedules từ JSON - dedupe + order theo thời gian giao
const getScheduleDeliveries = (item) => {
  if (!item?.DeliverySchedules || item.DeliverySchedules === "") return [];
  try {
    const raw = item.DeliverySchedules;
    // Backend trả chuỗi CSV dạng {"id":...},{"id":...} hoặc array JSON
    const parsed = Array.isArray(raw)
      ? raw
      : JSON.parse(
          String(raw).trim().startsWith("[") ? String(raw) : `[${raw}]`,
        );
    // Dedupe tận gốc theo id (phòng data cũ đã bị nhân bản do JOIN)
    const map = new Map();
    for (const s of parsed.flat(Infinity)) {
      if (s && s.id != null && !map.has(s.id)) {
        map.set(s.id, {
          ...s,
          DeliveryDate: s.DeliveryDate,
        });
      }
    }
    // Order theo thời gian giao tăng dần, null/empty xuống cuối
    return [...map.values()].sort((a, b) => {
      if (!a.DeliveryDate) return 1;
      if (!b.DeliveryDate) return -1;
      if (a.DeliveryDate < b.DeliveryDate) return -1;
      if (a.DeliveryDate > b.DeliveryDate) return 1;
      return (a.id ?? 0) - (b.id ?? 0);
    });
  } catch (e) {
    return [];
  }
};

const getOverdueCount = (item) => {
  const deliveries = getScheduleDeliveries(item);
  return deliveries.filter(
    (p) => p.DeliveryStatus === "Trễ hạn" && p.DeliveryCheck === "Chưa giao",
  ).length;
};

// YYYY-MM-DD -> DD/MM/YYYY, thiếu/rỗng -> "—"
const toSlash = (ymd) => {
  if (!ymd || typeof ymd !== "string") return "—";
  const parts = ymd.split("-");
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// Tổng SL đã hẹn trong các lịch giao của 1 đơn hàng
const scheduledTotal = (item) => {
  return getScheduleDeliveries(item).reduce(
    (sum, s) => sum + (Number(s.DeliveryQuantity) || 0),
    0,
  );
};

// Tỷ lệ giao = SL đã giao / SL đơn hàng (kẹp 0-100, đơn 0 -> 0%)
const deliveryPercent = (item) => {
  const ordered = Number(item?.Quantity_Product) || 0;
  const delivered = Number(item?.Quantity_Delivered) || 0;
  if (ordered <= 0) return 0;
  return Math.min(100, Math.max(0, (delivered * 100) / ordered));
};

// ===== CRUD OPERATIONS =====
/**
 * Prepares an item for editing by setting up the edit dialog
 * @param {Object} item - The item to edit containing product details and quantities
 */
function GetItem(item) {
  DialogEdit.value = true;
  GetID.value = item.id;
  PO_Edit.value = item.POID;
  Product_Detail_Edit.value = item.Product_Detail;
  Quantity_Product_Edit.value = item.Quantity_Product;
  Quantity_Delivered_Edit.value = item.Quantity_Delivered;
  Note_Edit.value = item.Note;
  // Deep-copy + đã dedupe/sort trong getScheduleDeliveries
  DeliverySchedules_Edit.value = JSON.parse(
    JSON.stringify(getScheduleDeliveries(item)),
  );
}

function GetItemManufacture(item) {
  DialogAddManufacture.value = true;
  NamePO.value = item.POID;
  Name_Manufacture_Add.value = item.PO;
  Name_Order_Manufacture.value = item.Product_Detail;
  Total_Manufacture_Add.value = item.Quantity_Product;
  GetIDManufacture.value = item.id;
}

const GetConfirm = (schedule, item) => {
  DialogConfirm.value = true;
  GetIDConfirm.value = schedule?.id ?? schedule;
  GetConfirmQuantity.value = Number(schedule?.DeliveryQuantity) || 0;
  GetConfirmItemName.value = item?.Product_Detail || "";
  GetActualDate.value = todayYMD();
};

const GetUnconfirm = (schedule, item) => {
  DialogUnconfirm.value = true;
  GetIDConfirm.value = schedule?.id ?? schedule;
  GetConfirmQuantity.value = Number(schedule?.DeliveryQuantity) || 0;
  GetConfirmItemName.value = item?.Product_Detail || "";
};

const GetEditActual = (schedule) => {
  DialogEditActual.value = true;
  GetIDConfirm.value = schedule?.id;
  GetConfirmQuantity.value = Number(schedule?.DeliveryQuantity) || 0;
  GetConfirmItemName.value = "";
  GetEditActualSchedule.value = schedule;
  GetActualDate.value = schedule?.ActualDeliveryDate || todayYMD();
};



/**
 * Saves edited item data
 * Makes an API call to update item information
 */
const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = reactive({
    Product_Detail: Product_Detail_Edit.value,
    Quantity_Product: Quantity_Product_Edit.value,
    Quantity_Delivered: Quantity_Delivered_Edit.value,
    Quantity_Amount: Quantity_Amount_Edit.value,
    Note: Note_Edit.value,
    POID: PO_Edit.value,
  });

  try {
    // Update main item data
    const response = await axios.put(
      `${Url}/Project/DetailProject/Edit-Item/${GetID.value}`,
      formData,
    );

    // Update delivery schedules
    for (const schedule of DeliverySchedules_Edit.value) {
      if (schedule.id) {
        // Update existing schedule
        await axios.put(
          `${Url}/Project/DetailProject/Edit-item-schedule-delivery/${schedule.id}`,
          {
            DeliveryDate: dateStringToUnix(schedule.DeliveryDate), // Convert to Unix epoch
            DeliveryQuantity: schedule.DeliveryQuantity,
          },
        );
      } else {
        // Add new schedule
        await axios.post(
          `${Url}/Project/DetailProject/Add-item-schedule-delivery`,
          {
            ItemId: GetID.value,
            DeliveryDate: dateStringToUnix(schedule.DeliveryDate), // Convert to Unix epoch
            DeliveryQuantity: schedule.DeliveryQuantity,
          },
        );
      }
    }

    MessageDialog.value = "Chỉnh sửa dữ liệu thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Chỉnh sửa dữ liệu thất bại";
    Error();
  }
};

/**
 * Saves new item data
 * Makes an API call to create a new item
 */
const SaveAdd = async () => {
  // Validate thông tin chính
  if (
    !PO_Add.value ||
    !Product_Detail_Add.value ||
    !Quantity_Product_Add.value
  ) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Vui lòng điền đầy đủ thông tin chính";
    return;
  }

  DialogLoading.value = true;

  try {
    // Lưu thông tin chính
    const mainData = {
      Product_Detail: Product_Detail_Add.value,
      Quantity_Product: Quantity_Product_Add.value,
      Quantity_Delivered: Quantity_Delivered_Add.value,
      Quantity_Amount: Quantity_Amount_Add.value,
      Note: Note_Add.value,
      POID: PO_Add.value,
      CustomerID: CustomerID.value,
    };

    const mainResponse = await axios.post(
      `${Url}/Project/DetailProject/Add-Item`,
      mainData,
    );

    // Lưu lịch giao hàng vào bảng ScheduleDelivery
    const itemId = mainResponse.data.id;

    for (const schedule of DeliverySchedules.value) {
      await axios.post(
        `${Url}/Project/DetailProject/Add-item-schedule-delivery`,
        {
          ItemId: itemId,
          DeliveryDate: dateStringToUnix(schedule.delivery_date),
          DeliveryQuantity: schedule.delivery_quantity,
        },
      );
    }

    DialogSuccess.value = true;
    MessageDialog.value = "Thêm dữ liệu thành công";
    Reset();
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Thêm dữ liệu thất bại";
    console.error(error);
  } finally {
    DialogLoading.value = false;
  }
};

const ConfirmItem = async () => {
  if (!GetActualDate.value) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Vui lòng chọn Ngày giao thực tế";
    return;
  }
  DialogLoading.value = true;
  try {
    const response = await axios.put(
      `${Url}/Project/DetailProject/Confirm-item/${GetIDConfirm.value}`,
      { ActualDate: GetActualDate.value },
    );
    MessageDialog.value =
      response.data?.message || "Xác nhận giao hàng thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value =
      error?.response?.data?.message || "Xác nhận giao hàng thất bại";
    Error();
  }
};

const SaveEditActual = async () => {
  if (!GetActualDate.value) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Vui lòng chọn Ngày giao thực tế";
    return;
  }
  DialogLoading.value = true;
  try {
    const s = GetEditActualSchedule.value || {};
    const response = await axios.put(
      `${Url}/Project/DetailProject/Edit-item-schedule-delivery/${GetIDConfirm.value}`,
      {
        DeliveryDate: dateStringToUnix(s.DeliveryDate),
        DeliveryQuantity: s.DeliveryQuantity,
        ActualDate: GetActualDate.value,
      },
    );
    MessageDialog.value =
      response.data?.message || "Cập nhật ngày thực giao thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value =
      error?.response?.data?.message || "Cập nhật ngày thực giao thất bại";
    Error();
  }
};

const UnconfirmItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.put(
      `${Url}/Project/DetailProject/Unconfirm-item/${GetIDConfirm.value}`,
    );
    MessageDialog.value =
      response.data?.message || "Hủy xác nhận giao hàng thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value =
      error?.response?.data?.message || "Hủy xác nhận giao hàng thất bại";
    Error();
  }
};

/**
 * Removes an item from the system
 * Makes an API call to delete the item
 */
const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Project/DetailProject/Delete-Item/${GetID.value}`,
    );
    MessageDialog.value = "Xoá dữ liệu thành công";
    Reset();
  } catch (error) {
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    Error();
  }
};

const RemoveDeliveryRowEdit = async (index, id) => {
  DeliverySchedules_Edit.value.splice(index, 1);
  // Dòng mới thêm chưa có id thì chỉ xóa ở client, không gọi API
  if (id == null) return;
  try {
    const response = await axios.delete(
      `${Url}/Project/DetailProject/Delete-item-schedule-delivery/${id}`,
    );
    DialogSuccess.value = true;
    MessageDialog.value = "Xoá dữ liệu thành công";
  } catch (error) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
  } finally {
    DialogLoading.value = false;
  }
};

// Hàm lưu thông tin thêm mới
const SaveAddManufacture = async () => {
  // Chặn lưu khi chưa chọn ngày -> tránh lưu NaN-NaN-NaN
  if (!Date_Manufacture_Add.value) {
    DialogFailed.value = true;
    MessageErrorDialog.value = "Vui lòng chọn Ngày tạo";
    return;
  }
  DialogLoading.value = true;
  // Giữ đúng thứ tự người dùng nhập, chỉ đảm bảo "Thành phẩm" luôn cuối
  const cleaned = (Array.isArray(customProcessList.value)
    ? customProcessList.value
    : []
  )
    .map((p) => String(p).trim())
    .filter((p) => p);
  let levels = cleaned.filter((p, i) => cleaned.indexOf(p) === i);
  levels = levels.filter((p) => p !== "Thành phẩm");
  levels.push("Thành phẩm");
  const formData = reactive({
    Name: NamePO.value,
    Name_Order: Name_Order_Manufacture.value,
    Timestamp: Date_Manufacture_Add.value,
    Total: Total_Manufacture_Add.value,
    Note: Note_Add_Manufacture.value,
    Creater: UserInfo.value,
    DelaySMT: 10000,
    Quantity: 1,
    Level: levels,
    ProjectID: GetIDManufacture.value,
  });
  try {
    const response = await axios.post(
      `${Url}/Manufacture/PlanManufacture/Add-item`,
      formData,
    );
    DialogLoading.value = false;
    DialogSuccess.value = true;
    DialogAddManufacture.value = false;
    MessageDialog.value = response.data.message;
  } catch (error) {
    DialogAddManufacture.value = false;
    DialogFailed.value = true;
    DialogLoading.value = false;
    MessageErrorDialog.value =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Thêm dữ liệu thất bại";
  }
};

// ===== FILE OPERATIONS =====
/**
 * Downloads order data as an Excel file
 * Makes an API call to get the file and triggers download
 */
const DownloadOrder = async () => {
  const NameExcel = `${NameCustomer.value}-${NamePO.value}`;

  try {
    const response = await fetch(
      `${Url}/Project/Customer/Orders/Download/${id}?filename=${encodeURIComponent(
        NameExcel,
      )}`,
    );
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${NameExcel}.xlsx`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    MessageDialog.value = "Tải file thành công";
  } catch (error) {
    console.error("Error downloading file:", error);
    MessageErrorDialog.value = "Tải file thất bại";
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
  DialogLoading.value = false;
  DialogConfirm.value = false;
  DialogUnconfirm.value = false;
  DialogEditActual.value = false;
  GetActualDate.value = "";
  GetEditActualSchedule.value = null;
  DialogAddManufacture.value = false;
  GetID.value = "";
  Product_Detail_Add.value = "";
  Quantity_Product_Add.value = "";
  Quantity_Delivered_Add.value = "";
  Quantity_Amount_Add.value = "";

  // Reset các trường thêm mới sản xuất
  Name_Manufacture_Add.value = "";
  Name_Order_Manufacture.value = "";
  Date_Manufacture_Add.value = "";
  Note_Add_Manufacture.value = "";
  Total_Manufacture_Add.value = 0;
  Level_Manufacture_Add.value = null;
  customProcess.value = "";
  customProcessList.value = [];
  DeliverySchedules.value = [];
}

/**
 * Handles error states
 * Shows error notification and resets loading state
 */
function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}

// ===== CUSTOM PROCESS HANDLERS (single source: customProcessList) =====
const addCustomProcess = () => {
  if (customProcess.value && customProcess.value.trim()) {
    const processName = customProcess.value.trim();
    if (!customProcessList.value.includes(processName)) {
      customProcessList.value.push(processName);
    }
    customProcess.value = "";
  }
};

const removeCustomProcess = (index) => {
  if (index >= 0 && index < customProcessList.value.length) {
    customProcessList.value.splice(index, 1);
  }
};

// Reset danh sách quy trình tùy chỉnh khi đóng dialog
watch(DialogAddManufacture, (newVal) => {
  if (!newVal) {
    customProcess.value = "";
    customProcessList.value = [];
    Level_Manufacture_Add.value = null;
  }
});
</script>
<script>
export default {
  components: {
    ButtonCancel,
    ButtonDownload,
    ButtonSave,
    InputSearch,
    InputField,
    SnackbarSuccess,
    ButtonBack,
    ButtonEdit,
    ButtonAgree,
    ButtonAdd,
    SnackbarFailed,
    Loading,
    InputTextarea,
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang=""></style>
