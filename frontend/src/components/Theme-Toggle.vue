<template>
  <v-tooltip :text="isDark ? 'Chế độ sáng' : 'Chế độ tối'" location="bottom">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        variant="text"
        :color="color"
        @click="toggle"
      ></v-btn>
    </template>
  </v-tooltip>
</template>

<script setup>
import { computed } from "vue";
import { useTheme } from "vuetify";

defineProps({
  color: { type: String, default: "default" },
});

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === "dark");

const toggle = () => {
  const next = isDark.value ? "light" : "dark";
  theme.global.name.value = next;
  try {
    localStorage.setItem("app-theme", next);
  } catch {
    /* bỏ qua */
  }
};

// Khôi phục theme đã chọn
try {
  const saved = localStorage.getItem("app-theme");
  if (saved === "dark" || saved === "light") {
    theme.global.name.value = saved;
  }
} catch {
  /* bỏ qua */
}
</script>
