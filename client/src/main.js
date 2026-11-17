import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './styles/variables.css'
import './styles/global.css'

document.documentElement.dataset.font = store.fontSize

createApp(App).use(router).use(store).mount('#app')
