<template>
  <div>
    <!-- ====== KPI Strip ====== -->
    <div class="kpi-strip">
      <div class="kpi-card kpi-primary">
        <div class="kpi-icon">
          <el-icon :size="18"><VideoPlay /></el-icon>
        </div>
        <div class="kpi-meta">
          <span class="kpi-label">运行中</span>
          <div class="kpi-value-row">
            <span class="kpi-value">{{ stats.running }}</span>
            <span v-if="stats.running > 0" class="kpi-pulse"></span>
          </div>
          <span class="kpi-delta neutral">实时计数</span>
        </div>
        <svg class="kpi-spark" viewBox="0 0 100 30" preserveAspectRatio="none">
          <polyline points="0,20 12,15 24,18 36,10 48,12 60,6 72,8 84,4 100,2" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon ki-amber">
          <el-icon :size="18"><Timer /></el-icon>
        </div>
        <div class="kpi-meta">
          <span class="kpi-label">未执行</span>
          <div class="kpi-value-row">
            <span class="kpi-value">{{ stats.idle }}</span>
          </div>
          <span class="kpi-delta neutral">待执行用例</span>
        </div>
        <svg class="kpi-spark sp-amber" viewBox="0 0 100 30" preserveAspectRatio="none">
          <polyline points="0,22 12,18 24,20 36,14 48,16 60,10 72,8 84,12 100,6" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon ki-green">
          <el-icon :size="18"><Select /></el-icon>
        </div>
        <div class="kpi-meta">
          <span class="kpi-label">成功率</span>
          <div class="kpi-value-row">
            <span class="kpi-value">{{ stats.successRate }}<small>%</small></span>
          </div>
          <span class="kpi-delta neutral">历史累计 · {{ stats.success }} 成功 / {{ stats.error }} 失败</span>
        </div>
        <div class="kpi-progress"><span :style="{ width: stats.successRate + '%' }"></span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon ki-violet">
          <el-icon :size="18"><Document /></el-icon>
        </div>
        <div class="kpi-meta">
          <span class="kpi-label">用例总数</span>
          <div class="kpi-value-row">
            <span class="kpi-value">{{ total }}</span>
          </div>
          <span class="kpi-delta neutral">已搜索结果</span>
        </div>
        <div class="kpi-cluster">
          <span v-for="i in 8" :key="i" :class="['node-dot', i <= Math.min(8, Math.ceil(total / Math.max(1, total) * 8)) ? 'on' : '']"></span>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="handle-box" style="flex-wrap:nowrap">
        <el-input
            v-model.number="query.id"
            type="number"
            placeholder="编号"
            class="handle-input mr10"
            style="width:90px"
            @input="v => query.id = v.replace(/[^\d]/g, '')"
        ></el-input>
        <el-input v-model="query.name" placeholder="名称" class="handle-input mr10" style="width:130px"></el-input>
        <el-select v-model="query.biz" placeholder="产品线" class="handle-select mr10" style="width:120px" clearable filterable>
          <el-option v-for="item in bizOptions" :key="item" :label="item" :value="item"></el-option>
        </el-select>
        <el-select v-model="query.service" placeholder="服务" class="handle-select mr10" style="width:120px" clearable filterable>
          <el-option v-for="item in serviceOptions" :key="item" :label="item" :value="item"></el-option>
        </el-select>

        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <span style="flex:1"></span>
        <span class="auto-refresh"><span class="ar-dot"></span>每 10s 自动刷新</span>
        <el-button type="primary" :icon="Plus" @click="handleInsert">新增用例</el-button>
      </div>

      <el-table :data="testCaseData" stripe class="table" ref="multipleTable" v-loading="loading">
        <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
        <el-table-column prop="name" label="名称" align="center"></el-table-column>
        <el-table-column prop="description" label="描述" align="center"></el-table-column>
        <el-table-column prop="biz" label="产品" align="center"></el-table-column>
        <el-table-column prop="service" label="服务" align="center"></el-table-column>
        <el-table-column prop="version" label="版本" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <span v-if="scope.row.status === 0" class="state-pill sp-idle"><span class="sp-dot"></span>没有执行</span>
            <span v-if="scope.row.status === 1" class="state-pill sp-running"><span class="sp-dot"></span>正在执行</span>
            <span v-if="scope.row.status === 2" class="state-pill sp-success"><span class="sp-dot"></span>执行成功</span>
            <span v-if="scope.row.status === 3" class="state-pill sp-error"><span class="sp-dot"></span>执行异常</span>
            <span v-if="scope.row.status === 4" class="state-pill sp-waiting"><span class="sp-dot"></span>排队等待</span>
            <span v-if="scope.row.status === 5" class="state-pill sp-idle"><span class="sp-dot"></span>排队取消</span>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" align="center"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" align="center"></el-table-column>
        <el-table-column prop="modifier" label="修改人" align="center"></el-table-column>
        <el-table-column prop="modifyTime" label="修改时间" align="center"></el-table-column>

        <el-table-column label="操作" width="200" align="right">
          <template #default="scope">
            <div class="action-group">
              <el-button text :icon="Search" type="primary" @click="drawer = true, getFullTestCase(scope.row.id)" v-permiss="1">详情</el-button>
              <el-button text :icon="Edit" type="primary" @click="handleEdit(scope.row)" v-permiss="1">编辑</el-button>
            </div>
            <div class="action-group">
              <el-button text :icon="Plus" type="primary" @click="goReports(scope.row.id, scope.row.name)" v-permiss="1">报告</el-button>
              <el-button text :icon="Timer" type="primary" @click="openHistoryDrawer(scope.row.id, scope.row.name)" v-permiss="1">历史</el-button>
            </div>
            <div class="action-group">
              <el-dropdown trigger="click">
                <el-button text :icon="Right" type="primary" v-permiss="1">执行</el-button>
                <template #dropdown>
                  <el-dropdown-menu class="horizontal-dropdown-menu">
                    <el-dropdown-item class="dropdown-button" @click="debugAction(scope.row.id)"
                      ><span class="state-pill sp-debug">调试</span></el-dropdown-item
                    >
                    <el-dropdown-item class="dropdown-button" @click="openRunDialog(scope.row)"
                      ><span class="state-pill sp-load">压测</span></el-dropdown-item
                    >
                    <el-dropdown-item class="dropdown-button" @click="openScheduleDialog(scope.row)"
                      ><span class="state-pill sp-success">定时压测</span></el-dropdown-item
                    >
                    <el-dropdown-item class="dropdown-button" @click="stopAction(scope.row.id)"
                      ><span class="state-pill sp-error">停止</span></el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button text :icon="Delete" type="danger" @click="handleDelete(scope.row.id)" v-permiss="1">删除</el-button>
            </div>
          </template>
        </el-table-column>

        <template #empty><el-empty description="暂无用例数据" /></template>
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
    <el-dialog title="新增用例" v-model="insertVisible" width="30%">
      <el-form label-width="70px">
        <el-form-item label="名称">
          <el-input v-model="insertForm.name" placeholder="名称"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="insertForm.description" placeholder="描述"></el-input>
        </el-form-item>
        <el-form-item label="产品线">
          <el-select v-model="insertForm.biz" placeholder="产品线" class="handle-select" filterable allow-create clearable>
            <el-option v-for="item in bizOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="服务">
          <el-select v-model="insertForm.service" placeholder="服务" class="handle-select" filterable allow-create clearable>
            <el-option v-for="item in serviceOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="版本号">
          <el-select v-model="insertForm.version" placeholder="版本号" class="handle-select" filterable allow-create clearable>
            <el-option v-for="item in versionOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-divider content-position="left">压测参数</el-divider>
        <el-form-item label="并发数">
          <el-input v-model="insertForm.numThreads" placeholder="线程数，如 100"></el-input>
        </el-form-item>
        <el-form-item label="启动时间">
          <el-input v-model="insertForm.rampTime" placeholder="Ramp-Up 秒数，如 10"></el-input>
        </el-form-item>
        <el-form-item label="运行时间">
          <el-input v-model="insertForm.duration" placeholder="持续时间 秒数，如 300"></el-input>
        </el-form-item>
        <el-form-item label="超时时间">
          <el-input-number v-model="insertForm.timeoutSeconds" :min="600" :max="86400" :step="60" style="width:100%"></el-input-number>
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
    <el-dialog title="编辑用例" v-model="editVisible" width="30%">
      <el-form label-width="70px">
        <el-form-item label="编号">
          <el-input v-model="editForm.id" disabled></el-input>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="名称" disabled></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" placeholder="描述"></el-input>
        </el-form-item>
        <el-form-item label="产品线">
          <el-select v-model="editForm.biz" placeholder="产品线" class="handle-select" filterable allow-create clearable>
            <el-option v-for="item in bizOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="服务">
          <el-select v-model="editForm.service" placeholder="服务" class="handle-select" filterable allow-create clearable>
            <el-option v-for="item in serviceOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="版本号">
          <el-select v-model="editForm.version" placeholder="版本号" class="handle-select" filterable allow-create clearable>
            <el-option v-for="item in versionOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-divider content-position="left">压测参数</el-divider>
        <el-form-item label="并发数">
          <el-input v-model="editForm.numThreads" placeholder="线程数，如 100"></el-input>
        </el-form-item>
        <el-form-item label="启动时间">
          <el-input v-model="editForm.rampTime" placeholder="Ramp-Up 秒数，如 10"></el-input>
        </el-form-item>
        <el-form-item label="运行时间">
          <el-input v-model="editForm.duration" placeholder="持续时间 秒数，如 300"></el-input>
        </el-form-item>
        <el-form-item label="超时时间">
          <el-input-number v-model="editForm.timeoutSeconds" :min="600" :max="86400" :step="60" style="width:100%"></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
				<span class="dialog-footer">
					<el-button @click="editVisible = false">取 消</el-button>
					<el-button type="primary" @click="saveEdit">确 定</el-button>
				</span>
      </template>
    </el-dialog>

    <!-- 压测配置弹出框 -->
    <el-dialog title="压测配置" v-model="runVisible" width="30%">
      <el-form label-width="90px">
        <el-form-item label="并发数">
          <el-input v-model="runForm.numThreads" placeholder="并发线程数，如 100"></el-input>
        </el-form-item>
        <el-form-item label="启动时间">
          <el-input v-model="runForm.rampTime" placeholder="Ramp-Up 秒数，如 10"></el-input>
        </el-form-item>
        <el-form-item label="运行时间">
          <el-input v-model="runForm.duration" placeholder="持续时间 秒数，如 300"></el-input>
        </el-form-item>
        <el-form-item label="目标区域">
          <el-select v-model="runForm.region" placeholder="全部区域" @change="onRegionChange" style="width:100%">
            <el-option key="" label="全部区域" value=""></el-option>
            <el-option v-for="r in regionList" :key="r" :label="r" :value="r"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="压力机数">
          <el-input-number v-model="runForm.slaveCount" :min="1" :max="maxSlaveCount || 1" :step="1" :disabled="maxSlaveCount < 1"></el-input-number>
          <span v-if="maxSlaveCount > 0" style="margin-left:8px;color:#909399;font-size:12px">可用 {{ maxSlaveCount }} 台</span>
          <span v-else style="margin-left:8px;color:#f56c6c;font-size:12px">该区域暂无可用压力机</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="runVisible = false">取 消</el-button>
          <el-button type="primary" @click="confirmRun">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 定时压测配置弹出框 -->
    <el-dialog title="定时压测" v-model="scheduleVisible" width="35%">
      <el-form label-width="90px">
        <el-form-item label="执行方式">
          <el-radio-group v-model="scheduleForm.scheduleType">
            <el-radio label="once">仅执行一次</el-radio>
            <el-radio label="daily">每日</el-radio>
            <el-radio label="weekly">每周</el-radio>
            <el-radio label="monthly">每月</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="scheduleForm.scheduleType === 'once'" label="执行时间">
          <el-date-picker
              v-model="scheduleForm.onceDateTime"
              type="datetime"
              placeholder="选择日期时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width:100%">
          </el-date-picker>
        </el-form-item>
        <el-form-item v-if="scheduleForm.scheduleType === 'daily'" label="执行时间">
          <el-time-picker
              v-model="scheduleForm.dailyTime"
              placeholder="选择时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width:100%">
          </el-time-picker>
        </el-form-item>
        <template v-if="scheduleForm.scheduleType === 'weekly'">
          <el-form-item label="执行时间">
            <el-time-picker
                v-model="scheduleForm.weeklyTime"
                placeholder="选择时间"
                format="HH:mm"
                value-format="HH:mm"
                style="width:100%">
            </el-time-picker>
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
            <el-time-picker
                v-model="scheduleForm.monthlyTime"
                placeholder="选择时间"
                format="HH:mm"
                value-format="HH:mm"
                style="width:100%">
            </el-time-picker>
          </el-form-item>
          <el-form-item label="每月日">
            <el-input-number v-model="scheduleForm.dayOfMonth" :min="1" :max="28" :step="1" step-strictly></el-input-number>
            <span style="margin-left:8px;color:#909399;font-size:12px">建议1-28日以确保每月都可执行</span>
          </el-form-item>
        </template>
        <el-divider content-position="left">压测参数</el-divider>
        <el-form-item label="并发数">
          <el-input v-model="scheduleForm.runParam.numThreads" placeholder="并发线程数，如 100"></el-input>
        </el-form-item>
        <el-form-item label="启动时间">
          <el-input v-model="scheduleForm.runParam.rampTime" placeholder="Ramp-Up 秒数，如 10"></el-input>
        </el-form-item>
        <el-form-item label="运行时间">
          <el-input v-model="scheduleForm.runParam.duration" placeholder="持续时间 秒数，如 300"></el-input>
        </el-form-item>
        <el-form-item label="目标区域">
          <el-select v-model="scheduleForm.runParam.region" placeholder="全部区域" @change="onScheduleRegionChange" style="width:100%">
            <el-option key="" label="全部区域" value=""></el-option>
            <el-option v-for="r in regionList" :key="r" :label="r" :value="r"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="压力机数">
          <el-input-number v-model="scheduleForm.runParam.slaveCount" :min="1" :max="maxSlaveCount || 1" :step="1" :disabled="maxSlaveCount < 1"></el-input-number>
          <span v-if="maxSlaveCount > 0" style="margin-left:8px;color:#909399;font-size:12px">可用 {{ maxSlaveCount }} 台</span>
          <span v-else style="margin-left:8px;color:#f56c6c;font-size:12px">该区域暂无可用压力机</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="scheduleVisible = false">取 消</el-button>
          <el-button type="primary" @click="confirmSchedule">确 定</el-button>
        </span>
      </template>
    </el-dialog>

<!--    抽屉展示用例详情-->
    <el-drawer v-model="drawer" title="用例详情" :show-close="true" :size="'80%'">
      <!-- 基础信息模块 -->
      <el-card shadow="hover" style="margin-bottom: 30px;">
        <el-descriptions direction="vertical" :column="3" border>
          <el-descriptions-item label="编号" align="center">{{testCaseFullData.id}}</el-descriptions-item>
          <el-descriptions-item label="名称" align="center">{{testCaseFullData.name}}</el-descriptions-item>
          <el-descriptions-item label="描述" align="center">{{testCaseFullData.description}}</el-descriptions-item>
          <el-descriptions-item label="产品线" align="center">{{testCaseFullData.biz}}</el-descriptions-item>
          <el-descriptions-item label="服务" align="center">{{testCaseFullData.service}}</el-descriptions-item>
          <el-descriptions-item label="版本号" align="center">{{testCaseFullData.version}}</el-descriptions-item>
          <el-descriptions-item label="并发数" align="center">{{testCaseFullData.numThreads || '-'}}</el-descriptions-item>
          <el-descriptions-item label="启动时间" align="center">{{testCaseFullData.rampTime || '-'}}</el-descriptions-item>
          <el-descriptions-item label="运行时间" align="center">{{testCaseFullData.duration || '-'}}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- JMX压测脚本模块 -->
      <el-card shadow="hover" style="margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div style="font-weight: bold; font-size: 14px; border-bottom: 2px solid #409EFF; padding-bottom: 5px;">
            💻 JMX 压测脚本
          </div>
          <el-space direction="horizontal" alignment="center">
            <el-button type="warning" @click="onlineDrawer = true, getOnlineJmxData(jmxFullData[0] ? jmxFullData[0].id : null)">
              在线编写(测试中)
            </el-button>
            <el-upload action="" :show-file-list="false" :http-request="handleJmxUpload" accept=".jmx">
              <el-button type="primary">本地上传</el-button>
            </el-upload>
          </el-space>
        </div>
        <el-table :data="jmxFullData" border style="width: 100%">
          <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
          <el-table-column prop="dstName" label="名称" align="center">
            <template #default="scope">
              <div @click="handleJmxDownload(scope.row.id, scope.row.dstName)" style="color: blue; cursor: pointer;">
                {{ scope.row.dstName }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" align="center"></el-table-column>
          <el-table-column prop="testCaseId" label="用例" align="center"></el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="scope">
              <el-button text type="primary" icon="el-icon-view" @click="jmxDrawer = true, handleJmxView(scope.row.id)" v-permiss="1">预览</el-button>
              <el-button text type="danger" icon="el-icon-delete" @click="handleJmxDelete(scope.row.id)" v-permiss="1">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- CSV数据文件模块 -->
      <el-card shadow="hover" style="margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div style="font-weight: bold; font-size: 14px; border-bottom: 2px solid #67C23A; padding-bottom: 5px;">
            📊 CSV 数据文件
          </div>
          <el-space direction="horizontal" alignment="center">
            <el-upload action="" :show-file-list="false" :http-request="handleCsvUpload" accept=".csv,.dat">
              <el-button type="primary">本地上传</el-button>
            </el-upload>
          </el-space>
        </div>
        <el-table :data="csvFullData" border style="width: 100%">
          <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
          <el-table-column prop="dstName" label="名称" align="center">
            <template #default="scope">
              <div @click="handleCsvDownload(scope.row.id, scope.row.dstName)" style="color: blue; cursor: pointer;">
                {{ scope.row.dstName }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" align="center"></el-table-column>
          <el-table-column prop="testCaseId" label="用例" align="center"></el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="scope">
              <el-button text type="primary" icon="el-icon-view" @click="csvDrawer = true, handleCsvView(scope.row.id)" v-permiss="1">预览</el-button>
              <el-button text type="danger" icon="el-icon-delete" @click="handleCsvDelete(scope.row.id)" v-permiss="1">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- JAR依赖文件模块 -->
      <el-card shadow="hover">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div style="font-weight: bold; font-size: 14px; border-bottom: 2px solid #F56C6C; padding-bottom: 5px;">
            📦 JAR 依赖文件
          </div>

          <el-space direction="horizontal" alignment="center">
            <el-upload action="" :show-file-list="false" :http-request="handleJarUpload" accept=".jar">
              <el-button type="primary">本地上传</el-button>
            </el-upload>
          </el-space>
        </div>
        <el-table :data="jarFullData" border style="width: 100%">
          <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
          <el-table-column prop="dstName" label="名称" align="center"></el-table-column>
          <el-table-column prop="description" label="描述" align="center"></el-table-column>
          <el-table-column prop="testCaseId" label="用例" align="center"></el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="scope">
              <el-button text type="danger" icon="el-icon-delete" @click="handleJarDelete(scope.row.id)" v-permiss="1">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-drawer>







    <!-- 子抽屉用于编辑 JMX 脚本 -->
    <el-drawer v-model="onlineDrawer" title="在线编写JMX脚本文件" :append-to-body="true" :size="'75%'">
      <!-- 基础信息 -->
      <el-form :model="onlineJmxItem" label-width="150px" label-position="top">
        <el-card shadow="hover" style="margin-bottom: 20px;">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="脚本名称">
                <el-input v-model="onlineJmxItem.srcName" placeholder="请输入脚本名称, 以.jmx后缀结尾" :disabled="onlineJmxItem.id !== 0"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="脚本描述">
                <el-input v-model="testCaseFullData.name" disabled></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="用例">
                <el-input v-model="onlineJmxItem.testCaseId" disabled></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>
      </el-form>

      <!-- Tabs -->
      <el-tabs v-model="activeTab">
        <!-- Threads Tab -->
        <el-tab-pane label="🧵 Threads" name="threads">
          <el-card shadow="hover" style="margin-bottom: 20px;">
            <el-divider>
              <el-radio-group v-model="jmeterThreadsType" @change="handleThreadGroupTypeChange">
                <el-radio value="threadGroup">ThreadGroup</el-radio>
                <el-radio value="steppingThreadGroup">SteppingThreadGroup</el-radio>
                <el-radio value="concurrencyThreadGroup">ConcurrencyThreadGroup</el-radio>
              </el-radio-group>
            </el-divider>

            <!-- 条件渲染不同的线程组输入框 -->
            <el-form :model="onlineJmxItem" label-width="150px" label-position="top">
              <template v-if="jmeterThreadsType === 'threadGroup'">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Number of Threads (users)">
                      <el-input v-model="onlineJmxItem.threadGroupVO.numThreads"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="Same user on each iteration">
                      <el-checkbox v-model="onlineJmxItem.threadGroupVO.sameUserOnNextIteration" @change="handleCheckboxChange('sameUserOnNextIteration', $event)"></el-checkbox>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Ramp-Up Period (in seconds)">
                      <el-input v-model="onlineJmxItem.threadGroupVO.rampTime"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="Delay Thread creation until needed">
                      <el-checkbox v-model="onlineJmxItem.threadGroupVO.delayedStart" @change="handleCheckboxChange('delayedStart', $event)"></el-checkbox>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Loop Count">
                      <el-input v-model="onlineJmxItem.threadGroupVO.loops"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Scheduler">
                      <el-checkbox v-model="onlineJmxItem.threadGroupVO.scheduler" @change="handleCheckboxChange('scheduler', $event)"></el-checkbox>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="8" v-if="onlineJmxItem.threadGroupVO.scheduler">
                    <el-form-item label="Duration (seconds)">
                      <el-input v-model="onlineJmxItem.threadGroupVO.duration"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="8" v-if="onlineJmxItem.threadGroupVO.scheduler">
                    <el-form-item label="Startup Delay (seconds)">
                      <el-input v-model="onlineJmxItem.threadGroupVO.delay"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </template>

              <template v-if="jmeterThreadsType === 'steppingThreadGroup'">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="This group will start（threads）">
                      <el-input v-model="onlineJmxItem.steppingThreadGroupVO.numThreads"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="First, wait for（seconds）">
                      <el-input v-model="onlineJmxItem.steppingThreadGroupVO.firstWaitForSeconds"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Then start（threads）">
                      <el-input v-model="onlineJmxItem.steppingThreadGroupVO.thenStartThreads"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Next, add（threads）">
                      <el-input v-model="onlineJmxItem.steppingThreadGroupVO.nextAddThreads"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="Every (seconds)">
                      <el-input v-model="onlineJmxItem.steppingThreadGroupVO.nextAddThreadsEverySeconds"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="Using ramp-Up（seconds）">
                      <el-input v-model="onlineJmxItem.steppingThreadGroupVO.usingRampUpSeconds"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Then hold load for（seconds）">
                      <el-input v-model="onlineJmxItem.steppingThreadGroupVO.thenHoldLoadForSeconds"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="Finally, stop（threads）">
                      <el-input v-model="onlineJmxItem.steppingThreadGroupVO.finallyStopThreads"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="Every（seconds）">
                      <el-input v-model="onlineJmxItem.steppingThreadGroupVO.finallyStopThreadsEverySeconds"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </template>

              <template v-if="jmeterThreadsType === 'concurrencyThreadGroup'">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Target Concurrency">
                      <el-input v-model="onlineJmxItem.concurrencyThreadGroupVO.targetConcurrency"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Ramp-Up Time (seconds)">
                      <el-input v-model="onlineJmxItem.concurrencyThreadGroupVO.rampUpTime"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Ramp-Up Steps Count">
                      <el-input v-model="onlineJmxItem.concurrencyThreadGroupVO.rampUpStepsCount"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="Hold Target Rate Time (seconds)">
                      <el-input v-model="onlineJmxItem.concurrencyThreadGroupVO.holdTargetRateTime"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </template>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- Sampler Tab -->
        <el-tab-pane label="🌐 Sampler" name="sampler">
          <el-card shadow="hover" style="margin-bottom: 20px;">
            <el-divider>
              <el-radio-group v-model="jmeterSampleType" @change="handleRequestTypeChange">
                <el-radio value="http">HttpRequest</el-radio>
                <el-radio value="java">JavaRequest</el-radio>
                <el-radio value="dubbo">DubboRequest</el-radio>
              </el-radio-group>
            </el-divider>

            <el-form :model="onlineJmxItem" label-width="150px" label-position="top">
              <template v-if="jmeterSampleType === 'http'">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-form-item label="Protocol">
                      <el-select v-model="onlineJmxItem.httpVO.protocol">
                        <el-option label="HTTP" value="http"></el-option>
                        <el-option label="HTTPS" value="https"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Host">
                      <el-input v-model="onlineJmxItem.httpVO.domain"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="Port">
                      <el-input v-model="onlineJmxItem.httpVO.port"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="Method">
                      <el-select v-model="onlineJmxItem.httpVO.method">
                        <el-option label="GET" value="GET"></el-option>
                        <el-option label="POST" value="POST"></el-option>
                        <el-option label="PUT" value="PUT"></el-option>
                        <el-option label="DELETE" value="DELETE"></el-option>
                        <el-option label="PATCH" value="PATCH"></el-option>
                        <el-option label="TRACE" value="TRACE"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Path">
                      <el-input v-model="onlineJmxItem.httpVO.path"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="Encoding">
                      <el-input v-model="onlineJmxItem.httpVO.contentEncoding" disabled></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-tabs v-model="activeHttpTab" key="http-tabs">
                  <el-tab-pane label="Header" name="header">
                    <el-table :data="onlineJmxItem.httpVO.httpHeaderVOList" border style="width: 100%">
                      <el-table-column prop="key" label="Key" width="300" align="center">
                        <template #default="scope">
<!--                          <el-input v-model="scope.row.headerKey"></el-input>-->
                          <el-input
                              v-model="scope.row.headerKey"
                              @input="checkHttpHeaderKeyUniqueness(scope.row, scope.$index)"
                              :class="{ 'error-input': scope.row.headerKeyError }"
                          ></el-input>
                          <div v-if="scope.row.headerKeyError" class="error-message">headerKey不能重复</div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="value" label="Value" align="center">
                        <template #default="scope">
                          <el-input v-model="scope.row.headerValue"></el-input>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="120" align="center">
                        <template #default="scope">
                          <el-button text :icon="Delete" type="danger" @click="handleHttpHeaderDelete(scope.$index)">
                            删除
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                    <el-button type="primary" @click="handleHttpHeaderAdd" style="margin-top: 10px;">新增</el-button>
                  </el-tab-pane>
                  <el-tab-pane label="Param" name="param">
                    <el-table :data="onlineJmxItem.httpVO.httpParamVOList" border style="width: 100%">
                      <el-table-column prop="key" label="Key" width="300" align="center">
                        <template #default="scope">
<!--                          <el-input v-model="scope.row.paramKey" :disabled="isParamDisabled"></el-input>-->
                          <el-input
                              v-model="scope.row.paramKey"
                              @input="checkHttpParamKeyUniqueness(scope.row, scope.$index)"
                              :class="{ 'error-input': scope.row.paramKeyError }"
                          ></el-input>
                          <div v-if="scope.row.paramKeyError" class="error-message">paramKey不能重复</div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="value" label="Value" align="center">
                        <template #default="scope">
                          <el-input v-model="scope.row.paramValue" :disabled="isParamDisabled"></el-input>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="120" align="center">
                        <template #default="scope">
                          <el-button text :icon="Delete" type="danger" @click="handleHttpParamDelete(scope.$index)">
                            删除
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                    <el-button type="primary" @click="handleHttpParamAdd" :disabled="isParamDisabled" style="margin-top: 10px;">新增</el-button>
                  </el-tab-pane>
                  <el-tab-pane label="Body" name="body">
                    <el-input type="textarea" v-model="formattedJson" :rows="10" @blur="onJsonBlur" :disabled="isBodyDisabled"></el-input>
                  </el-tab-pane>
                </el-tabs>
              </template>

              <template v-else-if="jmeterSampleType === 'java'">
                <el-form-item label="ClassPath">
                  <el-input v-model="onlineJmxItem.javaVO.javaRequestClassPath"></el-input>
                </el-form-item>
<!--                <el-tabs v-model="activeJavaTab" key="java-tabs">-->
<!--                  <el-tab-pane label="JavaParams" name="javaParams">-->
                    <el-table :data="onlineJmxItem.javaVO.javaParamVOList" border style="width: 100%">
                      <el-table-column prop="key" label="Key" width="300" align="center">
                        <template #default="scope">
<!--                          <el-input v-model="scope.row.paramKey"></el-input>-->
                          <el-input
                              v-model="scope.row.paramKey"
                              @input="checkJavaParamKeyUniqueness(scope.row, scope.$index)"
                              :class="{ 'error-input': scope.row.paramKeyError }"
                          ></el-input>
                          <div v-if="scope.row.paramKeyError" class="error-message">paramKey不能重复</div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="value" label="Value" align="center">
                        <template #default="scope">
                          <el-input v-model="scope.row.paramValue"></el-input>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="120" align="center">
                        <template #default="scope">
                          <el-button text :icon="Delete" type="danger" @click="handleJavaParamDelete(scope.$index)">
                            删除
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                    <el-button type="primary" @click="handleJavaParamAdd" style="margin-top: 10px;">新增</el-button>
<!--                  </el-tab-pane>-->
<!--                </el-tabs>-->
              </template>

              <template v-else-if="jmeterSampleType === 'dubbo'">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="Name">
                      <el-input v-model="onlineJmxItem.dubboVO.name"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Comments">
                      <el-input v-model="onlineJmxItem.dubboVO.comments"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-divider content-position="center">Config Center</el-divider>
                <el-row :gutter="20">
                  <el-col :span="3">
                    <el-form-item label="Protocol">
                      <el-select v-model="onlineJmxItem.dubboVO.configCenterProtocol">
                        <el-option label="" value=""></el-option> <!-- 添加空白选项 -->
                        <el-option label="zookeeper" value="zookeeper"></el-option>
                        <el-option label="nacos" value="nacos"></el-option>
                        <el-option label="apollo" value="apollo"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Group">
                      <el-input v-model="onlineJmxItem.dubboVO.configCenterGroup"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Namespace">
                      <el-input v-model="onlineJmxItem.dubboVO.configCenterNamespace"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="UserName">
                      <el-input v-model="onlineJmxItem.dubboVO.configCenterUsername"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Password">
                      <el-input v-model="onlineJmxItem.dubboVO.configCenterPassword"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Address">
                      <el-input v-model="onlineJmxItem.dubboVO.configCenterAddress"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Timeout">
                      <el-input v-model="onlineJmxItem.dubboVO.configCenterTimeout"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-divider content-position="center">Registry Center</el-divider>
                <el-row :gutter="20">
                  <el-col :span="3">
                    <el-form-item label="Protocol">
                      <el-select v-model="onlineJmxItem.dubboVO.registryProtocol">
                        <el-option label="none" value="none"></el-option>
                        <el-option label="zookeeper" value="zookeeper"></el-option>
                        <el-option label="nacos" value="nacos"></el-option>
                        <el-option label="multicast" value="multicast"></el-option>
                        <el-option label="redis" value="redis"></el-option>
                        <el-option label="simple" value="simple"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Group">
                      <el-input v-model="onlineJmxItem.dubboVO.registryGroup"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="UserName">
                      <el-input v-model="onlineJmxItem.dubboVO.registryUsername"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Password">
                      <el-input v-model="onlineJmxItem.dubboVO.registryPassword"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="Address">
                      <el-input v-model="onlineJmxItem.dubboVO.registryAddress"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Timeout">
                      <el-input v-model="onlineJmxItem.dubboVO.registryTimeout"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-divider content-position="center">RPC Protocol</el-divider>
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="Protocol">
                      <el-select v-model="onlineJmxItem.dubboVO.rpcProtocol">
                        <el-option label="dubbo://" value="dubbo://"></el-option>
                        <el-option label="rmi://" value="rmi://"></el-option>
                        <el-option label="hessian://" value="hessian://"></el-option>
                        <el-option label="webservice://" value="webservice://"></el-option>
                        <el-option label="memcached://" value="memcached://"></el-option>
                        <el-option label="redis://" value="redis://"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-divider content-position="center">Consumer & Service</el-divider>
                <el-row :gutter="20">
                  <el-col :span="3">
                    <el-form-item label="Timeout">
                      <el-input v-model="onlineJmxItem.dubboVO.timeout" placeholder="1000"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Version">
                      <el-input v-model="onlineJmxItem.dubboVO.version" placeholder="1.0"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Retries">
                      <el-input v-model="onlineJmxItem.dubboVO.retries" placeholder="0"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Cluster">
                      <el-input v-model="onlineJmxItem.dubboVO.cluster" placeholder="failfast"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Group">
                      <el-input v-model="onlineJmxItem.dubboVO.group"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Connections">
                      <el-input v-model="onlineJmxItem.dubboVO.connections" placeholder="1"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Async">
                      <el-input v-model="onlineJmxItem.dubboVO.async" placeholder="sync"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="3">
                    <el-form-item label="Loadbalance">
                      <el-select v-model="onlineJmxItem.dubboVO.loadBalance">
                        <el-option label="random" value="random"></el-option>
                        <el-option label="roundrobin" value="roundrobin"></el-option>
                        <el-option label="leastactive" value="leastactive"></el-option>
                        <el-option label="consistenthash" value="consistenthash"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-divider content-position="center">Interface</el-divider>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="Interface">
                      <el-input v-model="onlineJmxItem.dubboVO.interfaceName"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Method">
                      <el-input v-model="onlineJmxItem.dubboVO.method"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-tabs v-model="activeDubboTab" key="dubbo-tabs">
                  <el-tab-pane label="Args" name="args">
                    <el-table :data="onlineJmxItem.dubboVO.dubboMethodArgsVOList" border style="width: 100%">
                      <el-table-column prop="paramType" label="paramType" width="300" align="center">
                        <template #default="scope">
                          <el-input v-model="scope.row.paramType"></el-input>
                        </template>
                      </el-table-column>
                      <el-table-column prop="paramValue" label="paramValue" align="center">
                        <template #default="scope">
                          <el-input v-model="scope.row.paramValue"></el-input>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="120" align="center">
                        <template #default="scope">
                          <el-button text :icon="Delete" type="danger" @click="handleDubboMethodArgsDelete(scope.$index)">
                            删除
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                    <el-button type="primary" @click="handleDubboMethodArgsAdd" style="margin-top: 10px;">新增</el-button>
                  </el-tab-pane>
                  <el-tab-pane label="Attachment Args" name="attachmentArgs">
                    <el-table :data="onlineJmxItem.dubboVO.dubboAttachmentArgsVOList" border style="width: 100%">
                      <el-table-column prop="attachmentKey" label="Key" width="300" align="center">
                        <template #default="scope">
                          <el-input v-model="scope.row.attachmentKey"></el-input>
                        </template>
                      </el-table-column>
                      <el-table-column prop="attachmentValue" label="Value" align="center">
                        <template #default="scope">
                          <el-input v-model="scope.row.attachmentValue"></el-input>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="120" align="center">
                        <template #default="scope">
                          <el-button text :icon="Delete" type="danger" @click="handleDubboAttachmentArgsDelete(scope.$index)">
                            删除
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                    <el-button type="primary" @click="handleDubboAttachmentArgsAdd" style="margin-top: 10px;">新增</el-button>
                  </el-tab-pane>
                </el-tabs>
              </template>

            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- Assertions Tab -->
        <el-tab-pane label="✔️ Assertions" name="assertions">
          <el-card shadow="hover" style="margin-bottom: 20px;">
            <el-form :model="onlineJmxItem" label-width="150px" label-position="top">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Response Code">
                    <el-input
                        v-model="onlineJmxItem.assertionVO.responseCode"
                        placeholder="请输入期望的响应状态码，等于关系"
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="Response Message">
                    <el-input
                        v-model="onlineJmxItem.assertionVO.responseMessage"
                        type="textarea"
                        :rows="15"
                        placeholder="请输入期望的响应消息内容，包含关系"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="JSON Path">
                    <el-input
                        v-model="onlineJmxItem.assertionVO.jsonPath"
                        placeholder="请输入要提取结果的JSON Path表达式，比如：$.success"
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="Expected Value">
                    <el-input
                        v-model="onlineJmxItem.assertionVO.expectedValue"
                        type="textarea"
                        :rows="15"
                        placeholder="请输入通过JSON Path表达式提取的预期结果，比如：true"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- CSV Tab -->
        <el-tab-pane label="📄 CSV" name="csv">
          <el-card shadow="hover" style="margin-bottom: 20px;">
            <el-form :model="onlineJmxItem" label-width="150px" label-position="top">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Ignore first line（only used if Variable Names is not empty）">
                    <el-checkbox v-model="onlineJmxItem.csvDataVO.ignoreFirstLine"></el-checkbox>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Recycle on EOF">
                    <el-checkbox v-model="onlineJmxItem.csvDataVO.recycleOnEof"></el-checkbox>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Stop thread on EOF">
                    <el-checkbox v-model="onlineJmxItem.csvDataVO.stopThreadOnEof"></el-checkbox>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Allow quoted data">
                    <el-checkbox v-model="onlineJmxItem.csvDataVO.allowQuotedData"></el-checkbox>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="File encoding">
                    <el-input v-model="onlineJmxItem.csvDataVO.fileEncoding" disabled></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Sharing mode">
                    <el-select v-model="onlineJmxItem.csvDataVO.sharingMode">
                      <el-option label="All threads" value="All threads"></el-option>
                      <el-option label="Current thread group" value="Current thread group"></el-option>
                      <el-option label="Current thread" value="Current thread"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 新增表格 -->
              <el-table :data="onlineJmxItem.csvDataVO.csvFileVOList" border style="width: 100%">
                <el-table-column prop="filename" label="CSV Filename（eg：xxxx.csv）" align="center">
                  <template #default="scope">
                    <el-input v-model="scope.row.filename" placeholder="请输入CSV文件名"></el-input>
                  </template>
                </el-table-column>
                <el-table-column prop="variableNames" label="Variable names（comma-delimited）" align="center">
                  <template #default="scope">
                    <el-input v-model="scope.row.variableNames" placeholder="请输入变量名，逗号分隔"></el-input>
                  </template>
                </el-table-column>
                <el-table-column prop="delimiter" label="Delimiter（use '\t' for tab）" align="center">
                  <template #default="scope">
                    <el-input v-model="scope.row.delimiter" placeholder="请输入分隔符"></el-input>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center">
                  <template #default="scope">
                    <el-button text :icon="Delete" type="danger" @click="handleCsvFileDelete(scope.$index)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-button type="primary" @click="handleAddCsvFile" style="margin-top: 10px;">新增</el-button>
            </el-form>
          </el-card>
        </el-tab-pane>
      </el-tabs>

      <el-button type="primary" @click="handleSave" class="fixed-save-button">保存</el-button>
    </el-drawer>

    <!--    抽屉展示脚本详情-->
    <el-drawer
        v-model="jmxDrawer"
        title="脚本详情"
        :show-close="true"
        :with-header="true"
        :size="'60%'"
    >
      <div class="log-content">
        <VirtualTextViewer :content="jmxFile" />
      </div>
    </el-drawer>

    <!--    抽屉展示CSV详情-->
    <el-drawer
        v-model="csvDrawer"
        title="数据详情"
        :show-close="true"
        :with-header="true"
        :size="'60%'"
    >
      <div class="log-content">
        <VirtualTextViewer :content="csvFile" />
      </div>
    </el-drawer>

  </div>

    <!-- 历史报告抽屉 -->
    <el-drawer v-model="historyDrawerVisible" :title="historyDrawerTitle" :size="'50%'" destroy-on-close>
      <el-table :data="historyReports" stripe size="small" v-loading="historyLoading">
        <el-table-column prop="id" label="编号" width="80" align="center"></el-table-column>
        <el-table-column prop="name" label="名称" align="center"></el-table-column>
        <el-table-column prop="execType" label="类型" align="center" width="90">
          <template #default="scope">
            <span v-if="scope.row.execType === 1" class="state-pill sp-debug">调试</span>
            <span v-else class="state-pill sp-load">执行</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center" width="100">
          <template #default="scope">
            <span v-if="scope.row.status === 0" class="state-pill sp-idle">未开始</span>
            <span v-if="scope.row.status === 1" class="state-pill sp-running"><span class="sp-dot"></span>运行中</span>
            <span v-if="scope.row.status === 2" class="state-pill sp-success">成功</span>
            <span v-if="scope.row.status === 3" class="state-pill sp-error">异常</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="执行时间" align="center" min-width="160"></el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button text type="primary" size="small" :icon="TrendCharts" @click="openHistoryChart(scope.row.id)">曲线</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无历史报告" /></template>
      </el-table>
      <div class="pagination" style="margin-top:16px">
        <el-pagination background layout="total, prev, pager, next"
          :current-page="historyQuery.page" :page-size="historyQuery.size" :total="historyTotal"
          @current-change="handleHistoryPageChange" size="small" />
      </div>
    </el-drawer>

    <!-- 历史曲线对话框 -->
    <el-dialog title="历史曲线" v-model="historyChartVisible" width="900px" destroy-on-close>
      <JmeterMetricsChart :data="historyMetricsData" />
    </el-dialog>
</template>

<script setup lang="ts" name="baseTestCase">
import {ref, reactive, onUnmounted, onMounted, onActivated, computed, watch} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import VirtualTextViewer from '../components/VirtualTextViewer.vue';
import { Plus, Search, Delete, Edit, Refresh, Right, Upload, VideoPlay, Timer, Select, Document, TrendCharts } from '@element-plus/icons-vue';
import {
  addTestCase, debugTestCase,
  deleteTestCase, getFull,
  getTestCaseList,
  startTestCase,
  stopTestCase,
  updateTestCase
} from "../api/testcase";
import {getOptions} from "../api/config";
import { addScheduledTask } from "../api/scheduledTask";
import {CsvItem, JarItem, JmxItem} from "../common/item";
import {deleteCsv, viewCsv, uploadCsv, downloadCsv} from "../api/csv";
import {addOnlineJmx, deleteJmx, viewJmx, getOnlineJmx, updateOnlineJmx, uploadJmx, downloadJmx} from "../api/jmx";
import {deleteJar, downloadJar, uploadJar} from "../api/jar";
import {getEnableSlaveCount, getRegions} from "../api/node";
import {getReportList, getReportListByTestCase, getMetrics} from "../api/report";
import JmeterMetricsChart from '../components/JmeterMetricsChart.vue';
import router from "../router";
import {checkToLogin} from "../common/push";
import {useRoute} from "vue-router";

const drawer = ref(false);
const jmxDrawer = ref(false)
const csvDrawer = ref(false)
const onlineDrawer = ref(false)

interface TestCaseItem {
  id: number;
  name: string;
  description: string;
  biz: number;
  service: string;
  version: string;
  status: number;
  numThreads: string;
  rampTime: string;
  duration: string;
  testCaseDir: string;
  creator: string;
  modifier: string;
  createTime: string;
  modifyTime: string;
}

const route = useRoute();

const query = reactive({
  id: route.query.id || null,  // 获取传递的testCaseId参数
  name: null,
  biz: null,
  service: null,
  page: 1,
  size: 10
});

// 下拉选项
const bizOptions = ref<string[]>([]);
const serviceOptions = ref<string[]>([]);
const versionOptions = ref<string[]>([]);

const loadBizOptions = async () => {
  const res = await getOptions('biz');
  if (res.data.code === 0) bizOptions.value = res.data.data;
};
const loadServiceOptions = async () => {
  const res = await getOptions('service');
  if (res.data.code === 0) serviceOptions.value = res.data.data;
};
const loadVersionOptions = async () => {
  const res = await getOptions('version');
  if (res.data.code === 0) versionOptions.value = res.data.data;
};

onMounted(() => {
  loadBizOptions();
  loadServiceOptions();
  loadVersionOptions();
});


// 定义 formattedJson
const formattedJson = ref('');

// 格式化 JSON 的方法
const formatJson = (body: string) => {
  try {
    const jsonObject = JSON.parse(body);
    return JSON.stringify(jsonObject, null, 2);
  } catch {
    // 如果 JSON 解析失败，则返回空字符串或原始数据
    return body;
  }
};

// 处理 blur 事件，在输入框失去焦点时进行 JSON 解析
const onJsonBlur = (event: Event) => {
  const input = event.target as HTMLTextAreaElement;
  // 格式化后的 JSON 显示在输入框中
  formattedJson.value = formatJson(input.value);
  // 更新 onlineJmxItem 的 body 数据
  onlineJmxItem.value.httpVO.body = formattedJson.value;
};

// 使用 onMounted 来确保 onlineJmxItem 初始化后再设置 watch
onMounted(() => {
  // 初始化时同步 body 和 formattedJson 的值
  watch(() => onlineJmxItem.value.httpVO.body, (newBody) => {
    formattedJson.value = formatJson(newBody || '');
  }, { immediate: true });
});


// 监听 Param 是否有输入
const isParamDisabled = computed(() => {
  return onlineJmxItem.value.httpVO.body !== '';
});

// 监听 Body 是否有输入
const isBodyDisabled = computed(() => {
  return onlineJmxItem.value.httpVO.httpParamVOList.some(item => item.paramKey || item.paramValue);
});

const loading = ref(false);
const testCaseData = ref<TestCaseItem[]>([]);
const total = ref(0);

// 历史执行结果统计（用于 KPI）
const reportStats = ref({ success: 0, error: 0, total: 0 });
const loadReportStats = async () => {
  try {
    const res = await getReportList({ page: 1, size: 9999 });
    if (res.data.code === 0) {
      const list = res.data.data.list || [];
      reportStats.value = {
        success: list.filter((r: any) => r.status == 2).length,
        error: list.filter((r: any) => r.status == 3).length,
        total: res.data.data.total || 0
      };
    }
  } catch { /* ignore */ }
};

// KPI 统计
const stats = computed(() => {
  const list = testCaseData.value || [];
  const running = list.filter(t => t.status == 1).length;
  const idle = list.filter(t => t.status == 0).length;
  const rs = reportStats.value;
  const executed = rs.success + rs.error;
  const successRate = executed === 0 ? 100 : Math.round((rs.success / executed) * 1000) / 10;
  return { running, idle, success: rs.success, error: rs.error, successRate };
});
const getList = () => {
  loading.value = true;
  getTestCaseList(query).then(res => {
    checkToLogin(res.data.message);
    const code = res.data.code
    if (code != 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    testCaseData.value = res.data.data.list;
    total.value = res.data.data.total || 10;
  }).finally(() => { loading.value = false; });
};

// 定时刷新数据
let interval: ReturnType<typeof setInterval>;
onMounted(() => {
  getList(); // 页面加载时获取一次数据
  loadReportStats(); // 加载历史执行结果统计
  interval = setInterval(() => { getList(); loadReportStats(); }, 10000); // 每10秒刷新一次
});

onUnmounted(() => {
  clearInterval(interval); // 页面卸载时清除定时器
});

// 查询操作
const handleSearch = () => {
  query.page = 1;
  if (query.id === '') query.id = null;
  if (query.name === '') query.name = null;
  if (query.biz === '') query.biz = null;
  if (query.service === '') query.service = null;
  getList();
};

const handleReset = () => {
  query.id = null;
  query.name = null;
  query.biz = null;
  query.service = null;
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
  name: null,
  description: null,
  biz: null,
  service: null,
  version: null,
  numThreads: '10',
  rampTime: '0',
  duration: '60',
  timeoutSeconds: 7200
});

const handleInsert = (row: any) => {
  insertForm.name = row.name;
  insertForm.description = row.description;
  insertForm.biz = row.biz;
  insertForm.service = row.service;
  insertForm.version = row.version;
  insertForm.numThreads = '10';
  insertForm.rampTime = '0';
  insertForm.duration = '60';
  insertForm.timeoutSeconds = 7200;
  insertVisible.value = true;
};

const saveInsert = async () => {
  const res = await addTestCase(insertForm);

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
  const res = await deleteTestCase(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("删除成功");
    await getList(); // 等待getList()执行完再继续
  }
};

// 定时压测配置弹窗
const scheduleVisible = ref(false);
const scheduleForm = reactive({
  id: null as number | null,
  testCaseId: null as number | null,
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

const openScheduleDialog = async (row: any) => {
  scheduleForm.id = null;
  scheduleForm.testCaseId = row.id;
  scheduleForm.scheduleType = 'once';
  scheduleForm.onceDateTime = '';
  scheduleForm.dailyTime = '';
  scheduleForm.weeklyTime = '';
  scheduleForm.daysOfWeek = [];
  scheduleForm.monthlyTime = '';
  scheduleForm.dayOfMonth = 1;
  scheduleForm.runParam.numThreads = row.numThreads || '10';
  scheduleForm.runParam.rampTime = row.rampTime || '0';
  scheduleForm.runParam.duration = row.duration || '60';
  scheduleForm.runParam.slaveCount = 1;
  scheduleForm.runParam.region = '';
  try {
    const [regionRes, countRes] = await Promise.all([
      getRegions(),
      getEnableSlaveCount()
    ]);
    if (regionRes.data.code === 0) regionList.value = regionRes.data.data;
    if (countRes.data.code === 0) maxSlaveCount.value = countRes.data.data || 0;
  } catch { /* ignore */ }
  scheduleVisible.value = true;
};

const confirmSchedule = async () => {
  if (maxSlaveCount.value < 1 && scheduleForm.runParam.region) {
    ElMessage.error('所选区域暂无可用压力机，无法创建定时任务'); return;
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
    testCaseId: scheduleForm.testCaseId,
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
  const res = await addScheduledTask(body);
  if (res.data.code !== 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success('定时任务创建成功');
    scheduleVisible.value = false;
    await getList();
  }
};

// 表格编辑时弹窗和保存
const editVisible = ref(false);
let editForm = reactive({
  id: null,
  name: null,
  description: null,
  biz: null,
  service: null,
  version: null,
  numThreads: null,
  rampTime: null,
  duration: null,
  timeoutSeconds: 7200
});

const handleEdit = (row: any) => {
  editForm.id = row.id;
  editForm.name = row.name;
  editForm.description = row.description;
  editForm.biz = row.biz;
  editForm.service = row.service;
  editForm.version = row.version;
  editForm.numThreads = row.numThreads || '10';
  editForm.rampTime = row.rampTime || '0';
  editForm.duration = row.duration || '60';
  editForm.timeoutSeconds = row.timeoutSeconds || 7200;
  editVisible.value = true;
};

const saveEdit = async () => {
  const res = await updateTestCase(editForm.id, editForm);

  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("编辑成功");
    editVisible.value = false;
    await getList(); // 等待getList()执行完再继续
  }
};

const debugAction = async (id: number) => {
  const res = await debugTestCase(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("调试成功");
    await getList(); // 等待getList()执行完再继续
  }
}

// 压测配置弹窗
const runVisible = ref(false);
const maxSlaveCount = ref(1);
const regionList = ref<string[]>([]);
const runForm = reactive({
  id: null,
  numThreads: '10',
  rampTime: '0',
  duration: '60',
  slaveCount: 1,
  region: ''
});

const fetchSlaveCount = async () => {
  try {
    const res = await getEnableSlaveCount(runForm.region || undefined);
    if (res.data.code === 0) {
      maxSlaveCount.value = res.data.data || 0;
    }
  } catch { /* ignore */ }
};

const onRegionChange = () => {
  runForm.slaveCount = 1;
  fetchSlaveCount();
};

const onScheduleRegionChange = async () => {
  scheduleForm.runParam.slaveCount = 1;
  try {
    const res = await getEnableSlaveCount(scheduleForm.runParam.region || undefined);
    if (res.data.code === 0) {
      maxSlaveCount.value = res.data.data || 0;
    }
  } catch { /* ignore */ }
};

const openRunDialog = async (row: any) => {
  runForm.id = row.id;
  runForm.numThreads = row.numThreads || '10';
  runForm.rampTime = row.rampTime || '0';
  runForm.duration = row.duration || '60';
  runForm.slaveCount = 1;
  runForm.region = '';
  // 获取区域列表和 slave 数量
  try {
    const [regionRes, countRes] = await Promise.all([
      getRegions(),
      getEnableSlaveCount()
    ]);
    if (regionRes.data.code === 0) regionList.value = regionRes.data.data;
    if (countRes.data.code === 0) maxSlaveCount.value = countRes.data.data || 0;
  } catch { /* ignore */ }
  runVisible.value = true;
};

const confirmRun = async () => {
  if (maxSlaveCount.value < 1 && runForm.region) {
    ElMessage.error('所选区域暂无可用压力机，无法执行'); return;
  }
  const res = await startTestCase(runForm.id, {
    numThreads: runForm.numThreads,
    rampTime: runForm.rampTime,
    duration: runForm.duration,
    slaveCount: runForm.slaveCount,
    region: runForm.region
  });
  const code = res.data.code;
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("压测成功");
    runVisible.value = false;
    await getList();
  }
};

const stopAction = async (id: number) => {
  const res = await stopTestCase(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("停止成功");
    await getList(); // 等待getList()执行完再继续
  }
}

//测试用例详情，包括了关联的jmx，csv，jar等
// 用例详情时弹窗
const fullVisible = ref(false);
interface TestCaseFullItem {
  id: number;
  name: string;
  description: string;
  biz: number;
  service: string;
  version: string;
  status: number;
  numThreads: string;
  rampTime: string;
  duration: string;
  testCaseDir: string;
  jmxItem: JmxItem;
  csvItemList: CsvItem[];
  jarItemList: JarItem[];
}

const testCaseFullData = ref<TestCaseFullItem>({
  id: null,
  name: null,
  description: null,
  biz: null,
  service: null,
  version: null,
  status: null,
  numThreads: null,
  rampTime: null,
  duration: null,
  testCaseDir: null,
  jmxItem: null,
  csvItemList: [],
  jarItemList: []
});
// const jmxFullData = ref<JmxItem>({
//   id: null,
//   srcName: null,
//   dstName: null,
//   description: null,
//   testCaseId: null,
//   jmxDir: null,
//   jmeterScriptType: null,
//   creator: null,
//   modifier: null,
//   createTime: null,
//   modifyTime: null
//  });
const jmxFullData = ref<JmxItem[]>([]);
const csvFullData = ref<CsvItem[]>([]);
const jarFullData = ref<JarItem[]>([]);

const getFullTestCase = async (id: number) => {
  fullVisible.value = true;
  const res = await getFull(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
    return false;
  }
  const fullData = res.data.data;
  testCaseFullData.value = fullData;
  //jmxFullData.value[0] = res.data.data.jmxVO;
  // 检查 jmxVO 是否为 null，如果是则将 jmxFullData 设置为空数组
  if (fullData.jmxVO === null) {
    jmxFullData.value = [];
  } else {
    jmxFullData.value[0] = fullData.jmxVO;
  }
  csvFullData.value = fullData.csvVOList;
  jarFullData.value = fullData.jarVOList;
}

//删除csv
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
    await getFullTestCase(testCaseFullData.value.id);
  }
};

// 删除JMX
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
    await getFullTestCase(testCaseFullData.value.id);
  }
};

// 删除JAR
const handleJarDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除吗？', '提示', {
    type: 'warning'
  });
  const res = await deleteJar(id);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("删除成功");
    await getFullTestCase(testCaseFullData.value.id);
  }
};


//上传JMX
const handleJmxUpload = async (uploadRequestOptions) => {
  const testCaseId = testCaseFullData.value.id;
  const formData = new FormData();
  formData.append("jmxFile", uploadRequestOptions.file);
  const res = await uploadJmx(testCaseId, formData);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("上传成功");
    await getFullTestCase(testCaseId);
  }
}

//上传CSV
const handleCsvUpload = async (uploadRequestOptions) => {
  const testCaseId = testCaseFullData.value.id;
  const formData = new FormData();
  formData.append("csvFile", uploadRequestOptions.file);
  const res = await uploadCsv(testCaseId, formData);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("上传成功");
    await getFullTestCase(testCaseId);
  }
}

//上传JAR
const handleJarUpload = async (uploadRequestOptions) => {
  const testCaseId = testCaseFullData.value.id;
  const formData = new FormData();
  formData.append("jarFile", uploadRequestOptions.file);
  const res = await uploadJar(testCaseId, formData);
  const code = res.data.code
  if (code != 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("上传成功");
    await getFullTestCase(testCaseId);
  }
}


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

const handleJarDownload = async (id: number, jarName: string) => {
  if (!jarName) {
    ElMessage.error("jar依赖文件不存在");
    return;
  }
  const res = await downloadJar(id, jarName);
  if (!res.success) {
    ElMessage.error("下载失败, 请重试");
  }
}

// 预览jmx
const jmxFile = ref('');
const handleJmxView = async (id: number) => {
  const res = await viewJmx(id);
  jmxFile.value = res.data;
};

// 预览csv
const csvFile = ref('');
const handleCsvView = async (id: number) => {
  const res = await viewCsv(id);
  csvFile.value = res.data;
};


// const goReports = () => {
//   router.push({path:'/report'})
// }

const goReports = (testCaseId, name) => {
  router.push({
    path: '/report',
    query: {
      testCaseId: testCaseId,
      name: name
    }
  });
}

// 历史报告
const historyDrawerVisible = ref(false);
const historyDrawerTitle = ref('执行历史');
const historyReports = ref<any[]>([]);
const historyLoading = ref(false);
const historyTotal = ref(0);
const historyQuery = reactive({ page: 1, size: 10 });
const currentHistoryTestCaseId = ref(0);

const loadHistoryReports = async () => {
  if (!currentHistoryTestCaseId.value) return;
  historyLoading.value = true;
  try {
    const res = await getReportListByTestCase({
      testCaseId: currentHistoryTestCaseId.value,
      page: historyQuery.page,
      size: historyQuery.size
    });
    if (res.data.code === 0) {
      historyReports.value = res.data.data.list || [];
      historyTotal.value = res.data.data.total || 0;
    }
  } catch { /* ignore */ }
  historyLoading.value = false;
};

const openHistoryDrawer = (testCaseId: number, name: string) => {
  currentHistoryTestCaseId.value = testCaseId;
  historyDrawerTitle.value = `执行历史 - ${name}`;
  historyQuery.page = 1;
  historyDrawerVisible.value = true;
  loadHistoryReports();
};

const handleHistoryPageChange = (val: number) => {
  historyQuery.page = val;
  loadHistoryReports();
};

// 历史曲线
const historyChartVisible = ref(false);
const historyMetricsData = ref<any[]>([]);

const openHistoryChart = async (reportId: number) => {
  const res = await getMetrics(reportId, 5);
  if (res.data.code === 0) {
    historyMetricsData.value = res.data.data || [];
    historyChartVisible.value = true;
  }
};

onActivated(() => {
  getList();
  loadReportStats();
});


interface ThreadGroupVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  numThreads: string;
  rampTime: string;
  loops: string;
  sameUserOnNextIteration: boolean; //  1：true，0：false
  delayedStart: boolean;
  scheduler: boolean;
  duration: string;
  delay: string;
}

interface SteppingThreadGroupVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  numThreads: string;
  firstWaitForSeconds: string;
  thenStartThreads: string;
  nextAddThreads: string;
  nextAddThreadsEverySeconds: string;
  usingRampUpSeconds: string;
  thenHoldLoadForSeconds: string;
  finallyStopThreads: string;
  finallyStopThreadsEverySeconds: string;
}

interface ConcurrencyThreadGroupVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  targetConcurrency: string;
  rampUpTime: string;
  rampUpStepsCount: string;
  holdTargetRateTime: string;
}

interface HttpVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  protocol: string;
  domain: string;
  port: string;
  method: string;
  path: string;
  contentEncoding: string;
  httpHeaderVOList: HttpHeaderVO[];
  httpParamVOList: HttpParamVO[];
  body: string;
}

// 在线编辑
interface HttpHeaderVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  httpId: number;
  headerKey: string;
  headerValue: string;
}

interface HttpParamVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  httpId: number;
  paramKey: string;
  paramValue: string;
}

interface JavaVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  javaRequestClassPath: string;
  javaParamVOList: JavaParamVO[];
}

interface JavaParamVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  javaId: number;
  paramKey: string;
  paramValue: string;
}

interface DubboVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  name: string;
  comments: string;
  configCenterProtocol: string;
  configCenterGroup: string;
  configCenterNamespace: string;
  configCenterUsername: string;
  configCenterPassword: string;
  configCenterAddress: string;
  configCenterTimeout: string;
  registryProtocol: string;
  registryGroup: string;
  registryUsername: string;
  registryPassword: string;
  registryAddress: string;
  registryTimeout: string;
  rpcProtocol: string;
  timeout: string;
  version: string;
  retries: string;
  cluster: string;
  group: string;
  connections: string;
  async: string;
  loadBalance: string;
  interfaceName: string;
  method: string;
  methodArgsSize: number;
  attachmentArgsSize: number;
  dubboMethodArgsVOList: DubboMethodArgsVO[];
  dubboAttachmentArgsVOList: DubboAttachmentArgsVO[];
}

interface DubboMethodArgsVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  dubboId: number;
  paramType: string;
  paramValue: string;
}

interface DubboAttachmentArgsVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  dubboId: number;
  attachmentKey: string;
  attachmentValue: string;
}

interface AssertionVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  responseCode: string;
  responseMessage: string;
  jsonPath: string;
  expectedValue: string;
}

interface CsvDataVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  fileEncoding: string;
  ignoreFirstLine: boolean;
  allowQuotedData: boolean;
  recycleOnEof: boolean;
  stopThreadOnEof: boolean;
  sharingMode: string;
  csvFileVOList: CsvFileVO[];
}

interface CsvFileVO {
  filename: string;
  variableNames: string;
  delimiter: string;
}

interface OnlineJmxItem {
  id: number;
  srcName: string;
  dstName: string;
  testCaseId: number;
  jmxDir: string;
  jmeterScriptType: number;
  jmeterThreadsType: number;
  jmeterSampleType: number;
  threadGroupVO: ThreadGroupVO;
  steppingThreadGroupVO: SteppingThreadGroupVO;
  concurrencyThreadGroupVO: ConcurrencyThreadGroupVO;
  httpVO: HttpVO;
  javaVO: JavaVO;
  dubboVO: DubboVO;
  assertionVO: AssertionVO;
  csvDataVO: CsvDataVO;
}

const jmeterThreadsType = ref('threadGroup'); // 默认为 Thread Group
const jmeterSampleType = ref('http');
const activeTab = ref('threads');
const activeHttpTab = ref('header');
const activeJavaTab = ref('javaParam');
const onlineJmxItem = ref<OnlineJmxItem>({
  id: 0,
  srcName: '',
  dstName: '',
  testCaseId: 0,
  jmxDir: '',
  jmeterScriptType: 1,
  jmeterThreadsType: 0,
  jmeterSampleType: 0,
  threadGroupVO: {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    numThreads: '1',
    rampTime: '0',
    loops: '-1',
    sameUserOnNextIteration: true,
    delayedStart: false,
    scheduler: true,
    duration: '300',
    delay: '0'
  },
  steppingThreadGroupVO: {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    numThreads: '20',
    firstWaitForSeconds: '0',
    thenStartThreads: '0',
    nextAddThreads: '2',
    nextAddThreadsEverySeconds: '30',
    usingRampUpSeconds: '5',
    thenHoldLoadForSeconds: '300',
    finallyStopThreads: '5',
    finallyStopThreadsEverySeconds: '1'
  },
  concurrencyThreadGroupVO: {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    targetConcurrency: '20',
    rampUpTime: '300',
    rampUpStepsCount: '10',
    holdTargetRateTime: '300'
  },
  httpVO: {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    protocol: 'http',
    domain: '',
    port: '',
    method: 'GET',
    path: '',
    contentEncoding: 'UTF-8',
    httpHeaderVOList: [{ id: 0, testCaseId: 0, jmxId: 0, httpId: 0, headerKey: '', headerValue: '' }],
    httpParamVOList: [{ id: 0, testCaseId: 0, jmxId: 0, httpId: 0, paramKey: '', paramValue: '' }],
    body: ''
  },
  javaVO: {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    javaRequestClassPath: '',
    javaParamVOList: [{ id: 0, testCaseId: 0, jmxId: 0, javaId: 0, paramKey: '', paramValue: '' }]
  },
  dubboVO: {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    name: '',
    comments: '',
    configCenterProtocol: '',
    configCenterGroup: '',
    configCenterNamespace: '',
    configCenterUsername: '',
    configCenterPassword: '',
    configCenterAddress: '',
    configCenterTimeout: '',
    registryProtocol: '',
    registryGroup: '',
    registryUsername: '',
    registryPassword: '',
    registryAddress: '',
    registryTimeout: '',
    rpcProtocol: 'dubbo://',
    timeout: '1000',
    version: '1.0',
    retries: '0',
    cluster: 'failfast',
    group: '',
    connections: '1',
    async: 'sync',
    loadBalance: 'random',
    interfaceName: '',
    method: '',
    methodArgsSize: 0,
    attachmentArgsSize: 0,
    dubboMethodArgsVOList: [],
    dubboAttachmentArgsVOList: []
  },
  assertionVO: {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    responseCode: '',
    responseMessage: '',
    jsonPath: '',
    expectedValue: ''
  },
  csvDataVO: {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    fileEncoding: 'UTF-8',
    ignoreFirstLine: true,
    allowQuotedData: false,
    recycleOnEof: true,
    stopThreadOnEof: false,
    sharingMode: 'Current thread group',
    csvFileVOList: [] // 用于存储多个 CSV 文件配置
  }
});

const getOnlineJmxData = async (id: number | null) => {
  onlineDrawer.value = true;

  // 重置 onlineJmxItem 的状态
  onlineJmxItem.value = {
    id: 0,
    srcName: '',
    dstName: '',
    testCaseId: testCaseFullData.value.id, // 假设 testCaseFullData 中包含当前用例的 id
    jmxDir: '',
    jmeterScriptType: 1,
    jmeterThreadsType: 0,
    jmeterSampleType: 0,
    threadGroupVO: {
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      numThreads: '1',
      rampTime: '0',
      loops: '-1',
      sameUserOnNextIteration: true,
      delayedStart: false,
      scheduler: true,
      duration: '300',
      delay: '0'
    },
    steppingThreadGroupVO: {
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      numThreads: '20',
      firstWaitForSeconds: '0',
      thenStartThreads: '0',
      nextAddThreads: '2',
      nextAddThreadsEverySeconds: '30',
      usingRampUpSeconds: '5',
      thenHoldLoadForSeconds: '300',
      finallyStopThreads: '5',
      finallyStopThreadsEverySeconds: '1'
    },
    concurrencyThreadGroupVO: {
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      targetConcurrency: '20',
      rampUpTime: '300',
      rampUpStepsCount: '10',
      holdTargetRateTime: '300'
    },
    httpVO: {
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      protocol: 'http',
      domain: '',
      port: '',
      method: 'GET',
      path: '',
      contentEncoding: 'UTF-8',
      httpHeaderVOList: [{ id: 0, testCaseId: 0, jmxId: 0, httpId: 0, headerKey: '', headerValue: '' }],
      httpParamVOList: [{ id: 0, testCaseId: 0, jmxId: 0, httpId: 0, paramKey: '', paramValue: '' }],
      body: ''
    },
    javaVO: {
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      javaRequestClassPath: '',
      javaParamVOList: [{ id: 0, testCaseId: 0, jmxId: 0, javaId: 0, paramKey: '', paramValue: '' }]
    },
    dubboVO: {
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      name: '',
      comments: '',
      configCenterProtocol: '',
      configCenterGroup: '',
      configCenterNamespace: '',
      configCenterUsername: '',
      configCenterPassword: '',
      configCenterAddress: '',
      configCenterTimeout: '',
      registryProtocol: '',
      registryGroup: '',
      registryUsername: '',
      registryPassword: '',
      registryAddress: '',
      registryTimeout: '',
      rpcProtocol: 'dubbo://',
      timeout: '1000',
      version: '1.0',
      retries: '0',
      cluster: 'failfast',
      group: '',
      connections: '1',
      async: 'sync',
      loadBalance: 'random',
      interfaceName: '',
      method: '',
      methodArgsSize: 0,
      attachmentArgsSize: 0,
      dubboMethodArgsVOList: [],
      dubboAttachmentArgsVOList: []
    },
    assertionVO: {
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      responseCode: '',
      responseMessage: '',
      jsonPath: '',
      expectedValue: ''
    },
    csvDataVO: {
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      fileEncoding: 'UTF-8',
      ignoreFirstLine: true,
      allowQuotedData: false,
      recycleOnEof: true,
      stopThreadOnEof: false,
      sharingMode: 'Current Thread group',
      csvFileVOList: [] // 用于存储多个 CSV 文件配置
    }
  };

  if (id) {
    // 如果传入了 id，则调用获取数据操作
    const res = await getOnlineJmx(id);
    const code = res.data.code;
    if (code != 0) {
      ElMessage.error(res.data.message);
      onlineDrawer.value = false;
      return false;
    }

    const onlineJmxData = res.data.data;

    // 判断 jmeterScriptType
    if (onlineJmxData.jmeterScriptType !== 1) {
      ElMessage.warning("此操作只支持在线编写的脚本");
      return false;
    }

    // 设置 onlineJmxItem 的值
    onlineJmxItem.value = {
      id: onlineJmxData.id,
      srcName: onlineJmxData.srcName,
      dstName: onlineJmxData.srcName,
      testCaseId: onlineJmxData.testCaseId,
      jmxDir: onlineJmxData.jmxDir,
      jmeterScriptType: onlineJmxData.jmeterScriptType,
      jmeterThreadsType: onlineJmxData.jmeterThreadsType,
      jmeterSampleType: onlineJmxData.jmeterSampleType,
      threadGroupVO: {
        id: onlineJmxData.threadGroupVO?.id || 0,
        testCaseId: onlineJmxData.threadGroupVO?.testCaseId || 0,
        jmxId: onlineJmxData.threadGroupVO?.jmxId || 0,
        numThreads: onlineJmxData.threadGroupVO?.numThreads || '1',
        rampTime: onlineJmxData.threadGroupVO?.rampTime || '0',
        loops: onlineJmxData.threadGroupVO?.loops || '-1',
        sameUserOnNextIteration: numberToBoolean(onlineJmxData.threadGroupVO?.sameUserOnNextIteration || 0),
        delayedStart: numberToBoolean(onlineJmxData.threadGroupVO?.delayedStart || 0),
        scheduler: numberToBoolean(onlineJmxData.threadGroupVO?.scheduler || 0),
        duration: onlineJmxData.threadGroupVO?.duration || '300',
        delay: onlineJmxData.threadGroupVO?.delay || '0'
      },
      steppingThreadGroupVO: {
        id: onlineJmxData.steppingThreadGroupVO?.id || 0,
        testCaseId: onlineJmxData.steppingThreadGroupVO?.testCaseId || 0,
        jmxId: onlineJmxData.steppingThreadGroupVO?.jmxId || 0,
        numThreads: onlineJmxData.steppingThreadGroupVO?.numThreads || '20',
        firstWaitForSeconds: onlineJmxData.steppingThreadGroupVO?.firstWaitForSeconds || '0',
        thenStartThreads: onlineJmxData.steppingThreadGroupVO?.thenStartThreads || '0',
        nextAddThreads: onlineJmxData.steppingThreadGroupVO?.nextAddThreads || '2',
        nextAddThreadsEverySeconds: onlineJmxData.steppingThreadGroupVO?.nextAddThreadsEverySeconds || '30',
        usingRampUpSeconds: onlineJmxData.steppingThreadGroupVO?.usingRampUpSeconds || '5',
        thenHoldLoadForSeconds: onlineJmxData.steppingThreadGroupVO?.thenHoldLoadForSeconds || '300',
        finallyStopThreads: onlineJmxData.steppingThreadGroupVO?.finallyStopThreads || '5',
        finallyStopThreadsEverySeconds: onlineJmxData.steppingThreadGroupVO?.finallyStopThreadsEverySeconds || '1'
      },
      concurrencyThreadGroupVO: {
        id: onlineJmxData.concurrencyThreadGroupVO?.id || 0,
        testCaseId: onlineJmxData.concurrencyThreadGroupVO?.testCaseId || 0,
        jmxId: onlineJmxData.concurrencyThreadGroupVO?.jmxId || 0,
        targetConcurrency: onlineJmxData.concurrencyThreadGroupVO?.targetConcurrency || '20',
        rampUpTime: onlineJmxData.concurrencyThreadGroupVO?.rampUpTime || '300',
        rampUpStepsCount: onlineJmxData.concurrencyThreadGroupVO?.rampUpStepsCount || '10',
        holdTargetRateTime: onlineJmxData.concurrencyThreadGroupVO?.holdTargetRateTime || '300'
      },
      httpVO: {
        id: onlineJmxData.httpVO?.id || 0,
        testCaseId: onlineJmxData.httpVO?.testCaseId || 0,
        jmxId: onlineJmxData.httpVO?.jmxId || 0,
        protocol: onlineJmxData.httpVO?.protocol || 'http',
        domain: onlineJmxData.httpVO?.domain || '',
        port: onlineJmxData.httpVO?.port || '',
        method: onlineJmxData.httpVO?.method || 'GET',
        path: onlineJmxData.httpVO?.path || '',
        contentEncoding: onlineJmxData.httpVO?.contentEncoding || 'UTF-8',
        httpHeaderVOList: (onlineJmxData.httpVO?.httpHeaderVOList || []).map(h => ({
          id: h.id || 0,
          testCaseId: h.testCaseId || 0,
          jmxId: h.jmxId || 0,
          httpId: h.httpId || 0,
          headerKey: h.headerKey || '',
          headerValue: h.headerValue || ''
        })),
        httpParamVOList: (onlineJmxData.httpVO?.httpParamVOList || []).map(p => ({
          id: p.id || 0,
          testCaseId: p.testCaseId || 0,
          jmxId: p.jmxId || 0,
          httpId: p.httpId || 0,
          paramKey: p.paramKey || '',
          paramValue: p.paramValue || ''
        })),
        body: onlineJmxData.httpVO?.body || ''
      },
      javaVO: {
        id: onlineJmxData.javaVO?.id || 0,
        testCaseId: onlineJmxData.javaVO?.testCaseId || 0,
        jmxId: onlineJmxData.javaVO?.jmxId || 0,
        javaRequestClassPath: onlineJmxData.javaVO?.javaRequestClassPath || '',
        javaParamVOList: (onlineJmxData.javaVO?.javaParamVOList || []).map(p => ({
          id: p.id || 0,
          testCaseId: p.testCaseId || 0,
          jmxId: p.jmxId || 0,
          javaId: p.javaId || 0,
          paramKey: p.paramKey || '',
          paramValue: p.paramValue || ''
        }))
      },
      dubboVO: {
        id: onlineJmxData.dubboVO?.id || 0,
        testCaseId: onlineJmxData.dubboVO?.testCaseId || 0,
        jmxId: onlineJmxData.dubboVO?.jmxId || 0,
        name: onlineJmxData.dubboVO?.name || '',
        comments: onlineJmxData.dubboVO?.comments || '',
        configCenterProtocol: onlineJmxData.dubboVO?.configCenterProtocol || '',
        configCenterGroup: onlineJmxData.dubboVO?.configCenterGroup || '',
        configCenterNamespace: onlineJmxData.dubboVO?.configCenterNamespace || '',
        configCenterUsername: onlineJmxData.dubboVO?.configCenterUsername || '',
        configCenterPassword: onlineJmxData.dubboVO?.configCenterPassword || '',
        configCenterAddress: onlineJmxData.dubboVO?.configCenterAddress || '',
        configCenterTimeout: onlineJmxData.dubboVO?.configCenterTimeout || '',
        registryProtocol: onlineJmxData.dubboVO?.registryProtocol || '',
        registryGroup: onlineJmxData.dubboVO?.registryGroup || '',
        registryUsername: onlineJmxData.dubboVO?.registryUsername || '',
        registryPassword: onlineJmxData.dubboVO?.registryPassword || '',
        registryAddress: onlineJmxData.dubboVO?.registryAddress || '',
        registryTimeout: onlineJmxData.dubboVO?.registryTimeout || '',
        rpcProtocol: onlineJmxData.dubboVO?.rpcProtocol || 'dubbo://',
        timeout: onlineJmxData.dubboVO?.timeout || '1000',
        version: onlineJmxData.dubboVO?.version || '1.0',
        retries: onlineJmxData.dubboVO?.retries || '0',
        cluster: onlineJmxData.dubboVO?.cluster || 'failfast',
        group: onlineJmxData.dubboVO?.group || '',
        connections: onlineJmxData.dubboVO?.connections || '1',
        async: onlineJmxData.dubboVO?.async || 'sync',
        loadBalance: onlineJmxData.dubboVO?.loadBalance || 'random',
        interfaceName: onlineJmxData.dubboVO?.interfaceName || '',
        method: onlineJmxData.dubboVO?.method || '',
        methodArgsSize: onlineJmxData.dubboVO?.methodArgsSize || 0,
        attachmentArgsSize: onlineJmxData.dubboVO?.attachmentArgsSize || 0,
        dubboMethodArgsVOList: (onlineJmxData.dubboVO?.dubboMethodArgsVOList || []).map(m => ({
          id: m.id || 0,
          testCaseId: m.testCaseId || 0,
          jmxId: m.jmxId || 0,
          dubboId: m.dubboId || 0,
          paramType: m.paramType || '',
          paramValue: m.paramValue || ''
        })),
        dubboAttachmentArgsVOList: (onlineJmxData.dubboVO?.dubboAttachmentArgsVOList || []).map(a => ({
          id: a.id || 0,
          testCaseId: a.testCaseId || 0,
          jmxId: a.jmxId || 0,
          dubboId: a.dubboId || 0,
          attachmentKey: a.attachmentKey || '',
          attachmentValue: a.attachmentValue || ''
        }))
      },
      assertionVO: {
        id: onlineJmxData.assertionVO?.id || 0,
        testCaseId: onlineJmxData.assertionVO?.testCaseId || 0,
        jmxId: onlineJmxData.assertionVO?.jmxId || 0,
        responseCode: onlineJmxData.assertionVO?.responseCode || '',
        responseMessage: onlineJmxData.assertionVO?.responseMessage || '',
        jsonPath: onlineJmxData.assertionVO?.jsonPath || '',
        expectedValue: onlineJmxData.assertionVO?.expectedValue || ''
      },
      csvDataVO: {
        id: onlineJmxData.csvDataVO?.id || 0,
        testCaseId: onlineJmxData.csvDataVO?.testCaseId || 0,
        jmxId: onlineJmxData.csvDataVO?.jmxId || 0,
        fileEncoding: onlineJmxData.csvDataVO?.fileEncoding || 'UTF-8',
        ignoreFirstLine: numberToBoolean(onlineJmxData.csvDataVO?.ignoreFirstLine || 1),
        allowQuotedData: numberToBoolean(onlineJmxData.csvDataVO?.allowQuotedData || 0),
        recycleOnEof: numberToBoolean(onlineJmxData.csvDataVO?.recycleOnEof || 1),
        stopThreadOnEof: numberToBoolean(onlineJmxData.csvDataVO?.stopThreadOnEof || 0),
        sharingMode: onlineJmxData.csvDataVO?.sharingMode || 'Current thread group',
        csvFileVOList: (onlineJmxData.csvDataVO?.csvFileVOList || []).map(csvFile => ({
          filename: csvFile.filename || '',
          variableNames: csvFile.variableNames || '',
          delimiter: csvFile.delimiter || ','
        }))
      }
    };
    //根据 onlineJmxData 设置 jmeterThreadsType 和 jmeterSampleType
    jmeterThreadsType.value = getJmeterThreadsType(onlineJmxData.jmeterThreadsType);
    jmeterSampleType.value = getJmeterSampleType(onlineJmxData.jmeterSampleType);

  } else {
    // 如果是新增操作，重置为默认值
    jmeterThreadsType.value = 'threadGroup';
    jmeterSampleType.value = 'http';
  }
  await getFullTestCase(testCaseFullData.value.id);
};

const getJmeterThreadsType = (type: number): string => {
  switch (type) {
    case 0:
      return 'threadGroup';
    case 1:
      return 'steppingThreadGroup';
    case 2:
      return 'concurrencyThreadGroup';
    default:
      return 'threadGroup';
  }
};

const getJmeterSampleType = (type: number): string => {
  switch (type) {
    case 0:
      return 'http';
    case 1:
      return 'java';
    case 2:
      return 'dubbo';
    default:
      return 'http';
  }
};

const handleThreadGroupTypeChange = (value: string) => {
  switch (value) {
    case 'threadGroup':
      onlineJmxItem.value.jmeterThreadsType = 0;
      break;
    case 'steppingThreadGroup':
      onlineJmxItem.value.jmeterThreadsType = 1;
      break;
    case 'concurrencyThreadGroup':
      onlineJmxItem.value.jmeterThreadsType = 2;
      break;
    default:
      onlineJmxItem.value.jmeterThreadsType = 0;
  }
};

const handleRequestTypeChange = (value: string) => {
  switch (value) {
    case 'http':
      onlineJmxItem.value.jmeterSampleType = 0;
      activeHttpTab.value = 'header'; // 切换到 HttpRequest 时展开 Header 标签
      break;
    case 'java':
      onlineJmxItem.value.jmeterSampleType = 1;
      activeJavaTab.value = 'javaParams'; // 切换到 JavaRequest 时展开 JavaParams 标签
      break;
    case 'dubbo':
      onlineJmxItem.value.jmeterSampleType = 2;
      // activeSubTab.value = ''; // DubboRequest 没有 tab，所以不展开任何 tab
      break;
    default:
      onlineJmxItem.value.jmeterSampleType = 0;
      activeHttpTab.value = 'header'; // 默认情况展开 HttpRequest 的 Header 标签
  }
};

const numberToBoolean = (value: number): boolean => value === 1;
// Simplify checkbox change handler using helper function
const boolToNumber = (value: boolean): number => value ? 1 : 0;

// Reusable function to add a new item to any list (like headers, params)
const addNewItem = <T>(list: T[], newItem: T) => {
  list.push(newItem);
};

// Reusable function to delete an item by index from a list
const deleteItemByIndex = <T>(list: T[], index: number) => {
  list.splice(index, 1);
};

// Refactored HTTP Header and Param handlers using generic functions
const handleHttpHeaderAdd = () => {
  addNewItem(onlineJmxItem.value.httpVO.httpHeaderVOList, {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    httpId: 0,
    headerKey: '',
    headerValue: ''
  });
};

const handleHttpHeaderDelete = (index: number) => {
  deleteItemByIndex(onlineJmxItem.value.httpVO.httpHeaderVOList, index);
};

const handleHttpParamAdd = () => {
  addNewItem(onlineJmxItem.value.httpVO.httpParamVOList, {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    httpId: 0,
    paramKey: '',
    paramValue: ''
  });
};

const handleHttpParamDelete = (index: number) => {
  deleteItemByIndex(onlineJmxItem.value.httpVO.httpParamVOList, index);
};

// Java Param handlers using the same generic functions
const handleJavaParamAdd = () => {
  addNewItem(onlineJmxItem.value.javaVO.javaParamVOList, {
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    javaId: 0,
    paramKey: '',
    paramValue: ''
  });
};

const checkHttpHeaderKeyUniqueness = (row, index) => {
  const headerKey = row.headerKey;
  let hasError = false;

  onlineJmxItem.value.httpVO.httpHeaderVOList.forEach((item, i) => {
    if (i !== index && item.headerKey === headerKey) {
      hasError = true;
    }
  });

  row.headerKeyError = hasError;
}

const checkHttpParamKeyUniqueness = (row, index) => {
  const paramKey = row.paramKey;
  let hasError = false;

  onlineJmxItem.value.httpVO.httpParamVOList.forEach((item, i) => {
    if (i !== index && item.paramKey === paramKey) {
      hasError = true;
    }
  });

  row.paramKeyError = hasError;
}

const checkJavaParamKeyUniqueness = (row, index) => {
  const paramKey = row.paramKey;
  let hasError = false;

  onlineJmxItem.value.javaVO.javaParamVOList.forEach((item, i) => {
    if (i !== index && item.paramKey === paramKey) {
      hasError = true;
    }
  });

  row.paramKeyError = hasError;
}


const handleJavaParamDelete = (index: number) => {
  deleteItemByIndex(onlineJmxItem.value.javaVO.javaParamVOList, index);
};

// 定义用于 API 的类型
interface OnlineJmxItemForApi extends Omit<OnlineJmxItem, 'threadGroupVO' | 'csvDataVO'> {
  threadGroupVO: {
    sameUserOnNextIteration: number;
    delayedStart: number;
    scheduler: number;
    id: number;
    testCaseId: number;
    jmxId: number;
    numThreads: string;
    rampTime: string;
    loops: string;
    duration: string;
    delay: string;
  };
  csvDataVO: {
    ignoreFirstLine: number;
    allowQuotedData: number;
    recycleOnEof: number;
    stopThreadOnEof: number;
    id: number;
    testCaseId: number;
    jmxId: number;
    fileEncoding: string;
    sharingMode: string;
  };
}

// 布尔值转数字的公共方法
const convertBooleanToNumber = (item: OnlineJmxItem): OnlineJmxItemForApi => {
  const { sameUserOnNextIteration, delayedStart, scheduler, ...restOfThreadGroupVO } = item.threadGroupVO;
  const { ignoreFirstLine, recycleOnEof, stopThreadOnEof, allowQuotedData, ...restOfCsvDataVO } = item.csvDataVO;

  return {
    ...item,
    threadGroupVO: {
      sameUserOnNextIteration: boolToNumber(sameUserOnNextIteration),
      delayedStart: boolToNumber(delayedStart),
      scheduler: boolToNumber(scheduler),
      // 保留其他字段
      ...restOfThreadGroupVO
    },
    csvDataVO: {
      ignoreFirstLine: boolToNumber(ignoreFirstLine),
      recycleOnEof: boolToNumber(recycleOnEof),
      stopThreadOnEof: boolToNumber(stopThreadOnEof),
      allowQuotedData: boolToNumber(allowQuotedData),
      // 保留其他字段
      ...restOfCsvDataVO
    }
  };
};

const handleAddCsvFile = () => {
  // 添加新的 CSV 文件配置
  onlineJmxItem.value.csvDataVO.csvFileVOList.push({
    filename: '',
    variableNames: '',
    delimiter: ','
  });
};

const handleCsvFileDelete = (index: number) => {
  // 删除指定的 CSV 文件配置
  onlineJmxItem.value.csvDataVO.csvFileVOList.splice(index, 1);
};

const handleCsvConfigChange = (value: string) => {
  // 处理 CSV Config 切换逻辑
  console.log('CSV Config changed:', value);
};

const activeDubboTab = ref('args');

const handleDubboMethodArgsAdd = () => {
  onlineJmxItem.value.dubboVO.dubboMethodArgsVOList.push({
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    dubboId: 0,
    paramType: '',
    paramValue: ''
  });
};

const handleDubboMethodArgsDelete = (index: number) => {
  onlineJmxItem.value.dubboVO.dubboMethodArgsVOList.splice(index, 1);
};

const handleDubboAttachmentArgsAdd = () => {
  onlineJmxItem.value.dubboVO.dubboAttachmentArgsVOList.push({
    id: 0,
    testCaseId: 0,
    jmxId: 0,
    dubboId: 0,
    attachmentKey: '',
    attachmentValue: ''
  });
};

const handleDubboAttachmentArgsDelete = (index: number) => {
  onlineJmxItem.value.dubboVO.dubboAttachmentArgsVOList.splice(index, 1);
};

// 添加在线 JMX 数据的函数
const addOnlineJmxData = async (formattedItem: OnlineJmxItemForApi) => {
  const res = await addOnlineJmx(formattedItem);
  const code = res.data.code;
  if (code !== 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("新增成功");
    onlineDrawer.value = false;
  }
};

// 更新在线 JMX 数据的函数
const updateOnlineJmxData = async (formattedItem: OnlineJmxItemForApi) => {
  const res = await updateOnlineJmx(formattedItem.id, formattedItem);
  const code = res.data.code;
  if (code !== 0) {
    ElMessage.error(res.data.message);
  } else {
    ElMessage.success("更新成功");
    onlineDrawer.value = false;
  }
};

// 处理保存操作的函数
const handleSave = async () => {
  // 强制计算 isParamDisabled 和 isBodyDisabled 确保它们的值是最新的
  const isParamDisabledValue = isParamDisabled.value;
  const isBodyDisabledValue = isBodyDisabled.value;

  const formattedItem = convertBooleanToNumber(onlineJmxItem.value);

  // 如果 Param 被禁用，则将 Param 传 null
  if (isParamDisabledValue) {
    formattedItem.httpVO.httpParamVOList = [];
  }

  // 如果 Body 被禁用，则将 Body 传 null
  if (isBodyDisabledValue) {
    formattedItem.httpVO.body = null;
  }

  // 保存编辑后的 JMX 脚本数据
  if (onlineJmxItem.value.id) {
    // 如果 id 不为空，则调用更新操作
    await updateOnlineJmxData(formattedItem);
  } else {
    // 如果 id 为空，则调用新增操作
    await addOnlineJmxData(formattedItem);
  }

  // 在操作完成后刷新关联列表
  await getFullTestCase(testCaseFullData.value.id);
};

const handleCheckboxChange = (field: string, value: boolean) => {
  onlineJmxItem.value.threadGroupVO[field] = value;
};
</script>

<style scoped>
.bar-schart-box {
  display: inline-block;
  margin: 20px;
  width: 100%;
}
.bar-schart {
  width: 100%;
  height: 30vh;
  margin-bottom: 20px;
}
.horizontal-dropdown-menu {
  display: flex;
  flex-direction: row;
  padding: 6px;
  gap: 4px;
}
.horizontal-dropdown-menu .el-dropdown-item {
  padding: 4px 10px;
  border-radius: var(--radius-md);
}
.horizontal-dropdown-menu .el-dropdown-item:hover {
  background: var(--color-bg-muted);
}
.fixed-save-button {
  position: absolute;
  bottom: 20px;
  left: 20px;
}
.error-input {
  border-color: red;
}
.error-message {
  color: red;
  font-size: 12px;
}

/* 操作列按钮对齐 —— 三行每行两个，等宽对齐 */
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
