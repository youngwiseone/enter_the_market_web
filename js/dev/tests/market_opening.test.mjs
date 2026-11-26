import assert from 'node:assert/strict';
import { getMarketOpeningMode } from '../../ui/market_opening.js';
assert.equal(getMarketOpeningMode(() => null), 'new');
assert.equal(getMarketOpeningMode((key) => key === 'player' ? { day: 1 } : null), null);
assert.equal(getMarketOpeningMode((key) => key === 'farms' ? {} : null), null);
assert.equal(getMarketOpeningMode((key) => key === 'player' ? { day: 42 } : null, '?opening=1'), 'returning');
assert.equal(getMarketOpeningMode(() => { throw Error('storage blocked'); }), null);
