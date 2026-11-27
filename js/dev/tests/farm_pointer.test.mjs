import assert from 'node:assert/strict';
import { installFarmPointerHandlersAction, shouldUseFarmCellClick, stopFarmPointerInteractionAction } from '../../ui/farm_pointer_bindings.js';

const grid = new EventTarget();
const doc = new EventTarget();
doc.getElementById = () => grid;
globalThis.document = doc;
const state = { active: false, pointerId: null, processedIndices: new Set() };
const actions = [];
let blocked = false;
const send = (target, type, pointerId, index, pointerType = 'touch', isPrimary = true, button = 0) => {
  const event = Object.assign(new Event(type, { cancelable: true }), { pointerId, index, pointerType, isPrimary, button });
  target.dispatchEvent(event);
  return event;
};
installFarmPointerHandlersAction({
  isFarmActionBlocked: () => blocked,
  getGridIndexFromPointerEvent: e => e.index,
  farmPointerState: state,
  applyGridActionForIndex: (index, { mode }) => actions.push([index, mode]),
  stopFarmPointerInteraction: () => stopFarmPointerInteractionAction(state)
});

send(grid, 'pointerdown', 11, 0);
assert.equal(send(grid, 'pointerdown', 22, 2, 'touch', false).defaultPrevented, true);
send(grid, 'pointerdown', 33, 3, 'mouse');
send(doc, 'pointermove', 22, 2);
send(doc, 'pointerup', 22, 2);
send(doc, 'pointercancel', 33);
assert.equal(state.pointerId, 11);
send(doc, 'pointermove', 11, 1);
send(doc, 'pointermove', 11, 1);
send(doc, 'pointerup', 11, 1);
assert.equal(state.active, false);
assert.deepEqual(actions, [[0, 'tap'], [1, 'drag']]);

send(grid, 'pointerdown', 22, 2, 'touch', false);
assert.equal(state.active, false);
send(grid, 'pointerdown', 55, 4, 'mouse', true, 2);
assert.equal(state.active, false);
send(grid, 'pointerdown', 55, 4, 'mouse');
send(grid, 'lostpointercapture', 55, 4, 'mouse');
assert.equal(state.active, false);
send(grid, 'pointerdown', 66, 5);
send(doc, 'pointercancel', 66);
assert.equal(state.active, false);
send(grid, 'pointerdown', 77, 6);
blocked = true;
send(doc, 'pointermove', 77, 7);
assert.equal(state.active, false);
assert.deepEqual(actions.slice(2), [[4, 'tap'], [5, 'tap'], [6, 'tap']]);

assert.equal(shouldUseFarmCellClick({ detail: 1, pointerType: 'touch' }, true), false);
assert.equal(shouldUseFarmCellClick({ detail: 1 }, true), false);
assert.equal(shouldUseFarmCellClick({ detail: 0, pointerType: 'mouse' }, true), false);
assert.equal(shouldUseFarmCellClick({ detail: 0, pointerType: '' }, true), true);
assert.equal(shouldUseFarmCellClick({ detail: 1 }, false), true);
console.log('Farm pointer ownership, stop/abort paths, and keyboard/assistive click fallbacks passed.');
