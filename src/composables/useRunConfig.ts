import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getEnableSlaveCount, getRegions } from '../api/node';
import { getRunThreadGroups, startTestCase } from '../api/testcase';
import {
  buildThreadGroupOverridePayload,
  createThreadGroupOverrideRows,
  findInvalidThreadGroupPacing,
  type RunParamForm,
  type TestcaseRunSource
} from '../utils/threadGroupRunConfig';

interface UseRunConfigOptions {
  refresh: () => Promise<unknown>;
}

export const useRunConfig = ({ refresh }: UseRunConfigOptions) => {
  const runVisible = ref(false);
  const runSubmitting = ref(false);
  const maxSlaveCount = ref(1);
  const regionList = ref<string[]>([]);
  const runForm = reactive<RunParamForm>({
    id: null,
    numThreads: '10',
    rampTime: '0',
    duration: '60',
    slaveCount: 1,
    region: '',
    queuePolicy: 'fail_fast',
    threadGroupOverrides: []
  });

  const fetchSlaveCount = async () => {
    try {
      const res = await getEnableSlaveCount(runForm.region || undefined);
      if (res.data.code === 0) {
        maxSlaveCount.value = res.data.data || 0;
      }
    } catch { /* ignore */ }
  };

  const onRegionChange = () => {
    runForm.slaveCount = 1;
    fetchSlaveCount();
  };

  const openRunDialog = async (row: TestcaseRunSource) => {
    if (runSubmitting.value) return;
    runForm.id = row.id;
    runForm.numThreads = row.numThreads || '10';
    runForm.rampTime = row.rampTime || '0';
    runForm.duration = row.duration || '60';
    runForm.slaveCount = 1;
    runForm.region = '';
    runForm.queuePolicy = 'fail_fast';
    runForm.threadGroupOverrides = [];
    try {
      const [regionRes, countRes, threadGroupRes] = await Promise.all([
        getRegions(),
        getEnableSlaveCount(),
        getRunThreadGroups(row.id)
      ]);
      if (regionRes.data.code === 0) regionList.value = regionRes.data.data;
      if (countRes.data.code === 0) maxSlaveCount.value = countRes.data.data || 0;
      if (threadGroupRes.data.code === 0) {
        runForm.threadGroupOverrides = createThreadGroupOverrideRows(
          threadGroupRes.data.data || [],
          runForm.numThreads,
          runForm.rampTime
        );
      }
    } catch { /* ignore */ }
    runVisible.value = true;
  };

  const confirmRun = async () => {
    if (runSubmitting.value || runForm.id === null) return;
    if (maxSlaveCount.value < 1 && runForm.region && runForm.queuePolicy !== 'queue_when_no_slave') {
      ElMessage.error('所选区域暂无可用压力机，无法执行'); return;
    }
    const invalidPacing = findInvalidThreadGroupPacing(runForm.threadGroupOverrides);
    if (invalidPacing) {
      ElMessage.error(`Pacing必须大于等于0：${invalidPacing.name || ''}`); return;
    }
    runSubmitting.value = true;
    try {
      const res = await startTestCase(runForm.id, {
        numThreads: runForm.numThreads,
        rampTime: runForm.rampTime,
        duration: runForm.duration,
        slaveCount: runForm.slaveCount,
        region: runForm.region,
        queuePolicy: runForm.queuePolicy,
        threadGroupOverrides: buildThreadGroupOverridePayload(runForm.threadGroupOverrides)
      });
      const code = res.data.code;
      if (code != 0) {
        ElMessage.error(res.data.message);
      } else {
        ElMessage.success(runForm.queuePolicy === 'queue_when_no_slave' && maxSlaveCount.value < runForm.slaveCount ? '已提交到执行队列' : '启动压测成功');
        runVisible.value = false;
        await refresh();
      }
    } finally {
      runSubmitting.value = false;
    }
  };

  return {
    runVisible,
    runSubmitting,
    maxSlaveCount,
    regionList,
    runForm,
    onRegionChange,
    openRunDialog,
    confirmRun
  };
};
