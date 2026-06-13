<template>
  <el-dialog
      title="定时压测"
      :model-value="modelValue"
      width="min(920px, calc(100vw - 32px))"
      @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form label-position="top" class="schedule-task-form">
      <el-form-item label="执行方式">
        <el-radio-group v-model="form.scheduleType">
          <el-radio label="once">仅执行一次</el-radio>
          <el-radio label="daily">每日</el-radio>
          <el-radio label="weekly">每周</el-radio>
          <el-radio label="monthly">每月</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.scheduleType === 'once'" label="执行时间">
        <el-date-picker
          v-model="form.onceDateTime"
          type="datetime"
          placeholder="选择日期时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width:100%">
        </el-date-picker>
      </el-form-item>
      <el-form-item v-if="form.scheduleType === 'daily'" label="执行时间">
        <el-time-picker
          v-model="form.dailyTime"
          placeholder="选择时间"
          format="HH:mm"
          value-format="HH:mm"
          style="width:100%">
        </el-time-picker>
      </el-form-item>
      <template v-if="form.scheduleType === 'weekly'">
        <el-form-item label="执行时间">
          <el-time-picker
            v-model="form.weeklyTime"
            placeholder="选择时间"
            format="HH:mm"
            value-format="HH:mm"
            style="width:100%">
          </el-time-picker>
        </el-form-item>
        <el-form-item label="执行日">
          <el-checkbox-group v-model="form.daysOfWeek">
            <el-checkbox :label="1">周一</el-checkbox>
            <el-checkbox :label="2">周二</el-checkbox>
            <el-checkbox :label="3">周三</el-checkbox>
            <el-checkbox :label="4">周四</el-checkbox>
            <el-checkbox :label="5">周五</el-checkbox>
            <el-checkbox :label="6">周六</el-checkbox>
            <el-checkbox :label="7">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </template>
      <template v-if="form.scheduleType === 'monthly'">
        <el-form-item label="执行时间">
          <el-time-picker
            v-model="form.monthlyTime"
            placeholder="选择时间"
            format="HH:mm"
            value-format="HH:mm"
            style="width:100%">
          </el-time-picker>
        </el-form-item>
        <el-form-item label="每月日">
          <el-input-number v-model="form.dayOfMonth" :min="1" :max="28" :step="1" step-strictly></el-input-number>
          <span style="margin-left:8px;color:#909399;font-size:12px">建议1-28日以确保每月都可执行</span>
        </el-form-item>
      </template>
      <el-divider content-position="left">压测参数</el-divider>
      <div class="schedule-param-grid">
        <el-form-item label="任务名称" class="task-name-item">
          <el-input v-model="form.runParam.taskName" maxlength="255" show-word-limit placeholder="例如：登录接口-100并发-定时巡检"></el-input>
        </el-form-item>
        <el-form-item label="并发数">
          <el-input v-model="form.runParam.numThreads" placeholder="并发线程数，如 100"></el-input>
        </el-form-item>
        <el-form-item label="启动时间">
          <el-input v-model="form.runParam.rampTime" placeholder="Ramp-Up 秒数，如 10"></el-input>
        </el-form-item>
        <el-form-item label="运行时间">
          <el-input v-model="form.runParam.duration" placeholder="持续时间 秒数，如 300"></el-input>
        </el-form-item>
        <el-form-item label="目标区域">
          <el-select v-model="form.runParam.region" placeholder="全部区域" @change="emit('region-change')" style="width:100%">
            <el-option key="" label="全部区域" value=""></el-option>
            <el-option v-for="r in regionList" :key="r" :label="r" :value="r"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="压力机数" class="slave-count-item">
          <div class="slave-count-control">
            <el-input-number v-model="form.runParam.slaveCount" :min="1" :max="maxSlaveCount || 1" :step="1" :disabled="maxSlaveCount < 1"></el-input-number>
            <span v-if="maxSlaveCount > 0" class="slave-count-tip">可用 {{ maxSlaveCount }} 台</span>
            <span v-else class="slave-count-tip is-empty">该区域暂无可用压力机</span>
          </div>
        </el-form-item>
      </div>
      <ThreadGroupRunConfig :items="form.runParam.threadGroupOverrides" />
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:modelValue', false)">取 消</el-button>
        <el-button type="primary" @click="emit('confirm')">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import ThreadGroupRunConfig from './ThreadGroupRunConfig.vue';
import type { ScheduleTaskForm } from '../../utils/threadGroupRunConfig';

defineProps<{
  modelValue: boolean;
  form: ScheduleTaskForm;
  regionList: string[];
  maxSlaveCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'region-change'): void;
  (e: 'confirm'): void;
}>();
</script>

<style scoped>
.schedule-task-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.schedule-task-form :deep(.el-form-item__label) {
  color: #606266;
  font-weight: 500;
  line-height: 18px;
  padding-bottom: 6px;
}

.schedule-param-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px 16px;
}

.task-name-item {
  grid-column: span 3;
}

.slave-count-item {
  grid-column: span 2;
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
  .schedule-param-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .task-name-item {
    grid-column: span 2;
  }
}

@media (max-width: 520px) {
  .schedule-param-grid {
    grid-template-columns: 1fr;
  }

  .slave-count-item {
    grid-column: span 1;
  }

  .task-name-item {
    grid-column: span 1;
  }

  .slave-count-control {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
