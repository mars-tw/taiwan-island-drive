// Ported from Taiwan Train Math 1.11.0 (src/puzzle.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
// R50 (academy): Chinese/English switch. Questions keep Chinese text (filled with zh()); the
// scene translates at display time with t()/tx(). Chinese output is unchanged.
import { t } from "../../shared/i18n.js";
import { zh, tx } from "./room-text.js";

const PUZZLE_SIZES = {
  small: { columns: 2, rows: 2 },
  medium: { columns: 3, rows: 2 },
  large: { columns: 3, rows: 3 },
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
);

// Puzzle photos come from the checked-in catalogue image directory only.
function catalogueImage(image) {
  if (typeof image !== "string" ||
    !/^assets\/images\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|avif)$/.test(image))
    throw new Error("Puzzle image must be a local catalogue asset");
  return image;
}

function pieceCount(q) {
  const size = PUZZLE_SIZES[q?.level];
  if (!size || q.columns !== size.columns || q.rows !== size.rows)
    throw new Error("Unknown puzzle size");
  return size.columns * size.rows;
}

function validPiece(id, count) {
  return Number.isInteger(id) && id >= 0 && id < count;
}

function validState(q, state) {
  let count;
  try { count = pieceCount(q); } catch { return false; }
  if (!state || !Array.isArray(state.placements) || state.placements.length !== count ||
    !Number.isSafeInteger(state.moves) || state.moves < 0 ||
    typeof state.preview !== "boolean" ||
    (state.selectedPiece !== null && !validPiece(state.selectedPiece, count))) return false;
  const placed = state.placements.filter((piece) => piece !== null);
  return placed.every((piece) => validPiece(piece, count)) && new Set(placed).size === placed.length;
}

export function createPuzzleQuestion({ level, train, trains, rng = Math.random }) {
  const size = PUZZLE_SIZES[level];
  if (!size) throw new Error("Unknown puzzle level");
  if (!train || typeof train.id !== "string" || typeof train.name !== "string")
    throw new Error("A puzzle needs a catalogue train");
  const image = catalogueImage(train.image);
  if (Array.isArray(trains) && !trains.some((item) => item.id === train.id && item.image === image))
    throw new Error("Puzzle train is not in the catalogue");
  const answer = Array.from({ length: size.columns * size.rows }, (_, index) => index);
  const pieces = [...answer];
  for (let index = pieces.length - 1; index > 0; index--) {
    const random = rng();
    const other = Number.isFinite(random)
      ? Math.max(0, Math.min(index, Math.floor(random * (index + 1)))) : 0;
    [pieces[index], pieces[other]] = [pieces[other], pieces[index]];
  }
  if (pieces.every((piece, index) => piece === answer[index]))
    [pieces[0], pieces[1]] = [pieces[1], pieces[0]];
  return {
    game: "puzzle", level, target: train.id, image, trainName: train.name,
    ...size, pieces, answer,
    prompt: zh("把{name}的照片拼回來。", { name: train.name }),
    hint: "先看看照片裡的車頭、軌道和天空，再找能接在一起的邊緣。",
  };
}

export function newPuzzleState(q) {
  return { placements: Array(pieceCount(q)).fill(null), selectedPiece: null, moves: 0, preview: false };
}

export function resetPuzzleState(q) {
  return newPuzzleState(q);
}

export function selectPuzzlePiece(q, state, id) {
  if (!validState(q, state) || !validPiece(id, pieceCount(q))) return state;
  return { ...state, selectedPiece: state.selectedPiece === id ? null : id };
}

export function placePuzzlePiece(q, state, slot) {
  if (!validState(q, state) || !validPiece(slot, pieceCount(q))) return state;
  const placements = [...state.placements];
  const occupying = placements[slot];
  if (state.selectedPiece === null) {
    if (occupying === null) return state;
    placements[slot] = null;
    return { ...state, placements, selectedPiece: occupying, moves: state.moves + 1 };
  }
  const source = placements.indexOf(state.selectedPiece);
  if (source === slot) return state;
  if (source !== -1) placements[source] = occupying;
  placements[slot] = state.selectedPiece;
  return { ...state, placements, selectedPiece: null, moves: state.moves + 1 };
}

function piecePhoto(q, id, esc) {
  const column = id % q.columns, row = Math.floor(id / q.columns);
  return `<span class="puzzle-piece-photo" style="--puzzle-piece-x:${column};--puzzle-piece-y:${row}" aria-hidden="true"><img src="${esc(catalogueImage(q.image))}" alt="" draggable="false"></span>`;
}

export function puzzleScene(q, trip, { esc = escapeHtml } = {}) {
  const count = pieceCount(q), image = catalogueImage(q.image);
  const state = validState(q, trip?.puzzle) ? trip.puzzle : newPuzzleState(q);
  const style = `--puzzle-columns:${q.columns};--puzzle-rows:${q.rows};--puzzle-cell-ratio:${16 * q.rows}/${9 * q.columns}`;
  if (trip?.solved)
    return `<div class="puzzle-stage puzzle-solved" style="${style}"><div class="puzzle-complete-photo"><img src="${esc(image)}" alt="${esc(t("{name}的完整照片", { name: tx(q.trainName) }))}" draggable="false"></div><p class="puzzle-success"><span aria-hidden="true">✓</span> ${t("{n} 片拼好了！{name}可以出發囉。", { n: count, name: esc(tx(q.trainName)) })}</p></div>`;

  const placed = new Set(state.placements.filter((piece) => piece !== null));
  const pieces = Array.isArray(q.pieces) && q.pieces.length === count &&
    q.pieces.every((id) => validPiece(id, count)) && new Set(q.pieces).size === count
    ? q.pieces.filter((piece) => !placed.has(piece)) : [];
  const occupied = placed.size;
  const board = state.placements.map((piece, slot) => {
    // One whole sentence per square state, so English keeps its own word order.
    const action = state.selectedPiece !== null ? "拼圖格，第 {n} 格，放入選好的拼圖" : piece === null ? "拼圖格，第 {n} 格，空格" : "拼圖格，第 {n} 格，取回這片拼圖";
    return `<button type="button" class="puzzle-slot ${piece === null ? "is-empty" : "is-filled"} ${piece !== null && piece === state.selectedPiece ? "is-selected" : ""}" data-puzzle-slot="${slot}" ${piece !== null ? `data-puzzle-piece-id="${piece}"` : ""} aria-label="${esc(t(action, { n: slot + 1 }))}">${piece === null ? '<span class="puzzle-empty-mark" aria-hidden="true">＋</span>' : piecePhoto(q, piece, esc)}</button>`;
  }).join("");
  const tray = pieces.map((piece, index) => `<button type="button" class="puzzle-tray-piece ${state.selectedPiece === piece ? "is-selected" : ""}" data-puzzle-piece="${piece}" aria-label="${esc(t(state.selectedPiece === piece ? "拼圖盤第 {n} 片，已選取" : "拼圖盤第 {n} 片，選取這片", { n: index + 1 }))}" aria-pressed="${state.selectedPiece === piece}">${piecePhoto(q, piece, esc)}<span class="puzzle-piece-check" aria-hidden="true">${state.selectedPiece === piece ? "✓" : ""}</span></button>`).join("");

  return `<div class="puzzle-stage" style="${style}">
    <div class="puzzle-toolbar"><span class="puzzle-progress">${t("已放 {n}／{count} 片", { n: occupied, count })}</span><button type="button" id="puzzle-preview" class="secondary-btn" aria-expanded="${state.preview}" aria-controls="puzzle-reference">${t(state.preview ? "收起原圖" : "看看原圖")}</button></div>
    ${state.preview ? `<figure class="puzzle-reference" id="puzzle-reference"><img src="${esc(image)}" alt="${esc(t("{name}的原圖", { name: tx(q.trainName) }))}" draggable="false"><figcaption>${t("看看車頭和風景，再自己試著拼。")}</figcaption></figure>` : '<div id="puzzle-reference" hidden></div>'}
    <p class="puzzle-instruction" id="puzzle-instruction">${t(state.selectedPiece === null ? "拖一片到空格，或先點一片再點空格。" : "拼圖選好了，點一格放進去。")}<span>${t("點已放的拼圖可以取回；放進有拼圖的格子可以換片。")}</span></p>
    <div class="puzzle-board" role="group" aria-label="${esc(t("照片拼圖板"))}" aria-describedby="puzzle-instruction">${board}</div>
    <div class="puzzle-tray" role="group" aria-label="${esc(t("打散的照片拼圖"))}">${tray || `<p class="puzzle-tray-empty">${t("照片放好了，看看有沒有接起來。")}</p>`}</div>
    <div class="puzzle-actions"><button type="button" id="puzzle-reset" class="text-btn" ${occupied === 0 && state.selectedPiece === null && !state.preview ? "disabled" : ""}>${t("全部取回")}</button><button type="button" id="puzzle-submit" class="primary-btn" ${occupied !== count ? "disabled" : ""}>${t("拼好了，送出 ✓")}</button></div>
  </div>`;
}
