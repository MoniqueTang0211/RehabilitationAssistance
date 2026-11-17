<script setup>
// 根组件（A / 底座负责人维护）：登录页全屏，业务页带底部导航
import { useRoute } from 'vue-router'

const route = useRoute()
const tabs = [
  { name: 'home', text: '首页', icon: '🏠' },
  { name: 'training', text: '训练', icon: '💪' },
  { name: 'mental', text: '关怀', icon: '☀️' },
  { name: 'message', text: '留言', icon: '💬' },
  { name: 'profile', text: '我的', icon: '👤' }
]
</script>

<template>
  <router-view />

  <!-- 底部导航：登录页不显示 -->
  <nav v-if="route.name !== 'login'" class="tab-bar">
    <router-link v-for="t in tabs" :key="t.name" :to="{ name: t.name }">
      <span class="tab-icon">{{ t.icon }}</span>
      <span>{{ t.text }}</span>
    </router-link>
  </nav>
</template>
