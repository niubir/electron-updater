// theme
import './assets/main.css'

// vant
import Vant from 'vant'
import 'vant/lib/index.css'

// i18n
import i18n from './i18n'

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).use(Vant).use(i18n).mount('#app')
