"use strict";
/* ============ professions ============ */
// Названия должностей в LEVELS сознательно оставлены английскими и в русской версии:
// «Senior Analyst» — то, как эта позиция называется в резюме и вакансиях на обоих языках.
// А вот название профессии — обычное слово, и оно переводится.
const PROFESSIONS=[
  {id:'data-analyst', key:'prof.dataAnalyst', available:true},
  {id:'product-manager', key:'prof.productManager', available:false},
  {id:'backend-dev', key:'prof.backendDev', available:false},
];
function professionName(id){
  const p=PROFESSIONS.find(x=>x.id===id);
  return p?tr(p.key):id;
}
let selectedProfession='data-analyst';

/* ============ levels ============ */
// `t` — reputation threshold, `salary` — monthly pay in $ at that grade.
// The old curve topped out at 220 rep, which the player reached midway through module 2 —
// the whole progression ended before the content did. Thresholds are stretched so that
// finishing both modules lands around Senior, with a long tail left for endless mode.
const LEVELS=[
  {name:'Junior Analyst',    t:0,    salary:900},
  {name:'Analyst',           t:80,   salary:1500},
  {name:'Senior Analyst',    t:180,  salary:2400},
  {name:'Lead Analyst',      t:340,  salary:3400},
  {name:'Analytics Manager', t:560,  salary:4600},
  {name:'Head of Data',      t:850,  salary:6200},
  {name:'Data Director',     t:1250, salary:8500},
];
const REP_CAP=LEVELS[LEVELS.length-1].t;
function levelIdx(rep){ let i=0; for(let k=0;k<LEVELS.length;k++) if(rep>=LEVELS[k].t) i=k; return i; }
function currentLevel(){ return LEVELS[levelIdx(state.reputation)]; }

/* ============ payroll ============ */
// Money is not handed out per task: task rewards and promotion bonuses accrue in
// state.pendingBonus and are paid together with the salary every PAYDAY_PERIOD working days.
const PAYDAY_PERIOD=21;
function daysToPayday(){ return PAYDAY_PERIOD-((state.day-1)%PAYDAY_PERIOD); }
function runPayday(finishedDay){
  const lvl=currentLevel();
  const bonus=Math.round(state.pendingBonus);
  const total=lvl.salary+bonus;
  state.money+=total;
  state.pendingBonus=0;
  state.paydaysReceived=(state.paydaysReceived||0)+1;
  refresh();
  toast(tr('pay.toast', {total:fmtMoney(total)}));
  sendInfoMail(DIRECTOR, tr('pay.subject', {n:state.paydaysReceived}),
    tr('pay.body', {period:tr('workDays', PAYDAY_PERIOD), day:finishedDay, level:lvl.name,
                    salary:fmtMoney(lvl.salary), bonus:fmtMoney(bonus), total:fmtMoney(total)}));
}

/* ============ mutable game state ============ */
const SAVE_VERSION=1;
const career={slug:null, name:'', profession:''};
const state={
  day:1, reputation:10, energy:100, money:500,
  chatUnread:0, mailUnread:0, reports:[], restNudgeDay:0,
  pendingBonus:0, paydaysReceived:0,
  hintsBought:0,                 // for the profile stats
  styleNotes:{},                 // how many times each style remark was already made
  firstRunDone:false,            // has the desktop been introduced once
  metContacts:['lead'],          // who has already introduced themselves
  topicStats:{},                 // quest key -> {solved, attempts} for weak-topic weighting
  shopDay:0, shopCounts:{},      // per-day purchase limits in NexMart
  sandbox:null,                  // the persistent DataCo database for free querying
};
const chatThreads={ lead:[], col1:[], col2:[] };
const mailItems=[];
const questsById={};
let activeChatContact='lead';
let activeMailId=null;
let activeReportId=null;
let activeTaskId=null;
let benchQuest=null;

function personalize(text){ return text.replace(/\{name\}/g, career.name||'коллега'); }

