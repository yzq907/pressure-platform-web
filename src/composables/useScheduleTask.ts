import { reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getEnableSlaveCount, getRegions } from '../api/node';
import { addScheduledTask } from '../api/scheduledTask';
import { getRunThreadGroups } from '../api/testcase';
import {
  buildThreadGroupOverridePayload,
  createThreadGroupOverrideRows,
  findInvalidThreadGroupPacing,
  type ScheduleData,
  type ScheduleTaskForm,
  type TestcaseRunSource
} from '../utils/threadGroupRunConfig';

interface UseScheduleTaskOptions {
  maxSlaveCount: Ref<number>;
  regionList: Ref<string[]>;
  refresh: () => Promise<unknown>;
}

export const useScheduleTask = ({ maxSlaveCount, regionList, refresh }: UseScheduleTaskOptions) => {
  const scheduleVisible = ref(false);
  const scheduleForm = reactive<ScheduleTaskForm>({
    id: null,
    testCaseId: null,
    scheduleType: 'once',
    onceDateTime: '',
    dailyTime: '',
    weeklyTime: '',
    daysOfWeek: [] as number[],
    monthlyTime: '',
    dayOfMonth: 1,
    runParam: {
      numThreads: '10',
      rampTime: '0',
      duration: '60',
      slaveCount: 1,
      region: '',
      threadGroupOverrides: []
    }
  });

  const onScheduleRegionChange = async () => {
    scheduleForm.runParam.slaveCount = 1;
    try {
      const res = await getEnableSlaveCount(scheduleForm.runParam.region || undefined);
      if (res.data.code === 0) {
        maxSlaveCount.value = res.data.data || 0;
      }
    } catch { /* ignore */ }
  };

  const openScheduleDialog = async (row: TestcaseRunSource) => {
    scheduleForm.id = null;
    scheduleForm.testCaseId = row.id;
    scheduleForm.scheduleType = 'once';
    scheduleForm.onceDateTime = '';
    scheduleForm.dailyTime = '';
    scheduleForm.weeklyTime = '';
    scheduleForm.daysOfWeek = [];
    scheduleForm.monthlyTime = '';
    scheduleForm.dayOfMonth = 1;
    scheduleForm.runParam.numThreads = row.numThreads || '10';
    scheduleForm.runParam.rampTime = row.rampTime || '0';
    scheduleForm.runParam.duration = row.duration || '60';
    scheduleForm.runParam.slaveCount = 1;
    scheduleForm.runParam.region = '';
    scheduleForm.runParam.threadGroupOverrides = [];
    try {
      const [regionRes, countRes, threadGroupRes] = await Promise.all([
        getRegions(),
        getEnableSlaveCount(),
        getRunThreadGroups(row.id)
      ]);
      if (regionRes.data.code === 0) regionList.value = regionRes.data.data;
      if (countRes.data.code === 0) maxSlaveCount.value = countRes.data.data || 0;
      if (threadGroupRes.data.code === 0) {
        scheduleForm.runParam.threadGroupOverrides = createThreadGroupOverrideRows(
          threadGroupRes.data.data || [],
          scheduleForm.runParam.numThreads,
          scheduleForm.runParam.rampTime
        );
      }
    } catch { /* ignore */ }
    scheduleVisible.value = true;
  };

  const confirmSchedule = async () => {
    if (maxSlaveCount.value < 1 && scheduleForm.runParam.region) {
      ElMessage.error('所选区域暂无可用压力机，无法创建定时任务'); return;
    }
    const invalidSchedulePacing = findInvalidThreadGroupPacing(scheduleForm.runParam.threadGroupOverrides);
    if (invalidSchedulePacing) {
      ElMessage.error(`Pacing必须大于等于0：${invalidSchedulePacing.name || ''}`); return;
    }
    let scheduleData: ScheduleData | null = null;
    if (scheduleForm.scheduleType === 'once') {
      if (!scheduleForm.onceDateTime) { ElMessage.error('请选择执行时间'); return; }
      scheduleData = { time: scheduleForm.onceDateTime };
    } else if (scheduleForm.scheduleType === 'daily') {
      if (!scheduleForm.dailyTime) { ElMessage.error('请选择执行时间'); return; }
      scheduleData = { time: scheduleForm.dailyTime };
    } else if (scheduleForm.scheduleType === 'weekly') {
      if (!scheduleForm.weeklyTime) { ElMessage.error('请选择执行时间'); return; }
      if (scheduleForm.daysOfWeek.length === 0) { ElMessage.error('请选择执行日'); return; }
      scheduleData = { time: scheduleForm.weeklyTime, daysOfWeek: scheduleForm.daysOfWeek };
    } else if (scheduleForm.scheduleType === 'monthly') {
      if (!scheduleForm.monthlyTime) { ElMessage.error('请选择执行时间'); return; }
      scheduleData = { time: scheduleForm.monthlyTime, dayOfMonth: scheduleForm.dayOfMonth };
    }
    const body = {
      testCaseId: scheduleForm.testCaseId,
      scheduleType: scheduleForm.scheduleType,
      scheduleData,
      runParam: {
        numThreads: scheduleForm.runParam.numThreads,
        rampTime: scheduleForm.runParam.rampTime,
        duration: scheduleForm.runParam.duration,
        slaveCount: scheduleForm.runParam.slaveCount,
        region: scheduleForm.runParam.region,
        threadGroupOverrides: buildThreadGroupOverridePayload(scheduleForm.runParam.threadGroupOverrides)
      }
    };
    const res = await addScheduledTask(body);
    if (res.data.code !== 0) {
      ElMessage.error(res.data.message);
    } else {
      ElMessage.success('定时任务创建成功');
      scheduleVisible.value = false;
      await refresh();
    }
  };

  return {
    scheduleVisible,
    scheduleForm,
    onScheduleRegionChange,
    openScheduleDialog,
    confirmSchedule
  };
};
