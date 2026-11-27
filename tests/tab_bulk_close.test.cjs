const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../core/chat_enhancer.js'), 'utf8');
const start = source.indexOf('  function initTabHeaderContextMenu() {');
const end = source.indexOf('  // =========================================================================', start);
assert.ok(start >= 0 && end > start);
const moduleSource = source.slice(start, end) + '\ninitTabHeaderContextMenu();';

function scenario(action, blocked = '') {
  const ids = ['file__file:///one.md', 'file__file:///two.pdf', 'file__file:///three.md', 'conversation__keep'];
  const tabs = ids.map(id => {
    const tab = {
      id,
      getAttribute: name => name === 'data-tab-id' ? id : null,
      querySelector: () => null,
      closest: () => tab,
      parentElement: {querySelector: () => ({click: () => {
        if (id !== blocked) tabs.splice(tabs.indexOf(tab), 1);
      }})}
    };
    return tab;
  });
  let handler;
  let menu;
  const context = {
    document: {
      querySelectorAll: () => tabs.slice(),
      addEventListener: (_type, callback) => { handler = callback; },
      removeEventListener: () => {}
    },
    window: {electronNative: {showContextMenu: items => { menu = items; return Promise.resolve(action); }}},
    ToolkitCore: {uriToWindowsPath: uri => uri, showToast: () => {}},
    navigator: {},
    setTimeout,
    Date,
    console
  };
  vm.runInNewContext(moduleSource, context);
  return {
    ids: () => tabs.map(tab => tab.id),
    menu: () => menu.map(item => item.id),
    open: index => handler({target: tabs[index], preventDefault() {}, stopPropagation() {}})
  };
}

test('close other file tabs keeps the context tab and conversation', async () => {
  const page = scenario('close-other-tabs');
  page.open(1);
  assert.ok(page.menu().includes('close-other-tabs'));
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.deepEqual(page.ids(), ['file__file:///two.pdf', 'conversation__keep']);
});

test('close right follows file tab order and leaves non-file tabs alone', async () => {
  const page = scenario('close-right-tabs');
  page.open(0);
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.deepEqual(page.ids(), ['file__file:///one.md', 'conversation__keep']);
});

test('close all file tabs leaves the conversation', async () => {
  const page = scenario('close-all-file-tabs');
  page.open(1);
  await new Promise(resolve => setTimeout(resolve, 120));
  assert.deepEqual(page.ids(), ['conversation__keep']);
});

test('bulk close stops when a native close leaves a tab open', async () => {
  const page = scenario('close-all-file-tabs', 'file__file:///two.pdf');
  page.open(0);
  await new Promise(resolve => setTimeout(resolve, 900));
  assert.deepEqual(page.ids(), ['file__file:///two.pdf', 'file__file:///three.md', 'conversation__keep']);
});
