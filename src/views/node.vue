<template>
  <div>
    <div class="container">
      <div class="handle-box">
        <el-input v-model="query.name" placeholder="节点名称" class="handle-input mr10"></el-input>
        <el-input v-model="query.host" placeholder="节点地址" class="handle-input mr10"></el-input>

        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <span class="handle-spacer"></span>
        <el-button type="primary" :icon="Plus" @click="handleInsert">新增</el-button>
      </div>

      <el-table :data="nodeData" stripe class="table" ref="multipleTable" v-loading="loading">
        <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
        <el-table-column prop="name" label="名称" align="center"></el-table-column>
        <el-table-column prop="description" label="描述" align="center"></el-table-column>
        <el-table-column prop="type" label="类型" :formatter="nodeTypeFormat" align="center"></el-table-column>
        <el-table-column prop="host" label="地址" align="center"></el-table-column>
        <el-table-column prop="username" label="用户" align="center"></el-table-column>
        <el-table-column prop="password" label="密码" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <span v-if="scope.row.status === 0" class="state-pill sp-idle"><span class="sp-dot"></span>禁用中</span>
            <span v-if="scope.row.status === 1" class="state-pill sp-success"><span class="sp-dot"></span>启用中</span>
            <span v-if="scope.row.status === 2" class="state-pill sp-error"><span class="sp-dot"></span>启动失败</span>
          </template>
        </el-table-column>
        <el-table-column prop="healthStatus" label="健康" align="center" width="90">
          <template #default="scope">
            <span v-if="scope.row.status !== 1" class="state-pill sp-idle"><span class="sp-dot"></span>未检测</span>
            <span v-else-if="scope.row.healthStatus === 1" class="state-pill sp-success"><span class="sp-dot"></span>在线</span>
            <span v-else class="state-pill sp-error"><span class="sp-dot"></span>离线</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastHeartbeat" label="最近心跳" align="center" width="160"></el-table-column>
        <el-table-column prop="cpuUsage" label="CPU%" align="center" width="80">
          <template #default="scope">
            <span v-if="scope.row.cpuUsage > 0">{{ scope.row.cpuUsage }}%</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="memUsage" label="内存%" align="center" width="80">
          <template #default="scope">
            <span v-if="scope.row.memUsage > 0">{{ scope.row.memUsage }}%</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="loadAvg" label="负载" align="center" width="70">
          <template #default="scope">
            <span v-if="scope.row.loadAvg > 0">{{ scope.row.loadAvg }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" align="center"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" align="center"></el-table-column>
        <el-table-column prop="modifier" label="修改人" align="center"></el-table-column>
        <el-table-column prop="modifyTime" label="修改时间" align="center"></el-table-column>
        <el-table-column prop="region" label="区域" align="center"></el-table-column>

        <el-table-column label="操作" width="200" align="right">
          <template #default="scope">
            <div class="action-group">
              <el-dropdown trigger="click">
                <el-button text :icon="Right" type="primary" v-permiss="'node'">操作</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item style="background-color:#D1E7DD;color:#4CAF50" @click="enableAction(scope.row.id)">启用</el-dropdown-item>
                    <el-dropdown-item style="background-color:#FFCDD2;color:#EF5350" @click="disableAction(scope.row.id)">禁用</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button text :icon="Refresh" type="primary" @click="syncAction(scope.row.id)" v-permiss="'node'">同步</el-button>
            </div>
            <div class="action-group">
              <el-button text :icon="Edit" type="primary" @click="handleEdit(scope.row)" v-permiss="'node'">编辑</el-button>
              <el-button text :icon="Delete" type="danger" @click="handleDelete(scope.row.id)" v-permiss="'node'">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无节点数据" /></template>
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


    <!-- 新增弹出框 -->
    <el-dialog title="新增" v-model="insertVisible" width="30%">
      <el-form label-width="70px">
        <el-form-item label="节点名称">
          <el-input v-model="insertForm.name" placeholder="节点名称"></el-input>
        </el-form-item>
        <el-form-item label="节点描述">
          <el-input v-model="insertForm.description" placeholder="节点描述"></el-input>
        </el-form-item>
        <el-form-item label="节点类型">
          <el-select v-model="insertForm.type" placeholder="节点类型">
            <el-option key="0" label="Slave" value="0"></el-option>
            <el-option key="1" label="Master" value="1"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="登录地址">
          <el-input v-model="insertForm.host" placeholder="节点IP地址"></el-input>
        </el-form-item>
        <el-form-item label="登录端口">
          <el-input v-model="insertForm.port" placeholder="ssh端口"></el-input>
        </el-form-item>
        <el-form-item label="登录用户">
          <el-input v-model="insertForm.username" placeholder="ssh用户"></el-input>
        </el-form-item>
        <el-form-item label="登录密码">
          <el-input v-model="insertForm.password" placeholder="登录密码"></el-input>
        </el-form-item>
        <el-form-item label="所属区域">
          <el-select v-model="insertForm.region" multiple filterable allow-create placeholder="选择区域">
            <el-option v-for="r in regionOptions" :key="r" :label="r" :value="r"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
				<span class="dialog-footer">
					<el-button @click="insertVisible = false">取 消</el-button>
					<el-button type="primary" @click="saveInsert">确 定</el-button>
				</span>
      </template>
    </el-dialog>

    <!-- 编辑弹出框 -->
    <el-dialog title="编辑" v-model="editVisible" width="30%">
      <el-form label-width="70px">
        <el-form-item label="编号">
          <el-input v-model="editForm.id" disabled></el-input>
        </el-form-item>
        <el-form-item label="节点名称">
          <el-input v-model="editForm.name"></el-input>
        </el-form-item>
        <el-form-item label="节点描述">
          <el-input v-model="editForm.description"></el-input>
        </el-form-item>
        <el-form-item label="节点类型">
          <el-select v-model="editForm.type" placeholder="节点类型">
            <el-option key="0" label="Slave" value="0"></el-option>
            <el-option key="1" label="Master" value="1"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="登录地址">
          <el-input v-model="editForm.host" placeholder="节点IP地址"></el-input>
        </el-form-item>
        <el-form-item label="登录端口">
          <el-input v-model="editForm.port" placeholder="ssh端口"></el-input>
        </el-form-item>
        <el-form-item label="登录用户">
          <el-input v-model="editForm.username" placeholder="ssh用户"></el-input>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="editForm.password"
            type="password"
            show-password
            placeholder="留空表示不修改密码"
          ></el-input>
        </el-form-item>
        <el-form-item label="所属区域">
          <el-select v-model="editForm.region" multiple filterable allow-create placeholder="选择区域">
            <el-option v-for="r in regionOptions" :key="r" :label="r" :value="r"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
				<span class="dialog-footer">
					<el-button @click="editVisible = false">取 消</el-button>
					<el-button type="primary" @click="saveEdit">确 定</el-button>
				</span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="baseNode">
import {ref, reactive, computed, onMounted} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import { Plus, Search, Delete, Edit, Refresh, Right } from '@element-plus/icons-vue';
import {addNode, deleteNode, disableNode, enableNode, getNodeList, updateNode} from "../api/node";
import {getOptions} from "../api/config";
import {codeToNodeStatus, codeToNodeType, nodeTypeToCode} from "../common/convert";
import {syncNode} from "../api/testcase";
import {checkToLogin} from "../common/push";

interface NodeItem {
  id: number;
  name: string;
  description: string;
  type: number;
  host: string;
  port: number;
  username: string;
  password: string;
  region: string;
  creator: string;
  modifier: string;
  createTime: string;
  modifyTime: string;
}

const nodeTypeFormat = (row: any) => {
  return codeToNodeType(row.type)
}

const query = reactive({
  name: null,
  host: null,
  page: 1,
  size: 10
});

const loading = ref(false);
const nodeData = ref<NodeItem[]>([]);
const total = ref(0);
const getList = () => {
  loading.value = true;
  getNodeList(query).then(res => {
    checkToLogin(res.data.message);
    const code = res.data.code
    if (code != 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    nodeData.value = res.data.data.list;
    total.value = res.data.data.total || 10;
  }).finally(() => { loading.value = false; });
};
getList();

// 查询操作
const handleSearch = () => {
  query.page = 1;
  if (query.name === '') query.name = null;
  if (query.host === '') query.host = null;
  getList();
};

const handleReset = () => {
  query.name = null;
  query.host = null;
  getList();
};

// 分页导航
const handlePageChange = (val: number) => {
  query.page = val;
  getList();
};

// 表格新增时弹窗和保存
const insertVisible = ref(false);
const regionOptions = ref<string[]>([]);
onMounted(async () => {
  try {
    const res = await getOptions('region');
    if (res.data.code === 0) regionOptions.value = res.data.data;
  } catch { /* ignore */ }
});

let insertForm = reactive({
  name: null,
  description: null,
  type: null,
  host: null,
  port: null,
  username: null,
  password: null,
  region: [] as string[]
});

const handleInsert = (row: any) => {
  insertForm.name = row.name;
  insertForm.description = row.description;
  insertForm.type = row.nodeType;
  insertForm.host = row.host;
  insertForm.port = row.port;
  insertForm.username = row.username;
  insertForm.password = row.password;
  insertForm.region = [];
  insertVisible.value = true;
};

const saveInsert = async () => {
  const body = { ...insertForm, region: insertForm.region.join(',') };
  const res = await addNode(body);

  const code = res.data.code;
  if (code !== 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("新增成功");
    insertVisible.value = false;
    await getList(); // 等待getList()执行完再继续
  }
};

// 删除操作
const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除吗？', '提示', {
    type: 'warning'
  });
  //const res = await deleteNode(nodeData.value[index].id);
  const res = await deleteNode(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("删除成功");
    await getList(); // 等待getList()执行完再继续
  }
};

// 表格编辑时弹窗和保存
const editVisible = ref(false);
let editForm = reactive({
  id: null,
  name: null,
  description: null,
  type: null,
  host: null,
  port: null,
  username: null,
  password: '',
  region: [] as string[]
});

const handleEdit = (row : any) => {
  editForm.id = row.id;
  editForm.name = row.name;
  editForm.description = row.description;
  editForm.type = codeToNodeType(row.type);
  editForm.host = row.host;
  editForm.port = row.port;
  editForm.username = row.username;
  editForm.password = '';
  editForm.region = (row.region || '').split(',').filter((s: string) => s.trim());
  editVisible.value = true;
};

const saveEdit = async () => {
  editForm.type = nodeTypeToCode(editForm.type);
  const body = { ...editForm, region: editForm.region.join(',') };
  if (!body.password || body.password === '******') {
    delete body.password;
  }
  const res = await updateNode(editForm.id, body);

  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("编辑成功");
    editVisible.value = false;
    await getList(); // 等待getList()执行完再继续
  }
};

//const isButtonActive = ref(false);
// const isButtonActive = ref(JSON.parse(localStorage.getItem('isButtonActive')) || false);
//
// const buttonText = computed(() => {
//   return isButtonActive.value ? '禁用' : '启用';
// });
//
// const handleButtonClick = (index: number) => {
//   if (isButtonActive.value) {
//     // 执行停止操作
//     disableAction(nodeData.value[index].id);
//   } else {
//     // 执行启动操作
//     enableAction(nodeData.value[index].id);
//   }
//   isButtonActive.value = !isButtonActive.value;
//   localStorage.setItem('isButtonActive', JSON.stringify(isButtonActive.value));
// };

const enableAction = async (id: number) => {
  await ElMessageBox.confirm('确定要启用吗？', '提示', {
    type: 'warning'
  });
  // 启动操作的代码
  const warningMessage = ElMessage.warning("启用进行中，请稍等片刻......");
  // 等待1秒，让warning提示信息显示一段时间
  await sleep(1000);
  // 关闭warning提示信息
  warningMessage.close();
  const res = await enableNode(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("启用成功");
    await getList(); // 等待getList()执行完再继续
  }
};

const disableAction = async (id: number) => {
  // 停止操作的代码
  const warningMessage = ElMessage.warning("禁用进行中，请稍等片刻......");
  // 等待1秒，让warning提示信息显示一段时间
  await sleep(1000);
  // 关闭warning提示信息
  warningMessage.close();

  const res = await disableNode(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("禁用成功");
    await getList(); // 等待getList()执行完再继续
  }
};

const syncAction = async (nodeId: number) => {
  await ElMessageBox.confirm('确定要同步数据吗？', '提示', {
    type: 'warning'
  });
  const warningMessage = ElMessage.warning("开始同步数据，请稍等片刻......");
  // 等待1秒，让warning提示信息显示一段时间
  await sleep(1000);
  // 关闭warning提示信息
  warningMessage.close();
  const res = await syncNode(nodeId);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("同步成功");
    await getList(); // 等待getList()执行完再继续
  }
}

// 定义sleep函数
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

</script>

<style scoped>
/* 操作列按钮对齐 —— 两行每行两个，等宽对齐 */
.action-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 2px;
}
.action-group:last-child {
  margin-bottom: 0;
}
.action-group :deep(.el-button) {
  justify-content: center;
  padding: 4px 0 !important;
  font-size: 13px;
  height: 28px;
  width: 100% !important;
  margin: 0 !important;
}
.action-group .el-dropdown {
  width: 100%;
}
</style>
