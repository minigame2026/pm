from pathlib import Path
p=Path('D:/game/PM/checks/model.test.cjs');s=p.read_text(encoding='utf-8-sig')
def group(name,replacement):
 global s
 start=s.index("test('"+name);end=s.find("\ntest('",start+1)
 if end<0:end=s.index('\nconsole.log(passed',start)
 s=s[:start]+replacement+'\n'+s[end:]
group('First new creature recruitment guaranteed; invitation persists collection',"test('Victory continues without offering enemy recruitment',()=>{let s=act(fresh(5),'challenge');s.enemy='bud';s.enemyHP=1;const count=s.pets.length;s=act(act(s,'attack'),'take');assert.equal(s.phase,'encounter');assert.equal(s.step,2);assert.equal(s.pets.length,count);assert.ok(!s.owned.includes('bud'));assert.equal(act(s,'invite'),s);});")
group('Collection-only capture keeps team; can equip before battle',"test('Collection can equip an owned individual but is locked during battle',()=>{let s=fresh(6,['fox','turtle','bud']);const key=s.pets.find(p=>p.id==='bud').uid;s=equipReserve(s,key);assert.equal(s.reserve.id,'bud');s=act(s,'challenge');assert.equal(equipReserve(s,s.pets.find(p=>p.id==='turtle').uid),s);});")
s=s.replace("let s=fresh(32);s.phase=phase;s.owned.push('bud');","let s=fresh(32,['fox','turtle','bud']);s.phase=phase;")
s=s.replace("s=equipReserve(s,'bud');","s=equipReserve(s,s.pets.find(p=>p.id==='bud').uid);")
s=s.replace("const s=fresh(10);s.phase='reward';s.owned.push('bud');assert.equal(equipReserve(s,'bud').reserve.id,'bud');s.phase='battle';assert.equal(equipReserve(s,'bud'),s);", "const s=fresh(10,['fox','turtle','bud']),key=s.pets.find(p=>p.id==='bud').uid;s.phase='reward';assert.equal(equipReserve(s,key).reserve.id,'bud');s.phase='battle';assert.equal(equipReserve(s,key),s);")
s=s.replace('and preserves recruitment','and continues without recruitment').replace("assert.equal(n.phase,'recruit');", "assert.equal(n.phase,'encounter');")
s=s.replace("let s=fresh(23);s.owned.push('bud');", "let s=fresh(23,['fox','turtle','bud']);")
s=s.replace("moduleObj.exports.selectActive(s,id)", "moduleObj.exports.selectActive(s,s.pets.find(p=>p.id===id).uid)")
s=s.replace("moduleObj.exports.selectActive(s,'turtle')", "moduleObj.exports.selectActive(s,s.pets.find(p=>p.id==='turtle').uid)")
s=s.replace('Boss victory at stage 10 adds boss to collection and opens nest', 'Boss victory opens nest without adding a boss to collection')
s=s.replace("assert.ok(n.owned.includes('dragon'));", "assert.ok(!n.owned.includes('dragon'));").replace("assert.ok(restarted.owned.includes('dragon'));", "assert.ok(!restarted.owned.includes('dragon'));")
group('New recruit stays in all three quick slots across switches, reload and restart',"test('Owned individual team slots survive swaps, reload and restart',()=>{let s=fresh(112,['fox','turtle','otter']);s.hpRatio=.43;const key=id=>s.pets.find(p=>p.id===id).uid;s=moduleObj.exports.assignPartySlot(s,key('otter'),2);const members=moduleObj.exports.homeParty(s).slice().sort().join(),enemy=s.enemy,seed=s.seed;for(const id of ['otter','fox','turtle','fox']){s=moduleObj.exports.selectActive(s,key(id));assert.equal(moduleObj.exports.homeParty(s).slice().sort().join(),members);assert.equal(s.hpRatio,.43);assert.equal(s.enemy,enemy);assert.equal(s.seed,seed);s=restore(JSON.stringify(s));assert.ok(s);}const n=moduleObj.exports.restartRun(s,66);same(moduleObj.exports.homeParty(n),moduleObj.exports.homeParty(s));});")
p.write_text(s,encoding='utf-8')
