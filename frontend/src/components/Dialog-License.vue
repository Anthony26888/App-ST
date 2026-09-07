<template>
  <v-dialog
    v-model="dialog"
    :max-width="1000"
    scrollable
    persistent
    transition="dialog-bottom-transition"
  >
    <v-card class="rounded-xl overflow-hidden shadow-2xl">
      <!-- HEADER -->
      <v-card-title class="d-flex align-center pa-4 bg-gradient text-white">
        <v-avatar color="white" variant="tonal" size="40" class="me-3">
          <v-icon icon="mdi-shield-key-outline" color="white" size="24" />
        </v-avatar>
        <div>
          <div class="text-h6 font-weight-bold lh-1 text-white">
            Nâng Cấp Gói Dịch Vụ
          </div>
          <div class="text-caption text-white opacity-80">
            Chọn gói phù hợp để mở rộng giới hạn quản lý dự án PCB SMT
          </div>
        </div>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          density="comfortable"
          @click="dialog = false"
        />
      </v-card-title>

      <v-card-text class="pa-5 bg-slate-50">
        <v-row>
          <!-- ============ CỘT TRÁI: CHỌN GÓI ============ -->
          <v-col cols="12" md="5">
            <!-- TRẠNG THÁI HIỆN TẠI -->
            <v-card
              elevation="0"
              class="pa-4 rounded-xl border border-blue-grey-lighten-4 bg-white mb-4"
            >
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-medium text-grey-darken-1"
                  >Trạng thái hiện tại</span
                >
                <v-chip
                  :color="planColor[currentLicense] || 'primary'"
                  class="text-white font-weight-bold px-3"
                  size="small"
                  elevation="1"
                >
                  {{ currentLicense }}
                </v-chip>
              </div>

              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-body-2 text-grey-darken-2">
                  Đã sử dụng:
                  <b class="text-primary text-body-1">{{ projectCount }}</b> dự
                  án
                </div>
                <div class="text-body-2 text-grey-darken-2">
                  Còn lại:
                  <b class="text-success text-body-1">{{ remainingText }}</b>
                </div>
              </div>

              <v-progress-linear
                v-if="showProgress"
                :model-value="usedPercent"
                height="8"
                rounded
                color="primary"
                bg-color="grey-lighten-3"
                class="rounded-pill"
              />
            </v-card>

            <!-- DANH SÁCH GÓI -->
            <div class="d-flex align-center justify-space-between mb-3 px-1">
              <span class="text-subtitle-2 font-weight-bold text-grey-darken-3"
                >Danh sách gói dịch vụ</span
              >
              <span class="text-caption text-grey">Nhấp để xem chi tiết</span>
            </div>

            <div class="plan-list">
              <div
                v-for="plan in plans"
                :key="plan.name"
                class="plan-card mb-3 pa-3 rounded-xl border"
                :class="{ 'plan-selected': selectedIs(plan) }"
                @click="selectPlan(plan)"
              >
                <div class="d-flex align-center justify-space-between mb-1">
                  <div class="d-flex align-center">
                    <span class="text-subtitle-1 font-weight-bold me-2">{{
                      plan.name
                    }}</span>
                    <v-chip
                      v-if="plan.popular"
                      size="x-small"
                      color="amber-darken-2"
                      class="text-white font-weight-bold"
                    >
                      Phổ biến
                    </v-chip>
                  </div>
                  <v-icon
                    :icon="
                      selectedIs(plan)
                        ? 'mdi-check-circle'
                        : 'mdi-circle-outline'
                    "
                    :color="selectedIs(plan) ? plan.color : 'grey-lighten-1'"
                    size="22"
                  />
                </div>

                <div class="plan-price text-primary font-weight-bold mb-1">
                  {{ priceText(plan) }}
                </div>

                <div class="text-caption text-grey-darken-1 lh-sm">
                  Giới hạn <b>{{ plan.projects }}</b> dự án · {{ plan.desc }}
                </div>
              </div>
            </div>
          </v-col>

          <!-- ============ CỘT PHẢI: THANH TOÁN & KÍCH HOẠT ============ -->
          <v-col cols="12" md="7" class="d-flex flex-column">
            <!-- CHI TIẾT GÓI ĐÃ CHỌN: GÓI TRẢ PHÍ -->
            <v-card
              v-if="selectedPlan && selectedPlan.price > 0"
              elevation="0"
              class="rounded-xl border bg-white mb-4 overflow-hidden"
            >
              <div class="d-flex align-center pa-4 bg-grey-lighten-4 border-b">
                <v-avatar
                  :color="selectedPlan.color"
                  size="36"
                  class="me-3 text-white font-weight-bold shadow-sm"
                >
                  <v-icon icon="mdi-bank-transfer" size="20" />
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">
                    Thanh Toán Gói {{ selectedPlan.name }}
                  </div>
                  <div class="text-caption text-grey">
                    Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
                  </div>
                </div>
                <v-spacer />
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-close"
                  color="grey"
                  @click="selectedPlan = null"
                />
              </div>

              <v-card-text class="pa-4">
                <v-row density="compact" class="align-center">
                  <v-col cols="12" sm="7" class="pr-sm-2">
                    <div
                      class="pa-3 rounded-lg bg-blue-grey-lighten-5 border mb-3"
                    >
                      <div class="text-caption text-grey-darken-1">
                        Số tiền thanh toán
                      </div>
                      <div class="text-h5 font-weight-bold text-primary">
                        {{ formatPrice(selectedPlan.price) }}
                        <span class="text-subtitle-2 font-weight-bold"
                          >Đồng</span
                        >
                      </div>
                    </div>

                    <div class="bank-details text-body-2 mb-3">
                      <div class="d-flex justify-space-between py-1 border-b">
                        <span class="text-grey">Ngân hàng:</span>
                        <span class="font-weight-bold">{{ bankName }}</span>
                      </div>
                      <div class="d-flex justify-space-between py-1 border-b">
                        <span class="text-grey">Chủ tài khoản:</span>
                        <span class="font-weight-bold">{{ bankOwner }}</span>
                      </div>
                      <div
                        class="d-flex justify-space-between py-1 border-b align-center"
                      >
                        <span class="text-grey">Số tài khoản:</span>
                        <div class="d-flex align-center">
                          <span class="font-weight-bold me-1">{{
                            bankAccount
                          }}</span>
                          <v-btn
                            icon="mdi-content-copy"
                            size="x-small"
                            variant="text"
                            color="primary"
                            density="compact"
                            @click="
                              copyText(bankAccount, 'Đã copy Số tài khoản')
                            "
                          />
                        </div>
                      </div>
                      <div
                        class="d-flex justify-space-between py-1 align-center"
                      >
                        <span class="text-grey">Nội dung CK:</span>
                        <div class="d-flex align-center">
                          <v-chip
                            size="small"
                            color="primary"
                            class="font-weight-bold"
                          >
                            {{ transferContent }}
                          </v-chip>
                          <v-btn
                            icon="mdi-content-copy"
                            size="x-small"
                            variant="text"
                            color="primary"
                            density="compact"
                            @click="
                              copyText(
                                transferContent,
                                'Đã copy Nội dung chuyển khoản',
                              )
                            "
                          />
                        </div>
                      </div>
                    </div>

                    <div class="d-flex flex-wrap gap-2">
                      <v-btn
                        size="small"
                        variant="tonal"
                        color="primary"
                        class="text-caption font-weight-bold rounded-lg me-2 mb-1"
                        @click="copyTransfer()"
                      >
                        <v-icon start icon="mdi-content-copy" /> Copy Thông Tin
                      </v-btn>
                      <v-btn
                        size="small"
                        color="success"
                        class="text-caption font-weight-bold rounded-lg mb-1"
                        :loading="requesting"
                        :disabled="!!confirmInfo"
                        @click="confirmTransfer()"
                      >
                        <v-icon start icon="mdi-check-decagram" /> Xác Nhận Đã
                        CK
                      </v-btn>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="5" class="text-center pt-3 pt-sm-0">
                    <div
                      class="qr-container pa-2 rounded-xl border bg-white shadow-xs d-inline-block"
                    >
                      <v-img
                        :src="qrUrl"
                        width="170"
                        height="170"
                        contain
                        class="mx-auto rounded-lg"
                        @error="qrError = true"
                      >
                        <template v-slot:placeholder>
                          <div
                            class="d-flex align-center justify-center fill-height"
                          >
                            <v-progress-circular
                              indeterminate
                              color="primary"
                              size="24"
                            />
                          </div>
                        </template>
                      </v-img>
                    </div>
                    <div class="text-caption text-grey-darken-1 mt-2">
                      Quét mã QR qua App Ngân hàng
                    </div>
                  </v-col>
                </v-row>

                <!-- MÃ XÁC NHẬN ĐÃ TẠO -->
                <v-expand-transition>
                  <v-alert
                    v-if="confirmInfo"
                    type="success"
                    variant="tonal"
                    density="compact"
                    class="mt-3 rounded-xl border"
                  >
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-caption font-weight-bold"
                        >Mã xác nhận yêu cầu:</span
                      >
                      <div class="d-flex align-center">
                        <code
                          class="text-subtitle-1 font-weight-bold text-success px-2 py-1 bg-white rounded border"
                          >{{ confirmInfo.code }}</code
                        >
                        <v-btn
                          size="small"
                          variant="text"
                          color="success"
                          icon="mdi-content-copy"
                          class="ms-1"
                          @click="copyCode()"
                        />
                      </div>
                    </div>
                    <div class="text-caption text-grey-darken-2 mt-1">
                      Gói: <b>{{ confirmInfo.plan }}</b> ({{
                        confirmInfo.uses
                      }}
                      dự án) · User: <b>{{ confirmInfo.username }}</b>
                    </div>
                    <div class="text-caption text-grey-darken-1 mt-1">
                      Vui lòng gửi mã này cùng ảnh chuyển khoản qua
                      <b>Zalo {{ zaloContact }}</b> để nhận mã kích hoạt.
                    </div>
                  </v-alert>
                </v-expand-transition>
              </v-card-text>
            </v-card>

            <!-- GÓI MIỄN PHÍ/GÓI FREE -->
            <v-card
              v-else-if="selectedPlan && selectedPlan.price === 0"
              elevation="0"
              class="rounded-xl border bg-white pa-5 mb-4 text-center"
            >
              <v-avatar color="grey-lighten-3" size="56" class="mb-3">
                <v-icon
                  icon="mdi-gift-outline"
                  size="32"
                  color="grey-darken-2"
                />
              </v-avatar>
              <div class="text-h6 font-weight-bold mb-1">
                Gói {{ selectedPlan.name }}
              </div>
              <div class="text-body-2 text-grey-darken-1 mb-3">
                Gói mặc định miễn phí hỗ trợ tối đa
                {{ selectedPlan.projects }} dự án PCB. Nâng cấp lên gói trả phí
                để có thêm lượt sử dụng.
              </div>
              <v-btn
                color="primary"
                variant="tonal"
                rounded="lg"
                size="small"
                @click="selectedPlan = null"
              >
                Chọn gói khác
              </v-btn>
            </v-card>

            <!-- PLACEHOLDER KHI CHƯA CHỌN -->
            <v-card
              v-else
              elevation="0"
              class="rounded-xl border border-dashed pa-6 text-center mb-4 flex-grow-1 d-flex align-center justify-center bg-white"
            >
              <div>
                <v-avatar color="blue-lighten-5" size="56" class="mb-3">
                  <v-icon
                    icon="mdi-hand-pointing-left"
                    size="30"
                    color="primary"
                  />
                </v-avatar>
                <div class="text-subtitle-1 font-weight-bold mb-1">
                  Chọn gói nâng cấp
                </div>
                <p class="text-body-2 text-grey mb-0" style="max-width: 320px">
                  Vui lòng chọn một gói dịch vụ ở danh sách bên trái để tiến
                  hành thanh toán hoặc nhận hỗ trợ.
                </p>
              </div>
            </v-card>

            <!-- FORM KÍCH HOẠT MÃ LICENSE -->
            <v-card
              elevation="0"
              class="rounded-xl border bg-white pa-4 mt-auto"
            >
              <div class="d-flex align-center mb-2">
                <v-avatar color="primary" size="32" class="me-2 text-white">
                  <v-icon icon="mdi-key-star" size="18" />
                </v-avatar>
                <div>
                  <span class="text-subtitle-2 font-weight-bold"
                    >Nhập Mã Kích Hoạt (License Key)</span
                  >
                </div>
              </div>

              <div class="d-flex align-center gap-2">
                <v-text-field
                  v-model="licenseKey"
                  variant="outlined"
                  density="compact"
                  placeholder="Nhập mã kích hoạt (VD: LIC-10-A8B9C)"
                  hide-details
                  class="flex-grow-1 me-2 rounded-lg"
                  @keyup.enter="activate()"
                />
                <v-btn
                  color="primary"
                  class="font-weight-bold rounded-lg px-4"
                  height="40"
                  :loading="activating"
                  :disabled="!licenseKey.trim()"
                  @click="activate()"
                >
                  <v-icon start icon="mdi-lightning-bolt" /> Kích Hoạt
                </v-btn>
              </div>

              <div
                class="d-flex align-center justify-space-between mt-3 text-caption text-grey-darken-1"
              >
                <span>Chuyển khoản xong gửi mã xác nhận qua Zalo</span>
                <v-btn
                  variant="text"
                  color="primary"
                  size="x-small"
                  class="px-1 text-caption font-weight-bold"
                  @click="openZalo()"
                >
                  <v-icon start icon="mdi-message-text" size="14" /> Liên hệ
                  Zalo: {{ zaloContact }}
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Dialog kết quả kích hoạt: Thành công -->
  <v-dialog
    v-model="activateSuccessDialog"
    max-width="360"
    persistent
    transition="scale-transition"
  >
    <v-card class="rounded-xl text-center pa-6 shadow-2xl">
      <div class="icon-pulse-success mx-auto mb-3">
        <v-icon icon="mdi-check-circle" color="success" size="72" />
      </div>
      <div class="text-h6 font-weight-bold mb-1 text-success">
        Kích Hoạt Thành Công!
      </div>
      <div class="text-body-2 text-grey-darken-1 mb-5">
        {{ activateResultMsg }}
      </div>
      <v-btn
        color="success"
        block
        size="large"
        rounded="lg"
        class="font-weight-bold text-button"
        elevation="2"
        @click="
          activateSuccessDialog = false;
          dialog = false;
        "
      >
        Xác Nhận & Hoàn Tất
      </v-btn>
    </v-card>
  </v-dialog>

  <!-- Dialog kết quả kích hoạt: Thất bại -->
  <v-dialog
    v-model="activateErrorDialog"
    max-width="360"
    persistent
    transition="scale-transition"
  >
    <v-card class="rounded-xl text-center pa-6 shadow-2xl">
      <div class="icon-pulse-error mx-auto mb-3">
        <v-icon icon="mdi-close-circle" color="error" size="72" />
      </div>
      <div class="text-h6 font-weight-bold mb-1 text-error">
        Kích Hoạt Thất Bại
      </div>
      <div class="text-body-2 text-grey-darken-1 mb-5">
        {{ activateResultMsg }}
      </div>
      <v-btn
        color="error"
        block
        size="large"
        rounded="lg"
        class="font-weight-bold text-button"
        elevation="2"
        @click="activateErrorDialog = false"
      >
        Thử Lai
      </v-btn>
    </v-card>
  </v-dialog>

  <!-- Snackbar thông báo -->
  <SnackbarSuccess v-model="DialogSuccess" :message="MessageDialog" />
  <SnackbarFailed v-model="DialogFailed" :message="MessageErrorDialog" />
</template>

<script setup>
import { ref, computed, watch } from "vue";
import axios from "axios";

const Url = import.meta.env.VITE_API_URL;
const bankCode = import.meta.env.VITE_BANK_CODE || "VCB";
const bankAccount = import.meta.env.VITE_BANK_ACCOUNT || "";
const bankOwner = import.meta.env.VITE_BANK_OWNER || "";
const zaloContact = import.meta.env.VITE_ZALO_CONTACT || "";
const bankName = "Vietcombank";

const props = defineProps({
  modelValue: Boolean,
  username: String,
  currentLicense: { type: String, default: "Free" },
  remainingUses: { type: Number, default: 0 },
  projectCount: { type: Number, default: 0 },
});

const emit = defineEmits(["update:modelValue", "activated"]);

const dialog = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const plans = [
  {
    name: "Starter",
    price: 0,
    projects: 2,
    desc: "Dùng thử tính năng kiểm tra vị trí linh kiện.",
    color: "grey-darken-1",
    popular: false,
    action: "free",
  },
  {
    name: "Trial",
    price: 199000,
    projects: 1,
    desc: "Dành cho thử nghiệm.",
    color: "red-darken-1",
    popular: false,
    action: "pay",
  },
  {
    name: "Standard",
    price: 999000,
    projects: 10,
    desc: "Phù hợp cho kỹ sư SMT xử lý vài board mỗi tháng.",
    color: "primary",
    popular: false,
    action: "pay",
  },
  {
    name: "Business",
    price: 2499000,
    projects: 30,
    desc: "Dành cho đội kỹ sư SMT chuyên nghiệp xử lý dữ liệu lớn.",
    color: "amber-darken-2",
    popular: true,
    action: "pay",
  },
];

const planColor = {
  Free: "grey-darken-1",
  Starter: "grey-darken-1",
  "Cơ bản": "primary",
  Plus: "primary",
  "Chuyên nghiệp": "amber-darken-2",
  Pro: "amber-darken-2",
  "Doanh nghiệp": "red-darken-1",
  Enterprise: "red-darken-1",
};

const selectedPlan = ref(null);
const qrError = ref(false);
const licenseKey = ref("");
const activating = ref(false);
const requesting = ref(false);
const confirmInfo = ref(null);
const message = ref("");
const activateSuccessDialog = ref(false);
const activateErrorDialog = ref(false);
const activateResultMsg = ref("");

const DialogSuccess = ref(false);
const DialogFailed = ref(false);
const MessageDialog = ref("");
const MessageErrorDialog = ref("");

function showToast(text, isError = false) {
  if (isError) {
    MessageErrorDialog.value = text;
    DialogFailed.value = true;
  } else {
    MessageDialog.value = text;
    DialogSuccess.value = true;
  }
}

const selectedIs = (plan) => selectedPlan.value?.name === plan.name;

const isUnlimited = () =>
  props.currentLicense === "Enterprise" ||
  props.currentLicense === "Doanh nghiệp";

const remainingText = computed(() =>
  isUnlimited() ? "Không giới hạn" : `${props.remainingUses} dự án`,
);

const showProgress = computed(() => {
  if (isUnlimited()) return false;
  return props.projectCount > 0 || props.remainingUses > 0;
});

const usedPercent = computed(() => {
  if (isUnlimited()) return 0;
  const total = props.projectCount + props.remainingUses;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((props.projectCount / total) * 100));
});

const formatPrice = (n) => new Intl.NumberFormat("vi-VN").format(n);

const priceText = (plan) => {
  if (!plan.price) return "Miễn phí";
  return `${formatPrice(plan.price)}đ / ${plan.projects} dự án`;
};

const transferContent = computed(() => {
  if (!selectedPlan.value) return "";
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const planCode = selectedPlan.value.name.replace(/\s+/g, "").toUpperCase();
  return `LIC-${planCode}-${props.username || "USER"}-${mm}${yy}`;
});

const qrUrl = computed(() => {
  if (!selectedPlan.value || !bankAccount) return "";
  const amount = selectedPlan.value.price || 0;
  return `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(
    transferContent.value,
  )}&accountName=${encodeURIComponent(bankOwner)}`;
});

function selectPlan(plan) {
  confirmInfo.value = null;
  selectedPlan.value = plan;
  qrError.value = false;
  message.value = "";
}

function copyText(val, msg) {
  if (!val) return;
  navigator.clipboard?.writeText(val);
  showToast(msg || "Đã copy vào bộ nhớ tạm");
}

function copyTransfer() {
  if (!selectedPlan.value) return;
  const text =
    `Chuyển khoản ${formatPrice(
      selectedPlan.value.price,
    )}đ đến Ngân hàng ${bankName}, ` +
    `STK: ${bankAccount} (${bankOwner}), Nội dung: ${transferContent.value}`;
  navigator.clipboard?.writeText(text);
  showToast("Đã copy toàn bộ thông tin chuyển khoản.");
}

function openZalo() {
  if (zaloContact) {
    window.open(`https://zalo.me/${zaloContact}`, "_blank");
  } else {
    showToast("Chưa cấu hình SĐT Zalo liên hệ.", true);
  }
}

async function activate() {
  if (!props.username || !licenseKey.value.trim()) return;
  activating.value = true;
  message.value = "";
  try {
    const { data } = await axios.post(`${Url}/License/Activate`, {
      username: props.username,
      licenseKey: licenseKey.value.trim(),
    });
    activateResultMsg.value =
      data.message || "Gói dịch vụ đã được kích hoạt thành công!";
    selectedPlan.value = null;
    licenseKey.value = "";
    activateSuccessDialog.value = true;
    emit("activated", data);
  } catch (error) {
    activateResultMsg.value =
      error.response?.data?.error ||
      "Mã kích hoạt không hợp lệ hoặc đã được sử dụng.";
    activateErrorDialog.value = true;
  } finally {
    activating.value = false;
  }
}

async function confirmTransfer() {
  if (!props.username || !selectedPlan.value) return;
  requesting.value = true;
  message.value = "";
  try {
    const { data } = await axios.post(`${Url}/License/Request`, {
      username: props.username,
      plan: selectedPlan.value.name,
    });
    confirmInfo.value = data;
    showToast("Đã tạo mã xác nhận yêu cầu.");
  } catch (error) {
    showToast(error.response?.data?.error || "Tạo mã xác nhận thất bại", true);
  } finally {
    requesting.value = false;
  }
}

function copyCode() {
  if (confirmInfo.value?.code) {
    navigator.clipboard?.writeText(confirmInfo.value.code);
    showToast("Đã copy mã xác nhận.");
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      selectedPlan.value = null;
      message.value = "";
      licenseKey.value = "";
      confirmInfo.value = null;
    }
  },
);
</script>

<style scoped>
.bg-gradient {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)),
    rgb(var(--v-theme-secondary))
  );
  color: white;
}

.plan-list {
  max-height: 440px;
  overflow-y: auto;
  padding-right: 2px;
}

.plan-card {
  background-color: #ffffff;
  border-color: #e2e8f0 !important;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.plan-card:hover {
  border-color: #94a3b8 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.plan-card.plan-selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px !important;
  background-color: #f0f9ff;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.12);
}

.plan-price {
  font-size: 1.15rem;
  line-height: 1.2;
}

.qr-container {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.lh-1 {
  line-height: 1.1;
}

.lh-sm {
  line-height: 1.35;
}

.icon-pulse-success {
  animation: pulse-success 1.5s infinite;
}

.icon-pulse-error {
  animation: pulse-error 1.5s infinite;
}

@keyframes pulse-success {
  0% {
    transform: scale(0.95);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.85;
  }
}

@keyframes pulse-error {
  0% {
    transform: scale(0.95);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.85;
  }
}
</style>
