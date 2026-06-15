<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
onMounted(() => {
  router.replace('/vet/slaughter-todos')
})
</script>

<template>
  <div style="padding:40px;text-align:center;color:#909399">正在跳转到屠宰检疫待办...</div>
</template>
