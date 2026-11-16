/** Optical fit for wide late-game art. All values are logical UI pixels, not texture pixels. */
export interface BattlePortrait {width:number;height:number;feetX:number;feetY:number;size:number}
export function fitBattlePair(player:BattlePortrait,enemy:BattlePortrait,playerGround:number,enemyGround:number,ceiling:number){
  const fit=(p:BattlePortrait,minimumHeight:number,maxHeight:number)=>{
    const aspect=p.width/p.height,original=p.size/Math.max(p.width,p.height);
    let scale=Math.max(original,Math.min(original*1.55,minimumHeight/p.height));
    scale=Math.min(scale,maxHeight/p.height,326/p.width);
    return {w:p.width*scale,h:p.height*scale,size:Math.max(p.width,p.height)*scale,p};
  };
  const a=fit(player,120,Math.min(280,ceiling-playerGround)),b=fit(enemy,78,Math.max(70,ceiling-enemyGround-68));
  // Reserve a gap even at the maximum idle-breathing scale. Never crop ears/wings or stretch art.
  if(a.w+b.w>346){const scale=346/(a.w+b.w);for(const v of [a,b]){v.w*=scale;v.h*=scale;v.size*=scale;}}
  return {player:{size:a.size,x:-181+a.p.feetX*a.w},enemy:{size:b.size,x:181-(1-b.p.feetX)*b.w}};
}
