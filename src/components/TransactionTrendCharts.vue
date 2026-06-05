<template>
  <div class="trend-grid">
    <div class="trend-panel">
      <div class="trend-title">总 TPS</div>
      <v-chart class="trend-chart" :option="totalTpsOption" autoresize />
    </div>
    <div class="trend-panel">
      <div class="trend-title">交易活跃线程</div>
      <v-chart class="trend-chart" :option="activeThreadsOption" autoresize />
    </div>
    <div class="trend-panel">
      <div class="trend-title">每个交易 TPS</div>
      <v-chart class="trend-chart" :option="transactionTpsOption" autoresize />
    </div>
    <div class="trend-panel">
      <div class="trend-title">平均响应时间</div>
      <v-chart class="trend-chart" :option="avgRtOption" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, LineChart, GridComponent, LegendComponent, TooltipComponent, DataZoomComponent]);

interface TrendPoint {
  timestamp: string;
  value: number;
}

interface TransactionTrendData {
  reportId: number;
  window: number;
  timestamps: string[];
  transactions: string[];
  totalTps: TrendPoint[];
  transactionTps: Record<string, TrendPoint[]>;
  avgRt: Record<string, TrendPoint[]>;
  activeThreads: Record<string, TrendPoint[]>;
}

const props = defineProps<{
  data: TransactionTrendData;
}>();

const timestamps = computed(() => props.data.timestamps || []);
const transactions = computed(() => props.data.transactions || []);

const pointSeries = (points: TrendPoint[]) => {
  const pointMap = new Map((points || []).map((item) => [item.timestamp, item.value]));
  return timestamps.value.map((timestamp) => pointMap.get(timestamp) ?? null);
};

const multiSeries = (source: Record<string, TrendPoint[]> = {}) => {
  return transactions.value.map((name) => ({
    name,
    type: 'line',
    smooth: true,
    showSymbol: timestamps.value.length <= 80,
    data: pointSeries(source[name] || []),
  }));
};

const baseOption = (unit: string, yName: string, series: any[]) => ({
  tooltip: {
    trigger: 'axis',
    valueFormatter: (value: number | string | null) => {
      if (value === null || value === undefined || value === '-') return '-';
      const num = Number(value);
      if (!Number.isFinite(num)) return String(value);
      return `${num.toFixed(unit === 'ms' ? 1 : 2)}${unit}`;
    },
  },
  legend: {
    type: 'scroll',
    top: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '14%',
    top: '16%',
    containLabel: true,
  },
  dataZoom: [
    { type: 'inside', start: 0, end: 100 },
    { type: 'slider', start: 0, end: 100, bottom: 0, height: 16 },
  ],
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: timestamps.value,
  },
  yAxis: {
    type: 'value',
    name: yName,
  },
  series,
});

const totalTpsOption = computed(() => baseOption('', 'TPS', [
  {
    name: '总 TPS',
    type: 'line',
    smooth: true,
    showSymbol: timestamps.value.length <= 80,
    data: pointSeries(props.data.totalTps || []),
    itemStyle: { color: '#2563EB' },
    areaStyle: { opacity: 0.08 },
  },
]));

const transactionTpsOption = computed(() => baseOption('', 'TPS', multiSeries(props.data.transactionTps)));
const avgRtOption = computed(() => baseOption('ms', '响应时间(ms)', multiSeries(props.data.avgRt)));
const activeThreadsOption = computed(() => baseOption('', '线程数', multiSeries(props.data.activeThreads)));
</script>

<style scoped>
.trend-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.trend-panel {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  padding: 12px;
}

.trend-title {
  color: var(--color-fg-primary);
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
}

.trend-chart {
  width: 100%;
  height: 320px;
}

@media (max-width: 1200px) {
  .trend-grid {
    grid-template-columns: 1fr;
  }
}
</style>
