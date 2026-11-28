import { describeMarketRange } from '../sim/market_bulletin.js?v=87';

export function renderMarketBulletin(panel, moves, day) {
  const title = panel?.querySelector('h2');
  const list = panel?.querySelector('ul');
  const headline = panel?.querySelector('[data-gazette-headline]');
  const rangeNote = panel?.querySelector('.market-bulletin-range');
  if (!title || !list || !headline) return;
  title.textContent = `The Market Gazette · Day ${day}`;
  list.replaceChildren();
  const lead = moves?.[0];
  if (rangeNote) {
    const text = lead ? describeMarketRange(lead.priorRange, lead.current) : '';
    rangeNote.textContent = text;
    rangeNote.hidden = !text;
  }
  if (!lead) {
    headline.textContent = 'Prices hold steady at dawn.';
    return;
  }
  headline.textContent = lead.changeCents > 0
    ? `${lead.itemName} opens higher`
    : lead.changeCents < 0 ? `${lead.itemName} opens lower` : `${lead.itemName} holds its opening price`;
  const money = (value) => `$${value.toFixed(2)}`;
  const signedCents = (value) => `${value < 0 ? '−' : '+'}${money(Math.abs(value) / 100)}`;
  moves.forEach((move) => {
    const row = document.createElement('li');
    const name = document.createElement('strong');
    name.textContent = move.itemName;
    const prices = document.createElement('span');
    prices.textContent = `${money(move.previous)} → ${money(move.current)}`;
    const cause = document.createElement('small');
    cause.textContent = `Cycle & weather ${signedCents(move.cycleCents)} · Roll ${signedCents(move.rollCents)}`;
    row.append(name, prices, cause);
    list.append(row);
  });
}

const renderedIssues = new WeakMap();

export function renderCurrentGazette(disclosure, issue) {
  if (!disclosure) return;
  disclosure.hidden = !issue;
  if (renderedIssues.get(disclosure) === issue) return;
  renderedIssues.set(disclosure, issue);
  disclosure.open = false;
  if (issue) renderMarketBulletin(disclosure.querySelector('.market-bulletin'), issue.marketBulletin, Number(issue.day) + 1);
}
