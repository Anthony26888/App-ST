<template>
  <BaseDialog
    v-model="dialog"
    width="900"
    :fullscreen="$vuetify.display.mdAndDown"
    title="Thông số kỹ thuật"
    icon="mdi-information-variant-circle"
  >
    <div v-if="loading" class="py-10 text-center">
      <v-progress-circular indeterminate color="primary" />
      <div class="text-caption text-medium-emphasis mt-3">Đang tra DigiKey...</div>
    </div>

    <v-alert v-else-if="error" type="warning" variant="tonal">
      {{ error }}
    </v-alert>

    <v-row v-else-if="product">
      <v-col cols="12" md="5">
        <v-img
          v-if="product.PhotoUrl"
          :src="product.PhotoUrl"
          max-height="320"
          contain
          class="bg-grey-lighten-4 rounded"
        />
        <div
          v-else
          class="bg-grey-lighten-4 rounded d-flex align-center justify-center"
          style="height: 220px"
        >
          <v-icon size="64" color="grey">mdi-image-off-outline</v-icon>
        </div>

        <v-card v-if="pricedVariations.length" variant="outlined" class="mt-3">
          <v-card-title class="text-subtitle-2 d-flex align-center ga-2 py-2">
            <v-icon size="18" color="primary">mdi-tag-outline</v-icon>
            Giá tham khảo (USD)
          </v-card-title>
          <v-card-text class="pt-0">
            <v-select
              v-if="pricedVariations.length > 1"
              v-model="selectedVariationIndex"
              :items="variationItems"
              item-title="title"
              item-value="value"
              label="Quy cách"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-2"
            />
            <v-table
              v-if="selectedVariation?.StandardPricing?.length"
              density="compact"
              class="text-caption"
            >
              <thead>
                <tr>
                  <th class="text-left">SL</th>
                  <th class="text-right">Đơn giá</th>
                  <th class="text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="tier in selectedVariation.StandardPricing"
                  :key="tier.BreakQuantity"
                >
                  <td>{{ formatQty(tier.BreakQuantity) }}+</td>
                  <td class="text-right">{{ formatUsd(tier.UnitPrice) }}</td>
                  <td class="text-right">{{ formatUsd(tier.TotalPrice) }}</td>
                </tr>
              </tbody>
            </v-table>
            <div
              v-if="stockText"
              class="text-caption text-medium-emphasis mt-2"
            >
              {{ stockText }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1 font-italic">
              Giá tham khảo từ DigiKey, không dùng để tính báo giá.
            </div>
          </v-card-text>
        </v-card>

        <v-card v-else variant="outlined" class="mt-3">
          <v-card-text class="text-caption text-medium-emphasis">
            Không có giá tham khảo cho MPN này.
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="7">
        <div class="text-h6 font-weight-bold">
          {{ product.ManufacturerProductNumber || mpn }}
        </div>
        <div class="text-caption text-medium-emphasis mb-3">
          {{ product.Manufacturer?.Name || "—" }}
        </div>
        <v-btn
          v-if="product.DatasheetUrl"
          size="small"
          prepend-icon="mdi-database-arrow-right"
          :href="product.DatasheetUrl"
          target="_blank"
          color="primary"
          variant="tonal"
          class="text-caption"
        >
          Datasheet
        </v-btn>
        <v-table v-if="product.Parameters?.length" density="compact" class="text-caption mt-3">
          <tbody>
            <tr v-for="item in product.Parameters" :key="item.ParameterText">
              <td class="font-weight-medium">{{ item.ParameterText }}</td>
              <td>{{ item.ValueText }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

    <template #actions>
      <ButtonCancel @cancel="dialog = false" />
    </template>
  </BaseDialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import axios from "axios";
import BaseDialog from "@/components/BaseDialog.vue";
import ButtonCancel from "@/components/Button-Cancel.vue";

const Url = import.meta.env.VITE_API_URL;
const props = defineProps({
  modelValue: Boolean,
  mpn: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const loading = ref(false);
const error = ref("");
const product = ref(null);
const selectedVariationIndex = ref(0);

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});
const qtyFormatter = new Intl.NumberFormat("en-US");

const formatUsd = (value) =>
  value == null || Number.isNaN(Number(value))
    ? "—"
    : usdFormatter.format(Number(value));

const formatQty = (value) =>
  value == null || value === "" ? "—" : qtyFormatter.format(Number(value));

const pricedVariations = computed(() =>
  (product.value?.ProductVariations || []).filter(
    (variation) =>
      Array.isArray(variation.StandardPricing) &&
      variation.StandardPricing.length,
  ),
);

const variationItems = computed(() =>
  pricedVariations.value.map((variation, index) => ({
    title:
      [
        variation.PackageType?.Name,
        variation.DigiKeyProductNumber,
      ]
        .filter(Boolean)
        .join(" · ") || `Quy cách ${index + 1}`,
    value: index,
  })),
);

const selectedVariation = computed(
  () => pricedVariations.value[selectedVariationIndex.value] || null,
);

const stockText = computed(() => {
  const variation = selectedVariation.value;
  if (!variation) return "";
  const parts = [];
  if (variation.QuantityAvailableforPackageType != null) {
    parts.push(`Còn: ${formatQty(variation.QuantityAvailableforPackageType)}`);
  }
  if (variation.MinimumOrderQuantity != null) {
    parts.push(`MOQ: ${formatQty(variation.MinimumOrderQuantity)}`);
  }
  if (variation.StandardPackage != null) {
    parts.push(`Đóng gói: ${formatQty(variation.StandardPackage)}`);
  }
  return parts.join(" · ");
});

async function fetchProduct(mpn) {
  product.value = null;
  error.value = "";
  selectedVariationIndex.value = 0;
  if (!mpn) {
    error.value = "Dòng này chưa có MPN để tra cứu.";
    return;
  }
  loading.value = true;
  try {
    const { data } = await axios.get(
      `${Url}/DigiKey/search/${encodeURIComponent(mpn)}/productdetails`,
    );
    if (data?.Product) {
      product.value = data.Product;
      selectedVariationIndex.value = 0;
    } else {
      error.value = `Không tìm thấy sản phẩm "${mpn}" trên DigiKey.`;
    }
  } catch (err) {
    error.value =
      err.response?.data?.error ||
      `Không tìm thấy sản phẩm "${mpn}" trên DigiKey.`;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.modelValue, props.mpn],
  ([open, mpn]) => {
    if (open) fetchProduct(String(mpn || "").trim());
  },
);
</script>
