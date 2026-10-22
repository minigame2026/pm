import {Node,Graphics,Color,Sprite,Mask,LabelOutline,UITransform,UIOpacity,tween,Vec3} from 'cc';
import {State,Pet,PETS,petName,petSkills,petAttackFaces,petBaseHP,rarityName,hp,maxHP,attackAmount,healAmount,matchupMultiplier,SKILLS,homeParty,formKey} from './PMModel';
import {ArenaMode,ArenaRun,Challenge,arenaSave,selectArenaMode,modeRun,arenaEligible,startArena,chooseRental,reorderArena,challengeArena,arenaAction,arenaActor,finishArenaMatch,closeArena,abandonArena,makeChallenge,challengeCode,readChallenge,importChallenge,ARENA_RANKS,validArena} from './PMArena';
import {copyVisitCode,pasteVisitCode,qrCells,capturePostcard,prepareCard,sendCard,importCardImage} from './PMSharing';
import {tr} from './PMLocale';
const ink='#24455a',muted='#6d8898',blue='#427b9e',gold='#c28b3f',green='#519b81';
const modes:{id:ArenaMode;name:string;hint:string;mark:string;color:string}[]=[{id:'league',name:'训练师挑战赛',hint:'5胜夺冠 · 2败结算',mark:'♜',color:gold},{id:'friend',name:'好友挑战书',hint:'离线阵容 · 好友切磋',mark:'✉',color:blue},{id:'rental',name:'租借宠物杯',hint:'随机选宠 · 免费体验',mark:'♧',color:green},{id:'champion',name:'冠军守擂',hint:'挑战冠军 · 留下阵容',mark:'★',color:'#9173ac'}];
function change(g:any,fn:(s:State)=>State,view='run'){const before=g.state,next=fn(before);if(next===before)return;g.state=next;g.save();drawArena(g,view);}
function keys(g:any){const available=arenaEligible(g.state),present=new Set(available.map(p=>p.uid));if(!g.arenaKeys)g.arenaKeys=homeParty(g.state).filter(id=>id&&present.has(id));g.arenaKeys=g.arenaKeys.filter(id=>present.has(id));for(const p of available)if(g.arenaKeys.length<3&&!g.arenaKeys.includes(p.uid))g.arenaKeys.push(p.uid);return g.arenaKeys as string[];}
function info(g:any,p:Pet){g.pageHelp(petName(p)+' · '+rarityName(p.rarity)+'\nHP '+petBaseHP(p)+' · ⚔ '+petAttackFaces(p,true).join('/')+'\n'+petSkills(p).map(c=>SKILLS[c][0]+': '+SKILLS[c][1]).join('\n'));}
function card(g:any,c:Node,p:Pet,x:number,y:number,w:number,h:number,id:string,click:()=>void,tint='#ffffff'){
 const n=g.button(c,id,'',x,y,w,h,click,tint);g.petImage(n,p,0,h*.12,Math.max(28,Math.min(w-12,h-56)));
 g.text(n,(p.shiny?'★ ':'')+rarityName(p.rarity),0,h/2-12,11,p.rarity==='SSR'?gold:p.rarity==='SR'?'#8963b2':green,w-8,20);
 g.text(n,petName(p),0,-h/2+35,13,ink,w-6,22).isBold=true;g.text(n,'HP '+petBaseHP(p)+'   ⚔ '+Math.max(...petAttackFaces(p,true)),0,-h/2+14,11,muted,w-6,21);return n;
}
function exitPrompt(g:any){const c=g.overlay('离开比赛？',238);g.text(c,'比赛进度会自动保存',0,38,17,ink,310,40);g.button(c,'arena-save-exit','保存并离开',0,-13,300,44,()=>g.goHome(),blue);g.button(c,'arena-abandon','放弃本轮',0,-68,300,38,()=>change(g,abandonArena,'hub'),'#dbe6ed');}
export function drawArena(g:any,view='hub'){
 if(g.state.arena&&!validArena(g.state.arena)){delete g.state.arena;g.save();}
 if(!g.state.arena){g.state.arena=arenaSave(g.state);g.save();}
 const a=arenaSave(g.state),r=a.run;keys(g);if(view==='run')view=r?r.phase:'hub';
 const title=view==='hub'?'训练师广场':view==='friend'?'好友挑战书':view==='setup'?'参赛队伍':view==='draft'?'租借宠物杯':view==='history'?'历代冠军':modes.find(m=>m.id===r?.mode)?.name||'训练师广场';
 const subtitle=view==='hub'?ARENA_RANKS[Math.min(4,a.crowns)]+' · '+a.crowns+' ★':r&&['preview','battle','result','finished'].includes(view)?(r.mode==='friend'||r.mode==='champion'?'3 VS 3':'✓ '+r.wins+' / 5    × '+r.losses+' / 2'):'';
 const back=()=>['battle','preview','draft','result'].includes(view)?exitPrompt(g):view==='hub'?g.goHome():drawArena(g,'hub');
 if(view==='battle'&&r){g.screen='utility';g.utilityDraw=()=>drawArena(g,'run');drawBattle(g,r);return;}
 const c=g.fullPage(title,subtitle,()=>drawArena(g,view),back),{top,bottom,height}=g.pageBounds(c);
 g.audio?.select(view==='battle'?'battle-normal':'camp');
 if(view==='hub'){
  const room=height-115,rowH=Math.min(120,room/4-8);modes.forEach((m,i)=>{const n=g.button(c,'arena-mode-'+m.id,'',0,top-20-rowH/2-i*(rowH+8),350,rowH,()=>{g.state=selectArenaMode(g.state,m.id);g.arenaMode=m.id;g.save();if(g.state.arena.run){drawArena(g,'run');return;}if(m.id==='rental')change(g,s=>startArena(s,'rental'));else drawArena(g,m.id==='friend'?'friend':'setup');},m.color);g.text(n,m.mark,-128,0,35,'#fff0c5',60,60);g.text(n,m.name,30,13,22,'#ffffff',235,32).isBold=true;g.text(n,modeRun(a,m.id)?'继续比赛':m.hint,30,-21,12,'#f6f5e8',235,28);});
  if(r)g.button(c,'arena-resume','继续比赛',0,bottom+39,350,48,()=>drawArena(g,'run'),gold);else g.button(c,'arena-history','历代冠军',0,bottom+39,350,42,()=>drawArena(g,'history'),'#dbe6ed',true,17);
  g.helpButton(c,'三只宠物组队，阵亡后自动替补。\n双方药水相同，每场恢复全队生命。\n先手逐回合交替，60回合按剩余生命比例判定。\n探险临时强化不带入比赛。\n段位与战绩仅保存在本机。');return;
 }
 if(view==='setup'){
  const rowH=Math.min(132,(height-115)/3-10),pets=arenaEligible(g.state);keys(g).forEach((id,i)=>{const p=pets.find(p=>p.uid===id)!;const n=g.button(c,'arena-slot-'+i,'',0,top-18-rowH/2-i*(rowH+10),350,rowH,()=>{g.arenaPick=i;g.arenaPage=0;drawArena(g,'picker');},'#ffffff');g.petImage(n,p,-116,0,rowH-16);g.text(n,petName(p)+' '+rarityName(p.rarity),46,22,19,ink,210,30);g.text(n,'HP '+petBaseHP(p)+'   ⚔ '+petAttackFaces(p,true).join('/'),46,-5,13,muted,210,25);g.text(n,petSkills(p).map(c=>SKILLS[c][0]).join(' · '),46,-34,11,muted,210,30);});
  if(keys(g).length<3)g.text(c,'需要三只可参赛伙伴',0,bottom+97,17,muted,340,42);
  g.button(c,'arena-enroll','开始挑战',0,bottom+37,350,50,()=>change(g,s=>startArena(s,g.arenaMode,keys(g))),gold,keys(g).length===3,21);return;
 }
 if(view==='picker'){
  const pets=arenaEligible(g.state),page=g.arenaPage||0,rowH=Math.min(190,(height-95)/2-8);g.listPages(c,pets,6,page,(p:Pet,index:number)=>{const i=index%6,n=card(g,c,p,(i%3-1)*120,top-16-rowH/2-Math.floor(i/3)*(rowH+10),112,rowH,'arena-pick-'+p.uid,()=>{const list=keys(g),old=list.indexOf(p.uid!);if(old>=0)[list[old],list[g.arenaPick]]=[list[g.arenaPick],list[old]];else list[g.arenaPick]=p.uid!;drawArena(g,'setup');},keys(g).includes(p.uid!)?'#fff1cf':'#ffffff');g.listItem(n,index,6);});g.pagePager(c,bottom+38,page,Math.max(1,Math.ceil(pets.length/6)),(p:number,redraw:boolean)=>{g.arenaPage=p;if(redraw)drawArena(g,'picker');},'arena-picker');return;
 }
 if(view==='draft'&&r){
  g.text(c,(r.team.length+1)+' / 3',0,top-32,24,gold,340,42);const h=Math.min(260,height-170);
  r.options[r.team.length].forEach((p,i)=>{card(g,c,p,(i-1)*120,top-72-h/2,112,h,'arena-draft-'+i,()=>{g.arenaDraftIndex=i;info(g,p);});g.button(c,'arena-draft-take-'+i,'选择',(i-1)*120,top-90-h,110,42,()=>change(g,s=>chooseRental(s,i)),green,true,17);});
  r.team.forEach((p,i)=>g.petImage(c,p,(i-1)*65,bottom+35,49));return;
 }
 if(view==='preview'&&r){
  g.button(g.root,'arena-types','?',163,g.h/2-42,36,36,()=>g.encounterTypesUI({...g.state,active:r.team[0],enemy:r.foes[0].id,enemyRarity:r.foes[0].rarity},()=>drawArena(g,'preview')),blue);
  const h=Math.min(174,(height-163)/2);g.text(c,r.name,0,top-25,22,gold,340,36).isBold=true;
  r.foes.forEach((p,i)=>card(g,c,p,(i-1)*120,top-51-h/2,112,h,'arena-foe-'+i,()=>info(g,p),'#f8e7df'));
  const y=top-67-h;g.text(c,'VS',0,y-5,20,gold,60,28);r.team.forEach((p,i)=>{const n=card(g,c,p,(i-1)*120,y-30-h/2,112,h,'arena-order-'+i,()=>{if(i)change(g,s=>reorderArena(s,i));else info(g,p);},i===0?'#fff0c7':'#ffffff');g.text(n,i===0?'首发':'↑',0,9,11,blue,96,18);});
  g.button(c,'arena-challenge','开始挑战',0,bottom+33,350,48,async()=>{g.busy=true;try{await g.artCache.load('battle-arena');g.busy=false;change(g,challengeArena);}finally{g.busy=false;}},gold,true,21);return;
 }
 if((view==='result'||view==='finished')&&r){
  const won=view==='result'?r.result:(r.mode==='league'||r.mode==='rental'?r.wins===5:r.result),symbol=won?'★':'◇';g.text(c,symbol,0,top-70,72,won?gold:muted,160,100);g.text(c,won?'挑战胜利':'挑战结束',0,top-139,27,won?gold:muted,340,42).isBold=true;
  const h=Math.min(160,height-280);r.team.forEach((p,i)=>card(g,c,p,(i-1)*120,top-184-h/2,112,h,'arena-result-'+i,()=>info(g,p)));
  if(r.reward){g.eggArt(c,r.reward,-57,bottom+99,49);g.text(c,rarityName(r.reward.rarity)+' +1',30,bottom+99,22,gold,160,34);}else if(view==='finished'&&r.mode!=='friend')g.text(c,'战绩已保存',0,bottom+100,17,muted,320,32);
  if(view==='finished'&&r.mode==='friend')g.button(c,'arena-reply','分享回信',0,bottom+91,350,42,()=>{g.arenaCard=a.lastReceipt;drawArena(g,'card');},blue,true,18);
  g.button(c,'arena-result-next',view==='result'?'继续':'领取并返回',0,bottom+34,350,48,()=>change(g,view==='result'?finishArenaMatch:closeArena,view==='result'?'run':'hub'),gold,true,20);return;
 }
 if(view==='friend'){
  const edit=g.socialInput(c,'arena-code',g.arenaCode||'',top-40,'粘贴挑战码',v=>g.arenaCode=v);edit.maxLength=6000;
  const accept=(code:string)=>{const next=importChallenge(g.state,code);g.arenaNote=next===g.state?'挑战码无效':'导入成功';g.state=next;g.save();drawArena(g,'friend');};
  g.button(c,'arena-paste','粘贴',-118,top-94,110,40,async()=>{try{g.arenaCode=await pasteVisitCode();drawArena(g,'friend');}catch{g.arenaNote='长按输入框粘贴';drawArena(g,'friend');}},'#dbe6ed',true,16);
  g.button(c,'arena-import','导入',0,top-94,110,40,()=>accept(edit.string),blue,true,16);
  g.button(c,'arena-image','导入图片',118,top-94,110,40,async()=>{try{accept(await importCardImage());}catch{g.arenaNote='挑战码无效';drawArena(g,'friend');}},'#dbe6ed',true,15);
  if(a.imported){g.text(c,a.imported.name,0,top-141,19,ink,330,28);const h=Math.min(166,height-302);a.imported.team.forEach((p,i)=>card(g,c,p,(i-1)*120,top-166-h/2,112,h,'arena-imported-'+i,()=>info(g,p)));if(a.imported.record)g.text(c,(a.imported.record.won?'✓ ':'× ')+a.imported.record.rounds+' ⚔  '+a.imported.record.alive+' ♥',0,top-180-h,16,gold,330,26);}
  else g.text(c,'离线阵容 · 好友切磋',0,top-203,21,muted,340,42);
  if(g.arenaNote)g.text(c,g.arenaNote,0,bottom+146,13,muted,340,27);
  g.button(c,'arena-friend-go','挑战好友',0,bottom+94,350,44,()=>{g.arenaMode='friend';drawArena(g,'setup');},blue,!!a.imported,19);
  g.button(c,'arena-share','制作挑战书',0,bottom+38,350,44,()=>{const card=makeChallenge(g.state,keys(g));if(card){g.arenaCard=card;drawArena(g,'card');}else{g.arenaNote='需要三只可参赛伙伴';drawArena(g,'friend');}},gold,true,19);return;
 }
 if(view==='card'){
  const cardData:Challenge=g.arenaCard;if(!cardData){drawArena(g,'friend');return;}const code=challengeCode(cardData),size=Math.min(440,height-145),n=g.panel(c,0,top-16-size/2,350,size,'#fff9e7',20);n.name='arena-share-card';
  g.text(n,'骰子宠物精灵',0,size/2-27,24,gold,330,36).isBold=true;g.text(n,cardData.kind==='receipt'?'好友回信':'好友挑战书',0,size/2-60,17,ink,330,28);
  cardData.team.forEach((p,i)=>g.petImage(n,p,(i-1)*100,size/2-119,90));const cells=qrCells(code),qrsize=Math.min(180,size-192),unit=qrsize/(cells.length+8),qr=g.makeNode(n,'arena-qr',0,-size/2+qrsize/2+12,qrsize,qrsize),gfx=qr.addComponent(Graphics);gfx.fillColor=new Color('#ffffff');gfx.rect(-qrsize/2,-qrsize/2,qrsize,qrsize);gfx.fill();gfx.fillColor=new Color('#183852');cells.forEach((row,y)=>row.forEach((dark,x)=>{if(dark)gfx.rect(-qrsize/2+(x+4)*unit,qrsize/2-(y+5)*unit,unit+.02,unit+.02);}));gfx.fill();
  if(cardData.record)g.text(n,(cardData.record.won?'✓ ':'× ')+cardData.record.rounds+' ⚔ '+cardData.record.alive+' ♥',0,size/2-169,16,gold,330,28);
  const exportImage=async()=>{if(g.busy)return;g.busy=true;try{await g.artCache.warmTree(n);await sendCard(await prepareCard(await capturePostcard(n)),tr('好友挑战书')+'\n'+code);}catch{g.arenaNote='请复制挑战码';}finally{g.busy=false;}};
  g.button(c,'arena-card-share','分享图片',0,bottom+91,350,44,exportImage,blue,true,19);g.button(c,'arena-card-copy','复制挑战码',0,bottom+37,350,42,async()=>{const ok=await copyVisitCode(code);g.arenaNote=ok?'已复制':'长按输入框复制';drawArena(g,'code');},gold,true,18);return;
 }
 if(view==='code'){g.text(c,g.arenaNote||'',0,top-55,19,ink,340,38);const box=g.socialInput(c,'arena-export-code',challengeCode(g.arenaCard),top-114,'挑战码',()=>{});box.maxLength=6000;g.button(c,'arena-code-back','返回',0,bottom+38,350,44,()=>drawArena(g,'card'),blue);return;}
 if(view==='history'){
  const entries=[...(a.champion?[a.champion]:[]),...a.history],page=g.arenaHistoryPage||0,rowH=Math.min(160,(height-85)/3-10);g.listPages(c,entries,3,page,(v:any,index:number)=>{const i=index%3,n=g.panel(c,0,top-15-rowH/2-i*(rowH+10),350,rowH,'#fff8e5',16);g.listItem(n,index,3);g.text(n,'★ '+v.generation,0,rowH/2-20,17,gold,330,28);v.team.forEach((p:Pet,j:number)=>g.petImage(n,p,(j-1)*100,-10,rowH-50));});if(!entries.length)g.text(c,'夺冠后留下你的阵容',0,0,21,muted,340,42);g.pagePager(c,bottom+37,page,Math.max(1,Math.ceil(entries.length/3)),(p:number,redraw:boolean)=>{g.arenaHistoryPage=p;if(redraw)drawArena(g,'history');},'arena-history');return;
 }
}
function drawBattle(g:any,r:ArenaRun){
 g.clear();g.layout();g.audio?.select('battle-normal');
 const x=arenaActor(r,0),y=arenaActor(r,1),H=g.h,b=-H/2,sceneH=H-246;
 const field=g.makeNode(g.root,'arena-field',0,123,390,sceneH);field.addComponent(Mask).type=Mask.Type.GRAPHICS_RECT;
 const bg=g.image(field,'battle-arena',0,0,390,sceneH),original=g.artCache.size('battle-arena'),scale=Math.max(390/original.width,sceneH/original.height);bg.getComponent(UITransform)!.setContentSize(original.width*scale,original.height*scale);
 g.stage=g.makeNode(g.root,'actors',0,0,390,H);
 const title=g.text(g.root,modes.find(m=>m.id===r.mode)!.name,0,H/2-30,18,'#ffffff',280,36);title.isBold=true;const outline=title.node.addComponent(LabelOutline);outline.color=new Color('#254b4d');outline.width=2;
 g.text(g.root,(r.first===0?'↓':'↑')+' '+r.round+'/60   '+(r.intent==='guard'?'⛨':'⚔')+'    ✓ '+r.wins+'  × '+r.losses,0,H/2-61,13,'#ffffff',290,24);
 const leave=g.button(g.root,'arena-retreat','',164,H/2-30,36,36,()=>exitPrompt(g),'#fffdf5');g.menuIcon(leave,'retreat',0,0,25,'#286579');g.controls['nav-home']=g.controls['arena-retreat'];
 const help=g.button(g.root,'arena-types','',-164,H/2-30,36,36,()=>g.encounterTypesUI(x,()=>drawArena(g,'run')),'#fffdf5');g.text(help,'?',0,0,20,'#286579',30,30);
 const base=Math.min(230,sceneH*.38),ps=base*1.2*Math.min(1.15,g.petScale(x.active.id)),es=base*.65*.8*g.petScale(y.active.id),ey=H/2-sceneH*.62,py=H/2-sceneH*.92;
 const ex=g.groundX(y.active,'front',es*1.1,82),px=g.groundX(x.active,'back',ps*.9,-92);
 g.battlePad(ex,ey,es*1.25*1.2*1.15,0);g.shadow(ex,ey,es*.55,.82);
 const enemy=g.petImage(g.stage,y.active,ex,ey,es*1.1,'enemy');g.enemyNode=enemy;g.groundPet(enemy,y.active,'front',ex,ey);
 g.battlePad(px,py,base*1.25,0);g.shadow(px,py,ps*.55);
 const player=g.petImage(g.stage,x.active,px,py,ps*.9,'player');g.playerNode=player;g.groundPet(player,x.active,'back',px,py);
 const status=g.panel(g.root,Math.min(103,ex),Math.min(H/2-139,ey+enemy.getComponent(UITransform).height*.85+30),176,54,'#fffdf5',10,246);status.name='enemy-hud';
 g.typeIcon(status,PETS[y.active.id].type,-73,14,17);g.text(status,petName(y.active),-20,14,12,ink,82,20);
 g.bar(status,-31,-10,104,y.hpRatio,hp(y)+' / '+maxHP(y),'enemy');
 const intent=g.panel(status,55,0,58,38,'#fff0d9',8);g.attackDie(intent,-16,0,26);g.text(intent,''+attackAmount(y),14,4,22,'#b94c0a',32,30);g.matchupBadge(intent,matchupMultiplier(y.active.id,x.active.id),8,-12,42);
 r.fighters[1].forEach((v,i)=>g.text(status,hp(v)>0?'●':'×',-26+i*26,43,13,hp(v)>0?'#f4e5bd':'#bcc9cc',24,22));
 const sheet=g.panel(g.root,0,b+123,390,246,'#fffdf5',26);sheet.name='arena-actions';
 g.fx=g.makeNode(g.root,'battle-effects',0,0,390,H);
 const runAction=async(action:'heal'|'boost'|'attack'|'guard')=>{
  if(g.busy)return;if(g.modal){g.modal.removeFromParent();g.modal.destroy();g.modal=null;}
  const old=g.state,next=arenaAction(old,action);if(next===old)return;g.busy=true;g.state=next;await g.save();
  const finish=()=>{g.busy=false;drawArena(g,'run');};
  if(action==='heal'||action==='boost'){
   const actor=arenaActor(next.arena.run,0);g.itemEffect(player,action==='heal');g.lifeTo('player',actor.hpRatio,maxHP(actor));
   if(actor.skill?.event)g.skillPopup(actor.skill.event);
   g.scheduleOnce(finish,1.35);return;
  }
  const beats=next.arena.run.last||[],shown=['',''];if(action==='guard')g.shield(player);if(r.intent==='guard')g.shield(enemy);
  beats.forEach((beat,i)=>g.scheduleOnce(()=>{
   const source=beat.side===0?player:enemy,target=beat.side===0?enemy:player;if(!source.isValid||!target.isValid)return;
   const hit=()=>{if(beat.attacks!==false||beat.damage>0)g.hurt(target,beat.damage,(beat.side===0?r.intent:action)==='guard',matchupMultiplier(beat.side===0?x.active.id:y.active.id,beat.side===0?y.active.id:x.active.id));
    if(beat.hp){g.lifeTo('player',beat.hp[0],maxHP(x));g.lifeTo('enemy',beat.hp[1],maxHP(y));}
    beat.events?.forEach((event,side)=>{if(event&&event!==shown[side]){shown[side]=event;g.skillPopup(event,new Vec3(side===0?-90:90,side===0?35:120,0));}});
   };
   if(beat.attacks!==false)g.strike(source,target,hit);else hit();
  },i*.65));
  g.scheduleOnce(finish,Math.max(1.45,beats.length*.65+.45));
 };
 // The exact exploration HUD/buttons are reused; only the model command is injected.
 g.battleUI(sheet,246,{...x,turn:r.round},runAction);
 for(const id of ['heal','boost','guard','attack'])g.controls['arena-'+id]=g.controls[id];
 const rollEvents=[x.skill?.event,y.skill?.event];rollEvents.forEach((event,side)=>{if(event)g.skillPopup(event,new Vec3(side===0?-90:90,side===0?35:120,0));});
}
