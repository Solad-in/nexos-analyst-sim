"use strict";
/* ============ chat rendering ============ */
function pushChatMessage(contactId, msg){
  chatThreads[contactId].push(msg);
  if(msg.from==='them' && msg.unread) state.chatUnread++;
  refresh();
}
// The chat used to be strictly one-way — you couldn't even say "взял в работу" to a colleague,
// which reads badly in something that calls itself an employee simulator. Canned replies keep
// it in character without pretending to be a chatbot.
function playerReply(id){ return tr('chat.reply.'+id); }
const REPLY_ANSWER_PACKS={
  ru:{
    take:{
      lead:['Отлично, жду. Не торопись — лучше аккуратно.','Хорошо. Если застрянешь — пиши.'],
      col1:['Супер, спасибо! Я тогда пока роадмап пособираю.','Огонь, жду.'],
      col2:['Спасибо, что взялся! Мне это правда сильно поможет.','Отлично, тогда я пока отвечу людям в очереди.'],
    },
    hi:{
      lead:['Нормально, разгребаю бэклог. У тебя как продвигается?','Много созвонов, как обычно. Но данные никто не отменял 🙂'],
      col1:['Живу от релиза до релиза! Как сам?','Нормально, если не считать трёх горящих гипотез.'],
      col2:['Очередь тикетов держится, спасибо, что спросил 🙂','Потихоньку. Люди пишут, мы отвечаем.'],
    },
    thanks:{
      lead:['Не за что. Обращайся.','Всегда пожалуйста.'],
      col1:['Да ладно, это тебе спасибо!','Сочтёмся 🙂'],
      col2:['Это тебе спасибо!','Обращайся в любой момент.'],
    },
    offer:{
      lead:['Принято, буду иметь в виду. Задачи долго ждать не заставят.','Отлично, у меня как раз копится список.'],
      col1:['О, я запомню! У меня всегда есть что посчитать.','Считай, что уже пишу тебе 🙂'],
      col2:['Спасибо! Тогда я не буду стесняться.','Отлично, у нас метрики вечно нужны.'],
    },
  },
  en:{
    take:{
      lead:["Great, I'll wait. No rush — better careful than fast.","Good. Write if you get stuck."],
      col1:["Excellent, thanks! I'll go poke at the roadmap meanwhile.","Nice, waiting."],
      col2:["Thanks for picking it up! This really helps me.","Great, I'll work through the queue meanwhile."],
    },
    hi:{
      lead:["Fine, digging through the backlog. How is it going on your side?","Lots of meetings, as usual. The data still needs doing though 🙂"],
      col1:["Living release to release! You?","Fine, apart from three hypotheses on fire."],
      col2:["The ticket queue is holding, thanks for asking 🙂","Slowly. People write, we answer."],
    },
    thanks:{
      lead:['Any time.','You are welcome.'],
      col1:["Come on, thank you!","We are even 🙂"],
      col2:["No, thank you!","Ask me any time."],
    },
    offer:{
      lead:["Noted, I will keep that in mind. Tasks will not keep you waiting.","Great, I have a list piling up already."],
      col1:["Oh, I will remember that! I always have something to count.","Consider me already typing 🙂"],
      col2:["Thanks! Then I will not hold back.","Great, we always need metrics."],
    },
  },
};
function replyAnswers(){ return REPLY_ANSWER_PACKS[locale]||REPLY_ANSWER_PACKS.ru; }
function replyBarHtml(cid){
  const mine=openQuests().filter(q=>q.fromId===cid && q.channel==='chat');
  const btns=[];
  if(mine.length){
    const q=mine[0];
    btns.push({id:'take'});
    if((q.hintLevel||0)<1) btns.push({id:'clarify', qid:q.id});
  } else {
    btns.push({id:'hi'});
    btns.push({id:'thanks'});
    btns.push({id:'offer'});
  }
  return btns.map(b=>`<button class="reply-btn" data-reply="${b.id}"${b.qid?' data-qid="'+b.qid+'"':''}>${esc(playerReply(b.id))}</button>`).join('');
}
function sendChatReply(id, qid){
  const cid=activeChatContact;
  pushChatMessage(cid, {from:'me', text:playerReply(id), questId:null, unread:false});
  if(id==='clarify' && qid){
    // asking a colleague to explain is exactly what the free first hint is — no reason to
    // charge for it or make the player go looking for the button
    const q=questsById[qid];
    setTimeout(()=>{
      if(q && (q.hintLevel||0)<1) q.hintLevel=1;
      // подсказка появится в QueryBench той же перерисовкой, что и само сообщение
      pushChatMessage(cid, {from:'them', text:tr('chat.hintReply', {hint:hintTextFor(q,1)}), questId:null, unread:true});
      requestSave();
    }, 900);
    return;
  }
  const pool=(replyAnswers()[id]||{})[cid];
  if(pool) setTimeout(()=> pushChatMessage(cid, {from:'them', text:pick(pool), questId:null, unread:true}), 900);
  requestSave();
}
function renderChat(){
  const body=$('body-chat');
  if(!body) return;
  let sidebar='<div class="chat-sidebar">';
  ['lead','col1','col2'].forEach(cid=>{
    const c=ALL_CONTACTS[cid];
    const thread=chatThreads[cid];
    const hasUnread=thread.some(m=>m.from==='them'&&m.unread);
    sidebar+=`<div class="contact ${cid===activeChatContact?'active':''}" data-cid="${cid}">
      <div class="av">${c.initial}</div>
      <div class="meta"><div class="cname">${esc(c.name)}</div><div class="crole">${esc(c.role)}</div></div>
      ${hasUnread?'<div class="dot"></div>':''}
    </div>`;
  });
  sidebar+='</div>';
  const c=ALL_CONTACTS[activeChatContact];
  let msgsHtml='';
  chatThreads[activeChatContact].forEach(m=>{
    m.unread=false;
    const q=m.questId?questsById[m.questId]:null;
    msgsHtml+=`<div class="bubble ${m.from} ${q&&q.completed?'done':''}">${esc(m.text)}
      ${q && !q.completed ? `<button class="qbtn" data-qid="${q.id}">${esc(taskType(q).openLabel)}</button>`:''}
      ${q && q.completed ? `<div class="tag-done">${esc(tr('task.completed'))}</div>`:''}
    </div>`;
  });
  body.innerHTML=sidebar+`<div class="chat-thread">
    <div class="thread-header">${esc(c.name)} <span class="r">· ${esc(c.role)}</span></div>
    <div class="thread-msgs" id="chat-msgs">${msgsHtml}</div>
    <div class="chat-replies">${replyBarHtml(activeChatContact)}</div>
  </div>`;
  body.querySelectorAll('.contact').forEach(el=>el.addEventListener('click', ()=>{ activeChatContact=el.dataset.cid; refresh(); }));
  body.querySelectorAll('.qbtn').forEach(el=>el.addEventListener('click', ()=> loadQuestIntoBench(el.dataset.qid)));
  body.querySelectorAll('.reply-btn').forEach(el=>el.addEventListener('click', ()=> sendChatReply(el.dataset.reply, el.dataset.qid||null)));
  const msgsEl=$('chat-msgs'); if(msgsEl) msgsEl.scrollTop=msgsEl.scrollHeight;
  state.chatUnread=Object.values(chatThreads).reduce((a,t)=>a+t.filter(m=>m.from==='them'&&m.unread).length,0);
}

/* ============ mail rendering ============ */
function renderMail(){
  const body=$('body-mail');
  if(!body) return;
  let list='<div class="mail-list">';
  mailItems.slice().reverse().forEach(item=>{
    const q=item.questId?questsById[item.questId]:null;
    const from=ALL_CONTACTS[item.fromId];
    list+=`<div class="mail-item ${item.unread?'unread':''} ${item.id===activeMailId?'active':''}" data-mid="${item.id}">
      <div class="mfrom"><span>${esc(from.name)}</span>${q&&q.isBoss?'<span class="boss-badge">'+esc(tr('badge.exam'))+'</span>':''}</div>
      <div class="msub">${esc(item.subject)}</div>
      <div class="msnip">${esc(item.snippet)}</div>
    </div>`;
  });
  list+='</div>';
  let reading='<div class="mail-reading">'+esc(tr('mail.pick'))+'</div>';
  if(activeMailId){
    const item=mailItems.find(i=>i.id===activeMailId);
    if(item){
      item.unread=false;
      const q=item.questId?questsById[item.questId]:null;
      const from=ALL_CONTACTS[item.fromId];
      reading=`<div class="mail-reading">
        <h2>${esc(item.subject)} ${q&&q.isBoss?'<span class="boss-badge">'+esc(tr('badge.exam'))+'</span>':''}</h2>
        <div class="msender">${esc(tr('mail.from', {name:from.name, role:from.role}))}</div>
        <div class="mbody">${esc(item.body)}</div>
        ${q && !q.completed ? `<button class="qbtn" data-qid="${q.id}">${esc(taskType(q).openLabel)}</button>`:''}
        ${q && q.completed ? `<div class="tag-done" style="margin-top:12px;">${esc(tr('task.completed'))}</div>`:''}
      </div>`;
    }
  }
  body.innerHTML=list+reading;
  body.querySelectorAll('.mail-item').forEach(el=>el.addEventListener('click', ()=>{ activeMailId=el.dataset.mid; refresh(); }));
  const qbtn=body.querySelector('.qbtn[data-qid]');
  if(qbtn) qbtn.addEventListener('click', ()=> loadQuestIntoBench(qbtn.dataset.qid));
  state.mailUnread=mailItems.filter(i=>i.unread).length;
}

