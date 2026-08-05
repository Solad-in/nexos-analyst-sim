"use strict";
/* ============ profile / career progress ============ */
// state.topicStats was already being collected to weight endless mode, but the player never
// saw it. This is the other half: showing them where they are actually weak.
const TOPIC_PACKS={
  ru:{
    filter:'WHERE — отбор строк', sum:'SUM — сумма', avg:'AVG — среднее',
    group:'GROUP BY — группировка', roi:'Вычисляемые колонки (ROI)',
    conv:'Вычисляемые колонки (конверсия)', join:'JOIN — соединение таблиц',
    finalexam:'Экзамен: основы SQL', in:'IN — список значений', between:'BETWEEN — диапазон',
    like:'LIKE — поиск по образцу', distinct:'DISTINCT — уникальные значения',
    countgroup:'COUNT + GROUP BY', having:'HAVING — фильтр групп',
    leftjoin:'LEFT JOIN и NULL', subquery:'Подзапросы', finalexam2:'Экзамен: рабочий SQL',
    dirtycity:'Чистка данных: LOWER/TRIM', dirtycount:'DISTINCT на грязных данных',
    clarify:'Уточнение требования', conclusion:'Выводы из данных', abtest:'Разбор A/B-теста',
    dataquality:'Качество данных', dashboard:'Состав дашборда', chart:'Выбор типа графика',
  },
  en:{
    filter:'WHERE — picking rows', sum:'SUM — totals', avg:'AVG — averages',
    group:'GROUP BY — grouping', roi:'Computed columns (ROI)',
    conv:'Computed columns (conversion)', join:'JOIN — combining tables',
    finalexam:'Exam: SQL basics', in:'IN — value lists', between:'BETWEEN — ranges',
    like:'LIKE — pattern matching', distinct:'DISTINCT — unique values',
    countgroup:'COUNT + GROUP BY', having:'HAVING — filtering groups',
    leftjoin:'LEFT JOIN and NULL', subquery:'Subqueries', finalexam2:'Exam: SQL at work',
    dirtycity:'Cleaning data: LOWER/TRIM', dirtycount:'DISTINCT on dirty data',
    clarify:'Clarifying the request', conclusion:'Reading the numbers', abtest:'Reading an A/B test',
    dataquality:'Data quality', dashboard:'Dashboard contents', chart:'Choosing a chart type',
  },
};
function topicNames(){ return TOPIC_PACKS[locale]||TOPIC_PACKS.ru; }
function masteryOf(key){
  const st=state.topicStats[key];
  if(!st || !st.solved) return {label:tr('prof.notTried'), cls:'none', pct:0, avg:null};
  const avg=st.attempts/st.solved;
  if(avg<=1.15) return {label:tr('prof.solid'), cls:'good', pct:100, avg};
  if(avg<=2)    return {label:tr('prof.ok'), cls:'mid', pct:62, avg};
  return {label:tr('prof.revisit'), cls:'weak', pct:28, avg};
}
function renderProfile(){
  const body=$('body-profile');
  if(!body) return;
  const lvl=currentLevel();
  const idx=levelIdx(state.reputation);
  const next=LEVELS[idx+1];
  const solved=Object.values(state.topicStats).reduce((a,s)=>a+s.solved,0);
  const attempts=Object.values(state.topicStats).reduce((a,s)=>a+s.attempts,0);
  const avgAll=solved?Math.round(attempts/solved*100)/100:0;
  const repLine=next
    ? tr('prof.toNext', {level:next.name, rep:next.t-state.reputation})
    : tr('prof.maxLevel');
  const repPct=next
    ? Math.max(0, Math.min(100, (state.reputation-lvl.t)/(next.t-lvl.t)*100))
    : 100;

  let topics='';
  const names=topicNames();
  Object.keys(names).forEach(key=>{
    const m=masteryOf(key);
    topics+=`<div class="prof-topic">
      <div class="pt-name">${esc(names[key])}</div>
      <div class="pt-bar"><div class="pt-fill ${m.cls}" style="width:${m.pct}%"></div></div>
      <div class="pt-label ${m.cls}">${esc(m.label)}${m.avg?' · '+esc(tr('prof.attemptsShort', Math.round(m.avg*10)/10)):''}</div>
    </div>`;
  });

  body.innerHTML=`<div class="prof-wrap">
    <div class="prof-head">
      <div class="prof-name">${esc(career.name||tr('prof.employee'))}</div>
      <div class="prof-role">${esc(lvl.name)} · ${esc(career.profession||'')}</div>
    </div>

    <div class="prof-block">
      <div class="prof-block-title">${esc(tr('prof.career'))}</div>
      <div class="prof-rep">
        <div class="pt-bar"><div class="pt-fill good" style="width:${repPct}%"></div></div>
        <div class="prof-hint">${esc(tr('prof.repLine', {rep:state.reputation, line:repLine}))}</div>
      </div>
      <div class="prof-grid">
        <div><span class="pg-num">${state.day}</span><span class="pg-cap">${esc(tr('prof.days', state.day))}</span></div>
        <div><span class="pg-num">${solved}</span><span class="pg-cap">${esc(tr('prof.solved', solved))}</span></div>
        <div><span class="pg-num">${state.reports.length}</span><span class="pg-cap">${esc(tr('prof.reports', state.reports.length))}</span></div>
        <div><span class="pg-num">${avgAll||'—'}</span><span class="pg-cap">${esc(tr('prof.attemptsPer'))}</span></div>
        <div><span class="pg-num">${state.hintsBought}</span><span class="pg-cap">${esc(tr('prof.hints', state.hintsBought))}</span></div>
        <div><span class="pg-num">${state.paydaysReceived}</span><span class="pg-cap">${esc(tr('prof.paydays', state.paydaysReceived))}</span></div>
      </div>
    </div>

    <div class="prof-block">
      <div class="prof-block-title">${esc(tr('prof.money'))}</div>
      <div class="prof-money">
        <div><span class="pg-cap">${esc(tr('prof.inAccount'))}</span><span class="pg-num">$${fmtMoney(state.money)}</span></div>
        <div><span class="pg-cap">${esc(tr('prof.basePay'))}</span><span class="pg-num">$${fmtMoney(lvl.salary)} ${esc(tr('dash.perMonth'))}</span></div>
        <div><span class="pg-cap">${esc(tr('prof.bonusPending'))}</span><span class="pg-num">$${fmtMoney(state.pendingBonus)}</span></div>
        <div><span class="pg-cap">${esc(tr('prof.paydayIn'))}</span><span class="pg-num">${esc(tr('workDays', daysToPayday()))}</span></div>
      </div>
    </div>

    <div class="prof-block">
      <div class="prof-block-title">${esc(tr('prof.mastery'))}</div>
      <div class="prof-hint" style="margin-bottom:10px;">${esc(tr('prof.masteryNote'))}</div>
      ${topics}
    </div>
  </div>`;
}

// Which tables the editor currently queries: the open task's, or the sandbox database.
