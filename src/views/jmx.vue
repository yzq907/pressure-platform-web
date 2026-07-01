<template>
  <div>
    <div class="container">
      <div class="handle-box">
        <el-input v-model="query.srcName" placeholder="脚本名称" class="handle-input mr10"></el-input>
        <el-input v-model="query.testCaseId" placeholder="用例" class="handle-input mr10"></el-input>

        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>

      <el-table :data="jmxData" stripe class="table" ref="multipleTable" v-loading="loading">
        <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
        <el-table-column prop="srcName" label="名称" align="center">
          <template #default="scope">
            <div @click="handleJmxDownload(scope.row.id, scope.row.dstName)" style="color: blue; cursor: pointer;">{{ scope.row.dstName }}</div>
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
              <el-button text :icon="Search" type="primary" @click="drawer = true,handleJmxView(scope.row.id)" v-permiss="'jmx'">预览</el-button>
              <el-button text :icon="Delete" type="danger" @click="handleJmxDelete(scope.row.id)" v-permiss="'jmx'">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无脚本数据" /></template>
      </el-table>

      <!--    抽屉展示详情 / 源码编辑 -->
      <el-drawer
          v-model="drawer"
          :title="jmxEditMode ? '源码编辑' : '脚本详情'"
          :show-close="true"
          :with-header="true"
          :size="'60%'"
      >
        <div class="drawer-actions" style="margin-bottom: 12px; text-align: right;" v-if="!jmxEditMode">
          <el-button type="primary" size="small" @click="enterJmxEdit">编辑</el-button>
        </div>
        <div class="drawer-actions" style="margin-bottom: 12px; text-align: right;" v-else>
          <el-button size="small" @click="cancelJmxEdit">取消</el-button>
          <el-button type="primary" size="small" @click="saveJmxEdit">保存</el-button>
        </div>
        <div class="log-content" style="height: calc(100% - 50px);">
          <VirtualTextViewer v-if="!jmxEditMode" :content="jmxFile" />
          <el-input
            v-else
            v-model="jmxEditContent"
            type="textarea"
            :rows="30"
            style="font-family: var(--font-mono, monospace);"
          />
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

<script setup lang="ts" name="baseJmx">
import {ref, reactive, computed} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import VirtualTextViewer from '../components/VirtualTextViewer.vue';
import { Plus, Search, Delete, Edit, Refresh, Top } from '@element-plus/icons-vue';
import {deleteJmx, viewJmx, getJmxList, downloadJmx, updateJmxContent} from "../api/jmx";
import {JmxItem} from "../common/item";
import {checkToLogin, handleTestCaseClick} from "../common/push";

const drawer = ref(false);
const jmxEditMode = ref(false);
const jmxEditContent = ref('');
const currentJmxId = ref(0);

const query = reactive({
  srcName: null,
  testCaseId: null,
  page: 1,
  size: 10
});

const loading = ref(false);
const jmxData = ref<JmxItem[]>([]);
const total = ref(0);
const getList = () => {
  loading.value = true;
  getJmxList(query).then(res => {
    checkToLogin(res.data.message);
    const code = res.data.code
    if (code != 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    jmxData.value = res.data.data.list;
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

const handleJmxDownload = async (id: number, jmxName: string) => {
  if (!jmxName) {
    ElMessage.error("jmx脚本文件不存在");
    return;
  }
  const res = await downloadJmx(id, jmxName);
  if (!res.success) {
    ElMessage.error("下载失败, 请重试");
  }
}

// 删除操作
const handleJmxDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除吗？', '提示', {
    type: 'warning'
  });
  const res = await deleteJmx(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("删除成功");
    await getList(); // 等待getList()执行完再继续
  }
};

// 预览操作
const jmxFile = ref('');
const handleJmxView = async (id: number) => {
  jmxEditMode.value = false;
  currentJmxId.value = id;
  const res = await viewJmx(id);
  jmxFile.value = res.data;
};

// 直接打开编辑模式
const handleJmxEditOpen = async (id: number) => {
  currentJmxId.value = id;
  const res = await viewJmx(id);
  jmxFile.value = res.data;
  jmxEditContent.value = res.data;
  jmxEditMode.value = true;
};

const enterJmxEdit = () => {
  jmxEditContent.value = jmxFile.value;
  jmxEditMode.value = true;
};

const cancelJmxEdit = () => {
  jmxEditMode.value = false;
};

const saveJmxEdit = async () => {
  const res = await updateJmxContent(currentJmxId.value, jmxEditContent.value);
  const code = res.data.code;
  if (code !== 0) {
    ElMessage.error(res.data.message || '保存失败');
  } else {
    ElMessage.success('保存成功');
    jmxFile.value = jmxEditContent.value;
    jmxEditMode.value = false;
  }
};

</script>

<style scoped>
</style>
