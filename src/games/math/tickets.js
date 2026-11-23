// Ported from Taiwan Train Math 1.11.0 (src/tickets.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
const SMALL_STOCKS = [
  [1, 1, 1, 1, 2, 5],
  [1, 1, 1, 2, 2, 5],
  [1, 1, 2, 2, 2, 5],
];
const LEVELS = {
  small: { max: 5, count: 1, stock: SMALL_STOCKS[0], denominations: [1, 2, 5] },
  medium: { max: 10, count: 2, stock: [1, 1, 1, 1, 2, 2, 5, 5], denominations: [1, 2, 5] },
  large: { max: 20, count: 2, stock: [1, 1, 1, 2, 2, 5, 5, 10], denominations: [1, 2, 5, 10] },
};
const DESTINATIONS = [
  { id: "seaside", destination: "海風站", icon: "🌊" },
  { id: "forest", destination: "森林站", icon: "🌲" },
  { id: "mountain", destination: "山谷站", icon: "⛰" },
  { id: "harbour", destination: "小港站", icon: "⚓" },
  { id: "garden", destination: "花園站", icon: "🌼" },
  { id: "town", destination: "鐘樓站", icon: "◷" },
];
const escHtml = value => String(value).replace(/[&<>"']/g, character =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
function cfgFor(level) {
  if (!Object.hasOwn(LEVELS, level)) throw new Error("Unknown tickets level");
  return LEVELS[level];
}
function roll(length, rng) {
  const value = rng();
  return Number.isFinite(value) ? Math.max(0, Math.min(length - 1, Math.floor(value * length))) : 0;
}
function shuffled(values, rng) {
  const result = [...values];
  for (let at = result.length - 1; at > 0; at--) {
    const other = roll(at + 1, rng);
    [result[at], result[other]] = [result[other], result[at]];
  }
  return result;
}
const banks = new Map();
function stockTemplates(level) { return level === "small" ? SMALL_STOCKS : [cfgFor(level).stock]; }
function priceBank(level, variant = 0) {
  const key = `${level}:${variant}`;
  if (banks.has(key)) return banks.get(key);
  const cfg = cfgFor(level), totals = Array(cfg.count).fill(0);
  const stock = stockTemplates(level)[variant];
  const counts = Array.from({ length: cfg.count }, () => Array(cfg.denominations.length).fill(0));
  const compositions = new Map();
  function distribute(coin, combined) {
    if (coin === stock.length) {
      if (totals.some(total => total < 2)) return;
      const key = totals.join(","), shape = counts.map(values => values.join(",")).join(";");
      const found = compositions.get(key) || new Set();
      // Two genuinely different face-value compositions suffice. Swapping
      // two identical one-unit tokens never counts as an alternative answer.
      if (found.size < 2) found.add(shape);
      compositions.set(key, found);
      return;
    }
    distribute(coin + 1, combined);
    const value = stock[coin];
    if (combined + value > cfg.max) return;
    const denomination = cfg.denominations.indexOf(value);
    for (let ticket = 0; ticket < cfg.count; ticket++) {
      totals[ticket] += value; counts[ticket][denomination]++;
      distribute(coin + 1, combined + value);
      totals[ticket] -= value; counts[ticket][denomination]--;
    }
  }
  distribute(0, 0);
  const prices = [...compositions].filter(([, ways]) => ways.size >= 2)
    .map(([key]) => key.split(",").map(Number))
    .sort((a, b) => a[0] - b[0] || (a[1] || 0) - (b[1] || 0));
  if (!prices.length) throw new Error("No solvable ticket prices");
  const bank = { prices, keys: new Set(prices.map(values => values.join(","))) };
  banks.set(key, bank);
  return bank;
}
export function createTicketsQuestion({ level, rng = Math.random }) {
  const cfg = cfgFor(level), variant = level === "small" ? roll(SMALL_STOCKS.length, rng) : 0;
  const stock = stockTemplates(level)[variant], prices = priceBank(level, variant).prices;
  const fares = prices[roll(prices.length, rng)];
  const destinations = shuffled(DESTINATIONS, rng).slice(0, cfg.count);
  return {
    game: "tickets", level,
    tickets: destinations.map((destination, index) => ({ ...destination, fare: fares[index] })),
    wallet: shuffled(stock, rng).map((value, index) => ({ id: `coin-${index}`, value })),
    denominations: [...cfg.denominations], answer: [...fares],
    prompt: cfg.count === 1 ? "幫朋友買車票，用遊戲代幣付出剛好的點數。" : "兩張車票都要付款，把同一盤遊戲代幣分配好。",
    hint: cfg.count === 1 ? "先看票價，再搭配代幣；拿錯可以取回，換一種搭配。"
      : "先看兩張票的票價，再想代幣怎麼分；需要的代幣在另一張票上時，可以取回重分。",
  };
}
function dense(array, length) {
  return Array.isArray(array) && array.length === length
    && Array.from({ length }, (_unused, index) => Object.hasOwn(array, index)).every(Boolean);
}
function questionValid(q) {
  const cfg = typeof q?.level === "string" && Object.hasOwn(LEVELS, q.level) ? LEVELS[q.level] : null;
  if (q?.game !== "tickets" || !cfg || !dense(q.tickets, cfg.count) || !dense(q.wallet, cfg.stock.length)
    || !dense(q.denominations, cfg.denominations.length)) return false;
  if (!q.denominations.every(value => cfg.denominations.includes(value))
    || new Set(q.denominations).size !== q.denominations.length) return false;
  if (!q.tickets.every(ticket => ticket && typeof ticket.id === "string" && /^[a-z][a-z0-9-]{0,40}$/.test(ticket.id)
    && typeof ticket.destination === "string" && ticket.destination.length > 0 && ticket.destination.length <= 60
    && typeof ticket.icon === "string" && ticket.icon.length <= 12 && Number.isInteger(ticket.fare))) return false;
  if (new Set(q.tickets.map(ticket => ticket.id)).size !== cfg.count
    || new Set(q.tickets.map(ticket => ticket.destination)).size !== cfg.count) return false;
  if (!q.wallet.every(coin => coin && typeof coin.id === "string" && /^coin-\d+$/.test(coin.id)
    && Number.isInteger(coin.value) && cfg.denominations.includes(coin.value))
    || new Set(q.wallet.map(coin => coin.id)).size !== cfg.stock.length) return false;
  const values = q.wallet.map(coin => coin.value).sort((a, b) => a - b);
  const variant = stockTemplates(q.level).findIndex(stock =>
    [...stock].sort((a, b) => a - b).every((value, index) => value === values[index]));
  return variant >= 0 && priceBank(q.level, variant).keys.has(q.tickets.map(ticket => ticket.fare).join(","));
}
function assignmentsValid(q, assignments) {
  return questionValid(q) && dense(assignments, q.wallet.length)
    && assignments.every(ticket => ticket === null || Number.isInteger(ticket) && ticket >= 0 && ticket < q.tickets.length);
}
function stateValid(q, state) {
  return assignmentsValid(q, state?.assignments) && Number.isInteger(state.activeTicket)
    && state.activeTicket >= 0 && state.activeTicket < q.tickets.length && typeof state.checked === "boolean";
}
export function newTicketsState(q) {
  if (!questionValid(q)) throw new Error("Invalid tickets question");
  return { activeTicket: 0, assignments: Array(q.wallet.length).fill(null), checked: false };
}
export const resetTicketsState = q => newTicketsState(q);
export function selectTicket(q, state, index) {
  if (!stateValid(q, state) || !Number.isInteger(index) || index < 0 || index >= q.tickets.length
    || state.activeTicket === index) return state;
  return { ...state, activeTicket: index };
}
export function payToken(q, state, index) {
  if (!stateValid(q, state) || !Number.isInteger(index) || index < 0 || index >= q.wallet.length
    || state.assignments[index] !== null) return state;
  const assignments = [...state.assignments];
  assignments[index] = state.activeTicket;
  return { ...state, assignments, checked: false };
}
export function returnToken(q, state, index) {
  if (!stateValid(q, state) || !Number.isInteger(index) || index < 0 || index >= q.wallet.length
    || state.assignments[index] === null) return state;
  const assignments = [...state.assignments]; assignments[index] = null;
  return { ...state, assignments, checked: false };
}
export function ticketTotals(q, assignments) {
  if (!assignmentsValid(q, assignments)) return null;
  const totals = Array(q.tickets.length).fill(0);
  assignments.forEach((ticket, index) => { if (ticket !== null) totals[ticket] += q.wallet[index].value; });
  return totals;
}
function face(value) {
  return `<span class="token-face token-${value}" aria-hidden="true"><b>${value}</b><small>點</small></span>`;
}
export function ticketsScene(q, trip, { esc = escHtml } = {}) {
  if (!questionValid(q)) return "";
  const state = stateValid(q, trip?.tickets) ? trip.tickets : newTicketsState(q);
  const solved = Boolean(trip?.solved);
  const totals = solved ? ticketTotals(q, state.assignments) : null;
  const cards = q.tickets.map((ticket, ticketIndex) => {
    const paid = q.wallet.flatMap((coin, index) => state.assignments[index] === ticketIndex ? [{ coin, index }] : []);
    return `<article class="fare-ticket ${state.activeTicket === ticketIndex ? "ticket-active" : ""}"><button type="button" class="ticket-select" data-ticket-select="${ticketIndex}" aria-pressed="${state.activeTicket === ticketIndex}" aria-label="幫${esc(ticket.destination)}的車票付款，票價 ${ticket.fare} 點" ${solved ? "disabled" : ""}><span class="ticket-destination"><i aria-hidden="true">${esc(ticket.icon)}</i><strong>${esc(ticket.destination)}</strong></span><span class="ticket-fare"><b>${ticket.fare}</b><small>點</small></span></button><div class="ticket-payments" id="ticket-payment-${ticketIndex}" role="group" aria-label="${esc(ticket.destination)}車票上的代幣">${paid.map(({ coin, index }, at) => `<button type="button" class="ticket-paid-token" data-ticket-remove="${index}" aria-label="取回${esc(ticket.destination)}車票上的第 ${at + 1} 枚，${coin.value} 點" ${solved ? "disabled" : ""}>${face(coin.value)}</button>`).join("") || '<span class="ticket-empty">把代幣放這裡</span>'}</div>${solved ? `<p class="ticket-paid-total">已付 ${totals[ticketIndex]} 點</p>` : ""}</article>`;
  }).join("");
  const allHaveTokens = q.tickets.every((_ticket, index) => state.assignments.includes(index));
  return `<div class="tickets-stage ${q.tickets.length === 1 ? "tickets-single" : "tickets-pair"}"><p class="tickets-instruction">${q.tickets.length === 1 ? "選一枚代幣放上車票，拿錯可以點一下取回。" : "先選目的地車票，再選代幣；兩張票共用這一盤。"}</p><div class="ticket-list">${cards}</div><section class="tickets-wallet" aria-label="共用遊戲代幣盤"><div class="wallet-heading"><strong>${q.tickets.length === 1 ? "遊戲代幣盤" : "共用遊戲代幣盤"}</strong><small>取回的代幣會回來</small></div><div class="tickets-bank" role="group" aria-label="還能使用的代幣">${q.wallet.map((coin, index) => `<button type="button" class="wallet-token ${state.assignments[index] !== null ? "token-used" : ""}" data-ticket-pay="${index}" aria-label="${state.assignments[index] === null ? `放入 ${coin.value} 點代幣` : "這枚代幣已放上車票"}" ${solved || state.assignments[index] !== null ? "disabled" : ""}>${state.assignments[index] === null ? face(coin.value) : '<span class="token-used-mark" aria-hidden="true">✓</span>'}</button>`).join("")}</div></section>${solved ? `<p class="tickets-result" role="status">${q.tickets.length === 1 ? "車票" : "兩張車票"}共 ${totals.reduce((sum, value) => sum + value, 0)} 點，付款好了！</p>` : state.checked ? '<p class="tickets-retry" role="status">再看看代幣的搭配，需要時取回重新分配。</p>' : ""}<div class="tickets-actions"><button type="button" id="tickets-reset" class="text-btn" ${solved || state.assignments.every(value => value === null) ? "disabled" : ""}>全部取回</button><button type="button" id="tickets-check" class="primary-btn" ${solved || !allHaveTokens ? "disabled" : ""}>付好了，看看車票 ✓</button></div></div>`;
}
