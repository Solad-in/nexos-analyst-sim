"use strict";
/* ============ TaskBoard rendering ============ */
// Quests are stored in a keyed object, so insertion order isn't guaranteed to survive
// a JSON round-trip — createdAt is the authoritative ordering.
function questsInOrder(){
  return Object.values(questsById).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
}
function openQuests(){ return questsInOrder().filter(q=>!q.completed); }
function hasPendingQuest(){ return openQuests().length>0; }
const CHANNEL_LABEL={chat:'💬 PulseChat', mail:'✉️ InboxPro'};
function renderTasks(){
  const body=$('body-tasks');
  if(!body) return;
  const all=questsInOrder().reverse();
  const open=all.filter(q=>!q.completed);
  const done=all.filter(q=>q.completed);
  let list='<div class="mail-list"><div class="list-heading">'+esc(tr('task.open', open.length))+'</div>';
  if(!open.length){
    list+='<div class="task-empty">'+esc(tr('task.noneOpen'))+'</div>';
  } else {
    open.forEach(q=> list+=taskItemHtml(q));
  }
  list+='<div class="list-heading">'+esc(tr('task.done', done.length))+'</div>';
  if(!done.length) list+='<div class="task-empty">'+esc(tr('task.noneDone'))+'</div>';
  else done.slice(0,25).forEach(q=> list+=taskItemHtml(q));
  list+='</div>';

  let reading='<div class="mail-reading"><div class="task-empty" style="padding:0;">'+esc(tr('task.pick'))+'</div></div>';
  const q=activeTaskId?questsById[activeTaskId]:null;
  if(q){
    const from=ALL_CONTACTS[q.fromId];
    const notEnough=!q.completed && state.energy<q.energyCost;
    reading=`<div class="mail-reading">
      <h2>${esc(q.title)} ${q.isBoss?`<span class="boss-badge">${esc(tr('badge.exam'))}</span>`:''}</h2>
      <div class="task-meta">
        ${tr('task.meta', {from:esc(from.name), role:esc(from.role), channel:CHANNEL_LABEL[q.channel]||q.channel, attempts:q.attempts||0})}
      </div>
      <div class="mbody">${esc(q.prompt)}</div>
      <div class="task-cost">${esc(tr('task.reward', {rep:q.rewardRep, money:q.rewardMoney, energy:q.energyCost}))}</div><br>
      ${q.completed
        ? `<div class="tag-done" style="margin-top:12px;">${esc(tr('task.completed'))}</div>`
        : `<button class="qbtn" data-qid="${q.id}">${esc(taskType(q).openLabel)}</button>
           ${notEnough?'<div style="margin-top:8px;font-size:11.5px;color:var(--bad);">'+esc(tr('task.noEnergy',{have:Math.round(state.energy), need:q.energyCost}))+'</div>':''}`}
    </div>`;
  }
  body.innerHTML=list+reading;
  body.querySelectorAll('.task-item').forEach(el=>el.addEventListener('click', ()=>{ activeTaskId=el.dataset.qid; refresh(); }));
  const btn=body.querySelector('.qbtn[data-qid]');
  if(btn) btn.addEventListener('click', ()=> loadQuestIntoBench(btn.dataset.qid));
}
function taskItemHtml(q){
  const from=ALL_CONTACTS[q.fromId];
  return `<div class="mail-item task-item ${q.completed?'':'unread'} ${q.id===activeTaskId?'active':''}" data-qid="${q.id}">
    <div class="mfrom"><span>${esc(q.title)}</span><span class="tstatus ${q.completed?'done':'open'}">${esc(tr(q.completed?'task.statusDone':'task.statusOpen'))}</span></div>
    <div class="msnip">${esc(from.name)} · ${CHANNEL_LABEL[q.channel]||''}</div>
  </div>`;
}

/* ============ querybench rendering ============ */
function loadQuestIntoBench(qid){
  const q=questsById[qid];
  setBenchQuest(q);
  activeTaskId=qid;
  openWindow(taskType(q).app);    // QueryBench или ChartLab — решает вид задачи
  refresh();
}
