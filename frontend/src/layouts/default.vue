<template>
  <v-layout height="100vh" v-if="lgAndUp">
    <Navigation/>
    <v-main>
      <router-view />
    </v-main>
  </v-layout>
  <v-layout height="100vh" v-else>
    
    <v-main>
      <Toolbar title="ERP Management"/>
      <router-view />
    </v-main>
  </v-layout>
</template>

<script setup>
import { useDisplay } from 'vuetify'

const { mdAndDown, lgAndUp } = useDisplay()
import Navigation from "@/components/Navigation.vue";
import Toolbar from "@/components/Toolbar.vue";
</script>
