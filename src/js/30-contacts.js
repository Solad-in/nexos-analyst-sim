"use strict";
/* ============ contacts ============ */
// Персонажи целиком зависят от языка: имена, должности, представления и то, как каждый
// разговаривает. Английские реплики написаны заново, а не переведены дословно — дословный
// перевод русской разговорной интонации читается как машинный текст, а именно по этим
// сообщениям складывается ощущение живого офиса.
const CONTACT_PACKS={
  ru:{
    people:{
      lead:    {name:'Ксения Орлова',  role:'Тимлид аналитики',  initial:'КО'},
      col1:    {name:'Паша Гринько',   role:'Продакт-менеджер',  initial:'ПГ'},
      col2:    {name:'Марго Ким',      role:'Саппорт-лид',       initial:'МК'},
      cto:     {name:'Виктор Лемм',    role:'CTO',               initial:'ВЛ'},
      director:{name:'Алина Соколова', role:'Директор DataCo',   initial:'АС'},
    },
    intros:{
      col1:'Привет! Мы не знакомы — я Паша, продакт по направлению маркетинга, сижу этажом ниже. Ксения сказала, что теперь по цифрам можно к тебе. Сразу предупреждаю: я вечно прибегаю с «нужно на вчера», не принимай на свой счёт.',
      col2:'Привет! Меня зовут Марго, я руковожу поддержкой. Мы с аналитикой пересекаемся редко, но метрики по тикетам мне нужны постоянно — раньше я ждала их неделями. Очень надеюсь, что теперь будет быстрее 🙂',
      cto:'Здравствуй. Виктор Лемм, технический директор. Ксения отзывается о тебе хорошо, а я предпочитаю проверять сам. Писать буду по почте и по делу: задача, срок, результат. Подсказок от меня не жди.',
      director:'Здравствуй! Я Алина, директор DataCo. Лично мы вряд ли будем пересекаться часто, но я слежу за тем, как идут дела у новых людей. Если что-то мешает работать — пиши напрямую, это нормально.',
    },
    openers:{
      lead:['Держи следующую задачу:','Ещё одна, пока не забыла:','Смотри, что прилетело с созвона:','Такое надо посчитать:'],
      col1:['Слушай, выручай — горит:','Мне для приоритизации нужна цифра:','Кинь, пожалуйста, быстрый расчёт:','Не могу собрать роадмап без этого:'],
      col2:['Извини, что дёргаю, но саппорт завален:','Глянешь, когда будет минутка?','Нужна помощь с отчётом по тикетам:','Мне нечего показать на еженедельной встрече без этого:'],
      cto:['Короткая практическая задача, нужно к вечеру:','Инвесторы спрашивают конкретную цифру, помоги разобраться:','Для квартального отчёта нужен ответ на один вопрос:','Проверяю гипотезу, нужны данные:'],
      director:['Небольшая просьба:','Хочу свериться по цифрам:'],
    },
    thanks:{
      lead:['Отлично, спасибо! 🙌','Именно то, что нужно.','Красиво посчитано, забираю в отчёт.','Хорошо. Растёшь.'],
      col1:['О, супер, спасибо! Побежал дальше 🏃','Огонь. Вот это скорость.','То что надо, забираю в презентацию.'],
      col2:['Спасибо большое! Ты меня очень выручил(а) 🙏','Вот теперь мне есть что показать. Спасибо!','Отлично, сохраню себе этот запрос.'],
      cto:['Принято.','Сходится с моими прикидками. Хорошо.','Годится. Спасибо.'],
      director:['Спасибо! Так и думала.','Отлично, забираю.'],
    },
  },
  en:{
    people:{
      lead:    {name:'Sarah Smith',   role:'Analytics team lead', initial:'SS'},
      col1:    {name:'Pete Green',    role:'Product manager',     initial:'PG'},
      col2:    {name:'Maggie Kim',    role:'Support lead',        initial:'MK'},
      cto:     {name:'Bob Lehman',    role:'CTO',                 initial:'BL'},
      director:{name:'Alina Falcone', role:'CEO, DataCo',         initial:'AF'},
    },
    intros:{
      col1:"Hey! We haven't met — I'm Pete, product manager on the marketing side, one floor down. Sarah says numbers go through you now. Fair warning: I show up with “needed yesterday” a lot. Nothing personal.",
      col2:"Hi! I'm Maggie, I run support. Analytics and I don't cross paths often, but I need ticket metrics constantly — I used to wait weeks for them. Really hoping that changes 🙂",
      cto:"Hello. Bob Lehman, CTO. Sarah speaks well of you; I prefer to see for myself. I'll write by email and keep it short: task, deadline, result. Don't expect hints from me.",
      director:"Hi! I'm Alina, I run DataCo. We probably won't talk often, but I keep an eye on how new people are settling in. If anything is getting in the way of your work, write to me directly — that's fine.",
    },
    openers:{
      lead:["Here's your next one:","One more before I forget:","This just came out of the standup:","Something to work out:"],
      col1:["Hey, save me here — it's urgent:","I need a number to prioritise:","Could you run a quick calculation?","I can't put the roadmap together without this:"],
      col2:["Sorry to bug you, support is drowning:","Take a look when you get a minute?","I need help with the ticket report:","I've got nothing to show at the weekly without this:"],
      cto:["Short practical task, needed by tonight:","Investors are asking for a specific number, help me out:","The quarterly report needs an answer to one question:","I'm testing a hypothesis and need data:"],
      director:['A small favour:','I want to sanity-check some numbers:'],
    },
    thanks:{
      lead:['Great, thank you! 🙌',"Exactly what I needed.",'Cleanly done, going straight into the report.','Good. You are getting faster.'],
      col1:['Oh nice, thanks! Running with it 🏃','Brilliant. That was fast.','Perfect, straight into the deck.'],
      col2:['Thank you so much! You really saved me 🙏','Now I have something to show. Thanks!','Great, saving that query for myself.'],
      cto:['Noted.','Matches my own estimate. Good.','That works. Thanks.'],
      director:['Thanks! That is what I thought.','Great, taking it.'],
    },
  },
};
function contactPack(){ return CONTACT_PACKS[locale]||CONTACT_PACKS.ru; }

// Объекты контактов создаются один раз и переиспользуются по ссылке (LEAD.id, from:CTO),
// поэтому при смене языка они не пересоздаются, а перезаполняются на месте.
const LEAD={id:'lead'}, COL1={id:'col1'}, COL2={id:'col2'}, CTO={id:'cto'}, DIRECTOR={id:'director'};
const ALL_CONTACTS={lead:LEAD, col1:COL1, col2:COL2, cto:CTO, director:DIRECTOR};
const CONTACT_INTROS={}, CONTACT_OPENERS={}, CONTACT_THANKS={};
function applyContactLocale(){
  const p=contactPack();
  Object.keys(ALL_CONTACTS).forEach(id=>Object.assign(ALL_CONTACTS[id], p.people[id]));
  [[CONTACT_INTROS,p.intros],[CONTACT_OPENERS,p.openers],[CONTACT_THANKS,p.thanks]].forEach(([target,src])=>{
    Object.keys(target).forEach(k=>delete target[k]);
    Object.assign(target, src);
  });
}
applyContactLocale();
