"""Record notes only after Codex has directly displayed all fifteen originals."""
import datetime
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r36'
notes=[
 '第1站左傾14度、穩定度50%，推向右亮黃；左側盤緣與錯扶外框皆紅。沿用R35海岸坡與手勢，沒有新增玩法或美術。',
 '接01同局錯扶，左傾27度、穩定度4%；蛋糕滑向左緣、盤緣紅線清楚，提示煞車一起扶。這是R35既有滑動效果。',
 '接02煞車反扶後，蛋糕回中央、100%、0度與已停住一致，左右手回中性。',
 '第2站燈塔雙彎右傾16度、穩定度28%，推向左亮黃、右側警示為紅；與01鏡像方向一致。',
 '第3站主路、慢速、0度、100%與回到主路提示一致，沒有休息灣標示殘留。',
 '第2站尚未觀察左右：兩格標題及下方均寫還沒看；小圖完全遮住，沒有車圖、道路標線或淨空／接近等結論。主場景、朋友與控制維持原樣。',
 '同站只看右側：右格與放大窗顯示車正在接近、等車通過，沒有安全勾；左格仍是遮蔽與還沒看，已修正R35圖07洩漏左側答案的問題。',
 '看過兩側後，左格車停在線前、等朋友過街；右格淨空且我看過了。阿嬤在斑馬線中段、主車停在線後，計數仍0/3。',
 '接08同次等待，阿嬤與菜籃已接近對岸且腿姿改變，計數仍0/3；兩側結論與已觀察狀態一致，沒有提前計入。',
 '朋友全到岸才3/3；主車在下方車道向右行，站牌、提示及灰色出發鍵同步已出發，兩側皆淨空與看過。',
 '第3站選綠圓形月台，與綠正方形車票比對：形狀不同、顏色相同；提示再比輪廓。沿用R35配對畫面。',
 '接11改選藍正方形月台：形狀相同、顏色不同，提示再看色塊；三位朋友仍在月台、0/3。',
 '配對成功後小安在門檻，圓環44%、0/3；另兩位朋友不透明候車，每人只出現一次，尚未入座不加人數。',
 '接13放開，圓環保留同段進度並顯示暫停，小安換成扶門框姿勢、仍0/3，提示進度留著。',
 '同站三人都有屈膝坐姿與姓名勾，3/3同步，只留收踏階；R35既有燈塔殘塊與上方留白未在本輪改動。',
]
m=json.loads((OUT/'review-set.json').read_text(encoding='utf-8'));assert len(m['shots'])==len(notes)==15
rows=[]
for r,note in zip(m['shots'],notes):
 assert hashlib.sha256((ROOT/r['path']).read_bytes()).hexdigest()==r['sha256']
 rows.append(dict(**r,status='VERIFIED',inspection=note))
(OUT/'review-inspection.json').write_text(json.dumps(dict(status='VERIFIED',reviewer='Codex execution-line self-inspection; not an independent Muse score',
 method='all fifteen original 390x844 files directly displayed at original resolution',checkedAt=datetime.datetime.now().astimezone().isoformat(),rows=rows),ensure_ascii=False,indent=2),encoding='utf-8')
print('VERIFIED fifteen original-size visual inspection notes')
