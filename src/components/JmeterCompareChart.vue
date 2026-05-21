<template>
  <v-chart class="chart" :option="chartOption" autoresize />
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

interface MetricsItem {
  timestamp: string;
  qps: number;
  avgRt: number;
  p99Rt: number;
  errorRate: number;
  threads: number;
}

const props = defineProps<{
  baseData: MetricsItem[];
  targetData: MetricsItem[];
  baseName: string;
  targetName: string;
}>();

const chartOption = computed(() => {
  // 收集所有时间戳并排序
  const allTimestamps = Array.from(
    new Set([...props.baseData.map((d) => d.timestamp), ...props.targetData.map((d) => d.timestamp)])
  ).sort((a, b) => {
    const parse = (s: string) => {
      const m = s.match(/(\d+)s/);
      return m ? parseInt(m[1], 10) : 0;
    };
    return parse(a) - parse(b);
  });

  const baseMap = new Map(props.baseData.map((d) => [d.timestamp, d]));
  const targetMap = new Map(props.targetData.map((d) => [d.timestamp, d]));

  const getValue = (map: Map<string, MetricsItem>, ts: string, key: keyof MetricsItem) => {
    const item = map.get(ts);
    return item ? (item as any)[key] : null;
  };

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: [
        `${props.baseName} QPS`,
        `${props.targetName} QPS`,
        `${props.baseName} 平均RT`,
        `${props.targetName} 平均RT`,
        `${props.baseName} 错误率`,
        `${props.targetName} 错误率`,
      ],
      top: 0,
      textStyle: { fontSize: 11 },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '14%',
      containLabel: true,
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, bottom: 0 },
    ],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: allTimestamps,
    },
    yAxis: [
      {
        type: 'value',
        name: 'QPS',
        position: 'left',
      },
      {
        type: 'value',
        name: 'RT(ms) / 错误率(%)',
        position: 'right',
      },
    ],
    series: [
      // QPS
      {
        name: `${props.baseName} QPS`,
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        data: allTimestamps.map((ts) => getValue(baseMap, ts, 'qps')),
        itemStyle: { color: '#3B82F6' },
        lineStyle: { type: 'solid' },
      },
      {
        name: `${props.targetName} QPS`,
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        data: allTimestamps.map((ts) => getValue(targetMap, ts, 'qps')),
        itemStyle: { color: '#F97316' },
        lineStyle: { type: 'dashed' },
      },
      // avgRT
      {
        name: `${props.baseName} 平均RT`,
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: allTimestamps.map((ts) => getValue(baseMap, ts, 'avgRt')),
        itemStyle: { color: '#10B981' },
        lineStyle: { type: 'solid' },
      },
      {
        name: `${props.targetName} 平均RT`,
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: allTimestamps.map((ts) => getValue(targetMap, ts, 'avgRt')),
        itemStyle: { color: '#84CC16' },
        lineStyle: { type: 'dashed' },
      },
      // errorRate
      {
        name: `${props.baseName} 错误率`,
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: allTimestamps.map((ts) => getValue(baseMap, ts, 'errorRate')),
        itemStyle: { color: '#EF4444' },
        lineStyle: { type: 'solid' },
      },
      {
        name: `${props.targetName} 错误率`,
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: allTimestamps.map((ts) => getValue(targetMap, ts, 'errorRate')),
        itemStyle: { color: '#F43F5E' },
        lineStyle: { type: 'dashed' },
      },
    ],
  };
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: 480px;
}
</style>
