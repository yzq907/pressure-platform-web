<template>
  <div>
    <div class="container">
      <!-- 业务选项配置 -->
      <el-card shadow="hover" style="margin-bottom: 20px;">
        <template #header>
          <div style="font-weight: bold;">业务选项配置</div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <div style="margin-bottom: 10px; font-weight: bold;">产品线</div>
            <div style="margin-bottom: 10px;">
              <el-tag
                v-for="(item, index) in bizOptions"
                :key="index"
                closable
                @close="removeOption('biz', item, index)"
                style="margin-right: 8px; margin-bottom: 5px;"
              >
                {{ item }}
              </el-tag>
              <el-input
                v-if="bizInputVisible"
                ref="bizInputRef"
                v-model="bizInputValue"
                size="small"
                style="width: 120px;"
                @keyup.enter="handleAddOption('biz')"
                @blur="handleAddOption('biz')"
              />
              <el-button v-else size="small" @click="showInput('biz')">+ 新增产品</el-button>
            </div>
          </el-col>

          <el-col :span="6">
            <div style="margin-bottom: 10px; font-weight: bold;">服务</div>
            <div style="margin-bottom: 10px;">
              <el-tag
                v-for="(item, index) in serviceOptions"
                :key="index"
                closable
                @close="removeOption('service', item, index)"
                style="margin-right: 8px; margin-bottom: 5px;"
              >
                {{ item }}
              </el-tag>
              <el-input
                v-if="serviceInputVisible"
                ref="serviceInputRef"
                v-model="serviceInputValue"
                size="small"
                style="width: 120px;"
                @keyup.enter="handleAddOption('service')"
                @blur="handleAddOption('service')"
              />
              <el-button v-else size="small" @click="showInput('service')">+ 新增服务</el-button>
            </div>
          </el-col>

          <el-col :span="6">
            <div style="margin-bottom: 10px; font-weight: bold;">版本</div>
            <div style="margin-bottom: 10px;">
              <el-tag
                v-for="(item, index) in versionOptions"
                :key="index"
                closable
                @close="removeOption('version', item, index)"
                style="margin-right: 8px; margin-bottom: 5px;"
              >
                {{ item }}
              </el-tag>
              <el-input
                v-if="versionInputVisible"
                ref="versionInputRef"
                v-model="versionInputValue"
                size="small"
                style="width: 120px;"
                @keyup.enter="handleAddOption('version')"
                @blur="handleAddOption('version')"
              />
              <el-button v-else size="small" @click="showInput('version')">+ 新增版本</el-button>
            </div>
          </el-col>

          <el-col :span="6">
            <div style="margin-bottom: 10px; font-weight: bold;">区域</div>
            <div style="margin-bottom: 10px;">
              <el-tag
                v-for="(item, index) in regionOptions"
                :key="index"
                closable
                @close="removeOption('region', item, index)"
                style="margin-right: 8px; margin-bottom: 5px;"
              >
                {{ item }}
              </el-tag>
              <el-input
                v-if="regionInputVisible"
                ref="regionInputRef"
                v-model="regionInputValue"
                size="small"
                style="width: 120px;"
                @keyup.enter="handleAddOption('region')"
                @blur="handleAddOption('region')"
              />
              <el-button v-else size="small" @click="showInput('region')">+ 新增区域</el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 系统配置 -->
      <el-card shadow="hover" style="margin-bottom: 20px;">
        <template #header>
          <div style="font-weight: bold;">系统配置</div>
        </template>

        <el-form label-width="140px" style="max-width: 480px;">
          <el-form-item label="报告保留天数">
            <el-input-number
              v-model="reportRetentionDays"
              :min="0"
              :max="3650"
              :step="1"
              step-strictly
              style="width: 160px;"
            />
            <span style="margin-left: 12px; color: #909399; font-size: 13px;">0 表示永久保存</span>
          </el-form-item>
          <el-form-item label="审计日志保留天数">
            <el-input-number
              v-model="auditRetentionDays"
              :min="7"
              :max="365"
              :step="1"
              step-strictly
              style="width: 160px;"
            />
            <span style="margin-left: 12px; color: #909399; font-size: 13px;">范围 7~365 天</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveRetentionConfig">保存</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <div class="handle-box">
        <el-input v-model="query.configKey" placeholder="配置字段" class="handle-input mr10"></el-input>

        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <el-button type="primary" :icon="Plus" @click="handleInsert">新增</el-button>
      </div>

      <el-table :data="configData" stripe class="table" ref="multipleTable" v-loading="loading">
        <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
        <el-table-column prop="configKey" label="配置字段" align="center"></el-table-column>
        <el-table-column prop="configValue" label="字段值" align="center"></el-table-column>
        <el-table-column prop="description" label="字段描述" align="center"></el-table-column>
        <el-table-column prop="creator" label="创建人" align="center"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" align="center"></el-table-column>
        <el-table-column prop="modifier" label="修改人" align="center"></el-table-column>
        <el-table-column prop="modifyTime" label="修改时间" align="center"></el-table-column>

        <el-table-column label="操作" width="170" align="right">
          <template #default="scope">
            <div class="action-group">
              <el-button text :icon="Edit" type="primary" @click="handleEdit(scope.row)" v-permiss="1">编辑</el-button>
              <el-button text :icon="Delete" type="danger" @click="handleDelete(scope.row.id)" v-permiss="1">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无配置数据" /></template>
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
        <el-form-item label="配置字段">
          <el-input v-model="insertForm.configKey" placeholder="配置字段"></el-input>
        </el-form-item>
        <el-form-item label="字段值">
          <el-input v-model="insertForm.configValue" placeholder="字段值"></el-input>
        </el-form-item>
        <el-form-item label="字段描述">
          <el-input v-model="insertForm.description" placeholder="字段描述"></el-input>
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
        <el-form-item label="配置字段">
          <el-input v-model="editForm.configKey" disabled></el-input>
        </el-form-item>
        <el-form-item label="字段值">
          <el-input v-model="editForm.configValue"></el-input>
        </el-form-item>
        <el-form-item label="字段描述">
          <el-input v-model="editForm.description"></el-input>
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

<script setup lang="ts" name="baseConfig">
import { ref, reactive } from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import { Plus, Search, Delete, Edit, Refresh } from '@element-plus/icons-vue';
import {addConfig, deleteConfig, getConfigList, updateConfig, getOptions} from "../api/config";
import {checkToLogin} from "../common/push";

interface ConfigItem {
  id: number;
  configKey: string;
  configValue: string;
  description: string;
  creator: string;
  modifier: string;
  createTime: string;
  modifyTime: string;
}

const query = reactive({
  configKey: null,
  page: 1,
  size: 10
});

const loading = ref(false);
const configData = ref<ConfigItem[]>([]);
const total = ref(0);

// 系统配置
const reportRetentionDays = ref(0);
const auditRetentionDays = ref(30);
const retentionConfigId = ref<number | null>(null);
const auditRetentionConfigId = ref<number | null>(null);

const loadRetentionConfig = async () => {
  const [reportRes, auditRes] = await Promise.all([
    getConfigList({ configKey: 'REPORT_RETENTION_DAYS', page: 1, size: 1 }),
    getConfigList({ configKey: 'AUDIT_RETENTION_DAYS', page: 1, size: 1 }),
  ]);
  if (reportRes.data.code === 0 && reportRes.data.data.list.length > 0) {
    const item = reportRes.data.data.list[0];
    retentionConfigId.value = item.id;
    const val = parseInt(item.configValue, 10);
    reportRetentionDays.value = isNaN(val) ? 0 : Math.max(0, Math.min(3650, val));
  } else {
    retentionConfigId.value = null;
    reportRetentionDays.value = 0;
  }
  if (auditRes.data.code === 0 && auditRes.data.data.list.length > 0) {
    const item = auditRes.data.data.list[0];
    auditRetentionConfigId.value = item.id;
    const val = parseInt(item.configValue, 10);
    auditRetentionDays.value = isNaN(val) ? 30 : Math.max(7, Math.min(365, val));
  } else {
    auditRetentionConfigId.value = null;
    auditRetentionDays.value = 30;
  }
};

const saveRetentionConfig = async () => {
  const reportVal = Math.max(0, Math.min(3650, reportRetentionDays.value));
  reportRetentionDays.value = reportVal;
  const auditVal = Math.max(7, Math.min(365, auditRetentionDays.value));
  auditRetentionDays.value = auditVal;

  // 保存报告保留天数
  if (retentionConfigId.value) {
    await updateConfig(retentionConfigId.value, {
      configKey: 'REPORT_RETENTION_DAYS',
      configValue: String(reportVal),
      description: '测试报告保留天数，0表示永久保存'
    });
  } else {
    const res = await addConfig({
      configKey: 'REPORT_RETENTION_DAYS',
      configValue: String(reportVal),
      description: '测试报告保留天数，0表示永久保存'
    });
    if (res.data.code === 0) retentionConfigId.value = res.data.data;
  }

  // 保存审计日志保留天数
  if (auditRetentionConfigId.value) {
    await updateConfig(auditRetentionConfigId.value, {
      configKey: 'AUDIT_RETENTION_DAYS',
      configValue: String(auditVal),
      description: '审计日志保留天数，范围7~365'
    });
  } else {
    const res = await addConfig({
      configKey: 'AUDIT_RETENTION_DAYS',
      configValue: String(auditVal),
      description: '审计日志保留天数，范围7~365'
    });
    if (res.data.code === 0) auditRetentionConfigId.value = res.data.data;
  }

  ElMessage.success('保存成功');
};
const getList = () => {
  loading.value = true;
  getConfigList(query).then(res => {
    checkToLogin(res.data.message);
    const code = res.data.code
    if (code != 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    configData.value = res.data.data.list;
    total.value = res.data.data.total || 10;
  }).finally(() => { loading.value = false; });
};
getList();
loadRetentionConfig();

// ========== 业务选项管理 ==========
const optionConfigIds = reactive({ biz: null, service: null, version: null, region: null });

const bizOptions = ref<string[]>([]);
const serviceOptions = ref<string[]>([]);
const versionOptions = ref<string[]>([]);
const regionOptions = ref<string[]>([]);

const bizInputVisible = ref(false);
const bizInputValue = ref('');
const bizInputRef = ref<any>(null);

const serviceInputVisible = ref(false);
const serviceInputValue = ref('');
const serviceInputRef = ref<any>(null);

const versionInputVisible = ref(false);
const versionInputValue = ref('');
const versionInputRef = ref<any>(null);

const regionInputVisible = ref(false);
const regionInputValue = ref('');
const regionInputRef = ref<any>(null);

const optionKeyMap = { biz: 'BIZ_OPTIONS', service: 'SERVICE_OPTIONS', version: 'VERSION_OPTIONS', region: 'REGION_OPTIONS' };
const optionDescMap = { biz: '产品线选项配置', service: '服务选项配置', version: '版本选项配置', region: '区域选项配置' };

const loadOptions = async () => {
  for (const type of ['biz', 'service', 'version', 'region'] as const) {
    const res = await getOptions(type);
    const code = res.data.code;
    if (code === 0) {
      if (type === 'biz') bizOptions.value = res.data.data;
      else if (type === 'service') serviceOptions.value = res.data.data;
      else if (type === 'version') versionOptions.value = res.data.data;
      else if (type === 'region') regionOptions.value = res.data.data;
    }
  }
  // 同时获取对应 config 项的 id，用于后续更新
  const configRes = await getConfigList({ configKey: 'OPTIONS', page: 1, size: 100 });
  if (configRes.data.code === 0) {
    configRes.data.data.list.forEach((item: any) => {
      if (item.configKey === 'BIZ_OPTIONS') optionConfigIds.biz = item.id;
      if (item.configKey === 'SERVICE_OPTIONS') optionConfigIds.service = item.id;
      if (item.configKey === 'VERSION_OPTIONS') optionConfigIds.version = item.id;
      if (item.configKey === 'REGION_OPTIONS') optionConfigIds.region = item.id;
    });
  }
};
loadOptions();

const showInput = (type: string) => {
  if (type === 'biz') bizInputVisible.value = true;
  else if (type === 'service') serviceInputVisible.value = true;
  else if (type === 'version') versionInputVisible.value = true;
  else if (type === 'region') regionInputVisible.value = true;
};

const handleAddOption = async (type: string) => {
  let value = '';
  let list: string[] = [];
  if (type === 'biz') { value = bizInputValue.value; list = bizOptions.value; bizInputVisible.value = false; }
  else if (type === 'service') { value = serviceInputValue.value; list = serviceOptions.value; serviceInputVisible.value = false; }
  else if (type === 'version') { value = versionInputValue.value; list = versionOptions.value; versionInputVisible.value = false; }
  else if (type === 'region') { value = regionInputValue.value; list = regionOptions.value; regionInputVisible.value = false; }

  if (!value || value.trim() === '') return;
  value = value.trim();
  if (list.includes(value)) {
    ElMessage.warning('该选项已存在');
    return;
  }
  list.push(value);
  await saveOptionConfig(type, list);

  if (type === 'biz') bizInputValue.value = '';
  else if (type === 'service') serviceInputValue.value = '';
  else if (type === 'version') versionInputValue.value = '';
  else if (type === 'region') regionInputValue.value = '';
};

const removeOption = async (type: string, item: string, index: number) => {
  let list: string[] = [];
  if (type === 'biz') list = bizOptions.value;
  else if (type === 'service') list = serviceOptions.value;
  else if (type === 'version') list = versionOptions.value;
  else if (type === 'region') list = regionOptions.value;

  list.splice(index, 1);
  await saveOptionConfig(type, list);
};

const saveOptionConfig = async (type: string, list: string[]) => {
  const key = optionKeyMap[type];
  const desc = optionDescMap[type];
  const configValue = list.join(',');
  const configId = optionConfigIds[type];

  if (configId) {
    const res = await updateConfig(configId, { configKey: key, configValue, description: desc });
    if (res.data.code !== 0) {
      ElMessage.error(res.data.message);
    } else {
      ElMessage.success('保存成功');
    }
  } else {
    const res = await addConfig({ configKey: key, configValue, description: desc });
    if (res.data.code !== 0) {
      ElMessage.error(res.data.message);
    } else {
      optionConfigIds[type] = res.data.data;
      ElMessage.success('保存成功');
    }
  }
};

// 查询操作
const handleSearch = () => {
  query.page = 1;
  if (query.configKey === '') query.configKey = null;
  getList();
};

const handleReset = () => {
  query.configKey = null;
  getList();
};

// 分页导航
const handlePageChange = (val: number) => {
  query.page = val;
  getList();
};

// 表格新增时弹窗和保存
const insertVisible = ref(false);
let insertForm = reactive({
  configKey: null,
  configValue: null,
  description: null
});

const handleInsert = (row: any) => {
  insertForm.configKey = row.configKey;
  insertForm.configValue = row.configValue;
  insertForm.description = row.description;
  insertVisible.value = true;
};

const saveInsert = async () => {
  const res = await addConfig(insertForm);

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
  const res = await deleteConfig(id);
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
  configKey: null,
  configValue: null,
  description: null,
});

const handleEdit = (row : any) => {
  editForm.id = row.id;
  editForm.configKey = row.configKey;
  editForm.configValue = row.configValue;
  editForm.description = row.description;
  editVisible.value = true;
};

const saveEdit = async () => {
  const res = await updateConfig(editForm.id, editForm);

  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("编辑成功");
    editVisible.value = false;
    await getList(); // 等待getList()执行完再继续
  }
};

</script>

<style scoped>
</style>
