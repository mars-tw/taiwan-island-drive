async (page) => {
 const sizes=[[390,844],[375,667],[844,390],[568,320],[768,1024],[1024,768],[1440,900]];
 const records=[];
 const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 for(const [width,height] of sizes) for(const pilot of ['child','parent']) {
  await page.setViewportSize({width,height});
  await page.goto('http://localhost:5190/flight/');
  await page.waitForFunction(()=>window.__flightSchool?.getState().modelLoaded);
  const menuSnapshot=await page.locator('#menu').ariaSnapshot();
  if(!menuSnapshot.includes('出發'))throw new Error('Menu is unavailable');
  const menu=await page.evaluate(()=>({frame:window.__flightSchool.game.world.getFraming(),card:document.querySelector('.dispatch-card').getBoundingClientRect().toJSON(),start:document.querySelector('#start').getBoundingClientRect().toJSON()}));
  if(!menu.frame.contained||intersects(menu.frame.absoluteBBox,menu.card)||menu.start.bottom>height||menu.start.top<0)throw new Error('Menu framing '+JSON.stringify({width,height,pilot,menu}));
  await page.locator('.parent-settings>summary').click();
  await page.locator('#pilot-choice').selectOption(pilot);
  await page.getByRole('button',{name:'出發 ✈',exact:true}).click();
  await page.waitForFunction(()=>window.__flightSchool.getState().mode==='playing'&&window.__flightSchool.game.world.getFraming().contained);
  for(const instruments of [false,true]) {
   if(instruments)await page.locator('#instrument-toggle').click();
   if(instruments)await page.waitForFunction(()=>{const c=document.querySelector('#instruments'),d=Math.min(devicePixelRatio,2);return c.width===c.clientWidth*d&&c.height===c.clientHeight*d&&c.clientHeight>40;});
   await page.waitForFunction(()=>{const a=window.__flightSchool,layout=a.getLayout(),box=layout.stage,w=layout.window;return Math.abs(box.x-w.x)<1.1&&Math.abs(box.y-w.y)<1.1&&Math.abs(box.width-w.width)<1.1&&Math.abs(box.height-w.height)<1.1&&Math.abs(a.game.world.viewport.width-w.width)<1.1&&Math.abs(a.game.world.viewport.height-w.height)<1.1&&a.game.world.getFraming().contained;});
   const result=await page.evaluate(()=>{
    const a=window.__flightSchool,layout=a.getLayout(),frame=a.game.world.getFraming();
    const panels=['.flight-top','.lesson-prompt','.flight-controls'].map(s=>document.querySelector(s).getBoundingClientRect().toJSON());
    return {layout,frame,panels,overflow:document.documentElement.scrollWidth>innerWidth,instrumentsOpen:!document.querySelector('#instrument-panel').hidden,instrumentHeight:document.querySelector('#instruments').clientHeight,childButtons:document.querySelector('#child-panel').hidden?0:document.querySelectorAll('#child-panel button').length};
   });
   if(!result.frame.contained||!result.frame.visible||result.layout.stage.height<85||result.overflow||result.panels.some(p=>intersects(result.frame.absoluteBBox,p))||(pilot==='child'&&result.childButtons!==3)||result.instrumentsOpen!==instruments||(instruments&&result.instrumentHeight<40))throw new Error('Protected stage '+JSON.stringify({width,height,pilot,instruments,result}));
   records.push({width,height,pilot,instruments,stage:result.layout.stage,plane:result.frame.absoluteBBox,contained:true,noUiOverlap:true,childButtons:result.childButtons});
   if((width===390&&pilot==='child'&&!instruments)||(width===844&&pilot==='child'&&!instruments)||(width===1024&&pilot==='child'&&!instruments)||(width===568&&pilot==='parent'&&instruments))await page.screenshot({path:'output/playwright/flight22-'+width+'x'+height+'-'+pilot+'-'+(instruments?'instruments':'clear')+'.png'});
  }
 }
 return {status:'PASS',sizes:sizes.length,cases:records.length,records};
}
