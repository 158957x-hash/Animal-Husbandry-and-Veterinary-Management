<script setup lang="ts">
import { ref } from 'vue'
import productCertImg from '../../../image/产品证.png'
import meatQualityCertImg from '../../../image/肉品品质检验合格证.png'
import animalCertImg from '../../../image/动物检疫证书.png'

const certificateDialogVisible = ref(false)
const certificateTitle = ref('')
const certificateImage = ref('')

function openCertificate(title: string, image: string) {
  certificateTitle.value = title
  certificateImage.value = image
  certificateDialogVisible.value = true
}
</script>

<template>
  <div class="trace-page">
    <header class="trace-header">
      <div class="trace-header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <h1>检疫验讫标志扫码查验</h1>
      <div class="trace-status-badge">
        <span class="trace-status-dot"></span>
        查验有效
      </div>
      <p class="trace-header-sub">该检疫验讫标志已关联有效检疫信息</p>
    </header>

    <div class="trace-cards">
      <section class="trace-card">
        <h2 class="trace-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          检疫验讫标志信息
        </h2>
        <div class="trace-info-grid">
          <div class="trace-info-item">
            <span class="trace-info-label">标志编号</span>
            <span class="trace-info-value">KH202606160001</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">标志类型</span>
            <span class="trace-info-value">卡环式</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">使用对象</span>
            <span class="trace-info-value">猪胴体</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">标志状态</span>
            <span class="trace-info-value"><em class="trace-tag-green">已使用</em></span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">关联时间</span>
            <span class="trace-info-value">2026-06-16 16:10:00</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">关联企业</span>
            <span class="trace-info-value">皖北标准化屠宰中心</span>
          </div>
        </div>
      </section>

      <section class="trace-card">
        <h2 class="trace-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          产品信息
        </h2>
        <div class="trace-info-grid">
          <div class="trace-info-item">
            <span class="trace-info-label">产品明细编号</span>
            <span class="trace-info-value">CPPC202606160001-001</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">产品批次编号</span>
            <span class="trace-info-value">CPPC202606160001</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">产品名称</span>
            <span class="trace-info-value">猪胴体</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">产品类型</span>
            <span class="trace-info-value">胴体</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">产品重量</span>
            <span class="trace-info-value">78kg</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">产品证编号</span>
            <span class="trace-info-value">CPJY202606160001</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">屠宰企业</span>
            <span class="trace-info-value">皖北标准化屠宰中心</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">来源养殖场</span>
            <span class="trace-info-value">绿丰生态养殖场</span>
          </div>
          <div class="trace-info-item">
            <span class="trace-info-label">检疫结论</span>
            <span class="trace-info-value"><em class="trace-tag-green">合格</em></span>
          </div>
        </div>
      </section>

      <section class="trace-card">
        <h2 class="trace-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          三证信息
        </h2>

        <div class="trace-cert-list">
          <div class="trace-cert-card">
            <div class="trace-cert-card-header">
              <h3>动物产品检疫证明</h3>
              <span class="trace-cert-status">有效</span>
            </div>
            <div class="trace-cert-body">
              <div class="trace-info-item">
                <span class="trace-info-label">证号</span>
                <span class="trace-info-value">CPJY202606160001</span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">签发兽医</span>
                <span class="trace-info-value">官方兽医 王敏</span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">签发单位</span>
                <span class="trace-info-value">利辛县动物卫生监督所</span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">签发时间</span>
                <span class="trace-info-value">2026-06-16 15:20:00</span>
              </div>
            </div>
            <button class="trace-cert-btn" @click="openCertificate('动物产品检疫证明', productCertImg)">查看证书</button>
          </div>

          <div class="trace-cert-card">
            <div class="trace-cert-card-header">
              <h3>动物检疫合格证明</h3>
              <span class="trace-cert-status">有效</span>
            </div>
            <div class="trace-cert-body">
              <div class="trace-info-item">
                <span class="trace-info-label">证号</span>
                <span class="trace-info-value">DWJY2026061613480168</span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">动物种类</span>
                <span class="trace-info-value">生猪</span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">数量</span>
                <span class="trace-info-value">60头</span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">来源养殖场</span>
                <span class="trace-info-value">绿丰生态养殖场</span>
              </div>
            </div>
            <button class="trace-cert-btn" @click="openCertificate('动物检疫合格证明', animalCertImg)">查看证书</button>
          </div>

          <div class="trace-cert-card">
            <div class="trace-cert-card-header">
              <h3>肉品品质检验合格证</h3>
              <span class="trace-cert-status">有效</span>
            </div>
            <div class="trace-cert-body">
              <div class="trace-info-item">
                <span class="trace-info-label">合格证编号</span>
                <span class="trace-info-value">RPZJ202606160001</span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">产品名称</span>
                <span class="trace-info-value">猪胴体</span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">产品重量</span>
                <span class="trace-info-value">4680kg</span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">检验结论</span>
                <span class="trace-info-value"><em class="trace-tag-green">合格</em></span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">检验人员</span>
                <span class="trace-info-value">刘海峰</span>
              </div>
              <div class="trace-info-item">
                <span class="trace-info-label">检验时间</span>
                <span class="trace-info-value">2026-06-16 15:05:00</span>
              </div>
            </div>
            <button class="trace-cert-btn" @click="openCertificate('肉品品质检验合格证', meatQualityCertImg)">查看证书</button>
          </div>
        </div>
      </section>
    </div>

    <footer class="trace-footer">
      <p>利辛县动物卫生监督所</p>
      <p>安徽省畜牧兽医综合信息平台</p>
    </footer>

    <div v-if="certificateDialogVisible" class="trace-cert-overlay" @click.self="certificateDialogVisible = false">
      <div class="trace-cert-viewer">
        <div class="trace-cert-viewer-header">
          <h3>{{ certificateTitle }}</h3>
          <button class="trace-cert-close" @click="certificateDialogVisible = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="trace-cert-image">
          <img :src="certificateImage" :alt="certificateTitle" />
        </div>
      </div>
    </div>
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
  padding: 36px 20px 28px;
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
  letter-spacing: -0.3px;
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
  padding: 20px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #e8efe8;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.trace-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  color: #12372a;
  font-size: 16px;
  font-weight: 700;
}

.trace-card-title svg {
  width: 20px;
  height: 20px;
  color: #16a34a;
}

.trace-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
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

.trace-cert-list {
  display: grid;
  gap: 12px;
}

.trace-cert-card {
  padding: 16px;
  background: #f8fbf9;
  border: 1px solid #e4efe8;
  border-radius: 13px;
}

.trace-cert-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4efe8;
}

.trace-cert-card-header h3 {
  margin: 0;
  color: #12372a;
  font-size: 15px;
  font-weight: 700;
}

.trace-cert-status {
  padding: 3px 10px;
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
  background: #dcfce7;
  border-radius: 999px;
}

.trace-cert-body {
  margin-bottom: 12px;
}

.trace-cert-body .trace-info-item {
  padding: 8px 0;
}

.trace-cert-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  color: #16a34a;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.trace-cert-btn:active {
  background: #dcfce7;
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

.trace-cert-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.trace-cert-viewer {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.trace-cert-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e8efe8;
}

.trace-cert-viewer-header h3 {
  margin: 0;
  color: #12372a;
  font-size: 16px;
  font-weight: 700;
}

.trace-cert-close {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.trace-cert-close svg {
  width: 18px;
  height: 18px;
}

.trace-cert-image {
  overflow: auto;
  text-align: center;
  padding: 8px;
  background: #f8fafc;
}

.trace-cert-image img {
  width: 100%;
  max-width: 640px;
  object-fit: contain;
  border-radius: 8px;
}
</style>