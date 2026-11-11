<template>
  <AppDataTable
    :headers="headers"
    :items="items"
    :search="search"
    :loading="loading"
    :items-per-page="itemsPerPage"
    density="compact"
  >
    <template #[`item.line_no`]="{ item }">
      <span class="text-caption">{{ item.line_no || '—' }}</span>
    </template>
    <template #[`item.mpn`]="{ item }">
      <span class="text-caption font-weight-medium">{{ item.mpn || '—' }}</span>
    </template>
    <template #[`item.image_url`]="{ item }">
      <v-img
        v-if="item.image_url || item.thumbnail_url"
        :src="componentImageUrl(item)"
        width="34"
        height="34"
        cover
        class="rounded border cursor-pointer mx-auto"
        @click="emit('image', item)"
      />
      <span v-else class="text-caption text-medium-emphasis">—</span>
    </template>
    <template #[`item.quantity`]="{ item }">
      {{ formatQty(item.quantity) }}
    </template>
    <template #[`item.purchase_qty`]="{ item }">
      <span class="font-weight-medium">{{ formatQty(item.purchase_qty) }}</span>
    </template>
    <template #[`item.unit_price`]="{ item }">
      {{ formatMoney(item.unit_price) }}
    </template>
    <template #[`item.digikey_unit_price_usd`]="{ item }">
      {{ formatUsd(item.digikey_unit_price_usd) }}
    </template>
    <template #[`item.digikey_extended_price_usd`]="{ item }">
      <span class="font-weight-medium">
        {{ formatUsd(item.digikey_extended_price_usd) }}
      </span>
    </template>
    <template #[`item.status`]="{ item }">
      <v-chip :color="statusColor(item.status)" variant="tonal" size="x-small">
        {{ statusLabel(item.status) }}
      </v-chip>
    </template>
    <template #[`item.availability`]="{ item }">
      {{ item.availability == null ? '—' : formatQty(item.availability) }}
    </template>
    <template #[`item.sources`]="{ item }">
      <span class="text-caption text-medium-emphasis">{{
        sourcesText(item)
      }}</span>
    </template>
    <template v-if="editable" #[`item.actions`]="{ item }">
      <v-btn
        icon="mdi-pencil-outline"
        size="xs"
        variant="text"
        color="primary"
        v-tooltip:top="'Sửa SL mua'"
        @click="emit('edit', item)"
      />
    </template>
    <template #no-data>
      <div class="app-empty-state text-center py-4">
        <v-icon size="44" color="medium-emphasis"
          >mdi-package-variant-closed</v-icon
        >
        <p class="text-body-2 text-medium-emphasis mt-2">
          Chưa có linh kiện trong dự án
        </p>
      </div>
    </template>
  </AppDataTable>
</template>

<script setup>
import { computed } from 'vue';
import AppDataTable from '@/components/App-DataTable.vue';
import {
  purchaseHeaders,
  formatUsd,
  formatMoney,
  formatQty,
  statusLabel,
  statusColor,
  componentImageUrl,
  sourcesText,
} from '@/utils/purchase.js';

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  search: { type: String, default: '' },
  itemsPerPage: { type: Number, default: 25 },
  editable: { type: Boolean, default: false },
});

const emit = defineEmits(['edit', 'image']);

const headers = computed(() =>
  props.editable
    ? [
        ...purchaseHeaders,
        {
          title: 'Thao tác',
          key: 'actions',
          width: '70px',
          sortable: false,
          align: 'center',
        },
      ]
    : purchaseHeaders
);
</script>
