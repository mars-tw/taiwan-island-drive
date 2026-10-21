"""Record only after directly opening all fifteen original phone captures."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r37'
notes=[
 ('左傾14°、50%，推右亮黃；錯扶推左為橘紅框。蛋糕、盤緣及六鍵皆沿用R35。','R35同操作；可見文字相同，動態擷取有小幅幀差；托盤支撐及方向教學問題未改。'),
 ('接01錯扶後左傾27°、4%，蛋糕更靠左緣，提示煞車一起扶。','R35既有錯扶加劇；不是新物理；盤緣與蛋糕分離感依本線限制保留。'),
 ('接02煞車反扶後100%、0°、已停住一致；左右鍵回中性。','R35同一救回結果；補入連續三張證據，不宣稱新增玩法。'),
 ('第2站右傾16°、28%，推左亮黃、右盤緣紅；與01相反。','使用R35歷史原尺寸同狀態基準；原畫與操作不變。'),
 ('三站完成、三位朋友與完整蛋糕在桌上分享，三項完成回顧可見。','R35原有完成場景；本輪精選補出真正送達，取代只見行車的不足。'),
 ('第2站雙側道路遮罩、雙小窗還沒看；主道路無來車，三位朋友的頭、身體、名牌完整可見；深藍主車有「你」。','R35主道路提前畫車、縮圖公布路況；本輪主道路與小窗一起遮住。'),
 ('只看右邊、放大窗已收回；上方道路露出從右方來的車，左側仍遮住；右小窗有車、左小窗還沒看。','R35尚未看的左側仍會公布路況；本輪左主道路及縮圖同步未知。'),
 ('同一深藍主車剛起步、仍在原支路；3/3到岸、灰鈕已出發、車旁「你」可見。','R35此時尚為車尾原圖；本輪加固定身份與跟車標籤，保留道路構圖。'),
 ('接08同車沿支路向前，接近路口；沒有突然換成淺藍車。','R35接道階段會切換側向來車素材；本輪同一原圖連續移動與縮放。'),
 ('接09同一深藍主車旋轉接入下方靠右車道，「你」仍跟車；朋友全在對岸。','R35此狀態使用淺藍來車素材；本輪appearance id與原圖不變。呈現是2D原圖旋轉，未宣稱3D轉向。'),
 ('綠正方形票與綠圓形月台：形狀不同、顏色相同，提示再比輪廓。','R35原版比對；未加「你的車票／這個月台」欄標，Muse第4項仍未修。'),
 ('接11選藍正方形：形狀相同、顏色不同，提示再看票色。','R35原版雙線索；只補原尺寸決策證據。'),
 ('按住時小安在門檻、主圈44%、0/3，另外兩人等候。按鈕內第二圈仍存在。','R35原版；上方圖示、燈塔殘塊及雙圈問題未改，不列為通過版面驗收。'),
 ('接13放開，小安換扶門框姿勢、0/3；主圈顯示Ⅱ。','R35原版；模型進度保留已測，但畫面沒有44%數字，Muse第5項未修。'),
 ('收踏階、關門後三人都在車窗，3/3、車門關閉、正在出發同時可見。','R35原有結尾，本輪補入精選；沒有改車票課。'),
]
m=json.loads((OUT/'review-set.json').read_text(encoding='utf8'));c=json.loads((OUT/'r35-comparison.json').read_text(encoding='utf8'))
assert len(m['shots'])==len(notes)==len(c['rows'])==15
rows=[]
for i,(shot,(result,difference),comparison) in enumerate(zip(m['shots'],notes,c['rows']),1):
 assert hashlib.sha256((ROOT/shot['path']).read_bytes()).hexdigest()==shot['sha256']
 rows.append(dict(number=i,path=shot['path'],sha256=shot['sha256'],width=390,height=844,inspectionStatus='VERIFIED',result=result,r35Difference=difference,r35Path=comparison['r35'],changedPixels=comparison['changedPixels']))
(OUT/'review-inspection.json').write_text(json.dumps(dict(status='VERIFIED',method='Codex directly displayed each final original with view_image; this is same-agent inspection, not independent Muse review',shots=rows),ensure_ascii=False,indent=2),encoding='utf8')
print('VERIFIED 15 individually displayed originals, with explicit remaining issues and R35 differences')
