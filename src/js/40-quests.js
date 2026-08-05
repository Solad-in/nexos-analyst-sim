"use strict";
/* ============ quest generators ============ */
function genFilterTask(){
  const channels=vocab('channels').slice(0,3);
  const rows=[]; for(let i=0;i<9;i++) rows.push({id:i+1, channel:pick(channels), spend:randInt(200,2000), revenue:randInt(400,6000)});
  const target=pick(channels);
  let expectedCount=rows.filter(r=>r.channel===target).length;
  if(expectedCount===0){ rows[0].channel=target; expectedCount=1; }
  return {
    key:'filter', title:qt('filter').title,
    prompt:qt('filter').prompt({target}),
    hint:`SELECT * FROM campaigns WHERE channel = '${target}';`,
    tables:{ campaigns:{name:'campaigns', columns:[{key:'id',label:'id'},{key:'channel',label:'channel'},{key:'spend',label:'spend'},{key:'revenue',label:'revenue'}], rows} },
    rewardRep:6, rewardMoney:40, energyCost:8,
    answerSpec:{kind:'count', column:'channel', target, expectedCount},
  };
}
function genSumTask(){
  const rows=[]; for(let i=0;i<8;i++) rows.push({id:i+1, customer:vocab('customerName')(i+1), amount:randInt(500,9000)});
  const expected=rows.reduce((a,r)=>a+r.amount,0);
  return {
    key:'sum', title:qt('sum').title,
    prompt:qt('sum').prompt(),
    hint:'SELECT SUM(amount) AS total FROM orders;',
    tables:{ orders:{name:'orders', columns:[{key:'id',label:'id'},{key:'customer',label:'customer'},{key:'amount',label:'amount'}], rows} },
    rewardRep:7, rewardMoney:50, energyCost:9,
    answerSpec:{kind:'scalar', expected, tolerance:0.5},
  };
}
function genAvgTask(){
  const rows=[]; for(let i=0;i<7;i++) rows.push({id:i+1, agent:pick(vocab('agents').slice(0,3)), resolution_minutes:randInt(5,90)});
  const expected=rows.reduce((a,r)=>a+r.resolution_minutes,0)/rows.length;
  return {
    key:'avg', title:qt('avg').title,
    prompt:qt('avg').prompt(),
    hint:'SELECT AVG(resolution_minutes) AS avg_time FROM support_tickets;',
    tables:{ support_tickets:{name:'support_tickets', columns:[{key:'id',label:'id'},{key:'agent',label:'agent'},{key:'resolution_minutes',label:'resolution_minutes'}], rows} },
    rewardRep:7, rewardMoney:45, energyCost:9,
    answerSpec:{kind:'scalar', expected, tolerance:0.6},
  };
}
function genGroupTask(){
  const channels=vocab('channels').slice(0,4);
  const rows=[]; for(let i=0;i<12;i++) rows.push({id:i+1, channel:pick(channels), revenue:randInt(300,4000)});
  const groups=channels.map(ch=>({key:ch, value:round2(rows.filter(r=>r.channel===ch).reduce((a,r)=>a+r.revenue,0))})).filter(g=>rows.some(r=>r.channel===g.key));
  return {
    key:'group', title:qt('group').title,
    prompt:qt('group').prompt(),
    hint:'SELECT channel, SUM(revenue) AS total FROM campaigns GROUP BY channel;',
    tables:{ campaigns:{name:'campaigns', columns:[{key:'id',label:'id'},{key:'channel',label:'channel'},{key:'revenue',label:'revenue'}], rows} },
    rewardRep:10, rewardMoney:70, energyCost:12,
    answerSpec:{kind:'groups', groups},
  };
}
function genRoiTask(){
  const channels=vocab('channels').filter(x=>x!==vocab('channels')[3]);
  const rows=channels.map(ch=>({channel:ch, spend:randInt(400,3000), revenue:randInt(600,9000)}));
  const rounded=rows.map(r=>({channel:r.channel, roi:round2(r.revenue/r.spend)}));
  const maxRoi=Math.max(...rounded.map(r=>r.roi));
  const bestChannels=rounded.filter(r=>r.roi===maxRoi).map(r=>r.channel.toLowerCase());
  return {
    key:'roi', title:qt('roi').title,
    prompt:qt('roi').prompt(),
    hint:'SELECT channel, revenue/spend AS roi FROM campaigns ORDER BY roi DESC LIMIT 1;',
    tables:{ campaigns:{name:'campaigns', columns:[{key:'channel',label:'channel'},{key:'spend',label:'spend'},{key:'revenue',label:'revenue'}], rows} },
    rewardRep:16, rewardMoney:150, energyCost:14,
    answerSpec:{kind:'bestMatch', keys:bestChannels, value:maxRoi, tolerance:Math.max(0.1,maxRoi*0.05)},
  };
}
function genConversionTask(){
  const pages=['/pricing','/landing-a','/landing-b','/webinar'];
  const rows=pages.map(p=>{ const visits=randInt(400,5000); const signups=randInt(10, Math.floor(visits*0.25)); return {page:p, visits, signups}; });
  const rounded=rows.map(r=>({page:r.page, rate:round2(r.signups/r.visits*100)}));
  const maxRate=Math.max(...rounded.map(r=>r.rate));
  const bestPages=rounded.filter(r=>r.rate===maxRate).map(r=>r.page.toLowerCase());
  return {
    key:'conv', title:qt('conv').title,
    prompt:qt('conv').prompt(),
    hint:'SELECT page, signups/visits*100 AS conv_rate FROM landing_pages ORDER BY conv_rate DESC LIMIT 1;',
    tables:{ landing_pages:{name:'landing_pages', columns:[{key:'page',label:'page'},{key:'visits',label:'visits'},{key:'signups',label:'signups'}], rows} },
    rewardRep:16, rewardMoney:140, energyCost:14,
    answerSpec:{kind:'bestMatch', keys:bestPages, value:maxRate, tolerance:1.0, altValue:maxRate/100, altTolerance:0.02},
  };
}
function genJoinTask(){
  const segments=['SMB','Enterprise','Startup'];
  const customers=[]; for(let i=1;i<=5;i++) customers.push({id:i, name:vocab('customerName')(i), segment:pick(segments)});
  const orders=[]; let oid=1;
  customers.forEach(c=>{ const n=randInt(1,3); for(let k=0;k<n;k++) orders.push({id:oid++, customer_id:c.id, amount:randInt(300,3000)}); });
  const bySeg={};
  orders.forEach(o=>{ const cust=customers.find(c=>c.id===o.customer_id); bySeg[cust.segment]=(bySeg[cust.segment]||0)+o.amount; });
  const groups=Object.entries(bySeg).map(([key,value])=>({key, value:round2(value)}));
  return {
    key:'join', title:qt('join').title,
    prompt:qt('join').prompt(),
    hint:'SELECT customers.segment, SUM(orders.amount) AS total FROM orders JOIN customers ON orders.customer_id = customers.id GROUP BY customers.segment;',
    joinNote:'orders.customer_id = customers.id',
    tables:{
      orders:{name:'orders', columns:[{key:'id',label:'id'},{key:'customer_id',label:'customer_id'},{key:'amount',label:'amount'}], rows:orders},
      customers:{name:'customers', columns:[{key:'id',label:'id'},{key:'name',label:'name'},{key:'segment',label:'segment'}], rows:customers},
    },
    rewardRep:20, rewardMoney:160, energyCost:15,
    answerSpec:{kind:'groups', groups},
  };
}
function genFinalExamTask(){
  const segments=['SMB','Enterprise','Startup'];
  const customers=[]; for(let i=1;i<=6;i++) customers.push({id:i, name:vocab('customerName')(i), segment:pick(segments)});
  const orders=[]; let oid=1;
  customers.forEach(c=>{ const n=randInt(1,3); for(let k=0;k<n;k++) orders.push({id:oid++, customer_id:c.id, amount:randInt(300,3000)}); });
  const bySeg={};
  orders.forEach(o=>{ const cust=customers.find(c=>c.id===o.customer_id); bySeg[cust.segment]=(bySeg[cust.segment]||0)+o.amount; });
  const rounded=Object.entries(bySeg).map(([key,value])=>({key, value:round2(value)}));
  const maxVal=Math.max(...rounded.map(r=>r.value));
  const bestKeys=rounded.filter(r=>r.value===maxVal).map(r=>r.key.toLowerCase());
  return {
    key:'finalexam', title:qt('finalexam').title,
    prompt:qt('finalexam').prompt(),
    hint:'SELECT customers.segment, SUM(orders.amount) AS total FROM orders JOIN customers ON orders.customer_id = customers.id GROUP BY customers.segment ORDER BY total DESC LIMIT 1;',
    joinNote:'orders.customer_id = customers.id',
    tables:{
      orders:{name:'orders', columns:[{key:'id',label:'id'},{key:'customer_id',label:'customer_id'},{key:'amount',label:'amount'}], rows:orders},
      customers:{name:'customers', columns:[{key:'id',label:'id'},{key:'name',label:'name'},{key:'segment',label:'segment'}], rows:customers},
    },
    rewardRep:30, rewardMoney:250, energyCost:18, isBoss:true,
    answerSpec:{kind:'bestMatch', keys:bestKeys, value:maxVal, tolerance:Math.max(1,maxVal*0.03)},
  };
}

/* ---- module 2 generators ---- */
const shuffle=arr=>arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(p=>p[1]);

function genInTask(){
  const pool=vocab('channels');
  const used=shuffle(pool).slice(0,randInt(3,4));
  const rows=[];
  used.forEach(ch=>{ const n=randInt(2,3); for(let k=0;k<n;k++) rows.push({id:rows.length+1, name:vocab('campaignName')(rows.length+1), channel:ch, spend:randInt(200,2000)}); });
  const targets=shuffle(used).slice(0,2);
  const keys=rows.filter(r=>targets.includes(r.channel)).map(r=>r.name);
  return {
    key:'in', title:qt('in').title,
    prompt:qt('in').prompt({a:targets[0], b:targets[1]}),
    hint:`SELECT name FROM campaigns WHERE channel IN ('${targets[0]}', '${targets[1]}');`,
    tables:{ campaigns:{name:'campaigns', columns:[{key:'id',label:'id'},{key:'name',label:'name'},{key:'channel',label:'channel'},{key:'spend',label:'spend'}], rows} },
    rewardRep:9, rewardMoney:60, energyCost:9,
    answerSpec:{kind:'keySet', keys},
  };
}
function genBetweenTask(){
  const lo=randInt(600,1400), hi=randInt(2600,4200);
  const rows=[]; for(let i=0;i<10;i++) rows.push({id:i+1, customer:vocab('customerName')(i+1), amount:randInt(150,5500)});
  // guarantee rows inside the range and on both sides of it, so that a one-sided filter
  // (amount > lo / amount > hi) can never coincide with the right answer
  rows[0].amount=randInt(lo,hi); rows[1].amount=randInt(lo,hi);
  rows[2].amount=randInt(hi+1,6500); rows[3].amount=randInt(50,lo-1);
  const mixed=shuffle(rows).map((r,i)=>({id:i+1, customer:r.customer, amount:r.amount}));
  // asking *which* customers instead of *how many*: a count answer can be hit by an
  // obviously wrong filter that happens to return the same number of rows
  const keys=mixed.filter(r=>r.amount>=lo&&r.amount<=hi).map(r=>r.customer);
  return {
    key:'between', title:qt('between').title,
    prompt:qt('between').prompt({lo, hi}),
    hint:`SELECT customer FROM orders WHERE amount BETWEEN ${lo} AND ${hi};`,
    tables:{ orders:{name:'orders', columns:[{key:'id',label:'id'},{key:'customer',label:'customer'},{key:'amount',label:'amount'}], rows:mixed} },
    rewardRep:9, rewardMoney:60, energyCost:9,
    answerSpec:{kind:'keySet', keys},
  };
}
function genLikeTask(){
  const prefix=pick(['/landing','/blog','/docs']);
  const others=shuffle(['/pricing','/about','/contact','/faq','/careers']).slice(0,4);
  const rows=[];
  const n=randInt(3,4);
  for(let i=0;i<n;i++) rows.push({id:rows.length+1, url:prefix+'/'+(i+1), visits:randInt(100,9000)});
  others.forEach(u=> rows.push({id:rows.length+1, url:u, visits:randInt(100,9000)}));
  const mixed=shuffle(rows).map((r,i)=>({id:i+1, url:r.url, visits:r.visits}));
  const keys=mixed.filter(r=>r.url.indexOf(prefix)===0).map(r=>r.url);
  return {
    key:'like', title:qt('like').title,
    prompt:qt('like').prompt({prefix}),
    hint:`SELECT url FROM pages WHERE url LIKE '${prefix}%';`,
    tables:{ pages:{name:'pages', columns:[{key:'id',label:'id'},{key:'url',label:'url'},{key:'visits',label:'visits'}], rows:mixed} },
    rewardRep:9, rewardMoney:65, energyCost:9,
    answerSpec:{kind:'keySet', keys},
  };
}
function genDistinctTask(){
  const userCount=randInt(4,7);
  const rows=[];
  for(let u=1;u<=userCount;u++){
    const visits=randInt(1,3);
    for(let k=0;k<visits;k++) rows.push({id:rows.length+1, user_id:100+u, page:pick(['/pricing','/landing','/docs','/blog'])});
  }
  const mixed=shuffle(rows).map((r,i)=>({id:i+1, user_id:r.user_id, page:r.page}));
  return {
    key:'distinct', title:qt('distinct').title,
    prompt:qt('distinct').prompt(),
    hint:'SELECT COUNT(DISTINCT user_id) AS users FROM events;',
    tables:{ events:{name:'events', columns:[{key:'id',label:'id'},{key:'user_id',label:'user_id'},{key:'page',label:'page'}], rows:mixed} },
    rewardRep:10, rewardMoney:70, energyCost:10,
    answerSpec:{kind:'scalar', expected:userCount, tolerance:0.4},
  };
}
function genCountGroupTask(){
  const agents=shuffle(vocab('agents')).slice(0,randInt(3,4));
  const rows=[];
  agents.forEach(a=>{ const n=randInt(2,5); for(let k=0;k<n;k++) rows.push({id:rows.length+1, agent:a, topic:pick(vocab('ticketTopics').slice(0,4))}); });
  const mixed=shuffle(rows).map((r,i)=>({id:i+1, agent:r.agent, topic:r.topic}));
  const groups=agents.map(a=>({key:a, value:mixed.filter(r=>r.agent===a).length}));
  return {
    key:'countgroup', title:qt('countgroup').title,
    prompt:qt('countgroup').prompt(),
    hint:'SELECT agent, COUNT(*) AS tickets FROM support_tickets GROUP BY agent;',
    tables:{ support_tickets:{name:'support_tickets', columns:[{key:'id',label:'id'},{key:'agent',label:'agent'},{key:'topic',label:'topic'}], rows:mixed} },
    rewardRep:11, rewardMoney:75, energyCost:11,
    answerSpec:{kind:'groups', groups, tolerance:0.4},
  };
}
function genHavingTask(){
  const used=shuffle(vocab('channels')).slice(0,randInt(3,5));
  const rows=[];
  used.forEach(ch=>{ const n=randInt(2,4); for(let k=0;k<n;k++) rows.push({id:rows.length+1, channel:ch, revenue:randInt(200,3000)}); });
  const mixed=shuffle(rows).map((r,i)=>({id:i+1, channel:r.channel, revenue:r.revenue}));
  const totals=used.map(ch=>({key:ch, value:round2(mixed.filter(r=>r.channel===ch).reduce((a,r)=>a+r.revenue,0))}));
  const values=totals.map(t=>t.value);
  const min=Math.min(...values), max=Math.max(...values);
  // strictly between min and max, so at least one channel passes and at least one is cut off
  const threshold=(max===min)?min-1:Math.floor((min+max)/2);
  const groups=totals.filter(t=>t.value>threshold);
  return {
    key:'having', title:qt('having').title,
    prompt:qt('having').prompt({threshold}),
    hint:`SELECT channel, SUM(revenue) AS total FROM campaigns GROUP BY channel HAVING total > ${threshold};`,
    tables:{ campaigns:{name:'campaigns', columns:[{key:'id',label:'id'},{key:'channel',label:'channel'},{key:'revenue',label:'revenue'}], rows:mixed} },
    rewardRep:16, rewardMoney:120, energyCost:13,
    answerSpec:{kind:'groups', groups},
  };
}
function genLeftJoinTask(){
  const cities=vocab('cities').slice(0,4);
  const customers=[]; for(let i=1;i<=6;i++) customers.push({id:i, name:vocab('customerName')(i), city:pick(cities)});
  const idle=shuffle(customers).slice(0, randInt(1,2));
  const idleIds=idle.map(c=>c.id);
  const orders=[]; let oid=1;
  customers.forEach(c=>{
    if(idleIds.includes(c.id)) return;
    const n=randInt(1,3);
    for(let k=0;k<n;k++) orders.push({id:oid++, customer_id:c.id, amount:randInt(300,3000)});
  });
  return {
    key:'leftjoin', title:qt('leftjoin').title,
    prompt:qt('leftjoin').prompt(),
    hint:'SELECT customers.name FROM customers LEFT JOIN orders ON customers.id = orders.customer_id WHERE orders.id IS NULL;',
    joinNote:'customers.id = orders.customer_id',
    tables:{
      customers:{name:'customers', columns:[{key:'id',label:'id'},{key:'name',label:'name'},{key:'city',label:'city'}], rows:customers},
      orders:{name:'orders', columns:[{key:'id',label:'id'},{key:'customer_id',label:'customer_id'},{key:'amount',label:'amount'}], rows:orders},
    },
    rewardRep:18, rewardMoney:140, energyCost:14,
    answerSpec:{kind:'keySet', keys:idle.map(c=>c.name)},
  };
}
function genSubqueryTask(){
  const rows=[]; for(let i=0;i<9;i++) rows.push({id:i+1, customer:vocab('customerName')(i+1), amount:randInt(200,6000)});
  // the engine rounds aggregate results to 2 decimals, so the expected set is built from the
  // same rounded average the subquery will actually substitute
  const avg=round2(rows.reduce((a,r)=>a+r.amount,0)/rows.length);
  const keys=rows.filter(r=>r.amount>avg).map(r=>r.customer);
  return {
    key:'subquery', title:qt('subquery').title,
    prompt:qt('subquery').prompt(),
    hint:'SELECT customer FROM orders WHERE amount > (SELECT AVG(amount) FROM orders);',
    tables:{ orders:{name:'orders', columns:[{key:'id',label:'id'},{key:'customer',label:'customer'},{key:'amount',label:'amount'}], rows} },
    rewardRep:20, rewardMoney:160, energyCost:15,
    answerSpec:{kind:'keySet', keys},
  };
}
function genFinalExam2Task(){
  const cities=vocab('cities').slice(0,3);
  const managers=[]; for(let i=1;i<=5;i++) managers.push({id:i, name:vocab('managerName')(i), city:pick(cities)});
  const idle=pick(managers);
  const deals=[]; let did=1;
  managers.forEach(m=>{
    if(m.id===idle.id) return;
    const n=randInt(1,5);
    for(let k=0;k<n;k++) deals.push({id:did++, manager_id:m.id, amount:randInt(500,4000)});
  });
  const counts=managers.map(m=>({key:m.name, value:deals.filter(d=>d.manager_id===m.id).length}));
  const values=counts.map(c=>c.value);
  // idle manager always has 0 deals, so min is 0 and max >= 1 — a threshold in between always exists
  const threshold=randInt(Math.min(...values)+1, Math.max(...values));
  const groups=counts.filter(c=>c.value<threshold);
  return {
    key:'finalexam2', title:qt('finalexam2').title,
    prompt:qt('finalexam2').prompt({threshold}),
    hint:`SELECT managers.name, COUNT(deals.id) AS deals_count FROM managers LEFT JOIN deals ON managers.id = deals.manager_id GROUP BY managers.name HAVING deals_count < ${threshold} ORDER BY deals_count ASC;`,
    joinNote:'managers.id = deals.manager_id',
    tables:{
      managers:{name:'managers', columns:[{key:'id',label:'id'},{key:'name',label:'name'},{key:'city',label:'city'}], rows:managers},
      deals:{name:'deals', columns:[{key:'id',label:'id'},{key:'manager_id',label:'manager_id'},{key:'amount',label:'amount'}], rows:deals},
    },
    rewardRep:35, rewardMoney:300, energyCost:20, isBoss:true,
    answerSpec:{kind:'groups', groups, tolerance:0.4},
  };
}

const CHAT_GENS=[genFilterTask, genSumTask, genAvgTask, genGroupTask, genJoinTask,
                 genInTask, genBetweenTask, genLikeTask, genDistinctTask, genCountGroupTask];
const MAIL_GENS=[genRoiTask, genConversionTask, genFinalExamTask,
                 genHavingTask, genLeftJoinTask, genSubqueryTask];

// Maps a generator to the topic key it produces, so endless mode can look up how much
// trouble that topic has been giving without having to generate a quest first.
const GEN_KEY=new Map([
  [genFilterTask,'filter'],[genSumTask,'sum'],[genAvgTask,'avg'],[genGroupTask,'group'],
  [genRoiTask,'roi'],[genConversionTask,'conv'],[genJoinTask,'join'],[genFinalExamTask,'finalexam'],
  [genInTask,'in'],[genBetweenTask,'between'],[genLikeTask,'like'],[genDistinctTask,'distinct'],
  [genCountGroupTask,'countgroup'],[genHavingTask,'having'],[genLeftJoinTask,'leftjoin'],
  [genSubqueryTask,'subquery'],[genFinalExam2Task,'finalexam2'],
]);
