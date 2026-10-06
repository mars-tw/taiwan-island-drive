export const ROUTES = {
  coast: {id:'coast',name:'花東海岸',tag:'海風與山巒',stationNames:['海風','藍灣','山海'],sky:0xbad7df,ground:0x7f9a67,rail:0x69716c,fog:0xc4dbdd,curve:20,hill:1.4,grade:0.003,theme:'coast'},
  city: {id:'city',name:'台北城市',tag:'高架與市街',stationNames:['河畔','星光','城市'],sky:0xbbcbd9,ground:0x899b87,rail:0x707b84,fog:0xc5d3df,curve:12,hill:1,grade:0.002,theme:'city'},
  forest: {id:'forest',name:'阿里山森林',tag:'林間與緩坡',stationNames:['杉林','雲霧','森林'],sky:0xc2dbcc,ground:0x73875b,rail:0x6c6b60,fog:0xd1ddcd,curve:24,hill:3,grade:0.007,theme:'forest'},
};
export const LESSONS = {
  lesson1:{id:'lesson1',name:'第一課・起步與停車',short:'起步與停車',description:'開電源、關門、選前進；練習提早減速，在海風站停好並接客。',stops:[420],limit:40,signals:[{at:160,type:'green'}],end:460},
  lesson2:{id:'lesson2',name:'第二課・精準停靠',short:'精準停靠',description:'連續停靠兩站。動力歸零後仍會滑行，留意煞車建立的時間。',stops:[420,850],limit:55,signals:[{at:270,type:'yellow'},{at:650,type:'yellow'}],end:890},
  lesson3:{id:'lesson3',name:'第三課・號誌與限速',short:'號誌與限速',description:'前方列車尚未離開：在紅燈前停車等候。路段限速改變時提早收動力。',stops:[450,930],limit:50,signals:[{at:220,type:'red'},{at:730,type:'yellow'}],end:970},
};
export const VEHICLES = {
  commuter:{id:'commuter',name:'海島通勤電車',description:'平順、反應均衡',mass:78000,power:900000,maxTraction:64000,serviceDecel:0.8,emergencyDecel:1.12,adhesion:0.19,color:0xc5d9de},
  regional:{id:'regional',name:'山海區間列車',description:'較重，煞車要提早',mass:96000,power:800000,maxTraction:58000,serviceDecel:0.7,emergencyDecel:1.0,adhesion:0.17,color:0xbfd0c9},
};
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
