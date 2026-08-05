"use strict";
/* ============ login screen controllers ============ */
function showLoginView(view){
  ['menu','new','load','exit'].forEach(v=>{ $('login-view-'+v).style.display = (v===view?'block':'none'); });
}
// Экран входа живёт вне шины перерисовки: карьеры ещё нет, значит refresh() не зовётся.
// Его динамические части — карточки профессий и список сохранений — рисуются по клику
// и при смене языка остались бы на старом. Вызывается из setLocale().
function refreshLoginScreen(){
  if($('login-screen').style.display==='none') return;
  if($('login-view-new').style.display!=='none') renderProfCards();
  if($('login-view-load').style.display!=='none') renderLoadList();
}
function renderProfCards(){
  const el=$('prof-cards');
  el.innerHTML=PROFESSIONS.map(p=>`
    <div class="prof-card ${p.available?'':'disabled'} ${selectedProfession===p.id?'selected':''}" data-pid="${p.id}">
      <span>${esc(tr(p.key))}</span>${p.available?'':'<span class="soon">'+esc(tr('prof.soon'))+'</span>'}
    </div>`).join('');
  el.querySelectorAll('.prof-card').forEach(card=>{
    const p=PROFESSIONS.find(x=>x.id===card.dataset.pid);
    if(!p.available) return;
    card.addEventListener('click', ()=>{ selectedProfession=p.id; renderProfCards(); });
  });
}
async function renderLoadList(){
  const listEl=$('load-list');
  listEl.innerHTML='<div class="login-empty">'+esc(tr('load.loading'))+'</div>';
  const careers=await listCareers();
  if(!careers.length){ listEl.innerHTML='<div class="login-empty">'+esc(tr('load.none'))+'</div>'; return; }
  careers.sort((a,b)=>(b.lastPlayed||0)-(a.lastPlayed||0));
  listEl.innerHTML=careers.map(c=>`
    <div class="career-card" data-slug="${esc(c.slug)}">
      <div class="cc-top"><span>${esc(c.name)}</span><span>${esc(tr('load.day', c.day))}</span></div>
      <div class="cc-meta">${esc(c.profession)} · ${esc(c.level)}</div>
      <div class="cc-actions">
        <button class="play-btn" data-slug="${esc(c.slug)}">${esc(tr('load.play'))}</button>
        <button class="del-btn" data-slug="${esc(c.slug)}">${esc(tr('load.delete'))}</button>
      </div>
    </div>`).join('');
  listEl.querySelectorAll('.play-btn').forEach(b=>b.addEventListener('click', ()=> handleLoadCareer(b.dataset.slug)));
  listEl.querySelectorAll('.del-btn').forEach(b=>b.addEventListener('click', ()=>{
    const card=b.closest('.career-card');
    const actions=card.querySelector('.cc-actions');
    actions.innerHTML=`<span style="font-size:11.5px;color:var(--bad);flex:1;">${esc(tr('load.confirmDelete'))}</span>
      <button class="del-confirm" style="background:var(--bad);color:#fff;">${esc(tr('load.yes'))}</button>
      <button class="del-cancel" style="background:rgba(255,255,255,0.1);color:#e7ebf5;">${esc(tr('load.cancel'))}</button>`;
    actions.querySelector('.del-confirm').addEventListener('click', async ()=>{ await deleteCareer(b.dataset.slug); renderLoadList(); });
    actions.querySelector('.del-cancel').addEventListener('click', ()=> renderLoadList());
  }));
}
async function handleCreateCareer(){
  const nameInput=$('new-name-input');
  const name=nameInput.value.trim()||tr('login.defaultName');
  if(!selectedProfession){ toast(tr('login.pickProfession')); return; }
  const prof=PROFESSIONS.find(p=>p.id===selectedProfession);
  career.slug=slugify(name); career.name=name; career.profession=tr(prof.key);
  state.day=1; state.reputation=10; state.energy=100; state.money=500;
  state.chatUnread=0; state.mailUnread=0; state.reports=[]; state.restNudgeDay=0;
  state.pendingBonus=0; state.paydaysReceived=0;
  state.hintsBought=0; state.styleNotes={}; state.firstRunDone=false;
  state.metContacts=['lead']; state.topicStats={};
  state.shopDay=0; state.shopCounts={};
  state.sandbox=buildSandboxDb();
  onboardIdx=0;
  chatThreads.lead=[]; chatThreads.col1=[]; chatThreads.col2=[];
  mailItems.length=0;
  Object.keys(questsById).forEach(k=>delete questsById[k]);
  activeChatContact='lead'; activeMailId=null; activeReportId=null; setBenchQuest(null);
  await flushSave();
  startGame(true);
}
async function handleLoadCareer(slug){
  const ok=await loadCareerBySlug(slug);
  if(!ok) return;
  startGame(false);
}
function startGame(isNew){
  $('login-screen').style.display='none';
  $('boot').classList.remove('hidden');
  setTimeout(()=>{
    $('boot').classList.add('hidden');
    refresh();
    if(isNew){
      // A brand-new player lands on a desktop of icons with no idea which one matters first.
      if(!state.firstRunDone){
        state.firstRunDone=true;
        openWindow('chat');
        toast(tr('login.startHint'));
      }
      advanceStory();
    } else {
      toast(tr('login.welcomeBack', {name:career.name}));
      // A save can land between finishing a quest and the next one being sent. Without this
      // the loaded career would have no open task and nobody left to send one — a dead end.
      if(!hasPendingQuest()) scheduleStory(1600);
    }
    startStoryWatchdog();
  }, 1300);
}
// Last-resort safety net: if a story timer is ever lost (thrown error, tab throttling),
// this notices that nothing is in flight and no task is open, and restarts the loop.
let storyWatchdog=null;
function startStoryWatchdog(){
  if(storyWatchdog) return;
  storyWatchdog=setInterval(()=>{
    if(!career.slug) return;
    // A beat that never landed. onboardIdx only advances once a quest actually exists, so
    // retrying at worst repeats a lesson message — it can never skip content.
    if(storyPending && Date.now()-storyPendingSince>STORY_STEP_TIMEOUT) cancelStoryStep();
    if(!storyPending && !hasPendingQuest()) scheduleStory(1000);
  }, 60000);
}

