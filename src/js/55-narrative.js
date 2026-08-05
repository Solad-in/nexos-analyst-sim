"use strict";
/* ============ onboarding narrative ============ */
// Тексты уроков и сюжета лежат пакетами по языкам, а ONBOARD хранит **ключи**, а не строки:
// иначе массив собрался бы один раз на языке загрузки и при переключении остался бы со
// старыми текстами. Английские версии написаны заново — дословный перевод разговорной
// интонации превращает живого тимлида в переводную методичку.
const NARRATIVE={
  ru:{
INTRO_1:'Привет, {name}! Я Ксения, тимлид аналитики в DataCo. Слушай, скажу сразу как есть: на позицию аналитика мы обычно берём людей с опытом от 3 лет, а у тебя за плечами — два курса и ноль часов реальной работы. Но у нас горят сроки сразу по нескольким проектам, а свободных рук катастрофически не хватает — так что мы решили рискнуть и дать тебе шанс. Обучение беру на себя: учиться будешь на настоящих задачах, а не на слайдах. Начнём?',
LESSON_1:'Первое, что нужно уметь — доставать из таблицы только нужные строки. За это отвечает WHERE. Вот твоя первая задача:',
LESSON_2:'Хорошо! Теперь научимся считать метрики целиком — для этого есть агрегатные функции: SUM, COUNT, AVG, MIN, MAX. Начнём с SUM:',
LESSON_3:'Считать сумму по всей таблице — это только начало. Обычно бизнесу нужна разбивка: по каналу, по сегменту и так далее. Для этого — GROUP BY: он делит строки на группы по значению колонки и считает агрегат внутри каждой группы.',
LESSON_4:'Иногда готовой метрики в таблице нет — её можно посчитать прямо в запросе. Например, ROI = revenue / spend. А связка ORDER BY ... LIMIT 1 достанет лучший результат.',
LESSON_5:'Важный момент: в реальных базах данные почти никогда не лежат в одной таблице. Значит, нужно уметь их соединять — это JOIN. Он склеивает строки двух таблиц по общему полю, например customer_id = id.',
INTRO_FINAL_EXAM:'На этом твоё базовое обучение закрыто 🎓 Дальше — экзамен. Пришлёт его по почте наш CTO Виктор, и подсказок от меня уже не будет. Но я в тебя верю.',
INTRO_POST_EXAM:'Экзамен сдан! Теперь ты официально не «стажёр на подхвате», а полноценный джун-аналитик. Дальше будут более разноплановые задачи — от коллег и с других созвонов. Обращайся, если что-то будет непонятно.',
EXAM_MAIL_INTRO:'Ксения передала, что пора проверить базовые навыки на практике. Никаких подсказок с моей стороны — только результат.',
SUBJ_EXAM1:'Итоговый экзамен: Модуль «Основы SQL»',

MOD2_INTRO:'Слушай, есть разговор. Ты закрываешь базовые задачи быстрее, чем я успеваю их придумывать, — а у нас копится очередь запросов, где одного WHERE и GROUP BY уже не хватает. Предлагаю не ждать: открываем второй модуль. Он про то, как перестать писать простыни из OR и научиться задавать вопросы к данным по-взрослому.',
LESSON_IN:'Первое — списки значений. Когда нужно отобрать строки сразу по нескольким вариантам, новички пишут «channel = A OR channel = B OR channel = C». Это работает, но читается плохо и легко ошибиться в скобках. Для такого есть IN: перечисляешь варианты в скобках через запятую, и всё. Есть и обратный вариант — NOT IN.',
LESSON_BETWEEN:'Дальше — диапазоны. «amount >= 1000 AND amount <= 5000» можно записать одним оператором: BETWEEN 1000 AND 5000. Важно помнить: обе границы включаются. Это частый источник расхождений в отчётах — когда один аналитик считает границу включённой, а другой нет.',
LESSON_LIKE:'Теперь текст. Часто точного значения ты не знаешь — знаешь только кусок: адрес начинается с /landing, домен заканчивается на .ru, в теме письма встречается «возврат». Для этого есть LIKE и два символа-джокера: % — любое количество любых символов, _ — ровно один символ. «LIKE \'/landing%\'» — всё, что начинается с /landing.',
LESSON_DISTINCT:'Ловушка, на которой обжигаются почти все. Если в таблице каждая строка — событие, то COUNT(*) считает события, а не людей: один пользователь с пятью визитами даст пять строк. Чтобы посчитать именно уникальные значения, нужен DISTINCT — например COUNT(DISTINCT user_id). Разница между «визитов» и «посетителей» в отчёте стоит дорого.',
LESSON_COUNTGROUP:'COUNT отлично живёт вместе с GROUP BY: так считают не сумму, а количество строк в каждой группе — тикетов на агента, заказов на клиента, сделок на менеджера. Это, наверное, самый частый запрос в жизни аналитика.',
LESSON_HAVING:'А теперь ключевое различие, про которое спрашивают на любом собеседовании. WHERE фильтрует строки ДО группировки. HAVING фильтрует уже готовые группы ПОСЛЕ. Поэтому «показать каналы, где суммарная выручка больше миллиона» через WHERE не сделать — на момент WHERE суммы ещё не существует.',
LESSON_LEFTJOIN:'Помнишь JOIN? У него есть неприятная особенность: он оставляет только те строки, у которых нашлась пара. Клиент без заказов из результата просто исчезнет — и ты никогда не узнаешь, что он существует. LEFT JOIN сохраняет все строки левой таблицы, а недостающие поля правой заполняет пустотой — NULL. Дальше «WHERE orders.id IS NULL» даёт тех, у кого пары не нашлось. Именно так ищут отвалившихся клиентов, товары без продаж и пустые категории.',
LESSON_SUBQUERY:'И последнее на этот модуль — подзапросы. Иногда для фильтра нужно значение, которое ещё надо посчитать: средний чек, максимальная дата, порог по выручке. Вписывать его руками нельзя — завтра данные изменятся, и отчёт соврёт. Вместо этого запрос вкладывают в скобки прямо в условие, и он считается на лету.',
MOD2_EXAM_INTRO:'Всё, теорию по второму модулю я выдала 🎓 Виктор уже знает и готовит экзамен — там нужно будет собрать LEFT JOIN, группировку и HAVING в одном запросе. Это ровно тот уровень, на котором начинаются реальные рабочие задачи.',
MOD2_EXAM_MAIL:'Ксения говорит, второй модуль ты закрыл. Проверим: задача из тех, что я обычно даю на собеседовании мидлам.',
MOD2_OUTRO:'Сдал 🎉 Скажу честно: когда мы тебя брали, я закладывала месяца три на то, что ты сейчас прошёл. Формально ты больше не джун на испытательном. Дальше рабочий режим: задачи будут приходить вперемешку от меня, ребят и Виктора — и никто уже не будет предупреждать, какая тема в них зашита.',
SUBJ_EXAM2:'Итоговый экзамен: Модуль «SQL для рабочих задач»',

MOD3_INTRO:'Раз уж ты теперь в рабочем режиме, скажу про то, о чём на курсах молчат. Запрос — это середина работы, а не вся она. В начале тебе приносят задачу, сформулированную человеческим языком, и половина ошибок случается там: посчитал безупречно, но не то, что просили. В конце из твоей цифры кто-то делает вывод — и вторая половина ошибок живёт здесь. Синтаксису я тебя научила, теперь про это.',
MOD3_DATA:'Ещё одна привычка, которая отличает аналитика от человека, умеющего писать SELECT: посмотреть на данные до того, как их считать. Дубли, пропуски, один и тот же город тремя способами — всё это не редкость, а норма. Посчитать по грязным данным быстро означает быстро получить неверную цифру и потом объяснять бухгалтерии, почему отчёт не сошёлся.',
MOD3_AB:'И про эксперименты. К тебе будут приходить с A/B-тестами и просить подтвердить, что новый вариант лучше. Почти всегда правильный ответ — «рано». Тест, остановленный в тот день, когда разница впервые понравилась, доказывает только то, что кто-то смотрел на него каждый день.',
MOD3_CHART:'И последнее. Рано или поздно твою цифру попросят показать, а не назвать, — и тут выяснится, что график врёт легче таблицы. У нас для этого есть ChartLab, иконка на рабочем столе. Правило там ровно одно: тип графика выбирают под вопрос, а не под данные. Линия говорит «смотри, как менялось», столбцы — «смотри, что больше», круг — «смотри, какая часть от целого». Поставишь не тот — человек прочитает не то.',
MOD3_OUTRO:'Вот, собственно, и вся моя программа 🙂 Дальше только практика: задачи будут идти вперемешку — где-то надо написать запрос, где-то сначала задать вопрос, где-то прочитать готовые цифры и не наврать с выводом, где-то собрать график. Если застрянешь — пиши, я рядом.',
SUBJ_CONCLUSION:'Нужен вывод по каналам',
SUBJ_DATAQUALITY:'Выгрузка перед отчётом',
SUBJ_ABTEST:'Результаты A/B-теста',
SUBJ_METRICS:'Запрос по метрикам',

MOD4_INTRO:'Помнишь ту выгрузку, где город был записан тремя способами? Вот она и вернулась. Бухгалтерия не сошлась с нашим отчётом по городам, я посмотрела — и там ровно это. Тогда мы с тобой только отметили проблему; сегодня научу её чинить, потому что переделывать выгрузку руками ты замучаешься.',
LESSON_CLEAN:'Главное, что надо понять: группировка сравнивает значения буквально. Для неё «Москва», «москва» и « Москва » — три разных города, и она честно сделает три группы. Лечится это тем, что значения приводят к единому виду прямо в запросе. LOWER() опускает регистр, UPPER() поднимает, TRIM() срезает пробелы по краям — и функции можно вкладывать друг в друга: LOWER(TRIM(city)). Дальше фокус: группировать можно не только по колонке, но и по функции от неё. GROUP BY LOWER(TRIM(city)) — и города наконец схлопываются в три.',
LESSON_CLEAN2:'И то же самое, но когда нужно не суммировать, а посчитать количество разных значений. COUNT(DISTINCT city) на грязных данных соврёт ровно так же, как и группировка: «Казань» и «КАЗАНЬ» он посчитает за два города. Функция ставится прямо внутрь: COUNT(DISTINCT LOWER(TRIM(city))). Запомни это как правило — DISTINCT без приведения к единому виду на сырых данных не имеет смысла.',
MOD4_OUTRO:'Теперь у тебя есть чем чинить самые частые дефекты. Оговорюсь честно: LOWER и TRIM спасают от регистра и пробелов, но не от «МСК» вместо «Москвы» — там нужен либо справочник соответствий, либо разговор с теми, кто эти данные заводит. Второе обычно полезнее.',

LESSON_LIMITS:'Важное предупреждение, прочитай один раз и держи в голове.\n\nЗапросы здесь исполняет учебный движок, написанный специально для этого тренажёра, — не PostgreSQL и не MySQL. Синтаксису он учит настоящему: WHERE, GROUP BY, JOIN, HAVING, подзапросы работают так же, как в боевой базе. Но у него есть границы, и лучше узнать о них здесь, чем на собеседовании.\n\nЧего он не умеет:\n• CASE WHEN, оконных функций, UNION, INSERT/UPDATE/DELETE — только чтение;\n• SELECT без FROM (SELECT 1 не выполнится);\n• арифметики слева в условии: WHERE amount / qty > 150 он не разберёт. Считай такое в SELECT;\n• из строковых функций есть только LOWER, UPPER и TRIM.\n\nВ чём он ведёт себя иначе, чем настоящая база:\n• сравнение текста здесь не различает регистр: WHERE city = \'москва\' найдёт и «Москва». В PostgreSQL так не будет — там это разные строки. А вот GROUP BY и DISTINCT регистр различают, как и везде: именно поэтому грязные данные приходится приводить к единому виду;\n• ORDER BY сортирует только по колонкам, которые есть в SELECT.\n\nЕсли что-то из этого списка тебе понадобилось — это хороший знак: значит, тренажёр ты уже перерос и пора открывать настоящую базу.',
  },
  en:{
INTRO_1:"Hi {name}! I'm Sarah, analytics team lead at DataCo. Let me be straight with you: for an analyst role we normally hire people with three years behind them, and you have two courses and zero hours of real work. But we're behind on several projects at once and badly short of hands, so we decided to take the risk. I'll handle your training myself — you'll learn on real tasks, not on slides. Shall we?",
LESSON_1:'First thing to learn: pulling only the rows you actually need out of a table. That is what WHERE is for. Here is your first task:',
LESSON_2:'Good! Now we count metrics across the whole table — that is what aggregate functions are for: SUM, COUNT, AVG, MIN, MAX. Start with SUM:',
LESSON_3:'A total over the whole table is only the beginning. The business almost always wants a breakdown: by channel, by segment, and so on. That is GROUP BY — it splits rows into groups by a column value and computes the aggregate inside each group.',
LESSON_4:'Sometimes the metric you need is not in the table at all — you compute it right in the query. ROI = revenue / spend, for instance. And ORDER BY ... LIMIT 1 pulls out the best result.',
LESSON_5:'Important one: in real databases the data almost never sits in a single table. So you need to join them — that is JOIN. It stitches rows of two tables together on a shared field, for example customer_id = id.',
INTRO_FINAL_EXAM:"That closes your basic training 🎓 Next is the exam. Bob, our CTO, will send it by email, and you will get no hints from me on that one. But I believe in you.",
INTRO_POST_EXAM:'Passed! You are officially no longer “the intern who helps out” — you are a junior analyst. From here the tasks get more varied: from colleagues, from other meetings. Ask me if anything is unclear.',
EXAM_MAIL_INTRO:'Sarah tells me it is time to test the basics in practice. No hints from my side — just the result.',
SUBJ_EXAM1:'Final exam: “SQL Basics” module',

MOD2_INTRO:"Let's talk. You are closing the basic tasks faster than I can invent them, and meanwhile we have a queue of requests where WHERE and GROUP BY alone are not enough. No reason to wait: module two starts now. It is about how to stop writing walls of OR and start asking data grown-up questions.",
LESSON_IN:"First, value lists. When you need rows matching several options at once, beginners write “channel = A OR channel = B OR channel = C”. It works, but it reads badly and the brackets are easy to get wrong. IN exists for exactly this: list the options in brackets, comma-separated, done. There is also NOT IN for the opposite.",
LESSON_BETWEEN:'Next, ranges. “amount >= 1000 AND amount <= 5000” can be written with one operator: BETWEEN 1000 AND 5000. Remember that both bounds are inclusive. This is a common source of mismatched reports — one analyst treats the bound as included, another does not.',
LESSON_LIKE:"Now text. Often you do not know the exact value, only a fragment: the path starts with /landing, the domain ends in .com, the subject line contains “refund”. LIKE is for that, with two wildcards: % is any number of any characters, _ is exactly one. “LIKE '/landing%'” is everything starting with /landing.",
LESSON_DISTINCT:'The trap almost everyone falls into. If every row in the table is an event, then COUNT(*) counts events, not people: one user with five visits gives five rows. To count distinct values you need DISTINCT — COUNT(DISTINCT user_id), for example. Confusing “visits” with “visitors” in a report is an expensive mistake.',
LESSON_COUNTGROUP:'COUNT works happily with GROUP BY: instead of a sum you get the number of rows in each group — tickets per agent, orders per customer, deals per rep. This is probably the single most common query in an analyst\'s life.',
LESSON_HAVING:'Now the key distinction, and they ask about it in every interview. WHERE filters rows BEFORE grouping. HAVING filters finished groups AFTER. So “show channels where total revenue is over a million” cannot be done with WHERE — at WHERE time the total does not exist yet.',
LESSON_LEFTJOIN:'Remember JOIN? It has an unpleasant property: it keeps only rows that found a match. A customer with no orders simply disappears from the result — and you never learn they exist. LEFT JOIN keeps every row of the left table and fills the missing right-hand fields with nothing — NULL. Then “WHERE orders.id IS NULL” gives you exactly the ones with no match. That is how you find churned customers, products with no sales and empty categories.',
LESSON_SUBQUERY:'Last one for this module — subqueries. Sometimes a filter needs a value that itself has to be computed: the average order, the latest date, a revenue threshold. You cannot type it in by hand — tomorrow the data changes and the report lies. Instead you put the query in brackets right inside the condition and it is computed on the fly.',
MOD2_EXAM_INTRO:'That is all the theory for module two 🎓 Bob already knows and is preparing the exam — you will need LEFT JOIN, grouping and HAVING in one query. That is exactly the level where real work starts.',
MOD2_EXAM_MAIL:'Sarah says you closed module two. Let us check: this is the kind of task I usually give mid-level candidates in interviews.',
MOD2_OUTRO:'Passed 🎉 Honestly: when we hired you, I budgeted about three months for what you just did. Formally you are no longer a junior on probation. From here it is working mode — tasks come mixed, from me, from the team and from Bob, and nobody will tell you in advance which topic is hiding inside.',
SUBJ_EXAM2:'Final exam: “SQL for real work” module',

MOD3_INTRO:'Now that you are in working mode, let me tell you what courses stay quiet about. The query is the middle of the job, not the whole of it. At the start someone brings you a task phrased in human language, and half of all mistakes happen right there: computed flawlessly, but not what was asked. At the end someone draws a conclusion from your number — and the other half of the mistakes live there. I taught you the syntax; now this.',
MOD3_DATA:'Another habit that separates an analyst from a person who can write SELECT: look at the data before you count it. Duplicates, gaps, the same city spelled three ways — none of that is rare, it is normal. Counting fast on dirty data means getting a wrong number fast, and then explaining to finance why the report does not reconcile.',
MOD3_AB:'And about experiments. People will come to you with A/B tests asking you to confirm the new variant is better. Almost always the right answer is “too early”. A test stopped on the day the difference first looked good proves only that somebody was watching it every day.',
MOD3_CHART:'Last thing. Sooner or later they will ask you to show your number rather than say it — and that is when you find out a chart lies more easily than a table. We have ChartLab for that, the icon on your desktop. One rule there: the chart type is chosen to fit the question, not the data. A line says “look how it changed”, bars say “look which is bigger”, a pie says “look what share of the whole”. Pick the wrong one and people read the wrong thing.',
MOD3_OUTRO:'And that is my whole programme 🙂 From here it is practice: tasks come mixed — sometimes write a query, sometimes ask the right question first, sometimes read finished numbers without overstating them, sometimes build a chart. If you get stuck, write to me, I am around.',
SUBJ_CONCLUSION:'Need a read on the channels',
SUBJ_DATAQUALITY:'Extract before the report',
SUBJ_ABTEST:'A/B test results',
SUBJ_METRICS:'Question about metrics',

MOD4_INTRO:'Remember that extract where the city was spelled three ways? It came back. Finance does not reconcile with our city report, I looked into it, and it is exactly that. Back then we only spotted the problem; today I will teach you to fix it, because fixing the extract by hand will drive you mad.',
LESSON_CLEAN:'The thing to understand: grouping compares values literally. To it, “New York”, “new york” and “ New York ” are three different cities, and it will honestly make three groups. The fix is to normalise the values right in the query. LOWER() drops the case, UPPER() raises it, TRIM() cuts the spaces off the ends — and the functions nest: LOWER(TRIM(city)). Then the trick: you can group not only by a column but by a function of it. GROUP BY LOWER(TRIM(city)) — and the cities finally collapse into three.',
LESSON_CLEAN2:'Same thing, but when you need a count of distinct values rather than a sum. COUNT(DISTINCT city) lies on dirty data exactly like grouping does: it counts “Chicago” and “CHICAGO” as two cities. The function goes straight inside: COUNT(DISTINCT LOWER(TRIM(city))). Take it as a rule — DISTINCT without normalising is meaningless on raw data.',
MOD4_OUTRO:'Now you have something to fix the most common defects with. One honest caveat: LOWER and TRIM save you from case and spaces, but not from “NYC” instead of “New York” — that needs either a lookup table or a conversation with whoever enters the data. The second is usually more useful.',

LESSON_LIMITS:"An important warning. Read it once and keep it in mind.\n\nQueries here run on a teaching engine written specifically for this simulator — not PostgreSQL, not MySQL. The syntax it teaches is real: WHERE, GROUP BY, JOIN, HAVING and subqueries behave the same as in a production database. But it has limits, and it is better to learn them here than in an interview.\n\nWhat it cannot do:\n• CASE WHEN, window functions, UNION, INSERT/UPDATE/DELETE — reading only;\n• SELECT without FROM (SELECT 1 will not run);\n• arithmetic on the left of a condition: WHERE amount / qty > 150 will not parse. Compute that in SELECT;\n• of the string functions, only LOWER, UPPER and TRIM exist.\n\nWhere it behaves differently from a real database:\n• text comparison here ignores case: WHERE city = 'new york' also finds “New York”. PostgreSQL will not do that — there they are different strings. GROUP BY and DISTINCT, however, do respect case, exactly as everywhere else: that is precisely why dirty data has to be normalised;\n• ORDER BY sorts only by columns present in SELECT.\n\nIf you find yourself needing something from this list, that is a good sign: you have outgrown the simulator and it is time to open a real database.",
  },
};
// Пропущенный ключ виден как ⟨КЛЮЧ⟩ — той же проверкой, что и в tr().
function narr(key){
  const p=NARRATIVE[locale]||NARRATIVE.ru;
  if(key in p) return p[key];
  return (key in NARRATIVE.ru)?NARRATIVE.ru[key]:'⟨'+key+'⟩';
}

// В ONBOARD лежат ключи, а не тексты: массив собирается один раз при загрузке файла,
// и строки в нём «застыли» бы на языке, выбранном в тот момент.
const ONBOARD=[
  {kind:'intro', from:LEAD, text:'INTRO_1'},
  {kind:'quest', gen:genFilterTask, from:LEAD, channel:'chat', lessonNote:'LESSON_1'},
  {kind:'quest', gen:genSumTask, from:LEAD, channel:'chat', lessonNote:'LESSON_2'},
  {kind:'quest', gen:genAvgTask, from:COL2, channel:'chat'},
  {kind:'quest', gen:genGroupTask, from:LEAD, channel:'chat', lessonNote:'LESSON_3'},
  {kind:'quest', gen:genRoiTask, from:LEAD, channel:'chat', lessonNote:'LESSON_4'},
  {kind:'quest', gen:genJoinTask, from:LEAD, channel:'chat', lessonNote:'LESSON_5'},
  {kind:'intro', from:LEAD, text:'INTRO_FINAL_EXAM'},
  {kind:'quest', gen:genFinalExamTask, from:CTO, channel:'mail', subject:'SUBJ_EXAM1', mailIntro:'EXAM_MAIL_INTRO'},
  {kind:'intro', from:LEAD, text:'INTRO_POST_EXAM'},

  // Module 2 — appended, so a career saved at the end of module 1 flows straight into it.
  {kind:'intro', from:LEAD, text:'MOD2_INTRO'},
  {kind:'quest', gen:genInTask, from:LEAD, channel:'chat', lessonNote:'LESSON_IN'},
  {kind:'quest', gen:genBetweenTask, from:COL1, channel:'chat', lessonNote:'LESSON_BETWEEN'},
  {kind:'quest', gen:genLikeTask, from:LEAD, channel:'chat', lessonNote:'LESSON_LIKE'},
  {kind:'quest', gen:genDistinctTask, from:LEAD, channel:'chat', lessonNote:'LESSON_DISTINCT'},
  {kind:'quest', gen:genCountGroupTask, from:COL2, channel:'chat', lessonNote:'LESSON_COUNTGROUP'},
  {kind:'quest', gen:genHavingTask, from:LEAD, channel:'chat', lessonNote:'LESSON_HAVING'},
  {kind:'quest', gen:genLeftJoinTask, from:LEAD, channel:'chat', lessonNote:'LESSON_LEFTJOIN'},
  {kind:'quest', gen:genSubqueryTask, from:LEAD, channel:'chat', lessonNote:'LESSON_SUBQUERY'},
  {kind:'intro', from:LEAD, text:'MOD2_EXAM_INTRO'},
  {kind:'quest', gen:genFinalExam2Task, from:CTO, channel:'mail', subject:'SUBJ_EXAM2', mailIntro:'MOD2_EXAM_MAIL'},
  {kind:'intro', from:LEAD, text:'MOD2_OUTRO'},
  // Дописано в конец, а не вставлено в середину, сознательно: `unlockAt` у разделов
  // справочника и `onboardIdx` в уже существующих сохранениях — это индексы в этом самом
  // массиве. Вставка в середину сдвинула бы и то, и другое.
  {kind:'intro', from:LEAD, text:'MOD3_INTRO'},
  {kind:'quest', gen:genClarifyTask, from:COL1, channel:'chat'},
  {kind:'quest', gen:genConclusionTask, from:CTO, channel:'mail', subject:'SUBJ_CONCLUSION'},
  {kind:'quest', gen:genDataQualityTask, from:CTO, channel:'mail', subject:'SUBJ_DATAQUALITY', mailIntro:'MOD3_DATA'},
  {kind:'quest', gen:genAbTestTask, from:COL1, channel:'mail', subject:'SUBJ_ABTEST', mailIntro:'MOD3_AB'},
  {kind:'quest', gen:genDashboardTask, from:LEAD, channel:'chat'},
  {kind:'quest', gen:genChartTask, from:LEAD, channel:'chat', lessonNote:'MOD3_CHART'},
  {kind:'intro', from:LEAD, text:'MOD3_OUTRO'},
  // Модуль 4 — тоже в конец, по тем же двум причинам (см. HANDOFF): `onboardIdx`
  // сохранений и `unlockAt` разделов справочника считаются по индексам этого массива.
  {kind:'intro', from:LEAD, text:'MOD4_INTRO'},
  {kind:'quest', gen:genDirtyCityTask, from:LEAD, channel:'chat', lessonNote:'LESSON_CLEAN'},
  {kind:'quest', gen:genDirtyCountTask, from:LEAD, channel:'chat', lessonNote:'LESSON_CLEAN2'},
  {kind:'intro', from:LEAD, text:'MOD4_OUTRO'},
];
let onboardIdx=0;
