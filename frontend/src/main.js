/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'

// Styles
import '@/assets/styles/v-data-table.css'

const app = createApp(App)

// Register plugins
registerPlugins(app)
app.use(createPinia())
app.use(vuetify)

app.mount('#app')
