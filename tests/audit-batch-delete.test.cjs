const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { parse, compileScript } = require('@vue/compiler-sfc');
const ts = require('typescript');
const vue = require('vue');

const source = fs.readFileSync(require.resolve('../src/views/audit.vue'), 'utf8');
const { descriptor } = parse(source);
const compiled = ts.transpileModule(compileScript(descriptor, { id: 'audit-batch-test' }).content, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const response = (data) => ({ data: { code: 0, message: 'success', data } });
const row = (id) => ({ id, username: 'operator', action: 'CREATE', resourceType: 'testcase' });
const tick = async () => { await Promise.resolve(); await vue.nextTick(); await Promise.resolve(); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function mount(options = {}) {
  const messages = [];
  const showMessage = (options) => messages.push(options.message);
  Object.assign(showMessage, {
    error: (message) => messages.push(message), success: (message) => messages.push(message),
  });
  const api = { getAuditLogList: async () => response({ list: [], total: 0 }), ...options.api };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: (name) => {
      if (name === 'vue') return vue;
      if (name === '../api/audit') return api;
      if (name === 'element-plus') return {
        ElMessage: showMessage, ElMessageBox: { confirm: options.confirm || (async () => {}) },
      };
      if (name === '../common/push') return { checkToLogin() {} };
      return {};
    },
  });
  let state;
  const renderer = vue.createRenderer({
    createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
    insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
    parentNode: () => null, nextSibling: () => null,
  });
  const app = renderer.createApp({
    setup(props, context) { state = module.exports.default.setup(props, context); return () => null; },
  });
  app.mount({});
  return { state, messages, unmount: () => app.unmount() };
}

test('selection is restricted to unique logs on the current page', async (t) => {
  const view = mount();
  t.after(view.unmount);
  await tick();
  view.state.auditData.value = [row(1), row(2)];
  view.state.handleSelectionChange([row(1), row(2), row(1), row(99)]);
  assert.deepEqual(Array.from(view.state.selectedLogs.value, row => row.id), [1, 2]);
});

test('conditional delete button is in search toolbar with audit permission', () => {
  const { baseParse } = require('@vue/compiler-dom');
  const find = (node, predicate) => {
    if (predicate(node)) return node;
    for (const child of node.children || []) {
      const result = find(child, predicate);
      if (result) return result;
    }
  };
  const ast = baseParse(descriptor.template.content);
  const toolbar = find(ast, node => node.props?.some(prop => prop.name === 'class' && prop.value?.content === 'handle-box'));
  const button = toolbar.children.find(node => node.tag === 'el-button' && node.props?.some(prop => prop.name === 'on' && prop.exp?.content === 'handleBatchDelete'));
  assert.ok(button);
  assert.ok(button.props.some(prop => prop.name === 'if' && prop.exp.content === 'selectedLogs.length > 0'));
  assert.ok(button.props.some(prop => prop.name === 'permiss' && prop.exp.content === "'audit'"));
  assert.equal(button.children.map(node => node.content || '').join('').trim(), '删除');
  assert.ok(find(ast, node => node.tag === 'el-table-column' && node.props?.some(prop => prop.name === 'type' && prop.value?.content === 'selection')));
});

test('no selection sends no request or confirmation', async (t) => {
  let calls = 0;
  const view = mount({ confirm: async () => { calls++; }, api: { cleanAuditLogs: async () => { calls++; } } });
  t.after(view.unmount);
  await tick();
  await view.state.handleBatchDelete();
  assert.equal(calls, 0);
});

test('cancel preserves selection and never deletes', async (t) => {
  let calls = 0;
  const view = mount({ confirm: async () => { throw 'cancel'; }, api: { cleanAuditLogs: async () => { calls++; } } });
  t.after(view.unmount);
  await tick();
  view.state.selectedLogs.value = [row(1)];
  await view.state.handleBatchDelete();
  assert.equal(calls, 0);
  assert.equal(view.state.selectedLogs.value.length, 1);
  assert.equal(view.state.deleting.value, false);
});

test('confirmed deletion sends selected IDs, warns about permanence and refreshes', async (t) => {
  const calls = [];
  let confirmation, lists = 0;
  const view = mount({
    confirm: async (message) => { confirmation = message; },
    api: {
      getAuditLogList: async () => { lists++; return response({ list: [], total: 0 }); },
      cleanAuditLogs: async (ids) => { calls.push(Array.from(ids)); return response({ deletedIds: [1, 2], failures: [], successCount: 2, failedCount: 0 }); },
    },
  });
  t.after(view.unmount);
  await tick();
  view.state.selectedLogs.value = [row(1), row(2)];
  await view.state.handleBatchDelete();
  assert.deepEqual(calls, [[1, 2]]);
  assert.ok(confirmation.includes('2') && confirmation.includes('不可恢复'));
  assert.equal(lists, 2);
  assert.equal(view.state.selectedLogs.value.length, 0);
  assert.ok(view.messages.some(message => message.includes('成功 2')));
});

test('partial failure displays IDs and reasons as plain text', async (t) => {
  const view = mount({ api: { cleanAuditLogs: async () => response({ deletedIds: [1], failures: [{ id: 2, message: '不存在' }], successCount: 1, failedCount: 1 }) } });
  t.after(view.unmount);
  await tick();
  view.state.selectedLogs.value = [row(1), row(2)];
  await view.state.handleBatchDelete();
  assert.ok(view.messages.some(message => message.includes('成功 1') && message.includes('失败 1') && message.includes('#2') && message.includes('不存在')));
  assert.equal(view.state.selectedLogs.value.length, 0);
});

test('confirmation and submission both block duplicates', async (t) => {
  const confirm = deferred(), deletion = deferred();
  let calls = 0, confirmations = 0;
  const view = mount({ confirm: () => { confirmations++; return confirm.promise; }, api: { cleanAuditLogs: () => { calls++; return deletion.promise; } } });
  t.after(view.unmount);
  await tick();
  view.state.selectedLogs.value = [row(1)];
  const pending = view.state.handleBatchDelete();
  await view.state.handleBatchDelete();
  assert.equal(confirmations, 1);
  assert.equal(calls, 0);
  confirm.resolve();
  await tick();
  await view.state.handleBatchDelete();
  assert.equal(calls, 1);
  deletion.resolve(response({ deletedIds: [1], failures: [], successCount: 1, failedCount: 0 }));
  await pending;
  assert.equal(view.state.deleting.value, false);
});

for (const failure of ['network', 'business']) {
  test(`${failure} failure preserves selection and never claims success`, async (t) => {
    const view = mount({ api: { cleanAuditLogs: async () => {
      if (failure === 'network') throw new Error('network');
      return { data: { code: 1, message: '删除失败', data: null } };
    } } });
    t.after(view.unmount);
    await tick();
    view.state.selectedLogs.value = [row(1)];
    await view.state.handleBatchDelete();
    assert.equal(view.state.selectedLogs.value.length, 1);
    assert.equal(view.state.deleting.value, false);
    assert.ok(view.messages.some(message => message.includes('失败')));
    assert.ok(view.messages.every(message => !message.includes('成功')));
  });
}

test('refresh clears selection and retreats to a valid page', async (t) => {
  const pages = [];
  const view = mount({ api: { getAuditLogList: async (query) => {
    pages.push(query.page);
    return response({ list: query.page === 1 ? [row(1)] : [], total: 1 });
  } } });
  t.after(view.unmount);
  await tick();
  let cleared = 0;
  view.state.multipleTable.value = { clearSelection: () => { cleared++; } };
  view.state.selectedLogs.value = [row(99)];
  view.state.query.page = 2;
  await view.state.getList();
  assert.equal(view.state.query.page, 1);
  assert.equal(view.state.auditData.value[0].id, 1);
  assert.equal(view.state.total.value, 1);
  assert.equal(view.state.selectedLogs.value.length, 0);
  assert.ok(cleared >= 1);
  assert.deepEqual(pages, [1, 2, 1]);
});

test('reset clears filters, selection and page', async (t) => {
  const view = mount();
  t.after(view.unmount);
  await tick();
  Object.assign(view.state.query, { page: 3, username: 'a', action: 'DELETE', resourceType: 'audit' });
  view.state.selectedLogs.value = [row(1)];
  view.state.handleReset();
  assert.equal(view.state.query.page, 1);
  assert.equal(view.state.query.username, null);
  assert.equal(view.state.query.resourceType, null);
  assert.equal(view.state.selectedLogs.value.length, 0);
  await tick();
  assert.equal(view.state.total.value, 0);
});

test('late prior-page response cannot replace current data or clear loading', async (t) => {
  const first = deferred(), second = deferred();
  let calls = 0;
  const view = mount({ api: { getAuditLogList: () => ++calls === 1 ? first.promise : second.promise } });
  t.after(view.unmount);
  view.state.query.page = 2;
  const pending = view.state.getList();
  first.resolve(response({ list: [row(1)], total: 11 }));
  await tick();
  assert.equal(view.state.loading.value, true);
  second.resolve(response({ list: [row(11)], total: 11 }));
  await pending;
  assert.equal(view.state.auditData.value[0].id, 11);
  assert.equal(view.state.query.page, 2);
  assert.equal(view.state.loading.value, false);
});

test('list network failure is caught and loading is released', async (t) => {
  const view = mount({ api: { getAuditLogList: async () => { throw new Error('network'); } } });
  t.after(view.unmount);
  await tick();
  assert.equal(view.state.loading.value, false);
  assert.ok(view.messages.some(message => message.includes('失败')));
});

test('audit API uses the batch POST endpoint with JSON IDs', () => {
  const script = fs.readFileSync(require.resolve('../src/api/audit.ts'), 'utf8');
  const js = ts.transpileModule(script, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} }, calls = [];
  vm.runInNewContext(js, { module, exports: module.exports, require: () => ({ default: (options) => { calls.push(options); } }) });
  module.exports.cleanAuditLogs([1, 2]);
  assert.equal(calls[0].url, '/audit/cleanBatch');
  assert.equal(calls[0].method, 'post');
  assert.deepEqual(Array.from(calls[0].data.ids), [1, 2]);
});
