<template>
  <div>
    <div class="container">
      <div class="handle-box">
        <el-input v-model="query.srcName" placeholder="数据名称" class="handle-input mr10"></el-input>
        <el-input v-model="query.testCaseId" placeholder="用例" class="handle-input mr10"></el-input>

        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>

      <el-table :data="csvData" stripe class="table" ref="multipleTable" v-loading="loading">
        <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
        <el-table-column prop="srcName" label="名称" align="center">
          <template #default="scope">
            <div @click="handleCsvDownload(scope.row.id, scope.row.dstName)" style="color: blue; cursor: pointer;">{{ scope.row.dstName }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" align="center"></el-table-column>
        <el-table-column prop="testCaseId" label="用例" align="center">
          <template #default="scope">
            <span @click="handleTestCaseClick(scope.row.testCaseId)" style="cursor: pointer; color: blue;">{{ scope.row.testCaseId }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" align="center"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" align="center"></el-table-column>

        <el-table-column label="操作" width="170" align="right">
          <template #default="scope">
            <div class="action-group">
              <el-button text :icon="Search" type="primary" @click="drawer = true,handleCsvView(scope.row.id)" v-permiss="1">预览</el-button>
              <el-button text :icon="Delete" type="danger" @click="handleCsvDelete(scope.row.id)" v-permiss="1">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无数据文件" /></template>
      </el-table>

<!--      &lt;!&ndash;    抽屉展示详情&ndash;&gt;-->
<!--      <el-drawer v-model="drawer" title="数据详情" :show-close="true" :with-header="true" :size="'60%'">-->
<!--        <pre><div v-text="csvFile"></div></pre>-->
<!--      </el-drawer>-->
      <!--    抽屉展示详情-->
      <el-drawer
          v-model="drawer"
          title="数据详情"
          :show-close="true"
          :with-header="true"
          :size="'60%'"
      >
        <div class="log-content">
          <VirtualTextViewer :content="csvFile" />
        </div>
      </el-drawer>

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

  </div>
</template>

<script setup lang="ts" name="baseCsv">
import {ref, reactive, computed} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import VirtualTextViewer from '../components/VirtualTextViewer.vue';
import { Plus, Search, Delete, Edit, Refresh, Top } from '@element-plus/icons-vue';
import {deleteCsv, viewCsv, getCsvList, downloadCsv} from "../api/csv";
import {CsvItem} from "../common/item";
import {viewJmx} from "../api/jmx";
import {checkToLogin, handleTestCaseClick} from "../common/push";

const drawer = ref(false);

const query = reactive({
  srcName: null,
  testCaseId: null,
  page: 1,
  size: 10
});

const loading = ref(false);
const csvData = ref<CsvItem[]>([]);
const total = ref(0);
const getList = () => {
  loading.value = true;
  getCsvList(query).then(res => {
    checkToLogin(res.data.message);
    const code = res.data.code
    if (code != 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    csvData.value = res.data.data.list;
    total.value = res.data.data.total || 10;
  }).finally(() => { loading.value = false; });
};
getList();

// 查询操作
const handleSearch = () => {
  query.page = 1;
  if (query.srcName === '') query.srcName = null;
  if (query.testCaseId === '') query.testCaseId = null;
  getList();
};

const handleReset = () => {
  query.srcName = null;
  query.testCaseId = null;
  getList();
};

// 分页导航
const handlePageChange = (val: number) => {
  query.page = val;
  getList();
};

// 删除操作
const handleCsvDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除吗？', '提示', {
    type: 'warning'
  });
  const res = await deleteCsv(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("删除成功");
    await getList(); // 等待getList()执行完再继续
  }
};

const handleCsvDownload = async (id: number, csvName: string) => {
  if (!csvName) {
    ElMessage.error("csv数据文件不存在");
    return;
  }
  const res = await downloadCsv(id, csvName);
  if (!res.success) {
    ElMessage.error("下载失败, 请重试");
  }
}

// 预览操作
const csvFile = ref('');
const handleCsvView = async (id: number) => {
  const res = await viewCsv(id);
  csvFile.value = res.data;
};

</script>

<style scoped>
</style>
