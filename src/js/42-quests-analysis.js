"use strict";
/* ============ analysis tasks (type: choice) ============ */
// Три вида задач, где ошибка стоит дороже всего, а SQL ни при чём:
//   • A/B-тест — один верный вариант: почти всегда «рано делать вывод», но по разным причинам;
//   • качество данных — отметить все дефекты выгрузки (`multi`);
//   • дашборд — отобрать показатели, которые отвечают на заданный вопрос (`multi`).
// Тексты разложены по языкам; там, где разбор ссылается на сгенерированные числа, он функция.

/* ---- A/B-тесты ---- */
const AB_TEXT={
  ru:{
    smallSample:{
      title:'A/B-тест формы заявки',
      prompt:'Прогнали тест новой формы заявки. Маркетинг увидел цифры и уже хочет катить вариант B на всех. Нужно твоё слово.',
      columns:['вариант','визиты','заявки','конверсия, %'],
      rowA:'A (текущая)', rowB:'B (новая)',
      correct:n=>({
        text:'Вывод делать рано: у варианта B всего '+n.visitsB+' визитов и '+n.signupsB+' заявок. Надо докрутить тест до сопоставимых объёмов.',
        why:'Одна заявка на такой выборке двигает конверсию больше чем на процентный пункт. Пока B не набрал объём, сравнивать проценты не с чем.',
      }),
      wrong:n=>[
        {text:'B лучше почти вдвое — катим на всех.',
         why:'Именно так и теряют деньги: преимущество посчитано на '+n.signupsB+' заявках. Убери одну случайную — и разница исчезнет.'},
        {text:'A лучше: у него в разы больше заявок.',
         why:'Абсолютные числа у A больше просто потому, что на него пустили больше трафика. В тесте сравнивают доли, а не суммы.'},
        {text:'Тест сломан, надо запускать заново.',
         why:'С тестом всё в порядке, он просто не докручен. Перезапуск выбросит уже собранные данные и начнёт отсчёт заново.'},
      ],
    },
    earlyStop:{
      title:'A/B-тест: остановить сейчас?',
      prompt:n=>'Тест идёт '+n.day+'-й день из '+n.total+'. Сегодня разница впервые выглядит убедительной, и маркетинг просит остановиться и катить победителя.',
      columns:['день','конверсия A, %','конверсия B, %'],
      correct:()=>({
        text:'Останавливать тест в тот день, когда разница впервые понравилась, нельзя — надо дождаться запланированного срока.',
        why:'Если заглядывать в результат каждый день и останавливаться на первом же перевесе, случайный перевес рано или поздно появится почти наверняка. Срок теста для того и назначают заранее.',
      }),
      wrong:()=>[
        {text:'Разница значимая — останавливаем и катим B.',
         why:'«Значимо на третий день из четырнадцати» и «значимо» — не одно и то же. При ежедневных проверках порог значимости перестаёт означать то, что он означает.'},
        {text:'B выигрывает два дня подряд, этого достаточно.',
         why:'Два дня подряд — не критерий. По первым дням видно, что доли скачут: вчера впереди был A.'},
        {text:'Надо добавить третий вариант C и сравнить все три.',
         why:'Это не ответ на вопрос и вдобавок сбивает уже идущий тест. Сначала доводят до конца текущий.'},
      ],
    },
    wrongMetric:{
      title:'A/B-тест: кнопка стала заметнее',
      prompt:'В варианте B кнопку «Оформить» сделали крупнее и ярче. Маркетинг считает тест выигранным — кликов стало заметно больше.',
      columns:['вариант','клики по кнопке','оформленные заказы'],
      rowA:'A', rowB:'B',
      correct:()=>({
        text:'Кликов больше, а заказов — нет. Тест выигран по промежуточной метрике, до денег улучшение не дошло.',
        why:'Яркая кнопка собирает случайные клики, а не решения купить. Судить надо по той метрике, ради которой всё затевалось.',
      }),
      wrong:()=>[
        {text:'B выигрывает: рост кликов заметный и устойчивый.',
         why:'Клик — это не цель бизнеса, а шаг к ней. Здесь шаг стал чаще, а результат не изменился.'},
        {text:'Надо выкатить B и дособрать заказы позже — они подтянутся.',
         why:'Данные говорят обратное: заказов при том же трафике не прибавилось. Ждать, что цифра исправится сама, — не вывод, а надежда.'},
        {text:'Кнопка ни при чём, разница в заказах случайна.',
         why:'Про заказы это как раз похоже на правду, но вывод из теста делают не об этом: заявленное улучшение до конечной метрики не дошло.'},
      ],
    },
  },
  en:{
    smallSample:{
      title:'A/B test on the signup form',
      prompt:'We ran a test on the new signup form. Marketing saw the numbers and already wants to roll variant B out to everyone. Your call.',
      columns:['variant','visits','signups','conversion, %'],
      rowA:'A (current)', rowB:'B (new)',
      correct:n=>({
        text:'Too early to conclude: variant B has only '+n.visitsB+' visits and '+n.signupsB+' signups. The test needs to run until the volumes are comparable.',
        why:'On a sample that size a single signup moves conversion by more than a percentage point. Until B has volume, there is nothing to compare.',
      }),
      wrong:n=>[
        {text:'B is almost twice as good — roll it out.',
         why:'This is exactly how money gets lost: the advantage is computed on '+n.signupsB+' signups. Remove one lucky one and the difference is gone.'},
        {text:'A is better: it has many times more signups.',
         why:'A has bigger absolute numbers simply because more traffic was sent to it. A test compares rates, not totals.'},
        {text:'The test is broken, we should start over.',
         why:'Nothing is broken, it is just not finished. Restarting throws away the data already collected and resets the clock.'},
      ],
    },
    earlyStop:{
      title:'A/B test: stop it now?',
      prompt:n=>'The test is on day '+n.day+' of '+n.total+'. Today the difference looks convincing for the first time, and marketing wants to stop and ship the winner.',
      columns:['day','conversion A, %','conversion B, %'],
      correct:()=>({
        text:'You cannot stop a test on the day the difference first looked good — wait for the planned end date.',
        why:'If you check the result every day and stop at the first lead, a random lead will almost certainly appear sooner or later. That is exactly why the duration is fixed in advance.',
      }),
      wrong:()=>[
        {text:'The difference is significant — stop and ship B.',
         why:'“Significant on day three of fourteen” and “significant” are not the same thing. With daily peeking, the significance threshold stops meaning what it means.'},
        {text:'B has been ahead two days running, that is enough.',
         why:'Two days running is not a criterion. The early days show the rates bouncing around: yesterday A was ahead.'},
        {text:'We should add a third variant C and compare all three.',
         why:'That does not answer the question and disrupts a test already in flight. Finish the current one first.'},
      ],
    },
    wrongMetric:{
      title:'A/B test: the button got louder',
      prompt:'In variant B the “Checkout” button was made bigger and brighter. Marketing considers the test won — clicks are noticeably up.',
      columns:['variant','button clicks','completed orders'],
      rowA:'A', rowB:'B',
      correct:()=>({
        text:'Clicks are up, orders are not. The test was won on an intermediate metric; the improvement never reached the money.',
        why:'A loud button collects accidental clicks, not decisions to buy. Judge by the metric the whole thing was for.',
      }),
      wrong:()=>[
        {text:'B wins: the increase in clicks is clear and consistent.',
         why:'A click is not the business goal, it is a step towards it. Here the step got more frequent and the outcome did not change.'},
        {text:'Ship B and collect the orders later — they will catch up.',
         why:'The data says otherwise: no extra orders on the same traffic. Waiting for a number to fix itself is hope, not a conclusion.'},
        {text:'The button is irrelevant, the order difference is random noise.',
         why:'That part is probably true, but it is not the conclusion the test calls for: the claimed improvement never reached the final metric.'},
      ],
    },
  },
};
function abText(){ return AB_TEXT[locale]||AB_TEXT.ru; }
function abSmallSample(){
  const T=abText().smallSample, C=T.columns;
  const n={visitsA:randInt(900,1300), rateA:round2(randInt(45,55)/10), visitsB:randInt(50,80), signupsB:randInt(4,6)};
  n.rateB=round2(n.signupsB/n.visitsB*100);
  return {
    title:T.title, prompt:T.prompt,
    table:{columns:C, rows:[
      {[C[0]]:T.rowA, [C[1]]:n.visitsA, [C[2]]:Math.round(n.visitsA*n.rateA/100), [C[3]]:n.rateA},
      {[C[0]]:T.rowB, [C[1]]:n.visitsB, [C[2]]:n.signupsB,                        [C[3]]:n.rateB},
    ]},
    correct:T.correct(n), wrong:T.wrong(n),
  };
}
function abEarlyStop(){
  const T=abText().earlyStop, C=T.columns;
  const n={day:randInt(3,4), total:14};
  return {
    title:T.title, prompt:T.prompt(n),
    table:{columns:C, rows:[
      {[C[0]]:1,     [C[1]]:round2(randInt(48,52)/10), [C[2]]:round2(randInt(42,47)/10)},
      {[C[0]]:2,     [C[1]]:round2(randInt(46,51)/10), [C[2]]:round2(randInt(47,52)/10)},
      {[C[0]]:n.day, [C[1]]:round2(randInt(45,49)/10), [C[2]]:round2(randInt(58,64)/10)},
    ]},
    correct:T.correct(), wrong:T.wrong(),
  };
}
function abWrongMetric(){
  const T=abText().wrongMetric, C=T.columns;
  const clicksA=randInt(400,600), clicksB=Math.round(clicksA*randInt(13,16)/10);
  const ordersA=randInt(80,100), ordersB=ordersA-randInt(0,6);
  return {
    title:T.title, prompt:T.prompt,
    table:{columns:C, rows:[
      {[C[0]]:T.rowA, [C[1]]:clicksA, [C[2]]:ordersA},
      {[C[0]]:T.rowB, [C[1]]:clicksB, [C[2]]:ordersB},
    ]},
    correct:T.correct(), wrong:T.wrong(),
  };
}
const AB_CASES=[abSmallSample, abEarlyStop, abWrongMetric];
function genAbTestTask(){
  const c=pick(AB_CASES)();
  const options=shuffle([{id:'ok', text:c.correct.text, why:c.correct.why}]
    .concat(c.wrong.map((w,i)=>({id:'w'+i, text:w.text, why:w.why}))));
  return {
    type:'choice', key:'abtest', title:c.title,
    prompt:c.prompt, resultTable:c.table,
    question:tr('judg.abQuestion'),
    options, correct:'ok',
    reviewNote:tr('judg.abReview', {title:c.title, why:c.correct.why}),
    rewardRep:9, rewardMoney:70, energyCost:8,
  };
}

/* ---- качество данных ---- */
// Дефекты в таблице настоящие и видны глазами — задача в том, чтобы их заметить.
// Среди вариантов обязательно есть «неровность, которая не дефект»: не всякая странность
// в данных является ошибкой, и путать это дорого.
const DQ_TEXT={
  ru:{
    customers:{
      title:'Выгрузка клиентов перед отчётом',
      prompt:'Перед тем как считать выручку по городам, глянь выгрузку — Марго говорит, что цифры в прошлый раз не сошлись с бухгалтерией.',
      columns:['id','город','сумма'],
      correct:[
        {text:'Один и тот же id встречается дважды.',
         why:'Дубль строки — и клиент попадёт в сумму два раза. Это ровно тот случай, когда отчёт расходится с бухгалтерией.'},
        {text:'Город записан по-разному: разный регистр и лишние пробелы.',
         why:'Группировка по городу разложит один город на несколько групп — и в отчёте его окажется в разы меньше, чем на самом деле.'},
        {text:'Среди сумм есть отрицательное значение.',
         why:'Либо это возврат, и считать его надо отдельно, либо ошибка ввода. В любом случае молча суммировать нельзя.'},
      ],
      wrong:[
        {text:'Клиентов в выгрузке слишком мало.',
         why:'Объём выборки — вопрос к постановке задачи, а не дефект данных. Здесь речь о том, что данные грязные, а не о том, что их мало.'},
        {text:'Суммы у клиентов сильно различаются.',
         why:'Разброс сумм — это нормальные данные, а не ошибка. Не всякая неровность является дефектом, и путать это дорого.'},
        {text:'Колонки названы по-русски.',
         why:'Неудобно писать запросы, но на результат не влияет. Это вопрос стиля, а не качества данных.'},
      ],
    },
    events:{
      title:'Лог событий из аналитики',
      prompt:'Виктор просит посчитать по этому логу конверсию из открытия в покупку. Прежде чем считать — посмотри, что с данными.',
      columns:['user_id','событие','время'],
      correct:[
        {text:'У одной строки пустой user_id.',
         why:'Событие без пользователя нельзя отнести ни к кому. Такие строки либо чинят, либо явно исключают — но решение надо принять, а не игнорировать.'},
        {text:'Две строки полностью совпадают по времени и событию.',
         why:'Похоже на дубль от повторной отправки. При подсчёте кликов он завысит результат, а при подсчёте пользователей — нет: разница как раз и выдаёт проблему.'},
        {text:'У одной строки время 1970-01-01 — это значение-заглушка.',
         why:'Начало эпохи Unix — типичный признак того, что времени не было и его подставили нулём. В выборку «за март» такая строка не попадёт, и событие потеряется.'},
      ],
      wrong:[
        {text:'Событий больше, чем пользователей.',
         why:'Так и должно быть: один человек открывает, кликает и покупает. Это нормальная структура лога, а не дефект.'},
        {text:'Названия событий на английском, а колонки на русском.',
         why:'Разнобой в стиле именования неприятен, но ни одну цифру не портит.'},
        {text:'В логе нет колонки с ценой покупки.',
         why:'Для конверсии цена и не нужна. Отсутствие лишнего поля — не проблема качества данных.'},
      ],
    },
  },
  en:{
    customers:{
      title:'Customer extract before the report',
      prompt:'Before we count revenue by city, take a look at this extract — Maggie says the numbers did not reconcile with finance last time.',
      columns:['id','city','amount'],
      correct:[
        {text:'The same id appears twice.',
         why:'A duplicated row means that customer lands in the total twice. This is exactly the case where a report stops matching finance.'},
        {text:'The city is written inconsistently: mixed case and stray spaces.',
         why:'Grouping by city will split one city into several groups — and it will show up in the report several times smaller than it really is.'},
        {text:'One of the amounts is negative.',
         why:'Either it is a refund and belongs in a separate count, or it is a data entry error. Either way you cannot silently add it up.'},
      ],
      wrong:[
        {text:'There are too few customers in the extract.',
         why:'Sample size is a question about the task, not a defect in the data. This is about the data being dirty, not about there being little of it.'},
        {text:'Order amounts vary a lot between customers.',
         why:'Spread in amounts is normal data, not an error. Not every irregularity is a defect, and confusing the two is expensive.'},
        {text:'The column names are lowercase.',
         why:'A naming style preference. It does not change a single number.'},
      ],
    },
    events:{
      title:'Event log from analytics',
      prompt:'Bob wants open-to-purchase conversion from this log. Before you count — look at what is in the data.',
      columns:['user_id','event','time'],
      correct:[
        {text:'One row has an empty user_id.',
         why:'An event with no user cannot be attributed to anyone. Such rows are either fixed or explicitly excluded — but the decision has to be made, not ignored.'},
        {text:'Two rows are identical in both time and event.',
         why:'Looks like a duplicate from a repeated send. It inflates a click count but not a user count: that discrepancy is what gives the problem away.'},
        {text:'One row has the time 1970-01-01 — that is a placeholder value.',
         why:'The start of the Unix epoch is the classic sign that a timestamp was missing and got filled with zero. Such a row falls outside a “March” filter and the event is lost.'},
      ],
      wrong:[
        {text:'There are more events than users.',
         why:'That is how it should be: one person opens, clicks and buys. Normal log structure, not a defect.'},
        {text:'Event names are lowercase while columns use underscores.',
         why:'Inconsistent naming style is annoying but does not corrupt a single number.'},
        {text:'The log has no column for purchase price.',
         why:'Conversion does not need the price. A missing field you do not need is not a data quality problem.'},
      ],
    },
  },
};
function dqText(){ return DQ_TEXT[locale]||DQ_TEXT.ru; }
function dqCustomers(){
  const T=dqText().customers, C=T.columns, city=vocab('cities')[0];
  const дубль={[C[0]]:randInt(101,140), [C[1]]:city, [C[2]]:randInt(1000,4000)};
  const rows=[
    дубль,
    {[C[0]]:randInt(141,160), [C[1]]:city.toLowerCase(),   [C[2]]:randInt(1000,9000)},
    {[C[0]]:randInt(161,180), [C[1]]:'  '+city+' ',        [C[2]]:randInt(1000,9000)},
    {[C[0]]:randInt(181,200), [C[1]]:vocab('cities')[1],   [C[2]]:-randInt(500,2000)},
    {[C[0]]:randInt(201,220), [C[1]]:vocab('cities')[2],   [C[2]]:randInt(1000,9000)},
    Object.assign({}, дубль),
  ];
  return {title:T.title, prompt:T.prompt, table:{columns:C, rows}, correct:T.correct, wrong:T.wrong};
}
function dqEvents(){
  const T=dqText().events, C=T.columns;
  const ts='2024-03-1'+randInt(0,9)+' 12:'+randInt(10,50);
  const rows=[
    {[C[0]]:randInt(1000,1999), [C[1]]:'open',     [C[2]]:ts},
    {[C[0]]:'',                 [C[1]]:'click',    [C[2]]:'2024-03-1'+randInt(0,9)+' 13:22'},
    {[C[0]]:randInt(1000,1999), [C[1]]:'click',    [C[2]]:ts},
    {[C[0]]:randInt(1000,1999), [C[1]]:'click',    [C[2]]:ts},
    {[C[0]]:randInt(1000,1999), [C[1]]:'purchase', [C[2]]:'1970-01-01 00:00'},
  ];
  return {title:T.title, prompt:T.prompt, table:{columns:C, rows}, correct:T.correct, wrong:T.wrong};
}
const DQ_CASES=[dqCustomers, dqEvents];
function genDataQualityTask(){
  const c=pick(DQ_CASES)();
  const options=shuffle(c.correct.map((o,i)=>({id:'ok'+i, text:o.text, why:o.why}))
    .concat(c.wrong.map((w,i)=>({id:'w'+i, text:w.text, why:w.why}))));
  return {
    type:'choice', multi:true, key:'dataquality', title:c.title,
    prompt:c.prompt, resultTable:c.table,
    question:tr('judg.dqQuestion'),
    options, correct:c.correct.map((_,i)=>'ok'+i),
    reviewNote:tr('judg.dqReview', {title:c.title}),
    rewardRep:11, rewardMoney:90, energyCost:10,
  };
}

/* ---- состав дашборда ---- */
// Ошибка здесь не в цифрах, а в том, что на дашборд тащат всё, что посчиталось.
// Среди неверных вариантов — метрики тщеславия и накопительные итоги, которые всегда растут.
const DASH_TEXT={
  ru:{
    growth:{
      title:'Дашборд для совета директоров',
      prompt:'Совет директоров просит один дашборд, по которому будет видно: растёт ли бизнес и где узкое место. Виктор просит собрать состав показателей.',
      correct:[
        {text:'Выручка по месяцам',
         why:'Помесячная динамика прямо отвечает на вопрос «растём ли». Именно динамика, а не итог за всё время.'},
        {text:'Конверсия по шагам воронки',
         why:'Разбивка по шагам показывает, на каком именно из них теряются люди, — это и есть узкое место.'},
        {text:'Отток клиентов по месяцам',
         why:'Рост выручки при растущем оттоке означает, что дыру затыкают новыми клиентами. Без этой метрики картина роста лживая.'},
      ],
      wrong:[
        {text:'Суммарное число визитов за всё время',
         why:'Накопительный итог растёт всегда, даже когда бизнес падает, — он физически не может уменьшиться. Такой график создаёт ощущение роста на пустом месте.'},
        {text:'Количество строк в базе данных',
         why:'Классическая метрика тщеславия: цифра большая и растёт, а к вопросу совета директоров отношения не имеет.'},
        {text:'Число задач, закрытых аналитикой за квартал',
         why:'Это метрика вашей загрузки, а не состояния бизнеса. На дашборде для совета директоров ей не место.'},
      ],
    },
    support:{
      title:'Дашборд поддержки',
      prompt:'Руководитель поддержки хочет дашборд, по которому будет понятно, справляется ли отдел с потоком обращений. Помоги отобрать показатели.',
      correct:[
        {text:'Медианное время первого ответа',
         why:'Медиана, а не среднее: один тикет, забытый на трое суток, испортит среднее и спрячет то, как отдел работает обычно.'},
        {text:'Доля тикетов, решённых за сутки',
         why:'Доля отвечает на вопрос «справляемся ли» напрямую и не зависит от того, много обращений пришло или мало.'},
        {text:'Число тикетов в очереди на конец дня',
         why:'Растущий хвост означает, что поток больше пропускной способности, даже если время ответа выглядит нормально.'},
      ],
      wrong:[
        {text:'Общее число обращений за всё время',
         why:'Накопительный итог только растёт и ничего не говорит о том, справляется ли отдел сейчас.'},
        {text:'Среднее время ответа по отделу',
         why:'Среднее по разнородной группе прячет разброс — а именно он тут и важен. Для этого в списке есть медиана.'},
        {text:'Число сотрудников в отделе',
         why:'Это ресурс, а не результат. Сам по себе он не показывает, справляется отдел или нет.'},
      ],
    },
  },
  en:{
    growth:{
      title:'Dashboard for the board',
      prompt:'The board wants a single dashboard showing whether the business is growing and where the bottleneck is. Bob asks you to choose the metrics.',
      correct:[
        {text:'Revenue by month',
         why:'Month-over-month movement answers “are we growing” directly. Movement, not a running total since the beginning.'},
        {text:'Conversion by funnel step',
         why:'Breaking it down by step shows exactly where people drop off — that is the bottleneck.'},
        {text:'Customer churn by month',
         why:'Revenue growth alongside rising churn means the hole is being plugged with new customers. Without this metric the growth story is a lie.'},
      ],
      wrong:[
        {text:'Total visits since launch',
         why:'A running total always grows, even when the business is shrinking — it physically cannot go down. That chart manufactures a sense of growth out of nothing.'},
        {text:'Number of rows in the database',
         why:'Classic vanity metric: the number is large and rising, and it has nothing to do with the board\'s question.'},
        {text:'Number of analytics tasks closed this quarter',
         why:'That measures your workload, not the state of the business. It has no place on a board dashboard.'},
      ],
    },
    support:{
      title:'Support dashboard',
      prompt:'The support lead wants a dashboard showing whether the team is keeping up with the incoming volume. Help pick the metrics.',
      correct:[
        {text:'Median time to first response',
         why:'Median, not mean: one ticket forgotten for three days wrecks the mean and hides how the team normally performs.'},
        {text:'Share of tickets resolved within a day',
         why:'A share answers “are we keeping up” directly and does not depend on whether volume was high or low.'},
        {text:'Tickets left in the queue at end of day',
         why:'A growing backlog means intake exceeds capacity, even when response time still looks fine.'},
      ],
      wrong:[
        {text:'Total tickets received since launch',
         why:'A running total only goes up and says nothing about whether the team is coping right now.'},
        {text:'Average response time across the team',
         why:'A mean over a mixed group hides the spread — and the spread is exactly what matters here. That is what the median is on the list for.'},
        {text:'Number of people in the team',
         why:'That is a resource, not an outcome. On its own it does not show whether the team is keeping up.'},
      ],
    },
  },
};
function dashText(){ return DASH_TEXT[locale]||DASH_TEXT.ru; }
const DASH_CASES=['growth','support'];
function genDashboardTask(){
  const c=dashText()[pick(DASH_CASES)];
  const options=shuffle(c.correct.map((o,i)=>({id:'ok'+i, text:o.text, why:o.why}))
    .concat(c.wrong.map((w,i)=>({id:'w'+i, text:w.text, why:w.why}))));
  return {
    type:'choice', multi:true, key:'dashboard', title:c.title,
    prompt:c.prompt,
    question:tr('judg.dashQuestion'),
    options, correct:c.correct.map((_,i)=>'ok'+i),
    reviewNote:tr('judg.dashReview', {title:c.title}),
    rewardRep:10, rewardMoney:80, energyCost:9,
  };
}

// A/B и качество данных приходят письмом — их обычно и присылают с выгрузкой;
// состав дашборда обсуждают в чате.
MAIL_GENS.push(genAbTestTask, genDataQualityTask);
CHAT_GENS.push(genDashboardTask);
GEN_KEY.set(genAbTestTask,'abtest');
GEN_KEY.set(genDataQualityTask,'dataquality');
GEN_KEY.set(genDashboardTask,'dashboard');
