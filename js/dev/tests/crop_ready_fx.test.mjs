import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCropReadyFx } from '../../ui/crop_ready_fx.js';

function rig() {
  const state = { player: { day: 3 }, activeFarmId: 1, gridItems: [1, 2], gridPlacedMeta: [{ instanceId: 'a' }, { instanceId: 'b' }] };
  const frames = [], cueLog = [];
  let visible = false, reduced = false, generation = 0;
  const effects = createCropReadyFx({
    state,
    frame: (run) => frames.push(run),
    isFarmVisible: () => visible,
    isReduceMotion: () => reduced,
    getCell: (index) => ({
      dataset: { fieldCrop: 'ready' },
      classList: { add: (name) => cueLog.push([state.activeFarmId, index, generation, name]) }
    })
  });
  return { ...effects, state, frames, cueLog, render: () => generation++, show: () => visible = true,
    reduce: () => reduced = true, allowMotion: () => reduced = false,
    flush: () => frames.splice(0).forEach(run => run()) };
}

test('the Gazette can outlast a render; only current cells pulse, once', () => {
  const r = rig();
  r.queue(0, 1);
  r.queue(1, 2);
  r.schedule();
  r.schedule();
  assert.equal(r.frames.length, 1);
  r.flush();
  assert.deepEqual(r.cueLog, []);
  r.render();
  r.render();
  r.show();
  r.schedule();
  r.flush();
  r.render();
  r.schedule();
  r.flush();
  assert.deepEqual(r.cueLog, [[1, 0, 2, 'crop-just-ready'], [1, 1, 2, 'crop-just-ready']]);
});

test('farm switches isolate cues and a replaced crop does not inherit one', () => {
  const r = rig();
  r.queue(0, 1);
  r.state.activeFarmId = 2;
  r.queue(1, 2);
  r.show();
  r.schedule();
  r.flush();
  r.state.activeFarmId = 1;
  r.state.gridPlacedMeta[0] = { instanceId: 'replacement' };
  r.schedule();
  r.flush();
  assert.deepEqual(r.cueLog, [[2, 1, 0, 'crop-just-ready']]);
});

test('day changes discard stale cues and reduced motion never defers a replay', () => {
  const r = rig();
  r.queue(0, 1);
  r.show();
  r.state.player.day++;
  r.schedule();
  r.flush();
  r.queue(0, 1);
  r.reduce();
  r.schedule();
  r.flush();
  r.allowMotion();
  r.schedule();
  r.flush();
  assert.deepEqual(r.cueLog, []);
});
