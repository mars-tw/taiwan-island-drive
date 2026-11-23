// Ported from Taiwan Train Math 1.11.0 (src/train-images.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
const LOCAL_PHOTO = /^assets\/images\/real-[a-z0-9-]+\.(?:jpg|png|webp)$/;
export function verifiedPhoto(train) {
  const p = train?.referencePhoto;
  return p?.status === "verified" && LOCAL_PHOTO.test(p.path || "")
    && p.author && p.licenseName && /^https?:\/\//.test(p.licenseUrl || "")
    && /^https:\/\//.test(p.sourceUrl || "") ? p : null;
}
export function displayTrain(train) {
  if (!train) return null;
  return { ...train, name: train.displayName || train.name,
    model: train.displayModel || train.model, intro: train.displayIntro || train.intro,
    fact: train.displayFact || train.fact, note: train.displayNote || train.note,
    cardLabel: train.displayCardLabel || train.cardLabel };
}
export function trainImage(train, contentVersion = "1.8.0") {
  return ["1.7.0", "1.8.0"].includes(contentVersion) ? verifiedPhoto(train)?.path || null : train.image;
}
export function samePhotoIdentity(a, b) {
  const key = t => t.canonicalModel || t.id;
  return a.id === b.id || key(a) === key(b) || a.image === b.image || a.name === b.name;
}
export function photoGameTrains(trains) {
  return trains.filter(t => verifiedPhoto(t)?.view === "exterior" && t.status !== "future")
    .map(t => ({ ...displayTrain(t), image: verifiedPhoto(t).path }))
    .filter((t, index, all) => all.findIndex(other => samePhotoIdentity(t, other)) === index);
}
export function puzzlePhotoTrains(trains) {
  // A very narrow photo creates almost identical blank pieces inside the
  // fixed landscape board. Keep it in the catalogue and matching games.
  return photoGameTrains(trains).filter(t => {
    const p = verifiedPhoto(t), ratio = p.width / p.height;
    return Number.isFinite(ratio) && ratio >= 1.25 && ratio <= 2.6;
  });
}
export function photoLabel(train) {
  const p = verifiedPhoto(train);
  if (!p) return "正確實車照片待補";
  return p.view === "interior" ? "實車內裝照片" : train.status === "future" ? "抵台實車・尚未營運" : "實車照片";
}
