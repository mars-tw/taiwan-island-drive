"""Record Codex's actual visual inspection of the fifteen displayed originals."""
import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'docs/content/r33'
review=json.loads((out/'review-set.json').read_text(encoding='utf-8'))
notes=[
 '黃50%、14°左傾，主車與托盤完整，特寫已收起，只有一句主要指令。',
 '紅4%、27°，蛋糕左移更大、托盤邊可見，沒有角色被操作鈕遮住。',
 '綠100%、0°且已停住；蛋糕回到中央，主車中心不在中線，數值與畫面一致。',
 '車格退到右後、P牌移出取景；慢速與出口畫面相符，沒有道路重影。',
 '主路沒有P牌與車格，車在右側車道，與04位置不同，車身與蛋糕都完整。',
 '來車接近，三位朋友都在線後；左右觀察窗車位不同，沒有停止標記蓋頭。',
 '小安在線上，原因句具名；來車與白線同上方車道，白線在車頭前，不碰任何行人。',
 '阿嬤在第二站先過街、左側車停在線後；白線沒有蓋頭，路口背景與第一站不同。',
 '小柏牽車在線上、2/3人到岸；具名原因與淨空勾一致，人物沒有被交通標記遮住。',
 '第三站完成，三位朋友出場且旅程已保存；完成圖沒有遮臉，沒有把靜態結尾當步態證據。',
 '藍圓票對藍方月台，形狀不同、顏色相同；紅框月台與比較板同源，沒有誤稱都一樣。',
 '門檻早按，站姿短暫傾斜、0/3未加；3號月台與藍圓票仍可見，小安只在車內一處。',
 '放開站穩，雙腳落地、0/3且可續走；仍在同一站穩點，外部車窗沒有分身。',
 '小安已到走道，太早續走仍停住；位置比門檻靠左，仍0/3，車內外沒有重複人物。',
 '三人各在座位上屈膝坐好、已入座3/3；腰部與座墊同高，票面與月台一致，沒有跨步入座。'
]
assert len(review['shots'])==len(notes)==15
rows=[]
for r,note in zip(review['shots'],notes):
 assert hashlib.sha256((root/r['path']).read_bytes()).hexdigest()==r['sha256']
 rows.append(dict(path=r['path'],sha256=r['sha256'],status='VERIFIED',result=note))
(out/'review-inspection.json').write_text(json.dumps(dict(status='VERIFIED',reviewer='Codex; direct visual self-review, not independent Muse review',rows=rows),ensure_ascii=False,indent=2),encoding='utf-8')
print('VERIFIED fifteen individually inspected originals')
