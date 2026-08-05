"use strict";
/* ============ toast ============ */
function toast(text){
  const d=document.createElement('div');
  d.className='toast'; d.textContent=text;
  $('toast-wrap').appendChild(d);
  setTimeout(()=>{ d.style.opacity='0'; d.style.transition='opacity .3s'; setTimeout(()=>d.remove(),300); }, 3600);
}

/* ============ dashboard render ============ */
function renderDash(){
  $('dash-name').textContent=career.name||tr('dash.title');
  $('dash-profession').textContent=career.profession||'';
  $('dash-level').textContent=LEVELS[levelIdx(state.reputation)].name;
  $('dash-rep').textContent=state.reputation;
  $('dash-energy').textContent=Math.round(state.energy)+'%';
  $('dash-money').textContent='$'+fmtMoney(state.money);
  $('dash-salary').textContent='$'+fmtMoney(currentLevel().salary)+' '+tr('dash.perMonth');
  $('dash-bonus').textContent='$'+fmtMoney(state.pendingBonus);
  const left=daysToPayday();
  $('dash-payday').textContent=(left===1?tr('dash.today'):tr('workDays', left));
  $('dash-day').textContent=state.day;
  $('dash-storage').textContent=storageTierLabel();
  $('meter-rep').style.width=Math.min(100,(state.reputation/REP_CAP*100))+'%';
  $('meter-energy').style.width=state.energy+'%';
  $('meter-energy').style.background=state.energy<30?'var(--bad)':(state.energy<60?'var(--accent-2)':'var(--good)');
  const totalUnread=state.chatUnread+state.mailUnread;
  const badge=$('rep-badge');
  if(totalUnread>0){ badge.style.display='flex'; badge.textContent=totalUnread; } else badge.style.display='none';
}

/* ============ window manager ============ */
const openWindows={};
let zTop=10;
const APP_META={
  chat:{title:'PulseChat', icon:'💬'},
  mail:{title:'InboxPro', icon:'✉️'},
  qb:{title:'QueryBench', icon:'🗄️'},
  chart:{title:'ChartLab', icon:'📈'},
  tasks:{title:'TaskBoard', icon:'📋'},
  files:{title:'FileDock', icon:'🗂️'},
  ref:{titleKey:'app.ref', icon:'📚'},
  shop:{title:'NexMart', icon:'🛒'},
  profile:{titleKey:'app.profile', icon:'👤'},
};
// У большинства окон название — имя продукта и не переводится; у справочника и профиля
// это обычное слово, поэтому они держат ключ и разворачиваются на момент отрисовки.
function appTitle(app){
  const m=APP_META[app];
  return m.titleKey?tr(m.titleKey):m.title;
}
function focusWindow(app){
  zTop++;
  if(openWindows[app]) openWindows[app].el.style.zIndex=zTop;
  document.querySelectorAll('.taskbar-app').forEach(b=>b.classList.toggle('active', b.dataset.app===app));
}
function openWindow(app){
  // Игрок сам открыл QueryBench (иконка, меню, «Открыть в QueryBench») — каретку логично
  // поставить в редактор. Перерисовки, вызванные чем-то другим, фокус не трогают.
  if(app==='qb') benchEditorAutofocus=true;
  if(openWindows[app]){
    openWindows[app].el.style.display='flex';
    focusWindow(app);
    refresh();               // state may have moved on since it was last drawn
    return openWindows[app].el;
  }
  const meta=APP_META[app];
  const el=document.createElement('div');
  el.className='os-window';
  el.style.left=(100+Object.keys(openWindows).length*24)+'px';
  el.style.top=(50+Object.keys(openWindows).length*20)+'px';
  el.innerHTML=`
    <div class="win-titlebar" data-drag="${app}">
      <span class="ico">${meta.icon}</span><span class="name" data-title-app="${app}">${esc(appTitle(app))}</span>
      <button class="win-btn min-btn">–</button>
      <button class="win-btn close" data-close="${app}">×</button>
    </div>
    <div class="win-body" id="body-${app}"></div>
  `;
  document.body.appendChild(el);
  openWindows[app]={el};
  makeDraggable(el, el.querySelector('.win-titlebar'));
  el.addEventListener('mousedown', ()=>focusWindow(app));
  el.querySelector('[data-close]').addEventListener('click', ()=>closeWindow(app));
  el.querySelector('.min-btn').addEventListener('click', ()=>{ el.style.display='none'; });
  addTaskbarEntry(app);
  focusWindow(app);
  // Через шину, а не renderApp(app): renderChat и renderMail помечают сообщения
  // прочитанными, и панель со счётчиком должна пересчитаться вместе с окном.
  refresh();
  return el;
}
function closeWindow(app){
  if(!openWindows[app]) return;
  openWindows[app].el.remove();
  delete openWindows[app];
  const btn=document.querySelector('.taskbar-app[data-app="'+app+'"]');
  if(btn) btn.remove();
}
function addTaskbarEntry(app){
  if(document.querySelector('.taskbar-app[data-app="'+app+'"]')) return;
  const meta=APP_META[app];
  const btn=document.createElement('button');
  btn.className='taskbar-app'; btn.dataset.app=app;
  btn.textContent=meta.icon+' '+appTitle(app);
  btn.addEventListener('click', ()=>{
    const win=openWindows[app];
    if(win && win.el.style.display==='none'){ win.el.style.display='flex'; focusWindow(app); }
    else if(win){ focusWindow(app); }
  });
  $('running-apps').appendChild(btn);
}
function makeDraggable(win, handle){
  let dragging=false, sx=0, sy=0, ox=0, oy=0;
  handle.addEventListener('mousedown', e=>{
    if(e.target.closest('.win-btn')) return;
    dragging=true; sx=e.clientX; sy=e.clientY; ox=win.offsetLeft; oy=win.offsetTop; e.preventDefault();
  });
  document.addEventListener('mousemove', e=>{
    if(!dragging) return;
    win.style.left=Math.max(0, ox+(e.clientX-sx))+'px';
    win.style.top=Math.max(0, oy+(e.clientY-sy))+'px';
  });
  document.addEventListener('mouseup', ()=>{ dragging=false; });
  handle.addEventListener('touchstart', e=>{
    if(e.target.closest('.win-btn')) return;
    const t=e.touches[0]; dragging=true; sx=t.clientX; sy=t.clientY; ox=win.offsetLeft; oy=win.offsetTop;
  }, {passive:true});
  document.addEventListener('touchmove', e=>{
    if(!dragging) return;
    const t=e.touches[0];
    win.style.left=Math.max(0, ox+(t.clientX-sx))+'px';
    win.style.top=Math.max(0, oy+(t.clientY-sy))+'px';
  }, {passive:true});
  document.addEventListener('touchend', ()=>{ dragging=false; });
}

