<template>
  <v-menu :close-on-content-click="false" location="start" width="500">
    <template v-slot:activator="{ props }">
      <v-btn
        class="text-none"
        variant="text"
        size="large"
        :color="unreadCount > 0 ? 'error' : 'primary'"
        v-bind="props"
        v-tooltip="'Thông báo giao hàng'"
      >
        <v-badge v-if="unreadCount > 0" color="error" :content="unreadCount">
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
        <v-icon v-else>mdi-bell-outline</v-icon>
      </v-btn>
    </template>

    <v-card class="rounded-lg" max-width="min(500px, 92vw)">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-4 bg-gradient">
        <v-icon class="me-2" color="white">mdi-bell</v-icon>
        Thông báo giao hàng
      </v-card-title>

      <v-divider></v-divider>

      <!-- Content -->
      <v-card-text
        class="pa-0"
        style="height: min(500px, 70dvh); overflow-y: auto"
      >
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
              <v-list-item-title
                class="font-weight-bold text-high-emphasis notif-title"
                :title="notification.Title"
              >
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
              <v-list-item-subtitle
                class="text-wrap notif-message"
                :title="notification.Message"
              >
                {{ notification.Message }}
              </v-list-item-subtitle>
              <div
                v-if="timeLabel(notification)"
                class="text-caption text-medium-emphasis mt-1"
              >
                {{ timeLabel(notification) }}
              </div>
              <div
                class="text-caption font-weight-medium"
                :class="`text-${sxLine(notification).color}`"
              >
                {{ sxLine(notification).text }}
              </div>

              <!-- Status Badge -->
              <template v-slot:append>
                <div class="d-flex flex-column align-end ga-1">
                  <v-chip
                    size="small"
                    :color="notification.Color"
                    text-color="white"
                    label
                    class="text-high-emphasis"
                  >
                    {{ notification.Status }}
                  </v-chip>
                  <small class="text-high-emphasis opacity-60"
                    >SL: {{ notification.Quantity }} pcs</small
                  >
                </div>
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
        <v-btn
          variant="text"
          class="text-caption text-medium-emphasis"
          size="small"
          @click="refresh"
          :loading="loading"
        >
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
import { useNotification } from '@/composables/Project/useNotification';
import { sxLine } from '@/utils/deliveryStatus.js';

const {
  loading,
  unreadCount,
  sortedNotifications,
  markAsRead,
  markAllAsRead,
  refresh,
} = useNotification();

// Nhãn thời gian tương đối từ DaysRemaining (đồng bộ chữ với DetailPO)
const timeLabel = (n) => {
  const d = n?.DaysRemaining;
  if (d == null) return '';
  if (d < 0) return `Trễ ${-d} ngày`;
  if (d === 0) return 'Hôm nay';
  if (d === 1) return 'Ngày mai';
  return `Còn ${d} ngày`;
};
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
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.unread-notification:hover {
  background-color: rgba(var(--v-theme-primary), 0.15);
}

/* Title wrap tối đa 2 dòng, message kẹp 3 dòng (hover đọc full) */
.notif-title {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-message {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Màu mức độ theo theme (dark-safe) */
.text-error {
  color: rgb(var(--v-theme-error)) !important;
}

.text-warning {
  color: rgb(var(--v-theme-warning)) !important;
}

.text-orange {
  color: rgb(var(--v-theme-warning)) !important;
}
</style>
