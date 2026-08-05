"use strict";
/* ============ refresh bus ============ */
// Раньше каждая функция, меняющая состояние, сама решала, какие окна перерисовать:
// `renderDash(); if(openWindows.shop) renderApp('shop');` и так далее. Это уже дважды
// приводило к багу — NexMart не обновлялся после смены энергии, зелёная строка «Верно!»
// стиралась перерисовкой — и стоило бы ещё: каждое новое поле состояния означало обход
// всех вызовов заново.
//
// Теперь любое изменение состояния заканчивается вызовом refresh(): он перерисовывает все
// открытые окна и панель. Замерено в Chrome: три типичных открытых окна — 2,7 мс, все
// восемь сразу — 5,8 мс. Это укладывается в один кадр даже в худшем случае, а перерисовки
// случаются по клику и по приходу сообщения, а не в цикле. Точечная перерисовка сэкономила
// бы эти миллисекунды и стоила бы ещё одного класса багов — обмен невыгодный.
//
// Взамен появляется одна обязанность: пережить перерисовку должны две вещи, которые живут
// не в состоянии, а в DOM — каретка (игрок может печатать) и позиции прокрутки. Обе
// восстанавливаются здесь, один раз для всех окон, а не в каждом рендерере отдельно.

let refreshing=false;
function refresh(){
  if(refreshing) return;    // renderChat/renderMail пересчитывают счётчики непрочитанного —
  refreshing=true;          // без этой защиты рендер мог бы позвать шину повторно
  try{
    const focus=captureFocus();
    const scroll=captureScroll();
    focusClaimed=false;
    Object.keys(openWindows).forEach(app=>renderApp(app));
    renderDash();           // после окон: renderChat и renderMail пересчитывают бейджи
    restoreScroll(scroll);
    if(!focusClaimed) restoreFocus(focus);
  } finally {
    refreshing=false;
  }
}

/* ---- каретка ---- */
// Обычно каретка возвращается туда, где была. Исключение — окно, которое игрок только что
// открыл сам: тогда рендерер объявляет claimFocus(), и восстановление отступает. Без этого
// открытие QueryBench возвращало бы фокус в то поле, где игрок был до открытия.
let focusClaimed=false;
function claimFocus(){ focusClaimed=true; }
function captureFocus(){
  const el=document.activeElement;
  if(!el || !el.id || el===document.body) return null;
  const snap={id:el.id};
  // selectionStart есть только у текстовых полей; у остальных обращение к нему бросает
  try{ if(el.selectionStart!=null){ snap.start=el.selectionStart; snap.end=el.selectionEnd; } }
  catch(e){}
  return snap;
}
function restoreFocus(snap){
  if(!snap) return;
  const el=$(snap.id);
  if(!el) return;           // поле исчезло вместе с задачей — фокусу некуда возвращаться
  el.focus();
  if(snap.start!=null && el.setSelectionRange){
    try{ el.setSelectionRange(snap.start, snap.end); } catch(e){}
  }
}

/* ---- прокрутка ---- */
// Ключ строится по структуре, а не по идентичности узла: id, если он есть, иначе первый
// класс элемента плюс порядковый номер среди таких же в этом окне. Узлы после перерисовки
// новые, а структура окна не меняется — поэтому `.mail-list` в InboxPro остаётся тем же
// `mail|mail-list#0` и после прихода нового письма.
const SCROLL_BOTTOM_SLACK=40;
function scrollKey(app, el, seen){
  const cls=(el.className||'').toString().trim().split(/\s+/)[0] || el.tagName.toLowerCase();
  const base=app+'|'+(el.id||cls);
  const n=(seen[base]=(seen[base]||0)+1)-1;
  return base+'#'+n;
}
function captureScroll(){
  const map={};
  Object.keys(openWindows).forEach(app=>{
    const seen={};
    openWindows[app].el.querySelectorAll('*').forEach(el=>{
      if(el.scrollHeight<=el.clientHeight) return;    // не прокручивается — нечего запоминать
      map[scrollKey(app, el, seen)]={
        top:el.scrollTop,
        // «Был внизу — остаётся внизу»: так лента чата сама доезжает до нового сообщения,
        // но не дёргает игрока, если он отлистал вверх читать историю.
        atBottom:el.scrollTop+el.clientHeight>=el.scrollHeight-SCROLL_BOTTOM_SLACK,
      };
    });
  });
  return map;
}
function restoreScroll(map){
  Object.keys(openWindows).forEach(app=>{
    const seen={};
    openWindows[app].el.querySelectorAll('*').forEach(el=>{
      const saved=map[scrollKey(app, el, seen)];
      if(!saved) return;
      el.scrollTop = saved.atBottom ? el.scrollHeight : saved.top;
    });
  });
}
