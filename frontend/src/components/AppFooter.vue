<template>
  <v-footer class="app-footer">
    <v-avatar size="22" rounded="md" class="me-2">
      <v-img src="@/assets/avatar-ST.jpg" alt="ERP ST"></v-img>
    </v-avatar>
    <span class="font-weight-bold">ERP ST</span>
    <span class="mx-2 text-medium-emphasis">·</span>
    <span class="text-medium-emphasis">SUPER TEC ERP © {{ year }}</span>
    <v-chip size="x-small" variant="tonal" color="primary" class="ms-2">
      v2.0
    </v-chip>
  </v-footer>
</template>

<script setup>
const year = new Date().getFullYear();
</script>

<style scoped>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 20px;
  padding-bottom: 20px;
  font-size: 0.8rem;
  background: transparent !important;
}
</style>
