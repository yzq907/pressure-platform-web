const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { parse, compileScript } = require('@vue/compiler-sfc');
const ts = require('typescript');
const vue = require('vue');

// Compile the real SFC setup; stub only HTTP, navigation and unrelated UI imports.
const source = fs.readFileSync(require.resolve('../src/views/report.vue'), 'utf8');
const { descriptor } = parse(source);
const compiled = ts.transpileModule(compileScript(descriptor, { id: 'report-detail-test' }).content, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const response = (data) => ({ data: { code: 0, message: 'success', data } });
const samples = (total) => response({ reportId: 1, total, groups: { HTTP: total }, list: [] });
const report = (id, status = 2) => ({ id, name: `报告${id}`, status });
const tick = async () => { await Promise.resolve(); await vue.nextTick(); await Promise.resolve(); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function mount(getErrorSamples, options = {}) {
  const messages = [];
  const showMessage = (options) => messages.push(options.message);
  Object.assign(showMessage, {
    error: (msg) => messages.push(msg), success: (msg) => messages.push(msg),
    warning: (msg) => messages.push(msg),
  });
  const api = {
    getReportList: async () => response({ list: [], total: 0 }),
    getMetrics: async () => response([{ qps: 1 }]),
    getResourceTargets: async () => response([]),
    getTransactionStats: async () => response([{ samples: 1 }]),
    getErrorSamples,
    ...options.api,
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: (name) => {
      if (name === 'vue') return vue;
      if (name === '../api/report') return api;
      if (name === 'element-plus') return {
        ElMessage: showMessage,
        ElMessageBox: { confirm: options.confirm || (async () => {}) },
      };
      if (name === 'vue-router') return { useRoute: () => ({ query: {}, path: '/report' }) };
      if (name === '../common/push') return { checkToLogin() {} };
      return {};
    },
    setTimeout,
  });
  const component = module.exports.default;
  let state;
  const renderer = vue.createRenderer({
    createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
    insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
    parentNode: () => null, nextSibling: () => null,
  });
  const app = renderer.createApp({
    setup(props, context) {
      state = component.setup(props, context);
      return () => null;
    },
  });
  app.mount({});
  return { state, messages, unmount: () => app.unmount() };
}

test('opening overview loads error count without selecting errors tab', async (t) => {
  const view = mount(async () => samples(17));
  t.after(view.unmount);
  await view.state.openReportDetail(report(1));
  await tick();
  assert.equal(view.state.detailTab.value, 'overview');
  assert.equal(view.state.errorSamplesTotal.value, 17);
});

test('pending initial request does not display a false zero', async (t) => {
  const pending = deferred();
  const view = mount(() => pending.promise);
  t.after(view.unmount);
  const opening = view.state.openReportDetail(report(1));
  assert.equal(view.state.errorSamplesTotal.value, null);
  assert.equal(view.state.errorSamplesLoading.value, true);
  pending.resolve(samples(0));
  await opening;
  await tick();
  assert.equal(view.state.errorSamplesTotal.value, 0);
});

test('cached overview still restores error count on reopening', async (t) => {
  const view = mount(async () => samples(8));
  t.after(view.unmount);
  await view.state.openReportDetail(report(1));
  await tick();
  await view.state.openReportDetail(report(1));
  await tick();
  assert.equal(view.state.errorSamplesTotal.value, 8);
});

test('overview cache hit still fetches uncached samples after an initial zero', async (t) => {
  let total = 0;
  const view = mount(async () => samples(total));
  t.after(view.unmount);
  await view.state.openReportDetail(report(1));
  await tick();
  assert.equal(view.state.overviewCache.has(1), true);
  assert.equal(view.state.errorSamplesCache.has(1), false);
  total = 7;
  await view.state.openReportDetail(report(1));
  await tick();
  assert.equal(view.state.errorSamplesTotal.value, 7);
});

test('selecting errors during preload does not duplicate the request', async (t) => {
  const pending = deferred();
  let calls = 0;
  const view = mount(() => { calls++; return pending.promise; });
  t.after(view.unmount);
  const opening = view.state.openReportDetail(report(1));
  assert.equal(calls, 1);
  view.state.detailTab.value = 'errors';
  await tick();
  assert.equal(calls, 1);
  pending.resolve(samples(4));
  await opening;
  await tick();
  assert.equal(view.state.errorSamplesTotal.value, 4);
});

for (const outcome of ['success', 'failure']) {
  test(`old report ${outcome} cannot overwrite newer report or clear its loading state`, async (t) => {
    const first = deferred(), second = deferred();
    const view = mount((id) => id === 1 ? first.promise : second.promise);
    t.after(view.unmount);
    const a = view.state.openReportDetail(report(1));
    const b = view.state.openReportDetail(report(2));
    assert.equal(view.state.errorSamplesLoading.value, true);
    if (outcome === 'success') first.resolve(samples(50));
    else first.reject(new Error('old network failure'));
    await a;
    await tick();
    assert.equal(view.state.errorSamplesLoading.value, true);
    assert.equal(view.messages.length, 0);
    second.resolve(samples(6));
    await b;
    await tick();
    assert.equal(view.state.errorSamplesTotal.value, 6);
    assert.equal(view.state.errorSamplesLoading.value, false);
  });
}

test('request failure leaves count unknown instead of claiming zero errors', async (t) => {
  const view = mount(async () => { throw new Error('network failure'); });
  t.after(view.unmount);
  await view.state.openReportDetail(report(1));
  await tick();
  assert.equal(view.state.errorSamplesTotal.value, null);
  assert.equal(view.messages.length, 1);
});

test('running report reloads error count when reopened', async (t) => {
  let total = 2;
  const view = mount(async () => samples(total));
  t.after(view.unmount);
  await view.state.openReportDetail(report(1, 1));
  await tick();
  total = 9;
  await view.state.openReportDetail(report(1, 1));
  await tick();
  assert.equal(view.state.errorSamplesTotal.value, 9);
});

test('reopening the same report ignores a late previous response', async (t) => {
  const first = deferred(), second = deferred();
  let calls = 0;
  const view = mount(() => (++calls === 1 ? first.promise : second.promise));
  t.after(view.unmount);
  const a = view.state.openReportDetail(report(1));
  const b = view.state.openReportDetail(report(1));
  second.resolve(samples(12));
  await b;
  await tick();
  first.resolve(samples(3));
  await a;
  await tick();
  assert.equal(view.state.errorSamplesTotal.value, 12);
  assert.equal(view.state.errorSamplesCache.get(1).total, 12);
});

test('API error can be retried by selecting the errors tab', async (t) => {
  let calls = 0;
  const view = mount(async () => ++calls === 1
    ? { data: { code: 1, message: '读取失败', data: null } }
    : samples(5));
  t.after(view.unmount);
  await view.state.openReportDetail(report(1));
  await tick();
  assert.equal(view.state.errorSamplesTotal.value, null);
  assert.equal(view.messages.length, 1);
  view.state.detailTab.value = 'errors';
  await tick();
  assert.equal(view.state.errorSamplesTotal.value, 5);
});

test('batch selection includes only deletable reports on the current page', async (t) => {
  const view = mount();
  t.after(view.unmount);
  await tick();
  view.state.reportData.value = [report(1), report(2, 1), report(3, 4), report(4, 5), report(5, 99)];
  view.state.handleSelectionChange([report(1), report(2, 1), report(3, 4), report(4, 5), report(5, 99), report(999)]);
  assert.deepEqual(Array.from(view.state.selectedReports.value, row => row.id), [1]);
  assert.equal(view.state.isReportDeletable(report(2, 1)), false);
  assert.equal(view.state.isReportDeletable(report(1)), true);
});

test('delete button is conditional and in the search toolbar', () => {
  const { baseParse } = require('@vue/compiler-dom');
  const ast = baseParse(descriptor.template.content);
  const find = (node, predicate) => {
    if (predicate(node)) return node;
    for (const child of node.children || []) {
      const result = find(child, predicate);
      if (result) return result;
    }
  };
  const toolbar = find(ast, node => node.props?.some(prop => prop.name === 'class' && prop.value?.content === 'handle-box'));
  const button = toolbar.children.find(node => node.tag === 'el-button' && node.props?.some(prop => prop.name === 'on' && prop.exp?.content === 'handleBatchDelete'));
  assert.ok(button, 'batch delete button must be in the search toolbar');
  assert.ok(button.props.some(prop => prop.name === 'if' && prop.exp.content === 'selectedReports.length > 0'));
  assert.equal(button.children.map(node => node.content || '').join('').trim(), '删除');
});

test('cancelled confirmation never sends a delete request', async (t) => {
  let calls = 0;
  const view = mount(undefined, {
    confirm: async () => { throw 'cancel'; },
    api: { cleanReports: async () => { calls++; } },
  });
  t.after(view.unmount);
  await tick();
  view.state.selectedReports.value = [report(1)];
  await view.state.handleBatchDelete();
  assert.equal(calls, 0);
  assert.equal(view.state.deleting.value, false);
  assert.equal(view.state.selectedReports.value.length, 1);
});

test('partial deletion reports failures and clears only deleted report caches', async (t) => {
  const calls = [];
  const view = mount(undefined, {
    api: { cleanReports: async (ids) => {
      calls.push(Array.from(ids));
      return response({ deletedIds: [1], failures: [{ id: 2, message: '正在执行，不能删除' }], successCount: 1, failedCount: 1 });
    } },
  });
  t.after(view.unmount);
  await tick();
  view.state.selectedReports.value = [report(1), report(2)];
  view.state.overviewCache.set(1, {});
  view.state.overviewCache.set(2, {});
  view.state.detailReport.value = report(1);
  view.state.detailVisible.value = true;
  await view.state.handleBatchDelete();
  assert.deepEqual(calls, [[1, 2]]);
  assert.equal(view.state.overviewCache.has(1), false);
  assert.equal(view.state.overviewCache.has(2), true);
  assert.equal(view.state.detailVisible.value, false);
  assert.equal(view.state.selectedReports.value.length, 0);
  assert.ok(view.messages.some(msg => msg.includes('成功 1') && msg.includes('失败 1') && msg.includes('#2')));
});

test('deleting blocks duplicate submissions and clears busy state afterwards', async (t) => {
  const pending = deferred();
  let calls = 0;
  const view = mount(undefined, { api: { cleanReports: () => { calls++; return pending.promise; } } });
  t.after(view.unmount);
  await tick();
  view.state.selectedReports.value = [report(1)];
  const deleting = view.state.handleBatchDelete();
  await tick();
  assert.equal(view.state.deleting.value, true);
  await view.state.handleBatchDelete();
  assert.equal(calls, 1);
  pending.resolve(response({ deletedIds: [1], failures: [], successCount: 1, failedCount: 0 }));
  await deleting;
  assert.equal(view.state.deleting.value, false);
});

test('delete network failure keeps selection and never claims success', async (t) => {
  const view = mount(undefined, { api: { cleanReports: async () => { throw new Error('network'); } } });
  t.after(view.unmount);
  await tick();
  view.state.selectedReports.value = [report(1)];
  await view.state.handleBatchDelete();
  assert.equal(view.state.selectedReports.value.length, 1);
  assert.equal(view.state.deleting.value, false);
  assert.ok(view.messages.some(msg => msg.includes('失败')));
  assert.ok(view.messages.every(msg => !msg.includes('成功')));
});

test('page refresh clears selection and retreats when the last page disappears', async (t) => {
  const pages = [];
  const view = mount(undefined, { api: { getReportList: async (query) => {
    pages.push(query.page);
    return response({ list: query.page === 1 ? [report(1)] : [], total: 1 });
  } } });
  t.after(view.unmount);
  await tick();
  view.state.selectedReports.value = [report(99)];
  view.state.query.page = 2;
  await view.state.getList();
  assert.equal(view.state.query.page, 1);
  assert.equal(view.state.total.value, 1);
  assert.equal(view.state.reportData.value[0].id, 1);
  assert.equal(view.state.selectedReports.value.length, 0);
  assert.deepEqual(pages, [1, 2, 1]);
});

test('empty report list displays a true zero total', async (t) => {
  const view = mount();
  t.after(view.unmount);
  await tick();
  assert.equal(view.state.total.value, 0);
});

test('late previous-page response cannot replace the current page', async (t) => {
  const pending = deferred();
  let calls = 0;
  const view = mount(undefined, { api: { getReportList: async () => ++calls === 1
    ? pending.promise
    : response({ list: [report(11)], total: 11 }) } });
  t.after(view.unmount);
  view.state.query.page = 2;
  await view.state.getList();
  pending.resolve(response({ list: [report(1)], total: 11 }));
  await tick();
  assert.equal(view.state.query.page, 2);
  assert.equal(view.state.reportData.value[0].id, 11);
});

test('single delete is blocked while a batch operation is pending', async (t) => {
  let calls = 0;
  const view = mount(undefined, { api: { cleanReport: async () => { calls++; return response(true); } } });
  t.after(view.unmount);
  await tick();
  view.state.deleting.value = true;
  await view.state.handleDelete(1);
  assert.equal(calls, 0);
});
