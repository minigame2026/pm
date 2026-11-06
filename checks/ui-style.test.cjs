const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const cfg = require('../tools/workflow.config.json');
const ts = require(cfg.typescript.replace(/tsc\.js$/, 'typescript.js'));
class Color {
  static fromHEX(out, value) {
    const hex = value.slice(1);
    out.r = parseInt(hex.slice(0, 2), 16);
    out.g = parseInt(hex.slice(2, 4), 16);
    out.b = parseInt(hex.slice(4, 6), 16);
    return out;
  }
}
class Graphics {
  clear() { this.paint = []; this.path = []; this.lineWidth = 1; }
  roundRect(x, y, w, h, r) { this.path.push({ x, y, w, h, r }); }
  moveTo(x, y) { this.path.push({ x, y, w: 0, h: 0 }); }
  lineTo(x, y) { this.path.push({ x, y, w: 0, h: 0 }); }
  fill() { this.paint.push({ kind: 'fill', color: this.fillColor, path: this.path }); this.path = []; }
  stroke() { this.paint.push({ kind: 'stroke', color: this.strokeColor, path: this.path, lineWidth: this.lineWidth }); this.path = []; }
}
const moduleExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMUIStyle.ts', 'utf8'), {
  compilerOptions: { module: 1, target: 4 }
}).outputText, { exports: moduleExports, require: name => { assert.equal(name, 'cc'); return { Color, Graphics }; } });
const { uiMotion, drawButtonSurface, drawPanelSurface } = moduleExports;
const mini = uiMotion(false), native = uiMotion(true);
assert(mini.pressScale > native.pressScale && mini.release < native.release);
assert.equal(mini.travel, 0);
assert.equal(mini.overshoot, 1);
assert(native.travel > 0 && native.overshoot > 1 && native.overshoot < 1.02);
for (const app of [false, true]) {
  const reduced = uiMotion(app, true);
  for (const key of ['pressIn', 'release', 'commit', 'enter', 'travel']) assert.equal(reduced[key], 0, key);
  for (const key of ['pressScale', 'overshoot']) assert.equal(reduced[key], 1, key);
}
mini.pressScale = .1;
assert(uiMotion(false).pressScale > .9, 'motion settings are not shared mutable state');

function assertBounds(g, w, h) {
  for (const paint of g.paint) for (const p of paint.path) {
    const edge = (paint.lineWidth || 0) / 2;
    assert(p.x - edge >= -w / 2 - 2 && p.x + p.w + edge <= w / 2 + 2);
    assert(p.y - edge >= -h / 2 - 2 && p.y + p.h + edge <= h / 2 + 2);
    assert(p.w >= 0 && p.h >= 0);
  }
}
for (const [w, h] of [[24, 24], [50, 44], [112, 48], [350, 48]]) {
  for (const fill of ['#168cdd', '#f99b28', '#38b98c', '#f7fcff', '#c9d8e2']) {
    for (const enabled of [false, true]) {
      const g = new Graphics();
      drawButtonSurface(g, w, h, fill, enabled);
      const expected = new Color(); Color.fromHEX(expected, fill); expected.a = 255;
      assert.deepEqual(g.paint[1].color, expected, 'main fill remains exact');
      assertBounds(g, w, h);
      const count = g.paint.length;
      drawButtonSurface(g, w, h, fill, enabled);
      assert.equal(g.paint.length, count, 'repainting does not accumulate geometry');
    }
  }
}
for (const [w, h, r, alpha] of [[354, 150, 18, 0], [354, 150, 18, 246], [354, 150, 2, 255], [80, 100, 12, 255], [120, 24, 12, 255], [390, 844, 18, 255]]) {
  const g = new Graphics(); drawPanelSurface(g, w, h, '#fff1d6', r, alpha);
  assert.equal(g.paint.length, 1, 'non-card surfaces stay flat');
  assert.equal(g.paint[0].color.a, alpha);
}
const card = new Graphics(); drawPanelSurface(card, 354, 150, '#ffffff', 18, 255);
assert(card.paint.length > 1);
assertBounds(card, 354, 150);
console.log('PASS UI motion: native/mini profiles, reduced motion, fresh values; UI surfaces: exact fills, bounded geometry, stable repaint, flat HUDs and backgrounds.');
