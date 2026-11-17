<script setup>
// 根组件（A / 底座负责人维护）：登录页全屏，业务页带底部导航
import { useRoute } from 'vue-router'
import AppIcon from './components/AppIcon.vue'

const route = useRoute()
const tabs = [
  { name: 'home', text: '首页', icon: 'home' },
  { name: 'training', text: '训练', icon: 'dumbbell' },
  { name: 'mental', text: '关怀', icon: 'sun' },
  { name: 'message', text: '留言', icon: 'message' },
  { name: 'profile', text: '我的', icon: 'user' }
]
</script>

<template>
  <router-view />

  <!-- 底部导航：登录页不显示 -->
  <nav v-if="route.name !== 'login'" class="tab-bar">
    <router-link v-for="t in tabs" :key="t.name" :to="{ name: t.name }">
      <AppIcon class="tab-icon" :name="t.icon" :size="28" />
      <span>{{ t.text }}</span>
    </router-link>
  </nav>
</template>
