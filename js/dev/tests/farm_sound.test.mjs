import assert from 'node:assert/strict';
import { createFarmSound, renderFarmCue } from '../../fx/farm_sound.js';
const starts = [], writes = [];
let contexts = 0;
const fakeGain = { gain: { value: 0 }, connect() {} };
function makeContext() {
  contexts++;
  return {
    state: 'suspended',
    currentTime: 1,
    sampleRate: 24000,
    createGain: () => fakeGain,
    resume() { this.state = 'running'; },
    createBuffer: (_, length) => ({ getChannelData: () => new Float32Array(length) }),
    createBufferSource: () => ({ connect() {}, start() { starts.push(this.buffer); } })
  };
}
const muted = createFarmSound({ makeContext, writePreference: s => writes.push(s) });
muted.activate(); muted.play('water');
assert.equal(contexts, 0);
assert.deepEqual(starts, []);
muted.setEnabled(true); muted.play('plant'); muted.play('water'); muted.play('water'); muted.play('sale'); muted.play('sale');
assert.equal(contexts, 1);
assert.equal(starts.length, 4);
assert.equal(starts[2], starts[3]);
muted.setEnabled(false); muted.play('water');
assert.equal(starts.length, 4);
assert.equal(fakeGain.gain.value, 0);
assert.deepEqual(writes, ['on','off']);
const restored = createFarmSound({ makeContext, readPreference: () => 'on' });
restored.play('sale');
assert.equal(contexts, 1);
restored.activate(); restored.play('sale');
assert.equal(contexts, 2);
assert.equal(starts.length, 5);
for (const name of ['plant','water','sale']) {
  for (const rate of [24000,48000]) {
    const samples = renderFarmCue(name,rate);
    const peak = Math.max(...samples.map(Math.abs));
    assert.ok(peak > .08 && peak < .85 && samples.length / rate <= .24);
    assert.equal(samples[0], 0); assert.ok(samples.at(-1) === 0);
  }
}
assert.equal(renderFarmCue('toString', 24000), null);
console.log('Original farm cues: silent default, gesture unlock, immediate mute, buffer reuse, bounded levels.');
