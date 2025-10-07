<template>
  <Navigation />
  <v-main>
    <router-view />
  </v-main>

  <AppFooter />
</template>

<script setup>
import Navigation from "@/components/Navigation.vue";
</script>
