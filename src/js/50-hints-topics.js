"use strict";
/* ============ progressive hints ============ */
// The generator's own `hint` is the finished query — showing it is just solving the task for
// the player. Two cheaper steps come first: what to think about, then the shape of the query.
// Keyed by quest.key so the generators stay untouched.
const HINT_PACKS={
  ru:{
  filter:{
    concept:'Нужно оставить только строки с определённым значением в колонке. За отбор строк отвечает WHERE, а текстовое значение пишется в одинарных кавычках.',
    skeleton:"SELECT * FROM campaigns WHERE <колонка> = '<значение>';",
  },
  sum:{
    concept:'Итог по всей таблице считают агрегатные функции. Здесь нужна сумма по колонке с деньгами — группировка не нужна, таблица берётся целиком.',
    skeleton:'SELECT SUM(<колонка>) AS total FROM orders;',
  },
  avg:{
    concept:'Среднее — такая же агрегатная функция, как сумма, только AVG. Считается по всей таблице сразу.',
    skeleton:'SELECT AVG(<колонка>) AS avg_time FROM support_tickets;',
  },
  group:{
    concept:'Нужна не одна общая сумма, а своя сумма внутри каждого канала. Значит, строки надо разбить на группы по колонке channel и посчитать агрегат в каждой группе.',
    skeleton:'SELECT channel, SUM(<колонка>) AS total FROM campaigns GROUP BY <колонка>;',
  },
  roi:{
    concept:'Готовой колонки с ROI в таблице нет — её считают прямо в SELECT делением одной колонки на другую. Чтобы достать лучший результат, отсортируй по этой величине по убыванию и возьми одну строку.',
    skeleton:'SELECT channel, <колонка>/<колонка> AS roi FROM campaigns ORDER BY roi DESC LIMIT 1;',
  },
  conv:{
    concept:'Конверсия — это тоже вычисляемая колонка: делим одно на другое и умножаем на 100. Дальше сортировка по убыванию и одна строка.',
    skeleton:'SELECT page, <колонка>/<колонка>*100 AS conv_rate FROM landing_pages ORDER BY conv_rate DESC LIMIT 1;',
  },
  join:{
    concept:'Сумма лежит в orders, а сегмент — в customers. Сначала склей таблицы по общему полю через JOIN ... ON, и только потом группируй по сегменту.',
    skeleton:'SELECT customers.segment, SUM(orders.amount) AS total FROM orders JOIN customers ON <поле> = <поле> GROUP BY <колонка>;',
  },
  finalexam:{
    concept:'Здесь всё сразу: склеить две таблицы, посчитать сумму по каждому сегменту, отсортировать по убыванию и оставить только верхнюю строку.',
    skeleton:'SELECT customers.segment, SUM(orders.amount) AS total FROM orders JOIN customers ON <поле> = <поле> GROUP BY <колонка> ORDER BY total DESC LIMIT 1;',
  },
  in:{
    concept:'Отбор сразу по нескольким значениям одной колонки. Можно через OR, но есть оператор, который принимает список значений в скобках.',
    skeleton:"SELECT name FROM campaigns WHERE channel IN ('<значение>', '<значение>');",
  },
  between:{
    concept:'Диапазон «от и до включительно» задаётся одним оператором вместо пары условий с >= и <=.',
    skeleton:'SELECT customer FROM orders WHERE amount BETWEEN <от> AND <до>;',
  },
  like:{
    concept:'Точных значений ты не знаешь — известно только начало строки. Для поиска по образцу есть LIKE, а «любое продолжение» обозначается символом %.',
    skeleton:"SELECT url FROM pages WHERE url LIKE '<начало>%';",
  },
  distinct:{
    concept:'Осторожно: COUNT(*) посчитает визиты, а не людей — один пользователь встречается в таблице несколько раз. Нужно посчитать именно различные значения user_id.',
    skeleton:'SELECT COUNT(DISTINCT <колонка>) AS users FROM events;',
  },
  countgroup:{
    concept:'Нужно количество строк в каждой группе, а не сумма. То есть та же группировка, что и обычно, только агрегат — COUNT.',
    skeleton:'SELECT agent, COUNT(*) AS tickets FROM support_tickets GROUP BY <колонка>;',
  },
  having:{
    concept:'Фильтровать надо не отдельные строки, а уже посчитанные суммы. WHERE отрабатывает до группировки, поэтому суммы на его этапе ещё не существует — нужен фильтр, который применяется после GROUP BY.',
    skeleton:'SELECT channel, SUM(revenue) AS total FROM campaigns GROUP BY channel HAVING total > <порог>;',
  },
  leftjoin:{
    concept:'Обычный JOIN выкинет клиентов без заказов — а именно они и нужны. Возьми соединение, которое сохраняет все строки левой таблицы, и найди те, где поля правой оказались пустыми.',
    skeleton:'SELECT customers.name FROM customers LEFT JOIN orders ON <поле> = <поле> WHERE orders.id IS NULL;',
  },
  subquery:{
    concept:'Средний чек заранее неизвестен, и вписывать его числом нельзя. Запрос, который его считает, можно поставить прямо в условие — в скобках.',
    skeleton:'SELECT customer FROM orders WHERE amount > (SELECT AVG(<колонка>) FROM orders);',
  },
  dirtycity:{
    concept:'Группировка сравнивает значения буквально: «Москва», «москва» и « Москва » для неё три разных города. Значит, перед группировкой их надо привести к одному виду — убрать регистр и лишние пробелы. Группировать можно не только по колонке, но и по функции от неё.',
    skeleton:'SELECT LOWER(TRIM(<колонка>)) AS city, SUM(<колонка>) AS total FROM orders GROUP BY LOWER(TRIM(<колонка>));',
  },
  dirtycount:{
    concept:'Нужны различные значения, но сначала — приведённые к единому виду: иначе DISTINCT честно посчитает «Казань» и «КАЗАНЬ» за два. Функцию можно поставить прямо внутрь COUNT(DISTINCT ...).',
    skeleton:'SELECT COUNT(DISTINCT LOWER(TRIM(<колонка>))) AS cities FROM clients;',
  },
  finalexam2:{
    concept:'Менеджеры без сделок обязаны попасть в результат с нулём — значит, соединение должно сохранять все строки левой таблицы. Считать нужно количество, а отсекать — уже посчитанные группы.',
    skeleton:'SELECT managers.name, COUNT(deals.id) AS deals_count FROM managers LEFT JOIN deals ON <поле> = <поле> GROUP BY <колонка> HAVING deals_count < <порог> ORDER BY deals_count ASC;',
  },
  },
  en:{
    filter:{
      concept:'You need to keep only the rows with a particular value in a column. WHERE is what picks rows, and a text value goes in single quotes.',
      skeleton:"SELECT * FROM campaigns WHERE <column> = '<value>';",
    },
    sum:{
      concept:'A total across the whole table is what aggregate functions are for. Here you need the sum of a money column — no grouping, the table is taken as a whole.',
      skeleton:'SELECT SUM(<column>) AS total FROM orders;',
    },
    avg:{
      concept:'An average is the same kind of aggregate as a sum, only AVG. Computed across the whole table at once.',
      skeleton:'SELECT AVG(<column>) AS avg_time FROM support_tickets;',
    },
    group:{
      concept:'You need a separate total inside each channel, not one overall total. So the rows have to be split into groups by the channel column and the aggregate computed within each group.',
      skeleton:'SELECT channel, SUM(<column>) AS total FROM campaigns GROUP BY <column>;',
    },
    roi:{
      concept:'There is no ROI column in the table — you compute it right in SELECT by dividing one column by another. To get the best result, sort by that value descending and take one row.',
      skeleton:'SELECT channel, <column>/<column> AS roi FROM campaigns ORDER BY roi DESC LIMIT 1;',
    },
    conv:{
      concept:'Conversion is a computed column too: divide one by the other and multiply by 100. Then sort descending and take one row.',
      skeleton:'SELECT page, <column>/<column>*100 AS conv_rate FROM landing_pages ORDER BY conv_rate DESC LIMIT 1;',
    },
    join:{
      concept:'The amount lives in orders and the segment lives in customers. First stitch the tables together on the shared field with JOIN ... ON, and only then group by segment.',
      skeleton:'SELECT customers.segment, SUM(orders.amount) AS total FROM orders JOIN customers ON <field> = <field> GROUP BY <column>;',
    },
    finalexam:{
      concept:'Everything at once here: join two tables, compute the total per segment, sort descending and keep only the top row.',
      skeleton:'SELECT customers.segment, SUM(orders.amount) AS total FROM orders JOIN customers ON <field> = <field> GROUP BY <column> ORDER BY total DESC LIMIT 1;',
    },
    in:{
      concept:'Picking rows on several values of one column at once. You could do it with OR, but there is an operator that takes a list of values in brackets.',
      skeleton:"SELECT name FROM campaigns WHERE channel IN ('<value>', '<value>');",
    },
    between:{
      concept:'A “from and to, inclusive” range is written with one operator instead of a pair of conditions with >= and <=.',
      skeleton:'SELECT customer FROM orders WHERE amount BETWEEN <from> AND <to>;',
    },
    like:{
      concept:'You do not know the exact values — only how the string starts. LIKE matches patterns, and % stands for “anything after that”.',
      skeleton:"SELECT url FROM pages WHERE url LIKE '<start>%';",
    },
    distinct:{
      concept:'Careful: COUNT(*) counts visits, not people — the same user appears in the table several times. You need to count distinct values of user_id.',
      skeleton:'SELECT COUNT(DISTINCT <column>) AS users FROM events;',
    },
    countgroup:{
      concept:'You need the number of rows in each group, not a sum. Same grouping as usual, only the aggregate is COUNT.',
      skeleton:'SELECT agent, COUNT(*) AS tickets FROM support_tickets GROUP BY <column>;',
    },
    having:{
      concept:'What you filter is not individual rows but totals that have already been computed. WHERE runs before grouping, so at that point the total does not exist yet — you need the filter that applies after GROUP BY.',
      skeleton:'SELECT channel, SUM(revenue) AS total FROM campaigns GROUP BY channel HAVING total > <threshold>;',
    },
    leftjoin:{
      concept:'A plain JOIN throws away customers with no orders — and those are exactly the ones you want. Take the join that keeps every row of the left table, then find the ones where the right-hand fields came back empty.',
      skeleton:'SELECT customers.name FROM customers LEFT JOIN orders ON <field> = <field> WHERE orders.id IS NULL;',
    },
    subquery:{
      concept:'The average order is not known in advance and cannot be typed in as a number. The query that computes it can go straight into the condition, in brackets.',
      skeleton:'SELECT customer FROM orders WHERE amount > (SELECT AVG(<column>) FROM orders);',
    },
    dirtycity:{
      concept:'Grouping compares values literally: “New York”, “new york” and “ New York ” are three different cities to it. So before grouping they have to be normalised — case dropped, stray spaces cut. And you can group not only by a column but by a function of it.',
      skeleton:'SELECT LOWER(TRIM(<column>)) AS city, SUM(<column>) AS total FROM orders GROUP BY LOWER(TRIM(<column>));',
    },
    dirtycount:{
      concept:'You need distinct values, but normalised first: otherwise DISTINCT will honestly count “Chicago” and “CHICAGO” as two. The function goes straight inside COUNT(DISTINCT ...).',
      skeleton:'SELECT COUNT(DISTINCT LOWER(TRIM(<column>))) AS cities FROM clients;',
    },
    finalexam2:{
      concept:'Reps with no deals must appear in the result with a zero — so the join has to keep every row of the left table. You are counting rows, and cutting off groups that have already been counted.',
      skeleton:'SELECT managers.name, COUNT(deals.id) AS deals_count FROM managers LEFT JOIN deals ON <field> = <field> GROUP BY <column> HAVING deals_count < <threshold> ORDER BY deals_count ASC;',
    },
  },
};
function hintSteps(){ return HINT_PACKS[locale]||HINT_PACKS.ru; }
// step 1 is free — it only points at the idea; the two that actually shorten the work cost money
const HINT_PRICES=[0, 30, 90];
function hintPrice(q, level){
  const base=HINT_PRICES[level-1]||0;
  return q.isBoss?base*2:base;   // exams are meant to be answered on your own
}
function hintTextFor(q, level){
  const steps=hintSteps()[q.key]||{};
  if(level===1) return steps.concept||tr('hint.missing');
  if(level===2) return steps.skeleton||q.hint;
  return q.hint;
}

function recordTopicResult(q){
  if(!q.key) return;
  if(!state.topicStats[q.key]) state.topicStats[q.key]={solved:0, attempts:0};
  const st=state.topicStats[q.key];
  st.solved++;
  st.attempts+=Math.max(1, q.attempts||1);
}
// Endless mode used to pick uniformly at random, ignoring the fact that the game already
// knows which topics cost the player the most attempts. Weight = average attempts on that
// topic (never below 1), so weak spots come back more often but nothing disappears.
function pickWeightedGen(gens){
  const weights=gens.map(g=>{
    const key=GEN_KEY.get(g);
    const st=key?state.topicStats[key]:null;
    if(!st || !st.solved) return 3;                       // never practised — favour it
    return Math.max(1, Math.min(5, st.attempts/st.solved));
  });
  const total=weights.reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(let i=0;i<gens.length;i++){ r-=weights[i]; if(r<=0) return gens[i]; }
  return gens[gens.length-1];
}

