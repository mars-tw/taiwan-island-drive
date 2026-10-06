import { APP_BASE } from '../../shared/paths.js';
export const AIRCRAFT = {
  trainer: {id:'trainer',name:'海燕教練機',subtitle:'單發高翼・穩定好上手',mass:900,wingArea:16.2,thrust:2500,cd0:0.027,cl0:0.25,clAlpha:5.15,stallAngle:0.285,stallSpeed:24,rotateSpeed:29,maxSpeed:62,color:0xf5f1e7},
  touring: {id:'touring',name:'白鷺巡航機',subtitle:'相同機體・較重的巡航設定',mass:1040,wingArea:16.2,thrust:2800,cd0:0.029,cl0:0.25,clAlpha:5.15,stallAngle:0.285,stallSpeed:26,rotateSpeed:31,maxSpeed:68,color:0xb4d9df}
};
export const RUNWAY = { halfWidth:24, start:0, end:1800, lessonStopMargin:60 };
export const MAP_EXTENT = { width:36000, depth:36000, halfSize:18000, maxAltitude:1800 };
export const MAPS = {
  coast:{id:'coast',name:'花東海岸',tag:'山海之間的第一趟飛行',sky:0xbdddea,sea:0x397b9b,grass:0x77916b,mountains:0x49776e},
  valley:{id:'valley',name:'縱谷練習場',tag:'沿著田野辨認方向',sky:0xc9dfe5,sea:0x739e9a,grass:0x879370,mountains:0x557866},
  island:{id:'island',name:'澎湖離島',tag:'海風、玄武岩與晴空',sky:0xaed9e7,sea:0x267e9f,grass:0x9fa279,mountains:0x777869},
  metro:{id:'metro',name:'都會河岸',tag:'沿著河流看看城市',sky:0xc8dce6,sea:0x477e91,grass:0x8c9c7e,mountains:0x647e79}
};
export const LESSONS = {
  takeoff:{id:'takeoff',number:'01',name:'滑行與起飛',description:'用方向舵守住跑道，增加油門，再輕拉操縱桿。',goal:'離地後爬升至 150 呎，保持航向。'},
  navigation:{id:'navigation',number:'02',name:'轉彎與導航',description:'小幅傾斜機翼，觀察航向與高度的變化。',goal:'依序穿過三個空中導航圈。'},
  landing:{id:'landing',number:'03',name:'進場與降落',description:'沿著進場燈下降，減小油門，接地後煞停。',goal:'在跑道接地，油門歸零並煞停。'},
  free:{id:'free',number:'∞',name:'自由飛行',description:'點一下就起飛，看看遠方的風景。',goal:'探索大地圖，想回家時按返航。'},
  treasure:{id:'treasure',number:'★',name:'空中尋寶',description:'從空中出發，跟著星星找六份寶藏。',goal:'飛近六顆星星，把寶藏帶回來。',startsAirborne:true},
  mail:{id:'mail',number:'✉',name:'飛行郵差',description:'把兩份郵件送到島上的郵箱。',goal:'飛過郵箱，讓郵件落在送達區。',startsAirborne:true},
  tour:{id:'tour',number:'◎',name:'島嶼巡航',description:'飛到燈塔、河灣與港口，看看不同風景。',goal:'依序探訪三個景點，平穩飛過觀景區。',startsAirborne:true}
};
export const BASE = APP_BASE;
