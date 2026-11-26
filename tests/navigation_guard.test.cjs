const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const test = require('node:test');
const {attach} = require('../core/startup_recovery.cjs');

function windowAt(initialUrl) {
  const win = new EventEmitter();
  const contents = new EventEmitter();
  let url = initialUrl;
  contents.getURL = () => url;
  contents.loadURL = async next => { url = next; };
  win.webContents = contents;
  win.isDestroyed = () => false;
  return {win, contents, getURL: () => url};
}

test('external Markdown link opens in the browser and leaves the local document visible', async () => {
  const page = windowAt('https://127.0.0.1:51315/artifact/readme.md');
  const opened = [];
  attach(page.win, {openExternal: url => opened.push(url)});
  let prevented = false;
  page.contents.emit('will-navigate', {preventDefault: () => { prevented = true; }}, 'https://example.org/paper');
  await Promise.resolve();
  assert.equal(prevented, true);
  assert.deepEqual(opened, ['https://example.org/paper']);
  assert.equal(page.getURL(), 'https://127.0.0.1:51315/artifact/readme.md');
});

test('local routes and unrelated windows retain their navigation behavior', async () => {
  const opened = [];
  for (const [source, target] of [
    ['https://127.0.0.1:51315/artifact/readme.md', 'https://127.0.0.1:51315/artifact/next.md'],
    ['https://127.0.0.1:51315/artifact/readme.md', 'file:///tmp/next.md'],
    ['https://example.org/', 'https://another.example/']
  ]) {
    const page = windowAt(source);
    attach(page.win, {openExternal: url => opened.push(url)});
    let prevented = false;
    page.contents.emit('will-navigate', {preventDefault: () => { prevented = true; }}, target);
    assert.equal(prevented, false, target);
  }
  await Promise.resolve();
  assert.deepEqual(opened, []);
});
