import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getFarmArrowTarget, prepareFarmKeyboard } from '../../ui/farm_keyboard.js';

test('arrows follow the 7-column field without wrapping at edges', () => {
  assert.equal(getFarmArrowTarget(24, 'ArrowLeft', 7, 49), 23);
  assert.equal(getFarmArrowTarget(24, 'ArrowDown', 7, 49), 31);
  assert.equal(getFarmArrowTarget(7, 'ArrowLeft', 7, 49), 7);
  assert.equal(getFarmArrowTarget(13, 'ArrowRight', 7, 49), 13);
  assert.equal(getFarmArrowTarget(6, 'ArrowUp', 7, 49), 6);
  assert.equal(getFarmArrowTarget(42, 'ArrowDown', 7, 49), 42);
  assert.equal(getFarmArrowTarget(24, 'Tab', 7, 49), null);
});

test('one plot tab stop follows focus, restores across redraw, and does not steal tab or trigger repeats', () => {
  const outside = {};
  const doc = { activeElement: outside, querySelector: () => null };
  const grid = { ownerDocument: doc, children: [], dataset: {}, offsetParent: {},
    contains(node) { return this.children.includes(node); } };
  const hits = [];
  function render(farm = 1) {
    const keyboard = prepareFarmKeyboard(grid, { farm, preferred: -1, fallback: 24, count: 49, columns: 7,
      activate: index => hits.push(index) });
    grid.children = [];
    for (let i = 0; i < 49; i++) {
      const events = {}, attrs = {};
      const cell = { classList: { contains: name => name === 'grid-cell' },
        setAttribute: (key, value) => attrs[key] = value,
        addEventListener: (key, fn) => events[key] = fn,
        focus() { doc.activeElement = cell; events.focus(); },
        send(key, repeat = false) {
          const evt = { key, repeat, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {} };
          events.keydown(evt);
          return evt;
        } };
      keyboard.bind(cell, i, 'Plot ' + i);
      grid.children.push(cell);
      assert.equal(attrs.role, 'button');
    }
    keyboard.restore();
  }
  render();
  assert.equal(doc.activeElement, outside);
  grid.children[24].focus();
  doc.activeElement.send('ArrowRight');
  assert.equal(doc.activeElement, grid.children[25]);
  assert.deepEqual(grid.children.flatMap((cell, i) => cell.tabIndex === 0 ? [i] : []), [25]);
  doc.activeElement.send(' ');
  doc.activeElement.send(' ', true);
  assert.deepEqual(hits, [25]);
  assert.equal(doc.activeElement.send('Tab').defaultPrevented, undefined);
  render();
  assert.equal(doc.activeElement, grid.children[25]);
  doc.activeElement = outside;
  render(2);
  assert.equal(doc.activeElement, outside);
  assert.equal(grid.children[24].tabIndex, 0);
  render(1);
  assert.equal(grid.children[25].tabIndex, 0);
  assert.equal(doc.activeElement, outside);
});
