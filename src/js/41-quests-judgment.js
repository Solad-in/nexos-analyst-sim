"use strict";
/* ============ judgment tasks (type: choice) ============ */
// Задачи, где SQL не нужен вообще. Аналитик ошибается не только в синтаксисе: он считает
// не то, что просили, и делает из верной цифры неверный вывод. Ни то, ни другое SELECT'ы
// не тренируют, а стоят эти ошибки дороже опечатки в WHERE.
//
// Оба вида — выбор из четырёх вариантов: свободный текст без модели не проверить, а выбор
// проверяется честно и позволяет объяснить, чем плох каждый неправильный ответ.
// Порядок вариантов перемешивается (`shuffle` из 40-quests.js) — иначе правильный всегда
// оказывался бы первым и задача решалась бы без чтения.
// Тип задачи для них один (`choice`) — рендер, проверка и разбор у них общие, различаются
// только тексты. Два разных `q.type` были бы двумя копиями одной механики.
//
// Тексты разложены по языкам. Там, где разбор ссылается на сгенерированные числа, он
// не строка, а функция от них.

/* ---- уточнение требования ---- */
// Правильный вопрос ровно один: тот, без ответа на который посчитать нельзя в принципе.
// Неправильные — не глупые, а именно те, что задают в жизни: спрашивают уже сказанное,
// уточняют оформление или расширяют задачу вместо того, чтобы снять неоднозначность.
const CLARIFY_CASES={
  ru:[
    {
      title:'Конверсия по лендингам',
      prompt:'Слушай, посчитай нам конверсию по лендингам за последнюю неделю. Нужно до конца дня.',
      correct:{
        text:'Что считать конверсией: визит → регистрация или визит → оплата?',
        why:'Слово «конверсия» само по себе не задаёт, что делить на что. Пока не решено, какое действие целевое, любая посчитанная цифра будет правильной случайно.',
      },
      wrong:[
        {text:'За какой период считать?',
         why:'Период уже назван — «за последнюю неделю». Переспрашивать сказанное значит потерять час и показать, что задачу не прочитали.'},
        {text:'В каком формате прислать — Excel или CSV?',
         why:'Формат спросить стоит, но он не мешает начать считать. Такие вопросы задают в конце, а не вместо разбора задачи.'},
        {text:'Нужно ли разбивать по каналам привлечения?',
         why:'Вопрос разумный, но он расширяет задачу, а не снимает неоднозначность. Сначала надо понять, что вообще считаем.'},
      ],
    },
    {
      title:'Активные пользователи за месяц',
      prompt:'Нужно число активных пользователей за прошлый месяц — идёт в отчёт совету директоров.',
      correct:{
        text:'Кого считать активным: кто заходил хотя бы раз или кто совершил целевое действие?',
        why:'«Активный» — не колонка в базе, а определение, которое кто-то должен выбрать. От него число меняется в разы, а уедет оно совету директоров.',
      },
      wrong:[
        {text:'Считать в SQL или выгрузить в Excel?',
         why:'Это твой инструмент и твой выбор. Вопросами про то, как ты будешь работать, чужое время не занимают.'},
        {text:'А сколько было в позапрошлом месяце?',
         why:'Это данные, а не требование, — ты достанешь их сам. Уточняют то, чего в базе нет.'},
        {text:'Нужен ли слайд в PowerPoint?',
         why:'Оформление — последний шаг. Пока не определено, что считать активностью, оформлять нечего.'},
      ],
    },
    {
      title:'Отток клиентов за квартал',
      prompt:'Посчитай отток клиентов за квартал, CTO спрашивает цифру.',
      correct:{
        text:'С какого момента клиент считается ушедшим: 30 дней без заказов или расторгнутый договор?',
        why:'Отток — это не факт из базы, а порог, который надо задать. При разных определениях получаются разные цифры, и обе будут «правильными».',
      },
      wrong:[
        {text:'Отправить результат CTO напрямую или через тебя?',
         why:'Это про доставку, а не про расчёт. Спрашивают, когда результат готов.'},
        {text:'Сколько у нас всего клиентов?',
         why:'Ты это посчитаешь сам за минуту. Уточнять надо требования, а не данные, к которым у тебя есть доступ.'},
        {text:'Нужно ли согласовать методику с юристами?',
         why:'Согласование — процесс вокруг задачи. Он не мешает посчитать и не снимает неоднозначность в определении.'},
      ],
    },
  ],
  en:[
    {
      title:'Landing page conversion',
      prompt:'Hey, could you work out landing page conversion for the last week? Needed by end of day.',
      correct:{
        text:'What counts as a conversion here: visit → signup, or visit → payment?',
        why:'The word “conversion” on its own does not say what is divided by what. Until somebody decides which action is the goal, any number you produce is right only by accident.',
      },
      wrong:[
        {text:'What period should I use?',
         why:'The period was already given — “the last week”. Asking again for what was said costs an hour and signals that you did not read the request.'},
        {text:'What format should I send it in, Excel or CSV?',
         why:'Worth asking eventually, but it does not stop you from starting. Those questions come at the end, not instead of understanding the task.'},
        {text:'Should I break it down by acquisition channel?',
         why:'Reasonable question, but it widens the task rather than removing the ambiguity. First work out what you are counting at all.'},
      ],
    },
    {
      title:'Monthly active users',
      prompt:'I need the number of active users for last month — it goes into the board report.',
      correct:{
        text:'What makes a user active: any visit at all, or completing a meaningful action?',
        why:'“Active” is not a column in the database, it is a definition somebody has to choose. The number changes several times over depending on it — and it is going to the board.',
      },
      wrong:[
        {text:'Should I do it in SQL or export to Excel?',
         why:'That is your tool and your call. Questions about how you will do your own work should not take up someone else\'s time.'},
        {text:'How many were there the month before?',
         why:'That is data, not a requirement — you can pull it yourself. You clarify things that are not in the database.'},
        {text:'Do you need a PowerPoint slide?',
         why:'Presentation is the last step. Until it is settled what counts as active, there is nothing to present.'},
      ],
    },
    {
      title:'Quarterly customer churn',
      prompt:'Work out customer churn for the quarter, the CTO is asking for a number.',
      correct:{
        text:'From what point does a customer count as churned: 30 days without an order, or a cancelled contract?',
        why:'Churn is not a fact sitting in the database, it is a threshold somebody has to set. Different definitions give different numbers, and both are “correct”.',
      },
      wrong:[
        {text:'Should I send the result to the CTO directly or through you?',
         why:'That is about delivery, not about the calculation. You ask it when the result is ready.'},
        {text:'How many customers do we have in total?',
         why:'You can count that yourself in a minute. Clarify requirements, not data you already have access to.'},
        {text:'Should the methodology be signed off by legal?',
         why:'Sign-off is process around the task. It does not stop you counting and does not remove the ambiguity in the definition.'},
      ],
    },
  ],
};
function genClarifyTask(){
  const c=pick(CLARIFY_CASES[locale]||CLARIFY_CASES.ru);
  const options=shuffle([{id:'ok', text:c.correct.text, why:c.correct.why}]
    .concat(c.wrong.map((w,i)=>({id:'w'+i, text:w.text, why:w.why}))));
  return {
    type:'choice', key:'clarify', title:c.title,
    prompt:c.prompt,
    question:tr('judg.clarifyQuestion'),
    options, correct:'ok',
    reviewNote:tr('judg.clarifyReview', {title:c.title, why:c.correct.why}),
    rewardRep:5, rewardMoney:35, energyCost:5,
  };
}

/* ---- вывод из готовых данных ---- */
// Цифра уже посчитана — ошибиться можно только в том, что из неё следует. Три ловушки,
// на которых аналитики горят чаще всего: крошечная выборка, корреляция вместо причины
// и среднее, прячущее разброс. Тексты, зависящие от чисел, — функции от них.
const CONCLUSION_TEXT={
  ru:{
    smallSample:{
      title:'Конверсия по каналам за неделю',
      prompt:'Выгрузка по каналам за неделю готова. Нужен вывод: что с этим делать.',
      columns:['канал','визиты','регистрации','конверсия, %'],
      correct:n=>({
        text:'У TikTok формально лучшая конверсия, но она посчитана на '+n.tiktokVisits+' визитах — делать из этого выводы рано.',
        why:'На выборке в несколько визитов один случайный человек двигает процент на десятки пунктов. Прежде чем сравнивать, надо набрать данные.',
      }),
      wrong:n=>[
        {text:'TikTok — лучший канал, надо переливать туда бюджет.',
         why:'Это ровно та ошибка, ради которой задача и придумана: '+n.tiktokRate+'% посчитаны на '+n.tiktokVisits+' визитах. Один-два человека — и процент другой.'},
        {text:'Email работает хуже всех, его пора отключать.',
         why:'У Email самая большая выборка и устойчивый процент — это как раз рабочий канал. Худшим он выглядит только рядом со случайным числом.'},
        {text:'Каналы работают одинаково, разницы нет.',
         why:'Разница между Email и Google Ads реальная и измерима. Вывод «всё одинаково» игнорирует данные так же, как и вывод «TikTok лучший».'},
      ],
    },
    correlation:{
      title:'Реклама и выручка по месяцам',
      prompt:'Маркетинг просит подтвердить, что реклама окупается. Вот что получилось.',
      columns:['месяц','расходы на рекламу, тыс.','выручка, тыс.'],
      months:['январь','февраль','март','апрель'],
      correct:()=>({
        text:'Расходы и выручка растут вместе, но эта таблица не показывает, что выручку принесла именно реклама.',
        why:'Совместный рост — это корреляция. Причину она не доказывает: так же выглядел бы сезонный подъём, при котором маркетинг просто тратил больше.',
      }),
      wrong:()=>[
        {text:'Реклама окупается: каждый вложенный рубль приносит выручку, бюджет надо увеличивать.',
         why:'Из совместного роста этого не следует. Чтобы говорить об окупаемости, нужно сравнение с периодом или группой без рекламы.'},
        {text:'Реклама не работает — выручка росла бы и без неё.',
         why:'Обратная крайность, и она тоже не следует из таблицы. Данные не позволяют утверждать ни то, ни другое.'},
        {text:'Данные некорректны: выручка не может расти так ровно.',
         why:'С данными всё в порядке — ровный рост бывает. Ошибка здесь не в цифрах, а в выводе, который из них пытаются сделать.'},
      ],
    },
    spread:{
      title:'Время ответа поддержки',
      prompt:n=>'Руководитель поддержки прислал среднее время ответа за неделю и спрашивает, всё ли в порядке. Среднее по отделу — '+n.avg+' мин.',
      columns:['агент','тикетов','среднее время ответа, мин'],
      correct:()=>({
        text:'Среднее по отделу выглядит терпимо только потому, что его тянет вверх один агент — у остальных время в разы меньше.',
        why:'Среднее по разнородной группе прячет именно то, что нужно увидеть. Смотреть надо на распределение, а проблема здесь адресная, а не общая.',
      }),
      wrong:()=>[
        {text:'Поддержка работает в норме, среднее приемлемое.',
         why:'Среднее приемлемое, а работа — нет. У одного агента время ответа отличается от остальных на порядок, и клиенты это чувствуют.'},
        {text:'Отдел не справляется, нужно нанимать людей.',
         why:'Трое из четверых отвечают за минуты — нагрузка тут ни при чём. Новые люди не исправят проблему, которая касается одного человека.'},
        {text:'Надо снизить среднее время ответа для всего отдела.',
         why:'Цель по среднему заставит подтягивать тех, кто и так быстр. Правильный следующий шаг — разобраться, что происходит у одного агента.'},
      ],
    },
  },
  en:{
    smallSample:{
      title:'Weekly conversion by channel',
      prompt:'The weekly channel export is ready. I need a read on it: what do we do?',
      columns:['channel','visits','signups','conversion, %'],
      correct:n=>({
        text:'TikTok has the best conversion on paper, but it is computed on '+n.tiktokVisits+' visits — far too early to conclude anything.',
        why:'On a sample of a few visits, one random person moves the percentage by tens of points. Collect data before comparing.',
      }),
      wrong:n=>[
        {text:'TikTok is our best channel, we should shift budget into it.',
         why:'This is exactly the mistake the task exists for: '+n.tiktokRate+'% is computed on '+n.tiktokVisits+' visits. One or two people either way and the number is different.'},
        {text:'Email performs worst, time to switch it off.',
         why:'Email has the largest sample and a stable rate — it is the channel that actually works. It only looks worst next to a random number.'},
        {text:'The channels perform the same, there is no difference.',
         why:'The gap between Email and Google Ads is real and measurable. “Everything is the same” ignores the data just as much as “TikTok is best” does.'},
      ],
    },
    correlation:{
      title:'Ad spend and revenue by month',
      prompt:'Marketing wants confirmation that advertising pays for itself. Here is what came out.',
      columns:['month','ad spend, K','revenue, K'],
      months:['January','February','March','April'],
      correct:()=>({
        text:'Spend and revenue grow together, but this table does not show that advertising is what produced the revenue.',
        why:'Growing together is correlation. It does not establish cause: a seasonal upswing where marketing simply spent more would look exactly the same.',
      }),
      wrong:()=>[
        {text:'Advertising pays off: every dollar in brings revenue, we should raise the budget.',
         why:'That does not follow from joint growth. To talk about payback you need a comparison with a period or a group without the advertising.'},
        {text:'Advertising does not work — revenue would have grown anyway.',
         why:'The opposite extreme, and it does not follow either. The data does not support a claim in either direction.'},
        {text:'The data is wrong: revenue cannot grow that smoothly.',
         why:'The data is fine — smooth growth happens. The mistake here is not in the numbers but in the conclusion people try to draw from them.'},
      ],
    },
    spread:{
      title:'Support response time',
      prompt:n=>'The support lead sent over average response time for the week and asks whether everything is fine. The department average is '+n.avg+' min.',
      columns:['agent','tickets','average response time, min'],
      correct:()=>({
        text:'The department average only looks tolerable because one agent drags it up — the rest are several times faster.',
        why:'An average over a mixed group hides exactly what you need to see. Look at the distribution: the problem here is one person, not the team.',
      }),
      wrong:()=>[
        {text:'Support is operating normally, the average is acceptable.',
         why:'The average is acceptable; the service is not. One agent is an order of magnitude slower than the rest, and customers feel it.'},
        {text:'The team cannot cope, we need to hire.',
         why:'Three of the four answer within minutes — workload is not the issue. New people will not fix a problem that concerns one person.'},
        {text:'We should reduce average response time across the department.',
         why:'A target on the average pushes the people who are already fast. The right next step is to find out what is going on with one agent.'},
      ],
    },
  },
};
function conclusionText(){ return CONCLUSION_TEXT[locale]||CONCLUSION_TEXT.ru; }

function caseSmallSample(){
  const T=conclusionText().smallSample, C=T.columns, ch=vocab('channels');
  const n={
    emailVisits:randInt(2600,3400), emailRate:round2(randInt(50,70)/10),
    googleVisits:randInt(1600,2400), googleRate:round2(randInt(40,60)/10),
    tiktokVisits:randInt(3,6), tiktokSignups:randInt(2,3),
  };
  n.tiktokRate=round2(n.tiktokSignups/n.tiktokVisits*100);
  return {
    title:T.title, prompt:T.prompt,
    table:{columns:C, rows:[
      {[C[0]]:'Email',      [C[1]]:n.emailVisits,  [C[2]]:Math.round(n.emailVisits*n.emailRate/100),   [C[3]]:n.emailRate},
      {[C[0]]:ch[0],        [C[1]]:n.googleVisits, [C[2]]:Math.round(n.googleVisits*n.googleRate/100), [C[3]]:n.googleRate},
      {[C[0]]:'TikTok Ads', [C[1]]:n.tiktokVisits, [C[2]]:n.tiktokSignups,                             [C[3]]:n.tiktokRate},
    ]},
    correct:T.correct(n), wrong:T.wrong(n),
  };
}
function caseCorrelation(){
  const T=conclusionText().correlation, C=T.columns;
  let spend=randInt(200,300), revenue=randInt(900,1100);
  const rows=T.months.map(m=>{
    spend+=randInt(40,90); revenue+=randInt(150,400);
    return {[C[0]]:m, [C[1]]:spend, [C[2]]:revenue};
  });
  return {title:T.title, prompt:T.prompt, table:{columns:C, rows}, correct:T.correct(), wrong:T.wrong()};
}
function caseAverageHidesSpread(){
  const T=conclusionText().spread, C=T.columns;
  const values=[randInt(8,14), randInt(10,16), randInt(9,15), randInt(180,260)];
  const avg=Math.round(values.reduce((a,b)=>a+b,0)/values.length);
  const agents=vocab('agents');
  return {
    title:T.title, prompt:T.prompt({avg}),
    table:{columns:C, rows:agents.map((a,i)=>({[C[0]]:a, [C[1]]:randInt(40,80), [C[2]]:values[i]}))},
    correct:T.correct(), wrong:T.wrong(),
  };
}
const CONCLUSION_CASES=[caseSmallSample, caseCorrelation, caseAverageHidesSpread];
function genConclusionTask(){
  const c=pick(CONCLUSION_CASES)();
  const options=shuffle([{id:'ok', text:c.correct.text, why:c.correct.why}]
    .concat(c.wrong.map((w,i)=>({id:'w'+i, text:w.text, why:w.why}))));
  return {
    type:'choice', key:'conclusion', title:c.title,
    prompt:c.prompt,
    question:tr('judg.conclusionQuestion'),
    resultTable:c.table,
    options, correct:'ok',
    reviewNote:tr('judg.conclusionReview', {title:c.title, why:c.correct.why}),
    rewardRep:8, rewardMoney:60, energyCost:7,
  };
}

// Регистрируем в тех же пулах, что и SQL-задачи, чтобы бесконечный режим подмешивал их
// наравне с остальными, а слабые темы всплывали чаще (см. pickWeightedGen).
// Уточнение приходит в чат — так его и просят в жизни; вывод по готовым данным — письмом.
CHAT_GENS.push(genClarifyTask);
MAIL_GENS.push(genConclusionTask);
GEN_KEY.set(genClarifyTask,'clarify');
GEN_KEY.set(genConclusionTask,'conclusion');
