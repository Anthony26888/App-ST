<template>
  <v-card-title class="page-header d-flex align-center flex-wrap ga-2 py-3">
    <ButtonBack v-if="backTo" :to="backTo" />
    <div class="min-width-0">
      
      <div class="app-page-title font-weight-light">{{ title }}</div>
      <v-breadcrumbs
        v-if="crumbs && crumbs.length"
        :items="crumbs"
        density="compact"
        class="pa-0 page-header-crumbs"
      >
        <template #prepend>
          <v-icon icon="mdi-home-outline" size="14" class="me-1"></v-icon>
        </template>
      </v-breadcrumbs>
    </div>
    <v-spacer />
    <slot name="actions" />
  </v-card-title>
</template>

<script setup>
import ButtonBack from "@/components/Button-Back.vue";

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  backTo: { type: String, default: "" },
  // [{ title: 'Dự án', to: '/Du-an' }, { title: 'Chi tiết' }]
  crumbs: { type: Array, default: () => [] },
});
</script>

<style scoped>
.min-width-0 {
  min-width: 0;
}
.page-header-crumbs {
  font-size: 0.75rem;
}
</style>
