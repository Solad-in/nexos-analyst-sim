"use strict";
/* ============ helpers ============ */
const randInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=arr=>arr[randInt(0,arr.length-1)];
const round2=n=>Math.round(n*100)/100;
const fmtMoney=n=>Math.round(n).toLocaleString('ru-RU');
const uid=()=>Math.random().toString(36).slice(2,10);
// Согласование числительных зависит от языка и живёт в 05-i18n.js: pluralRu/pluralEn
// и ключ workDays. Здесь его больше нет намеренно — иначе оно неизбежно расползлось бы
// по русскоязычным вызовам и всплыло бы уже на английской версии.
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
