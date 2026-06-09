import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getFull } from '../api/testcase';
import { deleteCsv, uploadCsv, downloadCsv, updateCsvStrategy } from '../api/csv';
import { deleteJmx, uploadJmx, downloadJmx } from '../api/jmx';
import { deleteJar, uploadJar, downloadJar } from '../api/jar';
import { deleteUploadFile, uploadUploadFile, downloadUploadFile } from '../api/uploadFile';
import type { CsvItem, JarItem, JmxItem, UploadFileItem } from '../common/item';

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
  csvItemList: CsvItem[];
  jarItemList: JarItem[];
  uploadFileItemList: UploadFileItem[];
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
    csvItemList: [],
    jarItemList: [],
    uploadFileItemList: []
  });
  const jmxFullData = ref<JmxItem[]>([]);
  const csvFullData = ref<CsvItem[]>([]);
  const jarFullData = ref<JarItem[]>([]);
  const uploadFileFullData = ref<UploadFileItem[]>([]);

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
    csvFullData.value = fullData.csvVOList;
    jarFullData.value = fullData.jarVOList;
    uploadFileFullData.value = fullData.uploadFileVOList || [];
  };

  const currentTestCaseId = () => Number(testCaseFullData.value.id || 0);

  const handleCsvDelete = async (id: number) => {
    await ElMessageBox.confirm('确定要删除吗？', '提示', { type: 'warning' });
    const res = await deleteCsv(id);
    const code = res.data.code;
    if (code != 0) {
      ElMessage.error(res.data.message);
    } else {
      ElMessage.success('删除成功');
      await getFullTestCase(currentTestCaseId());
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

  const handleUploadFileDelete = async (id: number) => {
    await ElMessageBox.confirm('确定要删除吗？', '提示', { type: 'warning' });
    const res = await deleteUploadFile(id);
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

  const handleCsvUpload = async (uploadRequestOptions: any) => {
    const testCaseId = currentTestCaseId();
    const formData = new FormData();
    formData.append('csvFile', uploadRequestOptions.file);
    const res = await uploadCsv(testCaseId, formData);
    const code = res.data.code;
    if (code != 0) {
      if (code === 1015) {
        ElMessage.warning(res.data.message);
      } else {
        ElMessage.error(res.data.message);
      }
    } else {
      ElMessage.success('上传成功');
      await getFullTestCase(testCaseId);
    }
  };

  const handleCsvStrategyChange = async (row: CsvItem, value: string) => {
    const previous = row.distributionStrategy || 'shared';
    row.distributionStrategy = value;
    try {
      const res = await updateCsvStrategy(row.id, value);
      const code = res.data.code;
      if (code != 0) {
        row.distributionStrategy = previous;
        ElMessage.error(res.data.message);
        return;
      }
      ElMessage.success('策略已更新');
    } catch {
      row.distributionStrategy = previous;
      ElMessage.error('策略更新失败，请重试');
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

  const handleUploadFileUpload = async (uploadRequestOptions: any) => {
    const testCaseId = currentTestCaseId();
    const formData = new FormData();
    formData.append('uploadFile', uploadRequestOptions.file);
    const res = await uploadUploadFile(testCaseId, formData);
    const code = res.data.code;
    if (code != 0) {
      if (res.data.message && res.data.message.includes('未引用上传文件')) {
        ElMessage.warning(res.data.message);
      } else {
        ElMessage.error(res.data.message);
      }
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

  const handleCsvDownload = async (id: number, csvName: string) => {
    if (!csvName) {
      ElMessage.error('csv数据文件不存在');
      return;
    }
    const res = await downloadCsv(id, csvName);
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

  const handleUploadFileDownload = async (id: number, fileName: string) => {
    if (!fileName) {
      ElMessage.error('上传接口文件不存在');
      return;
    }
    const res = await downloadUploadFile(id, fileName);
    if (!res.success) {
      ElMessage.error('下载失败, 请重试');
    }
  };

  return {
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
  };
};
