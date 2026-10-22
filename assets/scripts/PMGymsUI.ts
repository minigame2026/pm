import { GYMS, MAPS, gymUnlocked, enterGym, retreatExpedition } from './PMModel';

export function drawGyms(g:any){
 const s=g.state,badges=s.gymBadges||[];
 const c=g.fullPage('道馆',badges.length+' / 9',()=>drawGyms(g)),{top,bottom,height}=g.pageBounds(c);
 const cellH=Math.min(148,(height-105)/3),start=top-12-cellH/2;
 GYMS.forEach((gym,i)=>{
  const done=badges.includes(i),active=s.gymRun===i&&s.expedition&&!['won','lost'].includes(s.phase),unlocked=gymUnlocked(s,i)||active;
  const n=g.button(c,'gym-'+i,'',(i%3-1)*120,start-Math.floor(i/3)*(cellH+8),112,cellH,()=>{
   if(done){g.pageHelp(gym.types.join(' · ')+'\nHP +10%   ⚔ +10%');return;}
   if(!unlocked){g.pageHelp(MAPS[i].name+'\n通关后解锁');return;}
   if(active){g.screen='game';g.render();return;}
   const begin=async()=>{if(g.busy)return;g.busy=true;try{await g.loadRegionArt(i);const base=retreatExpedition(g.state),next=enterGym(base,i);if(next.gymRun!==i)return;g.state=next;g.screen='game';g.save();g.render();}finally{g.busy=false;}};
   if(s.expedition&&!['won','lost'].includes(s.phase)){
    const p=g.overlay('重新出发？',224);g.text(p,'当前挑战进度将重置',0,32,16,'#647f95',310,42);
    g.button(p,'gym-cancel','返回',-80,-49,145,48,()=>drawGyms(g),'#dce8ed');g.button(p,'gym-enter','开始挑战',80,-49,145,48,begin,'#c78a4c');
   }else void begin();
  },done?'#f7e9b9':unlocked?'#ffffff':'#e1e7eb');
  const badge=g.panel(n,0,cellH*.13,76,48,done?'#e9bf54':'#eaf0f3',20);
  gym.types.forEach((type,j)=>g.typeIcon(badge,type,(j-.5)*33,0,29));
  g.text(n,(done?'✓ ':active?'› ':!unlocked?'🔒 ':'')+String(i+1).padStart(2,'0'),0,cellH/2-14,12,'#7e6335',80,21).isBold=true;
  g.text(n,gym.name,0,-cellH*.15,15,'#183852',106,26).isBold=true;
  g.text(n,gym.types.join(' · '),0,-cellH*.33,12,'#647f95',106,24);
 });
 g.text(c,'徽章：HP +10% · ⚔ +10%',0,bottom+24,14,'#647f95',350,42);
}
