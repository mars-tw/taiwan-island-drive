import { APP_BASE } from '../../shared/paths.js';
export const AIRCRAFT = {
  trainer: {id:'trainer',name:'海燕教練機',subtitle:'單發高翼・穩定好上手',mass:900,wingArea:16.2,thrust:2500,cd0:0.027,cl0:0.25,clAlpha:5.15,stallAngle:0.285,stallSpeed:24,rotateSpeed:29,maxSpeed:62,color:0xf5f1e7},
  touring: {id:'touring',name:'白鷺巡航機',subtitle:'相同機體・較重的巡航設定',mass:1040,wingArea:16.2,thrust:2800,cd0:0.029,cl0:0.25,clAlpha:5.15,stallAngle:0.285,stallSpeed:26,rotateSpeed:31,maxSpeed:68,color:0xb4d9df}
};
export const RUNWAY = { halfWidth:24, start:0, end:1800, lessonStopMargin:60 };
export const MAPS = {
  coast:{id:'coast',name:'花東海岸',tag:'山海之間的第一趟飛行',sky:0xbdddea,sea:0x397b9b,grass:0x77916b,mountains:0x49776e},
  valley:{id:'valley',name:'縱谷練習場',tag:'沿著田野辨認方向',sky:0xc9dfe5,sea:0x739e9a,grass:0x879370,mountains:0x557866},
  island:{id:'island',name:'澎湖離島',tag:'海風、玄武岩與晴空',sky:0xaed9e7,sea:0x267e9f,grass:0x9fa279,mountains:0x777869}
};
export const LESSONS = {
  takeoff:{id:'takeoff',number:'01',name:'滑行與起飛',description:'用方向舵守住跑道，增加油門，再輕拉操縱桿。',goal:'離地後爬升至 150 呎，保持航向。'},
  navigation:{id:'navigation',number:'02',name:'轉彎與導航',description:'小幅傾斜機翼，觀察航向與高度的變化。',goal:'依序穿過三個空中導航圈。'},
  landing:{id:'landing',number:'03',name:'進場與降落',description:'沿著進場燈下降，減小油門，接地後煞停。',goal:'在跑道接地，油門歸零並煞停。'},
  free:{id:'free',number:'∞',name:'自由飛行',description:'從跑道出發，自己安排飛行與返場。',goal:'練習油門、姿態與襟翼，隨時可以重來。'}
};
export const BASE = APP_BASE;
