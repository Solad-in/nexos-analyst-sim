"use strict";
/* ============ ChartLab ============ */
// Первый вид задач, которому мало QueryBench: у графика своё окно, свои органы управления
// и свой предпросмотр. Игрок выбирает тип графика и две оси, сразу видит результат и сдаёт
// его. Проверяется точное совпадение с задуманным — но задачи написаны так, что верный
// вариант ровно один, а неверные разобраны текстом.
//
// Библиотек нет и не будет (файл должен оставаться автономным), поэтому графики рисуются
// руками в SVG. Три типа покрывают три разных вопроса к данным, и этого достаточно:
// линия — как менялось со временем, столбцы — что больше, круг — какая доля от целого.
// Загружается до 93-task-types.js: реестр ссылается на renderChartWorkspace напрямую.

// Подписи берутся на момент отрисовки, а не при загрузке файла: иначе застыли бы на языке,
// который был выбран в тот момент.
function chartKinds(){
  return [
    {id:'line', label:tr('chart.line'), hint:tr('chart.lineHint')},
    {id:'bar',  label:tr('chart.bar'),  hint:tr('chart.barHint')},
    {id:'pie',  label:tr('chart.pie'),  hint:tr('chart.pieHint')},
  ];
}
const CHART_PALETTE=['var(--accent)','var(--good)','var(--accent-2)','#8a63d2','#d2637f','#63b3d2'];

/* ---- отрисовка ---- */
const W=470, H=210, PAD_L=44, PAD_B=30, PAD_T=12, PAD_R=10;
function niceMax(v){
  if(v<=0) return 1;
  const step=Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v/step)*step;
}
function axesSvg(max){
  const y0=H-PAD_B, y1=PAD_T;
  let s=`<line x1="${PAD_L}" y1="${y0}" x2="${W-PAD_R}" y2="${y0}" class="ax"/>`;
  s+=`<line x1="${PAD_L}" y1="${y0}" x2="${PAD_L}" y2="${y1}" class="ax"/>`;
  [0, 0.5, 1].forEach(f=>{
    const y=y0-(y0-y1)*f;
    s+=`<text x="${PAD_L-6}" y="${y+3}" class="ax-lab" text-anchor="end">${esc(fmtMoney(max*f))}</text>`;
    if(f>0) s+=`<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" class="grid"/>`;
  });
  return s;
}
function xLabelsSvg(labels){
  const n=labels.length, band=(W-PAD_L-PAD_R)/n;
  return labels.map((l,i)=>
    `<text x="${PAD_L+band*(i+0.5)}" y="${H-PAD_B+14}" class="ax-lab" text-anchor="middle">${esc(String(l).slice(0,9))}</text>`
  ).join('');
}
function barSvg(labels, values){
  const max=niceMax(Math.max(...values));
  const y0=H-PAD_B, h=y0-PAD_T, band=(W-PAD_L-PAD_R)/values.length, bw=Math.min(38, band*0.6);
  const bars=values.map((v,i)=>{
    const bh=Math.max(1, h*(v/max));
    return `<rect x="${PAD_L+band*(i+0.5)-bw/2}" y="${y0-bh}" width="${bw}" height="${bh}" fill="var(--accent)" rx="2"/>`;
  }).join('');
  return axesSvg(max)+bars+xLabelsSvg(labels);
}
function lineSvg(labels, values){
  const max=niceMax(Math.max(...values));
  const y0=H-PAD_B, h=y0-PAD_T, band=(W-PAD_L-PAD_R)/values.length;
  const pts=values.map((v,i)=>[PAD_L+band*(i+0.5), y0-h*(v/max)]);
  const path=pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const dots=pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="var(--accent)"/>`).join('');
  return axesSvg(max)+`<polyline points="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>`+dots+xLabelsSvg(labels);
}
function pieSvg(labels, values){
  const total=values.reduce((a,b)=>a+b,0)||1;
  const cx=150, cy=H/2, r=78;
  let angle=-Math.PI/2, slices='', legend='';
  values.forEach((v,i)=>{
    const span=v/total*Math.PI*2;
    const x1=cx+r*Math.cos(angle), y1=cy+r*Math.sin(angle);
    angle+=span;
    const x2=cx+r*Math.cos(angle), y2=cy+r*Math.sin(angle);
    const big=span>Math.PI?1:0;
    const color=CHART_PALETTE[i%CHART_PALETTE.length];
    slices+=`<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${big} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${color}"/>`;
    legend+=`<rect x="255" y="${28+i*20}" width="10" height="10" fill="${color}" rx="2"/>`+
            `<text x="271" y="${37+i*20}" class="ax-lab">${esc(String(labels[i]).slice(0,20))} — ${Math.round(v/total*100)}%</text>`;
  });
  return slices+legend;
}
function chartSvg(kind, labels, values){
  const body = kind==='bar' ? barSvg(labels,values)
             : kind==='line' ? lineSvg(labels,values)
             : pieSvg(labels,values);
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

/* ---- логика типа задачи ---- */
function chartPick(q){ return q.chartPick||{}; }
function numericColumns(q){
  return q.data.columns.filter(c=> q.data.rows.every(r=> typeof r[c]==='number'));
}
function collectChartAnswer(q){
  const p=chartPick(q);
  return (p.kind && p.x && p.y) ? {kind:p.kind, x:p.x, y:p.y} : null;
}
function checkChartAnswer(q, a){
  return a.kind===q.correct.kind && a.x===q.correct.x && a.y===q.correct.y;
}
// Разбор идёт по порядку принятия решений: сначала тип графика, потом что по горизонтали,
// потом что по вертикали. Называется только ближайшая ошибка — остальное игрок доводит сам.
function diagnoseChartAnswer(q, a){
  if(a.kind!==q.correct.kind) return q.whyKind[a.kind] || tr('chart.wrongKind');
  if(a.x!==q.correct.x) return tr('chart.wrongX', {x:a.x});
  return tr('chart.wrongY', {y:a.y});
}

/* ---- окно ---- */
function renderChartLab(){
  const body=$('body-chart');
  if(!body) return;
  const q=benchQuest;
  if(!q || taskType(q).app!=='chart'){
    body.innerHTML=`<div class="chart-empty">
      <div class="chart-empty-ico">📈</div>
      <div>${esc(tr('chart.emptyTitle'))}</div>
      <div class="chart-empty-sub">${esc(tr('chart.emptySub'))}</div>
    </div>`;
    return;
  }
  renderChartWorkspace(body, q);
}
function renderChartWorkspace(body, q){
  const contact=ALL_CONTACTS[q.fromId];
  const p=chartPick(q);
  const nums=numericColumns(q);
  const готово=p.kind && p.x && p.y;
  const labels=готово ? q.data.rows.map(r=>r[p.x]) : [];
  const values=готово ? q.data.rows.map(r=>Number(r[p.y])||0) : [];

  const кнопки=(имя, список, текущее)=> список.map(o=>{
    const id=o.id||o, label=o.label||o;
    return `<button class="chart-opt${id===текущее?' picked':''}" data-set="${имя}" data-val="${esc(id)}"${q.completed?' disabled':''}>
      ${esc(label)}${o.hint?`<span class="chart-opt-hint">${esc(o.hint)}</span>`:''}
    </button>`;
  }).join('');

  body.innerHTML=`<div class="qb">
    <div class="qb-task">
      <div class="qfrom">${esc(tr('task.from',{name:contact.name, role:contact.role}))}</div>
      <div class="qprompt">${esc(q.prompt)}</div>
    </div>
    ${energyWarnHtml(q)}
    <div class="chart-work">
      <div class="chart-controls">
        <div class="chart-group"><div class="chart-lab">${esc(tr('chart.kind'))}</div><div class="chart-row">${кнопки('kind', chartKinds(), p.kind)}</div></div>
        <div class="chart-group"><div class="chart-lab">${esc(tr('chart.x'))}</div><div class="chart-row">${кнопки('x', q.data.columns, p.x)}</div></div>
        <div class="chart-group"><div class="chart-lab">${esc(tr('chart.y'))}</div><div class="chart-row">${кнопки('y', nums, p.y)}</div></div>
      </div>
      <div class="chart-preview">
        ${готово ? chartSvg(p.kind, labels, values)
                 : `<div class="chart-hint">${esc(tr('chart.preview'))}</div>`}
      </div>
      <div class="qb-actions">
        ${q.completed
          ? `<span class="tag-done">${esc(tr('qb.accepted'))}</span>`
          : `<button id="submit-btn" ${готово?'':'disabled'}>${esc(tr('qb.submit'))}</button>`}
        <span class="qb-shortcut-note">${esc(tr(q.completed?'chart.doneNote':'chart.hintBuild'))}</span>
      </div>
      ${benchFeedbackHtml()}
      ${chartDataHtml(q)}
    </div>
  </div>`;

  if(!q.completed){
    body.querySelectorAll('.chart-opt').forEach(el=>el.addEventListener('click', ()=>{
      q.chartPick=Object.assign({}, chartPick(q), {[el.dataset.set]:el.dataset.val});
      benchFeedback=null;     // собранный график изменился — прежний разбор больше не про него
      refresh();
      requestSave();
    }));
    // Ищем кнопку в своём окне, а не по документу: id `submit-btn` теперь может существовать
    // и в QueryBench, который в этот момент ещё не перерисовался. Сейчас порядок окон спасает,
    // но полагаться на это — значит оставить ловушку следующему окну.
    const btn=body.querySelector('#submit-btn');
    if(btn) btn.addEventListener('click', submitBenchAnswer);
  }
}
function chartDataHtml(q){
  const tbl=q.data;                     // не `t`: так называется функция перевода
  let html='<div class="chart-data"><div class="chart-lab">'+esc(tr('chart.data'))+'</div><div class="qb-results"><table><thead><tr>'+
    tbl.columns.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>';
  tbl.rows.forEach(r=>{ html+='<tr>'+tbl.columns.map(c=>'<td>'+esc(r[c])+'</td>').join('')+'</tr>'; });
  return html+'</tbody></table></div></div>';
}
