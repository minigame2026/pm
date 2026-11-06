/** PC-only landscape paintings. Zero-based map ids match PMModel.MAPS. */
export const PC_MAP_SCENES=Array.from({length:12},(_,i)=>'pc-map-'+String(i+1).padStart(2,'0')+'-v1');
export const PC_RAID_SCENE='pc-raid-molten-v1';
export function pcMapScene(mapId:number){const i=Number.isFinite(mapId)?Math.max(0,Math.min(11,Math.floor(mapId))):0;return PC_MAP_SCENES[i];}
/** Native landscape cover, centered on the existing 1600x900 composition. No portrait-horizon offset. */
export function pcSceneCover(sourceWidth:number,sourceHeight:number,viewportWidth:number,viewportHeight:number){
  const scale=Math.max(viewportWidth/sourceWidth,viewportHeight/sourceHeight);
  return {width:sourceWidth*scale,height:sourceHeight*scale,x:800,y:-450};
}
