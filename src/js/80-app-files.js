"use strict";
/* ============ FileDock (reports) rendering ============ */
// Excel on a Russian locale splits on ';', which is what most players here will double-click into.
const CSV_SEP=';';
function csvEscape(v){
  const s=(v===null||v===undefined)?'':String(v);
  return /["\n\r]|;/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
}
function toCsv(columns, rows){
  const lines=[columns.map(csvEscape).join(CSV_SEP)];
  rows.forEach(r=> lines.push(columns.map(c=>csvEscape(r[c])).join(CSV_SEP)));
  return '﻿'+lines.join('\r\n');   // leading U+FEFF so Excel decodes the UTF-8 Cyrillic correctly
}
function safeFileName(s){
  return String(s).replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'_').replace(/^[-_]+|[-_]+$/g,'').slice(0,60)||'report';
}
function downloadText(filename, text){
  try{
    const blob=new Blob([text], {type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
    return true;
  } catch(e){
    toast(tr('files.downloadFail', {msg:(e&&e.message?e.message:String(e))}));
    return false;
  }
}
async function copyText(text){
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(text); return true; }
  } catch(e){ /* fall through to the legacy path */ }
  try{
    const ta=document.createElement('textarea');
    ta.value=text; ta.style.position='fixed'; ta.style.top='-1000px'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok=document.execCommand('copy');
    ta.remove();
    return ok;
  } catch(e){ return false; }
}

let reportFilter='';
function filteredReports(){
  const q=reportFilter.trim().toLowerCase();
  if(!q) return state.reports;
  return state.reports.filter(r=>
    r.title.toLowerCase().indexOf(q)>=0 ||
    String(r.sql).toLowerCase().indexOf(q)>=0 ||
    (tr('files.dayPrefix')+' '+r.day).indexOf(q)>=0
  );
}
function renderFiles(){
  const body=$('body-files');
  if(!body) return;
  const shown=filteredReports();
  let list='<div class="mail-list">'+
    '<div class="files-tools">'+
      `<input type="text" id="report-search" placeholder="${esc(tr('files.search'))}" value="${esc(reportFilter)}">`+
      `<button id="export-all-btn" ${state.reports.length?'':'disabled style="opacity:.5;cursor:not-allowed;"'}>${esc(tr('files.exportAll'))}</button>`+
    '</div>'+
    '<div class="list-heading">'+esc(tr('files.title', shown.length+(reportFilter?'/'+state.reports.length:'')))+'</div>';
  if(!state.reports.length){
    list+='<div class="task-empty">'+esc(tr('files.empty'))+'</div>';
  } else if(!shown.length){
    list+='<div class="task-empty">'+esc(tr('files.nothingFound'))+'</div>';
  } else {
    shown.forEach(r=>{
      list+=`<div class="mail-item ${r.id===activeReportId?'active':''}" data-rid="${r.id}">
        <div class="mfrom"><span>📄 ${esc(r.title)}</span></div>
        <div class="msnip">${esc(tr('files.dayPrefix'))} ${r.day} · ${r.rows.length}</div>
      </div>`;
    });
  }
  list+='</div>';
  let reading='<div class="mail-reading"><div class="task-empty" style="padding:0;">'+esc(tr('files.pick'))+'</div></div>';
  if(activeReportId){
    const r=state.reports.find(x=>x.id===activeReportId);
    if(r){
      let tbl='<div class="qb-results" style="padding:0;"><table><thead><tr>'+r.columns.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>';
      r.rows.forEach(row=>{ tbl+='<tr>'+r.columns.map(c=>'<td>'+esc(row[c])+'</td>').join('')+'</tr>'; });
      tbl+='</tbody></table></div>';
      reading=`<div class="mail-reading">
        <h2>${esc(r.title)}</h2>
        <div class="msender">${esc(tr('files.meta', {day:r.day, rows:r.rows.length, cols:r.columns.length}))}</div>
        <div class="report-sql">${esc(r.sql)}</div>
        <div class="report-actions">
          <button id="dl-report-btn">${esc(tr('files.download'))}</button>
          <button id="copy-sql-btn">${esc(tr('files.copySql'))}</button>
        </div>
        ${tbl}
        ${r.truncated?'<div class="report-trunc">'+esc(tr('files.truncated'))+'</div>':''}
      </div>`;
    }
  }
  body.innerHTML=list+reading;

  // Фокус и каретку в поиске сохраняет шина перерисовки — здесь об этом думать не нужно.
  const search=$('report-search');
  search.addEventListener('input', ()=>{ reportFilter=search.value; refresh(); });

  const exportAll=$('export-all-btn');
  if(exportAll && state.reports.length) exportAll.addEventListener('click', ()=>{
    const cols=[tr('files.colDay'), tr('files.colTask'), tr('files.colRows'), tr('files.colSql')];
    const rows=state.reports.map(r=>({[cols[0]]:r.day, [cols[1]]:r.title, [cols[2]]:r.rows.length, [cols[3]]:r.sql}));
    if(downloadText(safeFileName(career.name)+tr('files.allSuffix'), toCsv(cols, rows)))
      toast(tr('files.exported', {n:rows.length}));
  });

  body.querySelectorAll('.mail-item').forEach(el=>el.addEventListener('click', ()=>{ activeReportId=el.dataset.rid; refresh(); }));

  const dl=$('dl-report-btn');
  if(dl) dl.addEventListener('click', ()=>{
    const r=state.reports.find(x=>x.id===activeReportId);
    if(!r) return;
    if(downloadText(tr('files.dayPrefix')+r.day+'_'+safeFileName(r.title)+'.csv', toCsv(r.columns, r.rows)))
      toast(tr('files.oneExported'));
  });
  const cp=$('copy-sql-btn');
  if(cp) cp.addEventListener('click', async ()=>{
    const r=state.reports.find(x=>x.id===activeReportId);
    if(!r) return;
    toast(tr(await copyText(r.sql) ? 'files.sqlCopied' : 'files.sqlCopyFail'));
  });
}
function addReport(q, sqlText, columns, rows){
  const report={
    id:uid(), questId:q.id, title:(q.isBoss?'🏆 ':'')+q.title, day:state.day,
    sql:sqlText, columns:columns.slice(), rows:rows.slice(0,20), truncated:rows.length>20,
  };
  state.reports.unshift(report);
  if(state.reports.length>100) state.reports.length=100;
  // перерисовку сделает completeQuest сразу следом — здесь она была бы лишней
}

