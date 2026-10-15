// Train reward rules: every served station earns a star, finishing a lesson
// earns a bonus. The lesson rating never drops below one star for toddlers.
export const STATION_STARS = 1;
export const LESSON_BONUS = 2;
export const lessonRating = score => (score >= 85 ? 3 : score >= 60 ? 2 : 1);

/** Stars to award when the served-station count moves from `before` to `after`. */
export function stationReward(before, after) { return Math.max(0, (after || 0) - (before || 0)) * STATION_STARS; }
