// vant
import Vant from 'vant'
import 'vant/lib/index.css'

// theme
import './assets/main.css'

// i18n
import i18n from './i18n'

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).use(Vant).use(i18n).mount('#app')

window.api.VerStyle().then(data=>{
  if (data.appBackgroundColor) document.documentElement.style.setProperty('--app-background', data.appBackgroundColor)
  if (data.headerBackgroundColor) document.documentElement.style.setProperty('--header-background', data.headerBackgroundColor)
  if (data.headerColor) document.documentElement.style.setProperty('--header-color', data.headerColor)
  if (data.mainColor) document.documentElement.style.setProperty('--main-color', data.mainColor)
  if (data.mainPrimaryColor) document.documentElement.style.setProperty('--main-primary-color', data.mainPrimaryColor)
  if (data.mainWhiteColor) document.documentElement.style.setProperty('--main-white-color', data.mainWhiteColor)
  if (data.mainWhite1Color) document.documentElement.style.setProperty('--main-white-1-color', data.mainWhite1Color)
}).catch(err=>{
  console.error("VerStyle failed:", err)
})
