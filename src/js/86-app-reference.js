"use strict";
/* ============ SQL reference ============ */
// Тексты уроков уже существуют в NARRATIVE, но в чате они уезжают вверх после одного
// прочтения. Здесь они лежат постоянно. Разделы открываются по мере того, как сюжет до них
// доходит, поэтому справочник никогда не спойлерит то, что впереди.
//
// Хранятся ключи, а не строки: тексты уроков зависят от языка, а массив собирается один раз.
const REFERENCE=[
  // Открыт с нуля и стоит первым: про границы движка честнее предупредить сразу, а не когда
  // человек уже унёс домой неверное представление о настоящем SQL.
  {id:'limits',   unlockAt:0,  body:'LESSON_LIMITS'},
  {id:'where',    unlockAt:2,  body:'LESSON_1'},
  {id:'agg',      unlockAt:3,  body:'LESSON_2'},
  {id:'group',    unlockAt:5,  body:'LESSON_3'},
  {id:'calc',     unlockAt:6,  body:'LESSON_4'},
  {id:'join',     unlockAt:7,  body:'LESSON_5'},
  {id:'in',       unlockAt:12, body:'LESSON_IN'},
  {id:'between',  unlockAt:13, body:'LESSON_BETWEEN'},
  {id:'like',     unlockAt:14, body:'LESSON_LIKE'},
  {id:'distinct', unlockAt:15, body:'LESSON_DISTINCT'},
  {id:'countgrp', unlockAt:16, body:'LESSON_COUNTGROUP'},
  {id:'having',   unlockAt:17, body:'LESSON_HAVING'},
  {id:'leftjoin', unlockAt:18, body:'LESSON_LEFTJOIN'},
  {id:'subquery', unlockAt:19, body:'LESSON_SUBQUERY'},
  // Модуль 4 дописан в конец ONBOARD, поэтому unlockAt здесь заметно больше остальных —
  // это индекс шага с уроком про чистку, а не «следующая по счёту» тема.
  {id:'clean',    unlockAt:32, body:'LESSON_CLEAN'},
];
// Заголовки и примеры синтаксиса — тоже контент: в примерах есть комментарии на языке игрока.
const REF_TEXT={
  ru:{
    limits:  {title:'⚠️ Чем этот движок отличается от настоящего SQL', syntax:'-- работает как в настоящей базе\nSELECT channel, SUM(revenue) AS total\nFROM campaigns\nGROUP BY channel\nHAVING total > 5000;\n\n-- а так здесь нельзя\nSELECT 1;\nWHERE amount / qty > 150'},
    where:   {title:'WHERE — отбор строк', syntax:"SELECT * FROM campaigns WHERE channel = 'Email';"},
    agg:     {title:'Агрегатные функции', syntax:'SELECT SUM(amount) AS total FROM orders;\nSELECT AVG(minutes) AS avg_time FROM tickets;\nSELECT COUNT(*) AS n FROM orders;'},
    group:   {title:'GROUP BY — разбивка по группам', syntax:'SELECT channel, SUM(revenue) AS total\nFROM campaigns\nGROUP BY channel;'},
    calc:    {title:'Вычисляемые колонки, ORDER BY, LIMIT', syntax:'SELECT channel, revenue/spend AS roi\nFROM campaigns\nORDER BY roi DESC\nLIMIT 1;'},
    join:    {title:'JOIN — соединение таблиц', syntax:'SELECT customers.segment, SUM(orders.amount) AS total\nFROM orders\nJOIN customers ON orders.customer_id = customers.id\nGROUP BY customers.segment;'},
    in:      {title:'IN — список значений', syntax:"SELECT name FROM campaigns\nWHERE channel IN ('Email', 'TikTok Ads');\n\n-- обратный вариант\nWHERE channel NOT IN ('Email');"},
    between: {title:'BETWEEN — диапазон', syntax:'SELECT customer FROM orders\nWHERE amount BETWEEN 1000 AND 5000;\n-- обе границы включаются'},
    like:    {title:'LIKE — поиск по образцу', syntax:"WHERE url LIKE '/landing%'   -- начинается с\nWHERE email LIKE '%@dataco.ru' -- заканчивается на\nWHERE code LIKE 'A_1'          -- _ = ровно один символ"},
    distinct:{title:'DISTINCT — уникальные значения', syntax:'SELECT COUNT(DISTINCT user_id) AS users FROM events;\nSELECT DISTINCT channel FROM campaigns;'},
    countgrp:{title:'COUNT вместе с GROUP BY', syntax:'SELECT agent, COUNT(*) AS tickets\nFROM support_tickets\nGROUP BY agent;'},
    having:  {title:'HAVING — фильтр по группам', syntax:'SELECT channel, SUM(revenue) AS total\nFROM campaigns\nGROUP BY channel\nHAVING total > 5000;\n\n-- WHERE фильтрует строки ДО группировки\n-- HAVING фильтрует группы ПОСЛЕ'},
    leftjoin:{title:'LEFT JOIN и NULL', syntax:'SELECT customers.name\nFROM customers\nLEFT JOIN orders ON customers.id = orders.customer_id\nWHERE orders.id IS NULL;'},
    subquery:{title:'Подзапросы', syntax:'SELECT customer FROM orders\nWHERE amount > (SELECT AVG(amount) FROM orders);'},
    clean:   {title:'LOWER, UPPER, TRIM — чистка данных', syntax:"-- приведение к единому виду\nSELECT LOWER(TRIM(city)) AS city, SUM(amount) AS total\nFROM orders\nGROUP BY LOWER(TRIM(city));\n\n-- сколько значений на самом деле\nSELECT COUNT(DISTINCT LOWER(TRIM(city))) AS cities FROM clients;\n\n-- функции работают и в условии\nWHERE TRIM(note) = ''"},
    heading:(n,total)=> '📚 Изучено ('+n+' из '+total+')',
    empty:'Пока пусто. Разделы появляются здесь по мере того, как Ксения объясняет темы.',
    locked:n=> '🔒 Ещё '+n+' '+pluralRu(n,'раздел','раздела','разделов')+' откроется дальше по обучению.',
    pickTopic:'Выбери тему слева.',
    tryIt:'Попробовать можно прямо в QueryBench: без активной задачи он открывается в режиме песочницы с базой компании.',
  },
  en:{
    limits:  {title:'⚠️ How this engine differs from real SQL', syntax:'-- works just like a real database\nSELECT channel, SUM(revenue) AS total\nFROM campaigns\nGROUP BY channel\nHAVING total > 5000;\n\n-- but these will not run here\nSELECT 1;\nWHERE amount / qty > 150'},
    where:   {title:'WHERE — picking rows', syntax:"SELECT * FROM campaigns WHERE channel = 'Email';"},
    agg:     {title:'Aggregate functions', syntax:'SELECT SUM(amount) AS total FROM orders;\nSELECT AVG(minutes) AS avg_time FROM tickets;\nSELECT COUNT(*) AS n FROM orders;'},
    group:   {title:'GROUP BY — breaking into groups', syntax:'SELECT channel, SUM(revenue) AS total\nFROM campaigns\nGROUP BY channel;'},
    calc:    {title:'Computed columns, ORDER BY, LIMIT', syntax:'SELECT channel, revenue/spend AS roi\nFROM campaigns\nORDER BY roi DESC\nLIMIT 1;'},
    join:    {title:'JOIN — combining tables', syntax:'SELECT customers.segment, SUM(orders.amount) AS total\nFROM orders\nJOIN customers ON orders.customer_id = customers.id\nGROUP BY customers.segment;'},
    in:      {title:'IN — a list of values', syntax:"SELECT name FROM campaigns\nWHERE channel IN ('Email', 'TikTok Ads');\n\n-- the opposite\nWHERE channel NOT IN ('Email');"},
    between: {title:'BETWEEN — a range', syntax:'SELECT customer FROM orders\nWHERE amount BETWEEN 1000 AND 5000;\n-- both bounds are inclusive'},
    like:    {title:'LIKE — pattern matching', syntax:"WHERE url LIKE '/landing%'    -- starts with\nWHERE email LIKE '%@dataco.com' -- ends with\nWHERE code LIKE 'A_1'          -- _ = exactly one character"},
    distinct:{title:'DISTINCT — unique values', syntax:'SELECT COUNT(DISTINCT user_id) AS users FROM events;\nSELECT DISTINCT channel FROM campaigns;'},
    countgrp:{title:'COUNT together with GROUP BY', syntax:'SELECT agent, COUNT(*) AS tickets\nFROM support_tickets\nGROUP BY agent;'},
    having:  {title:'HAVING — filtering groups', syntax:'SELECT channel, SUM(revenue) AS total\nFROM campaigns\nGROUP BY channel\nHAVING total > 5000;\n\n-- WHERE filters rows BEFORE grouping\n-- HAVING filters groups AFTER'},
    leftjoin:{title:'LEFT JOIN and NULL', syntax:'SELECT customers.name\nFROM customers\nLEFT JOIN orders ON customers.id = orders.customer_id\nWHERE orders.id IS NULL;'},
    subquery:{title:'Subqueries', syntax:'SELECT customer FROM orders\nWHERE amount > (SELECT AVG(amount) FROM orders);'},
    clean:   {title:'LOWER, UPPER, TRIM — cleaning data', syntax:"-- normalise before grouping\nSELECT LOWER(TRIM(city)) AS city, SUM(amount) AS total\nFROM orders\nGROUP BY LOWER(TRIM(city));\n\n-- how many values there really are\nSELECT COUNT(DISTINCT LOWER(TRIM(city))) AS cities FROM clients;\n\n-- functions work in conditions too\nWHERE TRIM(note) = ''"},
    heading:(n,total)=> '📚 Learned ('+n+' of '+total+')',
    empty:'Empty for now. Topics appear here as Sarah explains them.',
    locked:n=> '🔒 '+n+' more '+pluralEn(n,'topic','topics')+' will open up as you go.',
    pickTopic:'Pick a topic on the left.',
    tryIt:'You can try it straight in QueryBench: with no active task it opens as a sandbox on the company database.',
  },
};
function refText(){ return REF_TEXT[locale]||REF_TEXT.ru; }
let activeRefId=null;
function renderReference(){
  const body=$('body-ref');
  if(!body) return;
  const T=refText();
  const unlocked=REFERENCE.filter(r=>onboardIdx>=r.unlockAt);
  const locked=REFERENCE.length-unlocked.length;
  let list='<div class="mail-list"><div class="list-heading">'+esc(T.heading(unlocked.length, REFERENCE.length))+'</div>';
  if(!unlocked.length){
    list+='<div class="task-empty">'+esc(T.empty)+'</div>';
  } else {
    unlocked.forEach(r=>{
      list+=`<div class="mail-item ${r.id===activeRefId?'active':''}" data-ref="${r.id}">
        <div class="mfrom"><span>${esc(T[r.id].title)}</span></div>
      </div>`;
    });
  }
  if(locked>0) list+='<div class="task-empty">'+esc(T.locked(locked))+'</div>';
  list+='</div>';
  let reading='<div class="mail-reading"><div class="task-empty" style="padding:0;">'+esc(T.pickTopic)+'</div></div>';
  const r=activeRefId?REFERENCE.find(x=>x.id===activeRefId):null;
  if(r && onboardIdx>=r.unlockAt){
    reading=`<div class="mail-reading">
      <h2>${esc(T[r.id].title)}</h2>
      <div class="mbody">${esc(narr(r.body))}</div>
      <div class="ref-syntax">${esc(T[r.id].syntax)}</div>
      <div class="report-trunc">${esc(T.tryIt)}</div>
    </div>`;
  }
  body.innerHTML=list+reading;
  body.querySelectorAll('.mail-item').forEach(el=>el.addEventListener('click', ()=>{ activeRefId=el.dataset.ref; refresh(); }));
}
