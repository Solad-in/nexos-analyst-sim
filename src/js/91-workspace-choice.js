"use strict";
/* ============ choice workspace ============ */
// Рабочее место для задач типа `choice`: постановка, при необходимости готовая таблица
// с данными и варианты ответа. Живёт в том же окне QueryBench — задачу решают там,
// вне зависимости от того, нужен ли для неё SQL.
//
// Часть задач требует отметить один вариант, часть — все подходящие (`q.multi`). Разными
// типами это делать незачем: отличается только то, сбрасывается ли прежняя отметка при
// клике. Поэтому выбор всегда хранится массивом `q.picks` — как и `q.draftSql`, он живёт
// на самом квесте и переживает перерисовку, конец смены и перезагрузку.
function correctIds(q){ return Array.isArray(q.correct)?q.correct:[q.correct]; }
function optionById(q,id){ return q.options.find(o=>o.id===id)||{}; }

function collectChoiceAnswer(q){
  return (q.picks && q.picks.length) ? {picks:q.picks.slice()} : null;
}
function checkChoiceAnswer(q, a){
  const need=correctIds(q);
  return a.picks.length===need.length && need.every(id=>a.picks.includes(id));
}
// Разбор адресный: если игрок отметил лишнее — объясняем именно этот вариант. Если всё
// отмеченное верно, но не всё найдено, называем только количество пропущенного: подсказать,
// сколько осталось искать, честно, а показать что именно — значит решить задачу за него.
function diagnoseChoiceAnswer(q, a){
  const need=correctIds(q);
  const лишний=a.picks.find(id=>!need.includes(id));
  if(лишний) return optionById(q,лишний).why || tr('choice.notThis');
  return tr('choice.missing', need.length-a.picks.length);
}
function reviewChoiceAnswer(q){ return q.reviewNote; }

function choiceTableHtml(tbl){          // не `t`: так называется функция перевода
  if(!tbl) return '';
  let html='<div class="qb-results"><table><thead><tr>'+tbl.columns.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>';
  tbl.rows.forEach(r=>{ html+='<tr>'+tbl.columns.map(c=>'<td>'+esc(r[c])+'</td>').join('')+'</tr>'; });
  return html+'</tbody></table></div>';
}
function renderChoiceWorkspace(body, q){
  const contact=ALL_CONTACTS[q.fromId];
  const picks=q.picks||[];
  const need=correctIds(q);
  const options=q.options.map(o=>{
    // У сданной задачи разбор виден весь сразу — и почему верные варианты верны, и чем плох
    // каждый остальной. Помечать выбор игрока не нужно: закрыть задачу можно только точным
    // попаданием, так что его отметки и есть верные.
    const cls=q.completed ? (need.includes(o.id)?' correct':'') : (picks.includes(o.id)?' picked':'');
    return `<button class="choice-opt${cls}" data-opt="${o.id}"${q.completed?' disabled':''}>
      <span class="choice-text">${esc(o.text)}</span>
      ${q.completed?`<span class="choice-why">${esc(o.why)}</span>`:''}
    </button>`;
  }).join('');

  const подпись=q.completed
    ? tr('choice.doneNote')
    : tr(q.multi?'choice.hintMulti':'choice.hintSingle');

  body.innerHTML=`<div class="qb">
    <div class="qb-task">
      <div class="qfrom">${esc(tr('task.from',{name:contact.name, role:contact.role}))}</div>
      <div class="qprompt">${esc(q.prompt)}</div>
    </div>
    ${energyWarnHtml(q)}
    <div class="choice-work">
      ${choiceTableHtml(q.resultTable)}
      <div class="choice-question">${esc(q.question)}${q.multi?`<span class="choice-multi">${esc(tr('choice.multi'))}</span>`:''}</div>
      <div class="choice-options">${options}</div>
      <div class="qb-actions">
        ${q.completed
          ? `<span class="tag-done">${esc(tr('qb.accepted'))}</span>`
          : `<button id="submit-btn" ${picks.length?'':'disabled'}>${esc(tr('qb.submit'))}</button>`}
        <span class="qb-shortcut-note">${esc(подпись)}</span>
      </div>
      ${benchFeedbackHtml()}
    </div>
  </div>`;

  if(!q.completed){
    body.querySelectorAll('.choice-opt').forEach(el=>el.addEventListener('click', ()=>{
      const id=el.dataset.opt;
      const было=q.picks||[];
      q.picks = q.multi
        ? (было.includes(id) ? было.filter(x=>x!==id) : было.concat(id))
        : [id];
      benchFeedback=null;      // состав ответа изменился — прежний разбор больше не про него
      refresh();
      requestSave();
    }));
    const btn=body.querySelector('#submit-btn');   // в своём окне, см. 89-workspace-chart.js
    if(btn) btn.addEventListener('click', submitBenchAnswer);
  }
}
