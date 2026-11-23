// Ported from Taiwan Train Math 1.11.0 (src/learning-content.js), Copyright 2026 mars-tw.
// Code: Apache-2.0; original educational text: CC-BY-4.0.
// Changed for the academy: header added, line endings normalised; logic unchanged.
// See public/licenses/taiwan-train-math/NOTICE.txt and docs/r48-math-room-assets.json.
// Brief reading after a solved task or in the catalogue; never an answer hint.
// Sources establish identity, design or geography, not today's operating status.
// Place associations are reading topics, not a train itinerary or photo location.
const checkedAt = "2026-10-06";
const sourceRows = [
  ["hsr-names", "台灣高鐵：新世代列車與命名", "https://www.thsrc.com.tw/ArticleContent/51dd80ee-c4d2-4cd5-aeea-ede7a9b055ce"],
  ["tra-maintenance", "台鐵：車輛維修計畫與車型分類", "https://www.railway.gov.tw/tra-tip-web/tip/file/72d6c901-8166-4a32-ab59-7602a45072a9"],
  ["tra-types", "台鐵：安全管理報告中的車型資料", "https://tip.railway.gov.tw/tra-tip-web/tip/file/132f1c83-0a91-4b42-87e1-b6aaa39ba14e"],
  ["tra-diesel", "台鐵：DR1000／DRC1000 柴油客車介紹", "https://www.railway.gov.tw/tra-tip-web/tip/file/f38b5fd1-fc31-49c2-a445-16206c6e6d52"],
  ["tra-diesel-history", "台鐵：柴油客車車型統計", "https://www.railway.gov.tw/tra-tip-web/tip/file/56163341-8191-4e28-9e13-cea60db26f25"],
  ["tra-steam", "台鐵：蒸汽機車管理要點中的車號", "https://www.railway.gov.tw/tra-tip-web/tip/file/6dc22469-5878-45f8-b4f4-d3ee6e751e35"],
  ["tra-tourism", "台鐵：觀光列車名稱", "https://tip.railway.gov.tw/tra-tip-web/tip/tip00N/tipN01/journey/index?lang=zh_TW"],
  ["sea-breeze", "台鐵：海風號列車介紹", "https://tip.railway.gov.tw/tra-tip-web/tip/tip00N/tipN01/public/index/005?lang=zh_TW"],
  ["mountain-mist", "台鐵：山嵐號列車介紹", "https://tip.railway.gov.tw/tra-tip-web/tip/tip00N/tipN01/public/index/006?lang=zh_TW"],
  ["forest-diesel", "阿里山林鐵：柴油機車介紹", "https://afrch.forest.gov.tw/0000106"],
  ["forest-shay", "阿里山林鐵：夏依式蒸汽機車", "https://afrch.forest.gov.tw/0000107"],
  ["forest-tourism", "阿里山林鐵：主題列車資訊", "https://afrch.forest.gov.tw/"],
  ["forest-wood", "阿里山林鐵：福森號的檜木車廂", "https://afrch.forest.gov.tw/all-news/0070949"],
  ["sugar-parks", "台糖：五分車觀光園區與糖鐵歷史", "https://www.taisugar.com.tw/CSR/CP2.aspx?n=13286"],
  ["sugar-education", "台糖：蒜頭糖廠環境教育", "https://www.taisugar.com.tw/CSR/CP2.aspx?n=13287"],
  ["sugar-steam", "台糖：溪湖糖廠的蒸汽機車", "https://www.taisugar.com.tw/ZOB/Attractions_detail.aspx?n=11582&s=140"],
  ["jr-east", "JR 東日本：E5 系列車與長車頭", "https://www.jreast.co.jp/train/shinkan/e5.html"],
  ["jr-central", "JR 東海：新幹線列車", "https://global.jr-central.co.jp/en/company/about_shinkansen/"],
  ["jr-maglev", "JR 東海：磁浮列車原理", "https://scmaglev.jr-central-global.com/about/"],
  ["alishan", "林業署：阿里山國家森林遊樂區", "https://recreation.forest.gov.tw/Forest/RA?typ_id=0500001"],
  ["fenqihu", "阿里山林鐵：奮起湖車站", "https://afrch.forest.gov.tw/0000091"],
  ["guishan", "觀光署：龜山島的名稱與地形", "https://spotlightaward.taiwan.net.tw/tourpage.php?id=e9ebf622-aa04-4944-b9e6-c91a87572469&tag=4"],
  ["gaomei", "觀光署：高美濕地", "https://www.taiwan.net.tw/m1.aspx?id=R117&sNo=0001112"],
  ["changhua", "台鐵：彰化扇形車庫", "https://www.railway.gov.tw/tra-tip-web/tip/tip00H/tipH21/view?tripNo=4eb4b3c1edd64221bcf1c7c912670d0c"],
  ["vehicle-mover", "鐵道局：九曲堂側線事故調查中的車輛調動機資料", "https://www.rb.gov.tw/public/upimgs/A00/111/臺鐵110年7月28日九曲堂側線出軌事故專案調查報告.pdf"],
];
export const LEARNING_SOURCES = Object.freeze(Object.fromEntries(sourceRows.map(([id, title, url]) =>
  [id, Object.freeze({ id, title, url, checkedAt })])));

function card(id, kind, text, sourceIds, place) {
  const ids = Object.freeze([...new Set(sourceIds)]);
  const sources = Object.freeze(ids.map(sourceId => LEARNING_SOURCES[sourceId]));
  if (sources.some(source => !source)) throw new Error("Unknown learning source");
  return Object.freeze({ id, kind, label: kind === "train" ? "認識火車" : kind === "place" ? "真實台灣" : "旅途小發現",
    text, sourceIds: ids, sources, ...(place ? { place: Object.freeze({ ...place }) } : {}) });
}

export const PLACE_DISCOVERIES = Object.freeze([
  card("place-alishan", "place", "嘉義的阿里山森林遊樂區，有高大的檜木。", ["alishan"],
    { name: "阿里山國家森林遊樂區", region: "嘉義縣阿里山鄉", landscape: "mountain" }),
  card("place-fenqihu", "place", "奮起湖在嘉義的山裡，火車站旁邊有老街。", ["fenqihu"],
    { name: "奮起湖車站", region: "嘉義縣竹崎鄉", landscape: "mountain" }),
  card("place-guishan", "place", "宜蘭外海的龜山島，像一隻浮在海上的烏龜。", ["guishan"],
    { name: "龜山島", region: "宜蘭縣頭城鎮外海", landscape: "sea" }),
  card("place-gaomei", "place", "高美濕地在台中河水流向海的地方，也是鳥和螃蟹的家。", ["gaomei"],
    { name: "高美濕地", region: "臺中市清水區", landscape: "sea" }),
  card("place-suantou", "place", "蒜頭糖廠在嘉義縣，這裡的糖鐵以前幫忙載甘蔗。", ["sugar-parks", "sugar-education"],
    { name: "蒜頭糖廠蔗埕文化園區", region: "嘉義縣六腳鄉", landscape: "field" }),
  card("place-changhua", "place", "彰化扇形車庫的鐵軌像打開的扇子，機車頭會在這裡休息和保養。", ["changhua"],
    { name: "彰化扇形車庫", region: "彰化縣彰化市", landscape: "city" }),
]);

const trainRows = [
  ["700t", "700T 名字裡的 T 代表台灣，就像列車的名牌。", "hsr-names"],
  ["emu3000", "EMU3000 是用電的列車，新自強號是它的服務名字。", "tra-maintenance"],
  ["temu1000", "太魯閣號的車身能在轉彎時調整傾斜，型號是 TEMU1000。", "tra-maintenance"],
  ["temu2000", "普悠瑪號的型號是 TEMU2000，和太魯閣號不同。", "tra-maintenance"],
  ["e1000", "推拉式自強號的前後端都有機車頭，中間的車廂載乘客。", "tra-types"],
  ["emu900", "EMU900 是用電的區間車，幫大家從一站到下一站。", "tra-maintenance"],
  ["emu800", "EMU800 是區間車的型號，和 EMU900 都是用電的列車。", "tra-maintenance"],
  ["emu700", "EMU700 和 EMU800 都是用電的列車，型號能幫我們分辨它們。", "tra-maintenance"],
  ["emu600", "EMU600 是用電的列車，字母和數字是它的型號名字。", "tra-maintenance"],
  ["emu500", "EMU500 是用電的列車，也有車廂改造成觀光列車。", "tra-maintenance"],
  ["e500", "E500 是電力機車，會用電幫忙帶動後面的車廂。", "tra-maintenance"],
  ["e200", "E200 是電力機車的型號，像一個家族的名字。", "tra-types"],
  ["e300", "E300 是電力機車的型號，能幫忙把車廂帶著走。", "tra-types"],
  ["e400", "E400 是電力機車的型號，和 E200、E300 是不同的家族。", "tra-types"],
  ["r200", "R200 是柴電機車，用柴油做出電，再用電帶動車輪。", "tra-maintenance"],
  ["r20", "R20 是柴電機車，機車頭能把車廂拉著走。", "tra-maintenance"],
  ["r100", "R100 是柴電機車的型號，會幫忙帶動車廂。", "tra-maintenance"],
  ["r150", "R150 是柴電機車的型號，機車頭是拉車廂的幫手。", "tra-maintenance"],
  ["r180", "R180 是柴電機車的型號，和 R190 是不同的家族。", "tra-maintenance"],
  ["r190", "R190 是柴電機車的型號，型號能幫我們認識不同的車。", "tra-maintenance"],
  ["dr1000", "DR1000 和 DRC1000 是同一批柴油客車的不同寫法。", "tra-diesel"],
  ["dr3100", "DR3100 是柴油自強號的型號，和用電的自強號動力不同。", "tra-diesel-history"],
  ["dhl100", "DHL100 幫忙把車廂挪到需要的位置，像把隊伍排好。", "tra-maintenance"],
  ["dl2500", "DL2500 是移動車輛的幫手，幫忙把車廂挪到需要的位置。", "vehicle-mover"],
  ["forest-dl25-30", "DL25 到 DL30 是林鐵柴油機車的一組車號，每台車有自己的名字。", "forest-diesel"],
  ["forest-dl31-34", "DL31 到 DL34 是林鐵柴油機車的一組車號，數字能幫忙認車。", "forest-diesel"],
  ["forest-dl38", "DL38 是阿里山森林鐵路柴油機車的車號。", "forest-diesel"],
  ["forest-dl39-43", "DL39 到 DL43 是林鐵柴油機車的一組車號。", "forest-diesel"],
  ["forest-dl45-51", "DL45 到 DL51 是林鐵柴油機車的一組車號。", "forest-diesel"],
  ["shay-21", "SL-21 是夏依式火車的車號，這種車用齒輪帶動車輪。", "forest-shay"],
  ["shay-25", "SL-25 是夏依式火車的車號，這種車用齒輪把力量送到車輪。", "forest-shay"],
  ["shay-26", "SL-26 是夏依式蒸汽火車的車號，也是阿里山林鐵的故事。", "forest-shay"],
  ["shay-31", "SL-31 是夏依式火車的車號，這種車用齒輪帶動車輪。", "forest-shay"],
  ["breezy-blue", "藍皮解憂號是觀光列車的名字，可以認識藍色客車的故事。", "tra-tourism"],
  ["future-express", "鳴日號是觀光列車的名字，和機車頭的型號名字不同。", "tra-tourism"],
  ["future-kitchen", "鳴日廚房把列車旅行和吃飯放在一起，車廂裡有用餐的空間。", "tra-tourism"],
  ["island-star", "環島之星是觀光列車的名字，讓人從車窗認識台灣的風景。", "tra-tourism"],
  ["sea-breeze", "海風號的車身顏色，取用了台灣海岸的藍綠色。", "sea-breeze"],
  ["mountain-mist", "山嵐號有大窗戶，讓乘客看看窗外的山林。", "mountain-mist"],
  ["formosensis", "福森號的車廂用了檜木，木頭上可以看見一條條木紋。", "forest-wood"],
  ["vivid-express", "栩悅號是阿里山森林鐵路的觀光列車名字。", "forest-tourism"],
  ["cypress-coach", "檜木列車的客車呈現木材風格，也保留林鐵旅行的故事。", "forest-wood"],
  ["juguang", "莒光號的客車由機車頭帶著走，莒光號是列車服務的名字。", "tra-tourism"],
  ["xihu", "溪湖五分車留下糖廠小火車的故事，糖鐵以前幫糖廠運東西。", "sugar-parks"],
  ["suantou", "蒜頭五分車留下糖業鐵道的故事，也讓人認識田野風景。", "sugar-parks"],
  ["wushulin", "烏樹林五分車保留了糖業鐵道的故事，鐵道比普通火車窄。", "sugar-parks"],
  ["xinying", "新營五分車留下糖廠小火車的故事。", "sugar-parks"],
  ["qiaotou", "橋頭五分車是糖鐵觀光列車的名字，也保留糖廠的記憶。", "sugar-parks"],
  ["sugar-346", "346 號是溪湖糖廠蒸汽火車的車號，就像它自己的名字。", "sugar-steam"],
  ["e5", "E5 是日本新幹線的型號，長長的車頭是它的特色。", "jr-east"],
  ["n700s", "N700S 是日本新幹線的型號，和台灣的 700T 不同。", "jr-central"],
  ["l0", "L0 是日本的磁浮試驗列車，用磁力把車身托起來。", "jr-maglev"],
  ["n700st", "N700ST 名字裡的 T 代表台灣，和 700T 的命名方式一樣。", "hsr-names"],
  ["ct273", "CT273 是蒸汽機車的車號，就像它自己的名字。", "tra-steam"],
  ["dt668", "DT668 是蒸汽機車的車號，和 CT273 是不同的車。", "tra-steam"],
  ["ck124", "CK124 是蒸汽機車的車號，字母和數字能幫我們認出它。", "tra-steam"],
  ["ck101", "CK101 是蒸汽機車的車號，和 CK124 是不同的車。", "tra-steam"],
  ["ldk59", "LDK59 是蒸汽機車的車號，就像它自己的名字。", "tra-steam"],
];
const trainMap = Object.fromEntries(trainRows.map(([id, text, sourceId]) =>
  [id, Object.freeze([card(`train-${id}`, "train", text, [sourceId])]) ]));
// A catalogue alias must teach the same vehicle identity, not a second model.
trainMap.drc1000 = trainMap.dr1000;
export const TRAIN_DISCOVERIES = Object.freeze(trainMap);

const placeById = Object.fromEntries(PLACE_DISCOVERIES.map(item => [item.id, item]));
const forestIds = ["forest-dl25-30", "forest-dl31-34", "forest-dl38", "forest-dl39-43", "forest-dl45-51", "shay-21", "shay-25", "shay-26", "shay-31", "formosensis", "vivid-express", "cypress-coach"];
const sugarIds = ["xihu", "suantou", "wushulin", "xinying", "qiaotou", "sugar-346"];
const foreignIds = ["e5", "n700s", "l0"];
const placesForTrain = Object.freeze(Object.fromEntries(Object.keys(TRAIN_DISCOVERIES).map(id => {
  const names = foreignIds.includes(id) ? [] : forestIds.includes(id)
    ? ["place-alishan", "place-fenqihu"] : sugarIds.includes(id)
      ? ["place-suantou", "place-changhua"] : ["place-changhua", "place-gaomei", "place-guishan"];
  return [id, Object.freeze(names.map(name => placeById[name]))];
})));

const general = card("general-train-names", "general", "列車有不同的名字，認識名字能幫我們分辨它們。", []);
export function learningDiscovery(trainId, options = {}) {
  if (typeof trainId !== "string" || !Object.hasOwn(TRAIN_DISCOVERIES, trainId)) return general;
  const settings = options && typeof options === "object" && !Array.isArray(options) ? options : {};
  const index = Number.isSafeInteger(settings.index) && settings.index >= 0 ? settings.index : 0;
  const topic = settings.topic === "train" || settings.topic === "place" ? settings.topic : "mixed";
  const train = TRAIN_DISCOVERIES[trainId], places = placesForTrain[trainId];
  const pool = topic === "train" ? train : topic === "place" ? places : [...train, ...places];
  return pool.length ? pool[index % pool.length] : general;
}
