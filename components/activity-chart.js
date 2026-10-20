/* CMP-W01 · ActivityChart. Open/Box, theme tokens, no tracking or chart dependency.
   One instance per container; the GA4 adapter is separate from plotting/layout. */
(function (global) {
 'use strict';
 const NS='http://www.w3.org/2000/svg', instances=new Map(),cache=new Map();
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function normalize(payload){
  const h=payload&&payload.history||payload;
  if(!h||!Array.isArray(h.days)||h.days.length>366||typeof h.time_zone!=='string'||!Number.isFinite(Date.parse(h.updated_at)))throw new Error('unavailable');
  let previous='';
  const days=h.days.map(d=>{
   if(!d||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||new Date(d.date+'T00:00:00Z').toISOString().slice(0,10)!==d.date||d.date<=previous)throw new Error('invalid_date');
   previous=d.date;const row={date:d.date};
   for(const key of ['all','ios','android']){const n=d[key];if(n!==null&&(!Number.isSafeInteger(n)||n<0))throw new Error('invalid_metric');row[key]=n;}
   return row;
  });return Object.assign({},h,{days});
 }
 function pathFor(values,width=600,height=160){
  const max=Math.max(1,...values.filter(n=>n!==null)),ceiling=Math.max(2,Math.ceil(max/10)*10);let path='',open=false;
  const points=values.map((value,i)=>{
   if(value===null){open=false;return null;}
   const x=values.length===1?width/2:i*width/(values.length-1),y=height-value/ceiling*height;
   path+=(open?' L':'M')+x.toFixed(2)+' '+y.toFixed(2);open=true;return{x,y,value};
  });return{path,points,ceiling};
 }
 const copy=(en,hi)=>document.documentElement.dataset.lang==='hi'?hi:(global.AA_tr?global.AA_tr(en):en);
 const el=(name,text,cls)=>{const x=document.createElement(name);if(text!=null)x.textContent=text;if(cls)x.className=cls;return x;};
 const svg=(name,attrs)=>{const x=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs||{}))x.setAttribute(k,String(v));return x;};
 const fmt=n=>new Intl.NumberFormat(document.documentElement.dataset.lang==='hi'?'hi-IN':'en-IN').format(n);
 function dateText(raw){return new Intl.DateTimeFormat(document.documentElement.dataset.lang==='hi'?'hi-IN':'en-IN',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(raw+'T00:00:00Z'));}
 class ActivityChart {
  constructor(root,options={}){
   if(!root.id)throw new Error('A stable chart id is required');this.root=root;this.options=options;this.platform='all';this.data=null;this.error=false;this.loading=false;this.open=!root.hidden;this.lastTrigger=null;
   this.loadData=options.load||(()=>{
    const url=root.dataset.source;const saved=cache.get(url);if(saved&&Date.now()-saved.at<60000)return saved.promise;
    const promise=fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)}).then(r=>{if(!r.ok)throw new Error('unavailable');return r.json();}).then(normalize);
    cache.set(url,{at:Date.now(),promise});promise.catch(()=>cache.delete(url));return promise;
   });this.render();instances.set(root.id,this);
  }
  toggle(trigger){this.open=!this.open;this.root.hidden=!this.open;this.lastTrigger=trigger;this.syncTriggers();if(this.open)this.load();}
  restoreFocus(){const target=this.lastTrigger?.isConnected?this.lastTrigger:Array.from(document.querySelectorAll('[data-activity-target]')).find(b=>b.dataset.activityTarget===this.root.id&&b.getClientRects().length);target?.focus();}
  syncTriggers(){for(const b of document.querySelectorAll('[data-activity-target]'))if(b.dataset.activityTarget===this.root.id)b.setAttribute('aria-expanded',String(this.open));}
  async load(){if(this.loading)return;this.loading=true;this.error=false;this.render();try{this.data=normalize(await this.loadData());}catch{this.error=true;}finally{this.loading=false;this.render();}}
  render(){
   const root=this.root;root.replaceChildren();root.classList.add('activity-chart');root.setAttribute('role','region');root.setAttribute('aria-labelledby',root.id+'-title');root.setAttribute('aria-busy',String(this.loading));
   const head=el('div',null,'activity-chart__head');const title=el('h3',this.options.heading||copy('Daily active users','दैनिक सक्रिय उपयोगकर्ता'));title.id=root.id+'-title';head.append(title);
   const close=el('button',copy('Close chart','ग्राफ़ बंद करें'),'activity-chart__close');close.type='button';close.addEventListener('click',()=>{this.toggle(this.lastTrigger);this.restoreFocus();});head.append(close);root.append(head);
   const periods=el('div',null,'activity-chart__periods');periods.setAttribute('role','group');periods.setAttribute('aria-label',copy('Time range','समय अवधि'));
   for(const [key,en,hi] of [['daily','Daily','दैनिक'],['weekly','Weekly','साप्ताहिक'],['monthly','Monthly','मासिक'],['yearly','Yearly','वार्षिक']]){const b=el('button',copy(en,hi));b.type='button';b.disabled=key!=='daily';b.setAttribute('aria-pressed',String(key==='daily'));if(b.disabled)b.title=copy('Available later','बाद में उपलब्ध');periods.append(b);}root.append(periods);
   const filters=el('div',null,'activity-chart__filters');filters.setAttribute('role','group');filters.setAttribute('aria-label',copy('Platform','प्लैटफ़ॉर्म'));
   for(const [key,en,hi]of [['all','All','सभी'],['ios','iOS','iOS'],['android','Android','एंड्रॉयड']]){const b=el('button',copy(en,hi));b.type='button';b.dataset.platform=key;b.setAttribute('aria-pressed',String(this.platform===key));b.addEventListener('click',()=>{this.platform=key;this.render();this.root.querySelector('[data-platform="'+key+'"]').focus();});filters.append(b);}root.append(filters);
   const state=el('p',this.loading?copy('Loading daily activity…','दैनिक गतिविधि लोड हो रही है…'):this.error?copy('Activity is temporarily unavailable.','गतिविधि अभी उपलब्ध नहीं है।'):'','activity-chart__state');state.setAttribute('role','status');root.append(state);
   if(this.error){const retry=el('button',copy('Retry','फिर प्रयास करें'));retry.type='button';retry.addEventListener('click',()=>this.load());root.append(retry);}
   if(!this.data){if(!this.loading&&!this.error)state.textContent=copy('Open the chart to load daily activity.','दैनिक गतिविधि देखने के लिए ग्राफ़ खोलें।');return;}
   const data=this.data,days=data.days.slice(-14),last=days.at(-1),value=last?.[this.platform];
   const summary=el('p',last?dateText(last.date)+' · '+(value===null?copy('Not reported','रिपोर्ट नहीं हुआ'):fmt(value))+' '+copy('active users','सक्रिय उपयोगकर्ता'):copy('No daily data yet.','अभी दैनिक डेटा नहीं है।'),'activity-chart__summary');root.append(summary);
   if(days.length){
    const g=pathFor(days.map(d=>d[this.platform]));const figure=el('figure');const graph=svg('svg',{viewBox:'0 0 660 205',role:'img','aria-labelledby':root.id+'-svg-title'});const t=svg('title');t.id=root.id+'-svg-title';t.textContent=copy('Daily active users for the last 14 complete days. Exact values are in the table below.','पिछले 14 पूरे दिनों के दैनिक सक्रिय उपयोगकर्ता। नीचे तालिका में सही संख्या देखें।');graph.append(t);
    for(const [y,n]of [[0,g.ceiling],[80,g.ceiling/2],[160,0]]){graph.append(svg('line',{x1:42,y1:y+10,x2:642,y2:y+10,class:'activity-chart__grid'}));const label=svg('text',{x:34,y:y+14,'text-anchor':'end',class:'activity-chart__axis'});label.textContent=fmt(n);graph.append(label);}
    const plot=svg('g',{transform:'translate(42 10)'});plot.append(svg('path',{d:g.path,class:'activity-chart__line'}));
    const detail=el('figcaption',copy('Select a point for its date and value.','तारीख और संख्या के लिए बिंदु चुनें।'));detail.setAttribute('aria-live','polite');
    g.points.forEach((p,i)=>{if(!p)return;const label=dateText(days[i].date)+': '+fmt(p.value);const dot=svg('circle',{cx:p.x,cy:p.y,r:4,tabindex:0,role:'img','aria-label':label,class:'activity-chart__point'});const show=()=>{detail.textContent=label;};dot.addEventListener('focus',show);dot.addEventListener('pointerenter',show);const hint=svg('title');hint.textContent=label;dot.append(hint);plot.append(dot);});graph.append(plot);
    for(const i of [...new Set([0,Math.floor((days.length-1)/2),days.length-1])]){const label=svg('text',{x:42+(days.length===1?300:i*600/(days.length-1)),y:194,'text-anchor':i===0?'start':i===days.length-1?'end':'middle',class:'activity-chart__axis'});label.textContent=dateText(days[i].date);graph.append(label);}figure.append(graph,detail);root.append(figure);
    const details=el('details');details.append(el('summary',copy('View daily values','दैनिक संख्याएँ देखें')));const table=el('table');table.append(el('caption',copy('Active users by day','दिन के अनुसार सक्रिय उपयोगकर्ता')));const header=el('tr');for(const x of [copy('Date','तारीख'),copy('All','सभी'),'iOS','Android'])header.append(el('th',x));const thead=el('thead');thead.append(header);const tbody=el('tbody');for(const d of days){const tr=el('tr');tr.append(el('th',dateText(d.date)));for(const key of ['all','ios','android'])tr.append(el('td',d[key]===null?'—':fmt(d[key])));tbody.append(tr);}table.append(thead,tbody);details.append(table);root.append(details);
   }
   root.append(el('p',copy('Completed days · GA4 active users · app streams only. Platform counts can overlap.','पूरे दिन · GA4 सक्रिय उपयोगकर्ता · केवल ऐप। प्लैटफ़ॉर्म की संख्याओं में एक ही व्यक्ति शामिल हो सकता है।'),'activity-chart__note'));
   root.append(el('p',copy('Timezone: ','समय क्षेत्र: ')+data.time_zone+' · '+copy('Updated: ','अपडेट: ')+new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(data.updated_at)),'activity-chart__note'));
   if(data.thresholded||data.data_loss||data.sampled)root.append(el('p',copy('Analytics reports limitations; missing values are gaps, not zero.','एनालिटिक्स की सीमाएँ हैं; गायब संख्या को शून्य नहीं दिखाया गया है।'),'activity-chart__note'));
   const stale=Date.now()-Date.parse(data.updated_at)>36*60*60*1000;if(stale)root.append(el('p',copy('This data is older than 36 hours.','यह डेटा 36 घंटे से अधिक पुराना है।'),'activity-chart__note'));
  }
 }
 function triggerMarkup(id,label){return '<button type="button" class="activity-chart-toggle" data-activity-target="'+escape(id)+'" aria-controls="'+escape(id)+'" aria-expanded="'+String(!!instances.get(id)?.open)+'" aria-label="'+escape(label)+'" title="'+escape(label)+'"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><path d="M3 3v14h14M6 12l3-4 3 2 4-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';}
 if(typeof module!=='undefined'&&module.exports)module.exports={normalize,pathFor};
 global.AAActivityChart={mount:(root,options)=>instances.get(root.id)||new ActivityChart(root,options),triggerMarkup,normalize,pathFor};
 if(typeof document==='undefined')return;
 document.addEventListener('click',e=>{const trigger=e.target.closest?.('[data-activity-target]');if(trigger){const chart=instances.get(trigger.dataset.activityTarget);if(chart)chart.toggle(trigger);}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const chart of instances.values())if(chart.open&&chart.root.contains(document.activeElement)){chart.toggle(chart.lastTrigger);chart.restoreFocus();}});
 document.addEventListener('aa:lang',()=>{for(const chart of instances.values())chart.render();});
 for(const root of document.querySelectorAll('[data-activity-chart]'))global.AAActivityChart.mount(root);
})(typeof window==='undefined'?globalThis:window);
