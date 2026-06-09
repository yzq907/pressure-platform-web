<template>
  <section v-if="items?.length" class="thread-group-panel">
    <div class="thread-group-head">
      <span>线程组配置</span>
      <span>禁用的线程组也可在本次执行中启用</span>
    </div>
    <div class="thread-group-list">
      <div
        v-for="item in items"
        :key="item.key || item.name"
        class="thread-group-row"
        :class="{ 'is-disabled': !item.enabled }"
      >
        <div class="thread-group-main">
          <el-switch v-model="item.enabled" size="small"></el-switch>
          <div class="thread-group-name">
            <span :title="item.name">{{ item.name || '-' }}</span>
            <small>{{ typeText(item.type) }}</small>
          </div>
        </div>
        <label class="thread-group-mode-field">
          <span aria-hidden="true"></span>
          <el-select v-model="item.mode" size="small" :disabled="!item.enabled" class="thread-group-mode">
            <el-option label="跟随全局" value="global"></el-option>
            <el-option label="自定义" value="custom"></el-option>
            <el-option label="固定原值" value="fixed"></el-option>
          </el-select>
        </label>
        <div class="thread-group-inputs">
          <label>
            <span>并发</span>
            <el-input v-model="item.numThreads" size="small" :disabled="!item.enabled || item.mode !== 'custom'"></el-input>
          </label>
          <label>
            <span>启动</span>
            <el-input v-model="item.rampTime" size="small" :disabled="!item.enabled || item.mode !== 'custom'"></el-input>
          </label>
          <label>
            <span>Pacing(ms)</span>
            <el-input v-model="item.pacingMs" size="small" :disabled="!item.enabled" placeholder="0"></el-input>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ThreadGroupRunConfigItem } from '../../utils/threadGroupRunConfig';

defineProps<{
  items: ThreadGroupRunConfigItem[];
}>();

const typeText = (type?: string) => {
  const map: Record<string, string> = {
    thread_group: 'Thread Group',
    stepping_thread_group: 'Stepping',
    concurrency_thread_group: 'Concurrency'
  };
  return map[type] || type || 'Thread Group';
};
</script>

<style scoped>
.thread-group-panel {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-top: 4px;
  overflow: hidden;
}

.thread-group-head {
  align-items: center;
  background: #f7f8fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
}

.thread-group-head span:first-child {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.thread-group-head span:last-child {
  color: #909399;
  font-size: 12px;
}

.thread-group-list {
  display: flex;
  flex-direction: column;
}

.thread-group-row {
  align-items: center;
  border-bottom: 1px solid #ebeef5;
  display: grid;
  grid-template-columns: minmax(180px, 1.2fr) 126px minmax(420px, 2fr);
  gap: 12px;
  min-width: 0;
  padding: 10px 12px;
}

.thread-group-row:last-child {
  border-bottom: 0;
}

.thread-group-row.is-disabled {
  background: #fafafa;
}

.thread-group-main {
  align-items: center;
  display: flex;
  gap: 10px;
  min-width: 0;
}

.thread-group-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.thread-group-name span {
  color: #303133;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-group-name small {
  color: #909399;
  font-size: 12px;
  line-height: 16px;
}

.thread-group-mode-field,
.thread-group-inputs label {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.thread-group-mode {
  width: 100%;
}

.thread-group-mode-field > span,
.thread-group-inputs span {
  color: #909399;
  font-size: 12px;
  line-height: 14px;
  min-height: 14px;
}

.thread-group-inputs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}

@media (max-width: 760px) {
  .thread-group-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 520px) {
  .thread-group-inputs {
    grid-template-columns: 1fr;
  }

  .thread-group-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
