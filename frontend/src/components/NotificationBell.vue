<template>
  <v-menu :close-on-content-click="false" location="start" width="500">
    <template v-slot:activator="{ props }">
      <v-btn class="text-none" variant="text" size="large" v-bind="props">
        <v-badge v-if="unreadCount > 0" color="error" :content="unreadCount">
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
        <v-icon v-else>mdi-bell-outline</v-icon>
      </v-btn>
    </template>

    <v-card class="rounded-lg" max-width="500">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-4 bg-gradient">
        <v-icon class="me-2" color="white">mdi-bell</v-icon>
        Thông báo giao hàng

      </v-card-title>

      <v-divider></v-divider>

      <!-- Content -->
      <v-card-text class="pa-0" style="height: 500px; overflow-y: auto">
        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-center align-center pa-6">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
        </div>

        <!-- Notifications List -->
        <v-list
          v-else-if="sortedNotifications.length > 0"
          lines="two"
          class="pa-0"
        >
          <template
            v-for="(notification, index) in sortedNotifications"
            :key="notification.id"
          >
            <v-list-item
              @click="markAsRead(notification.id)"
              class="cursor-pointer"
              :class="{ 'unread-notification': notification.IsRead === 0 }"
            >
              <!-- Avatar Icon -->
              <template v-slot:prepend>
                <v-avatar :color="notification.Color" size="40">
                  <v-icon :icon="notification.Icon" color="white"></v-icon>
                </v-avatar>
              </template>

              <!-- Title -->
              <v-list-item-title class="font-weight-bold">
                {{ notification.Title }}
                <v-chip
                  v-if="notification.IsRead === 0"
                  size="x-small"
                  color="primary"
                  class="ml-2"
                >
                  Mới
                </v-chip>
              </v-list-item-title>

              <!-- Message -->
              <v-list-item-subtitle class="text-wrap">
                {{ notification.Message }}
              </v-list-item-subtitle>

              <!-- Status Badge -->
              <template v-slot:append>
                <v-list-item-action class="flex-column align-end">
                  <v-chip
                  size="small"
                  :color="notification.Color"
                  text-color="white"
                  label
                  class="mb-4 text-high-emphasis"
                >
                  {{ notification.Status }}
                </v-chip>
                <v-spacer></v-spacer>
                <small class="mb-4 text-high-emphasis opacity-60">SL: {{ notification.Quantity }} pcs</small>
              </v-list-item-action>
              </template>
            </v-list-item>

            <v-divider
              v-if="index < sortedNotifications.length - 1"
            ></v-divider>
          </template>
        </v-list>

        <!-- Empty State -->
        <div
          v-else
          class="d-flex flex-column justify-center align-center pa-8 text-center"
        >
          <v-icon size="48" color="grey" class="mb-2">mdi-bell-off</v-icon>
          <p class="text-grey">Không có thông báo sắp tới</p>
        </div>
      </v-card-text>


      <v-divider></v-divider>

      <v-card-actions class="d-flex justify-space-between pa-3">
        <v-btn variant="text" class="text-caption text-medium-emphasis" size="small" @click="refresh" :loading="loading">
          <v-icon start>mdi-refresh</v-icon>
          Làm mới
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn 
          v-if="unreadCount > 0"
          variant="text" 
          size="small" 
          color="primary"
          class="text-caption text-medium-emphasis"
          @click="markAllAsRead"
        >
          <v-icon start>mdi-check-all</v-icon>
          Đọc tất cả
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup>

import { useNotification } from "@/composables/Project/useNotification";

const {
  notifications,
  statistics,
  loading,
  connected,
  unreadCount,
  sortedNotifications,
  markDelivery,
  markAsRead,
  markAllAsRead,
  refresh,
} = useNotification();
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

.cursor-pointer {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.unread-notification {
  background-color: rgba(103, 126, 234, 0.08);
}

.unread-notification:hover {
  background-color: rgba(103, 126, 234, 0.15);
}

.text-error {
  color: #ff5252 !important;
}

.text-warning {
  color: #ffa500 !important;
}

.text-orange {
  color: #ff9800 !important;
}
</style>

