"use strict";
/* ============ persistence: storage backend with fallback ============ */
// Tier 1: window.storage (Claude.ai artifact API) — used when viewing this as a live artifact.
// Tier 2: localStorage — used when the file is downloaded and opened/hosted outside Claude.ai.
// Tier 3: in-memory Map — last resort if even localStorage is blocked (e.g. some private-browsing modes),
// so the game still runs, it just won't survive a page reload.
let storageTier='memory';
const storageBackend=(function(){
  if (typeof window!=='undefined' && window.storage && typeof window.storage.get==='function'){
    storageTier='cloud';
    return window.storage;
  }
  try{
    const probeKey='__nexos_probe__';
    localStorage.setItem(probeKey,'1');
    localStorage.removeItem(probeKey);
    storageTier='local';
    const PREFIX='dataco-nexos:';
    return {
      async get(key){ const raw=localStorage.getItem(PREFIX+key); return raw===null?null:{key, value:raw}; },
      async set(key,value){ localStorage.setItem(PREFIX+key,value); return {key,value}; },
      async delete(key){ const had=localStorage.getItem(PREFIX+key)!==null; localStorage.removeItem(PREFIX+key); return {key, deleted:had}; },
      async list(prefix){
        const keys=[];
        for(let i=0;i<localStorage.length;i++){
          const k=localStorage.key(i);
          if(k && k.indexOf(PREFIX)===0){ const stripped=k.slice(PREFIX.length); if(!prefix||stripped.indexOf(prefix)===0) keys.push(stripped); }
        }
        return {keys, prefix};
      }
    };
  } catch(e){ /* localStorage blocked entirely — fall through to memory */ }
  storageTier='memory';
  const mem=new Map();
  return {
    async get(key){ return mem.has(key)?{key, value:mem.get(key)}:null; },
    async set(key,value){ mem.set(key,value); return {key,value}; },
    async delete(key){ const had=mem.has(key); mem.delete(key); return {key, deleted:had}; },
    async list(prefix){ return {keys:[...mem.keys()].filter(k=>!prefix||k.indexOf(prefix)===0), prefix}; },
  };
})();
function storageTierLabel(){ return tr('storage.label.'+storageTier); }
function storageTierNote(){ return tr('storage.note.'+storageTier); }

/* ============ persistence (careers) ============ */
function slugify(name){
  let s=(name||'player').trim().replace(/[\s\/\\'"]+/g,'-');
  if(!s) s='player';
  return (s.toLowerCase()+'-'+uid()).slice(0,80);
}
function pruneState(){
  ['lead','col1','col2'].forEach(cid=>{ if(chatThreads[cid].length>60) chatThreads[cid]=chatThreads[cid].slice(-60); });
  if(mailItems.length>80) mailItems.splice(0, mailItems.length-80);
  if(state.reports.length>100) state.reports.length=100;
}
async function updateManifest(){
  let list=[];
  try{ const res=await storageBackend.get('career-index'); if(res && res.value) list=JSON.parse(res.value); }
  catch(e){ list=[]; }
  const idx=list.findIndex(c=>c.slug===career.slug);
  const summary={slug:career.slug, name:career.name, profession:career.profession, day:state.day, level:LEVELS[levelIdx(state.reputation)].name, lastPlayed:Date.now()};
  if(idx>=0) list[idx]=summary; else list.push(summary);
  await storageBackend.set('career-index', JSON.stringify(list));
}
async function saveAttemptOnce(){
  pruneState();
  const payload={
    version:SAVE_VERSION, name:career.name, profession:career.profession, locale,
    day:state.day, reputation:state.reputation, energy:state.energy, money:state.money,
    onboardIdx, chatThreads, mailItems, questsById, reports:state.reports,
    restNudgeDay:state.restNudgeDay,
    pendingBonus:state.pendingBonus, paydaysReceived:state.paydaysReceived,
    hintsBought:state.hintsBought, styleNotes:state.styleNotes, firstRunDone:state.firstRunDone,
    metContacts:state.metContacts, topicStats:state.topicStats,
    shopDay:state.shopDay, shopCounts:state.shopCounts, sandbox:state.sandbox,
  };
  const setResult=await storageBackend.set('career:'+career.slug, JSON.stringify(payload));
  if(!setResult) throw new Error(tr('save.emptyResult'));
  await updateManifest();
}
// All saves are funneled through one chain so two saves never run concurrently
// (concurrent get-modify-set on the shared career-index key was the likely cause
// of the reported save failures). Frequent auto-triggers use requestSave(), which
// debounces bursts (e.g. onboarding firing several saves within a couple seconds)
// down into a single actual write.
let saveChain=Promise.resolve();
let saveDebounceTimer=null;
function saveCareer(){
  saveChain=saveChain.then(doSaveOnce, doSaveOnce);
  return saveChain;
}
async function doSaveOnce(){
  if(!career.slug) return;
  try{
    await saveAttemptOnce();
  } catch(e1){
    await new Promise(res=>setTimeout(res,1200));
    try{
      await saveAttemptOnce();
    } catch(e2){
      console.error('save failed after retry', e1, e2);
      toast(tr('save.failed', {msg:(e2 && e2.message ? e2.message : String(e2))}));
    }
  }
}
function requestSave(){
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer=setTimeout(saveCareer, 900);
}
async function flushSave(){
  clearTimeout(saveDebounceTimer);
  await saveCareer();
}
async function loadCareerBySlug(slug){
  const attempt=async ()=>{
    const res=await storageBackend.get('career:'+slug);
    if(!res || !res.value) throw new Error(tr('save.notFound'));
    return JSON.parse(res.value);
  };
  let payload;
  try{
    payload=await attempt();
  } catch(e1){
    await new Promise(res=>setTimeout(res,1000));
    try{ payload=await attempt(); }
    catch(e2){
      console.error('load failed after retry', e1, e2);
      toast(tr('save.loadFailed', {msg:(e2 && e2.message ? e2.message : String(e2))}));
      return false;
    }
  }
  try{
    // Язык — свойство карьеры: тексты задач сгенерированы и лежат в сохранении готовыми
    // строками, поэтому загружать её надо на том же языке, на котором она игралась.
    if(payload.locale && LOCALES[payload.locale]){ locale=payload.locale; applyContactLocale(); applyStaticText(); }
    career.slug=slug; career.name=payload.name||tr('login.defaultName'); career.profession=payload.profession||tr('prof.dataAnalyst');
    state.day=payload.day||1; state.reputation=payload.reputation||0;
    state.energy=(payload.energy===undefined)?100:payload.energy;
    state.money=(payload.money===undefined)?500:payload.money;
    state.restNudgeDay=payload.restNudgeDay||0;
    state.pendingBonus=payload.pendingBonus||0;
    state.hintsBought=payload.hintsBought||0;
    state.styleNotes=payload.styleNotes||{};
    state.firstRunDone=payload.firstRunDone!==false;   // old saves have already seen the desktop
    state.paydaysReceived=payload.paydaysReceived||0;
    state.metContacts=payload.metContacts||['lead'];
    state.topicStats=payload.topicStats||{};
    state.shopDay=payload.shopDay||0;
    state.shopCounts=payload.shopCounts||{};
    state.sandbox=payload.sandbox||null;
    onboardIdx=payload.onboardIdx||0;
    chatThreads.lead=(payload.chatThreads&&payload.chatThreads.lead)||[];
    chatThreads.col1=(payload.chatThreads&&payload.chatThreads.col1)||[];
    chatThreads.col2=(payload.chatThreads&&payload.chatThreads.col2)||[];
    mailItems.length=0; if(payload.mailItems) mailItems.push(...payload.mailItems);
    Object.keys(questsById).forEach(k=>delete questsById[k]);
    if(payload.questsById) Object.assign(questsById, payload.questsById);
    state.reports=payload.reports||[];
    activeChatContact='lead'; activeMailId=null; activeReportId=null; activeTaskId=null;
    setBenchQuest(null); reportFilter='';
    activeRefId=null; sandboxDraft='SELECT * FROM customers LIMIT 10;';
    state.chatUnread=Object.values(chatThreads).reduce((a,t)=>a+t.filter(m=>m.from==='them'&&m.unread).length,0);
    state.mailUnread=mailItems.filter(i=>i.unread).length;
    return true;
  } catch(e){
    console.error('load parse/apply failed', e);
    toast(tr('save.corrupt', {msg:(e && e.message ? e.message : String(e))}));
    return false;
  }
}
async function listCareers(){
  const attempt=async ()=>{
    const res=await storageBackend.get('career-index');
    if(!res || !res.value) return [];
    return JSON.parse(res.value);
  };
  try{ return await attempt(); }
  catch(e1){
    await new Promise(res=>setTimeout(res,1000));
    try{ return await attempt(); }
    catch(e2){ console.error('listCareers failed after retry', e1, e2); return []; }
  }
}
async function deleteCareer(slug){
  try{ await storageBackend.delete('career:'+slug); } catch(e){ /* already gone */ }
  try{
    let list=await listCareers();
    list=list.filter(c=>c.slug!==slug);
    await storageBackend.set('career-index', JSON.stringify(list));
  } catch(e){ console.error(e); toast(tr('save.deleteFailed', {msg:(e && e.message ? e.message : String(e))})); }
}

