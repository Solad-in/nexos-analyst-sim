"use strict";
/* ============ dirty data tasks (type: sql) ============ */
// Раньше про грязные данные можно было только спросить «что здесь не так» галочками
// (см. genDataQualityTask). Со скалярными функциями в движке это чинится запросом — а именно
// так с этим и живут. Обе задачи устроены одинаково коварно: наивный запрос выполняется без
// ошибки и возвращает правдоподобную цифру, просто неверную.

// Один и тот же город, записанный по-разному. Ровно те варианты, что встречаются в жизни:
// другой регистр и случайные пробелы по краям.
function dirtySpellings(name){
  return [name, name.toLowerCase(), ' '+name+' ', name.toUpperCase(), '  '+name.toLowerCase()];
}
function genDirtyCityTask(){
  const города=shuffle(vocab('cities')).slice(0,3);
  const rows=[]; const итог={};
  города.forEach(город=>{
    итог[город.toLowerCase()]=0;
    const написания=shuffle(dirtySpellings(город)).slice(0, randInt(2,3));  // минимум два разных
    написания.forEach(нап=>{
      const n=randInt(1,2);
      for(let i=0;i<n;i++){
        const amount=randInt(500,9000);
        итог[город.toLowerCase()]+=amount;
        rows.push({city:нап, amount});
      }
    });
  });
  const перемешанные=shuffle(rows).map((r,i)=>({id:i+1, city:r.city, amount:r.amount}));
  const groups=Object.keys(итог).map(k=>({key:k, value:round2(итог[k])}));
  return {
    key:'dirtycity', title:qt('dirtycity').title,
    prompt:qt('dirtycity').prompt(),
    hint:'SELECT LOWER(TRIM(city)) AS city, SUM(amount) AS total FROM orders GROUP BY LOWER(TRIM(city));',
    tables:{ orders:{name:'orders', columns:[{key:'id',label:'id'},{key:'city',label:'city'},{key:'amount',label:'amount'}], rows:перемешанные} },
    rewardRep:14, rewardMoney:120, energyCost:12,
    answerSpec:{kind:'groups', groups},
  };
}

function genDirtyCountTask(){
  const города=shuffle(vocab('cities')).slice(0, randInt(3,4));
  const rows=[];
  города.forEach(город=>{
    shuffle(dirtySpellings(город)).slice(0, randInt(2,3)).forEach(нап=>{
      rows.push({city:нап, manager:pick(vocab('agents'))});
    });
  });
  const перемешанные=shuffle(rows).map((r,i)=>({id:i+1, city:r.city, manager:r.manager}));
  return {
    key:'dirtycount', title:qt('dirtycount').title,
    prompt:qt('dirtycount').prompt(),
    hint:'SELECT COUNT(DISTINCT LOWER(TRIM(city))) AS cities FROM clients;',
    tables:{ clients:{name:'clients', columns:[{key:'id',label:'id'},{key:'city',label:'city'},{key:'manager',label:'manager'}], rows:перемешанные} },
    rewardRep:13, rewardMoney:110, energyCost:11,
    answerSpec:{kind:'scalar', expected:города.length, tolerance:0.5},
  };
}

MAIL_GENS.push(genDirtyCityTask);
CHAT_GENS.push(genDirtyCountTask);
GEN_KEY.set(genDirtyCityTask,'dirtycity');
GEN_KEY.set(genDirtyCountTask,'dirtycount');
