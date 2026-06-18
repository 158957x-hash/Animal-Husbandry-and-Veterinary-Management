<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import type { PetOwner, PetProfile } from '../../domain/models'

const store = useAppStore()
const keyword = ref('')
const activeTab = ref('pets')
const ownerDialog = ref(false)
const petDialog = ref(false)
const petDetailVisible = ref(false)
const ownerDetailVisible = ref(false)
const ownerMode = ref<'create' | 'edit'>('create')
const petMode = ref<'create' | 'edit'>('create')
const currentOwner = ref<PetOwner>()
const currentPet = ref<PetProfile>()
const ownerForm = reactive({ name: '李女士', phone: '13800000001', address: '合肥市蜀山区望江西路' })
const petForm = reactive({ ownerId: '', name: '豆包', species: '犬', breed: '柯基', gender: '雄性', age: 2, weight: 5, identityNo: 'IMM-AH-0001' })

const owners = computed(() => store.data.petOwners.filter((item) => !keyword.value || item.name.includes(keyword.value) || item.phone.includes(keyword.value)))
const pets = computed(() => store.data.petProfiles.filter((item) => !keyword.value || item.name.includes(keyword.value) || item.identityNo.includes(keyword.value)))

const currentPetOwner = computed(() => currentPet.value ? store.data.petOwners.find((item) => item.id === currentPet.value?.ownerId) : undefined)
const currentPetConsultations = computed(() => currentPet.value ? store.data.consultations.filter((item) => item.petId === currentPet.value?.id) : [])
const currentOwnerPets = computed(() => currentOwner.value ? store.data.petProfiles.filter((item) => item.ownerId === currentOwner.value?.id) : [])

function ownerName(ownerId: string) {
  return store.data.petOwners.find((item) => item.id === ownerId)?.name || '-'
}

function ownerPhone(ownerId: string) {
  return store.data.petOwners.find((item) => item.id === ownerId)?.phone || '-'
}

function openOwner() {
  ownerMode.value = 'create'
  currentOwner.value = undefined
  Object.assign(ownerForm, { name: '李女士', phone: `138${Date.now().toString().slice(-8)}`, address: '合肥市蜀山区望江西路' })
  ownerDialog.value = true
}

function editOwner(row: PetOwner) {
  ownerMode.value = 'edit'
  currentOwner.value = row
  Object.assign(ownerForm, row)
  ownerDialog.value = true
}

function showOwner(row: PetOwner) {
  currentOwner.value = row
  ownerDetailVisible.value = true
}

function openPet() {
  petMode.value = 'create'
  currentPet.value = undefined
  Object.assign(petForm, { ownerId: store.data.petOwners[0]?.id || '', name: '豆包', species: '犬', breed: '柯基', gender: '雄性', age: 2, weight: 5, identityNo: `IMM-AH-${Date.now().toString().slice(-4)}` })
  petDialog.value = true
}

function editPet(row: PetProfile) {
  petMode.value = 'edit'
  currentPet.value = row
  Object.assign(petForm, row)
  petDialog.value = true
}

function showPet(row: PetProfile) {
  currentPet.value = row
  petDetailVisible.value = true
}

async function saveOwner() {
  if (!ownerForm.name || !ownerForm.phone) return ElMessage.warning('请填写主人姓名和手机号')
  if (ownerMode.value === 'create') await store.createPetOwner({ ...ownerForm })
  else if (currentOwner.value) await store.updatePetOwner(currentOwner.value.id, { ...ownerForm })
  ownerDialog.value = false
  ElMessage.success(ownerMode.value === 'create' ? '宠物主人档案已建立' : '宠物主人档案已保存')
}

async function removeOwner(row: PetOwner) {
  await ElMessageBox.confirm(`确认删除 ${row.name}？如已关联宠物档案将自动阻断。`, '删除确认')
  try {
    await store.deletePetOwner(row.id)
    ElMessage.success('宠物主人档案已删除')
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '不能删除')
  }
}

async function savePet() {
  if (!petForm.ownerId || !petForm.name || !petForm.identityNo) return ElMessage.warning('请填写所属主人、宠物名称和标识号')
  if (petMode.value === 'create') await store.createPetProfile({ ...petForm })
  else if (currentPet.value) await store.updatePetProfile(currentPet.value.id, { ...petForm })
  petDialog.value = false
  ElMessage.success(petMode.value === 'create' ? '宠物档案已创建' : '宠物档案已保存')
}

async function removePet(row: PetProfile) {
  await ElMessageBox.confirm(`确认删除 ${row.name}？如已被业务引用将自动阻断。`, '删除确认')
  try {
    await store.deletePetProfile(row.id)
    ElMessage.success('宠物档案已删除')
  } catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '不能删除')
    await store.disablePetProfile(row.id)
    ElMessage.success('已改为停用宠物档案')
  }
}
</script>

<template>
  <div class="farmer-modern-page pet-page">
    <el-card class="gov-compact-card">
      <div class="card-header-line">
        <div>
          <h2>宠物档案管理</h2>
          <p>通过宠物档案和主人档案两个页签，集中查看关联主人、名下宠物和诊疗记录。</p>
        </div>
        <div class="action-inline">
          <el-button @click="store.refresh()">刷新</el-button>
          <el-button @click="openOwner">新增主人档案</el-button>
          <el-button type="success" @click="openPet">新增宠物档案</el-button>
        </div>
      </div>
      <div class="action-inline"><el-input v-model="keyword" placeholder="按主人、手机号、宠物名称或标识号筛选" clearable /><el-button>导出</el-button></div>
    </el-card>

    <el-card class="gov-compact-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="宠物档案" name="pets">
          <el-table :data="pets" stripe>
            <el-table-column type="index" label="序号" width="70" />
            <el-table-column prop="name" label="宠物名称" width="110" />
            <el-table-column prop="identityNo" label="宠物编号" min-width="150" />
            <el-table-column prop="species" label="种类" width="80" />
            <el-table-column prop="breed" label="品种" width="120" />
            <el-table-column prop="gender" label="性别" width="70" />
            <el-table-column prop="age" label="年龄" width="70"><template #default="{ row }">{{ row.age }}岁</template></el-table-column>
            <el-table-column prop="weight" label="体重" width="80"><template #default="{ row }">{{ row.weight }}kg</template></el-table-column>
            <el-table-column label="主人" width="100"><template #default="{ row }">{{ ownerName(row.ownerId) }}</template></el-table-column>
            <el-table-column label="联系电话" width="130"><template #default="{ row }">{{ ownerPhone(row.ownerId) }}</template></el-table-column>
            <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? '正常' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="220" fixed="right"><template #default="{ row }"><el-button size="small" @click="showPet(row)">查看详情</el-button><el-button size="small" @click="editPet(row)">编辑</el-button><el-button size="small" type="danger" @click="removePet(row)">删除/停用</el-button></template></el-table-column>
          </el-table>
          <div class="gov-pagination-bar">
            <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="pets.length" :page-size="10" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="主人档案" name="owners">
          <el-table :data="owners" stripe>
            <el-table-column type="index" label="序号" width="70" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="phone" label="手机号" width="140" />
            <el-table-column prop="address" label="地址" min-width="180" />
            <el-table-column label="名下宠物" width="90"><template #default="{ row }">{{ store.data.petProfiles.filter((item) => item.ownerId === row.id).length }}只</template></el-table-column>
            <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? '正常' : '停用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="190" fixed="right"><template #default="{ row }"><el-button size="small" @click="showOwner(row)">查看详情</el-button><el-button size="small" @click="editOwner(row)">编辑</el-button><el-button size="small" type="danger" @click="removeOwner(row)">删除</el-button></template></el-table-column>
          </el-table>
          <div class="gov-pagination-bar">
            <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="owners.length" :page-size="10" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="ownerDialog" :title="ownerMode === 'create' ? '新增主人档案' : '编辑主人档案'" width="520px"><el-form label-position="top"><el-form-item label="姓名"><el-input v-model="ownerForm.name" /></el-form-item><el-form-item label="手机号"><el-input v-model="ownerForm.phone" /></el-form-item><el-form-item label="地址"><el-input v-model="ownerForm.address" /></el-form-item></el-form><template #footer><el-button @click="ownerDialog = false">取消</el-button><el-button type="success" @click="saveOwner">保存</el-button></template></el-dialog>
    <el-dialog v-model="petDialog" :title="petMode === 'create' ? '新增宠物档案' : '编辑宠物档案'" width="560px"><el-form label-position="top"><el-form-item label="所属主人"><el-select v-model="petForm.ownerId" class="full-width"><el-option v-for="item in store.data.petOwners" :key="item.id" :label="`${item.name} ${item.phone}`" :value="item.id" /></el-select></el-form-item><el-form-item label="宠物名称"><el-input v-model="petForm.name" /></el-form-item><el-form-item label="宠物种类"><el-input v-model="petForm.species" /></el-form-item><el-form-item label="品种"><el-input v-model="petForm.breed" /></el-form-item><el-form-item label="性别"><el-input v-model="petForm.gender" /></el-form-item><el-form-item label="年龄"><el-input-number v-model="petForm.age" :min="0" class="full-width" /></el-form-item><el-form-item label="体重(kg)"><el-input-number v-model="petForm.weight" :min="0" :precision="1" :step="0.5" class="full-width" /></el-form-item><el-form-item label="芯片号或免疫牌号"><el-input v-model="petForm.identityNo" /></el-form-item></el-form><template #footer><el-button @click="petDialog = false">取消</el-button><el-button type="success" @click="savePet">保存</el-button></template></el-dialog>

    <el-dialog v-model="petDetailVisible" title="宠物档案详情" width="820px">
      <div v-if="currentPet" class="detail-body">
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="宠物名称">{{ currentPet.name }}</el-descriptions-item>
          <el-descriptions-item label="宠物编号">{{ currentPet.identityNo }}</el-descriptions-item>
          <el-descriptions-item label="种类">{{ currentPet.species }}</el-descriptions-item>
          <el-descriptions-item label="品种">{{ currentPet.breed }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ currentPet.gender }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ currentPet.age }}岁</el-descriptions-item>
          <el-descriptions-item label="体重">{{ currentPet.weight }}kg</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentPet.active ? '正常' : '停用' }}</el-descriptions-item>
        </el-descriptions>
        <h4>关联主人档案</h4>
        <el-descriptions v-if="currentPetOwner" :column="3" border size="small">
          <el-descriptions-item label="姓名">{{ currentPetOwner.name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentPetOwner.phone }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ currentPetOwner.address }}</el-descriptions-item>
        </el-descriptions>
        <h4>关联诊疗记录</h4>
        <el-table :data="currentPetConsultations" stripe size="small" empty-text="暂无诊疗记录">
          <el-table-column prop="consultationNo" label="接诊编号" width="150" />
          <el-table-column prop="chiefComplaint" label="主诉" min-width="120" />
          <el-table-column label="诊断结果" min-width="140"><template #default="{ row }">{{ row.treatmentRecord?.finalDiagnosis || row.treatmentRecord?.preliminaryDiagnosis || '-' }}</template></el-table-column>
          <el-table-column prop="veterinarianName" label="接诊兽医" width="100" />
          <el-table-column label="接诊时间" width="170"><template #default="{ row }">{{ row.consultationTime ? new Date(row.consultationTime).toLocaleString('zh-CN') : '-' }}</template></el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="ownerDetailVisible" title="主人档案详情" width="760px">
      <div v-if="currentOwner" class="detail-body">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="姓名">{{ currentOwner.name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentOwner.phone }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ currentOwner.address }}</el-descriptions-item>
        </el-descriptions>
        <h4>名下所有宠物</h4>
        <el-table :data="currentOwnerPets" stripe size="small" empty-text="暂无宠物档案">
          <el-table-column prop="name" label="宠物名称" width="100" />
          <el-table-column prop="identityNo" label="宠物编号" min-width="150" />
          <el-table-column prop="species" label="种类" width="80" />
          <el-table-column prop="breed" label="品种" width="110" />
          <el-table-column prop="gender" label="性别" width="70" />
          <el-table-column prop="age" label="年龄" width="70"><template #default="{ row }">{{ row.age }}岁</template></el-table-column>
          <el-table-column prop="weight" label="体重" width="80"><template #default="{ row }">{{ row.weight }}kg</template></el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.pet-page { display: flex; flex-direction: column; gap: 16px; }
.panel-card { border-radius: 12px; }
.card-header-line { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.card-header-line h2 { margin: 0 0 6px; font-size: 18px; color: #1d2129; }
.card-header-line p { margin: 0; font-size: 13px; color: #86909c; }
.action-inline { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.full-width { width: 100%; }
.detail-body { max-height: 60vh; overflow-y: auto; padding-right: 8px; }
.detail-body h4 { margin: 18px 0 10px; font-size: 14px; color: #1d2129; border-left: 3px solid #165dff; padding-left: 10px; }
</style>