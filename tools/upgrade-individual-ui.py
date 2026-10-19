from pathlib import Path
p=Path('D:/game/PM/assets/scripts/PMGame.ts');s=p.read_text(encoding='utf-8-sig')
def rep(a,b):
 global s
 assert a in s,a[:100]
 s=s.replace(a,b)
rep("import { BATTLE_RECTS, PET_FEET } from './BattleArt';", "import { BATTLE_RECTS, PET_FEET } from './BattleArt';\nimport { EVOLUTION_ART } from './EvolutionArt';\nimport { Pet, Sex, petEntry, petName, petBaseHP, formKey, sexSymbol, petSkills, SKILLS, startBreeding, claimBreeding } from './PMModel';")
rep('partnerSelected:PetId|null','partnerSelected:string|null')
rep('partyDrag:{id:PetId;', 'partyDrag:{id:string;')
rep('  async start(){', "  private breedMother='';private breedFather='';private breedClock:Label|null=null;\n  async start(){")
rep('      this.ready=true;this.render();', '''      await Promise.all(PET_IDS.map(async id=>{
        const texture=await new Promise<Texture2D>((resolve,reject)=>resources.load('art/'+id+'-evolution-v1/texture',Texture2D,(e,r)=>e?reject(e):resolve(r)));
        for(const rarity of ['SR','SSR'])for(const side of ['back','front']){const [x,y,w,h]=EVOLUTION_ART[id][rarity][side].rect,frame=new SpriteFrame();frame.reset({texture,rect:new Rect(x,y,w,h),originalSize:new Size(w,h)});frame.packable=false;this.art[id+'-'+rarity+'-'+side]=frame;}
      }));
      this.ready=true;this.render();''')
rep("version:'0.8.1'", "version:'0.9.0'")
rep('if(second!==this.hatchSecond){this.hatchSecond=second;', "if(second!==this.hatchSecond){this.hatchSecond=second;if(this.breedClock?.isValid&&this.state.breeding){const left=this.state.breeding.readyAt-Date.now();this.breedClock.string=left>0?this.hatchTime(left):'宠物蛋已准备好';if(left<=0&&!this.pressPending){this.breedClock=null;this.breedingUI();}}")
rep("const old=sys.localStorage.getItem(KEY);if(restore(old))", "const old=sys.localStorage.getItem(KEY);if(old&&!sys.localStorage.getItem(KEY+'.pre-individuals-v1')&&JSON.parse(old).individualVersion!==1)sys.localStorage.setItem(KEY+'.pre-individuals-v1',old);if(restore(old))")
start=s.index('  private petImage(');end=s.index('  private actionIcon',start)
s=s[:start]+'''  private resolvePet(value:string|Pet):Pet {return typeof value==='string'?petEntry(this.state,value):value;}
  private petImage(parent:Node,value:string|Pet,x:number,y:number,size:number,role:'player'|'enemy'|'card'='card'){
    const p=this.resolvePet(value),id=p.id,side=role==='player'?'back':'front',evolved=p.rarity&&p.rarity!=='normal';
    const key=evolved?formKey(p)+'-'+side:role==='card'?id:id+'-'+side;
    return this.image(parent,key,x,y,size,size,!evolved&&role==='card'&&id==='fox');
  }
'''+s[end:]
rep("private petFeet(id:PetId,side:'back'|'front'){", "private petFeet(value:string|Pet,side:'back'|'front'){\n    const p=this.resolvePet(value),id=p.id;if(p.rarity&&p.rarity!=='normal')return EVOLUTION_ART[id][p.rarity][side].feet;")
rep("private groundX(id:PetId,side:'back'|'front',size:number,preferred:number){\n    const frame=this.art[id+'-'+side].originalSize", "private groundX(value:string|Pet,side:'back'|'front',size:number,preferred:number){\n    const p=this.resolvePet(value),id=p.id,key=p.rarity&&p.rarity!=='normal'?formKey(p)+'-'+side:id+'-'+side;\n    const frame=this.art[key].originalSize")
rep('u=this.petFeet(id,side)[0]', 'u=this.petFeet(value,side)[0]')
rep("private groundPet(n:Node,id:PetId,side:'back'|'front'", "private groundPet(n:Node,id:string|Pet,side:'back'|'front'")
rep('this.groundX(s.active.id,','this.groundX(s.active,')
rep('this.groundPet(this.playerNode,s.active.id,','this.groundPet(this.playerNode,s.active,')
rep('this.petImage(this.stage,s.active.id,','this.petImage(this.stage,s.active,')
rep('this.petImage(p,s.active.id,','this.petImage(p,s.active,')
rep('this.petImage(this.root,s.active.id,','this.petImage(this.root,s.active,')
rep('PETS[s.active.id].name','petName(s.active)')
rep("const id=phase==='won'||phase==='lost'?s.active.id:(s.recruit||s.enemy);", "const id=phase==='won'||phase==='lost'?s.active.uid!:(s.recruit||s.enemy),shown=this.resolvePet(id);")
rep("PETS[id].name+' · '+PETS[id].trait", "petName(shown)+' · '+PETS[shown.id].type")
rep("const selected=s.active.id===id,owned=s.owned.includes(id)", "const selected=s.active.uid===id,owned=!!id&&s.pets!.some(p=>p.uid===id)")
rep('this.petImage(card,id,0,15,78).getComponent(Sprite)!.grayscale=!owned;', "if(owned)this.petImage(card,id,0,15,78);else this.menuIcon(card,'lock',0,15,30,'#9aacb0');")
rep('this.text(card,PETS[id].name,0,-36', "this.text(card,owned?petName(petEntry(s,id)):'空位',0,-36")
rep("this.partnerSelected=this.partnerSelected||this.state.active.id", "this.partnerSelected=this.partnerSelected||this.state.active.uid!")
start=s.index('  private hatchReveal()');end=s.index('  private goHome()',start)
s=s[:start]+'''  private hatchReveal(){
    const r=this.state.pendingHatch;if(!r){this.hatchery();return;}const p=petEntry(this.state,r.uid!),tint=r.rarity==='SSR'?'#b78022':r.rarity==='SR'?'#8b61bb':'#46976e';
    const c=this.overlay('新伙伴破壳啦！',520);this.panel(c,0,83,260,196,r.rarity==='SSR'?'#fff0ca':r.rarity==='SR'?'#f0e8fb':'#e6f3e8',28);
    const art=this.petImage(c,p,0,85,165);art.setScale(.5,.5,1);tween(art).to(.3,{scale:Vec3.ONE},{easing:'backOut'}).start();
    this.text(c,rarityName(p.rarity)+' · '+petName(p)+' '+sexSymbol(p.sex),0,-34,24,tint,330,36).isBold=true;
    this.text(c,'HP '+petBaseHP(p)+'    ⚔ '+p.faces.join(' / '),0,-70,16,C.ink,320,28);
    this.text(c,petSkills(p).map(code=>SKILLS[code][0]).join(' · '),0,-116,16,tint,310,68);
    this.text(c,'已作为独立伙伴收入收藏',0,-175,14,C.muted,320,30);
    this.button(c,'hatch-ack','收下惊喜',0,-224,304,44,()=>{this.state=acknowledgeHatch(this.state);this.save();this.hatchery();},'#dba441',true,20);
  }
  private qualityDetail(key:string,rarity:EggRarity,page:number){
    const p=petEntry(this.state,key),codes=petSkills(p),c=this.overlay(petName(p)+' '+sexSymbol(p.sex),550);
    this.petImage(c,p,-103,153,104);this.text(c,PETS[p.id].type+' · '+rarityName(p.rarity),55,184,18,C.ink,190,28);
    this.text(c,'HP '+petBaseHP(p),55,151,17,C.ink,190,28);this.text(c,'⚔ '+(p.baseFaces||p.faces).join(' / '),55,120,15,C.muted,190,27);
    codes.forEach((code,i)=>{const y=60-i*43;this.panel(c,0,y,320,39,i%2?'#eef4f3':'#f8f4e9',9);this.text(c,SKILLS[code][0],-102,y,13,'#487d70',100,32).isBold=true;this.text(c,SKILLS[code][1],54,y,11,C.muted,196,36);});
    this.text(c,'各技能自动触发 · 每场限一次',0,-213,12,C.muted,310,25);
    this.button(c,'quality-back','返回伙伴',0,-246,302,36,()=>{this.partnerPage=page;this.render();},C.blue,true,16);
  }

'''+s[end:]
rep("'已收集 '+s.owned.length+' / '+PET_IDS.length", "'已拥有 '+s.pets!.length+' 只'")
rep("'伙伴收藏  '+this.state.owned.length+' / '+PET_IDS.length", "'伙伴收藏  '+this.state.pets!.length+' 只'")
rep("for(let i=0;i<3;i++){const x=(i-1)*120,p=this.panel(this.root,x,b+64,110,64,'#e8e5d9',14);this.menuIcon(p,'lock',-28,3,24,'#a4ac9b');this.text(p,'待开放',15,2,13,'#919b90',64,25);}", "const breed=this.button(this.root,'home-breed','',-120,b+64,110,64,()=>this.breedingUI(),'#b57b9b');this.text(breed,'♀ ♂',0,11,22,'#fff2d9',104,30);this.text(breed,s.breeding?(Date.now()>=s.breeding.readyAt?'领取宠物蛋':'交配中'):'交配屋',0,-16,14,'#ffffff',104,25);\n    for(let i=1;i<3;i++){const x=(i-1)*120,p=this.panel(this.root,x,b+64,110,64,'#e8e5d9',14);this.menuIcon(p,'lock',-28,3,24,'#a4ac9b');this.text(p,'待开放',15,2,13,'#919b90',64,25);}")
rep('PM v0.8.1','PM v0.9.0')
start=s.index('  private partnersUI()');end=s.index('  private cancelPartyDrag',start)
s=s[:start]+'''  private partnersUI(){
    const s=this.state,H=this.h,top=H/2,b=-H/2,selected=this.partnerSelected||s.active.uid!,selectedPet=petEntry(s,selected);
    this.panel(this.root,0,0,390,H,'#edf4f5',0);this.sectionHeader('伙伴图鉴','每只独立收藏 · 拖到上方换队');
    const slots=homeParty(s),teamY=top-150;
    slots.forEach((key,i)=>{const x=(i-1)*120,p=this.button(this.root,'team-slot-'+i,'',x,teamY,112,110,()=>{if(key){this.partnerSelected=key;this.render();}},i===0?'#fff0d5':'#deedf2'),entry=key?petEntry(s,key):null;
      if(entry)this.petImage(p,entry,0,4,64);else this.menuIcon(p,'lock',0,6,31,'#9aacb0');
      this.text(p,i===0?'出战':'候补 '+i,0,40,12,i===0?'#b17a2d':'#63899a',100,22).isBold=true;this.text(p,entry?petName(entry)+sexSymbol(entry.sex):'空位',0,-38,12,C.ink,104,24);
      this.partyDropNodes.push(p);if(key)this.bindPartyDrag(p,key);
    });
    const filterY=top-232;this.text(this.root,'伙伴 '+s.pets!.length+' 只',-101,filterY,16,C.ink,170,28).isBold=true;
    this.button(this.root,'partner-filter',this.partnerOwnedOnly?'我的伙伴 ▾':'形态图鉴 ▾',119,filterY,114,32,()=>{this.partnerOwnedOnly=!this.partnerOwnedOnly;this.partnerPage=0;this.render();},'#dbe9ef',true,13);
    const keys=this.partnerOwnedOnly?s.pets!.map(p=>p.uid!):PET_IDS.flatMap(id=>RARITIES.map(r=>id+':'+r)),pages=Math.max(1,Math.ceil(keys.length/6));this.partnerPage=Math.min(this.partnerPage,pages-1);
    const gridHeight=Math.min(148,Math.max(90,(H-510)/2)),gridTop=top-258-gridHeight/2,spacing=gridHeight+12;
    keys.slice(this.partnerPage*6,this.partnerPage*6+6).forEach((key,i)=>{const entry=petEntry(s,key),x=(i%3-1)*120,y=gridTop-Math.floor(i/3)*spacing,owned=s.pets!.some(p=>p.uid===key),discovered=s.pets!.some(p=>formKey(p)===formKey(entry)),chosen=key===selected;
      const p=this.button(this.root,'pet-'+key,'',x,y,112,gridHeight,()=>{this.partnerSelected=key;this.render();},chosen?'#fff1d6':'#ffffff'),petSize=Math.min(96,gridHeight-34);
      const art=this.petImage(p,entry,0,4,petSize);if(!discovered)art.getComponent(Sprite)!.grayscale=true;
      this.text(p,petName(entry)+sexSymbol(entry.sex),0,-gridHeight/2+14,12,C.ink,108,22);this.text(p,rarityName(entry.rarity),31,gridHeight/2-13,10,entry.rarity==='SSR'?'#b78022':entry.rarity==='SR'?'#8b61bb':'#46976e',48,18);
      if(chosen){const g=p.getComponent(Graphics)!;g.lineWidth=2;g.strokeColor=color('#dda841');g.roundRect(-55,-gridHeight/2+1,110,gridHeight-2,13);g.stroke();}
      if(owned)this.bindPartyDrag(p,key);
    });
    this.button(this.root,'collection-prev','‹',-119,b+212,66,30,()=>{this.partnerPage=Math.max(0,this.partnerPage-1);this.render();},'#dbe9ef',this.partnerPage>0,22);
    this.text(this.root,(this.partnerPage+1)+' / '+pages,0,b+212,13,C.muted,94,25);
    this.button(this.root,'collection-next','›',119,b+212,66,30,()=>{this.partnerPage=Math.min(pages-1,this.partnerPage+1);this.render();},'#dbe9ef',this.partnerPage<pages-1,22);
    const owned=s.pets!.some(p=>p.uid===selected),detail=this.panel(this.root,0,b+102,390,186,'#fffdf5',22);
    this.text(detail,petName(selectedPet)+' '+sexSymbol(selectedPet.sex),-82,67,19,C.ink,190,29).isBold=true;
    this.text(detail,PETS[selectedPet.id].type+' · '+rarityName(selectedPet.rarity),105,67,13,'#889762',144,26);
    const faces=(s.active.uid===selected?s.active:s.reserve?.uid===selected?s.reserve:s.runRoster?.[selected])?.faces||selectedPet.faces;
    this.text(detail,'HP '+petBaseHP(selectedPet)+'   /   ⚔ '+faces.join(' · '),-40,34,14,C.muted,270,25);
    this.button(detail,'partner-skill','技能 ›',135,34,72,28,()=>this.qualityDetail(selected,selectedPet.rarity||'normal',this.partnerPage),'#e4eef1',true,12);
    this.text(detail,skillFor(selectedPet).name,0,3,13,C.muted,356,25);
    const hint=this.panel(detail,0,-43,350,48,s.phase==='battle'?'#e5e9e9':'#e1f1e9',14);
    this.partyDragHint=this.text(hint,s.phase==='battle'?'战斗中 · 队伍已锁定':owned?'拖动宠物 → 上方出战 / 候补位':'通过孵蛋获得此形态',0,0,14,s.phase==='battle'?C.muted:'#45856c',336,38);
    this.fx=this.makeNode(this.root,'party-effects',0,0,390,H);
  }
'''+s[end:]
rep('private bindPartyDrag(n:Node,id:PetId)', 'private bindPartyDrag(n:Node,id:string)')
rep('!this.state.owned.includes(id)', '!this.state.pets!.some(p=>p.uid===id)')
rep('this.text(d.ghost,PETS[id].name', 'this.text(d.ghost,petName(petEntry(this.state,id))')
p.write_text(s,encoding='utf-8')
