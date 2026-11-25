import { director, Director, Label, native, Node, sys, view } from 'cc';
import { newCooking, RECIPES } from './PCCooking';

export async function runMobileSimulatorQA(game: any) {
  const files = native.fileUtils;
  const root = files.getWritablePath().replace(/\/$/, '') + '/';
  const state = () => (globalThis as any).__pmPC;
  const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
  const frame = () => new Promise<void>(resolve => director.once(Director.EVENT_AFTER_DRAW, resolve));
  const steps: string[] = [];
  const screens: unknown[] = [];
  const cookingLabels: string[] = [];
  const check = (condition: unknown, message: string) => {
    if (!condition) throw new Error(message);
  };
  const waitFor = async (condition: () => unknown, message: string, timeout=24000) => {
    const start = Date.now();
    while (!condition()) {
      check(Date.now()-start<timeout,message);
      await delay(75);
    }
  };
  const settle = async () => {
    await waitFor(() => !state().busy(),'Action did not settle');
    await frame();
    await frame();
  };
  const touch = async (id: string) => {
    await settle();
    const control = game.ui.controls.get(id);
    check(control?.enabled && control.node.activeInHierarchy,'Unavailable control: '+id);
    control.node.emit(Node.EventType.TOUCH_START,{propagationStopped:false});
    control.node.emit(Node.EventType.TOUCH_END,{propagationStopped:false});
    steps.push(id);
    await delay(320);
    await settle();
  };
  const snapshot = async (stage: string, matches: RegExp) => {
    await settle();
    const safe = sys.getSafeAreaRect(false);
    const visible = view.getVisibleSize();
    const design = view.getDesignResolutionSize();
    check(design.width===1600 && design.height===900,'PC composition size changed');
    const controls: string[] = [];
    for (const [id,control] of game.ui.controls) {
      if (!matches.test(id) || !control.node.activeInHierarchy) continue;
      const position = control.node.worldPosition;
      const scale = control.node.worldScale;
      const dx = Math.abs(scale.x)*control.w/2;
      const dy = Math.abs(scale.y)*control.h/2;
      check(position.x-dx>=safe.x-3 && position.x+dx<=safe.x+safe.width+3 &&
            position.y-dy>=safe.y-3 && position.y+dy<=safe.y+safe.height+3,'Unsafe control: '+id);
      controls.push(id);
    }
    check(controls.length,'No controls on '+stage);
    screens.push({stage,visible,safe,design,controls});
    files.writeStringToFile(JSON.stringify({stage,steps,screens}),root+'pm-simulator-state.json');
    await waitFor(() => files.isFileExist(root+'pm-simulator-ack.txt') &&
      files.getStringFromFile(root+'pm-simulator-ack.txt').trim()===stage,'Screenshot timeout: '+stage);
  };
  try {
    game.changeLanguage('en');
    await snapshot('onboarding',/^choose-|^primary$/);
    await touch('primary');
    await touch('primary');
    check(state().route()==='home','New journey did not reach the PC camp');
    check(!['nav-social','nav-raids','nav-ladder','cloud-profile'].some(id=>state().controls()[id]),'Steam control remains');
    await snapshot('camp',/^nav-|^settings$|^primary$/);
    await touch('nav-partners');
    await snapshot('partners',/^pet-|^nav-home$/);
    await touch('nav-hatch');
    check(!state().controls()['help-inbox'],'Friend acceleration still present');
    await touch('breed-tab');
    await touch('nav-gyms');
    await touch('nav-home');
    game.state.pcCooking={...newCooking(),ingredients:{'meat:1':2,'spice:1':1}};
    await touch('nav-cooking');
    for (const recipe of RECIPES) {
      await touch('food-recipe-'+recipe.id);
      const details = game.content.getChildByName('pc-cooking')?.getChildByName('cooking-details');
      const labels: string[] = details?.getComponentsInChildren(Label).map((label: Label)=>label.string) || [];
      const bonus = labels.find(text=>/[+−]\d+%/.test(text));
      check(bonus && !/[\u3400-\u9fff]/.test(bonus),'English bonus missing: '+recipe.id+': '+labels.join(' | '));
      cookingLabels.push(bonus!);
    }
    await touch('food-recipe-ember-skewer');
    const cook = game.ui.controls.get('food-cook').label.string;
    check(/cook/i.test(cook) && !/[\u3400-\u9fff]/.test(cook),'English cook button missing');
    await touch('food-cook');
    const eat = game.ui.controls.get('food-eat').label.string;
    check(/eat/i.test(eat) && !/[\u3400-\u9fff]/.test(eat),'English eat button missing');
    await touch('food-eat');
    check(state().snapshot().pcCooking.active?.remaining===10,'Meal did not apply');
    const meal: string[] = game.content.getComponentsInChildren(Label).map((label: Label)=>label.string);
    check(meal.some(text=>text.includes('Chargrilled Skewers') && text.includes('10') && !/[\u3400-\u9fff]/.test(text)),
      'English meal duration missing');
    await snapshot('cooking',/^food-(recipe-|quality-|cook|eat)/);
    await touch('nav-dex');
    await snapshot('dex',/^dex-rewards$|^shiny-filter$|^pet-/);
    await touch('dex-rewards');
    check(Object.keys(state().controls()).filter(id=>/^dex-claim-\d+$/.test(id)).length===15,'Expected 15 reward slots');
    await snapshot('rewards',/^dex-claim-/);
    await touch('dialog-confirm');
    await touch('nav-map');
    check(Object.keys(state().controls()).filter(id=>/^map-\d+$/.test(id)).length===15,'Expected 15 PC regions');
    await snapshot('map',/^map-\d+$|^primary$/);
    await touch('primary');
    await touch('primary');
    await snapshot('battle',/^(attack|guard|heal|boost|retreat|battle-settings)$/);
    const before=state().snapshot().revision;
    await touch('attack');
    check(state().snapshot().revision>before,'Battle turn did not advance');
    check(await game.save(),'Native save failed');
    files.writeStringToFile(JSON.stringify({stage:'complete',steps,screens,cookingLabels,ok:true}),root+'pm-simulator-state.json');
  } catch (error) {
    files.writeStringToFile(JSON.stringify({stage:'failed',steps,screens,cookingLabels,error:String(error)}),root+'pm-simulator-state.json');
  }
}
