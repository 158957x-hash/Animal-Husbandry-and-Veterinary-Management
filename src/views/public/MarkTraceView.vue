<script setup lang="ts">
import { ref } from 'vue'
import productCertImg from '../../../image/产品证.png'
import meatQualityCertImg from '../../../image/肉品品质检验合格证.png'
import animalCertImg from '../../../image/动物检疫证书.png'

const markExpanded = ref(false)
const productExpanded = ref(false)
const activeCertTab = ref('product')

const certificates = {
  product: {
    title: '动物产品检疫证明',
    image: productCertImg,
    items: [
      ['证号', 'CPJY202606160001'],
      ['签发兽医', '官方兽医 王敏'],
      ['签发单位', '利辛县动物卫生监督所'],
      ['签发时间', '2026-06-16 15:20:00'],
    ],
  },
  animal: {
    title: '动物检疫合格证明',
    image: animalCertImg,
    items: [
      ['证号', 'DWJY2026061613480168'],
      ['动物种类', '生猪'],
      ['数量', '60头'],
      ['来源养殖场', '绿丰生态养殖场'],
    ],
  },
  meat: {
    title: '肉品品质检验合格证',
    image: meatQualityCertImg,
    items: [
      ['合格证编号', 'RPZJ202606160001'],
      ['产品名称', '猪胴体'],
      ['产品重量', '4680kg'],
      ['检验结论', '合格'],
      ['检验人员', '刘海峰'],
      ['检验时间', '2026-06-16 15:05:00'],
    ],
  },
}
</script>

<template>
  <div class="trace-page">
    <header class="trace-header">
      <div class="trace-header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <h1>检疫验讫标志扫码查验</h1>
      <div class="trace-status-badge"><span class="trace-status-dot"></span>查验有效</div>
      <p class="trace-header-sub">该检疫验讫标志已关联有效检疫信息</p>
    </header>

    <div class="trace-cards">
      <section class="trace-card trace-fold-card">
        <button class="trace-fold-header" @click="markExpanded = !markExpanded">
          <span>
            <strong>检疫验讫标志信息</strong>
            <em>KH202606160001</em>
          </span>
          <i>{{ markExpanded ? '收起' : '展开' }}</i>
        </button>
        <div v-if="markExpanded" class="trace-info-grid">
          <div class="trace-info-item"><span class="trace-info-label">标志编号</span><span class="trace-info-value">KH202606160001</span></div>
          <div class="trace-info-item"><span class="trace-info-label">标志类型</span><span class="trace-info-value">卡环式</span></div>
          <div class="trace-info-item"><span class="trace-info-label">使用对象</span><span class="trace-info-value">猪胴体</span></div>
          <div class="trace-info-item"><span class="trace-info-label">标志状态</span><span class="trace-info-value"><em class="trace-tag-green">已使用</em></span></div>
          <div class="trace-info-item"><span class="trace-info-label">关联时间</span><span class="trace-info-value">2026-06-16 16:10:00</span></div>
          <div class="trace-info-item"><span class="trace-info-label">关联企业</span><span class="trace-info-value">皖北标准化屠宰中心</span></div>
        </div>
      </section>

      <section class="trace-card trace-fold-card">
        <button class="trace-fold-header" @click="productExpanded = !productExpanded">
          <span>
            <strong>产品信息</strong>
            <em>CPPC202606160001-001</em>
          </span>
          <i>{{ productExpanded ? '收起' : '展开' }}</i>
        </button>
        <div v-if="productExpanded" class="trace-info-grid">
          <div class="trace-info-item"><span class="trace-info-label">产品明细编号</span><span class="trace-info-value">CPPC202606160001-001</span></div>
          <div class="trace-info-item"><span class="trace-info-label">产品批次编号</span><span class="trace-info-value">CPPC202606160001</span></div>
          <div class="trace-info-item"><span class="trace-info-label">产品名称</span><span class="trace-info-value">猪胴体</span></div>
          <div class="trace-info-item"><span class="trace-info-label">产品类型</span><span class="trace-info-value">胴体</span></div>
          <div class="trace-info-item"><span class="trace-info-label">产品重量</span><span class="trace-info-value">78kg</span></div>
          <div class="trace-info-item"><span class="trace-info-label">产品证编号</span><span class="trace-info-value">CPJY202606160001</span></div>
          <div class="trace-info-item"><span class="trace-info-label">屠宰企业</span><span class="trace-info-value">皖北标准化屠宰中心</span></div>
          <div class="trace-info-item"><span class="trace-info-label">来源养殖场</span><span class="trace-info-value">绿丰生态养殖场</span></div>
          <div class="trace-info-item"><span class="trace-info-label">检疫结论</span><span class="trace-info-value"><em class="trace-tag-green">合格</em></span></div>
        </div>
      </section>

      <section class="trace-card trace-cert-tabs-card">
        <h2 class="trace-card-title">三证信息</h2>
        <div class="trace-tab-nav">
          <button :class="{ active: activeCertTab === 'product' }" @click="activeCertTab = 'product'">产品证</button>
          <button :class="{ active: activeCertTab === 'animal' }" @click="activeCertTab = 'animal'">动物证</button>
          <button :class="{ active: activeCertTab === 'meat' }" @click="activeCertTab = 'meat'">肉品证</button>
        </div>

        <div class="trace-cert-panel">
          <div class="trace-cert-image-inline">
            <img :src="certificates[activeCertTab as keyof typeof certificates].image" :alt="certificates[activeCertTab as keyof typeof certificates].title" />
          </div>
          <h3>{{ certificates[activeCertTab as keyof typeof certificates].title }}</h3>
          <div class="trace-info-grid">
            <div v-for="item in certificates[activeCertTab as keyof typeof certificates].items" :key="item[0]" class="trace-info-item">
              <span class="trace-info-label">{{ item[0] }}</span>
              <span class="trace-info-value" :class="{ green: item[1] === '合格' }">{{ item[1] }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="trace-footer">
      <p>利辛县动物卫生监督所</p>
      <p>安徽省畜牧兽医综合信息平台</p>
    </footer>
  </div>
</template>

<style scoped>
.trace-page {
  min-height: 100vh;
  background: #f5f7f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.trace-header {
  padding: 32px 20px 24px;
  text-align: center;
  background: linear-gradient(180deg, #eaf7ee 0%, #f5f7f5 100%);
}

.trace-header-icon {
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  color: #16a34a;
  background: #dcfce7;
  border-radius: 50%;
  box-shadow: 0 0 0 8px rgba(22, 163, 74, 0.08);
}

.trace-header-icon svg {
  width: 28px;
  height: 28px;
}

.trace-header h1 {
  margin: 0 0 12px;
  color: #12372a;
  font-size: 22px;
  font-weight: 700;
}

.trace-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  color: #15803d;
  font-size: 14px;
  font-weight: 600;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
}

.trace-status-dot {
  width: 8px;
  height: 8px;
  background: #16a34a;
  border-radius: 50%;
  animation: trace-pulse 2s ease-in-out infinite;
}

@keyframes trace-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.trace-header-sub {
  max-width: 320px;
  margin: 14px auto 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.trace-cards {
  max-width: 520px;
  margin: 0 auto;
  padding: 0 16px 24px;
}

.trace-card {
  padding: 18px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #e8efe8;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.trace-fold-card {
  padding: 0;
  overflow: hidden;
}

.trace-fold-header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
  text-align: left;
  background: #fff;
  border: none;
}

.trace-fold-header span {
  display: grid;
  gap: 6px;
}

.trace-fold-header strong,
.trace-card-title {
  margin: 0;
  color: #12372a;
  font-size: 16px;
  font-weight: 700;
}

.trace-fold-header em {
  color: #64748b;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
}

.trace-fold-header i {
  color: #16a34a;
  font-size: 13px;
  font-style: normal;
  font-weight: 600;
}

.trace-info-grid {
  padding: 0 18px 12px;
}

.trace-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f5f0;
}

.trace-info-item:last-child {
  border-bottom: none;
}

.trace-info-label {
  color: #788896;
  font-size: 14px;
  flex-shrink: 0;
}

.trace-info-value {
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.trace-info-value.green,
.trace-tag-green {
  display: inline-flex;
  padding: 2px 10px;
  color: #15803d;
  font-size: 13px;
  font-style: normal;
  font-weight: 600;
  background: #dcfce7;
  border-radius: 999px;
}

.trace-tab-nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 14px 0;
  padding: 5px;
  background: #f1f5f2;
  border-radius: 12px;
}

.trace-tab-nav button {
  padding: 10px 6px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  background: transparent;
  border: none;
  border-radius: 9px;
}

.trace-tab-nav button.active {
  color: #15803d;
  background: #fff;
  box-shadow: 0 1px 4px rgba(15, 118, 110, 0.12);
}

.trace-cert-panel h3 {
  margin: 14px 0 0;
  color: #12372a;
  font-size: 16px;
}

.trace-cert-panel .trace-info-grid {
  padding: 6px 0 0;
}

.trace-cert-image-inline {
  max-height: 420px;
  overflow: auto;
  background: #f8fafc;
  border: 1px solid #e8efe8;
  border-radius: 12px;
}

.trace-cert-image-inline img {
  display: block;
  width: 100%;
  object-fit: contain;
}

.trace-footer {
  padding: 24px 20px 32px;
  text-align: center;
}

.trace-footer p {
  margin: 0 0 4px;
  color: #94a3b8;
  font-size: 13px;
}

.trace-footer p:first-child {
  color: #64748b;
  font-weight: 500;
}
</style>
