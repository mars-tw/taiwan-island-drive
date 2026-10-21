"""UTF-8 notes for each original image that Codex directly inspected."""
import datetime
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r35'
notes=[
 '左傾14度與蛋糕傾斜同向，托盤左側紅邊清楚；推向右為黃色正解，錯按推向左為橘紅。第一站保持海岸坡背景。',
 '同次錯扶延續到左傾27度、穩定度4%；蛋糕越過托盤左緣，盤緣與錯向按鈕同時警示，仍可救回。',
 '同次反扶與煞車後回中央，100%、0度、已停住一致；提示是停車起步，左右手都回中性。',
 '第二站右傾16度、右邊紅警示，推向左亮黃、推向右錯扶橘紅；燈塔雙彎與第一站坡道明顯不同。',
 '第三站站牌為主路，提示回到主路，車速慢速、角度0度、100%一致；沒有休息灣停車格或P牌殘影。',
 '左側觀察窗超過半個場景，來車車頭朝右，完整車身在黃中線下；白色停止線在車頭前。此圖只作觀察證據，阿嬤動作看08與09。',
 '右側放大視野，來車車頭朝左，完整車身在黃中線上；有車側沒有安全勾，背景保留原路口。',
 '同次第二站等待，放大窗已收回，阿嬤在斑馬線中段、全身與菜籃可見；仍0/3且主車停在線後。',
 '接08同次等待，阿嬤與菜籃明顯向對岸移動、腿姿不同，未提前計入到岸；主車保持停等。',
 '主車已向右進入下方車道，側車比例與原來車一致；上方站牌、提示及灰色出發鈕同步說已出發，沒有反向或跨中線。',
 '第三站小安在門檻、站穩圓環0%，兩位朋友是不透明候車人物，每人只出現一次；0/3尚未計入。',
 '接11持續按住到44%，場景圓環與按鈕環同時填滿近一半；人仍在同一門檻，沒有偷加人數。',
 '接12放開，圓環藍色暫停符號、保留同一段進度；小安改為張手扶門框的失衡姿勢，與14正常站姿明顯不同。',
 '接13再按住到完整綠環與勾，小安雙腳站穩、雙手扶背包；計數仍0/3，滿圈後才繼續走。',
 '同次第三站三人有屈膝坐姿、臀部接座墊、雙腳朝下，姓名勾與3/3一致；月台沒有分身，只留收踏階。',
]
m=json.loads((OUT/'review-set.json').read_text(encoding='utf-8'))
assert len(notes)==len(m['shots'])==15
rows=[]
for r,note in zip(m['shots'],notes):
 assert hashlib.sha256((ROOT/r['path']).read_bytes()).hexdigest()==r['sha256']
 assert '?' not in note and any('\u4e00'<=c<='\u9fff' for c in note)
 rows.append(dict(**r,status='VERIFIED',inspection=note))
result=dict(status='VERIFIED',reviewer='Codex self-inspection, not independent Muse review',method='Original 390x844 files directly displayed. Latest changed images01-10 re-displayed after final art rerun; 11-15 hashes unchanged from direct inspection.',checkedAt=datetime.datetime.now().astimezone().isoformat(),rows=rows)
(OUT/'review-inspection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('VERIFIED 15 readable UTF-8 original-image inspection notes')
