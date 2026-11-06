/* Cosmetic UI regression in disposable browser contexts; nativeApp only simulates presentation. */
const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict');
const cfg = require('../tools/workflow.config.json'), { chromium } = require(cfg.playwright);
const ts = require(cfg.typescript.replace(/tsc\.js$/, 'typescript.js')), M = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('assets/scripts/PMModel.ts', 'utf8'), {
  compilerOptions: { module: 1, target: 4 },
}).outputText, { exports: M, Math, Date, JSON, Set, Map });
const now = Date.now(), out = 'checks/ui-polish';
fs.mkdirSync(out, { recursive: true });
M.setTimeProvider(() => now);
let base = M.fresh(91, ['fox', 'bud', 'otter']);
base.journey = { version: 1, stage: 'done', hero: 'ranger', starter: 'fox', legacy: true };
base.expedition = false;
base.clearedMaps = [0, 1, 2];
base = M.syncStamina(base, now);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true }), results = [];
  try {
    for (const [width, height, lang, reduced] of [
      [390, 844, 'zh-CN', false], [320, 568, 'de', false], [320, 568, 'de', true],
    ]) {
      const ctx = await browser.newContext({
        viewport: { width, height }, isMobile: true, hasTouch: true,
        reducedMotion: reduced ? 'reduce' : 'no-preference',
      });
      try {
        const p = await ctx.newPage(), errors = [], cdp = await ctx.newCDPSession(p);
        p.on('pageerror', e => errors.push(String(e)));
        await ctx.route('https://timeapi.io/**', r => r.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ timeZone: 'UTC', dateTime: new Date(now).toISOString().slice(0, -1) }),
        }));
        await ctx.route('https://worldtimeapi.org/**', r => r.abort());
        await p.addInitScript(lang => localStorage.setItem('pm.language.v1', lang), lang);
        await p.goto(cfg.url + '?ui=polish');
        await p.waitForFunction(() => globalThis.__pm?.ready && __pm.timeReady(), null, { timeout: 120000 });
        await p.evaluate(async () => {
          globalThis.cc = await System.import('cc');
          function find(n) {
            const g = n.components.find(c => typeof c.confirmRetreat === 'function');
            if (g) return g;
            for (const child of n.children) { const found = find(child); if (found) return found; }
          }
          globalThis.g = find(cc.director.getScene());
          globalThis.uiPolish = {
            settingsCalls: 0, retired: [],
            walk(n) { return [n, ...n.children.flatMap(child => this.walk(child))]; },
            routeNode() { return g.modal?.getChildByName('dialog-surface') || g.root.getChildByName('page-content') || g.root; },
            opacity() { return this.routeNode().getComponent(cc.UIOpacity)?.opacity ?? 255; },
            remember() {
              this.retired.push(...this.walk(g.root).filter(n => n !== g.root).map(n => ({
                node: n, opacity: n.getComponent(cc.UIOpacity),
              })));
            },
          };
          const original = g.homeSettings;
          g.homeSettings = function (...args) { uiPolish.settingsCalls++; return original.apply(this, args); };
        });
        const idle = async () => {
          await p.waitForFunction(() => !__pm.animating());
          await p.waitForFunction(() => uiPolish.opacity() === 255);
          await p.waitForTimeout(210); // Also respect the existing tap debounce and let canceled presses settle.
        };
        const point = async id => {
          const c = await p.evaluate(id => __pm.controls()[id], id);
          assert(c, 'control ' + id);
          return { x: c.x * width / 390, y: c.y * width / 390 };
        };
        const tap = async id => {
          await idle();
          await p.evaluate(() => uiPolish.remember());
          const c = await point(id);
          await p.touchscreen.tap(c.x, c.y);
          await idle();
        };
        const gameplay = () => p.evaluate(() => {
          const s = __pm.snapshot();
          // goHome saves the trusted clock/checkpoint; cosmetic navigation must preserve all gameplay fields.
          delete s.trustedTime; delete s.checkpointSequence;
          return s;
        });
        const metrics = () => p.evaluate(() => ({
          nodes: uiPolish.walk(g.root).length,
          rootChildren: g.root.children.length,
          glows: uiPolish.walk(g.root).filter(n => n.name === 'available-glow').length,
        }));
        const noStaleTweens = async () => {
          const running = await p.evaluate(() => {
            const old = uiPolish.retired.filter(t => !t.node.isValid);
            return old.reduce((sum, t) => sum + cc.Tween.getRunningCount(t.node)
              + (t.opacity ? cc.Tween.getRunningCount(t.opacity) : 0), 0);
          });
          assert.equal(running, 0, 'destroyed route nodes/opacities have no running tweens');
        };
        const stableBorders = async () => {
          const sample = () => p.evaluate(() => uiPolish.walk(g.root)
            .filter(n => n.name === 'available-glow')
            .map(n => ({ owner: n.parent.name, opacity: n.getComponent(cc.UIOpacity).opacity,
              tweens: cc.Tween.getRunningCount(n.getComponent(cc.UIOpacity)) })));
          const first = await sample();
          assert(first.length > 0, 'ordinary controls expose borders');
          assert(first.every(s => s.tweens === 0), 'ordinary borders have no looping opacity tween');
          await p.waitForTimeout(360);
          assert.deepEqual(await sample(), first, 'ordinary idle borders stay visually stable');
        };
        const sameRoute = async (dialog = false) => {
          const result = await p.evaluate(dialog => {
            if (dialog) g.homeSettings(); else g.render();
            return { opacity: uiPolish.opacity(), entering: g.uiEntering() };
          }, dialog);
          assert.equal(result.opacity, 255, 'same-route redraw stays visible immediately');
          assert.equal(result.entering, false, 'same-route redraw does not replay entry motion');
          await idle();
        };

        for (const nativeApp of [false, true]) {
          const prefix = `${width}x${height}-${lang}-${nativeApp ? 'native-profile' : 'mini-profile'}${reduced ? '-reduced' : ''}`;
          const initial = await p.evaluate(({ state, nativeApp }) => {
            g.state = state; g.nativeApp = nativeApp; g.screen = 'home';
            g.utilityDraw = null; g.uiRoute = ''; g.partnerSelected = null;
            uiPolish.settingsCalls = 0; uiPolish.retired = [];
            g.render();
            return { opacity: uiPolish.opacity(), entering: g.uiEntering() };
          }, { state: JSON.parse(JSON.stringify(base)), nativeApp });
          assert.equal(initial.entering, !reduced, 'entry honors reduced motion');
          if (reduced) assert.equal(initial.opacity, 255, 'reduced motion is visible immediately');
          await idle();
          const before = await gameplay();
          const shot = name => p.screenshot({ path: `${out}/${prefix}-${name}.png` });
          await shot('home');
          await sameRoute();

          const pressPoint = await point('home-settings');
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pressPoint] });
          await p.waitForTimeout(100);
          const pressed = await p.evaluate(() => g.root.getChildByName('home-settings').scale.x);
          if (reduced) assert.equal(pressed, 1, 'reduced motion does not scale a held button');
          else assert(pressed < 1 && pressed > .9, 'held button gives restrained press feedback');
          assert.equal(await p.evaluate(() => uiPolish.settingsCalls), 0, 'press alone does not activate');
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
          await idle();
          assert.equal(await p.evaluate(() => g.root.getChildByName('home-settings').scale.x), 1, 'cancel restores scale');
          assert.equal(await p.evaluate(() => uiPolish.settingsCalls), 0, 'cancel does not activate');
          await tap('home-settings');
          assert.equal(await p.evaluate(() => uiPolish.settingsCalls), 1, 'one actual tap opens settings once');
          assert(await p.evaluate(() => !!__pm.controls()['settings-close']), 'settings is reachable');
          await shot('settings');
          await sameRoute(true);
          await tap('settings-close');
          assert.equal(await p.evaluate(() => g.screen), 'home');

          await tap('home-explore');
          assert.equal(await p.evaluate(() => g.screen), 'adventure');
          await stableBorders();
          await sameRoute();
          await shot('adventure');
          await tap('nav-home');
          await tap('home-partners');
          assert.equal(await p.evaluate(() => g.screen), 'partners');
          await sameRoute();
          await shot('partners');
          await tap('nav-home');
          await tap('home-hatch');
          assert(await p.evaluate(() => !!__pm.controls()['hatch-bag']), 'hatchery is reachable');
          await sameRoute();
          await shot('hatch');
          await tap('nav-home');

          const homeSize = await metrics();
          for (let i = 0; i < 3; i++) {
            await tap(i % 2 ? 'home-hatch' : 'home-explore');
            await tap('nav-home');
            assert.deepEqual(await metrics(), homeSize, 'repeat navigation keeps home node counts bounded');
            await noStaleTweens();
          }
          assert.deepEqual(await gameplay(), before, 'cosmetic navigation preserves gameplay state');
          assert.deepEqual(errors, [], 'no browser runtime exceptions');
          const result = { profile: prefix, passed: true, nodes: homeSize.nodes, nativeDeviceVerified: false };
          results.push(result);
          console.log('PASS ' + prefix + ': stable borders, press/cancel, single activation, route settling/redraw, cleanup, unchanged gameplay');
        }
      } finally { await ctx.close(); }
    }
    fs.writeFileSync(`${out}/result.json`, JSON.stringify({ passed: true, browserOnly: true, results }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
