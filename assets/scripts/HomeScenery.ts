export type HomePeriod='dawn'|'morning'|'afternoon'|'dusk'|'evening'|'midnight';
// Cosmetic local-clock selection only. Timed rewards continue using TrustedClock.
export function homePeriod(hour=new Date().getHours()):HomePeriod {
  if(hour>=4&&hour<7)return 'dawn';
  if(hour>=7&&hour<12)return 'morning';
  if(hour>=12&&hour<17)return 'afternoon';
  if(hour>=17&&hour<19)return 'dusk';
  if(hour>=19&&hour<23)return 'evening';
  return 'midnight';
}
export const homeArtKey=(period:HomePeriod)=>period==='afternoon'?'home-camp-v1':'home-'+period+'-v1';
