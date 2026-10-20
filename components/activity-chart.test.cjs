const test=require('node:test'),assert=require('node:assert/strict');
const{normalize,pathFor}=require('./activity-chart.js');
const fixture={time_zone:'Asia/Kolkata',updated_at:'2026-10-21T00:00:00Z',days:[{date:'2026-10-19',all:0,ios:0,android:0},{date:'2026-10-20',all:8,ios:6,android:5}]};
test('aggregate stays independent of platform totals',()=>assert.equal(normalize(fixture).days[1].all,8));
test('missing activity remains missing and breaks the plotted line',()=>{const g=pathFor([1,null,2]);assert.equal(g.points[1],null);assert.equal((g.path.match(/M/g)||[]).length,2);assert.equal(g.path.includes('NaN'),false);});
test('zero is a real point, not a missing value',()=>{assert.equal(pathFor([0]).points[0].value,0);assert.equal(normalize(fixture).days[0].all,0);});
test('duplicate dates, malformed values and oversized series are refused',()=>{for(const x of [{...fixture,days:[fixture.days[1],fixture.days[0]]},{...fixture,days:[{...fixture.days[0],all:NaN}]},{...fixture,days:Array(367).fill(fixture.days[0])},{...fixture,days:[{...fixture.days[0],date:'2026-02-30'}]}])assert.throws(()=>normalize(x));});
