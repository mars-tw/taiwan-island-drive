// Ported from Taiwan Train Math 1.11.0 (tests/tickets.test.mjs), Copyright 2026 mars-tw. Apache-2.0.
// Changed: import/data paths for src/games/math; see docs/r48-math-room-assets.json for any adjusted assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createTicketsQuestion, newTicketsState, resetTicketsState,
  selectTicket, payToken, returnToken, ticketTotals, ticketsScene,
} from "../../src/games/math/tickets.js";
import { createTrip, defaults, rememberTrip, questionSignature } from "../../src/games/math/engine.js";
const levels = ["small", "medium", "large"];
function random(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
function independentWays(q) {
  const totals = Array(q.tickets.length).fill(0), allocation = Array(q.wallet.length).fill(null);
  const found = new Map();
  function search(index) {
    if (found.size >= 2) return;
    if (index === q.wallet.length) {
      if (!totals.every((total, ticket) => total === q.tickets[ticket].fare)) return;
      const shape = q.tickets.map((_ticket, at) => q.denominations.map(value =>
        allocation.reduce((count, assigned, coin) => count + Number(assigned === at && q.wallet[coin].value === value), 0),
      ).join(",")).join(";");
      found.set(shape, [...allocation]);
      return;
    }
    allocation[index] = null; search(index + 1);
    for (let ticket = 0; ticket < q.tickets.length; ticket++) {
      if (totals[ticket] + q.wallet[index].value > q.tickets[ticket].fare) continue;
      totals[ticket] += q.wallet[index].value; allocation[index] = ticket;
      search(index + 1);
      totals[ticket] -= q.wallet[index].value;
    }
    allocation[index] = null;
  }
  search(0);
  return [...found.values()];
}
function payAllocation(q, allocation) {
  let state = newTicketsState(q);
  for (const [coin, ticket] of allocation.entries()) if (ticket !== null)
    state = payToken(q, selectTicket(q, state, ticket), coin);
  return state;
}
test("each age has finite shared tokens and at least two distinct solvable fare compositions", () => {
  for (const level of levels) {
    const seen = new Set();
    for (let seed = 0; seed < 300; seed++) {
      const q = createTicketsQuestion({ level, rng: random(Math.imul(seed + 1, 2654435761)) });
      assert.equal(q.game, "tickets");
      assert.equal(q.tickets.length, level === "small" ? 1 : 2);
      assert.equal(q.wallet.length, level === "small" ? 6 : 8);
      assert.deepEqual(q.denominations, level === "large" ? [1, 2, 5, 10] : [1, 2, 5]);
      assert.equal(new Set(q.tickets.map(ticket => ticket.id)).size, q.tickets.length);
      assert.equal(new Set(q.tickets.map(ticket => ticket.destination)).size, q.tickets.length);
      assert.equal(new Set(q.wallet.map(coin => coin.id)).size, q.wallet.length);
      assert.ok(q.tickets.every(ticket => ticket.fare >= 2 && ticket.fare <= { small: 5, medium: 10, large: 20 }[level]));
      assert.ok(q.tickets.reduce((total, ticket) => total + ticket.fare, 0) <= { small: 5, medium: 10, large: 20 }[level]);
      assert.deepEqual(q.answer, q.tickets.map(ticket => ticket.fare));
      const ways = independentWays(q);
      assert.equal(ways.length, 2, `${level}, seed ${seed}: identical-token swaps must not count as a second answer`);
      for (const way of ways) assert.deepEqual(ticketTotals(q, payAllocation(q, way).assignments), q.answer);
      assert.doesNotMatch(q.hint, /\d|缺|還差|先放|再放/);
      assert.doesNotMatch(q.prompt, /台幣|臺幣|硬幣|\d+元/);
      seen.add(q.answer.join(","));
    }
    assert.ok(seen.size >= (level === "small" ? 4 : 20));
  }
  for (const rng of [() => 0, () => 1, () => NaN]) for (const level of levels) {
    const q = createTicketsQuestion({ level, rng });
    assert.equal(independentWays(q).length, 2);
  }
  assert.throws(() => createTicketsQuestion({ level: "unknown" }));
});
test("small uses three real inventories and eleven non-cosmetic fare-and-wallet tasks", () => {
  const stocks = new Set(), signatures = new Set();
  for (let seed = 0; seed < 400; seed++) {
    const q = createTicketsQuestion({ level: "small", rng: random(Math.imul(seed + 1, 2654435761)) });
    const stock = q.wallet.map(coin => coin.value).sort((a, b) => a - b).join(",");
    stocks.add(stock); signatures.add(`${q.tickets[0].fare}|${stock}`);
    assert.equal(q.wallet.length, 6);
    assert.equal(independentWays(q).length, 2);
  }
  assert.deepEqual([...stocks].sort(), ["1,1,1,1,2,5", "1,1,1,2,2,5", "1,1,2,2,2,5"].sort());
  assert.equal(signatures.size, 11);
  assert.ok(!signatures.has("3|1,1,2,2,2,5"), "a three-point fare needs three ones for its second face-value solution");
  const q = createTicketsQuestion({ level: "small", rng: () => 1 });
  const unsolvable = { ...q, tickets: q.tickets.map(ticket => ({ ...ticket, fare: 3 })) };
  assert.equal(ticketTotals(unsolvable, Array(6).fill(null)), null);
  assert.throws(() => newTicketsState(unsolvable));
});
test("two small three-station practice journeys keep six genuinely different tasks", () => {
  const { trains } = JSON.parse(readFileSync(new URL("../../src/games/math/data/trains.json", import.meta.url), "utf8"));
  const progress = defaults(), signatures = [];
  for (let tripIndex = 0; tripIndex < 2; tripIndex++) {
    const trip = createTrip({ level: "small", practice: "tickets", train: trains[0], trains,
      rng: () => 0, recentQuestions: progress.recentQuestions, recentGames: progress.recentGames });
    assert.equal(trip.length, 3);
    signatures.push(...trip.map(questionSignature));
    rememberTrip(progress, trip);
  }
  assert.equal(new Set(signatures).size, 6, "recently played tickets cannot repeat while the fare/inventory bank has room");
});
test("payments are immutable and each token belongs to only one ticket until returned", () => {
  const q = createTicketsQuestion({ level: "medium", rng: random(9) });
  const initial = newTicketsState(q);
  Object.freeze(initial.assignments); Object.freeze(initial);
  assert.ok(initial.assignments.every(assignment => assignment === null));
  const paid = payToken(q, initial, 0);
  assert.equal(initial.assignments[0], null); assert.equal(paid.assignments[0], 0);
  const selected = selectTicket(q, paid, 1);
  assert.equal(paid.activeTicket, 0); assert.equal(selected.activeTicket, 1);
  assert.equal(payToken(q, selected, 0), selected, "a used token cannot be silently stolen or duplicated");
  const returned = returnToken(q, { ...selected, checked: true }, 0);
  assert.equal(returned.assignments[0], null); assert.equal(returned.checked, false);
  const reallocated = payToken(q, returned, 0);
  assert.equal(reallocated.assignments[0], 1);
  assert.deepEqual(ticketTotals(q, reallocated.assignments), [0, q.wallet[0].value]);
  assert.deepEqual(resetTicketsState(q), initial);
  assert.equal(selectTicket(q, initial, 0), initial);
  assert.equal(returnToken(q, initial, 0), initial);
});
test("the two-ticket inventory creates a real allocation decision rather than unlimited balancing", () => {
  let q;
  for (let seed = 0; seed < 1000; seed++) {
    const candidate = createTicketsQuestion({ level: "large", rng: random(Math.imul(seed + 1, 2654435761)) });
    if (candidate.answer[0] === 11 && candidate.answer[1] === 9) { q = candidate; break; }
  }
  assert.ok(q);
  let state = newTicketsState(q);
  const chosen = [], wanted = [5, 5, 1];
  for (const value of wanted) {
    const coin = q.wallet.findIndex((coin, index) => coin.value === value && !chosen.includes(index));
    chosen.push(coin); state = payToken(q, state, coin);
  }
  assert.deepEqual(ticketTotals(q, state.assignments), [11, 0]);
  const remaining = q.wallet.flatMap((coin, index) => state.assignments[index] === null ? [coin.value] : []);
  const canPayNine = Array.from({ length: 2 ** remaining.length }, (_unused, mask) =>
    remaining.reduce((total, value, index) => total + (mask & 1 << index ? value : 0), 0)).includes(9);
  assert.equal(canPayNine, false, "using both fives for the first ticket leaves the other ticket unpayable");
  for (const way of independentWays(q)) assert.deepEqual(ticketTotals(q, way), [11, 9]);
});
test("sparse or malformed question and assignment arrays are rejected without changing child work", () => {
  const q = createTicketsQuestion({ level: "medium", rng: random(3) }), state = newTicketsState(q);
  const sparse = [...state.assignments]; delete sparse[2];
  for (const assignments of [sparse, [], [...state.assignments, null], state.assignments.map(() => "0"),
    state.assignments.map(() => 2), state.assignments.map(() => -1), state.assignments.map(() => NaN)]) {
    const bad = { ...state, assignments };
    assert.equal(ticketTotals(q, assignments), null);
    assert.equal(selectTicket(q, bad, 1), bad); assert.equal(payToken(q, bad, 0), bad); assert.equal(returnToken(q, bad, 0), bad);
  }
  const sparseWallet = [...q.wallet]; delete sparseWallet[1];
  const duplicateWallet = q.wallet.map((coin, index) => index === 1 ? { ...coin, id: q.wallet[0].id } : coin);
  const sparseTickets = [...q.tickets]; delete sparseTickets[1];
  for (const bad of [{ ...q, wallet: sparseWallet }, { ...q, wallet: duplicateWallet }, { ...q, tickets: sparseTickets },
    { ...q, tickets: [q.tickets[0], q.tickets[0]] }, { ...q, level: "__proto__" }]) {
    assert.equal(ticketTotals(bad, state.assignments), null);
    assert.equal(payToken(bad, state, 0), state);
    assert.equal(ticketsScene(bad, { tickets: state }), "");
    assert.throws(() => newTicketsState(bad));
  }
  for (const index of [-1, q.wallet.length, 1.5, "0", null, undefined, NaN]) {
    assert.equal(payToken(q, state, index), state); assert.equal(returnToken(q, state, index), state);
  }
  for (const index of [-1, 2, 0.5, "1", null, NaN]) assert.equal(selectTicket(q, state, index), state);
  assert.deepEqual(state, newTicketsState(q));
});
test("unchecked and checked-but-unsolved markup shows no paid totals, shortages or partial success", () => {
  for (const level of levels) {
    const q = createTicketsQuestion({ level, rng: random(7) });
    const way = independentWays(q)[0], state = payAllocation(q, way);
    Object.defineProperty(q, "answer", { get() { assert.fail("UI cannot read the answer"); } });
    Object.defineProperty(q, "solutions", { get() { assert.fail("UI cannot read a suggested composition"); } });
    for (const checked of [false, true]) {
      const markup = ticketsScene(q, { tickets: { ...state, checked }, solved: false });
      assert.doesNotMatch(markup, /ticket-paid-total|tickets-result|已付|付足|還差|缺|共 \d+ 點|data-answer=|correct-ticket/);
      assert.equal((markup.match(/data-ticket-select=/g) || []).length, q.tickets.length);
      assert.equal((markup.match(/data-ticket-pay=/g) || []).length, q.wallet.length);
      assert.match(markup, /遊戲代幣盤/); assert.doesNotMatch(markup, /台幣|臺幣|硬幣|元|两/);
      if (checked) assert.match(markup, /再看看代幣的搭配/);
    }
    const solved = ticketsScene(q, { tickets: { ...state, checked: true }, solved: true });
    assert.equal((solved.match(/class="ticket-paid-total"/g) || []).length, q.tickets.length);
    assert.match(solved, new RegExp(`共 ${q.tickets.reduce((total, ticket) => total + ticket.fare, 0)} 點`));
    assert.match(solved, /id="tickets-check"[^>]*disabled/);
  }
});
test("no initial automatic allocation occurs and artwork text is escaped for touch and keyboard use", () => {
  const q = createTicketsQuestion({ level: "medium", rng: random(1) });
  const state = newTicketsState(q), markup = ticketsScene(q, { tickets: state });
  assert.equal((markup.match(/data-ticket-remove=/g) || []).length, 0);
  assert.doesNotMatch(markup, /token-used|tickets-retry|autofocus|onclick=/);
  assert.match(markup, /id="tickets-check"[^>]*disabled/);
  assert.match(markup, /id="ticket-payment-0"/); assert.match(markup, /id="ticket-payment-1"/);
  assert.ok([...markup.matchAll(/<button\b[^>]*>/g)].every(match => match[0].includes('type="button"')));
  const weird = { ...q, tickets: q.tickets.map((ticket, index) => index ? ticket : { ...ticket, destination: '<img src=x onerror="boom">' }) };
  const escaped = ticketsScene(weird, { tickets: newTicketsState(weird) });
  assert.match(escaped, /&lt;img src=x onerror=&quot;boom&quot;&gt;/); assert.doesNotMatch(escaped, /<img\b/);
  const css = readFileSync(new URL("../../src/games/math/styles/tickets.css", import.meta.url), "utf8");
  assert.match(css, /min-width: 48px/); assert.match(css, /min-height: 48px/);
  assert.match(css, /minmax\(0, 1fr\)/); assert.match(css, /:focus-visible/);
  assert.match(css, /orientation: landscape/); assert.match(css, /overflow-y: auto/);
});
