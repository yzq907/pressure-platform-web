<template>
  <div class="resource-chart-grid">
    <div class="chart-panel">
      <div class="chart-title">CPU 使用率 / Load</div>
      <v-chart class="chart" :option="cpuLoadOption" autoresize />
    </div>
    <div class="chart-panel">
      <div class="chart-title">内存使用率</div>
      <v-chart class="chart" :option="memoryOption" autoresize />
    </div>
    <div class="chart-panel">
      <div class="chart-title">网络 IO</div>
      <v-chart class="chart" :option="networkOption" autoresize />
    </div>
    <div class="chart-panel">
      <div class="chart-title">磁盘 IO</div>
      <v-chart class="chart" :option="diskOption" autoresize />
    </div>
    <div class="chart-panel full">
      <div class="chart-title">JVM / GC</div>
      <v-chart class="chart" :option="gcOption" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  DataZoomComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, LineChart, GridComponent, LegendComponent, TooltipComponent, DataZoomComponent]);

interface ResourceMetricPoint {
  timestamp: string;
  timestampMs: number;
  value: number | null;
}

interface ResourceMetricSeries {
  cpu?: ResourceMetricPoint[];
  memory?: ResourceMetricPoint[];
  load?: ResourceMetricPoint[];
  networkIn?: ResourceMetricPoint[];
  networkOut?: ResourceMetricPoint[];
  diskRead?: ResourceMetricPoint[];
  diskWrite?: ResourceMetricPoint[];
  diskUtil?: ResourceMetricPoint[];
  gc?: ResourceMetricPoint[];
}

const props = defineProps<{
  series: ResourceMetricSeries;
}>();

const labels = computed(() => {
  const items = Object.values(props.series || {}).flat() as ResourceMetricPoint[];
  const sorted = [...items].sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0));
  const seen = new Set<string>();
  return sorted
    .map((item) => item.timestamp)
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
});

const valuesByLabel = (items: ResourceMetricPoint[] = []) => {
  const valueMap = new Map(items.map((item) => [item.timestamp, item.value]));
  return labels.value.map((label) => valueMap.get(label) ?? null);
};

const convertValues = (values: Array<number | null>, convert: (value: number) => number) => {
  return values.map((value) => value === null ? null : Number(convert(value).toFixed(2)));
};

const bytesPerSecondToMegabits = (value: number) => value * 8 / 1000 / 1000;
const bytesPerSecondToMegabytes = (value: number) => value / 1000 / 1000;

const baseOption = (legend: string[], series: any[], yName = '') => ({
  tooltip: { trigger: 'axis' },
  legend: { data: legend, top: 0 },
  grid: { left: '4%', right: '4%', bottom: '16%', top: '16%', containLabel: true },
  dataZoom: [{ type: 'inside', start: 0, end: 100 }],
  xAxis: { type: 'category', boundaryGap: false, data: labels.value },
  yAxis: { type: 'value', name: yName },
  series,
});

const line = (name: string, data: Array<number | null>, color: string) => ({
  name,
  type: 'line',
  smooth: true,
  showSymbol: false,
  connectNulls: false,
  data,
  itemStyle: { color },
});

const lineWithAxis = (name: string, data: Array<number | null>, color: string, yAxisIndex: number) => ({
  ...line(name, data, color),
  yAxisIndex,
});

const cpuLoadOption = computed(() => baseOption(
  ['CPU %', 'Load1'],
  [
    line('CPU %', valuesByLabel(props.series.cpu), '#2563EB'),
    line('Load1', valuesByLabel(props.series.load), '#F59E0B'),
  ],
));

const memoryOption = computed(() => baseOption(
  ['Memory %'],
  [line('Memory %', valuesByLabel(props.series.memory), '#10B981')],
));

const networkOption = computed(() => baseOption(
  ['In Mb/s', 'Out Mb/s'],
  [
    line('In Mb/s', convertValues(valuesByLabel(props.series.networkIn), bytesPerSecondToMegabits), '#3B82F6'),
    line('Out Mb/s', convertValues(valuesByLabel(props.series.networkOut), bytesPerSecondToMegabits), '#8B5CF6'),
  ],
  'Mb/s',
));

const diskOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['Read MB/s', 'Write MB/s', 'I/O Util %'], top: 0 },
  grid: { left: '4%', right: '5%', bottom: '16%', top: '16%', containLabel: true },
  dataZoom: [{ type: 'inside', start: 0, end: 100 }],
  xAxis: { type: 'category', boundaryGap: false, data: labels.value },
  yAxis: [
    { type: 'value', name: 'MB/s' },
    { type: 'value', name: '%', min: 0, max: 100 },
  ],
  series: [
    lineWithAxis('Read MB/s', convertValues(valuesByLabel(props.series.diskRead), bytesPerSecondToMegabytes), '#0EA5E9', 0),
    lineWithAxis('Write MB/s', convertValues(valuesByLabel(props.series.diskWrite), bytesPerSecondToMegabytes), '#EF4444', 0),
    lineWithAxis('I/O Util %', valuesByLabel(props.series.diskUtil), '#F59E0B', 1),
  ],
}));

const gcOption = computed(() => baseOption(
  ['GC pause'],
  [line('GC pause', valuesByLabel(props.series.gc), '#F97316')],
  'seconds/s',
));
</script>

<style scoped>
.resource-chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.chart-panel {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-elevated);
}
.chart-panel.full {
  grid-column: 1 / -1;
}
.chart-title {
  font-weight: 600;
  color: var(--color-fg-primary);
  margin-bottom: 8px;
}
.chart {
  width: 100%;
  height: 280px;
}
@media (max-width: 900px) {
  .resource-chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
