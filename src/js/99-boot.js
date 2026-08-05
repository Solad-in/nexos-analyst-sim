"use strict";
/* ============ event wiring ============ */
$('btn-new-career').addEventListener('click', ()=>{ renderProfCards(); showLoginView('new'); });
$('btn-load-career').addEventListener('click', ()=>{ showLoginView('load'); renderLoadList(); });
$('btn-exit').addEventListener('click', ()=> showLoginView('exit'));
$('btn-back-from-new').addEventListener('click', ()=> showLoginView('menu'));
$('btn-back-from-load').addEventListener('click', ()=> showLoginView('menu'));
$('btn-back-from-exit').addEventListener('click', ()=> showLoginView('menu'));
$('btn-confirm-new').addEventListener('click', handleCreateCareer);

$('start-btn').addEventListener('click', e=>{
  e.stopPropagation();
  $('start-menu').classList.toggle('open');
  $('dashboard-pop').classList.remove('open');
});
$('menu-chat').addEventListener('click', ()=>{ openWindow('chat'); $('start-menu').classList.remove('open'); });
$('menu-mail').addEventListener('click', ()=>{ openWindow('mail'); $('start-menu').classList.remove('open'); });
$('menu-qb').addEventListener('click', ()=>{ openWindow('qb'); $('start-menu').classList.remove('open'); });
$('menu-chart').addEventListener('click', ()=>{ openWindow('chart'); $('start-menu').classList.remove('open'); });
$('menu-tasks').addEventListener('click', ()=>{ openWindow('tasks'); $('start-menu').classList.remove('open'); });
$('menu-ref').addEventListener('click', ()=>{ openWindow('ref'); $('start-menu').classList.remove('open'); });
$('menu-shop').addEventListener('click', ()=>{ openWindow('shop'); $('start-menu').classList.remove('open'); });
$('menu-profile').addEventListener('click', ()=>{ openWindow('profile'); $('start-menu').classList.remove('open'); });
$('dash-more').addEventListener('click', e=>{
  e.stopPropagation();
  $('dashboard-pop').classList.remove('open');
  openWindow('profile');
});
$('menu-sandbox').addEventListener('click', ()=>{
  $('start-menu').classList.remove('open');
  setBenchQuest(null);                   // free querying against the company database
  openWindow('qb');
  refresh();
});
$('menu-files').addEventListener('click', ()=>{ openWindow('files'); $('start-menu').classList.remove('open'); });
$('menu-endshift').addEventListener('click', ()=>{
  $('start-menu').classList.remove('open');
  const finishedDay=state.day;
  const doneToday=state.reports.filter(r=>r.day===finishedDay).length;
  state.day++; state.energy=100;
  toast(tr('toast.shiftDone', {day:finishedDay, reports:doneToday}));
  if(finishedDay%PAYDAY_PERIOD===0) runPayday(finishedDay);
  refresh();
  requestSave();
});
$('menu-save').addEventListener('click', async ()=>{
  $('start-menu').classList.remove('open');
  await flushSave();
  toast(tr('toast.saved'));
});
$('menu-logout').addEventListener('click', async ()=>{
  $('start-menu').classList.remove('open');
  await flushSave();
  career.slug=null;
  Object.keys(openWindows).forEach(app=>closeWindow(app));
  $('login-screen').style.display='flex';
  showLoginView('menu');
});
$('dash-icon').addEventListener('click', e=>{
  e.stopPropagation();
  $('dashboard-pop').classList.toggle('open');
  $('start-menu').classList.remove('open');
});
document.addEventListener('click', ()=>{
  $('start-menu').classList.remove('open');
  $('dashboard-pop').classList.remove('open');
});
document.querySelectorAll('.desktop-icon').forEach(icon=>{
  icon.addEventListener('click', ()=> openWindow(icon.dataset.app));
  icon.addEventListener('keypress', e=>{ if(e.key==='Enter') openWindow(icon.dataset.app); });
});

/* ============ clock ============ */
function tickClock(){
  const d=new Date();
  $('clock').textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
tickClock(); setInterval(tickClock, 15000);
initLocale();     // до первой отрисовки: подписи в разметке (и заметка про хранилище) — отсюда

// Everything lives in a closure, so this is the only way to exercise the SQL engine and the
// quest generators from the console (or an automated check) without shipping a second copy.
window.NexOSDebug={
  runQuery, validateBySpec, storageTier,
  // Live references, so an automated pass can read the current quest's answer without
  // paying for a hint. Single-player learning tool — this is a debug seam, not a security
  // boundary, and the console is already open to anyone who wants to cheat at SQL practice.
  state, questsById, get benchQuest(){ return benchQuest; },
  get benchOutput(){ return benchOutput; }, get benchFeedback(){ return benchFeedback; },
  refresh, openWindows,
  openQuests: ()=>openQuests(),
  diagnoseAnswer, pickWeightedGen, GEN_KEY, CHAT_GENS, MAIL_GENS, hintSteps, hintTextFor,
  styleReview, STYLE_CHECKS, TASK_TYPES, taskType, submitAnswer,
  // Все генераторы типа `sql`. Список полный намеренно: когда в нём не было задач на чистку,
  // автоматическая проверка «нет ли кириллицы в английских данных» их молча пропускала,
  // и русские города доехали бы до английской версии.
  generators:{
    genFilterTask, genSumTask, genAvgTask, genGroupTask, genRoiTask, genConversionTask,
    genJoinTask, genFinalExamTask, genInTask, genBetweenTask, genLikeTask, genDistinctTask,
    genCountGroupTask, genHavingTask, genLeftJoinTask, genSubqueryTask, genFinalExam2Task,
    genDirtyCityTask, genDirtyCountTask,
  },
  choiceGenerators:{
    genClarifyTask, genConclusionTask, genAbTestTask, genDataQualityTask,
    genDashboardTask, genChartTask,
  },
};

