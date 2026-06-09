<template>
  <div>
    <TestcaseKpiStrip :stats="stats" :total="total" />

    <div class="container">
      <div class="handle-box" style="flex-wrap:nowrap">
        <el-input v-model="query.name" placeholder="名称" class="handle-input mr10" style="width:130px"></el-input>
        <el-input v-model="query.description" placeholder="描述" class="handle-input mr10" style="width:160px"></el-input>
        <el-select v-model="query.biz" placeholder="产品线" class="handle-select mr10" style="width:120px" clearable filterable>
          <el-option v-for="item in bizOptions" :key="item" :label="item" :value="item"></el-option>
        </el-select>
        <el-select v-model="query.service" placeholder="服务" class="handle-select mr10" style="width:120px" clearable filterable>
          <el-option v-for="item in serviceOptions" :key="item" :label="item" :value="item"></el-option>
        </el-select>

        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <span style="flex:1"></span>
        <span class="auto-refresh"><span class="ar-dot"></span>每 30s 自动刷新</span>
        <el-button type="primary" :icon="Plus" @click="handleInsert">新增用例</el-button>
      </div>

      <TestcaseTable
        :rows="testCaseData"
        :loading="loading"
        @detail="openDetail"
        @edit="handleEdit"
        @reports="goReports"
        @history="openHistoryDrawer"
        @debug="debugAction"
        @run="openRunDialog"
        @schedule="openScheduleDialog"
        @delete="handleDelete"
        @sort-change="handleSortChange"
      />

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

    <TestcaseFormDialog
      v-model="insertVisible"
      mode="insert"
      :form="insertForm"
      :biz-options="bizOptions"
      :service-options="serviceOptions"
      :version-options="versionOptions"
      @confirm="saveInsert"
    />

    <TestcaseFormDialog
      v-model="editVisible"
      mode="edit"
      :form="editForm"
      :biz-options="bizOptions"
      :service-options="serviceOptions"
      :version-options="versionOptions"
      @confirm="saveEdit"
    />

    <RunParamDialog
      v-model="runVisible"
      :form="runForm"
      :region-list="regionList"
      :max-slave-count="maxSlaveCount"
      :submitting="runSubmitting"
      @region-change="onRegionChange"
      @confirm="confirmRun"
    />

    <ScheduleTaskDialog
      v-model="scheduleVisible"
      :form="scheduleForm"
      :region-list="regionList"
      :max-slave-count="maxSlaveCount"
      @region-change="onScheduleRegionChange"
      @confirm="confirmSchedule"
    />

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
              <el-button text type="primary" icon="el-icon-view" @click="jmxDrawer = true, handleJmxView(scope.row.id)" v-permiss="'testcase'">预览</el-button>
              <el-button text type="danger" icon="el-icon-delete" @click="handleJmxDelete(scope.row.id)" v-permiss="'testcase'">删除</el-button>
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
          <el-table-column label="分布式策略" width="170" align="center">
            <template #default="scope">
              <el-select
                  size="small"
                  :model-value="scope.row.distributionStrategy || 'shared'"
                  @change="(value) => handleCsvStrategyChange(scope.row, value)"
              >
                <el-option label="共享文件" value="shared"></el-option>
                <el-option label="按压力机切片" value="split_by_slave"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="testCaseId" label="用例" align="center"></el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="scope">
              <el-button text type="primary" icon="el-icon-view" @click="csvDrawer = true, handleCsvView(scope.row.id)" v-permiss="'testcase'">预览</el-button>
              <el-button text type="danger" icon="el-icon-delete" @click="handleCsvDelete(scope.row.id)" v-permiss="'testcase'">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 上传接口文件资源模块 -->
      <el-card shadow="hover" style="margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div style="font-weight: bold; font-size: 14px; border-bottom: 2px solid #E6A23C; padding-bottom: 5px;">
            📎 上传接口文件资源
          </div>
          <el-space direction="horizontal" alignment="center">
            <el-upload action="" :show-file-list="false" :http-request="handleUploadFileUpload">
              <el-button type="primary">本地上传</el-button>
            </el-upload>
          </el-space>
        </div>
        <el-table :data="uploadFileFullData" border style="width: 100%">
          <el-table-column prop="id" label="编号" width="55" align="center"></el-table-column>
          <el-table-column prop="dstName" label="名称" align="center">
            <template #default="scope">
              <div @click="handleUploadFileDownload(scope.row.id, scope.row.dstName)" style="color: blue; cursor: pointer;">
                {{ scope.row.dstName }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" align="center"></el-table-column>
          <el-table-column prop="testCaseId" label="用例" align="center"></el-table-column>
          <el-table-column label="操作" width="160" align="center">
            <template #default="scope">
              <el-button text type="danger" icon="el-icon-delete" @click="handleUploadFileDelete(scope.row.id)" v-permiss="'testcase'">删除</el-button>
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
          <el-table-column prop="dstName" label="名称" align="center">
            <template #default="scope">
              <div @click="handleJarDownload(scope.row.id, scope.row.dstName)" style="color: blue; cursor: pointer;">
                {{ scope.row.dstName }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" align="center"></el-table-column>
          <el-table-column prop="testCaseId" label="用例" align="center"></el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="scope">
              <el-button text type="danger" icon="el-icon-delete" @click="handleJarDelete(scope.row.id)" v-permiss="'testcase'">删除</el-button>
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

    <!--    抽屉展示CSV详情-->
    <el-drawer
        v-model="csvDrawer"
        :title="csvEditMode ? '编辑数据' : '数据详情'"
        :show-close="true"
        :with-header="true"
        :size="'60%'"
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

  </div>

    <HistoryReportDrawer
      v-model="historyDrawerVisible"
      :title="historyDrawerTitle"
      :reports="historyReports"
      :loading="historyLoading"
      :page="historyQuery.page"
      :size="historyQuery.size"
      :total="historyTotal"
      @page-change="handleHistoryPageChange"
      @open-chart="openHistoryChart"
    />

    <!-- 历史曲线对话框 -->
    <el-dialog title="历史曲线" v-model="historyChartVisible" width="900px" destroy-on-close>
      <div v-loading="historyChartLoading">
        <JmeterMetricsChart :data="historyMetricsData" />
      </div>
    </el-dialog>
</template>

<script setup lang="ts" name="baseTestCase">
import {ref, reactive, onUnmounted, onMounted, onActivated, computed} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import VirtualTextViewer from '../components/VirtualTextViewer.vue';
import { Plus, Search, Delete, Refresh } from '@element-plus/icons-vue';
import {
  addTestCase, debugTestCase,
  deleteTestCase,
  getTestCaseList,
  getTestCaseStats,
  updateTestCase
} from "../api/testcase";
import {getOptions} from "../api/config";
import {viewCsv, updateCsv} from "../api/csv";
import {getReportListByTestCase, getMetrics} from "../api/report";
import JmeterMetricsChart from '../components/JmeterMetricsChart.vue';
import HistoryReportDrawer from '../components/testcase/HistoryReportDrawer.vue';
import RunParamDialog from '../components/testcase/RunParamDialog.vue';
import ScheduleTaskDialog from '../components/testcase/ScheduleTaskDialog.vue';
import TestcaseFormDialog from '../components/testcase/TestcaseFormDialog.vue';
import TestcaseKpiStrip from '../components/testcase/TestcaseKpiStrip.vue';
import TestcaseTable from '../components/testcase/TestcaseTable.vue';
import { useRunConfig } from '../composables/useRunConfig';
import { useScheduleTask } from '../composables/useScheduleTask';
import { useTestcaseFiles } from '../composables/useTestcaseFiles';
import { useJmxEditor } from '../composables/useJmxEditor';
import router from "../router";
import {checkToLogin} from "../common/push";
import {useRoute} from "vue-router";

const drawer = ref(false);
const csvDrawer = ref(false)

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
  description: null,
  biz: null,
  service: null,
  page: 1,
  size: 10,
  sortBy: 'id',
  sortOrder: 'desc'
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

const loading = ref(false);
const testCaseData = ref<TestCaseItem[]>([]);
const total = ref(0);

// 用例状态统计（用于 KPI，按当前搜索条件统计全部匹配用例，不受分页影响）
const testcaseStats = ref({ total: 0, idle: 0, running: 0, success: 0, failed: 0, waiting: 0, canceled: 0 });
const loadTestCaseStats = async () => {
  try {
    const res = await getTestCaseStats(query);
    if (res.data.code === 0) {
      testcaseStats.value = res.data.data || testcaseStats.value;
    }
  } catch { /* ignore */ }
};

// KPI 统计
const stats = computed(() => {
  const ts = testcaseStats.value;
  const executed = ts.success + ts.failed;
  const successRate = executed === 0 ? 100 : Math.round((ts.success / executed) * 1000) / 10;
  return { running: ts.running, idle: ts.idle, success: ts.success, error: ts.failed, successRate };
});
const getList = async () => {
  loading.value = true;
  try {
    const res = await getTestCaseList(query);
    checkToLogin(res.data.message);
    const code = res.data.code
    if (code != 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    testCaseData.value = res.data.data.list;
    total.value = res.data.data.total ?? 0;
    await loadTestCaseStats();
  } finally {
    loading.value = false;
  }
};

// 定时刷新数据
let interval: ReturnType<typeof setInterval>;
onMounted(() => {
  getList(); // 页面加载时获取一次数据
  interval = setInterval(() => { getList(); }, 30000); // 每30秒刷新一次
});

onUnmounted(() => {
  clearInterval(interval); // 页面卸载时清除定时器
});

// 查询操作
const handleSearch = () => {
  query.page = 1;
  if (query.id === '') query.id = null;
  if (query.name === '') query.name = null;
  if (query.description === '') query.description = null;
  if (query.biz === '') query.biz = null;
  if (query.service === '') query.service = null;
  getList();
};

const handleReset = () => {
  query.id = null;
  query.name = null;
  query.description = null;
  query.biz = null;
  query.service = null;
  query.sortBy = 'id';
  query.sortOrder = 'desc';
  getList();
};

const handleSortChange = ({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) => {
  const sortMap: Record<string, string> = {
    id: 'id',
    createTime: 'createTime',
    modifyTime: 'modifyTime'
  };
  query.sortBy = sortMap[prop] || 'id';
  query.sortOrder = order === 'ascending' ? 'asc' : 'desc';
  query.page = 1;
  getList();
};

const openDetail = (id: number) => {
  drawer.value = true;
  getFullTestCase(id);
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
    await getList();
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

// 压测和定时压测配置
const {
  runVisible,
  runSubmitting,
  maxSlaveCount,
  regionList,
  runForm,
  onRegionChange,
  openRunDialog,
  confirmRun
} = useRunConfig({ refresh: getList });

const {
  scheduleVisible,
  scheduleForm,
  onScheduleRegionChange,
  openScheduleDialog,
  confirmSchedule
} = useScheduleTask({ maxSlaveCount, regionList, refresh: getList });

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

// 测试用例详情和关联文件资源
const {
  fullVisible,
  testCaseFullData,
  jmxFullData,
  csvFullData,
  jarFullData,
  uploadFileFullData,
  getFullTestCase,
  handleCsvDelete,
  handleJmxDelete,
  handleJarDelete,
  handleUploadFileDelete,
  handleJmxUpload,
  handleCsvUpload,
  handleCsvStrategyChange,
  handleJarUpload,
  handleUploadFileUpload,
  handleJmxDownload,
  handleCsvDownload,
  handleJarDownload,
  handleUploadFileDownload
} = useTestcaseFiles();

// JMX 预览和在线编辑
const {
  jmxDrawer,
  onlineDrawer,
  jmxFile,
  jmxEditMode,
  jmxEditContent,
  jmeterThreadsType,
  jmeterSampleType,
  activeTab,
  activeHttpTab,
  activeJavaTab,
  activeDubboTab,
  formattedJson,
  onlineJmxItem,
  isParamDisabled,
  isBodyDisabled,
  onJsonBlur,
  handleJmxView,
  enterJmxEdit,
  cancelJmxEdit,
  saveJmxEdit,
  getOnlineJmxData,
  handleThreadGroupTypeChange,
  handleRequestTypeChange,
  handleHttpHeaderAdd,
  handleHttpHeaderDelete,
  handleHttpParamAdd,
  handleHttpParamDelete,
  handleJavaParamAdd,
  handleJavaParamDelete,
  checkHttpHeaderKeyUniqueness,
  checkHttpParamKeyUniqueness,
  checkJavaParamKeyUniqueness,
  handleAddCsvFile,
  handleCsvFileDelete,
  handleCsvConfigChange,
  handleDubboMethodArgsAdd,
  handleDubboMethodArgsDelete,
  handleDubboAttachmentArgsAdd,
  handleDubboAttachmentArgsDelete,
  handleSave,
  handleCheckboxChange
} = useJmxEditor({ testCaseFullData, getFullTestCase });

// 预览csv
const csvFile = ref('');
const csvEditMode = ref(false);
const csvTextContent = ref('');
const currentCsvId = ref(0);
const handleCsvView = async (id: number) => {
  csvEditMode.value = false;
  currentCsvId.value = id;
  const res = await viewCsv(id);
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
  const res = await updateCsv(currentCsvId.value, csvTextContent.value);
  const code = res.data.code;
  if (code !== 0) {
    ElMessage.error(res.data.message || '保存失败');
  } else {
    ElMessage.success('保存成功');
    csvFile.value = csvTextContent.value;
    csvEditMode.value = false;
  }
};


// const goReports = () => {
//   router.push({path:'/report'})
// }

const goReports = (testCaseId) => {
  router.push(`/report?testCaseId=${encodeURIComponent(String(testCaseId))}&refreshAt=${Date.now()}`);
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
const historyChartLoading = ref(false);

const waitForMetricsReady = async (reportId: number, windowSec = 5, retry = 5, interval = 1000) => {
  for (let i = 0; i <= retry; i += 1) {
    const res = await getMetrics(reportId, windowSec);
    if (res.data.code !== 0) return res;
    const items = res.data.data || [];
    if (items.length > 0 || i === retry) return res;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};

const openHistoryChart = async (reportId: number) => {
  historyChartVisible.value = true;
  historyChartLoading.value = true;
  historyMetricsData.value = [];
  try {
    const res = await waitForMetricsReady(reportId, 5);
    if (res?.data.code === 0) {
      historyMetricsData.value = res.data.data || [];
      if (historyMetricsData.value.length === 0) {
        ElMessage.warning('指标生成中或报告无 JTL 数据，请稍后再试');
      }
    } else {
      ElMessage.error(res?.data.message || '曲线数据读取失败');
    }
  } finally {
    historyChartLoading.value = false;
  }
};

onActivated(() => {
  getList();
});

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
</style>
