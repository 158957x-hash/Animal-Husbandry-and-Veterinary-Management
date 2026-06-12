<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../stores/app'
import type { PetOwner, PetProfile } from '../../domain/models'

const store = useAppStore()
const keyword = ref('')
const ownerDialog = ref(false)
const petDialog = ref(false)
const detailVisible = ref(false)
const ownerMode = ref<'create' | 'edit'>('create')
const petMode = ref<'create' | 'edit'>('create')
const currentOwner = ref<PetOwner>()
const currentPet = ref<PetProfile>()
const ownerForm = reactive({ name: '李女士', phone: '13800000001', address: '合肥市蜀山区望江西路' })
const petForm = reactive({ ownerId: '', name: '豆包', species: '犬', breed: '柯基', gender: '雄性', age: 2, identityNo: 'IMM-AH-0001' })
const owners = computed(() => store.data.petOwners.filter((item) => !keyword.value || item.name.includes(keyword.value) || item.phone.includes(keyword.value)))
const pets = computed(() => store.data.petProfiles.filter((item) => !keyword.value || item.name.includes(keyword.value) || item.identityNo.includes(keyword.value)))

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

function openPet() {
  petMode.value = 'create'
  currentPet.value = undefined
  Object.assign(petForm, { ownerId: store.data.petOwners[0]?.id || '', name: '豆包', species: '犬', breed: '柯基', gender: '雄性', age: 2, identityNo: `IMM-AH-${Date.now().toString().slice(-4)}` })
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
  detailVisible.value = true
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
  <div class="page-grid">
    <el-card class="panel-card">
      <div class="card-header-line"><div><h2>宠物主人与宠物档案</h2><p>集中维护宠物主人信息、宠物档案和关联免疫处方记录。</p></div><div class="action-inline"><el-button @click="store.refresh()">刷新</el-button><el-button @click="openOwner">新增宠物主人</el-button><el-button type="success" @click="openPet">新增宠物档案</el-button></div></div>
      <div class="action-inline"><el-input v-model="keyword" placeholder="按主人、手机号、宠物名称或标识号筛选" clearable /><el-button>导出</el-button></div>
    </el-card>
    <div class="page-grid two-col">
      <el-card class="panel-card"><template #header><b>宠物主人列表</b></template><el-table :data="owners" stripe><el-table-column type="index" label="序号" width="70" /><el-table-column prop="name" label="姓名" /><el-table-column prop="phone" label="手机号" /><el-table-column prop="address" label="地址" /><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? '正常' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" width="170"><template #default="{ row }"><el-button size="small" @click="editOwner(row)">编辑</el-button><el-button size="small" type="danger" @click="removeOwner(row)">删除</el-button></template></el-table-column></el-table></el-card>
      <el-card class="panel-card"><template #header><b>宠物档案列表</b></template><el-table :data="pets" stripe><el-table-column type="index" label="序号" width="70" /><el-table-column prop="name" label="宠物名称" /><el-table-column prop="species" label="种类" width="90" /><el-table-column prop="identityNo" label="芯片号/免疫牌号" min-width="150" /><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? '正常' : '停用' }}</el-tag></template></el-table-column><el-table-column label="操作" width="220"><template #default="{ row }"><el-button size="small" @click="showPet(row)">查看</el-button><el-button size="small" @click="editPet(row)">编辑</el-button><el-button size="small" type="danger" @click="removePet(row)">删除/停用</el-button></template></el-table-column></el-table></el-card>
    </div>
    <el-dialog v-model="ownerDialog" :title="ownerMode === 'create' ? '新增宠物主人' : '编辑宠物主人'" width="520px"><el-form label-position="top"><el-form-item label="姓名"><el-input v-model="ownerForm.name" /></el-form-item><el-form-item label="手机号"><el-input v-model="ownerForm.phone" /></el-form-item><el-form-item label="地址"><el-input v-model="ownerForm.address" /></el-form-item></el-form><template #footer><el-button @click="ownerDialog = false">取消</el-button><el-button type="success" @click="saveOwner">保存</el-button></template></el-dialog>
    <el-dialog v-model="petDialog" :title="petMode === 'create' ? '新增宠物档案' : '编辑宠物档案'" width="560px"><el-form label-position="top"><el-form-item label="所属主人"><el-select v-model="petForm.ownerId" class="full-width"><el-option v-for="item in store.data.petOwners" :key="item.id" :label="`${item.name} ${item.phone}`" :value="item.id" /></el-select></el-form-item><el-form-item label="宠物名称"><el-input v-model="petForm.name" /></el-form-item><el-form-item label="宠物种类"><el-input v-model="petForm.species" /></el-form-item><el-form-item label="品种"><el-input v-model="petForm.breed" /></el-form-item><el-form-item label="性别"><el-input v-model="petForm.gender" /></el-form-item><el-form-item label="年龄"><el-input-number v-model="petForm.age" :min="0" class="full-width" /></el-form-item><el-form-item label="芯片号或免疫牌号"><el-input v-model="petForm.identityNo" /></el-form-item></el-form><template #footer><el-button @click="petDialog = false">取消</el-button><el-button type="success" @click="savePet">保存</el-button></template></el-dialog>
    <el-dialog v-model="detailVisible" title="宠物档案详情" width="520px"><div v-if="currentPet" class="info-list"><p><span>宠物名称</span><b>{{ currentPet.name }}</b></p><p><span>种类品种</span><b>{{ currentPet.species }}｜{{ currentPet.breed }}</b></p><p><span>标识号</span><b>{{ currentPet.identityNo }}</b></p><p><span>关联记录</span><b>免疫 {{ store.data.immunizationLedgers.filter((item) => item.petId === currentPet?.id).length }}，处方 {{ store.data.prescriptions.filter((item) => item.petId === currentPet?.id).length }}</b></p></div></el-dialog>
  </div>
</template>
