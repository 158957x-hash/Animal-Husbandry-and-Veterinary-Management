<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import type { UserRole } from '../domain/models'

const router = useRouter()
const store = useAppStore()

const roles: Array<{ role: UserRole; title: string; subtitle: string; accent: string }> = [
  { role: 'farmer', title: '养殖场户', subtitle: '产地检疫申报与电子证明', accent: '申报' },
  { role: 'vet', title: '官方兽医', subtitle: '现场查验、无纸化出证、屠宰审核', accent: '审核' },
  { role: 'slaughter', title: '屠宰企业', subtitle: '入场核验与屠宰检疫申报', accent: '入场' },
  { role: 'regulator', title: '监管人员', subtitle: '调运轨迹与全链路监管看板', accent: '监管' },
]

async function enter(role: UserRole) {
  const session = await store.login(role)
  router.push(session.homePath)
}
</script>

<template>
  <main class="login-page">
    <section class="login-hero">
      <p class="eyebrow">产地检疫 · 运输监管 · 屠宰检疫 · 产品出证</p>
      <h1>畜牧兽医管理分系统演示 Demo</h1>
      <p class="hero-text">围绕动物从养殖场到屠宰场的检疫数据流转，模拟申报、审核、出证、运输、入场、产品检疫和监管预警闭环。</p>
      <div class="flow-strip">
        <span>产地申报</span>
        <span>官方出证</span>
        <span>车辆运输</span>
        <span>入场查验</span>
        <span>屠宰出证</span>
      </div>
    </section>
    <section class="role-grid">
      <article v-for="item in roles" :key="item.role" class="role-card" @click="enter(item.role)">
        <span class="role-accent">{{ item.accent }}</span>
        <h2>{{ item.title }}</h2>
        <p>{{ item.subtitle }}</p>
        <el-button type="success" round>进入{{ item.title }}端</el-button>
      </article>
    </section>
  </main>
</template>
