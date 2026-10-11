import test from 'node:test';
import assert from 'node:assert/strict';
import {skyAddress, normalize, kpParts, kpAt} from '../vedic-astrology/learning.mjs';

test('practice Moon at 45 degrees is Taurus, Rohini, pada two', () => {
  assert.deepEqual(skyAddress(45), {angle:45,sign:1,star:3,pada:2});
});
test('sign boundaries advance and the last position wraps to Aries', () => {
  for (let i=1;i<12;i++) {
    assert.equal(skyAddress(i*30-.000001).sign,i-1);
    assert.equal(skyAddress(i*30).sign,i);
  }
  assert.deepEqual(skyAddress(360), skyAddress(0));
  assert.equal(skyAddress(-1).star,26);
  assert.equal(skyAddress(719).pada,4);
  assert.throws(()=>normalize(NaN),TypeError);
  assert.throws(()=>normalize(Infinity),TypeError);
});
test('each nakshatra begins with pada one, including fractional boundaries', () => {
  for (let i=1;i<27;i++) {
    const boundary=i*40/3;
    assert.equal(skyAddress(boundary-.000001).star,i-1);
    assert.equal(skyAddress(boundary).star,i);
    assert.equal(skyAddress(boundary).pada,1);
  }
});
test('Ashwini sub boundaries use Vimshottari proportions', () => {
  const parts=kpParts();
  assert.equal(parts.length,9);
  assert.equal(parts[0].end,7/9);
  assert.equal(parts[1].end,3);
  assert.equal(parts.at(-1).end,40/3);
  assert.equal(kpAt(7/9-.000001).lord,0);
  assert.equal(kpAt(7/9).lord,1);
  assert.equal(kpAt(3).lord,2);
  assert.equal(kpAt(13.332).lord,8);
});
test('nakshatra lord starts each sequence and spans exactly one nakshatra', () => {
  const bharani=kpParts(1);
  assert.equal(bharani[0].lord,1);
  assert.equal(bharani[0].end,20/9);
  for (let i=0;i<27;i++) {
    const parts=kpParts(i);
    assert.equal(new Set(parts.map(p=>p.lord)).size,9);
    assert.equal(parts.at(-1).end,40/3);
  }
  assert.throws(()=>kpAt(40/3),RangeError);
  assert.throws(()=>kpAt(-1),RangeError);
  assert.throws(()=>kpParts(27),RangeError);
});
