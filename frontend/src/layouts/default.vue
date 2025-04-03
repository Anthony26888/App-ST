<template>
  <v-layout height="100vh">
    <Navigation/>
    <v-main>
      <router-view />
    </v-main>
  </v-layout>
</template>

<script setup>
import Navigation from "@/components/Navigation.vue";
</script>
