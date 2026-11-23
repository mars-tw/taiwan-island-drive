// Ported from Taiwan Train Math 1.11.0 (src/story-model.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
export const STORY_DURATION = 36000;
export const CHAPTERS = [
  {
    at: 0,
    title: "森林裡的一封信",
    text: "星光高鐵帶著一封金色的信，準備送到海邊小站。小站長，一起出發吧！",
    short: "森林出發",
    place: "山林起點",
  },
  {
    at: 0.3,
    title: "小鳥陪我們過山谷",
    text: "啾啾！小鳥說前面的軌道還沒接好。待會兒一起轉轉軌道，幫列車找到路。",
    short: "經過山谷",
    place: "山谷高架橋",
  },
  {
    at: 0.63,
    title: "聞到海風的味道",
    text: "海邊的燈塔亮起來了。列車上的朋友正在分點心，每位朋友都想一樣多。",
    short: "迎接海風",
    place: "海風沿線",
  },
  {
    at: 1,
    title: "星光信送到了！",
    text: "海邊小站收到信了：今天的驚喜，是你找到的新發現。打開信封，再去尋寶吧！",
    short: "星光抵達",
    place: "星光小站",
  },
];
export function newStoryState() {
  return { elapsed: 0, playing: true, letterOpen: false };
}
export function storyProgress(state) {
  return Math.max(0, Math.min(1, state.elapsed / STORY_DURATION));
}
export function storyChapter(state) {
  const p = storyProgress(state);
  return CHAPTERS.reduce((at, chapter, i) => (p >= chapter.at ? i : at), 0);
}
export function advanceStory(state, milliseconds) {
  if (!state.playing || !Number.isFinite(milliseconds) || milliseconds < 0)
    return state;
  const elapsed = Math.min(STORY_DURATION, state.elapsed + milliseconds);
  return { ...state, elapsed, playing: elapsed < STORY_DURATION };
}
export function goToChapter(state, index) {
  if (!Number.isInteger(index) || !CHAPTERS[index]) return state;
  return {
    ...state,
    elapsed: CHAPTERS[index].at * STORY_DURATION,
    playing: false,
  };
}
