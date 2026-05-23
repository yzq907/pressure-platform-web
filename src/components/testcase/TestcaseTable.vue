<template>
  <el-table :data="rows" stripe class="table" ref="multipleTable" v-loading="loading">
    <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
    <el-table-column prop="name" label="名称" align="center"></el-table-column>
    <el-table-column prop="description" label="描述" align="center"></el-table-column>
    <el-table-column prop="biz" label="产品" align="center"></el-table-column>
    <el-table-column prop="service" label="服务" align="center"></el-table-column>
    <el-table-column prop="version" label="版本" align="center"></el-table-column>
    <el-table-column prop="status" label="状态" align="center">
      <template #default="scope">
        <span v-if="scope.row.status === 0" class="state-pill sp-idle"><span class="sp-dot"></span>没有执行</span>
        <span v-if="scope.row.status === 1" class="state-pill sp-running"><span class="sp-dot"></span>正在执行</span>
        <span v-if="scope.row.status === 2" class="state-pill sp-success"><span class="sp-dot"></span>执行成功</span>
        <span v-if="scope.row.status === 3" class="state-pill sp-error"><span class="sp-dot"></span>执行异常</span>
        <span v-if="scope.row.status === 4" class="state-pill sp-waiting"><span class="sp-dot"></span>排队等待</span>
        <span v-if="scope.row.status === 5" class="state-pill sp-idle"><span class="sp-dot"></span>排队取消</span>
      </template>
    </el-table-column>
    <el-table-column prop="creator" label="创建人" align="center"></el-table-column>
    <el-table-column prop="createTime" label="创建时间" align="center"></el-table-column>
    <el-table-column prop="modifier" label="修改人" align="center"></el-table-column>
    <el-table-column prop="modifyTime" label="修改时间" align="center"></el-table-column>
    <el-table-column label="操作" width="200" align="right">
      <template #default="scope">
        <div class="action-group">
          <el-button text :icon="Search" type="primary" @click="emit('detail', scope.row.id)" v-permiss="1">详情</el-button>
          <el-button text :icon="Edit" type="primary" @click="emit('edit', scope.row)" v-permiss="1">编辑</el-button>
        </div>
        <div class="action-group">
          <el-button text :icon="Plus" type="primary" @click="emit('reports', scope.row.id)" v-permiss="1">报告</el-button>
          <el-button text :icon="Timer" type="primary" @click="emit('history', scope.row.id, scope.row.name)" v-permiss="1">历史</el-button>
        </div>
        <div class="action-group">
          <el-dropdown trigger="click">
            <el-button text :icon="Right" type="primary" v-permiss="1">执行</el-button>
            <template #dropdown>
              <el-dropdown-menu class="horizontal-dropdown-menu">
                <el-dropdown-item class="dropdown-button" @click="emit('debug', scope.row.id)">
                  <span class="state-pill sp-debug">调试</span>
                </el-dropdown-item>
                <el-dropdown-item class="dropdown-button" @click="emit('run', scope.row)">
                  <span class="state-pill sp-load">压测</span>
                </el-dropdown-item>
                <el-dropdown-item class="dropdown-button" @click="emit('schedule', scope.row)">
                  <span class="state-pill sp-success">定时压测</span>
                </el-dropdown-item>
                <el-dropdown-item class="dropdown-button" @click="emit('stop', scope.row.id)">
                  <span class="state-pill sp-error">停止</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button text :icon="Delete" type="danger" @click="emit('delete', scope.row.id)" v-permiss="1">删除</el-button>
        </div>
      </template>
    </el-table-column>
    <template #empty><el-empty description="暂无用例数据" /></template>
  </el-table>
</template>

<script setup lang="ts">
import { Delete, Edit, Plus, Right, Search, Timer } from '@element-plus/icons-vue';

defineProps<{
  rows: any[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'detail', id: number): void;
  (e: 'edit', row: any): void;
  (e: 'reports', id: number): void;
  (e: 'history', id: number, name: string): void;
  (e: 'debug', id: number): void;
  (e: 'run', row: any): void;
  (e: 'schedule', row: any): void;
  (e: 'stop', id: number): void;
  (e: 'delete', id: number): void;
}>();
</script>

<style scoped>
.horizontal-dropdown-menu {
  display: flex;
  flex-direction: row;
  padding: 6px;
  gap: 4px;
}
.horizontal-dropdown-menu .el-dropdown-item {
  padding: 4px 10px;
  border-radius: var(--radius-md);
}
.horizontal-dropdown-menu .el-dropdown-item:hover {
  background: var(--color-bg-muted);
}
.action-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 2px;
}
.action-group:last-child {
  margin-bottom: 0;
}
.action-group :deep(.el-button) {
  justify-content: center;
  padding: 4px 0 !important;
  font-size: 13px;
  height: 28px;
  width: 100% !important;
  margin: 0 !important;
}
.action-group .el-dropdown {
  width: 100%;
}
</style>
