"use strict";
/* ============ task types ============ */
// До сих пор «задача» означала ровно одно: написать SQL-запрос и сдать его результат.
// Это предположение было размазано по коду — проверка ответа, разбор ошибки, ревью стиля,
// запись отчёта и подпись кнопки «Открыть в QueryBench» лежали каждая в своём файле.
// Реестр собирает всё, что зависит от вида задачи, в одно место: чтобы добавить новый вид,
// нужно дописать сюда запись, а не обходить пять файлов заново.
//
// Загружается последним из содержательных файлов намеренно: значения ссылаются на функции
// напрямую, а не через обёртки, поэтому к моменту создания объекта они должны существовать.
// `app` — в каком окне задача решается. Пока все виды жили в QueryBench, поля не было:
// оно имело бы одно-единственное значение. Со ChartLab значений стало два, и оно появилось.
// `collect` возвращает ответ игрока или null, если сдавать ещё нечего, — благодаря ему
// общая машинка сдачи не знает ни про SQL-редактор, ни про кнопки выбора, ни про оси графика.
// `review` и `report` необязательны: замечание по стилю и строка в FileDock есть не у всех.
const TASK_TYPES={
  sql:{
    app:'qb',
    get openLabel(){ return tr('open.qb'); },
    render:renderSqlWorkspace,                             // тело задачи внутри QueryBench
    collect:()=> benchCanSubmit() ? {sql:$('sql-input').value, columns:benchOutput.columns, rows:benchOutput.rows} : null,
    check:(q,a)=> validateBySpec(q.answerSpec, a.rows),
    diagnose:(q,a)=> diagnoseAnswer(q.answerSpec, a.rows),
    review:(q,a)=> { const n=styleReview(a.sql, q); return n?tr('style.intro', {title:q.title, note:n}):null; },
    report:(q,a)=> addReport(q, a.sql, a.columns, a.rows), // что уедет в FileDock
  },
  // Всё, что решается выбором из вариантов: уточнение требования, вывод из данных, разбор
  // A/B-теста, поиск проблем в выгрузке, состав дашборда. Механика у них одна — различаются
  // тексты и то, один вариант верен или несколько (`q.multi`). Логика типа лежит рядом
  // с его рабочим местом, в 91-workspace-choice.js.
  choice:{
    app:'qb',
    get openLabel(){ return tr('open.task'); },
    render:renderChoiceWorkspace,
    collect:collectChoiceAnswer,
    check:checkChoiceAnswer,
    diagnose:diagnoseChoiceAnswer,
    review:reviewChoiceAnswer,
  },
  // Единственный вид с собственным окном: у графика свои органы управления и предпросмотр.
  chart:{
    app:'chart',
    get openLabel(){ return tr('open.chart'); },
    render:renderChartWorkspace,
    collect:collectChartAnswer,
    check:checkChartAnswer,
    diagnose:diagnoseChartAnswer,
    review:(q)=> q.reviewNote,
  },
};
// Квесты из сохранений, сделанных до появления типов, приходят без поля type.
function taskType(q){ return TASK_TYPES[(q&&q.type)||'sql'] || TASK_TYPES.sql; }
