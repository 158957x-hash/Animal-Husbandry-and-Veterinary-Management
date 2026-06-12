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
  { role: 'regulator', title: '监管人员', subtitle: '检疫监管与诊疗监管统一入口', accent: '监管' },
  { role: 'clinic_admin', title: '诊疗机构管理员', subtitle: '机构备案、兽医备案、药品库存、年度报告', accent: '诊疗' },
  { role: 'practicing_vet', title: '执业兽医', subtitle: '宠物建档、免疫台账、处方笺', accent: '处方' },
  { role: 'pet_owner', title: '宠物主人', subtitle: '宠物档案、免疫台账和处方记录', accent: '宠物' },
]

async function enter(role: UserRole) {
  const session = await store.login(role)
  router.push(session.homePath)
}
</script>

<template>
  <main class="login-page">
    <section class="login-hero">
      <p class="eyebrow">产地检疫 · 运输监管 · 动物诊疗 · 宠物免疫 · 处方监管</p>
      <h1>畜牧兽医管理分系统</h1>
      <p class="hero-text">围绕动物检疫监管和动物诊疗管理两条业务线，支撑申报审核、出证监管、诊疗机构备案、宠物免疫、药品处方和废弃物处理闭环。</p>
      <div class="flow-strip">
        <span>检疫监管</span>
        <span>诊疗备案</span>
        <span>宠物建档</span>
        <span>免疫台账</span>
        <span>处方出库</span>
        <span>年度报告</span>
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
