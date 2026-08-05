"use strict";
/* ============ mini SQL engine (supports JOIN) ============ */
// Сообщения об ошибках — часть обучения: их игрок видит чаще, чем правильный ответ, поэтому
// они разложены по языкам здесь же, рядом с местом, где бросаются. Помощник `err(key, ...)`
// собирает Error с текстом на языке карьеры.
const ENGINE_MSG={
  ru:{
    exprParse:s=>'Не могу разобрать выражение: '+s,
    exprCut:'Выражение обрывается на середине.',
    exprParen:'Не закрыта скобка в выражении.',
    exprQuote:'Не закрыта кавычка в выражении.',
    exprNear:s=>'Не могу разобрать выражение рядом с: '+s,
    callParen:n=>'Не закрыта скобка в вызове '+n+'().',
    unknownCol:n=>'Неизвестная колонка: '+n,
    unknownColCond:n=>'Неизвестная колонка в условии: '+n,
    unknownColOrder:n=>'Неизвестная колонка в ORDER BY: '+n+'. Сортировать можно только по колонкам из SELECT (или их псевдонимам).',
    aggInExpr:n=>'Агрегат '+n+'() нельзя вкладывать в вычисляемое выражение — в этом движке он должен быть отдельной колонкой в SELECT.',
    unknownFunc:(n,list)=>'Неизвестная функция: '+n+'. Доступны: '+list+'.',
    unknownAgg:n=>'Неизвестная функция: '+n,
    unknownOp:o=>'Неизвестный оператор: '+o,
    condParse:c=>'Не могу разобрать условие: '+c,
    subDepth:'Слишком глубокая вложенность подзапросов.',
    subMany:'Слишком много подзапросов в одном запросе.',
    subParen:'Не закрыта скобка подзапроса.',
    subShape:(r,c)=>'Подзапрос должен возвращать ровно одно значение — одну строку и одну колонку. Получено строк: '+r+', колонок: '+c+'.',
    empty:'Запрос пуст.',
    queryParse:'Не могу разобрать запрос. Формат: SELECT [DISTINCT] ... FROM ... [[LEFT] JOIN ... ON ...] [WHERE ...] [GROUP BY ...] [HAVING ...] [ORDER BY ...] [LIMIT ...]',
    noTable:(t,list)=>'Таблица "'+t+'" не найдена. Доступные: '+list,
    noJoinTable:(t,list)=>'Таблица "'+t+'" не найдена для JOIN. Доступные: '+list,
    inOn:m=>'Ошибка в условии ON: '+m,
    inGroupBy:m=>'Ошибка в GROUP BY: '+m,
    inHaving:m=>'Ошибка в HAVING: '+m,
    groupSelect:'В запросах с GROUP BY выбирай только то, по чему идёт группировка, или агрегатные функции.',
    groupStar:'SELECT * нельзя использовать вместе с GROUP BY.',
    havingNoGroup:'HAVING работает только вместе с GROUP BY. Для фильтрации строк используй WHERE.',
    mixAgg:'Нельзя смешивать обычные колонки с агрегатными функциями без GROUP BY.',
  },
  en:{
    exprParse:s=>'Cannot parse the expression: '+s,
    exprCut:'The expression breaks off halfway.',
    exprParen:'Unclosed bracket in the expression.',
    exprQuote:'Unclosed quote in the expression.',
    exprNear:s=>'Cannot parse the expression near: '+s,
    callParen:n=>'Unclosed bracket in the call to '+n+'().',
    unknownCol:n=>'Unknown column: '+n,
    unknownColCond:n=>'Unknown column in the condition: '+n,
    unknownColOrder:n=>'Unknown column in ORDER BY: '+n+'. You can only sort by columns present in SELECT (or their aliases).',
    aggInExpr:n=>'The aggregate '+n+'() cannot be nested inside a computed expression — in this engine it has to be a column of its own in SELECT.',
    unknownFunc:(n,list)=>'Unknown function: '+n+'. Available: '+list+'.',
    unknownAgg:n=>'Unknown function: '+n,
    unknownOp:o=>'Unknown operator: '+o,
    condParse:c=>'Cannot parse the condition: '+c,
    subDepth:'Subqueries are nested too deeply.',
    subMany:'Too many subqueries in one query.',
    subParen:'Unclosed subquery bracket.',
    subShape:(r,c)=>'A subquery must return exactly one value — one row and one column. Got '+r+' rows and '+c+' columns.',
    empty:'The query is empty.',
    queryParse:'Cannot parse the query. Format: SELECT [DISTINCT] ... FROM ... [[LEFT] JOIN ... ON ...] [WHERE ...] [GROUP BY ...] [HAVING ...] [ORDER BY ...] [LIMIT ...]',
    noTable:(t,list)=>'Table "'+t+'" not found. Available: '+list,
    noJoinTable:(t,list)=>'Table "'+t+'" not found for the JOIN. Available: '+list,
    inOn:m=>'Error in the ON condition: '+m,
    inGroupBy:m=>'Error in GROUP BY: '+m,
    inHaving:m=>'Error in HAVING: '+m,
    groupSelect:'With GROUP BY, select only what you are grouping by, or aggregate functions.',
    groupStar:'SELECT * cannot be used together with GROUP BY.',
    havingNoGroup:'HAVING only works together with GROUP BY. To filter rows, use WHERE.',
    mixAgg:'You cannot mix plain columns with aggregate functions without GROUP BY.',
  },
};
function err(key){
  const pack=ENGINE_MSG[locale]||ENGINE_MSG.ru;
  const v=(key in pack)?pack[key]:ENGINE_MSG.ru[key];
  const rest=[].slice.call(arguments,1);
  return new Error(typeof v==='function'?v.apply(null,rest):v);
}
/* --- скалярные функции --- */
// Нужны для задач на грязные данные: пока привести значения к единому виду нечем,
// «посчитай выручку по городам» на данных, где город записан тремя способами, не решается
// вообще никак. Три функции покрывают два реальных дефекта — регистр и лишние пробелы.
// CASE WHEN сознательно не сделан: это отдельный синтаксис со своим разбором, а уроку
// про чистку он не нужен.
const SCALAR_FUNCS={
  lower:v=>String(v).toLowerCase(),
  upper:v=>String(v).toUpperCase(),
  trim:v=>String(v).trim(),
};
const AGG_NAMES=/^(count|sum|avg|min|max)$/i;
// Вызов функции: имя, скобки и один аргумент, внутри которого допускается ещё одна пара
// скобок — этого хватает на LOWER(TRIM(city)) и не даёт регулярке разрастись.
const CALL_SRC='[\\w.]+\\s*\\((?:[^()]|\\([^()]*\\))*\\)';
const CALL_RE=new RegExp('^([a-z_]+)\\s*\\(([\\s\\S]*)\\)$','i');
// Один токен — частный случай выражения: колонка, литерал, вызов функции. Отдельной ветки
// разбора для него больше нет, чтобы «LOWER(a)» и «LOWER(a) * 2» считались одним и тем же
// кодом. Быстрый путь для голого имени колонки оставлен: он самый частый.
function resolveToken(tok,row){
  const t=String(tok).trim();
  if(t in row) return row[t];
  return evalExpr(t,row);
}
// Сравнение текста выражений: 'LOWER(city)' и 'lower( city )' — одно и то же.
function normExpr(s){ return String(s).replace(/\s+/g,'').toLowerCase(); }
/* --- арифметика --- */
// Раньше выражение резалось по [+-*/] слева направо: `a + b * c` считалось как `(a + b) * c`,
// скобки не работали вовсе, а `LOWER(a/b)` разваливался по слэшу внутри вызова. Существующие
// задачи это не ломало (в них `revenue/spend` и `signups/visits*100`, где слева направо
// совпадает с правильным ответом), но в песочнице движок молча выдавал неверные числа —
// для обучающего инструмента это худший из возможных багов. Теперь это разбор с приоритетом
// операций: сложение над умножением, умножение над атомом, атом умеет скобки и вызовы.
function evalExpr(expr,row){
  const p={s:String(expr), i:0, row};
  const v=parseAddSub(p);
  skipWs(p);
  if(p.i<p.s.length) throw err('exprParse', String(expr).trim());
  return v;
}
function skipWs(p){ while(p.i<p.s.length && /\s/.test(p.s[p.i])) p.i++; }
function parseAddSub(p){
  let v=parseMulDiv(p);
  for(;;){
    skipWs(p);
    const c=p.s[p.i];
    if(c!=='+' && c!=='-') return v;
    p.i++;
    const rhs=parseMulDiv(p);
    v = (c==='+') ? v+rhs : v-rhs;
  }
}
function parseMulDiv(p){
  let v=parseAtom(p);
  for(;;){
    skipWs(p);
    const c=p.s[p.i];
    if(c!=='*' && c!=='/') return v;
    p.i++;
    const rhs=parseAtom(p);
    v = (c==='*') ? v*rhs : (rhs===0?NaN:v/rhs);
  }
}
function parseAtom(p){
  skipWs(p);
  const s=p.s;
  if(p.i>=s.length) throw err('exprCut');
  if(s[p.i]==='('){
    p.i++;
    const v=parseAddSub(p);
    skipWs(p);
    if(s[p.i]!==')') throw err('exprParen');
    p.i++;
    return v;
  }
  if(s[p.i]==="'" || s[p.i]==='"'){
    const q=s[p.i];
    let j=p.i+1;
    while(j<s.length && s[j]!==q) j++;
    if(j>=s.length) throw err('exprQuote');
    const lit=s.slice(p.i+1,j);
    p.i=j+1;
    return lit;
  }
  const num=/^-?\d+(\.\d+)?/.exec(s.slice(p.i));
  if(num && /[\d]/.test(num[0].replace('-',''))){ p.i+=num[0].length; return parseFloat(num[0]); }
  if(s[p.i]==='-'){ p.i++; return -parseAtom(p); }        // унарный минус: -amount
  const id=/^[\w.]+/.exec(s.slice(p.i));
  if(!id) throw err('exprNear', s.slice(p.i,p.i+14));
  const name=id[0];
  p.i+=name.length;
  skipWs(p);
  if(s[p.i]==='('){
    p.i++;
    const arg=parseAddSub(p);
    skipWs(p);
    if(s[p.i]!==')') throw err('callParen', name);
    p.i++;
    return applyFunc(name, arg);
  }
  if(!(name in p.row)) throw err('unknownCol', name);
  return p.row[name];
}
function applyFunc(name, arg){
  const fn=SCALAR_FUNCS[name.toLowerCase()];
  if(!fn){
    if(AGG_NAMES.test(name))
      throw err('aggInExpr', name.toUpperCase());
    throw err('unknownFunc', name, Object.keys(SCALAR_FUNCS).map(s=>s.toUpperCase()).join(', '));
  }
  return isNullish(arg)?null:fn(arg);
}
// Аргументом агрегата может быть звёздочка, колонка или вызов скалярной функции:
// COUNT(DISTINCT LOWER(city)) — главный вопрос к грязным данным, «сколько тут на самом деле
// разных значений».
const AGG_ARG_SRC='\\*|'+CALL_SRC+'|[\\w.]+';
const AGG_RE=new RegExp('^(count|sum|avg|min|max)\\s*\\(\\s*(distinct\\s+)?('+AGG_ARG_SRC+')\\s*\\)$','i');
function parseSelectItem(raw){
  const asMatch=raw.match(/^(.*?)\s+as\s+([\w]+)$/i);
  let expr=raw, alias=null;
  if(asMatch){expr=asMatch[1].trim(); alias=asMatch[2].trim();}
  const aggMatch=expr.match(AGG_RE);
  if(aggMatch){
    const func=aggMatch[1].toLowerCase(), distinct=!!aggMatch[2], arg=aggMatch[3];
    return {kind:'agg',func,arg,distinct,alias:alias||(func+'_'+(arg==='*'?'all':arg.replace('.','_')))};
  }
  if(expr.trim()==='*') return {kind:'star'};
  if(/^[\w.]+$/.test(expr.trim())) return {kind:'col',col:expr.trim(),alias:alias||expr.trim()};
  return {kind:'expr',expr:expr.trim(),alias:alias||expr.trim()};
}
function compare(a,b,op){
  let av=a,bv=b;
  const bothNum=typeof av==='number'&&typeof bv==='number';
  if(!bothNum){av=String(av).toLowerCase();bv=String(bv).toLowerCase();}
  switch(op){
    case '=': return av==bv;
    case '!=': case '<>': return av!=bv;
    case '>': return Number(a)>Number(b);
    case '<': return Number(a)<Number(b);
    case '>=': return Number(a)>=Number(b);
    case '<=': return Number(a)<=Number(b);
    default: throw err('unknownOp', op);
  }
}
/* --- boolean expressions: AND/OR/NOT, parentheses, IN, BETWEEN, LIKE, IS NULL --- */
// Splits on a top-level keyword only: text inside quotes or parentheses is skipped, and
// the AND that belongs to BETWEEN ... AND ... is not treated as a boolean operator.
function splitTopLevel(str, keyword){
  const kw=keyword.toLowerCase();
  const parts=[];
  let depth=0, quote=null, last=0, pendingBetween=false;
  for(let i=0;i<str.length;i++){
    const c=str[i];
    if(quote){ if(c===quote) quote=null; continue; }
    if(c==="'"||c==='"'){ quote=c; continue; }
    if(c==='('){ depth++; continue; }
    if(c===')'){ depth--; continue; }
    if(depth!==0) continue;
    if(!/[a-z_]/i.test(c)) continue;
    if(i>0 && /[\w.]/.test(str[i-1])) continue;
    const word=/^[a-z_]+/i.exec(str.slice(i))[0];
    const lower=word.toLowerCase();
    if(lower==='between'){ pendingBetween=true; }
    else if(lower==='and' && pendingBetween){ pendingBetween=false; }
    else if(lower===kw){
      parts.push(str.slice(last,i));
      last=i+word.length;
    }
    i+=word.length-1;
  }
  parts.push(str.slice(last));
  return parts.map(s=>s.trim()).filter(s=>s.length);
}
// true when the '(' that opens the string is closed only by its very last character
function isFullyWrapped(s){
  if(s[0]!=='(' || s[s.length-1]!==')') return false;
  let depth=0, quote=null;
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(quote){ if(c===quote) quote=null; continue; }
    if(c==="'"||c==='"'){ quote=c; continue; }
    if(c==='(') depth++;
    else if(c===')'){ depth--; if(depth===0) return i===s.length-1; }
  }
  return false;
}
function splitList(s){
  const out=[]; let depth=0, quote=null, last=0;
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(quote){ if(c===quote) quote=null; continue; }
    if(c==="'"||c==='"'){ quote=c; continue; }
    if(c==='(') depth++;
    else if(c===')') depth--;
    else if(c===',' && depth===0){ out.push(s.slice(last,i)); last=i+1; }
  }
  out.push(s.slice(last));
  return out.map(x=>x.trim()).filter(x=>x.length);
}
function colValue(name,row){
  if(!(name in row)) throw err('unknownColCond', name);
  return row[name];
}
function literalOrCol(tok,row){
  tok=tok.trim();
  if(/^'.*'$/.test(tok)||/^".*"$/.test(tok)) return tok.slice(1,-1);
  if(/^-?\d+(\.\d+)?$/.test(tok)) return parseFloat(tok);
  return (tok in row)?row[tok]:tok;
}
function isNullish(v){ return v===null||v===undefined; }
function looseEq(a,b){
  if(typeof a==='number'&&typeof b==='number') return a===b;
  return String(a).toLowerCase()===String(b).toLowerCase();
}
function likeMatch(value,pattern){
  if(isNullish(value)) return false;
  const rx=String(pattern)
    .replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
    .replace(/%/g,'[\\s\\S]*')
    .replace(/_/g,'[\\s\\S]');
  return new RegExp('^'+rx+'$','i').test(String(value));
}
function evalWhere(str,row){ return evalOrExpr(String(str).trim(),row); }
function evalOrExpr(str,row){
  const parts=splitTopLevel(str,'or');
  if(parts.length>1) return parts.some(p=>evalAndExpr(p,row));
  return evalAndExpr(parts.length?parts[0]:str,row);
}
function evalAndExpr(str,row){
  const parts=splitTopLevel(str,'and');
  if(parts.length>1) return parts.every(p=>evalUnaryExpr(p,row));
  return evalUnaryExpr(parts.length?parts[0]:str,row);
}
function evalUnaryExpr(str,row){
  const s=str.trim();
  if(/^not\s+/i.test(s)) return !evalUnaryExpr(s.replace(/^not\s+/i,''),row);
  if(isFullyWrapped(s)) return evalOrExpr(s.slice(1,-1),row);
  return evalCondition(s,row);
}
// Слева в условии может стоять и колонка, и вызов функции: WHERE TRIM(name) != ''.
// Иначе поддержка функций получилась бы дырявой — есть в SELECT и GROUP BY, но не здесь.
const COND_LEFT='('+CALL_SRC+'|[\\w.]+)';
function leftValue(tok,row){
  return CALL_RE.test(tok.trim()) ? resolveToken(tok,row) : colValue(tok,row);
}
const COND_ISNULL =new RegExp('^\\s*'+COND_LEFT+'\\s+is\\s+(not\\s+)?null\\s*$','i');
const COND_IN     =new RegExp('^\\s*'+COND_LEFT+'\\s+(not\\s+)?in\\s*\\(([\\s\\S]+)\\)\\s*$','i');
const COND_BETWEEN=new RegExp('^\\s*'+COND_LEFT+'\\s+(not\\s+)?between\\s+([\\s\\S]+?)\\s+and\\s+([\\s\\S]+?)\\s*$','i');
const COND_LIKE   =new RegExp('^\\s*'+COND_LEFT+'\\s+(not\\s+)?like\\s+([\\s\\S]+?)\\s*$','i');
const COND_CMP    =new RegExp('^\\s*'+COND_LEFT+'\\s*(!=|<>|>=|<=|=|>|<)\\s*([\\s\\S]+?)\\s*$');
function evalCondition(cond,row){
  let m;
  m=cond.match(COND_ISNULL);
  if(m){ const nul=isNullish(leftValue(m[1],row)); return m[2]?!nul:nul; }

  m=cond.match(COND_IN);
  if(m){
    const v=leftValue(m[1],row);
    if(isNullish(v)) return false;
    const hit=splitList(m[3]).some(tok=>looseEq(v,literalOrCol(tok,row)));
    return m[2]?!hit:hit;
  }

  m=cond.match(COND_BETWEEN);
  if(m){
    const v=leftValue(m[1],row);
    if(isNullish(v)) return false;
    const lo=Number(literalOrCol(m[3],row)), hi=Number(literalOrCol(m[4],row));
    const hit=Number(v)>=lo && Number(v)<=hi;
    return m[2]?!hit:hit;
  }

  m=cond.match(COND_LIKE);
  if(m){
    const hit=likeMatch(leftValue(m[1],row), literalOrCol(m[3],row));
    return m[2]?!hit:hit;
  }

  m=cond.match(COND_CMP);
  if(!m) throw err('condParse', cond);
  const left=leftValue(m[1],row);
  const right=literalOrCol(m[3],row);
  // NULL never satisfies a comparison — only IS NULL / IS NOT NULL can test it
  if(isNullish(left)||isNullish(right)) return false;
  return compare(left,right,m[2]);
}
// Аргумент агрегата — либо колонка (быстрый путь), либо выражение, которое надо посчитать
// на каждой строке.
function aggArgValue(arg,row){ return (arg in row)?row[arg]:resolveToken(arg,row); }
function aggregate(func,arg,rows,distinct){
  if(func==='count'){
    if(arg==='*') return distinct?new Set(rows.map(r=>JSON.stringify(r))).size:rows.length;
    const vals=rows.map(r=>aggArgValue(arg,r)).filter(v=>!isNullish(v));
    return distinct?new Set(vals.map(v=>String(v))).size:vals.length;
  }
  let nums=rows.map(r=>aggArgValue(arg,r))
                 .filter(v=>!isNullish(v)).map(Number);
  if(distinct) nums=[...new Set(nums)];
  if(func==='sum') return nums.reduce((a,b)=>a+b,0);
  if(func==='avg') return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0;
  if(func==='min') return nums.length?Math.min(...nums):null;
  if(func==='max') return nums.length?Math.max(...nums):null;
  throw err('unknownAgg', func);
}
function mergeRows(name1,r1,name2,r2){
  const merged={};
  const keys2=new Set(Object.keys(r2));
  for(const k of Object.keys(r1)){ merged[name1+'.'+k]=r1[k]; if(!keys2.has(k)) merged[k]=r1[k]; }
  const keys1=new Set(Object.keys(r1));
  for(const k of Object.keys(r2)){ merged[name2+'.'+k]=r2[k]; if(!keys1.has(k)) merged[k]=r2[k]; }
  return merged;
}
function findTable(tablesMap,name){
  const key=Object.keys(tablesMap).find(k=>k.toLowerCase()===name.toLowerCase());
  return key?tablesMap[key]:null;
}
const QUERY_RE=/^select\s+(?<distinct>distinct\s+)?(?<select>[\s\S]+?)\s+from\s+(?<from>[\w]+)(?:\s+(?<jointype>left\s+outer\s+|left\s+|inner\s+)?join\s+(?<join>[\w]+)\s+on\s+(?<on>[\s\S]+?))?(?:\s+where\s+(?<where>[\s\S]+?))?(?:\s+group\s+by\s+(?<groupby>[\s\S]+?))?(?:\s+having\s+(?<having>[\s\S]+?))?(?:\s+order\s+by\s+(?<orderby>[\s\S]+?))?(?:\s+limit\s+(?<limit>\d+))?\s*$/i;

// Scalar subqueries are resolved before the main parse: each `(SELECT ...)` is executed and
// textually replaced by the single value it returns, so the outer query stays flat.
function resolveSubqueries(sql, tablesMap, depth){
  if(depth>3) throw err('subDepth');
  let out=sql, guard=0;
  for(;;){
    const start=findSubqueryStart(out);
    if(start<0) return out;
    if(++guard>8) throw err('subMany');
    const end=matchingParen(out, start);
    if(end<0) throw err('subParen');
    const res=runQuery(out.slice(start+1,end), tablesMap, depth+1);
    if(res.rows.length!==1 || res.columns.length!==1)
      throw err('subShape', res.rows.length, res.columns.length);
    const v=res.rows[0][res.columns[0]];
    const literal=(typeof v==='number')?String(v):"'"+String(v).replace(/'/g,'')+"'";
    out=out.slice(0,start)+literal+out.slice(end+1);
  }
}
function findSubqueryStart(s){
  let quote=null;
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(quote){ if(c===quote) quote=null; continue; }
    if(c==="'"||c==='"'){ quote=c; continue; }
    if(c==='(' && /^\(\s*select\b/i.test(s.slice(i))) return i;
  }
  return -1;
}
function matchingParen(s, openIdx){
  let depth=0, quote=null;
  for(let i=openIdx;i<s.length;i++){
    const c=s[i];
    if(quote){ if(c===quote) quote=null; continue; }
    if(c==="'"||c==='"'){ quote=c; continue; }
    if(c==='(') depth++;
    else if(c===')'){ depth--; if(depth===0) return i; }
  }
  return -1;
}
// HAVING may reference aggregates by their SQL form (HAVING SUM(amount) > 5000). Each one is
// swapped for a placeholder column that gets computed per group before the condition runs.
function prepareHaving(havingStr){
  const specs=[]; let n=0;
  const rewritten=havingStr.replace(
    new RegExp('(count|sum|avg|min|max)\\s*\\(\\s*(distinct\\s+)?('+AGG_ARG_SRC+')\\s*\\)','gi'),
    (_m,func,dist,arg)=>{
      const key='__agg'+(n++);
      specs.push({key, func:func.toLowerCase(), distinct:!!dist, arg});
      return key;
    });
  return {rewritten, specs};
}
function nullRowFor(table){
  const r={}; table.columns.forEach(c=>{ r[c.key]=null; }); return r;
}

function runQuery(sql, tablesMap, depth){
  depth=depth||0;
  let clean=sql.trim().replace(/;\s*$/,'');
  if(!clean) throw err('empty');
  clean=resolveSubqueries(clean, tablesMap, depth);
  const m=clean.match(QUERY_RE);
  if(!m || !m.groups) throw err('queryParse');
  const g=m.groups;
  const fromTable=findTable(tablesMap, g.from);
  if(!fromTable) throw err('noTable', g.from, Object.keys(tablesMap).join(', '));
  let rows;
  if(g.join){
    const joinTable=findTable(tablesMap, g.join);
    if(!joinTable) throw err('noJoinTable', g.join, Object.keys(tablesMap).join(', '));
    const isLeft=!!(g.jointype && /left/i.test(g.jointype));
    const emptyRight=nullRowFor(joinTable);
    rows=[];
    for(const r1 of fromTable.rows){
      let matched=false;
      for(const r2 of joinTable.rows){
        const merged=mergeRows(fromTable.name, r1, joinTable.name, r2);
        let ok;
        try{ ok=evalWhere(g.on.trim(), merged); } catch(e){ throw err('inOn', e.message); }
        if(ok){ rows.push(merged); matched=true; }
      }
      if(isLeft && !matched) rows.push(mergeRows(fromTable.name, r1, joinTable.name, emptyRight));
    }
  } else {
    rows=fromTable.rows.slice();
  }
  if(g.where) rows=rows.filter(r=>evalWhere(g.where.trim(),r));
  const items=splitList(g.select).map(parseSelectItem);
  const hasAgg=items.some(i=>i.kind==='agg');
  const groupCols=g.groupby?splitList(g.groupby):null;
  const having=g.having?prepareHaving(g.having.trim()):null;
  let outRows=[];
  if(groupCols){
    // Группировать можно и по выражению — GROUP BY LOWER(city) — поэтому ключ группы
    // считается, а не берётся из строки по имени.
    const groupKeys=groupCols.map(normExpr);
    const groupValue=(term,row)=>{
      if(term in row) return row[term];
      try{ return resolveToken(term,row); }
      catch(e){ throw err('inGroupBy', e.message); }
    };
    const groups=new Map();
    rows.forEach(r=>{
      const key=groupCols.map(c=>groupValue(c,r)).join('||');
      if(!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(r);
    });
    for(const [,groupRows] of groups){
      const outRow={};
      items.forEach(item=>{
        if(item.kind==='col'){
          if(!groupKeys.includes(normExpr(item.col))) throw err('groupSelect');
          outRow[item.alias]=groupRows[0][item.col];
        } else if(item.kind==='expr'){
          if(!groupKeys.includes(normExpr(item.expr))) throw err('groupSelect');
          outRow[item.alias]=groupValue(item.expr, groupRows[0]);
        } else if(item.kind==='agg'){
          const v=aggregate(item.func,item.arg,groupRows,item.distinct);
          outRow[item.alias]=typeof v==='number'?round2(v):v;
        } else if(item.kind==='star'){
          throw err('groupStar');
        } else {
          throw err('groupSelect');
        }
      });
      if(having){
        const probe=Object.assign({}, groupRows[0], outRow);
        having.specs.forEach(s=>{ probe[s.key]=round2(aggregate(s.func,s.arg,groupRows,s.distinct)); });
        let keep;
        try{ keep=evalWhere(having.rewritten, probe); } catch(e){ throw err('inHaving', e.message); }
        if(!keep) continue;
      }
      outRows.push(outRow);
    }
  } else if(hasAgg){
    if(having) throw err('havingNoGroup');
    const outRow={};
    items.forEach(item=>{
      if(item.kind==='agg'){
        const v=aggregate(item.func,item.arg,rows,item.distinct);
        outRow[item.alias]=typeof v==='number'?round2(v):v;
      } else throw err('mixAgg');
    });
    outRows.push(outRow);
  } else {
    if(having) throw err('havingNoGroup');
    rows.forEach(r=>{
      const outRow={};
      items.forEach(item=>{
        if(item.kind==='star') Object.assign(outRow,r);
        else if(item.kind==='col'){ if(!(item.col in r)) throw err('unknownCol', item.col); outRow[item.alias]=r[item.col]; }
        else if(item.kind==='expr'){ const v=evalExpr(item.expr,r); outRow[item.alias]=typeof v==='number'?round2(v):v; }
      });
      outRows.push(outRow);
    });
  }
  if(g.distinct){
    const seen=new Set();
    outRows=outRows.filter(r=>{
      const key=JSON.stringify(Object.keys(r).sort().map(k=>r[k]));
      if(seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  if(g.orderby){
    const terms=splitList(g.orderby).map(t=>{
      const p=t.trim().split(/\s+/);
      return {col:p[0], dir:(p[1]||'asc').toLowerCase()};
    });
    if(outRows.length){
      terms.forEach(t=>{ if(!(t.col in outRows[0])) throw err('unknownColOrder', t.col); });
    }
    outRows.sort((a,b)=>{
      for(const t of terms){
        const av=a[t.col], bv=b[t.col];
        let cmp;
        if(isNullish(av)&&isNullish(bv)) cmp=0;
        else if(isNullish(av)) cmp=-1;
        else if(isNullish(bv)) cmp=1;
        else if(typeof av==='number'&&typeof bv==='number') cmp=av-bv;
        else cmp=String(av).localeCompare(String(bv));
        if(cmp!==0) return t.dir==='desc'?-cmp:cmp;
      }
      return 0;
    });
  }
  if(g.limit) outRows=outRows.slice(0,parseInt(g.limit,10));
  const outCols=outRows.length?Object.keys(outRows[0]):items.map(i=>i.alias||i.col||'*');
  return {columns:outCols, rows:outRows};
}

