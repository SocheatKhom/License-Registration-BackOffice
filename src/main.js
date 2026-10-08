import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './locales'
import { useAuthStore } from './stores/auth.store'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// Initialize session state
const authStore = useAuthStore()
authStore.initialize().finally(() => {
  app.mount('#app')
})
