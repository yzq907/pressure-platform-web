<template>
  <div>
    <div class="container">
      <div class="handle-box">
        <el-input v-model="query.name" placeholder="报告名称" class="handle-input mr10"></el-input>
        <el-input v-model="query.testCaseId" placeholder="用例" class="handle-input mr10"></el-input>


        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>

      <el-table :data="reportData" stripe class="table" ref="multipleTable" v-loading="loading">
        <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
        <el-table-column prop="name" label="名称" align="center"></el-table-column>
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

        <el-table-column label="操作" width="200" align="right">
          <template #default="scope">
            <div v-if="scope.row.execType !== 1" class="action-group">
              <el-button text :icon="Top" type="primary" @click="handleViewReport(scope.row.id)" v-permiss="1">预览</el-button>
              <el-button text :icon="Download" type="primary" @click="handleDownload(scope.row.id)" v-permiss="1">下载</el-button>
            </div>
            <div class="action-group">
              <el-button text :icon="Search" type="primary" @click="drawer = true,handleJMeterLog(scope.row.id)" v-permiss="1">日志</el-button>
              <el-button text :icon="Delete" type="danger" @click="handleDelete(scope.row.id)" v-permiss="1">删除</el-button>
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
<!--    <el-drawer v-model="drawer" title="jmeter.log日志" :show-close="true" :with-header="true" :size="'60%'">-->
<!--      <pre><div v-text="jmxLog"></div></pre>-->
<!--    </el-drawer>-->
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
  </div>
</template>

<script setup lang="ts" name="baseJmx">
import {ref, reactive, computed} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import VirtualTextViewer from '../components/VirtualTextViewer.vue';
import { Download, Search, Delete, Edit, Refresh, Top } from '@element-plus/icons-vue';
import {cleanReport, downloadReport, getLog, getReportList, viewReport} from "../api/report";
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
  creator: string;
  modifier: string;
  createTime: string;
  modifyTime: string;
}

const route = useRoute();

const query = reactive({
  name: route.query.name || null,          // 获取传递的name参数
  testCaseId: route.query.testCaseId || null,  // 获取传递的testCaseId参数
  page: 1,
  size: 10
});

const loading = ref(false);
const reportData = ref<ReportItem[]>([]);
const total = ref(0);
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

// 查看日志
const jmxLog = ref('');
const handleJMeterLog = async (id: number) => {
  const res = await getLog(id);
  console.log("res: ", res);
  jmxLog.value = res.data;
};

</script>

<style scoped>
</style>
