"use strict";
/* ============ quest lifecycle ============ */
function makeQuestEvent(genEntry){
  const q=genEntry.gen();
  q.id=uid();
  q.type=q.type||'sql';   // генератор объявляет вид задачи; молчание значит «SQL-запрос»
  q.fromId=genEntry.from.id;
  q.channel=genEntry.channel;
  // subject и mailIntro приходят из ONBOARD ключами — разворачиваем на языке карьеры.
  q.subject=genEntry.subject?narr(genEntry.subject):q.title;
  q.mailIntro=genEntry.mailIntro?personalize(narr(genEntry.mailIntro)):null;
  q.noOpener=!!genEntry.lessonNote;   // the lesson message already leads into this task
  q.completed=false;
  q.attempts=0;
  q.hintLevel=0;
  q.createdAt=Date.now();
  questsById[q.id]=q;
  return q;
}
// Returns the introduction text the first time this person contacts the player, then null.
function greetingFor(id){
  if(!state.metContacts) state.metContacts=['lead'];
  if(state.metContacts.indexOf(id)>=0) return null;
  state.metContacts.push(id);
  return CONTACT_INTROS[id]||null;
}
function openerFor(q){
  if(q.mailIntro) return q.mailIntro;
  if(q.noOpener) return '';           // a lesson already led into this task
  const list=CONTACT_OPENERS[q.fromId];
  return list?pick(list):'';
}
function dispatchQuest(q){
  const contact=ALL_CONTACTS[q.fromId];
  const intro=greetingFor(q.fromId);
  const opener=openerFor(q);
  if(q.channel==='chat'){
    if(intro) pushChatMessage(q.fromId, {from:'them', text:intro, questId:null, unread:true});
    pushChatMessage(q.fromId, {from:'them', text:(opener?opener+'\n\n':'')+q.prompt, questId:q.id, unread:true});
    if(q.fromId!==activeChatContact) toast(tr('toast.newChat', {name:contact.name}));
  } else {
    const body=(intro?intro+'\n\n':'')+(opener?opener+'\n\n':'')+q.prompt;
    mailItems.push({id:uid(), fromId:q.fromId, subject:q.subject, snippet:body.slice(0,60)+'…', body, unread:true, questId:q.id, kind:'quest'});
    if(mailItems.length>80) mailItems.shift();
    toast(tr('toast.newMail', {name:contact.name}));
  }
  refresh();
  requestSave();
}
function sendInfoMail(from, subject, rawBody){
  const intro=greetingFor(from.id);
  const body=(intro?intro+'\n\n':'')+rawBody;
  mailItems.push({id:uid(), fromId:from.id, subject, snippet:body.slice(0,60)+'…', body, unread:true, questId:null, kind:'info'});
  if(mailItems.length>80) mailItems.shift();
  toast(tr('toast.mailFrom', {name:from.name}));
  refresh();
  requestSave();
}
// Сдача ответа, одинаковая для любого вида задачи: энергия, попытки, проверка, награда,
// отчёт. Всё, что зависит от вида, берётся из реестра типов. Текст вердикта функция
// возвращает, а не пишет сама, — куда его положить, знает только окно, которое вело задачу.
// `answer` — то, что окно собрало с игрока; для SQL это {sql, columns, rows}.
function submitAnswer(q, answer){
  if(!q || q.completed) return null;
  if(state.energy<q.energyCost)
    return {ok:false, text:tr('energy.cantSubmit', {have:Math.round(state.energy), need:q.energyCost})};
  q.attempts=(q.attempts||0)+1;
  // Не `t` — так называется функция перевода, и локальная переменная её перекрывала.
  const type=taskType(q);
  if(!type.check(q, answer)) return {ok:false, text:type.diagnose(q, answer)};

  toast(tr('toast.correct', {rep:q.rewardRep, money:fmtMoney(q.rewardMoney), days:tr('workDays', daysToPayday())}));
  // Ксения пишет вдогонку — формулировку задаёт тип задачи: замечание по стилю запроса
  // и объяснение верного вывода читаются по-разному.
  const note=type.review?type.review(q, answer):null;
  if(type.report) type.report(q, answer);
  completeQuest(q);
  if(note) setTimeout(()=> pushChatMessage(LEAD.id, {from:'them', text:note, questId:null, unread:true}), 3400);
  return {ok:true, text:tr('feedback.correct', {rep:q.rewardRep, money:fmtMoney(q.rewardMoney)})};
}
function completeQuest(q){
  if(q.completed) return;
  q.completed=true;
  state.reputation+=q.rewardRep;
  // Task rewards are a bonus, not petty cash — they accrue and are paid out on payday
  // together with the salary (see runPayday).
  state.pendingBonus+=q.rewardMoney;
  state.energy=Math.max(0, state.energy-q.energyCost);
  recordTopicResult(q);
  const prevLevel=levelIdx(state.reputation-q.rewardRep);
  const newLevel=levelIdx(state.reputation);
  refresh();

  setTimeout(()=>{
    if(q.channel==='chat'){
      pushChatMessage(q.fromId, {from:'them', text:pick(CONTACT_THANKS[q.fromId]||CONTACT_THANKS.lead), questId:null, unread:false});
    }
  }, 900);

  if(q.attempts>=3){
    state.reputation=Math.max(0, state.reputation-3);
    refresh();
    setTimeout(()=> sendInfoMail(DIRECTOR, tr('nudge.subject'), tr('nudge.body', {title:q.title})), 1600);
  } else if(q.attempts===0 && Math.random()<0.3){
    setTimeout(()=> sendInfoMail(DIRECTOR, tr('praise.subject'), tr('praise.body', {title:q.title})), 1600);
  }

  if(newLevel>prevLevel){
    const bonus=100+newLevel*50;
    state.pendingBonus+=bonus;
    refresh();
    setTimeout(()=> sendInfoMail(DIRECTOR, tr('promo.subject'),
      tr('promo.body', {level:LEVELS[newLevel].name, salary:fmtMoney(LEVELS[newLevel].salary),
                        bonus:fmtMoney(bonus), days:tr('workDays', daysToPayday())})), 2200);
  }

  // Once per shift — the day counter resets it, so ending the shift re-arms the nudge.
  if(state.energy<20 && state.restNudgeDay!==state.day){
    state.restNudgeDay=state.day;
    setTimeout(()=> pushChatMessage(LEAD.id, {from:'them', text:tr('rest.chat'), questId:null, unread:true}), 2600);
  }

  // Задача остаётся открытой в QueryBench со своим запросом и вердиктом — раньше бенч
  // сбрасывался в песочницу, и игрок не успевал прочитать, что ответ приняли.
  refresh();
  requestSave();
  scheduleStory(1500);
}
// Only one story step may be in flight at a time — completeQuest, the intro chain and
// the resume-after-load check can all ask for the next beat, and without this guard a
// single beat would be dispatched twice.
let storyPending=false, storyPendingSince=0, storyGen=0;
// A story beat lives inside a setTimeout. If that timer is ever lost — a background tab that
// Chrome freezes will do it — storyPending stays raised and the watchdog, which deliberately
// keeps out of the way while a beat is in flight, would never recover. The generation token
// lets the watchdog cancel a stalled beat without a late timer firing it a second time.
function beginStoryStep(){ storyPending=true; storyPendingSince=Date.now(); return ++storyGen; }
function endStoryStep(){ storyPending=false; storyPendingSince=0; }
function cancelStoryStep(){ storyGen++; endStoryStep(); }
const STORY_STEP_TIMEOUT=45000;
function scheduleStory(delay){
  if(storyPending) return;
  const token=beginStoryStep();
  setTimeout(()=>{
    if(token!==storyGen) return;          // this beat was cancelled and already retried
    endStoryStep();
    advanceStory();
  }, delay);
}
function advanceStory(){
  if(onboardIdx < ONBOARD.length){
    const entry=ONBOARD[onboardIdx];
    if(entry.kind==='intro'){
      onboardIdx++;
      pushChatMessage(entry.from.id, {from:'them', text:personalize(narr(entry.text)), questId:null, unread:true});
      requestSave();
      scheduleStory(2200);
    } else if(entry.lessonNote && entry.channel==='chat'){
      // onboardIdx advances only once the quest actually exists, so a save landing between
      // the lesson and the quest can't skip the quest on reload (worst case the lesson repeats).
      const token=beginStoryStep();
      pushChatMessage(entry.from.id, {from:'them', text:personalize(narr(entry.lessonNote)), questId:null, unread:true});
      setTimeout(()=>{
        if(token!==storyGen) return;
        endStoryStep();
        onboardIdx++;
        dispatchQuest(makeQuestEvent(entry));
      }, 1500);
    } else {
      onboardIdx++;
      dispatchQuest(makeQuestEvent(entry));
    }
    return;
  }
  const roll=Math.random();
  if(roll<0.62){
    const gen=pickWeightedGen(CHAT_GENS);
    const from=pick([COL1,COL2,LEAD]);
    dispatchQuest(makeQuestEvent({gen, from, channel:'chat'}));
  } else if(roll<0.85){
    const gen=pickWeightedGen(MAIL_GENS);
    dispatchQuest(makeQuestEvent({gen, from:CTO, channel:'mail', subject:'SUBJ_METRICS'}));
  } else {
    sendInfoMail(DIRECTOR, tr('director.subject'), tr('director.body'));
  }
}

