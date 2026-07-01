<template>
  <div>
    <div class="container">
      <div class="handle-box">
        <div class="handle-left">
          <el-input v-model="query.filename" placeholder="文件名称" class="handle-input mr10"></el-input>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </div>
        <div class="handle-right">
          <el-upload action="" multiple :show-file-list="false" :http-request="handlePublicCsvUpload">
            <el-button type="primary">上传文件</el-button>
          </el-upload>
        </div>
      </div>

      <el-table :data="csvData" stripe class="table" v-loading="loading">
        <el-table-column prop="id" label="编号" width="70" align="center"></el-table-column>
        <el-table-column prop="filename" label="名称" min-width="180" align="center">
          <template #default="scope">
            <div @click="handleCsvDownload(scope.row.filename)" style="color: blue; cursor: pointer;">
              {{ scope.row.filename }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="160" align="center"></el-table-column>
        <el-table-column label="类型" width="110" align="center">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.fileType === 'csv' ? 'success' : 'info'">
              {{ scope.row.fileType === 'csv' ? '参数化' : '上传文件' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="110" align="center">
          <template #default="scope">{{ formatBytes(scope.row.fileSize || 0) }}</template>
        </el-table-column>
        <el-table-column prop="referenceCount" label="引用数" width="90" align="center"></el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.exists ? 'success' : 'warning'" size="small">
              {{ scope.row.exists ? '存在' : '缺失' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="110" align="center"></el-table-column>
        <el-table-column prop="modifyTime" label="更新时间" width="170" align="center"></el-table-column>
        <el-table-column label="操作" width="190" align="right">
          <template #default="scope">
            <div class="action-group">
              <el-button text :icon="Search" type="primary" @click="drawer = true, handleCsvView(scope.row.filename)" v-permiss="'csv'">预览</el-button>
              <el-button text :icon="Delete" type="danger" @click="handleCsvDelete(scope.row.filename)" v-permiss="'csv'">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无公共文件" /></template>
      </el-table>

      <el-drawer
          v-model="drawer"
          :title="csvEditMode ? '编辑数据' : '数据详情'"
          :show-close="true"
          :with-header="true"
          :size="'80%'"
      >
        <div class="drawer-actions" style="margin-bottom: 12px; text-align: right;" v-if="!csvEditMode">
          <el-button type="primary" size="small" @click="enterCsvEdit">编辑</el-button>
        </div>
        <div class="drawer-actions" style="margin-bottom: 12px; text-align: right;" v-else>
          <el-button size="small" @click="cancelCsvEdit">取消</el-button>
          <el-button type="primary" size="small" @click="saveCsvEdit">保存</el-button>
        </div>

        <div class="log-content" style="height: calc(100% - 50px);" v-if="!csvEditMode">
          <VirtualTextViewer :content="csvFile" />
        </div>

        <div v-else style="height: calc(100% - 50px);">
          <el-input
            v-model="csvTextContent"
            type="textarea"
            :rows="35"
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

<script setup lang="ts" name="baseCsv">
import {ref, reactive} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import VirtualTextViewer from '../components/VirtualTextViewer.vue';
import { Search, Delete, Refresh } from '@element-plus/icons-vue';
import {
  deletePublicCsv,
  downloadPublicCsv,
  getPublicCsvList,
  updatePublicCsv,
  uploadPublicCsv,
  viewPublicCsv
} from "../api/csv";
import {checkToLogin} from "../common/push";

interface PublicCsvItem {
  id: number;
  filename: string;
  fileType: string;
  description: string;
  fileSize: number;
  referenceCount: number;
  csvReferenceCount: number;
  uploadFileReferenceCount: number;
  exists: boolean;
  creator: string;
  modifyTime: string;
}

const drawer = ref(false);
const csvEditMode = ref(false);
const csvTextContent = ref('');
const currentFilename = ref('');

const query = reactive({
  filename: null as string | null,
  page: 1,
  size: 10
});

const loading = ref(false);
const csvData = ref<PublicCsvItem[]>([]);
const total = ref(0);

const getList = () => {
  loading.value = true;
  getPublicCsvList(query).then(res => {
    checkToLogin(res.data.message);
    const code = res.data.code;
    if (code != 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    csvData.value = res.data.data.list;
    total.value = res.data.data.total || 0;
  }).finally(() => { loading.value = false; });
};
getList();

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const handleSearch = () => {
  query.page = 1;
  if (query.filename === '') query.filename = null;
  getList();
};

const handleReset = () => {
  query.filename = null;
  query.page = 1;
  getList();
};

const handlePageChange = (val: number) => {
  query.page = val;
  getList();
};

const uploadCsvFile = async (file: File, overwrite = false) => {
  const formData = new FormData();
  formData.append('csvFile', file);
  return uploadPublicCsv(formData, overwrite);
};

const handlePublicCsvUpload = async (uploadRequestOptions: any) => {
  const file = uploadRequestOptions.file as File;
  const res = await uploadCsvFile(file, false);
  const code = res.data.code;
  if (code === 0) {
    ElMessage.success('上传成功');
    await getList();
    return;
  }
  if (res.data.message && res.data.message.includes('已存在')) {
    await ElMessageBox.confirm(`${file.name} 已存在，覆盖后所有引用该文件的用例会使用新内容，确认覆盖？`, '确认覆盖', {
      type: 'warning'
    });
    const overwrite = await uploadCsvFile(file, true);
    if (overwrite.data.code === 0) {
      ElMessage.success('覆盖成功');
      await getList();
    } else {
      ElMessage.error(overwrite.data.message || '覆盖失败');
    }
    return;
  }
  ElMessage.error(res.data.message || '上传失败');
};

const handleCsvDelete = async (filename: string) => {
  await ElMessageBox.confirm(`确定要删除 ${filename} 吗？`, '提示', { type: 'warning' });
  const res = await deletePublicCsv(filename, false);
  const code = res.data.code;
  if (code === 0) {
    ElMessage.success("删除成功");
    await getList();
    return;
  }
  if (res.data.message && res.data.message.includes('引用')) {
    await ElMessageBox.confirm(res.data.message, '文件被引用', { type: 'warning' });
    const force = await deletePublicCsv(filename, true);
    if (force.data.code === 0) {
      ElMessage.success('删除成功');
      await getList();
    } else {
      ElMessage.error(force.data.message || '删除失败');
    }
    return;
  }
  ElMessage.error(res.data.message || '删除失败');
};

const handleCsvDownload = async (filename: string) => {
  if (!filename) {
    ElMessage.error("csv数据文件不存在");
    return;
  }
  const res = await downloadPublicCsv(filename);
  if (!res.success) {
    ElMessage.error("下载失败, 请重试");
  }
};

const csvFile = ref('');
const handleCsvView = async (filename: string) => {
  csvEditMode.value = false;
  currentFilename.value = filename;
  const res = await viewPublicCsv(filename);
  csvFile.value = res.data;
};

const enterCsvEdit = () => {
  csvTextContent.value = csvFile.value;
  csvEditMode.value = true;
};

const cancelCsvEdit = () => {
  csvEditMode.value = false;
};

const saveCsvEdit = async () => {
  const res = await updatePublicCsv(currentFilename.value, csvTextContent.value);
  const code = res.data.code;
  if (code !== 0) {
    ElMessage.error(res.data.message || '保存失败');
  } else {
    ElMessage.success('保存成功');
    csvFile.value = csvTextContent.value;
    csvEditMode.value = false;
    await getList();
  }
};
</script>

<style scoped>
.handle-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.handle-left,
.handle-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.handle-left {
  flex-wrap: wrap;
}
</style>
