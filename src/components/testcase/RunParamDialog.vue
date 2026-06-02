<template>
  <el-dialog
      title="压测配置"
      :model-value="modelValue"
      width="min(920px, calc(100vw - 32px))"
      class="run-param-dialog"
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
      @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form label-position="top" class="run-param-form">
      <div class="run-param-grid">
        <el-form-item label="并发数">
          <el-input v-model="form.numThreads" placeholder="如 100"></el-input>
        </el-form-item>
        <el-form-item label="启动时间">
          <el-input v-model="form.rampTime" placeholder="Ramp-Up 秒数"></el-input>
        </el-form-item>
        <el-form-item label="运行时间">
          <el-input v-model="form.duration" placeholder="持续时间 秒"></el-input>
        </el-form-item>
        <el-form-item label="目标区域">
          <el-select v-model="form.region" placeholder="全部区域" @change="emit('region-change')" style="width:100%">
            <el-option key="" label="全部区域" value=""></el-option>
            <el-option v-for="r in regionList" :key="r" :label="r" :value="r"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="压力机数" class="slave-count-item">
          <div class="slave-count-control">
            <el-input-number v-model="form.slaveCount" :min="1" :max="maxSlaveCount || 1" :step="1" :disabled="maxSlaveCount < 1"></el-input-number>
            <span v-if="maxSlaveCount > 0" class="slave-count-tip">可用 {{ maxSlaveCount }} 台</span>
            <span v-else class="slave-count-tip is-empty">该区域暂无可用压力机</span>
          </div>
        </el-form-item>
        <el-form-item label="压力机不足时" class="queue-policy-item">
          <el-radio-group v-model="form.queuePolicy" class="queue-policy-group">
            <el-radio-button label="fail_fast">直接失败</el-radio-button>
            <el-radio-button label="queue_when_no_slave">进入队列</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </div>

      <section v-if="form.threadGroupOverrides?.length" class="thread-group-panel">
        <div class="thread-group-head">
          <span>线程组配置</span>
          <span>禁用的线程组也可在本次执行中启用</span>
        </div>
        <div class="thread-group-list">
          <div
              v-for="item in form.threadGroupOverrides"
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
            <el-select v-model="item.mode" size="small" :disabled="!item.enabled" class="thread-group-mode">
              <el-option label="跟随全局" value="global"></el-option>
              <el-option label="自定义" value="custom"></el-option>
              <el-option label="固定原值" value="fixed"></el-option>
            </el-select>
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
                <span>运行</span>
                <el-input v-model="item.duration" size="small" :disabled="!item.enabled || item.mode !== 'custom'"></el-input>
              </label>
            </div>
          </div>
        </div>
      </section>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button :disabled="submitting" @click="emit('update:modelValue', false)">取 消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="submitting" @click="emit('confirm')">
          {{ submitting ? '启动中' : '确 定' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  form: any;
  regionList: string[];
  maxSlaveCount: number;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'region-change'): void;
  (e: 'confirm'): void;
}>();

const typeText = (type: string) => {
  const map: Record<string, string> = {
    thread_group: 'Thread Group',
    stepping_thread_group: 'Stepping',
    concurrency_thread_group: 'Concurrency'
  };
  return map[type] || type || 'Thread Group';
};
</script>

<style scoped>
.run-param-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.run-param-form :deep(.el-form-item__label) {
  color: #606266;
  font-weight: 500;
  line-height: 18px;
  padding-bottom: 6px;
}

.run-param-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px 16px;
}

.slave-count-item {
  grid-column: span 2;
}

.queue-policy-item {
  grid-column: span 3;
}

.queue-policy-group {
  width: 100%;
}

.slave-count-control {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.slave-count-tip {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

.slave-count-tip.is-empty {
  color: #e6a23c;
}

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
  grid-template-columns: minmax(180px, 1.4fr) 126px minmax(280px, 1.5fr);
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

.thread-group-mode {
  width: 100%;
}

.thread-group-inputs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}

.thread-group-inputs label {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.thread-group-inputs span {
  color: #909399;
  font-size: 12px;
  line-height: 14px;
}

.dialog-footer {
  display: inline-flex;
  gap: 8px;
}

@media (max-width: 760px) {
  .run-param-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .slave-count-item {
    grid-column: span 2;
  }

  .queue-policy-item {
    grid-column: span 2;
  }

  .thread-group-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 520px) {
  .run-param-grid,
  .thread-group-inputs {
    grid-template-columns: 1fr;
  }

  .slave-count-item {
    grid-column: span 1;
  }

  .queue-policy-item {
    grid-column: span 1;
  }

  .slave-count-control,
  .thread-group-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
