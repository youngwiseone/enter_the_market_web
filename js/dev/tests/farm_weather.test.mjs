import test from 'node:test';
import assert from 'node:assert/strict';
import { getMiningEnergyPerHit, getMiningWeatherReadout } from '../../sim/farm_weather.js';

test('the Pickaxe quotes the actual current and forecast mining costs on either farm', () => {
  for (const base of [1, 5]) {
    assert.equal(getMiningEnergyPerHit(base, 'clear'), base);
    assert.equal(getMiningEnergyPerHit(base, 'rain'), base + 1);
    assert.equal(getMiningWeatherReadout(base, 'clear', 'clear'), `Mine: ${base} energy per hit`);
    assert.equal(getMiningWeatherReadout(base, 'clear', 'rain'), `Mine: ${base} energy per hit · ${base + 1} in tomorrow’s rain`);
    assert.equal(getMiningWeatherReadout(base, 'rain', 'rain'), `Mine: ${base + 1} energy per hit · Muddy ground`);
  }
});
