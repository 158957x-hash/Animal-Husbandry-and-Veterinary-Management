<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const ownerForm = reactive({ name: '李女士', phone: '13800000001', address: '合肥市蜀山区望江西路' })
const petForm = reactive({ ownerId: '', name: '豆包', species: '犬', breed: '柯基', gender: '雄性', age: 2, identityNo: 'IMM-AH-0001' })

async function createOwner() {
  const owner = await store.createPetOwner({ ...ownerForm })
  petForm.ownerId = owner.id
  ElMessage.success('宠物主人档案已建立')
}

async function createPet() {
  const ownerId = petForm.ownerId || store.data.petOwners[0]?.id
  if (!ownerId) return ElMessage.warning('请先建立宠物主人档案')
  await store.createPetProfile({ ...petForm, ownerId })
  ElMessage.success('宠物档案已创建')
}
</script>

<template>
  <div class="page-grid two-col">
    <div class="stack">
      <el-card class="panel-card">
        <template #header><b>宠物主人建档</b></template>
        <el-form label-position="top">
          <el-form-item label="姓名"><el-input v-model="ownerForm.name" /></el-form-item>
          <el-form-item label="手机号"><el-input v-model="ownerForm.phone" /></el-form-item>
          <el-form-item label="地址"><el-input v-model="ownerForm.address" /></el-form-item>
          <el-button type="success" class="full-width" @click="createOwner">建立主人档案</el-button>
        </el-form>
      </el-card>
      <el-card class="panel-card">
        <template #header><b>新增宠物档案</b></template>
        <el-form label-position="top">
          <el-form-item label="所属主人">
            <el-select v-model="petForm.ownerId" class="full-width">
              <el-option v-for="item in store.data.petOwners" :key="item.id" :label="`${item.name} ${item.phone}`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="宠物名称"><el-input v-model="petForm.name" /></el-form-item>
          <el-form-item label="宠物种类"><el-input v-model="petForm.species" /></el-form-item>
          <el-form-item label="品种"><el-input v-model="petForm.breed" /></el-form-item>
          <el-form-item label="性别"><el-input v-model="petForm.gender" /></el-form-item>
          <el-form-item label="年龄"><el-input-number v-model="petForm.age" :min="0" class="full-width" /></el-form-item>
          <el-form-item label="芯片号或免疫牌号"><el-input v-model="petForm.identityNo" /></el-form-item>
          <el-button type="success" class="full-width" @click="createPet">创建宠物档案</el-button>
        </el-form>
      </el-card>
    </div>

    <el-card class="panel-card">
      <template #header><b>宠物档案台账</b></template>
      <div v-for="pet in store.data.petProfiles" :key="pet.id" class="task-item large">
        <div>
          <b>{{ pet.name }}｜{{ pet.species }}</b>
          <p>{{ pet.breed }}｜{{ pet.gender }}｜{{ pet.age }} 岁</p>
          <p>标识：{{ pet.identityNo }}｜主人：{{ store.data.petOwners.find((item) => item.id === pet.ownerId)?.name }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>
