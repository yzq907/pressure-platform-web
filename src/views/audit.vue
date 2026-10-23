<template>
  <div>
    <div class="container">
      <div class="handle-box" style="flex-wrap:nowrap">
        <el-input v-model="query.username" placeholder="操作人" class="handle-input mr10" style="width:130px"></el-input>
        <el-select v-model="query.action" placeholder="操作类型" class="handle-select mr10" clearable style="width:120px">
          <el-option key="" label="全部" value=""></el-option>
          <el-option key="CREATE" label="创建" value="CREATE"></el-option>
          <el-option key="UPDATE" label="修改" value="UPDATE"></el-option>
          <el-option key="DELETE" label="删除" value="DELETE"></el-option>
          <el-option key="EXECUTE" label="执行" value="EXECUTE"></el-option>
          <el-option key="STOP" label="停止" value="STOP"></el-option>
        </el-select>
        <el-select v-model="query.resourceType" placeholder="资源类型" class="handle-select mr10" clearable style="width:120px">
          <el-option key="" label="全部" value=""></el-option>
          <el-option key="user" label="用户" value="user"></el-option>
          <el-option key="testcase" label="用例" value="testcase"></el-option>
          <el-option key="report" label="报告" value="report"></el-option>
          <el-option key="node" label="节点" value="node"></el-option>
          <el-option key="scheduled_task" label="定时任务" value="scheduled_task"></el-option>
          <el-option key="audit" label="审计日志" value="audit"></el-option>
        </el-select>

        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <el-button v-if="selectedLogs.length > 0" type="danger" :icon="Delete" :loading="deleting" @click="handleBatchDelete" v-permiss="'audit'">删除</el-button>
      </div>

      <el-table :data="auditData" stripe class="table" ref="multipleTable" v-loading="loading || deleting" row-key="id" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" align="center" :selectable="isLogSelectable"></el-table-column>
        <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
        <el-table-column prop="username" label="操作人" align="center" width="100"></el-table-column>
        <el-table-column prop="action" label="操作" align="center" width="90">
          <template #default="scope">
            <span v-if="scope.row.action === 'CREATE'" class="state-pill sp-success">创建</span>
            <span v-else-if="scope.row.action === 'UPDATE'" class="state-pill sp-load">修改</span>
            <span v-else-if="scope.row.action === 'DELETE'" class="state-pill sp-error">删除</span>
            <span v-else-if="scope.row.action === 'EXECUTE'" class="state-pill sp-primary">执行</span>
            <span v-else-if="scope.row.action === 'STOP'" class="state-pill sp-waiting">停止</span>
            <span v-else class="state-pill sp-idle">{{ scope.row.action }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="resourceType" label="资源" align="center" width="100">
          <template #default="scope">
            <span v-if="scope.row.resourceType === 'user'">用户</span>
            <span v-else-if="scope.row.resourceType === 'testcase'">用例</span>
            <span v-else-if="scope.row.resourceType === 'report'">报告</span>
            <span v-else-if="scope.row.resourceType === 'node'">节点</span>
            <span v-else-if="scope.row.resourceType === 'scheduled_task'">定时任务</span>
            <span v-else-if="scope.row.resourceType === 'audit'">审计日志</span>
            <span v-else>{{ scope.row.resourceType }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="resourceId" label="资源ID" align="center" width="80"></el-table-column>
        <el-table-column prop="resourceName" label="资源名" align="center"></el-table-column>
        <el-table-column prop="detail" label="详情" align="center" min-width="160">
          <template #default="scope">
            <span v-if="scope.row.detail" style="color: var(--color-fg-secondary); font-size: 12px;">{{ scope.row.detail }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" align="center" width="120"></el-table-column>
        <el-table-column prop="createTime" label="操作时间" align="center" width="160"></el-table-column>
        <template #empty><el-empty description="暂无审计日志" /></template>
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
  </div>
</template>

<script setup lang="ts" name="baseAudit">
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Delete } from '@element-plus/icons-vue';
import { getAuditLogList, cleanAuditLogs } from "../api/audit";
import { checkToLogin } from "../common/push";

interface AuditItem {
  id: number;
  username: string;
  action: string;
  resourceType: string;
  resourceId: number;
  resourceName: string;
  detail: string;
  ip: string;
  createTime: string;
}

const query = reactive({
  username: null,
  action: null,
  resourceType: null,
  page: 1,
  size: 10
});

const loading = ref(false);
const auditData = ref<AuditItem[]>([]);
const total = ref(0);
const multipleTable = ref<{ clearSelection: () => void } | null>(null);
const selectedLogs = ref<AuditItem[]>([]);
const deleting = ref(false);
let listRequestId = 0;

const isLogSelectable = () => !loading.value && !deleting.value;
const handleSelectionChange = (rows: AuditItem[]) => {
  const visibleIds = new Set(auditData.value.map((row) => row.id));
  const seen = new Set<number>();
  selectedLogs.value = rows.filter((row) => {
    if (!visibleIds.has(row.id) || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
};
const clearSelection = () => {
  selectedLogs.value = [];
  multipleTable.value?.clearSelection();
};

const getList = async (): Promise<boolean> => {
  const requestId = ++listRequestId;
  clearSelection();
  loading.value = true;
  const params: any = { page: query.page, size: query.size };
  if (query.username) params.username = query.username;
  if (query.action) params.action = query.action;
  if (query.resourceType) params.resourceType = query.resourceType;
  try {
    const res = await getAuditLogList(params);
    if (requestId !== listRequestId) return false;
    checkToLogin(res.data.message);
    const code = res.data.code;
    if (code !== 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    auditData.value = res.data.data.list;
    total.value = res.data.data.total || 0;
    const lastPage = Math.max(1, Math.ceil(total.value / query.size));
    if (query.page > lastPage) {
      query.page = lastPage;
      return await getList();
    }
    return true;
  } catch (e) {
    if (requestId !== listRequestId) return false;
    ElMessage.error('审计日志读取失败，请重试');
    return false;
  } finally {
    if (requestId === listRequestId) loading.value = false;
  }
};
getList();

const handleSearch = () => { query.page = 1; getList(); };
const handleReset = () => { query.page = 1; query.username = null; query.action = null; query.resourceType = null; getList(); };
const handlePageChange = (val: number) => { query.page = val; getList(); };

const handleBatchDelete = async () => {
  if (deleting.value || loading.value || selectedLogs.value.length === 0) return;
  const ids = selectedLogs.value.map((row) => row.id);
  deleting.value = true;
  try {
    try {
      await ElMessageBox.confirm(
        `确定删除选中的 ${ids.length} 条审计日志吗？此操作不可恢复。`,
        '删除审计日志', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
      );
    } catch (e) {
      return;
    }
    const res = await cleanAuditLogs(ids);
    checkToLogin(res.data.message);
    if (res.data.code !== 0) {
      ElMessage.error(res.data.message || '删除失败');
      return;
    }
    const deletedIds: number[] = res.data.data.deletedIds || [];
    const failures: Array<{ id: number; message: string }> = res.data.data.failures || [];
    const summary = `删除完成：成功 ${deletedIds.length} 条，失败 ${failures.length} 条`;
    if (failures.length) {
      ElMessage({
        type: 'warning', showClose: true, duration: 10000,
        message: `${summary}；${failures.map((item) => `#${item.id}：${item.message}`).join('；')}`,
      });
    } else {
      ElMessage.success(summary);
    }
    await getList();
  } catch (e) {
    ElMessage.error('删除请求失败，日志可能已删除，请刷新列表核实后重试');
  } finally {
    deleting.value = false;
  }
};
</script>

<style scoped>
</style>
