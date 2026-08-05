"use strict";
// Результат запроса и вердикт по сданному ответу раньше писались прямо в DOM из
// runBenchQuery — и любая перерисовка их стирала. Здесь они становятся состоянием, из
// которого окно рисуется целиком, так что refresh() можно звать сколько угодно.
let benchOutput=null;      // {columns, rows} после удачного запроса, {error:'…'} после неудачного
let benchFeedback=null;    // {tone:'good'|'bad', text} — вердикт по сданному ответу
// Автофокус в редакторе нужен, когда игрок сам открыл QueryBench или взял задачу, — но не
// на каждой перерисовке, иначе пришедшее сообщение выдёргивало бы каретку из другого поля.
let benchEditorAutofocus=false;
function setBenchQuest(q){
  benchQuest=q||null;
  benchOutput=null; benchFeedback=null;   // вывод принадлежит тому, что сейчас в редакторе
}
function benchTables(){ return benchQuest?benchQuest.tables:sandboxTables(); }
function schemaPanel(tables, joinNote, sampleRows){
  let html='<div class="qb-schema"><h4>'+esc(tr('qb.schema'))+'</h4>';
  Object.keys(tables).forEach(tn=>{
    const t=tables[tn];
    html+=`<div class="tname">${esc(t.name)}</div>`;
    t.columns.forEach(c=> html+=`<div class="col"><b>${esc(c.key)}</b></div>`);
    if(sampleRows){
      html+='<div class="col" style="border:none;font-size:10px;color:var(--text-mut);padding-top:4px;">'+esc(tr('qb.samples'))+'</div>';
      t.rows.slice(0,sampleRows).forEach(r=> html+=`<div class="col" style="font-size:10px;">${t.columns.map(c=>esc(r[c.key])).join(' | ')}</div>`);
    } else {
      html+=`<div class="col" style="border:none;font-size:10px;color:var(--text-mut);padding-top:4px;">${esc(tr('qb.rowCount', t.rows.length))}</div>`;
    }
    html+='<div style="height:10px;"></div>';
  });
  if(joinNote) html+=`<div class="join-note">🔗 ${esc(joinNote)}</div>`;
  return html+'</div>';
}
// Shared by the task editor and the sandbox editor.
function wireBenchEditor(onDraft){
  const input=$('sql-input');
  input.addEventListener('input', ()=>onDraft(input.value));
  input.addEventListener('keydown', e=>{
    if(e.key==='Enter' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); runBenchQuery(); return; }
    if((e.key==='s'||e.key==='ы') && (e.ctrlKey||e.metaKey)){
      e.preventDefault();
      const sb=$('submit-btn');
      if(sb && !sb.disabled) submitBenchAnswer();
      return;
    }
    if(e.key==='Tab'){
      e.preventDefault();
      const s=input.selectionStart, en=input.selectionEnd;
      input.value=input.value.slice(0,s)+'  '+input.value.slice(en);
      input.selectionStart=input.selectionEnd=s+2;
      onDraft(input.value);
    }
  });
  if(benchEditorAutofocus){
    benchEditorAutofocus=false;
    input.focus();
    input.selectionStart=input.selectionEnd=input.value.length;
    claimFocus();          // иначе шина вернёт каретку туда, где игрок был до открытия окна
  }
  $('run-btn').addEventListener('click', runBenchQuery);
  $('qb-csv-btn').addEventListener('click', ()=>{
    if(!benchOutput || !benchOutput.rows) return;
    const base=benchQuest?safeFileName(benchQuest.title):tr('csv.sandboxFile');
    if(downloadText(base+tr('csv.resultSuffix'), toCsv(benchOutput.columns, benchOutput.rows)))
      toast(tr('qb.csvDone'));
  });
}
/* ---- вывод рисуется из benchOutput/benchFeedback, а не дописывается в DOM ---- */
function benchResultsHtml(){
  if(!benchOutput) return '';
  if(benchOutput.error) return '<div class="qb-error">⚠ '+esc(benchOutput.error)+'</div>';
  if(!benchOutput.rows.length) return '<div class="qb-error">'+esc(tr('qb.emptyResult'))+'</div>';
  const cols=benchOutput.columns;
  let html='<table><thead><tr>'+cols.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>';
  benchOutput.rows.forEach(r=>{ html+='<tr>'+cols.map(c=>'<td>'+esc(r[c])+'</td>').join('')+'</tr>'; });
  return html+'</tbody></table>';
}
function benchFeedbackHtml(){
  if(!benchFeedback) return '<div id="qb-feedback"></div>';
  return '<div id="qb-feedback" class="'+benchFeedback.tone+'">'+esc(benchFeedback.text)+'</div>';
}
const benchCanSubmit=()=> !!benchOutput && !benchOutput.error;
const benchCanExport=()=> !!benchOutput && !benchOutput.error && benchOutput.rows.length>0;
// Общее для всех рабочих мест: энергия тратится на задачу любого вида.
function energyWarnHtml(q){
  if(q.completed) return '';
  const p={have:Math.round(state.energy), need:q.energyCost};
  if(state.energy<q.energyCost)
    return '<div class="qb-energy-warn blocked">'+tr('energy.blocked', p)+'</div>';   // внутри есть <b>
  if(state.energy<35)
    return '<div class="qb-energy-warn">'+esc(tr('energy.low', p))+'</div>';
  return '';
}
let sandboxDraft='SELECT * FROM customers LIMIT 10;';
function renderSandbox(body){
  const tables=sandboxTables();
  body.innerHTML=`<div class="qb">
    <div class="qb-task">
      <div class="qfrom">${esc(tr('qb.sandboxTitle'))}</div>
      <div class="qprompt">${esc(tr('qb.sandboxNote'))}</div>
    </div>
    <div class="qb-main">
      ${schemaPanel(tables, 'orders.customer_id = customers.id · orders.employee_id = employees.id · tickets.customer_id = customers.id', 0)}
      <div class="qb-work">
        <textarea id="sql-input" spellcheck="false">${esc(sandboxDraft)}</textarea>
        <div class="qb-actions">
          <button id="run-btn">${esc(tr('qb.run'))}</button>
          <button id="qb-csv-btn" ${benchCanExport()?'':'disabled'} style="background:#fff;border:1px solid var(--line);color:var(--text-dark);">${esc(tr('qb.csv'))}</button>
          <span class="qb-shortcut-note">${esc(tr('qb.shortcutsSandbox'))}</span>
        </div>
        ${benchFeedbackHtml()}
        <div class="qb-results" id="qb-results">${benchResultsHtml()}</div>
      </div>
    </div>
  </div>`;
  wireBenchEditor(v=>{ sandboxDraft=v; });
}
// QueryBench — окно, в котором задача решается; чем именно её решают, знает тип задачи.
// Задача, которая живёт в другом окне (график — в ChartLab), оставляет здесь песочницу:
// иначе её рабочее место нарисовалось бы сразу в двух окнах.
function renderQB(){
  const body=$('body-qb');
  if(!body) return;
  if(benchQuest && taskType(benchQuest).app==='qb') taskType(benchQuest).render(body, benchQuest);
  else renderSandbox(body);
}
function renderSqlWorkspace(body, q){
  const contact=ALL_CONTACTS[q.fromId];
  const tableNames=Object.keys(q.tables);
  const schemaHtml=schemaPanel(q.tables, q.joinNote, 4);

  const HINT_LABELS=['', tr('hint.l1'), tr('hint.l2'), tr('hint.l3')];
  let hintsHtml='';
  for(let i=1;i<=(q.hintLevel||0);i++){
    const isText=(i===1);
    hintsHtml+=`<div class="hint-step">
      <div class="hlabel">${HINT_LABELS[i]}</div>
      <div class="${isText?'hbody':'hcode'}">${esc(hintTextFor(q,i))}</div>
    </div>`;
  }
  if(!q.completed && (q.hintLevel||0)<3){
    const next=(q.hintLevel||0)+1;
    const price=hintPrice(q,next);
    const afford=state.money>=price;
    hintsHtml+=`<button class="hint-btn" id="hint-btn" ${afford?'':'disabled'}>${esc(HINT_LABELS[next])} · ${price?'−$'+price:esc(tr('hint.free'))}</button>`;
    if(!afford) hintsHtml+=`<div class="hint-warn">${esc(tr('hint.noMoney',{money:fmtMoney(state.money), days:tr('workDays', daysToPayday())}))}</div>`;
    else if(q.isBoss && price) hintsHtml+='<div class="hint-spent">'+esc(tr('hint.examCosts'))+'</div>';
  }

  const energyHtml=energyWarnHtml(q);

  body.innerHTML=`<div class="qb">
    <div class="qb-task">
      <div class="qfrom">${esc(tr('task.from',{name:contact.name, role:contact.role}))}</div>
      <div class="qprompt">${esc(q.prompt)}</div>
      ${hintsHtml}
    </div>
    ${energyHtml}
    <div class="qb-main">
      ${schemaHtml}
      <div class="qb-work">
        <textarea id="sql-input" spellcheck="false">${esc(q.draftSql||('SELECT * FROM '+tableNames[0]+' LIMIT 5;'))}</textarea>
        <div class="qb-actions">
          <button id="run-btn">${esc(tr('qb.run'))}</button>
          ${q.completed
            ? `<span class="tag-done">${esc(tr('qb.accepted'))}</span>`
            : `<button id="submit-btn" ${benchCanSubmit()?'':'disabled'}>${esc(tr('qb.submit'))}</button>`}
          <button id="qb-csv-btn" ${benchCanExport()?'':'disabled'} style="background:#fff;border:1px solid var(--line);color:var(--text-dark);">${esc(tr('qb.csv'))}</button>
          <span class="qb-shortcut-note">${esc(tr(q.completed?'qb.doneNote':'qb.shortcutsTask'))}</span>
        </div>
        ${benchFeedbackHtml()}
        <div class="qb-results" id="qb-results">${benchResultsHtml()}</div>
      </div>
    </div>
  </div>`;

  const hintBtn=$('hint-btn');
  if(hintBtn) hintBtn.addEventListener('click', buyHint);
  const submitBtn=body.querySelector('#submit-btn');   // в своём окне; у сданной задачи её нет
  if(submitBtn) submitBtn.addEventListener('click', submitBenchAnswer);
  // Keep the draft on the quest so a re-render (end of shift, task switch, reload) doesn't wipe it.
  wireBenchEditor(v=>{ q.draftSql=v; });
}
function runBenchQuery(){
  const sql=$('sql-input').value;
  try{
    const {columns, rows}=runQuery(sql, benchTables());
    benchOutput={columns, rows};
  } catch(err){
    benchOutput={error:err.message};
  }
  benchFeedback=null;      // новый прогон отменяет прежний вердикт
  refresh();
}
function buyHint(){
  const q=benchQuest;
  if(!q || (q.hintLevel||0)>=3) return;
  const next=(q.hintLevel||0)+1;
  const price=hintPrice(q,next);
  if(state.money<price){ toast(tr('hint.tooPoor')); return; }
  state.money-=price;
  q.hintLevel=next;
  state.hintsBought++;
  if(price) toast(tr('hint.bought', {price:fmtMoney(price)}));
  refresh();
  requestSave();
}

// The old feedback was one sentence for every possible mistake. The spec already knows what
// the answer should look like, so the player can be told what is wrong with *their* result —
// shape, grouping, aggregate — without ever revealing the expected value.
function diagnoseAnswer(spec, rows){
  if(!rows || !rows.length) return tr('diag.empty');
  const numeric=Object.values(rows[0]).filter(v=>typeof v==='number').length;
  const n=rows.length;
  switch(spec.kind){
    case 'scalar':
      if(n>1) return tr('diag.scalarMany', n);
      if(!numeric) return tr('diag.scalarNotNumber');
      return tr('diag.scalarOff');
    case 'count':
      if(n===1 && numeric) return tr('diag.countOff');
      return tr('diag.countRows', n);
    case 'groups':
      if(n===1 && spec.groups.length>1) return tr('diag.groupsNone');
      if(n!==spec.groups.length) return tr('diag.groupsCount', n);
      if(!numeric) return tr('diag.groupsNoNumber');
      return tr('diag.groupsValues');
    case 'keySet':
      if(n!==spec.keys.length) return tr('diag.keysCount', n);
      return tr('diag.keysValues');
    case 'bestMatch':
      if(n>1) return tr('diag.bestMany', n);
      return tr('diag.bestOff');
    default:
      return tr('diag.generic');
  }
}

// A query that returns the right rows can still be a query you wouldn't want in a real report.
// These are remarks, never failures — and each one is made at most STYLE_NOTE_LIMIT times per
// career, so the lead teaches the habit and then stops nagging.
const STYLE_NOTE_LIMIT=3;
const STYLE_CHECKS=[
  {
    id:'star',
    // only when the reference solution names its columns — some tasks legitimately want SELECT *
    test:(sql,q)=> /^\s*select\s+\*/i.test(sql) && !/^\s*select\s+\*/i.test(q.hint||''),
  },
  {
    id:'alias',
    test:(sql)=> /\b(count|sum|avg|min|max)\s*\([^)]*\)(?!\s+as\b)/i.test(sql.split(/\bfrom\b/i)[0]||''),
  },
  {
    id:'orchain',
    test:(sql)=> /(\b[\w.]+)\s*=\s*'[^']*'\s+or\s+\1\s*=/i.test(sql),
  },
  {
    id:'limitnoorder',
    test:(sql)=> /\blimit\s+\d+/i.test(sql) && !/\border\s+by\b/i.test(sql),
  },
];
function styleReview(sql, q){
  for(const check of STYLE_CHECKS){
    if((state.styleNotes[check.id]||0)>=STYLE_NOTE_LIMIT) continue;
    let hit=false;
    try{ hit=check.test(sql,q); } catch(e){ hit=false; }
    if(hit){
      state.styleNotes[check.id]=(state.styleNotes[check.id]||0)+1;
      return tr('style.'+check.id);   // текст замечания живёт в словаре, здесь только правило
    }
  }
  return null;
}

// Окно собирает ответ игрока и отдаёт его общей машинке сдачи; своё дело здесь — только
// показать вердикт. Сданная задача остаётся в QueryBench, поэтому зелёная строка доживает
// до прочтения, а не стирается переключением в песочницу, как было раньше.
function submitBenchAnswer(){
  const q=benchQuest;
  if(!q || q.completed) return;
  const answer=taskType(q).collect(q);
  if(!answer) return;                 // сдавать ещё нечего
  const res=submitAnswer(q, answer);
  if(res) benchFeedback={tone:res.ok?'good':'bad', text:res.text};
  refresh();
}

