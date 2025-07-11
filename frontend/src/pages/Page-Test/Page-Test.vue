<template>
  <v-container>
    <v-card>
      <v-card-title>Connection Test</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <h3>Environment Variables:</h3>
            <pre>{{ envVars }}</pre>
          </v-col>
          <v-col cols="12">
            <h3>API Status:</h3>
            <p>{{ apiStatus }}</p>
          </v-col>
          <v-col cols="12">
            <h3>Socket Status:</h3>
            <p>{{ socketStatus }}</p>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { useTestConnection } from '@/composables/test-connection.js';

const { apiStatus, socketStatus, envVars } = useTestConnection();
</script> 