import { director, Director, native, Node, sys, view } from 'cc';

// This module is injected only into the simulator build.
export async function runMobileSimulatorQA(game: any) {
  const files = native.fileUtils;
  const root = files.getWritablePath().replace(/\/$/, '') + '/';
  const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
  const nextFrame = () => new Promise<void>(resolve => director.once(Director.EVENT_AFTER_DRAW, resolve));
  const state = () => (globalThis as any).__pm;
  const steps: string[] = [];
  const screens: any[] = [];
  const check = (condition: unknown, reason: string) => {
    if (!condition) throw new Error(reason);
  };
  const waitFor = async (test: () => unknown, problem: string, timeout=24000) => {
    const started = Date.now();
    while (!test()) {
      check(Date.now() - started < timeout, problem);
      await delay(75);
    }
  };
  const settle = async () => {
    await waitFor(() => !state().animating(), 'Page or art did not settle');
    await nextFrame();
    await nextFrame();
  };
  const nodeFor = (node: Node, name: string): Node | undefined =>
    node.name === name ? node : node.children.map(child => nodeFor(child, name)).find(Boolean);
  const touch = async (id: string) => {
    await settle();
    const control = state().controls()[id];
    check(control, 'Expected control ' + id);
    const button = nodeFor(game.root, id);
    if (!button) throw new Error('Missing UI node ' + id);
    await waitFor(() => performance.now() - game.lastTap >= 250, 'Button debounce timed out');
    button.emit(Node.EventType.TOUCH_START, { propagationStopped: false });
    button.emit(Node.EventType.TOUCH_END, { propagationStopped: false });
    await delay(280);
    await settle();
    steps.push(id);
  };
  const safeControls = (pattern: RegExp) => {
    const visible = view.getVisibleSize();
    const safe = sys.getSafeAreaRect(false);
    const controls = Object.entries(state().controls()) as [string,{x:number;y:number;w:number;h:number}][];
    const matching = controls.filter(([id]) => pattern.test(id));
    check(matching.length, 'No controls matched ' + pattern);
    for (const [id,c] of matching) {
      const y = visible.height - c.y;
      check(c.x-c.w/2 >= safe.x-2 && c.x+c.w/2 <= safe.x+safe.width+2 &&
        y-c.h/2 >= safe.y-2 && y+c.h/2 <= safe.y+safe.height+2, 'Outside safe area: '+id);
    }
    return matching.map(([id]) => id);
  };
  const snapshot = async (stage: string, pattern: RegExp) => {
    await settle();
    const visible = view.getVisibleSize(), safe = sys.getSafeAreaRect(false);
    screens.push({ stage, visible, safe, controls:safeControls(pattern) });
    files.writeStringToFile(JSON.stringify({ stage, steps, screens }), root+'pm-simulator-state.json');
    await waitFor(() => files.isFileExist(root+'pm-simulator-ack.txt') &&
      files.getStringFromFile(root+'pm-simulator-ack.txt').trim() === stage, 'Screenshot timeout: '+stage);
  };
  try {
    // The fixture only replaces the clock source in the simulator test application.
    await game.trustedClock.sync();
    const clock = game.trustedClock;
    if (!clock.now()) {
      clock.request = async () => Date.now();
      check(await clock.sync(), 'Simulator fixture clock failed');
    }
    await snapshot('cover', /^start-game$/);
    await touch('start-game');
    await touch('hero-confirm');
    await touch('starter-confirm');
    check(!state().controls()['home-social'], 'Social action still visible at camp');
    await snapshot('camp', /^home-(partners|hatch|breed|cooking|dex|explore|gym)$/);
    for (const page of ['partners','hatch','breed','cooking']) {
      await touch('home-'+page);
      if (page === 'partners') await snapshot('partners', /^nav-home$/);
      if (page === 'cooking') await snapshot('cooking', /^food-(recipe-\d+|quality-\d+|cook|eat)$/);
      await touch('nav-home');
    }
    await touch('home-dex');
    check(!state().controls()['dex-friends'], 'Friend filter still visible');
    check(safeControls(/^dex-map-\d+$/).length === 15, 'Expected 15 Petdex map cards');
    await snapshot('dex', /^dex-(type|owned|shiny|map-all|map-\d+)$/);
    await touch('dex-rewards');
    check(safeControls(/^dex-reward-\d+$/).length === 15, 'Expected 15 Petdex rewards');
    await snapshot('rewards', /^dex-reward-\d+$/);
    await touch('nav-home');
    await touch('nav-home');
    await touch('home-explore');
    check(safeControls(/^map-\d+$/).length === 15, 'Expected 15 map cards');
    await snapshot('map', /^(map-\d+|adventure-go)$/);
    await touch('adventure-go');
    await touch('challenge');
    await snapshot('battle', /^(attack|guard|retreat)$/);
    const before = state().snapshot();
    await touch('attack');
    check(state().snapshot().revision > before.revision, 'Attack did not advance the battle');
    await game.save();
    files.writeStringToFile(JSON.stringify({ stage:'complete', steps, screens, ok:true }), root+'pm-simulator-state.json');
  } catch (error) {
    files.writeStringToFile(JSON.stringify({ stage:'failed', steps, screens, error:String(error) }), root+'pm-simulator-state.json');
  }
}
