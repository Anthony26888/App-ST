<template lang="">
  <!-- From Uiverse.io by Nawsome -->
  <v-dialog max-width="320" persistent>
    <v-list class="py-2" color="primary" elevation="12" rounded="lg">
      <v-list-item
        prepend-icon="$vuetify-outline"
        title="Đang tải dữ liệu..."
      >
        <template v-slot:prepend>
          <div class="pe-4">
            <v-icon color="primary" size="x-large"></v-icon>
          </div>
        </template>

        <template v-slot:append>
          <v-progress-circular
            color="primary"
            indeterminate="disable-shrink"
            size="16"
            width="2"
          ></v-progress-circular>
        </template>
      </v-list-item>
    </v-list>
  </v-dialog>
</template>
<script>
export default {};
</script>
<style scoped></style>
