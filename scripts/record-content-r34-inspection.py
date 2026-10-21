"""Record the fifteen originals actually displayed and inspected by Codex."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r34'
notes = [
 '第一站黃50%、14°左傾；托盤與車完整、控制未遮擋。扶正鈕仍沿用既有蛋糕彎箭頭，未宣稱重繪。',
 '第一站紅4%、27°，蛋糕向左滑至托盤邊，比01傾斜／偏移明顯；文字說可救回，沒有掉落或淘汰。',
 '同次操作減速反扶後綠100%、0°，蛋糕回到中央、已停住。泛用踏板提示沿用，未宣稱本輪改善該文案。',
 '第二站燈塔雙彎、75%、7°右傾；道路與第一站構圖不同，完整車身與扶正操作同屏。這張不冒稱完整反向連拍。',
 '第三站離灣後主路取景，沒有P牌／車格或道路重影；車頂100%回正。站牌仍標課程第三站休息灣，提示則說回到主路。',
 '第二站新車從左來、車頭向右，在黃中線下方停在線前；左側確認已失效，右側仍有勾，阿嬤在斑馬線上。等候小安的臉在車前景可見。',
 '接06實按出發，提示具名等阿嬤到對岸；主車位置和06相同，左側仍未恢復確認。停止線在車頭前且不蓋人物。',
 '接07車過後實按看左，左右皆恢復淨空勾；1/3到岸與阿嬤在對側的姓名勾一致。主車仍在線後。',
 '第二站三人到岸後主車右轉，既有側視車頭朝右，完整車身及右向箭頭都在黃中線下方；3/3、左右淨空勾與慢慢出發一致，沒有行人擋在主車前方。',
 '第三站完成只有單一完整海景合照、一條海平線與左側一座燈塔；沒有榕樹根上的大燈塔、接縫或角色遮臉，保存提示可見。靜態合照不是步態證據。',
 '第二站橘三角車票對橘圓月台，形狀不同、顏色相同；錯站紅框與比較板一致，角色與按鈕完整。',
 '第三站綠方票對藍方月台，形狀相同、顏色不同；票面、所選站牌和紅框同源，沒有以同色誤判。',
 '第三站門檻早按，0/3未加且小安仍在門檻；車廂票面持續可見。下層等候人影仍半透明，此項明列未修，不宣稱消除分屏問題。',
 '接13放開站穩，仍0/3、同一門檻位置，按鈕說再按住走；站姿與提示一致，沒有將少量傾斜差異宣稱新角色動畫。',
 '第三站三位朋友各有屈膝坐姿，臀部接座墊、雙腳向下，3/3及姓名勾一致；月台清空，收踏階按鈕完整可見。',
]
review = json.loads((OUT / 'review-set.json').read_text(encoding='utf-8'))
assert len(review['shots']) == len(notes) == 15
rows = []
for r, note in zip(review['shots'], notes):
    assert hashlib.sha256((ROOT / r['path']).read_bytes()).hexdigest() == r['sha256']
    rows.append(dict(path=r['path'], sha256=r['sha256'], status='VERIFIED', result=note))
(OUT / 'review-inspection.json').write_text(json.dumps(dict(status='VERIFIED', reviewer='Codex direct visual self-review; not an independent Muse review', rows=rows), ensure_ascii=False, indent=2), encoding='utf-8')
print('VERIFIED fifteen individually displayed and inspected originals')
