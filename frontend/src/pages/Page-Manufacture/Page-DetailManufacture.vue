<template>
  <div class="manufacture-detail">
    <v-card variant="text" class="overflow-y-auto" height="100vh">
      <v-card-title class="text-h4 font-weight-light">
        <ButtonBack to="/san-xuat" />
        Theo dõi sản xuất</v-card-title
      >
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi mdi-tools"></v-icon> &nbsp;
        {{ NameManufacture }}
      </v-card-title>

      <v-card-text class="pa-6">
        <!-- Main Stats Overview -->
        <v-row class="mb-6">
          <v-col cols="12" md="3">
            <v-card class="h-100" rounded="lg">
              <v-card-text class="text-center">
                <v-icon icon="mdi-arrow-down-bold" color="primary" size="large" class="mb-2" />
                <div class="text-h6 text-primary mb-1">Đầu vào</div>
                <div class="text-h3 font-weight-bold text-primary">{{ totalInput }}</div>
                <div class="text-caption text-medium-emphasis">Tổng số lượng đầu vào</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="h-100" rounded="lg">
              <v-card-text class="text-center">
                <v-icon icon="mdi-arrow-up-bold" color="success" size="large" class="mb-2" />
                <div class="text-h6 text-success mb-1">Đầu ra</div>
                <div class="text-h3 font-weight-bold text-success">{{ totalWarehouse }}</div>
                <div class="text-caption text-medium-emphasis">Tổng số lượng đầu ra</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="h-100" rounded="lg">
              <v-card-text class="text-center">
                <v-icon icon="mdi-alert-circle" color="error" size="large" class="mb-2" />
                <div class="text-h6 text-error mb-1">Hàng lỗi</div>
                <div class="text-h3 font-weight-bold text-error">{{ totalError }}</div>
                <div class="text-caption text-medium-emphasis">Tổng số lượng hàng lỗi</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="h-100" rounded="lg">
              <v-card-text class="text-center">
                <v-icon icon="mdi-chart-line" color="info" size="large" class="mb-2" />
                <div class="text-h6 text-info mb-1">Tỷ lệ hoàn thành</div>
                <div class="text-h3 font-weight-bold text-info">{{ percent }}%</div>
                <v-progress-linear
                  :model-value="percent"
                  color="info"
                  height="8"
                  rounded
                  class="mt-2"
                ></v-progress-linear>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Process Cards Grid -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="4" v-if="Level_SMT">
            <v-card class="h-100" rounded="lg">
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
                SMT
                <v-spacer></v-spacer>
                <v-btn
                  icon="mdi-cog"
                  variant="text"
                  color="primary"
                  @click="DialogSettingSMT = true"
                ></v-btn>
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalInput }}</span> / 
                    <span class="text-success">{{ totalSMT }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalSMT / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalSMT / totalInput) * 100) }}%
                  </v-progress-circular>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Tổng số lượng SMT
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" v-if="Level_AOI">
            <v-card class="h-100" rounded="lg">
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
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
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
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
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
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
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
                IPQC (Hàn tay)
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
                  Tổng số lượng IPQC hàn tay
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="4" v-if="Level_Test_1">
            <v-card class="h-100" rounded="lg">
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
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
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
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

          <v-col cols="12" sm="6" md="4" v-if="Level_Test_2">
            <v-card class="h-100" rounded="lg">
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
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
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
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
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
                RW
              </v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div class="text-h4 font-weight-bold">
                    <span class="text-primary">{{ totalError }}</span> / 
                    <span class="text-success">{{ totalRW }}</span> / 
                    <span class="text-error">{{ totalRWError }}</span>
                  </div>
                  <v-progress-circular
                    :model-value="(totalRW / totalInput) * 100"
                    color="primary"
                    size="48"
                  >
                    {{ Math.round((totalRW / totalInput) * 100) }}%
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
              <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-2 text-primary rounded-t-lg">
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

                <ButtonAdd label="Thêm" class="mr-2" @click="DialogAdd = true" />
              </v-toolbar>
            </template>

            <template v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }">
              <tr>
                <td :colspan="columns.length">
                  <v-btn
                    variant="text"
                    :icon="isGroupOpen ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                    @click="toggleGroup(item)"
                    class="me-2"
                  ></v-btn>
                  <span class="font-weight-bold text-primary">{{ item.value }}</span>
                </td>
              </tr>
            </template>

            <template #[`item.id`]="{ item }">
              <div class="d-flex gap-2">
                <ButtonEye @click="PushItem(item)" />
                <ButtonEdit @click="GetItem(item)" />
              </div>
            </template>

            <template #[`item.Created_At`]="{ item }">
              {{ new Date(item.Created_At).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }) }}
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
      </v-card-text>
    </v-card>

    <!-- Dialog Add -->
    <v-dialog v-model="DialogAdd" width="500" scrollable>
      <v-card max-width="500" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-plus" color="primary" class="me-2"></v-icon>
          Thêm dữ liệu kế hoạch
        </v-card-title>
        <v-card-text>
          <InputField label="Số PO" v-model="PONumber_Add" />
          <InputSelect
            label="Công đoạn"
            :items="LevelSelectAdd"
            hint="Lựa chọn công đoạn phù hợp"
            v-model="Type_Add"
          />
          <InputField label="Hạng mục" v-model="Category_Add" />

          <v-row>
            <v-col cols="12" sm="4">
              <InputField
                label="Số lượng (pcs)"
                type="number"
                v-model="Quantity_Plan_Add"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <InputField
                label="Vòng lặp (giây)"
                type="number"
                v-model="CycleTime_Add"
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
          <InputTextarea label="Ghi chú" v-model="Note_Add" />
        </v-card-text>
        <v-card-actions>
          <ButtonCancel @cancel="DialogAdd = false" />
          <ButtonSave @save="SaveAdd()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Edit -->
    <v-dialog v-model="DialogEdit" width="500" scrollable>
      <v-card max-width="500" class="overflow-y-auto">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-pencil" color="primary" class="me-2"></v-icon>
          Sửa dữ liệu kế hoạch
        </v-card-title>
        <v-card-text>
          <InputSelect
            label="Quy trình"
            :items="LevelSelectAdd"
            hint="Lựa chọn quy trình phù hợp"
            v-model="Type_Edit"
            @update:model-value="(val) => (Type_Edit = val)"
          />
          <InputField label="Số PO" v-model="PONumber_Edit" />
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
        <v-card-text>Bạn có chắc chắn muốn xóa dự án này?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <ButtonCancel @cancel="DialogRemove = false" />
          <ButtonDelete @delete="RemoveItem()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Setting SMT -->
    <v-dialog v-model="DialogSettingSMT" max-width="400px">
      <v-card>
        <v-card-title class="d-flex align-center pa-4">
          <v-icon icon="mdi-cog" color="primary" class="me-2"></v-icon>
          Cài đặt dây chuyền SMT
        </v-card-title>
        <v-card-text>
          <InputField
            v-model="DelaySMT_Edit"
            label="Độ trễ SMT (ms)"
            type="number"
          />
          <InputField
            v-model="Quantity_Edit"
            label="Số lượng board"
            type="number"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <ButtonCancel @cancel="DialogSettingSMT = false" />
          <ButtonSave @save="SaveEditSettingSMT()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
    <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
    <Loading v-model="DialogLoading" />
  </div>
</template>

<script setup>
import { ref, watch, reactive, computed, nextTick, onMounted } from "vue";
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

// ... existing refs and constants ...
const Url = import.meta.env.VITE_API_URL;
const route = useRoute();
const router = useRouter();
const id = route.params.id;

const { manufactureDetails, connectionStatus } = useManufactureDetails(id);
const { manufacture, manufactureFound, manufactureError, isConnected } =
  useManufacture();
const { history, historyError, refresh } = useHistory(id);
// Dialog
const DialogSuccess = ref(false);
const DialogLoading = ref(false);
const DialogFailed = ref(false);
const DialogAdd = ref(false);
const DialogEdit = ref(false);
const DialogRemove = ref(false);
const DialogSettingSMT = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

// Production statistics
const NameManufacture = localStorage.getItem("ProductName");
const GetID = ref(null);

// Production statistics
const totalInput = ref(0);
const totalSMT = ref(0);
const totalAOI = ref(0);
const totalRW = ref(0);
const totalIPQC = ref(0);
const totalIPQCSMT = ref(0);
const totalAssembly = ref(0);
const totalOQC = ref(0);
const totalTest1 = ref(0);
const totalTest2 = ref(0);
const totalBoxBuild = ref(0);
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
const totalWarehouseError = ref(0);


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
const LevelSelectAdd = ref(null);

// Data
const DataManufacture = ref(null);
// ===== FORM ADD =====
const Type_Add = ref("");
const PONumber_Add = ref(localStorage.getItem("ProductName"));
const Category_Add = ref("");
const Quantity_Plan_Add = ref("");
const CycleTime_Add = ref("");
const Note_Add = ref("");

// ===== FORM EDIT =====
const Type_Edit = ref("");
const PONumber_Edit = ref("");
const Category_Edit = ref("");
const Quantity_Plan_Edit = ref("");
const CycleTime_Edit = ref("");
const Note_Edit = ref("");

// ===== FORM SETTING SMT =====
const DelaySMT_Edit = ref(50);
const Quantity_Edit = ref(1);

// Table
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);
const HeadersHistory = [
  { title: "Ngày", key: "Created_At", sortable: true },
  { title: "Tên đơn hàng", key: "PONumber", sortable: true },
  { title: "Tên danh mục", key: "Category", sortable: true },
  { title: "Đầu vào", key: "Quantity_Plan", sortable: true },
  { title: "Đầu ra", key: "Quantity_Real", sortable: true },
  { title: "Hàng lỗi", key: "Quantity_Error", sortable: true },
  { title: "Thao tác", key: "id", sortable: false },
];

// Watch for manufactureFound changes to update levels
watch(
  manufactureDetails,
  (newValue) => {
    console.log("manufactureDetails raw value:", newValue);
    if (newValue) {
      const data = Array.isArray(newValue) ? newValue[0] : newValue;

      if (data && data.Level) {
        DataManufacture.value = data.Level;

        Level_SMT.value = DataManufacture.value.includes("SMT");
        Level_AOI.value = DataManufacture.value.includes("AOI");
        Level_IPQC.value = DataManufacture.value.includes("IPQC (Hàn tay)");
        Level_Assembly.value = DataManufacture.value.includes("Assembly");
        Level_OQC.value = DataManufacture.value.includes("OQC");
        Level_IPQCSMT.value = DataManufacture.value.includes("IPQC (SMT)");
        Level_Test_1.value = DataManufacture.value.includes("Test 1");
        Level_Test_2.value = DataManufacture.value.includes("Test 2");
        Level_BoxBuild.value = DataManufacture.value.includes("Box Build");
      }
    }
  },
  { immediate: true, deep: true }
);

// Watch for manufactureDetails changes
watch(
  manufactureDetails,
  (newValue) => {
    console.log("Raw manufactureDetails:", newValue); // Debug raw data
    if (newValue && typeof newValue === "object") {
      // Check if newValue is an array and has items
      if (Array.isArray(newValue) && newValue.length > 0) {
        const data = newValue[0]; // Get first item if it's an array
        totalInput.value = data.Total || 0;
        totalError.value = data.Quantity_Error || 0;
        totalSMT.value = data.SMT || 0;
        totalAOI.value = data.AOI || 0;
        totalRW.value = data.RW || 0;
        totalIPQC.value = data.IPQC || 0;
        totalAssembly.value = data.Assembly || 0;
        totalOQC.value = data.OQC || 0;
        totalTest1.value = data.Test1 || 0;
        totalTest2.value = data.Test2 || 0;
        totalBoxBuild.value = data.BoxBuild || 0;
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
        totalWarehouseError.value = data.WarehouseError || 0;
        Quantity_Edit.value = data.Quantity;
        DelaySMT_Edit.value = data.DelaySMT;
        LevelSelectAdd.value = data.Level.split("-");
      
      } else {
        // If it's a single object
        totalInput.value = newValue.Total || 0;
        totalError.value = newValue.Quantity_Error || 0;
        totalSMT.value = newValue.SMT || 0;
        totalAOI.value = newValue.AOI || 0;
        totalRW.value = newValue.RW || 0;
        totalIPQC.value = newValue.IPQC || 0;
        totalAssembly.value = newValue.Assembly || 0;
        totalOQC.value = newValue.OQC || 0;
        totalTest1.value = newValue.Test1 || 0;
        totalTest2.value = newValue.Test2 || 0;
        totalBoxBuild.value = newValue.BoxBuild || 0;
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
        totalWarehouseError.value = newValue.WarehouseError || 0;
        Quantity_Edit.value = newValue.Quantity;
        DelaySMT_Edit.value = newValue.DelaySMT;

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
  });
});

// ====== COMPUTED ======
const formattedSelectedDate = computed(() => {
  const date = new Date();
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
  } else if (item.Type === "IPQC (Hàn tay)") {
    router.push(`/San-xuat/IPQC/${item.id}`);
  } else if (item.Type === "OQC") {
    router.push(`/San-xuat/OQC/${item.id}`);
  } else if (item.Type === "Test 1") {
    router.push(`/San-xuat/Test1/${item.id}`);
  } else if (item.Type === "Test 2") {
    router.push(`/San-xuat/Test2/${item.id}`);
  } else if (item.Type === "Box Build") {
    router.push(`/San-xuat/BoxBuild/${item.id}`);
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
  Category_Edit.value = item.Category;
  Quantity_Plan_Edit.value = item.Quantity_Plan;
  CycleTime_Edit.value = item.CycleTime_Plan;
  Time_Edit.value = item.Time_Plan;
  Note_Edit.value = item.Note;
  GetID.value = item.id;
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
  });
  try {
    const response = await axios.put(
      `${Url}/PlanManufacture/Edit-SMT/${id}`,
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
    Created_At: formattedSelectedDate.value,
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

function Reset() {
  DialogRemove.value = false;
  DialogSuccess.value = true;
  DialogEdit.value = false;
  DialogAdd.value = false;
  DialogLoading.value = false;
  DialogFailed.value = false;
  DialogRemove.value = false;
  DialogSettingSMT.value = false;
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

// Add watcher for history changes
watch(
  history,
  (newHistory) => {
    console.log("History data updated:", newHistory);
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
</style>

