export interface ThreadGroupSource {
  key?: string;
  name?: string;
  type?: string;
  enabled?: boolean;
}

export type ThreadGroupRunMode = 'global' | 'custom' | 'fixed';
export type QueuePolicy = 'fail_fast' | 'queue_when_no_slave';
export type ScheduleType = 'once' | 'daily' | 'weekly' | 'monthly';

export interface ThreadGroupRunConfigItem extends ThreadGroupSource {
  enabled: boolean;
  originalEnabled: boolean;
  mode: ThreadGroupRunMode;
  numThreads: string;
  rampTime: string;
  globalNumThreads: string;
  pacingMs: string;
}

export interface ThreadGroupOverridePayload {
  key?: string;
  name?: string;
  enabled: boolean;
  mode: ThreadGroupRunMode;
  numThreads: string;
  rampTime: string;
  pacingMs: number;
}

export interface TestcaseRunSource {
  id: number;
  numThreads?: string | null;
  rampTime?: string | null;
  duration?: string | null;
}

export interface BaseRunParamForm {
  taskName: string;
  numThreads: string;
  rampTime: string;
  duration: string;
  slaveCount: number;
  region: string;
  threadGroupOverrides: ThreadGroupRunConfigItem[];
}

export interface RunParamForm extends BaseRunParamForm {
  id: number | null;
  queuePolicy: QueuePolicy;
}

export interface ScheduleRunParamForm extends BaseRunParamForm {}

export interface ScheduleTaskForm {
  id?: number | null;
  testCaseId?: number | null;
  scheduleType: ScheduleType;
  onceDateTime: string;
  dailyTime: string;
  weeklyTime: string;
  daysOfWeek: number[];
  monthlyTime: string;
  dayOfMonth: number;
  runParam: ScheduleRunParamForm;
}

export type ScheduleData =
  | { time: string }
  | { time: string; daysOfWeek: number[] }
  | { time: string; dayOfMonth: number };

interface CreateThreadGroupRowsOptions {
  includeSavedWhenMissing?: boolean;
}

const rowKey = (item: { key?: string; name?: string }) => item.key || item.name || '';

export const createThreadGroupOverrideRows = (
  groups: ThreadGroupSource[],
  numThreads: string,
  rampTime: string,
  savedOverrides: Partial<ThreadGroupRunConfigItem>[] = [],
  options: CreateThreadGroupRowsOptions = {}
): ThreadGroupRunConfigItem[] => {
  const savedByKey = new Map<string, Partial<ThreadGroupRunConfigItem>>();
  savedOverrides.forEach((item) => {
    const key = rowKey(item);
    if (key) savedByKey.set(key, item);
  });

  const rows = (groups || []).map((item) => {
    const saved = savedByKey.get(rowKey(item)) || {};
    const enabled = saved.enabled ?? item.enabled ?? true;
    return {
      key: item.key,
      name: item.name,
      type: item.type,
      enabled,
      originalEnabled: item.enabled ?? enabled,
      mode: saved.mode || 'global',
      numThreads: saved.numThreads || numThreads,
      rampTime: saved.rampTime || rampTime,
      globalNumThreads: numThreads,
      pacingMs: String(saved.pacingMs ?? 0)
    };
  });

  if (rows.length > 0 || savedOverrides.length === 0 || !options.includeSavedWhenMissing) {
    return rows;
  }

  return savedOverrides.map((item) => {
    const enabled = item.enabled ?? true;
    return {
      key: item.key,
      name: item.name,
      type: item.type || 'thread_group',
      enabled,
      originalEnabled: enabled,
      mode: item.mode || 'global',
      numThreads: item.numThreads || numThreads,
      rampTime: item.rampTime || rampTime,
      globalNumThreads: numThreads,
      pacingMs: String(item.pacingMs ?? 0)
    };
  });
};

export const findInvalidThreadGroupPacing = (
  items: ThreadGroupRunConfigItem[]
): ThreadGroupRunConfigItem | undefined => {
  return (items || []).find((item) => {
    const pacing = Number(item.pacingMs);
    return item.enabled && (!Number.isFinite(pacing) || pacing < 0);
  });
};

export const buildThreadGroupOverridePayload = (
  items: ThreadGroupRunConfigItem[]
): ThreadGroupOverridePayload[] => {
  return (items || [])
    .filter((item) => item.enabled !== item.originalEnabled || (item.mode && item.mode !== 'global') || Number(item.pacingMs || 0) > 0)
    .map((item) => ({
      key: item.key,
      name: item.name,
      enabled: item.enabled,
      mode: item.mode,
      numThreads: item.numThreads,
      rampTime: item.rampTime,
      pacingMs: Number(item.pacingMs || 0)
    }));
};
