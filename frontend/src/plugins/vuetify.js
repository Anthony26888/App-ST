/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VFileUpload } from 'vuetify/labs/VFileUpload'
import { VPie } from 'vuetify/labs/VPie'
// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    ...components,
    VFileUpload,
    VPie,
  },
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      // Gam NexusPortal: primary xanh, neutrals slate.
      // Cam-brand CHỈ dùng ở điểm thương hiệu (logo/login/license),
      // tách riêng vars CSS --app-brand-*, không vào theme.
      light: {
        colors: {
          primary: '#2563EB',
          'primary-darken-1': '#1D4ED8',
          secondary: '#5CBBF6',
          success: '#10B981',
          info: '#3B82F6',
          warning: '#F59E0B',
          error: '#EF4444',
          surface: '#FFFFFF',
          background: '#F8FAFC',
        },
      },
      dark: {
        colors: {
          primary: '#3B82F6',
          'primary-darken-1': '#2563EB',
          secondary: '#5CBBF6',
          success: '#34D399',
          info: '#60A5FA',
          warning: '#FBBF24',
          error: '#F87171',
          surface: '#1E293B',
          background: '#0F172A',
        },
      },
    },
  },
})
