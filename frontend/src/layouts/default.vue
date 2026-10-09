<template>
  <!-- Không dùng v-layout lồng (làm app-bar/drawer rớt thành absolute rồi trôi theo khi cuộn).
       div thường + v-main đăng ký thẳng vào layout gốc của v-app để ăn position:fixed. -->
  <div style="min-height: 100dvh">
    <Navigation :temporary="mdAndDown" v-model:open="drawer" />
    <Toolbar v-model:drawer="drawer" />
    <v-main>
      <router-view />
      <AppFooter />
    </v-main>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useDisplay } from "vuetify";

const { mdAndDown } = useDisplay();
import Navigation from "@/components/Navigation.vue";
import Toolbar from "@/components/Toolbar.vue";
import AppFooter from "@/components/AppFooter.vue";

const drawer = ref(false);
</script>
