<template>
  <el-drawer :model-value="modelValue" :title="title" :size="'50%'" destroy-on-close @update:model-value="emit('update:modelValue', $event)">
    <el-table :data="reports" stripe size="small" v-loading="loading">
      <el-table-column prop="id" label="编号" width="80" align="center"></el-table-column>
      <el-table-column prop="name" label="名称" align="center"></el-table-column>
      <el-table-column prop="execType" label="类型" align="center" width="90">
        <template #default="scope">
          <span v-if="scope.row.execType === 1" class="state-pill sp-debug">调试</span>
          <span v-else class="state-pill sp-load">执行</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" align="center" width="100">
        <template #default="scope">
          <span v-if="scope.row.status === 0" class="state-pill sp-idle">未开始</span>
          <span v-if="scope.row.status === 1" class="state-pill sp-running"><span class="sp-dot"></span>运行中</span>
          <span v-if="scope.row.status === 2" class="state-pill sp-success">成功</span>
          <span v-if="scope.row.status === 3" class="state-pill sp-error">异常</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="执行时间" align="center" min-width="160"></el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template #default="scope">
          <el-button text type="primary" size="small" :icon="TrendCharts" @click="emit('open-chart', scope.row.id)">曲线</el-button>
        </template>
      </el-table-column>
      <template #empty><el-empty description="暂无历史报告" /></template>
    </el-table>
    <div class="pagination" style="margin-top:16px">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :current-page="page"
        :page-size="size"
        :total="total"
        @current-change="emit('page-change', $event)"
        size="small" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { TrendCharts } from '@element-plus/icons-vue';

defineProps<{
  modelValue: boolean;
  title: string;
  reports: any[];
  loading: boolean;
  page: number;
  size: number;
  total: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'page-change', value: number): void;
  (e: 'open-chart', reportId: number): void;
}>();
</script>
