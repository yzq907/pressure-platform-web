<template>
  <el-dialog :title="title" :model-value="modelValue" width="30%" @update:model-value="emit('update:modelValue', $event)">
    <el-form label-width="70px">
      <el-form-item v-if="mode === 'edit'" label="编号">
        <el-input v-model="form.id" disabled></el-input>
      </el-form-item>
      <el-form-item label="名称">
        <el-input v-model="form.name" placeholder="名称" :disabled="mode === 'edit'"></el-input>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" placeholder="描述"></el-input>
      </el-form-item>
      <el-form-item label="产品线">
        <el-select v-model="form.biz" placeholder="产品线" class="handle-select" filterable allow-create clearable>
          <el-option v-for="item in bizOptions" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="服务">
        <el-select v-model="form.service" placeholder="服务" class="handle-select" filterable allow-create clearable>
          <el-option v-for="item in serviceOptions" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="版本号">
        <el-select v-model="form.version" placeholder="版本号" class="handle-select" filterable allow-create clearable>
          <el-option v-for="item in versionOptions" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-divider content-position="left">压测参数</el-divider>
      <el-form-item label="并发数">
        <el-input v-model="form.numThreads" placeholder="线程数，如 100"></el-input>
      </el-form-item>
      <el-form-item label="启动时间">
        <el-input v-model="form.rampTime" placeholder="Ramp-Up 秒数，如 10"></el-input>
      </el-form-item>
      <el-form-item label="运行时间">
        <el-input v-model="form.duration" placeholder="持续时间 秒数，如 300"></el-input>
      </el-form-item>
      <el-form-item label="超时时间">
        <el-input-number v-model="form.timeoutSeconds" :min="600" :max="86400" :step="60" style="width:100%"></el-input-number>
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
import { computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  mode: 'insert' | 'edit';
  form: any;
  bizOptions: string[];
  serviceOptions: string[];
  versionOptions: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();

const title = computed(() => props.mode === 'insert' ? '新增用例' : '编辑用例');
</script>
