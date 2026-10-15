// Mission events that earn a shared star, with a short toddler-friendly line.
const REWARDS = Object.freeze({
  star: '找到星星！',
  mail: '郵件送到了！',
  landmark: '到景點了！',
  ring: '穿過圓圈！'
});
export function rewardForEvent(event) {
  const text = REWARDS[event?.type];
  return text ? { stars: 1, text: event.type === 'landmark' && event.label ? `到了，${event.label}！` : text } : null;
}
