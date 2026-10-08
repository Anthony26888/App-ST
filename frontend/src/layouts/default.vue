<template>
  <!-- 1 layout duy nhất: desktop rail-hover, mobile drawer phủ (không remount khi resize) -->
  <v-layout style="height: 100dvh">
    <Navigation :temporary="mdAndDown" v-model:open="drawer" />
    <Toolbar v-model:drawer="drawer" />
    <v-main>
      <router-view />
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref } from "vue";
import { useDisplay } from "vuetify";

const { mdAndDown } = useDisplay();
import Navigation from "@/components/Navigation.vue";
import Toolbar from "@/components/Toolbar.vue";

const drawer = ref(false);
</script>
