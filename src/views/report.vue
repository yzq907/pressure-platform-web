<template>
  <div>
    <div class="container">
      <div class="handle-box">
        <el-input v-model="query.name" placeholder="任务/报告名称" class="handle-input mr10"></el-input>
        <el-input v-model="query.testCaseId" placeholder="用例" class="handle-input mr10"></el-input>
        <el-select v-model="query.execType" placeholder="类型" class="handle-select mr10" style="width:120px" clearable>
          <el-option label="调试" :value="1"></el-option>
          <el-option label="压测" :value="2"></el-option>
        </el-select>


        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>

      <el-table :data="reportData" stripe class="table" ref="multipleTable" v-loading="loading">
        <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
        <el-table-column prop="name" label="任务名称" align="center"></el-table-column>
        <el-table-column prop="description" label="描述" align="center"></el-table-column>
        <el-table-column prop="testCaseId" label="用例" align="center">
          <template #default="scope">
            <span @click="handleTestCaseClick(scope.row.testCaseId)" style="cursor: pointer; color: var(--color-primary);">{{ scope.row.testCaseId }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="execType" label="类型" align="center">
          <template #default="scope">
            <span v-if="scope.row.execType === 1" class="state-pill sp-debug">调试</span>
            <span v-if="scope.row.execType === 2" class="state-pill sp-load">压测</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <span v-if="scope.row.status === 0" class="state-pill sp-idle"><span class="sp-dot"></span>没有执行</span>
            <span v-if="scope.row.status === 1" class="state-pill sp-running"><span class="sp-dot"></span>正在执行</span>
            <span v-if="scope.row.status === 2" class="state-pill sp-success"><span class="sp-dot"></span>执行成功</span>
            <span v-if="scope.row.status === 3" class="state-pill sp-error"><span class="sp-dot"></span>执行异常</span>
          </template>
        </el-table-column>
        <el-table-column prop="responseData" label="结果" align="center"></el-table-column>
        <el-table-column prop="creator" label="创建人" align="center"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" align="center"></el-table-column>

        <el-table-column label="操作" width="310" align="right">
          <template #default="scope">
            <div class="report-actions">
              <el-button v-if="scope.row.execType !== 1" text :icon="Top" type="primary" @click="handleViewReport(scope.row.id)" v-permiss="'report'">预览</el-button>
              <el-button v-if="scope.row.execType !== 1" text :icon="Download" type="primary" @click="handleDownload(scope.row.id)" v-permiss="'report'">下载</el-button>
              <el-button v-if="scope.row.execType !== 1" text :icon="TrendCharts" type="primary" @click="handleGrafana(scope.row.id)" v-permiss="'report'">资源</el-button>
              <el-button v-if="scope.row.execType !== 1" text :icon="DataAnalysis" type="primary" @click="openReportDetail(scope.row)" v-permiss="'report'">详情</el-button>
              <el-button v-if="scope.row.execType !== 1" text :icon="Box" type="primary" @click="openArtifacts(scope.row.id)" v-permiss="'report'">产物</el-button>
              <el-button text :icon="TrendCharts" type="primary" @click="openCompareSelect(scope.row)" v-permiss="'report'">对比</el-button>
              <el-button text :icon="Search" type="primary" @click="drawer = true,handleJMeterLog(scope.row.id)" v-permiss="'report'">日志</el-button>
              <el-button text :icon="Delete" type="danger" @click="handleDelete(scope.row.id)" v-permiss="'report'">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无执行报告" /></template>
      </el-table>

      <div class="pagination">
        <el-pagination
            background
            layout="total, prev, pager, next"
            :current-page="query.page"
            :page-size="query.size"
            :total="total"
            @current-change="handlePageChange"
        ></el-pagination>
      </div>
    </div>

    <!--    抽屉查看日志-->
    <el-drawer
        v-model="drawer"
        title="执行日志"
        :show-close="true"
        :with-header="true"
        :size="'60%'"
    >
      <div class="log-content">
        <VirtualTextViewer :content="jmxLog" />
      </div>
    </el-drawer>

    <!-- 选择对比报告对话框 -->
    <el-dialog title="选择对比报告" v-model="compareSelectVisible" width="700px" destroy-on-close>
      <el-table :data="compareCandidates" stripe size="small">
        <el-table-column prop="id" label="编号" width="80" align="center"></el-table-column>
        <el-table-column prop="name" label="任务名称" align="center"></el-table-column>
        <el-table-column prop="execType" label="类型" align="center" width="90">
          <template #default="scope">
            <span v-if="scope.row.execType === 1" class="state-pill sp-debug">调试</span>
            <span v-else class="state-pill sp-load">压测</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="执行时间" align="center" min-width="160"></el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="confirmCompare(scope.row.id)">选择</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="无可对比报告" /></template>
      </el-table>
    </el-dialog>

    <!-- 对比结果对话框 -->
    <el-dialog :title="compareTitle" v-model="compareVisible" width="960px" destroy-on-close>
      <div v-loading="compareLoading">
        <JmeterCompareChart
          :base-data="compareBaseData"
          :target-data="compareTargetData"
          :base-name="compareBaseName"
          :target-name="compareTargetName"
        />
      </div>
    </el-dialog>

    <!-- 产物文件对话框 -->
    <el-dialog title="产物文件" v-model="artifactVisible" width="620px" destroy-on-close>
      <el-table :data="artifactList" stripe size="small" v-loading="artifactLoading">
        <el-table-column prop="name" label="文件名" min-width="220" align="center"></el-table-column>
        <el-table-column label="大小" width="110" align="center">
          <template #default="scope">{{ formatBytes(scope.row.size) }}</template>
        </el-table-column>
        <el-table-column prop="modifyTime" label="更新时间" min-width="160" align="center"></el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="scope">
            <el-button text type="primary" size="small" :icon="Download" @click="handleDownloadArtifact(scope.row.name)">下载</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无产物文件" /></template>
      </el-table>
    </el-dialog>

    <!-- 报告详情：压测曲线 + 平台内资源曲线 -->
    <el-drawer v-model="detailVisible" :title="detailTitle" size="82%" destroy-on-close>
      <div class="report-detail" v-loading="detailLoading">
        <div class="detail-meta">
          <span>区域：{{ detailReport?.region || '全部' }}</span>
          <span>服务：{{ detailReport?.serviceName || '-' }}</span>
          <span>实例：{{ resourceMetrics.instance || detailReport?.grafanaInstance || '-' }}</span>
          <span>总线程：{{ detailReport?.totalThreads || '-' }}</span>
          <span>压力机：{{ detailReport?.slaveCount || '-' }}</span>
        </div>
        <el-tabs v-model="detailTab">
          <el-tab-pane label="概览" name="overview">
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-label">平均 QPS</div>
                <div class="summary-value">{{ pressureSummary.avgQps }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">平均 RT</div>
                <div class="summary-value">{{ pressureSummary.avgRt }} ms</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">P99 RT</div>
                <div class="summary-value">{{ pressureSummary.p99Rt }} ms</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">错误率</div>
                <div class="summary-value">{{ pressureSummary.errorRate }}%</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">CPU 峰值</div>
                <div class="summary-value">{{ resourceSummary.cpuPeak }}%</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">内存峰值</div>
                <div class="summary-value">{{ resourceSummary.memoryPeak }}%</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Load 峰值</div>
                <div class="summary-value">{{ resourceSummary.loadPeak }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">GC 峰值</div>
                <div class="summary-value">{{ resourceSummary.gcPeak }}</div>
              </div>
            </div>
            <div class="transaction-section">
              <div class="section-title">交易统计</div>
              <el-table :data="transactionStats" stripe size="small" class="transaction-table" table-layout="fixed">
                <el-table-column prop="name" label="事务名称" width="320" align="left" header-align="left" show-overflow-tooltip></el-table-column>
                <el-table-column prop="samples" label="总数" min-width="108" align="center" header-align="center"></el-table-column>
                <el-table-column prop="success" label="成功数" min-width="108" align="center" header-align="center"></el-table-column>
                <el-table-column prop="failed" label="失败数" min-width="108" align="center" header-align="center"></el-table-column>
                <el-table-column label="成功率" min-width="112" align="center" header-align="center">
                  <template #default="scope">{{ formatPercent(scope.row.successRate) }}</template>
                </el-table-column>
                <el-table-column label="TPS" min-width="108" align="center" header-align="center">
                  <template #default="scope">{{ formatNumber(scope.row.tps, 2) }}</template>
                </el-table-column>
                <el-table-column label="平均RT" min-width="116" align="center" header-align="center">
                  <template #default="scope">{{ formatNumber(scope.row.avgRt, 1) }} ms</template>
                </el-table-column>
                <el-table-column label="最大RT" min-width="116" align="center" header-align="center">
                  <template #default="scope">{{ formatNumber(scope.row.maxRt, 1) }} ms</template>
                </el-table-column>
                <el-table-column label="最小RT" min-width="116" align="center" header-align="center">
                  <template #default="scope">{{ formatNumber(scope.row.minRt, 1) }} ms</template>
                </el-table-column>
                <el-table-column label="交易占比" min-width="116" align="center" header-align="center">
                  <template #default="scope">{{ formatPercent(scope.row.ratio) }}</template>
                </el-table-column>
                <template #empty><el-empty description="任务完成后生成交易统计" /></template>
              </el-table>
            </div>
          </el-tab-pane>
          <el-tab-pane :label="`错误详情(${errorSamplesTotal})`" name="errors">
            <div class="error-samples" v-loading="errorSamplesLoading">
              <div class="error-toolbar">
                <span>失败请求采样</span>
                <div class="error-groups" v-if="errorGroupItems.length > 0">
                  <el-tag
                    v-for="item in errorGroupItems"
                    :key="item.type"
                    size="small"
                    type="danger"
                    effect="plain"
                  >
                    {{ item.type }} {{ item.count }}
                  </el-tag>
                </div>
              </div>
              <el-empty v-if="!errorSamplesLoading && errorSamples.length === 0" description="本次压测未采集到失败请求" />
              <div v-else class="error-layout">
                <el-table
                  :data="errorSamples"
                  stripe
                  highlight-current-row
                  size="small"
                  class="error-table"
                  table-layout="fixed"
                  @current-change="handleSelectErrorSample"
                >
                  <el-table-column prop="sampleTimeText" label="时间" width="168" align="center" header-align="center"></el-table-column>
                  <el-table-column prop="label" label="请求/交易" min-width="180" show-overflow-tooltip></el-table-column>
                  <el-table-column prop="errorType" label="类型" width="96" align="center" header-align="center">
                    <template #default="scope">
                      <el-tag size="small" type="danger" effect="plain">{{ scope.row.errorType || scope.row.responseCode || '-' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="responseCode" label="响应码" width="92" align="center" header-align="center"></el-table-column>
                  <el-table-column label="耗时" width="92" align="center" header-align="center">
                    <template #default="scope">{{ scope.row.elapsed }} ms</template>
                  </el-table-column>
                  <el-table-column prop="responseMessage" label="响应信息" min-width="140" show-overflow-tooltip></el-table-column>
                </el-table>
                <div class="error-detail" v-if="selectedErrorSample">
                  <div class="error-detail-head">
                    <div>
                      <div class="error-detail-title">{{ selectedErrorSample.label || '未命名请求' }}</div>
                      <div class="error-detail-meta">
                        {{ selectedErrorSample.sampleTimeText || '-' }}
                        <span>{{ selectedErrorSample.threadName || '-' }}</span>
                        <span>{{ selectedErrorSample.elapsed }} ms</span>
                      </div>
                    </div>
                    <el-tag type="danger" effect="dark">{{ selectedErrorSample.errorType || selectedErrorSample.responseCode || '-' }}</el-tag>
                  </div>
                  <div class="error-detail-grid">
                    <div class="error-field">
                      <span>响应码</span>
                      <strong>{{ selectedErrorSample.responseCode || '-' }}</strong>
                    </div>
                    <div class="error-field">
                      <span>响应信息</span>
                      <strong>{{ selectedErrorSample.responseMessage || '-' }}</strong>
                    </div>
                    <div class="error-field wide">
                      <span>请求地址</span>
                      <strong>{{ selectedErrorSample.requestUrl || '-' }}</strong>
                    </div>
                  </div>
                  <el-alert
                    v-if="selectedErrorSample.truncated"
                    title="部分字段已截断，仅展示采集到的前半部分内容"
                    type="warning"
                    show-icon
                    :closable="false"
                    class="error-alert"
                  />
                  <el-tabs class="error-detail-tabs">
                    <el-tab-pane label="断言结果">
                      <div class="error-text">
                        <VirtualTextViewer :content="selectedErrorSample.failureMessage || '无断言失败信息'" />
                      </div>
                    </el-tab-pane>
                    <el-tab-pane label="Request Headers">
                      <div class="error-text">
                        <VirtualTextViewer :content="selectedErrorSample.requestHeaders || '无请求头数据'" />
                      </div>
                    </el-tab-pane>
                    <el-tab-pane label="Response Headers">
                      <div class="error-text">
                        <VirtualTextViewer :content="selectedErrorSample.responseHeaders || '无响应头数据'" />
                      </div>
                    </el-tab-pane>
                    <el-tab-pane label="Response Body">
                      <div class="error-text large">
                        <VirtualTextViewer :content="selectedErrorSample.responseBody || '无响应体数据'" />
                      </div>
                    </el-tab-pane>
                  </el-tabs>
                </div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="压测曲线" name="pressure">
            <el-empty v-if="pressureMetrics.length === 0" description="暂无压测指标快照，稍后刷新或查看 Grafana" />
            <JmeterMetricsChart v-else :data="pressureMetrics" />
          </el-tab-pane>
          <el-tab-pane label="交易曲线" name="transaction">
            <div class="transaction-chart-toolbar">
              <span>性能趋势图</span>
              <span>窗口：{{ transactionTrend.window }}s</span>
            </div>
            <el-empty v-if="!hasTransactionTrend" description="任务完成后生成交易曲线" />
            <TransactionTrendCharts v-else :data="transactionTrend" />
          </el-tab-pane>
          <el-tab-pane label="资源曲线" name="resource">
            <div v-loading="resourceLoading">
              <div class="resource-toolbar">
                <span>Prometheus 资源曲线</span>
                <el-button
                  size="small"
                  :icon="Refresh"
                  :disabled="!detailReport"
                  @click="handleRefreshResourceMetrics"
                >
                  刷新
                </el-button>
              </div>
              <div class="resource-targets" v-if="resourceTargets.length > 0">
                <button
                  v-for="target in resourceTargets"
                  :key="target.instance"
                  type="button"
                  class="resource-target"
                  :class="{ active: target.instance === selectedResourceInstance }"
                  @click="handleSelectResourceTarget(target)"
                >
                  <span class="resource-target-role">{{ target.role || '相关服务' }}</span>
                  <span class="resource-target-name">{{ target.name || target.service || target.instance }}</span>
                  <span class="resource-target-instance">{{ target.instance }}</span>
                </button>
              </div>
              <el-alert
                v-if="resourceError"
                :title="resourceError"
                type="warning"
                show-icon
                :closable="false"
                class="resource-alert"
              />
              <div class="resource-range" v-if="resourceMetrics.fromMs && resourceMetrics.toMs">
                时间范围：{{ formatTime(resourceMetrics.fromMs) }} ~ {{ formatTime(resourceMetrics.toMs) }}
                <span>步长：{{ resourceMetrics.step }}s</span>
              </div>
              <el-empty v-if="!resourceLoading && !resourceError && !hasResourceSeries" description="暂无 Prometheus 资源数据" />
              <ResourceMetricsChart v-else-if="hasResourceSeries" :series="resourceMetrics.series" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="baseReport">
import {ref, reactive, computed, onActivated, watch} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import VirtualTextViewer from '../components/VirtualTextViewer.vue';
import { Download, Search, Delete, Edit, Refresh, Top, TrendCharts, Box, DataAnalysis } from '@element-plus/icons-vue';
import {cleanReport, downloadReport, getLog, getReportList, viewReport, compareReports, getReportListByTestCase, getGrafanaUrl, getArtifacts, downloadArtifact, getMetrics, getResourceMetrics, getResourceTargets, getTransactionStats, getTransactionTrend, getErrorSamples} from "../api/report";
import JmeterCompareChart from '../components/JmeterCompareChart.vue';
import JmeterMetricsChart from '../components/JmeterMetricsChart.vue';
import ResourceMetricsChart from '../components/ResourceMetricsChart.vue';
import TransactionTrendCharts from '../components/TransactionTrendCharts.vue';
import {checkToLogin, handleTestCaseClick} from "../common/push";
import {useRoute} from "vue-router";
import router from "../router";

const drawer = ref(false);

interface ReportItem {
  id: number;
  name: string;
  description: string;
  testCaseId: number;
  execType: number;
  status: number;
  responseData: string;
  region: string;
  serviceName: string;
  totalThreads: number;
  slaveCount: number;
  grafanaInstance: string;
  artifactDir: string;
  creator: string;
  modifier: string;
  createTime: string;
  modifyTime: string;
}

interface ArtifactItem {
  name: string;
  size: number;
  modifyTime: string;
}

interface MetricsItem {
  timestamp: string;
  qps: number;
  avgRt: number;
  p95Rt: number;
  p99Rt: number;
  errorRate: number;
  threads: number;
}

interface TransactionStatsItem {
  name: string;
  samples: number;
  success: number;
  failed: number;
  successRate: number;
  tps: number;
  avgRt: number;
  maxRt: number;
  minRt: number;
  ratio: number;
}

interface TrendPoint {
  timestamp: string;
  value: number;
}

interface TransactionTrendData {
  reportId: number;
  window: number;
  timestamps: string[];
  transactions: string[];
  totalTps: TrendPoint[];
  transactionTps: Record<string, TrendPoint[]>;
  avgRt: Record<string, TrendPoint[]>;
  activeThreads: Record<string, TrendPoint[]>;
}

interface ResourceMetricPoint {
  timestamp: string;
  timestampMs: number;
  value: number | null;
}

interface ResourceMetricsData {
  reportId: number;
  instance: string;
  fromMs: number;
  toMs: number;
  step: number;
  series: Record<string, ResourceMetricPoint[]>;
}

interface ResourceTarget {
  name: string;
  role: string;
  service: string;
  instance: string;
}

interface ErrorSampleItem {
  sampleTime: number;
  sampleTimeText: string;
  label: string;
  threadName: string;
  responseCode: string;
  responseMessage: string;
  elapsed: number;
  failureMessage: string;
  requestUrl: string;
  requestHeaders: string;
  requestBody: string;
  responseHeaders: string;
  responseBody: string;
  truncated: boolean;
  errorType: string;
}

const route = useRoute();

const query = reactive({
  name: route.query.name || null,          // 获取传递的name参数
  testCaseId: route.query.testCaseId || null,  // 获取传递的testCaseId参数
  execType: null as number | null,
  page: 1,
  size: 10
});

const loading = ref(false);
const reportData = ref<ReportItem[]>([]);
const total = ref(0);

const syncQueryFromRoute = () => {
  query.name = route.query.name || null;
  query.testCaseId = route.query.testCaseId || null;
  query.execType = null;
  query.page = 1;
};

const getList = () => {
  loading.value = true;
  getReportList(query).then(res => {
    checkToLogin(res.data.message);
    const code = res.data.code
    if (code != 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    reportData.value = res.data.data.list;
    total.value = res.data.data.total || 10;
  }).finally(() => { loading.value = false; });
};
getList();

onActivated(() => {
  syncQueryFromRoute();
  getList();
});

watch(
  () => route.fullPath,
  () => {
    if (route.path === '/report') {
      syncQueryFromRoute();
      getList();
    }
  }
);

// 查询操作
const handleSearch = () => {
  query.page = 1;
  if (query.testCaseId === '') query.testCaseId = null;
  if (query.name === '') query.name = null;
  getList();
};

const handleReset = () => {
  query.name = null;
  query.testCaseId = null;
  query.execType = null;
  getList();
};

// 分页导航
const handlePageChange = (val: number) => {
  query.page = val;
  getList();
};

// 删除操作
const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除吗？', '提示', {
    type: 'warning'
  });
  const res = await cleanReport(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("删除成功");
    await getList(); // 等待getList()执行完再继续
  }
};

// 报告下载
const handleDownload = async (id: number) => {
  const res = await downloadReport(id);
  if (!res.success) {
    ElMessage.error("下载失败, 请重试");
  }
}

// 查看报告
const handleViewReport = async (id: number) => {
  const res = await viewReport(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    window.open(res.data.data, '_blank');
  }
}

// 查看资源监控
const handleGrafana = async (id: number) => {
  const res = await getGrafanaUrl(id);
  const code = res.data.code;
  if (code != 0) {
    ElMessage.error(res.data.message || '资源监控地址未配置');
    return;
  }
  window.open(res.data.data, '_blank');
}

// 查看并下载报告产物
const artifactVisible = ref(false);
const artifactLoading = ref(false);
const artifactReportId = ref(0);
const artifactList = ref<ArtifactItem[]>([]);

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const openArtifacts = async (id: number) => {
  artifactReportId.value = id;
  artifactVisible.value = true;
  artifactLoading.value = true;
  try {
    const res = await getArtifacts(id);
    const code = res.data.code;
    if (code != 0) {
      ElMessage.error(res.data.message || '产物文件获取失败');
      artifactList.value = [];
      return;
    }
    artifactList.value = res.data.data || [];
  } finally {
    artifactLoading.value = false;
  }
};

const handleDownloadArtifact = async (name: string) => {
  const res = await downloadArtifact(artifactReportId.value, name);
  if (!res.success) {
    ElMessage.error('产物下载失败, 请重试');
  }
};

// 报告详情：平台内压测曲线 + Prometheus 资源曲线
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailTab = ref('overview');
const detailReport = ref<ReportItem | null>(null);
const pressureMetrics = ref<MetricsItem[]>([]);
const transactionStats = ref<TransactionStatsItem[]>([]);
const transactionTrend = ref<TransactionTrendData>({
  reportId: 0,
  window: 60,
  timestamps: [],
  transactions: [],
  totalTps: [],
  transactionTps: {},
  avgRt: {},
  activeThreads: {}
});
const resourceError = ref('');
const resourceLoading = ref(false);
const resourceTargets = ref<ResourceTarget[]>([]);
const selectedResourceInstance = ref('');
const errorSamplesLoading = ref(false);
const errorSamples = ref<ErrorSampleItem[]>([]);
const errorSamplesTotal = ref(0);
const errorSampleGroups = ref<Record<string, number>>({});
const selectedErrorSample = ref<ErrorSampleItem | null>(null);
const RESOURCE_METRICS_CACHE_TTL_MS = 60000;
const RESOURCE_METRICS_STEP_CACHE_KEY = 'default';
const resourceMetrics = ref<ResourceMetricsData>({
  reportId: 0,
  instance: '',
  fromMs: 0,
  toMs: 0,
  step: 30,
  series: {}
});
const resourceMetricsCache = new Map<string, { expiresAt: number; data: ResourceMetricsData }>();

const detailTitle = computed(() => {
  if (!detailReport.value) return '报告详情';
  return `报告详情：${detailReport.value.name || '#' + detailReport.value.id}`;
});

const avg = (items: number[]) => {
  const values = items.filter((item) => Number.isFinite(item));
  if (values.length === 0) return 0;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
};

const max = (items: Array<number | null | undefined>) => {
  const values = items.filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
  if (values.length === 0) return 0;
  return Math.max(...values);
};

const pressureSummary = computed(() => ({
  avgQps: avg(pressureMetrics.value.map((item) => item.qps)).toFixed(1),
  avgRt: avg(pressureMetrics.value.map((item) => item.avgRt)).toFixed(1),
  p99Rt: max(pressureMetrics.value.map((item) => item.p99Rt)).toFixed(1),
  errorRate: avg(pressureMetrics.value.map((item) => item.errorRate)).toFixed(2),
}));

const resourceSummary = computed(() => {
  const series = resourceMetrics.value.series || {};
  return {
    cpuPeak: max((series.cpu || []).map((item) => item.value)).toFixed(1),
    memoryPeak: max((series.memory || []).map((item) => item.value)).toFixed(1),
    loadPeak: max((series.load || []).map((item) => item.value)).toFixed(2),
    gcPeak: max((series.gc || []).map((item) => item.value)).toFixed(4),
  };
});

const hasResourceSeries = computed(() => {
  const series = resourceMetrics.value.series || {};
  return Object.values(series).some((items) => Array.isArray(items) && items.length > 0);
});

const hasTransactionTrend = computed(() => {
  const trend = transactionTrend.value;
  return (trend.totalTps || []).length > 0
    || Object.values(trend.transactionTps || {}).some((items) => Array.isArray(items) && items.length > 0)
    || Object.values(trend.avgRt || {}).some((items) => Array.isArray(items) && items.length > 0)
    || Object.values(trend.activeThreads || {}).some((items) => Array.isArray(items) && items.length > 0);
});

const errorGroupItems = computed(() => Object.entries(errorSampleGroups.value || {})
  .map(([type, count]) => ({ type, count }))
  .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)));

const formatTime = (timestampMs: number) => {
  if (!timestampMs) return '-';
  return new Date(timestampMs).toLocaleString();
};

const formatNumber = (value: number, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return num.toFixed(digits);
};

const formatPercent = (value: number) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return `${num.toFixed(2)}%`;
};

const resetResourceMetrics = (reportId = 0) => {
  resourceMetrics.value = { reportId, instance: '', fromMs: 0, toMs: 0, step: 30, series: {} };
};

const getResourceMetricsCacheKey = (reportId: number, instance?: string) => {
  return `${reportId}|${instance || ''}|${RESOURCE_METRICS_STEP_CACHE_KEY}`;
};

const resetTransactionTrend = (reportId = 0) => {
  transactionTrend.value = {
    reportId,
    window: 60,
    timestamps: [],
    transactions: [],
    totalTps: [],
    transactionTps: {},
    avgRt: {},
    activeThreads: {},
  };
};

const resetErrorSamples = () => {
  errorSamples.value = [];
  errorSamplesTotal.value = 0;
  errorSampleGroups.value = {};
  selectedErrorSample.value = null;
};

const loadErrorSamples = async (reportId: number) => {
  errorSamplesLoading.value = true;
  try {
    const res = await getErrorSamples(reportId, 100);
    if (res.data.code !== 0) {
      ElMessage.error(res.data.message || '错误详情读取失败');
      resetErrorSamples();
      return;
    }
    const data = res.data.data || {};
    errorSamples.value = data.list || [];
    errorSamplesTotal.value = data.total || errorSamples.value.length;
    errorSampleGroups.value = data.groups || {};
    selectedErrorSample.value = errorSamples.value[0] || null;
  } catch (e) {
    resetErrorSamples();
    ElMessage.error('错误详情读取失败');
  } finally {
    errorSamplesLoading.value = false;
  }
};

const handleSelectErrorSample = (row: ErrorSampleItem | null) => {
  selectedErrorSample.value = row;
};

const loadResourceMetrics = async (reportId: number, instance?: string, forceRefresh = false) => {
  resourceLoading.value = true;
  resourceError.value = '';
  const cacheKey = getResourceMetricsCacheKey(reportId, instance);
  const cached = resourceMetricsCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    resourceMetrics.value = cached.data;
    resourceLoading.value = false;
    return;
  }
  resetResourceMetrics(reportId);
  try {
    const res = await getResourceMetrics(reportId, undefined, instance, forceRefresh);
    if (res.data.code === 0) {
      resourceMetrics.value = res.data.data || resourceMetrics.value;
      resourceMetricsCache.set(cacheKey, {
        expiresAt: Date.now() + RESOURCE_METRICS_CACHE_TTL_MS,
        data: resourceMetrics.value,
      });
    } else {
      resourceError.value = res.data.message || '资源曲线查询失败';
    }
  } catch (e) {
    resourceError.value = '资源曲线查询失败';
  } finally {
    resourceLoading.value = false;
  }
};

const handleSelectResourceTarget = async (target: ResourceTarget) => {
  if (!detailReport.value || target.instance === selectedResourceInstance.value) return;
  selectedResourceInstance.value = target.instance;
  await loadResourceMetrics(detailReport.value.id, target.instance);
};

const handleRefreshResourceMetrics = async () => {
  if (!detailReport.value) return;
  await loadResourceMetrics(
    detailReport.value.id,
    selectedResourceInstance.value || undefined,
    true,
  );
};

const openReportDetail = async (row: ReportItem) => {
  detailReport.value = row;
  detailVisible.value = true;
  detailTab.value = 'overview';
  detailLoading.value = true;
  resourceError.value = '';
  pressureMetrics.value = [];
  transactionStats.value = [];
  resetTransactionTrend(row.id);
  resetErrorSamples();
  resourceTargets.value = [];
  selectedResourceInstance.value = '';
  resetResourceMetrics(row.id);
  try {
    const [pressureRes, targetRes, transactionRes, transactionTrendRes] = await Promise.allSettled([
      getMetrics(row.id, 5),
      getResourceTargets(row.id),
      getTransactionStats(row.id),
      getTransactionTrend(row.id, 60),
      loadErrorSamples(row.id)
    ]);
    if (pressureRes.status === 'fulfilled' && pressureRes.value.data.code === 0) {
      pressureMetrics.value = pressureRes.value.data.data || [];
    }
    if (targetRes.status === 'fulfilled' && targetRes.value.data.code === 0) {
      resourceTargets.value = targetRes.value.data.data || [];
    }
    if (transactionRes.status === 'fulfilled' && transactionRes.value.data.code === 0) {
      transactionStats.value = transactionRes.value.data.data || [];
    }
    if (transactionTrendRes.status === 'fulfilled' && transactionTrendRes.value.data.code === 0) {
      transactionTrend.value = transactionTrendRes.value.data.data || transactionTrend.value;
    }
  } finally {
    detailLoading.value = false;
  }
  const firstTarget = resourceTargets.value.find((target) => !!target.instance);
  selectedResourceInstance.value = firstTarget?.instance || '';
  await loadResourceMetrics(row.id, selectedResourceInstance.value || undefined);
};

// 查看日志
const jmxLog = ref('');
const handleJMeterLog = async (id: number) => {
  const res = await getLog(id);
  const code = res.data.code;
  if (code != 0) {
    ElMessage.error(res.data.message || '日志读取失败');
    jmxLog.value = '';
    return;
  }
  jmxLog.value = res.data.data || '';
};

// 对比功能
const compareSelectVisible = ref(false);
const compareVisible = ref(false);
const compareBaseId = ref(0);
const compareBaseName = ref('');
const compareCandidates = ref<any[]>([]);
const compareTitle = ref('报告对比');
const compareBaseData = ref<any[]>([]);
const compareTargetData = ref<any[]>([]);
const compareTargetName = ref('');
const compareLoading = ref(false);

const openCompareSelect = async (row: ReportItem) => {
  compareBaseId.value = row.id;
  compareBaseName.value = row.name || `报告 #${row.id}`;
  compareSelectVisible.value = true;
  // 拉取同用例的其他报告作为候选
  const res = await getReportListByTestCase({
    testCaseId: row.testCaseId,
    page: 1,
    size: 100
  });
  if (res.data.code === 0) {
    compareCandidates.value = (res.data.data.list || []).filter((r: any) => r.id !== row.id);
  }
};

const waitForCompareReady = async (targetId: number, windowSec = 5, retry = 5, interval = 1000) => {
  for (let i = 0; i <= retry; i += 1) {
    const res = await compareReports(compareBaseId.value, targetId, windowSec);
    if (res.data.code !== 0) return res;
    const data = res.data.data || {};
    const base = data.base || [];
    const target = data.target || [];
    if ((base.length > 0 && target.length > 0) || i === retry) return res;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};

const confirmCompare = async (targetId: number) => {
  compareSelectVisible.value = false;
  compareVisible.value = true;
  compareLoading.value = true;
  compareBaseData.value = [];
  compareTargetData.value = [];
  try {
    const res = await waitForCompareReady(targetId, 5);
    if (res.data.code !== 0) {
      compareVisible.value = false;
      ElMessage.error(res.data.message || '对比失败');
      return;
    }
    const data = res.data.data;
    compareBaseName.value = data.baseName || '基准';
    compareTargetName.value = data.targetName || '对比';
    compareBaseData.value = data.base || [];
    compareTargetData.value = data.target || [];
    compareTitle.value = `${compareBaseName.value} vs ${compareTargetName.value}`;
    if (compareBaseData.value.length === 0 || compareTargetData.value.length === 0) {
      ElMessage.warning('指标生成中或报告无 JTL 数据，请稍后再试');
    }
  } finally {
    compareLoading.value = false;
  }
};

</script>

<style scoped>
.report-actions {
  display: grid;
  grid-template-columns: repeat(4, 58px);
  justify-content: end;
  align-items: center;
  column-gap: 10px;
  row-gap: 6px;
}

.report-actions :deep(.el-button) {
  width: 58px;
  height: 24px;
  justify-content: center;
  margin-left: 0;
  padding: 0;
}

.report-detail {
  min-height: 520px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  color: var(--color-fg-secondary);
  font-size: 13px;
}

.detail-meta span {
  padding: 5px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-muted);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px;
  background: var(--color-bg-elevated);
}

.summary-label {
  color: var(--color-fg-tertiary);
  font-size: 12px;
  margin-bottom: 8px;
}

.summary-value {
  color: var(--color-fg-primary);
  font-size: 22px;
  font-weight: 700;
}

.transaction-section {
  margin-top: 18px;
}

.section-title {
  margin-bottom: 10px;
  color: var(--color-fg-primary);
  font-size: 15px;
  font-weight: 700;
}

.transaction-table {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.transaction-table :deep(.el-table__header th) {
  background: var(--color-bg-muted);
  color: var(--color-fg-secondary);
  font-weight: 700;
}

.transaction-chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--color-fg-secondary);
  font-size: 13px;
}

.error-samples {
  min-height: 420px;
}

.error-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--color-fg-secondary);
  font-size: 13px;
}

.error-groups {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.error-layout {
  display: grid;
  grid-template-columns: minmax(520px, 0.9fr) minmax(420px, 1.1fr);
  gap: 14px;
  align-items: start;
}

.error-table {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.error-table :deep(.el-table__header th) {
  background: var(--color-bg-muted);
  color: var(--color-fg-secondary);
  font-weight: 700;
}

.error-detail {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px;
  background: var(--color-bg-elevated);
}

.error-detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.error-detail-title {
  color: var(--color-fg-primary);
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
}

.error-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--color-fg-tertiary);
  font-size: 12px;
}

.error-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.error-field {
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-muted);
}

.error-field.wide {
  grid-column: 1 / -1;
}

.error-field span,
.error-field strong {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.error-field span {
  color: var(--color-fg-tertiary);
  font-size: 12px;
  margin-bottom: 4px;
}

.error-field strong {
  color: var(--color-fg-primary);
  font-size: 13px;
  font-weight: 600;
}

.error-alert {
  margin-bottom: 10px;
}

.error-detail-tabs {
  min-width: 0;
}

.error-text {
  height: 180px;
  border-radius: var(--radius-sm);
  background: #1f2933;
  overflow: hidden;
}

.error-text.large {
  height: 260px;
}

.resource-alert {
  margin-bottom: 12px;
}

.resource-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--color-fg-secondary);
  font-size: 13px;
}

.resource-targets {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.resource-target {
  min-width: 0;
  text-align: left;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  background: var(--color-bg-elevated);
  cursor: pointer;
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}

.resource-target:hover,
.resource-target.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, .12);
}

.resource-target.active {
  background: rgba(64, 158, 255, .08);
}

.resource-target-role,
.resource-target-name,
.resource-target-instance {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-target-role {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
}

.resource-target-name {
  color: var(--color-fg-primary);
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
}

.resource-target-instance {
  color: var(--color-fg-tertiary);
  font-size: 12px;
}

.resource-range {
  display: flex;
  gap: 18px;
  margin-bottom: 12px;
  color: var(--color-fg-secondary);
  font-size: 13px;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .error-layout {
    grid-template-columns: 1fr;
  }

  .resource-targets {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .resource-targets {
    grid-template-columns: 1fr;
  }
}
</style>
