<template lang="">
  <v-card variant="text" class="overflow-y-auto" height="100vh">
    <v-card-title class="d-flex" v-if="lgAndUp">
      <ButtonBack to="/Bao-tri" />
      <p class="text-h4 font-weight-light ms-3">Chi tiết bảo trì</p>
    </v-card-title>
    <v-card-title class="d-flex" v-else>
      <ButtonBack to="/Bao-tri" />
      <v-icon icon="mdi mdi-tools" color="primary"></v-icon> &nbsp;
      {{ NameMachine }}
    </v-card-title>
    <v-card-text>
      <v-card variant="elevated" elevation="0" class="rounded-xl border">
        <v-card-title class="d-flex align-center pe-2" v-if="lgAndUp">
          <v-icon icon="mdi mdi-tools" color="primary"></v-icon> &nbsp;
          {{ NameMachine }}

          <ButtonAdd @add="DialogAdd = true" />
          <v-btn
            variant="tonal"
            color="orange"
            prepend-icon="mdi-calendar-check"
            class="ms-2 text-caption"
            @click="PushSchedule()"
            >Lịch bảo trì định kì</v-btn
          >
          <p class="ms-2 font-weight-thin text-subtitle-1">
            ( {{ maintenance.length }} bản ghi)
          </p>
          <v-spacer></v-spacer>
          <InputSearch v-model="search" />
        </v-card-title>
        <v-card-title class="d-flex align-center pe-2" v-else>
          <v-btn
            variant="tonal"
            color="orange"
            prepend-icon="mdi-calendar-check"
            class="ms-2 text-caption align-center"
            @click="PushSchedule()"
            >Lịch bảo trì</v-btn
          >
        </v-card-title>
        <v-data-table
          v-if="lgAndUp"
          density="comfortable"
          :search="search"
          :items="maintenance"
          :headers="Headers"
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
          height="79vh"
          show-expand
          item-value="MaBaoTri"
        >
          <template
            v-slot:item.data-table-expand="{
              internalItem,
              isExpanded,
              toggleExpand,
            }"
          >
          <v-badge
            v-if="getAccessories(internalItem.raw).length > 0"
            :content="getAccessories(internalItem.raw)[0].id === null ? 0 : getAccessories(internalItem.raw).length"
            :color="getAccessories(internalItem.raw)[0].id === null ? 'grey' : 'primary'"
            location="top left"
          >
            <v-btn
              v-if="getAccessories(internalItem.raw).length > 0"
              :append-icon="
                isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'
              "
              :text="isExpanded(internalItem) ? 'Thu gọn' : 'Phụ tùng'"
              class="text-none"
              color="medium-emphasis"
              size="small"
              variant="text"
              width="105"
              border
              slim
              @click="toggleExpand(internalItem)"
            ></v-btn>
          </v-badge>
          </template>

          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="py-4">
                <v-sheet rounded="lg" border class="pa-4">
                  <div class="mb-4">
                    <h4 class="text-subtitle1 font-weight-bold mb-3">
                      Danh sách phụ tùng thay thế
                    </h4>
                    <v-table
                      v-if="getAccessories(item).length > 0"
                      density="compact"
                    >
                      <thead>
                        <tr class="bg-grey-lighten-4">
                          <th class="text-left">Tên phụ tùng</th>
                          <th class="text-left">Số lượng</th>
                          <th class="text-left">Đơn vị</th>
                          <th class="text-left">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="s in getAccessories(item)" :key="s.id">
                          <td class="py-2">{{ s.TenPhuTung }}</td>
                          <td class="py-2">{{ s.SoLuongSuDung }}</td>
                          <td class="py-2">{{ s.DonVi }}</td>
                          <td class="py-2" style="white-space: pre-line">{{ s.GhiChu }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                    <div v-else class="text-center text-grey text-caption py-4">
                      Chưa có phụ tùng thay thế
                    </div>
                  </div>
                </v-sheet>
              </td>
            </tr>
          </template>
          <template v-slot:bottom>
            <div class="text-center pt-2">
              <v-pagination
                v-model="page"
                :length="Math.ceil(maintenance.length / itemsPerPage)"
              ></v-pagination>
            </div>
          </template>
          <template v-slot:item.TrangThai="{ item }">
            <div class="text-start">
              <v-chip
                v-if="item.TrangThai === 'Chờ phê duyệt'"
                color="red"
                text="Chờ phê duyệt"
                size="small"
              ></v-chip>
              <v-chip
                v-else-if="item.TrangThai === 'Đang thực hiện'"
                color="orange"
                text="Đang thực hiện"
                size="small"
              ></v-chip>
              <v-chip
                v-else-if="item.TrangThai === 'Đã hoàn thành'"
                color="green"
                text="Đã hoàn thành"
                size="small"
              ></v-chip>
            </div>
          </template>
          <template #item.MoTaLoi="{ item }">
            <div style="white-space: pre-line">{{ item.MoTaLoi }}</div>
          </template>
          <template #item.BienPhapKhacPhuc="{ item }">
            <div style="white-space: pre-line">{{ item.BienPhapKhacPhuc }}</div>
          </template>
          <template #item.MaBaoTri="{ item }">
            <div class="d-flex">
              <!-- <ButtonEye @detail="PushItem(item)" /> -->
              <ButtonEdit @edit="GetItem(item)" />
            </div>
          </template>
        </v-data-table>
        <v-data-table-virtual
          v-else
          :search="search"
          :items="maintenance"
          :headers="Headers"
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
          show-expand
          item-value="MaBaoTri"
        >
          <template
            v-slot:item.data-table-expand="{
              internalItem,
              isExpanded,
              toggleExpand,
            }"
          >
            <v-btn
              v-if="getAccessories(internalItem.raw).length > 0"
              :append-icon="
                isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'
              "
              :text="isExpanded(internalItem) ? 'Thu gọn' : 'Phụ tùng'"
              class="text-none"
              color="medium-emphasis"
              size="small"
              variant="text"
              width="105"
              border
              slim
              @click="toggleExpand(internalItem)"
            ></v-btn>
          </template>

          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="py-4">
                <v-sheet rounded="lg" border class="pa-4">
                  <div class="mb-4">
                    <h4 class="text-subtitle1 font-weight-bold mb-3">
                      Danh sách phụ tùng thay thế
                    </h4>
                    <v-table
                      v-if="getAccessories(item).length > 0"
                      density="compact"
                    >
                      <thead>
                        <tr class="bg-grey-lighten-4">
                          <th class="text-left">Tên phụ tùng</th>
                          <th class="text-left">Số lượng</th>
                          <th class="text-left">Đơn vị</th>
                          <th class="text-left">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="s in getAccessories(item)" :key="s.id">
                          <td class="py-2">{{ s.TenPhuTung }}</td>
                          <td class="py-2">{{ s.SoLuongSuDung }}</td>
                          <td class="py-2">{{ s.DonVi }}</td>
                          <td class="py-2" style="white-space: pre-line">{{ s.GhiChu }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                    <div v-else class="text-center text-grey text-caption py-4">
                      Chưa có phụ tùng thay thế
                    </div>
                  </div>
                </v-sheet>
              </td>
            </tr>
          </template>
          <template v-slot:item.TrangThai="{ item }">
            <div class="text-start">
              <v-chip
                v-if="item.TrangThai === 'Chờ phê duyệt'"
                color="red"
                text="Chờ phê duyệt"
                size="small"
              ></v-chip>
              <v-chip
                v-else-if="item.TrangThai === 'Đang thực hiện'"
                color="orange"
                text="Đang thực hiện"
                size="small"
              ></v-chip>
              <v-chip
                v-else-if="item.TrangThai === 'Đã hoàn thành'"
                color="green"
                text="Đã hoàn thành"
                size="small"
              ></v-chip>
            </div>
          </template>
          <template #item.MoTaLoi="{ item }">
            <div style="white-space: pre-line">{{ item.MoTaLoi }}</div>
          </template>
          <template #item.BienPhapKhacPhuc="{ item }">
            <div style="white-space: pre-line">{{ item.BienPhapKhacPhuc }}</div>
          </template>
          <template #item.MaBaoTri="{ item }">
            <div class="d-flex">
              <!-- <ButtonEye @detail="PushItem(item)" /> -->
              <ButtonEdit @edit="GetItem(item)" />
            </div>
          </template>
        </v-data-table-virtual>
      </v-card>
    </v-card-text>
  </v-card>

  <BaseDialog
    v-model="DialogEdit"
    icon="mdi-pencil"
    title="Cập nhật dữ liệu bảo trì"
    max-width="1200"
  >
    <v-row>
      <v-col cols="6">
        <InputSelect
          label="Loại bảo trì"
          v-model="LoaiBaoTri_Edit"
          hint="Ví dụ: Bảo trì định kỳ, Sửa chữa, Thay thế"
          :items="itemsType"
          item-text="text"
          item-value="value"
        />
        <v-row>
          <v-col cols="6">
            <InputSelect
              label="Phương án"
              v-model="PhuongAn_Edit"
              hint="Mô tả phương án bảo trì"
              :items="itemsPlan"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputSelect
              label="Phụ tùng"
              v-model="PhuTung_Edit"
              hint="Liệt kê các phụ tùng sử dụng"
              :items="itemsSparePart"
              item-text="text"
              item-value="value"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <InputSelect
              label="Trạng thái"
              v-model="TrangThai_Edit"
              hint="Ví dụ: Đã hoàn thành, Đang thực hiện, Chờ phê duyệt"
              :items="itemsStatus"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Chi phí"
              v-model="ChiPhi_Edit"
              type="number"
              hint="Đơn vị: VND"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <InputDate label="Ngày bảo trì" v-model="NgayBaoTri_Edit" />
          </v-col>
          <v-col cols="6">
            <InputDate label="Ngày hoàn thành" v-model="NgayHoanThanh_Edit" />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <InputField label="Người tạo" v-model="NguoiTao_Edit" />
          </v-col>
          <v-col cols="6">
            <InputField label="Người thực hiện" v-model="NguoiThucHien_Edit" />
          </v-col>
        </v-row>
        <InputTextarea
          label="Mô tả lỗi"
          v-model="MoTaLoi_Edit"
          hint="Mô tả chi tiết lỗi cần bảo trì"
        />
        <InputTextarea
          label="Biện pháp khắc phục"
          v-model="BienPhapKhacPhuc_Edit"
          hint="Mô tả cách thức khắc phục lỗi"
        />
      </v-col>
      <v-col cols="6">
        <div class="d-flex justify-space-between align-center mb-3">
          <h4 class="text-h6">Phụ tùng thay thế</h4>
          <v-btn
            color="primary"
            size="small"
            variant="tonal"
            prepend-icon="mdi-plus"
            class="text-caption text-medium-emphasis"
            @click="OpenAddAccessory('edit')"
          >
            Thêm phụ tùng
          </v-btn>
        </div>

        <v-table density="compact" border class="rounded-lg">
          <thead class="bg-grey-lighten-4">
            <tr>
              <th class="text-left font-weight-bold">Tên phụ tùng</th>
              <th class="text-left font-weight-bold" width="80">SL</th>
              <th class="text-left font-weight-bold" width="80">ĐV</th>
              <th class="text-left font-weight-bold">Ghi chú</th>
              <th class="text-center font-weight-bold" width="100">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in Accessory_Edit" :key="index">
              <td>{{ item.TenPhuTung }}</td>
              <td>{{ item.SoLuongSuDung }}</td>
              <td>{{ item.DonVi }}</td>
              <td style="white-space: pre-line">{{ item.GhiChu }}</td>
              <td class="text-center">
                <v-btn
                  icon="mdi-pencil"
                  size="x-small"
                  color="primary"
                  variant="text"
                  @click="OpenEditAccessory(item, index, 'edit')"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="RemoveAccessoryRowEdit(index, item.id)"
                ></v-btn>
              </td>
            </tr>
            <tr v-if="Accessory_Edit.length === 0">
              <td colspan="5" class="text-center text-grey text-caption py-4">Chưa có phụ tùng thay thế</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
    <template #actions>
      <ButtonDelete @delete="DialogRemove = true" />
      <v-spacer></v-spacer>
      <ButtonCancel @cancel="DialogEdit = false" />
      <ButtonSave @save="SaveEdit()" class="ms-2" />
    </template>
  </BaseDialog>

  <BaseDialog
    v-model="DialogAdd"
    icon="mdi-plus"
    title="Thêm dữ liệu bảo trì"
    max-width="1200"
  >
    <v-row>
      <v-col cols="6">
        <InputSelect
          label="Loại bảo trì"
          v-model="LoaiBaoTri_Add"
          hint="Ví dụ: Bảo trì định kỳ, Sửa chữa, Thay thế"
          :items="itemsType"
          item-text="text"
          item-value="value"
        />

        <v-row>
          <v-col cols="6">
            <InputSelect
              label="Phương án"
              v-model="PhuongAn_Add"
              hint="Tìm kiếm phương án"
              :items="itemsPlan"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputSelect
              label="Phụ tùng"
              v-model="PhuTung_Add"
              hint="Liệt kê các phụ tùng sử dụng"
              :items="itemsSparePart"
              item-text="text"
              item-value="value"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <InputSelect
              label="Trạng thái"
              v-model="TrangThai_Add"
              hint="Ví dụ: Đã hoàn thành, Đang thực hiện, Chờ phê duyệt"
              :items="itemsStatus"
              item-text="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="6">
            <InputField
              label="Chi phí"
              v-model="ChiPhi_Add"
              type="number"
              hint="Đơn vị: VND"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <InputDate label="Ngày bảo trì" v-model="NgayBaoTri_Add" />
          </v-col>
          <v-col cols="6">
            <InputDate label="Ngày hoàn thành" v-model="NgayHoanThanh_Add" />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <InputField label="Người tạo" v-model="NguoiTao_Add" />
          </v-col>
          <v-col cols="6">
            <InputField label="Người thực hiện" v-model="NguoiThucHien_Add" />
          </v-col>
        </v-row>
        <InputTextarea
          label="Mô tả lỗi"
          v-model="MoTaLoi_Add"
          hint="Mô tả chi tiết lỗi cần bảo trì"
        />
        <InputTextarea
          label="Biện pháp khắc phục"
          v-model="BienPhapKhacPhuc_Add"
          hint="Mô tả cách thức khắc phục lỗi"
        />
      </v-col>
      <v-col cols="6">
        <div class="d-flex justify-space-between align-center mb-3">
          <h4 class="text-h6">Phụ tùng thay thế</h4>
          <v-btn
            color="primary"
            size="small"
            variant="tonal"
            prepend-icon="mdi-plus"
            class="text-caption text-medium-emphasis"
            @click="OpenAddAccessory('add')"
          >
            Thêm phụ tùng
          </v-btn>
        </div>

        <v-table density="compact" border class="rounded-lg">
          <thead class="bg-grey-lighten-4">
            <tr>
              <th class="text-left font-weight-bold">Tên phụ tùng</th>
              <th class="text-left font-weight-bold" width="80">SL</th>
              <th class="text-left font-weight-bold" width="80">ĐV</th>
              <th class="text-left font-weight-bold">Ghi chú</th>
              <th class="text-center font-weight-bold" width="100">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in Accessory" :key="index">
              <td>{{ item.TenPhuTung }}</td>
              <td>{{ item.SoLuongSuDung }}</td>
              <td>{{ item.DonVi }}</td>
              <td class="text-wrap" style="white-space: pre-line">{{ item.GhiChu }}</td>
              <td class="text-center">
                <v-btn
                  icon="mdi-pencil"
                  size="x-small"
                  color="primary"
                  variant="text"
                  @click="OpenEditAccessory(item, index, 'add')"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="RemoveAccessoryRow(index)"
                ></v-btn>
              </td>
            </tr>
            <tr v-if="Accessory.length === 0">
              <td colspan="5" class="text-center text-grey text-caption py-4">Chưa có phụ tùng thay thế</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

    <template #actions>
      <ButtonCancel @cancel="DialogAdd = false" />
      <ButtonSave @save="SaveAdd()" class="ms-2" />
    </template>
  </BaseDialog>

  <BaseDialog
    v-model="DialogRemove"
    icon="mdi-delete"
    title="Xóa bảo trì"
    max-width="500"
  >
    <p>Bạn có chắc chắn muốn xóa bản ghi bảo trì này?</p>
    <template #actions>
      <ButtonCancel @cancel="DialogRemove = false" />
      <ButtonDelete @delete="RemoveItem()" />
    </template>
  </BaseDialog>

  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
  <Loading v-model="DialogLoading" />

  <!-- Sub-dialogs for Accessories -->
  <BaseDialog
    v-model="DialogAddAccessory"
    icon="mdi-plus"
    title="Thêm phụ tùng"
    max-width="600"
  >
    <v-row>
      <v-col cols="12">
        <InputField v-model="TempAccessory.TenPhuTung" label="Tên phụ tùng" />
      </v-col>
      <v-col cols="6">
        <InputField v-model.number="TempAccessory.SoLuongSuDung" type="number" label="Số lượng" />
      </v-col>
      <v-col cols="6">
        <InputField v-model="TempAccessory.DonVi" label="Đơn vị" />
      </v-col>
      <v-col cols="12">
        <InputTextarea v-model="TempAccessory.GhiChu" label="Ghi chú" />
      </v-col>
    </v-row>
    <template #actions>
      <ButtonCancel @cancel="DialogAddAccessory = false" />
      <ButtonSave @save="ConfirmAddAccessory()" class="ms-2" />
    </template>
  </BaseDialog>

  <BaseDialog
    v-model="DialogEditAccessory"
    icon="mdi-pencil"
    title="Cập nhật phụ tùng"
    max-width="600"
  >
    <v-row>
      <v-col cols="12">
        <InputField v-model="TempAccessory.TenPhuTung" label="Tên phụ tùng" />
      </v-col>
      <v-col cols="6">
        <InputField v-model.number="TempAccessory.SoLuongSuDung" type="number" label="Số lượng" />
      </v-col>
      <v-col cols="6">
        <InputField v-model="TempAccessory.DonVi" label="Đơn vị" />
      </v-col>
      <v-col cols="12">
        <InputTextarea v-model="TempAccessory.GhiChu" label="Ghi chú" />
      </v-col>
    </v-row>
    <template #actions>
      <ButtonCancel @cancel="DialogEditAccessory = false" />
      <ButtonSave @save="ConfirmEditAccessory()" class="ms-2" />
    </template>
  </BaseDialog>
</template>
<script setup>
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { ref, computed, reactive } from "vue";
import { useDisplay } from "vuetify";

import InputSearch from "@/components/Input-Search.vue";
import InputTextarea from "@/components/Input-Textarea.vue";
import InputField from "@/components/Input-Field.vue";
import InputSelect from "@/components/Input-Select.vue";
import ButtonAdd from "@/components/Button-Add.vue";
import ButtonDelete from "@/components/Button-Delete.vue";
import ButtonDownload from "@/components/Button-Download.vue";
import ButtonSave from "@/components/Button-Save.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";
import ButtonBack from "@/components/Button-Back.vue";
import ButtonEdit from "@/components/Button-Edit.vue";
import ButtonAgree from "@/components/Button-Agree.vue";
import ButtonEye from "@/components/Button-Eye.vue";
import SnackbarSuccess from "@/components/Snackbar-Success.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
import Loading from "@/components/Loading.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import InputDate from "@/components/Input-Date.vue";

import { useMaintenance } from "@/composables/Maintenance/useMaintenance";

const { mdAndDown, lgAndUp } = useDisplay();
const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const NameMachine = localStorage.getItem("MaintenanceID");

// Dialog states
const DialogEdit = ref(false);
const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const DialogRemove = ref(false);
const DialogAdd = ref(false);
const DialogAddAccessory = ref(false);
const DialogEditAccessory = ref(false);
const DialogLoading = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

const GetID = ref("");

// Edit form fields
const LoaiBaoTri_Edit = ref("");
const MoTaLoi_Edit = ref("");
const BienPhapKhacPhuc_Edit = ref("");
const PhuongAn_Edit = ref("");
const PhuTung_Edit = ref("");
const NguoiTao_Edit = ref("");
const NguoiThucHien_Edit = ref("");
const ChiPhi_Edit = ref("");
const NgayBaoTri_Edit = ref("");
const NgayHoanThanh_Edit = ref("");
const TrangThai_Edit = ref("");

// Add form fields
const LoaiBaoTri_Add = ref("");
const itemsType = ref(["Bảo trì định kỳ", "Sửa chữa", "Thay thế"]);
const itemsStatus = ref(["Đã hoàn thành", "Đang thực hiện", "Chờ phê duyệt"]);
const itemsPlan = ref(["Sửa chữa nội bộ", "Dịch vụ ngoài "]);
const itemsSparePart = ref(["Có", "Không"]);
const MoTaLoi_Add = ref("");
const BienPhapKhacPhuc_Add = ref("");
const PhuongAn_Add = ref("");
const PhuTung_Add = ref("");
const NguoiTao_Add = ref("");
const NguoiThucHien_Add = ref("");
const ChiPhi_Add = ref("");
const NgayBaoTri_Add = ref("");
const NgayHoanThanh_Add = ref("");
const TrangThai_Add = ref("");

// Table states
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);

// Data
const { maintenance, maintenanceError } = useMaintenance(route.params.id);

const Headers = [
  { title: "Loại bảo trì", key: "LoaiBaoTri" },
  { title: "Mô tả lỗi", key: "MoTaLoi" },
  { title: "Biện pháp khắc phục", key: "BienPhapKhacPhuc" },
  { title: "Phương án", key: "PhuongAn" },
  { title: "Phụ tùng", key: "PhuTung" },
  { title: "Người tạo", key: "NguoiTao" },
  { title: "Người thực hiện", key: "NguoiThucHien" },
  { title: "Chi phí", key: "ChiPhi" },
  { title: "Ngày bảo trì", key: "NgayBaoTriConvert" },
  { title: "Ngày hoàn thành", key: "NgayHoanThanhConvert" },
  { title: "Trạng thái", key: "TrangThai" },
  { title: "Thao tác", key: "MaBaoTri", sortable: false },
];

const getAccessories = (item) => {
  if (!item.Accessories || item.Accessories === "") return [];
  try {
    return JSON.parse(item.Accessories);
  } catch (e) {
    console.error("Error parsing accessories:", e);
    return [];
  }
};

// Lịch giao hàng (Phụ tùng)
const Accessory = ref([]);
const Accessory_Edit = ref([]);
const TempAccessory = ref({
  TenPhuTung: "",
  SoLuongSuDung: null,
  DonVi: "",
  GhiChu: ""
});
const EditIndex = ref(-1);
const AccessoryMode = ref("add"); // 'add' or 'edit' context for main maintenance dialog

// Methods
const OpenAddAccessory = (mode) => {
  AccessoryMode.value = mode;
  TempAccessory.value = {
    TenPhuTung: "",
    SoLuongSuDung: null,
    DonVi: "",
    GhiChu: ""
  };
  DialogAddAccessory.value = true;
};

const ConfirmAddAccessory = () => {
  if (AccessoryMode.value === "add") {
    Accessory.value.push({ ...TempAccessory.value });
  } else {
    Accessory_Edit.value.push({ ...TempAccessory.value });
  }
  DialogAddAccessory.value = false;
};

const OpenEditAccessory = (item, index, mode) => {
  AccessoryMode.value = mode;
  EditIndex.value = index;
  TempAccessory.value = { ...item };
  DialogEditAccessory.value = true;
};

const ConfirmEditAccessory = () => {
  if (AccessoryMode.value === "add") {
    Accessory.value[EditIndex.value] = { ...TempAccessory.value };
  } else {
    Accessory_Edit.value[EditIndex.value] = { ...TempAccessory.value };
  }
  DialogEditAccessory.value = false;
};

const RemoveAccessoryRow = (index) => {
  Accessory.value.splice(index, 1);
};

const RemoveAccessoryRowEdit = async (index, accessoryId) => {
  Accessory_Edit.value.splice(index, 1);
  if (accessoryId) {
    try {
      await axios.delete(`${Url}/SparePartUsage/Delete/${accessoryId}`);
    } catch (error) {
      console.error("Error deleting accessory:", error);
    }
  }
};

// ===== CRUD ======
function PushSchedule(item) {
  localStorage.setItem("MaintenanceID", id);
  router.push(`/Bao-tri/Lich-bao-tri/${route.params.id}`);
}

function PushItem(item) {
  localStorage.setItem("DetailMaintenanceID", item.MaBaoTri);
  router.push(`/Bao-tri/Chi-tiet-su-dung-phu-tung/${route.params.id}`);
}

function GetItem(item) {
  DialogEdit.value = true;
  GetID.value = item.MaBaoTri;
  LoaiBaoTri_Edit.value = item.LoaiBaoTri;
  MoTaLoi_Edit.value = item.MoTaLoi;
  BienPhapKhacPhuc_Edit.value = item.BienPhapKhacPhuc;
  PhuongAn_Edit.value = item.PhuongAn;
  PhuTung_Edit.value = item.PhuTung;
  NguoiTao_Edit.value = item.NguoiTao;
  NguoiThucHien_Edit.value = item.NguoiThucHien;
  ChiPhi_Edit.value = item.ChiPhi;
  // Backend returns strings "YYYY-MM-DD", no need for multiplier
  NgayBaoTri_Edit.value = item.NgayBaoTriUnixepoch;
  NgayHoanThanh_Edit.value = item.NgayHoanThanhUnixepoch;
  TrangThai_Edit.value = item.TrangThai;
  Accessory_Edit.value = getAccessories(item);
}

const SaveEdit = async () => {
  DialogLoading.value = true;
  const formData = {
    LoaiBaoTri: LoaiBaoTri_Edit.value,
    MoTaLoi: MoTaLoi_Edit.value,
    BienPhapKhacPhuc: BienPhapKhacPhuc_Edit.value,
    PhuongAn: PhuongAn_Edit.value,
    PhuTung: PhuTung_Edit.value,
    NguoiTao: NguoiTao_Edit.value,
    NguoiThucHien: NguoiThucHien_Edit.value,
    ChiPhi: parseFloat(ChiPhi_Edit.value) || 0,
    NgayBaoTri: NgayBaoTri_Edit.value,
    NgayHoanThanh: NgayHoanThanh_Edit.value,
    TrangThai: TrangThai_Edit.value,
    MaThietBi: route.params.id,
  };

  try {
    const response = await axios.put(`${Url}/Maintenance/Edit/${GetID.value}`, formData);
    
    // Cập nhật phụ tùng
    for (const acc of Accessory_Edit.value) {
      const payload = {
        MaBaoTri: GetID.value,
        MaThietBi: route.params.id,
        TenPhuTung: acc.TenPhuTung,
        SoLuongSuDung: parseInt(acc.SoLuongSuDung) || 0,
        DonVi: acc.DonVi,
        GhiChu: acc.GhiChu,
      };

      if (acc.MaSuDung || acc.id) {
        const idToUpdate = acc.MaSuDung || acc.id;
        await axios.put(`${Url}/SparePartUsage/Edit/${idToUpdate}`, payload);
      } else {
        await axios.post(`${Url}/SparePartUsage/Add`, payload);
      }
    }

    MessageDialog.value = response.data.message;
    DialogEdit.value = false;
    DialogSuccess.value = true;
  } catch (error) {
    console.error("Error in SaveEdit:", error);
    MessageErrorDialog.value = error.response?.data?.message || error.response?.data?.error || "Lỗi khi cập nhật dữ liệu";
    DialogFailed.value = true;
  } finally {
    DialogLoading.value = false;
  }
};

const SaveAdd = async () => {
  DialogLoading.value = true;
  const formData = {
    MaThietBi: route.params.id,
    NgayBaoTri: NgayBaoTri_Add.value,
    LoaiBaoTri: LoaiBaoTri_Add.value,
    MoTaLoi: MoTaLoi_Add.value,
    BienPhapKhacPhuc: BienPhapKhacPhuc_Add.value,
    NguoiTao: NguoiTao_Add.value,
    NguoiThucHien: NguoiThucHien_Add.value,
    ChiPhi: parseFloat(ChiPhi_Add.value) || 0,
    NgayHoanThanh: NgayHoanThanh_Add.value,
    TrangThai: TrangThai_Add.value,
    PhuongAn: PhuongAn_Add.value,
    PhuTung: PhuTung_Add.value,
  };

  try {
    const response = await axios.post(`${Url}/Maintenance/Add`, formData);
    const maintenanceId = response.data.id;

    // Lưu phụ tùng
    for (const acc of Accessory.value) {
      await axios.post(`${Url}/SparePartUsage/Add`, {
        MaBaoTri: maintenanceId,
        MaThietBi: route.params.id,
        TenPhuTung: acc.TenPhuTung,
        SoLuongSuDung: parseInt(acc.SoLuongSuDung) || 0,
        DonVi: acc.DonVi,
        GhiChu: acc.GhiChu,
      });
    }

    MessageDialog.value = response.data.message;
    DialogAdd.value = false;
    Reset();
    DialogSuccess.value = true;
  } catch (error) {
    console.error("Error in SaveAdd:", error);
    MessageErrorDialog.value = error.response?.data?.message || error.response?.data?.error || "Lỗi khi thêm dữ liệu";
    DialogFailed.value = true;
  } finally {
    DialogLoading.value = false;
  }
};

const RemoveItem = async () => {
  DialogLoading.value = true;
  try {
    const response = await axios.delete(
      `${Url}/Maintenance/Delete/${GetID.value}`
    );
    MessageDialog.value = "Xoá dữ liệu thành công";
    DialogRemove.value = false;
    DialogSuccess.value = true;
    DialogLoading.value = false;
    DialogEdit.value = false;
  } catch (error) {
    MessageErrorDialog.value = "Xoá dữ liệu thất bại";
    DialogFailed.value = true;
    DialogLoading.value = false;
    DialogRemove.value = false;
    DialogEdit.value = false;
  }
};

function Reset() {
  DialogRemove.value = false;
  DialogEdit.value = false;
  DialogAdd.value = false;
  DialogLoading.value = false;
  LoaiBaoTri_Add.value = "";
  MoTaLoi_Add.value = "";
  BienPhapKhacPhuc_Add.value = "";
  PhuongAn_Add.value = "";
  PhuTung_Add.value = "";
  NguoiTao_Add.value = "";
  NguoiThucHien_Add.value = "";
  ChiPhi_Add.value = "";
  NgayBaoTri_Add.value = "";
  NgayHoanThanh_Add.value = "";
  TrangThai_Add.value = "";
  Accessory.value = [];
  Accessory_Edit.value = [];
}

function Error() {
  DialogFailed.value = true;
  DialogLoading.value = false;
}
</script>
<script>
export default {
  components: {
    InputSearch,
    InputTextarea,
    InputField,
    ButtonAdd,
    ButtonDelete,
    ButtonDownload,
    ButtonSave,
    ButtonCancel,
    ButtonBack,
    ButtonEdit,
    ButtonAgree,
    ButtonEye,
    SnackbarSuccess,
    SnackbarFailed,
    Loading,
    InputSelect,
  },
};
</script>
