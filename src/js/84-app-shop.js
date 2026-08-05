"use strict";
/* ============ NexMart (energy shop) ============ */
// Energy used to be restored only by ending the shift. Small purchases give a way to squeeze
// a couple more tasks out of a day, at a price — with per-day limits so the shop can't
// replace resting entirely.
const SHOP_ITEMS=[
  {id:'water',  icon:'💧', price:10, energy:8,  limit:4},
  {id:'coffee', icon:'☕', price:25, energy:18, limit:3},
  {id:'drink',  icon:'⚡', price:45, energy:30, limit:2},
  {id:'lunch',  icon:'🍲', price:70, energy:45, limit:1},
];
const SHOP_TEXT={
  ru:{
    water: {name:'Бутылка воды',     note:'Дешёво и понемногу. Кулер на этаже, но вода там тёплая.'},
    coffee:{name:'Кофе из автомата', note:'Не самый вкусный в городе, зато рядом.'},
    drink: {name:'Энергетик',        note:'Работает быстро. Злоупотреблять всё равно не выйдет.'},
    lunch: {name:'Обед в столовой',  note:'Нормальный перерыв — восстанавливает заметно больше остального.'},
    title:'🛒 NexMart · буфет на первом этаже',
    sub:p=>'Энергия: '+p.energy+'% · на счету $'+p.money+' · зарплата через '+p.days,
    stat:p=>'+'+p.energy+'% энергии · осталось сегодня: '+p.left+' из '+p.limit,
    foot:'Лимиты обновляются каждый рабочий день. Полностью энергию восстанавливает только конец смены.',
    soldOut:'на сегодня всё', full:'энергия полная', tooPoor:'не хватает денег',
    limitHit:'На сегодня хватит — лимит по этой позиции исчерпан.',
    noMoney:p=>'Не хватает денег. Зарплата через '+p.days+'.',
    alreadyFull:'Энергия и так полная.',
    bought:p=>p.icon+' '+p.name+': +'+p.gain+'% энергии, −$'+p.price,
  },
  en:{
    water: {name:'Bottle of water',   note:'Cheap and modest. There is a cooler on the floor, but the water there is warm.'},
    coffee:{name:'Vending machine coffee', note:'Not the best in town, but it is right here.'},
    drink: {name:'Energy drink',      note:'Works fast. You will not be able to overdo it anyway.'},
    lunch: {name:'Lunch in the canteen', note:'A proper break — restores noticeably more than the rest.'},
    title:'🛒 NexMart · canteen on the ground floor',
    sub:p=>'Energy: '+p.energy+'% · $'+p.money+' in the account · payday in '+p.days,
    stat:p=>'+'+p.energy+'% energy · '+p.left+' of '+p.limit+' left today',
    foot:'Limits reset every working day. Only ending the shift restores energy fully.',
    soldOut:'done for today', full:'energy is full', tooPoor:'not enough money',
    limitHit:'That is enough for today — you have hit the limit on this one.',
    noMoney:p=>'Not enough money. Payday in '+p.days+'.',
    alreadyFull:'Your energy is already full.',
    bought:p=>p.icon+' '+p.name+': +'+p.gain+'% energy, −$'+p.price,
  },
};
function shopText(){ return SHOP_TEXT[locale]||SHOP_TEXT.ru; }
function shopCountsToday(){
  if(state.shopDay!==state.day){ state.shopDay=state.day; state.shopCounts={}; }
  return state.shopCounts;
}
function buyShopItem(id){
  const item=SHOP_ITEMS.find(i=>i.id===id);
  if(!item) return;
  const counts=shopCountsToday();
  const used=counts[id]||0;
  const T=shopText();
  if(used>=item.limit){ toast(T.limitHit); return; }
  if(state.money<item.price){ toast(T.noMoney({days:tr('workDays', daysToPayday())})); return; }
  if(state.energy>=100){ toast(T.alreadyFull); return; }
  state.money-=item.price;
  counts[id]=used+1;
  const before=state.energy;
  state.energy=Math.min(100, state.energy+item.energy);
  toast(T.bought({icon:item.icon, name:T[id].name, gain:Math.round(state.energy-before), price:item.price}));
  refresh();
  requestSave();
}
function renderShop(){
  const body=$('body-shop');
  if(!body) return;
  const counts=shopCountsToday();
  const T=shopText();
  let items='';
  SHOP_ITEMS.forEach(item=>{
    const used=counts[item.id]||0;
    const soldOut=used>=item.limit;
    const tooPoor=state.money<item.price;
    const full=state.energy>=100;
    const disabled=soldOut||tooPoor||full;
    let why='';
    if(soldOut) why=T.soldOut;
    else if(full) why=T.full;
    else if(tooPoor) why=T.tooPoor;
    items+=`<div class="shop-item">
      <div class="shop-ico">${item.icon}</div>
      <div class="shop-meta">
        <div class="shop-name">${esc(T[item.id].name)}</div>
        <div class="shop-note">${esc(T[item.id].note)}</div>
        <div class="shop-stat">${esc(T.stat({energy:item.energy, left:item.limit-used, limit:item.limit}))}</div>
      </div>
      <button class="shop-buy" data-item="${item.id}" ${disabled?'disabled':''}>$${item.price}${why?'<span class="shop-why">'+esc(why)+'</span>':''}</button>
    </div>`;
  });
  body.innerHTML=`<div class="shop-wrap">
    <div class="shop-head">
      <div class="shop-title">${esc(T.title)}</div>
      <div class="shop-sub">${esc(T.sub({energy:Math.round(state.energy), money:fmtMoney(state.money), days:tr('workDays', daysToPayday())}))}</div>
    </div>
    ${items}
    <div class="shop-foot">${esc(T.foot)}</div>
  </div>`;
  body.querySelectorAll('.shop-buy').forEach(b=>{
    if(!b.disabled) b.addEventListener('click', ()=> buyShopItem(b.dataset.item));
  });
}

