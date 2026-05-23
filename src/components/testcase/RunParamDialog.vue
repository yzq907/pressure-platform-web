<template>
  <el-dialog title="压测配置" :model-value="modelValue" width="30%" @update:model-value="emit('update:modelValue', $event)">
    <el-form label-width="90px">
      <el-form-item label="并发数">
        <el-input v-model="form.numThreads" placeholder="并发线程数，如 100"></el-input>
      </el-form-item>
      <el-form-item label="启动时间">
        <el-input v-model="form.rampTime" placeholder="Ramp-Up 秒数，如 10"></el-input>
      </el-form-item>
      <el-form-item label="运行时间">
        <el-input v-model="form.duration" placeholder="持续时间 秒数，如 300"></el-input>
      </el-form-item>
      <el-form-item label="目标区域">
        <el-select v-model="form.region" placeholder="全部区域" @change="emit('region-change')" style="width:100%">
          <el-option key="" label="全部区域" value=""></el-option>
          <el-option v-for="r in regionList" :key="r" :label="r" :value="r"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="压力机数">
        <el-input-number v-model="form.slaveCount" :min="1" :max="maxSlaveCount || 1" :step="1" :disabled="maxSlaveCount < 1"></el-input-number>
        <span v-if="maxSlaveCount > 0" style="margin-left:8px;color:#909399;font-size:12px">可用 {{ maxSlaveCount }} 台</span>
        <span v-else style="margin-left:8px;color:#f56c6c;font-size:12px">该区域暂无可用压力机</span>
      </el-form-item>
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
defineProps<{
  modelValue: boolean;
  form: any;
  regionList: string[];
  maxSlaveCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'region-change'): void;
  (e: 'confirm'): void;
}>();
</script>
