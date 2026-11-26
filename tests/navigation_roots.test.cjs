const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const test = require('node:test');
const {listNavigationRoots, searchNavigationFiles} = require('../plugin/runtime/navigation.cjs');

test('lists every registered project folder, including gitFolder resources', async t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'agcf-nav-'));
  t.after(() => fs.rmSync(home, {recursive: true, force: true}));
  const configs = path.join(home, '.gemini', 'config', 'projects');
  const first = path.join(home, 'Project A');
  const second = path.join(home, 'Project B');
  fs.mkdirSync(configs, {recursive: true});
  fs.mkdirSync(first);
  fs.mkdirSync(second);
  fs.writeFileSync(path.join(configs, 'project-a.json'), JSON.stringify({name: '研究项目', projectResources: {resources: [
    {gitFolder: {folderUri: pathToFileURL(first).href}},
    {folderUri: pathToFileURL(second).href}
  ]}}));
  const result = listNavigationRoots(home);
  assert.equal(result.projects.length, 1);
  assert.deepEqual(result.projects[0].folders.map(folder => folder.path), [first, second]);
  fs.writeFileSync(path.join(second, 'paper.pdf'), 'test');
  const found = await searchNavigationFiles('paper', [{path: first}, {path: second}]);
  assert.equal(found.items.length, 1);
  assert.equal(found.items[0].path, path.join(second, 'paper.pdf'));
});
