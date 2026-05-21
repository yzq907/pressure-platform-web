<template>
  <div class="container">
    <!-- Search -->
    <div class="handle-box">
      <el-input v-model="query.region" placeholder="区域" class="handle-input" style="width:150px" clearable />
      <el-input v-model="query.name" placeholder="用例名称" class="handle-input" style="width:180px" clearable />
      <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      <span class="auto-refresh">
        <span class="live-dot running"></span>每 5s 自动刷新
      </span>
    </div>

    <!-- Table -->
    <el-table :data="tableData" stripe class="table" ref="multipleTable" size="medium">
      <el-table-column label="编号" width="80" align="center">
        <template #default="{ row }">
          <span :class="row.rowType === 'report' ? 'id-tag running' : 'id-tag scheduled'">
            {{ row.id }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="testCaseId" label="用例" min-width="130" align="center">
        <template #default="{ row }">
          {{ testcaseNameMap[row.testCaseId] || row.testCaseId }}
        </template>
      </el-table-column>
      <el-table-column prop="region" label="区域" align="center" width="90">
        <template #default="{ row }">
          <code v-if="row.region" class="region-mono">{{ row.region }}</code>
          <span v-else style="color:var(--color-fg-tertiary);font-size:12px">全部</span>
        </template>
      </el-table-column>
      <el-table-column prop="rowType" label="类型" align="center" width="100">
        <template #default="{ row }">
          <template v-if="row.rowType === 'report'">
            <span v-if="row.execType === 1" class="state-pill sp-debug">调试</span>
            <span v-else class="state-pill sp-load">执行</span>
          </template>
          <template v-else>
            <span v-if="row.scheduleType === 'once'" class="state-pill sp-success">仅一次</span>
            <span v-else-if="row.scheduleType === 'daily'" class="state-pill sp-waiting">每日</span>
            <span v-else-if="row.scheduleType === 'weekly'" class="state-pill sp-load">每周</span>
            <span v-else class="state-pill sp-idle">每月</span>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" align="center" width="110">
        <template #default="{ row }">
          <template v-if="row.rowType === 'report'">
            <span class="state-pill sp-running"><span class="sp-dot"></span>运行中</span>
          </template>
          <template v-else>
            <span class="state-pill sp-waiting"><span class="sp-dot"></span>等待中</span>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="runTime" label="执行时间" align="center" min-width="160"></el-table-column>
      <el-table-column label="操作" width="260" align="right">
        <template #default="{ row }">
          <div class="action-group">
            <template v-if="row.rowType === 'report'">
              <el-button text type="danger" size="small" :icon="Close" @click="handleStop(row.reportId)">停止</el-button>
              <el-button v-if="row.execType === 2" text type="primary" size="small" :icon="TrendCharts" @click="openChartDialog(row.reportId)">曲线</el-button>
            </template>
            <template v-else>
              <el-button text type="success" size="small" :icon="VideoPlay" @click="handleTriggerNow(row.scheduleId)">立即执行</el-button>
              <el-button text type="primary" size="small" :icon="Edit" @click="openScheduleEdit(row)">编辑</el-button>
              <el-button text type="danger" size="small" :icon="Delete" @click="handleDeleteSchedule(row.scheduleId)">删除</el-button>
            </template>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next"
        :current-page="query.page" :page-size="query.size" :total="total"
        @current-change="handlePageChange" size="small" />
    </div>

    <!-- Schedule Edit Dialog -->
    <el-dialog title="编辑定时任务" v-model="scheduleVisible" width="540px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="执行方式">
          <el-radio-group v-model="scheduleForm.scheduleType">
            <el-radio-button label="once">仅执行一次</el-radio-button>
            <el-radio-button label="daily">每日</el-radio-button>
            <el-radio-button label="weekly">每周</el-radio-button>
            <el-radio-button label="monthly">每月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="scheduleForm.scheduleType === 'once'" label="执行时间">
          <el-date-picker v-model="scheduleForm.onceDateTime" type="datetime" placeholder="选择日期时间" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="scheduleForm.scheduleType === 'daily'" label="执行时间">
          <el-time-picker v-model="scheduleForm.dailyTime" placeholder="选择时间" format="HH:mm" value-format="HH:mm" style="width:100%" />
        </el-form-item>
        <template v-if="scheduleForm.scheduleType === 'weekly'">
          <el-form-item label="执行时间">
            <el-time-picker v-model="scheduleForm.weeklyTime" placeholder="选择时间" format="HH:mm" value-format="HH:mm" style="width:100%" />
          </el-form-item>
          <el-form-item label="执行日">
            <el-checkbox-group v-model="scheduleForm.daysOfWeek">
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
        <template v-if="scheduleForm.scheduleType === 'monthly'">
          <el-form-item label="执行时间">
            <el-time-picker v-model="scheduleForm.monthlyTime" placeholder="选择时间" format="HH:mm" value-format="HH:mm" style="width:100%" />
          </el-form-item>
          <el-form-item label="每月日">
            <el-input-number v-model="scheduleForm.dayOfMonth" :min="1" :max="28" :step="1" step-strictly />
            <span class="form-hint">建议1-28日以确保每月都可执行</span>
          </el-form-item>
        </template>
        <el-divider content-position="left">压测参数</el-divider>
        <el-form-item label="并发数">
          <el-input v-model="scheduleForm.runParam.numThreads" placeholder="并发线程数，如 100" />
        </el-form-item>
        <el-form-item label="启动时间">
          <el-input v-model="scheduleForm.runParam.rampTime" placeholder="Ramp-Up 秒数，如 10" />
        </el-form-item>
        <el-form-item label="运行时间">
          <el-input v-model="scheduleForm.runParam.duration" placeholder="持续时间 秒数，如 300" />
        </el-form-item>
        <el-form-item label="目标区域">
          <el-select v-model="scheduleForm.runParam.region" placeholder="全部区域" @change="onScheduleRegionChange" style="width:100%">
            <el-option key="" label="全部区域" value="" />
            <el-option v-for="r in regionList" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="压力机数">
          <el-input-number v-model="scheduleForm.runParam.slaveCount" :min="1" :max="maxSlaveCount || 1" :step="1" :disabled="maxSlaveCount < 1" />
          <span class="form-hint" v-if="maxSlaveCount > 0">可用 {{ maxSlaveCount }} 台</span>
          <span class="form-hint" v-else style="color: var(--color-error)">该区域暂无可用压力机</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmScheduleEdit">确定</el-button>
      </template>
    </el-dialog>

    <!-- Chart Dialog -->
    <el-dialog title="实时监控" v-model="chartDialogVisible" width="900px" destroy-on-close>
      <JmeterMetricsChart :data="metricsData" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="execution">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Close, TrendCharts, VideoPlay, Edit, Delete } from '@element-plus/icons-vue';
import { getReportListAll, getMetrics } from '../api/report';
import JmeterMetricsChart from '../components/JmeterMetricsChart.vue';
import { stopExecution } from '../api/testcase';
import { getTestCaseList } from '../api/testcase';
import { listScheduledTasks, triggerScheduledTask, updateScheduledTask, deleteScheduledTask } from '../api/scheduledTask';
import { getRegions, getEnableSlaveCount } from '../api/node';
import { checkToLogin } from '../common/push';

interface TableRow {
  id: string;
  testCaseId: number;
  region: string;
  rowType: 'report' | 'scheduled';
  execType?: number;
  scheduleType?: string;
  runTime: string;
  reportId?: number;
  scheduleId?: number;
  _scheduleData?: string;
  _runParam?: string;
}

const query = reactive({
  name: null as string | null,
  region: null as string | null,
  page: 1,
  size: 10
});

const tableData = ref<TableRow[]>([]);
const total = ref(0);
const testcaseNameMap = ref<Record<number, string>>({});

const loadTestcaseNames = async () => {
  try {
    const res = await getTestCaseList({ page: 1, size: 999 });
    if (res.data.code === 0) {
      const map: Record<number, string> = {};
      res.data.data.list.forEach((tc: any) => { map[tc.id] = tc.name; });
      testcaseNameMap.value = map;
    }
  } catch { /* ignore */ }
};

let refreshTimer: ReturnType<typeof setInterval> | null = null;

const getList = async () => {
  const params: any = { page: 1, size: 999 };
  if (query.name != null && query.name !== '') params.name = query.name;
  if (query.region != null && query.region !== '') params.region = query.region;

  const [reportRes, scheduleRes] = await Promise.all([
    getReportListAll(params),
    listScheduledTasks({ enabled: 1, page: 1, size: 999 })
  ]);

  const rows: TableRow[] = [];

  if (reportRes.data.code === 0) {
    const reports = (reportRes.data.data.list as any[]).filter((r: any) => r.status === 1);
    for (const r of reports) {
      if (query.region && r.region !== query.region) continue;
      rows.push({
        id: 'R-' + r.id,
        testCaseId: r.testCaseId,
        region: r.region || '',
        rowType: 'report',
        execType: r.execType,
        runTime: r.createTime,
        reportId: r.id
      });
    }
  }

  if (scheduleRes.data.code === 0) {
    const tasks = scheduleRes.data.data.list as any[];
    for (const t of tasks) {
      let runParam: any = {};
      try { runParam = JSON.parse(t.runParam); } catch { /* ignore */ }
      const region = runParam.region || '';
      if (query.region && region !== query.region) continue;
      if (query.name) {
        const tcName = testcaseNameMap.value[t.testCaseId] || '';
        if (!tcName.includes(query.name)) continue;
      }
      rows.push({
        id: 'S-' + t.id,
        testCaseId: t.testCaseId,
        region,
        rowType: 'scheduled',
        scheduleType: t.scheduleType,
        runTime: t.nextRunAt || '-',
        scheduleId: t.id,
        _scheduleData: t.scheduleData,
        _runParam: t.runParam
      });
    }
  }

  tableData.value = rows;
  total.value = rows.length;
};

onMounted(async () => {
  await loadTestcaseNames();
  getList();
  refreshTimer = setInterval(getList, 5000);
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  if (chartTimer) clearInterval(chartTimer);
});

const handleSearch = () => { query.page = 1; getList(); };
const handleReset = () => { query.name = null; query.region = null; getList(); };
const handlePageChange = (val: number) => { query.page = val; };

const handleStop = async (reportId: number) => {
  const res = await stopExecution(reportId);
  if (res.data.code !== 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success('已停止');
    getList();
  }
};

const handleTriggerNow = async (scheduleId: number) => {
  const res = await triggerScheduledTask(scheduleId);
  if (res.data.code !== 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success('已触发执行');
    getList();
  }
};

const scheduleVisible = ref(false);
const editingScheduleId = ref<number | null>(null);
const maxSlaveCount = ref(1);
const regionList = ref<string[]>([]);

const scheduleForm = reactive({
  scheduleType: 'once' as string,
  onceDateTime: '' as string,
  dailyTime: '' as string,
  weeklyTime: '' as string,
  daysOfWeek: [] as number[],
  monthlyTime: '' as string,
  dayOfMonth: 1 as number,
  runParam: {
    numThreads: '10',
    rampTime: '0',
    duration: '60',
    slaveCount: 1,
    region: ''
  }
});

const openScheduleEdit = async (row: TableRow) => {
  editingScheduleId.value = row.scheduleId!;
  let sd: any = {};
  try { sd = JSON.parse(row._scheduleData || '{}'); } catch { /* ignore */ }
  let rp: any = {};
  try { rp = JSON.parse(row._runParam || '{}'); } catch { /* ignore */ }

  scheduleForm.scheduleType = row.scheduleType || 'once';
  scheduleForm.daysOfWeek = [];
  scheduleForm.dayOfMonth = 1;
  scheduleForm.onceDateTime = '';
  scheduleForm.dailyTime = '';
  scheduleForm.weeklyTime = '';
  scheduleForm.monthlyTime = '';

  if (row.scheduleType === 'once') {
    scheduleForm.onceDateTime = sd.time || '';
  } else if (row.scheduleType === 'daily') {
    scheduleForm.dailyTime = sd.time || '';
  } else if (row.scheduleType === 'weekly') {
    scheduleForm.weeklyTime = sd.time || '';
    scheduleForm.daysOfWeek = sd.daysOfWeek || [];
  } else if (row.scheduleType === 'monthly') {
    scheduleForm.monthlyTime = sd.time || '';
    scheduleForm.dayOfMonth = sd.dayOfMonth || 1;
  }

  scheduleForm.runParam.numThreads = rp.numThreads || '10';
  scheduleForm.runParam.rampTime = rp.rampTime || '0';
  scheduleForm.runParam.duration = rp.duration || '60';
  scheduleForm.runParam.slaveCount = rp.slaveCount || 1;
  scheduleForm.runParam.region = rp.region || '';

  try {
    const [regionRes, countRes] = await Promise.all([
      getRegions(),
      getEnableSlaveCount(rp.region || undefined)
    ]);
    if (regionRes.data.code === 0) regionList.value = regionRes.data.data;
    if (countRes.data.code === 0) maxSlaveCount.value = countRes.data.data || 0;
  } catch { /* ignore */ }

  // 如果当前可用数小于保存的值，则降到当前可用数
  if (scheduleForm.runParam.slaveCount > maxSlaveCount.value) {
    scheduleForm.runParam.slaveCount = Math.max(1, maxSlaveCount.value);
  }

  scheduleVisible.value = true;
};

const confirmScheduleEdit = async () => {
  if (maxSlaveCount.value < 1 && scheduleForm.runParam.region) {
    ElMessage.error('所选区域暂无可用压力机，无法保存'); return;
  }
  let scheduleData: any = {};
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
    testCaseId: tableData.value.find(r => r.scheduleId === editingScheduleId.value)?.testCaseId,
    scheduleType: scheduleForm.scheduleType,
    scheduleData,
    runParam: {
      numThreads: scheduleForm.runParam.numThreads,
      rampTime: scheduleForm.runParam.rampTime,
      duration: scheduleForm.runParam.duration,
      slaveCount: scheduleForm.runParam.slaveCount,
      region: scheduleForm.runParam.region
    }
  };
  const res = await updateScheduledTask(editingScheduleId.value!, body);
  if (res.data.code !== 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success('修改成功');
    scheduleVisible.value = false;
    getList();
  }
};

const handleDeleteSchedule = async (scheduleId: number) => {
  await ElMessageBox.confirm('确定删除该定时任务？', '提示', { type: 'warning' });
  const res = await deleteScheduledTask(scheduleId);
  if (res.data.code !== 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success('已删除');
    getList();
  }
};

const onScheduleRegionChange = async () => {
  scheduleForm.runParam.slaveCount = 1;
  try {
    const res = await getEnableSlaveCount(scheduleForm.runParam.region || undefined);
    if (res.data.code === 0) maxSlaveCount.value = res.data.data || 0;
  } catch { /* ignore */ }
};

const chartDialogVisible = ref(false);
const currentReportId = ref(0);
let chartTimer: ReturnType<typeof setInterval> | null = null;

interface MetricsItem {
  timestamp: string;
  qps: number;
  avgRt: number;
  p99Rt: number;
  errorRate: number;
  threads: number;
}

const metricsData = ref<MetricsItem[]>([]);

const fetchChartData = async () => {
  if (!currentReportId.value) return;
  const res = await getMetrics(currentReportId.value, 5);
  if (res.data.code !== 0) return;
  metricsData.value = res.data.data || [];
};

const openChartDialog = async (reportId: number) => {
  currentReportId.value = reportId;
  chartDialogVisible.value = true;
  await fetchChartData();
  chartTimer = setInterval(fetchChartData, 5000);
};

watch(chartDialogVisible, (visible) => {
  if (!visible) {
    if (chartTimer) { clearInterval(chartTimer); chartTimer = null; }
    currentReportId.value = 0;
  }
});
</script>

<style scoped>
.auto-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  font-size: 12px;
  color: var(--color-fg-tertiary);
}
.auto-refresh::before {
  content: '';
  width: 6px; height: 6px;
  background: var(--color-amber);
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.18);
  animation: pulse-amber 1.6s infinite;
}
.region-mono {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-fg-secondary);
  background: var(--color-bg-muted);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--color-fg-tertiary);
}
</style>
