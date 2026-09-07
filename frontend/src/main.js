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
import axios from 'axios'

// Styles
import '@/assets/styles/v-data-table.css'

axios.interceptors.request.use((config) => {
  const username = localStorage.getItem('Username')
  const sessionId = localStorage.getItem('SessionId')
  if (username) config.headers['X-Username'] = username
  if (sessionId) config.headers['X-Session-Token'] = sessionId
  return config
})

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'SESSION_REPLACED'
    ) {
      localStorage.removeItem('token')
      localStorage.removeItem('Username')
      localStorage.removeItem('SessionId')
      localStorage.removeItem('User')
      localStorage.removeItem('LevelUser')
      if (window.location.pathname !== '/') {
        localStorage.setItem('sessionKicked', '1')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  },
)

const app = createApp(App)

// Register plugins
registerPlugins(app)
app.use(createPinia())
app.use(vuetify)

app.mount('#app')
