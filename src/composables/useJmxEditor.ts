import { computed, ref, watch, type Ref } from 'vue';
import { ElMessage } from 'element-plus';
import { addOnlineJmx, getOnlineJmx, updateJmxContent, updateOnlineJmx, viewJmx } from '../api/jmx';

interface ThreadGroupVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  numThreads: string;
  rampTime: string;
  loops: string;
  sameUserOnNextIteration: boolean;
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

interface HttpHeaderVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  httpId: number;
  headerKey: string;
  headerValue: string;
  headerKeyError?: boolean;
}

interface HttpParamVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  httpId: number;
  paramKey: string;
  paramValue: string;
  paramKeyError?: boolean;
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
  body: string | null;
}

interface JavaParamVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  javaId: number;
  paramKey: string;
  paramValue: string;
  paramKeyError?: boolean;
}

interface JavaVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  javaRequestClassPath: string;
  javaParamVOList: JavaParamVO[];
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

interface AssertionVO {
  id: number;
  testCaseId: number;
  jmxId: number;
  responseCode: string;
  responseMessage: string;
  jsonPath: string;
  expectedValue: string;
}

interface CsvFileVO {
  filename: string;
  variableNames: string;
  delimiter: string;
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

interface OnlineJmxItemForApi extends Omit<OnlineJmxItem, 'threadGroupVO' | 'csvDataVO'> {
  threadGroupVO: Omit<ThreadGroupVO, 'sameUserOnNextIteration' | 'delayedStart' | 'scheduler'> & {
    sameUserOnNextIteration: number;
    delayedStart: number;
    scheduler: number;
  };
  csvDataVO: Omit<CsvDataVO, 'ignoreFirstLine' | 'allowQuotedData' | 'recycleOnEof' | 'stopThreadOnEof'> & {
    ignoreFirstLine: number;
    allowQuotedData: number;
    recycleOnEof: number;
    stopThreadOnEof: number;
  };
}

interface TestCaseFullRef {
  id: number | null;
}

interface UseJmxEditorOptions {
  testCaseFullData: Ref<TestCaseFullRef>;
  getFullTestCase: (id: number) => Promise<unknown>;
}

const numberToBoolean = (value: number): boolean => value === 1;
const boolToNumber = (value: boolean): number => (value ? 1 : 0);

const createDefaultOnlineJmxItem = (testCaseId = 0): OnlineJmxItem => ({
  id: 0,
  srcName: '',
  dstName: '',
  testCaseId,
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
    csvFileVOList: []
  }
});

const formatJson = (body: string | null) => {
  try {
    const jsonObject = JSON.parse(body || '');
    return JSON.stringify(jsonObject, null, 2);
  } catch {
    return body || '';
  }
};

const getJmeterThreadsType = (type: number): string => {
  switch (type) {
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
    case 1:
      return 'java';
    case 2:
      return 'dubbo';
    default:
      return 'http';
  }
};

const convertBooleanToNumber = (item: OnlineJmxItem): OnlineJmxItemForApi => {
  const { sameUserOnNextIteration, delayedStart, scheduler, ...restOfThreadGroupVO } = item.threadGroupVO;
  const { ignoreFirstLine, recycleOnEof, stopThreadOnEof, allowQuotedData, ...restOfCsvDataVO } = item.csvDataVO;

  return {
    ...item,
    threadGroupVO: {
      ...restOfThreadGroupVO,
      sameUserOnNextIteration: boolToNumber(sameUserOnNextIteration),
      delayedStart: boolToNumber(delayedStart),
      scheduler: boolToNumber(scheduler)
    },
    csvDataVO: {
      ...restOfCsvDataVO,
      ignoreFirstLine: boolToNumber(ignoreFirstLine),
      recycleOnEof: boolToNumber(recycleOnEof),
      stopThreadOnEof: boolToNumber(stopThreadOnEof),
      allowQuotedData: boolToNumber(allowQuotedData)
    }
  };
};

export const useJmxEditor = ({ testCaseFullData, getFullTestCase }: UseJmxEditorOptions) => {
  const jmxDrawer = ref(false);
  const onlineDrawer = ref(false);
  const jmxFile = ref('');
  const jmxEditMode = ref(false);
  const jmxEditContent = ref('');
  const currentJmxId = ref(0);

  const jmeterThreadsType = ref('threadGroup');
  const jmeterSampleType = ref('http');
  const activeTab = ref('threads');
  const activeHttpTab = ref('header');
  const activeJavaTab = ref('javaParam');
  const activeDubboTab = ref('args');
  const formattedJson = ref('');
  const onlineJmxItem = ref<OnlineJmxItem>(createDefaultOnlineJmxItem());

  watch(() => onlineJmxItem.value.httpVO.body, (newBody) => {
    formattedJson.value = formatJson(newBody || '');
  }, { immediate: true });

  const isParamDisabled = computed(() => onlineJmxItem.value.httpVO.body !== '');
  const isBodyDisabled = computed(() => (
    onlineJmxItem.value.httpVO.httpParamVOList.some(item => item.paramKey || item.paramValue)
  ));

  const onJsonBlur = (event: Event) => {
    const input = event.target as HTMLTextAreaElement;
    formattedJson.value = formatJson(input.value);
    onlineJmxItem.value.httpVO.body = formattedJson.value;
  };

  const handleJmxView = async (id: number) => {
    jmxEditMode.value = false;
    currentJmxId.value = id;
    const res = await viewJmx(id);
    jmxFile.value = res.data;
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

  const getOnlineJmxData = async (id: number | null) => {
    onlineDrawer.value = true;
    const currentTestCaseId = Number(testCaseFullData.value.id || 0);
    onlineJmxItem.value = createDefaultOnlineJmxItem(currentTestCaseId);

    if (id) {
      const res = await getOnlineJmx(id);
      const code = res.data.code;
      if (code != 0) {
        ElMessage.error(res.data.message);
        onlineDrawer.value = false;
        return false;
      }

      const onlineJmxData = res.data.data;
      if (onlineJmxData.jmeterScriptType !== 1) {
        ElMessage.warning('此操作只支持在线编写的脚本');
        return false;
      }

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
      jmeterThreadsType.value = getJmeterThreadsType(onlineJmxData.jmeterThreadsType);
      jmeterSampleType.value = getJmeterSampleType(onlineJmxData.jmeterSampleType);
    } else {
      jmeterThreadsType.value = 'threadGroup';
      jmeterSampleType.value = 'http';
    }
    await getFullTestCase(currentTestCaseId);
  };

  const handleThreadGroupTypeChange = (value: string) => {
    switch (value) {
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
      case 'java':
        onlineJmxItem.value.jmeterSampleType = 1;
        activeJavaTab.value = 'javaParams';
        break;
      case 'dubbo':
        onlineJmxItem.value.jmeterSampleType = 2;
        break;
      default:
        onlineJmxItem.value.jmeterSampleType = 0;
        activeHttpTab.value = 'header';
    }
  };

  const handleHttpHeaderAdd = () => {
    onlineJmxItem.value.httpVO.httpHeaderVOList.push({
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      httpId: 0,
      headerKey: '',
      headerValue: ''
    });
  };

  const handleHttpHeaderDelete = (index: number) => {
    onlineJmxItem.value.httpVO.httpHeaderVOList.splice(index, 1);
  };

  const handleHttpParamAdd = () => {
    onlineJmxItem.value.httpVO.httpParamVOList.push({
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      httpId: 0,
      paramKey: '',
      paramValue: ''
    });
  };

  const handleHttpParamDelete = (index: number) => {
    onlineJmxItem.value.httpVO.httpParamVOList.splice(index, 1);
  };

  const handleJavaParamAdd = () => {
    onlineJmxItem.value.javaVO.javaParamVOList.push({
      id: 0,
      testCaseId: 0,
      jmxId: 0,
      javaId: 0,
      paramKey: '',
      paramValue: ''
    });
  };

  const handleJavaParamDelete = (index: number) => {
    onlineJmxItem.value.javaVO.javaParamVOList.splice(index, 1);
  };

  const checkHttpHeaderKeyUniqueness = (row: HttpHeaderVO, index: number) => {
    row.headerKeyError = onlineJmxItem.value.httpVO.httpHeaderVOList.some(
      (item, i) => i !== index && item.headerKey === row.headerKey
    );
  };

  const checkHttpParamKeyUniqueness = (row: HttpParamVO, index: number) => {
    row.paramKeyError = onlineJmxItem.value.httpVO.httpParamVOList.some(
      (item, i) => i !== index && item.paramKey === row.paramKey
    );
  };

  const checkJavaParamKeyUniqueness = (row: JavaParamVO, index: number) => {
    row.paramKeyError = onlineJmxItem.value.javaVO.javaParamVOList.some(
      (item, i) => i !== index && item.paramKey === row.paramKey
    );
  };

  const handleAddCsvFile = () => {
    onlineJmxItem.value.csvDataVO.csvFileVOList.push({
      filename: '',
      variableNames: '',
      delimiter: ','
    });
  };

  const handleCsvFileDelete = (index: number) => {
    onlineJmxItem.value.csvDataVO.csvFileVOList.splice(index, 1);
  };

  const handleCsvConfigChange = () => {};

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

  const addOnlineJmxData = async (formattedItem: OnlineJmxItemForApi) => {
    const res = await addOnlineJmx(formattedItem);
    const code = res.data.code;
    if (code !== 0) {
      ElMessage.error(res.data.message);
    } else {
      ElMessage.success('新增成功');
      onlineDrawer.value = false;
    }
  };

  const updateOnlineJmxData = async (formattedItem: OnlineJmxItemForApi) => {
    const res = await updateOnlineJmx(formattedItem.id, formattedItem);
    const code = res.data.code;
    if (code !== 0) {
      ElMessage.error(res.data.message);
    } else {
      ElMessage.success('更新成功');
      onlineDrawer.value = false;
    }
  };

  const handleSave = async () => {
    const isParamDisabledValue = isParamDisabled.value;
    const isBodyDisabledValue = isBodyDisabled.value;
    const formattedItem = convertBooleanToNumber(onlineJmxItem.value);

    if (isParamDisabledValue) {
      formattedItem.httpVO.httpParamVOList = [];
    }
    if (isBodyDisabledValue) {
      formattedItem.httpVO.body = null;
    }

    if (onlineJmxItem.value.id) {
      await updateOnlineJmxData(formattedItem);
    } else {
      await addOnlineJmxData(formattedItem);
    }
    await getFullTestCase(Number(testCaseFullData.value.id || 0));
  };

  const handleCheckboxChange = (field: keyof Pick<ThreadGroupVO, 'sameUserOnNextIteration' | 'delayedStart' | 'scheduler'>, value: boolean) => {
    onlineJmxItem.value.threadGroupVO[field] = value;
  };

  return {
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
  };
};
