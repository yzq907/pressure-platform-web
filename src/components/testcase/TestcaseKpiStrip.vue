<template>
  <div class="kpi-strip">
    <div class="kpi-card kpi-primary">
      <div class="kpi-icon">
        <el-icon :size="18"><VideoPlay /></el-icon>
      </div>
      <div class="kpi-meta">
        <span class="kpi-label">运行中</span>
        <div class="kpi-value-row">
          <span class="kpi-value">{{ stats.running }}</span>
          <span v-if="stats.running > 0" class="kpi-pulse"></span>
        </div>
        <span class="kpi-delta neutral">用例当前状态</span>
      </div>
      <svg class="kpi-spark" viewBox="0 0 100 30" preserveAspectRatio="none">
        <polyline points="0,20 12,15 24,18 36,10 48,12 60,6 72,8 84,4 100,2" fill="none" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon ki-amber">
        <el-icon :size="18"><Timer /></el-icon>
      </div>
      <div class="kpi-meta">
        <span class="kpi-label">未执行</span>
        <div class="kpi-value-row">
          <span class="kpi-value">{{ stats.idle }}</span>
        </div>
        <span class="kpi-delta neutral">用例当前状态</span>
      </div>
      <svg class="kpi-spark sp-amber" viewBox="0 0 100 30" preserveAspectRatio="none">
        <polyline points="0,22 12,18 24,20 36,14 48,16 60,10 72,8 84,12 100,6" fill="none" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon ki-green">
        <el-icon :size="18"><Select /></el-icon>
      </div>
      <div class="kpi-meta">
        <span class="kpi-label">用例状态通过率</span>
        <div class="kpi-value-row">
          <span class="kpi-value">{{ stats.successRate }}<small>%</small></span>
        </div>
        <span class="kpi-delta neutral">当前筛选 · {{ stats.success }} 成功 / {{ stats.error }} 失败</span>
      </div>
      <div class="kpi-progress"><span :style="{ width: stats.successRate + '%' }"></span></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon ki-violet">
        <el-icon :size="18"><Document /></el-icon>
      </div>
      <div class="kpi-meta">
        <span class="kpi-label">用例总数</span>
        <div class="kpi-value-row">
          <span class="kpi-value">{{ total }}</span>
        </div>
        <span class="kpi-delta neutral">当前筛选结果</span>
      </div>
      <div class="kpi-cluster">
        <span v-for="i in 8" :key="i" :class="['node-dot', i <= Math.min(8, Math.ceil(total / Math.max(1, total) * 8)) ? 'on' : '']"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, Select, Timer, VideoPlay } from '@element-plus/icons-vue';

defineProps<{
  stats: {
    running: number;
    idle: number;
    success: number;
    error: number;
    successRate: number;
  };
  total: number;
}>();
</script>
