"use strict";
/* ============ sandbox: the persistent DataCo database ============ */
// Quest tables are throwaway — they exist only for one task. This one is generated once per
// career, saved with it, and is always available in QueryBench when no task is open, so the
// player has somewhere to just poke around.
function cols(){ return [].slice.call(arguments).map(k=>({key:k, label:k})); }
// База собирается один раз на карьеру и сохраняется вместе с ней — значит, на языке этой
// карьеры. Словарь читается на момент генерации, а не при загрузке файла.
function buildSandboxDb(){
  const first=vocab('firstNames'), last=vocab('lastNames'), cities=vocab('cities').slice(0,5);
  const employees=[];
  for(let i=1;i<=8;i++) employees.push({
    id:i, name:pick(first)+' '+pick(last), department:pick(vocab('departments')),
    city:pick(cities), salary:randInt(900,6000), hired_day:randInt(1,400),
  });
  const customers=[];
  for(let i=1;i<=18;i++) customers.push({
    id:i, name:vocab('companyName')(pick(vocab('companyWords')), i),
    segment:pick(vocab('segments')), city:pick(cities), signup_day:randInt(1,360),
  });
  const orders=[];
  for(let i=1;i<=45;i++){
    const c=pick(customers);
    orders.push({id:i, customer_id:c.id, employee_id:pick(employees).id, amount:randInt(150,9000), day:randInt(1,360)});
  }
  const campaigns=[];
  for(let i=1;i<=10;i++) campaigns.push({
    id:i, name:vocab('campaignName')(i), channel:pick(vocab('channels')),
    spend:randInt(200,4000), revenue:randInt(300,15000),
  });
  const tickets=[];
  for(let i=1;i<=30;i++) tickets.push({
    id:i, customer_id:pick(customers).id, agent:pick(first), topic:pick(vocab('ticketTopics')),
    resolution_minutes:randInt(3,240),
  });
  return {
    employees:{name:'employees', columns:cols('id','name','department','city','salary','hired_day'), rows:employees},
    customers:{name:'customers', columns:cols('id','name','segment','city','signup_day'), rows:customers},
    orders:{name:'orders', columns:cols('id','customer_id','employee_id','amount','day'), rows:orders},
    campaigns:{name:'campaigns', columns:cols('id','name','channel','spend','revenue'), rows:campaigns},
    tickets:{name:'tickets', columns:cols('id','customer_id','agent','topic','resolution_minutes'), rows:tickets},
  };
}
function sandboxTables(){
  if(!state.sandbox) state.sandbox=buildSandboxDb();
  return state.sandbox;
}

