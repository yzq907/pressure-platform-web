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

      <ThreadGroupRunConfig :items="form.threadGroupOverrides" />
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
import ThreadGroupRunConfig from './ThreadGroupRunConfig.vue';
import type { RunParamForm } from '../../utils/threadGroupRunConfig';

defineProps<{
  modelValue: boolean;
  form: RunParamForm;
  regionList: string[];
  maxSlaveCount: number;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'region-change'): void;
  (e: 'confirm'): void;
}>();

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

}

@media (max-width: 520px) {
  .run-param-grid {
    grid-template-columns: 1fr;
  }

  .slave-count-item {
    grid-column: span 1;
  }

  .queue-policy-item {
    grid-column: span 1;
  }

  .slave-count-control {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
