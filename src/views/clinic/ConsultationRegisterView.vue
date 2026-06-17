<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ArrowLeft } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import type { ConsultationInput, ConsultationRecord } from '../../domain/models'

const store = useAppStore()
const router = useRouter()

const petSearch = ref('')
const hasSearched = ref(false)
const selectedPetId = ref('')
const petOwner = computed(() => {
  if (!selectedPetId.value) return null
  const pet = store.data.petProfiles.find((p) => p.id === selectedPetId.value)
  if (!pet) return null
  return { pet, owner: store.data.petOwners.find((o) => o.id === pet.ownerId) }
})

const filteredPets = computed(() => {
  if (!hasSearched.value) return []
  const kw = petSearch.value.toLowerCase()
  return store.data.petProfiles.filter((p) =>
    p.active && (p.identityNo.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw) || p.breed.toLowerCase().includes(kw))
  )
})

const historyConsultations = ref<ConsultationRecord[]>([])
const historyLoading = ref(false)

async function selectPet(petId: string) {
  selectedPetId.value = petId
  const selectedPet = store.data.petProfiles.find((p) => p.id === petId)
  if (selectedPet) {
    form.value.weight = selectedPet.weight
  }
  historyLoading.value = true
  try {
    historyConsultations.value = await store.getPetHistoryConsultations(petId)
  } finally {
    historyLoading.value = false
  }
}

function goCreatePet() {
  router.push('/clinic/veterinarian/pets')
}

function onSearch() {
  hasSearched.value = true
}

const form = ref<ConsultationInput & { weight: number }>({
  petId: '',
  chiefComplaint: '',
  initialSymptoms: '',
  weight: 0,
})

const submitting = ref(false)

async function submit() {
  if (!selectedPetId.value) return ElMessage.warning('请先选择宠物档案')
  if (!form.value.chiefComplaint) return ElMessage.warning('请填写主诉')
  if (!form.value.initialSymptoms) return ElMessage.warning('请填写初步症状')

  form.value.petId = selectedPetId.value
  submitting.value = true
  try {
    await store.createConsultation(form.value)
    ElMessage.success('接诊登记成功')
    router.push('/clinic/veterinarian/consultations')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/clinic/veterinarian/consultations')
}
</script>

<template>
  <div class="register-page">
    <div class="page-header-card">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft" link>返回</el-button>
        <h2>接诊登记</h2>
      </div>
    </div>

    <!-- Step 1: Select Pet -->
    <div class="card">
      <div class="card-title">选择宠物档案</div>
      <div class="search-row">
        <el-input v-model="petSearch" placeholder="输入宠物编号/名称/品种搜索" clearable class="search-input" @keyup.enter="onSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="onSearch"><el-icon><Search /></el-icon>搜索</el-button>
        <el-button type="default" @click="goCreatePet">快速建档</el-button>
      </div>
      <p v-if="!hasSearched" class="search-hint">请输入宠物编号/名称/品种后点击搜索</p>
      <el-table v-if="hasSearched && filteredPets.length" :data="filteredPets" stripe highlight-current-row style="width: 100%" max-height="240" @row-click="(row: any) => selectPet(row.id)">
        <el-table-column prop="identityNo" label="宠物编号" width="160" />
        <el-table-column prop="name" label="宠物名称" width="100" />
        <el-table-column prop="species" label="种类" width="60" />
        <el-table-column prop="breed" label="品种" width="120" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="age" label="年龄" width="60">
          <template #default="{ row }">{{ row.age }}岁</template>
        </el-table-column>
        <el-table-column prop="weight" label="体重" width="80">
          <template #default="{ row }">{{ row.weight }}kg</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" :type="selectedPetId === row.id ? 'primary' : 'default'" link @click.stop="selectPet(row.id)">
              {{ selectedPetId === row.id ? '已选择' : '选择' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="hasSearched && !filteredPets.length" class="empty-hint">未找到宠物档案，请先<a href="javascript:;" @click="goCreatePet">建档</a></div>
    </div>

    <!-- Step 2: Pet Info Panel -->
    <div v-if="petOwner" class="card">
      <div class="card-title">宠物信息</div>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="宠物名称">{{ petOwner.pet.name }}</el-descriptions-item>
        <el-descriptions-item label="主人">{{ petOwner.owner.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ petOwner.owner.phone }}</el-descriptions-item>
        <el-descriptions-item label="动物种类">{{ petOwner.pet.species }}</el-descriptions-item>
        <el-descriptions-item label="品种">{{ petOwner.pet.breed }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ petOwner.pet.gender }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ petOwner.pet.age }}岁</el-descriptions-item>
        <el-descriptions-item label="体重">{{ petOwner.pet.weight }} kg</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- Step 3: Complaint Form -->
    <div v-if="petOwner" class="card">
      <div class="card-title">接诊信息</div>
      <el-form :model="form" label-width="100px" label-position="right">
        <el-form-item label="体重">
          <el-input-number :model-value="form.weight" disabled style="width: 200px" />
          <span class="unit">kg（来自宠物档案）</span>
        </el-form-item>
        <el-form-item label="主诉" required>
          <el-input v-model="form.chiefComplaint" type="textarea" :rows="2" placeholder="宠物主人描述的主要问题" />
        </el-form-item>
        <el-form-item label="初步症状" required>
          <el-input v-model="form.initialSymptoms" type="textarea" :rows="2" placeholder="医师初步观察到的症状" />
        </el-form-item>
      </el-form>
    </div>

    <!-- Step 4: History -->
    <div v-if="petOwner" class="card">
      <div class="card-title">历史诊疗记录（近一年）</div>
      <div v-loading="historyLoading">
        <el-table v-if="historyConsultations.length" :data="historyConsultations" stripe style="width: 100%" max-height="240">
          <el-table-column prop="consultationNo" label="编号" width="150" />
          <el-table-column label="接诊时间" width="170">
            <template #default="{ row }">{{ row.consultationTime ? new Date(row.consultationTime).toLocaleString('zh-CN') : '-' }}</template>
          </el-table-column>
          <el-table-column prop="chiefComplaint" label="主诉" min-width="160" />
          <el-table-column label="诊断" min-width="160">
            <template #default="{ row }">{{ row.treatmentRecord?.finalDiagnosis || row.treatmentRecord?.preliminaryDiagnosis || '-' }}</template>
          </el-table-column>
          <el-table-column prop="veterinarianName" label="接诊兽医" width="100" />
        </el-table>
        <div v-else class="empty-hint">暂无近一年历史诊疗记录</div>
      </div>
    </div>

    <!-- Submit -->
    <div v-if="petOwner" class="card">
      <el-button type="primary" size="large" :loading="submitting" @click="submit" style="width: 100%">提交接诊登记</el-button>
    </div>
  </div>
</template>

<style scoped>
.register-page { display: flex; flex-direction: column; gap: 16px; max-width: 960px; margin: 0 auto; }
.page-header-card { display: flex; align-items: center; background: #fff; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.page-header-card h2 { margin: 0; font-size: 18px; color: #1d2129; }
.header-left { display: flex; align-items: center; gap: 12px; }
.card { background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.card-title { font-size: 15px; font-weight: 600; color: #1d2129; margin-bottom: 14px; border-left: 3px solid #165dff; padding-left: 10px; }
.search-row { display: flex; gap: 12px; margin-bottom: 12px; }
.search-input { flex: 1; }
.search-hint { text-align: center; padding: 16px; color: #86909c; font-size: 13px; }
.unit { margin-left: 8px; color: #86909c; font-size: 13px; }
.empty-hint { text-align: center; padding: 24px; color: #86909c; font-size: 13px; }
.empty-hint a { color: #165dff; }
</style>