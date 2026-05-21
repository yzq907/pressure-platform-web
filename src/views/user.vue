<template>
  <div>
    <div class="container">
      <div class="handle-box">
        <el-input v-model="query.username" placeholder="用户" class="handle-input mr10"></el-input>
        <el-input v-model="query.realName" placeholder="姓名" class="handle-input mr10"></el-input>

        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <el-button type="primary" :icon="Plus" @click="handleInsert">新增</el-button>
      </div>

      <el-table :data="userData" stripe class="table" ref="multipleTable" v-loading="loading">
        <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
        <el-table-column prop="username" label="用户" align="center"></el-table-column>
        <el-table-column prop="password" label="密码" align="center"></el-table-column>
        <el-table-column prop="realName" label="姓名" align="center"></el-table-column>
        <el-table-column prop="effectTime" label="登录时间" align="center"></el-table-column>
        <el-table-column label="操作" align="right" width="200">
          <template #default="scope">
            <div class="action-group">
              <el-button text type="primary" @click="handleUpdatePassword(scope.row)">修改密码</el-button>
              <el-button text type="danger" :disabled="scope.row.username === 'admin'" @click="handleDelete(scope.row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无用户数据" /></template>
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
      <el-form ref="insertFormRef" :model="insertForm" :rules="insertRules" label-width="70px">
        <el-form-item label="用户" prop="username">
          <el-input v-model="insertForm.username"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="insertForm.password" type="password" show-password placeholder="请输入密码"></el-input>
          <div class="pwd-hint">长度8~64位，须同时包含大写字母、小写字母和数字</div>
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="insertForm.realName"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
				<span class="dialog-footer">
					<el-button @click="insertVisible = false">取 消</el-button>
					<el-button type="primary" @click="saveInsert">确 定</el-button>
				</span>
      </template>
    </el-dialog>

    <!-- 修改密码弹出框 -->
    <el-dialog :title="pwdDialogTitle" v-model="pwdVisible" width="30%">
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="90px">
        <el-form-item label="旧密码" prop="oldPassword" v-if="pwdIsSelf">
          <el-input type="password" v-model="pwdForm.oldPassword" placeholder="请输入旧密码"></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input type="password" v-model="pwdForm.newPassword" show-password placeholder="请输入新密码"></el-input>
          <div class="pwd-hint">长度8~64位，须同时包含大写字母、小写字母和数字</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pwdVisible = false">取 消</el-button>
          <el-button type="primary" @click="savePassword">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="baseUser">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import {ElMessage, ElMessageBox} from 'element-plus';
import { Plus, Search, Delete, Refresh } from '@element-plus/icons-vue';
import {addUser, deleteUser, getUserList, updatePassword} from "../api/user";
import {checkToLogin} from "../common/push";

interface UserItem {
  id: number;
  username: string;
  password: string;
  realName: string;
  effectTime: string;
  expireTime: string;
}

const router = useRouter();
const currentUsername = localStorage.getItem('ms_username') || '';

const query = reactive({
  username: null,
  realName: null,
  page: 1,
  size: 10
});

const loading = ref(false);
const userData = ref<UserItem[]>([]);
const total = ref(0);
const getList = () => {
  loading.value = true;
  getUserList(query).then(res => {
    checkToLogin(res.data.message);
    const code = res.data.code
    if (code != 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    userData.value = res.data.data.list;
    total.value = res.data.data.total || 10;
  }).finally(() => { loading.value = false; });
};
getList();

// 查询操作
const handleSearch = () => {
  query.page = 1;
  if (query.realName === '') query.realName = null;
  if (query.username === '') query.username = null;
  getList();
};

const handleReset = () => {
  query.realName = null;
  query.username = null;
  getList();
};

// 分页导航
const handlePageChange = (val: number) => {
  query.page = val;
  getList();
};

// 表格新增时弹窗和保存
const insertVisible = ref(false);
const insertFormRef = ref<FormInstance>();
let insertForm = reactive({
  username: '',
  password: '',
  realName: ''
});

const insertRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: (err?: Error) => void) => {
        if (!value || value.length < 8) return callback(new Error('密码长度不能少于8位'));
        if (value.length > 64) return callback(new Error('密码长度不能超过64位'));
        if (!/[A-Z]/.test(value)) return callback(new Error('密码必须包含大写字母 A-Z'));
        if (!/[a-z]/.test(value)) return callback(new Error('密码必须包含小写字母 a-z'));
        if (!/[0-9]/.test(value)) return callback(new Error('密码必须包含数字 0-9'));
        callback();
      }, trigger: 'blur'
    }
  ],
};

const handleInsert = () => {
  insertForm.username = '';
  insertForm.password = '';
  insertForm.realName = '';
  insertVisible.value = true;
};

const saveInsert = async () => {
  if (!insertFormRef.value) return;
  const valid = await insertFormRef.value.validate().catch(() => false);
  if (!valid) return;

  const res = await addUser(insertForm);

  const code = res.data.code;
  if (code !== 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("新增成功");
    insertVisible.value = false;
    await getList(); // 等待getList()执行完再继续
  }
};

// const saveInsert = () => {
//   insertVisible.value = false;
//   addUser(insertForm).then(res => {
//     const code = res.data.code;
//     if (code !== 0) {
//       ElMessage.error(res.data.message);
//     } else {
//       ElMessage.success("新增成功");
//       getList(); // 等待getList()执行完再继续
//     }
//   })
// };

// 修改密码弹窗和保存
const pwdVisible = ref(false);
const pwdFormRef = ref<FormInstance>();
const pwdForm = reactive({
  id: 0,
  oldPassword: null,
  newPassword: null
});
const pwdTargetUsername = ref('');
const pwdIsSelf = computed(() => pwdTargetUsername.value === currentUsername);
const pwdDialogTitle = computed(() => {
  if (pwdIsSelf.value) return '修改密码';
  return `重置密码 - ${pwdTargetUsername.value}`;
});

const pwdRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: (err?: Error) => void) => {
        if (!value || value.length < 8) return callback(new Error('密码长度不能少于8位'));
        if (value.length > 64) return callback(new Error('密码长度不能超过64位'));
        if (!/[A-Z]/.test(value)) return callback(new Error('密码必须包含大写字母 A-Z'));
        if (!/[a-z]/.test(value)) return callback(new Error('密码必须包含小写字母 a-z'));
        if (!/[0-9]/.test(value)) return callback(new Error('密码必须包含数字 0-9'));
        callback();
      }, trigger: 'blur'
    }
  ],
};

const handleUpdatePassword = (row: UserItem) => {
  pwdForm.id = row.id;
  pwdForm.oldPassword = null;
  pwdForm.newPassword = null;
  pwdTargetUsername.value = row.username;
  pwdVisible.value = true;
};

const savePassword = async () => {
  if (!pwdFormRef.value) return;
  const valid = await pwdFormRef.value.validate().catch(() => false);
  if (!valid) return;

  const res = await updatePassword(pwdForm);
  const code = res.data.code;
  if (code !== 0) {
    ElMessage.error(res.data.message);
  } else {
    pwdVisible.value = false;
    if (pwdIsSelf.value) {
      // 修改自己密码后 token 已失效，清理并跳转登录页
      ElMessage.success("修改密码成功，请重新登录");
      localStorage.removeItem('token');
      localStorage.removeItem('ms_username');
      localStorage.removeItem('ms_keys');
      router.push('/login');
    } else {
      ElMessage.success("重置密码成功");
      await getList();
    }
  }
};

// 删除操作
const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除吗？', '提示', {
    type: 'warning'
  });
  const res = await deleteUser(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("删除成功");
    await getList(); // 等待getList()执行完再继续
  }
};

</script>

<style scoped>
.pwd-hint {
  font-size: 12px;
  color: var(--color-fg-tertiary, #909399);
  margin-top: 4px;
  line-height: 1.4;
}
</style>
