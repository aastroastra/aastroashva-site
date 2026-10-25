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
 function periodText(raw,period){const lang=document.documentElement.dataset.lang==='hi'?'hi-IN':'en-IN';return period==='monthly'?new Intl.DateTimeFormat(lang,{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(raw+'T00:00:00Z')):dateText(raw);}
 /* Weeks start Monday. New users sum exactly; a bucket with no reported day stays missing.
    The first bucket is dropped when the data starts mid-period; the last may be in progress. */
 function bucket(days,period){
  if(period==='daily')return days.map(d=>Object.assign({},d,{partial:false}));
  const start=raw=>{const t=new Date(raw+'T00:00:00Z');if(period==='monthly')return raw.slice(0,8)+'01';t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+6)%7);return t.toISOString().slice(0,10);};
  const end=key=>{const t=new Date(key+'T00:00:00Z');if(period==='monthly'){t.setUTCMonth(t.getUTCMonth()+1);t.setUTCDate(0);}else t.setUTCDate(t.getUTCDate()+6);return t.toISOString().slice(0,10);};
  const out=[];for(const d of days){const key=start(d.date);let b=out.at(-1);if(!b||b.date!==key){b={date:key,first:d.date,last:d.date,all:null,ios:null,android:null};out.push(b);}b.last=d.date;for(const k of ['all','ios','android'])if(d[k]!==null)b[k]=(b[k]||0)+d[k];}
  if(out.length>1&&out[0].first!==out[0].date)out.shift();
  return out.map(b=>({date:b.date,all:b.all,ios:b.ios,android:b.android,partial:b.last<end(b.date)}));
 }
 const METRICS={active:{periods:['daily']},downloads:{periods:['daily','weekly','monthly']}};
 /* Performance and usage from stats.json (site-stats, daily, real signed-in accounts for the ratios).
    Big numbers: AshvaAI questions per person, then the 7-day return rate; the Play rating only when
    the server sends it (4.3 or more). Reach and the exact usage counts sit under "More". */
 const STATS_URL='https://gttszlununmqivrqevwv.supabase.co/storage/v1/object/public/site/stats.json';
 const USAGE_LABELS={answers:['{n} AshvaAI answers','{n} AshvaAI उत्तर'],kundalis:['{n} kundalis made','{n} कुंडलियाँ बनीं'],matches:['{n} kundali matches','{n} कुंडली मिलान'],multimatches:['{n} multi-matches','{n} मल्टी-मैच'],palm:['{n} palm readings','{n} हस्तरेखा विश्लेषण'],face:['{n} face readings','{n} चेहरा विश्लेषण']};
 let usagePromise=null;
 function loadUsage(){if(!usagePromise)usagePromise=fetch(STATS_URL+'?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(s=>{if(!s)return null;const u=s.usage&&Array.isArray(s.usage.show)&&s.usage.display?s.usage:null;const p=s.performance&&typeof s.performance==='object'?s.performance:null;return u||p?{usage:u,perf:p}:null;}).catch(()=>null);return usagePromise;}
 function phrase(en,hi,n){const parts=copy(en,hi).split('{n}');const f=document.createDocumentFragment();f.append(parts[0]||'',el('b',String(n)),parts.slice(1).join('{n}'));return f;}
 function bigStat(value,en,hi){const box=el('div',null,'activity-chart__big');box.append(el('strong',value));box.append(el('span',copy(en,hi).replace('{n}%','').replace('{n}','').replace(/\s+/g,' ').trim()));return box;}
 function usageRow(state,onToggle){
  const {usage:u,perf:p}=state;const box=el('div',null,'activity-chart__usage');
  const hero=el('div',null,'activity-chart__bigs');
  if(p&&p.questions_per_person!=null)hero.append(bigStat(String(p.questions_per_person),'{n} AshvaAI questions per person','हर व्यक्ति औसतन {n} AshvaAI सवाल पूछता है'));
  if(p&&p.return_7d_pct!=null)hero.append(bigStat(p.return_7d_pct+'%','{n}% come back within a week','{n}% लोग एक हफ़्ते में दोबारा आते हैं'));
  // Benchmark line: our classic Day-7 rate (active on exactly day 7) against the published app average, shown only when we beat it. The 'within a week' rate is never compared.
  if(hero.childNodes.length&&p&&p.beats_benchmark===true&&p.d7_pct!=null&&p.d7_benchmark_pct!=null){const b=el('p',null,'activity-chart__note');b.append(copy('{n}% use it again on day 7, above the app average of about {b}%','{n}% लोग 7वें दिन फिर इस्तेमाल करते हैं, ऐप औसत (लगभग {b}%) से ज़्यादा').replace('{n}',String(Math.round(p.d7_pct))).replace('{b}',String(p.d7_benchmark_pct)));box.append(hero);box.append(b);hero.dataset.benchmark='1';}
  if(hero.childNodes.length){if(!hero.dataset.benchmark)box.append(hero);box.append(el('p',copy('Signed-in accounts, our team left out · updated daily','सिर्फ़ साइन-इन खाते, हमारी टीम शामिल नहीं · रोज़ अपडेट'),'activity-chart__note'));}
  if(p&&p.play_rating!=null){const r=el('p',null,'activity-chart__rating');r.append(phrase('{n} on Google Play','Google Play पर {n}',p.play_rating+' ★'));box.append(r);}
  const more=[];
  if(p&&p.cities!=null)more.push(['Kundalis from {n} cities','{n} शहरों की कुंडलियाँ',Number(p.cities).toLocaleString('en-IN')]);
  if(p&&p.languages!=null)more.push(['In {n} languages','{n} भाषाओं में',p.languages]);
  if(u)for(const k of u.show){if(USAGE_LABELS[k]&&typeof u.display[k]==='string'){const [en,hi]=USAGE_LABELS[k];more.push([en,hi,u.display[k]]);}}
  if(more.length){
   const list=el('ul',null,'activity-chart__more');list.id=(state.id||'activity')+'-more';list.hidden=!state.expanded;
   for(const [en,hi,n] of more){const li=el('li');li.append(phrase(en,hi,n));list.append(li);}
   const btn=el('button',copy(state.expanded?'Less':'More',state.expanded?'कम देखें':'और देखें'),'activity-chart__toggle');btn.type='button';btn.setAttribute('aria-expanded',String(!!state.expanded));btn.setAttribute('aria-controls',list.id);
   btn.addEventListener('click',()=>onToggle());box.append(btn,list);
  }
  if(!box.childNodes.length)return null;
  return box;
 }
 class ActivityChart {
  constructor(root,options={}){
   if(!root.id)throw new Error('A stable chart id is required');if(root.dataset.presentation==='sheet'&&root.parentElement!==document.body)document.body.append(root);this.root=root;this.options=options;this.platform='all';this.metric='active';this.period='daily';this.store={};this.data=null;this.error=false;this.loading=false;this.open=!root.hidden;this.lastTrigger=null;this.usage=null;this.usageExpanded=false;loadUsage().then(u=>{this.usage=u;if(u&&this.open)this.render();});
   this.loadData=options.load||((metric='active')=>{
    const url=root.dataset.source+(metric==='downloads'?'&metric=downloads':'');const saved=cache.get(url);if(saved&&Date.now()-saved.at<60000)return saved.promise;
    const promise=fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)}).then(r=>{if(!r.ok)throw new Error('unavailable');return r.json();}).then(normalize);
    cache.set(url,{at:Date.now(),promise});promise.catch(()=>cache.delete(url));return promise;
   });this.render();instances.set(root.id,this);
  }
  get sheet(){return this.root.dataset.presentation==='sheet';}
  /* Sheet: fixed under the top edge, slides down; leaves upward on close, drag up or outside tap. */
  toggle(trigger){this.open=!this.open;clearTimeout(this.leaving);this.root.classList.remove('is-leaving');this.root.style.removeProperty('--drag');
   if(!this.open&&this.sheet&&!this.root.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){this.root.classList.add('is-leaving');this.leaving=setTimeout(()=>{this.root.hidden=true;this.root.classList.remove('is-leaving');},220);}else this.root.hidden=!this.open;this.lastTrigger=trigger;this.syncTriggers();if(this.open)this.load();}
  dismiss(){if(this.open){this.toggle(this.lastTrigger);this.restoreFocus();}}
  dragToClose(handle){handle.addEventListener('pointerdown',e=>{if(e.button||e.target.closest('button')!==(handle.matches('button')?handle:null))return;const y0=e.clientY;let dy=0;handle.setPointerCapture(e.pointerId);this.root.classList.add('is-dragging');
   const move=ev=>{dy=Math.min(0,ev.clientY-y0);this.root.style.setProperty('--drag',dy+'px');};
   const up=()=>{handle.removeEventListener('pointermove',move);this.root.classList.remove('is-dragging');if(dy<-60)this.dismiss();else this.root.style.removeProperty('--drag');};
   handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',up,{once:true});handle.addEventListener('pointercancel',up,{once:true});});}
  restoreFocus(){const target=this.lastTrigger?.isConnected?this.lastTrigger:Array.from(document.querySelectorAll('[data-activity-target]')).find(b=>b.dataset.activityTarget===this.root.id&&b.getClientRects().length);target?.focus();}
  syncTriggers(){for(const b of document.querySelectorAll('[data-activity-target]'))if(b.dataset.activityTarget===this.root.id)b.setAttribute('aria-expanded',String(this.open));}
  async load(){const metric=this.metric;this.data=this.store[metric]||null;if(this.loading)return;this.loading=!this.data;this.error=false;this.render();try{this.store[metric]=normalize(await this.loadData(metric));}catch{this.error=!this.store[metric];}finally{this.loading=false;if(this.metric===metric)this.data=this.store[metric]||null;this.render();if(this.metric!==metric)this.load();}}
  choose(key,value){this[key]=value;if(key==='metric'){if(!METRICS[value].periods.includes(this.period))this.period='daily';this.load();}else this.render();this.root.querySelector('[data-'+key+'="'+value+'"]')?.focus();}
  render(){
   const root=this.root;root.replaceChildren();root.classList.add('activity-chart');root.setAttribute('role','region');root.setAttribute('aria-labelledby',root.id+'-title');root.setAttribute('aria-busy',String(this.loading));
   const downloads=this.metric==='downloads',period=this.period;
   const head=el('div',null,'activity-chart__head');const title=el('h3',downloads?copy('App downloads','ऐप डाउनलोड'):this.options.heading||copy('Daily active users','दैनिक सक्रिय उपयोगकर्ता'),'activity-chart__title');title.id=root.id+'-title';
   const metrics=el('div',null,'activity-chart__metric');metrics.setAttribute('role','group');metrics.setAttribute('aria-label',copy('Chart','ग्राफ़'));
   for(const [key,en,hi] of [['active','Active users','सक्रिय उपयोगकर्ता'],['downloads','Downloads','डाउनलोड']]){const b=el('button',copy(en,hi));b.type='button';b.dataset.metric=key;b.setAttribute('aria-pressed',String(this.metric===key));b.addEventListener('click',()=>this.choose('metric',key));metrics.append(b);}
   head.append(title,metrics);
   const close=el('button',copy('Close chart','ग्राफ़ बंद करें'),'activity-chart__close');close.type='button';close.addEventListener('click',()=>this.dismiss());head.append(close);root.append(head);if(this.sheet)this.dragToClose(head);
   if(this.usage){const row=usageRow({...this.usage,id:root.id,expanded:this.usageExpanded},()=>{this.usageExpanded=!this.usageExpanded;this.render();});if(row)root.append(row);}
   const periods=el('div',null,'activity-chart__periods');periods.setAttribute('role','group');periods.setAttribute('aria-label',copy('Time range','समय अवधि'));
   for(const [key,en,hi] of [['daily','Daily','दैनिक'],['weekly','Weekly','साप्ताहिक'],['monthly','Monthly','मासिक'],['yearly','Yearly','वार्षिक']]){const b=el('button',copy(en,hi));b.type='button';b.dataset.period=key;b.disabled=!METRICS[this.metric].periods.includes(key);b.setAttribute('aria-pressed',String(key===period));if(b.disabled)b.title=copy('Available later','बाद में उपलब्ध');else b.addEventListener('click',()=>this.choose('period',key));periods.append(b);}root.append(periods);
   const filters=el('div',null,'activity-chart__filters');filters.setAttribute('role','group');filters.setAttribute('aria-label',copy('Platform','प्लैटफ़ॉर्म'));
   for(const [key,en,hi]of [['all','All','सभी'],['ios','iOS','iOS'],['android','Android','एंड्रॉयड']]){const b=el('button',copy(en,hi));b.type='button';b.dataset.platform=key;b.setAttribute('aria-pressed',String(this.platform===key));b.addEventListener('click',()=>this.choose('platform',key));filters.append(b);}root.append(filters);
   const state=el('p',this.loading?(downloads?copy('Loading downloads…','डाउनलोड लोड हो रहे हैं…'):copy('Loading daily activity…','दैनिक गतिविधि लोड हो रही है…')):this.error?copy('Activity is temporarily unavailable.','गतिविधि अभी उपलब्ध नहीं है।'):'','activity-chart__state');state.setAttribute('role','status');root.append(state);
   if(this.error){const retry=el('button',copy('Retry','फिर प्रयास करें'));retry.type='button';retry.addEventListener('click',()=>this.load());root.append(retry);}
   if(!this.data){if(!this.loading&&!this.error)state.textContent=copy('Open the chart to load daily activity.','दैनिक गतिविधि देखने के लिए ग्राफ़ खोलें।');return;}
   const series=bucket(this.data.days,period),lead=period==='daily'?0:Math.min(series.findIndex(d=>d.all),series.length-2),data=this.data,days=series.slice(Math.max(lead,0)).slice(period==='daily'?-14:-12),last=days.at(-1),value=last?.[this.platform];
   const unit=downloads?copy('downloads','डाउनलोड'):copy('active users','सक्रिय उपयोगकर्ता'),soFar=last?.partial?' '+copy('so far','अब तक'):'';
   const when=d=>period==='weekly'?copy('Week of ','सप्ताह ')+dateText(d.date):periodText(d.date,period);
   const summary=el('p',last?when(last)+' · '+(value===null?copy('Not reported','रिपोर्ट नहीं हुआ'):fmt(value))+' '+unit+soFar:copy('No daily data yet.','अभी दैनिक डेटा नहीं है।'),'activity-chart__summary');root.append(summary);
   if(days.length){
    const g=pathFor(days.map(d=>d[this.platform]));const figure=el('figure');const graph=svg('svg',{viewBox:'0 0 660 205',role:'img','aria-labelledby':root.id+'-svg-title'});const t=svg('title');t.id=root.id+'-svg-title';t.textContent=downloads?copy('App downloads by '+({daily:'day',weekly:'week',monthly:'month'}[period])+'. Exact values are in the table below.','ऐप डाउनलोड। नीचे तालिका में सही संख्या देखें।'):copy('Daily active users for the last 14 complete days. Exact values are in the table below.','पिछले 14 पूरे दिनों के दैनिक सक्रिय उपयोगकर्ता। नीचे तालिका में सही संख्या देखें।');graph.append(t);
    for(const [y,n]of [[0,g.ceiling],[80,g.ceiling/2],[160,0]]){graph.append(svg('line',{x1:42,y1:y+10,x2:642,y2:y+10,class:'activity-chart__grid'}));const label=svg('text',{x:34,y:y+14,'text-anchor':'end',class:'activity-chart__axis'});label.textContent=fmt(n);graph.append(label);}
    const plot=svg('g',{transform:'translate(42 10)'});plot.append(svg('path',{d:g.path,class:'activity-chart__line'}));
    const detail=el('figcaption',copy('Select a point for its date and value.','तारीख और संख्या के लिए बिंदु चुनें।'));detail.setAttribute('aria-live','polite');
    g.points.forEach((p,i)=>{if(!p)return;const label=when(days[i])+': '+fmt(p.value)+(days[i].partial?' ('+copy('so far','अब तक')+')':'');const dot=svg('circle',{cx:p.x,cy:p.y,r:4,tabindex:0,role:'img','aria-label':label,class:'activity-chart__point'});const show=()=>{detail.textContent=label;};dot.addEventListener('focus',show);dot.addEventListener('pointerenter',show);const hint=svg('title');hint.textContent=label;dot.append(hint);plot.append(dot);});graph.append(plot);
    for(const i of [...new Set([0,Math.floor((days.length-1)/2),days.length-1])]){const label=svg('text',{x:42+(days.length===1?300:i*600/(days.length-1)),y:194,'text-anchor':i===0?'start':i===days.length-1?'end':'middle',class:'activity-chart__axis'});label.textContent=periodText(days[i].date,period);graph.append(label);}figure.append(graph,detail);root.append(figure);
    const details=el('details');details.append(el('summary',{daily:copy('View daily values','दैनिक संख्याएँ देखें'),weekly:copy('View weekly values','साप्ताहिक संख्याएँ देखें'),monthly:copy('View monthly values','मासिक संख्याएँ देखें')}[period]));const table=el('table');table.append(el('caption',downloads?copy('Downloads','डाउनलोड'):copy('Active users by day','दिन के अनुसार सक्रिय उपयोगकर्ता')));const header=el('tr');for(const x of [copy('Date','तारीख'),copy('All','सभी'),'iOS','Android'])header.append(el('th',x));const thead=el('thead');thead.append(header);const tbody=el('tbody');for(const d of days){const tr=el('tr');tr.append(el('th',when(d)+(d.partial?' *':'')));for(const key of ['all','ios','android'])tr.append(el('td',d[key]===null?'—':fmt(d[key])));tbody.append(tr);}table.append(thead,tbody);details.append(table);root.append(details);
   }
   root.append(el('p',downloads?copy('Completed days · GA4 new users (first app opens) · app streams only. Weeks start Monday; * marks a period still in progress.','पूरे दिन · GA4 नए उपयोगकर्ता (ऐप पहली बार खोला) · केवल ऐप। सप्ताह सोमवार से; * अभी चल रही अवधि है।'):copy('Completed days · GA4 active users · app streams only. Platform counts can overlap.','पूरे दिन · GA4 सक्रिय उपयोगकर्ता · केवल ऐप। प्लैटफ़ॉर्म की संख्याओं में एक ही व्यक्ति शामिल हो सकता है।'),'activity-chart__note'));
   root.append(el('p',copy('Timezone: ','समय क्षेत्र: ')+data.time_zone+' · '+copy('Updated: ','अपडेट: ')+new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(data.updated_at)),'activity-chart__note'));
   if(this.sheet){const grab=el('button',null,'activity-chart__grab');grab.type='button';grab.setAttribute('aria-label',copy('Close chart','ग्राफ़ बंद करें'));grab.addEventListener('click',()=>this.dismiss());this.dragToClose(grab);root.append(grab);}
   if(data.thresholded||data.data_loss||data.sampled)root.append(el('p',copy('Analytics reports limitations; missing values are gaps, not zero.','एनालिटिक्स की सीमाएँ हैं; गायब संख्या को शून्य नहीं दिखाया गया है।'),'activity-chart__note'));
   const stale=Date.now()-Date.parse(data.updated_at)>36*60*60*1000;if(stale)root.append(el('p',copy('This data is older than 36 hours.','यह डेटा 36 घंटे से अधिक पुराना है।'),'activity-chart__note'));
  }
 }
 function triggerMarkup(id,label){return '<button type="button" class="activity-chart-toggle" data-activity-target="'+escape(id)+'" aria-controls="'+escape(id)+'" aria-expanded="'+String(!!instances.get(id)?.open)+'" aria-label="'+escape(label)+'" title="'+escape(label)+'"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><path d="M3 3v14h14M6 12l3-4 3 2 4-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';}
 if(typeof module!=='undefined'&&module.exports)module.exports={normalize,pathFor,bucket};
 global.AAActivityChart={mount:(root,options)=>instances.get(root.id)||new ActivityChart(root,options),triggerMarkup,normalize,pathFor};
 if(typeof document==='undefined')return;
 document.addEventListener('click',e=>{const trigger=e.target.closest?.('[data-activity-target]');if(trigger){const chart=instances.get(trigger.dataset.activityTarget);if(chart)chart.toggle(trigger);}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const chart of instances.values())if(chart.open&&(chart.sheet||chart.root.contains(document.activeElement)))chart.dismiss();});
 document.addEventListener('pointerdown',e=>{if(e.target.closest?.('[data-activity-target]'))return;for(const chart of instances.values())if(chart.open&&chart.sheet&&!chart.root.contains(e.target))chart.dismiss();});
 document.addEventListener('aa:lang',()=>{for(const chart of instances.values())chart.render();});
 for(const root of document.querySelectorAll('[data-activity-chart]'))global.AAActivityChart.mount(root);
})(typeof window==='undefined'?globalThis:window);
