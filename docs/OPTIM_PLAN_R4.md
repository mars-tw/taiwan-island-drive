# R4 美術重做計畫

2026-10-16。PREPARED。基準 2.7.0，目標 2.8.0／原生來源 build 4；僅 r1-fun-polish、本機 commit。

已讀核心規則、dispatch、game-optimization-round、imagegen、frontend-design、playwright、speak-human-tw 與最近整合／R3 報告。repo 無 AGENTS.md／CLAUDE.md／AUDIT_full.md／ART_REVIEW_MUSE.md；父層 CLAUDE.md 已讀。本次禁止派工、外部發送、部署、可見視窗與讀取 secrets，優先於舊派工規則。3D 車輛保留，不進行新模型與動畫生產。

1. PREPARED：先建置、無頭擷取首頁／數學／學生證／觀察課／三工具主畫面，寫 ART_REVIEW_R4.md；唯讀比較其他遊戲識別，寫研究筆記與 ART_DIRECTION.md。
2. PREPARED：以統一「陽光海岸交通繪本」風格生成背景、教練、交通物件、面板、圖示、Logo、App 圖示；保存實際工具證據，不假定模型 slug；RGBA、64px、亮度／飽和雙閘、尺寸／hash／授權清冊。
3. PREPARED：實際整合首頁與共用課程／學生證／交通工具 UI；保留真實 3D 預覽，不讓插畫冒充遊戲畫面。主要兒童控制至少 60px，手機無鍵盤提示。
4. PREPARED：npm test、build、test:merge（5286）、test:store（5113）依序執行，一次一個 preview；補 mobile／reachability／flight-layout、透明與來源檢查，失敗修復且不放寬既有斷言。
5. PREPARED：同視口前後對照、指定 1290×2796／2064×2752 商店圖、合理壓縮包體、效能三跑（並發載僅參考）、版本同步與秘密掃描零命中。
6. PREPARED：繁中 CODEX_RESPONSE_R4_ART.md，交代可驗證改善、Apple 4.3 主觀風險與缺件；明確 staging、本機繁中 commit。

八大面向：美術＝新繪本識別與真圖；按鈕＝60px／可達；選單＝返回可見與無死路；人物＝靜態隨車教練，64px 與表情辨識；地圖＝原 GLB 保留、背景只作大廳；技能＝原教學判定與按下回饋保留；角色樣子＝透明像素雙閘，靜態正面不冒稱三視圖；動作＝原 3D 物理動畫保留，不把圖片位移稱人物動畫。原生實機、親子 beta 與閒置效能未驗即 BLOCKED。

## 執行讀回

VERIFIED：先審查22張改前圖；ART_DIRECTION、MUSE意見與開源技法研究納入；8次工具生成／編修、17個設計／18檔、7位角色雙閘與64px讀圖、完整來源hash／授權。實際接入首頁／數學／觀察／學生證／三交通模式；補乘客臉、答案一致造型、短交接鈕、手機無鍵盤提示與60px主要控制。

VERIFIED：162單元、6 Python、最終主線11尺寸132項、store12尺寸101項、mobile100情境578控制、reachability3×7、flight-layout28項／7尺寸、新視覺語意3尺寸。建置96個precache檔，22組前後配對與22張指定商店尺寸圖，秘密格式零命中。

EXECUTED：並發載p95三跑12組中位16.7～16.8ms，僅參考。BLOCKED：原生實機／簽章包與圖示catalog、真人縮圖／跨款盲測／親子回饋、人物真幀動畫與三視圖、閒置效能及既有音樂權利／提交關係證明。完整範圍見CODEX_RESPONSE_R4_ART.md；只本機commit，不推送。
