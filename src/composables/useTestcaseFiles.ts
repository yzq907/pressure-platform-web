import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getFull } from '../api/testcase';
import {
  addCsvBinding,
  deleteCsvBinding,
  downloadPublicCsv,
  getPublicCsvList,
  updateCsvBindingStrategy
} from '../api/csv';
import { deleteJmx, uploadJmx, downloadJmx } from '../api/jmx';
import { deleteJar, uploadJar, downloadJar } from '../api/jar';
import {
  addUploadFileBinding,
  deleteUploadFileBinding
} from '../api/uploadFile';
import type {
  CsvBindingItem,
  JarItem,
  JmxItem,
  PublicCsvItem,
  UploadFileBindingItem
} from '../common/item';

interface TestCaseFullItem {
  id: number | null;
  name: string | null;
  description: string | null;
  biz: number | null;
  service: string | null;
  version: string | null;
  status: number | null;
  numThreads: string | null;
  rampTime: string | null;
  duration: string | null;
  testCaseDir: string | null;
  jmxItem: JmxItem | null;
  csvBindingItemList: CsvBindingItem[];
  jarItemList: JarItem[];
  uploadFileBindingItemList: UploadFileBindingItem[];
}

export const useTestcaseFiles = () => {
  const fullVisible = ref(false);
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
    csvBindingItemList: [],
    jarItemList: [],
    uploadFileBindingItemList: []
  });
  const jmxFullData = ref<JmxItem[]>([]);
  const csvBindingFullData = ref<CsvBindingItem[]>([]);
  const jarFullData = ref<JarItem[]>([]);
  const uploadFileBindingFullData = ref<UploadFileBindingItem[]>([]);
  const publicCsvSelectVisible = ref(false);
  const publicUploadFileSelectVisible = ref(false);
  const publicCsvLoading = ref(false);
  const publicUploadFileLoading = ref(false);
  const publicCsvOptions = ref<PublicCsvItem[]>([]);
  const publicUploadFileOptions = ref<PublicCsvItem[]>([]);

  const currentTestCaseId = () => Number(testCaseFullData.value.id || 0);

  const getFullTestCase = async (id: number) => {
    fullVisible.value = true;
    const res = await getFull(id);
    const code = res.data.code;
    if (code != 0) {
      ElMessage.error(res.data.message);
      return false;
    }
    const fullData = res.data.data;
    testCaseFullData.value = fullData;
    jmxFullData.value = fullData.jmxVO === null ? [] : [fullData.jmxVO];
    csvBindingFullData.value = fullData.csvBindingVOList || [];
    jarFullData.value = fullData.jarVOList;
    uploadFileBindingFullData.value = fullData.uploadFileBindingVOList || [];
  };

  const loadPublicCsvOptions = async () => {
    publicCsvLoading.value = true;
    try {
      const res = await getPublicCsvList({ page: 1, size: 100, fileType: 'csv' });
      if (res.data.code !== 0) {
        ElMessage.error(res.data.message || '公共参数文件获取失败');
        publicCsvOptions.value = [];
        return;
      }
      publicCsvOptions.value = res.data.data.list || [];
    } finally {
      publicCsvLoading.value = false;
    }
  };

  const openPublicCsvSelect = async () => {
    publicCsvSelectVisible.value = true;
    await loadPublicCsvOptions();
  };

  const loadPublicUploadFileOptions = async () => {
    publicUploadFileLoading.value = true;
    try {
      const res = await getPublicCsvList({ page: 1, size: 100 });
      if (res.data.code !== 0) {
        ElMessage.error(res.data.message || '公共文件获取失败');
        publicUploadFileOptions.value = [];
        return;
      }
      publicUploadFileOptions.value = res.data.data.list || [];
    } finally {
      publicUploadFileLoading.value = false;
    }
  };

  const openPublicUploadFileSelect = async () => {
    publicUploadFileSelectVisible.value = true;
    await loadPublicUploadFileOptions();
  };

  const handlePublicCsvBind = async (row: PublicCsvItem) => {
    const testCaseId = currentTestCaseId();
    const res = await addCsvBinding({
      testCaseId,
      filename: row.filename,
      distributionStrategy: 'shared'
    });
    if (res.data.code !== 0) {
      ElMessage.error(res.data.message || '绑定失败');
      return;
    }
    ElMessage.success('绑定成功');
    await getFullTestCase(testCaseId);
  };

  const handlePublicUploadFileBind = async (row: PublicCsvItem) => {
    const testCaseId = currentTestCaseId();
    const res = await addUploadFileBinding({
      testCaseId,
      filename: row.filename
    });
    if (res.data.code !== 0) {
      ElMessage.error(res.data.message || '绑定失败');
      return;
    }
    ElMessage.success('绑定成功');
    await getFullTestCase(testCaseId);
  };

  const handleCsvBindingDelete = async (id: number) => {
    await ElMessageBox.confirm('确定要解绑该公共参数文件吗？', '提示', { type: 'warning' });
    const res = await deleteCsvBinding(id);
    if (res.data.code !== 0) {
      ElMessage.error(res.data.message || '解绑失败');
      return;
    }
    ElMessage.success('解绑成功');
    await getFullTestCase(currentTestCaseId());
  };

  const handleUploadFileBindingDelete = async (id: number) => {
    await ElMessageBox.confirm('确定要解绑该公共上传文件吗？', '提示', { type: 'warning' });
    const res = await deleteUploadFileBinding(id);
    if (res.data.code !== 0) {
      ElMessage.error(res.data.message || '解绑失败');
      return;
    }
    ElMessage.success('解绑成功');
    await getFullTestCase(currentTestCaseId());
  };

  const handleCsvBindingStrategyChange = async (row: CsvBindingItem, value: string) => {
    const previous = row.distributionStrategy || 'shared';
    row.distributionStrategy = value;
    try {
      const res = await updateCsvBindingStrategy(row.id, value);
      if (res.data.code !== 0) {
        row.distributionStrategy = previous;
        ElMessage.error(res.data.message || '策略更新失败');
        return;
      }
      ElMessage.success('策略已更新');
    } catch {
      row.distributionStrategy = previous;
      ElMessage.error('策略更新失败，请重试');
    }
  };

  const handleJmxDelete = async (id: number) => {
    await ElMessageBox.confirm('确定要删除吗？', '提示', { type: 'warning' });
    const res = await deleteJmx(id);
    const code = res.data.code;
    if (code != 0) {
      ElMessage.error(res.data.message);
    } else {
      ElMessage.success('删除成功');
      await getFullTestCase(currentTestCaseId());
    }
  };

  const handleJarDelete = async (id: number) => {
    await ElMessageBox.confirm('确定要删除吗？', '提示', { type: 'warning' });
    const res = await deleteJar(id);
    const code = res.data.code;
    if (code != 0) {
      ElMessage.error(res.data.message);
    } else {
      ElMessage.success('删除成功');
      await getFullTestCase(currentTestCaseId());
    }
  };

  const handleJmxUpload = async (uploadRequestOptions: any) => {
    const testCaseId = currentTestCaseId();
    const formData = new FormData();
    formData.append('jmxFile', uploadRequestOptions.file);
    const res = await uploadJmx(testCaseId, formData);
    const code = res.data.code;
    if (code != 0) {
      ElMessage.error(res.data.message);
    } else {
      ElMessage.success('上传成功');
      await getFullTestCase(testCaseId);
    }
  };

  const handleJarUpload = async (uploadRequestOptions: any) => {
    const testCaseId = currentTestCaseId();
    const formData = new FormData();
    formData.append('jarFile', uploadRequestOptions.file);
    const res = await uploadJar(testCaseId, formData);
    const code = res.data.code;
    if (code != 0) {
      ElMessage.error(res.data.message);
    } else {
      ElMessage.success('上传成功');
      await getFullTestCase(testCaseId);
    }
  };

  const handleJmxDownload = async (id: number, jmxName: string) => {
    if (!jmxName) {
      ElMessage.error('jmx脚本文件不存在');
      return;
    }
    const res = await downloadJmx(id, jmxName);
    if (!res.success) {
      ElMessage.error('下载失败, 请重试');
    }
  };

  const handlePublicCsvDownload = async (filename: string) => {
    if (!filename) {
      ElMessage.error('csv数据文件不存在');
      return;
    }
    const res = await downloadPublicCsv(filename);
    if (!res.success) {
      ElMessage.error('下载失败, 请重试');
    }
  };

  const handleJarDownload = async (id: number, jarName: string) => {
    if (!jarName) {
      ElMessage.error('jar依赖文件不存在');
      return;
    }
    const res = await downloadJar(id, jarName);
    if (!res.success) {
      ElMessage.error('下载失败, 请重试');
    }
  };

  return {
    fullVisible,
    testCaseFullData,
    jmxFullData,
    csvBindingFullData,
    jarFullData,
    uploadFileBindingFullData,
    publicCsvSelectVisible,
    publicUploadFileSelectVisible,
    publicCsvLoading,
    publicUploadFileLoading,
    publicCsvOptions,
    publicUploadFileOptions,
    getFullTestCase,
    openPublicCsvSelect,
    openPublicUploadFileSelect,
    handlePublicCsvBind,
    handlePublicUploadFileBind,
    handleCsvBindingDelete,
    handleUploadFileBindingDelete,
    handleJmxDelete,
    handleJarDelete,
    handleJmxUpload,
    handleCsvBindingStrategyChange,
    handleJarUpload,
    handleJmxDownload,
    handlePublicCsvDownload,
    handleJarDownload
  };
};
